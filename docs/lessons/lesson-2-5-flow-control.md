# Lesson 2-5: 流程控制 - IF、EVALUATE、PERFORM

> 理解 COBOL 的條件判斷與迴圈控制

---

## 學習目標

- 掌握 IF 條件判斷的各種形式
- 理解 EVALUATE 多條件判斷的使用
- 學會 PERFORM 迴圈與副程式的應用
- 了解 BA 在閱讀程式邏輯時的關注點

---

## 一、IF 條件判斷

### 1.1 IF 基本語法

```cobol
       *---- IF 基本語法 ------------------------------------------
       
       * 簡單 IF
       IF 條件
           執行語句
       END-IF.
       
       * IF-ELSE
       IF 條件
           執行語句-A
       ELSE
           執行語句-B
       END-IF.
       
       * IF-ELSE-IF (巢狀)
       IF 條件-1
           執行語句-1
       ELSE IF 條件-2
           執行語句-2
       ELSE IF 條件-3
           執行語句-3
       ELSE
           執行語句-其他
       END-IF.
```

### 1.2 條件運算子

```
┌─────────────────────────────────────────────────────────────────┐
│              COBOL 條件運算子                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  運算子        意義              範例                           │
│  ───────       ────              ────                           │
│                                                                 │
│  = 或 EQUAL    等於              IF WS-A = WS-B                │
│  > 或 GREATER  大於              IF WS-A > 100                 │
│  < 或 LESS     小於              IF WS-A < WS-B                │
│  >=            大於等於          IF WS-A >= 0                  │
│  <=            小於等於          IF WS-A <= 100                │
│  <> 或 NOT =   不等於            IF WS-A <> WS-B               │
│                                                                 │
│  AND           且                IF A > 0 AND B > 0            │
│  OR            或                IF A = 1 OR B = 2             │
│  NOT           非                IF NOT WS-FLAG = 'Y'          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 IF 實務範例

```cobol
       *---- IF 實務範例 ------------------------------------------
       
       * 範例 1: 帳戶餘額檢查
       IF ACCT-BALANCE < 0
           MOVE 'OVERDRAWN' TO WS-STATUS
           ADD 1 TO WS-OD-COUNT
       ELSE IF ACCT-BALANCE < 1000
           MOVE 'LOW-BALANCE' TO WS-STATUS
       ELSE
           MOVE 'NORMAL' TO WS-STATUS
       END-IF.
       
       * 範例 2: 複合條件
       IF ACCT-TYPE = 'SAVINGS' AND 
          ACCT-BALANCE >= 10000 AND
          ACCT-STATUS = 'ACTIVE'
           COMPUTE WS-BONUS-INT = ACCT-BALANCE * 0.001
           ADD WS-BONUS-INT TO ACCT-INTEREST
       END-IF.
       
       * 範例 3: 使用 Level 88 條件
       IF ACCT-CLOSED
           DISPLAY 'Account is closed'
       ELSE IF ACCT-FROZEN
           DISPLAY 'Account is frozen'
       ELSE IF ACCT-ACTIVE
           PERFORM PROCESS-TRANSACTION
       END-IF.
       
       * 範例 4: 巢狀 IF
       IF TXN-TYPE = 'WITHDRAW'
           IF ACCT-BALANCE >= TXN-AMOUNT
               SUBTRACT TXN-AMOUNT FROM ACCT-BALANCE
               WRITE TXN-RECORD
           ELSE
               MOVE 'INSUFFICIENT-FUNDS' TO WS-ERROR
               PERFORM ERROR-HANDLING
           END-IF
       END-IF.
```

---

## 二、EVALUATE 多條件判斷

### 2.1 EVALUATE 基本語法

EVALUATE 類似於其他語言的 switch-case，適合多條件分支。

```cobol
       *---- EVALUATE 基本語法 ------------------------------------
       
       EVALUATE 判斷對象
           WHEN 值-1
               執行語句-1
           WHEN 值-2
               執行語句-2
           WHEN 值-3
               執行語句-3
           WHEN OTHER
               執行語句-其他
       END-EVALUATE.
       
       * 多值判斷
       EVALUATE WS-GRADE
           WHEN 'A'
               MOVE 'EXCELLENT' TO WS-RESULT
           WHEN 'B'
               MOVE 'GOOD' TO WS-RESULT
           WHEN 'C'
               MOVE 'AVERAGE' TO WS-RESULT
           WHEN 'D' 'E'  *> 多個值
               MOVE 'POOR' TO WS-RESULT
           WHEN OTHER
               MOVE 'INVALID' TO WS-RESULT
       END-EVALUATE.
```

### 2.2 EVALUATE TRUE (條件判斷)

```cobol
       *---- EVALUATE TRUE 範例 -----------------------------------
       
       * 類似 IF-ELSE-IF，但更清晰
       EVALUATE TRUE
           WHEN ACCT-BALANCE < 0
               MOVE 'OVERDRAWN' TO WS-STATUS
           WHEN ACCT-BALANCE < 1000
               MOVE 'LOW-BALANCE' TO WS-STATUS
           WHEN ACCT-BALANCE < 10000
               MOVE 'MEDIUM-BALANCE' TO WS-STATUS
           WHEN OTHER
               MOVE 'HIGH-BALANCE' TO WS-STATUS
       END-EVALUATE.
       
       * 複合條件
       EVALUATE TRUE
           WHEN ACCT-TYPE = 'SAVINGS' AND ACCT-BALANCE >= 10000
               MOVE 'VIP-SAVINGS' TO WS-CATEGORY
           WHEN ACCT-TYPE = 'SAVINGS' AND ACCT-BALANCE < 10000
               MOVE 'STD-SAVINGS' TO WS-CATEGORY
           WHEN ACCT-TYPE = 'CHECKING' AND ACCT-BALANCE >= 5000
               MOVE 'VIP-CHECKING' TO WS-CATEGORY
           WHEN ACCT-TYPE = 'CHECKING' AND ACCT-BALANCE < 5000
               MOVE 'STD-CHECKING' TO WS-CATEGORY
           WHEN OTHER
               MOVE 'OTHER' TO WS-CATEGORY
       END-EVALUATE.
```

### 2.3 IF vs EVALUATE 選擇指南

```
┌─────────────────────────────────────────────────────────────────┐
│              IF vs EVALUATE 選擇指南                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  使用 IF 當：                                                   │
│  • 條件是範圍比較 (> < >= <=)                                  │
│  • 條件是複合邏輯 (AND/OR)                                     │
│  • 只有 2-3 個分支                                             │
│  • 巢狀條件較深                                                │
│                                                                 │
│  使用 EVALUATE 當：                                             │
│  • 多個離散值判斷                                              │
│  • 類似 switch-case 場景                                       │
│  • 條件是單一變數的多個值                                      │
│  • 有 4 個以上分支                                             │
│  • 使用 EVALUATE TRUE 進行多條件分支                           │
│                                                                 │
│  💡 銀行實務：                                                  │
│  • 交易類型處理 → EVALUATE                                     │
│  • 帳戶狀態處理 → EVALUATE                                     │
│  • 餘額檢查 → IF                                               │
│  • 權限檢查 → IF                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 三、PERFORM 迴圈控制

### 3.1 PERFORM 基本形式

```cobol
       *---- PERFORM 基本語法 -------------------------------------
       
       * 1. 執行一次段落
       PERFORM 段落名稱.
       
       * 2. 執行多次
       PERFORM 段落名稱 n TIMES.
       
       * 3. 直到條件成立 (類似 do-while)
       PERFORM 段落名稱 UNTIL 條件.
       
       * 4. 類似 for 迴圈
       PERFORM 段落名稱 
           VARYING 變數 FROM 起始 BY 增量 UNTIL 條件.
       
       * 5. 執行多個連續段落
       PERFORM 段落-1 THRU 段落-n.
       
       * 6. 巢狀 PERFORM (新版 COBOL)
       PERFORM UNTIL 外層條件
           PERFORM UNTIL 內層條件
               執行語句
           END-PERFORM
       END-PERFORM.
```

### 3.2 PERFORM 範例

```cobol
       *---- PERFORM 範例 -----------------------------------------
       
       * 範例 1: 執行 10 次初始化
       PERFORM INIT-ARRAY 10 TIMES.
       
       * 範例 2: 讀檔直到結束
       PERFORM PROCESS-RECORD 
           UNTIL WS-EOF-FLAG = 'Y'.
       
       * 範例 3: 陣列處理 (for 迴圈)
       PERFORM PROCESS-ELEMENT 
           VARYING WS-INDEX FROM 1 BY 1 
           UNTIL WS-INDEX > 100.
       
       * 範例 4: 巢狀迴圈 (處理二維陣列)
       PERFORM VARYING WS-ROW FROM 1 BY 1 
               UNTIL WS-ROW > 10
           PERFORM VARYING WS-COL FROM 1 BY 1 
                   UNTIL WS-COL > 5
               COMPUTE WS-TOTAL = WS-TOTAL + WS-ARRAY(WS-ROW, WS-COL)
           END-PERFORM
       END-PERFORM.
       
       * 範例 5: 連續段落執行
       PERFORM 1000-INIT 
           THRU 1000-INIT-EXIT.
```

### 3.3 檔案處理迴圈

```cobol
       *---- 檔案處理標準模式 -------------------------------------
       
       * 循序檔讀取標準模式
       2000-PROCESS-FILE.
           OPEN INPUT TRANSACTION-FILE
           
           * 先讀第一筆
           READ TRANSACTION-FILE
               AT END
                   MOVE 'Y' TO WS-EOF-FLAG
           END-READ
           
           * 迴圈處理直到結束
           PERFORM UNTIL WS-EOF-FLAG = 'Y'
               PERFORM 2100-PROCESS-RECORD
               READ TRANSACTION-FILE
                   AT END
                       MOVE 'Y' TO WS-EOF-FLAG
               END-READ
           END-PERFORM
           
           CLOSE TRANSACTION-FILE
           .
       
       2100-PROCESS-RECORD.
           * 處理單筆記錄的邏輯
           IF TXN-TYPE = 'DEPOSIT'
               PERFORM 2110-PROCESS-DEPOSIT
           ELSE IF TXN-TYPE = 'WITHDRAW'
               PERFORM 2120-PROCESS-WITHDRAW
           ELSE
               PERFORM 2130-PROCESS-OTHER
           END-IF
           .
```

---

## 四、流程控制最佳實踐

### 4.1 銀行程式結構模式

```cobol
       *---- 標準批次程式結構 -------------------------------------
       
       PROCEDURE DIVISION.
       
       0000-MAIN.
           PERFORM 1000-INITIALIZE
           PERFORM 2000-PROCESS
           PERFORM 3000-TERMINATE
           STOP RUN
           .
       
       1000-INITIALIZE.
           * 開檔、初始化變數、讀第一筆
           .
       
       2000-PROCESS.
           * 主處理迴圈
           PERFORM UNTIL WS-EOF
               PERFORM 2100-READ-AND-PROCESS
           END-PERFORM
           .
       
       2100-READ-AND-PROCESS.
           * 處理單筆記錄
           EVALUATE TXN-TYPE
               WHEN 'DP'
                   PERFORM 2110-DEPOSIT
               WHEN 'WD'
                   PERFORM 2120-WITHDRAW
               WHEN 'TR'
                   PERFORM 2130-TRANSFER
               WHEN OTHER
                   PERFORM 2140-ERROR
           END-EVALUATE
           
           READ INPUT-FILE
               AT END
                   MOVE 'Y' TO WS-EOF
           END-READ
           .
       
       3000-TERMINATE.
           * 關檔、寫統計、結束
           .
```

### 4.2 錯誤處理模式

```cobol
       *---- 錯誤處理標準模式 -------------------------------------
       
       2000-PROCESS-TRANSACTION.
           INITIALIZE WS-ERROR-FLAG
           
           * 驗證 1: 帳戶存在
           IF NOT ACCOUNT-EXISTS
               MOVE 'ACCT-NOT-FOUND' TO WS-ERROR-MSG
               MOVE 'Y' TO WS-ERROR-FLAG
           END-IF
           
           * 驗證 2: 帳戶狀態
           IF WS-ERROR-FLAG = 'N' AND ACCT-CLOSED
               MOVE 'ACCT-CLOSED' TO WS-ERROR-MSG
               MOVE 'Y' TO WS-ERROR-FLAG
           END-IF
           
           * 驗證 3: 餘額足夠
           IF WS-ERROR-FLAG = 'N' AND 
              TXN-TYPE = 'WITHDRAW' AND
              ACCT-BALANCE < TXN-AMOUNT
               MOVE 'INSUFFICIENT-FUNDS' TO WS-ERROR-MSG
               MOVE 'Y' TO WS-ERROR-FLAG
           END-IF
           
           * 處理結果
           EVALUATE WS-ERROR-FLAG
               WHEN 'Y'
                   PERFORM 2900-WRITE-ERROR
               WHEN 'N'
                   PERFORM 2100-PROCESS-VALID-TXN
           END-EVALUATE
           .
```

---

## 五、BA 閱讀指南

### 5.1 程式邏輯追蹤技巧

```
┌─────────────────────────────────────────────────────────────────┐
│              BA 程式邏輯追蹤技巧                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: 找到主程序入口                                         │
│  ─────────────────────────                                      │
│  • 通常是最上面的段落 (0000-MAIN 或 MAIN-PARA)                 │
│  • 追蹤 PERFORM 的執行順序                                      │
│                                                                 │
│  Step 2: 理解程式架構                                           │
│  ─────────────────────                                          │
│  • INITIALIZE → PROCESS → TERMINATE                            │
│  • 識別主迴圈位置                                               │
│  • 標記重要副程式                                               │
│                                                                 │
│  Step 3: 追蹤條件判斷                                           │
│  ─────────────────────                                          │
│  • 標記 IF/EVALUATE 的條件與分支                                │
│  • 注意巢狀條件的層級                                           │
│  • 記錄業務規則                                                 │
│                                                                 │
│  Step 4: 識別關鍵計算                                           │
│  ─────────────────────                                          │
│  • 標記 COMPUTE/ADD/SUBTRACT 等計算                             │
│  • 記錄計算公式                                                 │
│  • 注意精度處理                                                 │
│                                                                 │
│  Step 5: 記錄檔案操作                                           │
│  ─────────────────────                                          │
│  • 標記 READ/WRITE/REWRITE 位置                                 │
│  • 追蹤資料流向                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 常見邏輯陷阱

| 陷阱 | 說明 | 範例 |
|------|------|------|
| **遺漏 END-IF** | 舊版 COBOL 可能沒有結束標記 | 使用句點結束，容易出錯 |
| **PERFORM 無限迴圈** | 忘記更新終止條件 | UNTIL 條件永遠不成立 |
| **巢狀過深** | IF 巢狀超過 3-4 層 | 難以閱讀和維護 |
| **ELSE 遺漏** | 沒有處理其他情況 | 邏輯不完整 |
| **條件順序錯誤** | 範圍判斷順序不當 | 大範圍在前，小範圍永遠不會執行 |

---

## 六、練習題

### 練習 1: IF vs EVALUATE 選擇

請判斷以下場景應使用 IF 還是 EVALUATE：

| 場景 | 選擇 | 理由 |
|------|------|------|
| 檢查帳戶餘額是否大於 1000 | | |
| 處理 5 種不同的交易類型 | | |
| 判斷年齡是否成年 (>= 18) | | |
| 根據成績等級給評語 (A/B/C/D/F) | | |

### 練習 2: 程式邏輯設計

請為以下需求設計程式邏輯：

**需求**：設計一個利息計算邏輯，規則如下：
- 儲蓄帳戶 (SAVINGS)：餘額 >= 10000 利率 2%，< 10000 利率 1%
- 支票帳戶 (CHECKING)：一律不計息
- 定存帳戶 (TIME)：依期限，1年 3%、2年 3.5%、3年 4%

**要求**：使用適當的 IF 或 EVALUATE

### 練習 3: 程式錯誤找出

找出以下程式的邏輯錯誤：

```cobol
       2000-CALCULATE-FEE.
           IF TXN-AMOUNT < 1000
               MOVE 10 TO WS-FEE
           ELSE IF TXN-AMOUNT < 5000
               MOVE 20 TO WS-FEE
           ELSE IF TXN-AMOUNT < 1000
               MOVE 5 TO WS-FEE
           ELSE
               MOVE 30 TO WS-FEE
           END-IF.
```

**問題**：
1. 有什麼邏輯錯誤？
2. 如何修正？

---

## 七、總結

### 本課程重點回顧

✅ **IF**: 條件判斷，適合範圍比較和複合條件

✅ **EVALUATE**: 多條件分支，適合離散值判斷

✅ **PERFORM**: 迴圈控制，支援多種形式

✅ **程式結構**: INIT → PROCESS → TERM 標準模式

✅ **BA 關注點**: 追蹤執行順序、識別業務規則、記錄計算公式

---

## 延伸閱讀

- [Lesson 2-6: COPYBOOK 與程式碼複用](lesson-2-6-copybook.md)
- [Lesson 2-4: COMP, COMP-3, Packed Decimal](lesson-2-4-comp-usage.md)

---

*課程版本: 1.0 | 更新日期: 2026-04-11*
