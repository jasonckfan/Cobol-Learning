# Lesson 6-3: CLM 批次重啟與容錯機制

> 理解批次失敗時的處理策略與重啟設計

---

## 學習目標

- 理解批次作業失敗的常見原因與影響範圍
- 掌握 Restart/Checkpoint 機制的設計原理
- 學會設計可重啟的批次程式架構
- 了解 BA 在批次異常時的分析與溝通重點

---

## 一、批次作業失敗場景分析

### 1.1 CLM 批次作業架構回顧

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLM 日終批次流程                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: CLMBAT01 - 前處理                                      │
│  ├── 檢查前日批次是否完成                                       │
│  ├── 鎖定相關檔案（避免 Online 交易更新）                      │
│  └── 產生控制檔（Control File）                                │
│                          ↓                                      │
│  Step 2: CLMBAT02 - 利息計算（核心）                           │
│  ├── 讀取帳戶餘額檔                                            │
│  ├── 計算各產品利息（GIO/CDA/SNP/MCN）                         │
│  ├── 更新利息累計檔                                            │
│  └── ⚠️ 最容易失敗的步驟                                       │
│                          ↓                                      │
│  Step 3: CLMBAT03 - 息差分配（MCN）                            │
│  ├── 多貨幣息差計算                                            │
│  └── 分配至各帳戶                                               │
│                          ↓                                      │
│  Step 4: CLMBAT04 - 後處理                                      │
│  ├── 更新帳戶主檔                                              │
│  ├── 產生報表                                                   │
│  └── 釋放檔案鎖定                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 常見失敗原因與影響範圍

| 失敗類型 | 常見原因 | 影響範圍 | 處理難度 |
|----------|----------|----------|----------|
| **資料錯誤** | 利率定義異常、餘額為 NULL | 單筆或批次 | ⭐⭐ |
| **檔案問題** | Dataset 不存在、空間不足 | 整個 Step | ⭐⭐⭐ |
| **程式錯誤** | 除以零、陣列越界 | 整個 Step | ⭐⭐⭐⭐ |
| **資源競爭** | 檔案被鎖定、DB2 Deadlock | 整個 Job | ⭐⭐⭐ |
| **系統問題** | 主機重啟、儲存空間滿 | 整個 Job | ⭐⭐⭐⭐⭐ |

---

## 二、Restart/Checkpoint 機制

### 2.1 為什麼需要 Restart 機制？

```
┌─────────────────────────────────────────────────────────────────┐
│                    無 Restart 機制的問題                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  情境：CLMBAT02 處理 100 萬筆帳戶，在第 80 萬筆時失敗          │
│                                                                 │
│  無 Restart：                                                   │
│  ├── 必須從第 1 筆重新開始                                      │
│  ├── 已計算的 80 萬筆利息需要回滾（Rollback）                  │
│  ├── 浪費 80% 的處理時間                                        │
│  └── 可能影響下一個營業日的開始                                 │
│                                                                 │
│  有 Restart：                                                   │
│  ├── 從第 80 萬筆 + 1 繼續處理                                  │
│  ├── 保留已完成的結果                                          │
│  ├── 只需處理剩餘 20 萬筆                                       │
│  └── 大幅縮短修復時間                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Checkpoint 設計原理

```
┌─────────────────────────────────────────────────────────────────┐
│                    Checkpoint 機制示意圖                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  批次處理流程：                                                 │
│                                                                 │
│  ┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐             │
│  │Start│ → │ 1-10│ → │11-20│ → │21-30│ → │ ... │             │
│  │     │   │  K  │   │  K  │   │  K  │   │     │             │
│  └─────┘   └──┬──┘   └──┬──┘   └──┬──┘   └─────┘             │
│               │         │         │                           │
│               ▼         ▼         ▼                           │
│          ┌───────┐ ┌───────┐ ┌───────┐                       │
│          │CHK-001│ │CHK-002│ │CHK-003│                       │
│          │10筆   │ │20筆   │ │30筆   │                       │
│          │完成   │ │完成   │ │完成   │                       │
│          └───────┘ └───────┘ └───────┘                       │
│                                                                 │
│  失敗發生在第 25 筆時：                                         │
│  ├── 讀取最後一個 Checkpoint：CHK-002（20筆完成）              │
│  ├── 回滾到 Checkpoint 狀態                                     │
│  └── 從第 21 筆重新開始                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Checkpoint 檔案結構

```cobol
      *=============================================================*
      * Checkpoint 控制檔 - BATCH-CHECKPOINT-FILE                  *
      * 用於記錄批次處理進度，支援 Restart                          *
      *=============================================================*
       01  BATCH-CHECKPOINT-RECORD.
           05  CK-JOB-NAME         PIC X(08).
           05  CK-STEP-NAME        PIC X(08).
           05  CK-RUN-DATE         PIC 9(08).
           05  CK-RUN-TIME         PIC 9(06).
           05  CK-STATUS           PIC X(01).
               88  CK-STATUS-START      VALUE 'S'.
               88  CK-STATUS-CHECKPOINT VALUE 'C'.
               88  CK-STATUS-COMPLETE   VALUE 'F'.
               88  CK-STATUS-ERROR      VALUE 'E'.
           05  CK-LAST-KEY.
      *        最後處理完成的記錄 Key
               10  CK-LAST-ACCT-NUMBER PIC X(14).
               10  CK-LAST-CURRENCY    PIC X(03).
               10  CK-LAST-SEQ-NO      PIC 9(09).
           05  CK-RECORD-COUNT       PIC 9(09).
      *        已處理記錄數
           05  CK-BATCH-TOTAL        PIC 9(15)V9(02) COMP-3.
      *        批次累計金額（用於對帳）
           05  CK-CHECKPOINT-TIME    PIC 9(06).
      *        Checkpoint 建立時間
           05  CK-ERROR-CODE         PIC 9(04).
      *        若 STATUS='E'，記錄錯誤代碼
           05  CK-ERROR-MESSAGE      PIC X(100).
```

---

## 三、可重啟批次程式設計

### 3.1 程式架構

```cobol
      *=============================================================*
      * PROGRAM-ID: CLMBAT02                                       *
      * PROGRAM-NAME: CLM Interest Calculation Batch               *
      * DESCRIPTION:  可重啟的利息計算批次程式                      *
      * RESTART:      支援從 Checkpoint 重啟                        *
      *=============================================================*
       IDENTIFICATION DIVISION.
       PROGRAM-ID. CLMBAT02.

       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT ACCT-BALANCE-FILE
               ASSIGN TO UT-S-ACCTBAL
               ORGANIZATION IS SEQUENTIAL.

           SELECT INTEREST-OUTPUT-FILE
               ASSIGN TO UT-S-INTOUT
               ORGANIZATION IS SEQUENTIAL.

           SELECT CHECKPOINT-FILE
               ASSIGN TO UT-S-CHKPT
               ORGANIZATION IS INDEXED
               ACCESS MODE IS DYNAMIC
               RECORD KEY IS CK-JOB-NAME.

       DATA DIVISION.
       FILE SECTION.
       COPY ACCTBAL.
       COPY CHKPOINT.

       WORKING-STORAGE SECTION.
       01  WS-PROGRAM-CONTROL.
           05  WS-RESTART-MODE      PIC X(01) VALUE 'N'.
               88  IS-RESTART-MODE      VALUE 'Y'.
               88  IS-FRESH-START       VALUE 'N'.
           05  WS-CHECKPOINT-INTERVAL PIC 9(05) VALUE 10000.
      *        每 10000 筆建立一個 Checkpoint
           05  WS-RECORD-COUNTER    PIC 9(09) VALUE ZEROES.
           05  WS-BATCH-TOTAL       PIC 9(15)V9(02) COMP-3 VALUE ZEROES.
           05  WS-RETURN-CODE       PIC 9(04) VALUE ZEROES.

       01  WS-RESTART-KEY.
           05  WS-START-ACCT-NUMBER PIC X(14) VALUE LOW-VALUES.
           05  WS-START-CURRENCY    PIC X(03) VALUE SPACES.
           05  WS-START-SEQ-NO      PIC 9(09) VALUE ZEROES.

       LINKAGE SECTION.
       01  LS-PARAMS.
           05  LS-BUSINESS-DATE     PIC 9(08).
           05  LS-RESTART-FLAG      PIC X(01).
               88  LS-DO-RESTART        VALUE 'Y'.
               88  LS-FRESH-START       VALUE 'N'.

       PROCEDURE DIVISION USING LS-PARAMS.
       0000-MAIN-CONTROL.
           PERFORM 1000-INITIALIZATION
           PERFORM 2000-PROCESS-ACCOUNTS
               UNTIL WS-END-OF-FILE
           PERFORM 9000-FINALIZATION
           GOBACK.

       1000-INITIALIZATION.
      *=============================================================
      * 初始化：決定是否從 Restart 開始
      *=============================================================
           OPEN INPUT ACCT-BALANCE-FILE
                      CHECKPOINT-FILE
                OUTPUT INTEREST-OUTPUT-FILE

      *    檢查是否有未完成的 Checkpoint
           MOVE 'CLMBAT02' TO CK-JOB-NAME
           READ CHECKPOINT-FILE
               INVALID KEY
      *            無 Checkpoint，從頭開始
                   MOVE 'N' TO WS-RESTART-MODE
                   DISPLAY 'Starting fresh - no checkpoint found'
               NOT INVALID KEY
      *            有 Checkpoint，檢查狀態
                   IF CK-STATUS-ERROR OR CK-STATUS-CHECKPOINT
                       MOVE 'Y' TO WS-RESTART-MODE
                       MOVE CK-LAST-ACCT-NUMBER TO WS-START-ACCT-NUMBER
                       MOVE CK-LAST-CURRENCY TO WS-START-CURRENCY
                       MOVE CK-LAST-SEQ-NO TO WS-START-SEQ-NO
                       DISPLAY 'Restarting from checkpoint:'
                       DISPLAY '  Account: ' WS-START-ACCT-NUMBER
                       DISPLAY '  Records processed: ' CK-RECORD-COUNT
                   ELSE
                       MOVE 'N' TO WS-RESTART-MODE
                       DISPLAY 'Previous run completed successfully'
                   END-IF
           END-READ

           IF IS-RESTART-MODE
      *        跳過已處理的記錄
               PERFORM 1100-POSITION-TO-RESTART-POINT
           END-IF

      *    初始化 Checkpoint
           PERFORM 1200-WRITE-START-CHECKPOINT.

       1100-POSITION-TO-RESTART-POINT.
      *-------------------------------------------------------------
      * 定位到 Restart 點
      *-------------------------------------------------------------
           DISPLAY 'Positioning to restart point...'

           PERFORM UNTIL WS-END-OF-FILE
               READ ACCT-BALANCE-FILE
                   AT END
                       SET WS-END-OF-FILE TO TRUE
                   NOT AT END
      *                比較 Key 值
                       IF AB-ACCT-NUMBER > WS-START-ACCT-NUMBER
                           EXIT PERFORM
                       END-IF
                       IF AB-ACCT-NUMBER = WS-START-ACCT-NUMBER AND
                          AB-CURRENCY >= WS-START-CURRENCY
                           EXIT PERFORM
                       END-IF
               END-READ
           END-PERFORM

           IF WS-END-OF-FILE
               DISPLAY 'ERROR: Restart point not found in file'
               MOVE 9999 TO WS-RETURN-CODE
               GOBACK
           END-IF

           DISPLAY 'Restart point located successfully'.

       1200-WRITE-START-CHECKPOINT.
      *-------------------------------------------------------------
      * 寫入開始 Checkpoint
      *-------------------------------------------------------------
           MOVE 'CLMBAT02' TO CK-JOB-NAME
           MOVE 'STEP01' TO CK-STEP-NAME
           MOVE LS-BUSINESS-DATE TO CK-RUN-DATE
           MOVE FUNCTION CURRENT-DATE(9:6) TO CK-RUN-TIME
           MOVE 'S' TO CK-STATUS
           MOVE ZEROES TO CK-RECORD-COUNT
           MOVE ZEROES TO CK-BATCH-TOTAL

           REWRITE CHECKPOINT-RECORD
               INVALID KEY
                   WRITE CHECKPOINT-RECORD
           END-REWRITE.

       2000-PROCESS-ACCOUNTS.
      *=============================================================
      * 主處理迴圈
      *=============================================================
           READ ACCT-BALANCE-FILE
               AT END
                   SET WS-END-OF-FILE TO TRUE
                   EXIT SECTION
           END-READ

      *    計算利息
           PERFORM 2100-CALCULATE-INTEREST

      *    累計批次總額
           ADD WS-DAILY-INTEREST TO WS-BATCH-TOTAL

      *    寫入輸出檔
           PERFORM 2200-WRITE-OUTPUT

      *    更新計數器
           ADD 1 TO WS-RECORD-COUNTER

      *    檢查是否需要建立 Checkpoint
           IF FUNCTION MOD(WS-RECORD-COUNTER, WS-CHECKPOINT-INTERVAL) = 0
               PERFORM 2300-WRITE-CHECKPOINT
           END-IF.

       2100-CALCULATE-INTEREST.
      *-------------------------------------------------------------
      * 利息計算邏輯（同 Lesson 6-1）
      *-------------------------------------------------------------
      *    ... 省略，參見 lesson-6-1-clm-interest-engine.md
           .

       2200-WRITE-OUTPUT.
      *-------------------------------------------------------------
      * 寫入輸出檔
      *-------------------------------------------------------------
           WRITE INT-OUTPUT-RECORD FROM WS-INTEREST-OUTPUT
               INVALID KEY
                   DISPLAY 'ERROR: Write output failed'
                   ADD 1 TO WS-ERROR-COUNT
           END-WRITE.

       2300-WRITE-CHECKPOINT.
      *-------------------------------------------------------------
      * 建立 Checkpoint
      *-------------------------------------------------------------
           MOVE AB-ACCT-NUMBER TO CK-LAST-ACCT-NUMBER
           MOVE AB-CURRENCY TO CK-LAST-CURRENCY
           MOVE AB-SEQ-NO TO CK-LAST-SEQ-NO
           MOVE WS-RECORD-COUNTER TO CK-RECORD-COUNT
           MOVE WS-BATCH-TOTAL TO CK-BATCH-TOTAL
           MOVE 'C' TO CK-STATUS
           MOVE FUNCTION CURRENT-DATE(9:6) TO CK-CHECKPOINT-TIME

           REWRITE CHECKPOINT-RECORD
               INVALID KEY
                   WRITE CHECKPOINT-RECORD
           END-REWRITE

           DISPLAY 'Checkpoint created: ' WS-RECORD-COUNTER
                   ' records processed'.

       9000-FINALIZATION.
      *=============================================================
      * 程式結束處理
      *=============================================================
           IF WS-RETURN-CODE = ZEROES
      *        寫入完成 Checkpoint
               MOVE 'F' TO CK-STATUS
               REWRITE CHECKPOINT-RECORD
               DISPLAY 'Batch completed successfully'
               DISPLAY 'Total records: ' WS-RECORD-COUNTER
               DISPLAY 'Total interest: ' WS-BATCH-TOTAL
           ELSE
      *        寫入錯誤 Checkpoint
               MOVE 'E' TO CK-STATUS
               MOVE WS-RETURN-CODE TO CK-ERROR-CODE
               MOVE 'Batch failed' TO CK-ERROR-MESSAGE
               REWRITE CHECKPOINT-RECORD
               DISPLAY 'Batch failed with code: ' WS-RETURN-CODE
           END-IF

           CLOSE ACCT-BALANCE-FILE
                  INTEREST-OUTPUT-FILE
                  CHECKPOINT-FILE.
```

---

## 四、JCL 中的 Restart 設定

### 4.1 標準 JCL 作業

```jcl
//CLMBAT02 JOB (ACCT),'INTEREST CALC BATCH',
//             CLASS=A,MSGCLASS=H,NOTIFY=&SYSUID
//*
//* 利息計算批次作業 - 支援 Restart
//*
//* 執行方式：
//*   1. 正常執行：//SYSIN DD * 留空或輸入 'N'
//*   2. Restart：//SYSIN DD * 輸入 'Y'
//*
//STEP01   EXEC PGM=CLMBAT02
//STEPLIB  DD DSN=CLM.PROD.LOADLIB,DISP=SHR
//ACCTBAL  DD DSN=CLM.DAILY.ACCT.BALANCE,DISP=SHR
//INTOUT   DD DSN=CLM.OUTPUT.DAILY.INT(+1),
//             DISP=(NEW,CATLG,DELETE),
//             SPACE=(CYL,(100,50),RLSE),
//             DCB=(RECFM=FB,LRECL=256,BLKSIZE=0)
//CHKPT    DD DSN=CLM.CHECKPOINT.CLMBAT02,
//             DISP=SHR
//SYSOUT   DD SYSOUT=*
//SYSUDUMP DD SYSOUT=*
//SYSPRINT DD SYSOUT=*
//SYSIN    DD *
N          <- 'Y' = Restart mode, 'N' = Fresh start
/*
```

### 4.2 Restart 執行流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    Restart 執行流程                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  第一次執行（正常）：                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ $ submit CLMBAT02.jcl                                   │   │
│  │ //SYSIN DD *                                            │   │
│  │ N          <- Fresh start                               │   │
│  │ /*                                                      │   │
│  │                                                         │   │
│  │ 結果：處理 1,000,000 筆，第 800,000 筆時失敗           │   │
│  │ 狀態：CK-STATUS = 'E' (Error)                          │   │
│  │        CK-RECORD-COUNT = 800,000                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          ↓                                      │
│  修正問題後 Restart：                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ $ submit CLMBAT02.jcl                                   │   │
│  │ //SYSIN DD *                                            │   │
│  │ Y          <- Restart mode                              │   │
│  │ /*                                                      │   │
│  │                                                         │   │
│  │ 結果：從第 800,001 筆開始，處理剩餘 200,000 筆          │   │
│  │ 狀態：CK-STATUS = 'F' (Complete)                       │   │
│  │        CK-RECORD-COUNT = 1,000,000                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 五、BA 在批次異常時的分析重點

### 5.1 批次失敗時的檢查清單

```
┌─────────────────────────────────────────────────────────────────┐
│                    批次失敗分析檢查清單                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: 確認失敗範圍                                           │
│  ├── 哪個 Job 失敗？（CLMBAT01/02/03/04）                      │
│  ├── 哪個 Step 失敗？                                          │
│  └── 影響多少筆資料？（查看 Checkpoint 記錄）                  │
│                                                                 │
│  Step 2: 查看錯誤訊息                                           │
│  ├── SYSOUT/SYSPRINT 輸出                                       │
│  ├── Checkpoint 檔案的 CK-ERROR-MESSAGE                        │
│  └── 系統日誌（SYSLOG）                                         │
│                                                                 │
│  Step 3: 判斷錯誤類型                                           │
│  ├── 資料錯誤 → 修正資料後 Restart                             │
│  ├── 程式錯誤 → 聯繫開發人員                                   │
│  ├── 檔案問題 → 檢查 Dataset 狀態                              │
│  └── 系統問題 → 聯繫系統管理員                                 │
│                                                                 │
│  Step 4: 評估影響                                               │
│  ├── 是否影響已完成的批次？                                    │
│  ├── 是否影響 Online 交易？                                    │
│  └── 是否需要通知用戶？                                        │
│                                                                 │
│  Step 5: 決定處理方式                                           │
│  ├── Restart 是否安全？                                        │
│  ├── 是否需要回滾（Rollback）？                                │
│  └── 是否需要改天再跑？                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 與開發/維運團隊的溝通範本

```
【批次異常通知】CLMBAT02 利息計算批次失敗

時間：2024-11-01 03:15
Job：CLMBAT02
Step：STEP01

錯誤資訊：
- 錯誤代碼：9999
- 錯誤訊息：Divide by zero in interest calculation
- 最後 Checkpoint：第 800,000 筆
- 帳號：999-999-9-888888-8

影響評估：
- 已處理：800,000 筆
- 未處理：約 200,000 筆
- 預估修復時間：30 分鐘（修正資料後 Restart）

建議處理方式：
1. 檢查帳號 999-999-9-888888-8 的利率定義
2. 修正利率為有效值
3. Restart 批次作業

請開發團隊協助確認利率資料問題。
```

---

## 六、練習題

### 練習 1：Checkpoint 間隔設計
若批次處理 500 萬筆帳戶，每筆處理時間 0.1 秒，Checkpoint 建立時間 2 秒。
- 若 Checkpoint 間隔設為 10,000 筆，總時間增加多少？
- 若設為 100,000 筆，Restart 時最多需要重跑多少筆？
- 如何決定最佳 Checkpoint 間隔？

### 練習 2：錯誤處理設計
設計一個機制：當某筆帳戶計算失敗時，不中止整個批次，而是記錄錯誤並繼續處理下一筆。

### 練習 3：BA 分析報告
假設 CLMBAT02 在處理 MCN 多貨幣帳戶時失敗，請撰寫一份給主管的影響分析報告。

---

## 七、總結

### 本課程重點

✅ **理解批次失敗的常見原因與影響範圍**
- 資料錯誤、檔案問題、程式錯誤、資源競爭、系統問題

✅ **掌握 Restart/Checkpoint 機制的設計原理**
- Checkpoint 檔案結構與更新時機
- Restart 時的定位與恢復邏輯

✅ **學會設計可重啟的批次程式架構**
- 初始化時檢查 Checkpoint
- 主迴圈中定期建立 Checkpoint
- 結束時更新最終狀態

✅ **了解 BA 在批次異常時的分析與溝通重點**
- 檢查清單：範圍、訊息、類型、影響、處理方式
- 與開發/維運團隊的溝通範本

### 對應 CLM 功能說明書

| 章節 | 內容 | 程式實作 |
|------|------|----------|
| 批次處理流程 | 日終批次架構 | CLMBAT01~04 |
| 錯誤處理 | 異常處理機制 | 9000-FINALIZATION |
| 資料一致性 | Checkpoint 設計 | 2300-WRITE-CHECKPOINT |

### 延伸學習

- **Lesson 6-1**：利息計算引擎（Tier/Slab/Hybrid）
- **Lesson 6-2**：利率覆蓋機制（Pricing Override）
- **Lesson 4-3**：日終批次處理流程

---

*本課程內容基於 CLM 批次處理實務與主機 Restart 最佳實踐編寫*
*Last Updated: 2024-11-01*