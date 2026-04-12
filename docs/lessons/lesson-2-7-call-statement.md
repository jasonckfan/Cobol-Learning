# Lesson 2-7: 呼叫外部程式 (CALL)

> 理解 COBOL 的模組化程式設計與程式間呼叫

---

## 學習目標

- 理解 CALL 語句的基本語法與用途
- 掌握參數傳遞的方式 (BY REFERENCE / BY CONTENT)
- 了解子程式的設計與回傳機制
- 掌握 BA 在分析程式呼叫關係時的關注點

---

## 一、CALL 語句基礎

### 1.1 什麼是 CALL？

CALL 語句允許一個 COBOL 程式呼叫另一個程式（稱為子程式或副程式），實現模組化設計和程式碼複用。

```
┌─────────────────────────────────────────────────────────────────┐
│              CALL 語句概念圖                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────┐          CALL          ┌─────────────────┐│
│   │   主程式        │ ─────────────────────> │   子程式        ││
│   │  (Main Program) │    傳遞參數            │ (Sub-program)   ││
│   │                 │ <───────────────────── │                 ││
│   │                 │    回傳結果            │                 ││
│   └─────────────────┘                        └─────────────────┘│
│                                                                 │
│   範例：                                                         │
│   • 主程式：利息計算批次 (CALCBAT)                              │
│   • 子程式：利息計算模組 (CALCINT)                              │
│   • 關係：CALCBAT 呼叫 CALCINT 來計算各種產品的利息             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 基本語法

```cobol
       *---- CALL 語句基本形式 ------------------------------------
       
       * 基本形式 (無參數)
       CALL 'subprogram-name'.
       
       * 傳遞參數 (預設 BY REFERENCE)
       CALL 'subprogram-name' 
           USING parameter-1 parameter-2.
       
       * 明確指定傳遞方式
       CALL 'subprogram-name'
           USING BY REFERENCE parameter-1
                 BY CONTENT   parameter-2.
       
       * 檢查回傳狀態
       CALL 'subprogram-name'
           USING parameter-1
           ON EXCEPTION
               PERFORM ERROR-HANDLING
           NOT ON EXCEPTION
               PERFORM SUCCESS-PROCESSING
           END-CALL.
```

---

## 二、參數傳遞方式

### 2.1 BY REFERENCE vs BY CONTENT

```
┌─────────────────────────────────────────────────────────────────┐
│              參數傳遞方式比較                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BY REFERENCE (預設)                                            │
│  ───────────────────                                            │
│  • 傳遞變數的位址 (記憶體位置)                                  │
│  • 子程式可以修改原始變數                                       │
│  • 類似其他語言的 "pass by reference"                          │
│  • 效率較高 (只需傳遞位址)                                      │
│                                                                 │
│  BY CONTENT                                                     │
│  ───────────                                                    │
│  • 傳遞變數的複製副本                                           │
│  • 子程式修改的是副本，不影響原始變數                           │
│  • 類似其他語言的 "pass by value"                              │
│  • 保護原始資料不被修改                                         │
│                                                                 │
│  BY VALUE (某些 COBOL 版本支援)                                │
│  ─────────────────────────────                                  │
│  • 傳遞實際數值                                                 │
│  • 主要用於與非 COBOL 程式介接                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 參數傳遞範例

```cobol
       *---- 主程式：計算客戶利息 ---------------------------------
       
       WORKING-STORAGE SECTION.
       01  WS-CUSTOMER-DATA.
           05  WS-CUST-ID        PIC X(10).
           05  WS-CUST-BALANCE   PIC S9(9)V99 COMP-3.
           05  WS-CUST-TYPE      PIC X.
       
       01  WS-INTEREST-RATE     PIC 9V9(4) COMP-3.
       01  WS-CALC-INTEREST     PIC S9(9)V99 COMP-3.
       01  WS-RETURN-CODE       PIC 9(4) COMP.
       
       PROCEDURE DIVISION.
       0000-MAIN.
           MOVE 'C001234567' TO WS-CUST-ID.
           MOVE 100000.00 TO WS-CUST-BALANCE.
           MOVE 'S' TO WS-CUST-TYPE.
           MOVE 2.5000 TO WS-INTEREST-RATE.
           
           * 呼叫利息計算子程式
           CALL 'CALCINT'
               USING BY REFERENCE WS-CUSTOMER-DATA  *> 可被子程式修改
                     BY CONTENT   WS-INTEREST-RATE  *> 保護原始值
                     BY REFERENCE WS-CALC-INTEREST  *> 接收計算結果
                     BY REFERENCE WS-RETURN-CODE    *> 接收狀態碼
           END-CALL.
           
           IF WS-RETURN-CODE = 0
               DISPLAY 'Calculated Interest: ' WS-CALC-INTEREST
           ELSE
               DISPLAY 'Calculation failed, RC: ' WS-RETURN-CODE
           END-IF.
           
           STOP RUN.
```

### 2.3 子程式設計

```cobol
       *---- 子程式：CALCINT (利息計算) ---------------------------
       
       IDENTIFICATION DIVISION.
       PROGRAM-ID. CALCINT.
       
       DATA DIVISION.
       LINKAGE SECTION.
       * 定義從主程式接收的參數
       01  LS-CUSTOMER-DATA.
           05  LS-CUST-ID        PIC X(10).
           05  LS-CUST-BALANCE   PIC S9(9)V99 COMP-3.
           05  LS-CUST-TYPE      PIC X.
       
       01  LS-INTEREST-RATE     PIC 9V9(4) COMP-3.
       01  LS-CALC-INTEREST     PIC S9(9)V99 COMP-3.
       01  LS-RETURN-CODE       PIC 9(4) COMP.
       
       PROCEDURE DIVISION USING LS-CUSTOMER-DATA
                                LS-INTEREST-RATE
                                LS-CALC-INTEREST
                                LS-RETURN-CODE.
       
       0000-MAIN.
           INITIALIZE LS-CALC-INTEREST
           MOVE 0 TO LS-RETURN-CODE
           
           * 驗證輸入
           IF LS-CUST-BALANCE < 0
               MOVE 1001 TO LS-RETURN-CODE
               GOBACK
           END-IF.
           
           IF LS-INTEREST-RATE <= 0
               MOVE 1002 TO LS-RETURN-CODE
               GOBACK
           END-IF.
           
           * 計算利息
           COMPUTE LS-CALC-INTEREST = 
               LS-CUST-BALANCE * LS-INTEREST-RATE / 100 / 12.
           
           GOBACK.                    *> 返回主程式
```

---

## 三、子程式類型

### 3.1 靜態呼叫 vs 動態呼叫

```
┌─────────────────────────────────────────────────────────────────┐
│              靜態呼叫 vs 動態呼叫                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  靜態呼叫 (Static Call)                                         │
│  ───────────────────────                                        │
│  CALL 'PROGNAME'                                                │
│  • 編譯時就決定子程式位址                                       │
│  • 執行效率較高                                                 │
│  • 子程式必須在編譯時存在                                       │
│  • 適合核心業務模組                                             │
│                                                                 │
│  動態呼叫 (Dynamic Call)                                        │
│  ────────────────────────                                       │
│  CALL WS-PROG-NAME                                              │
│  • 執行時才解析子程式位址                                       │
│  • 較有彈性，可根據條件呼叫不同程式                             │
│  • 稍慢，但可動態載入                                           │
│  • 適合可選功能或外掛                                           │
│                                                                 │
│  範例比較：                                                     │
│  靜態: CALL 'CALCINT'          *> 固定呼叫利息計算模組         │
│  動態: CALL WS-TXN-MODULE      *> 根據交易類型呼叫不同模組     │
│                                                                 │
└────────────────────────────────────────────────────────────────