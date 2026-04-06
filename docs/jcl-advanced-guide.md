# JCL 進階應用指南

> 銀行 Mainframe 批次作業控制語言進階技巧

---

## 一、JCL 基礎回顧

### 1.1 JCL 結構

```jcl
//JOBNAME  JOB (ACCT),'JOB DESCRIPTION',
//             CLASS=A,              <-- 執行類別
//             MSGCLASS=X,           <-- 訊息類別
//             NOTIFY=&SYSUID,       <-- 完成通知
//             REGION=0M             <-- 記憶體區域
//*
//JOBLIB   DD DSN=PROD.LOADLIB,DISP=SHR  <-- 程式庫
//*
//STEP1    EXEC PGM=PROGRAM1        <-- 執行步驟
//INPUT    DD DSN=INPUT.FILE,DISP=SHR
//OUTPUT   DD DSN=OUTPUT.FILE,DISP=(NEW,CATLG),
//             SPACE=(CYL,(10,5),RLSE),
//             DCB=(RECFM=FB,LRECL=100,BLKSIZE=27900)
//SYSOUT   DD SYSOUT=*
//*
//STEP2    EXEC PGM=PROGRAM2,       <-- 下一步驟
//             COND=(0,NE,STEP1)     <-- 執行條件
//INPUT    DD DSN=*.STEP1.OUTPUT,DISP=SHR  <-- 參照前一步
//
```

### 1.2 常用參數速查

| 參數 | 說明 | 範例 |
|-----|------|------|
| `CLASS` | 執行優先等級 | A-Z |
| `MSGCLASS` | 訊息輸出類別 | A-Z, X |
| `REGION` | 記憶體限制 | 0M, 4M, 8M |
| `TIME` | CPU 時間限制 | (5,0) = 5 分鐘 |
| `PRTY` | 優先順序 | 0-15 |
| `TYPRUN` | 執行類型 | SCAN, HOLD, JCLHOLD |

---

## 二、進階 DD 敘述

### 2.1 資料集參照技巧

```jcl
// 方式 1：絕對參照 (Backward Reference)
//STEP2    EXEC PGM=SORT
//SORTIN   DD DSN=*.STEP1.OUTPUT,DISP=SHR  <-- 參照 STEP1 的 OUTPUT

// 方式 2：名稱參照
//STEP2    EXEC PGM=SORT
//SORTIN   DD DSN=*.PROG1.INPUT,DISP=SHR   <-- 參照 PROG1 的 INPUT

// 方式 3：相同名稱自動繼承
//STEP2    EXEC PGM=SORT
//SORTIN   DD DSN=*.STEP1.SORTIN,DISP=SHR
```

### 2.2 GDG (Generation Data Group)

```jcl
// 定義 GDG 基底 (只需執行一次)
//DEFINE   EXEC PGM=IDCAMS
//SYSPRINT DD SYSOUT=*
//SYSIN    DD *
  DEFINE GDG (NAME(DAS.DAILY.TRANS) -
              LIMIT(10) -
              SCRATCH -
              NOEMPTY)
/*

// 使用 GDG
//STEP1    EXEC PGM=TXNPROC
//INPUT    DD DSN=DAS.DAILY.TRANS(0),DISP=SHR      <-- 最新版本
//OUTPUT   DD DSN=DAS.DAILY.TRANS(+1),             <-- 產生新版本
//             DISP=(NEW,CATLG),
//             SPACE=(CYL,(10,5),RLSE),
//             DCB=(RECFM=FB,LRECL=100)

// 參照舊版本
//STEP2    EXEC PGM=REPORT
//INPUT    DD DSN=DAS.DAILY.TRANS(-1),DISP=SHR     <-- 前一版
//INPUT2   DD DSN=DAS.DAILY.TRANS(-2),DISP=SHR     <-- 前兩版
```

### 2.3 暫時資料集 (Temporary Dataset)

```jcl
// 方式 1：&& 暫時資料集 (Job 結束後刪除)
//STEP1    EXEC PGM=SORT
//SORTOUT  DD DSN=&&TEMPFILE,              <-- && 表示暫時
//             DISP=(NEW,PASS),
//             SPACE=(CYL,(5,1),RLSE),
//             UNIT=SYSDA

//STEP2    EXEC PGM=PROCESS
//INPUT    DD DSN=&&TEMPFILE,DISP=(OLD,DELETE)  <-- 使用後刪除

// 方式 2：系統產生名稱
//STEP1    EXEC PGM=SORT
//SORTOUT  DD DSN=&&SORTWORK,              <-- 系統自動命名
//             DISP=(NEW,PASS),
//             SPACE=(CYL,(10,5),RLSE)

// 方式 3：不指定 DSN (系統自動產生)
//STEP1    EXEC PGM=SORT
//SORTOUT  DD UNIT=SYSDA,                  <-- 無 DSN，系統自動產生
//             SPACE=(CYL,(5,1),RLSE),
//             DISP=(NEW,PASS)
```

---

## 三、進階 EXEC 敘述

### 3.1 條件執行 (COND)

```jcl
// 基本語法：COND=(RC,OPERATOR,STEP)
// RC = Return Code
// OPERATOR = EQ, NE, GT, LT, GE, LE
// STEP = 參照的步驟名稱

//STEP2    EXEC PGM=STEP2,
//             COND=(0,NE,STEP1)     <-- STEP1 RC ≠ 0 時執行

//STEP2    EXEC PGM=STEP2,
//             COND=(4,GT,STEP1)     <-- STEP1 RC > 4 時執行

//STEP2    EXEC PGM=STEP2,
//             COND=ONLY             <-- 只有前一步失敗時執行

//STEP2    EXEC PGM=STEP2,
//             COND=EVEN             <-- 無論前一步結果都執行

// 多條件
//STEP3    EXEC PGM=STEP3,
//             COND=((0,NE,STEP1),(4,GT,STEP2))
```

### 3.2 參數傳遞 (PARM)

```jcl
// 傳遞參數給程式
//STEP1    EXEC PGM=TXNPROC,
//             PARM='20240406,DEBUG=ON'

// COBOL 程式接收：
// LINKAGE SECTION.
// 01  PARM-AREA.
//     05  PARM-LENGTH    PIC S9(04) COMP.
//     05  PARM-DATA      PIC X(100).

// 傳遞多個參數
//STEP1    EXEC PGM=TXNPROC,
//             PARM=('20240406','0001','Y')
```

### 3.3 程式庫搜尋順序

```jcl
// 方式 1：JOBLIB (整個 Job 使用)
//JOBLIB   DD DSN=DAS.PROD.LOADLIB,DISP=SHR
//         DD DSN=DAS.TEST.LOADLIB,DISP=SHR   <-- 搜尋順序 2
//         DD DSN=CEE.SCEERUN,DISP=SHR       <-- 搜尋順序 3

// 方式 2：STEPLIB (單一步驟使用)
//STEP1    EXEC PGM=MYPROG
//STEPLIB  DD DSN=DAS.TEST.LOADLIB,DISP=SHR  <-- 只影響此步驟
//SYSOUT   DD SYSOUT=*

// 方式 3：系統預設 (LINKLIST)
// 不使用 JOBLIB/STEPLIB，系統從 LINKLIST 搜尋
```

---

## 四、SORT 進階應用

### 4.1 SORT 基本語法

```jcl
//SORT     EXEC PGM=SORT
//SYSOUT   DD SYSOUT=*
//SORTIN   DD DSN=DAS.INPUT.FILE,DISP=SHR
//SORTOUT  DD DSN=DAS.OUTPUT.FILE,DISP=(NEW,CATLG),
//             SPACE=(CYL,(10,5),RLSE)
//SYSIN    DD *
  SORT FIELDS=(1,12,CH,A)          <-- 排序欄位
/*
//
```

### 4.2 多欄位排序

```jcl
//SYSIN    DD *
  SORT FIELDS=(1,4,CH,A,            <-- 第 1 欄位：分行代碼 (遞增)
               5,8,CH,D,            <-- 第 2 欄位：日期 (遞減)
               13,12,PD,A)          <-- 第 3 欄位：金額 (遞增)
/*

// 欄位格式：
// CH = Character
// BI = Binary
// ZD = Zoned Decimal
// PD = Packed Decimal
// FI = Fixed Point
// FL = Floating Point
// AQ = ASCII
```

### 4.3 SORT 條件篩選

```jcl
// 使用 INCLUDE 篩選
//SYSIN    DD *
  INCLUDE COND=(13,9,PD,GT,1000000)  <-- 金額 > 1,000,000
  SORT FIELDS=(1,12,CH,A)
/*

// 使用 OMIT 排除
//SYSIN    DD *
  OMIT COND=(25,2,CH,EQ,C'XX')       <-- 排除狀態為 XX 的記錄
  SORT FIELDS=(1,12,CH,A)
/*

// 複合條件
//SYSIN    DD *
  INCLUDE COND=((13,9,PD,GT,1000000), <-- 金額 > 1,000,000
                AND,                  
                (25,1,CH,EQ,C'A'),    <-- 且狀態為 A
                AND,
                (5,8,CH,GE,C'20240101')) <-- 且日期 >= 20240101
  SORT FIELDS=(1,12,CH,A)
/*
```

### 4.4 SORT 資料彙總 (SUM)

```jcl
// 彙總相同 Key 的數值欄位
//SYSIN    DD *
  SORT FIELDS=(1,12,CH,A)            <-- 依帳號排序
  SUM FIELDS=(25,9,PD)               <-- 彙總金額欄位
/*

// 彙總後保留明細
//SYSIN    DD *
  SORT FIELDS=(1,12,CH,A)
  SUM FIELDS=(25,9,PD),XSUM          <-- XSUM 產生未彙總記錄到另一檔
/*
```

### 4.5 SORT 資料轉換 (OUTREC)

```jcl
// 重新格式化輸出
//SYSIN    DD *
  SORT FIELDS=(1,12,CH,A)
  OUTREC FIELDS=(1,12,                <-- 帳號 (位置 1-12)
                 13,8,                <-- 日期 (位置 13-20)
                 21,9,PD,TO=ZD,LENGTH=11, <-- 金額轉換為 Zoned
                 30,30)               <-- 說明
/*

// 使用 BUILD (較新的語法)
//SYSIN    DD *
  SORT FIELDS=(1,12,CH,A)
  OUTREC BUILD=(1,12,
                13,8,
                21,9,PD,EDIT=(TTTTTTTTTTT.TT), <-- 格式化金額
                C' | ',
                30,30)
/*
```

---

## 五、IDCAMS 實用技巧

### 5.1 定義 VSAM 檔案

```jcl
//DEFINE   EXEC PGM=IDCAMS
//SYSPRINT DD SYSOUT=*
//SYSIN    DD *
  DEFINE CLUSTER (NAME(DAS.ACCOUNT.MASTER) -
                  CYLINDERS(10 5) -           <-- 初始 10 CYL，擴充 5 CYL
                  RECORDSIZE(500 500) -       <-- 固定長度 500 bytes
                  KEYS(12 0) -                <-- Key 長度 12，位移 0
                  FREESPACE(10 10) -          <-- CI 和 CA 保留 10%
                  CISZ(4096) -                <-- Control Interval 大小
                  SHR(2 3)) -                 <-- 跨系統共享選項
    DATA (NAME(DAS.ACCOUNT.MASTER.DATA)) -
    INDEX (NAME(DAS.ACCOUNT.MASTER.INDEX))
/*
//
```

### 5.2 複製 VSAM 檔案

```jcl
//REPRO    EXEC PGM=IDCAMS
//SYSPRINT DD SYSOUT=*
//INPUT    DD DSN=DAS.ACCOUNT.MASTER,DISP=SHR
//OUTPUT   DD DSN=DAS.ACCOUNT.MASTER.BACKUP,DISP=(NEW,CATLG),
//             LIKE=DAS.ACCOUNT.MASTER
//SYSIN    DD *
  REPRO INFILE(INPUT) OUTFILE(OUTPUT)
/*
//
```

### 5.3 刪除並重新定義

```jcl
//DELDEF   EXEC PGM=IDCAMS
//SYSPRINT DD SYSOUT=*
//SYSIN    DD *
  DELETE DAS.ACCOUNT.MASTER CLUSTER
  
  IF LASTCC = 0 OR LASTCC = 8 THEN -
    DEFINE CLUSTER (NAME(DAS.ACCOUNT.MASTER) -
                    CYLINDERS(10 5) -
                    RECORDSIZE(500 500) -
                    KEYS(12 0)) -
      DATA (NAME(DAS.ACCOUNT.MASTER.DATA)) -
      INDEX (NAME(DAS.ACCOUNT.MASTER.INDEX))
/*
//
```

### 5.4 驗證 VSAM 檔案

```jcl
//VERIFY   EXEC PGM=IDCAMS
//SYSPRINT DD SYSOUT=*
//SYSIN    DD *
  VERIFY FILE(DAS.ACCOUNT.MASTER)
/*
//
```

### 5.5 列印 VSAM 內容

```jcl
//PRINT    EXEC PGM=IDCAMS
//SYSPRINT DD SYSOUT=*
//INPUT    DD DSN=DAS.AC