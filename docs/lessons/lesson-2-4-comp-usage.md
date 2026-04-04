# Lesson 2-4：COMP、COMP-3、Packed Decimal

## 學習目標

- 理解 COBOL 數值儲存方式
- 認識 COMP、COMP-3 的差異與用途
- 能夠判斷銀行程式中數值欄位的儲存格式

---

## 為什麼需要不同的數值儲存方式？

在銀行系統中：
- **節省儲存空間**：數百萬筆記錄，每個 byte 都重要
- **提升運算效率**：不同格式適合不同運算
- **系統相容性**：與其他系統交換資料時需要統一格式

---

## USAGE 子句

USAGE 子句定義資料的**內部儲存格式**。

### 基本語法

```cobol
       01 變數名稱 PIC 格式 USAGE 儲存方式.
```

簡寫為：

```cobol
       01 變數名稱 PIC 格式 COMP.        *> USAGE 可省略
       01 變數名稱 PIC 格式 COMP-3.
```

---

## 三種主要儲存方式

### 1. DISPLAY（預設）

**特點**：每個數字用 1 byte 儲存，可讀的 EBCDIC 碼

```cobol
       01 WS-AMT             PIC 9(5).           *> DISPLAY（預設）
```

| 數值 | 儲存內容 | 佔用空間 |
|------|----------|----------|
| 12345 | '12345' (EBCDIC) | 5 bytes |

> 💡 **用途**：需要顯示或印報表的欄位、交換檔案格式

---

### 2. COMP（Binary / 二進制）

**特點**：純二進制儲存，運算效率最高

```cobol
       01 WS-COUNT           PIC 9(5) COMP.
       01 WS-INDEX           PIC S9(4) COMP.
```

| PIC 格式 | 佔用空間 | 數值範圍 |
|----------|----------|----------|
| 1 - 4 digits | 2 bytes (halfword) | -32,768 到 32,767 |
| 5 - 9 digits | 4 bytes (fullword) | 約 ±2 billion |
| 10 - 18 digits | 8 bytes (doubleword) | 約 ±9 × 10^18 |

### 範例

```cobol
       01 WS-SMALL-CNT       PIC 9(4) COMP.      *> 2 bytes
       01 WS-MED-CNT         PIC 9(7) COMP.      *> 4 bytes
       01 WS-LARGE-CNT       PIC 9(12) COMP.     *> 8 bytes
```

> 💡 **用途**：計數器、索引、運算中間值

---

### 3. COMP-3（Packed Decimal）

**特點**：壓縮十進制，每 2 個數字存成 1 byte（最後半 byte 存正負號）

```cobol
       01 WS-AMOUNT          PIC S9(7)V99 COMP-3.
```

#### 壓縮原理

| 原始數值 | PIC | 壓縮前 | 壓縮後 |
|----------|-----|--------|--------|
| 12345 | 9(5) | 5 bytes | 3 bytes |
| -12345 | S9(5) | 5 bytes | 3 bytes |
| 12345.67 | S9(5)V99 | 7 bytes | 4 bytes |

#### 壓縮格式示意

```
數值: +12345

DISPLAY (未壓縮):  F1 F2 F3 F4 F5  (5 bytes，EBCDIC)
COMP-3 (壓縮):     12 34 5C        (3 bytes，C = 正號)

數值: -12345.67

DISPLAY (未壓縮):  F1 F2 F3 F4 F5 6F 7F  (7 bytes)
COMP-3 (壓縮):     01 23 45 67 6D         (5 bytes，D = 負號)
```

> 💡 **用途**：銀行金額欄位、資料庫欄位、檔案儲存

---

## 比較總覽

| 儲存方式 | 空間效率 | 運算效率 | 可讀性 | 典型用途 |
|----------|----------|----------|--------|----------|
| DISPLAY | 低 | 低 | 高 | 報表、顯示、檔案交換 |
| COMP | 高 | 最高 | 低 | 計數器、索引、運算 |
| COMP-3 | 中 | 高 | 低 | 金額、資料儲存 |

---

## 銀行實務範例

### 帳戶主檔資料結構

```cobol
       01 ACCT-MASTER.
          *> 顯示用欄位 - DISPLAY
          05 ACCT-NO           PIC X(16).           *> 帳號（文字）
          05 ACCT-NAME         PIC X(40).           *> 戶名

          *> 金額欄位 - COMP-3（節省空間）
          05 ACCT-BALANCE      PIC S9(11)V99 COMP-3. *> 餘額
          05 HOLD-AMT          PIC S9(9)V99 COMP-3.  *> 凍結金額
          05 AVAIL-BAL         PIC S9(11)V99 COMP-3. *> 可用餘額

          *> 計數用欄位 - COMP（運算效率）
          05 TRANS-COUNT       PIC 9(8) COMP.        *> 交易筆數

          *> 狀態欄位 - DISPLAY
          05 ACCT-STATUS       PIC X.                *> 狀態
          05 LAST-UPD-DATE     PIC 9(8).             *> 最後更新日期
```

### 計算統計用變數

```cobol
       WORKING-STORAGE SECTION.
       *> 計數器 - COMP（運算快）
       01 WS-RECORD-COUNT     PIC 9(8) COMP VALUE 0.
       01 WS-ERROR-COUNT      PIC 9(5) COMP VALUE 0.
       01 WS-INDEX            PIC S9(4) COMP.

       *> 累計金額 - COMP-3（精確計算）
       01 WS-TOTAL-AMT        PIC S9(13)V99 COMP-3 VALUE 0.
       01 WS-INTEREST-AMT     PIC S9(9)V99 COMP-3.

       *> 暫存顯示 - DISPLAY
       01 WS-DISPLAY-AMT      PIC $$$,$$$,$$9.99.
```

---

## COMP-3 詳細解析

### 正負號表示

| 符號 | 值 | 說明 |
|------|-----|------|
| C | 1100 | 正數（Positive） |
| D | 1101 | 負數（Negative） |
| F | 1111 | 無號正數（Unsigned） |

### 計算 COMP-3 長度

公式：`⌈(digits + 1) / 2⌉`

| PIC 格式 | digits | 儲存空間 |
|----------|--------|----------|
| S9(5) COMP-3 | 5 | ⌈(5+1)/2⌉ = 3 bytes |
| S9(7)V99 COMP-3 | 9 | ⌈(9+1)/2⌉ = 5 bytes |
| S9(11)V99 COMP-3 | 13 | ⌈(13+1)/2⌉ = 7 bytes |

---

## 其他 USAGE 格式

### COMP-1（單精度浮點）

```cobol
       01 WS-FLOAT           COMP-1.     *> 4 bytes 浮點數
```

> 少用於銀行系統（浮點數有精度問題）

### COMP-2（雙精度浮點）

```cobol
       01 WS-DOUBLE          COMP-2.     *> 8 bytes 浮點數
```

> 同樣少用，銀行偏好定點數（COMP-3）

### COMP-5（Native Binary）

```cobol
       01 WS-NATIVE          PIC S9(9) COMP-5.  *> 原生二進制
```

> 與 COMP 類似，但保證使用原生二進制格式

---

## 資料交換注意事項

### 不同系統之間

| 傳輸方向 | 建議格式 |
|----------|----------|
| Mainframe ↔ Mainframe | COMP-3 可直接傳輸 |
| Mainframe → 報表/顯示 | 轉換為 DISPLAY |
| Mainframe → 開放系統 | 轉換為文字格式 |
| 開放系統 → Mainframe | 文字格式再轉換 |

### 範例：COMP-3 轉 DISPLAY

```cobol
       01 WS-AMT-COMP        PIC S9(7)V99 COMP-3.
       01 WS-AMT-DISP        PIC -(6)9.99.

       MOVE WS-AMT-COMP TO WS-AMT-DISP.  *> 自動轉換
```

---

## BA 實務應用

### 如何判斷欄位的 USAGE？

| 情境 | 判斷方式 |
|------|----------|
| 看到 COMP | 效率優先的計數或索引 |
| 看到 COMP-3 | 精確計算的金額欄位 |
| 沒有 USAGE | DISPLAY，用於顯示或交換 |
| 檔案長度計算 | COMP 按固定 bytes，COMP-3 按公式 |

### 影響分析範例

**情境：金額欄位長度擴充**

```cobol
       *> 原本
       05 ACCT-BALANCE      PIC S9(9)V99 COMP-3.   *> 6 bytes

       *> 擴充後
       05 ACCT-BALANCE      PIC S9(11)V99 COMP-3.  *> 7 bytes
```

**影響**：
1. 每筆記錄增加 1 byte
2. 檔案大小增加（百萬筆 × 1 byte = 1 MB）
3. 相關程式需重新編譯
4. 歷史資料需轉換

### 需求訪談時的問題

| 看到的定義 | 可以問的問題 |
|------------|-------------|
| COMP-3 金額 | 「最大金額預期是多少？現有長度夠用嗎？」 |
| COMP 計數器 | 「預期最大筆數？會不會溢位？」 |
| DISPLAY 數值 | 「這個欄位會不會參與大量運算？」 |

---

## 常見錯誤

### 錯誤 1：忽略 COMP-3 的長度計算

```cobol
       *> 錯誤理解：以為 S9(7)V99 COMP-3 佔 9 bytes
       *> 正確：佔 5 bytes ⌈(9+1)/2⌉
```

### 錯誤 2：COMP 用於小數

```cobol
       *> 不建議：COMP 通常用於整數
       01 WS-AMT            PIC S9(5)V99 COMP.

       *> 建議：小數用 COMP-3
       01 WS-AMT            PIC S9(5)V99 COMP-3.
```

### 錯誤 3：忽略正負號

```cobol
       *> 如果餘額可能為負（透支），必須加 S
       01 ACCT-BALANCE      PIC S9(11)V99 COMP-3.  *> 正確

       *> 忘記加 S，負數會出問題
       01 ACCT-BALANCE      PIC 9(11)V99 COMP-3.   *> 錯誤
```

---

## 練習題

### 題目 1
計算以下欄位的儲存空間：
1. `PIC 9(5) COMP`
2. `PIC S9(7)V99 COMP-3`
3. `PIC 9(3)`
4. `PIC S9(11)V99 COMP-3`

### 題目 2
以下情境應該用哪種 USAGE？
1. 報表上要顯示的金額
2. 程式內部的迴圈計數器
3. 存在檔案中的帳戶餘額
4. 索引陣列的位置變數

### 題目 3
一支程式處理 1000 萬筆帳戶記錄，每筆有 5 個金額欄位。
如果從 DISPLAY 改為 COMP-3，可以節省多少儲存空間？
（假設每個金額欄位原本是 PIC S9(9)V99）

---

## 重點回顧

| USAGE | 儲存方式 | 適用情境 |
|-------|----------|----------|
| DISPLAY | 每位數 1 byte | 報表、顯示、檔案交換 |
| COMP | 二進制 | 計數器、索引、整數運算 |
| COMP-3 | 壓縮十進制 | 金額、精確計算、資料儲存 |

**COMP-3 長度公式**：`⌈(digits + 1) / 2⌉`

---

## 延伸閱讀

- [Lesson 2-5：流程控制：IF、EVALUATE、PERFORM](lesson-2-5-flow-control.md)
- [Lesson 3-1：Sequential File 與 VSAM File](lesson-3-1-file-types.md)
