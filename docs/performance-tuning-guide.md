# 效能調校指南

> 銀行 Mainframe 系統效能優化與調校實務

---

## 一、效能評估指標

### 1.1 關鍵效能指標 (KPI)

| 指標 | 說明 | 目標值 |
|-----|------|--------|
| **回應時間** | Online 交易回應時間 | < 3 秒 |
| **吞吐量** | 每秒交易數 (TPS) | > 100 |
| **CPU 時間** | 批次程式 CPU 使用率 | < 80% |
| **I/O 等待** | I/O 等待時間比例 | < 20% |
| **記憶體使用** | 記憶體使用率 | < 70% |
| **命中率** | Buffer Pool 命中率 | > 95% |

### 1.2 效能監控工具

```
┌─────────────────────────────────────────────────────────────┐
│                    效能監控工具                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  RMF (Resource Measurement Facility)                        │
│  ├── Monitor I (短期監控)                                   │
│  ├── Monitor II (長期報表)                                  │
│  └── Monitor III (互動式分析)                               │
│                                                             │
│  SMF (System Management Facility)                           │
│  ├── SMF Type 30 (通用)                                     │
│  ├── SMF Type 70-79 (CPU/記憶體)                           │
│  └── SMF Type 100 (DB2)                                     │
│                                                             │
│  CICS 監控                                                  │
│  ├── CICSPlex SM                                            │
│  ├── CICS Performance Analyzer                              │
│  └── CICS Explorer                                          │
│                                                             │
│  DB2 監控                                                   │
│  ├── DB2 Performance Monitor                                │
│  ├── DB2 Accounting Trace                                   │
│  └── DB2 Statistics Trace                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 二、COBOL 程式效能優化

### 2.1 資料型態選擇

| 型態 | 優點 | 缺點 | 建議 |
|-----|------|------|------|
| `COMP-3` | 精確計算、省空間 | CPU 密集 | 財務計算首選 |
| `COMP` (Binary) | 快速計算 | 精度限制 | 計數器、索引 |
| `DISPLAY` | 可讀性高 | 佔空間、慢 | 報表輸出 |
| `COMP-1/2` | 浮點快速 | 精度問題 | 科學計算 |

```cobol
       01  WS-COUNTER            PIC S9(09) COMP.     <-- 計數器用 Binary
       01  WS-AMOUNT             PIC S9(13)V99 COMP-3. <-- 金額用 Packed
       01  WS-FLAG               PIC X(01).            <-- 旗標用 Character
```

### 2.2 表格搜尋優化

```cobol
       01  WS-TABLE.
           05  WS-TABLE-ITEM OCCURS 1000 TIMES
                            ASCENDING KEY IS WS-ITEM-CODE
                            INDEXED BY WS-IDX.
               10  WS-ITEM-CODE    PIC X(05).
               10  WS-ITEM-NAME    PIC X(30).
               10  WS-ITEM-RATE    PIC S9(03)V999 COMP-3.
       
       PROCEDURE DIVISION.
      * 方式 1：循序搜尋 (慢)
       1000-SEARCH-SEQUENTIAL.
           PERFORM VARYING WS-IDX FROM 1 BY 1
                   UNTIL WS-IDX > 1000
               IF WS-ITEM-CODE(WS-IDX) = INPUT-CODE
                   MOVE WS-ITEM-NAME(WS-IDX) TO OUTPUT-NAME
                   EXIT PERFORM
               END-IF
           END-PERFORM.
       
      * 方式 2：二元搜尋 (快，表格必須已排序)
       2000-SEARCH-BINARY.
           SEARCH ALL WS-TABLE-ITEM
               AT END
                   MOVE 'NOT FOUND' TO OUTPUT-NAME
               WHEN WS-ITEM-CODE(WS-IDX) = INPUT-CODE
                   MOVE WS-ITEM-NAME(WS-IDX) TO OUTPUT-NAME
           END-SEARCH.
       
      * 方式 3：使用 INDEX (最快)
       3000-SEARCH-INDEX.
           SET WS-IDX TO 1
           SEARCH WS-TABLE-ITEM
               AT END
                   MOVE 'NOT FOUND' TO OUTPUT-NAME
               WHEN WS-ITEM-CODE(WS-IDX) = INPUT-CODE
                   MOVE WS-ITEM-NAME(WS-IDX) TO OUTPUT-NAME
           END-SEARCH.
```

### 2.3 檔案存取優化

```cobol
      * 優化 1：使用 Block 讀取
       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT INPUT-FILE
               ASSIGN TO INPUTDD
               ORGANIZATION IS SEQUENTIAL
               BLOCK CONTAINS 0 RECORDS.  <-- 0 表示系統決定最佳值
       
      * 優化 2：緩衝讀取
       FILE SECTION.
       FD  INPUT-FILE
           BLOCK CONTAINS 0 RECORDS
           RECORD CONTAINS 100 CHARACTERS
           DATA RECORD IS INPUT-RECORD.
       
      * 優化 3：減少 I/O 次數
       PROCEDURE DIVISION.
       0000-MAIN.
           OPEN INPUT INPUT-FILE
           
      *    讀取整批資料到記憶體處理
           PERFORM UNTIL WS-EOF
               READ INPUT-FILE
                   AT END
                       SET WS-EOF TO TRUE
                   NOT AT END
                       ADD 1 TO WS-COUNT
                       MOVE INPUT-RECORD TO WS-BUFFER(WS-COUNT)
               END-READ
           END-PERFORM
           
      *    在記憶體中處理
           PERFORM VARYING WS-I FROM 1 BY 1
                   UNTIL WS-I > WS-COUNT
               PROCESS WS-BUFFER(WS-I)
           END-PERFORM
           
           CLOSE INPUT-FILE.
```

### 2.4 字串處理優化

```cobol
      * 避免：多次小量移動
       MOVE WS-FIELD-1 TO OUTPUT-FIELD.
       MOVE WS-FIELD-2 TO OUTPUT-FIELD(11:10).
       MOVE WS-FIELD-3 TO OUTPUT-FIELD(21:10).
       
      * 建議：一次大量移動
       STRING WS-FIELD-1 DELIMITED BY SIZE
              WS-FIELD-2 DELIMITED BY SIZE
              WS-FIELD-3 DELIMITED BY SIZE
         INTO OUTPUT-FIELD
       END-STRING.
       
      * 或使用 UNSTRING
       UNSTRING INPUT-FIELD
           DELIMITED BY ','
           INTO WS-FIELD-1
                WS-FIELD-2
                WS-FIELD-3
       END-UNSTRING.
```

### 2.5 算術運算優化

```cobol
      * 避免：重複計算
       COMPUTE WS-RESULT = (WS-A + WS-B) / WS-C + (WS-A + WS-B) / WS-D.
       
      * 建議：先計算共同部分
       COMPUTE WS-SUM = WS-A + WS-B
       COMPUTE WS-RESULT = WS-SUM / WS-C + WS-SUM / WS-D.
       
      * 使用 ADD/SUBTRACT/MULTIPLY/DIVIDE 比 COMPUTE 快
       ADD WS-A TO WS-B GIVING WS-C.      <-- 較快
       COMPUTE WS-C = WS-A + WS-B.         <-- 較慢
       
      * 整數運算比浮點快
       ADD 1 TO WS-COUNTER.                <-- 快
       COMPUTE WS-COUNTER = WS-COUNTER + 1. <-- 較慢
```

---

## 三、VSAM 效能優化

### 3.1 CI 大小選擇

| 記錄大小 | 建議 CI 大小 | 說明 |
|---------|-------------|------|
| < 100 bytes | 512 | 小記錄，小 CI |
| 100-500 bytes | 2048 | 一般記錄 |
| 500-1000 bytes | 4096 | 大記錄 |
| > 1000 bytes | 8192 | 超大記錄 |

```jcl
//DEFINE   EXEC PGM=IDCAMS
//SYSPRINT DD SYSOUT=*
//SYSIN    DD *
  DEFINE CLUSTER (NAME(DAS.ACCOUNT.MASTER) -
                  RECORDSIZE(500 500) -
                  CISZ(4096) -           <-- 根據記錄大小選擇
                  KEYS(12 0) -
                  FREESPACE(10 10)) -
    DATA (NAME(DAS.ACCOUNT.MASTER.DATA)) -
    INDEX (NAME(DAS.ACCOUNT.MASTER.INDEX))
/*
//
```

### 3.2 緩衝區設定

```jcl
// 增加緩衝區數量
//VSAMSTEP EXEC PGM=MYPROG
//ACCTMST  DD DSN=DAS.ACCOUNT.MASTER,DISP=SHR,
//             AMP=('BUFND=5,BUFNI=5')    <-- 資料緩衝 5，索引緩衝 5
//

// 或使用 BUFSP (緩衝區空間)
//VSAMSTEP EXEC PGM=MYPROG
//ACCTMST  DD DSN=DAS.ACCOUNT.MASTER,DISP=SHR,
//             AMP=('BUFSP=32768')        <-- 總緩衝空間 32KB
//
```

### 3.3 存取模式選擇

```cobol
      * 循序存取 (大量資料)
       FILE-CONTROL.
           SELECT ACCOUNT-FILE
               ASSIGN TO ACCTMST
               ORGANIZATION IS INDEXED
               ACCESS MODE IS SEQUENTIAL.  <-- 批次處理
       
      * 隨機存取 (單筆查詢)
       FILE-CONTROL.
           SELECT ACCOUNT-FILE
               ASSIGN TO ACCTMST
               ORGANIZATION IS INDEXED
               ACCESS MODE IS RANDOM.      <-- 線上交易
       
      * 動態存取 (混合使用)
       FILE-CONTROL.
           SELECT ACCOUNT-FILE
               ASSIGN TO ACCTMST
               ORGANIZATION IS INDEXED
               ACCESS MODE IS DYNAMIC.     <-- 兩者都有
```

---

## 四、DB2 效能優化

### 4.1 SQL 最佳化

```sql
-- 避免：SELECT *
SELECT * FROM ACCOUNT_MASTER WHERE ACCT_NO = '000123456789';

-- 建議：只選需要的欄位
SELECT CUST_ID, CURRENT_BAL, ACCT_STATUS
FROM ACCOUNT_MASTER 
WHERE ACCT_NO = '000123456789';

-- 避免：在 WHERE 中使用函數
SELECT * FROM ACCOUNT_MASTER 
WHERE SUBSTR(ACCT_NO, 1, 3) = '000';

-- 建議：使用 LIKE 或範圍
SELECT * FROM ACCOUNT_MASTER 
WHERE ACCT_NO LIKE '000%';

-- 或
SELECT * FROM ACCOUNT_MASTER 
WHERE ACCT_NO BETWEEN '000000000000' AND '000999999999';

-- 避免：NOT IN (子查詢)
SELECT * FROM ACCOUNT_MASTER 
WHERE ACCT_NO NOT IN (SELECT ACCT_NO FROM CLOSED_ACCOUNTS);

-- 建議：使用 LEFT JOIN 或 NOT EXISTS
SELECT A.* FROM ACCOUNT_MASTER A
LEFT JOIN CLOSED_ACCOUNTS C ON A.ACCT_NO = C.ACCT_NO
WHERE C.ACCT_NO IS NULL;

-- 避免：OR 條件導致 Index 失效
SELECT * FROM ACCOUNT_MASTER 
WHERE ACCT_TYPE = 'SAVINGS' OR BRANCH_CODE = '0001';

-- 建議：使用 UNION ALL
SELECT * FROM ACCOUNT_MASTER WHERE ACCT_TYPE = 'SAVINGS'
UNION ALL
SELECT * FROM ACCOUNT_MASTER WHERE BRANCH_CODE = '0001';
```

### 4.2 索引使用策略

```sql
-- 建立適當的索引
CREATE INDEX IX_ACCT_CUST 
ON ACCOUNT_MASTER (CUST_ID) 
CLUSTER;                          -- 叢集索引

CREATE INDEX IX_ACCT_STATUS 
ON ACCOUNT_MASTER (ACCT_STATUS, BRANCH_CODE);

CREATE UNIQUE INDEX IX_ACCT_PK 
ON ACCOUNT_MASTER (ACCT_NO);

-- 覆蓋索引 (Covering Index)
CREATE INDEX IX_ACCT_COVER 
ON ACCOUNT_MASTER (ACCT_NO, CUST_ID, CURRENT_BAL);
-- 此索引包含查詢所需的所有欄位，避免回表查詢
```

### 4.3 鎖定策略

```sql
-- 讀取時不鎖定 (WITH UR)
SELECT * FROM ACCOUNT_MASTER 
WHERE ACCT_NO = '000123456789'
WITH UR;                          -- Uncommitted Read

-- 游標穩定性 (CS)
SELECT * FROM ACCOUNT_MASTER 
WHERE ACCT_NO = '000123456789'
WITH CS;                          -- Cursor Stability (預設)

-- 讀取穩定性 (RS)
SELECT * FROM ACCOUNT_MASTER 
WHERE BRANCH_CODE = '0001'
WITH RS;                          -- Read Stability

-- 可重複讀 (RR)
SELECT * FROM ACCOUNT_MASTER 
WHERE BRANCH_CODE = '0001'
WITH RR;                          -- Repeatable Read
```

### 4.4 批次 SQL 優化

```cobol
      * 優化 1：使用 Multi-Row Fetch
           EXEC SQL
               DECLARE C1 CURSOR FOR
               SELECT ACCT_NO, CUST_ID, CURRENT_BAL
               FROM   ACCOUNT_MASTER
               WHERE  BRANCH_CODE = :WS-BRANCH
               FOR    FETCH ONLY
               WITH   UR
           END-EXEC
           
           EXEC SQL
               OPEN C1
           END-EXEC
           
           PERFORM UNTIL SQLCODE NOT = 0
               EXEC SQL
                   FETCH C1 FOR 100 ROWS     <-- 一次取 100 筆
                   INTO   :HV-ACCT-NO,
                          :HV-CUST-ID,
                          :HV-BALANCE
               END-EXEC
               
               IF SQLCODE = 0 OR SQLCODE = +100
                   PERFORM PROCESS-ROWS
               END-IF
           END-PERFORM
       
      * 優化 2：使用 Multi-Row Insert
           EXEC SQL
               INSERT INTO ACCOUNT_MASTER
                   (ACCT_NO, CUST_ID, CURRENT_BAL, OPEN_DATE)
               VALUES 
                   (:HV-ACCT-NO(1), :HV-CUST-ID(1), :HV-BALANCE(1), CURRENT_DATE),
                   (:HV-ACCT-NO(2), :HV-CUST-ID(2), :HV-BALANCE(2), CURRENT_DATE),
                   (:HV-ACCT-NO(3), :HV-CUST-ID(3), :HV-BALANCE(3), CURRENT_DATE)
           END-EXEC
```

---

## 五、CICS 效能優化

### 5.1 程式設計最佳實務

```cobol
      * 優化 1：減少 CICS 指令呼叫次數
      * 避免：多次小量 SEND
           EXEC CICS SEND TEXT FROM(WS-LINE1) END-EXEC
           EXEC CICS SEND TEXT FROM(WS-LINE2) END-EXEC
           EXEC CICS SEND TEXT FROM(WS-LINE3) END-EXEC
       
      * 建議：一次大量 SEND
           STRING WS-LINE1 DELIMITED BY SIZE
                  WS-LINE2 DELIMITED BY SIZE
                  WS-LINE3 DELIMITED BY SIZE
             INTO WS-BIG-BUFFER
           EXEC CICS SEND TEXT FROM(WS-BIG-BUFFER) END-EXEC
       
      * 優化 2：使用 COMMAREA 傳遞資料
           EXEC CICS LINK PROGRAM('SUBPROG')
               COMMAREA(WS-COMMAREA)
               LENGTH(LENGTH OF WS-COMMAREA)
           END-EXEC
       
      * 優化 3：減少檔案讀取
      * 使用 TSQ 暫存資料
           EXEC CICS WRITEQ TS
               QUEUE('TEMPQ')
               FROM(WS-DATA)
               LENGTH(LENGTH OF WS-DATA)
           END-EXEC
       
           EXEC CICS READQ TS
               QUEUE('TEMPQ')
               INTO(WS-DATA)
               LENGTH(LENGTH OF WS-DATA)
           END-EXEC
```

### 5.2 交易設計原則

| 原則 | 說明 | 範例 |
|-----|------|------|
| **短交易** | 減少資源鎖定時間 | 查詢後立即 SYNCPOINT |
| **最小化資料** | 只讀取需要的欄位 | 避免 SELECT * |
| **避免長時間等待** | 使用者輸入時釋放資源 | 使用 RETURN 等待輸入 |
| **批次處理** | 大量資料用批次而非線上 | 日終批次處理 |

---

## 六、批次作業效能調校

### 6.1 JCL 優化參數

```jcl
// 優化 1：適當的 REGION 設定
//STEP1    EXEC PGM=MYPROG,
//             REGION=8M              <-- 根據程式需求設定

// 優化 2：使用 BUFNO 增加緩衝區
//INPUT    DD DSN=DAS.INPUT.FILE,DISP=SHR,
//             BUFNO=20               <-- 增加緩衝區數量

// 優化 3：使用較大的 Block Size
//OUTPUT   DD DSN=DAS.OUTPUT.FILE,DISP=(NEW,CATLG),
//             DCB=(RECFM=FB,LRECL=100,BLKSIZE=27900)  <-- 接近半軌

// 優化 4：使用 HSM 管理資料集
//INPUT    DD DSN=DAS.INPUT.FILE,DISP=SHR,
//             MGMTCLAS=STANDARD      <-- 使用儲存管理類別
```

### 6.2 SORT 效能調校

```jcl
// 優化 1：使用 DYNALLOC 動態分配工作空間
//SORT     EXEC PGM=SORT
//SYSOUT   DD SYSOUT=*
//SORTIN   DD DSN=DAS.INPUT.FILE,DISP=SHR
//SORTOUT  DD DSN=DAS.OUTPUT.FILE,DISP=(NEW,CATLG)
//SYSIN    DD *
  SORT FIELDS=(1,12,CH,A)
  OPTION DYNALLOC=(SYSDA,10)       <-- 動態分配 10 個工作檔
/*

// 優化 2：使用 FILSZ 預估檔案大小
//SYSIN    DD *
  SORT FIELDS=(1,12,CH,A)
  OPTION FILSZ=E1000000            <-- 預估 100 萬筆記錄
/*

// 優化 3：使用 ZDPRINT 壓縮輸出
//SYSIN    DD *
  SORT FIELDS=(1,12,CH,A)
  OUTREC ZDPRINT                   <-- 壓縮數字欄位
/*
```

---

## 七、系統層級調校

### 7.1 Buffer Pool 調校

```
DB2 Buffer Pool 設定：

BP0  - 系統目錄 (4K pages)
BP1  - 使用者資料 (4K pages)
BP2  - 使用者資料 (8K pages)
BP3  - 使用者資料 (16K pages)
BP4  - 使用者資料 (32K pages)

調校建議：
- 命中率 > 95%
- 若命中率低，增加 Buffer Pool 大小
- 使用 PAGE STEALING ALGORITHM = LRU
```

### 7.2 CICS Region 調校

```
CICS Region 參數：

DSALIM   = 50M        (DSA 限制)
EDSA     = 100M       (Extended DSA)
MAXTASK  = 100        (最大並行交易數)
MXT      = 200        (最大交易數)

程式調校：
- 使用 RE-ENTRANT 程式
- 使用 RENT 編譯選項
- 使用 NORES 釋放不用的程式
```

---

## 八、效能監控與報表

### 8.1 RMF 報表解讀

```
RMF CPU Activity Report:

CPU BUSY:  75%        <-- CPU 使用率
  - USER:  45%        <-- 使用者時間
  - SYS:   25%        <-- 系統時間
  - WAIT:   5%        <-- 等待時間

建議：
- CPU < 70%：良好
- CPU 70-85%：注意
- CPU > 85%：需要調校
```

### 8.2 DB2 Accounting Report

```
DB2 Accounting Report:

ELAPSED TIME:     2.5 seconds
CPU TIME:         0.8 seconds
WAIT TIME:        1.7 seconds
  - I/O WAIT:     1.2 seconds
  - LOCK WAIT:    0.3 seconds
  - OTHER:        0.2 seconds

GETPAGES:         1,500
BUFFER HIT RATIO: 97%

建議：
- 若 I/O WAIT 高：增加 Buffer Pool
- 若 LOCK WAIT 高：檢查交易隔離等級
```

---

## 九、效能問題診斷流程

```
┌─────────────┐
│  發現效能問題 │ ← 使用者抱怨 / 監控告警
└──────┬──────┘
       ▼
┌─────────────┐
│  收集數據   │ ← RMF/SMF/DB2 Trace
└──────┬──────┘
       ▼
┌─────────────┐
│  分析瓶頸   │ ← CPU/I/O/記憶體/鎖定
└──────┬──────┘
       ▼
┌─────────────┐
│  定位問題   │ ← 特定程式/交易/SQL
└──────┬──────┘
       ▼
┌─────────────┐
│  制定方案   │ ← 程式優化/系統調校
└──────┬──────┘
       ▼
┌─────────────┐
│  測試驗證   │ ← 測試環境驗證
└──────┬──────┘
       ▼
┌─────────────┐
│  部署上線   │ ← 變更管理流程
└──────┬──────┘
       ▼
┌─────────────┐
│  持續監控   │ ← 確認改善效果
└─────────────┘
```

---

## 十、練習題目

### 題目 1：優化一個慢查詢

原始 SQL：
```sql
SELECT * FROM TRANSACTION_LOG 
WHERE TXN_DATE BETWEEN '20240101' AND '20240131'
ORDER BY TXN_AMOUNT DESC;
```

問題：
- 此查詢執行時間超過 30 秒
- 表格有 1000 萬筆記錄

請提出優化方案。

### 題目 2：批次程式效能調校

原始程式：
```cobol
       PERFORM UNTIL WS-EOF
           READ INPUT-FILE
           PERFORM 1000-PROCESS
           WRITE OUTPUT-FILE
       END-PERFORM
```

問題：
- 處理 100 萬筆記錄需要 2 小時
- I/O 等待時間佔 80%

請提出優化方案。

### 題目 3：CICS 交易回應時間優化

問題：
- 查詢交易平均回應時間 5 秒
- 目標是 < 3 秒
- 使用 VSAM KSDS 檔案

請提出調校建議。

---

## 十一、效能調校檢查清單

```
COBOL 程式檢查：
□ 使用適當的資料型態 (COMP-3, COMP)
□ 表格使用二元搜尋 (SEARCH ALL)
□ 減少 I/O 次數 (Block 讀取)
□ 避免重複計算
□ 字串處理優化

VSAM 檢查：
□ CI 大小適當
□ 緩衝區設定合理
□ 存取模式正確
□ 索引維護良好

DB2 檢查：
□ SQL 使用索引
□ 避免全表掃描
□ 適當的鎖定等級
□ Buffer Pool 命中率 > 95%

CICS 檢查：
□ 交易時間短
□ 減少 CICS 指令呼叫
□ 使用 COMMAREA 傳遞資料
□ 適當的 SYNCPOINT

批次檢查：
□ REGION 設定適當
□ Block Size 最佳化
□ SORT 參數調校
□ 排程時間合理
```

---

*文件版本：v1.0*
*更新日期：2026-04-06*
*作者：Claw (AI Assistant)*