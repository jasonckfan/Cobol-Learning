# Lesson 6-1: CLM 利息計算引擎剖析

> 深入理解銀行核心系統的計息邏輯設計與 COBOL 實作

---

## 學習目標

- 理解 Tier/Slab/Hybrid 三種計息模式的設計差異
- 掌握 CLM 利息計算的核心 COBOL 程式結構
- 學會設計可擴展的利率分層計算引擎
- 了解主機環境下的效能考量

---

## 一、利率分層結構概述

### 1.1 Tier vs Slab 比較

```
┌─────────────────────────────────────────────────────────────────┐
│              利率分層結構（Pricing Structure）                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐              ┌─────────────┐                  │
│  │    Tier     │              │    Slab     │                  │
│  │   (分層)    │              │   (級距)    │                  │
│  └──────┬──────┘              └──────┬──────┘                  │
│         │                            │                        │
│         ▼                            ▼                        │
│  總餘額決定單一利率            各級距分別計息                   │
│                                                                 │
│  例：餘額 $60,000             例：餘額 $60,000                 │
│                                                                 │
│  Tier 1: $0-10K               Slab 1: $0-10K  × 利率 0.5%      │
│  Tier 2: $10K-50K             Slab 2: $10K-50K × 利率 1.0%     │
│  Tier 3: >$50K                Slab 3: >$50K    × 利率 1.5%     │
│                                                                 │
│  → 全部 $60K 都用 Tier 3      → 總利息 = $10K×0.5%            │
│    利率 1.5%                        + $40K×1.0%                │
│                                     + $10K×1.5%                │
│                                                                 │
│  應用：GIO, SNP, NPN, NPB      應用：CDA                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 GIO Balance Method（計息方法）

```
┌─────────────────────────────────────────────────────────────────┐
│              GIO 計息方法（Balance Method）                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │    Gross    │    │     Net     │    │   Hybrid    │         │
│  │   (毛額)    │    │   (淨額)    │    │   (混合)    │         │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘         │
│         │                  │                  │                │
│         ▼                  ▼                  ▼                │
│  正負餘額分開計算      正負相抵後計算      結合兩者邏輯         │
│                                                                 │
│  例：帳戶群有 3 個帳戶                                      │
│  ┌─────────┐                                                   │
│  │ Ac1: +$50K │ → 適用存款利率 Tier 3 (1.5%)                  │
│  │ Ac2: +$30K │ → 適用存款利率 Tier 2 (1.0%)                  │
│  │ Ac3: -$20K │ → 適用透支利率 Tier 1 (5.0%)                  │
│  └─────────┘                                                   │
│                                                                 │
│  Gross 計息：                                                  │
│  存款利息 = ($50K×1.5% + $30K×1.0%) / 365                     │
│  透支利息 = ($20K×5.0%) / 365                                  │
│                                                                 │
│  Net 計息（總餘額 = +$60K）：                                   │
│  全部視為存款，適用 Tier 3 利率 1.5%                           │
│                                                                 │
│  Hybrid 計息：                                                 │
│  淨額為正 → 用 Gross 計算存款利息                              │
│  淨額為負 → 用 Net 計算透支利息                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 CLM 產品對應關係

| 產品 | Pricing Structure | Balance Method | 說明 |
|------|-------------------|----------------|------|
| **CDA** | Slab | - | 企業存款，各級距分別計息 |
| **GIO** | Tier | Gross/Net/Hybrid | 綜合利息優化，可選計息方法 |
| **SNP** | Tier | Gross/Net | 單一貨幣名義資金歸集 |
| **NPN** | Tier | Net | 名義資金歸集 - 普通版 |
| **NPB** | Tier | Net | 名義資金歸集 - 受益版 |
| **MCN** | Tier | Gross + 息差分配 | 多貨幣名義資金歸集 |

**關鍵區分：**
- **Pricing Structure**（利率結構）：決定「利率怎麼定」→ Tier 或 Slab
- **Balance Method**（計息方法）：決定「餘額怎麼算」→ Gross, Net, Hybrid

---

## 二、核心資料結構設計

### 2.1 利率分層定義檔 (VSAM)

```cobol
      *=============================================================*
      * 利率分層主檔 - PRICING-TIER-MASTER                         *
      * 對應 CLM 功能說明書：Tier Threshold / LM Benchmark         *
      *=============================================================*
       01  PRICING-TIER-RECORD.
           05  PT-KEY.
               10  PT-PRICING-ID         PIC X(06).     
               10  PT-CURRENCY            PIC X(03).
               10  PT-TIER-LEVEL          PIC 9(02).
           05  PT-THRESHOLD-AMT          PIC 9(15)V9(02) COMP-3.
           05  PT-LM-BENCHMARK           PIC X(20).
           05  PT-SPREAD-RATE            PIC S9(03)V9(06) COMP-3.
           05  PT-FLAT-RATE              PIC S9(03)V9(06) COMP-3.
           05  PT-RATE-TYPE              PIC X(01).
               88  PT-RATE-TIER               VALUE 'T'.
               88  PT-RATE-SLAB               VALUE 'S'.
           05  PT-EFFECTIVE-DATE         PIC 9(08).
           05  PT-EXPIRY-DATE            PIC 9(08).
           05  PT-LAST-UPDATE            PIC 9(08).
           05  PT-UPDATE-BY              PIC X(08).
```

### 2.2 帳戶餘額資料結構

```cobol
      *=============================================================*
      * 帳戶日終餘額檔 - ACCOUNT-DAILY-BALANCE                      *
      *=============================================================*
       01  ACCT-BAL-RECORD.
           05  AB-KEY.
               10  AB-ACCT-NUMBER       PIC X(14).
               10  AB-CURRENCY          PIC X(03).
               10  AB-BUSINESS-DATE     PIC 9(08).
           05  AB-DAILY-BALANCE        PIC S9(15)V9(02) COMP-3.
           05  AB-ACCRUED-INTEREST     PIC S9(15)V9(02) COMP-3.
           05  AB-INTEREST-RATE        PIC S9(03)V9(06) COMP-3.
           05  AB-CALC-METHOD          PIC X(01).
               88  AB-CALC-TIER               VALUE 'T'.
               88  AB-CALC-SLAB               VALUE 'S'.
               88  AB-CALC-HYBRID             VALUE 'H'.
           05  AB-PRICING-ID           PIC X(06).
           05  AB-GROUP-ID             PIC X(11).
           05  AB-PRODUCT-TYPE         PIC X(03).
               88  AB-PROD-CDA                VALUE 'CDA'.
               88  AB-PROD-GIO                VALUE 'GIO'.
               88  AB-PROD-SNP                VALUE 'SNP'.
               88  AB-PROD-MCN                VALUE 'MCN'.
```

---

## 三、計算引擎實作

### 3.0 程式架構總覽

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLMINT01 程式架構                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  主程式控制 (0000-MAIN-CONTROL)                                 │
│  ├── 1000-INITIALIZATION        ← 檔案開啟、參數初始化         │
│  ├── 2000-PROCESS-ACCOUNTS      ← 逐筆處理帳戶                 │
│  │   └── 2100-CALCULATE-INTEREST                               │
│  │       ├── 2200-CALC-SLAB-MODE  ← CDA 產品                   │
│  │       ├── 2300-CALC-TIER-MODE  ← SNP/NPN/NPB 產品           │
│  │       ├── 2310-CALC-GROSS      ← GIO Gross 方法             │
│  │       ├── 2320-CALC-NET        ← GIO Net 方法               │
│  │       ├── 2330-CALC-HYBRID     ← GIO Hybrid 方法            │
│  │       └── 2400-CALC-MCN-MODE   ← MCN 產品                   │
│  └── 9000-FINALIZATION          ← 檔案關閉、統計輸出           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.1 核心計算程式結構

```cobol
      *=============================================================*
      * PROGRAM-ID: CLMINT01                                       *
      * PROGRAM-NAME: CLM Interest Calculation Engine - Tier Mode  *
      * DESCRIPTION:  根據總餘額決定適用利率，計算當日利息         *
      * AUTHOR:       Bank IT BA Team                              *
      * DATE:         2024-11-01                                   *
      *=============================================================*
       IDENTIFICATION DIVISION.
       PROGRAM-ID. CLMINT01.
       AUTHOR. BANK-IT-BA.
       DATE-WRITTEN. 2024-11-01.
       DATE-COMPILED. 2024-11-01.

       ENVIRONMENT DIVISION.
       CONFIGURATION SECTION.
       SOURCE-COMPUTER. IBM-370.
       OBJECT-COMPUTER. IBM-370.

       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT PRICING-TIER-FILE
               ASSIGN TO UT-S-PRICING
               ORGANIZATION IS INDEXED
               ACCESS MODE IS DYNAMIC
               RECORD KEY IS PT-KEY
               FILE STATUS IS WS-PRICING-STATUS.

           SELECT ACCT-BALANCE-FILE
               ASSIGN TO UT-S-ACCTBAL
               ORGANIZATION IS INDEXED
               ACCESS MODE IS SEQUENTIAL
               RECORD KEY IS AB-KEY
               FILE STATUS IS WS-ACCTBAL-STATUS.

           SELECT INTEREST-OUTPUT-FILE
               ASSIGN TO UT-S-INTOUT
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-INTOUT-STATUS.

       DATA DIVISION.
       FILE SECTION.
       FD  PRICING-TIER-FILE
           RECORD CONTAINS 128 CHARACTERS
           BLOCK CONTAINS 0 RECORDS
           LABEL RECORDS ARE STANDARD.
       COPY PRICINGR.

       FD  ACCT-BALANCE-FILE
           RECORD CONTAINS 256 CHARACTERS
           BLOCK CONTAINS 0 RECORDS
           LABEL RECORDS ARE STANDARD.
       COPY ACCTBALR.

       FD  INTEREST-OUTPUT-FILE
           RECORD CONTAINS 256 CHARACTERS
           BLOCK CONTAINS 0 RECORDS
           LABEL RECORDS ARE STANDARD.
       01  INT-OUTPUT-RECORD         PIC X(256).

       WORKING-STORAGE SECTION.
      *-------------------------------------------------------------
      * 程式狀態與控制變數
      *-------------------------------------------------------------
       01  WS-PROGRAM-CONTROL.
           05  WS-PRICING-STATUS     PIC X(02) VALUE '00'.
               88  PRICING-OK                 VALUE '00'.
               88  PRICING-NOT-FOUND          VALUE '23'.
           05  WS-ACCTBAL-STATUS     PIC X(02) VALUE '00'.
           05  WS-INTOUT-STATUS      PIC X(02) VALUE '00'.
           05  WS-BUSINESS-DATE      PIC 9(08) VALUE ZEROES.
           05  WS-PROCESS-COUNT      PIC 9(09) VALUE ZEROES.
           05  WS-ERROR-COUNT        PIC 9(09) VALUE ZEROES.

      *-------------------------------------------------------------
      * 計算工作區域
      *-------------------------------------------------------------
       01  WS-CALCULATION-WORK.
           05  WS-ACCT-BALANCE       PIC S9(15)V9(02) COMP-3.
           05  WS-ABS-BALANCE        PIC 9(15)V9(02) COMP-3.
           05  WS-DAILY-INTEREST     PIC S9(15)V9(02) COMP-3.
           05  WS-APPLICABLE-RATE    PIC S9(03)V9(06) COMP-3.
           05  WS-LM-BASE-RATE       PIC S9(03)V9(06) COMP-3.
           05  WS-FINAL-RATE         PIC S9(03)V9(06) COMP-3.
           05  WS-DAYS-IN-YEAR       PIC 9(03) VALUE 365.
           05  WS-TIER-FOUND         PIC X(01) VALUE 'N'.
               88  TIER-FOUND                 VALUE 'Y'.
      *    Gross 方法專用變數
           05  WS-GROSS-CREDIT-INT   PIC S9(15)V9(02) COMP-3.
           05  WS-GROSS-DEBIT-INT    PIC S9(15)V9(02) COMP-3.
           05  WS-NET-BALANCE        PIC S9(15)V9(02) COMP-3.

      *-------------------------------------------------------------
      * 輸出記錄格式
      *-------------------------------------------------------------
       01  WS-INTEREST-OUTPUT.
           05  IO-ACCT-NUMBER        PIC X(14).
           05  IO-CURRENCY           PIC X(03).
           05  IO-BUSINESS-DATE      PIC 9(08).
           05  IO-DAILY-BALANCE      PIC S9(15)V9(02) COMP-3.
           05  IO-INTEREST-AMOUNT    PIC S9(15)V9(02) COMP-3.
           05  IO-INTEREST-RATE      PIC S9(03)V9(06) COMP-3.
           05  IO-TIER-LEVEL         PIC 9(02).
           05  IO-CALC-METHOD        PIC X(01).
           05  IO-PRICING-ID         PIC X(06).
           05  IO-GROUP-ID           PIC X(11).
           05  IO-FILLER             PIC X(185).

      *-------------------------------------------------------------
      * 常數定義
      *-------------------------------------------------------------
       01  WS-CONSTANTS.
           05  WS-MAX-TIER-LEVELS    PIC 9(02) VALUE 10.
           05  WS-DEFAULT-DAYS       PIC 9(03) VALUE 365.
           05  WS-HKD-DAYS           PIC 9(03) VALUE 365.
           05  WS-USD-DAYS           PIC 9(03) VALUE 360.

       LINKAGE SECTION.
       01  LS-PARAMETERS.
           05  LS-BUSINESS-DATE      PIC 9(08).
           05  LS-PROCESS-TYPE       PIC X(01).
               88  PROCESS-TIER               VALUE 'T'.
               88  PROCESS-SLAB               VALUE 'S'.
               88  PROCESS-HYBRID             VALUE 'H'.
           05  LS-RETURN-CODE        PIC 9(04).

       PROCEDURE DIVISION USING LS-PARAMETERS.
       0000-MAIN-CONTROL.
      *=============================================================
      * 主程式控制流程
      *=============================================================
           DISPLAY 'CLMINT01 - Interest Calculation Engine Started'
           DISPLAY 'Business Date: ' LS-BUSINESS-DATE
           DISPLAY 'Process Type:  ' LS-PROCESS-TYPE

           PERFORM 1000-INITIALIZATION
           PERFORM 2000-PROCESS-ACCOUNTS
               UNTIL WS-ACCTBAL-STATUS = '10'
           PERFORM 9000-FINALIZATION

           MOVE ZEROES TO LS-RETURN-CODE
           GOBACK.

       1000-INITIALIZATION.
      *=============================================================
      * 程式初始化
      *=============================================================
           MOVE LS-BUSINESS-DATE TO WS-BUSINESS-DATE

           OPEN INPUT PRICING-TIER-FILE
           IF NOT PRICING-OK
               DISPLAY 'ERROR: Cannot open Pricing Tier File'
               DISPLAY 'File Status: ' WS-PRICING-STATUS
               MOVE 9999 TO LS-RETURN-CODE
               GOBACK
           END-IF

           OPEN INPUT ACCT-BALANCE-FILE
           IF WS-ACCTBAL-STATUS NOT = '00'
               DISPLAY 'ERROR: Cannot open Account Balance File'
               DISPLAY 'File Status: ' WS-ACCTBAL-STATUS
               MOVE 9999 TO LS-RETURN-CODE
               GOBACK
           END-IF

           OPEN OUTPUT INTEREST-OUTPUT-FILE
           IF WS-INTOUT-STATUS NOT = '00'
               DISPLAY 'ERROR: Cannot open Interest Output File'
               DISPLAY 'File Status: ' WS-INTOUT-STATUS
               MOVE 9999 TO LS-RETURN-CODE
               GOBACK
           END-IF

           DISPLAY 'Initialization Complete'.

       2000-PROCESS-ACCOUNTS.
      *=============================================================
      * 處理每個帳戶的利息計算
      *=============================================================
           READ ACCT-BALANCE-FILE
               AT END
                   DISPLAY 'End of Account Balance File reached'
               NOT AT END
                   ADD 1 TO WS-PROCESS-COUNT
                   PERFORM 2100-CALCULATE-INTEREST
           END-READ.

       2100-CALCULATE-INTEREST.
      *=============================================================
      * 計算單一帳戶利息 - Tier 模式
      *=============================================================
      *    步驟 1: 取得帳戶餘額
           MOVE AB-DAILY-BALANCE TO WS-ACCT-BALANCE
           COMPUTE WS-ABS-BALANCE = FUNCTION ABS(WS-ACCT-BALANCE)

      *    步驟 2: 根據產品類型和計息方法決定計算方式
           EVALUATE TRUE
               WHEN AB-PROD-CDA
      *            CDA 使用 Slab 結構
                   PERFORM 2200-CALC-SLAB-MODE

               WHEN AB-PROD-GIO
      *            GIO 使用 Tier 結構，但需判斷 Balance Method
                   EVALUATE AB-BALANCE-METHOD
                       WHEN 'G'
                           PERFORM 2310-CALC-GROSS
                       WHEN 'N'
                           PERFORM 2320-CALC-NET
                       WHEN 'H'
                           PERFORM 2330-CALC-HYBRID
                       WHEN OTHER
                           PERFORM 2320-CALC-NET
                   END-EVALUATE

               WHEN AB-PROD-SNP OR AB-PROD-NPN OR AB-PROD-NPB
      *            SNP/NPN/NPB 使用 Tier 結構 + Net 方法
                   PERFORM 2320-CALC-NET

               WHEN AB-PROD-MCN
      *            MCN 使用 Tier 結構 + 息差分配
                   PERFORM 2400-CALC-MCN-MODE

               WHEN OTHER
                   DISPLAY 'WARNING: Unknown product type '
                           AB-PRODUCT-TYPE
                           ' for account ' AB-ACCT-NUMBER
                   ADD 1 TO WS-ERROR-COUNT
           END-EVALUATE

      *    步驟 3: 輸出計算結果
           PERFORM 2500-WRITE-OUTPUT-RECORD.

       2200-CALC-SLAB-MODE.
      *=============================================================
      * Slab 模式計算 - 各級距分別計息
      *=============================================================
      *    對應 CLM 功能說明書：6.3.1.6 Slab 計算方法
      *    例：餘額 $60,000，分三級距
      *        Slab 1: $0-10K  × 利率 0.5%
      *        Slab 2: $10K-50K × 利率 1.0%
      *        Slab 3: $50K+    × 利率 1.5%
      *    總利息 = $10K×0.5% + $40K×1.0% + $10K×1.5%

           MOVE ZEROES TO WS-DAILY-INTEREST
           MOVE 1 TO PT-TIER-LEVEL

           PERFORM UNTIL PT-TIER-LEVEL > WS-MAX-TIER-LEVELS
               PERFORM 2210-READ-PRICING-TIER
               IF TIER-FOUND
                   PERFORM 2220-CALC-SLAB-SEGMENT
               ELSE
                   EXIT PERFORM
               END-IF
               ADD 1 TO PT-TIER-LEVEL
           END-PERFORM.

       2210-READ-PRICING-TIER.
      *-------------------------------------------------------------
      * 讀取利率分層定義
      *-------------------------------------------------------------
           MOVE AB-PRICING-ID TO PT-PRICING-ID
           MOVE AB-CURRENCY TO PT-CURRENCY

           READ PRICING-TIER-FILE
               INVALID KEY
                   MOVE 'N' TO WS-TIER-FOUND
               NOT INVALID KEY
                   MOVE 'Y' TO WS-TIER-FOUND
           END-READ.

       2220-CALC-SLAB-SEGMENT.
      *-------------------------------------------------------------
      * 計算單一級距利息
      *-------------------------------------------------------------
           IF WS-ABS-BALANCE > PT-THRESHOLD-AMT
      *        計算本級距適用金額
               COMPUTE WS-APPLICABLE-RATE = PT-FLAT-RATE
               IF PT-LM-BENCHMARK NOT = SPACES
                   PERFORM 2230-GET-LM-BENCHMARK
                   COMPUTE WS-FINAL-RATE = WS-LM-BASE-RATE
                                         + PT-SPREAD-RATE
               ELSE
                   MOVE WS-APPLICABLE-RATE TO WS-FINAL-RATE
               END-IF

      *        計算本級距利息
               COMPUTE WS-DAILY-INTEREST =
                       WS-DAILY-INTEREST +
                       (PT-THRESHOLD-AMT * WS-FINAL-RATE)
                       / (WS-DAYS-IN-YEAR * 100)

      *        扣除已計算金額
               SUBTRACT PT-THRESHOLD-AMT FROM WS-ABS-BALANCE
           ELSE
      *        最後一級距（剩餘金額）
               COMPUTE WS-DAILY-INTEREST =
                       WS-DAILY-INTEREST +
                       (WS-ABS-BALANCE * WS-FINAL-RATE)
                       / (WS-DAYS-IN-YEAR * 100)
               MOVE ZEROES TO WS-ABS-BALANCE
           END-IF.

       2230-GET-LM-BENCHMARK.
      *-------------------------------------------------------------
      * 取得 LM Benchmark 基準利率
      *    對應 CLM 功能說明書：5.11 LM Benchmark
      *    例：HIBID = 5.00%，Percentage = 90%
      *        LM Benchmark = 5.00% × 90% = 4.50%
      *        Product Spread = -1.00%
      *        Final Rate = 4.50% - 1.00% = 3.50%
      *-------------------------------------------------------------
           MOVE 4.50 TO WS-LM-BASE-RATE
      *    實際應呼叫子程式或查表取得
      *    CALL 'LMBENCH' USING PT-LM-BENCHMARK
      *                         WS-LM-BASE-RATE
      *                         WS-RETURN-CODE.

       2300-CALC-TIER-MODE.
      *=============================================================
      * Tier 結構計算 - 總餘額決定單一利率
      *    這是基礎 Tier 計算，Gross/Net/Hybrid 都會呼叫
      *=============================================================
           MOVE 1 TO PT-TIER-LEVEL
           MOVE 'N' TO WS-TIER-FOUND

           PERFORM UNTIL PT-TIER-LEVEL > WS-MAX-TIER-LEVELS
               PERFORM 2210-READ-PRICING-TIER
               IF TIER-FOUND
                   IF WS-ABS-BALANCE <= PT-THRESHOLD-AMT
                       PERFORM 2350-APPLY-TIER-RATE
                       MOVE 'Y' TO WS-TIER-FOUND
                       EXIT PERFORM
                   END-IF
               ELSE
                   EXIT PERFORM
               END-IF
               ADD 1 TO PT-TIER-LEVEL
           END-PERFORM

           IF NOT TIER-FOUND
      *        超過最高級距，使用最高級距利率
               SUBTRACT 1 FROM PT-TIER-LEVEL
               PERFORM 2210-READ-PRICING-TIER
               PERFORM 2350-APPLY-TIER-RATE
           END-IF.

       2310-CALC-GROSS.
      *=============================================================
      * Gross 方法計算 - 正負餘額分開計算
      *    對應 CLM 功能說明書：6.3.2.6.1 Gross 計算
      *=============================================================
      *    步驟 1: 計算正餘額利息（存款）
           IF WS-ACCT-BALANCE > 0
               MOVE WS-ACCT-BALANCE TO WS-ABS-BALANCE
               PERFORM 2300-CALC-TIER-MODE
               MOVE WS-DAILY-INTEREST TO WS-GROSS-CREDIT-INT
           ELSE
               MOVE ZEROES TO WS-GROSS-CREDIT-INT
           END-IF

      *    步驟 2: 計算負餘額利息（透支）
           IF WS-ACCT-BALANCE < 0
               COMPUTE WS-ABS-BALANCE = FUNCTION ABS(WS-ACCT-BALANCE)
      *        切換到透支利率定義（假設有不同的 Pricing ID）
               PERFORM 2300-CALC-TIER-MODE
               MOVE WS-DAILY-INTEREST TO WS-GROSS-DEBIT-INT
           ELSE
               MOVE ZEROES TO WS-GROSS-DEBIT-INT
           END-IF

      *    步驟 3: 總利息 = 存款利息 - 透支利息
           COMPUTE WS-DAILY-INTEREST =
                   WS-GROSS-CREDIT-INT - WS-GROSS-DEBIT-INT.

       2320-CALC-NET.
      *=============================================================
      * Net 方法計算 - 正負相抵後計算
      *    對應 CLM 功能說明書：6.3.2.6.2 Net 計算
      *=============================================================
      *    步驟 1: 計算淨餘額
      *    （帳戶群層級已計算，這裡直接使用）

      *    步驟 2: 淨餘額決定單一利率
           PERFORM 2300-CALC-TIER-MODE.

       2330-CALC-HYBRID.
      *=============================================================
      * Hybrid 方法計算 - 結合 Gross 和 Net
      *    對應 CLM 功能說明書：6.3.2.6.3 Hybrid 計算
      *=============================================================
      *    邏輯：
      *    - 淨餘額為正（存款為主）：用 Gross 方法，保留存款優惠
      *    - 淨餘額為負（透支為主）：用 Net 方法，簡化計算

      *    先計算淨餘額
           IF WS-ACCT-BALANCE >= 0
      *        淨額為正，用 Gross 計算
               PERFORM 2310-CALC-GROSS
           ELSE
      *        淨額為負，用 Net 計算
               PERFORM 2320-CALC-NET
           END-IF.

       2350-APPLY-TIER-RATE.
      *-------------------------------------------------------------
      * 套用 Tier 利率計算總利息
      *-------------------------------------------------------------
           COMPUTE WS-APPLICABLE-RATE = PT-FLAT-RATE
           IF PT-LM-BENCHMARK NOT = SPACES
               PERFORM 2230-GET-LM-BENCHMARK
               COMPUTE WS-FINAL-RATE = WS-LM-BASE-RATE
                                     + PT-SPREAD-RATE
           ELSE
               MOVE WS-APPLICABLE-RATE TO WS-FINAL-RATE
           END-IF

      *    計算當日利息 = 餘額 × 利率 / 年天數
           COMPUTE WS-DAILY-INTEREST =
                   (WS-ACCT-BALANCE * WS-FINAL-RATE)
                   / (WS-DAYS-IN-YEAR * 100).

       2400-CALC-MCN-MODE.
      *=============================================================
      * MCN 多貨幣計算模式
      *=============================================================
      *    對應 CLM 功能說明書：6.3.2.6.3 Hybrid 計算
      *    1. 先計算各貨幣的 Gross/Net 利息
      *    2. 進行息差分配 (Interest Reallocation)
      *    3. 輸出分配後結果

           PERFORM 2300-CALC-TIER-MODE
      *    實際 MCN 還需呼叫息差分配子程式
      *    CALL 'MCNREALLOC' USING ...
           .

       2500-WRITE-OUTPUT-RECORD.
      *=============================================================
      * 輸出利息計算結果
      *=============================================================
           MOVE AB-ACCT-NUMBER TO IO-ACCT-NUMBER
           MOVE AB-CURRENCY TO IO-CURRENCY
           MOVE WS-BUSINESS-DATE TO IO-BUSINESS-DATE
           MOVE WS-ACCT-BALANCE TO IO-DAILY-BALANCE
           MOVE WS-DAILY-INTEREST TO IO-INTEREST-AMOUNT
           MOVE WS-FINAL-RATE TO IO-INTEREST-RATE
           MOVE PT-TIER-LEVEL TO IO-TIER-LEVEL
           MOVE AB-CALC-METHOD TO IO-CALC-METHOD
           MOVE AB-PRICING-ID TO IO-PRICING-ID
           MOVE AB-GROUP-ID TO IO-GROUP-ID

           WRITE INT-OUTPUT-RECORD FROM WS-INTEREST-OUTPUT
               INVALID KEY
                   DISPLAY 'ERROR: Write output failed'
                   ADD 1 TO WS-ERROR-COUNT
           END-WRITE.

       9000-FINALIZATION.
      *=============================================================
      * 程式結束處理
      *=============================================================
           CLOSE PRICING-TIER-FILE
                  ACCT-BALANCE-FILE
                  INTEREST-OUTPUT-FILE

           DISPLAY '========================================'
           DISPLAY 'CLMINT01 Processing Complete'
           DISPLAY 'Total Accounts Processed: ' WS-PROCESS-COUNT
           DISPLAY 'Total Errors:             ' WS-ERROR-COUNT
           DISPLAY '========================================'.
```

---

## 四、關鍵設計考量

### 4.1 效能優化策略

```
┌─────────────────────────────────────────────────────────────────┐
│                    主機批次效能優化                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 檔案組織優化                                                │
│     ├── 帳戶餘額檔：按帳號排序，Sequential Access               │
│     ├── 利率定義檔：Indexed，快速查詢                           │
│     └── 輸出檔：Sequential，大量寫入                            │
│                                                                 │
│  2. 記憶體管理                                                  │
│     ├── 使用 COMP-3 壓縮數字，節省空間                          │
│     ├── 避免動態記憶體分配                                      │
│     └── 預先定義最大級距數量 (10級)                             │
│                                                                 │
│  3. 計算精度                                                    │
│     ├── 金額：PIC 9(15)V9(02) - 支援兆級金額                    │
│     ├── 利率：PIC S9(03)V9(06) - 小數點後6位精度                │
│     └── 使用 COMPUTE 避免手動計算錯誤                           │
│                                                                 │
│  4. 錯誤處理                                                    │
│     ├── 檔案狀態檢查每個 I/O 操作                               │
│     ├── 無效利率定義時使用預設值                                │
│     └── 記錄錯誤但不中斷整體處理                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 對應 CLM 功能說明書

| 功能說明書章節 | 程式實作對應 | 說明 |
|----------------|--------------|------|
| 5.11 LM Benchmark | `2230-GET-LM-BENCHMARK` | 基準利率查詢 |
| 5.12 Base Currency | `AB-CURRENCY` | 基礎貨幣處理 |
| 5.15 Currency Tier | `PT-THRESHOLD-AMT` | 分層門檻定義 |
| 6.3.1.6 Slab 計算 | `2200-CALC-SLAB-MODE` | CDA 級距計息 |
| 6.3.2.6.1 Gross 計算 | `2310-CALC-GROSS` | 正負分開計算 |
| 6.3.2.6.2 Net 計算 | `2320-CALC-NET` | 淨額計算 |
| 6.3.2.6.3 Hybrid 計算 | `2330-CALC-HYBRID` | 混合計算方法 |
| 6.3.3.6.1 SNP Tier | `2300-CALC-TIER-MODE` | 名義資金歸集 |

---

## 五、測試案例設計

### 5.1 邊界值測試

```
測試案例 1：Tier 邊界測試
─────────────────────────
輸入：餘額 = $10,000.00 (剛好落在 Tier 1 上限)
預期：使用 Tier 2 利率 (因為超過 $10K)

測試案例 2：Slab 級距測試
─────────────────────────
輸入：餘額 = $60,000.00
預期：
  Slab 1: $10,000 × 0.5% / 365 = $0.1369
  Slab 2: $40,000 × 1.0% / 365 = $1.0959
  Slab 3: $10,000 × 1.5% / 365 = $0.4110
  總計: $1.6438

測試案例 3：負餘額測試 (透支)
─────────────────────────────
輸入：餘額 = -$5,000.00
預期：計算透支利息，利率為 Debit Interest Rate
```

### 5.2 JCL 測試作業

```jcl
//CLMINT01 JOB (ACCT),'INTEREST CALC TEST',
//             CLASS=A,MSGCLASS=H,NOTIFY=&SYSUID
//*
//* 利息計算批次測試
//*
//STEP01   EXEC PGM=CLMINT01
//STEPLIB  DD DSN=CLM.PROD.LOADLIB,DISP=SHR
//PRICING  DD DSN=CLM.REF.PRICING.TIER,DISP=SHR
//ACCTBAL  DD DSN=CLM.DAILY.ACCT.BALANCE,DISP=SHR
//INTOUT   DD DSN=CLM.OUTPUT.DAILY.INT(+1),
//             DISP=(NEW,CATLG,DELETE),
//             SPACE=(CYL,(10,5),RLSE),
//             DCB=(RECFM=FB,LRECL=256,BLKSIZE=0)
//SYSOUT   DD SYSOUT=*
//SYSUDUMP DD SYSOUT=*
//SYSPRINT DD SYSOUT=*
//SYSIN    DD *
20241101          <- Business Date
T                 <- Process Type: T=Tier
/*
```

---

## 六、練習題

### 練習 1：擴充功能
修改程式支援 **Leap Year (閏年)** 的 366 天計算。

### 練習 2：錯誤處理
新增當 `LM Benchmark` 找不到時的 **預設利率機制**。

### 練習 3：報表輸出
設計一個 **日終利息彙總報表** 程式，按產品類型統計總利息。

---

## 七、總結與延伸

### 7.1 本課程重點

✅ **理解 Tier/Slab/Hybrid 三種計息模式的設計差異**
- Tier：總餘額決定單一利率，計算簡單
- Slab：各級距分別計息，更精確
- Hybrid：結合兩者，適用複雜場景

✅ **掌握 CLM 利息計算的核心 COBOL 程式結構**
- 資料結構設計（Pricing Master / Account Balance）
- 模組化程式設計（Initialization → Process → Finalization）
- 錯誤處理與狀態管理

✅ **學會設計可擴展的利率分層計算引擎**
- 使用 EVALUATE 處理多產品類型
- 動態查詢利率定義檔
- 支援多種計算模式

✅ **了解主機環境下的效能考量**
- 檔案組織與存取方式
- 記憶體管理與資料壓縮
- 計算精度與數字處理

### 7.2 延伸學習

| 主題 | 相關課程 | 說明 |
|------|----------|------|
| 批次排程管理 | lesson-6-3-clm-batch-restart | CA-7/Control-M 排程設計 |
| 資料庫效能調校 | Performance Tuning Guide | DB2 SQL 優化 |
| 測試案例設計 | lesson-5-3-test-design | 邊界值與決策表 |
| 需求影響分析 | lesson-5-2-impact-analysis | 利率變更影響評估 |

### 7.3 參考資源

- **CLM 功能說明書**：`CLM/FS/CLM p1_1.pdf` ~ `CLM p7.pdf`
- **IBM COBOL 手冊**：Enterprise COBOL for z/OS
- **主機效能指南**：RMF/SMF 報表分析

---

## 附錄：完整程式碼

完整程式碼已上傳至 GitHub：
```
https://github.com/jasonckfan/Cobol-Learning/
├── src/
│   ├── CLMINT01.cbl          # Tier 計算引擎
│   ├── CLMINT02.cbl          # Slab 計算引擎
│   ├── CLMINT03.cbl          # Hybrid 計算引擎
│   └── CLMREALLOC.cbl        # 息差分配程式
├── jcl/
│   └── CLMINT01.jcl          # 批次作業 JCL
└── copybook/
    ├── PRICINGR.cpy          # 利率定義 Copybook
    └── ACCTBALR.cpy          # 帳戶餘額 Copybook
```

---

*本課程內容基於 CLM 2024 Nov 2.10_v1 功能說明書編寫*
*Last Updated: 2024-11-01*
