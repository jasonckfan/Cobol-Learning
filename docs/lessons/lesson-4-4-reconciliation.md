# Lesson 4-4：對帳與報表生成

## 學習目標

- 理解銀行對帳的業務流程
- 掌握對帳程式的設計邏輯
- 能夠設計對帳相關報表

---

## 什麼是對帳？

對帳是銀行確保資料正確性的關鍵流程：

- **系統間對帳**：核心系統與周邊系統資料一致性
- **內部對帳**：明細與總帳金額相符
- **外部對帳**：與其他銀行、清算組織資料核對

---

## 對帳類型

### 1. 帳戶餘額對帳

```
核心系統餘額 = 總帳餘額
```

### 2. 交易明細對帳

```
交易明細總額 = 帳戶餘額變動
```

### 3. 跨系統對帳

```
核心系統交易 = 外匯系統交易
核心系統交易 = 證券系統交易
```

---

## 對帳處理流程

### 基本流程

```
1. 資料收集
   - 從各系統讀取交易明細
   - 統一格式轉換

2. 資料排序
   - 依帳號、日期、序號排序

3. 逐筆比對
   - 對比兩邊記錄
   - 記錄差異

4. 差異處理
   - 產生差異報表
   - 人工介入調查

5. 報表生成
   - 對帳結果報表
   - 差異明細報表
```

---

## 對帳程式範例

### 兩方對帳程式

```cobol
       IDENTIFICATION DIVISION.
       PROGRAM-ID. RECONCIL.

       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT FILE-A ASSIGN TO SYSADATA
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-STATUS-A.
           SELECT FILE-B ASSIGN TO SYSBDATA
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-STATUS-B.
           SELECT MATCH-FILE ASSIGN TO MATCH
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-MATCH-STATUS.
           SELECT UNMATCH-FILE ASSIGN TO UNMATCH
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-UNMATCH-STATUS.

       DATA DIVISION.
       FILE SECTION.
       FD FILE-A.
       01 RECORD-A.
          05 A-KEY             PIC X(20).
          05 A-AMOUNT          PIC S9(11)V99.
          05 A-DATE            PIC 9(8).
          05 A-STATUS          PIC X.

       FD FILE-B.
       01 RECORD-B.
          05 B-KEY             PIC X(20).
          05 B-AMOUNT          PIC S9(11)V99.
          05 B-DATE            PIC 9(8).
          05 B-STATUS          PIC X.

       FD MATCH-FILE.
       01 MATCH-RECORD.
          05 M-KEY             PIC X(20).
          05 M-AMT-A           PIC S9(11)V99.
          05 M-AMT-B           PIC S9(11)V99.
          05 M-DIFF            PIC S9(11)V99.

       FD UNMATCH-FILE.
       01 UNMATCH-RECORD.
          05 U-SOURCE          PIC X.        *> A or B
          05 U-KEY             PIC X(20).
          05 U-AMOUNT          PIC S9(11)V99.
          05 U-REASON          PIC X(30).

       WORKING-STORAGE SECTION.
       01 WS-FLAGS.
          05 WS-EOF-A          PIC X VALUE 'N'.
             88 EOF-A          VALUE 'Y'.
          05 WS-EOF-B          PIC X VALUE 'N'.
             88 EOF-B          VALUE 'Y'.

       01 WS-COUNTERS.
          05 WS-MATCH-CNT      PIC 9(8) VALUE 0.
          05 WS-UNMATCH-A-CNT  PIC 9(8) VALUE 0.
          05 WS-UNMATCH-B-CNT  PIC 9(8) VALUE 0.
          05 WS-DIFF-CNT       PIC 9(8) VALUE 0.

       PROCEDURE DIVISION.
       0000-MAIN.
           PERFORM 1000-INIT
           PERFORM 2000-COMPARE UNTIL EOF-A AND EOF-B
           PERFORM 3000-SUMMARY
           PERFORM 9000-TERM
           STOP RUN.

       1000-INIT.
           OPEN INPUT FILE-A
           OPEN INPUT FILE-B
           OPEN OUTPUT MATCH-FILE
           OPEN OUTPUT UNMATCH-FILE
           PERFORM 1100-READ-A
           PERFORM 1200-READ-B.

       1100-READ-A.
           READ FILE-A
               AT END SET EOF-A TO TRUE
           END-READ.

       1200-READ-B.
           READ FILE-B
               AT END SET EOF-B TO TRUE
           END-READ.

       2000-COMPARE.
           IF NOT EOF-A AND NOT EOF-B
               EVALUATE TRUE
                   WHEN A-KEY = B-KEY
                       PERFORM 2100-MATCH
                   WHEN A-KEY < B-KEY
                       PERFORM 2200-ONLY-IN-A
                   WHEN A-KEY > B-KEY
                       PERFORM 2300-ONLY-IN-B
               END-EVALUATE
           ELSE IF NOT EOF-A
               PERFORM 2200-ONLY-IN-A
           ELSE IF NOT EOF-B
               PERFORM 2300-ONLY-IN-B
           END-IF.

       2100-MATCH.
      *    檢查金額是否一致
           IF A-AMOUNT = B-AMOUNT
               ADD 1 TO WS-MATCH-CNT
               MOVE A-KEY TO M-KEY
               MOVE A-AMOUNT TO M-AMT-A
               MOVE B-AMOUNT TO M-AMT-B
               MOVE 0 TO M-DIFF
               WRITE MATCH-RECORD
           ELSE
               ADD 1 TO WS-DIFF-CNT
               MOVE A-KEY TO M-KEY
               MOVE A-AMOUNT TO M-AMT-A
               MOVE B-AMOUNT TO M-AMT-B
               COMPUTE M-DIFF = A-AMOUNT - B-AMOUNT
               WRITE MATCH-RECORD
           END-IF
           PERFORM 1100-READ-A
           PERFORM 1200-READ-B.

       2200-ONLY-IN-A.
           ADD 1 TO WS-UNMATCH-A-CNT
           MOVE 'A' TO U-SOURCE
           MOVE A-KEY TO U-KEY
           MOVE A-AMOUNT TO U-AMOUNT
           MOVE '僅在A系統存在' TO U-REASON
           WRITE UNMATCH-RECORD
           PERFORM 1100-READ-A.

       2300-ONLY-IN-B.
           ADD 1 TO WS-UNMATCH-B-CNT
           MOVE 'B' TO U-SOURCE
           MOVE B-KEY TO U-KEY
           MOVE B-AMOUNT TO U-AMOUNT
           MOVE '僅在B系統存在' TO U-REASON
           WRITE UNMATCH-RECORD
           PERFORM 1200-READ-B.

       3000-SUMMARY.
           DISPLAY '========================'
           DISPLAY '對帳結果統計'
           DISPLAY '========================'
           DISPLAY '匹配筆數: ' WS-MATCH-CNT
           DISPLAY '金額差異: ' WS-DIFF-CNT
           DISPLAY '僅在A: ' WS-UNMATCH-A-CNT
           DISPLAY '僅在B: ' WS-UNMATCH-B-CNT.

       9000-TERM.
           CLOSE FILE-A
           CLOSE FILE-B
           CLOSE MATCH-FILE
           CLOSE UNMATCH-FILE.
```

---

## 對帳報表設計

### 對帳結果報表

```
┌────────────────────────────────────────────────┐
│          對帳結果日報表                          │
│          日期: 2026/04/04                       │
├────────────────────────────────────────────────┤
│  對帳系統: 核心系統 vs 外匯系統                   │
├────────────────────────────────────────────────┤
│  總筆數:          10,000 筆                    │
│  匹配筆數:         9,850 筆                    │
│  金額差異:            50 筆                    │
│  單方存在:           100 筆                    │
├────────────────────────────────────────────────┤
│  匹配率:           98.5%                       │
│  差異金額:   $1,234,567.89                     │
└────────────────────────────────────────────────┘
```

### 差異明細報表

```
┌──────────────────────────────────────────────────────────┐
│                    對帳差異明細報表                        │
│                    日期: 2026/04/04                       │
├──────────────────────────────────────────────────────────┤
│  交易編號      核心金額      外匯金額      差異金額        │
├──────────────────────────────────────────────────────────┤
│  TRX00000001   10,000.00    10,001.00       -1.00       │
│  TRX00000002   25,000.00    25,000.00        0.00       │
│  TRX00000003   僅核心存在                       50,000.00│
│  TRX00000004   僅外匯存在                       30,000.00│
└──────────────────────────────────────────────────────────┘
```

---

## BA 實務應用

### 對帳需求確認

| 問題 | 目的 |
|------|------|
| 「對帳的兩個來源是什麼？」 | 確認對帳標的 |
| 「對帳的鍵值是什麼？」 | 設計比對邏輯 |
| 「可接受的差異範圍？」 | 設計警示門檻 |
| 「差異如何處理？」 | 設計差異處理流程 |

### 常見對帳問題

| 問題 | 可能原因 | 處理方式 |
|------|----------|----------|
| 單方存在 | 交易未同步 | 查明原因後補錄 |
| 金額差異 | 四捨五入、匯差 | 人工調整 |
| 時間差異 | 批次時間不同 | 調整對帳時點 |

---

## 練習題

### 題目 1
設計一個核心系統與證券系統的對帳流程。

### 題目 2
說明對帳程式中，如何處理單方存在的記錄。

### 題目 3
設計一個對帳差異報表，包含必要的欄位。

---

## 重點回顧

| 概念 | 說明 |
|------|------|
| 對帳 | 確保資料一致性 |
| 匹配 | 兩方記錄相符 |
| 差異 | 兩方記錄不一致 |
| 單方存在 | 僅一方有記錄 |

---

## 延伸閱讀

- [Lesson 4-3：日終批次處理流程](lesson-4-3-eod-process.md)
- [Lesson 3-5：報表輸出流程](lesson-3-5-report-output.md)
