# Lesson 3-6：MQ/Socket 通訊概念

## 學習目標

- 理解訊息佇列（MQ）的基本概念
- 認識 Socket 通訊原理
- 了解銀行系統整合的通訊方式

---

## 為什麼需要系統通訊？

現代銀行架構中：
- 核心系統與周邊系統需要交換資料
- 線上交易需要即時通訊
- 批次處理需要異步通訊
- 跨銀行系統需要標準介面

---

## MQ（Message Queue）訊息佇列

### 基本概念

```
┌─────────┐      ┌─────────────┐      ┌─────────┐
│ 發送方   │ ──▶ │ 訊息佇列     │ ──▶ │ 接收方   │
│ Producer │      │ Queue       │      │ Consumer│
└─────────┘      └─────────────┘      └─────────┘
```

### 特點

| 特點 | 說明 |
|------|------|
| 異步處理 | 發送與接收不需同步 |
| 可靠傳遞 | 訊息不會遺失 |
| 解耦 | 發送方與接收方不需同時在線 |
| 負載平衡 | 多個接收方可分擔工作量 |

### IBM MQ 基本元件

| 元件 | 說明 |
|------|------|
| Queue Manager | 佇列管理器，管理佇列和訊息 |
| Queue | 訊息佇列，存放訊息 |
| Channel | 通訊通道，連接不同 Queue Manager |
| Message | 訊息本體 |

---

## MQ 在 COBOL 中的使用

### 定義

```cobol
       WORKING-STORAGE SECTION.
      * MQ 結構定義
       COPY CMQV.

       01 WS-MQ-CONNECTION.
          05 WS-HCONN          PIC S9(9) COMP.
          05 WS-HOBJ           PIC S9(9) COMP.
          05 WS-OPTIONS        PIC S9(9) COMP.
          05 WS-COMPCODE       PIC S9(9) COMP.
          05 WS-REASON         PIC S9(9) COMP.

       01 WS-MQ-MSG-DESC.
          05 WS-MSG-ID         PIC X(24).
          05 WS-CORREL-ID      PIC X(24).
          05 WS-MSG-TYPE       PIC S9(9) COMP.
          05 WS-MSG-PRIORITY   PIC S9(9) COMP.

       01 WS-MQ-PUT-OPTIONS.
          05 WS-PUT-OPTIONS    PIC S9(9) COMP.

       01 WS-MQ-GET-OPTIONS.
          05 WS-GET-OPTIONS    PIC S9(9) COMP.

       01 WS-MESSAGE.
          05 WS-MSG-LEN        PIC S9(9) COMP.
          05 WS-MSG-DATA       PIC X(1000).
```

### 連接佇列管理器

```cobol
       1000-MQ-CONNECT.
           CALL 'MQCONN' USING WS-QMGR-NAME
                               WS-HCONN
                               WS-COMPCODE
                               WS-REASON
           IF WS-COMPCODE NOT = MQCC-OK
               DISPLAY 'MQCONN 失敗: ' WS-REASON
               STOP RUN
           END-IF.
```

### 發送訊息

```cobol
       2000-MQ-PUT.
           CALL 'MQPUT' USING WS-HCONN
                              WS-HOBJ
                              WS-MQ-MSG-DESC
                              WS-MQ-PUT-OPTIONS
                              WS-MSG-LEN
                              WS-MESSAGE
                              WS-COMPCODE
                              WS-REASON
           IF WS-COMPCODE NOT = MQCC-OK
               DISPLAY 'MQPUT 失敗: ' WS-REASON
           END-IF.
```

### 接收訊息

```cobol
       3000-MQ-GET.
           CALL 'MQGET' USING WS-HCONN
                              WS-HOBJ
                              WS-MQ-MSG-DESC
                              WS-MQ-GET-OPTIONS
                              WS-BUFFER-LEN
                              WS-MESSAGE
                              WS-ACTUAL-LEN
                              WS-COMPCODE
                              WS-REASON
           IF WS-COMPCODE = MQCC-OK
               PERFORM PROCESS-MESSAGE
           ELSE IF WS-REASON NOT = MQRC-NO-MSG-AVAILABLE
               DISPLAY 'MQGET 失敗: ' WS-REASON
           END-IF.
```

---

## Socket 通訊

### 基本概念

```
┌─────────┐      TCP/IP       ┌─────────┐
│ Client  │ ◀──────────────▶ │ Server  │
└─────────┘                   └─────────┘
```

### 特點

| 特點 | 說明 |
|------|------|
| 同步通訊 | 需要即時回應 |
| 點對點 | 直接連線 |
| 即時性 | 適合線上交易 |
| 狀態維護 | 可維護連線狀態 |

### COBOL Socket 通訊

```cobol
       WORKING-STORAGE SECTION.
       01 WS-SOCKET-INFO.
          05 WS-SOCKET-ID      PIC S9(9) COMP.
          05 WS-PORT-NUM       PIC 9(5).
          05 WS-IP-ADDR        PIC X(15).
          05 WS-CONNECTION-ID  PIC S9(9) COMP.

       01 WS-SEND-BUFFER       PIC X(1000).
       01 WS-RECV-BUFFER       PIC X(1000).
       01 WS-BUFFER-LEN        PIC S9(9) COMP.

       PROCEDURE DIVISION.
       1000-SOCKET-CONNECT.
      *    建立 Socket 連線
           CALL 'SOCKET' USING WS-SOCKET-ID.
           CALL 'CONNECT' USING WS-SOCKET-ID
                                WS-IP-ADDR
                                WS-PORT-NUM.

       2000-SEND-REQUEST.
      *    發送請求
           MOVE 100 TO WS-BUFFER-LEN
           CALL 'SEND' USING WS-SOCKET-ID
                             WS-SEND-BUFFER
                             WS-BUFFER-LEN.

       3000-RECV-RESPONSE.
      *    接收回應
           CALL 'RECV' USING WS-SOCKET-ID
                             WS-RECV-BUFFER
                             WS-BUFFER-LEN.
```

---

## 銀行系統整合實例

### 即時交易介面

```
┌─────────────┐                    ┌─────────────┐
│ 網銀前端     │                    │ 核心系統     │
│ (Web/App)   │                    │ (Mainframe) │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       ▼                                  ▼
┌─────────────┐      MQ/Socket      ┌─────────────┐
│ 介接服務     │ ◀────────────────▶ │ 交易閘道     │
│ (API GW)    │                    │ (CICS)      │
└─────────────┘                    └─────────────┘
```

### 批次資料交換

```
┌─────────────┐                    ┌─────────────┐
│ 外部系統     │                    │ 核心系統     │
│ (SWIFT)     │                    │ (Mainframe) │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       ▼                                  ▼
┌─────────────┐      檔案/MQ         ┌─────────────┐
│ 檔案介接     │ ◀────────────────▶ │ 批次處理     │
│ (File/MQ)   │                    │ (Batch)     │
└─────────────┘                    └─────────────┘
```

---

## 通訊方式比較

| 特性 | MQ | Socket |
|------|-----|--------|
| 通訊模式 | 異步 | 同步 |
| 可靠性 | 高（訊息持久化） | 依賴應用層 |
| 即時性 | 中 | 高 |
| 複雜度 | 高 | 中 |
| 適用情境 | 批次、整合 | 線上交易 |

---

## BA 實務應用

### 需求確認重點

| 問題 | 目的 |
|------|------|
| 「是即時交易還是批次處理？」 | 選擇通訊方式 |
| 「需要保證訊息送達嗎？」 | 確認可靠性需求 |
| 「回應時間要求是多少？」 | 評估效能需求 |
| 「對方系統是什麼？」 | 確認整合方式 |

### 常見問題排查

| 問題 | 可能原因 | 處理方式 |
|------|----------|----------|
| 訊息未送達 | MQ 佇列滿 | 檢查佇列空間 |
| 連線逾時 | 網路問題 | 檢查網路狀態 |
| 訊息格式錯誤 | 格式不符 | 檢查介面規格 |

---

## 練習題

### 題目 1
說明 MQ 和 Socket 通訊的主要差異。

### 題目 2
什麼情境適合使用 MQ？什麼情境適合使用 Socket？

### 題目 3
設計一個跨系統交易的通訊架構，說明使用 MQ 或 Socket 的理由。

---

## 重點回顧

| 概念 | 說明 |
|------|------|
| MQ | 訊息佇列，異步通訊 |
| Queue | 存放訊息的佇列 |
| Socket | TCP/IP 同步通訊 |
| 異步 | 發送與接收不需同步 |
| 同步 | 即時請求回應 |

---

## 延伸閱讀

- [Lesson 3-7：DB2 基本概念](lesson-3-7-db2-basic.md)
- [Lesson 4-6：跨系統資料交換](lesson-4-6-data-exchange.md)
