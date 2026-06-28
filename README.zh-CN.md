# Markdown Reader

[English](./README.md) | **简体中文**

一个 Chrome 浏览器插件：把本地或在线的 `.md` / `.markdown` 文件**渲染成 GitHub 风格的阅读视图**，而不是显示原始纯文本。

把 Markdown 文件拖进浏览器，立刻得到漂亮、可读的页面。

## ✨ 功能

- 📄 **本地文件直接渲染** —— 把 `.md` 拖进 Chrome，或打开 `file://` 路径的 Markdown 文件，自动渲染
- 🎨 **GitHub 风格排版** —— 熟悉、干净的阅读体验
- 🧭 **侧边目录导航（TOC）** —— 自动根据标题生成，点击跳转，滚动高亮当前章节
- 🌈 **代码语法高亮** —— 基于 highlight.js，支持多语言
- 🌙 **深色 / 浅色切换** —— 一键切换，记住你的偏好
- 🌐 **界面语言（中文 / English）** —— 工具栏切换界面语言；首次跟随浏览器语言，选过后记住
- 📊 **表格 + Mermaid 流程图** —— 支持 GFM 表格、任务列表，以及 Mermaid 图表渲染
- 🔒 **安全** —— 渲染前用 DOMPurify 消毒，防止恶意 Markdown 里的 XSS
- 📦 **完全离线** —— 所有依赖打包在本地，不依赖任何 CDN 或网络

## 🚀 安装（加载已解压的扩展程序）

1. 打开 Chrome，地址栏输入 `chrome://extensions` 回车
2. 打开右上角的 **「开发者模式」** 开关
3. 点击 **「加载已解压的扩展程序」**，选择本项目文件夹（包含 `manifest.json` 的那个目录）

### ⚠️ 必做：开启「允许访问文件网址」

这是让插件能读取**本地** `.md` 文件的关键一步，**不开这一项，本地文件无法渲染**：

1. 在 `chrome://extensions` 找到 **Markdown Reader**
2. 点击它的 **「详情」**
3. 找到并打开 **「允许访问文件网址」**（Allow access to file URLs）开关

> 仅查看在线 `http(s)` 上的 `.md` 不需要这一步；但要看本地文件，必须开启。

## 📖 使用

- **本地文件**：把 `.md` / `.markdown` 文件**拖进 Chrome 窗口**，或在地址栏输入文件路径（如 `file:///Users/you/notes.md`）
- **在线文件**：直接访问任意以 `.md` 结尾的网址

页面顶部工具栏：

- `☰` 折叠 / 展开左侧目录
- 语言下拉 —— 切换界面语言（中文 / English）
- `🌙 / ☀️` 切换深浅色主题

## ✅ 验证是否正常

项目里附带了一个 `test.md`，覆盖了所有功能点（标题、列表、任务列表、代码高亮、表格、两种 Mermaid 图、以及一段 XSS 安全测试）。

安装并开启「允许访问文件网址」后，把 `test.md` 拖进 Chrome，逐项核对：

- [ ] 渲染成 GitHub 风格阅读视图（不是纯文本源码）
- [ ] 左侧出现目录，点击跳转、滚动时高亮当前章节
- [ ] 代码块有语法高亮
- [ ] 表格、任务列表正常显示
- [ ] 两个 Mermaid 图渲染成图形（流程图 + 时序图）
- [ ] 点 `🌙/☀️` 能切换深浅色，刷新后保持上次选择
- [ ] 语言下拉能在中文 / English 间切换界面文案
- [ ] 第 6 节的 `<script>` **没有**弹窗（说明 XSS 防护生效）

## 🛠 技术栈

纯前端 Manifest V3 插件，零构建、零后端。所有第三方库以固定版本 vendored 在 `lib/`：

| 库                  | 用途                  |
| ------------------- | --------------------- |
| marked              | Markdown → HTML 解析  |
| DOMPurify           | HTML 消毒（防 XSS）   |
| highlight.js        | 代码语法高亮          |
| mermaid             | 流程图 / 时序图渲染   |
| github-markdown-css | GitHub 风格排版       |

## 📁 项目结构

```
markdown-reader/
├── manifest.json   # MV3 配置，content script 匹配 file://*.md
├── src/
│   ├── content.js  # 入口：判断 → 取原文 → 搭建骨架 → 编排
│   ├── render.js   # marked 解析 + DOMPurify 消毒 + 代码高亮 + mermaid
│   ├── toc.js      # 侧边目录生成 + 滚动高亮
│   ├── theme.js    # 深浅色切换 + 偏好记忆
│   ├── i18n.js     # 界面语言（中/英）+ 偏好记忆
│   └── reader.css  # 布局样式
├── lib/            # vendored 第三方库
├── icons/          # 插件图标
├── test.md         # 功能验证样本
└── README.md
```

## ❓ 常见问题

**Q：拖进去还是显示纯文本 / 直接下载文件？**
A：99% 是没开「允许访问文件网址」。回到 `chrome://extensions` → Markdown Reader → 详情 → 打开该开关，然后重新打开文件。

**Q：本地文件改了内容，页面没更新？**
A：刷新页面（⌘R / Ctrl+R）即可重新渲染。

**Q：某个普通网页 URL 恰好以 `.md` 结尾，被错误接管了？**
A：插件只在页面是「单一 `<pre>` 纯文本」时才接管，正常返回 HTML 的网页会被放行，不会被破坏。

## 📄 许可证

[MIT](./LICENSE) © 2026 shawnmuggle
