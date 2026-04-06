# Lesson 2-6：COPYBOOK 與程式碼複用

## 學習目標

- 理解 COPYBOOK 的概念與用途
- 掌握 COPY 敘述的使用方式
- 認識銀行常用的標準 COPYBOOK

---

## 為什麼需要 COPYBOOK？

在銀行系統中：
- 同一個檔案結構可能被數十支程式使用
- 帳戶主檔的定義如果改變，需要更新所有相關程式
- 統一的資料定義可以避免錯誤

COPYBOOK 就是為了**程式碼複用**和**標準化**而設計的。

---

## COPY 敘述

### 基本語法

```cobol
       COPY copybook名稱.
```

### 範例

```cobol
       DATA DIVISION.
       FILE SECTION.

       COPY ACCTREC.              *> 複製帳戶記錄結構

       WORKING-STORAGE SECTION.

       COPY WSACCT.               *> 複製工作變數定義
       COPY WSERROR.              *> 複製錯誤處理變數
```

---

## COPYBOOK 檔案

COPYBOOK 是獨立的原始碼檔案，通常存放在指定的程式庫（PDS Library）中。

### 範例：ACCTREC.cpy

```cobol
      *=======================================================
      * COPYBOOK: ACCTREC
      * 用途:    帳戶主檔記錄結構
      * 作者:    SYSTEM TEAM
      * 更新日期: 2026-01-15
      *=======================================================
       01 ACCT-RECORD.
          05 ACCT-NO           PIC X(16).
          05 ACCT-TYPE         PIC XX.
          05 ACCT-NAME         PIC X(40).
          05 ACCT-STATUS       PIC X.
             88 ACCT-ACTIVE    VALUE 'A'.
             88 ACCT-DORMANT   VALUE 'D'.
             88 ACCT-CLOSED    VALUE 'C'.
          05 OPEN-DATE         PIC 9(8).
          05 CURR-CODE         PIC XXX.
          05 ACCT-BALANCE      PIC S9(11)V99 COMP-3.
          05 HOLD-AMT          PIC S9(9)V99 COMP-3.
          05 AVAIL-BAL         PIC S9(11)V99 COMP-3.
          05 INT-RATE          PIC V9(6) COMP-3.
          05 LAST-TRX-DATE     PIC 9(8).
          05 FILLER            PIC X(20).
```

---

## COPYBOOK 的優點

| 優點 | 說明 |
|------|------|
| **標準化** | 所有程式使用相同的資料定義 |
| **維護性** | 修改一處，所有程式自動更新 |
| **可讀性** | 主程式更簡潔，結構更清晰 |
| **一致性** | 避免不同程式定義不一致的問題 |

---

## REPLACING 選項

當需要複製 COPYBOOK 但修改某些名稱時使用。

### 語法

```cobol
       COPY copybook名稱 REPLACING ==原名== BY ==新名==.
```

### 範例

```cobol
       COPY ACCTREC REPLACING ==ACCT-== BY ==SRC-ACCT-==.

       *> 結果：所有 ACCT- 前綴變成 SRC-ACCT-
       *> SRC-ACCT-NO, SRC-ACCT-TYPE, ...
```

### 實際應用

當同一支程式需要兩份相同結構但不同名稱的記錄：

```cobol
       DATA DIVISION.
       WORKING-STORAGE SECTION.

       COPY ACCTREC.                          *> 原始記錄
       COPY ACCTREC REPLACING ==ACCT-== BY ==OLD-==.
                                              *> 舊值記錄（OLD-ACCT-NO...）

       *> 可以比較新舊值
       IF ACCT-BALANCE NOT = OLD-ACCT-BALANCE
           PERFORM LOG-BALANCE-CHANGE
       END-IF.
```

---

## 銀行常用 COPYBOOK 類型

### 1. 檔案記錄結構

```cobol
      * 帳戶主檔
       COPY ACCTMSTR.

      * 交易明細檔
       COPY TRANSREC.

      * 客戶主檔
       COPY CUSTMSTR.
```

### 2. 工作變數定義

```cobol
      * 通用工作變數
       COPY WSCOMMON.

      * 日期時間變數
       COPY WSDATE.

      * 錯誤處理變數
       COPY WSERROR.
```

### 3. 報表格式

```cobol
      * 報表標題
       COPY RPTHEAD.

      * 報表明細行
       COPY RPTDTL.

      * 報表統計行
       COPY RPTFOOT.
```

### 4. 訊息與代碼

```cobol
      * 錯誤訊息定義
       COPY MSGERROR.

      * 系統代碼對照
       COPY CODETABLE.
```

---

## 實際銀行範例

### 完整程式使用 COPYBOOK

```cobol
       IDENTIFICATION DIVISION.
       PROGRAM-ID. DAILYINT.

       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT ACCT-FILE ASSIGN TO ACCTDATA
               ORGANIZATION IS SEQUENTIAL.
           SELECT RPT-FILE ASSIGN TO INTRPT
               ORGANIZATION IS SEQUENTIAL.

       DATA DIVISION.
       FILE SECTION.
       FD ACCT-FILE.
       COPY ACCTMSTR.                    *> 帳戶記錄結構

       FD RPT-FILE.
       COPY RPTINTDT.                   *> 報表明細結構

       WORKING-STORAGE SECTION.
       COPY WSCOMMON.                   *> 通用變數
       COPY WSDATE.                     *> 日期變數
       COPY WSERROR.                    *> 錯誤變數

       01 WS-SPECIFIC-FIELDS.           *> 程式專用變數
          05 WS-TOTAL-INT    PIC S9(13)V99 COMP-3 VALUE 0.
          05 WS-PROC-CNT     PIC 9(8) COMP VALUE 0.

       PROCEDURE DIVISION.
       0000-MAIN.
           PERFORM 1000-INIT
           PERFORM 2000-PROCESS UNTIL EOF-REACHED
           PERFORM 3000-TERM
           STOP RUN.
```

---

## COPYBOOK 管理最佳實務

### 命名規範

| 類型 | 命名規範 | 範例 |
|------|----------|------|
| 檔案記錄 | 實體名稱 + REC | ACCTREC, TRANSREC |
| 主檔記錄 | 實體名稱 + MSTR | ACCTMSTR, CUSTMSTR |
| 工作變數 | WS + 功能 | WSCOMMON, WSDATE |
| 報表結構 | RPT + 功能 | RPTHEAD, RPTDTL |

### 版本控制

```
COPYBOOK 程式庫結構：
PROD.COPYLIB        <- 生產版本
TEST.COPYLIB        <- 測試版本
DEV.COPYLIB         <- 開發版本
```

### 變更管理

1. **變更申請**：提出 COPYBOOK 變更需求
2. **影響分析**：評估所有使用該 COPYBOOK 的程式
3. **變更實施**：更新 COPYBOOK
4. **程式重編**：重新編譯所有相關程式
5. **整合測試**：確保變更不會造成問題

---

## BA 實務應用

### 如何識別 COPYBOOK 的影響？

1. **查看程式碼中的 COPY 敘述**
2. **查詢 COPYBOOK 內容**
3. **找出所有使用該 COPYBOOK 的程式**

### 影響分析範例

**情境：帳戶主檔新增「手機號號碼」欄位**

1. **修改 COPYBOOK**：
   - 更新 ACCTMSTR.cpy，新增 ACCT-MOBILE 欄位

2. **影響範圍**：
   - 所有使用 `COPY ACCTMSTR` 的程式
   - 檔案長度改變
   - 相關報表格式

3. **所需動作**：
   - 重新編譯所有相關程式
   - 修改報表 COPYBOOK
   - 安排檔案轉換

### 需求訪談時的問題

| 看到的 COPYBOOK | 可以問的問題 |
|-----------------|-------------|
| ACCTMSTR | 「這個帳戶結構多少程式在用？」 |
| WSCOMMON | 「這些通用變數有標準用途嗎？」 |
| 多個 COPY | 「這些 COPYBOOK 之間有依賴關係嗎？」 |

---

## 常見問題

### 問題 1：COPYBOOK 找不到

```
IGYDS1082-E  "ACCTREC" was not found in the library.
```

**解決**：確認 COPYBOOK 所在的程式庫路徑是否正確。

### 問題 2：名稱衝突

```cobol
       COPY ACCTREC.           *> 定義了 ACCT-NO
       COPY TRANSREC.          *> 也定義了 ACCT-NO

       *> 重複定義錯誤！
```

**解決**：使用 REPLACING 更名。

### 問題 3：COPYBOOK 版本不一致

**解決**：確保開發、測試、生產環境使用相同的 COPYBOOK 版本。

---

## 練習題

### 題目 1
以下 COPY 敘述會產生什麼效果？

```cobol
       COPY ACCTREC REPLACING ==ACCT-== BY ==NEW-==.
```

### 題目 2
為什麼銀行系統偏好使用 COPYBOOK 而非直接在程式中定義資料結構？

### 題目 3
設計一個客戶主檔的 COPYBOOK（CUSTMSTR.cpy），包含：
- 客戶編號
- 客戶姓名
- 身分證字號
- 出生日期
- 聯絡電話
- 地址

---

## 重點回顧

| 概念 | 說明 |
|------|------|
| COPY 敘述 | 將 COPYBOOK 內容插入程式 |
| COPYBOOK | 可重複使用的程式碼片段 |
| REPLACING | 複製時替換名稱 |
| 標準化 | 所有程式使用一致的資料定義 |

---

## 延伸閱讀

- [Lesson 2-7：呼叫外部程式 (CALL)](lesson-2-7-call-statement.md)
- [Lesson 3-1：Sequential File 與 VSAM File](lesson-3-1-file-types.md)
