# Lesson 3-5: 報表輸出流程

> 理解 Mainframe 報表產生與輸出機制

---

## 學習目標

- 理解報表的基本結構與格式
- 掌握控制換頁與標題
- 學會設計報表程式
- 了解 BA 在報表需求分析時的關注點

---

## 一、報表結構

### 1.1 報表基本組成

```
┌─────────────────────────────────────────────────────────────────┐
│              報表基本結構                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  報表標題 (Report Header)                                │  │
│   │  - 報表名稱                                              │  │
│   │  - 產生日期/時間                                         │  │
│   │  - 頁碼                                                  │  │
│   └─────────────────────────────────────────────────────────┘  │
│                              ↓                                  │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  欄位標題 (Column Headers)                               │  │
│   │  - 各欄位名稱                                            │  │
│   │  - 分隔線                                                │  │
│   └─────────────────────────────────────────────────────────┘  │
│                              ↓                                  │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  明細資料 (Detail Lines)                                 │  │
│   │  - 實際資料記錄                                          │  │
│   │  - 多筆重複                                              │  │
│   └─────────────────────────────────────────────────────────┘  │
│                              ↓                                  │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  小計/合計 (Subtotals)                                   │  │
│   │  - 分組加總                                              │  │
│   │  - 控制中斷處理                                          │  │
│   └─────────────────────────────────────────────────────────┘  │
│                              ↓                                  │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  總計 (Grand Total)                                      │  │
│   │  - 全報表加總                                            │  │
│   │  - 統計資訊                                              │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 報表格式範例

```
================================================================================
                        DAILY TRANSACTION REPORT
                        Date: 2026/04/12
                        Page: 001
================================================================================

Account Number  Transaction Date   Type      Amount        Balance
--------------  ----------------   ----    ----------    ----------
123456789012    2026/04/12         DEP       1,000.00     10,500.00
123456789012    2026/04/12         WTH         500.00     10,000.00
123456789013    2026/04/12         DEP       2,500.00     15,200.00

                              Subtotal:     4,000.00

================================================================================
                              Grand Total:    4,000.00
                              Record Count:         3
================================================================================
```

---

## 二、報表控制

### 2.1 換頁控制

```cobol
       *---- 換頁控制範例 -----------------------------------------
       
       WORKING-STORAGE SECTION.
       01  WS-PAGE-COUNT      PIC 9(3) VALUE 0.
       01  WS-LINE-COUNT      PIC 9(3) VALUE 0.
       01  WS-LINES-PER-PAGE  PIC 9(3) VALUE 55.
       01  WS-HEADING-LINES   PIC 9(3) VALUE 5.
       
       PROCEDURE DIVISION.
       
       * 檢查是否需要換頁
       2000-CHECK-PAGE-BREAK.
           IF WS-LINE-COUNT >= WS-LINES-PER-PAGE
               PERFORM 3000-WRITE-HEADING
           END-IF.
       
       * 寫入標題
       3000-WRITE-HEADING.
           ADD 1 TO WS-PAGE-COUNT
           MOVE 0 TO WS-LINE-COUNT
           
           WRITE REPORT-LINE FROM WS-PAGE-BREAK
               AFTER ADVANCING PAGE
           
           WRITE REPORT-LINE FROM WS-REPORT-TITLE
           WRITE REPORT-LINE FROM WS-DATE-LINE
           WRITE REPORT-LINE FROM WS-PAGE-NUM-LINE
           WRITE REPORT-LINE FROM WS-BLANK-LINE
           WRITE REPORT-LINE FROM WS-COLUMN-HEADER
           WRITE REPORT-LINE FROM WS-UNDERLINE
           
           ADD WS-HEADING-LINES TO WS-LINE-COUNT.
       
       * 寫入明細
       2100-WRITE-DETAIL.
           PERFORM 2000-CHECK-PAGE-BREAK
           WRITE REPORT-LINE FROM WS-DETAIL-LINE
               AFTER ADVANCING 1 LINES
           ADD 1 TO WS-LINE-COUNT.
```

### 2.2 控制中斷 (Control Break)

```cobol
       *---- 控制中斷處理範例 -------------------------------------
       
       WORKING-STORAGE SECTION.
       01  WS-CURRENT-KEY     PIC X(10).
       01  WS-PREVIOUS-KEY    PIC X(10).
       01  WS-SUBTOTAL        PIC S9(11)V99 COMP-3 VALUE 0.
       01  WS-GRAND-TOTAL     PIC S9(11)V99 COMP-3 VALUE 0.
       
       PROCEDURE DIVISION.
       
       2000-PROCESS-RECORD.
           * 檢查控制中斷
           IF WS-CURRENT-KEY NOT = WS-PREVIOUS-KEY AND
              WS-PREVIOUS-KEY NOT = SPACES
               PERFORM 2200-WRITE-SUBTOTAL
           END-IF
           
           * 累計
           ADD TXN-AMOUNT TO WS-SUBTOTAL
           ADD TXN-AMOUNT TO WS-GRAND-TOTAL
           
           * 寫入明細
           PERFORM 2100-WRITE-DETAIL
           
           * 儲存目前 Key
           MOVE WS-CURRENT-KEY TO WS-PREVIOUS-KEY.
       
       2200-WRITE-SUBTOTAL.
           PERFORM 2000-CHECK-PAGE-BREAK
           
           MOVE WS-SUBTOTAL TO WS-SUBTOTAL-DISPLAY
           MOVE WS-PREVIOUS-KEY TO WS-SUBTOTAL-KEY
           
           WRITE REPORT-LINE FROM WS-SUBTOTAL-LINE
               AFTER ADVANCING 1 LINES
           ADD 1 TO WS-LINE-COUNT
           
           WRITE REPORT-LINE FROM WS-BLANK-LINE
           ADD 1 TO WS-LINE-COUNT
           
           MOVE 0 TO WS-SUBTOTAL.
```

---

## 三、報表程式範例

### 3.1 完整報表程式

```cobol
       IDENTIFICATION DIVISION.
       PROGRAM-ID. RPTGEN.
       
       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT TXN-FILE ASSIGN TO 'TXNFILE'
               ORGANIZATION IS SEQUENTIAL.
           SELECT RPT-FILE ASSIGN TO 'RPTFILE'
               ORGANIZATION IS SEQUENTIAL.
       
       DATA DIVISION.
       FILE SECTION.
       FD  TXN-FILE.
       01  TXN-RECORD.
           05  TXN-ACCT         PIC X(12).
           05  TXN-DATE         PIC 9(8).
           05  TXN-TYPE         PIC X(3).
           05  TXN-AMOUNT       PIC S9(9)V99 COMP-3.
       
       FD  RPT-FILE.
       01  RPT-RECORD         PIC X(80).
       
       WORKING-STORAGE SECTION.
       01  WS-SWITCHES.
           05  WS-EOF           PIC X VALUE 'N'.
           05  WS-FIRST-RECORD  PIC X VALUE 'Y'.
       
       01  WS-COUNTERS.
           05  WS-PAGE-COUNT    PIC 9(3) VALUE 0.
           05  WS-LINE-COUNT    PIC 9(3) VALUE 999.
           05  WS-TXN-COUNT     PIC 9(7) VALUE 0.
       
       01  WS-TOTALS.
           05  WS-SUBTOTAL      PIC S9(11)V99 COMP-3 VALUE 0.
           05  WS-GRAND-TOTAL   PIC S9(11)V99 COMP-3 VALUE 0.
       
       01  WS-KEYS.
           05  WS-CURR-ACCT     PIC X(12).
           05  WS-PREV-ACCT     PIC X(12).
       
       01  WS-HEADING-1.
           05  FILLER           PIC X(25) VALUE SPACES.
           05  FILLER           PIC X(30) VALUE 
               'DAILY TRANSACTION REPORT'.
           05  FILLER           PIC X(25) VALUE SPACES.
       
       01  WS-HEADING-2.
           05  FILLER           PIC X(25) VALUE SPACES.
           05  FILLER           PIC X(5) VALUE 'Date:'.
           05  WS-RPT-DATE      PIC X(10).
           05  FILLER           PIC X(40) VALUE SPACES.
       
       01  WS-HEADING-3.
           05  FILLER           PIC X(25) VALUE SPACES.
           05  FILLER           PIC X(5) VALUE 'Page:'.
           05  WS-RPT-PAGE      PIC ZZ9.
           05  FILLER           PIC X(47) VALUE SPACES.
       
       01  WS-COLUMN-HDR.
           05  FILLER           PIC X(2) VALUE SPACES.
           05  FILLER           PIC X(12) VALUE 'Account'.
           05  FILLER           PIC X(3) VALUE SPACES.
           05  FILLER           PIC X(10) VALUE 'Date'.
           05  FILLER           PIC X(3) VALUE SPACES.
           05  FILLER           PIC X(4) VALUE 'Type'.
           05  FILLER           PIC X(3) VALUE SPACES.
           05  FILLER           PIC X(12) VALUE 'Amount'.
           05  FILLER           PIC X(24) VALUE SPACES.
       
       01  WS-DETAIL-LINE.
           05  FILLER           PIC X(2) VALUE SPACES.
           05  WS-DTL-ACCT      PIC X(12).
           05  FILLER           PIC X(3) VALUE SPACES.
           05  WS-DTL-DATE      PIC 9999/99/99.
           05  FILLER           PIC X(3) VALUE SPACES.
           05  WS-DTL-TYPE      PIC X(3).
           05  FILLER           PIC X(3) VALUE SPACES.
           05  WS-DTL-AMOUNT    PIC ZZZ,ZZZ,ZZ9.99.
           05  FILLER           PIC X(24) VALUE SPACES.
       
       01  WS-SUBTOTAL-LINE.
           05  FILLER           PIC X(30) VALUE SPACES.
           05  FILLER           PIC X(10) VALUE 'Subtotal:'.
           05  WS-SUB-AMOUNT    PIC ZZZ,ZZZ,ZZ9.99.
           05  FILLER           PIC X(24) VALUE SPACES.
       
       01  WS-TOTAL-LINE.
           05  FILLER           PIC X(30) VALUE SPACES.
           05  FILLER           PIC X(12) VALUE 'Grand Total:'.
           05  WS-TOT-AMOUNT    PIC ZZZ,ZZZ,ZZ9.99.
           05  FILLER           PIC X(22) VALUE SPACES.
       
       PROCEDURE DIVISION.
       0000-MAIN.
           PERFORM 1000-INIT
           PERFORM 2000-PROCESS
           PERFORM 3000-TERM
           STOP RUN.
       
       1000-INIT.
           OPEN INPUT TXN-FILE
           OPEN OUTPUT RPT-FILE
           ACCEPT WS-RPT-DATE FROM DATE YYYYMMDD
           READ TXN-FILE
               AT END
                   MOVE 'Y' TO WS-EOF.
       
       2000-PROCESS.
           PERFORM UNTIL WS-EOF
               MOVE TXN-ACCT TO WS-CURR-ACCT
               
               IF WS-CURR-ACCT NOT = WS-PREV-ACCT AND
                  WS-FIRST-RECORD = 'N'
                   PERFORM 2200-SUBTOTAL-BREAK
               END-IF
               
               PERFORM 2100-WRITE-DETAIL
               
               ADD TXN-AMOUNT TO WS-SUBTOTAL
               ADD TXN-AMOUNT TO WS-GRAND-TOTAL
               ADD 1 TO WS-TXN-COUNT
               
               MOVE WS-CURR-ACCT TO WS-PREV-ACCT
               MOVE 'N' TO WS-FIRST-RECORD
               
               READ TXN-FILE
                   AT END
                       MOVE 'Y' TO WS-EOF
               END-READ
           END-PERFORM.
           
           PERFORM 2200-SUBTOTAL-BREAK.
       
       2100-WRITE-DETAIL.
           IF WS-LINE-COUNT > 55
               PERFORM 2300-WRITE-HEADING
           END-IF
           
           MOVE TXN-ACCT TO WS-DTL-ACCT
           MOVE TXN-DATE TO WS-DTL-DATE
           MOVE TXN-TYPE TO WS-DTL-TYPE
           MOVE TXN-AMOUNT TO WS-DTL-AMOUNT
           
           WRITE RPT-RECORD FROM WS-DETAIL-LINE
               AFTER ADVANCING 1 LINES
           ADD 1 TO WS-LINE-COUNT.
       
       2200-SUBTOTAL-BREAK.
           IF WS-SUBTOTAL NOT = 0
               MOVE WS-SUBTOTAL TO WS-SUB-AMOUNT
               WRITE RPT-RECORD FROM WS-SUBTOTAL-LINE
                   AFTER ADVANCING 2 LINES
               ADD 2 TO WS-LINE-COUNT
               MOVE 0 TO WS-SUBTOTAL
           END-IF.
       
       2300-WRITE-HEADING.
           ADD 1 TO WS-PAGE-COUNT
           MOVE WS-PAGE-COUNT TO WS-RPT-PAGE
           MOVE 0 TO WS-LINE-COUNT
           
           WRITE RPT-RECORD FROM WS-HEADING-1
               AFTER ADVANCING PAGE
           WRITE RPT-RECORD FROM WS-HEADING-2
           WRITE RPT-RECORD FROM WS-HEADING-3
           WRITE RPT-RECORD FROM WS-COLUMN-HDR
               AFTER ADVANCING 2 LINES
           ADD 5 TO WS-LINE-COUNT.
       
       3000-TERM.
           MOVE WS-GRAND-TOTAL TO WS-TOT-AMOUNT
           WRITE RPT-RECORD FROM WS-TOTAL-LINE
               AFTER ADVANCING 2 LINES
           
           CLOSE TXN-FILE
           CLOSE RPT-FILE
           DISPLAY 'Report Complete'
           DISPLAY 'Records: ' WS-TXN-COUNT.
```

---

## 四、總結

### 本課程重點回顧

✅ **報表結構**: 標題、欄位標題、明細、小計、總計

✅ **換頁控制**: AFTER ADVANCING PAGE, 行數計數

✅ **控制中斷**: Key 變化時產生小計

✅ **報表設計**: 欄位對齊、格式控制、頁碼

---

*課程版本: 1.0 | 更新日期: 2026-04-12*
