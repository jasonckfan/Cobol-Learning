# COBOL & Mainframe 學習指南 - 課程索引

> 專為銀行 IT BA 設計的 Mainframe 與 COBOL 實務學習資源

---

## 📚 課程索引

### 第 1 階段：Mainframe 系統概念入門 ✅

#### [Lesson 1-1：Mainframe 在銀行的角色](lessons/lesson-1-1-mainframe-intro.md) ✅

| 章節 | 內容 |
|------|------|
| [今日主題](lessons/lesson-1-1-mainframe-intro.md#1-今日主題) | Mainframe 是什麼 |
| [為什麼 BA 需要懂](lessons/lesson-1-1-mainframe-intro.md#2-為什麼-ba-需要懂) | Online vs Batch 對需求的影響 |
| [核心概念白話解釋](lessons/lesson-1-1-mainframe-intro.md#3-核心概念白話解釋) | Mainframe、Online、Batch |
| [正式概念與術語](lessons/lesson-1-1-mainframe-intro.md#4-正式概念與術語) | z/OS、CICS、TSO/ISPF |
| [銀行業例子](lessons/lesson-1-1-mainframe-intro.md#5-銀行業例子) | CLM 計息情境 |
| [BA 溝通重點](lessons/lesson-1-1-mainframe-intro.md#6-ba-溝通重點) | Online vs Batch 判斷 |

#### [Lesson 1-2：Batch vs Online 處理模式](lessons/lesson-1-2-batch-online.md) ✅

| 章節 | 內容 |
|------|------|
| [Batch vs Online 比較](lessons/lesson-1-2-batch-online.md#) | 處理模式差異 |
| [適用場景](lessons/lesson-1-2-batch-online.md#) | 各自適合的功能類型 |

#### [Lesson 1-3：z/OS、Dataset、PDS、Member 概念](lessons/lesson-1-3-dataset-concept.md) ✅

| 章節 | 內容 |
|------|------|
| [Dataset 概念](lessons/lesson-1-3-dataset-concept.md#) | 檔案系統基礎 |
| [PDS 與 Member](lessons/lesson-1-3-dataset-concept.md#) | 程式庫組織方式 |

#### [Lesson 1-4：Job、Step、Program、Procedure 關係](lessons/lesson-1-4-job-step-program.md) ✅

| 章節 | 內容 |
|------|------|
| [Job 結構](lessons/lesson-1-4-job-step-program.md#) | JCL 基本單位 |
| [Step 與 Program](lessons/lesson-1-4-job-step-program.md#) | 執行步驟與程式 |

---

### 第 2 階段：COBOL 程式結構與資料定義

#### [Lesson 2-1：COBOL 四大 DIVISION](lessons/lesson-2-1-cobol-divisions.md)

| 章節 | 內容 |
|------|------|
| IDENTIFICATION DIVISION | 程式識別資訊 |
| ENVIRONMENT DIVISION | 環境設定 |
| DATA DIVISION | 資料定義 |
| PROCEDURE DIVISION | 程式邏輯 |

#### [Lesson 2-2：變數宣告與 PIC 子句](lessons/lesson-2-2-pic-clause.md)

| 章節 | 內容 |
|------|------|
| PIC 子句 | 資料格式定義 |
| 常用格式 | X、9、S、V |

#### [Lesson 2-3：Level Number 與資料結構](lessons/lesson-2-3-level-number.md)

| 章節 | 內容 |
|------|------|
| Level Number | 01、05、10、49 |
| 群組項目 | 階層資料結構 |

#### [Lesson 2-4：COMP、COMP-3、Packed Decimal](lessons/lesson-2-4-comp-usage.md)

| 章節 | 內容 |
|------|------|
| COMP | 二進位格式 |
| COMP-3 | 壓縮十進位 |

#### [Lesson 2-5：流程控制：IF、EVALUATE、PERFORM](lessons/lesson-2-5-flow-control.md)

| 章節 | 內容 |
|------|------|
| IF 判斷 | 條件分支 |
| EVALUATE | 多條件判斷 |
| PERFORM | 迴圈與副程式 |

#### [Lesson 2-6：COPYBOOK 與程式碼複用](lessons/lesson-2-6-copybook.md)

| 章節 | 內容 |
|------|------|
| COPYBOOK 概念 | 程式碼共用 |
| COPY 語句 | 引用方式 |

#### [Lesson 2-7：呼叫外部程式 (CALL)](lessons/lesson-2-7-call-statement.md)

| 章節 | 內容 |
|------|------|
| CALL 語句 | 程式呼叫 |
| 參數傳遞 | BY VALUE/REFERENCE |

#### [Lesson 2-8：錯誤處理與檔案狀態碼](lessons/lesson-2-8-error-handling.md)

| 章節 | 內容 |
|------|------|
| 檔案狀態碼 | FILE-STATUS |
| 錯誤處理 | 異常處理機制 |

---

### 第 3 階段：檔案、批次、JCL、報表

#### [Lesson 3-1：Sequential File 與 VSAM File](lessons/lesson-3-1-file-types.md)

| 章節 | 內容 |
|------|------|
| Sequential File | 循序檔 |
| VSAM File | 虛擬儲存存取方法 |

#### [Lesson 3-2：檔案操作：READ、WRITE、REWRITE](lessons/lesson-3-2-file-operations.md)

| 章節 | 內容 |
|------|------|
| READ | 讀取記錄 |
| WRITE | 寫入記錄 |
| REWRITE | 更新記錄 |

#### [Lesson 3-3：JCL 基本結構](lessons/lesson-3-3-jcl-basic.md)

| 章節 | 內容 |
|------|------|
| JCL 結構 | JOB、EXEC、DD |
| 常用參數 | 實務範例 |

#### [Lesson 3-4：Sort 與 Utility](lessons/lesson-3-4-sort-utility.md)

| 章節 | 內容 |
|------|------|
| SORT Utility | 排序工具 |
| 其他 Utility | 實用工具 |

#### [Lesson 3-5：報表輸出流程](lessons/lesson-3-5-report-output.md)

| 章節 | 內容 |
|------|------|
| 報表格式 | 列印格式設計 |
| 輸出流程 | 報表產生方式 |

#### [Lesson 3-6：MQ/Socket 通訊概念](lessons/lesson-3-6-mq-socket.md)

| 章節 | 內容 |
|------|------|
| MQ 概念 | 訊息佇列 |
| Socket 通訊 | 即時通訊 |

#### [Lesson 3-7：DB2 基本概念](lessons/lesson-3-7-db2-basic.md)

| 章節 | 內容 |
|------|------|
| DB2 SQL | 資料庫操作 |
| Embedded SQL | COBOL 內嵌 SQL |

#### [Lesson 3-8：CICS 線上交易入門](lessons/lesson-3-8-cics-intro.md)

| 章節 | 內容 |
|------|------|
| CICS 架構 | 線上交易處理 |
| 基本操作 | 實務應用 |

---

### 第 4 階段：銀行實務案例 ✅

#### [Lesson 4-1：CLM 資金池管理系統架構](lessons/lesson-4-1-clm-system.md) ✅

| 章節 | 內容 |
|------|------|
| [CLM 系統架構](lessons/lesson-4-1-clm-system.md#) | 資金池管理 |
| [計息產品](lessons/lesson-4-1-clm-system.md#) | CDA/NPN/MCN |

#### [Lesson 4-2：計息邏輯實現](lessons/lesson-4-2-interest-calc.md) ✅

| 章節 | 內容 |
|------|------|
| [利息計算邏輯](lessons/lesson-4-2-interest-calc.md#) | 日息計算 |
| [分層利率](lessons/lesson-4-2-interest-calc.md#) | Tier/Slab |

#### [Lesson 4-3：日終批次處理流程](lessons/lesson-4-3-daily-batch.md) ✅

| 章節 | 內容 |
|------|------|
| [批次流程](lessons/lesson-4-3-daily-batch.md#) | EOD 處理 |
| [JCL 控制流](lessons/lesson-4-3-daily-batch.md#) | 批次控制 |

#### [Lesson 4-4：對帳與報表生成](lessons/lesson-4-4-reconciliation.md) ✅

| 章節 | 內容 |
|------|------|
| [對帳流程](lessons/lesson-4-4-reconciliation.md#) | 核對機制 |
| [報表產生](lessons/lesson-4-4-reconciliation.md#) | 輸出格式 |

#### [Lesson 4-5：存款/放款系統實例](lessons/lesson-4-5-deposit-loan.md) ✅

| 章節 | 內容 |
|------|------|
| [存款系統](lessons/lesson-4-5-deposit-loan.md#) | 帳戶類型 |
| [放款系統](lessons/lesson-4-5-deposit-loan.md#) | 還款計算 |

#### [Lesson 4-6：跨系統資料交換](lessons/lesson-4-6-data-exchange.md) ✅

| 章節 | 內容 |
|------|------|
| [SWIFT 訊息](lessons/lesson-4-6-data-exchange.md#) | 銀行間通訊 |
| [MQ 整合](lessons/lesson-4-6-data-exchange.md#) | 訊息傳遞 |

---

### 第 5 階段：BA 溝通與影響分析 ✅

#### [Lesson 5-1：需求拆解技巧](lessons/lesson-5-1-requirement-analysis.md) ✅

| 章節 | 內容 |
|------|------|
| [需求拆解方法](lessons/lesson-5-1-requirement-analysis.md#) | 功能分解 |
| [文件化技巧](lessons/lesson-5-1-requirement-analysis.md#) | 規格書撰寫 |

#### [Lesson 5-2：影響分析方法](lessons/lesson-5-2-impact-analysis.md) ✅

| 章節 | 內容 |
|------|------|
| [影響範圍分析](lessons/lesson-5-2-impact-analysis.md#) | 變更評估 |
| [風險識別](lessons/lesson-5-2-impact-analysis.md#) | 潛在問題 |

#### [Lesson 5-3：測試案例設計](lessons/lesson-5-3-test-design.md) ✅

| 章節 | 內容 |
|------|------|
| [測試設計方法](lessons/lesson-5-3-test-design.md#) | 案例設計 |
| [邊界值測試](lessons/lesson-5-3-test-design.md#) | 測試覆蓋 |

#### [Lesson 5-4：與開發人員溝通技巧](lessons/lesson-5-4-communication.md) ✅

| 章節 | 內容 |
|------|------|
| [溝通技巧](lessons/lesson-5-4-communication.md#) | 有效對話 |
| [術語轉譯](lessons/lesson-5-4-communication.md#) | 業務→技術 |

#### [Lesson 5-5：技術規格書閱讀](lessons/lesson-5-5-spec-reading.md) ✅

| 章節 | 內容 |
|------|------|
| [規格書結構](lessons/lesson-5-5-spec-reading.md#) | 文件解讀 |
| [重點識別](lessons/lesson-5-5-spec-reading.md#) | 關鍵資訊 |

#### [Lesson 5-6：UAT 測試規劃](lessons/lesson-5-6-uat-planning.md) ✅

| 章節 | 內容 |
|------|------|
| [UAT 規劃](lessons/lesson-5-6-uat-planning.md#) | 測試排程 |
| [驗收標準](lessons/lesson-5-6-uat-planning.md#) | 驗收條件 |

#### [Lesson 5-7：上線檢查清單](lessons/lesson-5-7-go-live-checklist.md) ✅

| 章節 | 內容 |
|------|------|
| [上線前檢核](lessons/lesson-5-7-go-live-checklist.md#) | 檢查項目 |
| [風險控制](lessons/lesson-5-7-go-live-checklist.md#) | 風險應對 |

---

### 第 6 階段：實戰演練

| 課程 | 狀態 | 說明 |
|------|:----:|------|
| 真實程式碼解讀練習 | ⬜ | 實際案例分析 |
| 模擬需求會議 | ⬜ | 角色扮演練習 |
| 缺陷分析練習 | ⬜ | 問題排查訓練 |

---

### 第 7 階段：工具與環境

| 課程 | 狀態 | 說明 |
|------|:----:|------|
| Lesson 7-1：常用工具介紹 | ⬜ | TSO/ISPF、File-Aid、Coolgen |
| Lesson 7-2：日誌與除錯概念 | ⬜ | SYSLOG、系統 dump |

---

## 📖 參考資料

- [術語表 (Glossary)](references/glossary.md)
- [BA 溝通指南](ba-communication-guide.md)
- [銀行實務增強篇](banking-practices-enhanced.md)

---

## 📊 學習進度

```
已完成：17 / 25 課程 (68%)

████████████████████████░░░░░░░░░░░░ 68%
```

---

## 🔗 快速導航

- [回到專案首頁](../README.md)
- [GitHub Repository](https://github.com/jasonckfan/Cobol-Learning)

---

*最後更新：2026-04-06*
