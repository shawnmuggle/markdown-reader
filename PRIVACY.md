# Privacy Policy — Markdown Reader

_Last updated: 2026-06-28_

**English** | [简体中文](#隐私政策简体中文)

## Summary

**Markdown Reader does not collect, transmit, store, or share any personal
data. Period.**

The extension runs entirely on your device. It has no servers, no analytics,
no tracking, and makes no network requests of its own.

## What the extension does

Markdown Reader reads `.md` / `.markdown` files you open in Chrome and renders
them into a styled reading view. All processing happens locally in your browser.

## Data we store

The only thing the extension stores is your **display preferences**, saved
locally via the Chrome `storage` API:

| Stored value      | Purpose                          | Where it lives                |
| ----------------- | -------------------------------- | ----------------------------- |
| Theme (light/dark)| Remember your theme choice       | `chrome.storage.local` (on your device) |
| Interface language| Remember your language choice    | `chrome.storage.local` (on your device) |

This data **never leaves your device**. It is not sent anywhere, not synced to
any server we control, and not accessible to us.

## Data we do NOT collect

- ❌ No personal information
- ❌ No file contents (your Markdown files are rendered locally and never uploaded)
- ❌ No browsing history
- ❌ No analytics, telemetry, or usage tracking
- ❌ No cookies, no advertising identifiers
- ❌ No network requests to any external service

## Permissions

- **`storage`** — used solely to remember your theme and language preferences locally.
- **Host access (`file://` and pages ending in `.md`/`.markdown`)** — used solely to
  read the Markdown file you are viewing so it can be rendered. The content is
  processed in-page and never transmitted.

## Third-party libraries

All third-party libraries (marked, DOMPurify, highlight.js, mermaid,
github-markdown-css) are bundled locally inside the extension. They make no
network calls. Nothing is loaded from a CDN at runtime.

## Changes

If this policy ever changes, the updated version will be published in this file
in the project repository.

## Contact

Questions? Open an issue at
<https://github.com/shawnmuggle/markdown-reader/issues>.

---

## 隐私政策（简体中文）

### 总览

**Markdown Reader 不收集、不传输、不存储、不分享任何个人数据。**

本扩展完全在你的设备上运行：没有服务器、没有分析统计、没有追踪，自身不发起任何网络请求。

### 扩展做什么

读取你在 Chrome 中打开的 `.md` / `.markdown` 文件，并渲染成带样式的阅读视图。所有处理都在你的浏览器本地完成。

### 我们存储什么

扩展唯一存储的是你的**显示偏好**，通过 Chrome `storage` API 保存在本地：

| 存储项        | 用途             | 存放位置                          |
| ------------- | ---------------- | --------------------------------- |
| 主题（明/暗） | 记住你的主题选择 | `chrome.storage.local`（你的设备上） |
| 界面语言      | 记住你的语言选择 | `chrome.storage.local`（你的设备上） |

这些数据**永远不会离开你的设备**，不会被发送到任何地方。

### 我们不收集什么

- ❌ 不收集个人信息
- ❌ 不收集文件内容（你的 Markdown 文件只在本地渲染，从不上传）
- ❌ 不收集浏览历史
- ❌ 没有分析、遥测或使用追踪
- ❌ 没有 cookie、没有广告标识符
- ❌ 不向任何外部服务发起网络请求

### 权限说明

- **`storage`** —— 仅用于在本地记住你的主题与语言偏好。
- **主机访问（`file://` 及以 `.md`/`.markdown` 结尾的页面）** —— 仅用于读取你正在查看的
  Markdown 文件以便渲染。内容在页内处理，从不传输。

### 第三方库

所有第三方库（marked、DOMPurify、highlight.js、mermaid、github-markdown-css）均本地打包在扩展内，不发起任何网络请求，运行时不从 CDN 加载任何内容。

### 联系方式

有疑问请在 <https://github.com/shawnmuggle/markdown-reader/issues> 提 issue。
