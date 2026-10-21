# himon1.github.io

郝木（Hao Mu）的个人学术主页。纯静态、零依赖、零构建：HTML + CSS + 原生 JavaScript，直接由 GitHub Pages 托管。

线上地址：<https://himon1.github.io>

## 设计说明

整体采用「学术索引卡 × 编辑排版」的方向：暖纸底色、衬线大标题、细线网格、印章红与暗金点缀。信息结构遵循主流学术主页的惯例（About / News / Research / Projects / CV / Contact），但视觉与交互做了更精致的处理：

- 中英双语切换（`EN / 中`），偏好保存在 localStorage
- 明暗主题切换，跟随系统偏好，可手动覆盖
- 自托管字体（Newsreader / Inter / JetBrains Mono），不依赖 Google Fonts，国内访问稳定
- 墨色光晕、纸面颗粒、金色描边水印、衬线跑马灯
- 滚动进度、章节导轨、滚动显现、视差、卡片微倾斜与指针光晕
- 响应式布局，支持 `prefers-reduced-motion`，无 JS 时内容仍完整可读
- 姓名只在首屏主标题与页脚版权中出现一次，页头只保留符号标识，避免自我强调

## 本地预览

在项目根目录运行任意静态服务器：

```bash
python -m http.server 8000
```

然后打开 <http://localhost:8000>。不要直接双击 `index.html`，`file://` 协议下部分浏览器行为与线上不同。

## 目录结构

```text
.
├── index.html              # 页面内容（中英双语都在这里）
├── 404.html                # GitHub Pages 自定义 404
├── assets/
│   ├── css/style.css       # 全部样式；设计变量集中在 :root
│   ├── js/main.js          # 主题、语言、滚动、复制等交互
│   ├── fonts/              # 自托管 woff2 字体
│   └── img/favicon.svg     # 印章 favicon；og.png 为分享图
├── robots.txt
├── sitemap.xml
└── .nojekyll               # 告诉 GitHub Pages 不要跑 Jekyll
```

## 修改指南

### 1. 文字内容

所有内容都在 `index.html`。双语段落成对出现：

```html
<p>
  <span data-lang="en">English text</span>
  <span data-lang="zh">中文文本</span>
</p>
```

只改其中一种语言也可以；CSS 会自动隐藏当前未选中的语言。若新增段落，记得两段都写，或至少保留英文。

### 2. 新增一条研究经历

复制任意一个 `<article class="research-item …">` 块，修改：

- `data-index`：右侧悬浮的大号编号（如 `04`）
- `.research-no`：左侧小号编号
- `.research-meta`：实验室、时间、状态
- `<h3>` 标题
- 正文与 `.topic-list` 标签
- `<details>` 里的摘要

### 3. 换配色

编辑 `assets/css/style.css` 顶部的 `:root` 与 `html[data-theme="dark"]`：

- `--paper` / `--ink`：纸色与墨色
- `--accent`：印章红
- `--gold` / `--gold-ink`：暗金
- `--serif` / `--sans` / `--mono`：字体栈

### 4. 换头像 / 添加照片

当前主视觉是「木」字印章与档案卡，不依赖照片。若要加人像，可在 hero 的档案卡中插入 `<img>`，或参考 `.mark` 的结构替换。建议使用 4:5 竖图、小于 300KB 的 WebP。

### 5. 更新简历

简历只作为页面内的 CV 区块展示（教育背景、科研、技能、语言），不提供 PDF 下载或独立页面跳转。直接编辑 `index.html` 中 `#cv` 一节即可。

### 6. 添加博客 / 笔记

推荐独立目录，例如 `notes/`，每篇一个静态 HTML，复用 `assets/css/style.css`，然后在导航中加链接。这样不会破坏主页，也便于单独索引。

## 部署到 GitHub Pages

个人主页仓库必须命名为 `<username>.github.io`。本仓库对应：

```text
https://github.com/himon1/himon1.github.io
```

首次部署：

```bash
git init
git add .
git commit -m "Initial personal site"
git branch -M main
git remote add origin git@github.com:himon1/himon1.github.io.git
git push -u origin main
```

然后在仓库 **Settings → Pages** 中确认：

- Source: `Deploy from a branch`
- Branch: `main` / `/ (root)`

保存后 1–2 分钟即可访问 <https://himon1.github.io>。

> 本机现有 SSH key 已认证为 `himon1`，可直接推送。首次创建仓库后若提示 `Repository not found`，先在 GitHub 网页端创建空仓库 `himon1.github.io`（不要勾选 README），再重新推送。

## 维护约定

- 不改动外部依赖：没有 npm、没有构建步骤，任何编辑器都能改
- 新增交互时先保证无 JS 可用，再渐进增强
- 动效统一使用 `--ease`，并尊重 `prefers-reduced-motion`
- 颜色只从变量取，不在组件里写死色值

## 字体授权

Newsreader、Inter、JetBrains Mono 均采用 SIL Open Font License 1.1，可自托管与再分发。字体文件位于 `assets/fonts/`。
