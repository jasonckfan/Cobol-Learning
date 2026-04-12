# Lesson 3-7: DB2 基本概念

> 理解 Mainframe 上的關聯式資料庫基礎

---

## 學習目標

- 理解 DB2 在 Mainframe 上的角色
- 掌握基本 SQL 語法
- 了解 COBOL 與 DB2 的整合
- 掌握 BA 在資料庫設計時的關注點

---

## 一、DB2 概覽

### 1.1 什麼是 DB2？

DB2 是 IBM 的關聯式資料庫管理系統 (RDBMS)，在 Mainframe 上廣泛用於儲存結構化資料。

```
┌─────────────────────────────────────────────────────────────────┐
│              DB2 在銀行架構中的位置                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  應用程式層                                              │  │
│   │  - CICS 線上交易                                         │  │
│   │  - 批次作業                                              │  │
│   │  - 查詢報表                                              │  │
│   └────────────────────────┬────────────────────────────────┘  │
│                              ↓                                  │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  資料庫介面層                                            │  │
│   │  - SQL                                                   │  │
│   │  - Embedded SQL in COBOL                                 │  │
│   └────────────────────────┬────────────────────────────────┘  │
│                              ↓                                  │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  DB2 Database Server                                     │  │
│   │  - Tables (資料表)                                       │  │
│   │  - Indexes (索引)                                        │  │
│   │  - Buffer Pools (緩衝區)                                 │  │
│   │  - Logs (日誌)                                           │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 DB2 核心概念

| 概念 | 說明 | 範例 |
|------|------|------|
| **Table** | 資料表 | ACCOUNT_MASTER |
| **Column** | 欄位 | ACCT_NUMBER, BALANCE |
| **Row** | 資料列 | 一筆帳戶記錄 |
| **Index** | 索引 | ACCT_NUMBER_IDX |
| **Schema** | 綱要 | 資料庫物件集合 |
| **Tablespace** | 表空間 | 儲存資料的實體空間 |

---

## 二、基本 SQL 語法

### 2.1 SELECT 查詢

```sql
-- 基本查詢
SELECT ACCT_NUMBER, ACCT_NAME, BALANCE
FROM ACCOUNT_MASTER
WHERE ACCT_STATUS = 'ACTIVE';

-- 條件查詢
SELECT *
FROM ACCOUNT_MASTER
WHERE BALANCE > 10000
  AND ACCT_TYPE = 'SAVINGS';

-- 排序
SELECT ACCT_NUMBER, BALANCE
FROM ACCOUNT_MASTER
ORDER BY BALANCE DESC;

-- 分組統計
SELECT ACCT_TYPE, COUNT(*), AVG(BALANCE)
FROM ACCOUNT_MASTER
GROUP BY ACCT_TYPE;

-- 連接查詢
SELECT A.ACCT_NUMBER, C.CUST_NAME, A.BALANCE
FROM ACCOUNT_MASTER A
JOIN CUSTOMER_MASTER C
  ON A.CUST_ID = C.CUST_ID;
```

### 2.2 INSERT、UPDATE、DELETE

```sql
-- 新增資料
INSERT INTO ACCOUNT_MASTER 
(ACCT_NUMBER, CUST_ID, ACCT_TYPE, BALANCE, OPEN_DATE)
VALUES ('123456789012', 'C001', 'SAVINGS', 1000.00, '2026-04-12');

-- 更新資料
UPDATE ACCOUNT_MASTER
SET BALANCE = BALANCE + 500,
    LAST_UPDATE = CURRENT_TIMESTAMP
WHERE ACCT_NUMBER = '123456789012';

-- 刪除資料
DELETE FROM ACCOUNT_MASTER
WHERE ACCT_NUMBER = '123456789012';
```

---

## 三、COBOL 與 DB2 整合

### 3.1 Embedded SQL

```cobol
       *---- COBOL 中的 SQL 範例 ---------------------------------
       
       WORKING-STORAGE SECTION.
       
       * SQL 通訊區
       EXEC SQL
           INCLUDE SQLCA
       END-EXEC.
       
       * 宣告游標
       EXEC SQL
           DECLARE C1 CURSOR FOR
           SELECT ACCT_NUMBER, ACCT_NAME, BALANCE
           FROM ACCOUNT_MASTER
           WHERE ACCT_STATUS = 'ACTIVE'
       END-EXEC.
       
       * 主變數宣告
       01  HV-ACCT-NUMBER     PIC X(12).
       01  HV-ACCT-NAME       PIC X(40).
       01  HV-BALANCE         PIC S9(13)V99 COMP-3.
       01  HV-ROW-COUNT       PIC S9(9) COMP.
       
       PROCEDURE DIVISION.
       
       * 連接資料庫
       1000-CONNECT.
           EXEC SQL
               CONNECT TO DB2PROD
           END-EXEC.
           
           IF SQLCODE NOT = 0
               DISPLAY 'Connection failed: ' SQLCODE
               STOP RUN
           END-IF.
       
       * 單筆查詢
       2000-SELECT-SINGLE.
           MOVE '123456789012' TO HV-ACCT-NUMBER.
           
           EXEC SQL
               SELECT ACCT_NAME, BALANCE
               INTO :HV-ACCT-NAME, :HV-BALANCE
               FROM ACCOUNT_MASTER
               WHERE ACCT_NUMBER = :HV-ACCT-NUMBER
           END-EXEC.
           
           EVALUATE SQLCODE
               WHEN 0
                   DISPLAY 'Account: ' HV-ACCT-NAME
                   DISPLAY 'Balance: ' HV-BALANCE
               WHEN +100
                   DISPLAY 'Account not found'
               WHEN OTHER
                   DISPLAY 'SQL Error: ' SQLCODE
           END-EVALUATE.
       
       * 多筆查詢 (使用游標)
       3000-SELECT-MULTIPLE.
           EXEC SQL
               OPEN C1
           END-EXEC.
           
           PERFORM UNTIL SQLCODE NOT = 0
               EXEC SQL
                   FETCH C1
                   INTO :HV-ACCT-NUMBER, 
                        :HV-ACCT-NAME, 
                        :HV-BALANCE
               END-EXEC
               
               IF SQLCODE = 0
                   PERFORM PROCESS-RECORD
               END-IF
           END-PERFORM.
           
           EXEC SQL
               CLOSE C1
           END-EXEC.
       
       * 更新資料
       4000-UPDATE.
           MOVE '123456789012' TO HV-ACCT-NUMBER.
           MOVE 1500.00 TO HV-BALANCE.
           
           EXEC SQL
               UPDATE ACCOUNT_MASTER
               SET BALANCE = :HV-BALANCE,
                   LAST_UPDATE = CURRENT_TIMESTAMP
               WHERE ACCT_NUMBER = :HV-ACCT-NUMBER
           END-EXEC.
           
           IF SQLCODE = 0
               DISPLAY 'Update successful'
               DISPLAY 'Rows updated: ' SQLERRD(3)
           ELSE
               DISPLAY 'Update failed: ' SQLCODE
           END-IF.
       
       * 斷開連接
       9000-DISCONNECT.
           EXEC SQL
               COMMIT
           END-EXEC.
           
           EXEC SQL
               DISCONNECT CURRENT
           END-EXEC.
```

### 3.2 SQLCODE 說明

| SQLCODE | 意義 | 說明 |
|---------|------|------|
| **0** | 成功 | 操作成功完成 |
| **+100** | 未找到資料 | 查詢無結果 |
| **-1** | 錯誤 | 一般錯誤 |
| **-104** | 語法錯誤 | SQL 語法有誤 |
| **-180** | 日期格式錯誤 | 日期轉換失敗 |
| **-181** | 字串格式錯誤 | 字串轉換失敗 |
| **-204** | 物件不存在 | 資料表或欄位不存在 |
| **-803** | 重複值 | 違反唯一性限制 |
| **-911** | 死結 | 資源被鎖定 |

---

## 四、BA 資料庫設計考量

### 4.1 資料表設計檢查清單

```
┌─────────────────────────────────────────────────────────────────┐
│              資料表設計檢查清單                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  □ 欄位設計                                                     │
│    ├── 資料類型是否適當？                                       │
│    ├── 長度是否足夠？                                           │
│    ├── 是否允許 NULL？                                          │
│    └── 預設值是否合理？                                         │
│                                                                 │
│  □ 索引設計                                                     │
│    ├── 主鍵是否定義？                                           │
│    ├── 查詢欄位是否有索引？                                     │
│    ├── 索引是否過多？                                           │
│    └── 複合索引順序是否正確？                                   │
│                                                                 │
│  □ 限制條件                                                     │
│    ├── 唯一性限制 (Unique)                                      │
│    ├── 外鍵關聯 (Foreign Key)                                   │
│    ├── 檢查條件 (Check)                                         │
│    └── 預設值 (Default)                                         │
│                                                                 │
│  □ 效能考量                                                     │
│    ├── 預估資料量                                               │
│    ├── 成長率預估                                               │
│    ├── 查詢頻率分析                                             │
│    └── 維護作業規劃                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 五、總結

### 本課程重點回顧

✅ **DB2**: Mainframe 關聯式資料庫

✅ **SQL**: SELECT, INSERT, UPDATE, DELETE

✅ **Embedded SQL**: COBOL 中的 SQL 語法

✅ **SQLCODE**: 執行結果碼

✅ **BA 關注點**: 欄位設計、索引、限制條件

---

*課程版本: 1.0 | 更新日期: 2026-04-12*
