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
        <button id="md-toc-toggle">☰</button>
        <span id="md-title"></span>
        <span id="md-spacer"></span>
        <select id="md-lang-select"></select>
        <button id="md-theme-toggle">🌙</button>
      </div>
      <div id="md-body">
        <nav id="md-toc"></nav>
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
      langSelect: root.querySelector("#md-lang-select"),
    };
  }

  // 根据当前语言刷新所有静态 UI 文案（按钮提示、aria、目录标题）。
  // 主题按钮的文案由 theme.js 自己维护（依赖明/暗状态），这里不碰。
  function applyUiStrings(els) {
    const i18n = MDReader.i18n;
    els.tocToggle.title = i18n.t("tocToggle");
    els.tocToggle.setAttribute("aria-label", i18n.t("tocToggle"));
    els.toc.setAttribute("aria-label", i18n.t("tocLabel"));
    els.langSelect.title = i18n.t("langToggle");
    els.langSelect.setAttribute("aria-label", i18n.t("langToggle"));
  }

  // 填充语言下拉选项并选中当前语言。
  function setupLangSelect(els) {
    const i18n = MDReader.i18n;
    els.langSelect.innerHTML = "";
    i18n.SUPPORTED.forEach((code) => {
      const opt = document.createElement("option");
      opt.value = code;
      opt.textContent = i18n.STRINGS[code].langName;
      els.langSelect.appendChild(opt);
    });
    els.langSelect.value = i18n.getLang();
    els.langSelect.addEventListener("change", (e) => {
      i18n.setLang(e.target.value);
    });
  }

  async function main() {
    const source = extractMarkdownSource();
    if (source == null) return; // 不是 markdown 文本页，放行

    window.__mdReaderActivated = true;
    document.documentElement.classList.add("md-reader-host");

    // 先确定界面语言（读偏好 / 跟随浏览器），避免文案闪烁。
    await MDReader.i18n.init();

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

    // 语言下拉 + 切换时重刷文案（含主题按钮提示）
    setupLangSelect(els);
    MDReader.i18n.onChange(() => {
      applyUiStrings(els);
      els.langSelect.value = MDReader.i18n.getLang();
      if (MDReader.refreshThemeButtonLabel) MDReader.refreshThemeButtonLabel();
    });

    // 主题（异步读取偏好）
    MDReader.initTheme(els.themeToggle);
  }

  main();
})();
