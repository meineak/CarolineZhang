// ===================== 全局状态 =====================
let currentLang = 'zh';
let siteData = null;

// ===================== 加载数据 =====================
async function loadData() {
    try {
        const response = await fetch('data.json');
        siteData = await response.json();
        initSite();
    } catch (error) {
        console.error('数据加载失败:', error);
    }
}

// ===================== 初始化网站 =====================
function initSite() {
    renderSkills();
    renderCourses();
    renderTimeline();
    renderSkillsView();
    renderInterests();
    renderOrigamiGallery();
    updateLanguage('en');
    setupEventListeners();
    startQuoteAnimation();
    // 默认技能模式
    switchExperienceMode('skill');
}

// ===================== 台词动画 =====================
function startQuoteAnimation() {
    const container = document.getElementById('heroQuotesBg');
    if (!container || !siteData.hero.quotes) return;

    const quotes = siteData.hero.quotes;

    // 创建 4-5 个背景台词元素
    const numQuotes = 4 + Math.floor(Math.random() * 2); // 4-5个
    const quoteElements = [];
    for (let i = 0; i < numQuotes; i++) {
        const quoteEl = document.createElement('div');
        quoteEl.className = 'hero-quote-bg';
        container.appendChild(quoteEl);
        quoteElements.push(quoteEl);
    }

    // 随机显示台词，每 8 秒更换一次
    function showRandomQuote() {
        // 随机选择不重复的台词
        const shuffled = [...quotes].sort(() => Math.random() - 0.5);
        const selectedQuotes = shuffled.slice(0, quoteElements.length);

        // 存储已使用的位置，避免重叠
        const usedPositions = [];

        quoteElements.forEach((el, index) => {
            el.textContent = selectedQuotes[index];

            // 随机位置（在 Hero 区域，避开边缘和中心主体）
            let top, left;
            let attempts = 0;
            const minDistance = 18; // 最小距离（百分比）

            do {
                top = 20 + Math.random() * 55; // 20% - 75%（上下留边距）
                left = 15 + Math.random() * 65; // 15% - 80%（左右留边距）
                attempts++;
            } while (
                attempts < 50 && (
                    (top > 35 && top < 65 && left > 30 && left < 70) || // 避开中心主体区域
                    usedPositions.some(pos =>
                        Math.abs(pos.top - top) < minDistance && Math.abs(pos.left - left) < minDistance
                    ) // 避免重叠
                )
            );

            usedPositions.push({ top, left });

            el.style.top = `${top}%`;
            el.style.left = `${left}%`;

            // 随机延迟，让台词错开出现
            const randomDelay = Math.random() * 3; // 0-3秒随机延迟

            // 重置动画
            el.style.animation = 'none';
            el.offsetHeight; // 触发重排
            el.style.animation = `quoteFade 15s ease-in-out infinite`;
            el.style.animationDelay = `${randomDelay}s`;
        });
    }

    // 初始显示
    showRandomQuote();

    // 每 16 秒更换一次台词（让动画完整播放）
    setInterval(showRandomQuote, 16000);
}

// ===================== 语言切换 =====================
function updateLanguage(lang) {
    currentLang = lang;

    // 更新所有 data-i18n 属性的元素
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        const text = getNestedValue(siteData, key);
        if (text && text[lang]) {
            el.textContent = text[lang];
        }
    });

    // 更新语言切换按钮文字
    const langToggle = document.getElementById('langToggle');
    langToggle.textContent = lang === 'zh' ? 'EN' : '中';

    // 更新页面 lang 属性
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';

    // 更新联系信息（非 data-i18n 部分）
    updateContactInfo();

    // 更新技能和课程标签（非 data-i18n 部分）
    renderSkills();
    renderCourses();
    renderTimeline();
    renderSkillsView();
}

function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
        return current ? current[key] : undefined;
    }, obj);
}

// ===================== 渲染技能标签 =====================
function renderSkills() {
    const container = document.getElementById('skillTags');
    const skills = siteData.about.skills.items;
    container.innerHTML = skills.map(skill =>
        `<span class="skill-tag">${skill[currentLang]}</span>`
    ).join('');
}

// ===================== 渲染技能视图 =====================
function renderSkillsView() {
    const container = document.getElementById('skillsContainer');
    if (!container || !siteData.experience.skills) return;

    container.innerHTML = siteData.experience.skills.map(skill => `
        <div class="skill-card">
            <div class="skill-card-header">
                <span class="skill-card-icon">${skill.icon}</span>
                <div>
                    <div class="skill-card-title">${skill.title[currentLang]}</div>
                </div>
            </div>
            <ul class="skill-items">
                ${skill.items.map(item => {
        let dateText = item.date;
        if (typeof item.date === 'object' && item.date[currentLang]) {
            dateText = item.date[currentLang];
        }
        let starHtml = '';
        if (item.star && item.star[currentLang]) {
            starHtml = `<div class="skill-item-star">⭐ ${item.star[currentLang]}</div>`;
        }
        let linkHtml = '';
        if (item.link) {
            linkHtml = `<div class="skill-item-link"><a href="#" class="link-btn" data-url="${item.link}">🔗 ${currentLang === 'zh' ? '查看原文' : 'View Article'}</a></div>`;
        }
        return `
                        <li class="skill-item">
                            <div class="skill-item-date">${dateText}</div>
                            <div class="skill-item-title">${item.title[currentLang]}</div>
                            <div class="skill-item-detail">${item.detail[currentLang]}</div>
                            ${linkHtml}
                            ${starHtml}
                        </li>
                    `;
    }).join('')}
            </ul>
        </div>
    `).join('');

    // 绑定链接点击事件
    container.querySelectorAll('.link-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const url = btn.dataset.url;
            const confirmMsg = currentLang === 'zh'
                ? `即将跳转到外部链接：\n${url}\n\n是否继续？`
                : `You are about to visit an external link:\n${url}\n\nContinue?`;

            if (confirm(confirmMsg)) {
                window.open(url, '_blank');
            }
        });
    });
}

// ===================== 渲染时间线 =====================
function renderTimeline() {
    const items = siteData.experience.items;

    // 分类数据
    const onCampusWork = items.filter(item => item.category === 'on-campus' && item.type === 'work');
    const onCampusProject = items.filter(item => item.category === 'on-campus' && item.type === 'project');
    const offCampus = items.filter(item => item.category === 'off-campus');

    // 渲染校内工作经历
    renderTimelineItems('onCampusWorkTimeline', onCampusWork);
    // 渲染校内项目经历
    renderTimelineItems('onCampusProjectTimeline', onCampusProject);
    // 渲染校外经历
    renderTimelineItems('offCampusTimeline', offCampus);
}

function renderTimelineItems(containerId, items) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = items.map((item, index) => {
        // 处理 date 字段（可能是字符串或对象）
        let dateText = item.date;
        if (typeof item.date === 'object' && item.date[currentLang]) {
            dateText = item.date[currentLang];
        }

        return `
            <div class="timeline-item">
                <div class="timeline-date">${dateText}</div>
                <div class="timeline-title">${item.title[currentLang]}</div>
                <div class="timeline-desc">${item.description[currentLang]}</div>
            </div>
        `;
    }).join('');
}

// ===================== 渲染课程标签 =====================
function renderCourses() {
    const container = document.getElementById('courseTags');
    const courses = siteData.about.courses;
    container.innerHTML = courses.items.map(course => {
        const name = course[currentLang];
        const gpa = course.gpa ? ` ${course.gpa}` : '';
        return `<span class="course-tag">${name}${gpa}</span>`;
    }).join('');
}

// ===================== 渲染折纸照片画廊 =====================
function renderOrigamiGallery() {
    const container = document.getElementById('origamiGallery');
    if (!container) return;

    // 检查是否有折纸兴趣
    const origamiInterest = siteData.interests.items.find(item => item.hasGallery);
    if (!origamiInterest || !origamiInterest.gallery || origamiInterest.gallery.length === 0) {
        container.innerHTML = '';
        return;
    }

    const gallery = origamiInterest.gallery;
    container.innerHTML = `
        <div class="origami-gallery-container">
            ${gallery.map((img, index) => {
        const aspectRatio = img.aspectRatio || '1:1';
        const aspectRatioCss = aspectRatio.replace(':', '/');
        return `
                    <div class="origami-item" data-aspect="${aspectRatio}" style="aspect-ratio: ${aspectRatioCss}">
                        <img src="${img.src}" alt="Origami ${index + 1}">
                    </div>
                `;
    }).join('')}
        </div>
    `;
}

// ===================== 渲染兴趣卡片 =====================
function renderInterests() {
    const container = document.getElementById('interestsGrid');
    const items = siteData.interests.items;

    container.innerHTML = items.map((item, index) => {
        const extraClass = item.hasGallery ? ' interest-card-full' : '';
        return `
        <div class="interest-card${extraClass}">
            <span class="interest-icon">${item.icon}</span>
            <h3 class="interest-title" data-i18n="interests.items.${index}.title">${item.title[currentLang]}</h3>
            <p class="interest-desc" data-i18n="interests.items.${index}.description">${item.description[currentLang]}</p>
        </div>
    `}).join('');

    // 重新绑定 i18n 数据
    items.forEach((item, index) => {
        const titleEl = container.querySelectorAll('.interest-title')[index];
        const descEl = container.querySelectorAll('.interest-desc')[index];
        if (titleEl) {
            titleEl.dataset.i18n = `interests.items.${index}.title`;
        }
        if (descEl) {
            descEl.dataset.i18n = `interests.items.${index}.description`;
        }
    });
}

// ===================== 复制到剪贴板 =====================
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // 创建临时提示
        const toast = document.createElement('div');
        toast.textContent = '已复制：' + text;
        toast.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--primary);
            color: var(--white);
            padding: 16px 32px;
            border-radius: 8px;
            font-size: 1rem;
            z-index: 9999;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 2000);
    }).catch(err => {
        console.error('复制失败:', err);
    });
}

// ===================== 更新联系信息 =====================
function updateContactInfo() {
    // 联系信息已直接在 HTML 中硬编码，无需动态更新
}

// ===================== 经历模式切换 =====================
function switchExperienceMode(mode) {
    const timelineContainer = document.getElementById('timelineContainer');
    const skillsContainer = document.getElementById('skillsContainer');
    const modeBtns = document.querySelectorAll('.mode-btn');

    // 更新按钮状态
    modeBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // 显示/隐藏对应视图
    if (mode === 'timeline') {
        timelineContainer.style.display = 'grid';
        skillsContainer.classList.remove('active');
    } else {
        timelineContainer.style.display = 'none';
        skillsContainer.classList.add('active');
        // 切换语言时重新渲染技能视图
        renderSkillsView();
    }
}

// ===================== 事件监听 =====================
function setupEventListeners() {
    // 语言切换
    document.getElementById('langToggle').addEventListener('click', () => {
        const newLang = currentLang === 'zh' ? 'en' : 'zh';
        updateLanguage(newLang);
    });

    // 经历模式切换
    const modeBtns = document.querySelectorAll('.mode-btn');
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            switchExperienceMode(mode);
        });
    });

    // 移动端菜单切换
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = navMenu.querySelectorAll('a');

    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    // 点击导航链接
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            // 关闭移动端菜单
            navMenu.classList.remove('active');

            // 立即更新高亮
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // 使用 Intersection Observer 监听滚动
    const sections = document.querySelectorAll('section[id]');

    const observerOptions = {
        root: null,
        rootMargin: '-80px 0px -40% 0px',
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });

    // 备用方案：滚动时手动检测
    let scrollTicking = false;
    window.addEventListener('scroll', () => {
        if (!scrollTicking) {
            window.requestAnimationFrame(() => {
                const scrollPos = window.scrollY + window.innerHeight / 2;

                sections.forEach(section => {
                    const sectionTop = section.offsetTop;
                    const sectionBottom = sectionTop + section.offsetHeight;

                    if (scrollPos >= sectionTop && scrollPos < sectionBottom) {
                        const id = section.getAttribute('id');
                        navLinks.forEach(link => {
                            link.classList.remove('active');
                            if (link.getAttribute('href') === `#${id}`) {
                                link.classList.add('active');
                            }
                        });
                    }
                });

                scrollTicking = false;
            });
            scrollTicking = true;
        }
    });
}

// ===================== 启动 =====================
document.addEventListener('DOMContentLoaded', loadData);