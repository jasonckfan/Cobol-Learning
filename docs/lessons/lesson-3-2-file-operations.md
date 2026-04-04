# Lesson 3-2：檔案操作：READ、WRITE、REWRITE

## 學習目標

- 掌握 COBOL 檔案操作指令
- 理解不同檔案類型的操作方式
- 能夠閱讀和設計檔案處理邏輯

---

## 檔案操作概述

COBOL 提供以下檔案操作指令：

| 指令 | 功能 | 適用檔案類型 |
|------|------|-------------|
| OPEN | 開啟檔案 | 所有 |
| CLOSE | 關閉檔案 | 所有 |
| READ | 讀取記錄 | 所有 |
| WRITE | 寫入記錄 | 所有 |
| REWRITE | 更新記錄 | VSAM (I-O 模式) |
| DELETE | 刪除記錄 | VSAM (I-O 模式) |
| START | 定位記錄 | VSAM |

---

## OPEN 敘述

### 開啟模式

| 模式 | 說明 | 使用情境 |
|------|------|----------|
| INPUT | 唯讀 | 讀取檔案 |
| OUTPUT | 唯寫（覆蓋） | 建立新檔案 |
| I-O | 讀寫 | 更新現有檔案 |
| EXTEND | 追加 | 在檔案末尾追加記錄 |

### 語法

```cobol
       OPEN INPUT 檔案名稱.
       OPEN OUTPUT 檔案名稱.
       OPEN I-O 檔案名稱.
       OPEN EXTEND 檔案名稱.
```

### 範例

```cobol
       1000-INIT.
           OPEN INPUT ACCT-FILE
           IF WS-ACCT-STATUS NOT = '00'
               DISPLAY 'ERROR: 無法開啟帳戶檔案'
               STOP RUN
           END-IF

           OPEN OUTPUT RPT-FILE
           OPEN I-O MASTER-FILE.
```

---

## CLOSE 敘述

### 語法

```cobol
       CLOSE 檔案名稱.
```

### 範例

```cobol
       9000-TERM.
           CLOSE ACCT-FILE
           CLOSE RPT-FILE
           CLOSE MASTER-FILE.
```

> ⚠️ **重要**：程式結束前務必關閉所有檔案，否則可能導致資料遺失。

---

## READ 敘述

### Sequential File 讀取

```cobol
       READ 檔案名稱
           AT END
               處理結束邏輯
           NOT AT END
               處理記錄邏輯
       END-READ.
```

### 範例

```cobol
       READ ACCT-FILE
           AT END
               SET EOF-REACHED TO TRUE
               DISPLAY '已讀取所有記錄'
           NOT AT END
               ADD 1 TO WS-RECORD-COUNT
               PERFORM PROCESS-ACCT
       END-READ.
```

### VSAM 隨機讀取（RANDOM）

```cobol
       *> 先設定鍵值
       MOVE WS-SEARCH-ACCT TO ACCT-NO.

       READ ACCT-MASTER
           INVALID KEY
               DISPLAY '找不到該帳號'
               MOVE 'N' TO WS-FOUND-FLAG
           NOT INVALID KEY
               DISPLAY '找到: ' ACCT-NAME
               MOVE 'Y' TO WS-FOUND-FLAG
       END-READ.
```

### VSAM 循序讀取（SEQUENTIAL / DYNAMIC）

```cobol
       *> 讀取下一筆
       READ ACCT-MASTER NEXT RECORD
           AT END
               SET EOF-REACHED TO TRUE
           NOT AT END
               PERFORM PROCESS-ACCT
       END-READ.

       *> 讀取上一筆（DYNAMIC 模式）
       READ ACCT-MASTER PREVIOUS RECORD
           AT END
               DISPLAY '已在檔案開頭'
           NOT AT END
               PERFORM PROCESS-ACCT
       END-READ.
```

---

## WRITE 敘述

### Sequential File 寫入

```cobol
       WRITE 記錄名稱.
```

或從另一個資料區域寫入：

```cobol
       WRITE 記錄名稱 FROM 來源區域.
```

### 範例

```cobol
       *> 準備報表記錄
       MOVE WS-ACCT-NO TO RPT-ACCT-NO.
       MOVE WS-BALANCE TO RPT-BALANCE.

       *> 寫入報表檔案
       WRITE RPT-RECORD.

       *> 或使用 FROM
       WRITE RPT-RECORD FROM WS-REPORT-LINE.
```

### VSAM 寫入

```cobol
       *> 準備記錄
       MOVE WS-NEW-ACCT TO ACCT-NO.
       MOVE WS-NAME TO ACCT-NAME.

       WRITE ACCT-RECORD
           INVALID KEY
               DISPLAY '鍵值重複或寫入失敗'
               MOVE 'F' TO WS-WRITE-STATUS
           NOT INVALID KEY
               ADD 1 TO WS-INSERT-COUNT
               MOVE 'S' TO WS-WRITE-STATUS
       END-WRITE.
```

---

## REWRITE 敘述

用於更新 VSAM 檔案中已存在的記錄。

### 語法

```cobol
       REWRITE 記錄名稱.
```

或：

```cobol
       REWRITE 記錄名稱 FROM 來源區域.
```

### 範例

```cobol
       *> 先讀取記錄
       MOVE WS-TARGET-ACCT TO ACCT-NO.
       READ ACCT-MASTER
           INVALID KEY
               DISPLAY '找不到該帳號'
           NOT INVALID KEY
               *> 修改欄位
               ADD WS-DEPOSIT-AMT TO ACCT-BALANCE
               MOVE FUNCTION CURRENT-DATE(1:8) TO LAST-UPD-DATE
               
               *> 更新記錄
               REWRITE ACCT-RECORD
                   INVALID KEY
                       DISPLAY '更新失敗'
                   NOT INVALID KEY
                       DISPLAY '更新成功'
               END-REWRITE
       END-READ.
```

> ⚠️ **注意**：REWRITE 前必須先成功 READ 該記錄。

---

## DELETE 敘述

用於刪除 VSAM 檔案中的記錄。

### 語法

```cobol
       DELETE 檔案名稱.
```

### 範例

```cobol
       *> 方法一：先讀取再刪除
       MOVE WS-TARGET-ACCT TO ACCT-NO.
       READ ACCT-MASTER
           INVALID KEY
               DISPLAY '找不到該帳號'
           NOT INVALID KEY
               DELETE ACCT-MASTER
                   INVALID KEY
                       DISPLAY '刪除失敗'
                   NOT INVALID KEY
                       DISPLAY '刪除成功'
               END-DELETE
       END-READ.

       *> 方法二：直接刪除（RANDOM 模式）
       MOVE WS-TARGET-ACCT TO ACCT-NO.
       DELETE ACCT-MASTER
           INVALID KEY
               DISPLAY '找不到該帳號'
           NOT INVALID KEY
               DISPLAY '刪除成功'
       END-DELETE.
```

---

## START 敘述

用於在 VSAM 檔案中定位到特定記錄，之後可以循序讀取。

### 語法

```cobol
       START 檔案名稱
           KEY IS 比較運算子 鍵值變數
           INVALID KEY
               處理找不到的邏輯
           NOT INVALID KEY
               處理找到的邏輯
       END-START.
```

### 比較運算子

| 運算子 | 說明 |
|--------|------|
| EQUAL TO | 等於 |
| GREATER THAN | 大於 |
| NOT LESS THAN | 大於等於 |
| GREATER THAN OR EQUAL TO | 大於等於 |

### 範例

```cobol
       *> 從特定帳號開始讀取
       MOVE WS-START-ACCT TO ACCT-NO.
       START ACCT-MASTER
           KEY IS GREATER THAN OR EQUAL TO ACCT-NO
           INVALID KEY
               DISPLAY '找不到符合條件的記錄'
           NOT INVALID KEY
               PERFORM UNTIL EOF-REACHED
                   READ ACCT-MASTER NEXT RECORD
                       AT END
                           SET EOF-REACHED TO TRUE
                       NOT AT END
                           PERFORM PROCESS-ACCT
                   END-READ
               END-PERFORM
       END-START.
```

---

## 完整範例：批次更新帳戶餘額

```cobol
       IDENTIFICATION DIVISION.
       PROGRAM-ID. BALUPD.

       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT TRANS-FILE ASSIGN TO TRANDATA
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-TRANS-STATUS.
           SELECT ACCT-MASTER ASSIGN TO ACCTVSAM
               ORGANIZATION IS INDEXED
               ACCESS MODE IS RANDOM
               RECORD KEY IS ACCT-NO
               FILE STATUS IS WS-ACCT-STATUS.
           SELECT RPT-FILE ASSIGN TO UPDRPT
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-RPT-STATUS.

       DATA DIVISION.
       FILE SECTION.
       FD TRANS-FILE.
       01 TRANS-RECORD.
          05 TRANS-ACCT        PIC X(16).
          05 TRANS-TYPE        PIC XX.
          05 TRANS-AMT         PIC S9(9)V99.

       FD ACCT-MASTER.
       01 ACCT-RECORD.
          05 ACCT-NO           PIC X(16).
          05 ACCT-NAME         PIC X(40).
          05 ACCT-BALANCE      PIC S9(11)V99 COMP-3.
          05 ACCT-STATUS       PIC X.

       FD RPT-FILE.
       01 RPT-RECORD           PIC X(80).

       WORKING-STORAGE SECTION.
       01 WS-STATUS.
          05 WS-TRANS-STATUS   PIC XX.
          05 WS-ACCT-STATUS    PIC XX.
          05 WS-RPT-STATUS     PIC XX.

       01 WS-FLAGS.
          05 WS-EOF-FLAG       PIC X VALUE 'N'.
             88 EOF-REACHED    VALUE 'Y'.

       01 WS-COUNTERS.
          05 WS-READ-CNT       PIC 9(8) VALUE 0.
          05 WS-UPD-CNT        PIC 9(8) VALUE 0.
          05 WS-ERR-CNT        PIC 9(5) VALUE 0.

       01 WS-REPORT-LINE.
          05 WS-RPT-ACCT       PIC X(16).
          05 FILLER            PIC XX VALUE '  '.
          05 WS-RPT-TYPE       PIC XX.
          05 FILLER            PIC XX VALUE '  '.
          05 WS-RPT-AMT        PIC -(9)9.99.
          05 FILLER            PIC XX VALUE '  '.
          05 WS-RPT-STATUS     PIC X(10).

       PROCEDURE DIVISION.
       0000-MAIN.
           PERFORM 1000-INIT
           PERFORM 2000-PROCESS UNTIL EOF-REACHED
           PERFORM 9000-TERM
           STOP RUN.

       1000-INIT.
           OPEN INPUT TRANS-FILE
           OPEN I-O ACCT-MASTER
           OPEN OUTPUT RPT-FILE
           PERFORM 1100-READ-FIRST.

       1100-READ-FIRST.
           READ TRANS-FILE
               AT END
                   SET EOF-REACHED TO TRUE
               NOT AT END
                   ADD 1 TO WS-READ-CNT
           END-READ.

       2000-PROCESS.
           PERFORM 2100-UPDATE-BALANCE
           PERFORM 1100-READ-FIRST.

       2100-UPDATE-BALANCE.
           MOVE TRANS-ACCT TO ACCT-NO.
           READ ACCT-MASTER
               INVALID KEY
                   MOVE 'NOT FOUND' TO WS-RPT-STATUS
                   ADD 1 TO WS-ERR-CNT
               NOT INVALID KEY
                   PERFORM 2110-CALC-NEW-BAL
                   PERFORM 2120-WRITE-BACK
           END-READ

           PERFORM 2130-WRITE-REPORT.

       2110-CALC-NEW-BAL.
           EVALUATE TRANS-TYPE
               WHEN 'DP'
                   ADD TRANS-AMT TO ACCT-BALANCE
                   MOVE 'SUCCESS' TO WS-RPT-STATUS
               WHEN 'WD'
                   IF ACCT-BALANCE >= TRANS-AMT
                       SUBTRACT TRANS-AMT FROM ACCT-BALANCE
                       MOVE 'SUCCESS' TO WS-RPT-STATUS
                   ELSE
                       MOVE 'INSUFF BAL' TO WS-RPT-STATUS
                       ADD 1 TO WS-ERR-CNT
                   END-IF
               WHEN OTHER
                   MOVE 'INVALID TXN' TO WS-RPT-STATUS
                   ADD 1 TO WS-ERR-CNT
           END-EVALUATE.

       2120-WRITE-BACK.
           IF WS-RPT-STATUS = 'SUCCESS'
               REWRITE ACCT-RECORD
                   INVALID KEY
                       MOVE 'UPDATE ERR' TO WS-RPT-STATUS
                       ADD 1 TO WS-ERR-CNT
                   NOT INVALID KEY
                       ADD 1 TO WS-UPD-CNT
               END-REWRITE
           END-IF.

       2130-WRITE-REPORT.
           MOVE TRANS-ACCT TO WS-RPT-ACCT.
           MOVE TRANS-TYPE TO WS-RPT-TYPE.
           MOVE TRANS-AMT TO WS-RPT-AMT.
           WRITE RPT-RECORD FROM WS-REPORT-LINE.

       9000-TERM.
           CLOSE TRANS-FILE
           CLOSE ACCT-MASTER
           CLOSE RPT-FILE
           DISPLAY '========================='
           DISPLAY '交易筆數: ' WS-READ-CNT
           DISPLAY '成功筆數: ' WS-UPD-CNT
           DISPLAY '失敗筆數: ' WS-ERR-CNT
           DISPLAY '========================='.
```

---

## BA 實務應用

### 如何閱讀檔案處理邏輯？

1. **找出 OPEN 敘述**：了解開啟哪些檔案、什麼模式
2. **追蹤 READ/WRITE**：了解資料流向
3. **注意錯誤處理**：INVALID KEY / AT END 的處理方式
4. **確認 CLOSE**：確保所有檔案都被正確關閉

### 需求分析時的關鍵問題

| 看到的操作 | 應該問的問題 |
|------------|-------------|
| OPEN I-O | 「這個檔案會被修改嗎？」 |
| REWRITE | 「更新邏輯是什麼？有哪些欄位會變？」 |
| INVALID KEY | 「找不到記錄時應該怎麼處理？」 |
| DELETE | 「刪除前需要做什麼檢查？」 |

---

## 練習題

### 題目 1
以下程式片段會產生什麼問題？

```cobol
       OPEN OUTPUT ACCT-FILE.
       READ ACCT-FILE ...
```

### 題目 2
設計一個程式片段，實現以下功能：
- 讀取交易檔案（Sequential）
- 更新帳戶主檔（VSAM KSDS）
- 記錄更新失敗的交易到錯誤檔案

### 題目 3
說明 START 敘述的用途和適用情境。

---

## 重點回顧

| 操作 | 說明 | 檔案類型 |
|------|------|----------|
| OPEN INPUT | 唯讀開啟 | 所有 |
| OPEN OUTPUT | 建立新檔 | 所有 |
| OPEN I-O | 讀寫模式 | VSAM |
| READ | 讀取記錄 | 所有 |
| WRITE | 寫入記錄 | 所有 |
| REWRITE | 更新記錄 | VSAM |
| DELETE | 刪除記錄 | VSAM |
| START | 定位記錄 | VSAM |

---

## 延伸閱讀

- [Lesson 3-3：JCL 基本結構](lesson-3-3-jcl-basic.md)
- [Lesson 3-4：Sort 與 Utility](lesson-3-4-sort-utility.md)
