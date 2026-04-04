# Lesson 4-5：存款/放款系統實例

## 學習目標

- 理解存款系統的核心架構
- 認識放款系統的運作方式
- 了解相關批次處理流程

---

## 存款系統

### 核心功能

| 功能 | 說明 |
|------|------|
| 開戶 | 建立客戶帳戶 |
| 存款 | 現金存入帳戶 |
| 提款 | 現金從帳戶取出 |
| 轉帳 | 帳戶間資金移轉 |
| 結清 | 關閉帳戶 |

### 核心資料結構

```cobol
      * 存款帳戶主檔
       01 DEPOSIT-MASTER.
          05 ACCT-NO           PIC X(16).      *> 帳號
          05 ACCT-TYPE         PIC XX.         *> 帳戶類型 (SA/CA/FD)
          05 CUST-ID           PIC X(10).      *> 客戶編號
          05 ACCT-STATUS       PIC X.          *> 狀態
          05 OPEN-DATE         PIC 9(8).       *> 開戶日期
          05 CURR-CODE         PIC XXX.        *> 幣別
          05 ACCT-BALANCE      PIC S9(11)V99 COMP-3. *> 帳戶餘額
          05 AVAIL-BAL         PIC S9(11)V99 COMP-3. *> 可用餘額
          05 HOLD-AMT          PIC S9(9)V99 COMP-3.  *> 凍結金額
          05 INT-RATE          PIC V9(6) COMP-3.     *> 利率
          05 ACCUM-INT         PIC S9(9)V99 COMP-3.  *> 累計利息
          05 LAST-TRX-DATE     PIC 9(8).       *> 最後交易日

      * 存款交易明細檔
       01 DEPOSIT-TRANS.
          05 TRANS-SEQ         PIC 9(12).      *> 交易序號
          05 TRANS-DATE        PIC 9(8).       *> 交易日期
          05 TRANS-TIME        PIC 9(6).       *> 交易時間
          05 TRANS-TYPE        PIC XX.         *> 交易類型
          05 ACCT-NO           PIC X(16).      *> 帳號
          05 TRANS-AMT         PIC S9(11)V99 COMP-3. *> 交易金額
          05 BAL-BEFORE        PIC S9(11)V99 COMP-3. *> 交易前餘額
          05 BAL-AFTER         PIC S9(11)V99 COMP-3. *> 交易後餘額
          05 REF-NO            PIC X(20).      *> 參考編號
          05 TELLER-ID         PIC X(8).       *> 櫃員編號
```

---

## 放款系統

### 核心功能

| 功能 | 說明 |
|------|------|
| 貸款申請 | 客戶提出貸款申請 |
| 貸款審核 | 信用評估、審核流程 |
| 貸款撥款 | 核准後撥款至帳戶 |
| 還款處理 | 定期還本付息 |
| 逾期處理 | 逾期催收、罰息計算 |

### 核心資料結構

```cobol
      * 放款主檔
       01 LOAN-MASTER.
          05 LOAN-NO           PIC X(16).      *> 貸款編號
          05 CUST-ID           PIC X(10).      *> 客戶編號
          05 LOAN-TYPE         PIC XX.         *> 貸款類型
          05 LOAN-STATUS       PIC X.          *> 狀態
          05 LOAN-AMT          PIC S9(11)V99 COMP-3. *> 貸款金額
          05 DISB-AMT          PIC S9(11)V99 COMP-3. *> 已撥款金額
          05 PRINCIPAL-BAL     PIC S9(11)V99 COMP-3. *> 本金餘額
          05 INT-RATE          PIC V9(6) COMP-3.     *> 利率
          05 TERM              PIC 9(3).       *> 期數
          05 START-DATE        PIC 9(8).       *> 起始日期
          05 MATURITY-DATE     PIC 9(8).       *> 到期日期
          05 NEXT-DUE-DATE     PIC 9(8).       *> 下次扣款日
          05 OVERDUE-PRINCIPAL PIC S9(11)V99 COMP-3. *> 逾期本金
          05 OVERDUE-INT       PIC S9(9)V99 COMP-3.  *> 逾期利息

      * 還款計畫檔
       01 REPAY-SCHEDULE.
          05 LOAN-NO           PIC X(16).      *> 貸款編號
          05 INSTAL-NO         PIC 9(3).       *> 期數
          05 DUE-DATE          PIC 9(8).       *> 應還日期
          05 PRINCIPAL-AMT     PIC S9(11)V99 COMP-3. *> 應還本金
          05 INTEREST-AMT      PIC S9(9)V99 COMP-3.  *> 應還利息
          05 TOTAL-AMT         PIC S9(11)V99 COMP-3. *> 應還總額
          05 PAID-PRINCIPAL    PIC S9(11)V99 COMP-3. *> 已還本金
          05 PAID-INTEREST     PIC S9(9)V99 COMP-3.  *> 已還利息
          05 PAYMENT-STATUS    PIC X.          *> 還款狀態
```

---

## 常見批次處理流程

### 存款批次

```
日終批次：
1. 交易資料彙總
2. 利息計算
3. 餘額更新
4. 對帳處理
5. 報表生成

月底批次：
1. 利息入帳
2. 帳單產生
3. 維護費扣收
4. 月報表生成
```

### 放款批次

```
日終批次：
1. 逾期判斷
2. 罰息計算
3. 還款扣款
4. 餘額更新

月底批次：
1. 還款計畫更新
2. 利息計算
3. 催收名單產生
4. 帳齡分析
```

---

## BA 實務應用

### 需求分析重點

| 系統 | 關注點 |
|------|--------|
| 存款 | 利率計算、餘額維護、交易處理 |
| 放款 | 還款邏輯、逾期處理、利息計算 |

### 常見需求

```
存款系統：
- 新增帳戶類型
- 調整利率
- 新增計息規則
- 交易限額調整

放款系統：
- 新增貸款產品
- 還款方式變更
- 逾期處理規則
- 催收流程優化
```

---

## 練習題

### 題目 1
設計一個活期存款帳戶的日終批次處理流程。

### 題目 2
說明放款系統中「逾期處理」應該包含哪些功能。

### 題目 3
比較存款系統和放款系統的資料結構差異。

---

## 重點回顧

| 系統 | 核心功能 | 核心檔案 |
|------|----------|----------|
| 存款 | 開戶、存提款、轉帳 | 帳戶主檔、交易明細 |
| 放款 | 貸款、還款、逾期 | 貸款主檔、還款計畫 |

---

## 延伸閱讀

- [Lesson 4-6：跨系統資料交換](lesson-4-6-data-exchange.md)
- [Lesson 4-2：計息邏輯實現](lesson-4-2-interest-calc.md)
