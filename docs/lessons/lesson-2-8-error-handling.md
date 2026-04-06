# Lesson 2-8：錯誤處理與檔案狀態碼

## 學習目標

- 理解 COBOL 的錯誤處理機制
- 掌握 FILE STATUS 狀態碼的意義
- 能夠設計健壯的錯誤處理邏輯

---

## 為什麼錯誤處理很重要？

在銀行系統中：
- 檔案可能不存在或權限不足
- 資料可能格式錯誤或損壞
- 系統資源可能耗盡
- 網路連線可能中斷

**沒有適當的錯誤處理，小問題可能變成大災難！**

---

## FILE STATUS 狀態碼

### 定義方式

在 ENVIRONMENT DIVISION 中定義：

```cobol
       FILE-CONTROL.
           SELECT ACCT-FILE ASSIGN TO ACCTDATA
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-ACCT-STATUS.
```

### 狀態碼格式

FILE STATUS 是 2 碼的變數：

```cobol
       01 WS-ACCT-STATUS     PIC XX.
```

---

## 常見 FILE STATUS 狀態碼

### 成功狀態

| 狀態碼 | 意義 |
|--------|------|
| 00 | 操作成功 |
| 04 | 讀取成功，但記錄長度不符 |
| 05 | OPEN 成功，檔案是可選的且不存在 |

### 檔案結束

| 狀態碼 | 意義 |
|--------|------|
| 10 | 已到達檔案結尾（EOF） |

### 鍵值錯誤（VSAM/索引檔）

| 狀態碼 | 意義 |
|--------|------|
| 21 | 鍵值順序錯誤 |
| 22 | 鍵值重複 |
| 23 | 找不到記錄 |

### 資料錯誤

| 狀態碼 | 意義 |
|--------|------|
| 30 | 永久性錯誤（其他原因） |
| 34 | 寫入失敗（磁碟空間不足） |
| 35 | OPEN 失失敗（檔案不存在） |
| 37 | OPEN 失失敗（權限不符） |
| 38 | OPEN 失失敗（檔案已鎖定） |
| 39 | OPEN 失失敗（屬性不符） |
| 41 | 嘗試 OPEN 已開啟的檔案 |
| 42 | 嘗試 CLOSE 未開啟的檔案 |
| 43 | 檔案未開啟時嘗試讀寫 |
| 44 | 記錄長度不符 |
| 46 | 嘗試讀取未執行 START 的檔案 |
| 47 | 嘗試讀取未開啟為 INPUT 的檔案 |
| 48 | 嘗試寫入未開啟為 OUTPUT 的檔案 |
| 49 | 嘗試寫入未開啟為 I-O 的檔案 |

### I/O 錯誤

| 狀態碼 | 意義 |
|--------|------|
| 90 | 檔案鎖定 |
| 91 | 檔案被其他程式鎖定 |
| 92 | 邏輯錯誤 |
| 93 | 資源不可用 |
| 94 | 記錄被鎖定 |
| 95 | 檔案資訊無效 |
| 96 | 無可用記憶體 |
| 97 | 檔案屬性錯誤 |
| 98 | 檔案已存在 |
| 99 | 記錄鎖定失敗 |

---

## 錯誤處理範例

### 基本 OPEN 錯誤處理

```cobol
       1000-INIT.
           OPEN INPUT ACCT-FILE
           IF WS-ACCT-STATUS NOT = '00'
               EVALUATE WS-ACCT-STATUS
                   WHEN '35'
                       DISPLAY 'ERROR: 檔案不存在'
                   WHEN '37'
                       DISPLAY 'ERROR: 權限不足'
                   WHEN OTHER
                       DISPLAY 'ERROR: 無法開啟檔案 - ' WS-ACCT-STATUS
               END-EVALUATE
               STOP RUN
           END-IF.
```

### 讀取檔案錯誤處理

```cobol
       2000-READ-FILE.
           READ ACCT-FILE
               AT END
                   SET EOF-REACHED TO TRUE
               NOT AT END
                   IF WS-ACCT-STATUS NOT = '00'
                       DISPLAY 'READ ERROR: ' WS-ACCT-STATUS
                       PERFORM 8000-LOG-ERROR
                   ELSE
                       ADD 1 TO WS-READ-COUNT
                   END-IF
           END-READ.
```

### 寫入檔案錯誤處理

```cobol
       3000-WRITE-FILE.
           WRITE RPT-RECORD
           IF WS-RPT-STATUS NOT = '00'
               EVALUATE WS-RPT-STATUS
                   WHEN '34'
                       DISPLAY 'ERROR: 磁碟空間不足'
                   WHEN OTHER
                       DISPLAY 'WRITE ERROR: ' WS-RPT-STATUS
               END-EVALUATE
               PERFORM 8000-LOG-ERROR
           END-IF.
```

---

## DECLARATIVES（宣告區）

COBOL 提供 DECLARATIVES 區塊，用於自動處理檔案錯誤。

### 語法

```cobol
       PROCEDURE DIVISION.
       DECLARATIVES.
       段落名稱 SECTION.
           USE AFTER ERROR PROCEDURE ON 檔案名稱.
           錯誤處理敘述
       END DECLARATIVES.
```

### 範例

```cobol
       PROCEDURE DIVISION.
       DECLARATIVES.
       ACCT-ERROR SECTION.
           USE AFTER ERROR PROCEDURE ON ACCT-FILE.
           DISPLAY 'FILE I/O ERROR ON ACCT-FILE: ' WS-ACCT-STATUS
           PERFORM 8000-LOG-ERROR.
       RPT-ERROR SECTION.
           USE AFTER ERROR PROCEDURE ON RPT-FILE.
           DISPLAY 'FILE I/O ERROR ON RPT-FILE: ' WS-RPT-STATUS
           PERFORM 8000-LOG-ERROR.
       END DECLARATIVES.

       0000-MAIN.
           PERFORM 1000-INIT
           PERFORM 2000-PROCESS UNTIL EOF-REACHED
           PERFORM 9000-TERM
           STOP RUN.
```

> 💡 **優點**：集中處理所有檔案錯誤，不必在每次 I/O 操作後檢查。

---

## 完整錯誤處理範例

```cobol
       IDENTIFICATION DIVISION.
       PROGRAM-ID. ACCTPROC.

       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT ACCT-FILE ASSIGN TO ACCTDATA
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-ACCT-STATUS.
           SELECT RPT-FILE ASSIGN TO ACCTRPT
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-RPT-STATUS.
           SELECT ERR-FILE ASSIGN TO ERRLOG
               ORGANIZATION IS SEQUENTIAL
               FILE STATUS IS WS-ERR-STATUS.

       DATA DIVISION.
       FILE SECTION.
       FD ACCT-FILE.
       01 ACCT-RECORD.
          05 ACCT-NO           PIC X(16).
          05 ACCT-BALANCE      PIC S9(9)V99.

       FD RPT-FILE.
       01 RPT-RECORD           PIC X(80).

       FD ERR-FILE.
       01 ERR-RECORD           PIC X(120).

       WORKING-STORAGE SECTION.
       01 WS-FILE-STATUS.
          05 WS-ACCT-STATUS    PIC XX.
          05 WS-RPT-STATUS     PIC XX.
          05 WS-ERR-STATUS     PIC XX.

       01 WS-FLAGS.
          05 WS-EOF-FLAG       PIC X VALUE 'N'.
             88 EOF-REACHED    VALUE 'Y'.
          05 WS-ERROR-FLAG     PIC X VALUE 'N'.
             88 ERROR-FOUND    VALUE 'Y'.

       01 WS-COUNTERS.
          05 WS-READ-CNT       PIC 9(8) VALUE 0.
          05 WS-WRITE-CNT      PIC 9(8) VALUE 0.
          05 WS-ERROR-CNT      PIC 9(5) VALUE 0.

       01 ERR-MSG.
          05 ERR-TIMESTAMP     PIC X(20).
          05 ERR-PROGRAM       PIC X(8) VALUE 'ACCTPROC'.
          05 ERR-LOCATION      PIC X(20).
          05 ERR-CODE          PIC XX.
          05 ERR-DESCRIPTION   PIC X(50).
          05 ERR-DATA          PIC X(20).

       PROCEDURE DIVISION.
       DECLARATIVES.
       ACCT-ERROR SECTION.
           USE AFTER ERROR PROCEDURE ON ACCT-FILE.
           MOVE 'ACCT-FILE I/O ERROR' TO ERR-LOCATION
           MOVE WS-ACCT-STATUS TO ERR-CODE
           PERFORM 8000-LOG-ERROR.
       RPT-ERROR SECTION.
           USE AFTER ERROR PROCEDURE ON RPT-FILE.
           MOVE 'RPT-FILE I/O ERROR' TO ERR-LOCATION
           MOVE WS-RPT-STATUS TO ERR-CODE
           PERFORM 8000-LOG-ERROR.
       END DECLARATIVES.

       0000-MAIN.
           PERFORM 1000-INIT
           IF NOT ERROR-FOUND
               PERFORM 2000-PROCESS UNTIL EOF-REACHED OR ERROR-FOUND
           END-IF
           PERFORM 9000-TERM
           STOP RUN.

       1000-INIT.
           OPEN INPUT ACCT-FILE
           IF WS-ACCT-STATUS NOT = '00' AND WS-ACCT-STATUS NOT = '05'
               MOVE 'OPEN ACCT-FILE' TO ERR-LOCATION
               MOVE WS-ACCT-STATUS TO ERR-CODE
               PERFORM 8000-LOG-ERROR
               SET ERROR-FOUND TO TRUE
           END-IF

           IF NOT ERROR-FOUND
               OPEN OUTPUT RPT-FILE
               IF WS-RPT-STATUS NOT = '00'
                   MOVE 'OPEN RPT-FILE' TO ERR-LOCATION
                   MOVE WS-RPT-STATUS TO ERR-CODE
                   PERFORM 8000-LOG-ERROR
                   SET ERROR-FOUND TO TRUE
               END-IF
           END-IF

           IF NOT ERROR-FOUND
               OPEN OUTPUT ERR-FILE
               PERFORM 1100-READ-FIRST
           END-IF.

       1100-READ-FIRST.
           READ ACCT-FILE
               AT END SET EOF-REACHED TO TRUE
               NOT AT END ADD 1 TO WS-READ-CNT
           END-READ
           IF WS-ACCT-STATUS NOT = '00' AND WS-ACCT-STATUS NOT = '10'
               MOVE 'READ ACCT-FILE' TO ERR-LOCATION
               MOVE WS-ACCT-STATUS TO ERR-CODE
               PERFORM 8000-LOG-ERROR
           END-IF.

       2000-PROCESS.
           PERFORM 2100-VALIDATE
           IF NOT ERROR-FOUND
               PERFORM 2200-CALCULATE
               PERFORM 2300-WRITE-REPORT
           END-IF
           PERFORM 2400-READ-NEXT.

       2100-VALIDATE.
           IF ACCT-NO = SPACES
               MOVE 'VALIDATE' TO ERR-LOCATION
               MOVE 'E1' TO ERR-CODE
               MOVE '空白帳號' TO ERR-DESCRIPTION
               PERFORM 8000-LOG-ERROR
           END-IF.

       2200-CALCULATE.
           *> 計算邏輯...

       2300-WRITE-REPORT.
           WRITE RPT-RECORD
           IF WS-RPT-STATUS = '00'
               ADD 1 TO WS-WRITE-CNT
           ELSE
               MOVE 'WRITE RPT-FILE' TO ERR-LOCATION
               MOVE WS-RPT-STATUS TO ERR-CODE
               PERFORM 8000-LOG-ERROR
           END-IF.

       2400-READ-NEXT.
           READ ACCT-FILE
               AT END SET EOF-REACHED TO TRUE
               NOT AT END ADD 1 TO WS-READ-CNT
           END-READ.

       8000-LOG-ERROR.
           SET ERROR-FOUND TO TRUE
           ADD 1 TO WS-ERROR-CNT
           MOVE FUNCTION CURRENT-DATE TO ERR-TIMESTAMP
           WRITE ERR-RECORD FROM ERR-MSG
           DISPLAY 'ERROR: ' ERR-LOCATION ' - ' ERR-CODE.

       9000-TERM.
           CLOSE ACCT-FILE
           CLOSE RPT-FILE
           CLOSE ERR-FILE
           DISPLAY '=============================='
           DISPLAY '讀取筆數: ' WS-READ-CNT
           DISPLAY '寫入筆數: ' WS-WRITE-CNT
           DISPLAY '錯誤筆數: ' WS-ERROR-CNT
           DISPLAY '=============================='.
```

---

## RETURN CODE

程式結束時可以設定返回碼，讓呼叫方（如 JCL）知道執行狀態。

### 設定 RETURN CODE

```cobol
       MOVE 0 TO RETURN-CODE.        *> 成功
       MOVE 4 TO RETURN-CODE.        *> 警告
       MOVE 8 TO RETURN-CODE.        *> 錯誤
       MOVE 12 TO RETURN-CODE.       *> 嚴重錯誤
       MOVE 16 TO RETURN-CODE.       *> 系統錯誤
```

### 銀行慣例

| Return Code | 意義 | JCL 處理 |
|-------------|------|----------|
| 0 | 正常完成 | 繼續下一步 |
| 4 | 完成但有警告 | 通常繼續 |
| 8 | 錯誤，部分處理 | 可能中止 |
| 12 | 嚴重錯誤 | 中止 Job |
| 16 | 系統錯誤 | 立即中止 |

---

## BA 實務應用

### 如何判斷程式是否成功執行？

1. **查看 JCL 的返回碼**：RC=0 表示成功
2. **檢查錯誤日誌**：查看 ERR-FILE 或 SYSOUT
3. **確認處理筆數**：比對預期與實際數量

### 需求分析時的關鍵問題

| 情境 | 應該問的問題 |
|------|-------------|
| 檔案處理 | 「如果檔案不存在，程式應該怎麼處理？」 |
| 資料錯誤 | 「遇到錯誤記錄要跳過還是中止？」 |
| 部分失敗 | 「部分成功時要如何通知？」 |
| 重試機制 | 「是否需要自動重試？」 |

### 錯誤處理設計考量

```
需求：處理帳戶批次檔案

問題：
1. 檔案不存在怎麼辦？
2. 某些記錄格式錯誤怎麼辦？
3. 寫入報表失敗怎麼辦？
4. 磁碟空間不足怎麼辦？

決策：
- 檔案不存在 → 記錄錯誤，RC=12，中止
- 記錄格式錯誤 → 記錄錯誤，跳過該筆，繼續處理
- 報表寫入失敗 → 記錄錯誤，RC=8，繼續嘗試處理
- 磁碟空間不足 → 記錄錯誤，RC=12，中止
```

---

## 常見錯誤與解決

### 錯誤 1：忽略 FILE STATUS

```cobol
       *> 錯誤：沒有定義 FILE STATUS
       SELECT ACCT-FILE ASSIGN TO ACCTDATA.

       *> 正確：定義 FILE STATUS
       SELECT ACCT-FILE ASSIGN TO ACCTDATA
           FILE STATUS IS WS-ACCT-STATUS.
```

### 錯誤 2：沒有檢查狀態碼

```cobol
       *> 錯誤：沒有檢查狀態
       OPEN INPUT ACCT-FILE.

       *> 正確：檢查狀態
       OPEN INPUT ACCT-FILE
       IF WS-ACCT-STATUS NOT = '00'
           DISPLAY 'ERROR: ' WS-ACCT-STATUS
           STOP RUN
       END-IF.
```

### 錯誤 3：用 STOP RUN 代替錯誤處理

```cobol
       *> 不佳：直接停止，沒有清理資源
       IF WS-STATUS NOT = '00'
           STOP RUN
       END-IF.

       *> 較好：先清理再結束
       IF WS-STATUS NOT = '00'
           PERFORM 9000-CLEANUP
           MOVE 12 TO RETURN-CODE
           STOP RUN
       END-IF.
```

---

## 練習題

### 題目 1
以下 FILE STATUS 碼各代表什麼意義？
1. 00
2. 10
3. 35
4. 34

### 題目 2
設計一個錯誤處理程序，處理以下情況：
- 開檔失敗（狀態碼 35）
- 讀取到檔案結尾（狀態碼 10）
- 寫入失敗（狀態碼 34）

### 題目 3
為什麼在子程式中不應該直接使用 STOP RUN 處理錯誤？

---

## 重點回顧

| 概念 | 說明 |
|------|------|
| FILE STATUS | 2 碼狀態碼，表示 I/O 操作結果 |
| 00 | 操作成功 |
| 10 | 檔案結尾 |
| 35 | 檔案不存在 |
| DECLARATIVES | 自動錯誤處理區塊 |
| RETURN-CODE | 程式返回碼，告知 JCL 執行狀態 |

---

## 延伸閱讀

- [Lesson 3-1：Sequential File 與 VSAM File](lesson-3-1-file-types.md)
- [Lesson 3-3：JCL 基本結構](lesson-3-3-jcl-basic.md)
