# Lesson 3-1：Sequential File 與 VSAM File

## 學習目標

- 理解 Sequential File 與 VSAM File 的差異
- 掌握檔案組織方式與存取模式
- 能夠判斷銀行程式使用何種檔案類型

---

## 為什麼檔案類型很重要？

銀行系統處理大量資料：
- 批次處理逐筆讀取所有記錄
- 線上交易隨機查詢特定記錄
- 不同的需求適合不同的檔案類型

選擇正確的檔案類型影響效能和設計。

---

## Sequential File（循序檔）

### 特點

- 記錄按順序排列
- 只能從頭到尾依序讀取
- 寫入時按順序追加

### 適用情境

| 情境 | 說明 |
|------|------|
| 批次處理 | 需要處理所有記錄 |
| 報表生成 | 依序輸出結果 |
| 備份檔案 | 完整資料備份 |
| 交易日誌 | 記錄所有交易明細 |

### 定義方式

```cobol
       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT ACCT-FILE ASSIGN TO ACCTDATA
               ORGANIZATION IS SEQUENTIAL
               ACCESS MODE IS SEQUENTIAL
               FILE STATUS IS WS-ACCT-STATUS.
```

### 檔案描述（FD）

```cobol
       DATA DIVISION.
       FILE SECTION.
       FD ACCT-FILE
           RECORDING MODE IS F
           RECORD CONTAINS 100 CHARACTERS.
       01 ACCT-RECORD.
          05 ACCT-NO           PIC X(16).
          05 ACCT-NAME         PIC X(40).
          05 ACCT-BALANCE      PIC S9(11)V99 COMP-3.
          ...
```

---

## VSAM File（虛擬儲存存取法）

VSAM（Virtual Storage Access Method）是 Mainframe 上最主要的索引檔案系統。

### VSAM 檔案類型

| 類型 | 說明 | 適用情境 |
|------|------|----------|
| KSDS | 鍵值順序資料集 | 帳戶主檔、客戶主檔 |
| ESDS | 順序資料集 | 日誌檔、交易日誌 |
| RRDS | 相對記錄資料集 | 固定長度記錄隨機存取 |
| LDS | 線性資料集 | 大型二進制資料 |

### KSDS（Key Sequenced Data Set）

最常用的 VSAM 類型，以鍵值（Key）組織記錄。

#### 特點

- 每筆記錄有唯一鍵值（如帳號）
- 可以隨機讀取特定記錄
- 可以依鍵值順序讀取
- 支援新增、修改、刪除

#### 定義方式

```cobol
       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT ACCT-FILE ASSIGN TO ACCTVSAM
               ORGANIZATION IS INDEXED
               ACCESS MODE IS RANDOM
               RECORD KEY IS ACCT-NO
               FILE STATUS IS WS-ACCT-STATUS.
```

#### 存取模式

| 模式 | 說明 | 使用情境 |
|------|------|----------|
| SEQUENTIAL | 循序存取 | 批次處理所有記錄 |
| RANDOM | 隨機存取 | 依鍵值查詢特定記錄 |
| DYNAMIC | 動態存取 | 混合循序與隨機存取 |

---

## 檔案組織方式比較

### 定義語法

```cobol
       *> Sequential File
       SELECT FILE-A ASSIGN TO DDNAME
           ORGANIZATION IS SEQUENTIAL.

       *> VSAM KSDS
       SELECT FILE-B ASSIGN TO DDNAME
           ORGANIZATION IS INDEXED
           RECORD KEY IS KEY-FIELD.

       *> VSAM RRDS
       SELECT FILE-C ASSIGN TO DDNAME
           ORGANIZATION IS RELATIVE
           RELATIVE KEY IS RRN-FIELD.
```

### 功能比較

| 功能 | Sequential | VSAM KSDS | VSAM RRDS |
|------|------------|-----------|-----------|
| 循序讀取 | ✓ | ✓ | ✓ |
| 隨機讀取 | ✗ | ✓ | ✓ |
| 依鍵值查詢 | ✗ | ✓ | ✗ |
| 新增記錄 | 僅追加 | ✓ | ✓ |
| 修改記錄 | ✗ | ✓ | ✓ |
| 刪除記錄 | ✗ | ✓ | ✓ |
| 效能（批次） | 最佳 | 良好 | 良好 |
| 效能（隨機） | 不適用 | 最佳 | 良好 |

---

## 銀行實務範例

### 帳戶主檔（VSAM KSDS）

```cobol
       FILE-CONTROL.
           SELECT ACCT-MASTER ASSIGN TO ACCTMSTR
               ORGANIZATION IS INDEXED
               ACCESS MODE IS RANDOM
               RECORD KEY IS ACCT-NO
               FILE STATUS IS WS-ACCT-STATUS.

       FILE SECTION.
       FD ACCT-MASTER.
       01 ACCT-RECORD.
          05 ACCT-NO           PIC X(16).        *> Primary Key
          05 ACCT-TYPE         PIC XX.
          05 ACCT-NAME         PIC X(40).
          05 ACCT-STATUS       PIC X.
          05 ACCT-BALANCE      PIC S9(11)V99 COMP-3.
          05 OPEN-DATE         PIC 9(8).
          05 FILLER            PIC X(50).
```

### 交易日誌檔（Sequential）

```cobol
       FILE-CONTROL.
           SELECT TRANS-LOG ASSIGN TO TRANSLOG
               ORGANIZATION IS SEQUENTIAL
               ACCESS MODE IS SEQUENTIAL
               FILE STATUS IS WS-TRANS-STATUS.

       FILE SECTION.
       FD TRANS-LOG.
       01 TRANS-RECORD.
          05 TRANS-DATE        PIC 9(8).
          05 TRANS-TIME        PIC 9(6).
          05 TRANS-TYPE        PIC XX.
          05 ACCT-NO           PIC X(16).
          05 TRANS-AMT         PIC S9(11)V99 COMP-3.
          05 BALANCE-AFTER     PIC S9(11)V99 COMP-3.
          05 REF-NO            PIC X(20).
          05 FILLER            PIC X(30).
```

---

## VSAM 操作範例

### 隨機讀取（RANDOM）

```cobol
       *> 設定要查詢的鍵值
       MOVE '1234567890123456' TO ACCT-NO.
       
       READ ACCT-MASTER
           INVALID KEY
               DISPLAY '找不到該帳號'
               MOVE 'N' TO WS-FOUND-FLAG
           NOT INVALID KEY
               DISPLAY '找到帳號: ' ACCT-NAME
               MOVE 'Y' TO WS-FOUND-FLAG
       END-READ.
```

### 循序讀取所有記錄（SEQUENTIAL）

```cobol
       *> 設定為循序存取
       *> ACCESS MODE IS SEQUENTIAL 或 DYNAMIC
       
       MOVE LOW-VALUES TO ACCT-NO.      *> 從最小鍵值開始
       
       START ACCT-MASTER
           KEY IS GREATER THAN OR EQUAL TO ACCT-NO
           INVALID KEY
               DISPLAY '檔案為空'
           NOT INVALID KEY
               PERFORM UNTIL EOF-REACHED
                   READ ACCT-MASTER NEXT RECORD
                       AT END
                           SET EOF-REACHED TO TRUE
                       NOT AT END
                           PERFORM PROCESS-ACCT
                   END-READ
               END-PERFORM
       END-START.
```

### 寫入新記錄（WRITE）

```cobol
       MOVE '1234567890123456' TO ACCT-NO.
       MOVE 'SA' TO ACCT-TYPE.
       MOVE 'JOHN DOE' TO ACCT-NAME.
       MOVE 'A' TO ACCT-STATUS.
       MOVE 0 TO ACCT-BALANCE.
       
       WRITE ACCT-RECORD
           INVALID KEY
               DISPLAY '鍵值重複或寫入失敗'
           NOT INVALID KEY
               DISPLAY '記錄新增成功'
       END-WRITE.
```

### 修改記錄（REWRITE）

```cobol
       *> 先讀取記錄
       READ ACCT-MASTER
           INVALID KEY
               DISPLAY '找不到該帳號'
           NOT INVALID KEY
               *> 修改欄位
               ADD 1000 TO ACCT-BALANCE
               *> 寫回記錄
               REWRITE ACCT-RECORD
                   INVALID KEY
                       DISPLAY '更新失敗'
                   NOT INVALID KEY
                       DISPLAY '更新成功'
               END-REWRITE
       END-READ.
```

### 刪除記錄（DELETE）

```cobol
       MOVE '1234567890123456' TO ACCT-NO.
       
       DELETE ACCT-MASTER
           INVALID KEY
               DISPLAY '找不到該帳號'
           NOT INVALID KEY
               DISPLAY '刪除成功'
       END-DELETE.
```

---

## VSAM 效能考量

### CI（Control Interval）

VSAM 以 Control Interval 為單位管理資料：
- 預設 CI 大小：4KB
- 一個 CI 包含多筆記錄
- 讀取一筆記錄會載入整個 CI

### CA（Control Area）

由多個 CI 組成，用於空間管理。

### 效能最佳化

| 考量 | 建議 |
|------|------|
| CI 大小 | 批次處理用較大 CI，隨機存取用較小 CI |
| Buffer 數量 | 增加 BUFFER 可提升循序處理效能 |
| 鍵值長度 | 盡量短，但需保證唯一性 |
| 壓縮 | 啟用壓縮節省空間，但影響效能 |

---

## BA 實務應用

### 如何判斷使用何種檔案類型？

| 需求 | 建議檔案類型 |
|------|-------------|
| 每日批次處理所有帳戶 | Sequential 或 VSAM 循序讀取 |
| 櫃台查詢客戶資料 | VSAM KSDS 隨機讀取 |
| 記錄所有交易明細 | Sequential |
| 帳戶主檔維護 | VSAM KSDS |

### 影響分析範例

**情境：需要從帳戶主檔查詢特定客戶**

1. **確認檔案類型**：如果是 Sequential，需要從頭讀取
2. **評估效能**：隨機查詢用 Sequential 效能差
3. **建議方案**：改用 VSAM KSDS 或建立索引

### 需求訪談時的問題

| 問題 | 目的 |
|------|------|
| 「這個檔案是批次處理還是線上查詢？」 | 判斷檔案類型 |
| 「需要隨機查詢特定記錄嗎？」 | 確認是否需要 VSAM |
| 「檔案大小大概多少？」 | 評估效能考量 |
| 「記錄會被修改或刪除嗎？」 | 確認是否需要 VSAM |

---

## 練習題

### 題目 1
以下情境應該使用 Sequential File 還是 VSAM KSDS？
1. 每日交易明細記錄
2. 帳戶主檔（需支援查詢、修改）
3. 月底報表輸出檔案
4. 客戶主檔（需依客戶編號查詢）

### 題目 2
說明以下 FILE-CONTROL 定義的檔案特性：

```cobol
           SELECT CUST-FILE ASSIGN TO CUSTMSTR
               ORGANIZATION IS INDEXED
               ACCESS MODE IS DYNAMIC
               RECORD KEY IS CUST-ID
               ALTERNATE RECORD KEY IS CUST-TAX-ID
                   WITH DUPLICATES.
```

### 題目 3
設計一個客戶主檔的 VSAM KSDS 定義，需求：
- 客戶編號（主鍵，8 碼）
- 身分證字號（次要鍵，允許重複）
- 需要支援隨機查詢和批次處理

---

## 重點回顧

| 概念 | 說明 |
|------|------|
| Sequential File | 循序檔，按順序讀取 |
| VSAM | 虛擬儲存存取法，支援索引 |
| KSDS | 鍵值順序資料集，最常用 |
| ESDS | 順序資料集，類似 Sequential |
| ACCESS MODE | SEQUENTIAL、RANDOM、DYNAMIC |

---

## 延伸閱讀

- [Lesson 3-2：檔案操作：READ、WRITE、REWRITE](lesson-3-2-file-operations.md)
- [Lesson 3-3：JCL 基本結構](lesson-3-3-jcl-basic.md)
