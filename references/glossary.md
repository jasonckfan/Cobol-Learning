# Mainframe & COBOL 術語表

> 快速查閱常用術語，適合 BA 溝通時使用

---

## A-F

| 術語 | 中文 | 說明 | BA 溝通情境 |
|------|------|------|-------------|
| Batch | 批次 | 非即時、排程執行的處理方式 | 「這個需求要放在批次還是聯機？」 |
| BTEQ | - | 線上交易執行工具 | 「可以用 BTEQ 查一下這筆資料」 |
| CICS | - | Customer Information Control System，聯機交易處理系統 | 「這支程式是 CICS 程式」 |
| COBOL | - | Common Business Oriented Language，銀行主要程式語言 | 「這段 COBOL 邏輯是...」 |
| COMP | - | Computational，二進位儲存格式 | 「這個欄位是 COMP 格式」 |
| COMP-3 | - | Packed Decimal，壓縮十進位格式 | 「金額欄位通常用 COMP-3」 |
| Copybook | 複製本 | 可被多個程式共用的欄位定義檔 | 「這個欄位在哪個 Copybook 定義？」 |

---

## D-J

| 術語 | 中文 | 說明 | BA 溝通情境 |
|------|------|------|-------------|
| Dataset | 資料集 | 主機上的檔案 | 「這個 Dataset 的命名規則是...」 |
| DB2 | - | IBM 關聯式資料庫 | 「這個查詢是走 DB2」 |
| DD | - | Data Definition，JCL 中定義檔案的敘述 | 「DD 名稱要對應到程式的 SELECT」 |
| DIVISION | 部 | COBOL 程式的四大區塊 | 「這個變數在 DATA DIVISION 宣告」 |
| EVALUATE | - | COBOL 的多條件判斷（類似 switch-case） | 「用 EVALUATE 處理多種狀態」 |
| EXEC | - | Execute，JCL 中執行程式的敘述 | 「這個 STEP 執行哪支程式？」 |
| GDG | - | Generation Data Group，世代資料組 | 「這是 GDG，每天產生一個版本」 |

---

## I-P

| 術語 | 中文 | 說明 | BA 溝通情境 |
|------|------|------|-------------|
| IF | - | 條件判斷 | 「如果條件不滿足就走 ELSE」 |
| JCL | - | Job Control Language，控制批次執行的語言 | 「這個 Job 的 JCL 在哪裡？」 |
| Job | 工作 | 一個批次執行單位 | 「這個 Job 排在幾點執行？」 |
| Level Number | 層次號碼 | COBOL 資料結構的層級（01, 05, 10 等） | 「01 是群組項目，下層是基本項目」 |
| Member | 成員 | PDS 中的個別檔案 | 「這支程式在哪個 Member？」 |
| MOVE | - | 資料搬移指令 | 「把 A 欄位的值搬到 B」 |
| Online | 聯機 | 即時互動的處理方式 | 「這是 Online 交易」 |
| PDS | - | Partitioned Data Set，分割資料集（類似資料夾） | 「程式放在這個 PDS 裡面」 |
| PERFORM | - | 執行段落或迴圈 | 「PERFORM 直到條件滿足」 |
| PIC | - | Picture，定義欄位格式與長度 | 「PIC 9(5) 表示 5 位數字」 |

---

## R-Z

| 術語 | 中文 | 說明 | BA 溝通情境 |
|------|------|------|-------------|
| READ | - | 讀取檔案記錄 | 「讀到檔案結束就停止」 |
| REWRITE | - | 更新檔案記錄 | 「更新這筆資料要用 REWRITE」 |
| Sequential File | 循序檔 | 依序讀寫的檔案 | 「這是循序檔，不能隨機讀取」 |
| Step | 步驟 | Job 中的單一執行單元 | 「這個 Job 有 5 個 Step」 |
| TSO/ISPF | - | 主機終端操作介面 | 「登入 TSO 查看」 |
| VSAM | - | Virtual Storage Access Method，索引檔案系統 | 「這是 VSAM KSDS，可以用 Key 讀取」 |
| WRITE | - | 寫入檔案記錄 | 「輸出報表用 WRITE」 |
| z/OS | - | IBM Mainframe 作業系統 | 「系統跑在 z/OS 上」 |

---

## 常用提問句型

### 確認處理方式
- 「這個功能是 **Online 還是 Batch**？」
- 「這支程式是 **CICS 程式還是批次程式**？」

### 確認檔案與資料
- 「這個欄位在哪個 **Copybook** 定義？」
- 「來源檔案是 **Sequential 還是 VSAM**？」
- 「這個 **Dataset** 的檔案格式是什麼？」

### 確認影響範圍
- 「修改這支程式，會影響哪些 **Job**？」
- 「這個變更是 **上游** 還是 **下游** 影響？」
- 「日終批次有沒有依賴這個檔案？」

### 確認測試重點
- 「這段邏輯有哪些 **條件分支** 要測？」
- 「批次跑完後，要確認哪些 **報表**？」

---

## 銀行業務對照表

| 業務術語 | 技術實現 | 常見處理方式 |
|---------|---------|-------------|
| 即時查詢 | CICS + DB2/VSAM | Online |
| 交易授權 | CICS Transaction | Online |
| 日終結算 | Batch Job | Batch |
| 計息 | Batch + Sort | Batch |
| 對帳 | Batch + 比對程式 | Batch |
| 報表產生 | Batch + Sort + 報表程式 | Batch |
| 檔案交換 | Batch + FTP/Connect:Direct | Batch |
