# Lesson 3-5：報表輸出流程

## 學習目標

- 理解報表結構設計原則
- 掌握分頁與標題處理技巧
- 能夠設計基本的報表輸出程式

---

## 報表結構設計

### 報表組成要素

```
┌────────────────────────────────────────┐
│              報表標題                    │  ← Report Header
├────────────────────────────────────────┤
│  頁碼: 1    日期: 2026/04/04            │  ← Page Header
├────────────────────────────────────────┤
│  帳號        戶名          餘額          │  ← Column Header
├────────────────────────────────────────┤
│  1234567890  JOHN DOE      10,000.00    │  ← Detail Line
│  1234567891  JANE SMITH    25,000.00    │
│  ...                                   │
├────────────────────────────────────────┤
│              小計: 35,000.00            │  ← Control Break
├────────────────────────────────────────┤
│  ...                                   │
├────────────────────────────────────────┤
│              總計: 100,000.00           │  ← Report Footer
│  報表結束                               │
└────────────────────────────────────────┘
```

### 報表類型

| 類型 | 說明 | 範例 |
|------|------|------|
| 明細報表 | 列出每筆記錄 | 交易明細報表 |
| 彙總報表 | 統計彙總資料 | 日結報表 |
| 控制報表 | 依控制欄位分組小計 | 分行業績報表 |
| 例外報表 | 只列出異常資料 | 透支帳戶報表 |

---

## 報表記錄結構

### COBOL 資料定義

```cobol
       01 RPT-HEADER-1.
          05 FILLER            PIC X(40) VALUE SPACES.
          05 RPT-TITLE         PIC X(30) VALUE 
             '銀行帳戶餘額日報表'.
          05 FILLER            PIC X(30) VALUE SPACES.

       01 RPT-HEADER-2.
          05 FILLER            PIC X(10) VALUE '頁碼: '.
          05 RPT-PAGE-NUM      PIC ZZZ9.
          05 FILLER            PIC X(30) VALUE SPACES.
          05 FILLER            PIC X(10) VALUE '日期: '.
          05 RPT-DATE          PIC 9999/99/99.
          05 FILLER            PIC X(14) VALUE SPACES.

       01 RPT-COL-HEADER.
          05 FILLER            PIC X(18) VALUE '帳號'.
          05 FILLER            PIC X(42) VALUE '戶名'.
          05 FILLER            PIC X(20) VALUE '餘額'.
          05 FILLER            PIC X(20) VALUE '狀態'.

       01 RPT-DETAIL-LINE.
          05 RPT-ACCT-NO       PIC X(16).
          05 FILLER            PIC XX VALUE SPACES.
          05 RPT-ACCT-NAME     PIC X(40).
          05 FILLER            PIC XX VALUE SPACES.
          05 RPT-BALANCE       PIC $$$,$$$,$$9.99.
          05 FILLER            PIC XX VALUE SPACES.
          05 RPT-STATUS        PIC X(10).

       01 RPT-TOTAL-LINE.
          05 FILLER            PIC X(58) VALUE SPACES.
          05 FILLER            PIC X(10) VALUE '總計: '.
          05 RPT-TOTAL-AMT     PIC $$$,$$$,$$9.99.
          05 FILLER            PIC X(20) VALUE SPACES.
```

---

## 分頁處理

### 分頁邏輯

```cobol
       WORKING-STORAGE SECTION.
       01 WS-PAGE-CONTROL.
          05 WS-LINES-PER-PAGE PIC 99 VALUE 55.
          05 WS-LINE-COUNT     PIC 99 VALUE 0.
          05 WS-PAGE-NUM       PIC 9(4) VALUE 0.

       PROCEDURE DIVISION.
       3000-WRITE-DETAIL.
           ADD 1 TO WS-LINE-COUNT
           IF WS-LINE-COUNT > WS-LINES-PER-PAGE
               PERFORM 3100-PAGE-BREAK
           END-IF
           WRITE RPT-RECORD FROM RPT-DETAIL-LINE.

       3100-PAGE-BREAK.
           ADD 1 TO WS-PAGE-NUM
           MOVE WS-PAGE-NUM TO RPT-PAGE-NUM
           WRITE RPT-RECORD FROM RPT-HEADER-1
               AFTER PAGE
           WRITE RPT-RECORD FROM RPT-HEADER-2
           WRITE RPT-RECORD FROM RPT-COL-HEADER
           MOVE 3 TO WS-LINE-COUNT.
```

---

## 控制中斷（Control Break）

依特定欄位分組，每組產生小計。

### 範例：依分行統計

```cobol
       WORKING-STORAGE SECTION.
       01 WS-CONTROL-FIELDS.
          05 WS-SAVE-BRANCH    PIC X(4) VALUE SPACES.
          05 WS-BRANCH-TOTAL   PIC S9(13)V99 VALUE 0.
          05 WS-GRAND-TOTAL    PIC S9(13)V99 VALUE 0.

       PROCEDURE DIVISION.
       2000-PROCESS.
      *    檢查是否需要控制中斷
           IF ACCT-BRANCH NOT = WS-SAVE-BRANCH
               IF WS-SAVE-BRANCH NOT = SPACES
                   PERFORM 2200-BRANCH-TOTAL
               END-IF
               MOVE ACCT-BRANCH TO WS-SAVE-BRANCH
               MOVE 0 TO WS-BRANCH-TOTAL
           END-IF

      *    處理明細
           PERFORM 2100-WRITE-DETAIL
           ADD ACCT-BALANCE TO WS-BRANCH-TOTAL
           ADD ACCT-BALANCE TO WS-GRAND-TOTAL.

       2200-BRANCH-TOTAL.
      *    輸出分行小計
           MOVE WS-SAVE-BRANCH TO RPT-BRANCH
           MOVE WS-BRANCH-TOTAL TO RPT-BRANCH-AMT
           WRITE RPT-RECORD FROM RPT-BRANCH-TOTAL-LINE
           ADD 1 TO WS-LINE-COUNT.
```

---

## 完整報表程式範例

```cobol
       IDENTIFICATION DIVISION.
       PROGRAM-ID. ACCTRPT.

       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT ACCT-FILE ASSIGN TO ACCTDATA
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-ACCT-STATUS.
           SELECT RPT-FILE ASSIGN TO ACCTRPT
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-RPT-STATUS.

       DATA DIVISION.
       FILE SECTION.
       FD ACCT-FILE.
       01 ACCT-RECORD.
          05 ACCT-NO           PIC X(16).
          05 ACCT-NAME         PIC X(40).
          05 ACCT-BALANCE      PIC S9(11)V99 COMP-3.
          05 ACCT-STATUS       PIC X.

       FD RPT-FILE
           RECORD CONTAINS 133 CHARACTERS
           RECORDING MODE IS F.
       01 RPT-RECORD           PIC X(133).

       WORKING-STORAGE SECTION.
       01 WS-STATUS.
          05 WS-ACCT-STATUS    PIC XX.
          05 WS-RPT-STATUS     PIC XX.

       01 WS-FLAGS.
          05 WS-EOF-FLAG       PIC X VALUE 'N'.
             88 EOF-REACHED    VALUE 'Y'.

       01 WS-PAGE-CONTROL.
          05 WS-LINES-PER-PAGE PIC 99 VALUE 55.
          05 WS-LINE-COUNT     PIC 99 VALUE 0.
          05 WS-PAGE-NUM       PIC 9(4) VALUE 0.

       01 WS-TOTALS.
          05 WS-GRAND-TOTAL    PIC S9(13)V99 COMP-3 VALUE 0.
          05 WS-ACCT-COUNT     PIC 9(8) VALUE 0.

       01 RPT-HEADER-1.
          05 FILLER            PIC X(50) VALUE SPACES.
          05 FILLER            PIC X(30) VALUE
             '銀行帳戶餘額日報表'.
          05 FILLER            PIC X(53) VALUE SPACES.

       01 RPT-HEADER-2.
          05 FILLER            PIC X(10) VALUE '頁碼: '.
          05 RPT-PAGE-NUM      PIC ZZZ9.
          05 FILLER            PIC X(50) VALUE SPACES.
          05 FILLER            PIC X(10) VALUE '日期: '.
          05 RPT-DATE          PIC 9999/99/99.
          05 FILLER            PIC X(55) VALUE SPACES.

       01 RPT-COL-HEADER.
          05 FILLER            PIC X(18) VALUE '帳號'.
          05 FILLER            PIC X(42) VALUE '戶名'.
          05 FILLER            PIC X(25) VALUE '餘額'.
          05 FILLER            PIC X(48) VALUE SPACES.

       01 RPT-DETAIL-LINE.
          05 RPT-ACCT-NO       PIC X(16).
          05 FILLER            PIC XX VALUE SPACES.
          05 RPT-ACCT-NAME     PIC X(40).
          05 FILLER            PIC XX VALUE SPACES.
          05 RPT-BALANCE       PIC $$$,$$$,$$9.99.
          05 FILLER            PIC X(63) VALUE SPACES.

       01 RPT-TOTAL-LINE.
          05 FILLER            PIC X(10) VALUE '總筆數: '.
          05 RPT-ACCT-CNT      PIC Z,ZZZ,ZZ9.
          05 FILLER            PIC X(20) VALUE SPACES.
          05 FILLER            PIC X(10) VALUE '總餘額: '.
          05 RPT-TOTAL-AMT     PIC $$$,$$$,$$9.99.
          05 FILLER            PIC X(52) VALUE SPACES.

       PROCEDURE DIVISION.
       0000-MAIN.
           PERFORM 1000-INIT
           PERFORM 2000-PROCESS UNTIL EOF-REACHED
           PERFORM 3000-FINALIZE
           PERFORM 9000-TERM
           STOP RUN.

       1000-INIT.
           OPEN INPUT ACCT-FILE
           OPEN OUTPUT RPT-FILE
           PERFORM 1100-PAGE-HEADER
           PERFORM 1200-READ-FIRST.

       1100-PAGE-HEADER.
           ADD 1 TO WS-PAGE-NUM
           MOVE WS-PAGE-NUM TO RPT-PAGE-NUM
           MOVE FUNCTION CURRENT-DATE(1:8) TO RPT-DATE
           WRITE RPT-RECORD FROM RPT-HEADER-1
               AFTER PAGE
           WRITE RPT-RECORD FROM RPT-HEADER-2
           WRITE RPT-RECORD FROM RPT-COL-HEADER
           MOVE 3 TO WS-LINE-COUNT.

       1200-READ-FIRST.
           READ ACCT-FILE
               AT END SET EOF-REACHED TO TRUE
           END-READ.

       2000-PROCESS.
           PERFORM 2100-WRITE-DETAIL
           ADD ACCT-BALANCE TO WS-GRAND-TOTAL
           ADD 1 TO WS-ACCT-COUNT
           PERFORM 1200-READ-FIRST.

       2100-WRITE-DETAIL.
           ADD 1 TO WS-LINE-COUNT
           IF WS-LINE-COUNT > WS-LINES-PER-PAGE
               PERFORM 1100-PAGE-HEADER
           END-IF
           MOVE ACCT-NO TO RPT-ACCT-NO
           MOVE ACCT-NAME TO RPT-ACCT-NAME
           MOVE ACCT-BALANCE TO RPT-BALANCE
           WRITE RPT-RECORD FROM RPT-DETAIL-LINE.

       3000-FINALIZE.
           MOVE WS-ACCT-COUNT TO RPT-ACCT-CNT
           MOVE WS-GRAND-TOTAL TO RPT-TOTAL-AMT
           WRITE RPT-RECORD FROM RPT-TOTAL-LINE
               AFTER 2.

       9000-TERM.
           CLOSE ACCT-FILE
           CLOSE RPT-FILE
           DISPLAY '報表產生完成'
           DISPLAY '總筆數: ' WS-ACCT-COUNT
           DISPLAY '總餘額: ' WS-GRAND-TOTAL.
```

---

## BA 實務應用

### 報表需求確認

| 問題 | 目的 |
|------|------|
| 「報表用途是什麼？」 | 確認報表類型 |
| 「需要哪些欄位？」 | 設計報表結構 |
| 「排序方式是什麼？」 | 確認排序鍵 |
| 「是否需要分組小計？」 | 確認控制中斷 |
| 「每頁幾行？」 | 設定分頁邏輯 |

### 報表測試重點

```
□ 標題正確性
□ 頁碼連續性
□ 分頁位置正確
□ 明細資料正確
□ 小計計算正確
□ 總計計算正確
□ 格式對齊正確
```

---

## 練習題

### 題目 1
設計一個交易明細報表的記錄結構，包含：交易日期、時間、帳號、交易類型、金額、餘額。

### 題目 2
說明控制中斷的用途和實現方式。

### 題目 3
設計分頁邏輯，每頁 50 行，包含頁首和頁尾。

---

## 重點回顧

| 要素 | 說明 |
|------|------|
| Report Header | 報表標題 |
| Page Header | 頁首資訊 |
| Column Header | 欄位標題 |
| Detail Line | 明細資料 |
| Control Break | 分組小計 |
| Report Footer | 報表總計 |

---

## 延伸閱讀

- [Lesson 3-3：JCL 基本結構](lesson-3-3-jcl-basic.md)
- [Lesson 4-4：對帳與報表生成](lesson-4-4-reconciliation.md)
