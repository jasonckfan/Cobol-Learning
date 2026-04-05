# Lesson 4-6：跨系統資料交換

## 學習目標

- 理解銀行跨系統資料交換的概念與架構
- 認識 SWIFT 訊息格式與解析方法
- 了解清算系統介接與對帳處理
- 能夠分析跨系統介接需求

---

## 為什麼需要跨系統資料交換？

### 業務情境

現代銀行業務需要與多個外部系統互動：

| 情境 | 對象 | 資料類型 |
|------|------|----------|
| 跨行匯款 | 其他銀行 | 匯款指示、清算資料 |
| 證券交易 | 證券系統 | 交易指示、對帳資料 |
| 外匯交易 | 外匯系統 | 匯率、交易資料 |
| 清算結算 | 清算組織 | 清算檔、對帳單 |
| 監管報送 | 監管機構 | 法定報表、交易資料 |
| 內部整合 | 其他系統 | 帳務、客戶資料 |

### 資料交換模式

```
┌─────────────────────────────────────────────────────────┐
│                  資料交換模式                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  即時模式 (Real-time)          批次模式 (Batch)         │
│  ┌──────────┐                  ┌──────────┐            │
│  │ 線上交易 │                  │ 日終批次 │            │
│  │ 即時回應 │                  │ 大量資料 │            │
│  └──────────┘                  └──────────┘            │
│       │                              │                 │
│       ▼                              ▼                 │
│  ┌──────────┐                  ┌──────────┐            │
│  │ MQ/API   │                  │ 檔案傳輸 │            │
│  │ 訊息佇列 │                  │ SFTP/MFT │            │
│  └──────────┘                  └──────────┘            │
│                                                         │
│  適用情境：                    適用情境：               │
│  - ATM 交易                   - 日終對帳               │
│  - 線上轉帳                   - 清算結算               │
│  - 查詢服務                   - 監管報送               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## SWIFT 訊息格式

### 什麼是 SWIFT？

SWIFT（Society for Worldwide Interbank Financial Telecommunication）是全球銀行間金融通訊協會，提供標準化的金融訊息格式。

### SWIFT 訊息類別

| 類別 | 名稱 | 用途 |
|------|------|------|
| MT0xx | System Messages | 系統訊息 |
| MT1xx | Customer Transfers | 客戶匯款 |
| MT2xx | Financial Institution Transfers | 銀行間匯款 |
| MT3xx | Foreign Exchange | 外匯交易 |
| MT4xx | Collections | 託收 |
| MT5xx | Securities | 證券交易 |
| MT6xx | Treasury Markets | 財務市場 |
| MT7xx | Documentary Credits | 信用狀 |
| MT8xx | Travellers Cheques | 旅行支票 |
| MT9xx | Cash Management | 現金管理/對帳 |

### 常見 SWIFT 訊息類型

| 類型 | 說明 | 用途 |
|------|------|------|
| MT103 | 單筆客戶匯款 | 跨境匯款 |
| MT103+ | 單筆客戶匯款（加強版） | 更詳細資訊 |
| MT202 | 銀行間匯款 | 銀行清算 |
| MT202COV | 覆蓋付款 | MT103 的對應銀行付款 |
| MT910 | 借記通知 | 收款確認 |
| MT940 | 客戶對帳單 | 客戶對帳 |
| MT950 | 對帳單 | 銀行帳戶對帳 |
| MT900 | 貸記通知 | 付款確認 |
| MT300 | 外匯交易確認 | 外匯交易 |

### MT103 訊息結構詳解

```
{1:F01ABCCHKHHAXXX0000000000}         <-- Basic Header (基本標頭)
{2:I103DEUTDEFFXXXXN}                 <-- Application Header (應用標頭)
{4:                                   <-- Text Block (正文區塊)
:20:REFERENCE123                      <-- 發送行參考編號
:23B:CRED                             <-- 銀行作業代碼 (CRED=匯入)
:32A:240404USD10000,00               <-- 金額/日期/幣別
:33B:USD10000,00                      <-- 交易貨幣/金額
:50K:/1234567890                      <-- 匯款人資訊
JOHN DOE
123 MAIN STREET
HONG KONG
:52A:ABCCHKHH                         <-- 匯款銀行
:57A:DEUTDEFF                         <-- 收款銀行代理行
:59:/9876543210                       <-- 受益人資訊
JANE SMITH
456 OAK AVENUE
BERLIN
:70:INVOICE PAYMENT                   <-- 匯款用途/備註
:71A:SHA                              <-- 費用分擔 (SHA=共同分擔)
-}                                    <-- 結束標記
{5:}                                  <-- Trailers (結尾區塊)
```

### MT950 對帳單結構

```
{1:F01ABCCHKHHAXXX0000000000}
{2:I950DEUTDEFFXXXXN}
{4:
:20:STMT001
:25:12345678                          <-- 帳號
:28C:1/1                              <-- 對帳單序號
:60F:C240101USD100000,00             <-- 期初餘額
:61:2401010101C1000,00NTRFREF001     <-- 交易記錄
:86:INCOMING TRANSFER
:61:2401020202D500,00NTRFREF002
:86:OUTGOING TRANSFER
:62F:C240131USD100500,00             <-- 期末餘額
-}
```

---

## SWIFT 訊息解析程式

### MT103 解析範例

```cobol
       IDENTIFICATION DIVISION.
       PROGRAM-ID. MT103PAR.

       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT SWIFT-FILE ASSIGN TO SWIFTIN
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-SWIFT-STATUS.
           SELECT OUT-FILE ASSIGN TO SWIFTOUT
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-OUT-STATUS.

       DATA DIVISION.
       FILE SECTION.
       FD SWIFT-FILE.
       01 SWIFT-RECORD        PIC X(2000).

       FD OUT-FILE.
       01 OUT-RECORD.
          05 OUT-MSG-TYPE     PIC 9(3).
          05 OUT-MSG-ID       PIC X(20).
          05 OUT-VALUE-DATE   PIC 9(8).
          05 OUT-CURR-CODE    PIC XXX.
          05 OUT-AMOUNT       PIC S9(13)V99.
          05 OUT-SENDER-BIC   PIC X(11).
          05 OUT-RECEIVER-BIC PIC X(11).
          05 OUT-ORDERING-CUST PIC X(105).
          05 OUT-BENEFICIARY  PIC X(105).
          05 OUT-REF-NO       PIC X(16).

       WORKING-STORAGE SECTION.
       01 WS-FLAGS.
          05 WS-EOF           PIC X VALUE 'N'.
             88 EOF-REACHED   VALUE 'Y'.

       01 WS-PARSE-FIELDS.
          05 WS-TAG-20        PIC X(16).
          05 WS-TAG-32A.
             10 WS-32A-DATE   PIC 9(6).
             10 WS-32A-CURR   PIC XXX.
             10 WS-32A-AMT    PIC X(15).
          05 WS-TAG-50K       PIC X(105).
          05 WS-TAG-59        PIC X(105).
          05 WS-TAG-70        PIC X(140).
          05 WS-HEADER-2.
             10 WS-MSG-TYPE   PIC 9(3).
             10 WS-RECEIVER   PIC X(12).

       01 WS-WORK-FIELDS.
          05 WS-POS           PIC 9(4).
          05 WS-TAG-START     PIC 9(4).
          05 WS-TAG-END       PIC 9(4).
          05 WS-TEMP          PIC X(2000).

       PROCEDURE DIVISION.
       0000-MAIN.
           PERFORM 1000-INIT
           PERFORM 2000-PROCESS UNTIL EOF-REACHED
           PERFORM 9000-TERM
           STOP RUN.

       2000-PROCESS.
           READ SWIFT-FILE
               AT END
                   SET EOF-REACHED TO TRUE
               NOT AT END
                   PERFORM 2100-PARSE-MESSAGE
           END-READ.

       2100-PARSE-MESSAGE.
      *    解析訊息類型
           IF SWIFT-RECORD(1:2) = '{2'
               MOVE SWIFT-RECORD(4:3) TO OUT-MSG-TYPE
           END-IF
           
      *    解析各標籤
           PERFORM 2200-FIND-TAG-20
           PERFORM 2300-FIND-TAG-32A
           PERFORM 2400-FIND-TAG-50K
           PERFORM 2500-FIND-TAG-59
           
      *    寫出解析結果
           WRITE OUT-RECORD.

       2200-FIND-TAG-20.
      *    搜尋 :20: 標籤
           INSPECT SWIFT-RECORD 
               TALLYING WS-POS FOR CHARACTERS 
               BEFORE INITIAL ':20:'
           IF WS-POS < FUNCTION LENGTH(SWIFT-RECORD)
               ADD 4 TO WS-POS
               MOVE SWIFT-RECORD(WS-POS:16) TO WS-TAG-20
               MOVE WS-TAG-20 TO OUT-MSG-ID
           END-IF.

       2300-FIND-TAG-32A.
      *    搜尋 :32A: 標籤 (日期/幣別/金額)
           INSPECT SWIFT-RECORD 
               TALLYING WS-POS FOR CHARACTERS 
               BEFORE INITIAL ':32A:'
           IF WS-POS < FUNCTION LENGTH(SWIFT-RECORD)
               ADD 4 TO WS-POS
      *        解析日期 (YYMMDD)
               MOVE SWIFT-RECORD(WS-POS:6) TO WS-32A-DATE
      *        轉換為 YYYYMMDD 格式
               STRING '20' WS-32A-DATE 
                   DELIMITED SIZE INTO OUT-VALUE-DATE
      *        解析幣別
               ADD 6 TO WS-POS
               MOVE SWIFT-RECORD(WS-POS:3) TO OUT-CURR-CODE
      *        解析金額
               ADD 3 TO WS-POS
               PERFORM 2310-PARSE-AMOUNT
           END-IF.

       2310-PARSE-AMOUNT.
      *    SWIFT 金額格式: 10000,00 (逗號為小數點)
           MOVE 0 TO WS-TAG-END
           INSPECT SWIFT-RECORD(WS-POS:20) 
               TALLYING WS-TAG-END FOR CHARACTERS 
               BEFORE INITIAL X'0A'
           MOVE SWIFT-RECORD(WS-POS:WS-TAG-END) TO WS-TEMP
      *    將逗號轉為小數點
           INSPECT WS-TEMP REPLACING ',' BY '.'
           COMPUTE OUT-AMOUNT = FUNCTION NUMVAL(WS-TEMP).
```

---

## 清算系統介接

### 常見清算系統

| 系統 | 地區 | 說明 | 特點 |
|------|------|------|------|
| CHATS | 香港 | 即時支付清算系統 | 即時清算、多幣別 |
| CNAPS | 中國 | 大小額支付系統 | 大額即時、小額批次 |
| Fedwire | 美國 | 聯邦資金轉帳系統 | 即時清算 |
| TARGET2 | 歐洲 | 歐元區支付系統 | 跨境歐元清算 |
| FPS | 香港/英國 | 快速支付系統 | 即時到帳、小額 |
| SWIFT gpi | 全球 | 全球支付創新 | 追蹤、透明、快速 |

### 清算處理流程

```
┌─────────────────────────────────────────────────────────┐
│                  清算處理流程                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │ 核心系統 │───>│ 產生清   │───>│ 格式轉換 │          │
│  │ 交易資料 │    │ 算檔案   │    │ (標準化) │          │
│  └──────────┘    └──────────┘    └──────────┘          │
│                                        │                │
│                                        ▼                │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │ 對帳處理 │<───│ 接收回覆 │<───│ 發送至清 │          │
│  │          │    │          │    │ 算中心   │          │
│  └──────────┘    └──────────┘    └──────────┘          │
│       │                                                │
│       ▼                                                │
│  ┌──────────┐                                          │
│  │ 更新帳   │                                          │
│  │ 務狀態   │                                          │
│  └──────────┘                                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 清算檔案格式

```cobol
      * CHATS 清算交易記錄
       01 CHATS-RECORD.
          05 CH-RECORD-TYPE    PIC X.          *> R=傳送, C=接收
          05 CH-TRANS-DATE     PIC 9(8).       *> 交易日期
          05 CH-TRANS-TIME     PIC 9(6).       *> 交易時間
          05 CH-TRANS-TYPE     PIC X(4).       *> 交易類型
          05 CH-STATUS         PIC X.          *> 狀態
             88 CH-SUCCESS     VALUE 'S'.
             88 CH-PENDING     VALUE 'P'.
             88 CH-REJECTED    VALUE 'R'.
          05 CH-SENDER-BIC     PIC X(11).      *> 發送銀行 BIC
          05 CH-RECEIVER-BIC   PIC X(11).      *> 接收銀行 BIC
          05 CH-AMOUNT         PIC S9(15)V99 COMP-3. *> 金額
          05 CH-CURR-CODE      PIC XXX.        *> 幣別
          05 CH-VALUE-DATE     PIC 9(8).       *> 起息日
          05 CH-REF-NO         PIC X(16).      *> 參考編號
          05 CH-END-TO-END-ID  PIC X(35).      *> 端對端識別碼
          05 CH-ACCT-NO        PIC X(34).      *> 帳號
          05 CH-BENEFICIARY    PIC X(140).     *> 受益人資訊
          05 CH-PURPOSE        PIC X(140).     *> 交易用途
          05 CH-REJECT-CODE    PIC X(4).       *> 退回代碼
          05 CH-FILLER         PIC X(100).     *> 保留欄位

      * CNAPS 清算記錄
       01 CNAPS-RECORD.
          05 CN-MSG-TYPE       PIC X(4).       *> 訊息類型
          05 CN-TRANS-DATE     PIC 9(8).       *> 交易日期
          05 CN-TRANS-TIME     PIC 9(6).       *> 交易時間
          05 CN-PAYER-ACCT     PIC X(32).      *> 付款人帳號
          05 CN-PAYER-NAME     PIC X(60).      *> 付款人名稱
          05 CN-PAYER-BANK     PIC X(14).      *> 付款行號
          05 CN-PAYEE-ACCT     PIC X(32).      *> 收款人帳號
          05 CN-PAYEE-NAME     PIC X(60).      *> 收款人名稱
          05 CN-PAYEE-BANK     PIC X(14).      *> 收款行號
          05 CN-AMOUNT         PIC S9(15)V99 COMP-3. *> 金額
          05 CN-PURPOSE        PIC X(200).     *> 用途
          05 CN-REF-NO         PIC X(32).      *> 參考編號
          05 CN-STATUS         PIC X.          *> 狀態
```

### 清算檔案處理批次

```cobol
       IDENTIFICATION DIVISION.
       PROGRAM-ID. CLRPROC.

       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT CLR-FILE ASSIGN TO CLRIN
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-CLR-STATUS.
           SELECT ACCT-FILE ASSIGN TO ACCTMAS
               ORGANIZATION IS INDEXED
               ACCESS MODE IS RANDOM
               RECORD KEY IS ACCT-NO
               FILE STATUS IS WS-ACCT-STATUS.
           SELECT TRANS-FILE ASSIGN TO TRANSLOG
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-TRANS-STATUS.
           SELECT REJECT-FILE ASSIGN TO REJECT
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-REJECT-STATUS.

       DATA DIVISION.
       FILE SECTION.
       FD CLR-FILE.
       01 CLR-RECORD.
          COPY CHATS-RECORD.

       FD ACCT-FILE.
       01 ACCT-RECORD.
          COPY DEPOSIT-MASTER.

       FD TRANS-FILE.
       01 TRANS-RECORD.
          05 TR-ACCT-NO        PIC X(16).
          05 TR-TRANS-DATE     PIC 9(8).
          05 TR-TRANS-TIME     PIC 9(6).
          05 TR-TRANS-TYPE     PIC XX.
          05 TR-AMOUNT         PIC S9(13)V99.
          05 TR-BAL-BEFORE     PIC S9(13)V99.
          05 TR-BAL-AFTER      PIC S9(13)V99.
          05 TR-REF-NO         PIC X(20).
          05 TR-CHANNEL        PIC X.
          05 TR-REMARK         PIC X(40).

       FD REJECT-FILE.
       01 REJECT-RECORD.
          05 RJ-REF-NO         PIC X(16).
          05 RJ-REASON         PIC X(4).
          05 RJ-AMOUNT         PIC S9(13)V99.
          05 RJ-ACCT-NO        PIC X(34).
          05 RJ-DESC           PIC X(50).

       WORKING-STORAGE SECTION.
       01 WS-COUNTERS.
          05 WS-TOTAL-CNT      PIC 9(8) VALUE 0.
          05 WS-SUCCESS-CNT    PIC 9(8) VALUE 0.
          05 WS-REJECT-CNT     PIC 9(8) VALUE 0.
          05 WS-TOTAL-AMT      PIC S9(17)V99 COMP-3 VALUE 0.

       01 WS-FLAGS.
          05 WS-EOF            PIC X VALUE 'N'.
             88 EOF-REACHED    VALUE 'Y'.

       PROCEDURE DIVISION.
       0000-MAIN.
           PERFORM 1000-INIT
           PERFORM 2000-PROCESS UNTIL EOF-REACHED
           PERFORM 3000-SUMMARY
           PERFORM 9000-TERM
           STOP RUN.

       2000-PROCESS.
           READ CLR-FILE
               AT END
                   SET EOF-REACHED TO TRUE
               NOT AT END
                   ADD 1 TO WS-TOTAL-CNT
                   PERFORM 2100-PROCESS-CLEARING
           END-READ.

       2100-PROCESS-CLEARING.
           EVALUATE CH-RECORD-TYPE
               WHEN 'C'                        *> 收款 (入帳)
                   PERFORM 2200-PROCESS-INCOMING
               WHEN 'R'                        *> 退回
                   PERFORM 2300-PROCESS-RETURN
           END-EVALUATE.

       2200-PROCESS-INCOMING.
      *    查找帳戶
           MOVE CH-ACCT-NO TO ACCT-NO
           READ ACCT-FILE
               INVALID KEY
                   PERFORM 2210-REJECT-ACCT-NOT-FOUND
               NOT INVALID KEY
                   PERFORM 2220-POST-TRANS
           END-READ.

       2220-POST-TRANS.
      *    檢查帳戶狀態
           IF ACCT-STATUS NOT = 'A'
               PERFORM 2230-REJECT-ACCT-STATUS
           ELSE
      *        更新餘額
               ADD CH-AMOUNT TO ACCT-BALANCE
               ADD CH-AMOUNT TO AVAIL-BAL
               MOVE CH-TRANS-DATE TO LAST-TRX-DATE
               REWRITE ACCT-RECORD
      *        寫入交易明細
               PERFORM 2240-WRITE-TRANS-LOG
               ADD 1 TO WS-SUCCESS-CNT
               ADD CH-AMOUNT TO WS-TOTAL-AMT
           END-IF.

       2240-WRITE-TRANS-LOG.
           MOVE ACCT-NO TO TR-ACCT-NO
           MOVE CH-TRANS-DATE TO TR-TRANS-DATE
           MOVE CH-TRANS-TIME TO TR-TRANS-TIME
           MOVE 'CI' TO TR-TRANS-TYPE      *> Clearing Incoming
           MOVE CH-AMOUNT TO TR-AMOUNT
           MOVE ACCT-BALANCE TO TR-BAL-AFTER
           MOVE CH-REF-NO TO TR-REF-NO
           MOVE 'C' TO TR-CHANNEL
           MOVE 'CHATS INCOMING' TO TR-REMARK
           WRITE TRANS-RECORD.

       2210-REJECT-ACCT-NOT-FOUND.
           ADD 1 TO WS-REJECT-CNT
           MOVE CH-REF-NO TO RJ-REF-NO
           MOVE 'ACCT' TO RJ-REASON
           MOVE CH-AMOUNT TO RJ-AMOUNT
           MOVE CH-ACCT-NO TO RJ-ACCT-NO
           MOVE 'ACCOUNT NOT FOUND' TO RJ-DESC
           WRITE REJECT-RECORD.

       3000-SUMMARY.
           DISPLAY '================================'
           DISPLAY '清算處理批次統計'
           DISPLAY '================================'
           DISPLAY '總筆數: ' WS-TOTAL-CNT
           DISPLAY '成功筆數: ' WS-SUCCESS-CNT
           DISPLAY '退回筆數: ' WS-REJECT-CNT
           DISPLAY '總金額: ' WS-TOTAL-AMT
           DISPLAY '================================'.
```

---

## 對帳處理

### 清算對帳流程

```
┌─────────────────────────────────────────────────────────┐
│                  清算對帳流程                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐           ┌─────────────┐             │
│  │ 核心系統    │           │ 清算系統    │             │
│  │ 交易明細    │           │ 交易明細    │             │
│  └──────┬──────┘           └──────┬──────┘             │
│         │                         │                    │
│         ▼                         ▼                    │
│  ┌─────────────┐           ┌─────────────┐             │
│  │ 排序        │           │ 排序        │             │
│  │ (日期/參考號)│           │ (日期/參考號)│             │
│  └──────┬──────┘           └──────┬──────┘             │
│         │                         │                    │
│         └───────────┬─────────────┘                    │
│                     ▼                                  │
│            ┌─────────────┐                             │
│            │ 逐筆比對    │                             │
│            └──────┬──────┘                             │
│                   │                                    │
│         ┌─────────┼─────────┐                          │
│         ▼         ▼         ▼                          │
│    ┌────────┐ ┌────────┐ ┌────────┐                   │
│    │ 匹配   │ │ 差異   │ │ 單方   │                   │
│    │        │ │ (金額) │ │ 存在   │                   │
│    └────────┘ └────────┘ └────────┘                   │
│                                                       │
└───────────────────────────────────────────────────────┘
```

### 對帳記錄結構

```cobol
      * 對帳記錄
       01 RECON-RECORD.
          05 RECON-TYPE        PIC X.          *> 類型 (D=借記, C=貸記)
          05 RECON-TRANS-DATE  PIC 9(8).       *> 交易日期
          05 RECON-VALUE-DATE  PIC 9(8).       *> 起息日
          05 RECON-ACCT-NO     PIC X(34).      *> 帳號
          05 RECON-AMOUNT      PIC S9(15)V99 COMP-3. *> 金額
          05 RECON-CURR-CODE   PIC XXX.        *> 幣別
          05 RECON-REF-NO      PIC X(16).      *> 參考編號
          05 RECON-ENTRY-DESC  PIC X(50).      *> 摘要
          05 RECON-BALANCE     PIC S9(15)V99 COMP-3. *> 餘額
          05 RECON-STATUS      PIC X.          *> 對帳狀態
             88 RECON-MATCHED  VALUE 'M'.
             88 RECON-PENDING  VALUE 'P'.
             88 RECON-DIFF     VALUE 'D'.

      * 對帳差異記錄
       01 RECON-DIFF-RECORD.
          05 RD-REF-NO         PIC X(16).      *> 參考編號
          05 RD-TRANS-DATE     PIC 9(8).       *> 交易日期
          05 RD-TYPE           PIC X.          *> 差異類型
             88 RD-ONLY-CORE   VALUE 'C'.      *> 僅核心系統有
             88 RD-ONLY-CLR    VALUE 'L'.      *> 僅清算系統有
             88 RD-AMT-DIFF    VALUE 'A'.      *> 金額差異
             88 RD-DATE-DIFF   VALUE 'D'.      *> 日期差異
          05 RD-CORE-AMT       PIC S9(15)V99 COMP-3. *> 核心系統金額
          05 RD-CLR-AMT        PIC S9(15)V99 COMP-3. *> 清算系統金額
          05 RD-DIFF-AMT       PIC S9(15)V99 COMP-3. *> 差異金額
          05 RD-REMARK         PIC X(100).     *> 說明
```

### 對帳批次程式

```cobol
       IDENTIFICATION DIVISION.
       PROGRAM-ID. CLRRECON.

       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT CORE-FILE ASSIGN TO COREIN
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-CORE-STATUS.
           SELECT CLR-FILE ASSIGN TO CLRIN
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-CLR-STATUS.
           SELECT MATCH-FILE ASSIGN TO MATCH
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-MATCH-STATUS.
           SELECT DIFF-FILE ASSIGN TO DIFF
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-DIFF-STATUS.

       DATA DIVISION.
       FILE SECTION.
       FD CORE-FILE.
       01 CORE-RECORD.
          05 CR-REF-NO         PIC X(16).
          05 CR-TRANS-DATE     PIC 9(8).
          05 CR-ACCT-NO        PIC X(34).
          05 CR-AMOUNT         PIC S9(15)V99 COMP-3.
          05 CR-TYPE           PIC X.

       FD CLR-FILE.
       01 CLR-RECORD.
          COPY RECON-RECORD.

       FD MATCH-FILE.
       01 MATCH-RECORD.
          05 MT-REF-NO         PIC X(16).
          05 MT-TRANS-DATE     PIC 9(8).
          05 MT-CORE-AMT       PIC S9(15)V99.
          05 MT-CLR-AMT        PIC S9(15)V99.
          05 MT-ACCT-NO        PIC X(34).

       FD DIFF-FILE.
       01 DIFF-RECORD.
          COPY RECON-DIFF-RECORD.

       WORKING-STORAGE SECTION.
       01 WS-COUNTERS.
          05 WS-MATCH-CNT      PIC 9(8) VALUE 0.
          05 WS-DIFF-CNT       PIC 9(8) VALUE 0.
          05 WS-ONLY-CORE-CNT  PIC 9(8) VALUE 0.
          05 WS-ONLY-CLR-CNT   PIC 9(8) VALUE 0.

       01 WS-FLAGS.
          05 WS-EOF-CORE       PIC X VALUE 'N'.
             88 EOF-CORE       VALUE 'Y'.
          05 WS-EOF-CLR        PIC X VALUE 'N'.
             88 EOF-CLR        VALUE 'Y'.

       PROCEDURE DIVISION.
       0000-MAIN.
           PERFORM 1000-INIT
           PERFORM 2000-COMPARE UNTIL EOF-CORE AND EOF-CLR
           PERFORM 3000-SUMMARY
           PERFORM 9000-TERM
           STOP RUN.

       2000-COMPARE.
           IF NOT EOF-CORE AND NOT EOF-CLR
               EVALUATE TRUE
                   WHEN CR-REF-NO = RECON-REF-NO
                       PERFORM 2100-CHECK-MATCH
                   WHEN CR-REF-NO < RECON-REF-NO
                       PERFORM 2200-ONLY-IN-CORE
                   WHEN CR-REF-NO > RECON-REF-NO
                       PERFORM 2300-ONLY-IN-CLR
               END-EVALUATE
           ELSE IF NOT EOF-CORE
               PERFORM 2200-ONLY-IN-CORE
           ELSE IF NOT EOF-CLR
               PERFORM 2300-ONLY-IN-CLR
           END-IF.

       2100-CHECK-MATCH.
      *    比對金額
           IF CR-AMOUNT = RECON-AMOUNT
               ADD 1 TO WS-MATCH-CNT
               PERFORM 2110-WRITE-MATCH
           ELSE
               ADD 1 TO WS-DIFF-CNT
               PERFORM 2120-WRITE-DIFF-AMT
           END-IF
           PERFORM 2400-READ-NEXT-CORE
           PERFORM 2500-READ-NEXT-CLR.

       2120-WRITE-DIFF-AMT.
           MOVE CR-REF-NO TO RD-REF-NO
           MOVE CR-TRANS-DATE TO RD-TRANS-DATE
           MOVE 'A' TO RD-TYPE
           MOVE CR-AMOUNT TO RD-CORE-AMT
           MOVE RECON-AMOUNT TO RD-CLR-AMT
           COMPUTE RD-DIFF-AMT = CR-AMOUNT - RECON-AMOUNT
           MOVE 'AMOUNT DIFFERENCE' TO RD-REMARK
           WRITE DIFF-RECORD.

       2200-ONLY-IN-CORE.
           ADD 1 TO WS-ONLY-CORE-CNT
           MOVE CR-REF-NO TO RD-REF-NO
           MOVE CR-TRANS-DATE TO RD-TRANS-DATE
           MOVE 'C' TO RD-TYPE
           MOVE CR-AMOUNT TO RD-CORE-AMT
           MOVE 0 TO RD-CLR-AMT
           MOVE CR-AMOUNT TO RD-DIFF-AMT
           MOVE 'ONLY IN CORE SYSTEM' TO RD-REMARK
           WRITE DIFF-RECORD
           PERFORM 2400-READ-NEXT-CORE.

       2300-ONLY-IN-CLR.
           ADD 1 TO WS-ONLY-CLR-CNT
           MOVE RECON-REF-NO TO RD-REF-NO
           MOVE RECON-TRANS-DATE TO RD-TRANS-DATE
           MOVE 'L' TO RD-TYPE
           MOVE 0 TO RD-CORE-AMT
           MOVE RECON-AMOUNT TO RD-CLR-AMT
           MOVE RECON-AMOUNT TO RD-DIFF-AMT
           MOVE 'ONLY IN CLEARING SYSTEM' TO RD-REMARK
           WRITE DIFF-RECORD
           PERFORM 2500-READ-NEXT-CLR.

       3000-SUMMARY.
           DISPLAY '================================'
           DISPLAY '清算對帳批次統計'
           DISPLAY '================================'
           DISPLAY '匹配筆數: ' WS-MATCH-CNT
           DISPLAY '金額差異: ' WS-DIFF-CNT
           DISPLAY '僅核心系統: ' WS-ONLY-CORE-CNT
           DISPLAY '僅清算系統: ' WS-ONLY-CLR-CNT
           DISPLAY '================================'.
```

---

## 內部系統整合

### 常見內部介接

| 系統 | 介接內容 | 頻率 |
|------|----------|------|
| 核心系統 ↔ 外匯系統 | 匯率、外幣交易 | 即時/批次 |
| 核心系統 ↔ 證券系統 | 證券交割款項 | 批次 |
| 核心系統 ↔ 信用卡系統 | 繳款、預借現金 | 批次 |
| 核心系統 ↔ CRM | 客戶資料同步 | 批次 |
| 核心系統 ↔ 資料倉儲 | 交易資料同步 | 批次 |

### MQ 訊息佇列架構

```
┌─────────────────────────────────────────────────────────┐
│                MQ 訊息佇列架構                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │ 發送系統 │───>│ MQ Queue │───>│ 接收系統 │          │
│  │ (Core)   │    │ Manager  │    │ (外匯)   │          │
│  └──────────┘    └──────────┘    └──────────┘          │
│       │               │               │                 │
│       ▼               ▼               ▼                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │ PUT      │    │ QUEUE    │    │ GET      │          │
│  │ Message  │    │ Storage  │    │ Message  │          │
│  └──────────┘    └──────────┘    └──────────┘          │
│                                                         │
│  特點：                                                 │
│  - 非同步通訊                                          │
│  - 訊息保證送達                                        │
│  - 失敗重試機制                                        │
│  - 解耦系統相依性                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### MQ 訊息格式

```cobol
      * MQ 訊息標頭
       01 MQ-HEADER.
          05 MQ-MSG-ID         PIC X(24).      *> 訊息識別碼
          05 MQ-CORREL-ID      PIC X(24).      *> 關聯識別碼
          05 MQ-MSG-TYPE       PIC X(8).       *> 訊息類型
          05 MQ-FORMAT         PIC X(8).       *> 格式名稱
          05 MQ-SENDER         PIC X(20).      *> 發送者
          05 MQ-RECEIVER       PIC X(20).      *> 接收者
          05 MQ-TIMESTAMP      PIC 9(17).      *> 時間戳記
          05 MQ-VERSION        PIC 9(4).       *> 版本號

      * 匯率查詢訊息
       01 FX-RATE-REQ.
          05 FX-HEADER         PIC X(100).     *> MQ 標頭
          05 FX-REQ-TYPE       PIC X.          *> 請求類型
          05 FX-FROM-CCY       PIC XXX.        *> 原幣別
          05 FX-TO-CCY         PIC XXX.        *> 目標幣別
          05 FX-TRANS-DATE     PIC 9(8).       *> 交易日期

      * 匯率回應訊息
       01 FX-RATE-RESP.
          05 FX-HEADER         PIC X(100).     *> MQ 標頭
          05 FX-STATUS         PIC X.          *> 狀態
          05 FX-RATE           PIC 9(7)V9(6).  *> 匯率
          05 FX-RATE-DATE      PIC 9(8).       *> 匯率日期
          05 FX-ERROR-CODE     PIC X(4).       *> 錯誤代碼
          05 FX-ERROR-MSG      PIC X(50).      *> 錯誤訊息
```

---

## 資料交換最佳實務

### 檔案傳輸

| 方式 | 說明 | 適用情境 | 優點 | 缺點 |
|------|------|----------|------|------|
| SFTP | 加密檔案傳輸 | 大量資料交換 | 安全、穩定 | 非即時 |
| MFT | 受管檔案傳輸 | 企業級傳輸 | 監控、稽核 | 成本較高 |
| MQ | 訊息佇列 | 即時交易 | 可靠、解耦 | 複雜度高 |
| API | REST/SOAP | 線上服務 | 即時、彈性 | 效能考量 |
| SWIFT | 金融專用 | 跨行交易 | 標準化 | 費用 |

### 安全控制

```
傳輸安全：
├── 加密傳輸 (TLS/SSL)
├── 數位簽章
├── PKI 認證
└── IP 白名單

資料安全：
├── 敏感資料遮罩
├── 資料完整檢核 (Hash/Checksum)
├── 存取權限控制
└── 資料保留政策

監控告警：
├── 傳輸狀態監控
├── 異常告警通知
├── 效能監控
└── 日誌記錄與審計
```

### 錯誤處理機制

```cobol
      * 錯誤處理邏輯
       5000-ERROR-HANDLING.
           EVALUATE WS-ERROR-CODE
               WHEN 'TIMEOUT'
                   PERFORM 5100-RETRY-LOGIC
               WHEN 'FORMAT'
                   PERFORM 5200-LOG-FORMAT-ERROR
               WHEN 'AUTH'
                   PERFORM 5300-LOG-AUTH-ERROR
               WHEN 'SYSTEM'
                   PERFORM 5400-LOG-SYSTEM-ERROR
           END-EVALUATE.

       5100-RETRY-LOGIC.
      *    重試邏輯
           ADD 1 TO WS-RETRY-COUNT
           IF WS-RETRY-COUNT <= 3
      *        等待後重試
               PERFORM 5110-WAIT-INTERVAL
               PERFORM 5120-RESEND-MESSAGE
           ELSE
      *        超過重試次數，通知管理員
               PERFORM 5130-NOTIFY-ADMIN
           END-IF.

       5110-WAIT-INTERVAL.
      *    指數退避等待
           COMPUTE WS-WAIT-SEC = 
               10 * (2 ** (WS-RETRY-COUNT - 1))
           CALL 'CBLSLEEP' USING WS-WAIT-SEC.
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
| 「對帳時點？」 | 何時對帳、差異處理 |
| 「SLA 要求？」 | 回應時間、可用性 |

### 常見問題診斷

| 問題 | 可能原因 | 診斷步驟 |
|------|----------|----------|
| 訊息未送達 | MQ 佇列滿、網路問題 | 檢查佇列狀態、網路連線 |
| 格式錯誤 | 版本不一致、欄位變更 | 比對訊息格式規格 |
| 對帳不平 | 時間差、遺漏交易 | 逐筆核對、檢查批次時間 |
| 效能問題 | 資料量暴增、系統資源 | 檢查資料量、監控資源 |

### 測試案例設計

```
SWIFT 訊息解析測試：
□ 正常訊息解析
□ 缺少必填欄位
□ 格式錯誤訊息
□ 特殊字元處理
□ 多幣別訊息

清算對帳測試：
□ 完全匹配情境
□ 金額差異情境
□ 單方存在情境
□ 時間差異情境
□ 大量資料測試

錯誤處理測試：
□ 網路中斷
□ 超時重試
□ 格式錯誤
□ 權限不足
□ 系統資源不足
```

---

## 練習題

### 題目 1
解析以下 SWIFT MT103 訊息，列出關鍵欄位值：
- 匯款人
- 收款人
- 金額與幣別
- 匯款用途

### 題目 2
設計一個「跨境匯款狀態查詢」系統的需求規格，包含：
- 系統架構
- 資料流程
- 介接方式

### 題目 3
分析清算對帳差異的常見原因，並設計處理流程。

### 題目 4
設計一個內部系統間「客戶資料同步」機制：
- 同步頻率
- 資料格式
- 錯誤處理
- 對帳機制

---

## 重點回顧

| 概念 | 說明 |
|------|------|
| SWIFT | 全球銀行金融通訊標準 |
| MT103 | 單筆客戶匯款訊息 |
| MT950 | 銀行對帳單訊息 |
| 清算系統 | 銀行間資金清算 |
| MQ | 訊息佇列，非同步通訊 |
| 對帳 | 確保資料一致性 |

---

## 延伸閱讀

- [Lesson 3-6：MQ/Socket 通訊概念](lesson-3-6-mq-socket.md)
- [Lesson 4-4：對帳與報表生成](lesson-4-4-reconciliation.md)
- [Lesson 4-3：日終批次處理流程](lesson-4-3-daily-batch.md)
