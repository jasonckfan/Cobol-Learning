# Lesson 1-4：Job、Step、Program、Procedure 關係

## 1. 今日主題

理解 Mainframe 批次處理的核心架構：Job、Step、Program、Procedure 之間的關係。

---

## 2. 為什麼 BA 需要懂

當開發說「這個 Job 有 5 個 Step」，你需要知道：
- 這是 5 支程式依序執行？
- 還是一支程式執行 5 次？
- 如果 Step 3 失敗，Step 4 還會執行嗎？

理解這些關係，才能：
- 看懂 Job Flow（批次流程圖）
- 追蹤問題發生在哪個 Step
- 評估需求變更對批次的影響

---

## 3. 核心概念白話解釋

### 想像一條生產線

| 生產線比喻 | Mainframe 概念 | 說明 |
|-----------|---------------|------|
| 一整天的生產計畫 | Job | 一個完整的工作單元 |
| 一個工作站 | Step | 生產線上的某個步驟 |
| 一台機器/工人 | Program | 實際執行工作的程式 |
| 標準作業流程 | Procedure (PROC) | 可重複使用的步驟組合 |

### 例子：麵包工廠

```
Job: 每日麵包生產
├── Step 1: 混合麵粉 → Program: MIXER
├── Step 2: 發酵 → Program: FERMENT
├── Step 3: 烘烤 → Program: OVEN
├── Step 4: 包裝 → Program: PACKER
└── Step 5: 出貨 → Program: SHIP
```

如果 Step 3（烘烤）失敗，Step 4（包裝）通常不會執行。

---

## 4. 正式概念與術語

### Job（工作）

- **定義**：一個批次執行的最高層級單元
- **JCL 表示**：以 `JOB` 敘述開頭
- **特性**：
  - 有唯一的 Job Name
  - 可以包含多個 Step
  - 有執行優先級（CLASS）
  - 可以指定通知對象（NOTIFY）

### Step（步驟）

- **定義**：Job 內的一個執行單元
- **JCL 表示**：以 `EXEC` 敘述開頭
- **特性**：
  - 每個 Step 執行一個 Program 或 Procedure
  - 可以定義輸入/輸出檔案（DD）
  - 有條件執行邏輯（COND）
  - Step 失敗可以決定是否繼續

### Program（程式）

- **定義**：實際執行工作的程式（通常是 COBOL 編譯後的 Load Module）
- **JCL 表示**：`EXEC PGM=程式名稱`
- **特性**：
  - 執行特定功能（計息、對帳、報表等）
  - 可以被多個 Job/Step 重複使用
  - 存放在 Load Library（PDS）

### Procedure / PROC（程序）

- **定義**：可重複使用的 Step 組合
- **JCL 表示**：`EXEC PROC=程序名稱` 或 `EXEC 程序名稱`
- **特性**：
  - 把常用的 Step 組合打包
  - 可以帶參數，增加彈性
  - 類似「副程式」的概念
  - 分為 cataloged procedure（存在 PDS）和 in-stream procedure（寫在 JCL 內）

---

## 5. 銀行業例子

### CLM 日終計息 Job 範例

```jcl
//CLMDAILY JOB (ACCT),'CLM DAILY BATCH',
//             CLASS=A,MSGCLASS=X,NOTIFY=&SYSUID
//********************************************************************
//* CLM 每日計息批次 Job
//* 執行時間：每日 23:00
//********************************************************************
//*
//* Step 1: 檢查輸入檔案是否存在
//*
//STEP010  EXEC PGM=IDCAMS
//SYSPRINT DD SYSOUT=*
//SYSIN    DD *
  LISTCAT ENTRIES(PROD.CLM.DATA.TRANS.DAILY)
/*
//*
//* Step 2: 排序交易檔（依帳號排序）
//*
//STEP020  EXEC PGM=SORT
//SORTIN   DD DSN=PROD.CLM.DATA.TRANS.DAILY,DISP=SHR
//SORTOUT  DD DSN=&&SORTED,DISP=(,PASS),SPACE=(CYL,(100,50))
//SYSOUT   DD SYSOUT=*
//SYSIN    DD *
  SORT FIELDS=(1,10,CH,A)
/*
//*
//* Step 3: 計算利息
//*
//STEP030  EXEC PGM=CLMINT01
//INPUT    DD DSN=&&SORTED,DISP=(OLD,DELETE)
//MASTER   DD DSN=PROD.CLM.DATA.ACCOUNT,DISP=SHR
//OUTPUT   DD DSN=PROD.CLM.DATA.INTEREST(+1),DISP=(NEW,CATLG)
//REPORT   DD SYSOUT=*
//SYSOUT   DD SYSOUT=*
//*
//* Step 4: 過帳到總帳
//*
//STEP040  EXEC PGM=CLMGLPOST
//INPUT    DD DSN=PROD.CLM.DATA.INTEREST(0),DISP=SHR
//GLMASTER DD DSN=PROD.GL.DATA.MASTER,DISP=SHR
//SYSOUT   DD SYSOUT=*
//*
//* Step 5: 產生報表
//*
//STEP050  EXEC PGM=CLMRPT01
//INPUT    DD DSN=PROD.CLM.DATA.INTEREST(0),DISP=SHR
//REPORT   DD SYSOUT=*
//SYSOUT   DD SYSOUT=*
//
```

### 結構分析

```
Job: CLMDAILY
│
├── STEP010 (Program: IDCAMS)
│   └── 功能：檢查檔案是否存在
│
├── STEP020 (Program: SORT)
│   └── 功能：排序交易檔
│
├── STEP030 (Program: CLMINT01) ← 計息主程式
│   └── 功能：計算利息
│
├── STEP040 (Program: CLMGLPOST)
│   └── 功能：過帳到總帳
│
└── STEP050 (Program: CLMRPT01)
    └── 功能：產生報表
```

### Step 之間的依賴關係

| Step | 依賴 | 說明 |
|------|------|------|
| STEP020 | STEP010 成功 | 如果檔案不存在，不需要排序 |
| STEP030 | STEP020 成功 | 需要排序後的資料 |
| STEP040 | STEP030 成功 | 需要計息結果 |
| STEP050 | STEP040 成功 | 需要過帳完成後的資料 |

---

## 6. PROC（Procedure）範例

### 為什麼需要 PROC？

如果多個 Job 都需要「排序 → 處理 → 報表」的流程，可以把這些步驟包成 PROC。

### PROC 定義（存在 PROD.CLM.PROCLIB(SORTPROC)）

```jcl
//SORTPROC PROC
//SORT    EXEC PGM=SORT
//SORTIN  DD DSN=&INPUT,DISP=SHR
//SORTOUT DD DSN=&&SORTED,DISP=(,PASS)
//SYSOUT  DD SYSOUT=*
//SYSIN   DD *
  SORT FIELDS=(1,10,CH,A)
/*
//PROCESS EXEC PGM=&PGM
//INPUT   DD DSN=&&SORTED,DISP=(OLD,DELETE)
//OUTPUT  DD DSN=&OUTPUT,DISP=(NEW,CATLG)
//SYSOUT  DD SYSOUT=*
         PEND
```

### 在 Job 中使用 PROC

```jcl
//STEP010  EXEC SORTPROC,INPUT=PROD.CLM.DATA.TRANS,
//                     PGM=CLMINT01,
//                     OUTPUT=PROD.CLM.DATA.INTEREST(+1)
```

這樣就不用重複寫排序邏輯。

---

## 7. 條件執行（COND）

### Step 失敗後的處理

JCL 可以用 `COND` 參數控制 Step 是否執行：

```jcl
//STEP040 EXEC PGM=CLMGLPOST,COND=(0,NE,STEP030)
```

意思是：如果 STEP030 的 return code 不等於 0（有錯誤），就跳過 STEP040。

### 常見 Return Code

| Code | 意思 |
|------|------|
| 0 | 成功 |
| 4 | 警告（通常繼續執行） |
| 8 | 錯誤（通常停止） |
| 12 | 嚴重錯誤 |
| 16 | 災難性錯誤 |

---

## 8. BA 溝通重點

### 確認 Job 結構

```
當開發說「這個需求要改 Job」：

1. 「是改 Job 還是改 Step？」
2. 「是新增 Step 還是修改現有 Step？」
3. 「改的是哪支 Program？」
4. 「這個 Step 的上下游是什麼？」
```

### 確認影響範圍

```
當需要評估影響時：

1. 「這個 Job 目前排在什麼時間執行？」
2. 「前面有哪些 Job 必須先跑完？」
3. 「後面有哪些 Job 依賴這個 Job？」
4. 「如果這個 Step 失敗，會影響哪些後續處理？」
```

### 確認問題發生位置

```
當批次失敗時：

1. 「是哪個 Job 失敗？」
2. 「失敗在第幾個 Step？」
3. 「那個 Step 執行的是哪支 Program？」
4. 「Return Code 是多少？」
5. 「有沒有產生錯誤訊息？」
```

---

## 9. 常見誤解

| 誤解 | 正確理解 |
|------|----------|
| Job = Program | Job 包含多個 Step，每個 Step 執行一個 Program |
| Step 一定會執行 | Step 可以有條件跳過（COND） |
| PROC 一定要用 | PROC 是選用的，目的是重用和簡化 |
| 一個 Job 只能有一個 Step | Job 可以有多個 Step，依序或條件執行 |

---

## 10. 小練習

### 題目

根據以下 JCL，回答問題：

```jcl
//PAYMENT JOB (ACCT),'PAYMENT BATCH',CLASS=A
//STEP010 EXEC PGM=PAYREAD
//INPUT   DD DSN=PAY.TRANS.DAILY,DISP=SHR
//STEP020 EXEC PGM=PAYPROC
//INPUT   DD DSN=PAY.TRANS.DAILY,DISP=SHR
//OUTPUT  DD DSN=PAY.RESULT(+1),DISP=(NEW,CATLG)
//STEP030 EXEC PGM=PAYRPT
//INPUT   DD DSN=PAY.RESULT(0),DISP=SHR
//REPORT  DD SYSOUT=*
```

1. 這個 Job 名稱是什麼？
2. 這個 Job 有幾個 Step？
3. STEP020 使用什麼 Program？
4. STEP030 的輸入檔案是什麼？
5. 如果 STEP010 失敗，STEP020 會執行嗎？

---

## 11. 練習解答

<details>
<summary>點擊展開解答</summary>

1. **Job 名稱**：PAYMENT

2. **Step 數量**：3 個（STEP010、STEP020、STEP030）

3. **STEP020 的 Program**：PAYPROC

4. **STEP030 的輸入檔案**：`PAY.RESULT(0)`（當前版本的結果檔）

5. **STEP010 失敗後**：預設情況下會繼續執行 STEP020（除非有設定 COND 參數）

</details>

---

## 12. 第 1 階段總結

恭喜完成 **第 1 階段：Mainframe 系統概念入門**！

### 你已經學會

| 主題 | 重點 |
|------|------|
| Mainframe 角色 | 銀行核心系統，處理帳務、計息、對帳 |
| Batch vs Online | 批次處理 vs 即時處理的差異與應用 |
| Dataset 結構 | PDS、Member、GDG 的概念 |
| Job 架構 | Job → Step → Program 的關係 |

### 下一步

[第 2 階段：COBOL 程式結構與資料定義](../lessons/lesson-2-1-cobol-division.md)

我們將開始學習 COBOL 語法，包括：
- COBOL 四大 DIVISION
- 變數宣告與 PIC 子句
- 資料結構與流程控制
