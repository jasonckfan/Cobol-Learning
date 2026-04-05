# CICS 線上交易系統詳解

> 銀行核心系統 CICS 程式設計與交易處理完整指南

---

## 一、CICS 基礎概念

### 1.1 CICS 是什麼？

CICS (Customer Information Control System) 是 IBM Mainframe 上的線上交易處理系統 (OLTP - Online Transaction Processing)。

```
┌─────────────────────────────────────────────────────────────┐
│                    CICS 系統架構                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   使用者介面層                                               │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐                    │
│   │   ATM   │  │ 網銀    │  │ 櫃台    │                    │
│   │ 終端機  │  │ 系統    │  │ 終端機  │                    │
│   └────┬────┘  └────┬────┘  └────┬────┘                    │
│        │            │            │                          │
│        └────────────┼────────────┘                          │
│                     │                                       │
│   通訊層             ▼                                       │
│   ┌─────────────────────────────────────────────┐          │
│   │           TCP/IP / SNA / VTAM              │          │
│   └─────────────────────────────────────────────┘          │
│                     │                                       │
│   CICS 區域          ▼                                       │
│   ┌─────────────────────────────────────────────┐          │
│   │  ┌─────────┐  ┌─────────┐  ┌─────────┐     │          │
│   │  │ TOR     │  │  AOR    │  │  FOR    │     │          │
│   │  │ (終端)  │  │ (應用)  │  │ (檔案)  │     │          │
│   │  └─────────┘  └────┬────┘  └─────────┘     │          │
│   │                    │                       │          │
│   │  ┌─────────────────┴─────────────────┐     │          │
│   │  │         CICS 核心服務              │     │          │
│   │  │  - 交易管理 (Transaction)          │     │          │
│   │  │  - 檔案控制 (File Control)         │     │          │
│   │  │  - 程式控制 (Program Control)      │     │          │          │
│   │  │  - 終端控制 (Terminal Control)     │     │          │
│   │  │  - 儲存管理 (Storage)              │     │          │
│   │  └──────────────────────────────────┘     │          │
│   └─────────────────────────────────────────────┘          │
│                     │                                       │
│   後端系統           ▼                                       │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐                    │
│   │  VSAM   │  │   DB2   │  │   MQ    │                    │
│   │  檔案   │  │  資料庫 │  │  佇列   │                    │
│   └─────────┘  └─────────┘  └─────────┘                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 CICS 核心概念

| 術語 | 英文 | 說明 |
|-----|------|------|
| **交易** | Transaction | 一個完整的業務操作單位，如提款、轉帳 |
| **程式** | Program | 執行交易的 COBOL 程式 |
| **MAP** | Map | 畫面定義，終端顯示的表單 |
| **TDQ** | Transient Data Queue | 暫態資料佇列，用於日誌 |
| **TSQ** | Temporary Storage Queue | 臨時儲存佇列，交易間傳遞資料 |
| **COMMAREA** | Communication Area | 程式間傳遞資料的區域 |

---

## 二、CICS 程式基本結構

### 2.1 最簡單的 CICS 程式

```cobol
       IDENTIFICATION DIVISION.
       PROGRAM-ID. HELLOCBL.
      *-----------------------------------------------------------
      * 最簡單的 CICS 程式 - Hello World
      *-----------------------------------------------------------
       ENVIRONMENT DIVISION.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01  WS-MESSAGE            PIC X(30) VALUE 'Hello from CICS!'.
       
       LINKAGE SECTION.
       01  DFHCOMMAREA.
           05  FILLER            PIC X(100).
       
       PROCEDURE DIVISION.
       0000-MAIN.
      *    傳送訊息到終端
           EXEC CICS
               SEND TEXT
               FROM(WS-MESSAGE)
               ERASE
           END-EXEC
           
      *    回傳控制權給 CICS
           EXEC CICS
               RETURN
           END-EXEC.
```

### 2.2 標準 CICS 交易程式結構

```cobol
       IDENTIFICATION DIVISION.
       PROGRAM-ID. ACCTINQC.
      *-----------------------------------------------------------
      * CICS 帳戶查詢交易程式
      * 功能：查詢帳戶餘額
      * 交易代碼：ACIQ
      *-----------------------------------------------------------
       ENVIRONMENT DIVISION.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       
      *    複製 CICS 定義
           COPY DFHAID.
           COPY DFHBMSCA.
           COPY ACCTMAP.           *> MAP 定義 Copybook
       
      *    訊息定義
       01  WS-MESSAGE            PIC X(60).
       01  WS-ERROR-MESSAGE      PIC X(60).
       
      *    工作變數
       01  WS-ACCT-NO            PIC X(12).
       01  WS-RESPONSE           PIC S9(08) COMP.
       01  WS-REASON             PIC S9(08) COMP.
       
      *    帳戶資料
       01  WS-ACCOUNT-INFO.
           05  WS-CUST-NAME      PIC X(30).
           05  WS-CURRENCY       PIC X(03).
           05  WS-BALANCE        PIC S9(13)V99 COMP-3.
           05  WS-STATUS         PIC X(01).
       
       LINKAGE SECTION.
       01  DFHCOMMAREA.
           05  CA-DATA           PIC X(100).
       
       PROCEDURE DIVISION.
       0000-MAIN.
      *    程式入口點
           EVALUATE EIBTRNID
               WHEN 'ACIQ'
                   PERFORM 1000-FIRST-TIME
               WHEN OTHER
                   PERFORM 9000-ERROR-HANDLER
           END-EVALUATE
           
           EXEC CICS
               RETURN
           END-EXEC.
       
       1000-FIRST-TIME.
      *    首次進入交易 - 顯示空白畫面
           PERFORM 1100-SEND-MAP-ERASE.
       
       1100-SEND-MAP-ERASE.
      *    傳送空白 MAP 到終端
           MOVE LOW-VALUES TO ACCTMAPO
           
           EXEC CICS
               SEND MAP('ACCTMAP')
               MAPSET('ACCTSET')
               FROM(ACCTMAPO)
               ERASE
           END-EXEC.
       
       2000-RECEIVE-MAP.
      *    接收使用者輸入
           EXEC CICS
               RECEIVE MAP('ACCTMAP')
               MAPSET('ACCTSET')
               INTO(ACCTMAPI)
           END-EXEC
           
      *    檢查是否有輸入
           IF ACCTNOI = LOW-VALUES OR ACCTNOI = SPACES
               MOVE '請輸入帳號' TO WS-ERROR-MESSAGE
               PERFORM 2100-SEND-MAP-DATA
           ELSE
               MOVE ACCTNOI TO WS-ACCT-NO
               PERFORM 3000-VALIDATE-ACCOUNT
           END-IF.
       
       2100-SEND-MAP-DATA.
      *    傳送畫面（含資料）
           MOVE WS-ERROR-MESSAGE TO MSGO
           
           EXEC CICS
               SEND MAP('ACCTMAP')
               MAPSET('ACCTSET')
               FROM(ACCTMAPO)
               DATAONLY
           END-EXEC.
       
       3000-VALIDATE-ACCOUNT.
      *    驗證帳號格式
           IF WS-ACCT-NO NOT NUMERIC
               MOVE '帳號必須為數字' TO WS-ERROR-MESSAGE
               PERFORM 2100-SEND-MAP-DATA
           ELSE
               PERFORM 4000-READ-ACCOUNT
           END-IF.
       
       4000-READ-ACCOUNT.
      *    讀取帳戶主檔
           EXEC CICS
               READ FILE('ACCTMST')
               INTO(WS-ACCOUNT-INFO)
               RIDFLD(WS-ACCT-NO)
               RESP(WS-RESPONSE)
           END-EXEC
           
           EVALUATE WS-RESPONSE
               WHEN DFHRESP(NORMAL)
                   PERFORM 4100-DISPLAY-RESULT
               WHEN DFHRESP(NOTFND)
                   MOVE '帳號不存在' TO WS-ERROR-MESSAGE
                   PERFORM 2100-SEND-MAP-DATA
               WHEN OTHER
                   MOVE '系統錯誤，請稍後再試' TO WS-ERROR-MESSAGE
                   PERFORM 2100-SEND-MAP-DATA
           END-EVALUATE.
       
       4100-DISPLAY-RESULT.
      *    顯示查詢結果
           MOVE WS-ACCT-NO TO ACCTNOO
           MOVE WS-CUST-NAME TO CUSTNAMO
           MOVE WS-CURRENCY TO CURRENYO
           MOVE WS-BALANCE TO BALANCEO
           
           EVALUATE WS-STATUS
               WHEN 'A'
                   MOVE '正常' TO STATUSO
               WHEN 'F'
                   MOVE '凍結' TO STATUSO
               WHEN 'C'
                   MOVE '結清' TO STATUSO
               WHEN OTHER
                   MOVE '未知' TO STATUSO
           END-EVALUATE
           
           MOVE '查詢成功' TO MSGO
           PERFORM 2100-SEND-MAP-DATA.
       
       9000-ERROR-HANDLER.
      *    錯誤處理
           MOVE '交易代碼錯誤' TO WS-MESSAGE
           EXEC CICS
               SEND TEXT
               FROM(WS-MESSAGE)
               ERASE
           END-EXEC.
```

---

## 三、CICS MAP 定義 (BMS)

### 3.1 MAP 定義範例

```
       PRINT NOGEN
       
ACCTSET  DFHMSD TYPE=&SYSPARM,                                         
               LANG=COBOL,                                              
               MODE=INOUT,                                              
               TIOAPFX=YES,                                             
               DSATTS=(COLOR,HILIGHT),                                  
               MAPATTS=(COLOR,HILIGHT),                                 
               CNTL=FREEKB
       
ACCTMAP  DFHMDI SIZE=(24,80),                                          
               LINE=1,                                                  
               COLUMN=1
       
         DFHMDF POS=(1,1),                                              
               LENGTH=8,                                                
               INITIAL='ACCTINQ ',                                      
               ATTRB=ASKIP
       
         DFHMDF POS=(1,30),                                             
               LENGTH=20,                                               
               INITIAL='帳戶餘額查詢系統',                               
               ATTRB=ASKIP,                                             
               COLOR=BLUE
       
         DFHMDF POS=(3,1),                                              
               LENGTH=12,                                               
               INITIAL='帳號：',                                         
               ATTRB=ASKIP
       
ACCTNO   DFHMDF POS=(3,15),                                            
               LENGTH=12,                                               
               ATTRB=(UNPROT,IC),                                       
               HILIGHT=UNDERLINE,                                       
               COLOR=GREEN
       
         DFHMDF POS=(3,28),                                             
               LENGTH=1,                                                
               ATTRB=ASKIP
       
         DFHMDF POS=(5,1),                                              
               LENGTH=12,                                               
               INITIAL='客戶姓名：',                                     
               ATTRB=ASKIP
       
CUSTNAM  DFHMDF POS=(5,15),                                            
               LENGTH=30,                                               
               ATTRB=ASKIP,                                             
               COLOR=TURQUOISE
       
         DFHMDF POS=(7,1),                                              
               LENGTH=12,                                               
               INITIAL='幣別：',                                         
               ATTRB=ASKIP
       
CURRENY  DFHMDF POS=(7,15),                                            
               LENGTH=3,                                                
               ATTRB=ASKIP,                                             
               COLOR=TURQUOISE
       
         DFHMDF POS=(9,1),                                              
               LENGTH=12,                                               
               INITIAL='目前餘額：',                                     
               ATTRB=ASKIP
       
BALANCE  DFHMDF POS=(9,15),                                            
               LENGTH=20,                                               
               ATTRB=ASKIP,                                             
               COLOR=TURQUOISE
       
         DFHMDF POS=(11,1),                                             
               LENGTH=12,                                               
               INITIAL='帳戶狀態：',                                     
               ATTRB=ASKIP
       
STATUS   DFHMDF POS=(11,15),                                           
               LENGTH=10,                                               
               ATTRB=ASKIP,                                             
               COLOR=TURQUOISE
       
MSG      DFHMDF POS=(20,1),                                            
               LENGTH=60,                                               
               ATTRB=ASKIP,                                             
               COLOR=RED
       
         DFHMDF POS=(23,1),                                             
               LENGTH=40,                                               
               INITIAL='PF1=說明  PF3=結束  ENTER=查詢',                
               ATTRB=ASKIP,                                             
               COLOR=YELLOW
       
         DFHMSD TYPE=FINAL
               END
```

### 3.2 MAP 欄位屬性說明

| 屬性 | 說明 |
|-----|------|
| `ASKIP` | 自動跳過，不可輸入 |
| `UNPROT` | 未保護，可輸入 |
| `PROT` | 保護，不可輸入 |
| `NUM` | 僅允許數字 |
| `IC` | 初始游標位置 |
| `FSET` | 欄位已修改旗標 |

---

## 四、CICS 檔案操作

### 4.1 VSAM 檔案讀寫

```cobol
      *    讀取記錄
           EXEC CICS
               READ FILE('ACCTMST')
               INTO(WS-RECORD)
               RIDFLD(WS-ACCT-NO)
               RESP(WS-RESPONSE)
           END-EXEC
       
      *    讀取並更新
           EXEC CICS
               READ FILE('ACCTMST')
               INTO(WS-RECORD)
               RIDFLD(WS-ACCT-NO)
               UPDATE
               RESP(WS-RESPONSE)
           END-EXEC
           
           IF WS-RESPONSE = DFHRESP(NORMAL)
               ADD 1000 TO WS-BALANCE
               EXEC CICS
                   REWRITE FILE('ACCTMST')
                   FROM(WS-RECORD)
                   RESP(WS-RESPONSE)
               END-EXEC
           END-IF
       
      *    寫入新記錄
           EXEC CICS
               WRITE FILE('ACCTMST')
               FROM(WS-RECORD)
               RIDFLD(WS-ACCT-NO)
               RESP(WS-RESPONSE)
           END-EXEC
       
      *    刪除記錄
           EXEC CICS
               DELETE FILE('ACCTMST')
               RIDFLD(WS-ACCT-NO)
               RESP(WS-RESPONSE)
           END-EXEC
       
      *    循序讀取
           EXEC CICS
               STARTBR FILE('ACCTMST')
               RIDFLD(WS-ACCT-NO)
               RESP(WS-RESPONSE)
           END-EXEC
           
           PERFORM UNTIL WS-RESPONSE NOT = DFHRESP(NORMAL)
               EXEC CICS
                   READNEXT FILE('ACCTMST')
                   INTO(WS-RECORD)
                   RIDFLD(WS-ACCT-NO)
                   RESP(WS-RESPONSE)
               END-EXEC
               
               IF WS-RESPONSE = DFHRESP(NORMAL)
                   DISPLAY '帳號：' WS-ACCT-NO
               END-IF
           END-PERFORM
           
           EXEC CICS
               ENDBR FILE('ACCTMST')
           END-EXEC
```

### 4.2 CICS 回應代碼

| 代碼 | 常數 | 說明 |
|-----|------|------|
| 0 | NORMAL | 成功 |
| 13 | NOTFND | 記錄不存在 |
| 14 | DUPREC | 重複記錄 |
| 17 | IOERR | I/O 錯誤 |
| 22 | LENGERR | 長度錯誤 |
| 61 | TRANSIDERR | 交易代碼錯誤 |
| 81 | PGMIDERR | 程式代碼錯誤 |

---

## 五、CICS 交易管理

### 5.1 Syncpoint 與交易控制

```cobol
      *    執行多個操作後統一確認
           PERFORM 1000-UPDATE-ACCOUNT
           PERFORM 2000-UPDATE-LEDGER
           PERFORM 3000-WRITE-LOG
       
      *    確認交易 (Commit)
           EXEC CICS
               SYNCPOINT
           END-EXEC
       
      *    或回復交易 (Rollback)
           EXEC CICS
               SYNCPOINT ROLLBACK
           END-EXEC
```

### 5.2 交易隔離與鎖定

```cobol
      *    讀取時不鎖定
           EXEC CICS
               READ FILE('ACCTMST')
               INTO(WS-RECORD)
               RIDFLD(WS-ACCT-NO)
               NOUPDATE
           END-EXEC
       
      *    讀取並鎖定 (預設)
           EXEC CICS
               READ FILE('ACCTMST')
               INTO(WS-RECORD)
               RIDFLD(WS-ACCT-NO)
               UPDATE
           END-EXEC
       
      *    解除鎖定
           EXEC CICS
               UNLOCK FILE('ACCTMST')
           END-EXEC
```

---

## 六、CICS 與 DB2 整合

### 6.1 CICS 中的 DB2 操作

```cobol
       IDENTIFICATION DIVISION.
       PROGRAM-ID. CICSDB2.
      *-----------------------------------------------------------
      * CICS 整合 DB2 範例
      *-----------------------------------------------------------
       ENVIRONMENT DIVISION.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       
           EXEC SQL
               INCLUDE SQLCA
           END-EXEC.
       
           EXEC SQL
               INCLUDE ACCTDCL
           END-EXEC.
       
       01  WS-ACCT-NO            PIC X(12).
       
       LINKAGE SECTION.
       01  DFHCOMMAREA.
           05  FILLER            PIC X(100).
       
       PROCEDURE DIVISION.
       0000-MAIN.
      *    從 CICS 接收資料
           EXEC CICS
               RECEIVE INTO(WS-ACCT-NO)
               LENGTH(LENGTH OF WS-ACCT-NO)
           END-EXEC
       
      *    執行 DB2 查詢
           MOVE WS-ACCT-NO TO ACCT-NO
           
           EXEC SQL
               SELECT CUST_ID, CURRENT_BAL
               INTO   :CUST-ID, :CURRENT-BAL
               FROM   ACCOUNT_MASTER
               WHERE  ACCT_NO = :ACCT-NO
           END-EXEC
       
      *    檢查 SQLCODE
           IF SQLCODE = 0
      *        成功 - 傳回結果
               EXEC CICS
                   SEND FROM(CURRENT-BAL)
                   LENGTH(LENGTH OF CURRENT-BAL)
               END-EXEC
           ELSE
      *        失敗 - 傳回錯誤
               EXEC CICS
                   SEND FROM(SQLCODE)
                   LENGTH(4)
               END-EXEC
           END-IF
       
      *    返回
           EXEC CICS
               RETURN
           END-EXEC.
```

---

## 七、CICS 除錯與診斷

### 7.1 常用診斷工具

| 工具 | 用途 |
|-----|------|
| **CEDF** | 交易執行追蹤 |
| **CEMT** | 系統管理與查詢 |
| **CECI** | 命令介面測試 |
| **CEBR** | TSQ 瀏覽 |
| **CETR** | 交易追蹤 |

### 7.2 CEDF 除錯範例

```
在終端輸入：
CEDF ACIQ    (追蹤 ACIQ 交易)

執行交易後會顯示：
- 每個 CICS 指令執行前後的狀態
- EIB 欄位內容
- 工作儲存內容
```

### 7.3 CEMT 常用指令

```
CEMT INQUIRE FILE(ACCTMST)     查詢檔案狀態
CEMT SET FILE(ACCTMST) OPEN    開啟檔案
CEMT INQUIRE PROGRAM(ACCTINQC) 查詢程式狀態
CEMT SET PROGRAM(ACCTINQC) NEWCOPY 重新載入程式
CEMT INQUIRE TRANSACTION(ACIQ) 查詢交易定義
```

---

## 八、實務案例：轉帳交易

### 8.1 轉帳交易流程圖

```
┌─────────────┐
│   開始      │
└──────┬──────┘
       ▼
┌─────────────┐
│ 接收輸入    │ 來源帳號、目的帳號、金額
└──────┬──────┘
       ▼
┌─────────────┐
│ 驗證輸入    │ 檢查格式、金額 > 0
└──────┬──────┘
       ▼
┌─────────────┐
│ 讀取來源帳戶│ 檢查餘額是否足夠
└──────┬──────┘
       ▼
┌─────────────┐
│ 讀取目的帳戶│ 檢查帳戶存在且正常
└──────┬──────┘
       ▼
┌─────────────┐
│ 扣款        │ 來源帳戶餘額 -= 金額
└──────┬──────┘
       ▼
┌─────────────┐
│ 入款        │ 目的帳戶餘額 += 金額
└──────┬──────┘
       ▼
┌─────────────┐
│ 寫入交易記錄│ 產生轉帳交易序號
└──────┬──────┘
       ▼
┌─────────────┐
│ SYNCPOINT   │ 確認交易
└──────┬──────┘
       ▼
┌─────────────┐
│ 顯示結果    │ 顯示成功訊息與交易序號
└─────────────┘
```

### 8.2 轉帳程式核心邏輯

```cobol
       2000-TRANSFER-FUNDS.
      *    步驟 1: 讀取並鎖定來源帳戶
           MOVE WS-FROM-ACCT TO WS-ACCT-NO
           
           EXEC CICS
               READ FILE('ACCTMST')
               INTO(WS-FROM-RECORD)
               RIDFLD(WS-ACCT-NO)
               UPDATE
               RESP(WS-RESP)
           END-EXEC
           
           IF WS-RESP NOT = DFHRESP(NORMAL)
               MOVE '來源帳戶讀取失敗' TO MSGO
               PERFORM 9000-EXIT-WITH-ERROR
           END-IF
       
      *    檢查餘額
           IF WS-FROM-BALANCE < WS-TRANSFER-AMOUNT
               MOVE '餘額不足' TO MSGO
               PERFORM 9000-EXIT-WITH-ERROR
           END-IF
       
      *    步驟 2: 讀取並鎖定目的帳戶
           MOVE WS-TO-ACCT TO WS-ACCT-NO
           
           EXEC CICS
               READ FILE('ACCTMST')
               INTO(WS-TO-RECORD)
               RIDFLD(WS-ACCT-NO)
               UPDATE
               RESP(WS-RESP)
           END-EXEC
           
           IF WS-RESP NOT = DFHRESP(NORMAL)
               MOVE '目的帳戶讀取失敗' TO MSGO
               PERFORM 9000-EXIT-WITH-ERROR
           END-IF
       
      *    步驟 3: 執行轉帳
           SUBTRACT WS-TRANSFER-AMOUNT FROM WS-FROM-BALANCE
           ADD WS-TRANSFER-AMOUNT TO WS-TO-BALANCE
       
      *    步驟 4: 更新來源帳戶
           EXEC CICS
               REWRITE FILE('ACCTMST')
               FROM(WS-FROM-RECORD)
               RESP(WS-RESP)
           END-EXEC
       
      *    步驟 5: 更新目的帳戶
           EXEC CICS
               REWRITE FILE('ACCTMST')
               FROM(WS-TO-RECORD)
               RESP(WS-RESP)
           END-EXEC
       
      *    步驟 6: 寫入交易記錄
           PERFORM 3000-WRITE-TRANSACTION-LOG
       
      *    步驟 7: 確認交易
           EXEC CICS
               SYNCPOINT
           END-EXEC
       
           MOVE '轉帳成功' TO MSGO
           MOVE WS-TXN-SEQ-NO TO TXNSEQO.
```

---

## 九、練習題目

### 題目 1：設計一個 CICS 存款交易

需求：
- 交易代碼：DEPP
- 輸入：帳號、存款金額
- 處理：更新帳戶餘額、寫入交易記錄
- 輸出：顯示新餘額、交易序號

### 題目 2：設計一個 CICS 查詢最近交易

需求：
- 交易代碼：TXNH
- 輸入：帳號、查詢筆數 (預設 5 筆)
- 處理：讀取交易歷史檔
- 輸出：顯示最近 N 筆交易明細

### 題目 3：處理併發交易

情境：
- 同一帳戶同時有多個交易
- 如何確保資料一致性？
- 如何處理死結 (Deadlock)？

---

## 十、參考資料

- CICS Transaction Server Documentation
- IBM CICS Application Programming Guide
- CICS Performance Guide

---

*文件版本：v1.0*
*更新日期：2026-04-06*
*作者：Claw (AI Assistant)*