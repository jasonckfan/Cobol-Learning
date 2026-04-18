# Lesson 7-3: 缺陷分析練習

> 學習分析程式缺陷與問題排查

---

## 學習目標

- 理解缺陷分析的基本流程
- 掌握常見 COBOL 程式錯誤類型
- 學會使用日誌與追蹤技術
- 提升問題定位與解決能力

---

## 一、缺陷分析流程

### 1.1 問題排查五步法

```
┌─────────────────────────────────────────────────────────────────┐
│              缺陷分析五步法                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 問題描述                                                    │
│  ─────────────                                                  │
│  • 收集錯誤訊息                                                 │
│  • 確認發生時間、頻率                                           │
│  • 了解影響範圍                                                 │
│                                                                 │
│  2. 重現問題                                                    │
│  ─────────────                                                  │
│  • 在測試環境重現                                               │
│  • 確認觸發條件                                                 │
│  • 記錄重現步驟                                                 │
│                                                                 │
│  3. 定位原因                                                    │
│  ─────────────                                                  │
│  • 分析程式邏輯                                                 │
│  • 檢查資料狀態                                                 │
│  • 追蹤執行流程                                                 │
│                                                                 │
│  4. 修復驗證                                                    │
│  ─────────────                                                  │
│  • 制定修復方案                                                 │
│  • 實施修復                                                     │
│  • 測試驗證                                                     │
│                                                                 │
│  5. 預防措施                                                    │
│  ─────────────                                                  │
│  • 更新測試案例                                                 │
│  • 檢視類似程式                                                 │
│  • 文件化經驗                                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、常見缺陷類型

### 2.1 資料相關錯誤

| 錯誤類型 | 說明 | 範例 |
|----------|------|------|
| **數值溢出** | 計算結果超過欄位長度 | 9(5) 欄位存入 100000 |
| **除零錯誤** | 除以零 | COMPUTE A = B / 0 |
| **資料格式錯誤** | 非數字存入數字欄位 | MOVE 'ABC' TO NUM-FIELD |
| **小數位錯誤** | 小數計算精度遺失 | 利率計算未考慮精度 |
| **符號錯誤** | 正負號處理不當 | 負數比較邏輯錯誤 |

### 2.2 檔案操作錯誤

| 錯誤類型 | 說明 | 範例 |
|----------|------|------|
| **檔案未開啟** | 操作前未 OPEN | READ 未開啟的檔案 |
| **重複開啟** | 已開啟又 OPEN | OPEN 兩次 |
| **檔案結束未處理** | 讀到 EOF 未停止 | 無限迴圈讀檔 |
| **Key 重複** | VSAM 寫入重複 Key | WRITE 重複 Key |
| **記錄不存在** | 讀取不存在的 Key | READ INVALID KEY |

### 2.3 邏輯錯誤

| 錯誤類型 | 說明 | 範例 |
|----------|------|------|
| **條件判斷錯誤** | IF 條件寫反 | IF A > B 寫成 IF A < B |
| **迴圈無限** | 終止條件不會成立 | UNTIL 條件永遠為假 |
| **初始化遺漏** | 變數未給初始值 | 計數器未設為 0 |
| **流程錯誤** | PERFORM 順序錯誤 | 先寫後讀 |
| **範圍錯誤** | 陣列索引超出範圍 | 存取第 101 個元素 |

---

## 三、案例分析

### 案例 1: 利息計算錯誤

**問題描述**：客戶投訴利息計算有誤，少算約 0.01 元。

**問題程式碼**：
```cobol
       COMPUTE WS-INTEREST = 
           PRINCIPAL * RATE * DAYS / 365.
```

**分析**：
- 問題：整數除法導致精度遺失
- 365 是整數，計算結果被截斷
- 應改為：365.0 或 36500

**修復**：
```cobol
       COMPUTE WS-INTEREST = 
           PRINCIPAL * RATE * DAYS / 36500.
```

### 案例 2: 檔案處理無限迴圈

**問題描述**：批次程式執行時間過長，似乎卡住。

**問題程式碼**：
```cobol
       PERFORM UNTIL WS-EOF
           READ INPUT-FILE
               AT END
                   MOVE 'Y' TO WS-EOF
           END-READ
           PERFORM PROCESS-RECORD
       END-PERFORM.
```

**分析**：
- 問題：AT END 只在 READ 成功時檢查
- 如果 READ 失敗，不會設 WS-EOF
- 導致無限迴圈

**修復**：
```cobol
       PERFORM UNTIL WS-EOF
           READ INPUT-FILE
               AT END
                   MOVE 'Y' TO WS-EOF
               NOT AT END
                   PERFORM PROCESS-RECORD
           END-READ
       END-PERFORM.
```

### 案例 3: 日期比較錯誤

**問題描述**：到期檢查功能未正確識別已到期帳戶。

**問題程式碼**：
```cobol
       IF EXPIRY-DATE < CURRENT-DATE
           MOVE 'EXPIRED' TO STATUS
       END-IF.
```

**分析**：
- 問題：日期格式為 YYYYMMDD (數字)
- 2024/01/01 儲存為 20240101
- 比較邏輯正確，但可能是資料問題

**進一步檢查**：
- 發現 EXPIRY-DATE 格式為 YYMMDD (2位年)
- 240101 vs 20240101 比較錯誤

**修復**：
```cobol
       * 統一轉換為 YYYYMMDD 格式
       IF EXPIRY-DATE-FORMAT = 'YYMMDD'
           COMPUTE WS-EXP-DATE = 20000000 + EXPIRY-DATE
       ELSE
           MOVE EXPIRY-DATE TO WS-EXP-DATE
       END-IF
       
       IF WS-EXP-DATE < CURRENT-DATE
           MOVE 'EXPIRED' TO STATUS
       END-IF.
```

---

## 四、除錯技巧

### 4.1 DISPLAY 追蹤

```cobol
       * 在關鍵點加入 DISPLAY
       DISPLAY 'DEBUG: Before calc, PRINCIPAL=' PRINCIPAL.
       DISPLAY 'DEBUG: RATE=' RATE ' DAYS=' DAYS.
       
       COMPUTE WS-INTEREST = 
           PRINCIPAL * RATE * DAYS / 36500.
       
       DISPLAY 'DEBUG: After calc, INTEREST=' WS-INTEREST.
```

### 4.2 資料傾印

```cobol
       * 傾印整個記錄
       DISPLAY 'RECORD DUMP:'.
       DISPLAY 'ACCT-NUMBER=' ACCT-NUMBER.
       DISPLAY 'ACCT-TYPE=' ACCT-TYPE.
       DISPLAY 'BALANCE=' ACCT-BALANCE.
       DISPLAY 'STATUS=' ACCT-STATUS.
```

### 4.3 條件追蹤

```cobol
       * 追蹤條件判斷
       IF ACCT-TYPE = 'S'
           DISPLAY 'DEBUG: Entered SAVINGS branch'
           PERFORM CALC-SAVINGS-INT
       ELSE
           DISPLAY 'DEBUG: Entered OTHER branch, TYPE=' ACCT-TYPE
           PERFORM CALC-OTHER-INT
       END-IF.
```

---

## 五、練習題

### 練習 1: 找出錯誤

找出以下程式碼的錯誤：

```cobol
       01  WS-COUNTER     PIC 9(5).
       
       PROCEDURE DIVISION.
       PERFORM VARYING WS-COUNTER FROM 1 BY 1
               UNTIL WS-COUNTER > 100000
           PERFORM PROCESS-RECORD
       END-PERFORM.
```

### 練習 2: 分析問題

客戶報告：「轉帳後餘額顯示錯誤，但實際餘額正確」

可能的原因是什麼？如何排查？

### 練習 3: 設計測試

針對利息計算功能，設計 5 個測試案例來驗證邊界情況。

---

## 六、總結

### 缺陷分析重點

✅ **系統性排查**: 描述 → 重現 → 定位 → 修復 → 預防

✅ **常見錯誤**: 資料、檔案、邏輯三大類

✅ **除錯技巧**: DISPLAY 追蹤、資料傾印、條件追蹤

✅ **預防勝於治療**: 完整測試、程式碼審查、文件化

---

*課程版本: 1.0 | 更新日期: 2026-04-18*
