# Lesson 3-3: JCL 基本結構

> 理解 Job Control Language 的基礎語法

---

## 學習目標

- 理解 JCL 的基本結構與語法
- 掌握 JOB、EXEC、DD 語句
- 學會定義 Dataset 與參數
- 了解 BA 在閱讀 JCL 時的關注點

---

## 一、JCL 概覽

### 1.1 什麼是 JCL？

JCL (Job Control Language) 是 IBM Mainframe 上用於定義和執行批次作業的語言。它告訴系統要執行什麼程式、使用什麼檔案、以及如何處理輸出。

```
┌─────────────────────────────────────────────────────────────────┐
│              JCL 作業流程                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐                                               │
│   │   JCL 程式  │  ── 定義作業需求                              │
│   └──────┬──────┘                                               │
│          ↓                                                      │
│   ┌─────────────┐                                               │
│   │   z/OS      │  ── 解讀 JCL，配置資源                        │
│   │   系統      │                                               │
│   └──────┬──────┘                                               │
│          ↓                                                      │
│   ┌─────────────┐                                               │
│   │   執行      │  ── 執行程式、處理資料                        │
│   │   作業      │                                               │
│   └──────┬──────┘                                               │
│          ↓                                                      │
│   ┌─────────────┐                                               │
│   │   輸出      │  ── 產生報表、日誌                            │
│   └─────────────┘                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 JCL 基本結構

```jcl
//JOBNAME  JOB (ACCT),'DESCRIPTION',CLASS=A,MSGCLASS=H
//*----------------------------------------------------
//* 這是註解行
//*----------------------------------------------------
//STEP1    EXEC PGM=PROGRAM1
//INPUT    DD   DSN=INPUT.FILE,DISP=SHR
//OUTPUT   DD   DSN=OUTPUT.FILE,DISP=(NEW,CATLG,DELETE),
//             SPACE=(CYL,(10,5)),UNIT=SYSDA
//SYSOUT   DD   SYSOUT=*
//
//STEP2    EXEC PGM=PROGRAM2,COND=(0,NE,STEP1)
//INPUT    DD   DSN=OUTPUT.FILE,DISP=SHR
//REPORT   DD   SYSOUT=*
//
```

---

## 二、JOB 語句

### 2.1 JOB 語句語法

```jcl
//JOBNAME  JOB (ACCT),'DESCRIPTION',CLASS=A,MSGCLASS=H,
//             NOTIFY=USERID,REGION=0M

說明：
- JOBNAME: 作業名稱 (1-8 字元)
- JOB: 關鍵字
- (ACCT): 會計資訊
- 'DESCRIPTION': 作業描述
- CLASS=A: 作業類別
- MSGCLASS=H: 訊息輸出類別
- NOTIFY=USERID: 完成時通知使用者
- REGION=0M: 記憶體限制
```

### 2.2 常用 JOB 參數

| 參數 | 說明 | 範例 |
|------|------|------|
| **CLASS** | 作業類別 | CLASS=A, CLASS=C |
| **MSGCLASS** | 訊息輸出類別 | MSGCLASS=H, MSGCLASS=X |
| **MSGLEVEL** | 訊息詳細程度 | MSGLEVEL=(1,1) |
| **NOTIFY** | 完成通知 | NOTIFY=USERID |
| **REGION** | 記憶體限制 | REGION=4M, REGION=0M |
| **TIME** | CPU 時間限制 | TIME=5, TIME=1440 |
| **PRTY** | 優先順序 | PRTY=5 |

---

## 三、EXEC 語句

### 3.1 EXEC 語句語法

```jcl
//STEPNAME EXEC PGM=PROGRAM,COND=(0,NE),
//             PARM='PARAMETERS',TIME=5

說明：
- STEPNAME: 步驟名稱 (1-8 字元)
- EXEC: 關鍵字
- PGM=PROGRAM: 要執行的程式
- COND: 執行條件
- PARM: 傳遞給程式的參數
- TIME: CPU 時間限制
```

### 3.2 PROCEDURE 呼叫

```jcl
//STEPNAME EXEC PROC=PROCNAME
//STEPNAME EXEC PROCNAME

* 覆蓋 PROC 中的參數
//STEPNAME EXEC PROC=PROCNAME,
//             PARM.STEP1='OVERRIDE'
//INPUT    DD   DSN=MY.FILE,DISP=SHR
```

### 3.3 COND 參數

```jcl
* 條件執行範例

* 只有前一步驟 RC=0 才執行
//STEP2    EXEC PGM=PROG2,COND=(0,NE,STEP1)

* 前一步驟 RC<=4 才執行
//STEP3    EXEC PGM=PROG3,COND=(4,LT,STEP2)

* 多條件 (AND 關係)
//STEP4    EXEC PGM=PROG4,COND=((0,NE,STEP1),(0,NE,STEP2))

* 即使前一步驟失敗也執行
//STEP5    EXEC PGM=PROG5,COND=EVEN

* 只有前一步驟失敗才執行
//STEP6    EXEC PGM=PROG6,COND=ONLY
```

---

## 四、DD 語句

### 4.1 DD 語句基礎

```jcl
//DDNAME   DD   DSN=DATASET.NAME,DISP=STATUS,
//             SPACE=(UNIT,(PRIMARY,SECONDARY)),
//             UNIT=DEVICE,VOL=SER=VOLUME

說明：
- DDNAME: DD 名稱 (1-8 字元)
- DD: 關鍵字
- DSN: Dataset 名稱
- DISP: 處理狀態
- SPACE: 空間配置
- UNIT: 裝置類型
- VOL: 磁碟區
```

### 4.2 DISP 參數

```jcl
* DISP=(狀態,正常結束處理,異常結束處理)

* 已存在檔案，共用讀取
//INPUT    DD   DSN=EXISTING.FILE,DISP=SHR

* 新檔案，正常結束時保留，異常時刪除
//OUTPUT   DD   DSN=NEW.FILE,DISP=(NEW,CATLG,DELETE),
//             SPACE=(CYL,(10,5)),UNIT=SYSDA

* 已存在檔案，正常結束時保留，異常時保留
//WORK     DD   DSN=TEMP.FILE,DISP=(OLD,DELETE,DELETE)

* 修改已存在檔案
//UPDATE   DD   DSN=MASTER.FILE,DISP=MOD
```

### 4.3 SPACE 參數

```jcl
* SPACE=(單位,(初值,增量,目錄區塊),RLSE)

* 基本配置
//DATA     DD   DSN=MY.FILE,DISP=(NEW,CATLG,DELETE),
//             SPACE=(CYL,(100,50)),UNIT=SYSDA

* 使用 TRACK
//DATA     DD   DSN=MY.FILE,DISP=(NEW,CATLG,DELETE),
//             SPACE=(TRK,(1000,500)),UNIT=SYSDA

* 使用 BLOCK
//DATA     DD   DSN=MY.FILE,DISP=(NEW,CATLG,DELETE),
//             SPACE=(1000,(5000,1000)),UNIT=SYSDA

* 釋放未使用空間
//DATA     DD   DSN=MY.FILE,DISP=(NEW,CATLG,DELETE),
//             SPACE=(CYL,(100,50),RLSE),UNIT=SYSDA
```

---

## 五、特殊 DD 語句

### 5.1 SYSOUT 與 SYSPRINT

```jcl
* 輸出到系統輸出 (Spool)
//SYSOUT   DD   SYSOUT=*
//SYSOUT   DD   SYSOUT=A

* 輸出到特定資料集
//REPORT   DD   SYSOUT=*
//SYSOUT   DD   DSN=OUTPUT.DATA,DISP=(NEW,CATLG,DELETE),
//             SPACE=(CYL,(10,5)),UNIT=SYSDA
```

### 5.2 DUMMY 與 NULL

```jcl
* 無輸入
//INPUT    DD   DUMMY

* 丟棄輸出
//OUTPUT   DD   DUMMY

* 使用 IEFBR14 (空程式)
//STEP1    EXEC PGM=IEFBR14
```

### 5.3 參考其他 DD

```jcl
* 參考同一 JOB 中的其他 DD
//OUTPUT   DD   DSN=*.STEP1.INPUT,DISP=SHR

* 參考前一步驟的輸出
//INPUT    DD   DSN=*.STEP1.OUTPUT,DISP=SHR
```

---

## 六、完整 JCL 範例

### 6.1 批次計算作業

```jcl
//CALCBAT  JOB (ACCT001),'INTEREST CALC',CLASS=A,MSGCLASS=H,
//             NOTIFY=USERID,REGION=4M
//*----------------------------------------------------
//* 日終利息計算作業
//*----------------------------------------------------
//STEP1    EXEC PGM=IEFBR14
//DELFILE  DD   DSN=TEMP.WORK.FILE,DISP=(MOD,DELETE,DELETE),
//             SPACE=(TRK,1),UNIT=SYSDA
//*----------------------------------------------------
//* 排序交易檔
//*----------------------------------------------------
//STEP2    EXEC PGM=SORT
//SORTIN   DD   DSN=INPUT.TXN.FILE,DISP=SHR
//SORTOUT  DD   DSN=TEMP.SORTED.TXN,DISP=(NEW,PASS,DELETE),
//             SPACE=(CYL,(50,25)),UNIT=SYSDA
//SYSOUT   DD   SYSOUT=*
//SYSIN    DD   *
 SORT FIELDS=(1,10,CH,A)
/*
//*----------------------------------------------------
//* 計算利息
//*----------------------------------------------------
//STEP3    EXEC PGM=CALCINT,COND=(0,NE,STEP2)
//TXNFILE  DD   DSN=*.STEP2.SORTOUT,DISP=SHR
//ACCTFILE DD   DSN=MASTER.ACCOUNT.FILE,DISP=SHR
//RPTFILE  DD   DSN=OUTPUT.INTEREST.RPT,DISP=(NEW,CATLG,DELETE),
//             SPACE=(CYL,(20,10)),UNIT=SYSDA
//SYSOUT   DD   SYSOUT=*
//SYSABEND DD   SYSOUT=*
//*----------------------------------------------------
//* 備份結果
//*----------------------------------------------------
//STEP4    EXEC PGM=IEBGENER,COND=(0,NE,STEP3)
//SYSUT1   DD   DSN=OUTPUT.INTEREST.RPT,DISP=SHR
//SYSUT2   DD   DSN=BACKUP.INTEREST.RPT(+1),DISP=(NEW,CATLG,DELETE),
//             SPACE=(CYL,(20,10)),UNIT=SYSDA
//SYSPRINT DD   SYSOUT=*
//SYSIN    DD   DUMMY
//
```

---

## 七、總結

### 本課程重點回顧

✅ **JOB**: 定義作業，設定類別、訊息、資源

✅ **EXEC**: 執行程式，設定條件、參數

✅ **DD**: 定義檔案，設定名稱、狀態、空間

✅ **常用參數**: DISP, SPACE, UNIT, COND

✅ **特殊 DD**: SYSOUT, DUMMY, 參考語法

---

*課程版本: 1.0 | 更新日期: 2026-04-12*
