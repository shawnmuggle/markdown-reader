# Chrome Web Store 上架填写清单

把下面的内容照抄到 [Chrome Web Store 开发者控制台](https://chrome.google.com/webstore/devconsole) 对应的表单字段。
这是一份"照填即可"的清单——每个字段都标了它在控制台里的名字。

---

## 0. 上架前准备（一次性）

- [ ] 用一个 Google 账号登录开发者控制台，**支付一次性 $5 注册费**（终身有效）
- [ ] 准备好上传包：`markdown-reader.zip`（运行 `./pack.sh` 生成，见仓库根目录）
- [ ] 准备好图片素材（见第 4 节）
- [ ] 隐私政策已就绪：`PRIVACY.md`（也可托管到 GitHub Pages 给一个公开 URL）

---

## 1. Store listing（商品详情）

### Name（名称）
```
Markdown Reader
```

### Summary（简短描述，最多 132 字符）
```
Render local & online Markdown files into a clean, GitHub-styled reading view — TOC, syntax highlighting, dark mode, tables & Mermaid.
```

### Description（详细描述）
```
Markdown Reader turns any .md / .markdown file into a beautiful, readable page instead of raw plain text.

Just drag a Markdown file into Chrome — or open a local file:// path — and it instantly renders in a clean, GitHub-styled view.

★ FEATURES
• Renders local files directly — drag a .md into Chrome and read it
• GitHub-style typography — familiar and clean
• Sidebar outline (TOC) — auto-generated, click to jump, highlights on scroll
• Syntax highlighting — powered by highlight.js, many languages
• Light / dark theme — one click, remembers your choice
• Interface language — switch between English and 中文
• GFM tables, task lists, and Mermaid diagrams
• Fully offline — all libraries bundled, zero network requests
• Private & secure — no tracking, no data collection; rendered HTML is sanitized with DOMPurify

★ REQUIRED SETUP (for local files)
To read LOCAL files, after installing go to chrome://extensions → Markdown Reader → Details → enable "Allow access to file URLs". Viewing online .md files does not need this.

★ OPEN SOURCE
MIT licensed. Source: https://github.com/shawnmuggle/markdown-reader

★ PRIVACY
Markdown Reader collects no data. It runs entirely on your device, makes no network requests, and only stores your theme/language preference locally.
```

### Category（分类）
```
Developer Tools
```
（备选：Productivity）

### Language（默认语言）
```
English (United States)
```

---

## 2. Privacy（隐私）

### Single purpose（单一用途说明）
```
Markdown Reader has a single purpose: to render Markdown (.md / .markdown) files that the user opens in the browser into a styled, readable HTML view.
```

### Permission justifications（权限理由）

**`storage`**
```
Used only to remember the user's theme (light/dark) and interface language preferences locally on the device. No data is transmitted.
```

**Host permission — `file:///*` and `*://*/*.md`**
```
Required to read the content of the Markdown file the user is viewing so it can be parsed and rendered in-page. File contents are processed locally and never uploaded or transmitted.
```

### Are you using remote code?（是否使用远程代码？）
```
No — all JavaScript libraries are bundled inside the extension package. Nothing is loaded from a CDN or remote server at runtime.
```

### Data usage（数据用途声明 — 全部勾选"不收集"）
- Personally identifiable information: **NOT collected**
- Health information: **NOT collected**
- Financial information: **NOT collected**
- Authentication information: **NOT collected**
- Personal communications: **NOT collected**
- Location: **NOT collected**
- Web history: **NOT collected**
- User activity: **NOT collected**
- Website content: **NOT collected**（文件内容仅在本地渲染，不传输）

并勾选三项合规声明（不出售数据 / 不用于无关用途 / 不用于判定信用）。

### Privacy policy URL（隐私政策链接）
```
https://github.com/shawnmuggle/markdown-reader/blob/main/PRIVACY.md
```

---

## 3. Distribution（分发）

- **Visibility**: Public（公开）
- **Pricing**: Free（免费）
- **Regions**: All regions（所有地区）

---

## 4. 图片素材清单

| 素材 | 要求 | 本仓库文件 | 状态 |
| ---- | ---- | ---------- | ---- |
| 商店图标 | 128×128 PNG | `icons/icon128.png` | ✅ 现成 |
| 截图 | 至少 1 张，1280×800 或 640×400 | `promo/screenshot-1280x800.png` | ✅ 已生成 |
| 小宣传图（可选）| 440×280 | — | 可后补 |
| 大宣传图（可选）| 1400×560 | — | 可后补 |

> 截图最少 1 张即可上架。建议之后你装上插件后，再补 1-2 张「真实渲染 + 深色模式」的截图，转化率更高。

---

## 5. 审核小贴士

- 首次提交后人工审核通常 **几天到 1-2 周**。
- 可能被多看一眼的点：`file://` 访问权限（已在单一用途里解释清楚）、bundled 的 mermaid.min.js（合法的开源库，无远程代码）。
- 描述里**务必保留**"Allow access to file URLs"那段——否则用户装了发现本地文件不渲染，会给差评。
- 之后更新版本：改 `manifest.json` 的 `version`，重新 `./pack.sh`，在控制台上传新 zip 即可。
