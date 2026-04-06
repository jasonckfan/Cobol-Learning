# Lesson 3-3：JCL 基本結構

## 學習目標

- 理解 JCL 的組成結構
- 掌握 JOB、EXEC、DD 敘述的用途
- 能夠閱讀基本的 JCL 批次作業

---

## 什麼是 JCL？

JCL（Job Control Language）是 IBM Mainframe 的作業控制語言，用於：

- 定義要執行的程式
- 配置程式所需的資源
- 控制作業的執行順序

> 💡 **BA 小提示**：JCL 就像是「程式的執行說明書」，告訴系統怎麼跑批次作業。

---

## JCL 三大敘述

### 1. JOB 敘述

標記作業的開始，定義作業層級的參數。

```jcl
//作業名稱 JOB (帳號),'說明',關鍵字參數
```

#### 範例

```jcl
//ACCTINT JOB (BANK01),'利息計算',CLASS=A,
//             MSGCLASS=X,NOTIFY=&SYSUID
```

#### 常用參數

| 參數 | 說明 | 範例 |
|------|------|------|
| (account) | 帳戶代碼，用於計費 | (BANK01) |
| 'description' | 作業說明 | '利息計算' |
| CLASS | 作業類別 | CLASS=A |
| MSGCLASS | 訊息輸出類別 | MSGCLASS=X |
| NOTIFY | 完成通知 | NOTIFY=&SYSUID |
| TIME | 最大執行時間 | TIME=1440 |
| REGION | 記憶體配置 | REGION=4M |

---

### 2. EXEC 敘述

標記作業步驟（Step），指定要執行的程式。

```jcl
//步驟名稱 EXEC PGM=程式名稱,參數
```

或執行程序（PROC）：

```jcl
//步驟名稱 EXEC PROC=程序名稱,參數
```

#### 範例

```jcl
//STEP010 EXEC PGM=ACCTINT,REGION=4M
//STEP020 EXEC PGM=IKJEFT01,REGION=2M
//STEP030 EXEC PROC=DAILYBAT
```

#### 常用參數

| 參數 | 說明 | 範例 |
|------|------|------|
| PGM | 要執行的程式 | PGM=ACCTINT |
| PROC | 要執行的程序 | PROC=DAILYBAT |
| REGION | 記憶體需求 | REGION=4M |
| TIME | 最長執行時間 | TIME=60 |
| PARM | 程式參數 | PARM='DAILY' |
| COND | 條件執行 | COND=(0,NE) |

---

### 3. DD 敘述

定義程式使用的資料集（檔案）或設備。

```jcl
//dd名稱 DD 參數
```

#### 範例

```jcl
//SYSOUT   DD SYSOUT=*
//ACCTDATA DD DSN=PROD.ACCT.MASTER,DISP=SHR
//INTFILE  DD DSN=PROD.INT.DAILY(+1),DISP=(NEW,CATLG),
//            SPACE=(CYL,(50,25)),UNIT=SYSDA
```

#### 常用參數

| 參數 | 說明 | 範例 |
|------|------|------|
| SYSOUT | 系統輸出 | SYSOUT=* |
| DSN | 資料集名稱 | DSN=PROD.ACCT |
| DISP | 資料集狀態 | DISP=SHR |
| SPACE | 空間配置 | SPACE=(CYL,(50,25)) |
| UNIT | 儲存設備 | UNIT=SYSDA |
| DCB | 資料控制塊 | DCB=(RECFM=FB,LRECL=80) |
| VOL | 磁碟機代號 | VOL=SER=PROD01 |

---

## DISP 參數詳解

```
DISP=(狀態,正常處理,異常處理)
```

### 狀態值

| 值 | 說明 |
|----|------|
| NEW | 新建資料集 |
| OLD | 獨佔使用現有資料集 |
| SHR | 共享使用現有資料集 |
| MOD | 在現有資料集末尾追加 |

### 正常/異常處理

| 值 | 說明 |
|----|------|
| DELETE | 刪除資料集 |
| KEEP | 保留資料集 |
| CATLG | 保留並加入目錄 |
| UNCATLG | 保留但從目錄移除 |

### 範例

```jcl
//INPUT   DD DSN=PROD.ACCT.MASTER,DISP=SHR
//OUTPUT  DD DSN=PROD.INT.DAILY(+1),DISP=(NEW,CATLG,DELETE)
//TEMP    DD DSN=&&TEMP,DISP=(NEW,DELETE),SPACE=(TRK,(10,5))
```

---

## GDG（Generation Data Group）

世代資料集，用於管理同一資料集的多個版本。

### 定義格式

```
DSN=資料集名稱(世代)
```

### 世代表示

| 表示 | 說明 |
|------|------|
| (0) | 當前世代 |
| (+1) | 新建下一世代 |
| (-1) | 上一世代 |
| (-2) | 前兩個世代 |

### 範例

```jcl
// 讀取當天資料
//INPUT   DD DSN=PROD.DAILY.TRANS(0),DISP=SHR

// 讀取前一天資料
//PREV    DD DSN=PROD.DAILY.TRANS(-1),DISP=SHR

// 建立新世代
//OUTPUT  DD DSN=PROD.DAILY.TRANS(+1),DISP=(NEW,CATLG)
```

---

## 完整 JCL 範例

### 銀行日終批次作業

```jcl
//DAILYEOD JOB (BANK01),'日終批次處理',
//             CLASS=A,MSGCLASS=X,NOTIFY=&SYSUID
//*********************************************************************
//*  日終批次處理
//*  1. 利息計算
//*  2. 報表生成
//*********************************************************************
//*
//*  Step 1: 利息計算
//*
//INTCALC  EXEC PGM=DAILYINT,REGION=4M
//STEPLIB  DD DSN=PROD.LOADLIB,DISP=SHR
//SYSOUT   DD SYSOUT=*
//SYSPRINT DD SYSOUT=*
//SYSUDUMP DD SYSOUT=*
//ACCTDATA DD DSN=PROD.ACCT.MASTER,DISP=SHR
//INTFILE  DD DSN=PROD.INT.DAILY(+1),DISP=(NEW,CATLG),
//            SPACE=(CYL,(50,25)),UNIT=SYSDA,
//            DCB=(RECFM=FB,LRECL=80,BLKSIZE=800)
//SYSIN    DD *
 PROCESS_DATE=20260404
 INT_RATE=0.025
/*
//*
//*  Step 2: 餘額更新
//*
//BALUPD  EXEC PGM=BALUPD,REGION=4M,COND=(0,NE)
//STEPLIB  DD DSN=PROD.LOADLIB,DISP=SHR
//SYSOUT   DD SYSOUT=*
//INTFILE  DD DSN=PROD.INT.DAILY(0),DISP=SHR
//ACCTDATA DD DSN=PROD.ACCT.MASTER,DISP=OLD
//*
//*  Step 3: 報表生成
//*
//RPTGEN  EXEC PGM=RPTGEN,REGION=4M,COND=(0,NE)
//STEPLIB  DD DSN=PROD.LOADLIB,DISP=SHR
//SYSOUT   DD SYSOUT=*
//ACCTDATA DD DSN=PROD.ACCT.MASTER,DISP=SHR
//DAILYRPT DD DSN=PROD.RPT.DAILY(+1),DISP=(NEW,CATLG),
//            SPACE=(CYL,(20,10)),UNIT=SYSDA,
//            DCB=(RECFM=FB,LRECL=133)
//*
```

---

## BA 實務應用

### 如何閱讀 JCL？

1. **看 JOB 敘述**：了解作業名稱和用途
2. **看 EXEC 敘述**：了解執行哪些程式
3. **看 DD 敘述**：了解使用哪些檔案
4. **追蹤資料流向**：從 DD 名稱對應到 COBOL 的 ASSIGN TO

### 與 COBOL 的對應關係

**JCL:**
```jcl
//ACCTDATA DD DSN=PROD.ACCT.MASTER,DISP=SHR
```

**COBOL:**
```cobol
       SELECT ACCT-FILE ASSIGN TO ACCTDATA
```

> DD 名稱（ACCTDATA）對應 COBOL 的 ASSIGN TO 名稱。

### 需求分析時的關鍵問題

| 看到的內容 | 應該問的問題 |
|------------|-------------|
| 多個 EXEC | 「這些步驟的執行順序是什麼？」 |
| COND 參數 | 「在什麼情況下會跳過這個步驟？」 |
| DISP=OLD | 「這個檔案會被獨佔鎖定嗎？」 |
| GDG (+1) | 「這是新建資料還是覆蓋？」 |

---

## 練習題

### 題目 1
說明以下 JCL 中各個參數的意義：

```jcl
//STEP010 EXEC PGM=ACCTINT,REGION=4M,TIME=60
```

### 題目 2
以下 DD 敘述定義了什麼？

```jcl
//OUTPUT DD DSN=PROD.RPT.DAILY(+1),DISP=(NEW,CATLG,DELETE),
//          SPACE=(CYL,(20,10)),UNIT=SYSDA
```

### 題目 3
設計一個 JCL，執行程式 RPTGEN，讀取 PROD.DATA.INPUT，輸出到 PROD.DATA.OUTPUT。

---

## 重點回顧

| 敘述 | 功能 | 關鍵參數 |
|------|------|----------|
| JOB | 定義作業 | CLASS, MSGCLASS, NOTIFY |
| EXEC | 定義步驟 | PGM, PROC, REGION, TIME |
| DD | 定義資料 | DSN, DISP, SPACE, UNIT |

---

## 延伸閱讀

- [Lesson 3-4：Sort 與 Utility](lesson-3-4-sort-utility.md)
- [Lesson 4-3：日終批次處理流程](lesson-4-3-eod-process.md)
