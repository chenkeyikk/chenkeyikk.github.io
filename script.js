/**
 * 背景提升项目展示网站
 * 动态加载 projects.json 数据
 */

document.addEventListener('DOMContentLoaded', function() {
    // 加载项目数据
    loadProjects();

    // 初始化导航栏
    initNavbar();

    // 初始化调整面板
    initAdjustPanel();
});

/**
 * 从 projects.json 加载项目数据并渲染
 */
async function loadProjects() {
    const container = document.getElementById('projects-container');

    try {
        const response = await fetch('projects.json');
        if (!response.ok) {
            throw new Error('无法加载项目数据');
        }

        const categories = await response.json();

        // 计算并更新统计数据
        const stats = calculateStats(categories);
        updateStatsDisplay(stats);

        // 渲染项目
        renderProjects(categories, container);

        // 渲染完成后初始化动画和图片处理
        initScrollAnimation();
        initImageErrorHandling();

        // 初始化统计数字滚动动画
        initStatsAnimation();

        // 初始化导航高亮
        initNavHighlight();
    } catch (error) {
        console.error('加载项目数据失败:', error);
        container.innerHTML = '<p class="loading">加载项目数据失败，请刷新页面重试。</p>';
    }
}

/**
 * 计算统计数据
 */
function calculateStats(categories) {
    let totalProjects = 0;
    let welfareProjects = 0;
    let practiceProjects = 0;
    const partners = new Set();

    categories.forEach(category => {
        const projectCount = category.projects.length;
        totalProjects += projectCount;

        if (category.category === '公益项目') {
            welfareProjects = projectCount;
        } else {
            practiceProjects = projectCount;
        }

        // 收集所有合作机构
        category.projects.forEach(project => {
            if (project.partner) {
                // 支持多个合作方（逗号或顿号分隔）
                const partnerList = project.partner.split(/[,，、]/).map(p => p.trim()).filter(p => p);
                partnerList.forEach(p => partners.add(p));
            }
        });
    });

    return {
        total: totalProjects,
        welfare: welfareProjects,
        practice: practiceProjects,
        partners: partners.size
    };
}

/**
 * 更新统计数字显示
 */
function updateStatsDisplay(stats) {
    const totalEl = document.getElementById('stat-total');
    const welfareEl = document.getElementById('stat-welfare');
    const practiceEl = document.getElementById('stat-practice');
    const partnersEl = document.getElementById('stat-partners');

    // 存储目标值，用于动画
    totalEl.dataset.target = stats.total;
    welfareEl.dataset.target = stats.welfare;
    practiceEl.dataset.target = stats.practice;
    partnersEl.dataset.target = stats.partners;

    // 初始显示0
    totalEl.textContent = '0';
    welfareEl.textContent = '0';
    practiceEl.textContent = '0';
    partnersEl.textContent = '0';
}

/**
 * 初始化统计数字滚动动画
 */
function initStatsAnimation() {
    const statsSection = document.querySelector('.stats-section');
    const statNumbers = document.querySelectorAll('.stat-number');

    const observerOptions = {
        threshold: 0.3,
        rootMargin: '0px 0px -100px 0px'
    };

    let hasAnimated = false;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !hasAnimated) {
                hasAnimated = true;
                // 触发动画
                statNumbers.forEach((el, index) => {
                    const target = parseInt(el.dataset.target) || 0;
                    // 延迟启动，让用户能看到动画
                    setTimeout(() => {
                        animateNumber(el, 0, target, 1500);
                    }, index * 150);
                });
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    observer.observe(statsSection);
}

/**
 * 数字滚动动画
 */
function animateNumber(element, start, end, duration) {
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // 使用 easeOutCubic 缓动函数（比之前的更平滑）
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        const current = Math.floor(start + (end - start) * easeProgress);
        element.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = end;
        }
    }

    requestAnimationFrame(update);
}

/**
 * 渲染项目卡片
 */
function renderProjects(categories, container) {
    let html = '';

    categories.forEach(category => {
        const categoryType = category.category === '公益项目' ? 'welfare' : 'art';
        const categoryName = category.category === '公益项目' ? '社会公益' : '艺术实践';
        const categoryId = category.category === '公益项目' ? 'welfare' : 'practice';

        // 分类标题（带锚点）
        html += `
            <div class="category-header" id="${categoryId}">
                <span class="category-dot ${categoryType}"></span>
                <h3>${categoryName}</h3>
            </div>
        `;

        // 项目卡片网格
        html += '<div class="timeline">';

        category.projects.forEach((project, index) => {
            html += renderProjectCard(project, categoryType, index);
        });

        html += '</div>';
    });

    container.innerHTML = html;
}

/**
 * 渲染单个项目卡片
 */
function renderProjectCard(project, categoryType, index) {
    // 检测该项目的所有图片
    const images = [];
    for (let i = 1; i <= 10; i++) {
        images.push(`images/project-${project.id}-${i}.jpg`);
    }

    return `
        <div class="project-card fade-in" data-category="${categoryType}" data-project-id="${project.id}">
            <div class="project-images-grid" data-project-id="${project.id}">
                ${renderImageGrid(project.id, project.name)}
            </div>
            <div class="project-info">
                <span class="project-date">${project.time}</span>
                <h4 class="project-title">${project.name}</h4>
                <p class="project-desc">${project.description}</p>
                ${project.partner ? `<p class="project-partner">${project.partner}</p>` : ''}
                ${renderTechStack(project.tech_stack)}
            </div>
        </div>
    `;
}

/**
 * 渲染图片网格
 */
function renderImageGrid(projectId, projectName) {
    // 预设每个项目的图片数量（基于之前提取的结果）
    const imageCounts = {
        1: 6, 2: 10, 3: 8, 4: 6, 5: 3, 6: 7, 7: 6,
        8: 5, 9: 7, 10: 6, 11: 9, 12: 7, 13: 7, 14: 6
    };

    // 自定义图片顺序：[主图索引, 副图1索引, 副图2索引]
    const customImageOrder = {
        2: [1, 3, 10],     // 项目2：主图1，副图优先3和10
        3: [7, 1, 6],      // 项目3：主图7，副图优先1和6
        9: [5, 1, 2],      // 项目9：主图5
        12: [7, 1, 4],     // 项目12：主图7，副图优先1和4
        13: [7, 1, 2],     // 项目13：主图7
    };

    const count = imageCounts[projectId] || 1;
    let displayOrder;

    if (customImageOrder[projectId]) {
        // 使用自定义顺序
        displayOrder = customImageOrder[projectId].slice(0, 3);
    } else {
        // 默认顺序：主图为1，其他按顺序
        displayOrder = [1, 2, 3];
    }

    let html = '';
    displayOrder.forEach((imgIdx, displayIdx) => {
        // 如果是第3张且总数超过3张，添加+N遮罩
        const isLast = displayIdx === 2;
        const hasMore = count > 3;
        const moreOverlay = (isLast && hasMore) ? `<div class="image-more-overlay"><span>+${count - 3}</span></div>` : '';

        // 获取图片位置偏移
        const pos = getImagePosition(projectId, imgIdx);
        const objectPosition = `object-position: ${pos.x}% ${pos.y}%;`;

        html += `
            <div class="project-image-item" onclick="openLightbox(${projectId}, ${count})">
                <img src="images/project-${projectId}-${imgIdx}.jpg"
                     alt="${projectName}"
                     style="${objectPosition}"
                     onerror="this.parentElement.style.display='none'">
                ${moreOverlay}
            </div>
        `;
    });

    return html;
}

/**
 * 获取图片位置（带默认值）
 */
function getImagePosition(projectId, imageId) {
    if (imagePositions[projectId] && imagePositions[projectId][imageId]) {
        return imagePositions[projectId][imageId];
    }
    return { x: 50, y: 50 };
}

/**
 * 打开灯箱
 */
function openLightbox(projectId, totalCount) {
    // 创建灯箱
    let lightbox = document.getElementById('lightbox');
    if (!lightbox) {
        lightbox = document.createElement('div');
        lightbox.id = 'lightbox';
        lightbox.className = 'lightbox';
        document.body.appendChild(lightbox);
    }

    // 生成图片列表
    let imagesHtml = '';
    for (let i = 1; i <= totalCount; i++) {
        imagesHtml += `
            <img src="images/project-${projectId}-${i}.jpg"
                 alt="项目图片 ${i}"
                 onerror="this.style.display='none'">
        `;
    }

    lightbox.innerHTML = `
        <div class="lightbox-content">
            <button class="lightbox-close" onclick="closeLightbox()">×</button>
            <div class="lightbox-images">
                ${imagesHtml}
            </div>
        </div>
    `;

    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

/**
 * 关闭灯箱
 */
function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.style.display = 'none';
        document.body.style.overflow = '';
    }
}

/**
 * 渲染技术标签
 */
function renderTechStack(techStack) {
    if (!techStack || techStack.length === 0) {
        return '';
    }

    const tags = techStack.map(tag => `<span class="tech-tag">${tag}</span>`).join('');
    return `<div class="tech-stack">${tags}</div>`;
}

/**
 * 初始化导航栏
 */
function initNavbar() {
    const toggle = document.querySelector('.navbar-toggle');
    const menu = document.querySelector('.navbar-menu');
    const menuLinks = document.querySelectorAll('.navbar-menu a');
    const navbar = document.querySelector('.navbar');

    // 滚动时改变导航栏样式
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            menu.classList.toggle('active');
            // 切换图标
            const isOpen = menu.classList.contains('active');
            toggle.innerHTML = isOpen
                ? '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>'
                : '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>';
        });

        // 点击链接后关闭菜单
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                menu.classList.remove('active');
                toggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>';
            });
        });
    }
}

/**
 * 初始化导航高亮
 */
function initNavHighlight() {
    const sections = document.querySelectorAll('#about, #welfare, #practice, #contact');
    const navLinks = document.querySelectorAll('.navbar-menu a');

    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;

                // 移除所有 active
                navLinks.forEach(link => link.classList.remove('active'));

                // 添加当前 active
                const activeLink = document.querySelector(`.navbar-menu a[href="#${id}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });
}

/**
 * 初始化滚动动画
 */
function initScrollAnimation() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // 添加延迟，实现交错动画效果
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 50);
            }
        });
    }, observerOptions);

    // 观察所有带有 fade-in 类的元素
    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach(el => {
        observer.observe(el);
    });
}

/**
 * 初始化图片错误处理
 */
function initImageErrorHandling() {
    const images = document.querySelectorAll('.project-image img');

    images.forEach(img => {
        // 如果图片已经加载失败（从缓存）
        if (img.complete && img.naturalHeight === 0) {
            img.parentElement.classList.add('no-image');
        }
    });
}

/**
 * 初始化平滑滚动
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/* ====================
   图片调整面板功能
   ==================== */

// 存储图片位置配置
const imagePositions = {};

// 图片数量配置
const imageCounts = {
    1: 6, 2: 10, 3: 8, 4: 6, 5: 3, 6: 7, 7: 6,
    8: 5, 9: 7, 10: 6, 11: 9, 12: 7, 13: 7, 14: 6
};

/**
 * 初始化图片调整面板
 */
function initAdjustPanel() {
    const projectSelect = document.getElementById('adjust-project');
    const imageSelect = document.getElementById('adjust-image');

    // 填充项目选择
    for (let i = 1; i <= 14; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `项目 ${i}`;
        projectSelect.appendChild(option);
    }

    // 项目切换时更新图片选择
    projectSelect.addEventListener('change', updateImageSelect);
    imageSelect.addEventListener('change', updateAdjustPreview);

    // 初始化图片选择
    updateImageSelect();
}

function updateImageSelect() {
    const projectId = document.getElementById('adjust-project').value;
    const imageSelect = document.getElementById('adjust-image');

    imageSelect.innerHTML = '';
    const count = imageCounts[projectId] || 1;

    for (let i = 1; i <= count; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `图片 ${i}`;
        imageSelect.appendChild(option);
    }

    updateAdjustPreview();
}

function updateAdjustPreview() {
    const projectId = document.getElementById('adjust-project').value;
    const imageId = document.getElementById('adjust-image').value;
    const preview = document.getElementById('adjust-preview');

    // 获取该项目的图片顺序
    const customImageOrder = {
        2: [1, 3, 10],
        3: [7, 1, 6],
        9: [5, 1, 2],
        12: [7, 1, 4],
        13: [7, 1, 2],
    };

    let displayOrder = customImageOrder[projectId] || [1, 2, 3];
    displayOrder = displayOrder.slice(0, 3);

    // 获取当前选中图片的位置配置
    const saved = imagePositions[projectId] && imagePositions[projectId][imageId];

    if (saved) {
        document.getElementById('adjust-x').value = saved.x;
        document.getElementById('adjust-y').value = saved.y;
        document.getElementById('adjust-x-val').textContent = saved.x + '%';
        document.getElementById('adjust-y-val').textContent = saved.y + '%';
    } else {
        document.getElementById('adjust-x').value = 50;
        document.getElementById('adjust-y').value = 50;
        document.getElementById('adjust-x-val').textContent = '50%';
        document.getElementById('adjust-y-val').textContent = '50%';
    }

    // 生成三张图片的预览
    let html = '';
    displayOrder.forEach((imgIdx, displayIdx) => {
        const pos = imagePositions[projectId] && imagePositions[projectId][imgIdx];
        const objectPosition = pos ? `${pos.x}% ${pos.y}%` : '50% 50%';
        const isSelected = imgIdx == imageId ? 'border: 2px solid var(--color-pink);' : '';

        html += `<img src="images/project-${projectId}-${imgIdx}.jpg"
                     style="object-position: ${objectPosition}; ${isSelected}"
                     onerror="this.style.display='none'">`;
    });

    preview.innerHTML = html;
    updateAdjustCode();
}

function applyAdjustment() {
    const x = document.getElementById('adjust-x').value;
    const y = document.getElementById('adjust-y').value;

    document.getElementById('adjust-x-val').textContent = x + '%';
    document.getElementById('adjust-y-val').textContent = y + '%';

    const previewImg = document.getElementById('preview-img');
    if (previewImg) {
        previewImg.style.objectPosition = `${x}% ${y}%`;
    }

    saveAdjustment();
}

function saveAdjustment() {
    const projectId = document.getElementById('adjust-project').value;
    const imageId = document.getElementById('adjust-image').value;
    const x = parseInt(document.getElementById('adjust-x').value);
    const y = parseInt(document.getElementById('adjust-y').value);

    if (!imagePositions[projectId]) {
        imagePositions[projectId] = {};
    }
    imagePositions[projectId][imageId] = { x, y };

    updateAdjustCode();
}

function updateAdjustCode() {
    // 生成代码
    let code = '// 图片位置配置\nconst imagePositions = {\n';
    for (const [pid, imgs] of Object.entries(imagePositions)) {
        code += `    ${pid}: {\n`;
        for (const [iid, pos] of Object.entries(imgs)) {
            code += `        ${iid}: { x: ${pos.x}, y: ${pos.y} },\n`;
        }
        code += `    },\n`;
    }
    code += '};';

    document.getElementById('adjust-code').value = code;
}

function copyAdjustCode() {
    const textarea = document.getElementById('adjust-code');
    textarea.select();
    document.execCommand('copy');
    alert('代码已复制到剪贴板！');
}

function toggleAdjustPanel() {
    const panel = document.getElementById('image-adjust-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    if (panel.style.display === 'block') {
        updateAdjustPreview();
    }
}