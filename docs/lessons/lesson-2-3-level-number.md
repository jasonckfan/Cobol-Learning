# Lesson 2-3: Level Number 與資料結構

> 理解 COBOL 的階層式資料結構設計

---

## 學習目標

- 理解 Level Number 的概念與用途
- 掌握階層式資料結構的設計方法
- 能夠設計複雜的資料記錄格式
- 了解 BA 在分析資料結構時的關注點

---

## 一、Level Number 基礎

### 1.1 什麼是 Level Number？

Level Number (層級編號) 是 COBOL 中用於組織資料階層結構的數字。它讓你能夠將相關的資料欄位群組在一起，形成有意義的結構。

```
┌─────────────────────────────────────────────────────────────────┐
│              Level Number 概念                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   層級      用途                              範例              │
│   ────      ────                              ────              │
│                                                                 │
│   01        記錄或獨立群組的起始               01 CUSTOMER.     │
│                                                                 │
│   02-49     中間層級，建立階層結構             05 CUST-ADDR.    │
│             數字不必連續，只需遞增             10 CUST-CITY.    │
│                                                                 │
│   66        RENAMES 子句專用                   66 NEW-NAME      │
│                                             RENAMES A THRU B.   │
│                                                                 │
│   77        獨立項目，不屬於任何群組           77 WS-TEMP.      │
│                                                                 │
│   88        條件名稱 (Condition Name)          88 VALID-STATUS  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 階層結構範例

```cobol
       *---- 客戶資料結構範例 -------------------------------------
       
       01  CUSTOMER-RECORD.                    *> Level 01: 記錄起始
           05  CUST-ID           PIC X(10).    *> Level 05: 基本欄位
           05  CUST-NAME.                        *> Level 05: 群組起始
               10  CUST-LAST-NAME   PIC X(20). *> Level 10: 子欄位
               10  CUST-FIRST-NAME  PIC X(15). *> Level 10: 子欄位
           05  CUST-ADDRESS.                      *> Level 05: 群組起始
               10  CUST-STREET      PIC X(30). *> Level 10: 子欄位
               10  CUST-CITY        PIC X(20). *> Level 10: 子欄位
               10  CUST-ZIP         PIC X(10). *> Level 10: 子欄位
           05  CUST-PHONE          PIC X(15).  *> Level 05: 基本欄位
```

---

## 二、階層結構設計

### 2.1 銀行帳戶資料結構

```cobol
       *---- 銀行帳戶主檔結構 -------------------------------------
       
       01  ACCOUNT-MASTER-RECORD.
           05  ACCT-KEY.                           *> 主鍵群組
               10  ACCT-NUMBER       PIC X(12).
               10  ACCT-BRANCH       PIC X(4).
           
           05  ACCT-INFO.                          *> 帳戶資訊群組
               10  ACCT-TYPE         PIC X.
                   88  ACCT-CHECKING   VALUE 'C'.
                   88  ACCT-SAVINGS    VALUE 'S'.
                   88  ACCT-TIME-DEP   VALUE 'T'.
                   88  ACCT-LOAN       VALUE 'L'.
               10  ACCT-CURRENCY     PIC X(3).
               10  ACCT-OPEN-DATE    PIC 9(8).
               10  ACCT-STATUS       PIC X.
                   88  ACCT-ACTIVE     VALUE 'A'.
                   88  ACCT-CLOSED     VALUE 'C'.
                   88  ACCT-FROZEN     VALUE 'F'.
           
           05  ACCT-BALANCE-INFO.                   *> 餘額資訊群組
               10  ACCT-CURR-BAL     PIC S9(13)V99 COMP-3.
               10  ACCT-AVAIL-BAL    PIC S9(13)V99 COMP-3.
               10  ACCT-HOLD-AMT     PIC S9(13)V99 COMP-3.
               10  ACCT-OD-LIMIT     PIC S9(13)V99 COMP-3.
           
           05  ACCT-CUSTOMER-INFO.                  *> 客戶資訊群組
               10  ACCT-CUST-ID      PIC X(10).
               10  ACCT-CUST-NAME    PIC X(40).
               10  ACCT-CUST-TYPE    PIC X.
                   88  CUST-PERSONAL   VALUE 'P'.
                   88  CUST-CORPORATE  VALUE 'C'.
           
           05  ACCT-INTEREST-INFO.                  *> 利息資訊群組
               10  ACCT-INT-RATE     PIC 9V9(4) COMP-3.
               10  ACCT-INT-ACCrued  PIC S9(11)V99 COMP-3.
               10  ACCT-LAST-INT-DATE PIC 9(8).
           
           05  ACCT-AUDIT-INFO.                     *> 稽核資訊群組
               10  ACCT-CREATE-DATE  PIC 9(8).
               10  ACCT-CREATE-BY    PIC X(8).
               10  ACCT-UPDATE-DATE  PIC 9(8).
               10  ACCT-UPDATE-BY    PIC X(8).
```

### 2.2 交易記錄結構

```cobol
       *---- 交易記錄結構 -----------------------------------------
       
       01  TRANSACTION-RECORD.
           05  TXN-HEADER.                          *> 交易表頭
               10  TXN-SEQ-NUM       PIC 9(10).
               10  TXN-DATE          PIC 9(8).
               10  TXN-TIME          PIC 9(6).
               10  TXN-TYPE          PIC X(2).
                   88  TXN-DEPOSIT     VALUE 'DP'.
                   88  TXN-WITHDRAW    VALUE 'WD'.
                   88  TXN-TRANSFER    VALUE 'TR'.
                   88  TXN-INTEREST    VALUE 'IN'.
               10  TXN-CHANNEL       PIC X.
                   88  TXN-BRANCH      VALUE 'B'.
                   88  TXN-ATM         VALUE 'A'.
                   88  TXN-ONLINE      VALUE 'O'.
                   88  TXN-MOBILE      VALUE 'M'.
           
           05  TXN-ACCOUNT-INFO.                    *> 帳戶資訊
               10  TXN-ACCT-NUM      PIC X(12).
               10  TXN-ACCT-BRANCH   PIC X(4).
               10  TXN-CURRENCY      PIC X(3).
           
           05  TXN-AMOUNT-INFO.                     *> 金額資訊
               10  TXN-AMOUNT        PIC S9(13)V99 COMP-3.
               10  TXN-AMOUNT-SIGN   PIC X.
                   88  TXN-CREDIT      VALUE '+'.
                   88  TXN-DEBIT       VALUE '-'.
               10  TXN-BALANCE-AFTER PIC S9(13)V99 COMP-3.
           
           05  TXN-REFERENCE-INFO.                  *> 參考資訊
               10  TXN-REF-NUM       PIC X(16).
               10  TXN-DESCRIPTION   PIC X(40).
               10  TXN-RELATED-ACCT  PIC X(12).
           
           05  TXN-USER-INFO.                       *> 使用者資訊
               10  TXN-TELLER-ID     PIC X(8).
               10  TXN-AUTH-CODE     PIC X(8).
               10  TXN-TERMINAL-ID   PIC X(8).
```

---

## 三、RENAMES (Level 66)

### 3.1 RENAMES 的用途

RENAMES 允許你為現有的資料欄位群組建立一個新的名稱，而不需要重新定義結構。

```cobol
       *---- RENAMES 範例 -----------------------------------------
       
       01  EMPLOYEE-RECORD.
           05  EMP-PERSONAL-INFO.
               10  EMP-ID            PIC X(8).
               10  EMP-NAME.
                   15  EMP-LAST      PIC X(20).
                   15  EMP-FIRST     PIC X(15).
               10  EMP-BIRTH-DATE    PIC 9(8).
           
           05  EMP-JOB-INFO.
               10  EMP-DEPT          PIC X(4).
               10  EMP-TITLE         PIC X(20).
               10  EMP-SALARY        PIC 9(7)V99 COMP-3.
           
           05  EMP-CONTACT-INFO.
               10  EMP-PHONE         PIC X(15).
               10  EMP-EMAIL         PIC X(40).
               10  EMP-ADDRESS.
                   15  EMP-STREET    PIC X(30).
                   15  EMP-CITY      PIC X(20).
                   15  EMP-COUNTRY   PIC X(20).
       
       * RENAMES 定義
       66  EMP-BASIC-INFO      RENAMES EMP-ID
                                   THRU EMP-FIRST.
       
       66  EMP-FULL-NAME       RENAMES EMP-LAST
                                   THRU EMP-FIRST.
       
       66  EMP-LOCATION        RENAMES EMP-CITY
                                   THRU EMP-COUNTRY.
```

### 3.2 RENAMES 的使用限制

```
┌─────────────────────────────────────────────────────────────────┐
│              RENAMES 使用限制                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ 可以做的：                                                   │
│  • 重新命名連續的欄位群組                                        │
│  • 建立資料的別名視圖                                            │
│  • 簡化報表輸出時的資料引用                                      │
│                                                                 │
│  ❌ 不可以做的：                                                 │
│  • 不能包含不連續的欄位                                          │
│  • 不能跨越多個 01 層級                                          │
│  • 不能與 OCCURS 一起使用                                        │
│  • 不能重新命名 66 或 88 層級                                    │
│                                                                 │
│  💡 注意：                                                       │
│  RENAMES 只是別名，不佔用額外儲存空間                            │
│  修改 RENAMES 欄位會同時修改原始欄位                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 四、獨立項目 (Level 77)

### 4.1 Level 77 的用途

Level 77 用於定義不屬於任何群組的獨立變數，通常用於工作儲存區的臨時變數。

```cobol
       *---- Level 77 範例 ----------------------------------------
       
       WORKING-STORAGE SECTION.
       
       * 獨立變數 (必須在 01 層級項目之前定義)
       77  WS-TEMP-VARIABLE     PIC X(100).
       77  WS-COUNTER           PIC 9(5) VALUE 0.
       77  WS-TOTAL-AMOUNT      PIC S9(13)V99 COMP-3 VALUE 0.
       77  WS-ERROR-FLAG        PIC X VALUE 'N'.
           88  WS-ERROR-YES     VALUE 'Y'.
           88  WS-ERROR-NO      VALUE 'N'.
       77  WS-LOOP-INDEX        PIC 9(3) COMP.
       77  WS-DATE-WORK         PIC 9(8).
       
       * 之後才是 01 層級的群組項目
       01  WS-WORK-AREAS.
           05  WS-INPUT-RECORD    PIC X(500).
           05  WS-OUTPUT-RECORD   PIC X(500).
```

### 4.2 Level 77 vs Level 01

| 特性 | Level 77 | Level 01 |
|------|----------|----------|
| **結構** | 獨立項目 | 可以是群組或基本項目 |
| **位置** | 必須在 01 之前 | 可在任何位置 |
| **用途** | 臨時變數、工作區 | 記錄定義、群組 |
| **子項目** | 不能有 | 可以有 (02-49) |
| **現代使用** | 較少使用 | 建議使用方式 |

```cobol
       *---- 現代建議寫法 (使用 01 代替 77) -----------------------
       
       WORKING-STORAGE SECTION.
       
       01  WS-SINGLE-VARS.                       *> 用 01 群組代替 77
           05  WS-TEMP-VARIABLE   PIC X(100).
           05  WS-COUNTER         PIC 9(5) VALUE 0.
           05  WS-TOTAL-AMOUNT    PIC S9(13)V99 COMP-3 VALUE 0.
           05  WS-ERROR-FLAG      PIC X VALUE 'N'.
               88  WS-ERROR-YES   VALUE 'Y'.
               88  WS-ERROR-NO    VALUE 'N'.
```

---

## 五、條件名稱 (Level 88)

### 5.1 Level 88 的用途

Level 88 用於為變數的特定值定義有意義的名稱，讓程式碼更具可讀性。

```cobol
       *---- Level 88 範例 ----------------------------------------
       
       05  WS-ACCOUNT-STATUS     PIC X.
           88  ACCT-ACTIVE       VALUE 'A'.
           88  ACCT-CLOSED       VALUE 'C'.
           88  ACCT-FROZEN       VALUE 'F'.
           88  ACCT-DORMANT      VALUE 'D'.
           88  ACCT-PENDING      VALUE 'P'.
           88  ACCT-VALID        VALUE 'A' 'C' 'F' 'D' 'P'.
           88  ACCT-INVALID      VALUE ' ' 'X' 'Z'.
       
       * 使用方式
       IF ACCT-ACTIVE
           PERFORM PROCESS-ACTIVE-ACCOUNT
       ELSE IF ACCT-FROZEN
           PERFORM PROCESS-FROZEN-ACCOUNT
       ELSE
           DISPLAY 'Invalid account status'
       END-IF
       
       * 等同於
       IF WS-ACCOUNT-STATUS = 'A'
           PERFORM PROCESS-ACTIVE-ACCOUNT
       ELSE IF WS-ACCOUNT-STATUS = 'F'
           PERFORM PROCESS-FROZEN-ACCOUNT
       ...
```

### 5.2 多值條件名稱

```cobol
       *---- 多值條件名稱範例 -------------------------------------
       
       05  WS-TRANSACTION-TYPE   PIC X(2).
           88  TXN-CREDIT-TYPES  VALUE 'DP' 'TR' 'RF' 'IN'.
           88  TXN-DEBIT-TYPES   VALUE 'WD' 'TF' 'PY' 'FE'.
           88  TXN-INTERNAL      VALUE 'AD' 'AJ' 'RI'.
           88  TXN-EXTERNAL      VALUE 'DP' 'WD' 'TR' 'TF' 'PY'.
       
       * 使用方式
       IF TXN-CREDIT-TYPES
           ADD TXN-AMOUNT TO ACCT-BALANCE
       ELSE IF TXN-DEBIT-TYPES
           SUBTRACT TXN-AMOUNT FROM ACCT-BALANCE
       END-IF
       
       * 範圍值 (Range)
       05  WS-ERROR-CODE         PIC 9(3).
           88  ERR-WARNING       VALUE 100 THRU 199.
           88  ERR-ERROR         VALUE 200 THRU 499.
           88  ERR-FATAL         VALUE 500 THRU 999.
           88  ERR-VALID         VALUE 0 THRU 999.
```

---

## 六、複雜資料結構設計

### 6.1 多幣別帳戶結構

```cobol
       *---- 多幣別帳戶結構 (MCN) ---------------------------------
       
       01  MULTI-CURRENCY-ACCOUNT.
           05  MCA-KEY.
               10  MCA-POOL-ID     PIC X(12).
               10  MCA-ACCT-NUM    PIC X(12).
           
           05  MCA-BALANCES.
               10  MCA-BALANCE-ENTRY OCCURS 10 TIMES.
                   15  MCA-CURRENCY    PIC X(3).
                   15  MCA-BALANCE     PIC S9(13)V99 COMP-3.
                   15  MCA-BAL-SIGN    PIC X.
                       88  MCA-POSITIVE  VALUE '+'.
                       88  MCA-NEGATIVE  VALUE '-'.
                   15  MCA-EQUIV-USD   PIC S9(13)V99 COMP-3.
           
           05  MCA-INTEREST-INFO.
               10  MCA-TOTAL-INT-USD   PIC S9(11)V99 COMP-3.
               10  MCA-DIFFERENTIAL    PIC S9(11)V99 COMP-3.
               10  MCA-ALLOC-RATIO     PIC 9V9(5) COMP-3.
```

### 6.2 批次控制記錄

```cobol
       *---- 批次控制記錄結構 -------------------------------------
       
       01  BATCH-CONTROL-RECORD.
           05  BCR-HEADER.
               10  BCR-BATCH-ID      PIC X(8).
               10  BCR-BATCH-DATE    PIC 9(8).
               10  BCR-BATCH-TYPE    PIC X.
                   88  BCR-DAILY       VALUE 'D'.
                   88  BCR-MONTHLY     VALUE 'M'.
                   88  BCR-YEARLY      VALUE 'Y'.
           
           05  BCR-COUNTS.
               10  BCR-INPUT-COUNT   PIC 9(9).
               10  BCR-OUTPUT-COUNT  PIC 9(9).
               10  BCR-ERROR-COUNT   PIC 9(9).
               10  BCR-SKIP-COUNT    PIC 9(9).
           
           05  BCR-AMOUNTS.
               10  BCR-INPUT-AMT     PIC S9(15)V99 COMP-3.
               10  BCR-OUTPUT-AMT    PIC S9(15)V99 COMP-3.
               10  BCR-ERROR-AMT     PIC S9(15)V99 COMP-3.
           
           05  BCR-TIMING.
               10  BCR-START-TIME    PIC 9(6).
               10  BCR-END-TIME      PIC 9(6).
               10  BCR-ELAPSED-TIME  PIC 9(6).
           
           05  BCR-STATUS.
               10  BCR-COMPLETION    PIC X.
                   88  BCR-SUCCESS     VALUE 'S'.
                   88  BCR-PARTIAL     VALUE 'P'.
                   88  BCR-FAILED      VALUE 'F'.
               10  BCR-RETURN-CODE   PIC 9(4).
```

---

## 七、BA 實務指南

### 7.1 資料結構分析檢查清單

```
┌─────────────────────────────────────────────────────────────────┐
│              資料結構分析檢查清單                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  □ 整體結構                                                     │
│    ├── 01 層級定義是否清晰？                                    │
│    ├── 群組劃分是否符合業務邏輯？                               │
│    └── 欄位順序是否合理？                                       │
│                                                                 │
│  □ 層級設計                                                     │
│    ├── 層級編號是否連貫？                                       │
│    ├── 子項目層級是否正確 (必須大於父項)？                      │
│    └── 是否有過深的巢狀 (建議不超過 4-5 層)？                   │
│                                                                 │
│  □ 條件名稱 (88)                                                │
│    ├── 所有可能的值都有對應的 88 條件？                         │
│    ├── 條件名稱是否具有描述性？                                 │
│    └── 是否有重疊或遺漏的值範圍？                               │
│                                                                 │
│  □ 命名慣例                                                     │
│    ├── 欄位名稱是否一致？                                       │
│    ├── 前綴是否統一？ (如: ACCT-, CUST-, TXN-)                 │
│    └── 是否避免縮寫造成混淆？                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 常見設計錯誤

| 錯誤類型 | 錯誤範例 | 問題 | 修正 |
|----------|----------|------|------|
| **層級錯誤** | 05 A, 03 B | 子項層級小於父項 | 03 A, 05 B |
| **重複定義** | 兩個 05 CUST-ID | 同一層級同名 | 改名或合併 |
| **孤立項目** | 02 X 在 01 Y 後 | 層級不連續 | 調整層級或結構 |
| **過度巢狀** | 5+ 層巢狀 | 難以閱讀 | 扁平化結構 |
| **缺少 88** | 狀態欄無條件名 | 可讀性差 | 補充 88 定義 |

---

## 八、練習題

### 練習 1: 設計資料結構

請為以下需求設計 COBOL 資料結構：

**需求**：設計一個信用卡交易記錄，包含：
- 交易識別資訊 (序號、日期時間、類型)
- 卡片資訊 (卡號、卡別、到期日)
- 交易金額資訊 (金額、幣別、手續費)
- 商戶資訊 (商戶代碼、名稱、類型、國家)
- 授權資訊 (授權碼、回應碼、狀態)

### 練習 2: 分析資料結構

分析以下資料結構，找出問題：

```cobol
01  CUSTOMER.
    03  CUST-ID         PIC X(10).
    05  CUST-NAME.
        10  CUST-FIRST  PIC X(20).
        10  CUST-LAST   PIC X(20).
    05  CUST-STATUS     PIC X.
        88  CUST-ACTIVE VALUE 'A'.
        88  CUST-CLOSED VALUE 'C'.
    02  CUST-BALANCE    PIC 9(9)V99.
```

**問題**：
1. 層級編號有什麼問題？
2. 缺少什麼條件名稱？
3. CUST-BALANCE 有什麼潛在問題？

### 練習 3: RENAMES 設計

給定以下結構，設計適當的 RENAMES：

```cobol
01  EMPLOYEE.
    05  EMP-ID          PIC X(8).
    05  EMP-NAME.
        10  EMP-FIRST   PIC X(15).
        10  EMP-MIDDLE  PIC X(10).
        10  EMP-LAST    PIC X(20).
    05  EMP-DEPT        PIC X(4).
    05  EMP-JOIN-DATE   PIC 9(8).
    05  EMP-SALARY      PIC 9(7)V99 COMP-3.
```

**要求**：
1. 定義一個 RENAMES 包含 ID 和完整姓名
2. 定義一個 RENAMES 只包含姓名部分

---

## 九、總結

### 本課程重點回顧

✅ **Level Number**: 01(記錄)、02-49(中間層級)、66(RENAMES)、77(獨立)、88(條件)

✅ **階層結構**: 群組設計、業務邏輯分組、巢狀層級

✅ **RENAMES**: 建立資料別名、簡化資料引用

✅ **Level 88**: 條件名稱、多值定義、範圍值

✅ **BA 關注點**: 結構清晰度、層級正確性、條件完整性、命名一致性

---

## 延伸閱讀

- [Lesson 2-4: COMP, COMP-3, Packed Decimal](lesson-2-4-comp-usage.md)
- [Lesson 2-2: 變數宣告與 PIC 子句](lesson-2-2-pic-clause.md)

---

*課程版本: 1.0 | 更新日期: 2026-04-11*
