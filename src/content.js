/*
 * content.js — 入口与编排
 * 判断当前页是否为「纯 Markdown 文本文件」→ 取原文 → 搭建阅读骨架 →
 * 渲染 → 生成 TOC → 初始化主题。前置模块已挂在 window.MDReader。
 */
(function () {
  "use strict";

  const MDReader = window.MDReader || {};

  // 幂等守卫：已渲染过就不再处理（防止脚本被重复注入）。
  if (window.__mdReaderActivated) return;

  /**
   * 判断本页是否是“应当被接管的纯 Markdown 文本文件”。
   * Chrome 打开本地 / 纯文本响应的 .md 时，会把整篇原文放进单个 <pre> 里。
   * 若页面是返回 HTML 的网页（恰好 URL 以 .md 结尾），body 结构不是单 <pre>，
   * 此时不接管，避免破坏正常网页。
   * @returns {string|null} 命中则返回原始 Markdown 文本，否则 null
   */
  function extractMarkdownSource() {
    const url = location.href.split(/[?#]/)[0];
    if (!/\.(md|markdown|mdown|mkd)$/i.test(url)) return null;

    const body = document.body;
    if (!body) return null;

    // 情形 A：Chrome 文本查看器 —— body 内只有一个 <pre>，原文在其中。
    const onlyChild =
      body.children.length === 1 && body.children[0].tagName === "PRE";
    if (onlyChild) {
      return body.children[0].textContent;
    }

    // 情形 B：body 直接是纯文本节点（少数情况），且没有真正的 HTML 元素。
    const hasRealElements = body.querySelector(
      "div, section, article, header, nav, table, ul, ol, h1, h2, h3"
    );
    const text = body.textContent || "";
    if (!hasRealElements && text.trim().length > 0) {
      return text;
    }

    // 否则认为是普通网页，不接管。
    return null;
  }

  // 构建阅读骨架：工具栏 + 左侧 TOC + 右侧正文，并替换整个 body。
  function buildLayout(safeHtml) {
    document.title = decodeURIComponent(
      location.pathname.split("/").pop() || "Markdown"
    );

    const root = document.createElement("div");
    root.id = "md-reader-root";
    root.innerHTML = `
      <div id="md-toolbar">
        <button id="md-toc-toggle" title="折叠/展开目录" aria-label="折叠或展开目录">☰</button>
        <span id="md-title"></span>
        <span id="md-spacer"></span>
        <button id="md-theme-toggle" title="切换主题" aria-label="切换主题">🌙</button>
      </div>
      <div id="md-body">
        <nav id="md-toc" aria-label="目录"></nav>
        <main id="md-content" class="markdown-body"></main>
      </div>
    `;

    // 清空原页面（移除 Chrome 默认的 <pre>）并放入骨架。
    document.body.innerHTML = "";
    document.body.appendChild(root);

    const content = root.querySelector("#md-content");
    content.innerHTML = safeHtml;
    root.querySelector("#md-title").textContent = document.title;

    return {
      content,
      toc: root.querySelector("#md-toc"),
      tocToggle: root.querySelector("#md-toc-toggle"),
      themeToggle: root.querySelector("#md-theme-toggle"),
    };
  }

  function main() {
    const source = extractMarkdownSource();
    if (source == null) return; // 不是 markdown 文本页，放行

    window.__mdReaderActivated = true;
    document.documentElement.classList.add("md-reader-host");

    const safeHtml = MDReader.markdownToSafeHtml(source);
    const els = buildLayout(safeHtml);

    // 渲染增强：代码高亮 + mermaid
    MDReader.enhanceCodeBlocks(els.content);

    // 目录
    const hasToc = MDReader.buildToc(els.content, els.toc);
    if (!hasToc) {
      els.tocToggle.style.display = "none";
      document.getElementById("md-reader-root").classList.add("md-no-toc");
    }

    // 目录折叠按钮
    els.tocToggle.addEventListener("click", () => {
      document.getElementById("md-reader-root").classList.toggle("md-toc-collapsed");
    });

    // 主题（异步读取偏好）
    MDReader.initTheme(els.themeToggle);
  }

  main();
})();
