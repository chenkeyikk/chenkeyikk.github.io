# CLAUDE.md

本文档为 Claude Code (claude.ai/code) 在本项目中工作时提供指导。

## 项目概述

个人作品集网站，展示 2024-2025 年在深圳斯芬克担任背景提升项目负责人期间开发的 14 个项目。纯静态 HTML/CSS/JS 网站，无需构建系统。

## 交互风格

始终用中文回复。

## 开发命令

```bash
# 本地预览
npx serve .                    # 推荐方式
python -m http.server 8000     # 或直接打开 index.html
```

## 架构

**数据流**：`projects.json` → `script.js` fetch 加载 → 动态渲染卡片到 `#projects-container`

**分类渲染**：
- `公益项目` → 粉色主题 (`data-category="welfare"`)
- `实践项目` → 橙色主题 (`data-category="art"`)

**图片命名**：`images/project-{id}.svg`，id 对应 projects.json 中的 id 字段

## 数据结构

`projects.json` 包含两个分类对象，每个对象有 `category` 和 `projects` 数组。字段包括：id, name, time, partner, description, tech_stack, status。

开发时以 `projects.json` 为权威数据源。

## 设计系统

**颜色方案**：
- 公益项目：粉色 `#FF69B4`，浅色 `#FFB6C1`，背景 `#FFF0F5`
- 实践项目：橙色 `#FF8C00`，背景 `#FFF4E0`

**关键 CSS 变量**：`--color-pink` / `--color-orange`（主题色）、`--border-radius: 12px`（卡片圆角）

**响应式断点**：768px（双栏变单栏）、480px（手机）

## 交互模式

- **滚动动画**：IntersectionObserver 监听 `.fade-in`，进入视口时添加 `.visible`
- **图片降级**：`onerror` 触发时显示 `.no-image` 占位符
- **卡片悬停**：`translateY(-4px)` 上浮 + 阴影增强
