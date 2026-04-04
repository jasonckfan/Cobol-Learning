# Lesson 3-7：DB2 基本概念

## 學習目標

- 理解 COBOL 與 DB2 的整合方式
- 掌握 SQL 在 COBOL 中的使用
- 了解 Cursor 操作和交易管理

---

## DB2 在銀行系統中的角色

DB2 是 IBM 的關聯式資料庫，在銀行 Mainframe 系統中：
- 存放客戶資料、交易記錄
- 支援線上交易的即時查詢
- 提供批次處理的資料存取

---

## SQL in COBOL

### 基本結構

```cobol
       EXEC SQL
           SQL敘述
       END-EXEC.
```

### 資料定義

```cobol
       WORKING-STORAGE SECTION.
       EXEC SQL INCLUDE SQLCA END-EXEC.
       
       EXEC SQL BEGIN DECLARE SECTION END-EXEC.
       01 WS-ACCT-NO           PIC X(16).
       01 WS-ACCT-NAME         PIC X(40).
       01 WS-ACCT-BALANCE      PIC S9(11)V99 COMP-3.
       EXEC SQL END DECLARE SECTION END-EXEC.
```

---

## 基本 SQL 操作

### SELECT - 查詢

```cobol
      * 查詢單筆記錄
       MOVE '1234567890123456' TO WS-ACCT-NO.
       
       EXEC SQL
           SELECT ACCT_NAME, ACCT_BALANCE
           INTO :WS-ACCT-NAME, :WS-ACCT-BALANCE
           FROM ACCT_MASTER
           WHERE ACCT_NO = :WS-ACCT-NO
       END-EXEC.
       
       IF SQLCODE = 0
           DISPLAY '戶名: ' WS-ACCT-NAME
           DISPLAY '餘額: ' WS-ACCT-BALANCE
       ELSE IF SQLCODE = 100
           DISPLAY '找不到該帳號'
       ELSE
           DISPLAY '查詢錯誤: ' SQLCODE
       END-IF.
```

### INSERT - 新增

```cobol
       EXEC SQL
           INSERT INTO ACCT_MASTER
               (ACCT_NO, ACCT_NAME, ACCT_BALANCE, ACCT_STATUS)
           VALUES
               (:WS-ACCT-NO, :WS-ACCT-NAME, :WS-ACCT-BALANCE, 'A')
       END-EXEC.
       
       IF SQLCODE = 0
           DISPLAY '新增成功'
       ELSE
           DISPLAY '新增失敗: ' SQLCODE
       END-IF.
```

### UPDATE - 更新

```cobol
       EXEC SQL
           UPDATE ACCT_MASTER
           SET ACCT_BALANCE = ACCT_BALANCE + :WS-AMOUNT,
               LAST_UPD_DATE = CURRENT DATE
           WHERE ACCT_NO = :WS-ACCT-NO
       END-EXEC.
```

### DELETE - 刪除

```cobol
       EXEC SQL
           DELETE FROM ACCT_MASTER
           WHERE ACCT_NO = :WS-ACCT-NO
       END-EXEC.
```

---

## Cursor 操作

當需要處理多筆記錄時，使用 Cursor 逐筆讀取。

### Cursor 宣告與操作流程

```cobol
      * 1. 宣告 Cursor
       EXEC SQL
           DECLARE ACCT_CURSOR CURSOR FOR
               SELECT ACCT_NO, ACCT_NAME, ACCT_BALANCE
               FROM ACCT_MASTER
               WHERE ACCT_STATUS = 'A'
               ORDER BY ACCT_NO
       END-EXEC.

      * 2. 開啟 Cursor
       EXEC SQL
           OPEN ACCT_CURSOR
       END-EXEC.

      * 3. 讀取記錄（迴圈）
       PERFORM UNTIL SQLCODE NOT = 0
           EXEC SQL
               FETCH ACCT_CURSOR
               INTO :WS-ACCT-NO, :WS-ACCT-NAME, :WS-ACCT-BALANCE
           END-EXEC
           
           IF SQLCODE = 0
               PERFORM PROCESS-ACCOUNT
           END-IF
       END-PERFORM.

      * 4. 關閉 Cursor
       EXEC SQL
           CLOSE ACCT_CURSOR
       END-EXEC.
```

### 完整範例

```cobol
       2000-PROCESS-ALL-ACCOUNTS.
      *    開啟 Cursor
           EXEC SQL
               OPEN ACCT_CURSOR
           END-EXEC
           
           IF SQLCODE NOT = 0
               DISPLAY '開啟 Cursor 失敗: ' SQLCODE
               STOP RUN
           END-IF
           
      *    讀取並處理每一筆
           MOVE 0 TO WS-PROC-COUNT
           
           PERFORM UNTIL SQLCODE NOT = 0
               EXEC SQL
                   FETCH ACCT_CURSOR
                   INTO :WS-ACCT-NO, 
                        :WS-ACCT-NAME, 
                        :WS-ACCT-BALANCE
               END-EXEC
               
               EVALUATE SQLCODE
                   WHEN 0
                       PERFORM 2100-PROCESS-ONE
                       ADD 1 TO WS-PROC-COUNT
                   WHEN 100
                       DISPLAY '所有記錄處理完成'
                   WHEN OTHER
                       DISPLAY 'Fetch 錯誤: ' SQLCODE
               END-EVALUATE
           END-PERFORM
           
      *    關閉 Cursor
           EXEC SQL
               CLOSE ACCT_CURSOR
           END-EXEC.
```

---

## 交易管理

### COMMIT 與 ROLLBACK

```cobol
      * 確認交易
       EXEC SQL
           COMMIT
       END-EXEC.

      * 回滾交易
       EXEC SQL
           ROLLBACK
       END-EXEC.
```

### 交易範例

```cobol
       3000-TRANSFER-MONEY.
      *    開始交易
      *    扣除轉出帳戶
           EXEC SQL
               UPDATE ACCT_MASTER
               SET ACCT_BALANCE = ACCT_BALANCE - :WS-AMOUNT
               WHERE ACCT_NO = :WS-FROM-ACCT
           END-EXEC
           
           IF SQLCODE NOT = 0
               EXEC SQL ROLLBACK END-EXEC
               DISPLAY '轉出失敗'
               EXIT PARAGRAPH
           END-IF
           
      *    加入轉入帳戶
           EXEC SQL
               UPDATE ACCT_MASTER
               SET ACCT_BALANCE = ACCT_BALANCE + :WS-AMOUNT
               WHERE ACCT_NO = :WS-TO-ACCT
           END-EXEC
           
           IF SQLCODE NOT = 0
               EXEC SQL ROLLBACK END-EXEC
               DISPLAY '轉入失敗'
               EXIT PARAGRAPH
           END-IF
           
      *    確認交易
           EXEC SQL
               COMMIT
           END-EXEC
           
           DISPLAY '轉帳成功'.
```

---

## SQLCA 結構

SQLCA（SQL Communication Area）存放 SQL 執行結果。

```cobol
       01 SQLCA.
          05 SQLCAID           PIC X(8).
          05 SQLCABC           PIC S9(9) COMP.
          05 SQLCODE           PIC S9(9) COMP.  *> 返回碼
          05 SQLERRM.
             10 SQLERRML       PIC S9(4) COMP.
             10 SQLERRMC       PIC X(70).
          05 SQLERRP           PIC X(8).
          05 SQLERRD           PIC S9(9) COMP OCCURS 6 TIMES.
          05 SQLWARN.
             10 SQLWARN0       PIC X.
             10 SQLWARN1       PIC X.
             ...
          05 SQLSTATE          PIC X(5).
```

### 常見 SQLCODE

| SQLCODE | 說明 |
|---------|------|
| 0 | 執行成功 |
| 100 | 找不到記錄（EOF） |
| -803 | 主鍵重複 |
| -530 | 外鍵限制違規 |
| -180 | 日期/時間格式錯誤 |
| -305 | NULL 值 |

---

## BA 實務應用

### 需求確認重點

| 問題 | 目的 |
|------|------|
| 「這個查詢會返回多少筆？」 | 確認是否需要 Cursor |
| 「是否需要更新多個表？」 | 確認交易管理需求 |
| 「效能要求是多少？」 | 評估 SQL 優化需求 |

### 效能考量

| 問題 | 建議 |
|------|------|
| 查詢太慢 | 檢查索引、SQL 優化 |
| Cursor 太慢 | 考慮批量處理 |
| 鎖定衝突 | 調整隔離級別 |

---

## 練習題

### 題目 1
設計一個 SQL 查詢，找出餘額大於 100,000 的所有帳戶。

### 題目 2
說明 COMMIT 和 ROLLBACK 的用途和時機。

### 題目 3
設計一個 Cursor 處理流程，逐筆讀取並更新帳戶餘額。

---

## 重點回顧

| 概念 | 說明 |
|------|------|
| EXEC SQL | COBOL 中嵌入 SQL |
| Cursor | 逐筆處理多筆記錄 |
| COMMIT | 確認交易 |
| ROLLBACK | 回滾交易 |
| SQLCODE | SQL 執行結果碼 |

---

## 延伸閱讀

- [Lesson 3-8：CICS 線上交易入門](lesson-3-8-cics-intro.md)
- [Lesson 4-1：CLM 資金池管理系統架構](lesson-4-1-clm-system.md)
