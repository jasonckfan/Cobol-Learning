# Lesson 3-8: CICS 線上交易入門

> 理解 CICS 線上交易處理系統基礎

---

## 學習目標

- 理解 CICS 的基本概念與架構
- 了解線上交易與批次處理的差異
- 掌握 CICS 程式基本結構
- 了解 BA 在線上交易設計時的關注點

---

## 一、CICS 概覽

### 1.1 什麼是 CICS？

CICS (Customer Information Control System) 是 IBM 的交易處理監控系統，用於處理線上交易。

```
┌─────────────────────────────────────────────────────────────────┐
│              CICS 系統架構                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  使用者介面層                                            │  │
│   │  - 終端機 (Terminal)                                     │  │
│   │  - 網路銀行                                              │  │
│   │  - ATM                                                   │  │
│   │  - 手機 App                                              │  │
│   └────────────────────────┬────────────────────────────────┘  │
│                              ↓                                  │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  CICS 交易處理層                                         │  │
│   │  - Transaction Manager                                   │  │
│   │  - Program Control                                       │  │
│   │  - File Control                                          │  │
│   │  - Terminal Control                                      │  │
│   └────────────────────────┬────────────────────────────────┘  │
│                              ↓                                  │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  應用程式層                                              │  │
│   │  - COBOL 程式                                            │  │
│   │  - PL/I 程式                                             │  │
│   │  - Java 程式                                             │  │
│   └────────────────────────┬────────────────────────────────┘  │
│                              ↓                                  │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  資料層                                                  │  │
│   │  - VSAM 檔案                                             │  │
│   │  - DB2 資料庫                                            │  │
│   │  - DL/I 資料庫                                           │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 CICS 核心概念

| 概念 | 說明 | 範例 |
|------|------|------|
| **Transaction** | 交易 | ATM 提款、帳戶查詢 |
| **Program** | 程式 | 處理交易的 COBOL 程式 |
| **Map** | 畫面定義 | 終端機畫面格式 |
| **Task** | 任務 | 單次交易執行實例 |
| **Region** | CICS 區域 | 獨立的 CICS 環境 |

---

## 二、線上 vs 批次

### 2.1 比較表

| 特性 | 線上 (CICS) | 批次 (Batch) |
|------|-------------|--------------|
| **回應時間** | 即時 (秒級) | 非即時 (分鐘/小時) |
| **使用者互動** | 有 | 無 |
| **執行時間** | 隨機 | 排程時間 |
| **資源使用** | 持續占用 | 集中使用 |
| **錯誤處理** | 即時回饋 | 批次後檢查 |
| **適用場景** | 查詢、交易 | 報表、計算 |

### 2.2 銀行應用場景

```
┌─────────────────────────────────────────────────────────────────┐
│              銀行線上 vs 批次應用                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   線上交易 (CICS)                                               │
│   ───────────────                                               │
│   • ATM 提款/存款                                               │
│   • 網路銀行查詢                                                │
│   • 即時轉帳                                                    │
│   • 帳戶餘額查詢                                                │
│   • 密碼變更                                                    │
│                                                                 │
│   批次作業                                                      │
│   ──────────                                                    │
│   • 日終利息計算                                                │
│   • 月結報表產生                                                │
│   • 資料備份                                                    │
│   • 歷史資料歸檔                                                │
│   • 大量資料處理                                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 三、CICS 程式結構

### 3.1 基本 CICS 程式

```cobol
       IDENTIFICATION DIVISION.
       PROGRAM-ID. INQACCT.
       
       ENVIRONMENT DIVISION.
       
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       
       * CICS 介面區
       01  WS-COMMAREA.
           05  WS-ACCT-NUMBER   PIC X(12).
           05  WS-ACCT-NAME     PIC X(40).
           05  WS-BALANCE       PIC S9(13)V99 COMP-3.
           05  WS-STATUS        PIC X.
       
       01  WS-RESPONSE        PIC S9(8) COMP.
       01  WS-RESP2           PIC S9(8) COMP.
       
       PROCEDURE DIVISION.
       
       0000-MAIN.
           * 取得輸入資料
           EXEC CICS RECEIVE
               INTO(WS-COMMAREA)
               LENGTH(LENGTH OF WS-COMMAREA)
               RESP(WS-RESPONSE)
               RESP2(WS-RESP2)
           END-EXEC.
           
           IF WS-RESPONSE NOT = DFHRESP(NORMAL)
               PERFORM 9000-ERROR
           END-IF.
           
           * 處理交易
           PERFORM 1000-PROCESS.
           
           * 回傳結果
           EXEC CICS SEND
               FROM(WS-COMMAREA)
               LENGTH(LENGTH OF WS-COMMAREA)
           END-EXEC.
           
           * 結束交易
           EXEC CICS RETURN
           END-EXEC.
       
       1000-PROCESS.
           * 讀取帳戶資料
           EXEC CICS READ
               FILE('ACCTFILE')
               INTO(WS-COMMAREA)
               RIDFLD(WS-ACCT-NUMBER)
               RESP(WS-RESPONSE)
           END-EXEC.
           
           EVALUATE WS-RESPONSE
               WHEN DFHRESP(NORMAL)
                   MOVE 'SUCCESS' TO WS-STATUS
               WHEN DFHRESP(NOTFND)
                   MOVE 'NOTFOUND' TO WS-STATUS
               WHEN OTHER
                   MOVE 'ERROR' TO WS-STATUS
           END-EVALUATE.
       
       9000-ERROR.
           MOVE 'SYSTEM ERROR' TO WS-STATUS.
           EXEC CICS SEND
               FROM(WS-COMMAREA)
               LENGTH(LENGTH OF WS-COMMAREA)
           END-EXEC.
           
           EXEC CICS RETURN
           END-EXEC.
```

### 3.2 常用 CICS 命令

| 命令 | 用途 | 範例 |
|------|------|------|
| **RECEIVE** | 接收輸入 | 從終端接收資料 |
| **SEND** | 送出輸出 | 顯示結果到終端 |
| **READ** | 讀取檔案 | 讀取 VSAM 記錄 |
| **WRITE** | 寫入檔案 | 新增 VSAM 記錄 |
| **REWRITE** | 改寫檔案 | 更新 VSAM 記錄 |
| **DELETE** | 刪除檔案 | 刪除 VSAM 記錄 |
| **START** | 啟動交易 | 觸發其他交易 |
| **RETURN** | 返回 | 結束交易 |
| **SYNCPOINT** | 確認點 | 交易提交 |

---

## 四、BA 線上交易設計考量

### 4.1 交易設計檢查清單

```
┌─────────────────────────────────────────────────────────────────┐
│              線上交易設計檢查清單                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  □ 功能需求                                                     │
│    ├── 交易目的明確？                                           │
│    ├── 輸入/輸出欄位定義？                                      │
│    ├── 業務規則清楚？                                           │
│    └── 錯誤處理完整？                                           │
│                                                                 │
│  □ 效能考量                                                     │
│    ├── 回應時間要求？                                           │
│    ├── 預估交易量？                                             │
│    ├── 是否需要快取？                                           │
│    └──