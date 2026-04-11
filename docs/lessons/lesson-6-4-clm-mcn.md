# Lesson 6-4: CLM 多貨幣處理 (MCN)

> 理解多貨幣帳戶的利息計算與息差分配機制

---

## 學習目標

- 理解 MCN (Multi-Currency Notional Pooling) 的概念與業務價值
- 掌握多貨幣利息計算的核心邏輯
- 學會追蹤息差 (Interest Differential) 的產生與分配
- 了解 BA 在 MCN 需求分析時的關鍵檢查點

---

## 一、MCN 業務概念

### 1.1 什麼是 MCN？

MCN (Multi-Currency Notional Pooling) 是 CLM 系統的核心功能之一，允許企業客戶將不同貨幣的帳戶餘額進行「虛擬」整合，以優化整體利息收益。

```
┌─────────────────────────────────────────────────────────────────┐
│                    MCN 資金池概念圖                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐      │
│   │  USD 帳戶   │     │  EUR 帳戶   │     │  JPY 帳戶   │      │
│   │  +$500,000  │     │  -€300,000  │     │  +¥10M      │      │
│   └──────┬──────┘     └──────┬──────┘     └──────┬──────┘      │
│          │                   │                   │              │
│          └───────────────────┼───────────────────┘              │
│                              ↓                                  │
│                    ┌─────────────────┐                          │
│                    │   Notional Pool   │                          │
│                    │  (虛擬整合計算)   │                          │
│                    └────────┬────────┘                          │
│                             ↓                                   │
│                    ┌─────────────────┐                          │
│                    │  等值 USD 淨餘額  │  ← 用於計算利息          │
│                    │   +$200,000     │                          │
│                    └─────────────────┘                          │
│                                                                 │
│   特點：                                                        │
│   • 各貨幣帳戶實際獨立運作                                       │
│   • 系統虛擬整合後計算淨餘額                                     │
│   • 利息按虛擬淨餘額計算                                         │
│   • 息差按規則分配回各帳戶                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 MCN 的業務價值

| 價值點 | 說明 | BA 溝通重點 |
|--------|------|-------------|
| **利息優化** | 以淨餘額計息，減少借貸利息支出 | 確認客戶的 Pooling 協議條款 |
| **資金靈活** | 不需實際轉換貨幣即可獲得整合效益 | 了解客戶的匯率避險策略 |
| **操作簡化** | 自動化息差計算與分配 | 確認分配規則是否客製化 |
| **報表透明** | 清楚追蹤各帳戶的息差貢獻 | 確認報表需求與格式 |

### 1.3 MCN 與單一貨幣 Pooling 的差異

```
┌─────────────────────────────────────────────────────────────────┐
│              單一貨幣 Pooling vs MCN                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  單一貨幣 (USD Pooling)          多貨幣 (MCN)                   │
│  ─────────────────────           ────────────                   │
│                                                                 │
│  ┌─────────┐  ┌─────────┐       ┌─────────┐  ┌─────────┐       │
│  │ USD A/C │  │ USD A/C │       │ USD A/C │  │ EUR A/C │       │
│  │  +$100  │  │  -$50   │       │  +$100  │  │  -€80   │       │
│  └────┬────┘  └────┬────┘       └────┬────┘  └────┬────┘       │
│       └────────────┘                  └────────────┘            │
│              ↓                               ↓                  │
│       Net: +$50                    Net: +$100 - €80             │
│       (直接計息)                    (需匯率換算後計息)          │
│                                                                 │
│  利息計算：簡單                   利息計算：複雜                 │
│  • 直接加總本位幣                 • 需每日匯率換算               │
│  • 無匯率風險                     • 涉及匯率風險                 │
│  • 無息差分配問題                 • 需設計息差分配邏輯           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、MCN 利息計算核心邏輯

### 2.1 計算流程概覽

```
┌─────────────────────────────────────────────────────────────────┐
│                  MCN 利息計算流程                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: 讀取各貨幣帳戶餘額                                     │
│  ├── USD Account: +$500,000                                     │
│  ├── EUR Account: -€300,000                                     │
│  ├── JPY Account: +¥10,000,000                                  │
│  └── GBP Account: -£100,000                                     │
│                          ↓                                      │
│  Step 2: 匯率換算為本位幣 (USD)                                 │
│  ├── EUR: -€300,000 × 1.08 = -$324,000                         │
│  ├── JPY: +¥10M × 0.0067 = +$67,000                            │
│  └── GBP: -£100,000 × 1.25 = -$125,000                         │
│                          ↓                                      │
│  Step 3: 計算虛擬淨餘額                                         │
│  ├── Net Balance = $500,000 - $324,000 + $67,000 - $125,000    │
│  ├── Net Balance = +$118,000                                    │
│  └── 使用 Net Balance 計算利息                                  │
│                          ↓                                      │
│  Step 4: 息差分配計算                                           │
│  ├── 計算各帳戶「應得」vs「實得」利息差異                        │
│  └── 產生息差分配記錄                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 關鍵 Copybook 結構

```cobol
       *=============================================================
       * MCN 多貨幣帳戶資料結構
       *=============================================================
       01  MCN-ACCOUNT-RECORD.
           05  MCN-ACCT-ID              PIC X(16).
           05  MCN-POOL-ID              PIC X(12).
           05  MCN-CURRENCY             PIC X(3).
           05  MCN-BALANCE              PIC S9(15)V99 COMP-3.
           05  MCN-BALANCE-SIGN         PIC X.
               88  MCN-BAL-POSITIVE     VALUE 'P'.
               88  MCN-BAL-NEGATIVE     VALUE 'N'.
           05  MCN-RATE-TIER-LEVEL      PIC 9.
           05  MCN-INTEREST-ACCrued     PIC S9(13)V99 COMP-3.
           05  MCN-DIFFERENTIAL-AMT     PIC S9(13)V99 COMP-3.
           05  MCN-LAST-UPDATE          PIC X(8).

       *=============================================================
       * 匯率資料結構 (Daily Exchange Rate)
       *=============================================================
       01  EXCHANGE-RATE-RECORD.
           05  XR-CURRENCY-FROM         PIC X(3).
           05  XR-CURRENCY-TO           PIC X(3).
           05  XR-RATE                  PIC 9(5)V9(8) COMP-3.
           05  XR-RATE-TYPE             PIC X.
               88  XR-MID-RATE          VALUE 'M'.
               88  XR-BUY-RATE          VALUE 'B'.
               88  XR-SELL-RATE         VALUE 'S'.
           05  XR-EFFECTIVE-DATE        PIC X(8).

       *=============================================================
       * 息差分配記錄結構
       *=============================================================
       01  DIFFERENTIAL-RECORD.
           05  DIFF-POOL-ID             PIC X(12).
           05  DIFF-CALC-DATE           PIC X(8).
           05  DIFF-ACCT-ID             PIC X(16).
           05  DIFF-CURRENCY            PIC X(3).
           05  DIFF-ALLOCATED-AMT       PIC S9(13)V99 COMP-3.
           05  DIFF-ALLOCATION-TYPE     PIC X.
               88  DIFF-TYPE-POSITIVE   VALUE 'P'.
               88  DIFF-TYPE-NEGATIVE   VALUE 'N'.
           05  DIFF-CALCULATION-BASIS   PIC X(100).
```

### 2.3 息差計算邏輯詳解

```cobol
       *=============================================================
       * MCN 息差計算核心邏輯
       *=============================================================
       
       IDENTIFICATION DIVISION.
       PROGRAM-ID. CLMMCN03.
       
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       
       *---- 匯率換算工作區 -----------------------------------------
       01  WS-EXCHANGE-WORK-AREA.
           05  WS-RATE-TABLE.
               10  WS-RATE-ENTRY OCCURS 10 TIMES.
                   15  WS-RATE-CCY      PIC X(3).
                   15  WS-RATE-VALUE    PIC 9(5)V9(8) COMP-3.
           05  WS-RATE-COUNT          PIC 9(3) COMP.
           05  WS-BASE-CCY            PIC X(3) VALUE 'USD'.
       
       *---- 淨餘額計算工作區 ---------------------------------------
       01  WS-NET-BALANCE-AREA.
           05  WS-NET-BALANCE-USD     PIC S9(15)V99 COMP-3.
           05  WS-TOTAL-CREDIT-USD    PIC S9(15)V99 COMP-3.
           05  WS-TOTAL-DEBIT-USD     PIC S9(15)V99 COMP-3.
           05  WS-ACCT-IN-USD         PIC S9(15)V99 COMP-3.
       
       *---- 息差計算工作區 -----------------------------------------
       01  WS-DIFFERENTIAL-AREA.
           05  WS-STANDALONE-INT      PIC S9(13)V99 COMP-3.
           05  WS-POOL-ALLOCATED-INT  PIC S9(13)V99 COMP-3.
           05  WS-DIFFERENTIAL        PIC S9(13)V99 COMP-3.
           05  WS-ALLOCATION-RATIO    PIC 9(3)V9(5) COMP-3.
       
       PROCEDURE DIVISION.
       
       *---- 主程序 -------------------------------------------------
       0000-MAIN.
           PERFORM 1000-LOAD-EXCHANGE-RATES
           PERFORM 2000-CALCULATE-NET-BALANCE
           PERFORM 3000-CALCULATE-POOL-INTEREST
           PERFORM 4000-CALCULATE-DIFFERENTIALS
           PERFORM 5000-WRITE-DIFFERENTIAL-RECORDS
           GOBACK
           .
       
       *---- 載入當日匯率 -------------------------------------------
       1000-LOAD-EXCHANGE-RATES.
           OPEN INPUT EXCHANGE-RATE-FILE
           
           READ EXCHANGE-RATE-FILE
               AT END
                   MOVE 0 TO WS-RATE-COUNT
           END-READ
           
           PERFORM UNTIL WS-RATE-COUNT >= 10
               ADD 1 TO WS-RATE-COUNT
               MOVE XR-CURRENCY-FROM 
                   TO WS-RATE-CCY(WS-RATE-COUNT)
               MOVE XR-RATE 
                   TO WS-RATE-VALUE(WS-RATE-COUNT)
               
               READ EXCHANGE-RATE-FILE
                   AT END
                       EXIT PERFORM
               END-READ
           END-PERFORM
           
           CLOSE EXCHANGE-RATE-FILE
           .
       
       *---- 計算虛擬淨餘額 (Convert to USD) -------------------------
       2000-CALCULATE-NET-BALANCE.
           MOVE ZERO TO WS-NET-BALANCE-USD
           MOVE ZERO TO WS-TOTAL-CREDIT-USD
           MOVE ZERO TO WS-TOTAL-DEBIT-USD
           
           OPEN INPUT MCN-ACCOUNT-FILE
           
           READ MCN-ACCOUNT-FILE
           
           PERFORM UNTIL MCN-FILE-EOF
               * 查找對應匯率
               PERFORM 2100-LOOKUP-EXCHANGE-RATE
               
               * 換算為 USD
               COMPUTE WS-ACCT-IN-USD = 
                   MCN-BALANCE * WS-CURRENT-RATE
               
               * 累計至淨餘額
               ADD WS-ACCT-IN-USD TO WS-NET-BALANCE-USD
               
               * 分類統計
               IF WS-ACCT-IN-USD > 0
                   ADD WS-ACCT-IN-USD TO WS-TOTAL-CREDIT-USD
               ELSE
                   ADD WS-ACCT-IN-USD TO WS-TOTAL-DEBIT-USD
               END-IF
               
               READ MCN-ACCOUNT-FILE
           END-PERFORM
           
           CLOSE MCN-ACCOUNT-FILE
           .
       
       *---- 查找匯率子程序 -----------------------------------------
       2100-LOOKUP-EXCHANGE-RATE.
           MOVE 1 TO WS-RATE-IDX
           MOVE 1.00000000 TO WS-CURRENT-RATE
           
           PERFORM UNTIL WS-RATE-IDX > WS-RATE-COUNT
               IF WS-RATE-CCY(WS-RATE-IDX) = MCN-CURRENCY
                   MOVE WS-RATE-VALUE(WS-RATE-IDX) 
                       TO WS-CURRENT-RATE
                   EXIT PERFORM
               END-IF
               ADD 1 TO WS-RATE-IDX
           END-PERFORM
           
           IF WS-CURRENT-RATE = 1.00000000 AND 
              MCN-CURRENCY NOT = 'USD'
               * 匯率未找到，記錄錯誤
               MOVE 'RATE NOT FOUND' TO WS-ERROR-MSG
               PERFORM 9999-ERROR-HANDLER
           END-IF
           .
       
       *---- 計算 Pool 利息 -----------------------------------------
       3000-CALCULATE-POOL-INTEREST.
           * 根據淨餘額正負決定使用存款或借款利率
           IF WS-NET-BALANCE-USD >= 0
               * 淨存款：使用 Tiered Deposit Rate
               PERFORM 3100-CALC-TIERED-CREDIT-INT
           ELSE
               * 淨借款：使用 Borrowing Rate
               PERFORM 3200-CALC-BORROWING-INT
           END-IF
           .
       
       *---- 計算息差 ------------------------------------------------
       4000-CALCULATE-DIFFERENTIALS.
           OPEN INPUT MCN-ACCOUNT-FILE
           OPEN OUTPUT DIFFERENTIAL-FILE
           
           READ MCN-ACCOUNT-FILE
           
           PERFORM UNTIL MCN-FILE-EOF
               * 計算該帳戶單獨計息的利息 (Standalone Interest)
               PERFORM 4100-CALC-STANDALONE-INTEREST
               
               * 計算該帳戶從 Pool 分配到的利息
               PERFORM 4200-CALC-ALLOCATED-INTEREST
               
               * 計算息差
               COMPUTE WS-DIFFERENTIAL = 
                   WS-POOL-ALLOCATED-INT - WS-STANDALONE-INT
               
               * 寫入息差記錄
               PERFORM 4300-BUILD-DIFF-RECORD
               WRITE DIFFERENTIAL-RECORD
               
               READ MCN-ACCOUNT-FILE
           END-PERFORM
           
           CLOSE MCN-ACCOUNT-FILE
           CLOSE DIFFERENTIAL-FILE
           .
       
       *---- 計算單獨計息利息 ----------------------------------------
       4100-CALC-STANDALONE-INTEREST.
           * 若該帳戶單獨存在，應得多少利息
           IF MCN-BALANCE >= 0
               * 存款利息
               COMPUTE WS-STANDALONE-INT = 
                   MCN-BALANCE * WS-DEPOSIT-RATE * WS-DAYS / 365
           ELSE
               * 借款利息 (負數)
               COMPUTE WS-STANDALONE-INT = 
                   MCN-BALANCE * WS-BORROW-RATE * WS-DAYS / 365
           END-IF
           .
       
       *---- 計算 Pool 分配利息 --------------------------------------
       4200-CALC-ALLOCATED-INTEREST.
           * 根據該帳戶對淨餘額的貢獻比例分配
           IF WS-NET-BALANCE-USD NOT = 0
               COMPUTE WS-ALLOCATION-RATIO = 
                   WS-ACCT-IN-USD / WS-NET-BALANCE-USD
               
               COMPUTE WS-POOL-ALLOCATED-INT = 
                   WS-TOTAL-POOL-INTEREST * WS-ALLOCATION-RATIO
           ELSE
               MOVE ZERO TO WS-POOL-ALLOCATED-INT
           END-IF
           .

```

### 2.4 息差計算範例

```
┌─────────────────────────────────────────────────────────────────┐
│              MCN 息差計算實例                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  情境：某企業 MCN Pool 包含三個帳戶                              │
│                                                                 │
│  ┌─────────────┬──────────┬──────────┬──────────────┐          │
│  │   帳戶      │  幣別    │  餘額    │  USD 等值    │          │
│  ├─────────────┼──────────┼──────────┼──────────────┤          │
│  │  ACCT-001   │  USD     │ +100,000 │  +100,000    │          │
│  │  ACCT-002   │  EUR     │ -80,000  │  -86,400     │ (1.08)   │
│  │  ACCT-003   │  JPY     │ +5,000,000│ +33,500     │ (0.0067) │
│  ├─────────────┼──────────┼──────────┼──────────────┤          │
│  │  淨餘額     │    -     │    -     │  +47,100     │          │
│  └─────────────┴──────────┴──────────┴──────────────┘          │
│                                                                 │
│  利率假設：                                                      │
│  • 存款利率：2.0% 年化                                           │
│  • 借款利率：5.0% 年化                                           │
│  • 計息天數：30 天                                               │
│                                                                 │
│  Pool 總利息計算：                                               │
│  ├── 淨餘額 = +47,100 USD (淨存款)                               │
│  └── Pool 利息 = 47,100 × 2% × 30/365 = $77.42                  │
│                                                                 │
│  各帳戶息差計算：                                                │
│  ┌───────────┬────────────┬────────────┬───────────┬──────────┐ │
│  │   帳戶    │ 單獨計息   │ Pool分配   │   息差    │  說明    │ │
│  ├───────────┼────────────┼────────────┼───────────┼──────────┤ │
│  │ ACCT-001  │  +$164.38  │  +$164.38  │    $0     │ 基準帳戶 │ │
│  │ ACCT-002  │  -$354.25  │  -$142.05  │ +$212.20  │ 受益帳戶 │ │
│  │ ACCT-003  │   +$55.07  │   +$55.09  │   -$0.02  │ 基本持平 │ │
│  └───────────┴────────────┴────────────┴───────────┴──────────┘ │
│                                                                 │
│  說明：                                                          │
│  • ACCT-002 (EUR) 單獨計息需付高額借款利息                       │
│  • 但 Pool 淨餘額為正，獲得存款利息分配                           │
│  • 因此 EUR 帳戶獲得 $212.20 息差補償                            │
│  • 這就是 MCN 的價值所在！                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 三、BA 分析重點

### 3.1 需求訪談檢查清單

```
┌─────────────────────────────────────────────────────────────────┐
│              MCN 需求訪談檢查清單                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  □ Pool 結構設計                                                 │
│    ├── 包含哪些貨幣？                                            │
│    ├── 各貨幣帳戶數量？                                          │
│    └── 是否有子 Pool 結構？                                      │
│                                                                 │
│  □ 匯率處理規則                                                  │
│    ├── 使用哪種匯率？ (Mid/Buy/Sell)                             │
│    ├── 匯率來源？ (系統自動/人工輸入)                            │
│    ├── 匯率更新頻率？ (日終/即時)                                │
│    └── 假日匯率如何處理？                                        │
│                                                                 │
│  □ 息差分配規則                                                  │
│    ├── 分配比例計算方式？                                        │
│    ├── 是否有最低分配門檻？                                      │
│    ├── 負餘額帳戶如何處理？                                      │
│    └── 分配週期？ (日終/月結)                                    │
│                                                                 │
│  □ 報表與對帳需求                                                │
│    ├── 需要哪些 MCN 報表？                                       │
│    ├── 息差明細是否需要展示？                                    │
│    ├── 匯率變動對利息的影響分析？                                │
│    └── 客戶對帳單格式要求？                                      │
│                                                                 │
│  □ 異常處理機制                                                  │
│    ├── 匯率缺失時的處理？                                        │
│    ├── 帳戶餘額異常時的處理？                                    │
│    └── 息差計算差額過大的警告？                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 影響分析重點

| 變更類型 | 影響範圍 | 檢查點 |
|----------|----------|--------|
| **新增貨幣** | 匯率表、計算邏輯、報表 | 確認新貨幣的精度位數 |
| **修改匯率類型** | 所有 MCN 帳戶利息 | 評估對歷史資料的影響 |
| **調整分配規則** | 息差計算、客戶對帳單 | 確認客戶溝通計劃 |
| **利率變動** | Pool 利息、息差分配 | 驗證邊界案例計算 |

### 3.3 測試案例設計

```
┌─────────────────────────────────────────────────────────────────┐
│              MCN 核心測試案例                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 基本功能測試                                                 │
│     ├── TC-001: 單一貨幣 Pool 計算                              │
│     ├── TC-002: 多貨幣淨存款情境                                │
│     ├── TC-003: 多貨幣淨借款情境                                │
│     └── TC-004: 零餘額邊界測試                                  │
│                                                                 │
│  2. 匯率處理測試                                                 │
│     ├── TC-005: 正常匯率換算                                    │
│     ├── TC-006: 匯率精度處理 (小數位數)                         │
│     ├── TC-007: 匯率缺失異常處理                                │
│     └── TC-008: 匯率為零的處理                                  │
│                                                                 │
│  3. 息差計算測試                                                 │
│     ├── TC-009: 正息差分配驗證                                  │
│     ├── TC-010: 負息差分配驗證                                  │
│     ├── TC-011: 多帳戶分配比例總和 = 100%                       │
│     └── TC-012: 大額息差計算精度驗證                            │
│                                                                 │
│  4. 報表驗證測試                                                 │
│     ├── TC-013: MCN 餘額報表欄位完整性                          │
│     ├── TC-014: 息差明細報表準確性                              │
│     └── TC-015: 客戶對帳單金額一致性                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 四、常見問題與解答

### Q1: MCN 和實際貨幣轉換有什麼不同？

**A:** 
- **MCN (Notional Pooling)**: 只在系統內虛擬整合計算，各帳戶實際餘額不變，沒有實際資金流動
- **實際貨幣轉換**: 涉及真實的外匯交易，有資金流動和匯率風險

**BA 注意**: 確認客戶是否理解這個區別，避免期望落差。

### Q2: 匯率波動會影響 MCN 利息嗎？

**A:** 
會。每日用於計算的匯率會影響：
1. 虛擬淨餘額的計算
2. 各帳戶的分配比例
3. 最終的息差金額

**BA 注意**: 客戶若要求「匯率鎖定」功能，需評估系統支援程度。

### Q3: 為什麼息差計算會有 1-2 分的差異？

**A:** 
常見原因：
- 匯率精度截斷 (通常 8 位小數)
- 中間計算結果的四捨五入
- 分配比例的精度限制

**BA 注意**: 確認這些差異是否在客戶接受範圍內。

### Q4: 如何驗證 MCN 計算正確性？

**A:** 
建議驗證方法：
1. **手工驗算**: 選取 2-3 個帳戶，手工計算驗證
2. **總額平衡**: 所有帳戶息差總和應為零
3. **歷史比對**: 與舊系統或 Excel 計算結果比對
4. **邊界測試**: 單一帳戶、零餘額、極大/極小金額

---

## 五、練習題

### 練習 1: MCN 計算驗證

給定以下資料，請計算各帳戶的息差：

| 帳戶 | 幣別 | 餘額 | 匯率 (to USD) |
|------|------|------|---------------|
| A001 | USD | +200,000 | 1.0 |
| A002 | EUR | -150,000 | 1.10 |
| A003 | GBP | +80,000 | 1.30 |

假設：
- 存款利率：3%
- 借款利率：6%
- 計息天數：31 天

**問題**:
1. 計算虛擬淨餘額 (USD)
2. 計算 Pool 總利息
3. 計算各帳戶的單獨利息、Pool 分配利息、息差

### 練習 2: 需求分析

某客戶提出以下 MCN 需求：
> 「我們希望 MCN 計算時，EUR 帳戶使用 Buy Rate，其他貨幣使用 Mid Rate」

**問題**:
1. 這個需求對系統有什麼影響？
2. 你需要向客戶確認哪些問題？
3. 如何設計測試案例驗證這個邏輯？

### 練習 3: 異常處理設計

情境：日終批次計算 MCN 時，發現某貨幣的匯率缺失。

**問題**:
1. 你會建議系統如何處理？(繼續計算/跳過/中斷)
2. 需要產生什麼警告或通知？
3. 如何設計重啟機制？

---

## 六、總結

### 本課程重點回顧

✅ **MCN 核心概念**: 虛擬整合、多貨幣計息、息差分配

✅ **計算邏輯**: 匯率換算 → 淨餘額計算 → Pool 利息 → 息差分配

✅ **BA 關鍵技能**:
   - 理解匯率處理對計算的影響
   - 設計完整的測試案例
   - 識別需求中的隱藏風險

✅ **常見陷阱**:
   - 匯率精度問題
   - 分配比例總和驗證
   - 負餘額帳戶的特殊處理

---

## 延伸閱讀

- [Lesson 6-3: 批次重啟與容錯機制](lesson-6-3-clm-batch-restart.md)
- [Lesson 6-5: CLM 監管報表生成](lesson-6-5-clm-regulatory-reports.md) (下一課)
- [Lesson 4-2: 計息邏輯實現](lesson-4-2-interest-calc.md)

---

*課程版本: 1.0 | 更新日期: 2026-04-11*
