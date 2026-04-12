# Lesson 2-8: 錯誤處理與檔案狀態碼

> 理解 COBOL 的錯誤處理機制與檔案操作狀態

---

## 學習目標

- 理解 FILE STATUS 的概念與用途
- 掌握常見的檔案狀態碼及其意義
- 學會設計錯誤處理邏輯
- 了解 BA 在分析錯誤處理時的關注點

---

## 一、FILE STATUS 基礎

### 1.1 什麼是 FILE STATUS？

FILE STATUS 是 COBOL 中用於追蹤檔案操作結果的欄位。每次檔案操作 (OPEN, READ, WRITE 等) 後，系統會將結果碼存入 FILE STATUS 欄位，程式可以根據此碼判斷操作是否成功。

```
┌─────────────────────────────────────────────────────────────────┐
│              FILE STATUS 概念圖                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   程式操作          系統回應          FILE STATUS               │
│   ────────          ────────          ───────────               │
│                                                                 │
│   OPEN FILE    -->  檔案開啟成功  -->  '00'                     │
│   READ FILE    -->  讀取成功      -->  '00'                     │
│   READ FILE    -->  檔案結束      -->  '10'                     │
│   WRITE FILE   -->  寫入成功      -->  '00'                     │
│   OPEN FILE    -->  檔案不存在    -->  '35'                     │
│                                                                 │
│   程式邏輯：                                                    │
│   READ INPUT-FILE                                               │
│   IF WS-FILE-STATUS = '00'                                      │
│       處理正常讀取的記錄                                        │
│   ELSE IF WS-FILE-STATUS = '10'                                 │
│       處理檔案結束                                              │
│   ELSE                                                          │
│       處理錯誤                                                  │
│   END-IF                                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 FILE STATUS 宣告

```cobol
       *---- FILE STATUS 宣告範例 ---------------------------------
       
       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT CUSTOMER-FILE
               ASSIGN TO 'CUSTFILE'
               FILE STATUS IS WS-CUST-STATUS.    *> 指定狀態欄位
       
       DATA DIVISION.
       FILE SECTION.
       FD  CUSTOMER-FILE.
       01  CUSTOMER-RECORD.
           05  ...
       
       WORKING-STORAGE SECTION.
       * FILE STATUS 欄位 (必須是 2 字元的英數欄位)
       01  WS-CUST-STATUS      PIC X(2).
       
       * 細分的狀態碼 (可選)
       01  WS-STATUS-CODES.
           05  WS-STAT-SUCCESS    PIC X(2) VALUE '00'.
           05  WS-STAT-EOF        PIC X(2) VALUE '10'.
           05  STAT-EOF           PIC X(2) VALUE '10'.
               88  END-OF-FILE    VALUE '10'.
```

---

## 二、常見 FILE STATUS 碼

### 2.1 成功狀態碼

| 狀態碼 | 意義 | 說明 |
|--------|------|------|
| **00** | 成功 | 操作成功完成 |
| **02** | 成功但有重複 | WRITE 時發現重複 Key (索引檔) |
| **04** | 成功但記錄長度不符 | READ 時記錄長度與預期不同 |
| **05** | 成功但檔案已存在 | OPEN OUTPUT 時檔案已存在 |

### 2.2 檔案結束狀態碼

| 狀態碼 | 意義 | 說明 |
|--------|------|------|
| **10** | 檔案結束 (EOF) | 循序讀取到檔案結尾 |

### 2.3 錯誤狀態碼

| 狀態碼 | 意義 | 說明 | 常見原因 |
|--------|------|------|----------|
| **22** | 重複 Key | 寫入時 Key 已存在 | 索引檔寫入重複 |
| **23** | 記錄不存在 | 讀取時找不到 Key | Key 值錯誤 |
| **30** | 永久錯誤 | I/O 錯誤 | 硬體故障 |
| **34** | 檔案空間不足 | 寫入時空間不夠 | 磁碟滿了 |
| **35** | 檔案不存在 | OPEN 時找不到檔案 | 檔名錯誤或檔案遺失 |
| **37** | 檔案權限錯誤 | 無權限存取 | 權限不足 |
| **39** | 檔案屬性衝突 | OPEN 時屬性不符 | 組織方式不符 |
| **41** | 檔案已開啟 | 重複 OPEN | 邏輯錯誤 |
| **42** | 檔案未開啟 | 操作前未 OPEN | 邏輯錯誤 |
| **43** | 檔案已關閉 | 重複 CLOSE | 邏輯錯誤 |
| **46** | 讀取順序錯誤 | 循序讀取順序錯誤 | 程式邏輯錯誤 |
| **47** | 讀取未成功 | 嘗試讀取失敗的記錄 | 邏輯錯誤 |
| **48** | 寫入未成功 | 嘗試寫入失敗的記錄 | 邏輯錯誤 |
| **49** | 刪除/改寫錯誤 | 操作失敗 | 權限或狀態錯誤 |

---

## 三、檔案操作與錯誤處理

### 3.1 標準檔案處理模式

```cobol
       *---- 標準檔案處理模式 -------------------------------------
       
       WORKING-STORAGE SECTION.
       01  WS-FILE-STATUS      PIC X(2).
           88  WS-FILE-OK      VALUE '00'.
           88  WS-FILE-EOF     VALUE '10'.
           88  WS-FILE-ERROR   VALUE '30' '34' '35' '37' '39'.
       
       01  WS-EOF-FLAG         PIC X VALUE 'N'.
           88  WS-EOF-YES      VALUE 'Y'.
           88  WS-EOF-NO       VALUE 'N'.
       
       PROCEDURE DIVISION.
       0000-MAIN.
           PERFORM 1000-OPEN-FILES
           IF WS-FILE-OK
               PERFORM 2000-PROCESS-FILE
               PERFORM 3000-CLOSE-FILES
           END-IF
           STOP RUN.
       
       *---- 開檔 -------------------------------------------------
       1000-OPEN-FILES.
           OPEN INPUT CUSTOMER-FILE
           
           EVALUATE WS-FILE-STATUS
               WHEN '00'
                   DISPLAY 'File opened successfully'
               WHEN '35'
                   DISPLAY 'ERROR: File not found'
                   MOVE 'Y' TO WS-EOF-FLAG
               WHEN '37'
                   DISPLAY 'ERROR: Permission denied'
                   MOVE 'Y' TO WS-EOF-FLAG
               WHEN OTHER
                   DISPLAY 'ERROR: Open failed, Status: ' 
                           WS-FILE-STATUS
                   MOVE 'Y' TO WS-EOF-FLAG
           END-EVALUATE.
       
       *---- 處理檔案 ---------------------------------------------
       2000-PROCESS-FILE.
           PERFORM UNTIL WS-EOF-YES
               READ CUSTOMER-FILE
                   AT END
                       MOVE 'Y' TO WS-EOF-YES
                   NOT AT END
                       PERFORM 2100-PROCESS-RECORD
               END-READ
           END-PERFORM.
       
       2100-PROCESS-RECORD.
           * 處理單筆記錄
           IF WS-FILE-STATUS = '00'
               * 正常處理
               ADD 1 TO WS-READ-COUNT
           ELSE
               * 讀取錯誤處理
               DISPLAY 'Read error: ' WS-FILE-STATUS
               ADD 1 TO WS-ERROR-COUNT
           END-IF.
       
       *---- 關檔 -------------------------------------------------
       3000-CLOSE-FILES.
           CLOSE CUSTOMER-FILE.
           
           IF WS-FILE-STATUS NOT = '00' AND WS-FILE-STATUS NOT = '42'
               DISPLAY 'WARNING: Close error: ' WS-FILE-STATUS
           END-IF.
```

### 3.2 錯誤處理副程式

```cobol
       *---- 錯誤處理副程式 ---------------------------------------
       
       9000-ERROR-HANDLER.
           EVALUATE WS-FILE-STATUS
               WHEN '00'
                   MOVE 'Success' TO WS-ERROR-MSG
               WHEN '02'
                   MOVE 'Duplicate key' TO WS-ERROR-MSG
               WHEN '10'
                   MOVE 'End of file' TO WS-ERROR-MSG
               WHEN '22'
                   MOVE 'Duplicate key error' TO WS-ERROR-MSG
                   PERFORM 9100-LOG-ERROR
               WHEN '23'
                   MOVE 'Record not found' TO WS-ERROR-MSG
                   PERFORM 9100-LOG-ERROR
               WHEN '30'
                   MOVE 'Permanent I/O error' TO WS-ERROR-MSG
                   PERFORM 9200-ABORT-JOB
               WHEN '34'
                   MOVE 'Disk full' TO WS-ERROR-MSG
                   PERFORM 9200-ABORT-JOB
               WHEN '35'
                   MOVE 'File not found' TO WS-ERROR-MSG
                   PERFORM 9100-LOG-ERROR
               WHEN '37'
                   MOVE 'Permission denied' TO WS-ERROR-MSG
                   PERFORM 9200-ABORT-JOB
               WHEN '41'
                   MOVE 'File already open' TO WS-ERROR-MSG
                   PERFORM 9100-LOG-ERROR
               WHEN '42'
                   MOVE 'File not open' TO WS-ERROR-MSG
                   PERFORM 9100-LOG-ERROR
               WHEN OTHER
                   STRING 'Unknown error: ' WS-FILE-STATUS
                       DELIMITED BY SIZE
                       INTO WS-ERROR-MSG
                   PERFORM 9100-LOG-ERROR
           END-EVALUATE.
       
       9100-LOG-ERROR.
           WRITE ERROR-RECORD FROM WS-ERROR-LOG.
           ADD 1 TO WS-ERROR-COUNT.
       
       9200-ABORT-JOB.
           DISPLAY 'CRITICAL ERROR: ' WS-ERROR-MSG
           DISPLAY 'Job aborted'
           MOVE 9999 TO RETURN-CODE
           STOP RUN.
```

---

## 四、進階錯誤處理

### 4.1 DECLARATIVES (宣告式錯誤處理)

DECLARATIVES 允許在檔案操作發生錯誤時自動執行指定的錯誤處理程式碼。

```cobol
       *---- DECLARATIVES 範例 ------------------------------------
       
       PROCEDURE DIVISION.
       
       DECLARATIVES.
       ERROR-HANDLER SECTION.
           USE AFTER ERROR ON CUSTOMER-FILE.
       0000-ERROR-ROUTINE.
           DISPLAY 'FILE ERROR OCCURRED'
           DISPLAY 'FILE STATUS: ' WS-FILE-STATUS
           DISPLAY 'RECORD: ' CUSTOMER-RECORD
           ADD 1 TO WS-ERROR-COUNT
           IF WS-ERROR-COUNT > 10
               DISPLAY 'TOO MANY ERRORS, ABORTING'
               STOP RUN
           END-IF.
       END DECLARATIVES.
       
       * 主程式邏輯
       0000-MAIN.
           OPEN INPUT CUSTOMER-FILE.
           PERFORM UNTIL WS-EOF
               READ CUSTOMER-FILE
                   AT END
                       MOVE 'Y' TO WS-EOF
               END-READ
               * 如果發生錯誤，會自動執行 DECLARATIVES
           END-PERFORM.
```

### 4.2 EXCEPTION/ERROR 處理

```cobol
       *---- 使用 EXCEPTION/ERROR 子句 ----------------------------
       
       * OPEN 錯誤處理
       OPEN INPUT CUSTOMER-FILE
           WITH NO REWIND
           ON EXCEPTION
               DISPLAY 'Cannot open file'
               PERFORM ERROR-ROUTINE
           NOT ON EXCEPTION
               DISPLAY 'File opened successfully'
       END-OPEN.
       
       * READ 錯誤處理 (VSAM 檔案)
       READ CUSTOMER-FILE
           KEY IS WS-SEARCH-KEY
           INVALID KEY
               DISPLAY 'Record not found'
               PERFORM NOT-FOUND-ROUTINE
           NOT INVALID KEY
               PERFORM PROCESS-RECORD
       END-READ.
       
       * WRITE 錯誤處理
       WRITE CUSTOMER-RECORD
           INVALID KEY
               DISPLAY 'Duplicate key'
               PERFORM DUP-KEY-ROUTINE
       END-WRITE.
```

---

## 五、BA 實務指南

### 5.1 錯誤處理檢查清單

```
┌─────────────────────────────────────────────────────────────────┐
│              錯誤處理檢查清單                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  □ 檔案操作                                                     │
│    ├── 每個 OPEN 都有錯誤檢查？                                 │
│    ├── READ 是否處理 AT END？                                   │
│    ├── WRITE 是否處理 INVALID KEY？                             │
│    └── CLOSE 是否有錯誤檢查？                                   │
│                                                                 │
│  □ FILE STATUS                                                  │
│    ├── 是否宣告了 FILE STATUS 欄位？                            │
│    ├── 是否檢查了所有可能的狀態碼？                             │
│    ├── 是否有 88 層級條件名稱簡化判斷？                         │
│    └── 錯誤狀態是否有對應處理？                                 │
│                                                                 │
│  □ 錯誤處理邏輯                                                 │
│    ├── 錯誤是否被記錄？                                         │
│    ├── 嚴重錯誤是否中止程式？                                   │
│    ├── 是否有錯誤計數統計？                                     │
│    └── 錯誤訊息是否清楚？                                       │
│                                                                 │
│  □ 測試考量                                                     │
│    ├── 是否測試了檔案不存在情境？                               │
│    ├── 是否測試了權限不足情境？                                 │
│    ├── 是否測試了空間不足情境？                                 │
│    └── 是否測試了重複 Key 情境？                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 常見錯誤與預防

| 錯誤 | 原因 | 預防措施 |
|------|------|----------|
| 檔案未找到 (35) | 檔名錯誤或檔案未建立 | 開檔前檢查，或建立空檔案 |
| 權限不足 (37) | 使用者權限不夠 | 確認權限設定，使用正確使用者 |
| 空間不足 (34) | 磁碟滿了 | 監控磁碟空間，設定警示 |
| 重複 Key (22) | 寫入重複資料 | 寫入前檢查，或更新而非新增 |
| 記錄不存在 (23) | 讀取不存在的 Key | 讀取前確認，或使用 INVALID KEY |
| 檔案未開啟 (42) | 操作前未 OPEN | 確認程式流程順序 |

---

## 六、練習題

### 練習 1: FILE STATUS 判斷

給定以下情境，請選擇正確的 FILE STATUS 碼：

| 情境 | FILE STATUS |
|------|-------------|
| 循序讀取到檔案結尾 | |
| OPEN 時檔案不存在 | |
| 寫入時磁碟空間不足 | |
| 讀取時找不到指定 Key | |
| 操作成功完成 | |

### 練習 2: 錯誤處理設計

為以下程式碼補充錯誤處理：

```cobol
       OPEN INPUT ACCOUNT-FILE.
       
       PERFORM UNTIL WS-EOF
           READ ACCOUNT-FILE
               AT END
                   MOVE 'Y' TO WS-EOF
           END-READ
           * 請補充：檢查 FILE STATUS 並處理錯誤
           
           PERFORM PROCESS-RECORD
       END-PERFORM.
       
       CLOSE ACCOUNT-FILE.
```

### 練習 3: 錯誤處理分析

分析以下程式碼的錯誤處理問題：

```cobol
       OPEN INPUT CUSTOMER-FILE.
       OPEN OUTPUT REPORT-FILE.
       
       READ CUSTOMER-FILE.
       PERFORM UNTIL WS-EOF
           WRITE REPORT-RECORD FROM CUSTOMER-RECORD
           READ CUSTOMER-FILE
               AT END
                   MOVE 'Y' TO WS-EOF
           END-READ
       END-PERFORM.
       
       CLOSE CUSTOMER-FILE.
       CLOSE REPORT-FILE.
```

**問題**：
1. 這個程式碼有哪些錯誤處理問題？
2. 如何改進？

---

## 七、總結

### 本課程重點回顧

✅ **FILE STATUS**: 2 字元欄位，追蹤檔案操作結果

✅ **成功碼**: '00' 成功, '02' 有重複, '10' 檔案結束

✅ **錯誤碼**: '35' 檔案不存在, '37' 權限不足, '30' I/O 錯誤

✅ **錯誤處理**: EVALUATE 狀態碼, DECLARATIVES, EXCEPTION 子句

✅ **BA 關注點**: 檢查所有檔案操作, 測試錯誤情境, 記錄錯誤訊息

---

## 延伸閱讀

- [Lesson 3-1: Sequential File and VSAM File](lesson-3-1-file-types.md)
- [Lesson 3-2: File Operations](lesson-3-2-file-operations.md)

---

*課程版本: 1.0 | 更新日期: 2026-04-12*
