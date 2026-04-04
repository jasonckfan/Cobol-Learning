# Lesson 4-6：跨系統資料交換

## 學習目標

- 理解銀行跨系統資料交換的概念
- 認識 SWIFT 訊息格式
- 了解清算系統介接方式

---

## 為什麼需要跨系統資料交換？

現代銀行業務：
- 與其他銀行往來
- 與清算組織連線
- 與監管機構報送
- 內部系統整合

---

## SWIFT 訊息格式

### 什麼是 SWIFT？

SWIFT（Society for Worldwide Interbank Financial Telecommunication）是全球銀行間金融通訊協會，提供標準化的金融訊息格式。

### 常見 SWIFT 訊息類型

| 類型 | 說明 | 用途 |
|------|------|------|
| MT103 | 單筆客戶匯款 | 跨境匯款 |
| MT202 | 銀行間匯款 | 銀行清算 |
| MT910 | 借記通知 | 收款確認 |
| MT950 | 對帳單 | 帳戶對帳 |
| MT940 | 客戶對帳單 | 客戶對帳 |

### MT103 訊息結構（簡化）

```
{1:F01ABCCHKHHAXXX0000000000}
{2:I103DEUTDEFFXXXXN}
{4:
:20:REFERENCE123
:23B:CRED
:32A:240404USD10000,00
:33B:USD10000,00
:50K:/1234567890
JOHN DOE
123 MAIN STREET
HONG KONG
:52A:ABCCHKHH
:57A:DEUTDEFF
:59:/9876543210
JANE SMITH
456 OAK AVENUE
BERLIN
:70:INVOICE PAYMENT
:71A:SHA
-}
```

---

## 清算系統介接

### 常見清算系統

| 系統 | 地區 | 說明 |
|------|------|------|
| CHATS | 香港 | 即時支付清算系統 |
| CNAPS | 中國 | 大小額支付系統 |
| Fedwire | 美國 | 聯邦資金轉帳系統 |
| TARGET | 歐洲 | 歐元區支付系統 |
| RTGS | 多國 | 即時總額清算 |

### 清算檔案格式

```cobol
      * 清算交易記錄
       01 CLEARING-RECORD.
          05 TRANS-DATE        PIC 9(8).       *> 交易日期
          05 TRANS-TIME        PIC 9(6).       *> 交易時間
          05 TRANS-TYPE        PIC X(3).       *> 交易類型
          05 TRANS-STATUS      PIC X.          *> 狀態
          05 SENDER-BANK       PIC X(11).      *> 發送銀行
          05 RECEIVER-BANK     PIC X(11).      *> 接收銀行
          05 TRANS-AMT         PIC S9(13)V99.  *> 金額
          05 CURR-CODE         PIC XXX.        *> 幣別
          05 VALUE-DATE        PIC 9(8).       *> 起息日
          05 REF-NO            PIC X(16).      *> 參考編號
          05 ACCT-NO           PIC X(34).      *> 帳號
          05 BENEFICIARY       PIC X(35).      *> 受益人
          05 REMARK            PIC X(140).     *> 備註
```

---

## 對帳檔案格式

### 清算對帳

```
清算機構 → 銀行：
- 每日交易清單
- 餘額確認
- 退匯通知

銀行 → 清算機構：
- 確認回覆
- 差異通知
```

### 對帳記錄結構

```cobol
      * 對帳記錄
       01 RECON-RECORD.
          05 RECON-TYPE        PIC X.          *> 類型 (D/C)
          05 TRANS-DATE        PIC 9(8).       *> 交易日期
          05 VALUE-DATE        PIC 9(8).       *> 起息日
          05 ACCT-NO           PIC X(34).      *> 帳號
          05 TRANS-AMT         PIC S9(13)V99.  *> 金額
          05 CURR-CODE         PIC XXX.        *> 幣別
          05 REF-NO            PIC X(16).      *> 參考編號
          05 ENTRY-DESC        PIC X(50).      *> 摘要
          05 BALANCE           PIC S9(13)V99.  *> 餘額
          05 RECON-STATUS      PIC X.          *> 對帳狀態
```

---

## 資料交換最佳實務

### 檔案傳輸

| 方式 | 說明 | 適用情境 |
|------|------|----------|
| SFTP | 加密檔案傳輸 | 大量資料交換 |
| MQ | 訊息佇列 | 即時交易 |
| API | REST/SOAP | 線上服務 |
| SWIFT | 金融專用 | 跨行交易 |

### 安全控制

```
傳輸安全：
- 加密傳輸 (TLS/SSL)
- 數位簽章
- PKI 認證

資料安全：
- 敏感資料遮罩
- 資料完整檢核
- 存取權限控制

監控：
- 傳輸狀態監控
- 異常告警
- 日誌記錄
```

---

## BA 實務應用

### 需求確認重點

| 問題 | 目的 |
|------|------|
| 「交換頻率是多少？」 | 即時 vs 批次 |
| 「檔案格式是什麼？」 | 標準 vs 自訂 |
| 「安全性要求？」 | 加密、簽章需求 |
| 「失敗處理方式？」 | 重試、通知機制 |

### 測試重點

```
測試項目：
□ 正常傳輸測試
□ 格式驗證測試
□ 異常處理測試
□ 效能測試
□ 安全性測試
□ 對帳驗證
```

---

## 練習題

### 題目 1
說明 SWIFT MT103 和 MT202 的用途差異。

### 題目 2
設計一個跨行匯款資料交換的流程圖。

### 題目 3
資料交換時應該考慮哪些安全措施？

---

## 重點回顧

| 概念 | 說明 |
|------|------|
| SWIFT | 全球銀行金融通訊標準 |
| MT103 | 單筆客戶匯款訊息 |
| 清算系統 | 銀行間資金清算 |
| 對帳 | 確保資料一致性 |

---

## 延伸閱讀

- [Lesson 3-6：MQ/Socket 通訊概念](lesson-3-6-mq-socket.md)
- [Lesson 4-4：對帳與報表生成](lesson-4-4-reconciliation.md)
