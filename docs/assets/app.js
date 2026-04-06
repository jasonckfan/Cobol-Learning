/**
 * COBOL 學習指南 - 網站應用程序
 */

// ========================================
// 課程資料結構
// ========================================
const courseData = {
    sections: [
        {
            title: '📘 基礎概念',
            lessons: [
                { id: 'lesson-1-1-mainframe-intro', title: '1-1: Mainframe 在銀行的角色', file: 'lessons/lesson-1-1-mainframe-intro.md' },
                { id: 'lesson-1-2-batch-online', title: '1-2: Batch vs Online 處理模式', file: 'lessons/lesson-1-2-batch-online.md' },
                { id: 'lesson-1-3-dataset-concept', title: '1-3: z/OS、Dataset、PDS、Member 概念', file: 'lessons/lesson-1-3-dataset-concept.md' },
                { id: 'lesson-1-4-job-step-program', title: '1-4: Job、Step、Program、Procedure 關係', file: 'lessons/lesson-1-4-job-step-program.md' }
            ]
        },
        {
            title: '💻 COBOL 程式結構',
            lessons: [
                { id: 'lesson-2-1-cobol-divisions', title: '2-1: COBOL 四大 DIVISION', file: 'lessons/lesson-2-1-cobol-divisions.md' },
                { id: 'lesson-2-2-pic-clause', title: '2-2: 變數宣告與 PIC 子句', file: 'lessons/lesson-2-2-pic-clause.md' },
                { id: 'lesson-2-3-level-number', title: '2-3: Level Number 與資料結構', file: 'lessons/lesson-2-3-level-number.md' },
                { id: 'lesson-2-4-comp-usage', title: '2-4: COMP、COMP-3、Packed Decimal', file: 'lessons/lesson-2-4-comp-usage.md' },
                { id: 'lesson-2-5-flow-control', title: '2-5: 流程控制：IF、EVALUATE、PERFORM', file: 'lessons/lesson-2-5-flow-control.md' },
                { id: 'lesson-2-6-copybook', title: '2-6: COPYBOOK 與程式碼複用', file: 'lessons/lesson-2-6-copybook.md' },
                { id: 'lesson-2-7-call-statement', title: '2-7: 呼叫外部程式 (CALL)', file: 'lessons/lesson-2-7-call-statement.md' },
                { id: 'lesson-2-8-error-handling', title: '2-8: 錯誤處理與檔案狀態碼', file: 'lessons/lesson-2-8-error-handling.md' }
            ]
        },
        {
            title: '📁 檔案與批次',
            lessons: [
                { id: 'lesson-3-1-file-types', title: '3-1: Sequential File 與 VSAM File', file: 'lessons/lesson-3-1-file-types.md' },
                { id: 'lesson-3-2-file-operations', title: '3-2: 檔案操作：READ、WRITE、REWRITE', file: 'lessons/lesson-3-2-file-operations.md' },
                { id: 'lesson-3-3-jcl-basic', title: '3-3: JCL 基本結構', file: 'lessons/lesson-3-3-jcl-basic.md' },
                { id: 'lesson-3-4-sort-utility', title: '3-4: Sort 與 Utility', file: 'lessons/lesson-3-4-sort-utility.md' },
                { id: 'lesson-3-5-report-output', title: '3-5: 報表輸出流程', file: 'lessons/lesson-3-5-report-output.md' },
                { id: 'lesson-3-6-mq-socket', title: '3-6: MQ/Socket 通訊概念', file: 'lessons/lesson-3-6-mq-socket.md' },
                { id: 'lesson-3-7-db2-basic', title: '3-7: DB2 基本概念', file: 'lessons/lesson-3-7-db2-basic.md' },
                { id: 'lesson-3-8-cics-intro', title: '3-8: CICS 線上交易入門', file: 'lessons/lesson-3-8-cics-intro.md' }
            ]
        },
        {
            title: '🏦 銀行實務案例',
            lessons: [
                { id: 'lesson-4-1-clm-system', title: '4-1: CLM 資金池管理系統架構', file: 'lessons/lesson-4-1-clm-system.md' },
                { id: 'lesson-4-2-interest-calc', title: '4-2: 計息邏輯實現', file: 'lessons/lesson-4-2-interest-calc.md' },
                { id: 'lesson-4-3-daily-batch', title: '4-3: 日終批次處理流程', file: 'lessons/lesson-4-3-daily-batch.md' },
                { id: 'lesson-4-4-reconciliation', title: '4-4: 對帳與報表生成', file: 'lessons/lesson-4-4-reconciliation.md' },
                { id: 'lesson-4-5-deposit-loan', title: '4-5: 存款/放款系統實例', file: 'lessons/lesson-4-5-deposit-loan.md' },
                { id: 'lesson-4-6-data-exchange', title: '4-6: 跨系統資料交換', file: 'lessons/lesson-4-6-data-exchange.md' }
            ]
        },
        {
            title: '🤝 BA 溝通與分析',
            lessons: [
                { id: 'lesson-5-1-requirement-analysis', title: '5-1: 需求拆解技巧', file: 'lessons/lesson-5-1-requirement-analysis.md' },
                { id: 'lesson-5-2-impact-analysis', title: '5-2: 影響分析方法', file: 'lessons/lesson-5-2-impact-analysis.md' },
                { id: 'lesson-5-3-test-design', title: '5-3: 測試案例設計', file: 'lessons/lesson-5-3-test-design.md' },
                { id: 'lesson-5-4-communication', title: '5-4: 與開發人員溝通技巧', file: 'lessons/lesson-5-4-communication.md' },
                { id: 'lesson-5-5-spec-reading', title: '5-5: 技術規格書閱讀', file: 'lessons/lesson-5-5-spec-reading.md' },
                { id: 'lesson-5-6-uat-planning', title: '5-6: UAT 測試規劃', file: 'lessons/lesson-5-6-uat-planning.md' },
                { id: 'lesson-5-7-go-live-checklist', title: '5-7: 上線檢查清單', file: 'lessons/lesson-5-7-go-live-checklist.md' }
            ]
        },
        {
            title: '📚 進階指南',
            lessons: [
                { id: 'banking-practices-enhanced', title: '🏦 銀行實務應用詳解', file: 'banking-practices-enhanced.md' },
                { id: 'cobol-vsam-db2-guide', title: '🗄️ VSAM 與 DB2 操作詳解', file: 'cobol-vsam-db2-guide.md' },
                { id: 'cics-online-transaction-guide', title: '💻 CICS 線上交易詳解', file: 'cics-online-transaction-guide.md' },
                { id: 'cobol-debugging-techniques', title: '🐛 COBOL 除錯技巧', file: 'cobol-debugging-techniques.md' },
                { id: 'jcl-advanced-guide', title: '⚙️ JCL 進階應用', file: 'jcl-advanced-guide.md' },
                { id: 'performance-tuning-guide', title: '🚀 效能調校指南', file: 'performance-tuning-guide.md' }
            ]
        }
    ]
};

// 扁平化課程列表
let allLessons = [];
let currentLessonIndex = -1;

// ========================================
// 初始化
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    initLessonsList();
    renderSidebar();
    renderLearningPath();
    setupEventListeners();
    loadProgress();
    
    // 檢查 URL 參數
    const urlParams = new URLSearchParams(window.location.search);
    const lessonId = urlParams.get('lesson');
    if (lessonId) {
        loadLesson(lessonId);
    }
});

// 初始化課程列表
function initLessonsList() {
    allLessons = [];
    courseData.sections.forEach((section, sectionIndex) => {
        section.lessons.forEach((lesson, lessonIndex) => {
            allLessons.push({
                ...lesson,
                sectionIndex,
                lessonIndex,
                globalIndex: allLessons.length
            });
        });
    });
}

// ========================================
// 渲染側邊欄
// ========================================
function renderSidebar() {
    const sidebarNav = document.getElementById('sidebarNav');
    let html = '';
    
    courseData.sections.forEach((section, sectionIndex) => {
        html += `
            <div class="nav-section">
                <div class="nav-section-title">${section.title}</div>
        `;
        
        section.lessons.forEach((lesson, lessonIndex) => {
            const globalIndex = allLessons.findIndex(l => l.id === lesson.id);
            html += `
                <a href="#" class="nav-item" 
                   data-id="${lesson.id}"
                   data-index="${globalIndex}"
                   onclick="loadLesson('${lesson.id}'); return false;">
                    ${lesson.title}
                </a>
            `;
        });
        
        html += '</div>';
    });
    
    sidebarNav.innerHTML = html;
}

// ========================================
// 渲染學習路徑
// ========================================
function renderLearningPath() {
    const pathGrid = document.getElementById('pathGrid');
    if (!pathGrid) return;
    
    let html = '';
    courseData.sections.forEach((section, index) => {
        const progress = calculateSectionProgress(section);
        html += `
            <div class="path-card" onclick="scrollToSection(${index})">
                <div class="path-header">
                    <span class="path-icon">${section.title.split(' ')[0]}</span>
                    <h3 class="path-title">${section.title.split(' ').slice(1).join(' ')}</h3>
                </div>
                <p class="path-description">${section.lessons.length} 個課程單元</p>
                <div class="path-meta">
                    <span>📖 ${section.lessons.length} 課程</span>
                </div>
                <div class="path-progress">
                    <div class="path-progress-bar" style="width: ${progress}%"></div>
                </div>
            </div>
        `;
    });
    
    pathGrid.innerHTML = html;
}

// 計算章節進度
function calculateSectionProgress(section) {
    const completed = section.lessons.filter(lesson => 
        localStorage.getItem(`lesson_${lesson.id}_completed`) === 'true'
    ).length;
    return (completed / section.lessons.length) * 100;
}

// ========================================
// 載入課程
// ========================================
async function loadLesson(lessonId) {
    const lesson = allLessons.find(l => l.id === lessonId);
    if (!lesson) return;
    
    currentLessonIndex = lesson.globalIndex;
    
    // 更新 UI
    showLessonPage();
    updateActiveNavItem(lessonId);
    updateLessonIndicator();
    updateNavigationButtons();
    
    // 載入內容
    const contentDiv = document.getElementById('lessonContent');
    contentDiv.innerHTML = '<div class="loading"></div>';
    
    try {
        // 直接從相對路徑載入（支援 GitHub Pages）
        const response = await fetch(lesson.file);
        
        if (!response.ok) {
            throw new Error('Failed to load lesson');
        }
        
        const markdown = await response.text();
        const html = marked.parse(markdown);
        contentDiv.innerHTML = html;
        
        // 高亮代碼
        hljs.highlightAll();
        
        // 更新進度
        updateProgress();
        
        // 更新 URL
        window.history.pushState({ lessonId }, '', `?lesson=${lessonId}`);
        
        // 滾動到頂部
        window.scrollTo(0, 0);
        
    } catch (error) {
        contentDiv.innerHTML = `
            <div class="tip-box danger">
                <h3>⚠️ 載入失敗</h3>
                <p>無法載入課程內容，請稍後再試。</p>
                <p>錯誤訊息：${error.message}</p>
            </div>
        `;
    }
}

// 顯示課程頁面
function showLessonPage() {
    document.getElementById('homePage').style.display = 'none';
    document.getElementById('lessonPage').style.display = 'block';
    document.getElementById('progressText').textContent = '學習中';
}

// 顯示首頁
function showHome() {
    document.getElementById('homePage').style.display = 'block';
    document.getElementById('lessonPage').style.display = 'none';
    document.getElementById('progressText').textContent = '準備開始';
    window.history.pushState({}, '', window.location.pathname);
    window.scrollTo(0, 0);
}

// 更新導航項目狀態
function updateActiveNavItem(lessonId) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.id === lessonId) {
            item.classList.add('active');
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });
}

// 更新課程指示器
function updateLessonIndicator() {
    const indicator = document.getElementById('lessonIndicator');
    if (indicator) {
        indicator.textContent = `${currentLessonIndex + 1} / ${allLessons.length}`;
    }
}

// 更新導航按鈕
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtnBottom = document.getElementById('prevBtnBottom');
    const nextBtnBottom = document.getElementById('nextBtnBottom');
    const prevTitle = document.getElementById('prevTitle');
    const nextTitle = document.getElementById('nextTitle');
    
    // 上一課
    if (currentLessonIndex > 0) {
        const prevLesson = allLessons[currentLessonIndex - 1];
        prevBtn?.removeAttribute('disabled');
        prevBtnBottom?.removeAttribute('disabled');
        if (prevTitle) prevTitle.textContent = prevLesson.title;
    } else {
        prevBtn?.setAttribute('disabled', 'true');
        prevBtnBottom?.setAttribute('disabled', 'true');
        if (prevTitle) prevTitle.textContent = '--';
    }
    
    // 下一課
    if (currentLessonIndex < allLessons.length - 1) {
        const nextLesson = allLessons[currentLessonIndex + 1];
        nextBtn?.removeAttribute('disabled');
        nextBtnBottom?.removeAttribute('disabled');
        if (nextTitle) nextTitle.textContent = nextLesson.title;
    } else {
        nextBtn?.setAttribute('disabled', 'true');
        nextBtnBottom?.setAttribute('disabled', 'true');
        if (nextTitle) nextTitle.textContent = '--';
    }
}

// 上一課
function prevLesson() {
    if (currentLessonIndex > 0) {
        loadLesson(allLessons[currentLessonIndex - 1].id);
    }
}

// 下一課
function nextLesson() {
    if (currentLessonIndex < allLessons.length - 1) {
        loadLesson(allLessons[currentLessonIndex + 1].id);
    }
}

// ========================================
// 進度管理
// ========================================
function updateProgress() {
    if (currentLessonIndex >= 0) {
        const lessonId = allLessons[currentLessonIndex].id;
        localStorage.setItem(`lesson_${lessonId}_completed`, 'true');
        localStorage.setItem('lastLesson', lessonId);
    }
}

function loadProgress() {
    // 標記已完成的課程
    allLessons.forEach(lesson => {
        if (localStorage.getItem(`lesson_${lesson.id}_completed`) === 'true') {
            const navItem = document.querySelector(`[data-id="${lesson.id}"]`);
            if (navItem) {
                navItem.classList.add('completed');
            }
        }
    });
}

// ========================================
// 事件監聽
// ========================================
function setupEventListeners() {
    // 選單切換
    const menuToggle = document.getElementById('menuToggle');
    const closeSidebar = document.getElementById('closeSidebar');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    function openSidebar() {
        sidebar.classList.add('open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeSidebarFn() {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    menuToggle?.addEventListener('click', openSidebar);
    closeSidebar?.addEventListener('click', closeSidebarFn);
    overlay?.addEventListener('click', closeSidebarFn);
    
    // 搜尋功能
    const searchInput = document.getElementById('searchInput');
    searchInput?.addEventListener('input', function(e) {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll('.nav-item').forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(query) ? 'block' : 'none';
        });
    });
    
    // 回到頂部按鈕
    const backToTop = document.getElementById('backToTop');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTop?.classList.add('visible');
        } else {
            backToTop?.classList.remove('visible');
        }
    });
    
    // 鍵盤導航
    document.addEventListener('keydown', function(e) {
        if (document.getElementById('lessonPage').style.display === 'none') return;
        
        if (e.key === 'ArrowLeft' && currentLessonIndex > 0) {
            prevLesson();
        } else if (e.key === 'ArrowRight' && currentLessonIndex < allLessons.length - 1) {
            nextLesson();
        }
    });
    
    // 瀏覽器返回/前進
    window.addEventListener('popstate', function(e) {
        if (e.state && e.state.lessonId) {
            loadLesson(e.state.lessonId);
        } else {
            showHome();
        }
    });
}

// ========================================
// 工具函數
// ========================================
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function startLearning() {
    const lastLesson = localStorage.getItem('lastLesson');
    if (lastLesson && allLessons.find(l => l.id === lastLesson)) {
        loadLesson(lastLesson);
    } else {
        loadLesson(allLessons[0].id);
    }
}

function showRandomLesson() {
    const randomIndex = Math.floor(Math.random() * allLessons.length);
    loadLesson(allLessons[randomIndex].id);
}

function scrollToSection(sectionIndex) {
    const section = courseData.sections[sectionIndex];
    if (section && section.lessons.length > 0) {
        loadLesson(section.lessons[0].id);
    }
}

// 匯出函數供 HTML 使用
window.loadLesson = loadLesson;
window.showHome = showHome;
window.prevLesson = prevLesson;
window.nextLesson = nextLesson;
window.scrollToTop = scrollToTop;
window.startLearning = startLearning;
window.showRandomLesson = showRandomLesson;
window.scrollToSection = scrollToSection;