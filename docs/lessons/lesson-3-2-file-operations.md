# Lesson 3-2: 檔案操作 - READ、WRITE、REWRITE

> 掌握 COBOL 檔案操作的基本指令

---

## 學習目標

- 掌握 OPEN、CLOSE 檔案操作
- 理解 READ 的各種形式與選項
- 學會 WRITE、REWRITE 的使用
- 了解 DELETE、START 等特殊操作

---

## 一、檔案開關操作

### 1.1 OPEN 語句

```cobol
       *---- OPEN 語句語法 ----------------------------------------
       
       * 開啟輸入檔
       OPEN INPUT file-name.
       
       * 開啟輸出檔 (會建立新檔或覆蓋舊檔)
       OPEN OUTPUT file-name.
       
       * 開啟擴充檔 (在結尾新增)
       OPEN EXTEND file-name.
       
       * 開啟輸入輸出檔 (可讀可寫)
       OPEN I-O file-name.
       
       * 同時開啟多個檔案
       OPEN INPUT file-1 file-2
            OUTPUT file-3
            I-O file-4.
```

### 1.2 CLOSE 語句

```cobol
       *---- CLOSE 語句語法 ---------------------------------------
       
       * 基本關閉
       CLOSE file-name.
       
       * 關閉多個檔案
       CLOSE file-1 file-2 file-3.
       
       * 關閉並釋放鎖定 (VSAM)
       CLOSE file-name WITH LOCK.
       
       * 關閉並重繞 (磁帶檔)
       CLOSE file-name WITH REWIND.
       
       * 關閉不重繞 (磁帶檔)
       CLOSE file-name NO REWIND.
```

---

## 二、READ 操作

### 2.1 READ 基本語法

```cobol
       *---- READ 基本語法 ----------------------------------------
       
       * 循序讀取 (Sequential)
       READ file-name
           AT END
               執行語句
       END-READ.
       
       * 隨機讀取 (Random - 需指定 Key)
       READ file-name
           KEY IS key-field
           INVALID KEY
               執行語句
           NOT INVALID KEY
               執行語句
       END-READ.
       
       * 讀取下一筆
       READ file-name NEXT RECORD
           AT END
               執行語句
       END-READ.
       
       * 讀取前一筆 (部分系統支援)
       READ file-name PREVIOUS RECORD
           AT END
               執行語句
       END-READ.
```

### 2.2 READ 範例

```cobol
       *---- READ 實務範例 ----------------------------------------
       
       * 範例 1: 循序讀取 Sequential File
       OPEN INPUT CUSTOMER-FILE.
       
       PERFORM UNTIL WS-EOF
           READ CUSTOMER-FILE
               AT END
                   MOVE 'Y' TO WS-EOF
               NOT AT END
                   PERFORM PROCESS-RECORD
           END-READ
       END-PERFORM.
       
       CLOSE CUSTOMER-FILE.
       
       * 範例 2: 隨機讀取 VSAM KSDS
       OPEN I-O ACCOUNT-FILE.
       
       MOVE '123456789012' TO ACCT-NUMBER.
       
       READ ACCOUNT-FILE
           KEY IS ACCT-NUMBER
           INVALID KEY
               DISPLAY 'Account not found'
               MOVE 'N' TO WS-FOUND-FLAG
           NOT INVALID KEY
               DISPLAY 'Account found: ' ACCT-NUMBER
               MOVE 'Y' TO WS-FOUND-FLAG
       END-READ.
       
       CLOSE ACCOUNT-FILE.
       
       * 範例 3: 讀取並鎖定 (防止其他程式修改)
       READ ACCOUNT-FILE
           KEY IS ACCT-NUMBER
           LOCK
           INVALID KEY
               DISPLAY 'Account not found'
       END-READ.
```

---

## 三、WRITE 操作

### 3.1 WRITE 基本語法

```cobol
       *---- WRITE 基本語法 ---------------------------------------
       
       * 基本寫入
       WRITE record-name.
       
       * 從其他欄位寫入
       WRITE record-name FROM source-field.
       
       * 寫入並指定 Key (VSAM)
       WRITE record-name
           INVALID KEY
               執行語句
       END-WRITE.
       
       * 寫入前進行 (Advancing - 報表用)
       WRITE record-name
           BEFORE ADVANCING n LINES.
       
       WRITE record-name
           AFTER ADVANCING n LINES.
       
       WRITE record-name
           AFTER ADVANCING PAGE.
```

### 3.2 WRITE 範例

```cobol
       *---- WRITE 實務範例 ---------------------------------------
       
       * 範例 1: 寫入 Sequential File
       OPEN OUTPUT REPORT-FILE.
       
       MOVE 'HEADER' TO REPORT-RECORD.
       WRITE REPORT-RECORD.
       
       MOVE 'DETAIL001' TO REPORT-RECORD.
       WRITE REPORT-RECORD.
       
       CLOSE REPORT-FILE.
       
       * 範例 2: 寫入 VSAM KSDS
       OPEN I-O ACCOUNT-FILE.
       
       MOVE '123456789012' TO ACCT-NUMBER.
       MOVE 'JOHN DOE' TO ACCT-NAME.
       MOVE 1000.00 TO ACCT-BALANCE.
       
       WRITE ACCOUNT-RECORD
           INVALID KEY
               DISPLAY 'Duplicate key error'
               ADD 1 TO WS-ERROR-COUNT
           NOT INVALID KEY
               DISPLAY 'Record written successfully'
               ADD 1 TO WS-WRITE-COUNT
       END-WRITE.
       
       CLOSE ACCOUNT-FILE.
       
       * 範例 3: 報表寫入 (換頁控制)
       OPEN OUTPUT PRINT-FILE.
       
       * 寫入標題並換頁
       MOVE 'MONTHLY REPORT' TO PRINT-LINE.
       WRITE PRINT-LINE AFTER ADVANCING PAGE.
       
       * 寫入明細並空一行
       MOVE 'Line 1' TO PRINT-LINE.
       WRITE PRINT-LINE AFTER ADVANCING 1 LINES.
       
       CLOSE PRINT-FILE.
```

---

## 四、REWRITE 操作

### 4.1 REWRITE 基本語法

```cobol
       *---- REWRITE 基本語法 -------------------------------------
       
       * 基本改寫 (需先讀取)
       REWRITE record-name.
       
       * 從其他欄位改寫
       REWRITE record-name FROM source-field.
       
       * 改寫並檢查錯誤
       REWRITE record-name
           INVALID KEY
               執行語句
       END-REWRITE.
```

### 4.2 REWRITE 範例

```cobol
       *---- REWRITE 實務範例 -------------------------------------
       
       * 範例: 更新帳戶餘額
       OPEN I-O ACCOUNT-FILE.
       
       * 先讀取記錄
       MOVE '123456789012' TO ACCT-NUMBER.
       
       READ ACCOUNT-FILE
           KEY IS ACCT-NUMBER
           INVALID KEY
               DISPLAY 'Account not found'
               MOVE 'Y' TO WS-ERROR-FLAG
           NOT INVALID KEY
               * 修改餘額
               ADD TXN-AMOUNT TO ACCT-BALANCE
               
               * 改寫記錄
               REWRITE ACCOUNT-RECORD
                   INVALID KEY
                       DISPLAY 'Rewrite error'
                   NOT INVALID KEY
                       DISPLAY 'Account updated'
               END-REWRITE
       END-READ.
       
       CLOSE ACCOUNT-FILE.
```

---

## 五、其他檔案操作

### 5.1 DELETE 操作

```cobol
       *---- DELETE 操作 ------------------------------------------
       
       * 刪除記錄 (需先讀取)
       DELETE file-name RECORD
           INVALID KEY
               執行語句
       END-DELETE.
       
       * 範例
       OPEN I-O ACCOUNT-FILE.
       
       READ ACCOUNT-FILE
           KEY IS ACCT-NUMBER
       END-READ.
       
       IF WS-FILE-STATUS = '00'
           DELETE ACCOUNT-FILE RECORD
               INVALID KEY
                   DISPLAY 'Delete failed'
           END-DELETE
       END-IF.
       
       CLOSE ACCOUNT-FILE.
```

### 5.2 START 操作

```cobol
       *---- START 操作 -------------------------------------------
       
       * 定位到特定 Key (用於循序讀取的起點)
       START file-name
           KEY IS EQUAL TO key-field
           INVALID KEY
               執行語句
       END-START.
       
       * 其他比較運算子
       START file-name
           KEY IS GREATER THAN key-field.
       
       START file-name
           KEY IS NOT LESS THAN key-field.
       
       * 範例: 從特定帳號開始讀取
       OPEN INPUT ACCOUNT-FILE.
       
       MOVE '100000000000' TO ACCT-NUMBER.
       
       START ACCOUNT-FILE
           KEY IS NOT LESS THAN ACCT-NUMBER
           INVALID KEY
               DISPLAY 'No records found'
               MOVE 'Y' TO WS-EOF
           NOT INVALID KEY
               PERFORM UNTIL WS-EOF
                   READ ACCOUNT-FILE NEXT RECORD
                       AT END
                           MOVE 'Y' TO WS-EOF
                       NOT AT END
                           PERFORM PROCESS-RECORD
                   END-READ
               END-PERFORM
       END-START.
       
       CLOSE ACCOUNT-FILE.
```

### 5.3 UNLOCK 操作

```cobol
       *---- UNLOCK 操作 ------------------------------------------
       
       * 解除記錄鎖定
       UNLOCK file-name RECORD.
       
       * 範例
       READ ACCOUNT-FILE
           KEY IS ACCT-NUMBER
           LOCK
       END-READ.
       
       * 處理記錄...
       
       * 解除鎖定
       UNLOCK ACCOUNT-FILE RECORD.
```

---

## 六、檔案操作最佳實踐

### 6.1 標準檔案處理模板

```cobol
       *---- 標準檔案處理模板 -------------------------------------
       
       0000-MAIN.
           PERFORM 1000-INIT
           PERFORM 2000-PROCESS
           PERFORM 3000-TERM
           STOP RUN.
       
       1000-INIT.
           OPEN INPUT INPUT-FILE
           IF WS-IN-STATUS NOT = '00'
               DISPLAY 'Input file open error: ' WS-IN-STATUS
               MOVE 9999 TO RETURN-CODE
               STOP RUN
           END-IF
           
           OPEN OUTPUT OUTPUT-FILE
           IF WS-OUT-STATUS NOT = '00'
               DISPLAY 'Output file open error: ' WS-OUT-STATUS
               MOVE 9999 TO RETURN-CODE
               STOP RUN
           END-IF
           
           * 讀第一筆
           READ INPUT-FILE
               AT END
                   MOVE 'Y' TO WS-EOF
           END-READ.
       
       2000-PROCESS.
           PERFORM UNTIL WS-EOF
               PERFORM 2100-PROCESS-RECORD
               READ INPUT-FILE
                   AT END
                       MOVE 'Y' TO WS-EOF
               END-READ
           END-PERFORM.
       
       2100-PROCESS-RECORD.
           * 處理邏輯
           WRITE OUTPUT-RECORD FROM INPUT-RECORD
               INVALID KEY
                   ADD 1 TO WS-WRITE-ERROR
           END-WRITE
           ADD 1 TO WS-WRITE-COUNT.
       
       3000-TERM.
           CLOSE INPUT-FILE
           CLOSE OUTPUT-FILE
           DISPLAY 'Records processed: ' WS-READ-COUNT
           DISPLAY 'Records written: ' WS-WRITE-COUNT.
```

---

## 七、總結

### 本課程重點回顧

✅ **OPEN**: INPUT, OUTPUT, EXTEND, I-O

✅ **CLOSE**: 基本關閉、WITH LOCK、REWIND

✅ **READ**: Sequential, Random, NEXT, PREVIOUS

✅ **WRITE**: 基本寫入、FROM、INVALID KEY

✅ **REWRITE**: 更新記錄，需先讀取

✅ **其他**: DELETE, START, UNLOCK

---

*課程版本: 1.0 | 更新日期: 2026-04-12*
