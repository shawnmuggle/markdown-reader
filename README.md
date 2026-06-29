# Markdown Reader

**English** | [简体中文](./README.zh-CN.md)

A Chrome extension that renders local or online `.md` / `.markdown` files into a **GitHub-styled reading view** instead of showing raw plain text.

Drag a Markdown file into your browser and instantly get a clean, readable page.

## ✨ Features

- 📄 **Renders local files directly** — drag a `.md` into Chrome, or open a `file://` path to a Markdown file, and it renders automatically. Local `.txt` files are rendered as Markdown too (files over 1 MB are left as plain text to keep things fast)
- 🎨 **GitHub-style typography** — a familiar, clean reading experience
- 🧭 **Sidebar outline (TOC)** — auto-generated from headings, click to jump, highlights the current section on scroll
- 🗂 **Folder browsing** — open a local folder (`file:///path/to/dir/`) and get a clean, themed file list instead of Chrome's bare directory page, with breadcrumbs and one-click "parent directory"
- 🔗 **Sibling navigation** — while reading a `.md`, the sidebar also lists the other Markdown files in the same folder (current file highlighted) plus a link back up, so you can hop between files without retyping paths
- 🌈 **Syntax highlighting** — powered by highlight.js, multi-language
- 🌙 **Light / dark toggle** — one click, remembers your choice
- 🌐 **Interface language (English / 中文)** — switch UI language from the toolbar; follows your browser on first run, remembers your choice afterwards
- 📊 **Tables + Mermaid diagrams** — GFM tables, task lists, and Mermaid chart rendering
- 🔒 **Secure** — rendered HTML is sanitized with DOMPurify to prevent XSS from malicious Markdown
- 📦 **Fully offline & 100% local** — runs entirely inside your browser. No remote server, no backend, no telemetry. Your files are read from disk and rendered locally; **nothing is ever uploaded or sent anywhere**

## 🚀 Install (load unpacked)

1. Open Chrome and go to `chrome://extensions`
2. Turn on **Developer mode** (top-right)
3. Click **Load unpacked** and select this project folder (the one containing `manifest.json`)

### ⚠️ Required: enable "Allow access to file URLs"

This is the key step that lets the extension read **local** `.md` files. **Without it, local files won't render**:

1. Find **Markdown Reader** on `chrome://extensions`
2. Click its **Details**
3. Turn on **Allow access to file URLs**

> Viewing online `http(s)` `.md` files doesn't need this — but local files do.

## 📖 Usage

- **Local files**: **drag** a `.md` / `.markdown` file into the Chrome window, or type the file path in the address bar (e.g. `file:///Users/you/notes.md`)
- **Online files**: just visit any URL ending in `.md`

Top toolbar:

- `☰` collapse / expand the sidebar outline
- Language dropdown — switch the interface language (English / 中文)
- `🌙 / ☀️` toggle light / dark theme

## ✅ Verify it works

A `test.md` is included, covering every feature (headings, lists, task lists, syntax highlighting, tables, two kinds of Mermaid diagrams, and an XSS safety test).

After installing and enabling "Allow access to file URLs", drag `test.md` into Chrome and check:

- [ ] Renders as a GitHub-style reading view (not raw source)
- [ ] Sidebar outline appears, clicking jumps, scrolling highlights the current section
- [ ] Code blocks are syntax-highlighted
- [ ] Tables and task lists display correctly
- [ ] Both Mermaid diagrams render as graphics (flowchart + sequence diagram)
- [ ] `🌙/☀️` toggles light/dark, and the choice persists after refresh
- [ ] The language dropdown switches the UI between English and 中文
- [ ] The `<script>` in section 6 does **not** pop an alert (XSS protection works)

## 🔒 Privacy — runs 100% locally

This extension is **fully local**. There is **no remote server, no backend, and no network calls** involved in reading or rendering your files:

- Your Markdown files are read from disk **by the browser itself** and rendered **in the page**. The contents never leave your machine.
- The folder list and "files in this folder" sidebar are built **locally** — by reading the directory the browser already exposes (via `file://`). No directory data is sent anywhere.
- All libraries (marked, DOMPurify, highlight.js, mermaid, github-markdown-css) are **bundled in `lib/`** at fixed versions. Nothing is fetched from a CDN at runtime.
- The only thing stored is your **theme and language preference**, kept in Chrome's local `storage` on your own device.
- The only permission requested is `storage` (for those preferences). The extension does **not** request host permissions for the open web.

In short: install it, read your local docs, and **nothing is uploaded**. You can use it completely offline.

## 🛠 Tech stack

A pure front-end Manifest V3 extension — zero build, zero backend. All third-party libraries are vendored at fixed versions in `lib/`:

| Library             | Purpose                  |
| ------------------- | ------------------------ |
| marked              | Markdown → HTML parsing  |
| DOMPurify           | HTML sanitization (XSS)  |
| highlight.js        | Code syntax highlighting |
| mermaid             | Flowchart / diagram render |
| github-markdown-css | GitHub-style typography  |

## 📁 Project structure

```
markdown-reader/
├── manifest.json   # MV3 config, content script matches file:// + *.md
├── src/
│   ├── content.js  # entry: detect → extract source → build layout → orchestrate
│   ├── render.js   # marked parse + DOMPurify sanitize + highlight + mermaid
│   ├── toc.js      # sidebar outline + scroll-spy
│   ├── siblings.js # "files in this folder" sidebar nav (reads parent dir)
│   ├── dirview.js  # themed folder listing for file:///dir/ pages
│   ├── theme.js    # light/dark toggle + persistence
│   ├── i18n.js     # interface language (en / zh) + persistence
│   └── reader.css  # layout styles (reading view + folder view)
├── lib/            # vendored third-party libraries
├── icons/          # extension icons
├── test.md         # feature verification sample
└── README.md
```

## ❓ FAQ

**Q: It still shows plain text / downloads the file when I drag it in?**
A: 99% of the time, "Allow access to file URLs" isn't enabled. Go back to `chrome://extensions` → Markdown Reader → Details → turn on that toggle, then reopen the file.

**Q: I edited a local file but the page didn't update?**
A: Refresh the page (⌘R / Ctrl+R) to re-render.

**Q: A normal web page URL happens to end in `.md` and got hijacked?**
A: The extension only takes over when the page is a single `<pre>` of plain text. Pages that return real HTML are left alone.

## 📄 License

[MIT](./LICENSE) © 2026 shawnmuggle
