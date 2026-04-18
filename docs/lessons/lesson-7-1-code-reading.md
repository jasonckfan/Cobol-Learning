# Lesson 7-1: 真實程式碼解讀練習

> 透過實際案例學習閱讀 COBOL 程式

---

## 學習目標

- 掌握系統性閱讀 COBOL 程式的方法
- 能夠追蹤程式邏輯與資料流向
- 理解複雜業務邏輯的實現方式
- 建立程式閱讀的實務能力

---

## 一、程式閱讀方法論

### 1.1 系統性閱讀步驟

```
┌─────────────────────────────────────────────────────────────────┐
│              COBOL 程式閱讀五步法                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: 識別階段 (30 秒)                                       │
│  ───────────────────────                                        │
│  • 看 IDENTIFICATION：程式名稱、用途                            │
│  • 看 AUTHOR/DATE：了解程式年代                                 │
│  • 初步判斷：批次/線上、主檔/交易                               │
│                                                                 │
│  Step 2: 盤點資源 (2 分鐘)                                      │
│  ───────────────────────                                        │
│  • 看 ENVIRONMENT：使用哪些檔案                                 │
│  • 看 FILE-CONTROL：檔案類型、組織方式                          │
│  • 記錄：輸入檔、輸出檔、工作檔                                 │
│                                                                 │
│  Step 3: 理解資料 (3 分鐘)                                      │
│  ───────────────────────                                        │
│  • 看 FILE SECTION：記錄結構                                    │
│  • 看 WORKING-STORAGE：變數、旗標、常數                         │
│  • 標記：關鍵欄位、條件名稱 (88)                                │
│                                                                 │
│  Step 4: 追蹤流程 (5 分鐘)                                      │
│  ───────────────────────                                        │
│  • 看 PROCEDURE DIVISION 主流程                                 │
│  • 追蹤 PERFORM 呼叫順序                                        │
│  • 標記：主要處理段落、條件分支                                 │
│                                                                 │
│  Step 5: 深入細節 (依需求)                                      │
│  ───────────────────────                                        │
│  • 針對感興趣的功能深入閱讀                                     │
│  • 追蹤特定欄位的處理邏輯                                       │
│  • 記錄：業務規則、計算公式                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、案例一：利息計算程式

### 2.1 程式碼

```cobol
       IDENTIFICATION DIVISION.
       PROGRAM-ID. INTCLCL.
       AUTHOR. MARY CHEN.
       DATE-WRITTEN. 2015-03-15.
       DATE-COMPILED. 2024-01-10.
       REMARKS. DAILY INTEREST CALCULATION FOR SAVINGS ACCOUNTS.
       
       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT ACCT-FILE
               ASSIGN TO ACCTFILE
               ORGANIZATION IS INDEXED
               ACCESS MODE IS SEQUENTIAL
               RECORD KEY IS ACCT-NUMBER
               FILE STATUS IS WS-ACCT-STATUS.
           
           SELECT RPT-FILE
               ASSIGN TO RPTFILE
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-RPT-STATUS.
       
       DATA DIVISION.
       FILE SECTION.
       FD  ACCT-FILE.
       01  ACCT-RECORD.
           05  ACCT-NUMBER       PIC X(12).
           05  ACCT-TYPE         PIC X.
               88  SAVINGS-ACCT  VALUE 'S'.
               88  CHECKING-ACCT VALUE 'C'.
           05  ACCT-BALANCE      PIC S9(11)V99 COMP-3.
           05  ACCT-INT-RATE     PIC 9V9(4) COMP-3.
           05  ACCT-OPEN-DATE    PIC 9(8).
           05  ACCT-LAST-INT-DT  PIC 9(8).
           05  ACCT-INT-ACCrued  PIC S9(9)V99 COMP-3.
           05  FILLER            PIC X(20).
       
       FD  RPT-FILE.
       01  RPT-RECORD          PIC X(80).
       
       WORKING-STORAGE SECTION.
       01  WS-FILE-STATUS.
           05  WS-ACCT-STATUS    PIC X(2).
           05  WS-RPT-STATUS     PIC X(2).
       
       01  WS-COUNTERS.
           05  WS-READ-CNT       PIC 9(7) VALUE 0.
           05  WS-PROC-CNT       PIC 9(7) VALUE 0.
           05  WS-SKIP-CNT       PIC 9(7) VALUE 0.
           05  WS-ERR-CNT        PIC 9(7) VALUE 0.
       
       01  WS-CALC-WORK.
           05  WS-DAILY-INT      PIC S9(9)V99 COMP-3.
           05  WS-DAYS-DIFF      PIC 9(5) COMP.
           05  WS-CURRENT-DATE   PIC 9(8).
           05  WS-BASE-AMT       PIC S9(11)V99 COMP-3.
       
       01  WS-REPORT-LINE.
           05  FILLER            PIC X(5) VALUE SPACES.
           05  RPT-ACCT-NUM      PIC X(12).
           05  FILLER            PIC X(3) VALUE SPACES.
           05  RPT-OLD-BAL       PIC ZZZ,ZZZ,ZZ9.99.
           05  FILLER            PIC X(3) VALUE SPACES.
           05  RPT-INT-AMT       PIC ZZZ,ZZZ,ZZ9.99.
           05  FILLER            PIC X(3) VALUE SPACES.
           05  RPT-NEW-BAL       PIC ZZZ,ZZZ,ZZ9.99.
           05  FILLER            PIC X(10) VALUE SPACES.
       
       PROCEDURE DIVISION.
       0000-MAIN.
           PERFORM 1000-INIT
           PERFORM 2000-PROCESS
           PERFORM 3000-TERM
           STOP RUN.
       
       1000-INIT.
           OPEN INPUT ACCT-FILE
           OPEN OUTPUT RPT-FILE
           ACCEPT WS-CURRENT-DATE FROM DATE YYYYMMDD
           WRITE RPT-RECORD FROM WS-HEADER-1
           WRITE RPT-RECORD FROM WS-HEADER-2.
       
       2000-PROCESS.
           READ ACCT-FILE
               AT END
                   EXIT PARAGRAPH
           END-READ
           
           ADD 1 TO WS-READ-CNT
           
           IF NOT SAVINGS-ACCT
               ADD 1 TO WS-SKIP-CNT
               PERFORM 2000-PROCESS
               EXIT PARAGRAPH
           END-IF
           
           IF ACCT-BALANCE <= 0
               ADD 1 TO WS-SKIP-CNT
               PERFORM 2000-PROCESS
               EXIT PARAGRAPH
           END-IF
           
           PERFORM 2100-CALC-INTEREST
           PERFORM 2200-UPDATE-RECORD
           PERFORM 2300-WRITE-REPORT
           
           ADD 1 TO WS-PROC-CNT
           PERFORM 2000-PROCESS.
       
       2100-CALC-INTEREST.
           COMPUTE WS-DAYS-DIFF = 
               FUNCTION INTEGER-OF-DATE(WS-CURRENT-DATE) -
               FUNCTION INTEGER-OF-DATE(ACCT-LAST-INT-DT).
           
           IF WS-DAYS-DIFF <= 0
               MOVE 0 TO WS-DAILY-INT
               EXIT PARAGRAPH
           END-IF.
           
           COMPUTE WS-BASE-AMT = ACCT-BALANCE + ACCT-INT-ACCrued.
           
           COMPUTE WS-DAILY-INT = 
               WS-BASE-AMT * ACCT-INT-RATE * WS-DAYS-DIFF / 36500.
       
       2200-UPDATE-RECORD.
           ADD WS-DAILY-INT TO ACCT-INT-ACCrued.
           MOVE WS-CURRENT-DATE TO ACCT-LAST-INT-DT.
           REWRITE ACCT-RECORD
               INVALID KEY
                   ADD 1 TO WS-ERR-CNT
           END-REWRITE.
       
       2300-WRITE-REPORT.
           MOVE ACCT-NUMBER TO RPT-ACCT-NUM
           MOVE ACCT-BALANCE TO RPT-OLD-BAL
           MOVE WS-DAILY-INT TO RPT-INT-AMT
           COMPUTE RPT-NEW-BAL = ACCT-BALANCE + ACCT-INT-ACCrued
           WRITE RPT-RECORD FROM WS-REPORT-LINE.
       
       3000-TERM.
           CLOSE ACCT-FILE
           CLOSE RPT-FILE
           WRITE RPT-RECORD FROM WS-TOTAL-LINE.
```

### 2.2 閱讀分析

**程式資訊摘要：**
- **名稱**: INTCLCL (Interest Calculation)
- **作者**: Mary Chen
- **年代**: 2015年撰寫，2024年編譯
- **用途**: 儲蓄帳戶每日利息計算

**檔案分析：**
| 檔案 | 類型 | 用途 |
|------|------|------|
| ACCTFILE | VSAM KSDS | 帳戶主檔 |
| RPTFILE | Sequential | 利息計算報表 |

**關鍵欄位：**
- `ACCT-TYPE`: 'S'=儲蓄, 'C'=支票
- `ACCT-INT-RATE`: 利率 (格式 9V9(4))
- `ACCT-LAST-INT-DT`: 上次計息日
- `ACCT-INT-ACCrued`: 累計利息

**業務邏輯：**
1. 只處理儲蓄帳戶 (SAVINGS-ACCT)
2. 只處理餘額 > 0 的帳戶
3. 計算公式：利息 = (餘額+累計利息) × 利率 × 天數 / 36500
4. 更新累計利息和上次計息日

---

## 三、案例二：交易驗證程式

### 3.1 程式碼 (部分)

```cobol
       2000-VALIDATE-TXN.
           INITIALIZE WS-ERROR-FLAG
           
           * 檢查帳戶存在
           MOVE TXN-ACCT-NUM TO ACCT-NUMBER
           READ ACCT-FILE
               INVALID KEY
                   MOVE 'ACCT-NOT-FOUND' TO WS-ERROR-MSG
                   MOVE 'Y' TO WS-ERROR-FLAG
           END-READ
           
           IF WS-ERROR-FLAG = 'N'
               * 檢查帳戶狀態
               IF ACCT-CLOSED OR ACCT-FROZEN
                   MOVE 'ACCT-NOT-ACTIVE' TO WS-ERROR-MSG
                   MOVE 'Y' TO WS-ERROR-FLAG
               END-IF
           END-IF
           
           IF WS-ERROR-FLAG = 'N'
               * 檢查餘額 (提款時)
               IF TXN-TYPE = 'WTH' AND 
                  ACCT-AVAIL-BAL < TXN-AMOUNT
                   MOVE 'INSUFFICIENT-FUNDS' TO WS-ERROR-MSG
                   MOVE 'Y' TO WS-ERROR-FLAG
               END-IF
           END-IF
           
           IF WS-ERROR-FLAG = 'N'
               * 檢查每日限額
               ADD TXN-AMOUNT TO WS-DAILY-TOTAL
               IF WS-DAILY-TOTAL > WS-DAILY-LIMIT
                   MOVE 'DAILY-LIMIT-EXCEEDED' TO WS-ERROR-MSG
                   MOVE 'Y' TO WS-ERROR-FLAG
               END-IF
           END-IF.
```

### 3.2 閱讀分析

**驗證順序：**
1. 帳戶存在性檢查
2. 帳戶狀態檢查 (關閉/凍結)
3. 餘額檢查 (僅限提款)
4. 每日限額檢查

**設計特點：**
- 使用 `WS-ERROR-FLAG` 控制流程
- 階層式驗證，避免無效檢查
- 每個錯誤都有明確訊息

---

## 四、練習題

### 練習 1: 程式分析

閱讀上述「利息計算程式」，回答：

1. 程式處理哪種類型的帳戶？
2. 利息計算的基礎金額包含哪些部分？
3. 如果帳戶餘額為負數，程式會如何處理？
4. 天數差異如何計算？

### 練習 2: 邏輯追蹤

給定以下資料，追蹤程式執行：

| 欄位 | 值 |
|------|-----|
| ACCT-TYPE | 'S' |
| ACCT-BALANCE | 100,000.00 |
| ACCT-INT-RATE | 2.5000 |
| ACCT-LAST-INT-DT | 20260401 |
| WS-CURRENT-DATE | 20260411 |

**問題：**
1. 天數差異是多少？
2. 計算利息金額
3. 新的 ACCT-INT-ACCrued 是多少？

### 練習 3: 錯誤找出

找出以下程式碼的潛在問題：

```cobol
       2100-CALC-INTEREST.
           COMPUTE WS-DAILY-INT = 
               ACCT-BALANCE * ACCT-INT-RATE / 36500.
           
           ADD WS-DAILY-INT TO ACCT-INT-ACCrued.
           
           REWRITE ACCT-RECORD.
```

---

## 五、總結

### 程式閱讀重點

✅ **五步法**: 識別 → 盤點 → 理解資料 → 追蹤流程 → 深入細節

✅ **關注點**: 檔案結構、關鍵欄位、業務規則、計算公式

✅ **實務技巧**: 由外而內、先整體後細節、善用筆記

---

*課程版本: 1.0 | 更新日期: 2026-04-18*
