# COBOL & Mainframe 學習指南

> 專為銀行 IT BA 設計的 Mainframe 與 COBOL 實務學習資源

## 📚 課程索引

**👉 [進入課程索引頁](docs/index.md)**

---

## 專案目的

本專案旨在幫助銀行 IT 業務分析師（BA）建立以下能力：

- 理解 Mainframe 系統基本概念與運作方式
- 看懂基本 COBOL 程式、Copybook、JCL
- 能把業務需求轉化成技術需求
- 能精準與開發人員溝通
- 能進行需求分析、影響分析、測試設計

## 學習路線圖

### 第 1 階段：Mainframe 系統概念入門 ✅
- [x] Lesson 1-1：Mainframe 在銀行的角色 ✅
- [x] Lesson 1-2：Batch vs Online 處理模式 ✅
- [x] Lesson 1-3：z/OS、Dataset、PDS、Member 概念 ✅
- [x] Lesson 1-4：Job、Step、Program、Procedure 關係 ✅

### 第 2 階段：COBOL 程式結構與資料定義 ✅
- [x] Lesson 2-1：COBOL 四大 DIVISION ✅
- [x] Lesson 2-2：變數宣告與 PIC 子句 ✅
- [x] Lesson 2-3：Level Number 與資料結構 ✅
- [x] Lesson 2-4：COMP、COMP-3、Packed Decimal ✅
- [x] Lesson 2-5：流程控制：IF、EVALUATE、PERFORM ✅
- [x] Lesson 2-6：COPYBOOK 與程式碼複用 ✅
- [x] Lesson 2-7：呼叫外部程式 (CALL) ✅
- [x] Lesson 2-8：錯誤處理與檔案狀態碼 ✅

### 第 3 階段：檔案、批次、JCL、報表 ✅
- [x] Lesson 3-1：Sequential File 與 VSAM File ✅
- [x] Lesson 3-2：檔案操作：READ、WRITE、REWRITE ✅
- [x] Lesson 3-3：JCL 基本結構 ✅
- [x] Lesson 3-4：Sort 與 Utility ✅
- [x] Lesson 3-5：報表輸出流程 ✅
- [x] Lesson 3-6：MQ/Socket 通訊概念 ✅
- [x] Lesson 3-7：DB2 基本概念 ✅
- [x] Lesson 3-8：CICS 線上交易入門 ✅

### 第 4 階段：銀行實務案例 ✅
- [x] Lesson 4-1：CLM 資金池管理系統架構 ✅
- [x] Lesson 4-2：計息邏輯實現 ✅
- [x] Lesson 4-3：日終批次處理流程 ✅
- [x] Lesson 4-4：對帳與報表生成 ✅
- [x] Lesson 4-5：存款/放款系統實例 ✅
- [x] Lesson 4-6：跨系統資料交換 ✅

### 第 5 階段：BA 溝通與影響分析 ✅
- [x] Lesson 5-1：需求拆解技巧 ✅
- [x] Lesson 5-2：影響分析方法 ✅
- [x] Lesson 5-3：測試案例設計 ✅
- [x] Lesson 5-4：與開發人員溝通技巧 ✅
- [x] Lesson 5-5：技術規格書閱讀 ✅
- [x] Lesson 5-6：UAT 測試規劃 ✅
- [x] Lesson 5-7：上線檢查清單 ✅

### 第 6 階段：CLM 專題進階 ✅
基於 CLM (Cash and Liquidity Management) 功能說明書的實務教學

- [x] Lesson 6-1：CLM 利息計算引擎剖析 (Tier/Slab/Hybrid) ✅
- [x] Lesson 6-2：CLM 利率覆蓋機制 (Pricing Override) ✅
- [x] Lesson 6-3：CLM 批次重啟與容錯機制 ✅
- [x] Lesson 6-4：CLM 多貨幣處理 (MCN) ✅
- [x] Lesson 6-5：CLM 監管報表生成 ✅

### 第 7 階段：實戰演練
- [ ] 真實程式碼解讀練習
- [ ] 模擬需求會議
- [ ] 缺陷分析練習

### 第 8 階段：工具與環境 🔜
- [ ] Lesson 8-1：常用工具介紹（TSO/ISPF、File-Aid、Coolgen）
- [ ] Lesson 8-2：日誌與除錯概念（SYSLOG、系統 dump）

## 目錄結構

```
Cobol-Learning/
├── README.md                 # 專案說明
├── docs/
│   ├── lessons/              # 課程文件
│   ├── examples/             # 程式範例
│   └── exercises/            # 練習題目
├── assets/                   # 圖片、圖表資源
└── references/               # 參考資料、術語表
```

## 快速開始

1. 從 [Lesson 1-1](docs/lessons/lesson-1-1-mainframe-intro.md) 開始
2. 每堂課包含：概念解釋、銀行實例、練習題
3. 建議循序漸進，每堂課後完成練習

## 適合對象

- 銀行 IT 部門業務分析師（BA）
- 需要與 Mainframe 團隊溝通的人員
- 想理解核心銀行系統運作的非技術人員

## GitHub Repository

https://github.com/jasonckfan/Cobol-Learning

## 授權

本專案為個人學習用途。
