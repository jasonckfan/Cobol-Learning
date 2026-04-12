# Lesson 3-4: Sort 與 Utility

> 掌握 Mainframe 常用 Utility 程式

---

## 學習目標

- 理解 SORT Utility 的使用
- 掌握 IEBGENER、IEBCOPY 等常用工具
- 學會複製、備份、比較檔案
- 了解 BA 在批次作業設計時的關注點

---

## 一、SORT Utility

### 1.1 SORT 基本語法

```jcl
//SORT     EXEC PGM=SORT
//SORTIN   DD   DSN=INPUT.FILE,DISP=SHR
//SORTOUT  DD   DSN=OUTPUT.FILE,DISP=(NEW,CATLG,DELETE),
//             SPACE=(CYL,(10,5)),UNIT=SYSDA
//SYSOUT   DD   SYSOUT=*
//SYSIN    DD   *
 SORT FIELDS=(起始位置,長度,格式,順序)
/*
```

### 1.2 SORT 範例

```jcl
* 單一欄位排序
//SYSIN    DD   *
 SORT FIELDS=(1,10,CH,A)
/*

* 多欄位排序
//SYSIN    DD   *
 SORT FIELDS=(1,8,CH,A,9,20,CH,D)
/*

* 數值排序
//SYSIN    DD   *
 SORT FIELDS=(30,9,ZD,D)
/*

* 使用 INCLUDE 篩選
//SYSIN    DD   *
 SORT FIELDS=(1,10,CH,A)
 INCLUDE COND=(11,3,CH,EQ,C'ABC')
/*

* 使用 OUTFIL 分割輸出
//SYSIN    DD   *
 SORT FIELDS=(1,10,CH,A)
 OUTFIL FNAMES=OUT1,INCLUDE=(21,1,CH,EQ,C'1')
 OUTFIL FNAMES=OUT2,INCLUDE=(21,1,CH,EQ,C'2')
/*
```

### 1.3 SORT 控制語句

| 語句 | 用途 | 範例 |
|------|------|------|
| **SORT** | 排序欄位 | SORT FIELDS=(1,10,CH,A) |
| **MERGE** | 合併已排序檔 | MERGE FIELDS=(1,10,CH,A) |
| **INCLUDE** | 選擇記錄 | INCLUDE COND=(1,2,CH,EQ,C'AB') |
| **OMIT** | 排除記錄 | OMIT COND=(1,2,CH,EQ,C'XX') |
| **INREC** | 輸入記錄處理 | INREC BUILD=(1,10,11,20) |
| **OUTREC** | 輸出記錄處理 | OUTREC BUILD=(1,10,C'ABC') |
| **OUTFIL** | 多輸出檔 | OUTFIL FNAMES=OUT1 |
| **SUM** | 加總 | SUM FIELDS=(30,9,ZD) |

---

## 二、IEBGENER Utility

### 2.1 IEBGENER 用途

IEBGENER 用於複製檔案、建立新檔案、或產生測試資料。

```jcl
* 複製檔案
//COPY     EXEC PGM=IEBGENER
//SYSUT1   DD   DSN=INPUT.FILE,DISP=SHR
//SYSUT2   DD   DSN=OUTPUT.FILE,DISP=(NEW,CATLG,DELETE),
//             SPACE=(CYL,(10,5)),UNIT=SYSDA
//SYSPRINT DD   SYSOUT=*
//SYSIN    DD   DUMMY

* 產生測試資料
//GEN      EXEC PGM=IEBGENER
//SYSUT1   DD   *
 RECORD 001
 RECORD 002
 RECORD 003
/*
//SYSUT2   DD   DSN=TEST.FILE,DISP=(NEW,CATLG,DELETE),
//             SPACE=(TRK,1),UNIT=SYSDA
//SYSPRINT DD   SYSOUT=*
//SYSIN    DD   DUMMY
```

---

## 三、IEBCOPY Utility

### 3.1 IEBCOPY 用途

IEBCOPY 用於複製 PDS (Partitioned Data Set) 成員。

```jcl
* 複製 PDS 成員
//COPY     EXEC PGM=IEBCOPY
//SYSPRINT DD   SYSOUT=*
//SYSUT1   DD   DSN=SOURCE.PDS,DISP=SHR
//SYSUT2   DD   DSN=TARGET.PDS,DISP=SHR
//SYSIN    DD   *
 COPY OUTDD=SYSUT2,INDD=SYSUT1
 SELECT MEMBER=(MEM1,MEM2,MEM3)
/*

* 複製整個 PDS
//COPYALL  EXEC PGM=IEBCOPY
//SYSPRINT DD   SYSOUT=*
//SYSUT1   DD   DSN=SOURCE.PDS,DISP=SHR
//SYSUT2   DD   DSN=TARGET.PDS,DISP=(NEW,CATLG,DELETE),
//             SPACE=(CYL,(10,5,10)),UNIT=SYSDA
//SYSIN    DD   *
 COPY OUTDD=SYSUT2,INDD=SYSUT1
/*
```

---

## 四、IEBCOMPR Utility

### 4.1 IEBCOMPR 用途

IEBCOMPR 用於比較兩個檔案是否相同。

```jcl
* 比較兩個檔案
//COMPARE  EXEC PGM=IEBCOMPR
//SYSPRINT DD   SYSOUT=*
//SYSUT1   DD   DSN=FILE1,DISP=SHR
//SYSUT2   DD   DSN=FILE2,DISP=SHR
//SYSIN    DD   DUMMY

* 比較 PDS
//COMPPDS  EXEC PGM=IEBCOMPR
//SYSPRINT DD   SYSOUT=*
//SYSUT1   DD   DSN=PDS1,DISP=SHR
//SYSUT2   DD   DSN=PDS2,DISP=SHR
//SYSIN    DD   *
 COMPARE TYPORG=PO
/*
```

---

## 五、IDCAMS Utility

### 5.1 IDCAMS 用途

IDCAMS 用於管理 VSAM 檔案和資料集。

```jcl
* 定義 VSAM KSDS
//DEFINE   EXEC PGM=IDCAMS
//SYSPRINT DD   SYSOUT=*
//SYSIN    DD   *
 DEFINE CLUSTER (NAME(VSAM.FILE) -
                CYLINDERS(10 5) -
                KEYS(12 0) -
                RECORDSIZE(100 500) -
                INDEXED)
/*

* 刪除 VSAM 檔案
//DELETE   EXEC PGM=IDCAMS
//SYSPRINT DD   SYSOUT=*
//SYSIN    DD   *
 DELETE VSAM.FILE CLUSTER
/*

* 匯出 VSAM 到 Sequential
//EXPORT   EXEC PGM=IDCAMS
//SYSPRINT DD   SYSOUT=*
//VSAMFILE DD   DSN=VSAM.FILE,DISP=SHR
//SEQFILE  DD   DSN=EXPORT.FILE,DISP=(NEW,CATLG,DELETE),
//             SPACE=(CYL,(10,5)),UNIT=SYSDA
//SYSIN    DD   *
 REPRO INFILE(VSAMFILE) OUTFILE(SEQFILE)
/*

* 匯入 Sequential 到 VSAM
//IMPORT   EXEC PGM=IDCAMS
//SYSPRINT DD   SYSOUT=*
//SEQFILE  DD   DSN=EXPORT.FILE,DISP=SHR
//VSAMFILE DD   DSN=VSAM.FILE,DISP=SHR
//SYSIN    DD   *
 REPRO INFILE(SEQFILE) OUTFILE(VSAMFILE)
/*
```

---

## 六、IEHLIST Utility

### 6.1 IEHLIST 用途

IEHLIST 用於列出 VTOC (Volume Table of Contents) 資訊。

```jcl
* 列出 Dataset 資訊
//LIST     EXEC PGM=IEHLIST
//SYSPRINT DD   SYSOUT=*
//DD1      DD   VOL=SER=WORK01,DISP=OLD
//SYSIN    DD   *
 LISTVTOC FORMAT,VOL=WORK01
/*

* 列出特定 Dataset
//LISTDS   EXEC PGM=IEHLIST
//SYSPRINT DD   SYSOUT=*
//DD1      DD   VOL=SER=WORK01,DISP=OLD
//SYSIN    DD   *
 LISTVTOC FORMAT,VOL=WORK01,DSN=MY.FILE
/*
```

---

## 七、總結

### 本課程重點回顧

✅ **SORT**: 排序、合併、篩選、加總

✅ **IEBGENER**: 複製檔案、產生資料

✅ **IEBCOPY**: 複製 PDS 成員

✅ **IEBCOMPR**: 比較檔案

✅ **IDCAMS**: 管理 VSAM 檔案

✅ **IEHLIST**: 列出 VTOC 資訊

---

*課程版本: 1.0 | 更新日期: 2026-04-12*
