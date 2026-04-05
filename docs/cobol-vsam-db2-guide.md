# VSAM 與 DB2 資料庫操作詳解

> 銀行核心系統資料存取技術完整指南

---

## 一、VSAM 檔案系統

### 1.1 VSAM 概覽

VSAM (Virtual Storage Access Method) 是 IBM Mainframe 上最常用的檔案系統。

```
┌─────────────────────────────────────────────────────────────┐
│                     VSAM 組織類型                            │
├─────────────────────────────────────────────────────────────┤
│  KSDS  │ Key-Sequenced Data Set - 索引順序檔，支援隨機存取   │
│        │ 用途：帳戶主檔、客戶主檔                           │
├─────────────────────────────────────────────────────────────┤
│  ESDS  │ Entry-Sequenced Data Set - 順序檔，依寫入順序       │
│        │ 用途：交易日誌、系統日誌                           │
├─────────────────────────────────────────────────────────────┤
│  RRDS  │ Relative Record Data Set - 相對記錄檔，用 RRN 存取  │
│        │ 用途：固定格式表格資料                             │
├─────────────────────────────────────────────────────────────┤
│  LDS   │ Linear Data Set - 線性資料集，用於 DB2 等子系統     │
│        │ 用途：DB2 資料表空間                               │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 KSDS 結構詳解

```
┌─────────────────────────────────────────────────────────────┐
│                    KSDS 檔案結構                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   索引元件 (Index Component)                                 │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐                │
│   │ Key: 001│───→│ Key: 100│───→│ Key: 200│───→ ...        │
│   │ RBA: 0  │    │ RBA: 512│    │ RBA:1024│                  │
│   └─────────┘    └─────────┘    └─────────┘                │
│        │                                                      │
│        └────────────────────────────────────────┐             │
│                                                 │             │
│   資料元件 (Data Component)                     │             │
│   ┌─────────────────────────────────────────────┴─────────┐  │
│   │ CI (Control Interval)                                  │  │
│   │ ┌────────┬────────┬────────┬────────┬────────┐       │  │
│   │ │Record 1│Record 2│Record 3│  Free  │CI Ctrl │       │  │
│   │ │ Key:001│ Key:002│ Key:003│ Space  │ Info   │       │  │
│   │ │ RBA: 0 │ RBA:100│ RBA:200│        │        │       │  │
│   │ └────────┴────────┴────────┴────────┴────────┘       │  │
│   │                                                        │  │
│   │ CA (Control Area) = 多個 CI                            │  │
│   └────────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 COBOL VSAM 程式範例

#### 範例 1：KSDS 隨機讀取

```cobol
       IDENTIFICATION DIVISION.
       PROGRAM-ID. VSAMREAD.
      *-----------------------------------------------------------
      * VSAM KSDS 隨機讀取範例
      * 功能：查詢帳戶主檔
      *-----------------------------------------------------------
       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT ACCOUNT-FILE
               ASSIGN TO ACCTMST
               ORGANIZATION IS INDEXED
               ACCESS MODE IS RANDOM
               RECORD KEY IS ACCT-NO
               FILE STATUS IS WS-FILE-STATUS.
       
       DATA DIVISION.
       FILE SECTION.
       FD  ACCOUNT-FILE.
       01  ACCOUNT-RECORD.
           05  ACCT-NO             PIC X(12).
           05  ACCT-NAME           PIC X(30).
           05  ACCT-BALANCE        PIC S9(13)V99 COMP-3.
           05  FILLER              PIC X(445).
       
       WORKING-STORAGE SECTION.
       01  WS-FILE-STATUS         PIC X(02).
           88  WS-SUCCESS         VALUE '00'.
           88  WS-EOF             VALUE '10'.
           88  WS-NOT-FOUND       VALUE '23'.
       
       01  WS-SEARCH-KEY          PIC X(12).
       
       PROCEDURE DIVISION.
       0000-MAIN.
           OPEN INPUT ACCOUNT-FILE
           
           MOVE '000123456789' TO WS-SEARCH-KEY
           PERFORM 1000-READ-ACCOUNT
           
           CLOSE ACCOUNT-FILE
           GOBACK.
       
       1000-READ-ACCOUNT.
           MOVE WS-SEARCH-KEY TO ACCT-NO
           
           READ ACCOUNT-FILE
               INVALID KEY
                   DISPLAY '帳號 ' WS-SEARCH-KEY ' 不存在'
               NOT INVALID KEY
                   DISPLAY '帳號：' ACCT-NO
                   DISPLAY '姓名：' ACCT-NAME
                   DISPLAY '餘額：' ACCT-BALANCE
           END-READ.
```

#### 範例 2：KSDS 循序讀取

```cobol
       FILE-CONTROL.
           SELECT ACCOUNT-FILE
               ASSIGN TO ACCTMST
               ORGANIZATION IS INDEXED
               ACCESS MODE IS SEQUENTIAL
               RECORD KEY IS ACCT-NO
               FILE STATUS IS WS-FILE-STATUS.
       
       PROCEDURE DIVISION.
       0000-MAIN.
           OPEN INPUT ACCOUNT-FILE
           
      *    從特定 Key 開始讀取
           MOVE '000100000000' TO ACCT-NO
           START ACCOUNT-FILE
               KEY NOT LESS THAN ACCT-NO
               INVALID KEY
                   DISPLAY '開始位置無效'
               NOT INVALID KEY
                   PERFORM 1000-READ-ALL
           END-START
           
           CLOSE ACCOUNT-FILE
           GOBACK.
       
       1000-READ-ALL.
           PERFORM UNTIL WS-EOF
               READ ACCOUNT-FILE NEXT
                   AT END
                       SET WS-EOF TO TRUE
                   NOT AT END
                       DISPLAY ACCT-NO ' ' ACCT-NAME
               END-READ
           END-PERFORM.
```

#### 範例 3：KSDS 更新與刪除

```cobol
       FILE-CONTROL.
           SELECT ACCOUNT-FILE
               ASSIGN TO ACCTMST
               ORGANIZATION IS INDEXED
               ACCESS MODE IS RANDOM
               RECORD KEY IS ACCT-NO
               FILE STATUS IS WS-FILE-STATUS.
       
       PROCEDURE DIVISION.
       0000-MAIN.
           OPEN I-O ACCOUNT-FILE
           
      *    更新記錄
           MOVE '000123456789' TO ACCT-NO
           READ ACCOUNT-FILE
               INVALID KEY
                   DISPLAY '記錄不存在'
               NOT INVALID KEY
                   ADD 1000 TO ACCT-BALANCE
                   REWRITE ACCOUNT-RECORD
                       INVALID KEY
                           DISPLAY '更新失敗'
                       NOT INVALID KEY
                           DISPLAY '更新成功'
                   END-REWRITE
           END-READ
           
      *    刪除記錄
           MOVE '000987654321' TO ACCT-NO
           DELETE ACCOUNT-FILE RECORD
               INVALID KEY
                   DISPLAY '刪除失敗'
               NOT INVALID KEY
                   DISPLAY '刪除成功'
           END-DELETE
           
           CLOSE ACCOUNT-FILE
           GOBACK.
```

#### 範例 4：KSDS 新增記錄

```cobol
       FILE-CONTROL.
           SELECT ACCOUNT-FILE
               ASSIGN TO ACCTMST
               ORGANIZATION IS INDEXED
               ACCESS MODE IS RANDOM
               RECORD KEY IS ACCT-NO
               FILE STATUS IS WS-FILE-STATUS.
       
       PROCEDURE DIVISION.
       0000-MAIN.
           OPEN I-O ACCOUNT-FILE
           
      *    寫入新記錄
           MOVE '000111222333' TO ACCT-NO
           MOVE '張三' TO ACCT-NAME
           MOVE 50000 TO ACCT-BALANCE
           
           WRITE ACCOUNT-RECORD
               INVALID KEY
                   DISPLAY '寫入失敗 - Key 可能已存在'
               NOT INVALID KEY
                   DISPLAY '新增成功'
           END-WRITE
           
           CLOSE ACCOUNT-FILE
           GOBACK.
```

### 1.4 VSAM File Status 代碼

| Status | 說明 | 處理建議 |
|--------|------|---------|
| 00 | 成功 | 繼續處理 |
| 02 | 成功，但有重複 Key (非唯一) | 檢查資料一致性 |
| 04 | 成功，但記錄長度不符 | 檢查 Copybook |
| 10 | End of File | 正常結束 |
| 22 | 寫入失敗 - Key 重複 | 檢查是否已存在 |
| 23 | 讀取失敗 - Key 不存在 | 確認 Key 正確性 |
| 30 | I/O 錯誤 | 檢查檔案權限/空間 |

### 1.5 IDCAMS 管理指令

```jcl
//DEFINEKS JOB 'DEFINE VSAM'
//STEP1    EXEC PGM=IDCAMS
//SYSPRINT DD SYSOUT=*
//SYSIN    DD *
  DEFINE CLUSTER ( -
    NAME(DAS.ACCOUNT.MASTER) -
    VOLUMES(DASD01) -
    RECORDSIZE(500 500) -
    KEYS(12 0) -
    FREESPACE(10 10) -
    CISZ(4096) -
    SHR(2 3) )
  DATA ( -
    NAME(DAS.ACCOUNT.MASTER.DATA) )
  INDEX ( -
    NAME(DAS.ACCOUNT.MASTER.INDEX) )
/*
//
```

**參數說明：**
- `RECORDSIZE(500 500)`：平均與最大記錄長度
- `KEYS(12 0)`：Key 長度 12 bytes，從位置 0 開始
- `FREESPACE(10 10)`：每個 CI 和 CA 保留 10% 空間
- `CISZ(4096)`：Control Interval 大小
- `SHR(2 3)`：跨系統共享選項

---

## 二、DB2 資料庫操作

### 2.1 DB2 架構概覽

```
┌─────────────────────────────────────────────────────────────┐
│                      DB2 系統架構                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   應用程式層                                                 │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐                    │
│   │  CICS   │  │  Batch  │  │  TSO    │                    │
│   │ Online  │  │ Program │  │ User    │                    │
│   └────┬────┘  └────┬────┘  └────┬────┘                    │
│        │            │            │                          │
│        └────────────┼────────────┘                          │
│                     │                                       │
│   DB2 子系統        ▼                                       │
│   ┌─────────────────────────────────────────────┐          │
│   │              DB2 Address Space               │          │
│   │  ┌─────────┐  ┌─────────┐  ┌─────────┐     │          │
│   │  │  IRLM   │  │  RDS    │  │  Buffer │     │          │
│   │  │ (Lock)  │  │ (SQL)   │  │  Pool   │     │          │
│   │  └─────────┘  └─────────┘  └─────────┘     │          │
│   └─────────────────────────────────────────────┘          │
│                     │                                       │
│                     ▼                                       │
│   儲存層            ┌─────────────────────────────┐          │
│                     │      VSAM LDS / SMS         │          │
│                     │    (Table Space / Index)    │          │
│                     └─────────────────────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 COBOL DB2 程式結構

#### 基本結構範例

```cobol
       IDENTIFICATION DIVISION.
       PROGRAM-ID. DB2SAMP.
      *-----------------------------------------------------------
      * DB2 程式基本結構範例
      *-----------------------------------------------------------
       ENVIRONMENT DIVISION.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       
      *    SQL 通訊區 - 必須包含
           EXEC SQL
               INCLUDE SQLCA
           END-EXEC.
       
      *    DCLGEN 產生的表格定義
           EXEC SQL
               INCLUDE ACCTDCL
           END-EXEC.
       
      *    主變數宣告 (Host Variables)
       01  HV-ACCT-NO            PIC X(12).
       01  HV-CUST-ID            PIC X(10).
       01  HV-BALANCE            PIC S9(13)V99 COMP-3.
       01  HV-COUNT              PIC S9(09) COMP.
       
      *    指示變數 (Indicator Variables) - 處理 NULL
       01  IND-BALANCE           PIC S9(04) COMP.
       
       PROCEDURE DIVISION.
       0000-MAIN.
           PERFORM 1000-CONNECT
           PERFORM 2000-PROCESS
           PERFORM 3000-DISCONNECT
           GOBACK.
       
       1000-CONNECT.
      *    連接 DB2 子系統
           EXEC SQL
               CONNECT TO DASDB
           END-EXEC
           
           IF SQLCODE NOT = 0
               DISPLAY 'DB2 連接失敗: ' SQLCODE
               MOVE 12 TO RETURN-CODE
               GOBACK
           END-IF.
       
       2000-PROCESS.
      *    執行 SQL 操作
           PERFORM 2100-SELECT-SINGLE
           PERFORM 2200-INSERT-RECORD
           PERFORM 2300-UPDATE-RECORD.
       
       2100-SELECT-SINGLE.
      *    單筆查詢
           MOVE '000123456789' TO HV-ACCT-NO
           
           EXEC SQL
               SELECT CUST_ID, CURRENT_BAL
               INTO   :HV-CUST-ID, :HV-BALANCE :IND-BALANCE
               FROM   ACCOUNT_MASTER
               WHERE  ACCT_NO = :HV-ACCT-NO
           END-EXEC
           
           EVALUATE SQLCODE
               WHEN 0
                   DISPLAY '客戶: ' HV-CUST-ID
                   IF IND-BALANCE < 0
                       DISPLAY '餘額為 NULL'
                   ELSE
                       DISPLAY '餘額: ' HV-BALANCE
                   END-IF
               WHEN 100
                   DISPLAY '查無資料'
               WHEN OTHER
                   DISPLAY 'SQL 錯誤: ' SQLCODE
           END-EVALUATE.
       
       2200-INSERT-RECORD.
      *    新增記錄
           MOVE '000999888777' TO HV-ACCT-NO
           MOVE 'C123456789' TO HV-CUST-ID
           MOVE 100000 TO HV-BALANCE
           
           EXEC SQL
               INSERT INTO ACCOUNT_MASTER
                   (ACCT_NO, CUST_ID, CURRENT_BAL, OPEN_DATE)
               VALUES
                   (:HV-ACCT-NO, :HV-CUST-ID, :HV-BALANCE, CURRENT_DATE)
           END-EXEC
           
           IF SQLCODE = 0
               DISPLAY '新增成功'
               EXEC SQL COMMIT END-EXEC
           ELSE
               DISPLAY '新增失敗: ' SQLCODE
               EXEC SQL ROLLBACK END-EXEC
           END-IF.
       
       2300-UPDATE-RECORD.
      *    更新記錄
           MOVE '000123456789' TO HV-ACCT-NO
           
           EXEC SQL
               UPDATE ACCOUNT_MASTER
               SET    CURRENT_BAL = CURRENT_BAL + 5000,
                      UPDATE_TIME = CURRENT_TIMESTAMP
               WHERE  ACCT_NO = :HV-ACCT-NO
           END-EXEC
           
           IF SQLCODE = 0
               DISPLAY '更新成功，筆數: ' SQLERRD(3)
               EXEC SQL COMMIT END-EXEC
           ELSE
               DISPLAY '更新失敗: ' SQLCODE
               EXEC SQL ROLLBACK END-EXEC
           END-IF.
       
       3000-DISCONNECT.
      *    斷開連接
           EXEC SQL
               CONNECT RESET
           END-EXEC.
```

### 2.3 游標 (Cursor) 處理

#### 宣告游標與逐筆處理

```cobol
       WORKING-STORAGE SECTION.
       
           EXEC SQL
               INCLUDE SQLCA
           END-EXEC.
       
           EXEC SQL
               INCLUDE ACCTDCL
           END-EXEC.
       
       01  WS-TOTAL-BALANCE       PIC S9(15)V99 COMP-3 VALUE 0.
       01  WS-RECORD-COUNT        PIC 9(09) COMP VALUE 0.
       01  WS-BRANCH-CODE         PIC X(04).
       
      *    游標宣告
           EXEC SQL
               DECLARE ACCT_CURSOR CURSOR FOR
               SELECT ACCT_NO, CUST_ID, CURRENT_BAL, CURRENCY
               FROM   ACCOUNT_MASTER
               WHERE  BRANCH_CODE = :WS-BRANCH-CODE
               AND    ACCT_STATUS = 'A'
               ORDER  BY CURRENT_BAL DESC
               FOR    FETCH ONLY
           END-EXEC.
       
       PROCEDURE DIVISION.
       0000-MAIN.
           MOVE '0001' TO WS-BRANCH-CODE
           
           PERFORM 1000-OPEN-CURSOR
           PERFORM 2000-FETCH-DATA
           PERFORM 3000-CLOSE-CURSOR
           PERFORM 4000-DISPLAY-SUMMARY
           
           GOBACK.
       
       1000-OPEN-CURSOR.
           EXEC SQL
               OPEN ACCT_CURSOR
           END-EXEC
           
           IF SQLCODE NOT = 0
               DISPLAY '游標開啟失敗: ' SQLCODE
               MOVE 12 TO RETURN-CODE
               GOBACK
           END-IF.
       
       2000-FETCH-DATA.
      *    逐筆讀取
           PERFORM UNTIL SQLCODE NOT = 0
               EXEC SQL
                   FETCH ACCT_CURSOR
                   INTO :ACCT-NO, :CUST-ID, :CURRENT-BAL, :CURRENCY
               END-EXEC
               
               IF SQLCODE = 0
                   ADD 1 TO WS-RECORD-COUNT
                   ADD CURRENT-BAL