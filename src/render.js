/*
 * render.js — Markdown 渲染管线
 * 原文 → marked 解析 → DOMPurify 消毒 → 注入 DOM → 代码高亮 → Mermaid 渲染
 *
 * 注入顺序在 content.js 之前，这里只定义函数，挂到 window.MDReader，
 * 由 content.js 编排调用。第三方库（marked / DOMPurify / hljs / mermaid）
 * 已由 manifest 在本文件之前注入为全局变量。
 */
(function () {
  "use strict";

  const MDReader = (window.MDReader = window.MDReader || {});

  // marked 配置：开启 GFM（表格、删除线、自动链接），开启换行符即换行。
  // 不在这里做高亮——交给渲染后的 DOM 遍历，避免依赖 marked 各版本的 highlight 钩子签名。
  function configureMarked() {
    if (typeof marked === "undefined") return;
    marked.setOptions({
      gfm: true,
      breaks: false,
      // marked 默认会给标题生成 id 用于锚点；这里不依赖它，TOC 自己加 id。
    });
  }

  // DOMPurify 配置：允许常见 Markdown 产物，禁止脚本/事件处理器。
  // 关键：保留 class（hljs / mermaid / task-list 需要），保留 a 的 target/rel。
  const PURIFY_CONFIG = {
    ADD_ATTR: ["target", "rel", "class", "id", "align", "start", "type", "checked", "disabled"],
    // 禁止内联事件与 javascript: 协议由 DOMPurify 默认处理，无需额外配置。
    FORBID_TAGS: ["style"],
  };

  /**
   * 把 Markdown 源文本渲染成消毒后的 HTML 字符串。
   * @param {string} source 原始 Markdown 文本
   * @returns {string} 安全的 HTML
   */
  function markdownToSafeHtml(source) {
    configureMarked();
    const rawHtml = marked.parse(source);
    return DOMPurify.sanitize(rawHtml, PURIFY_CONFIG);
  }

  /**
   * 在已注入 DOM 的容器内：
   *  1) 把 ```mermaid 代码块转成 <div class="mermaid"> 并调用 mermaid 渲染
   *  2) 其余代码块用 highlight.js 高亮
   * @param {HTMLElement} container 已写入渲染 HTML 的容器
   */
  function enhanceCodeBlocks(container) {
    const codeBlocks = container.querySelectorAll("pre > code");

    codeBlocks.forEach((code) => {
      const isMermaid =
        code.classList.contains("language-mermaid") ||
        code.classList.contains("lang-mermaid");

      if (isMermaid) {
        // 用一个 div.mermaid 替换整个 <pre>，文本即流程图定义。
        const pre = code.parentElement;
        const div = document.createElement("div");
        div.className = "mermaid";
        div.textContent = code.textContent;
        // 存一份原始定义，供主题切换时重渲染（mermaid 渲染后会替换内部为 svg）。
        div.dataset.source = code.textContent;
        pre.replaceWith(div);
        return;
      }

      // 普通代码块：highlight.js 高亮（自动探测或按 language-xxx）。
      if (typeof hljs !== "undefined") {
        try {
          hljs.highlightElement(code);
        } catch (e) {
          // 单个代码块高亮失败不应中断整页渲染。
          console.warn("[Markdown Reader] highlight failed:", e);
        }
      }
    });

    renderMermaid(container);
  }

  // 渲染容器内所有 .mermaid 块。mermaid v10 提供 mermaid.run。
  function renderMermaid(container) {
    if (typeof mermaid === "undefined") return;
    const nodes = container.querySelectorAll(".mermaid");
    if (nodes.length === 0) return;

    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark";
    try {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict", // 禁止 mermaid 图里的脚本/点击外链
        theme: isDark ? "dark" : "default",
      });
      mermaid.run({ nodes: Array.from(nodes) });
    } catch (e) {
      console.warn("[Markdown Reader] mermaid render failed:", e);
    }
  }

  MDReader.markdownToSafeHtml = markdownToSafeHtml;
  MDReader.enhanceCodeBlocks = enhanceCodeBlocks;
  MDReader.renderMermaid = renderMermaid;
})();
