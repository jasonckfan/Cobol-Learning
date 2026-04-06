# Lesson 4-2：計息邏輯實現

## 學習目標

- 理解銀行計息的基本原理
- 掌握不同計息方式的實現
- 能夠分析計息相關需求

---

## 計息基本概念

### 計息公式

```
利息 = 本金 × 利率 × 天數 / 計息基準
```

### 計息基準

| 基準 | 說明 | 使用地區 |
|------|------|----------|
| ACT/360 | 實際天數 / 360 | 歐洲、香港 |
| ACT/365 | 實際天數 / 365 | 英國、部分亞洲 |
| ACT/ACT | 實際天數 / 實際天數 | 國際債券 |
| 30/360 | 每月30天 / 每年360天 | 美國債券 |

---

## 利率類型

### 固定利率 vs 浮動利率

| 類型 | 說明 | 範例 |
|------|------|------|
| 固定利率 | 存續期間利率不變 | 定存 2.5% |
| 浮動利率 | 隨基準利率調整 | HIBOR + 1% |

### 利率方向

| 類型 | 說明 | 應用 |
|------|------|------|
| 存款利率 | 給客戶的利息 | 存款帳戶計息 |
| 放款利率 | 向客戶收取的利息 | 貸款、透支計息 |
| 罰息利率 | 逾期罰款利率 | 逾期貸款 |

---

## 計息方式

### 1. 逐日計息

每日計算利息，月底入帳。

```cobol
      * 每日利息 = 餘額 × 利率 / 360（或365）
       COMPUTE WS-DAILY-INT = ACCT-BALANCE * INT-RATE / 360.
       
      * 累計每日利息
       ADD WS-DAILY-INT TO WS-ACCUM-INT.
```

### 2. 餘額段計息

不同餘額區間適用不同利率。

```
餘額區間          利率
0 - 10,000       0.1%
10,001 - 100,000 0.5%
100,001 以上      1.0%
```

```cobol
       EVALUATE TRUE
           WHEN ACCT-BALANCE <= 10000
               MOVE 0.001 TO WS-APPLY-RATE
           WHEN ACCT-BALANCE <= 100000
               COMPUTE WS-APPLY-RATE = 
                   (10000 * 0.001 + 
                    (ACCT-BALANCE - 10000) * 0.005) 
                    / ACCT-BALANCE
           WHEN OTHER
               COMPUTE WS-APPLY-RATE = 
                   (10000 * 0.001 + 
                    90000 * 0.005 + 
                    (ACCT-BALANCE - 100000) * 0.01) 
                    / ACCT-BALANCE
       END-EVALUATE.
```

### 3. 期初/期末餘額計息

| 方式 | 說明 | 適用情境 |
|------|------|----------|
| 期初餘額 | 以期初餘額計算整期利息 | 定存 |
| 期末餘額 | 以期末餘額計算 | 簡易計息 |
| 平均餘額 | 以期內平均餘額計算 | 活期存款 |

---

## 程式實現範例

### 日計息批次

```cobol
       IDENTIFICATION DIVISION.
       PROGRAM-ID. DAILYINT.

       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT ACCT-FILE ASSIGN TO ACCTDATA
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-ACCT-STATUS.
           SELECT INT-FILE ASSIGN TO INTDATA
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-INT-STATUS.

       DATA DIVISION.
       FILE SECTION.
       FD ACCT-FILE.
       01 ACCT-RECORD.
          05 ACCT-NO           PIC X(16).
          05 ACCT-TYPE         PIC XX.
          05 ACCT-BALANCE      PIC S9(11)V99 COMP-3.
          05 INT-RATE          PIC V9(4) COMP-3.
          05 ACCUM-INT         PIC S9(9)V99 COMP-3.
          05 LAST-INT-DATE     PIC 9(8).

       FD INT-FILE.
       01 INT-RECORD.
          05 INT-ACCT-NO       PIC X(16).
          05 INT-AMT           PIC S9(9)V99.
          05 INT-DATE          PIC 9(8).

       WORKING-STORAGE SECTION.
       01 WS-STATUS.
          05 WS-ACCT-STATUS    PIC XX.
          05 WS-INT-STATUS     PIC XX.

       01 WS-FLAGS.
          05 WS-EOF-FLAG       PIC X VALUE 'N'.
             88 EOF-REACHED    VALUE 'Y'.

       01 WS-WORK-FIELDS.
          05 WS-DAILY-INT      PIC S9(9)V99 COMP-3.
          05 WS-TOTAL-INT      PIC S9(13)V99 COMP-3 VALUE 0.
          05 WS-PROC-CNT       PIC 9(8) VALUE 0.
          05 WS-TODAY          PIC 9(8).

       PROCEDURE DIVISION.
       0000-MAIN.
           PERFORM 1000-INIT
           PERFORM 2000-PROCESS UNTIL EOF-REACHED
           PERFORM 3000-SUMMARY
           PERFORM 9000-TERM
           STOP RUN.

       1000-INIT.
           MOVE FUNCTION CURRENT-DATE(1:8) TO WS-TODAY
           OPEN INPUT ACCT-FILE
           OPEN OUTPUT INT-FILE
           PERFORM 1100-READ-FIRST.

       1100-READ-FIRST.
           READ ACCT-FILE
               AT END
                   SET EOF-REACHED TO TRUE
               NOT AT END
                   ADD 1 TO WS-PROC-CNT
           END-READ.

       2000-PROCESS.
           PERFORM 2100-CALC-DAILY-INT
           PERFORM 2200-UPDATE-ACCT
           PERFORM 1100-READ-FIRST.

       2100-CALC-DAILY-INT.
      *    計算每日利息 = 餘額 × 利率 / 365
           IF ACCT-BALANCE > 0
               COMPUTE WS-DAILY-INT ROUNDED = 
                   ACCT-BALANCE * INT-RATE / 365
           ELSE
               MOVE 0 TO WS-DAILY-INT
           END-IF
           
      *    累計利息
           ADD WS-DAILY-INT TO ACCUM-INT
           ADD WS-DAILY-INT TO WS-TOTAL-INT.

       2200-UPDATE-ACCT.
      *    月底入帳（假設每月最後一天）
           IF WS-TODAY(7:2) = FUNCTION 
              MAX-OF-DATE(WS-TODAY(1:6))
               PERFORM 2210-POST-INTEREST
           END-IF.

       2210-POST-INTEREST.
      *    產生利息入帳記錄
           MOVE ACCT-NO TO INT-ACCT-NO
           MOVE ACCUM-INT TO INT-AMT
           MOVE WS-TODAY TO INT-DATE
           WRITE INT-RECORD
           
      *    重置累計利息
           MOVE 0 TO ACCUM-INT
           MOVE WS-TODAY TO LAST-INT-DATE.

       3000-SUMMARY.
           DISPLAY '========================'
           DISPLAY '處理帳戶數: ' WS-PROC-CNT
           DISPLAY '總利息金額: ' WS-TOTAL-INT
           DISPLAY '========================'.

       9000-TERM.
           CLOSE ACCT-FILE
           CLOSE INT-FILE.
```

---

## 特殊計息情境

### 透支計息

當餘額為負時，使用透支利率。

```cobol
       IF ACCT-BALANCE < 0
           COMPUTE WS-OD-RATE = INT-RATE + WS-OD-PREMIUM
           COMPUTE WS-DAILY-INT = 
               ABS(ACCT-BALANCE) * WS-OD-RATE / 365 * -1
       ELSE
           COMPUTE WS-DAILY-INT = 
               ACCT-BALANCE * INT-RATE / 365
       END-IF.
```

### 逾期罰息

```cobol
       IF ACCT-STATUS = 'OD'               *> Overdue
           COMPUTE WS-PENALTY-RATE = 
               BASE-RATE + PENALTY-PREMIUM
           COMPUTE WS-PENALTY-INT = 
               OVERDUE-PRINCIPAL * WS-PENALTY-RATE / 365
       END-IF.
```

### 複利計息

```cobol
      * 本息 = 本金 × (1 + 利率)^期數
       COMPUTE WS-COMPOUND-FACTOR = 
           (1 + INT-RATE) ** WS-PERIODS
       COMPUTE WS-MATURITY-AMT = 
           PRINCIPAL * WS-COMPOUND-FACTOR
       COMPUTE WS-TOTAL-INT = 
           WS-MATURITY-AMT - PRINCIPAL.
```

---

## BA 實務應用

### 需求確認重點

| 問題 | 目的 |
|------|------|
| 「計息基準是什麼？」 | 確認公式分母 |
| 「利率是固定還是浮動？」 | 確認利率來源 |
| 「是否分段計息？」 | 確認計息邏輯複雜度 |
| 「何時入帳？」 | 確認入帳時點 |
| 「透支如何處理？」 | 確認負餘額計息規則 |

### 測試案例設計

```
測試案例：
1. 正常計息：餘額 > 0，利率正常
2. 零餘額：餘額 = 0，利息 = 0
3. 負餘額（透支）：驗證透支利率
4. 月底入帳：驗證累計利息入帳
5. 閏年：2/29 計息天數計算
6. 跨月：月底到月初的連續計息
```

---

## 練習題

### 題目 1
假設使用 ACT/365 基準，帳戶餘額 1,000,000，利率 2.5%，計算 30 天的利息。

### 題目 2
設計一段程式碼，實現分段計息：
- 0 - 50,000：0.5%
- 50,001 - 500,000：1.0%
- 500,001 以上：1.5%

### 題目 3
說明單利與複利的差異，以及各自適用的銀行產品。

---

## 重點回顧

| 概念 | 公式 |
|------|------|
| 基本計息 | 本金 × 利率 × 天數 / 基準 |
| 計息基準 | ACT/360, ACT/365, 30/360 |
| 逐日計息 | 每日計算，累計入帳 |
| 分段計息 | 不同餘額區間用不同利率 |
| 透支計息 | 負餘額使用較高利率 |

---

## 延伸閱讀

- [Lesson 4-3：日終批次處理流程](lesson-4-3-eod-process.md)
- [Lesson 4-4：對帳與報表生成](lesson-4-4-reconciliation.md)
