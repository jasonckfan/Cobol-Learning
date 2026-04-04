# Lesson 3-8：CICS 線上交易入門

## 學習目標

- 理解 CICS 架構與運作方式
- 認識 BMS Map 的用途
- 了解線上交易的處理流程

---

## 什麼是 CICS？

CICS（Customer Information Control System）是 IBM Mainframe 的線上交易處理系統：

- 處理銀行櫃台交易
- 支援 ATM、網銀後端
- 提供即時交易服務
- 管理線上資源和並發

---

## CICS 架構

### 核心元件

```
┌─────────────────────────────────────────────┐
│                  CICS Region                 │
├─────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │ Terminal│  │ Transaction│  Program │      │
│  │ Manager │  │ Manager   │  │ Manager │      │
│  └─────────┘  └─────────┘  └─────────┘      │
│                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │ File    │  │ DB2     │  │ MQ      │      │
│  │ Control │  │ Attach  │  │ Interface│     │
│  └─────────┘  └─────────┘  └─────────┘      │
└─────────────────────────────────────────────┘
```

### 交易生命週期

```
1. 用戶輸入 → 2. CICS 接收 → 3. 啟動交易
     ↓
4. 執行程式 → 5. 存取資源 → 6. 返回結果
     ↓
7. 顯示畫面 → 8. 等待下一次輸入
```

---

## BMS Map

BMS（Basic Mapping Support）用於定義螢幕畫面。

### Map 結構

```
┌────────────────────────────────────┐
│  銀行帳戶查詢系統                    │ ← 標題
├────────────────────────────────────┤
│  帳號: [______________]            │ ← 輸入欄位
│                                    │
│  戶名: [____________________]      │ ← 輸出欄位
│  餘額: [__________.__]            │
│  狀態: [____]                      │
│                                    │
│  [F3] 離開  [Enter] 確認           │ ← 功能鍵
└────────────────────────────────────┘
```

### Map 定義範例

```cobol
       01 ACCTQMAP.
          02 FILLER               PIC X(12).
          02 TITLE-LINE.
             05 FILLER            PIC X(5) VALUE SPACES.
             05 TITLE             PIC X(20) VALUE 
                '銀行帳戶查詢系統'.
          
          02 ACCT-NO-LINE.
             05 FILLER            PIC X(10) VALUE '帳號: '.
             05 ACCT-NO-I         PIC X(16).     *> 輸入
             05 FILLER            PIC X(30) VALUE SPACES.
          
          02 ACCT-NAME-LINE.
             05 FILLER            PIC X(10) VALUE '戶名: '.
             05 ACCT-NAME-O       PIC X(40).     *> 輸出
             05 FILLER            PIC X(6) VALUE SPACES.
          
          02 BALANCE-LINE.
             05 FILLER            PIC X(10) VALUE '餘額: '.
             05 BALANCE-O         PIC Z(9)9.99.
             05 FILLER            PIC X(30) VALUE SPACES.
```

---

## CICS 程式結構

### 基本 CICS 指令

```cobol
      * 接收輸入
       EXEC CICS
           RECEIVE MAP('ACCTQMAP') MAPSET('ACCTSET')
           INTO(ACCTQMAPI)
       END-EXEC.

      * 發送輸出
       EXEC CICS
           SEND MAP('ACCTQMAP') MAPSET('ACCTSET')
           FROM(ACCTQMAPO)
           ERASE
       END-EXEC.

      * 讀取檔案
       EXEC CICS
           READ FILE('ACCTFILE')
           INTO(ACCT-RECORD)
           RIDFLD(ACCT-NO)
       END-EXEC.

      * 寫入檔案
       EXEC CICS
           WRITE FILE('ACCTFILE')
           FROM(ACCT-RECORD)
           RIDFLD(ACCT-NO)
       END-EXEC.

      * 返回
       EXEC CICS
           RETURN
       END-EXEC.
```

---

## 完整交易程式範例

```cobol
       IDENTIFICATION DIVISION.
       PROGRAM-ID. ACCTQRY.

       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-FLAGS.
          05 WS-FIRST-TIME     PIC X VALUE 'Y'.
          05 WS-EOF            PIC X VALUE 'N'.

       01 WS-STATUS.
          05 WS-RESP           PIC S9(8) COMP.
          05 WS-RESP2          PIC S9(8) COMP.

       01 ACCT-RECORD.
          05 ACCT-NO           PIC X(16).
          05 ACCT-NAME         PIC X(40).
          05 ACCT-BALANCE      PIC S9(11)V99 COMP-3.
          05 ACCT-STATUS       PIC X.

       COPY ACCTSET.

       PROCEDURE DIVISION.
       0000-MAIN.
           IF WS-FIRST-TIME = 'Y'
               PERFORM 1000-INIT-SCREEN
               MOVE 'N' TO WS-FIRST-TIME
           END-IF
           
           PERFORM 2000-RECEIVE-INPUT
           PERFORM 3000-PROCESS-REQUEST
           PERFORM 4000-SEND-RESPONSE
           
           EXEC CICS RETURN END-EXEC.

       1000-INIT-SCREEN.
           MOVE SPACES TO ACCTQMAPI
           MOVE SPACES TO ACCTQMAPO
           EXEC CICS
               SEND MAP('ACCTQMAP') MAPSET('ACCTSET')
               FROM(ACCTQMAPO)
               ERASE
           END-EXEC.

       2000-RECEIVE-INPUT.
           EXEC CICS
               RECEIVE MAP('ACCTQMAP') MAPSET('ACCTSET')
               INTO(ACCTQMAPI)
           END-EXEC
           
      *    檢查功能鍵
           EXEC CICS
               HANDLE AID
                   PF3(9000-EXIT)
                   ENTER(CONTINUE)
           END-EXEC.
           CONTINUE.

       3000-PROCESS-REQUEST.
      *    檢查帳號是否輸入
           IF ACCT-NO-I = SPACES
               MOVE '請輸入帳號' TO MSG-O
               EXIT PARAGRAPH
           END-IF
           
      *    讀取帳戶資料
           EXEC CICS
               READ FILE('ACCTFILE')
               INTO(ACCT-RECORD)
               RIDFLD(ACCT-NO-I)
               RESP(WS-RESP)
               RESP2(WS-RESP2)
           END-EXEC
           
           EVALUATE WS-RESP
               WHEN DFHRESP(NORMAL)
                   PERFORM 3100-DISPLAY-ACCT
               WHEN DFHRESP(NOTFND)
                   MOVE '找不到該帳號' TO MSG-O
               WHEN OTHER
                   MOVE '讀取錯誤' TO MSG-O
           END-EVALUATE.

       3100-DISPLAY-ACCT.
           MOVE ACCT-NAME TO ACCT-NAME-O
           MOVE ACCT-BALANCE TO BALANCE-O
           MOVE ACCT-STATUS TO STATUS-O
           MOVE SPACES TO MSG-O.

       4000-SEND-RESPONSE.
           EXEC CICS
               SEND MAP('ACCTQMAP') MAPSET('ACCTSET')
               FROM(ACCTQMAPO)
           END-EXEC.

       9000-EXIT.
           EXEC CICS
               SEND TEXT FROM('交易結束')
               ERASE
           END-EXEC
           EXEC CICS RETURN END-EXEC.
```

---

## CICS 資源管理

### 常用資源類型

| 資源 | 說明 | 定義 |
|------|------|------|
| FILE | VSAM 檔案 | FCT |
| TRANSID | 交易代碼 | PCT |
| PROGRAM | 程式 | PPT |
| MAPSET | 畫面定義 | PPT |
| TDQUEUE | 暫存佇列 | DCT |
| TSQUEUE | 暫存儲存 | - |

---

## 銀行線上交易範例

### 櫃台存款交易

```
1. 櫃員輸入：帳號、金額
2. 系統驗證：帳號存在、金額有效
3. 讀取帳戶：取得目前餘額
4. 更新餘額：餘額 + 存款金額
5. 寫入交易：記錄交易明細
6. 返回結果：顯示新餘額
```

### 關鍵程式片段

```cobol
       3000-PROCESS-DEPOSIT.
      *    驗證金額
           IF DEPOSIT-AMT-I <= 0
               MOVE '金額必須大於零' TO MSG-O
               EXIT PARAGRAPH
           END-IF
           
      *    讀取帳戶（可更新模式）
           EXEC CICS
               READ FILE('ACCTFILE')
               INTO(ACCT-RECORD)
               RIDFLD(ACCT-NO-I)
               UPDATE
               RESP(WS-RESP)
           END-EXEC
           
           IF WS-RESP NOT = DFHRESP(NORMAL)
               MOVE '讀取帳戶失敗' TO MSG-O
               EXIT PARAGRAPH
           END-IF
           
      *    更新餘額
           ADD DEPOSIT-AMT-I TO ACCT-BALANCE
           
      *    寫回檔案
           EXEC CICS
               REWRITE FILE('ACCTFILE')
               FROM(ACCT-RECORD)
               RESP(WS-RESP)
           END-EXEC
           
      *    寫入交易記錄
           PERFORM 3200-WRITE-TRANS
           
           MOVE '存款成功' TO MSG-O
           MOVE ACCT-BALANCE TO BALANCE-O.
```

---

## BA 實務應用

### 線上交易需求分析

| 問題 | 目的 |
|------|------|
| 「交易代碼是什麼？」 | 識別交易入口 |
| 「有哪些畫面？」 | 設計 BMS Map |
| 「輸入欄位有哪些？」 | 定義輸入驗證 |
| 「處理邏輯是什麼？」 | 設計程式流程 |

### 與批次程式的差異

| 特性 | 線上交易 | 批次處理 |
|------|----------|----------|
| 觸發方式 | 用戶輸入 | 排程執行 |
| 處理方式 | 單筆處理 | 批量處理 |
| 回應時間 | 即時 | 非即時 |
| 錯誤處理 | 即時回饋 | 記錄錯誤 |

---

## 練習題

### 題目 1
說明 CICS 交易的生命週期。

### 題目 2
設計一個提款交易的處理流程。

### 題目 3
批次程式和線上交易程式的主要差異是什麼？

---

## 重點回顧

| 概念 | 說明 |
|------|------|
| CICS | 線上交易處理系統 |
| Transaction | 交易，由交易代碼識別 |
| BMS Map | 畫面定義 |
| SEND/RECEIVE | 發送/接收畫面資料 |
| RESP | 回應碼 |

---

## 延伸閱讀

- [Lesson 4-1：CLM 資金池管理系統架構](lesson-4-1-clm-system.md)
- [Lesson 5-1：需求拆解技巧](lesson-5-1-requirement-analysis.md)
