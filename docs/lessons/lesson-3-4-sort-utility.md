# Lesson 3-4：Sort 與 Utility

## 學習目標

- 理解 DFSORT 的基本用法
- 掌握檔案排序與合併技術
- 能夠閱讀和設計排序相關的 JCL

---

## 為什麼需要排序？

在銀行批次處理中：
- 交易記錄依日期、帳號排序
- 報表依特定順序輸出
- 合併多個來源的資料
- 資料比對前需要排序

---

## DFSORT 基本語法

### JCL 結構

```jcl
//SORTSTEP EXEC PGM=SORT
//SYSOUT   DD SYSOUT=*
//SORTIN   DD DSN=輸入檔案,DISP=SHR
//SORTOUT  DD DSN=輸出檔案,DISP=(NEW,CATLG)
//SYSIN    DD *
 SORT FIELDS=(起始,長度,格式,順序)
/*
```

### 欄位定義

```
FIELDS=(起始位置,長度,格式,順序)
```

| 參數 | 說明 |
|------|------|
| 起始位置 | 從第幾個 byte 開始 |
| 長度 | 排序鍵的長度 |
| 格式 | CH(字元), BI(二進制), PD(壓縮十進制) |
| 順序 | A(升序), D(降序) |

---

## 基本排序範例

### 依帳號排序

```jcl
//SORT01  EXEC PGM=SORT
//SYSOUT  DD SYSOUT=*
//SORTIN  DD DSN=PROD.TRANS.DAILY,DISP=SHR
//SORTOUT DD DSN=PROD.TRANS.SORTED(+1),DISP=(NEW,CATLG),
//           SPACE=(CYL,(50,25)),UNIT=SYSDA
//SYSIN   DD *
 SORT FIELDS=(1,16,CH,A)
/*
```

### 多重鍵排序

```jcl
//SYSIN   DD *
 SORT FIELDS=(1,16,CH,A,    *> 主鍵：帳號（升序）
              17,8,CH,D)     *> 次鍵：日期（降序）
/*
```

---

## 常用 SORT 控制敘述

### INCLUDE/OMIT - 資料篩選

```jcl
//SYSIN   DD *
 SORT FIELDS=(1,16,CH,A)
 INCLUDE COND=(25,2,CH,EQ,C'DP')  *> 只包含存款交易
/*
```

```jcl
//SYSIN   DD *
 SORT FIELDS=(1,16,CH,A)
 OMIT COND=(25,2,CH,EQ,C'WD')     *> 排除提款交易
/*
```

### INREC/OUTREC - 資料轉換

```jcl
//SYSIN   DD *
 SORT FIELDS=(1,16,CH,A)
 OUTREC FIELDS=(1,16,        *> 帳號
               17,8,        *> 日期
               25,12,       *> 金額
               50X)         *> 填充 50 空白
/*
```

### SUM - 資料彙總

```jcl
//SYSIN   DD *
 SORT FIELDS=(1,16,CH,A)
 SUM FIELDS=(25,12,ZD)    *> 依帳號加總金額
/*
```

---

## ICETOOL 進階功能

ICETOOL 提供更強大的資料處理功能。

### 基本語法

```jcl
//TOOLSTEP EXEC PGM=ICETOOL
//TOOLMSG  DD SYSOUT=*
//DFSMSG   DD SYSOUT=*
//IN1      DD DSN=輸入檔案,DISP=SHR
//OUT1     DD DSN=輸出檔案,DISP=(NEW,CATLG)
//TOOLIN   DD *
 ICETOOL 控制敘述
/*
```

### 常用功能

#### COPY - 複製檔案

```jcl
//TOOLIN  DD *
 COPY FROM(IN1) TO(OUT1)
/*
```

#### SELECT - 選取記錄

```jcl
//TOOLIN  DD *
 SELECT FROM(IN1) TO(OUT1) ON(1,16,CH) FIRST
/*
```

#### SPLICE - 合併資料

```jcl
//TOOLIN  DD *
 SPLICE FROM(IN1) TO(OUT1) ON(1,16,CH) WITHALL
/*
```

#### COUNT - 計數

```jcl
//TOOLIN  DD *
 COUNT FROM(IN1) WRITE(COUNT) TEXT('總記錄數: ')
/*
```

---

## 檔案合併（MERGE）

### 合併多個已排序的檔案

```jcl
//MERGE01 EXEC PGM=SORT
//SYSOUT  DD SYSOUT=*
//SORTIN01 DD DSN=PROD.TRANS.BRANCH1,DISP=SHR
//SORTIN02 DD DSN=PROD.TRANS.BRANCH2,DISP=SHR
//SORTIN03 DD DSN=PROD.TRANS.BRANCH3,DISP=SHR
//SORTOUT DD DSN=PROD.TRANS.MERGED(+1),DISP=(NEW,CATLG)
//SYSIN   DD *
 MERGE FIELDS=(1,16,CH,A)
/*
```

---

## 銀行實務範例

### 交易明細排序與彙總

```jcl
//TRANSRT  EXEC PGM=SORT
//SYSOUT   DD SYSOUT=*
//SORTIN   DD DSN=PROD.TRANS.DAILY,DISP=SHR
//SORTOUT  DD DSN=PROD.TRANS.SUM(+1),DISP=(NEW,CATLG),
//            SPACE=(CYL,(30,15)),UNIT=SYSDA
//SYSIN    DD *
* 依帳號排序，加總金額
 SORT FIELDS=(1,16,CH,A)
 SUM FIELDS=(33,12,ZD)
/*
```

### 帳戶對帳比對

```jcl
//RECON   EXEC PGM=ICETOOL
//TOOLMSG DD SYSOUT=*
//DFSMSG  DD SYSOUT=*
//CORE    DD DSN=PROD.ACCT.CORE,DISP=SHR
//GL      DD DSN=PROD.ACCT.GL,DISP=SHR
//MATCH   DD DSN=PROD.RECON.MATCH(+1),DISP=(NEW,CATLG)
//UNMATCH DD DSN=PROD.RECON.UNMATCH(+1),DISP=(NEW,CATLG)
//TOOLIN  DD *
* 合併兩個來源
 SPLICE FROM(CORE) TO(TEMP) ON(1,16,CH) WITHALL
 SPLICE FROM(GL) TO(TEMP) ON(1,16,CH) WITHALL
* 比對結果
 COPY FROM(TEMP) TO(MATCH) USING(CTL1)
 COPY FROM(TEMP) TO(UNMATCH) USING(CTL2)
/*
//CTL1CNTL DD *
 INCLUDE COND=(81,1,CH,EQ,C'M')
/*
//CTL2CNTL DD *
 INCLUDE COND=(81,1,CH,NE,C'M')
/*
```

---

## BA 實務應用

### 排序需求分析

| 需求 | 排序鍵 | 順序 |
|------|--------|------|
| 帳戶對帳單 | 帳號、日期 | 升序 |
| 交易明細報表 | 日期、時間、帳號 | 升序 |
| 高資產客戶報表 | 餘額 | 降序 |
| 交易金額排行 | 金額 | 降序 |

### 需求確認重點

| 問題 | 目的 |
|------|------|
| 「排序的主要目的是什麼？」 | 確認排序鍵 |
| 「資料量大約多少？」 | 評估效能和空間 |
| 「是否需要篩選？」 | 確認 INCLUDE/OMIT |
| 「是否需要合併多個來源？」 | 確認 MERGE 需求 |

---

## 練習題

### 題目 1
設計一個 SORT JCL，依交易金額降序排序，輸出前 100 筆。

### 題目 2
說明以下 SORT 控制敘述的作用：

```jcl
 SORT FIELDS=(1,16,CH,A,20,8,CH,D)
 INCLUDE COND=(30,2,CH,EQ,C'CA')
 SUM FIELDS=(40,12,ZD)
```

### 題目 3
設計一個 MERGE JCL，合併三個分行的交易檔案，依帳號排序。

---

## 重點回顧

| 敘述 | 功能 |
|------|------|
| SORT FIELDS | 定義排序鍵 |
| INCLUDE/OMIT | 篩選資料 |
| SUM | 彙總數值 |
| MERGE | 合併已排序檔案 |
| ICETOOL | 進階資料處理 |

---

## 延伸閱讀

- [Lesson 3-5：報表輸出流程](lesson-3-5-report-output.md)
- [Lesson 3-3：JCL 基本結構](lesson-3-3-jcl-basic.md)
