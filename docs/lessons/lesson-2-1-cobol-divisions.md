# Lesson 2-1: COBOL 四大 DIVISION

> 理解 COBOL 程式的基本結構與四大部門

---

## 學習目標

- 理解 COBOL 程式的四大 DIVISION 及其作用
- 掌握每個 DIVISION 的基本語法與內容
- 能夠閱讀簡單的 COBOL 程式結構
- 了解 BA 在閱讀程式時應關注的重點

---

## 一、COBOL 程式結構概覽

### 1.1 COBOL 是什麼？

COBOL (Common Business-Oriented Language) 是 1959 年設計的程式語言，專為商業資料處理而生。在銀行業，COBOL 至今仍是核心系統的主要語言。

```
┌─────────────────────────────────────────────────────────────────┐
│                  COBOL 程式結構                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  IDENTIFICATION DIVISION                                │  │
│   │  ─────────────────────                                  │  │
│   │  • 程式識別資訊 (名稱、作者、日期等)                    │  │
│   │  • 類似程式的「身分證」                                  │  │
│   └─────────────────────────────────────────────────────────┘  │
│                              ↓                                  │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  ENVIRONMENT DIVISION                                   │  │
│   │  ────────────────────                                   │  │
│   │  • 程式執行環境設定                                      │  │
│   │  • 檔案與設備的對應關係                                  │  │
│   └─────────────────────────────────────────────────────────┘  │
│                              ↓                                  │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  DATA DIVISION                                          │  │
│   │  ────────────                                           │  │
│   │  • 所有資料的定義與宣告                                  │  │
│   │  • 變數、檔案記錄格式等                                  │  │
│   └─────────────────────────────────────────────────────────┘  │
│                              ↓                                  │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  PROCEDURE DIVISION                                     │  │
│   │  ────────────────                                       │  │
│   │  • 程式邏輯與處理流程                                    │  │
│   │  • 實際的運算與操作指令                                  │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   記憶口訣：「我識別環境，用資料執行程序」                      │
│   (Identification → Environment → Data → Procedure)             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 完整 COBOL 程式範例

```cobol
       *=============================================================
       * 範例程式：簡單的客戶資料處理程式
       * 目的：展示四大 DIVISION 的結構
       *=============================================================
       
       IDENTIFICATION DIVISION.
       PROGRAM-ID. CUSTPROC.
       AUTHOR.     JOHN DOE.
       DATE-WRITTEN. 2026-04-01.
       DATE-COMPILED. 2026-04-02.
       
       ENVIRONMENT DIVISION.
       CONFIGURATION SECTION.
       SOURCE-COMPUTER. IBM-370.
       OBJECT-COMPUTER. IBM-370.
       
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT CUSTOMER-FILE
               ASSIGN TO 'CUSTFILE'
               ORGANIZATION IS SEQUENTIAL.
           SELECT REPORT-FILE
               ASSIGN TO 'REPORT'
               ORGANIZATION IS SEQUENTIAL.
       
       DATA DIVISION.
       FILE SECTION.
       FD  CUSTOMER-FILE.
       01  CUSTOMER-RECORD.
           05  CUST-ID           PIC X(10).
           05  CUST-NAME         PIC X(30).
           05  CUST-BALANCE      PIC 9(9)V99.
       
       FD  REPORT-FILE.
       01  REPORT-RECORD         PIC X(80).
       
       WORKING-STORAGE SECTION.
       01  WS-COUNTERS.
           05  WS-READ-COUNT     PIC 9(5) VALUE 0.
           05  WS-WRITE-COUNT    PIC 9(5) VALUE 0.
       
       01  WS-HEADER-LINE.
           05  FILLER            PIC X(20) VALUE 'CUSTOMER REPORT'.
           05  FILLER            PIC X(60) VALUE SPACES.
       
       PROCEDURE DIVISION.
       0000-MAIN.
           PERFORM 1000-INITIALIZE
           PERFORM 2000-PROCESS-FILE
           PERFORM 3000-TERMINATE
           STOP RUN
           .
       
       1000-INITIALIZE.
           OPEN INPUT CUSTOMER-FILE
           OPEN OUTPUT REPORT-FILE
           WRITE REPORT-RECORD FROM WS-HEADER-LINE
           .
       
       2000-PROCESS-FILE.
           READ CUSTOMER-FILE
               AT END
                   EXIT PARAGRAPH
           END-READ
           
           ADD 1 TO WS-READ-COUNT
           PERFORM 2100-WRITE-DETAIL
           PERFORM 2000-PROCESS-FILE
           .
       
       2100-WRITE-DETAIL.
           MOVE CUSTOMER-RECORD TO REPORT-RECORD
           WRITE REPORT-RECORD
           ADD 1 TO WS-WRITE-COUNT
           .
       
       3000-TERMINATE.
           CLOSE CUSTOMER-FILE
           CLOSE REPORT-FILE
           DISPLAY 'Records processed: ' WS-READ-COUNT
           .
```

---

## 二、IDENTIFICATION DIVISION

### 2.1 作用與內容

IDENTIFICATION DIVISION 是程式的「身分證」，用於識別程式的基本資訊。

```cobol
       IDENTIFICATION DIVISION.
       PROGRAM-ID.    CUSTPROC.           *> 程式名稱 (必填)
       AUTHOR.        JOHN DOE.           *> 作者
       INSTALLATION.  MAINFRAME-DEV.      *> 安裝地點
       DATE-WRITTEN.  2026-04-01.         *> 撰寫日期
       DATE-COMPILED. 2026-04-02.         *> 編譯日期
       SECURITY.      CONFIDENTIAL.       *> 安全等級
       REMARKS.       CUSTOMER PROCESSING. *> 備註
```

### 2.2 BA 閱讀重點

| 欄位 | BA 關注點 |
|------|-----------|
| **PROGRAM-ID** | 確認程式名稱與規格書一致 |
| **AUTHOR** | 了解原作者，方便後續詢問 |
| **DATE-WRITTEN** | 判斷程式年代，評估技術債 |
| **REMARKS** | 快速了解程式用途 |

```
┌─────────────────────────────────────────────────────────────────┐
│              BA 實務提示                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  當你看到這樣的 IDENTIFICATION DIVISION：                        │
│                                                                 │
│  PROGRAM-ID. CLMBAT02.                                          │
│  AUTHOR. MARY CHEN.                                             │
│  DATE-WRITTEN. 2010-05-15.                                      │
│                                                                 │
│  你應該想到：                                                    │
│  • 這是 CLM 系統的批次程式 (BAT = Batch)                        │
│  • 編號 02 表示可能是第 2 個步驟                                │
│  • 2010 年的程式，可能有 15 年歷史，需特別注意邏輯複雜度        │
│  • 可以找 Mary Chen 了解當初設計思路 (如果還在職)               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 三、ENVIRONMENT DIVISION

### 3.1 作用與內容

ENVIRONMENT DIVISION 定義程式執行的環境，以及檔案與設備的對應關係。

```cobol
       ENVIRONMENT DIVISION.
       
       *---- 配置區段 (基本設定) -----------------------------------
       CONFIGURATION SECTION.
       SOURCE-COMPUTER. IBM-370.           *> 原始碼編譯環境
       OBJECT-COMPUTER. IBM-370.           *> 執行環境
       SPECIAL-NAMES.
           C01 IS TOP-OF-PAGE.             *> 換頁控制
       
       *---- 輸入輸出區段 (檔案對應) -------------------------------
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           * 定義輸入檔案
           SELECT CUSTOMER-FILE
               ASSIGN TO 'CUSTFILE'        *> 對應的 Dataset 名稱
               ORGANIZATION IS SEQUENTIAL  *> 循序組織
               ACCESS MODE IS SEQUENTIAL   *> 循序存取
               FILE STATUS IS WS-CUST-STATUS. *> 檔案狀態碼
           
           * 定義輸出檔案
           SELECT REPORT-FILE
               ASSIGN TO 'REPORT'
               ORGANIZATION IS SEQUENTIAL
               ACCESS MODE IS SEQUENTIAL.
```

### 3.2 檔案組織類型

```
┌─────────────────────────────────────────────────────────────────┐
│              檔案組織類型比較                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  組織類型           說明                    適用場景            │
│  ─────────          ────                    ────────            │
│                                                                 │
│  SEQUENTIAL         循序檔案                批次處理、報表      │
│  (循序)             從頭到尾讀取            日終批次、備份      │
│                                                                 │
│  INDEXED            索引檔案                線上交易、查詢      │
│  (索引)             可直接查詢特定 Key      CICS 交易、主檔     │
│                                                                 │
│  RELATIVE           相對檔案                固定長度記錄        │
│  (相對)             以 RRN 存取             較少使用            │
│                                                                 │
│  VSAM               虛擬儲存存取法          銀行最常見          │
│  (KSDS/ESDS/RRDS)   高效能索引或循序        帳戶主檔、交易檔    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 BA 閱讀重點

| 欄位 | BA 關注點 |
|------|-----------|
| **ASSIGN TO** | 了解程式使用哪些檔案 |
| **ORGANIZATION** | 判斷檔案類型與處理方式 |
| **FILE STATUS** | 確認是否有錯誤處理機制 |

```
┌─────────────────────────────────────────────────────────────────┐
│              BA 實務提示                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  當你看到這樣的 FILE-CONTROL：                                   │
│                                                                 │
│  SELECT ACCOUNT-MASTER                                           │
│      ASSIGN TO ACCTMST                                           │
│      ORGANIZATION IS INDEXED                                     │
│      ACCESS MODE IS RANDOM                                       │
│      RECORD KEY IS ACCT-NUMBER                                   │
│      FILE STATUS IS WS-ACCT-STATUS.                              │
│                                                                 │
│  你應該想到：                                                    │
│  • 這是帳戶主檔 (ACCOUNT-MASTER)                                │
│  • 使用索引組織，支援隨機存取 (RANDOM)                          │
│  • 以帳號 (ACCT-NUMBER) 為 Key                                  │
│  • 線上交易會直接查詢此檔案                                     │
│  • 需要確認 KEY 的設計是否支援業務查詢需求                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 四、DATA DIVISION

### 4.1 作用與內容

DATA DIVISION 是 COBOL 程式中定義所有資料的地方，是 BA 最需要理解的部分。

```cobol
       DATA DIVISION.
       
       *---- 檔案區段 (定義檔案記錄格式) ---------------------------
       FILE SECTION.
       FD  CUSTOMER-FILE.                  *> File Description
       01  CUSTOMER-RECORD.                *> 記錄層級
           05  CUST-ID           PIC X(10). *> 客戶編號
           05  CUST-NAME         PIC X(30). *> 客戶姓名
           05  CUST-BALANCE      PIC 9(9)V99. *> 餘額
       
       *---- 工作儲存區 (程式內使用的變數) -------------------------
       WORKING-STORAGE SECTION.
       01  WS-COUNTERS.                     *> 計數器群組
           05  WS-READ-COUNT     PIC 9(5) VALUE 0.
           05  WS-WRITE-COUNT    PIC 9(5) VALUE 0.
       
       01  WS-FLAGS.                        *> 旗標群組
           05  WS-EOF-FLAG       PIC X VALUE 'N'.
               88  WS-EOF-YES    VALUE 'Y'.
               88  WS-EOF-NO     VALUE 'N'.
       
       *---- 連結區段 (與其他程式傳遞參數) -------------------------
       LINKAGE SECTION.
       01  LS-PARAMETERS.
           05  LS-INPUT-DATA     PIC X(100).
           05  LS-OUTPUT-DATA    PIC X(100).
```

### 4.2 資料層級結構

```
┌─────────────────────────────────────────────────────────────────┐
│              COBOL 資料層級結構                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  層級   用途                          範例                      │
│  ────   ────                          ────                      │
│                                                                 │
│  01      記錄或群組的起始層級        01 CUSTOMER-RECORD.       │
│                                                                 │
│  02-49   中間層級，用於群組結構      05 CUST-ADDRESS.          │
│                                        10 CUST-STREET.         │
│                                        10 CUST-CITY.           │
│                                                                 │
│  66      RENAMES 子句專用            66 CUST-FULL-NAME         │
│                                        RENAMES CUST-FIRST       │
│                                        THRU CUST-LAST.          │
│                                                                 │
│  77      獨立項目 (不屬於任何群組)   77 WS-TEMP-VARIABLE       │
│                                                                 │
│  88      條件名稱 (Condition Name)   88 WS-EOF-YES VALUE 'Y'.  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 BA 閱讀重點

| 區段 | BA 關注點 |
|------|-----------|
| **FILE SECTION** | 了解輸入/輸出檔案的欄位結構 |
| **WORKING-STORAGE** | 了解程式內部邏輯使用的變數 |
| **Level 88** | 條件判斷的語意化命名 |

```
┌─────────────────────────────────────────────────────────────────┐
│              BA 實務提示                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  當你看到這樣的 DATA DIVISION：                                  │
│                                                                 │
│  01  ACCOUNT-RECORD.                                             │
│      05  ACCT-NUMBER        PIC X(12).                           │
│      05  ACCT-TYPE          PIC X.                               │
│          88  ACCT-CHECKING  VALUE 'C'.                           │
│          88  ACCT-SAVINGS   VALUE 'S'.                           │
│          88  ACCT-TIME-DEP  VALUE 'T'.                           │
│      05  ACCT-BALANCE       PIC S9(13)V99 COMP-3.                │
│      05  ACCT-STATUS        PIC X.                               │
│          88  ACCT-ACTIVE    VALUE 'A'.                           │
│          88  ACCT-CLOSED    VALUE 'C'.                           │
│          88  ACCT-FROZEN    VALUE 'F'.                           │
│                                                                 │
│  你應該記錄：                                                    │
│  • 帳號是 12 位英數字 (X(12))                                   │
│  • 帳戶類型有 3 種：支票(C)、儲蓄(S)、定存(T)                   │
│  • 餘額使用 COMP-3 格式，最大 13 位整數 + 2 位小數              │
│  • 帳戶狀態有 3 種：正常(A)、已關閉(C)、凍結(F)                 │
│  • 這些資訊對需求分析和測試設計都很重要！                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 五、PROCEDURE DIVISION

### 5.1 作用與內容

PROCEDURE DIVISION 是程式的「大腦」，包含所有的處理邏輯與運算指令。

```cobol
       PROCEDURE DIVISION.
       
       *---- 主程序入口 -------------------------------------------
       0000-MAIN.
           PERFORM 1000-INITIALIZE
           PERFORM 2000-PROCESS-FILE
           PERFORM 3000-TERMINATE
           STOP RUN
           .
       
       *---- 初始化段落 -------------------------------------------
       1000-INITIALIZE.
           OPEN INPUT CUSTOMER-FILE
           OPEN OUTPUT REPORT-FILE
           WRITE REPORT-RECORD FROM WS-HEADER-LINE
           .
       
       *---- 主要處理段落 -----------------------------------------
       2000-PROCESS-FILE.
           READ CUSTOMER-FILE
               AT END
                   EXIT PARAGRAPH
           END-READ
           
           ADD 1 TO WS-READ-COUNT
           PERFORM 2100-WRITE-DETAIL
           PERFORM 2000-PROCESS-FILE
           .
       
       2100-WRITE-DETAIL.
           MOVE CUSTOMER-RECORD TO REPORT-RECORD
           WRITE REPORT-RECORD
           ADD 1 TO WS-WRITE-COUNT
           .
       
       *---- 結束處理段落 -----------------------------------------
       3000-TERMINATE.
           CLOSE CUSTOMER-FILE
           CLOSE REPORT-FILE
           DISPLAY 'Records processed: ' WS-READ-COUNT
           .
```

### 5.2 常見的 PERFORM 用法

```
┌─────────────────────────────────────────────────────────────────┐
│              PERFORM 語句類型                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  語法                              說明                         │
│  ────                              ────                         │
│                                                                 │
│  PERFORM 段落名稱                   執行一次該段落               │
│                                                                 │
│  PERFORM 段落名稱 n TIMES           執行 n 次                    │
│                                                                 │
│  PERFORM 段落名稱 UNTIL 條件        直到條件成立前持續執行       │
│                                                                 │
│  PERFORM 段落名稱 VARYING 變數      類似 for 迴圈               │
│      FROM 起始值 BY 增量 UNTIL 條件                               │
│                                                                 │
│  PERFORM 段落-1 THRU 段落-n         連續執行多個段落             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 BA 閱讀重點

| 元素 | BA 關注點 |
|------|-----------|
| **段落命名** | 了解程式的模組結構 |
| **PERFORM 流程** | 追蹤程式的執行順序 |
| **條件判斷** | 理解業務邏輯的分支 |
| **檔案操作** | 確認資料的輸入輸出 |

```
┌─────────────────────────────────────────────────────────────────┐
│              BA 實務提示                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  當你看到這樣的 PROCEDURE DIVISION：                             │
│                                                                 │
│  0000-MAIN.                                                      │
│      PERFORM 1000-INIT                                           │
│      PERFORM 2000-CALC-INTEREST                                  │
│      PERFORM 3000-UPDATE-ACCOUNT                                 │
│      PERFORM 9000-TERM                                           │
│      STOP RUN.                                                   │
│                                                                 │
│  2000-CALC-INTEREST.                                             │
│      IF ACCT-TYPE = 'SAVINGS'                                    │
│         COMPUTE WS-INT = ACCT-BAL * WS-RATE / 365                │
│      ELSE                                                        │
│         MOVE ZERO TO WS-INT                                      │
│      END-IF                                                      │
│      ADD WS-INT TO ACCT-INT-ACCrued.                             │
│                                                                 │
│  你應該理解：                                                    │
│  • 這是批次程式的典型結構 (INIT → PROCESS → TERM)               │
│  • 2000 段落計算利息，只對儲蓄帳戶 (SAVINGS) 計息               │
│  • 使用日利率計算 (除以 365)                                    │
│  • 利息累加到 ACCT-INT-ACCrued 欄位                             │
│  • 這段邏輯可能有問題：支票帳戶真的都不計息嗎？需要確認！        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 六、BA 閱讀 COBOL 程式的步驟

### 6.1 建議的閱讀順序

```
┌─────────────────────────────────────────────────────────────────┐
│              BA 閱讀 COBOL 程式的建議順序                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: IDENTIFICATION DIVISION                                │
│  ─────────────────────────────                                  │
│  • 確認程式名稱與用途                                            │
│  • 記錄作者與撰寫日期                                            │
│                                                                 │
│  Step 2: ENVIRONMENT DIVISION                                   │
│  ────────────────────────────                                   │
│  • 列出所有使用的檔案                                            │
│  • 記錄檔案組織類型                                              │
│                                                                 │
│  Step 3: DATA DIVISION (FILE SECTION)                           │
│  ───────────────────────────────────                            │
│  • 了解輸入/輸出檔案的欄位結構                                   │
│  • 記錄重要的業務欄位                                            │
│  • 注意 Level 88 的條件名稱                                      │
│                                                                 │
│  Step 4: PROCEDURE DIVISION (概覽)                              │
│  ─────────────────────────────────                              │
│  • 先看主程序 (0000-MAIN) 的流程                                │
│  • 了解程式的整體架構                                            │
│                                                                 │
│  Step 5: PROCEDURE DIVISION (細節)                              │
│  ─────────────────────────────────                              │
│  • 針對感興趣的功能深入閱讀                                      │
│  • 追蹤資料的流動路徑                                            │
│  • 記錄業務邏輯與計算公式                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 閱讀時的筆記模板

```markdown
## 程式閱讀筆記

### 基本資訊
- **程式名稱**: 
- **作者**: 
- **撰寫日期**: 
- **用途**: 

### 檔案清單
| 檔案名稱 | 類型 | 用途 |
|----------|------|------|
| | | |

### 重要欄位
| 欄位名稱 | 位置 | 格式 | 業務意義 |
|----------|------|------|----------|
| | | | |

### 業務邏輯摘要
1. 
2. 
3. 

### 疑問與待確認
- 
- 

### 影響分析
- 若修改 [某欄位]，會影響：
  - 
```

---

## 七、練習題

### 練習 1: 識別 DIVISION

請指出以下程式碼片段屬於哪個 DIVISION：

```cobol
A) PROGRAM-ID. CALCINT.
   AUTHOR. JOHN DOE.

B) SELECT ACCOUNT-FILE
       ASSIGN TO ACCTFILE
       ORGANIZATION IS INDEXED.

C) 01  ACCOUNT-RECORD.
       05  ACCT-NUMBER    PIC X(10).
       05  ACCT-BALANCE   PIC 9(9)V99.

D) COMPUTE WS-INTEREST = ACCT-BALANCE * 0.05.
   ADD WS-INTEREST TO ACCT-BALANCE.
```

### 練習 2: 閱讀程式

閱讀以下簡化程式，回答問題：

```cobol
       IDENTIFICATION DIVISION.
       PROGRAM-ID. INTERESTCALC.
       
       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT ACCT-FILE ASSIGN TO ACCTFILE.
           SELECT RPT-FILE ASSIGN TO REPORT.
       
       DATA DIVISION.
       FILE SECTION.
       FD  ACCT-FILE.
       01  ACCT-REC.
           05  AC-NUM      PIC X(8).
           05  AC-TYPE     PIC X.
               88  AC-SAVINGS  VALUE 'S'.
               88  AC-CHECKING VALUE 'C'.
           05  AC-BAL      PIC 9(7)V99.
       
       WORKING-STORAGE SECTION.
       01  WS-INTEREST   PIC 9(5)V99.
       01  WS-RATE       PIC 9V9(4) VALUE 0.0250.
       
       PROCEDURE DIVISION.
       0000-MAIN.
           OPEN INPUT ACCT-FILE
           OPEN OUTPUT RPT-FILE
           PERFORM 1000-PROCESS
           CLOSE ACCT-FILE
           CLOSE RPT-FILE
           STOP RUN.
       
       1000-PROCESS.
           READ ACCT-FILE
               AT END
                   EXIT PARAGRAPH
           END-READ
           
           IF AC-SAVINGS
               COMPUTE WS-INTEREST = AC-BAL * WS-RATE / 12
               DISPLAY AC-NUM ' Interest: ' WS-INTEREST
           END-IF
           
           PERFORM 1000-PROCESS.
```

**問題**：
1. 這個程式處理什麼檔案？
2. 只對哪種帳戶類型計算利息？
3. 利率是多少？如何計算利息？
4. 輸出是什麼？

### 練習 3: 設計問題

假設你需要修改上述程式，讓支票帳戶 (CHECKING) 也能計算利息，但利率只有 0.5%。

**問題**：
1. 需要修改哪些段落？
2. 需要新增什麼 WORKING-STORAGE 變數？
3. 如何設計測試案例驗證修改？

---

## 八、總結

### 本課程重點回顧

✅ **IDENTIFICATION DIVISION**: 程式的身分證，記錄名稱、作者、日期

✅ **ENVIRONMENT DIVISION**: 環境設定，定義檔案與設備對應

✅ **DATA DIVISION**: 資料定義，包含 FILE / WORKING-STORAGE / LINKAGE SECTION

✅ **PROCEDURE DIVISION**: 程式邏輯，包含所有處理指令

✅ **BA 閱讀技巧**: 循序漸進，先架構後細節，善用筆記模板

---

## 延伸閱讀

- [Lesson 2-2: 變數宣告與 PIC 子句](lesson-2-2-pic-clause.md)
- [Lesson 1-4: Job、Step、Program 關係](lesson-1-4-job-step-program.md)

---

*課程版本: 1.0 | 更新日期: 2026-04-11*
