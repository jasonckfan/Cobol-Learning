# Lesson 4-5：存款/放款系統實例

## 學習目標

- 理解存款系統的核心架構與處理流程
- 認識放款系統的運作方式與還款邏輯
- 能夠分析存款/放款相關業務需求
- 掌握常見的批次處理與對帳流程

---

## 存款系統概述

### 業務背景

存款系統是銀行最核心的業務系統之一，負責處理：
- 客戶資金的存放與提取
- 利息計算與入帳
- 帳戶管理與維護
- 與其他系統的介接

### 帳戶類型

| 類型 | 代碼 | 說明 | 特點 |
|------|------|------|------|
| 活期存款 | SA (Savings Account) | 隨時存取 | 較低利率，計息靈活 |
| 支票存款 | CA (Current Account) | 支票交易 | 通常不計息，透支功能 |
| 定期存款 | FD (Fixed Deposit) | 固定期限 | 較高利率，到期領回 |
| 綜合存款 | MM (Money Market) | 投資型 | 利率浮動，金額限制 |
| 外幣存款 | FC (Foreign Currency) | 多幣別 | 匯率風險，利率差異 |

### 核心功能

| 功能 | 說明 | 觸發條件 |
|------|------|----------|
| 開戶 | 建立客戶帳戶 | 客戶申請、KYC 驗證 |
| 存款 | 現金存入帳戶 | 櫃檯交易、ATM、轉帳 |
| 提款 | 現金從帳戶取出 | 櫃檯交易、ATM |
| 轉帳 | 帳戶間資金移轉 | 線上轉帳、跨行匯款 |
| 凍結 | 限制帳戶使用 | 法務扣款、可疑交易 |
| 結清 | 關閉帳戶 | 客戶申請、定期到期 |

### 核心資料結構

```cobol
      * 存款帳戶主檔
       01 DEPOSIT-MASTER.
          05 ACCT-NO           PIC X(16).      *> 帳號
          05 ACCT-TYPE         PIC XX.         *> 帳戶類型 (SA/CA/FD)
          05 CUST-ID           PIC X(10).      *> 客戶編號
          05 ACCT-STATUS       PIC X.          *> 狀態 (A=正常, F=凍結, C=結清)
          05 OPEN-DATE         PIC 9(8).       *> 開戶日期
          05 CURR-CODE         PIC XXX.        *> 幣別
          05 ACCT-BALANCE      PIC S9(13)V99 COMP-3. *> 帳戶餘額
          05 AVAIL-BAL         PIC S9(13)V99 COMP-3. *> 可用餘額
          05 HOLD-AMT          PIC S9(11)V99 COMP-3. *> 凍結金額
          05 INT-RATE          PIC V9(6) COMP-3.     *> 利率
          05 ACCUM-INT         PIC S9(11)V99 COMP-3. *> 累計利息
          05 LAST-TRX-DATE     PIC 9(8).       *> 最後交易日
          05 LAST-INT-DATE     PIC 9(8).       *> 最後計息日
          05 OVRD-LIMIT        PIC S9(11)V99 COMP-3. *> 透支額度
          05 MIN-BAL           PIC S9(9)V99 COMP-3.  *> 最低餘額
          05 BRANCH-CODE       PIC X(4).       *> 開戶分行

      * 存款交易明細檔
       01 DEPOSIT-TRANS.
          05 TRANS-SEQ         PIC 9(12).      *> 交易序號
          05 TRANS-DATE        PIC 9(8).       *> 交易日期
          05 TRANS-TIME        PIC 9(6).       *> 交易時間
          05 TRANS-TYPE        PIC XX.         *> 交易類型
          05 ACCT-NO           PIC X(16).      *> 帳號
          05 TRANS-AMT         PIC S9(13)V99 COMP-3. *> 交易金額
          05 BAL-BEFORE        PIC S9(13)V99 COMP-3. *> 交易前餘額
          05 BAL-AFTER         PIC S9(13)V99 COMP-3. *> 交易後餘額
          05 REF-NO            PIC X(20).      *> 參考編號
          05 TELLER-ID         PIC X(8).       *> 櫃員編號
          05 CHANNEL           PIC X.          *> 通路 (T=櫃檯, A=ATM, O=線上)
          05 REMARK            PIC X(40).      *> 備註
          05 VALUE-DATE        PIC 9(8).       *> 起息日
```

---

## 存款交易處理流程

### 存款交易程式範例

```cobol
       IDENTIFICATION DIVISION.
       PROGRAM-ID. DEPTRANS.

       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT ACCT-FILE ASSIGN TO ACCTMAS
               ORGANIZATION IS INDEXED
               ACCESS MODE IS RANDOM
               RECORD KEY IS ACCT-NO
               FILE STATUS IS WS-ACCT-STATUS.
           SELECT TRANS-FILE ASSIGN TO TRANSLOG
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-TRANS-STATUS.

       DATA DIVISION.
       FILE SECTION.
       FD ACCT-FILE.
       COPY DEPOSIT-MASTER.

       FD TRANS-FILE.
       COPY DEPOSIT-TRANS.

       WORKING-STORAGE SECTION.
       01 WS-FLAGS.
          05 WS-VALID-FLAG     PIC X VALUE 'N'.
             88 WS-VALID       VALUE 'Y'.
          05 WS-FOUND-FLAG     PIC X VALUE 'N'.
             88 WS-ACCT-FOUND  VALUE 'Y'.

       01 WS-INPUT-FIELDS.
          05 WS-IN-ACCT-NO     PIC X(16).
          05 WS-IN-TRANS-TYPE  PIC XX.
          05 WS-IN-AMT         PIC S9(11)V99.
          05 WS-IN-TELLER      PIC X(8).
          05 WS-IN-CHANNEL     PIC X.

       01 WS-WORK-FIELDS.
          05 WS-NEW-BALANCE    PIC S9(13)V99 COMP-3.
          05 WS-TOTAL-CNT      PIC 9(8) VALUE 0.
          05 WS-TOTAL-AMT      PIC S9(15)V99 COMP-3 VALUE 0.

       PROCEDURE DIVISION.
       0000-MAIN.
           PERFORM 1000-INIT
           PERFORM 2000-READ-INPUT
           PERFORM 3000-VALIDATE-INPUT
           IF WS-VALID
               PERFORM 4000-PROCESS-TRANS
           END-IF
           PERFORM 9000-TERM
           STOP RUN.

       3000-VALIDATE-INPUT.
      *    驗證帳戶存在
           MOVE WS-IN-ACCT-NO TO ACCT-NO
           READ ACCT-FILE
               INVALID KEY
                   DISPLAY '錯誤: 帳戶不存在 - ' ACCT-NO
                   MOVE 'N' TO WS-VALID-FLAG
               NOT INVALID KEY
                   SET WS-ACCT-FOUND TO TRUE
           END-READ
           
      *    驗證帳戶狀態
           IF WS-ACCT-FOUND
               IF ACCT-STATUS NOT = 'A'
                   DISPLAY '錯誤: 帳戶狀態異常 - ' ACCT-STATUS
                   MOVE 'N' TO WS-VALID-FLAG
               ELSE
                   PERFORM 3100-VALIDATE-BALANCE
               END-IF
           END-IF.

       3100-VALIDATE-BALANCE.
      *    提款檢查餘額
           IF WS-IN-TRANS-TYPE = 'WD'
               COMPUTE WS-NEW-BALANCE = 
                   ACCT-BALANCE - WS-IN-AMT
               IF WS-NEW-BALANCE < (AVAIL-BAL - OVRD-LIMIT)
                   DISPLAY '錯誤: 餘額不足'
                   MOVE 'N' TO WS-VALID-FLAG
               ELSE
                   SET WS-VALID TO TRUE
               END-IF
           ELSE
               SET WS-VALID TO TRUE
           END-IF.

       4000-PROCESS-TRANS.
           EVALUATE WS-IN-TRANS-TYPE
               WHEN 'DP'                        *> 存款
                   PERFORM 4100-DEPOSIT
               WHEN 'WD'                        *> 提款
                   PERFORM 4200-WITHDRAW
               WHEN 'TR'                        *> 轉帳
                   PERFORM 4300-TRANSFER
               WHEN OTHER
                   DISPLAY '錯誤: 不支援的交易類型'
           END-EVALUATE.

       4100-DEPOSIT.
      *    更新餘額
           ADD WS-IN-AMT TO ACCT-BALANCE
           ADD WS-IN-AMT TO AVAIL-BAL
      *    更新最後交易日
           MOVE FUNCTION CURRENT-DATE(1:8) TO LAST-TRX-DATE
      *    寫回主檔
           REWRITE DEPOSIT-MASTER
      *    記錄交易明細
           PERFORM 4500-WRITE-TRANS-LOG.

       4200-WITHDRAW.
      *    檢查可用餘額
           IF WS-IN-AMT > AVAIL-BAL
               DISPLAY '錯誤: 可用餘額不足'
           ELSE
      *        更新餘額
               SUBTRACT WS-IN-AMT FROM ACCT-BALANCE
               SUBTRACT WS-IN-AMT FROM AVAIL-BAL
               MOVE FUNCTION CURRENT-DATE(1:8) TO LAST-TRX-DATE
               REWRITE DEPOSIT-MASTER
               PERFORM 4500-WRITE-TRANS-LOG
           END-IF.

       4500-WRITE-TRANS-LOG.
           MOVE FUNCTION CURRENT-DATE(1:8) TO TRANS-DATE
           MOVE FUNCTION CURRENT-DATE(9:6) TO TRANS-TIME
           MOVE WS-IN-ACCT-NO TO ACCT-NO
           MOVE WS-IN-TRANS-TYPE TO TRANS-TYPE
           MOVE WS-IN-AMT TO TRANS-AMT
           MOVE ACCT-BALANCE TO BAL-AFTER
           MOVE WS-IN-TELLER TO TELLER-ID
           MOVE WS-IN-CHANNEL TO CHANNEL
           WRITE DEPOSIT-TRANS.
```

---

## 定期存款處理

### 定期存款資料結構

```cobol
      * 定期存款主檔
       01 FD-MASTER.
          05 FD-ACCT-NO        PIC X(16).      *> 定存帳號
          05 CUST-ID           PIC X(10).      *> 客戶編號
          05 FD-TYPE           PIC XX.         *> 定存類型
          05 FD-STATUS         PIC X.          *> 狀態
          05 PRINCIPAL         PIC S9(13)V99 COMP-3. *> 本金
          05 INT-RATE          PIC V9(6) COMP-3.     *> 利率
          05 TERM-MONTHS       PIC 9(2).       *> 存期（月）
          05 OPEN-DATE         PIC 9(8).       *> 開戶日期
          05 MATURITY-DATE     PIC 9(8).       *> 到期日
          05 MATURITY-AMT      PIC S9(13)V99 COMP-3. *> 到期金額
          05 INT-AMT           PIC S9(11)V99 COMP-3. *> 利息金額
          05 AUTO-RENEW        PIC X.          *> 自動續存 (Y/N)
          05 RENEW-TYPE        PIC X.          *> 續存方式 (P=本金, PI=本息)
          05 LINK-ACCT         PIC X(16).      *> 連結帳戶
          05 WITHHOLD-TAX      PIC V9(4) COMP-3.    *> 扣繳稅率
```

### 定存到期處理批次

```cobol
       IDENTIFICATION DIVISION.
       PROGRAM-ID. FDMATURE.

       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT FD-FILE ASSIGN TO FDMASTER
               ORGANIZATION IS INDEXED
               ACCESS MODE IS SEQUENTIAL
               RECORD KEY IS FD-ACCT-NO
               FILE STATUS IS WS-FD-STATUS.
           SELECT OUT-FILE ASSIGN TO FDOUT
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-OUT-STATUS.

       DATA DIVISION.
       FILE SECTION.
       FD FD-FILE.
       01 FD-RECORD.
          COPY FD-MASTER.

       WORKING-STORAGE SECTION.
       01 WS-FLAGS.
          05 WS-EOF            PIC X VALUE 'N'.
             88 EOF-REACHED    VALUE 'Y'.

       01 WS-WORK-FIELDS.
          05 WS-TODAY          PIC 9(8).
          05 WS-NEW-PRINCIPAL  PIC S9(13)V99 COMP-3.
          05 WS-NEW-MATURITY   PIC 9(8).

       PROCEDURE DIVISION.
       0000-MAIN.
           PERFORM 1000-INIT
           PERFORM 2000-PROCESS UNTIL EOF-REACHED
           PERFORM 9000-TERM
           STOP RUN.

       2000-PROCESS.
           READ FD-FILE
               AT END
                   SET EOF-REACHED TO TRUE
               NOT AT END
                   PERFORM 2100-CHECK-MATURITY
           END-READ.

       2100-CHECK-MATURITY.
      *    檢查是否今日到期
           IF MATURITY-DATE = WS-TODAY AND FD-STATUS = 'A'
               PERFORM 2200-PROCESS-MATURITY
           END-IF.

       2200-PROCESS-MATURITY.
           EVALUATE AUTO-RENEW
               WHEN 'Y'
                   PERFORM 2210-AUTO-RENEW
               WHEN 'N'
                   PERFORM 2220-TRANSFER-OUT
           END-EVALUATE.

       2210-AUTO-RENEW.
      *    計算新本金
           EVALUATE RENEW-TYPE
               WHEN 'P'                        *> 只續本金
                   MOVE PRINCIPAL TO WS-NEW-PRINCIPAL
                   PERFORM 2220-TRANSFER-OUT  *> 利息轉出
               WHEN 'PI'                       *> 本息續存
                   ADD PRINCIPAL TO INT-AMT 
                       GIVING WS-NEW-PRINCIPAL
           END-EVALUATE
      *    更新定存記錄
           MOVE WS-NEW-PRINCIPAL TO PRINCIPAL
           PERFORM 2300-CALC-NEW-MATURITY
           PERFORM 2400-CALC-NEW-INTEREST
           REWRITE FD-RECORD.

       2300-CALC-NEW-MATURITY.
      *    計算新的到期日
           MOVE MATURITY-DATE TO WS-NEW-MATURITY
           ADD TERM-MONTHS TO WS-NEW-MATURY (加月份)
           MOVE WS-NEW-MATURITY TO MATURITY-DATE.

       2400-CALC-NEW-INTEREST.
      *    計算預估利息
           COMPUTE INT-AMT ROUNDED = 
               PRINCIPAL * INT-RATE * TERM-MONTHS / 12
           ADD INT-AMT TO PRINCIPAL GIVING MATURITY-AMT.
```

---

## 放款系統概述

### 業務背景

放款系統負責管理銀行的信貸資產，包括：
- 貸款申請與審核
- 撥款與還款處理
- 利息計算與收取
- 逾期管理與催收

### 貸款類型

| 類型 | 代碼 | 說明 | 特點 |
|------|------|------|------|
| 房貸 | HM (Home Mortgage) | 不動產擔保 | 期限長，利率低，分期攤還 |
| 車貸 | CL (Car Loan) | 車輛擔保 | 期限中，利率中等 |
| 信貸 | PL (Personal Loan) | 無擔保 | 期限短，利率較高 |
| 企業貸款 | BL (Business Loan) | 企業融資 | 金額大，條件彈性 |
| 信用卡循環 | CC (Credit Card) | 循環信用 | 利率高，最低還款額 |
| 透支 | OD (Overdraft) | 額度動用 | 按日計息，隨借隨還 |

### 還款方式

| 方式 | 說明 | 計算公式 | 適用情境 |
|------|------|----------|----------|
| 本息平均攤還 | 每期還款金額固定 | P × [r(1+r)^n] / [(1+r)^n-1] | 房貸、車貸 |
| 本金平均攤還 | 每期還本金額固定 | 本金/期數 + 利息 | 企業貸款 |
| 到期一次還本 | 期中只還利息，到期還本 | 利息 = 本金 × 利率 | 短期融資 |
| 彈性還款 | 可提前還款無違約金 | - | 部分信貸產品 |
| 最低應繳 | 只需繳最低金額 | 通常為餘額的 2-5% | 信用卡 |

### 核心功能

| 功能 | 說明 | 觸發條件 |
|------|------|----------|
| 貸款申請 | 客戶提出貸款申請 | 客戶需求 |
| 貸款審核 | 信用評估、審核流程 | 申請提交 |
| 貸款撥款 | 核准後撥款至帳戶 | 審核通過 |
| 還款處理 | 定期還本付息 | 扣款日/主動還款 |
| 利息計算 | 依約定方式計息 | 日終批次 |
| 逾期處理 | 逾期催收、罰息計算 | 未按時還款 |
| 提前清償 | 提前償還全部貸款 | 客戶申請 |

### 核心資料結構

```cobol
      * 放款主檔
       01 LOAN-MASTER.
          05 LOAN-NO           PIC X(16).      *> 貸款編號
          05 CUST-ID           PIC X(10).      *> 客戶編號
          05 LOAN-TYPE         PIC XX.         *> 貸款類型
          05 LOAN-STATUS       PIC X.          *> 狀態
             88 LOAN-ACTIVE    VALUE 'A'.
             88 LOAN-OVERDUE   VALUE 'O'.
             88 LOAN-CLOSED    VALUE 'C'.
             88 LOAN-WRITEOFF  VALUE 'W'.
          05 LOAN-AMT          PIC S9(13)V99 COMP-3. *> 核准金額
          05 DISB-AMT          PIC S9(13)V99 COMP-3. *> 已撥款金額
          05 PRINCIPAL-BAL     PIC S9(13)V99 COMP-3. *> 本金餘額
          05 INT-RATE          PIC V9(6) COMP-3.     *> 利率
          05 PENALTY-RATE      PIC V9(4) COMP-3.     *> 罰息利率
          05 REPAY-METHOD      PIC X.          *> 還款方式
          05 TERM              PIC 9(3).       *> 總期數
          05 CURR-INSTAL       PIC 9(3).       *> 當前期數
          05 START-DATE        PIC 9(8).       *> 起始日期
          05 MATURITY-DATE     PIC 9(8).       *> 到期日期
          05 NEXT-DUE-DATE     PIC 9(8).       *> 下次扣款日
          05 MONTHLY-AMT       PIC S9(9)V99 COMP-3.  *> 每期應還金額
          05 OVERDUE-PRINCIPAL PIC S9(13)V99 COMP-3. *> 逾期本金
          05 OVERDUE-INT       PIC S9(11)V99 COMP-3. *> 逾期利息
          05 ACCUM-PENALTY     PIC S9(9)V99 COMP-3.  *> 累計罰息
          05 COLLATERAL-ID     PIC X(20).      *> 擔保品編號
          05 REPAY-ACCT        PIC X(16).      *> 還款帳號
          05 LAST-PAY-DATE     PIC 9(8).       *> 最後還款日
          05 OVERDUE-DAYS      PIC 9(5).       *> 逾期天數

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
          05 PAID-DATE         PIC 9(8).       *> 實際還款日
          05 PAYMENT-STATUS    PIC X.          *> 還款狀態
             88 PAY-PENDING    VALUE 'P'.
             88 PAY-PARTIAL    VALUE 'R'.
             88 PAID-FULL      VALUE 'F'.
             88 PAY-OVERDUE    VALUE 'O'.
```

---

## 放款還款處理

### 還款批次程式

```cobol
       IDENTIFICATION DIVISION.
       PROGRAM-ID. LOANPAY.

       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT LOAN-FILE ASSIGN TO LOANMAS
               ORGANIZATION IS INDEXED
               ACCESS MODE IS SEQUENTIAL
               RECORD KEY IS LOAN-NO
               FILE STATUS IS WS-LOAN-STATUS.
           SELECT SCHED-FILE ASSIGN TO REPAYSCH
               ORGANIZATION IS INDEXED
               ACCESS MODE IS RANDOM
               RECORD KEY IS RS-KEY
               FILE STATUS IS WS-SCHED-STATUS.
           SELECT TRANS-FILE ASSIGN TO LOANTRX
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-TRANS-STATUS.

       DATA DIVISION.
       FILE SECTION.
       FD LOAN-FILE.
       01 LOAN-RECORD.
          COPY LOAN-MASTER.

       FD SCHED-FILE.
       01 SCHED-RECORD.
          COPY REPAY-SCHEDULE.
          05 RS-KEY.
             10 RS-LOAN-NO     PIC X(16).
             10 RS-INSTAL-NO   PIC 9(3).

       FD TRANS-FILE.
       01 TRANS-RECORD.
          05 TRX-LOAN-NO       PIC X(16).
          05 TRX-DATE          PIC 9(8).
          05 TRX-TYPE          PIC XX.
          05 TRX-PRINCIPAL     PIC S9(11)V99.
          05 TRX-INTEREST      PIC S9(9)V99.
          05 TRX-PENALTY       PIC S9(9)V99.
          05 TRX-TOTAL         PIC S9(11)V99.
          05 TRX-BAL-AFTER     PIC S9(13)V99.

       WORKING-STORAGE SECTION.
       01 WS-FLAGS.
          05 WS-EOF            PIC X VALUE 'N'.
             88 EOF-REACHED    VALUE 'Y'.

       01 WS-COUNTERS.
          05 WS-LOAN-CNT       PIC 9(8) VALUE 0.
          05 WS-PAY-CNT        PIC 9(8) VALUE 0.
          05 WS-OVERDUE-CNT    PIC 9(8) VALUE 0.
          05 WS-TOTAL-PRIN     PIC S9(15)V99 COMP-3 VALUE 0.
          05 WS-TOTAL-INT      PIC S9(13)V99 COMP-3 VALUE 0.

       01 WS-WORK-FIELDS.
          05 WS-TODAY          PIC 9(8).
          05 WS-PAY-AMT        PIC S9(11)V99 COMP-3.
          05 WS-ACCT-BAL       PIC S9(13)V99 COMP-3.

       PROCEDURE DIVISION.
       0000-MAIN.
           PERFORM 1000-INIT
           PERFORM 2000-PROCESS UNTIL EOF-REACHED
           PERFORM 3000-SUMMARY
           PERFORM 9000-TERM
           STOP RUN.

       1000-INIT.
           ACCEPT WS-TODAY FROM DATE YYYYMMDD
           OPEN I-O LOAN-FILE
           OPEN I-O SCHED-FILE
           OPEN OUTPUT TRANS-FILE.

       2000-PROCESS.
           READ LOAN-FILE
               AT END
                   SET EOF-REACHED TO TRUE
               NOT AT END
                   ADD 1 TO WS-LOAN-CNT
                   PERFORM 2100-CHECK-PAYMENT
           END-READ.

       2100-CHECK-PAYMENT.
      *    檢查今日是否為扣款日
           IF NEXT-DUE-DATE = WS-TODAY
               PERFORM 2200-PROCESS-PAYMENT
           END-IF
      *    檢查逾期
           IF LOAN-STATUS = 'O' OR OVERDUE-DAYS > 0
               PERFORM 2300-PROCESS-OVERDUE
           END-IF.

       2200-PROCESS-PAYMENT.
      *    讀取還款帳戶餘額
           PERFORM 2210-GET-ACCT-BALANCE
           
      *    檢查餘額是否足夠
           IF WS-ACCT-BAL >= MONTHLY-AMT
               PERFORM 2220-DO-PAYMENT
           ELSE
      *        餘額不足，標記逾期
               MOVE 'O' TO LOAN-STATUS
               MOVE 1 TO OVERDUE-DAYS
               REWRITE LOAN-RECORD
               ADD 1 TO WS-OVERDUE-CNT
           END-IF.

       2220-DO-PAYMENT.
      *    扣款
           SUBTRACT MONTHLY-AMT FROM WS-ACCT-BAL
      *    讀取當期還款計畫
           MOVE LOAN-NO TO RS-LOAN-NO
           MOVE CURR-INSTAL TO RS-INSTAL-NO
           READ SCHED-FILE
               KEY IS RS-KEY
               INVALID KEY
                   DISPLAY '錯誤: 找不到還款計畫 ' LOAN-NO
               NOT INVALID KEY
                   PERFORM 2221-UPDATE-SCHEDULE
           END-READ
      *    更新貸款主檔
           SUBTRACT PRINCIPAL-AMT FROM PRINCIPAL-BAL
           ADD 1 TO CURR-INSTAL
           COMPUTE NEXT-DUE-DATE = 
               FUNCTION DATE-OF-INTEGER(
                   FUNCTION INTEGER-OF-DATE(NEXT-DUE-DATE) + 30)
           IF CURR-INSTAL > TERM
               MOVE 'C' TO LOAN-STATUS
           END-IF
           REWRITE LOAN-RECORD
      *    寫入交易記錄
           PERFORM 2230-WRITE-TRANS
           ADD 1 TO WS-PAY-CNT.

       2221-UPDATE-SCHEDULE.
      *    更新還款計畫狀態
           MOVE TOTAL-AMT TO PAID-PRINCIPAL
           MOVE INTEREST-AMT TO PAID-INTEREST
           MOVE WS-TODAY TO PAID-DATE
           MOVE 'F' TO PAYMENT-STATUS
           REWRITE SCHED-RECORD
      *    累計統計
           ADD PRINCIPAL-AMT TO WS-TOTAL-PRIN
           ADD INTEREST-AMT TO WS-TOTAL-INT.

       2300-PROCESS-OVERDUE.
      *    計算罰息
           COMPUTE WS-PAY-AMT = 
               OVERDUE-PRINCIPAL * PENALTY-RATE / 365
           ADD WS-PAY-AMT TO ACCUM-PENALTY
      *    更新逾期天數
           ADD 1 TO OVERDUE-DAYS.

       3000-SUMMARY.
           DISPLAY '================================'
           DISPLAY '放款還款批次統計'
           DISPLAY '================================'
           DISPLAY '處理貸款數: ' WS-LOAN-CNT
           DISPLAY '成功扣款數: ' WS-PAY-CNT
           DISPLAY '逾期戶數: ' WS-OVERDUE-CNT
           DISPLAY '總收回本金: ' WS-TOTAL-PRIN
           DISPLAY '總收回利息: ' WS-TOTAL-INT
           DISPLAY '================================'.

       9000-TERM.
           CLOSE LOAN-FILE
           CLOSE SCHED-FILE
           CLOSE TRANS-FILE.
```

---

## 逾期處理與催收

### 逾期處理流程

```
逾期判定流程：
                    
營業日 → 檢查扣款日 → 未扣款成功 → 標記逾期
                              ↓
                         計算罰息
                              ↓
                         更新逾期天數
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
               逾期 1-30 天         逾期 > 30 天
                    ↓                   ↓
               發送提醒通知         轉催收部門
```

### 逾期批次程式

```cobol
       IDENTIFICATION DIVISION.
       PROGRAM-ID. OVERDUE.

       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT LOAN-FILE ASSIGN TO LOANMAS
               ORGANIZATION IS INDEXED
               ACCESS MODE IS SEQUENTIAL
               RECORD KEY IS LOAN-NO
               FILE STATUS IS WS-STATUS.
           SELECT NOTICE-FILE ASSIGN TO NOTICE
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-NOTICE-STATUS.
           SELECT COLLECTION-FILE ASSIGN TO COLLECT
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-COLL-STATUS.

       DATA DIVISION.
       FILE SECTION.
       FD LOAN-FILE.
       01 LOAN-RECORD.
          COPY LOAN-MASTER.

       FD NOTICE-FILE.
       01 NOTICE-RECORD.
          05 NT-LOAN-NO        PIC X(16).
          05 NT-CUST-ID        PIC X(10).
          05 NT-TYPE           PIC X.          *> 類型 (1/2/3)
          05 NT-DAYS           PIC 9(5).
          05 NT-AMT-DUE        PIC S9(11)V99.
          05 NT-SEND-DATE      PIC 9(8).

       FD COLLECTION-FILE.
       01 COLLECTION-RECORD.
          05 CL-LOAN-NO        PIC X(16).
          05 CL-CUST-ID        PIC X(10).
          05 CL-PRINCIPAL      PIC S9(13)V99.
          05 CL-OVERDUE-INT    PIC S9(11)V99.
          05 CL-PENALTY        PIC S9(9)V99.
          05 CL-OVERDUE-DAYS   PIC 9(5).
          05 CL-STATUS         PIC X.
          05 CL-ASSIGN-DATE    PIC 9(8).

       WORKING-STORAGE SECTION.
       01 WS-FLAGS.
          05 WS-EOF            PIC X VALUE 'N'.
             88 EOF-REACHED    VALUE 'Y'.

       01 WS-COUNTERS.
          05 WS-OVERDUE-CNT    PIC 9(8) VALUE 0.
          05 WS-NOTICE-CNT     PIC 9(8) VALUE 0.
          05 WS-COLLECT-CNT    PIC 9(8) VALUE 0.

       01 WS-WORK-FIELDS.
          05 WS-TODAY          PIC 9(8).
          05 WS-DAILY-PENALTY  PIC S9(9)V99 COMP-3.

       PROCEDURE DIVISION.
       0000-MAIN.
           PERFORM 1000-INIT
           PERFORM 2000-PROCESS UNTIL EOF-REACHED
           PERFORM 3000-SUMMARY
           PERFORM 9000-TERM
           STOP RUN.

       2000-PROCESS.
           READ LOAN-FILE
               AT END
                   SET EOF-REACHED TO TRUE
               NOT AT END
                   IF LOAN-STATUS = 'O' OR OVERDUE-DAYS > 0
                       PERFORM 2100-PROCESS-OVERDUE
                   END-IF
           END-READ.

       2100-PROCESS-OVERDUE.
      *    增加逾期天數
           ADD 1 TO OVERDUE-DAYS
      *    計算每日罰息
           COMPUTE WS-DAILY-PENALTY ROUNDED = 
               PRINCIPAL-BAL * PENALTY-RATE / 365
           ADD WS-DAILY-PENALTY TO ACCUM-PENALTY
      *    更新狀態
           IF LOAN-STATUS NOT = 'O'
               MOVE 'O' TO LOAN-STATUS
           END-IF
      *    根據逾期天數處理
           EVALUATE TRUE
               WHEN OVERDUE-DAYS = 1
                   PERFORM 2200-FIRST-NOTICE
               WHEN OVERDUE-DAYS = 7
                   PERFORM 2210-SECOND-NOTICE
               WHEN OVERDUE-DAYS = 30
                   PERFORM 2220-THIRD-NOTICE
               WHEN OVERDUE-DAYS > 90
                   PERFORM 2300-SEND-COLLECTION
           END-EVALUATE
           REWRITE LOAN-RECORD
           ADD 1 TO WS-OVERDUE-CNT.

       2200-FIRST-NOTICE.
           MOVE LOAN-NO TO NT-LOAN-NO
           MOVE CUST-ID TO NT-CUST-ID
           MOVE '1' TO NT-TYPE
           MOVE OVERDUE-DAYS TO NT-DAYS
           COMPUTE NT-AMT-DUE = PRINCIPAL-BAL + ACCUM-PENALTY
           MOVE WS-TODAY TO NT-SEND-DATE
           WRITE NOTICE-RECORD
           ADD 1 TO WS-NOTICE-CNT.

       2210-SECOND-NOTICE.
           MOVE LOAN-NO TO NT-LOAN-NO
           MOVE CUST-ID TO NT-CUST-ID
           MOVE '2' TO NT-TYPE
           MOVE OVERDUE-DAYS TO NT-DAYS
           COMPUTE NT-AMT-DUE = PRINCIPAL-BAL + ACCUM-PENALTY
           MOVE WS-TODAY TO NT-SEND-DATE
           WRITE NOTICE-RECORD
           ADD 1 TO WS-NOTICE-CNT.

       2220-THIRD-NOTICE.
           MOVE LOAN-NO TO NT-LOAN-NO
           MOVE CUST-ID TO NT-CUST-ID
           MOVE '3' TO NT-TYPE
           MOVE OVERDUE-DAYS TO NT-DAYS
           COMPUTE NT-AMT-DUE = PRINCIPAL-BAL + ACCUM-PENALTY
           MOVE WS-TODAY TO NT-SEND-DATE
           WRITE NOTICE-RECORD
           ADD 1 TO WS-NOTICE-CNT.

       2300-SEND-COLLECTION.
      *    轉催收部門
           MOVE LOAN-NO TO CL-LOAN-NO
           MOVE CUST-ID TO CL-CUST-ID
           MOVE PRINCIPAL-BAL TO CL-PRINCIPAL
           MOVE OVERDUE-INT TO CL-OVERDUE-INT
           MOVE ACCUM-PENALTY TO CL-PENALTY
           MOVE OVERDUE-DAYS TO CL-OVERDUE-DAYS
           MOVE 'P' TO CL-STATUS
           MOVE WS-TODAY TO CL-ASSIGN-DATE
           WRITE COLLECTION-RECORD
           ADD 1 TO WS-COLLECT-CNT.

       3000-SUMMARY.
           DISPLAY '================================'
           DISPLAY '逾期處理批次統計'
           DISPLAY '================================'
           DISPLAY '逾期貸款數: ' WS-OVERDUE-CNT
           DISPLAY '發送通知數: ' WS-NOTICE-CNT
           DISPLAY '轉催收數: ' WS-COLLECT-CNT
           DISPLAY '================================'.

       9000-TERM.
           CLOSE LOAN-FILE
           CLOSE NOTICE-FILE
           CLOSE COLLECTION-FILE.
```

---

## 帳齡分析

### 帳齡分類

| 帳齡 | 分類 | 說明 | 備抵比率 |
|------|------|------|----------|
| 0-30 天 | 正常 | 正常還款 | 1% |
| 31-60 天 | 關注 | 需要關注 | 3% |
| 61-90 天 | 次級 | 有風險 | 10% |
| 91-180 天 | 可疑 | 高風險 | 30% |
| 180+ 天 | 損失 | 壞帳 | 100% |

### 帳齡報表

```cobol
       IDENTIFICATION DIVISION.
       PROGRAM-ID. AGINGRPT.

       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT LOAN-FILE ASSIGN TO LOANMAS
               ORGANIZATION IS INDEXED
               ACCESS MODE IS SEQUENTIAL
               RECORD KEY IS LOAN-NO
               FILE STATUS IS WS-STATUS.
           SELECT RPT-FILE ASSIGN TO AGINGRPT
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-RPT-STATUS.

       DATA DIVISION.
       FILE SECTION.
       FD LOAN-FILE.
       01 LOAN-RECORD.
          COPY LOAN-MASTER.

       FD RPT-FILE.
       01 RPT-RECORD           PIC X(133).

       WORKING-STORAGE SECTION.
       01 WS-AGING-TABLE.
          05 WS-AGE-NORMAL      PIC S9(15)V99 COMP-3 VALUE 0.
          05 WS-AGE-WATCH       PIC S9(15)V99 COMP-3 VALUE 0.
          05 WS-AGE-SUB         PIC S9(15)V99 COMP-3 VALUE 0.
          05 WS-AGE-DOUBT       PIC S9(15)V99 COMP-3 VALUE 0.
          05 WS-AGE-LOSS        PIC S9(15)V99 COMP-3 VALUE 0.

       01 WS-PROVISION-TABLE.
          05 WS-PROV-NORMAL     PIC S9(13)V99 COMP-3 VALUE 0.
          05 WS-PROV-WATCH      PIC S9(13)V99 COMP-3 VALUE 0.
          05 WS-PROV-SUB        PIC S9(13)V99 COMP-3 VALUE 0.
          05 WS-PROV-DOUBT      PIC S9(13)V99 COMP-3 VALUE 0.
          05 WS-PROV-LOSS       PIC S9(13)V99 COMP-3 VALUE 0.

       01 WS-RPT-LINE           PIC X(133).
       01 WS-EOF                PIC X VALUE 'N'.
          88 EOF-REACHED        VALUE 'Y'.

       PROCEDURE DIVISION.
       0000-MAIN.
           PERFORM 1000-INIT
           PERFORM 2000-PROCESS UNTIL EOF-REACHED
           PERFORM 3000-CALC-PROVISION
           PERFORM 4000-PRINT-REPORT
           PERFORM 9000-TERM
           STOP RUN.

       2000-PROCESS.
           READ LOAN-FILE
               AT END
                   SET EOF-REACHED TO TRUE
               NOT AT END
                   PERFORM 2100-CLASSIFY-AGING
           END-READ.

       2100-CLASSIFY-AGING.
           EVALUATE TRUE
               WHEN OVERDUE-DAYS <= 30
                   ADD PRINCIPAL-BAL TO WS-AGE-NORMAL
                   COMPUTE WS-PROV-NORMAL = 
                       WS-PROV-NORMAL + PRINCIPAL-BAL * 0.01
               WHEN OVERDUE-DAYS <= 60
                   ADD PRINCIPAL-BAL TO WS-AGE-WATCH
                   COMPUTE WS-PROV-WATCH = 
                       WS-PROV-WATCH + PRINCIPAL-BAL * 0.03
               WHEN OVERDUE-DAYS <= 90
                   ADD PRINCIPAL-BAL TO WS-AGE-SUB
                   COMPUTE WS-PROV-SUB = 
                       WS-PROV-SUB + PRINCIPAL-BAL * 0.10
               WHEN OVERDUE-DAYS <= 180
                   ADD PRINCIPAL-BAL TO WS-AGE-DOUBT
                   COMPUTE WS-PROV-DOUBT = 
                       WS-PROV-DOUBT + PRINCIPAL-BAL * 0.30
               WHEN OTHER
                   ADD PRINCIPAL-BAL TO WS-AGE-LOSS
                   COMPUTE WS-PROV-LOSS = 
                       WS-PROV-LOSS + PRINCIPAL-BAL * 1.00
           END-EVALUATE.

       4000-PRINT-REPORT.
           MOVE SPACES TO WS-RPT-LINE
           STRING '放款帳齡分析報表' DELIMITED SIZE
               INTO WS-RPT-LINE
           WRITE RPT-RECORD FROM WS-RPT-LINE
           
           MOVE SPACES TO WS-RPT-LINE
           STRING '帳齡期間       貸款餘額       備抵金額' 
               DELIMITED SIZE INTO WS-RPT-LINE
           WRITE RPT-RECORD FROM WS-RPT-LINE
           
           PERFORM 4100-PRINT-AGING-LINE.
```

---

## 存款放款整合批次處理

### 日終批次時序

```
時間          批次程序                    說明
─────────────────────────────────────────────────────
18:00        營業日切換                  關閉線上交易
18:30        交易資料排序                依帳號排序交易明細
19:00        存款交易彙總                彙整當日存款交易
19:30        放款還款扣款                執行扣款批次
20:00        存款利息計算                計算存款利息
20:30        放款利息計算                計算放款利息
21:00        逾期處理                    判定逾期、計算罰息
21:30        餘額更新                    更新主檔餘額
22:00        內部對帳                    明細 vs 總帳
22:30        報表生成                    產生日報表
23:00        跨系統對帳                  與外圍系統對帳
00:00        次日準備                    開啟新營業日
```

### 存款批次流程詳解

```
┌─────────────────────────────────────────────────┐
│              存款日終批次流程                     │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ 讀取交易 │───>│ 排序交易 │───>│ 彙總交易 │  │
│  │ 明細檔   │    │ (SORT)   │    │ (按帳號) │  │
│  └──────────┘    └──────────┘    └──────────┘  │
│                                        │        │
│                                        ▼        │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ 產生日報 │<───│ 更新餘額 │<───│ 計算利息 │  │
│  │ 表       │    │          │    │          │  │
│  └──────────┘    └──────────┘    └──────────┘  │
│       │                                        │
│       ▼                                        │
│  ┌──────────┐                                  │
│  │ 對帳處理 │                                  │
│  │          │                                  │
│  └──────────┘                                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 放款批次流程詳解

```
┌─────────────────────────────────────────────────┐
│              放款日終批次流程                     │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ 讀取貸款 │───>│ 檢查扣款 │───>│ 執行扣款 │  │
│  │ 主檔     │    │ 日       │    │          │  │
│  └──────────┘    └──────────┘    └──────────┘  │
│                                        │        │
│                      ┌─────────────────┼────┐   │
│                      ▼                 ▼    │   │
│               ┌──────────┐       ┌──────────┐ │   │
│               │ 扣款成功 │       │ 扣款失敗 │ │   │
│               └──────────┘       └──────────┘ │   │
│                      │                 │      │   │
│                      ▼                 ▼      │   │
│               ┌──────────┐       ┌──────────┐ │   │
│               │ 更新還款 │       │ 標記逾期 │ │   │
│               │ 計畫     │       │ 計算罰息 │ │   │
│               └──────────┘       └──────────┘ │   │
│                      │                 │      │   │
│                      └────────┬────────┘      │   │
│                               ▼               │   │
│                        ┌──────────┐           │   │
│                        │ 產生報表 │           │   │
│                        └──────────┘           │   │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 月底特殊處理

```cobol
      * 月底批次處理邏輯
       8000-MONTH-END-PROCESS.
      *    檢查是否為月底
           IF WS-LAST-DAY-OF-MONTH
      *        存款系統
               PERFORM 8100-DEPOSIT-MONTH-END
      *        放款系統
               PERFORM 8200-LOAN-MONTH-END
      *        產生月報表
               PERFORM 8300-MONTHLY-REPORTS
           END-IF.

       8100-DEPOSIT-MONTH-END.
      *    利息入帳
           PERFORM 8110-POST-INTEREST
      *    扣收維護費
           PERFORM 8120-CHARGE-MAINTENANCE-FEE
      *    低餘額管理費
           PERFORM 8130-LOW-BALANCE-FEE
      *    更新利率（如適用）
           PERFORM 8140-UPDATE-RATES.

       8200-LOAN-MONTH-END.
      *    更新還款計畫
           PERFORM 8210-UPDATE-REPAY-SCHEDULE
      *    產生催收名單
           PERFORM 8220-GENERATE-COLLECTION-LIST
      *    帳齡分析
           PERFORM 8230-AGING-ANALYSIS
      *    備抵呆帳計算
           PERFORM 8240-CALC-PROVISION.
```

---

## BA 實務應用

### 需求分析重點

| 系統 | 關注點 | 常見問題 |
|------|--------|----------|
| 存款 | 利率計算、餘額維護 | 計息方式、入帳時點 |
| 放款 | 還款邏輯、逾期處理 | 還款方式、罰息計算 |
| 整合 | 資料一致性 | 對帳差異、時間同步 |

### 需求訪談檢核清單

#### 存款系統需求訪談

```
□ 帳戶類型與屬性
  - 支援哪些帳戶類型？
  - 各類型的計息規則？
  - 是否支援多幣別？

□ 利息計算
  - 計息基準 (ACT/360, ACT/365)？
  - 計息頻率（日計息、月計息）？
  - 入帳時點（月底、季底）？
  - 分段計息規則？

□ 交易處理
  - 單筆交易限額？
  - 每日累計限額？
  - 透支額度與利率？

□ 報表需求
  - 需要哪些日報表？
  - 需要哪些月報表？
  - 客戶對帳單格式？
```

#### 放款系統需求訪談

```
□ 貸款產品
  - 支援哪些貸款類型？
  - 各類型的利率結構？
  - 還款方式（本息平均、本金平均）？

□ 還款處理
  - 扣款時點（每月幾號）？
  - 扣款失敗如何處理？
  - 提前還款規則？

□ 逾期處理
  - 逾期判定標準？
  - 罰息計算方式？
  - 催收流程？

□ 帳務處理
  - 利息認列方式？
  - 備抵呆帳政策？
  - 帳齡分類標準？
```

### 常見需求範例

#### 需求 1：新增「階梯利率」定存產品

```
業務需求：
- 定存金額越高，利率越高
- 需要自動計算到期利息
- 支援自動續存

技術分析：
1. 新增利率區間表
2. 修改定存開戶程式
3. 修改利息計算邏輯
4. 更新到期處理批次

影響範圍：
- FD-MASTER（新增利率區間欄位）
- 開戶畫面
- 計息批次程式
- 到期處理批次
- 定存對帳單
```

#### 需求 2：放款「寬限期」功能

```
業務需求：
- 貸款前 N 個月只還利息不還本金
- 寬限期後開始本息攤還
- 需要調整還款計畫

技術分析：
1. LOAN-MASTER 新增寬限期欄位
2. 還款計畫產生邏輯修改
3. 扣款批次程式修改
4. 還款通知書調整

影響範圍：
- LOAN-MASTER（新增 GRACE-PERIOD 欄位）
- REPAY-SCHEDULE（計算邏輯調整）
- 扣款批次程式
- 還款通知報表
```

### 問題診斷案例

#### 案例 1：存款利息計算差異

```
問題描述：
客戶投訴利息金額與預期不符

診斷步驟：
1. 確認帳戶類型與計息規則
2. 檢查計息基準 (ACT/360 vs ACT/365)
3. 確認利率是否正確載入
4. 檢查是否有凍結金額影響計息
5. 確認計息起訖日期
6. 檢查是否有部分提款影響

常見原因：
- 利率變更未生效
- 計息基準誤解
- 四捨五入差異
- 凍結金額未計息
```

#### 案例 2：還款扣款失敗

```
問題描述：
客戶反映還款帳戶有足夠餘額但仍扣款失敗

診斷步驟：
1. 確認扣款執行時間
2. 檢查當時帳戶實際餘額
3. 確認是否有其他扣款優先執行
4. 檢查可用餘額 vs 帳戶餘額
5. 確認是否有凍結金額

常見原因：
- 扣款時點餘額不足
- 有預借現金或暫授權佔用額度
- 其他自動扣款先執行
- 系統時間差導致餘額不一致
```

### 測試案例設計

#### 存款系統測試案例

```
測試案例編號: DEP-001
測試項目: 活期存款利息計算
前置條件: 帳戶餘額 1,000,000，利率 0.5%

測試步驟:
1. 執行日終批次
2. 檢查累計利息
3. 執行月底批次
4. 檢查利息入帳

預期結果:
- 每日利息 = 1,000,000 × 0.005 / 365 = 13.70
- 月底累計利息約 410.96（30天）
- 利息正確入帳至帳帳戶

測試案例編號: DEP-002
測試項目: 透支計息
前置條件: 帳戶餘額 -50,000，透支利率 8%

預期結果:
- 每日罰息 = 50,000 × 0.08 / 365 = 10.96
- 罰息正確計算並累計
```

#### 放款系統測試案例

```
測試案例編號: LOAN-001
測試項目: 正常還款扣款
前置條件: 貸款餘額 500,000，每月應還 25,000
         還款帳戶餘額 30,000

測試步驟:
1. 設定扣款日為今日
2. 執行還款批次
3. 檢查還款帳戶餘額
4. 檢查貸款餘額

預期結果:
- 還款帳戶扣除 25,000，餘額 5,000
- 貸款餘額減少對應本金
- 還款計畫更新為已還款

測試案例編號: LOAN-002
測試項目: 逾期處理
前置條件: 貸款逾期 31 天
         本金餘額 500,000，罰息利率 12%

預期結果:
- 逾期天數 = 31
- 每日罰息正確計算
- 產生逾期通知記錄
- 帳齡分類為「關注」
```

---

## 練習題

### 題目 1
設計一個「存款帳戶餘額變動通知」功能的需求規格，包含：
- 觸發條件
- 通知方式
- 系統影響範圍

### 題目 2
某客戶申請「提前清償房貸」，請設計：
- 業務流程
- 計算邏輯（違約金、利息計算至清償日）
- 系統修改點

### 題目 3
設計存款與放款系統的整合對帳機制，確保：
- 客戶在兩系統的資料一致
- 交易金額與總帳相符
- 利息計算無遺漏

### 題目 4
分析以下情境的技術影響：

```
需求：新增「彈性還款」功能
說明：客戶可在還款日後 7 天內還款，不計逾期

請列出：
1. 需要修改的檔案/欄位
2. 需要修改的程式
3. 需要調整的批次
4. 需要新增的報表
```

---

## 重點回顧

| 系統 | 核心功能 | 核心檔案 | 關鍵批次 |
|------|----------|----------|----------|
| 存款 | 開戶、存提款、計息 | 帳戶主檔、交易明細 | 利息計算、對帳 |
| 放款 | 貸款、還款、逾期 | 貸款主檔、還款計畫 | 還款扣款、逾期處理 |

| 概念 | 說明 |
|------|------|
| 逾期處理 | 判定逾期、計算罰息、發送通知、轉催收 |
| 帳齡分析 | 按逾期天數分類，計算備抵呆帳 |
| 寬限期 | 貸款初期只還利息不還本金 |

---

## 延伸閱讀

- [Lesson 4-3：日終批次處理流程](lesson-4-3-daily-batch.md)
- [Lesson 4-4：對帳與報表生成](lesson-4-4-reconciliation.md)
- [Lesson 4-6：跨系統資料交換](lesson-4-6-data-exchange.md)
- [Lesson 4-2：計息邏輯實現](lesson-4-2-interest-calc.md)
