# Lesson 2-1：COBOL 四大 DIVISION

## 學習目標

- 理解 COBOL 程式的整體結構
- 認識四大 DIVISION 的功能與用途
- 能夠閱讀基本 COBOL 程式架構

---

## COBOL 程式結構概覽

COBOL 程式由四個 DIVISION 組成，每個 DIVISION 有特定功能，**必須按照固定順序撰寫**：

```
IDENTIFICATION DIVISION.    ← 程式識別資訊
ENVIRONMENT DIVISION.       ← 環境與檔案配置
DATA DIVISION.              ← 資料定義
PROCEDURE DIVISION.         ← 程式邏輯
```

> 💡 **BA 小提示**：就像寫一份銀行業務文件，需要先說明「這是什麼文件」、「用哪些系統」、「處理什麼資料」、「具體怎麼做」。

---

## 1. IDENTIFICATION DIVISION（識別部）

**功能**：說明程式的基本資訊，讓別人知道這支程式是做什麼的。

### 範例

```cobol
       IDENTIFICATION DIVISION.
       PROGRAM-ID. ACCTINT.
       AUTHOR. JASON-FAN.
       INSTALLATION. ABC-BANK.
       DATE-WRITTEN. 2026-04-01.
       DATE-COMPILED. 2026-04-04.
      *REMARKS. 計算帳戶利息批次程式.
```

### 欄位說明

| 欄位 | 說明 | 銀行實務重要性 |
|------|------|---------------|
| PROGRAM-ID | 程式名稱（必填） | ⭐⭐⭐ 用於 Job 排程與追蹤 |
| AUTHOR | 作者 | 便於維護追責 |
| INSTALLATION | 所屬單位 | 銀行部門識別 |
| DATE-WRITTEN | 撰寫日期 | 版本管理 |
| DATE-COMPILED | 編譯日期 | 自動產生 |
| REMARKS | 備註說明 | ⭐⭐⭐ BA 理解程式用途的關鍵 |

> 🏦 **銀行實例**：PROGRAM-ID 通常遵循銀行命名規範，如 `ACCTINT`（Account Interest）、`DAILYEO`（Daily End of Day）。

---

## 2. ENVIRONMENT DIVISION（環境部）

**功能**：定義程式執行的環境，以及輸入輸出檔案的對應關係。

### 範例

```cobol
       ENVIRONMENT DIVISION.
       CONFIGURATION SECTION.
       SOURCE-COMPUTER. IBM-390.
       OBJECT-COMPUTER. IBM-390.

       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT ACCT-FILE ASSIGN TO ACCTDATA
               ORGANIZATION IS SEQUENTIAL
               ACCESS MODE IS SEQUENTIAL
               FILE STATUS IS WS-ACCT-STATUS.
           SELECT RPT-FILE ASSIGN TO ACCTRPT
               ORGANIZATION IS SEQUENTIAL.
```

### 重點說明

#### CONFIGURATION SECTION（配置節）
- `SOURCE-COMPUTER`：編譯程式的電腦
- `OBJECT-COMPUTER`：執行程式的電腦
- 現代 Mainframe 通常都寫 IBM-390 或 z/OS

#### INPUT-OUTPUT SECTION（輸入輸出節）
這是 BA 最需要關注的部分：

| 關鍵字 | 說明 |
|--------|------|
| SELECT | 定義檔案的邏輯名稱（程式內使用） |
| ASSIGN TO | 對應的實體檔案名稱（JCL 中定義） |
| ORGANIZATION | 檔案組織方式（SEQUENTIAL、INDEXED、RELATIVE） |
| ACCESS MODE | 存取模式（SEQUENTIAL、RANDOM、DYNAMIC） |
| FILE STATUS | 檔案狀態碼變數（用於錯誤處理） |

> 🏦 **銀行實例**：批次程式通常使用 SEQUENTIAL 組織，線上交易使用 INDEXED（VSAM）。

---

## 3. DATA DIVISION（資料部）

**功能**：定義程式中使用的所有變數、檔案結構、工作區域。

### 範例

```cobol
       DATA DIVISION.
       FILE SECTION.
       FD ACCT-FILE.
       01 ACCT-RECORD.
          05 ACCT-NO           PIC X(10).
          05 ACCT-NAME         PIC X(30).
          05 ACCT-BALANCE      PIC S9(9)V99.
          05 ACCT-TYPE         PIC X(2).

       WORKING-STORAGE SECTION.
       01 WS-WORK-FIELDS.
          05 WS-ACCT-STATUS    PIC XX.
          05 WS-EOF-FLAG       PIC X VALUE 'N'.
             88 EOF-REACHED    VALUE 'Y'.
          05 WS-TOTAL-BALANCE  PIC S9(12)V99 VALUE 0.
          05 WS-INTEREST-AMT   PIC S9(9)V99.

       01 WS-CONSTANTS.
          05 WS-INT-RATE       PIC V99 VALUE 0.02.
```

### 重點說明

FILE SECTION 定義檔案結構，WORKING-STORAGE SECTION 定義工作變數。詳細說明請見 Lesson 2-2 和 2-3。

---

## 4. PROCEDURE DIVISION（程序部）

**功能**：程式的核心邏輯，包含所有執行指令。

### 範例

```cobol
       PROCEDURE DIVISION.
       0000-MAIN.
           PERFORM 1000-INIT
           PERFORM 2000-PROCESS UNTIL EOF-REACHED
           PERFORM 3000-TERM
           STOP RUN.

       1000-INIT.
           OPEN INPUT ACCT-FILE
           OPEN OUTPUT RPT-FILE
           READ ACCT-FILE
               AT END SET EOF-REACHED TO TRUE
           END-READ.

       2000-PROCESS.
           COMPUTE WS-INTEREST-AMT = ACCT-BALANCE * WS-INT-RATE
           ADD WS-INTEREST-AMT TO WS-TOTAL-BALANCE
           WRITE RPT-RECORD FROM ACCT-RECORD
           READ ACCT-FILE
               AT END SET EOF-REACHED TO TRUE
           END-READ.

       3000-TERM.
           CLOSE ACCT-FILE
           CLOSE RPT-FILE.
```

### 程式結構慣例

銀行程式通常遵循以下結構：

| 段落 | 功能 | 編號慣例 |
|------|------|----------|
| MAIN | 主控制邏輯 | 0000 |
| INIT | 初始化（開（開檔、讀第一筆） | 1000 |
| PROCESS | 主要處理邏輯 | 2000 |
| TERM | 結束處理（關檔、輸出統計） | 3000 |

> 💡 **BA 小提示**：看到 `PERFORM` 就像呼叫一個子程序，`STOP RUN` 結束程式。

---

## 完整程式範例

以下是一個計算帳戶利息的完整 COBOL 程式：

```cobol
       IDENTIFICATION DIVISION.
       PROGRAM-ID. ACCTINT.
       AUTHOR. JASON-FAN.
      *REMARKS. 計算帳戶利息批次程式.

       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT ACCT-FILE ASSIGN TO ACCTDATA
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-ACCT-STATUS.

       DATA DIVISION.
       FILE SECTION.
       FD ACCT-FILE.
       01 ACCT-RECORD.
          05 ACCT-NO           PIC X(10).
          05 ACCT-BALANCE      PIC S9(9)V99.

       WORKING-STORAGE SECTION.
       01 WS-FIELDS.
          05 WS-ACCT-STATUS    PIC XX.
          05 WS-EOF            PIC X VALUE 'N'.
             88 END-OF-FILE    VALUE 'Y'.
          05 WS-INT-RATE       PIC V99 VALUE 0.02.
          05 WS-INTEREST       PIC S9(9)V99.

       PROCEDURE DIVISION.
       0000-MAIN.
           OPEN INPUT ACCT-FILE
           READ ACCT-FILE
               AT END SET END-OF-FILE TO TRUE
           END-READ
           PERFORM 2000-CALC UNTIL END-OF-FILE
           CLOSE ACCT-FILE
           STOP RUN.

       2000-CALC.
           COMPUTE WS-INTEREST = ACCT-BALANCE * WS-INT-RATE
           DISPLAY 'ACCT: ' ACCT-NO ' INTEREST: ' WS-INTEREST
           READ ACCT-FILE
               AT END SET END-OF-FILE TO TRUE
           END-READ.
```

---

## BA 實務應用

### 如何快速理解一支 COBOL 程式？

1. **先看 IDENTIFICATION DIVISION**
   - PROGRAM-ID 告訴你程式名稱
   - REMARKS 說明程式用途

2. **再看 ENVIRONMENT DIVISION 的 FILE-CONTROL**
   - 了解這支程式讀什麼檔、寫什麼檔
   - 這是影響分析的起點

3. **然後看 DATA DIVISION**
   - FILE SECTION 了解檔案結構
   - WORKING-STORAGE 了解處理邏輯中的變數

4. **最後看 PROCEDURE DIVISION**
   - 從 MAIN 開始，追蹤 PERFORM 流程
   - 找到關鍵計算邏輯

### 需求分析時的關鍵問題

| 情境 | 需要關注的 DIVISION |
|------|---------------------|
| 新增欄位 | DATA DIVISION（檔案結構要改） |
| 新增輸入檔案 | ENVIRONMENT + DATA + PROCEDURE |
| 修改計算邏輯 | PROCEDURE DIVISION |
| 更改檔案名稱 | ENVIRONMENT DIVISION（或 JCL） |

---

## 練習題

### 題目 1
以下是一支 COBOL 程式的 IDENTIFICATION DIVISION，請回答：
1. 這支程式叫什麼名字？
2. 推測它的功能是什麼？

```cobol
       IDENTIFICATION DIVISION.
       PROGRAM-ID. DAILYEO.
      *REMARKS. 日終批次處理 - 帳戶餘額結轉.
```

### 題目 2
在 ENVIRONMENT DIVISION 中，以下敘述定義了什麼？

```cobol
           SELECT TRANS-FILE ASSIGN TO TRANSDATA
               ORGANIZATION IS SEQUENTIAL.
```

### 題目 3
一支程式需要新增一個輸出報表檔案，需要修改哪些 DIVISION？

---

## 延伸閱讀

- [Lesson 2-2：變數宣告與 PIC 子句](lesson-2-2-pic-clause.md)
- [Lesson 2-3：Level Number 與資料結構](lesson-2-3-level-number.md)

---

## 重點回顧

| DIVISION | 功能 | BA 關注點 |
|----------|------|-----------|
| IDENTIFICATION | 程式識別 | PROGRAM-ID、REMARKS |
| ENVIRONMENT | 環境配置 | FILE-CONTROL（檔案對應） |
| DATA | 資料定義 | 檔案結構、變數定義 |
| PROCEDURE | 程式邏輯 | 處理流程、計算邏輯 |
