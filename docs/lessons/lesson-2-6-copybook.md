# Lesson 2-6: COPYBOOK 與程式碼複用

> 理解 COBOL 的程式碼共用機制

---

## 學習目標

- 理解 COPYBOOK 的概念與用途
- 掌握 COPY 語句的使用方法
- 能夠設計和維護 COPYBOOK
- 了解 BA 在管理 COPYBOOK 時的關注點

---

## 一、COPYBOOK 基礎

### 1.1 什麼是 COPYBOOK？

COPYBOOK 是 COBOL 中儲存共用程式碼片段的機制，通常用於定義共用的資料結構。多個程式可以透過 COPY 語句引用相同的 COPYBOOK，確保資料定義的一致性。

```
┌─────────────────────────────────────────────────────────────────┐
│              COPYBOOK 概念圖                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │              COPYBOOK 檔案 (共用定義)                    │  │
│   │  ┌─────────────────────────────────────────────────┐   │  │
│   │  │  CUSTREC (客戶資料結構)                          │   │  │
│   │  │  ├── CUST-ID        PIC X(10)                   │   │  │
│   │  │  ├── CUST-NAME      PIC X(30)                   │   │  │
│   │  │  └── CUST-PHONE     PIC X(15)                   │   │  │
│   │  └─────────────────────────────────────────────────┘   │  │
│   └─────────────────────────────────────────────────────────┘  │
│                              ↓                                  │
│              ┌───────────────┼───────────────┐                  │
│              ↓               ↓               ↓                  │
│   ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐  │
│   │   程式 A        │ │   程式 B        │ │   程式 C        │  │
│   │                 │ │                 │ │                 │  │
│   │  COPY CUSTREC.  │ │  COPY CUSTREC.  │ │  COPY CUSTREC.  │  │
│   │                 │ │                 │ │                 │  │
│   │  (使用客戶資料) │ │  (使用客戶資料) │ │  (使用客戶資料) │  │
│   └─────────────────┘ └─────────────────┘ └─────────────────┘  │
│                                                                 │
│   優點：                                                        │
│   • 資料結構一致性                                              │
│   • 修改一處，全體生效                                          │
│   • 減少重複程式碼                                              │
│   • 易於維護                                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 COPYBOOK 在銀行系統中的應用

```
┌─────────────────────────────────────────────────────────────────┐
│              銀行系統 COPYBOOK 分類                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  COPYBOOK 類型        用途                      範例            │
│  ─────────────        ────                      ────            │
│                                                                 │
│  主檔結構             帳戶、客戶主檔定義        ACCTREC        │
│  (Master Files)       多程式共用                                 │
│                                                                 │
│  交易結構             各類交易記錄格式          TXNREC         │
│  (Transaction)        存款、提款、轉帳等                         │
│                                                                 │
│  報表結構             報表輸出格式              RPTHDDR        │
│  (Report)           標題、明細、合計                             │
│                                                                 │
│  常數定義             系統常數、代碼定義        CONSTANTS      │
│  (Constants)        利率、費用、狀態碼                          │
│                                                                 │
│  介面結構             系統間資料交換格式        INTERFACE      │
│  (Interface)        MQ、Socket 訊息格式                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、COPY 語句語法

### 2.1 基本語法

```cobol
       *---- COPY 語句基本形式 ------------------------------------
       
       * 基本形式
       COPY copybook-name.
       
       * 指定替換文字 (REPLACING)
       COPY copybook-name
           REPLACING ==old-text== BY ==new-text==.
       
       * 多重替換
       COPY copybook-name
           REPLACING ==old-1== BY ==new-1==
                     ==old-2== BY ==new-2==.
       
       * 在特定區段使用
       COPY copybook-name IN/OF library-name.
```

### 2.2 使用範例

```cobol
       *---- COPY 使用範例 ----------------------------------------
       
       DATA DIVISION.
       
       * FILE SECTION 中引用檔案結構
       FILE SECTION.
       FD  ACCOUNT-FILE.
       COPY ACCTREC.                    *> 引用帳戶結構 COPYBOOK
       
       * WORKING-STORAGE 中引用常數
       WORKING-STORAGE SECTION.
       COPY CONSTANTS.                  *> 引用常數定義
       
       * LINKAGE SECTION 中引用介面結構
       LINKAGE SECTION.
       COPY ACCTINQ.                    *> 引用查詢介面結構
       
       * 使用 REPLACING 進行欄位名稱調整
       FD  HISTORY-FILE.
       COPY ACCTREC
           REPLACING ==ACCT-== BY ==HIST-ACCT-==.
       
       * 結果：ACCT-NUMBER 變成 HIST-ACCT-NUMBER
```

---

## 三、COPYBOOK 設計

### 3.1 標準 COPYBOOK 結構

```cobol
       *=============================================================
       * COPYBOOK: ACCTREC
       * 用途: 帳戶主檔資料結構
       * 建立日期: 2026-04-01
       * 最後修改: 2026-04-11
       * 修改者: JOHN DOE
       * 版本: 1.2
       *=============================================================
       
       01  ACCOUNT-RECORD.
           05  ACCT-KEY.
               10  ACCT-NUMBER        PIC X(12).
               10  ACCT-BRANCH        PIC X(4).
           
           05  ACCT-INFO.
               10  ACCT-TYPE          PIC X.
                   88  ACCT-CHECKING   VALUE 'C'.
                   88  ACCT-SAVINGS    VALUE 'S'.
                   88  ACCT-TIME-DEP   VALUE 'T'.
               10  ACCT-CURRENCY      PIC X(3).
               10  ACCT-STATUS        PIC X.
                   88  ACCT-ACTIVE     VALUE 'A'.
                   88  ACCT-CLOSED     VALUE 'C'.
                   88  ACCT-FROZEN     VALUE 'F'.
           
           05  ACCT-BALANCE-INFO.
               10  ACCT-CURR-BAL      PIC S9(13)V99 COMP-3.
               10  ACCT-AVAIL-BAL     PIC S9(13)V99 COMP-3.
               10  ACCT-HOLD-AMT      PIC S9(13)V99 COMP-3.
           
           05  ACCT-CUSTOMER-INFO.
               10  ACCT-CUST-ID       PIC X(10).
               10  ACCT-CUST-NAME     PIC X(40).
           
           05  ACCT-AUDIT-INFO.
               10  ACCT-OPEN-DATE     PIC 9(8).
               10  ACCT-UPDATE-DATE   PIC 9(8).
               10  ACCT-UPDATE-BY     PIC X(8).
       
       *=============================================================
       * 修改歷史:
       * v1.2 (2026-04-11): 新增 ACCT-UPDATE-BY 欄位
       * v1.1 (2026-03-15): 新增 ACCT-HOLD-AMT 欄位
       * v1.0 (2026-01-01): 初始版本
       *=============================================================
```

### 3.2 常數定義 COPYBOOK

```cobol
       *=============================================================
       * COPYBOOK: CONSTANTS
       * 用途: 系統常數定義
       *=============================================================
       
       *---- 系統限制常數 -------------------------------------------
       01  CONST-SYSTEM-LIMITS.
           05  CONST-MAX-RECORDS      PIC 9(9) VALUE 999999999.
           05  CONST-MAX-ACCT-BAL     PIC 9(13)V99 
                                       VALUE 9999999999999.99.
           05  CONST-MAX-TXN-AMT      PIC 9(11)V99 
                                       VALUE 99999999999.99.
       
       *---- 利率常數 -----------------------------------------------
       01  CONST-INTEREST-RATES.
           05  CONST-RATE-SAVINGS     PIC 9V9(4) COMP-3 
                                       VALUE 2.5000.
           05  CONST-RATE-CHECKING    PIC 9V9(4) COMP-3 
                                       VALUE 0.0000.
           05  CONST-RATE-TIME-1Y     PIC 9V9(4) COMP-