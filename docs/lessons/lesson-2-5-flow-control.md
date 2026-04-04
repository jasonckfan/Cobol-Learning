# Lesson 2-5：流程控制：IF、EVALUATE、PERFORM

## 學習目標

- 掌握 COBOL 的條件判斷語法
- 理解 EVALUATE 多重選擇結構
- 能夠閱讀 PERFORM 迴圈與段落呼叫

---

## 為什麼流程控制很重要？

銀行程式的核心是**業務邏輯**：
- 如果餘額不足，拒絕交易
- 根據帳戶類型，套用不同利率
- 重複處理每一筆交易記錄

這些都需要流程控制來實現。

---

## IF 敘述

### 基本語法

```cobol
       IF 條件
           敘述
       END-IF.
```

或帶 ELSE：

```cobol
       IF 條件
           敘述1
       ELSE
           敘述2
       END-IF.
```

### 範例

```cobol
       IF ACCT-BALANCE < 0
           DISPLAY '帳戶透支'
           MOVE 'O' TO ACCT-STATUS
       ELSE
           DISPLAY '帳戶正常'
       END-IF.
```

### 巢狀 IF

```cobol
       IF ACCT-TYPE = 'SA'
           IF ACCT-BALANCE > 100000
               MOVE 'P' TO ACCT-TIER
           ELSE
               MOVE 'R' TO ACCT-TIER
           END-IF
       ELSE
           IF ACCT-TYPE = 'CA'
               MOVE 'S' TO ACCT-TIER
           END-IF
       END-IF.
```

---

## 條件運算子

### 比較運算子

| COBOL | 意義 | 範例 |
|-------|------|------|
| `=` | 等於 | `ACCT-TYPE = 'SA'` |
| `NOT =` | 不等於 | `STATUS NOT = 'C'` |
| `>` | 大於 | `BALANCE > 0` |
| `<` | 小於 | `BALANCE < 100` |
| `>=` | 大於等於 | `BALANCE >= 1000` |
| `<=` | 小於等於 | `BALANCE <= 50000` |

### 邏輯運算子

| COBOL | 意義 | 範例 |
|-------|------|------|
| `AND` | 且 | `BALANCE > 0 AND STATUS = 'A'` |
| `OR` | 或 | `TYPE = 'SA' OR TYPE = 'CA'` |
| `NOT` | 非 | `NOT EOF-REACHED` |

### 範例

```cobol
       IF ACCT-STATUS = 'A' AND ACCT-BALANCE > 10000
           PERFORM CALCULATE-PREMIUM-INTEREST
       END-IF.

       IF TRANS-TYPE = 'WD' OR TRANS-TYPE = 'TF'
           PERFORM CHECK-SUFFICIENT-FUNDS
       END-IF.
```

---

## 數值比較

### GREATER THAN / LESS THAN

```cobol
       IF ACCT-BALANCE GREATER THAN 100000
           DISPLAY '高資產客戶'
       END-IF.
```

也可寫成：

```cobol
       IF ACCT-BALANCE > 100000
           DISPLAY '高資產客戶'
       END-IF.
```

### 範圍檢查

```cobol
       IF ACCT-BALANCE GREATER THAN 10000
          AND LESS THAN 100000
           DISPLAY '中等資產客戶'
       END-IF.
```

---

## 字串比較

### 基本比較

```cobol
       IF ACCT-TYPE = 'SA'
           PERFORM PROCESS-SAVINGS
       END-IF.
```

### 包含檢查

```cobol
       IF ACCT-NAME(1:4) = 'VIP '
           MOVE 'V' TO CUST-TYPE
       END-IF.
```

---

## EVALUATE 敘述

類似其他語言的 switch/case，用於多重選擇。

### 基本語法

```cobol
       EVALUATE 變數
           WHEN 值1
               敘述1
           WHEN 值2
               敘述2
           WHEN OTHER
               預設敘述
       END-EVALUATE.
```

### 範例

```cobol
       EVALUATE ACCT-TYPE
           WHEN 'SA'
               MOVE 0.02 TO WS-INT-RATE
           WHEN 'CA'
               MOVE 0.005 TO WS-INT-RATE
           WHEN 'FD'
               MOVE 0.03 TO WS-INT-RATE
           WHEN OTHER
               MOVE 0 TO WS-INT-RATE
       END-EVALUATE.
```

### 多值匹配

```cobol
       EVALUATE ACCT-STATUS
           WHEN 'A'
               PERFORM PROCESS-ACTIVE
           WHEN 'D' OR 'S'
               PERFORM PROCESS-DORMANT
           WHEN 'C'
               PERFORM PROCESS-CLOSED
       END-EVALUATE.
```

### 範圍匹配

```cobol
       EVALUATE TRUE
           WHEN ACCT-BALANCE > 1000000
               MOVE 'PLATINUM' TO CUST-TIER
           WHEN ACCT-BALANCE > 100000
               MOVE 'GOLD' TO CUST-TIER
           WHEN ACCT-BALANCE > 10000
               MOVE 'SILVER' TO CUST-TIER
           WHEN OTHER
               MOVE 'REGULAR' TO CUST-TIER
       END-EVALUATE.
```

> 💡 **技巧**：`EVALUATE TRUE` 讓你可以用條件式而非固定值來匹配。

### 多重條件

```cobol
       EVALUATE TRUE
           WHEN ACCT-TYPE = 'SA' AND ACCT-BALANCE > 100000
               MOVE 0.025 TO WS-INT-RATE
           WHEN ACCT-TYPE = 'SA' AND ACCT-BALANCE <= 100000
               MOVE 0.02 TO WS-INT-RATE
           WHEN ACCT-TYPE = 'CA'
               MOVE 0.005 TO WS-INT-RATE
           WHEN OTHER
               MOVE 0 TO WS-INT-RATE
       END-EVALUATE.
```

---

## PERFORM 敘述

PERFORM 是 COBOL 的核心控制結構，用於呼叫段落（paragraph）。

### 基本呼叫

```cobol
       PERFORM 1000-INIT.
       PERFORM 2000-PROCESS.
       PERFORM 3000-CLEANUP.
```

### 執行多次

```cobol
       PERFORM 2000-PROCESS 10 TIMES.
```

### 條件執行

```cobol
       PERFORM 2000-PROCESS UNTIL EOF-REACHED.
```

### 迴圈結構

```cobol
       PERFORM VARYING WS-IDX FROM 1 BY 1 UNTIL WS-IDX > 100
           DISPLAY 'PROCESSING: ' WS-IDX
           PERFORM PROCESS-ONE-ITEM
       END-PERFORM.
```

---

## 銀行實務範例

### 日終批次處理主流程

```cobol
       PROCEDURE DIVISION.
       0000-MAIN.
           PERFORM 1000-INIT
           PERFORM 2000-PROCESS UNTIL EOF-REACHED
           PERFORM 3000-SUMMARY
           PERFORM 9000-TERM
           STOP RUN.

       1000-INIT.
           OPEN INPUT ACCT-FILE
           OPEN OUTPUT RPT-FILE
           MOVE 0 TO WS-TOTAL-BALANCE
           MOVE 0 TO WS-ACCT-COUNT
           PERFORM 1100-READ-FIRST.

       1100-READ-FIRST.
           READ ACCT-FILE
               AT END
                   SET EOF-REACHED TO TRUE
               NOT AT END
                   ADD 1 TO WS-ACCT-COUNT
           END-READ.

       2000-PROCESS.
           PERFORM 2100-CALC-INTEREST
           PERFORM 2200-UPDATE-BALANCE
           PERFORM 2300-WRITE-REPORT
           PERFORM 2400-READ-NEXT.

       2100-CALC-INTEREST.
           EVALUATE ACCT-TYPE
               WHEN 'SA'
                   COMPUTE WS-INTEREST = ACCT-BALANCE * 0.02
               WHEN 'CA'
                   COMPUTE WS-INTEREST = ACCT-BALANCE * 0.005
               WHEN 'FD'
                   COMPUTE WS-INTEREST = ACCT-BALANCE * 0.03
               WHEN OTHER
                   MOVE 0 TO WS-INTEREST
           END-EVALUATE.

       2200-UPDATE-BALANCE.
           ADD WS-INTEREST TO ACCT-BALANCE
           ADD ACCT-BALANCE TO WS-TOTAL-BALANCE.

       2300-WRITE-REPORT.
           MOVE ACCT-NO TO RPT-ACCT-NO
           MOVE ACCT-BALANCE TO RPT-BALANCE
           MOVE WS-INTEREST TO RPT-INTEREST
           WRITE RPT-RECORD.

       2400-READ-NEXT.
           READ ACCT-FILE
               AT END
                   SET EOF-REACHED TO TRUE
               NOT AT END
                   ADD 1 TO WS-ACCT-COUNT
           END-READ.

       3000-SUMMARY.
           DISPLAY '=============================='
           DISPLAY 'TOTAL ACCOUNTS: ' WS-ACCT-COUNT
           DISPLAY 'TOTAL BALANCE:  ' WS-TOTAL-BALANCE
           DISPLAY '=============================='.

       9000-TERM.
           CLOSE ACCT-FILE
           CLOSE RPT-FILE.
```

---

## PERFORM 常見模式

### 模式 1：主控迴圈

```cobol
       PERFORM 1000-INIT
       PERFORM 2000-PROCESS UNTIL EOF-REACHED
       PERFORM 9000-TERM
       STOP RUN.
```

### 模式 2：陣列處理

```cobol
       PERFORM VARYING WS-IDX FROM 1 BY 1
           UNTIL WS-IDX > WS-MAX-ITEMS
           IF ITEM-STATUS(WS-IDX) = 'A'
               PERFORM PROCESS-ITEM
           END-IF
       END-PERFORM.
```

### 模式 3：條件迴圈

```cobol
       MOVE 0 TO WS-RETRY-COUNT.
       PERFORM UNTIL WS-FILE-STATUS = '00'
                          OR WS-RETRY-COUNT > 3
           ADD 1 TO WS-RETRY-COUNT
           PERFORM ATTEMPT-FILE-OPEN
       END-PERFORM.
```

---

## CONTINUE 與 NEXT SENTENCE

### CONTINUE

什麼都不做，繼續下一個敘述。

```cobol
       IF ACCT-STATUS = 'C'
           CONTINUE
       ELSE
           PERFORM PROCESS-ACCOUNT
       END-IF.
```

### NEXT SENTENCE

跳到下一個句子（句點後）。

```cobol
       IF ACCT-STATUS = 'C'
           NEXT SENTENCE
       ELSE
           PERFORM PROCESS-ACCOUNT.
       *> 這裡是下一個句子
```

> 💡 **建議**：現代 COBOL 偏好使用 CONTINUE 和 END-IF，避免 NEXT SENTENCE。

---

## BA 實務應用

### 如何閱讀業務邏輯？

1. **找到主流程**：通常是 0000-MAIN
2. **追蹤 PERFORM**：看有哪些段落被呼叫
3. **找條件判斷**：IF 和 EVALUATE 是業務規則所在
4. **理解迴圈**：PERFORM UNTIL 通常是處理多筆資料

### 需求分析時的關鍵點

| 看到的結構 | 業務含義 |
|------------|----------|
| `IF ... ELSE ...` | 業務分流邏輯 |
| `EVALUATE` | 多種情況的分類處理 |
| `PERFORM UNTIL` | 批次處理所有資料 |
| `PERFORM n TIMES` | 固定次數的重複處理 |

### 影響分析範例

**情境：新增 VIP 客戶等級**

```cobol
       *> 原本的客戶分級
       EVALUATE TRUE
           WHEN ACCT-BALANCE > 100000
               MOVE 'GOLD' TO CUST-TIER
           WHEN ACCT-BALANCE > 10000
               MOVE 'SILVER' TO CUST-TIER
           WHEN OTHER
               MOVE 'REGULAR' TO CUST-TIER
       END-EVALUATE.

       *> 新增 VIP 等級後
       EVALUATE TRUE
           WHEN ACCT-BALANCE > 1000000
               MOVE 'PLATINUM' TO CUST-TIER  *> 新增
           WHEN ACCT-BALANCE > 100000
               MOVE 'GOLD' TO CUST-TIER
           WHEN ACCT-BALANCE > 10000
               MOVE 'SILVER' TO CUST-TIER
           WHEN OTHER
               MOVE 'REGULAR' TO CUST-TIER
       END-EVALUATE.
```

**影響**：
1. 找到所有客戶分級的 EVALUATE
2. 檢查報表是否有客戶等級欄位
3. 確認相關統計邏輯是否需要調整

---

## 練習題

### 題目 1
將以下巢狀 IF 改寫為 EVALUATE：

```cobol
       IF ACCT-TYPE = 'SA'
           IF ACCT-BALANCE > 100000
               MOVE 0.025 TO WS-RATE
           ELSE
               MOVE 0.02 TO WS-RATE
           END-IF
       ELSE
           IF ACCT-TYPE = 'CA'
               MOVE 0.005 TO WS-RATE
           ELSE
               MOVE 0 TO WS-RATE
           END-IF
       END-IF.
```

### 題目 2
說明以下程式的執行流程：

```cobol
       PERFORM 1000-INIT
       PERFORM 2000-PROCESS UNTIL WS-COUNT > 10
       PERFORM 9000-TERM.
```

### 題目 3
設計一個 EVALUATE 結構，根據交易類型執行不同處理：
- 'DP'：存款處理
- 'WD'：提款處理（需檢查餘額）
- 'TF'：轉帳處理
- 其他：顯示錯誤訊息

---

## 重點回顧

| 語法 | 用途 | 範例 |
|------|------|------|
| IF | 條件判斷 | `IF A > B ... END-IF` |
| EVALUATE | 多重選擇 | `EVALUATE X WHEN 'A' ... END-EVALUATE` |
| PERFORM | 呼叫段落 | `PERFORM 1000-INIT` |
| PERFORM UNTIL | 條件迴圈 | `PERFORM P UNTIL EOF` |
| PERFORM n TIMES | 計次迴圈 | `PERFORM P 10 TIMES` |
| PERFORM VARYING | 迭代迴圈 | `PERFORM VARYING I FROM 1 BY 1...` |

---

## 延伸閱讀

- [Lesson 2-6：COPYBOOK 與程式碼複用](lesson-2-6-copybook.md)
- [Lesson 3-1：Sequential File 與 VSAM File](lesson-3-1-file-types.md)
