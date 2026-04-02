# Lesson 1-3：z/OS、Dataset、PDS、Member 概念

## 1. 今日主題

理解 Mainframe 檔案系統的核心概念：z/OS 環境下的 Dataset、PDS、Member。

---

## 2. 為什麼 BA 需要懂

當開發說「這支程式在 `PROD.CLM.COBOL(CLMINT01)`」，你需要知道：
- 這是哪裡？
- 怎麼找到這個檔案？
- 這個路徑結構代表什麼？

理解檔案結構，才能：
- 看懂 JCL 中的檔案路徑
- 理解程式部署位置
- 追蹤資料流向

---

## 3. 核心概念白話解釋

### 想像 Mainframe 是一個大倉庫

| Windows 概念 | Mainframe 概念 | 倉庫比喻 |
|-------------|---------------|---------|
| 硬碟 | z/OS 系統 | 整個倉庫 |
| 資料夾 | PDS（Partitioned Data Set） | 櫃子 |
| 檔案 | Member | 櫃子裡的文件夾 |
| 檔案內容 | Dataset 內容 | 文件夾裡的內容 |
| 檔案路徑 | Dataset Name | 櫃子編號 + 文件夾編號 |

### 重要觀念

在 Mainframe 中：
- **沒有「資料夾」**，取而代之的是 **PDS**
- **PDS 裡面裝的不是檔案，而是 Member**
- **Dataset Name** 就像檔案的完整地址

---

## 4. 正式概念與術語

### z/OS

- IBM Mainframe 的作業系統
- 類似 Windows 或 Linux，但專為大型企業設計
- 支援高交易量、高可靠性、高安全性

### Dataset（資料集）

- Mainframe 上的「檔案」
- 可以是：
  - **程式碼**（COBOL 原始碼、編譯後的程式）
  - **資料檔**（交易檔、主檔、報表檔）
  - **參數檔**（JCL、控制參數）

### Dataset Name（資料集名稱）

- 格式：`層級1.層級2.層級3.層級n`
- 最長 44 個字元
- 每個層級最長 8 個字元
- 範例：
  - `PROD.CLM.COBOL` → 放 COBOL 程式的 PDS
  - `PROD.CLM.COBOL(CLMINT01)` → PDS 裡的某個 Member
  - `PROD.CLM.DATA.TRANS.DAILY` → 每日交易資料檔

### PDS（Partitioned Data Set）

- 一種特殊的 Dataset，可以包含多個 Member
- 類似 Windows 的「資料夾」或 ZIP 檔
- 範例：`PROD.CLM.COBOL` 是一個 PDS，裡面有很多 COBOL 程式

### Member

- PDS 裡面的「檔案」
- 用括號 `()` 表示
- 範例：`PROD.CLM.COBOL(CLMINT01)` 表示 PDS 裡的 CLMINT01 這個 Member

### PS（Physical Sequential）

- 不是 PDS，就是 PS
- 不能包含 Member，是一個單一檔案
- 範例：`PROD.CLM.DATA.TRANS.DAILY` 可能是一個 PS

---

## 5. 銀行業例子

### CLM 系統的典型 Dataset 結構

```
PROD.CLM.COBOL              ← PDS：存放 COBOL 原始碼
├── (CLMINT01)              ← 計息程式
├── (CLMPOOL01)             ← 資金池歸集程式
├── (CLMRPT01)              ← 報表程式
└── (CLMUPD01)              ← 主檔更新程式

PROD.CLM.LOADLIB            ← PDS：存放編譯後的程式
├── (CLMINT01)              ← 計息程式（可執行）
├── (CLMPOOL01)
└── ...

PROD.CLM.COPYLIB            ← PDS：存放 Copybook
├── (CLMACC)                ← 帳戶資料結構定義
├── (CLMTRANS)              ← 交易資料結構定義
└── (CLMPOOL)               ← 資金池資料結構定義

PROD.CLM.JCL                ← PDS：存放 JCL
├── (CLMINT01)              ← 計息批次 JCL
├── (CLMDAILY)              ← 每日批次 JCL
└── (CLMMONTH)              ← 月結批次 JCL

PROD.CLM.DATA.ACCOUNT       ← PS 或 VSAM：帳戶主檔
PROD.CLM.DATA.TRANS.DAILY   ← PS：每日交易檔（可能是 GDG）
PROD.CLM.DATA.INTEREST      ← PS：計息結果檔
```

---

## 6. JCL 中的 Dataset 使用範例

```jcl
//STEP1    EXEC PGM=CLMINT01
//INPUT    DD DSN=PROD.CLM.DATA.TRANS.DAILY,DISP=SHR
//MASTER   DD DSN=PROD.CLM.DATA.ACCOUNT,DISP=SHR
//OUTPUT   DD DSN=PROD.CLM.DATA.INTEREST(+1),DISP=(NEW,CATLG)
```

### 解釋

| DD Name | DSN（Dataset Name） | 說明 |
|---------|---------------------|------|
| INPUT | `PROD.CLM.DATA.TRANS.DAILY` | 輸入：每日交易檔 |
| MASTER | `PROD.CLM.DATA.ACCOUNT` | 輸入：帳戶主檔 |
| OUTPUT | `PROD.CLM.DATA.INTEREST(+1)` | 輸出：計息結果（GDG 新版本） |

---

## 7. GDG（Generation Data Group）

### 什麼是 GDG？

GDG 是一種「世代資料組」，類似版本控制：

- `PROD.CLM.DATA.INTEREST.G0001V00` → 第 1 版
- `PROD.CLM.DATA.INTEREST.G0002V00` → 第 2 版
- `PROD.CLM.DATA.INTEREST.G0003V00` → 第 3 版

### 在 JCL 中的表示方式

| 表示法 | 意思 |
|--------|------|
| `DSN(+1)` | 建立新版本（下一版） |
| `DSN(0)` | 使用當前版本 |
| `DSN(-1)` | 使用上一版 |

### BA 為什麼要懂？

- 處理「資料被蓋掉」的問題：GDG 可以保留多個版本
- 問開發：「這個檔案是 GDG 嗎？保留幾個版本？」
- 當需要「重跑昨天的批次」：可能需要用到 `-1` 版本的資料

---

## 8. BA 溝通重點

### 問檔案相關問題

```
當開發提到某個檔案時：

1. 「這個 Dataset 的完整名稱是什麼？」
2. 「這是 PDS 還是 PS？裡面有哪些 Member？」
3. 「這個檔案是 GDG 嗎？保留幾代？」
4. 「這個檔案在生產環境還是測試環境？」
```

### 確認程式位置

```
當要查看某支程式時：

1. 「COBOL 原始碼在哪個 PDS？Member 名稱是什麼？」
2. 「對應的 JCL 在哪裡？」
3. 「這支程式用到的 Copybook 有哪些？在哪裡？」
```

---

## 9. 常見誤解

| 誤解 | 正確理解 |
|------|----------|
| Dataset = 資料庫 | Dataset 是檔案，不是資料庫（DB2 才是資料庫） |
| PDS 就是資料夾 | PDS 類似資料夾，但技術上不同（是索引結構） |
| 所有檔案都是 PDS | 有 PDS（可含 Member）也有 PS（單一檔案） |
| Member 就是檔案 | Member 是 PDS 裡的「成員」，概念類似檔案 |

---

## 10. 小練習

### 題目

請解釋以下 Dataset Name：

1. `PROD.CLM.COBOL(CLMINT01)`
2. `TEST.CLM.DATA.TRANS(-1)`
3. `PROD.CLM.COPYLIB(CLMACC)`

回答：
- 這是 PDS 還是 PS？
- 如果是 PDS，Member 名稱是什麼？
- 這個 Dataset 可能的用途是什麼？

---

## 11. 練習解答

<details>
<summary>點擊展開解答</summary>

### 1. `PROD.CLM.COBOL(CLMINT01)`
- **類型**：PDS
- **Member**：CLMINT01
- **用途**：COBOL 程式原始碼，程式名稱是 CLMINT01（可能是計息程式）

### 2. `TEST.CLM.DATA.TRANS(-1)`
- **類型**：GDG（世代資料組）
- **(-1)**：使用上一代的版本
- **用途**：測試環境的交易檔，這裡引用的是前一個版本

### 3. `PROD.CLM.COPYLIB(CLMACC)`
- **類型**：PDS
- **Member**：CLMACC
- **用途**：Copybook，定義帳戶資料結構，供多個程式引用

</details>

---

## 12. 下一課

[Lesson 1-4：Job、Step、Program、Procedure 關係](lesson-1-4-job-step-program.md)
