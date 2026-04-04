# Lesson 4-3：日終批次處理流程

## 學習目標

- 理解銀行日終批次的整體架構
- 掌握批次處理的順序與依賴關係
- 能夠分析批次處理相關問題

---

## 什麼是日終批次？

銀行營業日結束後執行的一系列自動化處理程序：

- **帳務結算**：計算利息、手續費
- **資料彙總**：統計各類報表數據
- **對帳處理**：核對各系統資料
- **報表生成**：產生營運報表
- **資料備份**：保存當日交易記錄

---

## 日終批次架構

### 典型處理流程

```
┌─────────────────────────────────────────────────────────┐
│                    日終批次處理                          │
├─────────────────────────────────────────────────────────┤
│  1. 營業日切換 (EOB - End of Business)                   │
│     - 關閉當日交易                                       │
│     - 切換系統日期                                       │
├─────────────────────────────────────────────────────────┤
│  2. 資料收集                                            │
│     - 收集各系統交易資料                                  │
│     - 整合到核心系統                                      │
├─────────────────────────────────────────────────────────┤
│  3. 帳務處理                                            │
│     - 計算利息                                           │
│     - 計算手續費                                         │
│     - 帳戶餘額更新                                       │
├─────────────────────────────────────────────────────────┤
│  4. 對帳處理                                            │
│     - 核心系統對帳                                        │
│     - 跨系統對帳                                         │
├─────────────────────────────────────────────────────────┤
│  5. 報表生成                                            │
│     - 日報表                                            │
│     - 監管報表                                           │
│     - 管理報表                                           │
├─────────────────────────────────────────────────────────┤
│  6. 資料維護                                            │
│     - 歷史資料歸檔                                        │
│     - 資料庫維護                                         │
├─────────────────────────────────────────────────────────┤
│  7. 開啟新營業日                                         │
│     - 初始化參數                                         │
│     - 準備接受新交易                                      │
└─────────────────────────────────────────────────────────┘
```

---

## 批次排程

### 依賴關係

```
交易截止
    │
    ▼
┌─────────┐
│ 資料收集 │
└────┬────┘
     │
     ▼
┌─────────┐     ┌─────────┐     ┌─────────┐
│ 利息計算 │ ──▶│ 手續費   │ ──▶│ 餘額更新 │
└─────────┘     └─────────┘     └────┬────┘
                                     │
                    ┌────────────────┘
                    │
                    ▼
              ┌─────────┐
              │ 對帳處理 │
              └────┬────┘
                   │
                   ▼
              ┌─────────┐
              │ 報表生成 │
              └────┬────┘
                   │
                   ▼
              ┌─────────┐
              │ 新日開啟 │
              └─────────┘
```

### 時間窗口

| 時間 | 處理項目 | SLA |
|------|----------|-----|
| 18:00 | 交易截止 | - |
| 18:30 | 資料收集 | 30 min |
| 19:00 | 帳務處理 | 60 min |
| 20:00 | 對帳處理 | 30 min |
| 20:30 | 報表生成 | 60 min |
| 22:00 | 維護作業 | 60 min |
| 23:00 | 開啟新日 | 10 min |

---

## JCL 批次控制範例

### 主控 Job

```jcl
//EODMAIN  JOB (ACCT),'EOD BATCH',CLASS=A,MSGCLASS=X
//*********************************************************************
//*  日終批次主控程序
//*********************************************************************
//*
//*  Step 1: 檢查前置條件
//*
//STEP010  EXEC PGM=BPXBATCH
//SYSPRINT DD SYSOUT=*
//STDERR   DD SYSOUT=*
//STDOUT   DD SYSOUT=*
//PARM     DD *
SH /opt/scripts/check_precondition.sh
/*
//*
//*  Step 2: 切換營業日
//*
//STEP020  EXEC PGM=DAYCTL
//STEPLIB  DD DSN=PROD.LOADLIB,DISP=SHR
//SYSOUT   DD SYSOUT=*
//SYSIN    DD *
  ACTION=SWITCH
  NEWDATE=AUTO
/*
//*
//*  Step 3: 資料收集
//*
//STEP030  EXEC PGM=DATACOLL
//STEPLIB  DD DSN=PROD.LOADLIB,DISP=SHR
//SYSOUT   DD SYSOUT=*
//TRANSDATA DD DSN=PROD.TRANS.DAILY(+1),DISP=(NEW,CATLG),
//            SPACE=(CYL,(100,50)),UNIT=SYSDA
//*
//*  Step 4: 利息計算
//*
//STEP040  EXEC PGM=DAILYINT
//STEPLIB  DD DSN=PROD.LOADLIB,DISP=SHR
//SYSOUT   DD SYSOUT=*
//ACCTDATA DD DSN=PROD.ACCT.MASTER,DISP=SHR
//INTFILE  DD DSN=PROD.INT.DAILY(+1),DISP=(NEW,CATLG),
//            SPACE=(CYL,(50,25)),UNIT=SYSDA
//*
//*  Step 5: 餘額更新
//*
//STEP050  EXEC PGM=BALUPD
//STEPLIB  DD DSN=PROD.LOADLIB,DISP=SHR
//SYSOUT   DD SYSOUT=*
//INTFILE  DD DSN=PROD.INT.DAILY(0),DISP=SHR
//ACCTDATA DD DSN=PROD.ACCT.MASTER,DISP=SHR
//*
//*  Step 6: 對帳處理
//*
//STEP060  EXEC PGM=RECON
//STEPLIB  DD DSN=PROD.LOADLIB,DISP=SHR
//SYSOUT   DD SYSOUT=*
//RECONRPT DD DSN=PROD.RECON.RPT(+1),DISP=(NEW,CATLG),
//            SPACE=(CYL,(10,5)),UNIT=SYSDA
//*
//*  Step 7: 報表生成
//*
//STEP070  EXEC PGM=RPTGEN
//STEPLIB  DD DSN=PROD.LOADLIB,DISP=SHR
//SYSOUT   DD SYSOUT=*
//DAILYRPT DD DSN=PROD.DAILY.RPT(+1),DISP=(NEW,CATLG),
//            SPACE=(CYL,(20,10)),UNIT=SYSDA
//*
//*  Step 8: 完成通知
//*
//STEP080  EXEC PGM=BPXBATCH
//SYSPRINT DD SYSOUT=*
//PARM     DD *
SH /opt/scripts/notify_complete.sh
/*
```

---

## 錯誤處理與重跑

### 錯誤處理

```jcl
//STEP040  EXEC PGM=DAILYINT,COND=(0,NE)
//...
//*
//*  如果 STEP040 失敗，發送警報
//*
//ERR01    IF (STEP040.RC > 0) THEN
//ALERT    EXEC PGM=BPXBATCH
//PARM     DD *
SH /opt/scripts/send_alert.sh "EOD INT CALC FAILED"
/*
//         ENDIF
```

### 重跑機制

```jcl
//*********************************************************************
//*  重跑程序：從指定步驟開始
//*********************************************************************
//RESTART  JOB (ACCT),'EOD RESTART',CLASS=A,MSGCLASS=X
//  RD=R,RESTART=STEP050
//*
//STEP040  EXEC PGM=DAILYINT,COND=(0,NE,STEPNAME)
//  (此步驟會被跳過，因為已成功)
//*
//STEP050  EXEC PGM=BALUPD
//  (從此步驟開始執行)
```

---

## 監控與管理

### 監控指標

| 指標 | 說明 | 閾值 |
|------|------|------|
| 執行時間 | 各步驟耗時 | < SLA |
| 處理筆數 | 處理的記錄數 | 預期範圍 |
| 錯誤筆數 | 錯誤記錄數 | < 閾值 |
| Return Code | 程式返回碼 | = 0 |
| 資源使用 | CPU、記憶體 | < 閾值 |

### 常見問題處理

| 問題 | 可能原因 | 處理方式 |
|------|----------|----------|
| 批次逾時 | 資料量異常增加 | 調整 SLA 或優化程式 |
| 記憶體不足 | 大量資料處理 | 增加 REGION 參數 |
| 檔案鎖定 | 其他 Job 使用中 | 排程協調 |
| 對帳不符 | 資料不一致 | 人工介入調查 |

---

## BA 實務應用

### 需求分析時的考量

| 需求 | 批次影響 |
|------|----------|
| 新增交易類型 | 資料收集、對帳邏輯 |
| 新增計費項目 | 帳務處理、報表 |
| 新增報表 | 報表生成步驟 |
| 新增系統介接 | 資料收集、對帳 |

### 上線檢查重點

```
□ 批次排程已安排
□ 檔案空間已配置
□ 依賴關係已確認
□ 錯誤處理已測試
□ 重跑程序已驗證
□ 監控警報已設定
□ 回滾計畫已準備
```

---

## 練習題

### 題目 1
說明日終批次處理的主要階段及其目的。

### 題目 2
如果利息計算程式失敗（RC=8），應該如何處理？

### 題目 3
設計一個新系統介接的日終批次流程，包含：
- 資料收集
- 對帳處理
- 報表生成

---

## 重點回顧

| 階段 | 功能 |
|------|------|
| 營業日切換 | 關閉當日交易，切換系統日期 |
| 資料收集 | 整合各系統資料 |
| 帳務處理 | 利息、手續費計算 |
| 對帳處理 | 核對資料一致性 |
| 報表生成 | 產生各類報表 |
| 維護作業 | 歸檔、備份 |

---

## 延伸閱讀

- [Lesson 4-4：對帳與報表生成](lesson-4-4-reconciliation.md)
- [Lesson 3-3：JCL 基本結構](lesson-3-3-jcl-basic.md)
