# Lesson 6-2: CLM 利率覆蓋機制（Pricing Override）

> 深入理解帳戶層面如何覆蓋群組層面的利率設定

---

## 學習目標

- 理解 Group Level vs Account Level 利率設定的階層關係
- 掌握 Override 機制的設計原理與實作
- 學會設計可擴展的利率覆蓋驗證邏輯
- 了解覆蓋設定對批次計息的影響

---

## 一、利率設定階層架構

### 1.1 CLM 利率設定三層架構

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLM 利率設定階層架構                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Level 1: Bank Level（銀行層面）                                │
│  ├── Standard Pricing（標準定價）                               │
│  │   └── 各產品的預設利率分層結構                               │
│  └── LM Benchmark（基準利率）                                   │
│      └── HIBID, LIBID, Prime Rate 等                           │
│                          ↓                                      │
│  Level 2: Group Level（帳戶群層面）← 可覆蓋 Bank Level          │
│  ├── Group Pricing（群組定價）                                  │
│  │   ├── Tailor-Made（客製定價）                                │
│  │   └── Refer Standard（參照標準）                             │
│  └── Override Flag（覆蓋旗標）                                  │
│      └── OVERRIDE GROUP LEVEL = Y/N                            │
│                          ↓                                      │
│  Level 3: Account Level（帳戶層面）← 可覆蓋 Group Level         │
│  ├── Account Pricing（帳戶定價）                                │
│  │   ├── Override Method（覆蓋方法）                            │
│  │   │   ├── OVERRIDE GROUP PRICING SPREAD                     │
│  │   │   ├── TAILOR-MADE PRICING                               │
│  │   │   └── WITH DEBIT INTEREST RATE                          │
│  │   └── Override Flag（逐欄位覆蓋）                            │
│  │       └── (0) = CAN OVERRIDE GROUP LEVEL SETUP              │
│  └── Effective Date（生效日期控制）                             │
│                                                                 │
│  覆蓋優先順序：Account Level > Group Level > Bank Level         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Override 機制核心概念

```
┌─────────────────────────────────────────────────────────────────┐
│                    Override 機制說明                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  場景：GIO 帳戶群的群組利率為 HIBID + 1%                        │
│        但某個大客戶帳戶要求更優惠的 HIBID + 0.5%               │
│                                                                 │
│  Group Level 設定：                                             │
│  ┌─────────────────────────────────────┐                       │
│  │ Group ID: GIO00000001               │                       │
│  │ LM Benchmark: HIBID                 │                       │
│  │ Spread: +1.00%                      │                       │
│  │ Final Rate: HIBID + 1%              │                       │
│  └─────────────────────────────────────┘                       │
│                          ↓ OVERRIDE                            │
│  Account Level 設定：                                           │
│  ┌─────────────────────────────────────┐                       │
│  │ Account: 999-999-9-999999-9         │                       │
│  │ Override: Y                         │                       │
│  │ LM Benchmark: HIBID ← 覆蓋          │                       │
│  │ Spread: +0.50% ← 覆蓋               │                       │
│  │ Final Rate: HIBID + 0.5%            │                       │
│  └─────────────────────────────────────┘                       │
│                                                                 │
│  計算結果：該帳戶使用 HIBID + 0.5%（而非群組的 HIBID + 1%）    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、資料結構設計

### 2.1 群組層面定價檔（Group Pricing）

```cobol
      *=============================================================*
      * 群組定價主檔 - GROUP-PRICING-MASTER                        *
      * 對應 CLM 交易：16210 Group Pricing Maintenance              *
      *=============================================================*
       01  GROUP-PRICING-RECORD.
           05  GP-KEY.
               10  GP-GROUP-ID         PIC X(11).
               10  GP-CURRENCY          PIC X(03).
               10  GP-EFFECTIVE-DATE    PIC 9(08).
           05  GP-PRICING-TYPE          PIC X(01).
               88  GP-TYPE-TAILOR-MADE      VALUE 'T'.
               88  GP-TYPE-REFER-STD        VALUE 'R'.
           05  GP-PRICING-ID            PIC X(06).
      *        Refer Standard 時使用
           05  GP-BASE-CURRENCY         PIC X(03).
           05  GP-TIER-STRUCTURE        OCCURS 10 TIMES.
               10  GP-TIER-THRESHOLD    PIC 9(15)V9(02) COMP-3.
               10  GP-LM-BENCHMARK      PIC X(20).
               10  GP-SPREAD-RATE       PIC S9(03)V9(06) COMP-3.
               10  GP-FLAT-RATE         PIC S9(03)V9(06) COMP-3.
           05  GP-OVERRIDE-ALLOWED      PIC X(01).
               88  GP-ALLOW-OVERRIDE        VALUE 'Y'.
               88  GP-NO-OVERRIDE           VALUE 'N'.
           05  GP-LAST-UPDATE           PIC 9(08).
           05  GP-UPDATE-BY             PIC X(08).
```

### 2.2 帳戶層面定價檔（Account Pricing）

```cobol
      *=============================================================*
      * 帳戶定價主檔 - ACCOUNT-PRICING-MASTER                      *
      * 對應 CLM 交易：16310 Account Pricing Maintenance            *
      *=============================================================*
       01  ACCOUNT-PRICING-RECORD.
           05  AP-KEY.
               10  AP-ACCT-NUMBER       PIC X(14).
               10  AP-CURRENCY          PIC X(03).
               10  AP-EFFECTIVE-DATE    PIC 9(08).
           05  AP-OVERRIDE-METHOD       PIC X(01).
               88  AP-METHOD-SPREAD         VALUE '1'.
               88  AP-METHOD-TAILOR         VALUE '2'.
               88  AP-METHOD-DEBIT          VALUE '3'.
      *        1=OVERRIDE GROUP PRICING SPREAD
      *        2=TAILOR-MADE PRICING
      *        3=WITH DEBIT INTEREST RATE
           05  AP-PRICING-ID            PIC X(06).
      *        Refer Standard 時使用
           05  AP-TIER-STRUCTURE        OCCURS 10 TIMES.
               10  AP-TIER-THRESHOLD    PIC 9(15)V9(02) COMP-3.
               10  AP-LM-BENCHMARK      PIC X(20).
               10  AP-SPREAD-RATE       PIC S9(03)V9(06) COMP-3.
               10  AP-FLAT-RATE         PIC S9(03)V9(06) COMP-3.
      *        Override Flag：每個欄位是否覆蓋群組設定
               10  AP-OVERRIDE-FLAG     PIC X(01).
                   88  AP-OVERRIDE-YES      VALUE 'Y'.
                   88  AP-OVERRIDE-NO       VALUE 'N'.
      *        (0) - CAN OVERRIDE GROUP LEVEL SETUP
           05  AP-CREDIT-RATE-OVERRIDE  PIC X(01).
               88  AP-CR-OVERRIDE           VALUE 'Y'.
           05  AP-DEBIT-RATE-OVERRIDE   PIC X(01).
               88  AP-DR-OVERRIDE           VALUE 'Y'.
           05  AP-BENCHMARK-OVERRIDE    PIC X(01).
               88  AP-BM-OVERRIDE           VALUE 'Y'.
           05  AP-THRESHOLD-OVERRIDE    PIC X(01).
               88  AP-TH-OVERRIDE           VALUE 'Y'.
           05  AP-LAST-UPDATE           PIC 9(08).
           05  AP-UPDATE-BY             PIC X(08).
```

---

## 三、利率覆蓋驗證邏輯

### 3.1 覆蓋有效性檢查流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    利率覆蓋驗證流程                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: 檢查群組是否允許覆蓋                                   │
│  ├── 讀取 Group Pricing                                        │
│  └── GP-OVERRIDE-ALLOWED = 'Y' ?                               │
│      ├── N → 錯誤：群組不允許覆蓋                              │
│      └── Y → 繼續 Step 2                                       │
│                                                                 │
│  Step 2: 檢查覆蓋方法有效性                                     │
│  ├── Method 1: OVERRIDE GROUP PRICING SPREAD                   │
│  │   └── 只覆蓋 Spread，Benchmark 沿用群組                     │
│  ├── Method 2: TAILOR-MADE PRICING                             │
│  │   └── 可覆蓋任何欄位                                        │
│  └── Method 3: WITH DEBIT INTEREST RATE                        │
│      └── 僅適用於 GIO/CDA 產品                                 │
│                                                                 │
│  Step 3: 檢查利差範圍                                           │
│  ├── 計算 Spread 差異 = AP-Spread - GP-Spread                  │
│  ├── 檢查是否超過 ±2% 限制                                     │
│  └── 超過限制 → 錯誤或需主管核准                               │
│                                                                 │
│  Step 4: 檢查高層級利率有效性                                   │
│  ├── 高層利率必須 > 低層利率（Tier 規則）                      │
│  └── 確保覆蓋後的級距結構合理                                  │
│                                                                 │
│  Step 5: 生效日期檢查                                           │
│  ├── AP-Effective-Date >= GP-Effective-Date ?                  │
│  └── AP-Effective-Date <= GP-Expiry-Date ?                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 核心驗證程式碼

```cobol
      *=============================================================*
      * PROGRAM-ID: CLMPRC01                                       *
      * PROGRAM-NAME: CLM Pricing Override Validation              *
      * DESCRIPTION:  驗證帳戶利率覆蓋設定的有效性                  *
      *=============================================================*
       IDENTIFICATION DIVISION.
       PROGRAM-ID. CLMPRC01.

       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT GROUP-PRICING-FILE
               ASSIGN TO UT-S-GRPPRIC
               ORGANIZATION IS INDEXED
               ACCESS MODE IS DYNAMIC
               RECORD KEY IS GP-KEY.

           SELECT ACCT-PRICING-FILE
               ASSIGN TO UT-S-ACCTPRC
               ORGANIZATION IS INDEXED
               ACCESS MODE IS DYNAMIC
               RECORD KEY IS AP-KEY.

       DATA DIVISION.
       FILE SECTION.
       COPY GRPPRIC.
       COPY ACCTPRC.

       WORKING-STORAGE SECTION.
       01  WS-PROGRAM-CONTROL.
           05  WS-RETURN-CODE        PIC 9(04) VALUE ZEROES.
           05  WS-ERROR-COUNT        PIC 9(09) VALUE ZEROES.

       01  WS-VALIDATION-RESULT.
           05  WS-VALID              PIC X(01) VALUE 'Y'.
               88  IS-VALID                   VALUE 'Y'.
               88  IS-INVALID                 VALUE 'N'.
           05  WS-ERROR-MSG          PIC X(100).

       01  WS-OVERRIDE-RULES.
           05  WS-MIN-SPREAD-DIFF    PIC S9(03)V9(06) COMP-3
                                     VALUE -2.000000.
           05  WS-MAX-SPREAD-DIFF    PIC S9(03)V9(06) COMP-3
                                     VALUE +2.000000.
           05  WS-APPROVAL-THRESHOLD PIC S9(03)V9(06) COMP-3
                                     VALUE -1.000000.

       01  WS-CALC-WORK.
           05  WS-SPREAD-DIFF        PIC S9(03)V9(06) COMP-3.
           05  WS-TIER-IDX           PIC 9(02).

       LINKAGE SECTION.
       01  LS-VALIDATE-PARAMS.
           05  LS-ACCT-NUMBER        PIC X(14).
           05  LS-GROUP-ID           PIC X(11).
           05  LS-CURRENCY           PIC X(03).
           05  LS-EFFECTIVE-DATE     PIC 9(08).
           05  LS-RETURN-CODE        PIC 9(04).
           05  LS-ERROR-MESSAGE      PIC X(100).

       PROCEDURE DIVISION USING LS-VALIDATE-PARAMS.
       0000-MAIN-CONTROL.
           PERFORM 1000-INITIALIZATION
           PERFORM 2000-VALIDATE-OVERRIDE
           PERFORM 9000-FINALIZATION
           GOBACK.

       1000-INITIALIZATION.
           OPEN INPUT GROUP-PRICING-FILE
                      ACCT-PRICING-FILE

           MOVE LS-GROUP-ID TO GP-GROUP-ID
           MOVE LS-CURRENCY TO GP-CURRENCY
           MOVE LS-EFFECTIVE-DATE TO GP-EFFECTIVE-DATE

           READ GROUP-PRICING-FILE
               INVALID KEY
                   MOVE 'Group pricing not found' TO LS-ERROR-MESSAGE
                   MOVE 9999 TO LS-RETURN-CODE
                   GOBACK
           END-READ

           MOVE LS-ACCT-NUMBER TO AP-ACCT-NUMBER
           MOVE LS-CURRENCY TO AP-CURRENCY
           MOVE LS-EFFECTIVE-DATE TO AP-EFFECTIVE-DATE

           READ ACCT-PRICING-FILE
               INVALID KEY
                   MOVE 'N' TO AP-OVERRIDE-FLAG
           END-READ.

       2000-VALIDATE-OVERRIDE.
           IF AP-NO-OVERRIDE
               MOVE ZEROES TO LS-RETURN-CODE
               MOVE SPACES TO LS-ERROR-MESSAGE
               EXIT SECTION
           END-IF

           IF GP-NO-OVERRIDE
               MOVE 'Group does not allow override' TO LS-ERROR-MESSAGE
               MOVE 1001 TO LS-RETURN-CODE
               MOVE 'N' TO WS-VALID
               EXIT SECTION
           END-IF

           PERFORM 2100-CHECK-OVERRIDE-METHOD
           IF NOT IS-VALID
               EXIT SECTION
           END-IF

           PERFORM 2200-CHECK-SPREAD-RANGE
           IF NOT IS-VALID
               EXIT SECTION
           END-IF

           PERFORM 2300-CHECK-TIER-VALIDITY
           IF NOT IS-VALID
               EXIT SECTION
           END-IF

           PERFORM 2400-CHECK-EFFECTIVE-DATE
           IF NOT IS-VALID
               EXIT SECTION
           END-IF

           MOVE ZEROES TO LS-RETURN-CODE
           MOVE 'Override validation passed' TO LS-ERROR-MESSAGE.

       2100-CHECK-OVERRIDE-METHOD.
           EVALUATE TRUE
               WHEN AP-METHOD-SPREAD
                   IF AP-BM-OVERRIDE
                       MOVE 'Method 1: Cannot override Benchmark'
                             TO LS-ERROR-MESSAGE
                       MOVE 'N' TO WS-VALID
                   END-IF

               WHEN AP-METHOD-TAILOR
                   CONTINUE

               WHEN AP-METHOD-DEBIT
                   IF NOT (GP-GROUP-ID(1:3) = 'GIO' OR
                          GP-GROUP-ID(1:3) = 'CDA')
                       MOVE 'Method 3: Only for GIO/CDA products'
                             TO LS-ERROR-MESSAGE
                       MOVE 'N' TO WS-VALID
                   END-IF

               WHEN OTHER
                   MOVE 'Invalid override method' TO LS-ERROR-MESSAGE
                   MOVE 'N' TO WS-VALID
           END-EVALUATE.

       2200-CHECK-SPREAD-RANGE.
           IF AP-OVERRIDE-YES
               COMPUTE WS-SPREAD-DIFF =
                       AP-SPREAD-RATE - GP-SPREAD-RATE

               IF WS-SPREAD-DIFF < WS-MIN-SPREAD-DIFF
                   MOVE 'Spread below minimum allowed' TO LS-ERROR-MESSAGE
                   MOVE 'N' TO WS-VALID
                   EXIT SECTION
               END-IF

               IF WS-SPREAD-DIFF > WS-MAX-SPREAD-DIFF
                   MOVE 'Spread above maximum allowed' TO LS-ERROR-MESSAGE
                   MOVE 'N' TO WS-VALID
                   EXIT SECTION
               END-IF

               IF WS-SPREAD-DIFF < WS-APPROVAL-THRESHOLD
                   MOVE 'Supervisor approval required' TO LS-ERROR-MESSAGE
                   MOVE 1002 TO LS-RETURN-CODE
               END-IF
           END-IF.

       2300-CHECK-TIER-VALIDITY.
           PERFORM VARYING WS-TIER-IDX FROM 1 BY 1
                   UNTIL WS-TIER-IDX > 10
               IF AP-TIER-THRESHOLD(WS-TIER-IDX) > ZEROES
      *            檢查高層利率 > 低層利率
                   IF WS-TIER-IDX > 1
                       IF AP-FLAT-RATE(WS-TIER-IDX) <=
                          AP-FLAT-RATE(WS-TIER-IDX - 1)
                           MOVE 'Higher tier rate must be > lower tier'
                                 TO LS-ERROR-MESSAGE
                           MOVE 'N' TO WS-VALID
                           EXIT SECTION
                       END-IF
                   END-IF
               END-IF
           END-PERFORM.

       2400-CHECK-EFFECTIVE-DATE.
           IF AP-EFFECTIVE-DATE < GP-EFFECTIVE-DATE
               MOVE 'Account effective date before group' TO LS-ERROR-MESSAGE
               MOVE 'N' TO WS-VALID
               EXIT SECTION
           END-IF

           IF GP-EXPIRY-DATE NOT = ZEROES AND
              GP-EXPIRY-DATE NOT = 99991231
               IF AP-EFFECTIVE-DATE > GP-EXPIRY-DATE
                   MOVE 'Account effective date after group expiry'
                         TO LS-ERROR-MESSAGE
                   MOVE 'N' TO WS-VALID
               END-IF
           END-IF.

       9000-FINALIZATION.
           CLOSE GROUP-PRICING-FILE
                  ACCT-PRICING-FILE.
```

---

## 四、批次計算中的覆蓋處理

### 4.1 利息計算時的覆蓋邏輯

```cobol
      *=============================================================
      * 在批次利息計算中應用覆蓋設定
      * 這段程式碼整合到 CLMINT01（Lesson 6-1）中
      *=============================================================

       3000-APPLY-PRICING-OVERRIDE.
      *    步驟 1: 先讀取群組定價作為預設值
           PERFORM 3100-READ-GROUP-PRICING

      *    步驟 2: 檢查是否有帳戶覆蓋
           PERFORM 3200-CHECK-ACCT-OVERRIDE

      *    步驟 3: 如有覆蓋，合併覆蓋設定
           IF AP-OVERRIDE-YES
               PERFORM 3300-MERGE-OVERRIDE-SETTINGS
           END-IF.

       3100-READ-GROUP-PRICING.
      *    使用群組定價作為基礎
           MOVE GP-LM-BENCHMARK TO WS-APPLY-BENCHMARK
           MOVE GP-SPREAD-RATE TO WS-APPLY-SPREAD
           PERFORM VARYING WS-TIER-IDX FROM 1 BY 1
                   UNTIL WS-TIER-IDX > 10
               MOVE GP-TIER-THRESHOLD(WS-TIER-IDX)
                   TO WS-APPLY-THRESHOLD(WS-TIER-IDX)
               MOVE GP-FLAT-RATE(WS-TIER-IDX)
                   TO WS-APPLY-FLAT-RATE(WS-TIER-IDX)
           END-PERFORM.

       3200-CHECK-ACCT-OVERRIDE.
      *    檢查帳戶是否有覆蓋設定
           MOVE AB-ACCT-NUMBER TO AP-ACCT-NUMBER
           READ ACCT-PRICING-FILE
               INVALID KEY
                   MOVE 'N' TO AP-OVERRIDE-FLAG
           END-READ.

       3300-MERGE-OVERRIDE-SETTINGS.
      *    逐欄位覆蓋群組設定
           IF AP-BM-OVERRIDE
               MOVE AP-LM-BENCHMARK TO WS-APPLY-BENCHMARK
           END-IF

           IF AP-CR-OVERRIDE OR AP-DR-OVERRIDE
               MOVE AP-SPREAD-RATE TO WS-APPLY-SPREAD
           END-IF

           PERFORM VARYING WS-TIER-IDX FROM 1 BY 1
                   UNTIL WS-TIER-IDX > 10
               IF AP-TH-OVERRIDE
                   MOVE AP-TIER-THRESHOLD(WS-TIER-IDX)
                       TO WS-APPLY-THRESHOLD(WS-TIER-IDX)
               END-IF
           END-PERFORM.
```

---

## 五、設計考量與最佳實踐

### 5.1 覆蓋機制設計原則

| 原則 | 說明 | 實作建議 |
|------|------|----------|
| **最小權限** | 只覆蓋必要的欄位 | 使用 Method 1（僅 Spread）而非 Method 2（全覆蓋） |
| **審計追蹤** | 記錄所有覆蓋操作 | 在 AP-LAST-UPDATE 和 AP-UPDATE-BY 記錄變更 |
| **生效控制** | 明確生效日期範圍 | 設定 AP-EFFECTIVE-DATE 和 AP-EXPIRY-DATE |
| **驗證優先** | 批次計算前驗證 | 在 16310 交易時即驗證，避免批次失敗 |

### 5.2 常見錯誤與處理

```
┌─────────────────────────────────────────────────────────────────┐
│                    常見覆蓋錯誤                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  錯誤 1：群組不允許覆蓋但帳戶設定了覆蓋                        │
│  ├── 錯誤代碼：1001                                            │
│  ├── 處理：拒絕交易，提示用戶聯繫主管開啟群組覆蓋權限          │
│  └── 預防：16310 交易畫面顯示群組覆蓋狀態                      │
│                                                                 │
│  錯誤 2：覆蓋利差過大（> 2%）                                  │
│  ├── 錯誤代碼：1003                                            │
│  ├── 處理：需主管核准（M15 授權）                              │
│  └── 預防：畫面即時計算並顯示利差百分比                        │
│                                                                 │
│  錯誤 3：高層級利率 < 低層級利率                               │
│  ├── 錯誤代碼：1004                                            │
│  ├── 處理：拒絕交易，提示調整級距利率                          │
│  └── 預防：畫面自動檢查並提示                                  │
│                                                                 │
│  錯誤 4：生效日期衝突                                          │
│  ├── 錯誤代碼：1005                                            │
│  ├── 處理：拒絕交易，提示調整生效日期                          │
│  └── 預防：畫面顯示群組生效期間作為參考                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 對應 CLM 功能說明書

| 功能說明書章節 | 內容 | 程式實作 |
|----------------|------|----------|
| 16310 Account Pricing Maintenance | 帳戶定價維護交易 | `CLMPRC01` 驗證程式 |
| 5.16 Override Group Pricing | 覆蓋群組定價機制 | `3000-APPLY-PRICING-OVERRIDE` |
| 6.3.2.2.1 Pricing Override | 利率覆蓋規則 | `2100-CHECK-OVERRIDE-METHOD` |
| 畫面五/六/七 | Account Pricing 交易畫面 | 驗證邏輯對應欄位 |

---

## 六、練習題

### 練習 1：覆蓋方法選擇
某 GIO 帳戶群設定為 HIBID + 1.0%，客戶要求改為 HIBID + 0.5%。
- 應該選擇哪種 Override Method？
- 需要覆蓋哪些欄位？

### 練習 2：驗證邏輯設計
設計一個檢查：若帳戶覆蓋後的利率低於銀行最低利率（DR BANKMIN），應如何處理？

### 練習 3：批次整合
修改 `CLMINT01`（Lesson 6-1），在計算利息前加入 `3000-APPLY-PRICING-OVERRIDE` 段落。

---

## 七、總結

### 本課程重點

✅ **理解三層利率設定架構**
- Bank Level → Group Level → Account Level
- 覆蓋優先順序：Account > Group > Bank

✅ **掌握 Override 機制的設計原理**
- 三種 Override Method 的適用場景
- 逐欄位覆蓋的靈活控制

✅ **學會設計覆蓋驗證邏輯**
- 群組允許性檢查
- 利差範圍控制
- 級距有效性驗證

✅ **了解批次計算中的覆蓋應用**
- 讀取順序：Group → Account
- 合併邏輯：逐欄位覆蓋
- 效能考量：避免重複查詢

### 延伸學習

- **Lesson 6-1**：利息計算引擎（Tier/Slab/Hybrid）
- **Lesson 6-3**：批次重啟與容錯機制
- **Lesson 5-2**：需求影響分析（利率變更影響評估）

---

*本課程內容基於 CLM 2024 Nov 2.10_v1 功能說明書 16310 章節編寫*
*Last Updated: 2024-11-01*
