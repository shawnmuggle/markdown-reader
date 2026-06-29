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

  // 超过此大小（字符数 ≈ 字节）的文本文件不接管，交回 Chrome 原生显示，
  // 避免对超大日志 / 数据文件做 marked + 高亮 + mermaid 渲染拖垮浏览器。
  const MAX_RENDER_CHARS = 1024 * 1024; // 1 MB

  /**
   * 判断本页是否是“应当被接管渲染的纯文本文件”。
   * - .md / .markdown / .mdown / .mkd：本地与在线都接管（一直如此）。
   * - .txt：仅本地 file:// 接管，按 Markdown 渲染（本地 txt 多是自己的笔记，
   *   在线 .txt 常是正经文本接口，贸然当 markdown 渲染会误伤，故不碰在线）。
   * Chrome 打开这些纯文本文件时，会把整篇原文放进单个 <pre> 里。
   * 若页面是返回 HTML 的网页（恰好 URL 以 .md 结尾），body 不是单 <pre>，则不接管。
   * 文本超过 MAX_RENDER_CHARS 也不接管。
   * @returns {string|null} 命中则返回原始文本，否则 null
   */
  function extractMarkdownSource() {
    const url = location.href.split(/[?#]/)[0];
    const isLocal = location.protocol === "file:";
    // .md 系列：本地 + 在线都收；.txt：仅本地。
    const isMarkdownExt = /\.(md|markdown|mdown|mkd)$/i.test(url);
    const isLocalTxt = isLocal && /\.txt$/i.test(url);
    if (!isMarkdownExt && !isLocalTxt) return null;

    const body = document.body;
    if (!body) return null;

    // 情形 A：Chrome 文本查看器 —— body 内只有一个 <pre>，原文在其中。
    const onlyChild =
      body.children.length === 1 && body.children[0].tagName === "PRE";
    if (onlyChild) {
      const src = body.children[0].textContent;
      if (src && src.length > MAX_RENDER_CHARS) return null; // 太大，放行原生
      return src;
    }

    // 情形 B：body 直接是纯文本节点（少数情况），且没有真正的 HTML 元素。
    const hasRealElements = body.querySelector(
      "div, section, article, header, nav, table, ul, ol, h1, h2, h3"
    );
    const text = body.textContent || "";
    if (!hasRealElements && text.trim().length > 0) {
      if (text.length > MAX_RENDER_CHARS) return null; // 太大，放行原生
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
    if (source == null) {
      // 不是 markdown 文本页。若是本地目录列表页（file:///dir/），交给 dirview 美化接管。
      if (MDReader.tryBuildDirView) {
        try {
          await MDReader.tryBuildDirView();
        } catch (e) {
          /* 接管失败则保留 Chrome 原生目录页，不影响用户浏览 */
        }
      }
      return; // 其余普通网页一律放行
    }

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

    // 同目录文件导航（返回上一级 + 兄弟 .md 文件）。异步 fetch 父目录，
    // 完成后再决定侧栏是否显示——所以 TOC 的隐藏判断推迟到这里之后。
    let hasSiblings = false;
    if (MDReader.buildSiblings) {
      try {
        hasSiblings = await MDReader.buildSiblings(els.toc);
      } catch (e) {
        /* 无法访问父目录（未授权文件访问等）则跳过，不影响阅读 */
      }
    }

    // 侧栏里既无标题目录也无兄弟导航时才隐藏。
    if (!hasToc && !hasSiblings) {
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
      if (MDReader.refreshSiblingStrings) MDReader.refreshSiblingStrings();
    });

    // 主题（异步读取偏好）
    MDReader.initTheme(els.themeToggle);
  }

  main();
})();
