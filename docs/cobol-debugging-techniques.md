# COBOL 程式除錯技巧與診斷

> 銀行 Mainframe 系統問題排查與除錯實務指南

---

## 一、除錯基礎概念

### 1.1 常見錯誤類型

```
┌─────────────────────────────────────────────────────────────┐
│                    COBOL 錯誤分類                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  編譯錯誤 (Compile Error)                                    │
│  ├── 語法錯誤 (Syntax Error)                                │
│  ├── 資料型態不符                                           │
│  └── COPYBOOK 不匹配                                        │
│                                                             │
│  執行錯誤 (Runtime Error)                                    │
│  ├── ABEND (Abnormal End)                                   │
│  │   ├── S0C7 (Data Exception)                              │
│  │   ├── S0C4 (Protection Exception)                        │
│  │   ├── S013 (I/O Error)                                   │
│  │   └── S322 (Time Out)                                    │
│  ├── File Status Error                                      │
│  └── SQLCODE Error                                          │
│                                                             │
│  邏輯錯誤 (Logic Error)                                      │
│  ├── 計算結果錯誤                                           │
│  ├── 流程控制錯誤                                           │
│  └── 資料處理錯誤                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 除錯流程

```
┌─────────────┐
│  發現問題   │ ← 使用者回報 / 批次失敗 / 測試失敗
└──────┬──────┘
       ▼
┌─────────────┐
│  收集資訊   │ ← SYSOUT / SYSUDUMP / JESYSMSG
└──────┬──────┘
       ▼
┌─────────────┐
│  定位問題   │ ← 錯誤代碼 / Dump 分析 / 追蹤程式碼
└──────┬──────┘
       ▼
┌─────────────┐
│  重現問題   │ ← 在測試環境重現
└──────┬──────┘
       ▼
┌─────────────┐
│  修正程式   │ ← 修改程式碼
└──────┬──────┘
       ▼
┌─────────────┐
│  驗證修正   │ ← 重新測試
└──────┬──────┘
       ▼
┌─────────────┐
│  部署上線   │ ← 正式環境更新
└─────────────┘
```

---

## 二、常見 ABEND 代碼詳解

### 2.1 S0C7 - 資料異常 (Data Exception)

**原因：**
- 嘗試對非數字資料進行算術運算
- COMP-3 資料格式錯誤
- 資料長度不足或 overflow

**範例：**
```cobol
       01  WS-FIELD-1          PIC X(05) VALUE 'ABCDE'.
       01  WS-FIELD-2          PIC 9(05) COMP-3.
       
       ADD WS-FIELD-1 TO WS-FIELD-2    *> S0C7！WS-FIELD-1 不是數字
```

**診斷方法：**
```
1. 檢查 Dump 中的 PSW (Program Status Word)
2. 找出錯誤指令的位址
3. 對照編譯器輸出的程式碼對照表
4. 檢查相關變數的內容
```

**Dump 分析範例：**
```
PSW AT ENTRY TO ABEND: 078D0000 8008A23E
  ILC: 06  INTC: 07

--> ILC (Instruction Length Code) = 06 表示 6-byte 指令
--> INTC (Interruption Code) = 07 表示 S0C7

REGISTERS AT ABEND:
  R0: 00000000   R1: 00000000   R2: 00000000   R3: 00000000
  R4: 00000000   R5: 00000000   R6: 00000000   R7: 00000000
  R8: 0008A200   R9: 0008A000  R10: 00000000  R11: 00000000
 R12: 00000000  R13: 00000000  R14: 00000000  R15: 00000000

--> 檢查 R8/R9 指向的記憶體區域
```

### 2.2 S0C4 - 保護異常 (Protection Exception)

**原因：**
- 存取未分配的記憶體
- 嘗試寫入唯讀區域
- 陣列索引超出範圍

**範例：**
```cobol
       01  WS-TABLE.
           05  WS-ITEM OCCURS 10 TIMES PIC X(10).
       
       MOVE 'DATA' TO WS-ITEM(15)       *> S0C4！超出 10 次
```

### 2.3 S013 - I/O 錯誤

**原因：**
- 檔案未開啟就讀寫
- DD 名稱錯誤或遺漏
- 檔案損毀
- 記錄長度不符

**診斷：**
```
檢查 JESYSMSG：
- IEC141I 013-34：開啟檔案失敗
- IEC150I 013-14：讀取錯誤

檢查 JCL：
- DD 名稱是否正確
- DSN 是否存在
- DISP 設定是否正確
```

### 2.4 S322 - 時間逾時

**原因：**
- 程式進入無窮迴圈
- 處理資料量過大
- 等待資源時間過長

**解決方案：**
```cobol
       01  WS-COUNTER            PIC 9(09) COMP-3 VALUE 0.
       01  WS-MAX-ITERATIONS     PIC 9(09) COMP-3 VALUE 1000000.
       
       PERFORM UNTIL WS-EOF OR WS-COUNTER > WS-MAX-ITERATIONS
           READ INPUT-FILE
               AT END
                   SET WS-EOF TO TRUE
               NOT AT END
                   ADD 1 TO WS-COUNTER
                   PERFORM PROCESS-RECORD
           END-READ
       END-PERFORM
       
       IF WS-COUNTER > WS-MAX-ITERATIONS
           DISPLAY '超過最大迭代次數，可能為無窮迴圈'
           MOVE 12 TO RETURN-CODE
       END-IF.
```

---

## 三、Dump 分析技巧

### 3.1 SYSUDUMP vs SYSABEND

| Dump 類型 | 內容 | 用途 |
|----------|------|------|
| **SYSUDUMP** | 使用者區域 Dump | 一般除錯，較小 |
| **SYSABEND** | 完整 Dump | 嚴重錯誤分析 |
| **SYSMDUMP** | 核心 Dump | 系統問題分析 |

### 3.2 Dump 內容解析

```
═══════════════════════════════════════════════════════════════
Dump 標題區
═══════════════════════════════════════════════════════════════

IEA995I SYMPTOM DUMP OUTPUT  SYSTEM COMPLETION CODE=S0C7

--> 系統完成代碼：S0C7

═══════════════════════════════════════════════════════════════
程式資訊
═══════════════════════════════════════════════════════════════

PROGRAM=TXNVALID  PSW AT ENTRY TO ABEND 078D0000 8008A23E

--> 程式名稱：TXNVALID
--> PSW：程式狀態字，包含錯誤指令位址

═══════════════════════════════════════════════════════════════
暫存器內容
═══════════════════════════════════════════════════════════════

GPR 0-7: 00000000 00000000 00000000 00000000
         00000000 00000000 00000000 00000000
GPR 8-15: 0008A200 0008A000 00000000 00000000
          00000000 00000000 00000000 00000000

--> GPR (General Purpose Register)
--> R13 通常是 Base Register，指向 DSA (Dynamic Storage Area)

═══════════════════════════════════════════════════════════════
工作儲存區 (Working Storage)
═══════════════════════════════════════════════════════════════

OFFSET  HEX DUMP                                        ASCII
------  ------------------------------------------------  ----------------
000000  40404040 40404040 40404040 40404040 40404040      [          ]
000010  00000000 00000000 00000000 00000000 00000000      [          ]

--> 檢查變數內容是否正確
--> 40404040 = EBCDIC 空白
--> 00000000 = 二進位零
```

### 3.3 使用 IPCS 分析 Dump

```
//IPCS     JOB (SYS),'ANALYZE DUMP',
//             CLASS=A,MSGCLASS=X
//*
//STEP1    EXEC PGM=IKJEFT01
//SYSTSPRT DD SYSOUT=*
//SYSTSIN  DD *
  IPCS
  SETD ASID(X'0056')            <- 設定位址空間 ID
  VERBEXIT REGS                 <- 顯示暫存器
  VERBEXIT DA/DSA               <- 顯示 DSA 鏈結
  ANALYZE                       <- 分析 Dump
/*
//
```

---

## 四、追蹤與日誌技巧

### 4.1 DISPLAY 追蹤法

```cobol
       IDENTIFICATION DIVISION.
       PROGRAM-ID. DEBUGEX.
      *-----------------------------------------------------------
      * 使用 DISPLAY 進行程式追蹤
      *-----------------------------------------------------------
       ENVIRONMENT DIVISION.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01  WS-DEBUG-SWITCH      PIC X(01) VALUE 'N'.
           88  DEBUG-ON         VALUE 'Y'.
       
       01  WS-TRACE-COUNTER     PIC 9(09) COMP-3 VALUE 0.
       
       PROCEDURE DIVISION.
       0000-MAIN.
           IF DEBUG-ON
               DISPLAY '>>> 進入 0000-MAIN'
           END-IF
           
           PERFORM 1000-INITIALIZE
           PERFORM 2000-PROCESS
           PERFORM 3000-FINALIZE
           
           IF DEBUG-ON
               DISPLAY '<<< 離開 0000-MAIN'
           END-IF
           
           GOBACK.
       
       1000-INITIALIZE.
           IF DEBUG-ON
               DISPLAY '>>> 進入 1000-INITIALIZE'
           END-IF
           
           OPEN INPUT INPUT-FILE
           IF WS-FILE-STATUS NOT = '00'
               DISPLAY 'ERROR: 檔案開啟失敗，STATUS=' WS-FILE-STATUS
           END-IF
           
           IF DEBUG-ON
               DISPLAY '<<< 離開 1000-INITIALIZE'
           END-IF.
       
       2000-PROCESS.
           IF DEBUG-ON
               DISPLAY '>>> 進入 2000-PROCESS'
           END-IF
           
           PERFORM UNTIL WS-EOF
               READ INPUT-FILE
                   AT END
                       SET WS-EOF TO TRUE
                   NOT AT END
                       ADD 1 TO WS-TRACE-COUNTER
                       IF DEBUG-ON
                           DISPLAY '處理記錄 #' WS-TRACE-COUNTER
                           DISPLAY '  帳號=' WS-ACCT-NO
                           DISPLAY '  金額=' WS-AMOUNT
                       END-IF
                       PERFORM 2100-VALIDATE-DATA
               END-READ
           END-PERFORM
           
           IF DEBUG-ON
               DISPLAY '總共處理 ' WS-TRACE-COUNTER ' 筆記錄'
               DISPLAY '<<< 離開 2000-PROCESS'
           END-IF.
       
       2100-VALIDATE-DATA.
           IF DEBUG-ON
               DISPLAY '    >>> 進入 2100-VALIDATE-DATA'
               DISPLAY '    驗證帳號=' WS-ACCT-NO
           END-IF
           
           IF WS-ACCT-NO NOT NUMERIC
               IF DEBUG-ON
                   DISPLAY '    ERROR: 帳號非數字'
               END-IF
               ADD 1 TO WS-ERROR-COUNT
           END-IF
           
           IF DEBUG-ON
               DISPLAY '    <<< 離開 2100-VALIDATE-DATA'
           END-IF.
```

### 4.2 結構化日誌記錄

```cobol
       01  WS-LOG-RECORD.
           05  LOG-TIMESTAMP      PIC X(26).
           05  LOG-PROGRAM        PIC X(08).
           05  LOG-PARAGRAPH      PIC X(20).
           05  LOG-MESSAGE-TYPE   PIC X(01).
               88  LOG-INFO       VALUE 'I'.
               88  LOG-WARNING    VALUE 'W'.
               88  LOG-ERROR      VALUE 'E'.
           05  LOG-MESSAGE        PIC X(100).
       
       PROCEDURE DIVISION.
       1000-WRITE-LOG.
           MOVE FUNCTION CURRENT-DATE TO LOG-TIMESTAMP
           MOVE 'TXNVALID' TO LOG-PROGRAM
           MOVE WS-CURRENT-PARAGRAPH TO LOG-PARAGRAPH
           
           WRITE LOG-FILE-RECORD FROM WS-LOG-RECORD.
```

### 4.3 使用 TDQ (Transient Data Queue)

```cobol
      *    在 CICS 程式中寫入日誌
           EXEC CICS
               WRITEQ TD
               QUEUE('LOGQ')
               FROM(WS-LOG-MESSAGE)
               LENGTH(LENGTH OF WS-LOG-MESSAGE)
           END-EXEC
```

---

## 五、File-Aid 除錯工具

### 5.1 File-Aid 基本功能

| 功能 | 指令 | 說明 |
|-----|------|------|
| 瀏覽檔案 | BROWSE | 查看檔案內容 |
| 編輯檔案 | EDIT | 修改檔案內容 |
| 搜尋 | FIND | 搜尋特定資料 |
| 比對 | COMPARE | 比對兩個檔案 |
| 格式化 | FORMAT | 依 Copybook 格式化顯示 |

### 5.2 File-Aid 使用範例

```
在 TSO 指令列輸入：

1. 瀏覽檔案：
   FAS 'DAS.ACCOUNT.MASTER'

2. 依 Copybook 格式化瀏覽：
   FAS 'DAS.ACCOUNT.MASTER' C('DAS.COPYBOOK(ACCTREC)')

3. 搜尋特定帳號：
   FAS 'DAS.ACCOUNT.MASTER' FIND('000123456789')

4. 比對兩個檔案：
   FAC 'DAS.ACCOUNT.MASTER' 'DAS.ACCOUNT.MASTER.BACKUP'
```

---

## 六、XPEDITER 互動式除錯

### 6.1 XPEDITER 功能

```
┌─────────────────────────────────────────────────────────────┐
│                    XPEDITER 功能                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  設定中斷點 (Breakpoint)                                     │
│  ├── 在特定行暫停執行                                        │
│  └── 條件式中斷點                                            │
│                                                             │
│  單步執行 (Step)                                             │
│  ├── Step Into：進入副程式                                  │
│  ├── Step Over：跳過副程式                                  │
│  └── Step Out：跳出副程式                                   │
│                                                             │
│  變數監視 (Watch)                                            │
│  ├── 即時顯示變數值                                          │
│  └── 變數變更時暫停                                          │
│                                                             │
│  記憶體檢視                                                  │
│  ├── 查看 Working Storage                                   │
│  └── 查看 Linkage Section                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 XPEDITER 使用流程

```
1. 在 TSO 輸入：
   XPED 'DAS.PROD.LOADLIB(TXNVALID)'

2. 在原始碼視窗設定中斷點：
   - 游標移到目標行
   - 輸入 BP (Breakpoint)

3. 執行程式：
   - 輸入 GO 開始執行
   - 程式會在中斷點暫停

4. 檢查變數：
   - 輸入 WATCH WS-BALANCE
   - 顯示變數目前值

5. 單步執行：
   - 輸入 STEP 執行下一行
   - 輸入 GO 繼續執行到下一個中斷點

6. 修改變數：
   - 輸入 SET WS-BALANCE = 10000
   - 繼續測試不同情境
```

---

## 七、SQL 除錯技巧

### 7.1 SQLCODE 處理

```cobol
       PROCEDURE DIVISION.
       0000-MAIN.
           EXEC SQL
               SELECT CUST_ID, CURRENT_BAL
               INTO   :HV-CUST-ID, :HV-BALANCE
               FROM   ACCOUNT_MASTER
               WHERE  ACCT_NO = :HV-ACCT-NO
           END-EXEC
           
           EVALUATE SQLCODE
               WHEN 0
                   DISPLAY '查詢成功'
               WHEN +100
                   DISPLAY '查無資料'
               WHEN -305
                   DISPLAY 'NULL 值處理錯誤'
               WHEN -501
                   DISPLAY '游標已關閉'
               WHEN -803
                   DISPLAY '違反唯一性限制'
               WHEN -904
                   DISPLAY '資源不可用'
               WHEN -911
                   DISPLAY '死結 (Deadlock)'
               WHEN -913
                   DISPLAY '逾時 (Timeout)'
               WHEN OTHER
                   DISPLAY 'SQL 錯誤，CODE=' SQLCODE
                   DISPLAY 'SQLERRM=' SQLERRM
           END-EVALUATE.
```

### 7.2 SQL 追蹤

```cobol
       01  WS-SQL-TRACE-SWITCH   PIC X(01) VALUE 'N'.
       
       PROCEDURE DIVISION.
       1000-EXECUTE-SQL.
           IF WS-SQL-TRACE-SWITCH = 'Y'
               DISPLAY '>>> SQL 執行前'
               DISPLAY '    SQLCODE=' SQLCODE
               DISPLAY '    輸入參數:'
               DISPLAY '      HV-ACCT-NO=' HV-ACCT-NO
           END-IF
           
           EXEC SQL
               SELECT ...
           END-EXEC
           
           IF WS-SQL-TRACE-SWITCH = 'Y'
               DISPLAY '<<< SQL 執行後'
               DISPLAY '    SQLCODE=' SQLCODE
               DISPLAY '    輸出參數:'
               DISPLAY '      HV-CUST-ID=' HV-CUST-ID
               DISPLAY '      HV-BALANCE=' HV-BALANCE
           END-IF.
```

---

## 八、批次程式除錯

### 8.1 JCL 錯誤診斷

```jcl
//DEBUG    JOB (DAS),'DEBUG JOB',
//             CLASS=A,MSGCLASS=X,NOTIFY=&SYSUID
//*
//JOBLIB   DD DSN=DAS.PROD.LOADLIB,DISP=SHR
//*
//STEP1    EXEC PGM=TXNVALID
//INPUT    DD DSN=DAS.DAILY.TRANS,DISP=SHR
//OUTPUT   DD DSN=DAS.OUTPUT.FILE,DISP=(NEW,CATLG),
//             SPACE=(CYL,(10,5),RLSE)
//SYSOUT   DD SYSOUT=*           <-- 程式輸出
//SYSUDUMP DD SYSOUT=*           <-- Dump 輸出
//SYSABEND DD SYSOUT=*           <-- ABEND Dump
//CEEDUMP  DD SYSOUT=*           <-- LE Dump
//SYSIN    DD *
  DEBUG=Y
/*
//
```

### 8.2 批次追蹤

```cobol
       PROCEDURE DIVISION.
       0000-MAIN.
      *    讀取 SYSIN 參數
           ACCEPT WS-DEBUG-SWITCH FROM SYSIN
           
           IF WS-DEBUG-SWITCH = 'Y'
               DISPLAY '========================================'
               DISPLAY '除錯模式啟動'
               DISPLAY '程式名稱：TXNVALID'
               DISPLAY '執行時間：' FUNCTION CURRENT-DATE
               DISPLAY '========================================'
           END-IF
           
           PERFORM 1000-INITIALIZE
           PERFORM 2000-PROCESS
           PERFORM 3000-FINALIZE
           
           IF WS-DEBUG-SWITCH = 'Y'
               DISPLAY '========================================'
               DISPLAY '程式執行完成'
               DISPLAY '處理筆數：' WS-PROCESS-COUNT
               DISPLAY '錯誤筆數：' WS-ERROR-COUNT
               DISPLAY '========================================'
           END-IF
           
           GOBACK.
```

---

## 九、CICS 程式除錯

### 9.1 CEDF (CICS Execution Diagnostic Facility)

```
在 CICS 終端輸入：
CEDF ACIQ    <-- 追蹤 ACIQ 交易

執行結果：
═══════════════════════════════════════════════════════════════
CEDF 畫面顯示：
════════════════