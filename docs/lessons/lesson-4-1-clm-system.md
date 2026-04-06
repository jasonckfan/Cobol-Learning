# Lesson 4-1：CLM 資金池管理系統架構

## 學習目標

- 理解 CLM（Cash & Liquidity Management）系統概念
- 認識資金池管理的業務邏輯
- 了解系統架構與資料流向

---

## 什麼是 CLM 系統？

CLM（Cash & Liquidity Management，現金與流動性管理）是銀行核心系統之一，用於：

- **資金集中管理**：集團客戶的資金統一管理
- **流動性監控**：即時掌握資金狀況
- **利息最佳化**：降低外部融資成本
- **自動調調撥**：帳戶間自動資金調撥

---

## CLM 核心功能

### 1. 資金池（Cash Pool）

| 類型 | 說明 | 適用情境 |
|------|------|----------|
| 實體資金池 | 資金實際移動 | 獨立法人帳戶 |
| 名目資金池 | 帳面計息，不實際移動 | 分公司帳戶 |
| 混合資金池 | 結合實體與名目 | 集團企業 |

### 2. 計息邏輯

```
資金池利息 = Σ(各帳戶餘額 × 利率) - 費用

當資金池總餘額 > 0：
  - 池主帳戶獲得利息
  - 參與帳戶按比例分配

當資金池總餘額 < 0：
  - 池主帳戶支付利息
  - 參與帳戶按比例分攤
```

### 3. 自動調撥

```
情境：子公司 A 餘額不足

觸發條件：
  - A 帳戶餘額 < 最低保留金額

調撥動作：
  - 從池主帳戶轉入資金
  - 或從其他子公司調撥

交易記錄：
  - 產生調撥交易
  - 更新兩方餘額
```

---

## 系統架構

### 核心檔案結構

```cobol
      * 資金池主檔
       01 POOL-MASTER.
          05 POOL-ID           PIC X(10).      *> 資金池編號
          05 POOL-TYPE         PIC X.          *> R=實體, N=名目, M=混合
          05 MASTER-ACCT       PIC X(16).      *> 池主帳號
          05 POOL-STATUS       PIC X.          *> A=啟用, S=暫停, C=關閉
          05 EFF-DATE          PIC 9(8).       *> 生效日期
          05 EXP-DATE          PIC 9(8).       *> 到期日期
          05 MIN-BAL           PIC S9(11)V99 COMP-3. *> 最低保留
          05 TARGET-BAL        PIC S9(11)V99 COMP-3. *> 目標餘額

      * 資金池成員檔
       01 POOL-MEMBER.
          05 POOL-ID           PIC X(10).      *> 資金池編號
          05 MEMBER-ACCT       PIC X(16).      *> 成員帳號
          05 MEMBER-TYPE       PIC X.          *> P=池主, M=成員
          05 SHARE-RATE        PIC V9(4).      *> 分潤比例
          05 INT-RATE          PIC V9(4).      *> 適用利率
          05 MIN-BAL           PIC S9(11)V99 COMP-3. *> 最低保留

      * 資金池交易檔
       01 POOL-TRANS.
          05 TRANS-ID          PIC X(20).      *> 交易編號
          05 POOL-ID           PIC X(10).      *> 資金池編號
          05 TRANS-DATE        PIC 9(8).       *> 交易日期
          05 TRANS-TYPE        PIC XX.         *> TI=計息, TR=調撥, SF=費用
          05 FROM-ACCT         PIC X(16).      *> 轉出帳號
          05 TO-ACCT           PIC X(16).      *> 轉入帳號
          05 TRANS-AMT         PIC S9(11)V99 COMP-3. *> 交易金額
          05 BALANCE-BEFORE    PIC S9(11)V99 COMP-3. *> 交易前餘額
          05 BALANCE-AFTER     PIC S9(11)V99 COMP-3. *> 交易後餘額
```

### 批次處理流程

```
日終批次處理（EOD）：

1. 資料準備
   - 讀取所有資金池設定
   - 讀取所有成員帳戶餘額

2. 餘額計算
   - 計算各資金池總餘額
   - 檢查是否需要調撥

3. 自動調撥
   - 產生調撥交易
   - 更新帳戶餘額

4. 利息計算
   - 依據資金池類型計息
   - 分配/分攤利息

5. 費用計算
   - 計算管理費
   - 產生費用交易

6. 報表產生
   - 產生日報表
   - 產生交易明細
```

---

## 程式結構範例

### 主控程式

```cobol
       PROCEDURE DIVISION.
       0000-MAIN.
           PERFORM 1000-INIT
           PERFORM 2000-LOAD-POOL-DATA
           PERFORM 3000-CALC-BALANCE
           PERFORM 4000-AUTO-TRANSFER
           PERFORM 5000-CALC-INTEREST
           PERFORM 6000-CALC-FEE
           PERFORM 7000-GEN-REPORT
           PERFORM 9000-TERM
           STOP RUN.
```

### 計息程式片段

```cobol
       5000-CALC-INTEREST.
           PERFORM 5100-READ-POOL
               UNTIL ALL-POOL-PROCESSED
           
           PERFORM 5200-CALC-POOL-INT
           PERFORM 5300-DISTRIBUTE-INT
           PERFORM 5400-WRITE-INT-TRANS.

       5200-CALC-POOL-INT.
           EVALUATE POOL-TYPE
               WHEN 'R'                     *> 實體資金池
                   PERFORM 5210-CALC-PHYSICAL
               WHEN 'N'                     *> 名目資金池
                   PERFORM 5220-CALC-NOMINAL
               WHEN 'M'                     *> 混合資金池
                   PERFORM 5230-CALC-MIXED
           END-EVALUATE.

       5210-CALC-PHYSICAL.
           *> 計算資金池總餘額
           MOVE 0 TO WS-POOL-TOTAL
           PERFORM VARYING WS-IDX FROM 1 BY 1
               UNTIL WS-IDX > WS-MEMBER-COUNT
               ADD MEMBER-BALANCE(WS-IDX) TO WS-POOL-TOTAL
           END-PERFORM
           
           *> 計算利息
           IF WS-POOL-TOTAL > 0
               COMPUTE WS-POOL-INT = WS-POOL-TOTAL * POOL-INT-RATE
           ELSE
               COMPUTE WS-POOL-INT = WS-POOL-TOTAL * POOL-OD-RATE
           END-IF.
```

---

## 銀行實務重點

### 常見需求

| 需求 | 說明 | 技術考量 |
|------|------|----------|
| 新增資金池 | 客戶開通服務 | 建立主檔記錄、設定參數 |
| 成員異動 | 加入/退出成員 | 更新成員檔、處理餘額 |
| 利率調整 | 更改計息利率 | 重新計算、產生調整交易 |
| 報表客製 | 客戶特殊需求 | 開發新報表程式 |
| 多幣別 | 外幣資金池 | 匯率處理、幣別轉換 |

### 影響分析案例

**情境：新增「最低保留金額」檢核**

1. **需求確認**：
   - 各成員可設定不同最低保留金額
   - 低於最低保留時發出警示或自動調撥

2. **影響範圍**：
   - POOL-MEMBER 檔案結構（已有 MIN-BAL 欄位）
   - 自動調撥邏輯需要修改
   - 新增警示通知機制

3. **測試重點**：
   - 各種餘額情境測試
   - 邊界條件測試
   - 效能測試（大量帳戶）

---

## BA 實務應用

### 需求訪談重點

| 問題 | 目的 |
|------|------|
| 「資金池有多少成員？」 | 評估系統負載 |
| 「計息頻率是日計息還是月計息？」 | 確認批次排程 |
| 「是否需要即時監控？」 | 判斷是否需要線上交易 |
| 「跨幣別如何處理？」 | 確認匯率來源與處理時點 |

### 文件閱讀重點

1. **資金池設定檔**：了解參數配置
2. **計息規則書**：理解計息邏輯
3. **介面規格**：了解與其他系統的互動

---

## 練習題

### 題目 1
說明實體資金池與名目資金池的差異。

### 題目 2
設計一個資金池日終批次的處理流程，包含調撥和計息。

### 題目 3
如果客戶要求「新增跨幣別資金池」，需要考慮哪些因素？

---

## 重點回顧

| 概念 | 說明 |
|------|------|
| CLM | 現金與流動性管理系統 |
| 資金池 | 集中管理多帳戶資金 |
| 實體資金池 | 資金實際移動 |
| 名目資金池 | 帳面計息，不移動資金 |
| 自動調撥 | 根據規則自動移動資金 |

---

## 延伸閱讀

- [Lesson 4-2：計息邏輯實現](lesson-4-2-interest-calc.md)
- [Lesson 4-3：日終批次處理流程](lesson-4-3-eod-process.md)
