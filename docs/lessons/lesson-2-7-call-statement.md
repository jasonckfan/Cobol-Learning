# Lesson 2-7：呼叫外部程式 (CALL)

## 學習目標

- 理解 COBOL 程式間的呼叫機制
- 掌握 CALL 敘述的使用方式
- 認識參數傳遞的方法

---

## 為什麼需要呼叫外部程式？

在銀行系統中：
- **模組化**：將共同邏輯抽取為獨立程式
- **重用性**：同一支程式可被多支程式呼叫
- **維護性**：修改一處，所有呼叫者受惠
- **分工合作**：不同團隊維護不同模組

---

## CALL 敘述基本語法

### 基本語法

```cobol
       CALL '程式名稱'.
```

### 帶參數呼叫

```cobol
       CALL '程式名稱' USING 參數1 參數2 ...
```

### 範例

```cobol
       CALL 'CALCINT' USING ACCT-BALANCE
                           INT-RATE
                           WS-RESULT.
```

---

## 參數傳遞方式

### BY CONTENT（傳值）

傳遞資料的副本，被呼叫程式無法修改原始值。

```cobol
       CALL 'SUBPROG' USING BY CONTENT WS-INPUT-VALUE.
```

### BY REFERENCE（傳址，預設）

傳遞資料的位址，被呼叫程式可以直接修改原始值。

```cobol
       CALL 'SUBPROG' USING BY REFERENCE WS-INPUT-VALUE.
       *> 或簡寫為
       CALL 'SUBPROG' USING WS-INPUT-VALUE.
```

### BY VALUE（傳值，C 語言風格）

```cobol
       CALL 'SUBPROG' USING BY VALUE WS-INPUT-VALUE.
```

---

## 實際範例

### 呼叫方程式（主程式）

```cobol
       IDENTIFICATION DIVISION.
       PROGRAM-ID. MAINPROG.

       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-ACCT-NO        PIC X(16) VALUE '1234567890123456'.
       01 WS-BALANCE        PIC S9(9)V99 VALUE 10000.50.
       01 WS-RATE           PIC V99 VALUE 0.02.
       01 WS-INTEREST       PIC S9(7)V99.
       01 WS-STATUS         PIC X.
          88 CALL-SUCCESS   VALUE 'S'.
          88 CALL-FAILED    VALUE 'F'.

       PROCEDURE DIVISION.
       0000-MAIN.
           DISPLAY 'CALLING SUBPROGRAM...'

           CALL 'CALCINT' USING WS-ACCT-NO
                                WS-BALANCE
                                WS-RATE
                                WS-INTEREST
                                WS-STATUS

           IF CALL-SUCCESS
               DISPLAY 'INTEREST: ' WS-INTEREST
           ELSE
               DISPLAY 'CALCULATION FAILED'
           END-IF

           STOP RUN.
```

### 被呼叫程式（子程式）

```cobol
       IDENTIFICATION DIVISION.
       PROGRAM-ID. CALCINT.

       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-WORK-FIELDS.
          05 WS-CALC-TEMP   PIC S9(11)V99.

       LINKAGE SECTION.
       01 LS-ACCT-NO        PIC X(16).
       01 LS-BALANCE        PIC S9(9)V99.
       01 LS-RATE           PIC V99.
       01 LS-INTEREST       PIC S9(7)V99.
       01 LS-STATUS         PIC X.

       PROCEDURE DIVISION USING LS-ACCT-NO
                                LS-BALANCE
                                LS-RATE
                                LS-INTEREST
                                LS-STATUS.

       0000-MAIN.
           IF LS-BALANCE > 0
               COMPUTE LS-INTEREST = LS-BALANCE * LS-RATE
               MOVE 'S' TO LS-STATUS
           ELSE
               MOVE 0 TO LS-INTEREST
               MOVE 'F' TO LS-STATUS
           END-IF

           GOBACK.                  *> 返回呼叫方
```

---

## LINKAGE SECTION

被呼叫程式需要用 LINKAGE SECTION 接收參數。

### 說明

- LINKAGE SECTION 定義的變數**不佔用記憶體**
- 這些變數對應到呼叫方傳入的參數
- PROCEDURE DIVISION USING 列出接收的參數順序

### 重要規則

1. 呼叫方和被呼叫方的參數順序必須一致
2. 參數的 PIC 格式應該相符
3. 使用 GOBACK 返回（而非 STOP RUN）

---

## GOBACK vs STOP RUN

| 敘述 | 效果 | 適用情境 |
|------|------|----------|
| STOP RUN | 結束整個程式執行 | 主程式結束 |
| GOBACK | 返回呼叫方 | 子程式結束 |
| EXIT PROGRAM | 返回呼叫方（舊語法） | 子程式結束 |

> ⚠️ **注意**：在子程式中使用 STOP RUN 會結束整個程式，包括主程式！

---

## 動態呼叫 vs 靜態呼叫

### 靜態呼叫（編譯時連結）

```cobol
       CALL 'CALCINT' USING ...
```

- 被呼叫程式在編譯時就已連結
- 效能較佳
- 被呼叫程式名稱固定

### 動態呼叫（執行時載入）

```cobol
       MOVE 'CALCINT' TO WS-PROG-NAME.
       CALL WS-PROG-NAME USING ...
```

- 被呼叫程式在執行時才載入
- 較靈活（可根據條件選擇不同程式）
- 效能略低

---

## CANCEL 敘述

釋放動態載入的程式，釋放記憶體。

```cobol
       CALL 'CALCINT' USING ...
       CANCEL 'CALCINT'.            *> 釋放記憶體
```

> 💡 **用途**：當需要多次呼叫同一程式，且每次需要重新初始化時。

---

## 銀行實務範例

### 常見的模組化程式

| 程式類型 | 功能 | 範例程式名 |
|----------|------|------------|
| 利率計算 | 根據帳戶類型計算利率 | CALCRATE |
| 利息計算 | 計算利息金額 | CALCINT |
| 日期處理 | 日期轉換、計算 | DATEUTIL |
| 餘額檢查 | 檢查可用餘額 | CHKBAL |
| 交易驗證 | 驗證交易有效性 | VALTRX |
| 日誌記錄 | 寫入交易日誌 | LOGTRX |
| 錯誤處理 | 統一錯誤處理 | ERRHDL |

### 日終批次處理範例

```cobol
       PROCEDURE DIVISION.
       0000-MAIN.
           PERFORM 1000-INIT

           *> 呼叫日期處理模組
           CALL 'DATEUTIL' USING WS-TODAY-DATE
                                 WS-BUSINESS-DATE
                                 WS-STATUS

           *> 呼叫利率計算模組
           CALL 'CALCRATE' USING ACCT-TYPE
                                 ACCT-BALANCE
                                 WS-INT-RATE
                                 WS-STATUS

           *> 呼叫利息計算模組
           CALL 'CALCINT' USING ACCT-BALANCE
                                WS-INT-RATE
                                WS-INTEREST
                                WS-STATUS

           *> 呼叫日誌記錄模組
           CALL 'LOGTRX' USING ACCT-NO
                               WS-INTEREST
                               'INTEREST POST'
                               WS-STATUS

           PERFORM 9000-TERM
           STOP RUN.
```

---

## 參數傳遞最佳實務

### 1. 使用群組項目

```cobol
       *> 定義參數結構
       01 CALL-PARAMS.
          05 CP-ACCT-NO       PIC X(16).
          05 CP-AMOUNT        PIC S9(11)V99.
          05 CP-STATUS        PIC X.

       *> 呼叫時傳遞整個群組
       CALL 'SUBPROG' USING CALL-PARAMS.
```

### 2. 使用 COPYBOOK 定義參數

```cobol
       *> 兩支程式都使用相同的 COPYBOOK
       COPY CALLPARM.

       *> 確保參數結構一致
```

### 3. 傳遞狀態碼

```cobol
       *> 總是傳遞狀態碼，讓呼叫方知道執行結果
       01 WS-CALL-STATUS     PIC X.
          88 CALL-OK         VALUE '0'.
          88 CALL-ERROR      VALUE '1' THRU '9'.
```

---

## BA 實務應用

### 如何分析模組化程式？

1. **識別 CALL 敘述**：找出所有被呼叫的程式
2. **追蹤參數**：理解傳入傳出的資料
3. **理解依賴關係**：哪些程式依賴哪些模組

### 影響分析範例

**情境：CALCINT 程式需要新增參數**

1. **找出所有呼叫 CALCINT 的程式**
2. **評估需要修改的呼叫方**
3. **規劃變更順序**：
   - 先修改子程式（增加參數，保持向後相容）
   - 再逐一更新呼叫方

### 需求訪談時的問題

| 看到的 CALL | 可以問的問題 |
|-------------|-------------|
| CALL 'CALCINT' | 「這個利息計算邏輯是共用的嗎？」 |
| 多個參數 | 「這些參數的意義是什麼？」 |
| BY CONTENT | 「為什麼用傳值而非傳址？」 |

---

## 常見錯誤

### 錯誤 1：參數順序錯誤

```cobol
       *> 呼叫方
       CALL 'CALCINT' USING WS-BALANCE WS-RATE.

       *> 被呼叫方
       PROCEDURE DIVISION USING LS-RATE LS-BALANCE.
       *> 順序相反！會導致錯誤結果
```

### 錯誤 2：PIC 格式不符

```cobol
       *> 呼叫方
       01 WS-AMOUNT     PIC 9(9)V99.

       *> 被呼叫方
       01 LS-AMOUNT     PIC S9(9)V99.   *> 缺少正負號
```

### 錯誤 3：子程式使用 STOP RUN

```cobol
       *> 錯誤：子程式使用 STOP RUN 會結束整個程式
       PROCEDURE DIVISION USING ...
       0000-MAIN.
           ...
           STOP RUN.     *> 應該用 GOBACK
```

---

## 練習題

### 題目 1
說明以下兩種參數傳遞方式的差異：

```cobol
       CALL 'SUBPROG' USING BY CONTENT WS-VALUE.
       CALL 'SUBPROG' USING BY REFERENCE WS-VALUE.
```

### 題目 2
設計一個客戶驗證程式的呼叫介面：
- 傳入：客戶編號
- 傳出：驗證結果、客戶姓名、客戶狀態

### 題目 3
為什麼子程式應該使用 GOBACK 而非 STOP RUN？

---

## 重點回顧

| 概念 | 說明 |
|------|------|
| CALL | 呼叫外部程式 |
| USING | 傳遞參數 |
| BY CONTENT | 傳值（副本） |
| BY REFERENCE | 傳址（預設） |
| LINKAGE SECTION | 子程式接收參數的定義區 |
| GOBACK | 子程式返回呼叫方 |

---

## 延伸閱讀

- [Lesson 2-8：錯誤處理與檔案狀態碼](lesson-2-8-error-handling.md)
- [Lesson 3-1：Sequential File 與 VSAM File](lesson-3-1-file-types.md)
