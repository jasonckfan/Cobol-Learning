# Lesson 4-3：日終批次處理流程

## 學習目標

- 理解銀行日終批次處理的整體架構
- 掌握 EOD（End of Day）處理的核心流程
- 能夠分析批次處理相關需求與問題

---

## 什麼是日終批次處理？

日終批次處理（End of Day, EOD）是銀行核心系統每日營業結束後執行的一系列自動化處理程序。

### 為什麼需要批次處理？

| 原因 | 說明 |
|------|------|
| 效率考量 | 大量資料適合批次處理，避免影響線上交易效能 |
| 時間因素 | 計息、結算等工作需要完整當日資料 |
| 系統資源 | 利用夜間離峰時間處理 |
| 資料一致性 | 確保所有交易完成後才進行結算 |

---

## 銀行日終批次架構

### 典型 EOD 處理時序

```
時間          處理階段              主要工作
──────────────────────────────────────────────────────
18:00-18:30   營業日切換            關帳、日結開始
18:30-19:00   交易資料彙總          明細彙總、排序
19:00-20:00   利息計算              存款計息、放款計息
20:00-21:00   餘額更新              總帳更新、餘額結轉
21:00-22:00   對帳處理              內部對帳、跨系統對帳
22:00-23:00   報表生成              日報表、管理報表
23:00-00:00   清算處理              跨行清算、外匯清算
00:00-01:00   次日準備              開帳、參數載入
```

### 批次處理層次

```
┌─────────────────────────────────────────┐
│            批次控制層 (Job Scheduler)     │
│    TWS, Control-M, CA-7, JES2           │
├─────────────────────────────────────────┤
│            應用邏輯層                     │
│    計息程式、對帳程式、報表程式           │
├─────────────────────────────────────────┤
│            資料存取層                     │
│    VSAM, DB2, Sequential Files          │
├─────────────────────────────────────────┤
│            系統服務層                     │
│    Sort, IEBGENER, IDCAMS               │
└─────────────────────────────────────────┘
```

---

## 核心批次流程詳解

### 1. 營業日切換 (Day Switch)

```cobol
       IDENTIFICATION DIVISION.
       PROGRAM-ID. DAYSCHG.

       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT SYSCTL-FILE ASSIGN TO SYSCTL
               ORGANIZATION IS INDEXED
               ACCESS MODE IS RANDOM
               RECORD KEY IS CTL-KEY
               FILE STATUS IS WS-CTL-STATUS.

       DATA DIVISION.
       FILE SECTION.
       FD SYSCTL-FILE.
       01 SYSCTL-RECORD.
          05 CTL-KEY           PIC X(10).
          05 CTL-BUSINESS-DATE PIC 9(8).
          05 CTL-PREV-DATE     PIC 9(8).
          05 CTL-NEXT-DATE     PIC 9(8).
          05 CTL-PROCESS-FLAG  PIC X.
             88 CTL-ONLINE-ACTIVE VALUE 'Y'.
             88 CTL-BATCH-ACTIVE  VALUE 'B'.
             88 CTL-EOD-RUNNING   VALUE 'E'.
          05 CTL-BRANCH-STATUS PIC X(500).

       WORKING-STORAGE SECTION.
       01 WS-WORK-FIELDS.
          05 WS-NEW-DATE       PIC 9(8).
          05 WS-STATUS         PIC XX.

       PROCEDURE DIVISION.
       0000-MAIN.
           PERFORM 1000-INIT
           PERFORM 2000-CHECK-PRECONDITION
           PERFORM 3000-SWITCH-DATE
           PERFORM 4000-NOTIFY-SYSTEMS
           PERFORM 9000-TERM
           STOP RUN.

       2000-CHECK-PRECONDITION.
      *    檢查所有線上交易是否完成
           IF CTL-ONLINE-ACTIVE
               DISPLAY 'ERROR: 線上交易尚未關閉'
               STOP RUN
           END-IF
      *    檢查是否有未完成交易
           PERFORM 2100-CHECK-PENDING-TRANS.

       3000-SWITCH-DATE.
      *    備份當前營業日
           MOVE CTL-BUSINESS-DATE TO CTL-PREV-DATE
      *    計算下一營業日
           PERFORM 3100-CALC-NEXT-BUSINESS-DAY
      *    更新系統日期
           MOVE WS-NEW-DATE TO CTL-BUSINESS-DATE
           MOVE CTL-NEXT-DATE TO WS-NEW-DATE
           MOVE 'E' TO CTL-PROCESS-FLAG
           REWRITE SYSCTL-RECORD.

       3100-CALC-NEXT-BUSINESS-DAY.
      *    計算下一個工作日（考慮週末和假日）
           MOVE CTL-BUSINESS-DATE TO WS-NEW-DATE
           ADD 1 TO WS-NEW-DATE
           PERFORM UNTIL WS-IS-BUSINESS-DAY
               ADD 1 TO WS-NEW-DATE
           END-PERFORM
           MOVE WS-NEW-DATE TO CTL-NEXT-DATE.
```

### 2. 交易資料彙總

```cobol
      * 交易明細彙總程式
       1000-SUMMARIZE-TRANS.
           PERFORM 1100-SORT-TRANS-BY-ACCT
           PERFORM 1200-AGGREGATE-TRANS
           PERFORM 1300-VALIDATE-TOTALS.

       1100-SORT-TRANS-BY-ACCT.
      *    使用 SORT Utility 排序交易明細
           SORT TRANS-SORT-FILE
               ON ASCENDING KEY S-ACCT-NO
                             S-TRANS-DATE
                             S-TRANS-SEQ
               USING TRANS-INPUT-FILE
               GIVING TRANS-SORTED-FILE.

       1200-AGGREGATE-TRANS.
           OPEN INPUT TRANS-SORTED-FILE
           OPEN OUTPUT TRANS-SUMMARY-FILE
           
           MOVE LOW-VALUES TO WS-PREV-ACCT
           MOVE 0 TO WS-ACCT-TOTAL
                      WS-ACCT-COUNT
           
           PERFORM UNTIL EOF-TRANS
               READ TRANS-SORTED-FILE
                   AT END SET EOF-TRANS TO TRUE
                   NOT AT END
                       PERFORM 1210-PROCESS-TRANS
               END-READ
           END-PERFORM
      *    處理最後一筆帳戶
           PERFORM 1220-WRITE-SUMMARY
           
           CLOSE TRANS-SORTED-FILE
                 TRANS-SUMMARY-FILE.

       1210-PROCESS-TRANS.
           IF S-ACCT-NO NOT = WS-PREV-ACCT
               IF WS-PREV-ACCT NOT = LOW-VALUES
                   PERFORM 1220-WRITE-SUMMARY
               END-IF
               MOVE S-ACCT-NO TO WS-PREV-ACCT
               MOVE 0 TO WS-ACCT-TOTAL
                         WS-ACCT-COUNT
           END-IF
           
           ADD S-TRANS-AMT TO WS-ACCT-TOTAL
           ADD 1 TO WS-ACCT-COUNT.

       1220-WRITE-SUMMARY.
           MOVE WS-PREV-ACCT TO SUM-ACCT-NO
           MOVE WS-ACCT-TOTAL TO SUM-TOTAL-AMT
           MOVE WS-ACCT-COUNT TO SUM-TRANS-CNT
           MOVE WS-BUSINESS-DATE TO SUM-PROC-DATE
           WRITE TRANS-SUMMARY-RECORD.
```

### 3. 利息計算批次

```cobol
       IDENTIFICATION DIVISION.
       PROGRAM-ID. INTCALC.

       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT ACCT-FILE ASSIGN TO ACCTMAS
               ORGANIZATION IS INDEXED
               ACCESS MODE IS SEQUENTIAL
               RECORD KEY IS ACCT-NO
               FILE STATUS IS WS-ACCT-STATUS.
           SELECT INT-FILE ASSIGN TO INTOUT
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-INT-STATUS.
           SELECT ERROR-FILE ASSIGN TO ERRFILE
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-ERR-STATUS.

       DATA DIVISION.
       FILE SECTION.
       FD ACCT-FILE.
       01 ACCT-RECORD.
          05 ACCT-NO           PIC X(16).
          05 ACCT-TYPE         PIC XX.
          05 ACCT-BALANCE      PIC S9(13)V99 COMP-3.
          05 INT-RATE          PIC V9(6) COMP-3.
          05 ACCUM-INT         PIC S9(11)V99 COMP-3.
          05 LAST-INT-DATE     PIC 9(8).
          05 ACCT-STATUS       PIC X.

       FD INT-FILE.
       01 INT-RECORD.
          05 INT-ACCT-NO       PIC X(16).
          05 INT-AMT           PIC S9(11)V99.
          05 INT-DATE          PIC 9(8).
          05 INT-TYPE          PIC X.

       FD ERROR-FILE.
       01 ERROR-RECORD.
          05 ERR-ACCT-NO       PIC X(16).
          05 ERR-CODE          PIC X(4).
          05 ERR-MSG           PIC X(50).
          05 ERR-TIMESTAMP     PIC 9(14).

       WORKING-STORAGE SECTION.
       01 WS-FLAGS.
          05 WS-EOF-FLAG       PIC X VALUE 'N'.
             88 EOF-REACHED    VALUE 'Y'.

       01 WS-COUNTERS.
          05 WS-PROC-CNT       PIC 9(8) VALUE 0.
          05 WS-INT-CNT        PIC 9(8) VALUE 0.
          05 WS-ERR-CNT        PIC 9(8) VALUE 0.
          05 WS-TOTAL-INT      PIC S9(15)V99 COMP-3 VALUE 0.

       01 WS-CALC-FIELDS.
          05 WS-DAILY-INT      PIC S9(11)V99 COMP-3.
          05 WS-DAYS-ELAPSED   PIC 9(5).
          05 WS-BUSINESS-DATE  PIC 9(8).

       PROCEDURE DIVISION.
       0000-MAIN.
           PERFORM 1000-INIT
           PERFORM 2000-PROCESS-ALL-ACCTS
           PERFORM 3000-SUMMARY
           PERFORM 9000-TERM
           STOP RUN.

       1000-INIT.
           ACCEPT WS-BUSINESS-DATE FROM DATE YYYYMMDD
           OPEN I-O ACCT-FILE
           OPEN OUTPUT INT-FILE
           OPEN OUTPUT ERROR-FILE.

       2000-PROCESS-ALL-ACCTS.
           PERFORM 2100-READ-FIRST
           PERFORM 2200-PROCESS-ACCT UNTIL EOF-REACHED.

       2200-PROCESS-ACCT.
           ADD 1 TO WS-PROC-CNT
           IF ACCT-STATUS = 'A' AND ACCT-BALANCE NOT = 0
               PERFORM 2210-CALC-INTEREST
               IF WS-DAILY-INT NOT = 0
                   PERFORM 2220-UPDATE-ACCT
                   PERFORM 2230-WRITE-INT-RECORD
                   ADD WS-DAILY-INT TO WS-TOTAL-INT
                   ADD 1 TO WS-INT-CNT
               END-IF
           END-IF
           PERFORM 2100-READ-FIRST.

       2210-CALC-INTEREST.
      *    計算每日利息
      *    公式: 利息 = 餘額 × 利率 / 365
           IF ACCT-BALANCE > 0
               COMPUTE WS-DAILY-INT ROUNDED = 
                   ACCT-BALANCE * INT-RATE / 365
           ELSE
      *        透支使用透支利率
               COMPUTE WS-DAILY-INT ROUNDED = 
                   ACCT-BALANCE * (INT-RATE + 0.05) / 365
           END-IF
           ADD WS-DAILY-INT TO ACCUM-INT.

       2220-UPDATE-ACCT.
           REWRITE ACCT-RECORD
               INVALID KEY
                   PERFORM 9000-LOG-ERROR
           END-REWRITE.

       2230-WRITE-INT-RECORD.
           MOVE ACCT-NO TO INT-ACCT-NO
           MOVE WS-DAILY-INT TO INT-AMT
           MOVE WS-BUSINESS-DATE TO INT-DATE
           MOVE 'D' TO INT-TYPE
           WRITE INT-RECORD.

       3000-SUMMARY.
           DISPLAY '================================'
           DISPLAY '利息計算批次統計'
           DISPLAY '================================'
           DISPLAY '處理帳戶數: ' WS-PROC-CNT
           DISPLAY '計息帳戶數: ' WS-INT-CNT
           DISPLAY '錯誤帳戶數: ' WS-ERR-CNT
           DISPLAY '總利息金額: ' WS-TOTAL-INT
           DISPLAY '================================'.

       9000-LOG-ERROR.
           MOVE ACCT-NO TO ERR-ACCT-NO
           MOVE 'UPDT' TO ERR-CODE
           MOVE '帳戶更新失敗' TO ERR-MSG
           MOVE FUNCTION CURRENT-DATE TO ERR-TIMESTAMP
           WRITE ERROR-RECORD
           ADD 1 TO WS-ERR-CNT.

       9000-TERM.
           CLOSE ACCT-FILE
           CLOSE INT-FILE
           CLOSE ERROR-FILE.
```

---

## JCL 批次控制範例

### EOD 主控 JCL

```jcl
//EODMAIN  JOB (BATCH,EOD),'END OF DAY PROCESS',
//             CLASS=A,MSGCLASS=X,NOTIFY=&SYSUID
//*********************************************************************
//* EOD Main Control Job
//*********************************************************************
//*
//* Step 1: 檢查前置條件
//*
//STEP010  EXEC PGM=BPXBATCH,PARM='PGM /usr/bin/check_precondition.sh'
//SYSPRINT DD SYSOUT=*
//*
//* Step 2: 營業日切換
//*
//STEP020  EXEC PGM=DAYSCHG
//STEPLIB  DD DSN=PROD.LOADLIB,DISP=SHR
//SYSCTL   DD DSN=PROD.CONTROL.SYSCTL,DISP=OLD
//SYSPRINT DD SYSOUT=*
//SYSOUT   DD SYSOUT=*
//*
//* Step 3: 交易明細排序
//*
//STEP030  EXEC PGM=SORT
//SYSOUT   DD SYSOUT=*
//SORTIN   DD DSN=PROD.TRANS.DAILY(+0),DISP=SHR
//SORTOUT  DD DSN=PROD.TRANS.SORTED,DISP=(,CATLG),
//            SPACE=(CYL,(100,50),RLSE)
//SORTWK01 DD SPACE=(CYL,100),UNIT=SYSDA
//SORTWK02 DD SPACE=(CYL,100),UNIT=SYSDA
//SORTWK03 DD SPACE=(CYL,100),UNIT=SYSDA
//SYSIN    DD *
  SORT FIELDS=(1,16,CH,A,17,8,CH,A,25,12,CH,A)
/*
//*
//* Step 4: 交易彙總
//*
//STEP040  EXEC PGM=TRANSUM
//STEPLIB  DD DSN=PROD.LOADLIB,DISP=SHR
//TRANSIN  DD DSN=PROD.TRANS.SORTED,DISP=SHR
//SUMMOUT  DD DSN=PROD.TRANS.SUMMARY(+0),
//            DISP=(,CATLG),SPACE=(CYL,(50,25))
//SYSPRINT DD SYSOUT=*
//*
//* Step 5: 利息計算
//*
//STEP050  EXEC PGM=INTCALC
//STEPLIB  DD DSN=PROD.LOADLIB,DISP=SHR
//ACCTMAS  DD DSN=PROD.ACCT.MASTER,DISP=OLD
//INTOUT   DD DSN=PROD.INTEREST.DAILY(+0),
//            DISP=(,CATLG),SPACE=(CYL,(50,25))
//ERRFILE  DD DSN=PROD.ERROR.INTCALC(+0),
//            DISP=(,CATLG),SPACE=(CYL,(10,5))
//SYSPRINT DD SYSOUT=*
//*
//* Step 6: 總帳更新
//*
//STEP060  EXEC PGM=GLUPDATE
//STEPLIB  DD DSN=PROD.LOADLIB,DISP=SHR
//GLMASTER DD DSN=PROD.GL.MASTER,DISP=OLD
//TRANSUM  DD DSN=PROD.TRANS.SUMMARY,DISP=SHR
//INTFILE  DD DSN=PROD.INTEREST.DAILY(+0),DISP=SHR
//SYSPRINT DD SYSOUT=*
//*
//* Step 7: 對帳處理
//*
//STEP070  EXEC PGM=RECONCIL
//STEPLIB  DD DSN=PROD.LOADLIB,DISP=SHR
//FILEA    DD DSN=PROD.ACCT.MASTER,DISP=SHR
//FILEB    DD DSN=PROD.GL.MASTER,DISP=SHR
//MATCH    DD DSN=PROD.RECON.MATCH(+0),
//            DISP=(,CATLG)
//UNMATCH  DD DSN=PROD.RECON.UNMATCH(+0),
//            DISP=(,CATLG)
//SYSPRINT DD SYSOUT=*
//*
//* Step 8: 報表生成
//*
//STEP080  EXEC PGM=REPORTG
//STEPLIB  DD DSN=PROD.LOADLIB,DISP=SHR
//RPTOUT   DD SYSOUT=A
//RPTDATA  DD DSN=PROD.TRANS.SUMMARY,DISP=SHR
//SYSPRINT DD SYSOUT=*
//*
//* Step 9: 清理暫存檔
//*
//STEP090  EXEC PGM=IEFBR14
//DELFILE  DD DSN=PROD.TRANS.SORTED,DISP=(MOD,DELETE)
//*
```

---

## 批次錯誤處理

### 錯誤分類

| 等級 | 說明 | 處理方式 |
|------|------|----------|
| INFO | 資訊性訊息 | 記錄日誌，繼續處理 |
| WARNING | 警告 | 記錄日誌，可能需人工確認 |
| ERROR | 錯誤 | 記錄錯誤，跳過該筆繼續 |
| SEVERE | 嚴重錯誤 | 停止處理，通知管理員 |

### 重試機制

```cobol
       5000-RETRY-LOGIC.
           MOVE 0 TO WS-RETRY-CNT
           PERFORM UNTIL WS-RETRY-CNT >= 3 OR WS-SUCCESS
               ADD 1 TO WS-RETRY-CNT
               PERFORM 5100-DO-WORK
               IF NOT WS-SUCCESS
                   PERFORM 5200-WAIT-BEFORE-RETRY
               END-IF
           END-PERFORM
           IF NOT WS-SUCCESS
               PERFORM 5300-LOG-FINAL-ERROR
           END-IF.

       5200-WAIT-BEFORE-RETRY.
      *    等待 30 秒後重試
           CALL 'CBLSLEEP' USING 30.
```

### 檢核點與回復

```cobol
      * 檢核點機制
       6000-CHECKPOINT.
      *    寫入檢核點記錄
           MOVE WS-BUSINESS-DATE TO CKP-DATE
           MOVE WS-PROC-CNT TO CKP-PROCESSED
           MOVE WS-LAST-KEY TO CKP-LAST-KEY
           WRITE CHECKPOINT-RECORD
      *    Commit 資料庫變更
           EXEC SQL COMMIT WORK END-EXEC.

      * 回復機制
       7000-RESTART.
      *    讀取最後檢核點
           READ CHECKPOINT-FILE
               KEY IS WS-BUSINESS-DATE
           END-READ
      *    從中斷點繼續處理
           MOVE CKP-LAST-KEY TO WS-START-KEY
           MOVE CKP-PROCESSED TO WS-PROC-CNT.
```

---

## 批次監控與告警

### 監控指標

| 指標 | 說明 | 告警條件 |
|------|------|----------|
| 執行時間 | 批次執行耗時 | 超過預估時間 120% |
| 處理筆數 | 處理記錄數量 | 與歷史平均值差異 >20% |
| 錯誤率 | 錯誤筆數/總筆數 | 錯誤率 > 1% |
| 檔案大小 | 輸入檔案大小 | 與預期差異 >30% |

### 告警通知

```
批次告警流程：

1. 偵測異常
   └─> 記錄錯誤日誌
   └─> 發送告警郵件
   └─> 發送 SMS 通知

2. 自動處理
   └─> 嘗試重試
   └─> 跳過錯誤記錄
   └─> 啟動備援程序

3. 人工介入
   └─> 待命人員接手
   └─> 問題診斷
   └─> 手動修復
```

---

## BA 實務應用

### 需求確認重點

| 問題 | 目的 |
|------|------|
| 「批次時間視窗多長？」 | 確認執行時間限制 |
| 「失敗如何處理？」 | 設計錯誤處理流程 |
| 「哪些報表必須產生？」 | 確認報表需求 |
| 「監控告警要求？」 | 設計監控機制 |

### 常見批次問題診斷

| 現象 | 可能原因 | 診斷步驟 |
|------|----------|----------|
| 執行時間過長 | 資料量暴增、程式效能 | 檢查輸入檔大小、檢視執行日誌 |
| 錯誤率過高 | 資料格式異常、規則變更 | 檢查錯誤明細、確認業務規則 |
| 批次中斷 | 系統資源不足、網路問題 | 檢查系統日誌、確認資源使用 |
| 對帳不平 | 交易遺漏、計算錯誤 | 核對交易明細、重新計算 |

---

## 練習題

### 題目 1
設計一個存款利息計算批次的完整流程圖。

### 題目 2
說明批次處理中 Checkpoint/Restart 機制的運作原理。

### 題目 3
如果 EOD 批次在 Step 5 中斷，如何設計恢復機制？

---

## 重點回顧

| 概念 | 說明 |
|------|------|
| EOD | End of Day，日終批次處理 |
| Day Switch | 營業日切換 |
| Checkpoint | 檢核點，用於批次恢復 |
| Restart | 從檢核點恢復執行 |

---

## 延伸閱讀

- [Lesson 4-4：對帳與報表生成](lesson-4-4-reconciliation.md)
- [Lesson 3-3：JCL 基本結構](lesson-3-3-jcl-basic.md)
