# Lesson 2-3：Level Number 與資料結構

## 學習目標

- 理解 Level Number 的階層概念
- 能夠解讀 COBOL 的資料結構定義
- 掌握群組項目與基本項目的關係

---

## 為什麼需要 Level Number？

銀行資料通常是**結構化**的：
- 一筆帳戶記錄包含多個欄位
- 一個交易記錄由多個子欄位組成
- 可能有多層嵌套結構

Level Number 就是用來定義這種**階層關係**的。

---

## Level Number 概念

### 基本規則

| Level Number | 用途 | 說明 |
|--------------|------|------|
| 01 | 記錄層級 | 一筆完整的資料記錄 |
| 02 ~ 49 | 子欄位 | 可多層嵌套，數字越小層級越高 |
| 66 | RENAME | 重新命名欄位（少用） |
| 77 | 獨立項目 | 不屬於任何群組的單一變數 |
| 88 | 條件名稱 | 定義條件值（用於判斷） |

### 階層關係示意

```
01 記錄（根）
  ├── 05 群組項目
  │     ├── 10 子欄位 A
  │     └── 10 子欄位 B
  └── 05 群組項目
        ├── 10 子欄位 C
        └── 10 子欄位 D
```

---

## 基本範例

### 帳戶記錄結構

```cobol
       01 ACCT-RECORD.                        *> 記錄層級
          05 ACCT-NO           PIC X(10).     *> 帳號
          05 ACCT-NAME         PIC X(30).     *> 戶名
          05 ACCT-BALANCE      PIC S9(9)V99.  *> 餘額
          05 ACCT-TYPE         PIC XX.        *> 帳戶類型
```

> 💡 **重要**：01 層後面的句點（.）表示這個記錄的開始，下層欄位縮排對齊。

---

## 群組項目（Group Item）

群組項目**沒有 PIC 子句**，它只是用來組織下層欄位。

### 範例：多層結構

```cobol
       01 CUSTOMER-RECORD.
          05 CUST-ID           PIC 9(8).      *> 客戶編號

          05 CUST-NAME.                       *> 群組項目（姓名群組）
             10 CUST-LAST-NAME  PIC X(20).    *> 姓
             10 CUST-FIRST-NAME PIC X(20).    *> 名

          05 CUST-ADDRESS.                    *> 群組項目（地址群組）
             10 ADDR-STREET     PIC X(40).    *> 街道
             10 ADDR-DISTRICT   PIC X(20).    *> 區域
             10 ADDR-CITY       PIC X(20).    *> 城市
             10 ADDR-COUNTRY    PIC X(20).    *> 國家
             10 ADDR-POSTCODE   PIC X(8).     *> 郵遞區號

          05 CUST-CONTACT.                    *> 群組項目（聯絡資訊群組）
             10 PHONE-HOME      PIC X(15).    *> 家用電話
             10 PHONE-MOBILE    PIC X(15).    *> 手機
             10 EMAIL           PIC X(50).    *> 電郵
```

### 群組項目的用途

1. **邏輯組織**：將相關欄位歸類
2. **批量處理**：可以一次搬移整個群組
   ```cobol
   MOVE CUST-ADDRESS TO WS-ADDRESS
   ```
3. **層次清晰**：方便理解資料結構

---

## 實際銀行程式範例

### 交易明細記錄

```cobol
       01 TRANS-RECORD.
          05 TRANS-HEADER.                    *> 交易標頭
             10 TRANS-DATE      PIC 9(8).     *> 交易日期
             10 TRANS-TIME      PIC 9(6).     *> 交易時間
             10 TRANS-TYPE      PIC XX.       *> 交易類型
             10 TRANS-SEQ       PIC 9(6).     *> 交易序號

          05 TRANS-ACCOUNT.                   *> 帳戶資訊
             10 FROM-ACCT       PIC X(16).    *> 轉出帳號
             10 TO-ACCT         PIC X(16).    *> 轉入帳號
             10 ACCT-TYPE       PIC XX.       *> 帳戶類型

          05 TRANS-AMOUNT.                    *> 金額資訊
             10 TRANS-AMT       PIC S9(11)V99.  *> 交易金額
             10 FEE-AMT         PIC S9(5)V99.   *> 手續費
             10 TAX-AMT         PIC S9(5)V99.   *> 稅費
             10 NET-AMT         PIC S9(11)V99.  *> 淨額

          05 TRANS-REFERENCE.                 *> 參考資訊
             10 REF-NO          PIC X(20).    *> 參考編號
             10 REMARK          PIC X(50).    *> 備註
             10 AUTH-CODE       PIC X(6).     *> 授權碼
```

### 日終批次處理統計

```cobol
       01 DAILY-STATS.
          05 STATS-DATE        PIC 9(8).      *> 統計日期

          05 STATS-ACCOUNT.                   *> 帳戶統計
             10 TOTAL-ACCTS     PIC 9(8).     *> 總帳戶數
             10 NEW-ACCTS       PIC 9(5).     *> 新開戶數
             10 CLOSED-ACCTS    PIC 9(5).     *> 銷戶數

          05 STATS-TRANS.                     *> 交易統計
             10 TOTAL-TRANS     PIC 9(10).    *> 總交易筆數
             10 DEPOSIT-CNT     PIC 9(8).     *> 存款筆數
             10 WITHDRAW-CNT    PIC 9(8).     *> 提款筆數
             10 TRANSFER-CNT    PIC 9(8).     *> 轉帳筆數

          05 STATS-AMOUNT.                    *> 金額統計
             10 TOTAL-AMT       PIC S9(13)V99. *> 總金額
             10 DEPOSIT-AMT     PIC S9(13)V99. *> 存款金額
             10 WITHDRAW-AMT    PIC S9(13)V99. *> 提款金額
             10 TRANSFER-AMT    PIC S9(13)V99. *> 轉帳金額
```

---

## Level 77：獨立項目

不屬於任何群組的單一變數，用於臨時運算或旗標。

```cobol
       77 WS-EOF-FLAG         PIC X VALUE 'N'.
       77 WS-RECORD-COUNT     PIC 9(8) VALUE 0.
       77 WS-TOTAL-AMT        PIC S9(13)V99 VALUE 0.
       77 WS-FILE-STATUS      PIC XX.
```

> 💡 **慣例**：通常放在 WORKING-STORAGE SECTION 的最前面或最後面。

---

## Level 88：條件名稱

用於定義變數的特定值，讓程式更易讀。

### 基本語法

```cobol
       01 變數名稱 PIC 格式.
          88 條件名稱 VALUE 值.
```

### 範例

```cobol
       01 ACCT-STATUS         PIC X.
          88 STATUS-ACTIVE    VALUE 'A'.
          88 STATUS-DORMANT   VALUE 'D'.
          88 STATUS-CLOSED    VALUE 'C'.
          88 STATUS-SUSPENDED VALUE 'S'.

       01 WS-EOF-FLAG         PIC X.
          88 EOF-REACHED      VALUE 'Y'.
          88 NOT-EOF          VALUE 'N'.

       01 TRANS-TYPE          PIC XX.
          88 TYPE-DEPOSIT     VALUE 'DP'.
          88 TYPE-WITHDRAW    VALUE 'WD'.
          88 TYPE-TRANSFER    VALUE 'TF'.
          88 TYPE-PAYMENT     VALUE 'PY'.
```

### 使用方式

```cobol
       IF STATUS-ACTIVE
           DISPLAY '帳戶正常'
       END-IF.

       IF EOF-REACHED
           STOP RUN
       END-IF.

       EVALUATE TRUE
           WHEN TYPE-DEPOSIT
               PERFORM PROCESS-DEPOSIT
           WHEN TYPE-WITHDRAW
               PERFORM PROCESS-WITHDRAW
           WHEN TYPE-TRANSFER
               PERFORM PROCESS-TRANSFER
       END-EVALUATE.
```

> 💡 **BA 小提示**：Level 88 讓程式更易讀，看到 `IF STATUS-ACTIVE` 比看到 `IF ACCT-STATUS = 'A'` 更容易理解。

---

## 多個 Level 88 對應多個值

```cobol
       01 ACCT-TYPE           PIC XX.
          88 TYPE-SAVINGS     VALUE 'SA'.
          88 TYPE-CURRENT     VALUE 'CA'.
          88 TYPE-FIXED       VALUE 'FD'.
          88 TYPE-LOAN        VALUE 'LN'.
          88 TYPE-INVESTMENT  VALUE 'IV'.

       *> 一個 88 對應多個值
       01 TRANS-STATUS        PIC X.
          88 STATUS-SUCCESS   VALUE 'S' 'C'.
          88 STATUS-FAIL      VALUE 'F' 'E' 'R'.
```

---

## FILLER：保留欄位

用於保留空間或忽略不需要的欄位。

```cobol
       01 ACCT-RECORD.
          05 ACCT-NO           PIC X(16).
          05 FILLER            PIC X(4).      *> 保留 4 碼
          05 ACCT-NAME         PIC X(30).
          05 FILLER            PIC X(10).     *> 未使用欄位
          05 ACCT-BALANCE      PIC S9(11)V99.
```

> 🏦 **銀行實務**：FILLER 常用於對齊檔案格式，或預留欄位供未來擴充。

---

## BA 實務應用

### 如何閱讀複雜的資料結構？

1. **從 01 開始**：識別這是什麼記錄
2. **看群組項目**：了解欄位的邏輯分組
3. **追蹤縮排**：理解階層關係
4. **找 PIC 子句**：確定實際欄位大小

### 影響分析範例

**情境：需要新增「客戶手機號碼」到帳戶記錄**

```cobol
       01 ACCT-RECORD.
          05 ACCT-NO           PIC X(16).
          05 ACCT-NAME         PIC X(30).
          05 ACCT-BALANCE      PIC S9(11)V99.
          05 ACCT-TYPE         PIC XX.
          *> 新增：客戶手機
          05 ACCT-MOBILE       PIC X(15).    *> 新欄位
```

**影響分析**：
1. 檔案記錄長度增加 15 bytes
2. 相關程式都需要新增此欄位定義
3. 報表格式可能需要調整
4. 歷史資料需要轉換

### 需求訪談時的問題

| 看到的結構 | 可以問的問題 |
|------------|-------------|
| 群組項目 | 「這些欄位是一起處理的嗎？」 |
| Level 88 | 「有哪些可能的值？各有什麼意義？」 |
| FILLER | 「這些保留空間有計劃用途嗎？」 |
| PIC 長度 | 「欄位長度是否足夠未來擴充？」 |

---

## 練習題

### 題目 1
請說明以下結構中各層級的關係：

```cobol
       01 ORDER-RECORD.
          05 ORDER-HEADER.
             10 ORDER-NO       PIC 9(8).
             10 ORDER-DATE     PIC 9(8).
          05 ORDER-ITEMS.
             10 ITEM-CODE      PIC X(10).
             10 ITEM-QTY       PIC 9(5).
             10 ITEM-PRICE     PIC 9(7)V99.
```

### 題目 2
請為以下情境設計資料結構：

一筆「貸款還款記錄」包含：
- 還款編號（8 碼）
- 貸款帳號（16 碼）
- 還款日期（8 碼）
- 還款金額（本金、利息、罰息）
- 還款狀態（正常、逾期、部分還款）

### 題目 3
以下 Level 88 定義有什麼問題？

```cobol
       01 ACCT-STATUS         PIC X.
          88 STATUS-ACTIVE    VALUE 'A'.
          88 STATUS-ACTIVE    VALUE 'B'.
```

---

## 重點回顧

| Level | 用途 | 特點 |
|-------|------|------|
| 01 | 記錄層級 | 每筆資料的根節點 |
| 02-49 | 子欄位 | 數字越小層級越高 |
| 77 | 獨立項目 | 單一變數，不屬於群組 |
| 88 | 條件名稱 | 定義特定值，增加可讀性 |
| FILLER | 保留欄位 | 匿名名欄位，佔位用 |

---

## 延伸閱讀

- [Lesson 2-4：COMP、COMP-3、Packed Decimal](lesson-2-4-comp-usage.md)
- [Lesson 2-5：流程控制：IF、EVALUATE、PERFORM](lesson-2-5-flow-control.md)
