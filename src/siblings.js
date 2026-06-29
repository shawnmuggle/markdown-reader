/*
 * siblings.js — 阅读 .md 时的「同目录文件导航」
 * 在左侧 TOC 上方注入：返回上一级 + 同目录的兄弟 Markdown 文件列表（当前文件高亮）。
 * 兄弟列表通过 fetch 父目录（file:///dir/ → Chrome 返回 directory listing HTML）解析得到；
 * 需要用户已勾选「允许访问文件网址」，否则 fetch 失败时静默跳过，不影响阅读。
 * 挂到 window.MDReader.buildSiblings，由 content.js 调用。
 */
(function () {
  "use strict";

  const MDReader = (window.MDReader = window.MDReader || {});

  // 可阅读文本扩展名：Markdown 系列 + .txt（siblings 只在本地 file:// 运行，
  // 本地 .txt 也按 Markdown 渲染，故一并列入同目录文件导航）。
  const READABLE_EXT = /\.(md|markdown|mdown|mkd|txt)$/i;

  // 文档 / 文件夹 / 上一级 图标（与 dirview 保持一致）。
  const ICONS = {
    md: '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 10 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-2.938-2.938ZM4.75 8.5h6.5a.75.75 0 0 1 0 1.5h-6.5a.75.75 0 0 1 0-1.5Zm0 2.5h6.5a.75.75 0 0 1 0 1.5h-6.5a.75.75 0 0 1 0-1.5Z"/></svg>',
    up: '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M3.47 7.78a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1-1.06 1.06L9 4.81v7.44a.75.75 0 0 1-1.5 0V4.81L4.53 7.78a.75.75 0 0 1-1.06 0Z"/></svg>',
  };

  function strings() {
    const lang = MDReader.i18n ? MDReader.i18n.getLang() : "en";
    const T = {
      zh: { parent: "返回上一级", filesInDir: "同目录文件" },
      en: { parent: "Parent directory", filesInDir: "Files in this folder" },
    };
    return T[lang] || T.en;
  }

  // 当前 .md 的父目录 URL（file:///a/b/x.md → file:///a/b/）。
  function parentDirUrl() {
    const href = location.href.split(/[?#]/)[0];
    const idx = href.lastIndexOf("/");
    if (idx < 0) return null;
    return href.slice(0, idx + 1);
  }

  /**
   * fetch 父目录，从返回的 directory listing HTML 里解析出同目录的 .md 文件。
   * @returns {Promise<{files: Array<{name:string,href:string}>, dirUrl:string}|null>}
   */
  async function fetchSiblings() {
    const dirUrl = parentDirUrl();
    if (!dirUrl || !dirUrl.startsWith("file:")) return null;

    let html;
    try {
      const res = await fetch(dirUrl);
      html = await res.text();
    } catch (e) {
      // 未勾选「允许访问文件网址」或被拦截 → 静默放弃。
      return null;
    }

    // 用 DOMParser 离线解析，不污染当前页。
    let doc;
    try {
      doc = new DOMParser().parseFromString(html, "text/html");
    } catch (e) {
      return null;
    }

    const here = location.href.split(/[?#]/)[0];
    const files = [];
    const seen = new Set();

    doc.querySelectorAll("a").forEach((a) => {
      const rawHref = a.getAttribute("href");
      if (!rawHref) return;
      // 解析成相对父目录的绝对 URL。
      let abs;
      try {
        abs = new URL(rawHref, dirUrl).href;
      } catch (e) {
        return;
      }
      if (abs.endsWith("/")) return; // 子目录，跳过
      if (!READABLE_EXT.test(abs.split(/[?#]/)[0])) return; // 只列可阅读的兄弟（md/txt）
      if (seen.has(abs)) return;
      seen.add(abs);
      const name = decodeURIComponent(abs.split("/").pop());
      files.push({ name, href: abs, current: abs === here });
    });

    files.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );

    return { files, dirUrl };
  }

  /**
   * 在 tocEl 上方注入兄弟文件导航。
   * @param {HTMLElement} tocEl 左侧目录容器（#md-toc）
   * @returns {Promise<boolean>} 是否注入了任何内容（有父目录链接即算 true）
   */
  async function buildSiblings(tocEl) {
    const data = await fetchSiblings();
    // 即便没解析到兄弟文件，只要能确定父目录，也提供「返回上一级」。
    const dirUrl = data ? data.dirUrl : parentDirUrl();
    if (!dirUrl || !dirUrl.startsWith("file:")) return false;

    const S = strings();

    const box = document.createElement("div");
    box.className = "md-siblings";
    box.dataset.role = "siblings";

    // 返回上一级
    const up = document.createElement("a");
    up.className = "md-sib-parent";
    up.href = dirUrl;
    up.innerHTML = `<span class="md-sib-icon">${ICONS.up}</span><span class="md-sib-name"></span>`;
    up.querySelector(".md-sib-name").textContent = S.parent;
    box.appendChild(up);

    // 兄弟文件列表（含当前文件，用于定位高亮）
    if (data && data.files.length > 0) {
      const label = document.createElement("div");
      label.className = "md-sib-label";
      label.textContent = S.filesInDir;
      box.appendChild(label);

      const ul = document.createElement("ul");
      ul.className = "md-sib-list";
      data.files.forEach((f) => {
        const li = document.createElement("li");
        li.className = "md-sib-item" + (f.current ? " md-sib-current" : "");
        if (f.current) {
          // 当前文件不可点，纯标识。
          li.innerHTML = `<span class="md-sib-icon">${ICONS.md}</span><span class="md-sib-name"></span>`;
          li.querySelector(".md-sib-name").textContent = f.name;
        } else {
          const a = document.createElement("a");
          a.href = f.href;
          a.innerHTML = `<span class="md-sib-icon">${ICONS.md}</span><span class="md-sib-name"></span>`;
          a.querySelector(".md-sib-name").textContent = f.name;
          li.appendChild(a);
        }
        ul.appendChild(li);
      });
      box.appendChild(ul);
    }

    // 注入到 TOC 顶部
    tocEl.insertBefore(box, tocEl.firstChild);

    // 若 TOC 原本因无标题而隐藏（md-toc-empty），这里有了兄弟导航就让它显示。
    tocEl.classList.remove("md-toc-empty");

    return true;
  }

  // 语言切换时刷新兄弟区文案（不重新 fetch）。
  function refreshSiblingStrings() {
    const S = strings();
    const parent = document.querySelector(".md-sib-parent .md-sib-name");
    if (parent) parent.textContent = S.parent;
    const label = document.querySelector(".md-sib-label");
    if (label) label.textContent = S.filesInDir;
  }

  MDReader.buildSiblings = buildSiblings;
  MDReader.refreshSiblingStrings = refreshSiblingStrings;
})();
