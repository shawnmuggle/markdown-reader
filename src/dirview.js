/*
 * dirview.js — 本地目录列表页（file:///dir/）美化
 * 接管 Chrome 内置的 directory listing，重建为与阅读页统一风格的卡片列表：
 *   工具栏（语言 / 主题）+ 面包屑 + 返回上一级 + 文件/子目录列表。
 * 解析来源是已渲染好的原生 DOM（<a href> 列表，子目录 href 以 / 结尾），
 * Chrome 不提供结构化 JSON，因此从 DOM 提取最稳。
 * 挂到 window.MDReader.tryBuildDirView，由 content.js 在「非 .md 页」时调用。
 */
(function () {
  "use strict";

  const MDReader = (window.MDReader = window.MDReader || {});

  // 可阅读文本扩展名（Markdown 系列 + .txt）：列表里给这些文件一个文档图标 + 高亮，
  // 提示点开后会被渲染成阅读视图（目录页永远本地 file://，本地 .txt 也按 Markdown 渲染）。
  const READABLE_EXT = /\.(md|markdown|mdown|mkd|txt)$/i;

  /**
   * 判断当前页是否为「Chrome 本地目录列表页」。
   * 命中条件：file:// 协议 + 路径以 / 结尾（目录），且页面里有原生列表的 <a> 链接。
   * @returns {boolean}
   */
  function isDirectoryListing() {
    if (location.protocol !== "file:") return false;
    const path = location.pathname;
    if (!path.endsWith("/")) return false;
    // 原生目录页：body 里有一组 <a>，且没有我们自己注入的 root。
    if (document.getElementById("md-reader-root")) return false;
    return document.querySelector("a") != null;
  }

  /**
   * 从原生 DOM 解析出条目列表。
   * Chrome 的目录页把每个文件/子目录渲染成一个 <a>，子目录 href 以 / 结尾。
   * 大小 / 修改时间在同一行的兄弟单元格里（结构随版本略有差异，尽量容错读取）。
   * @returns {{entries: Array, parentHref: string|null}}
   */
  function parseListing() {
    const anchors = Array.from(document.querySelectorAll("a"));
    const entries = [];
    let parentHref = null;

    anchors.forEach((a) => {
      const href = a.getAttribute("href");
      if (!href) return;
      const abs = a.href;
      const name = (a.textContent || "").trim();
      if (!name) return;

      const isDir = abs.endsWith("/");

      // 「上一级目录」单独拎出来，不混进普通列表。
      // 原生页用 href="../" 或文案含 parent，name 常是 "[parent directory]" / "../"。
      const looksParent =
        href === "../" || /parent directory|\.\.\//i.test(name);
      if (looksParent) {
        parentHref = abs;
        return;
      }

      // 跳过指向自身当前目录的链接（少数版本会有）。
      if (abs === location.href) return;

      // 尝试从同行的其它单元格读 size / date（原生页是 <table> 或并排 span）。
      const row = a.closest("tr");
      let size = "";
      let modified = "";
      if (row) {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 3) {
          size = (cells[1].textContent || "").trim();
          modified = (cells[2].textContent || "").trim();
        }
      }

      entries.push({
        name: isDir ? name.replace(/\/$/, "") : name,
        href: abs,
        isDir,
        isMd: !isDir && READABLE_EXT.test(name),
        size,
        modified,
      });
    });

    // 排序：子目录在前，其次按名称（本地化、忽略大小写）。
    entries.sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });

    return { entries, parentHref };
  }

  // 把 file:// 路径切成可点击的面包屑段（每段链到对应上层目录）。
  function buildCrumbs() {
    // 解码后用于显示；href 仍用编码后的绝对路径，避免空格/中文出错。
    const path = decodeURIComponent(location.pathname);
    const segs = path.split("/").filter(Boolean);
    const crumbs = [{ label: "/", href: location.origin + "/" }];
    let acc = location.origin;
    segs.forEach((seg) => {
      acc += "/" + encodeURIComponent(seg);
      crumbs.push({ label: seg, href: acc + "/" });
    });
    return crumbs;
  }

  // 文档 / 文件夹 / 普通文件的内联 SVG 图标（currentColor，随主题变色）。
  const ICONS = {
    dir: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Z"/></svg>',
    md: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 10 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011ZM4.75 8.5h6.5a.75.75 0 0 1 0 1.5h-6.5a.75.75 0 0 1 0-1.5Zm0 2.5h6.5a.75.75 0 0 1 0 1.5h-6.5a.75.75 0 0 1 0-1.5Z"/></svg>',
    file: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 10 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z"/></svg>',
    up: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M3.47 7.78a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1-1.06 1.06L9 4.81v7.44a.75.75 0 0 1-1.5 0V4.81L4.53 7.78a.75.75 0 0 1-1.06 0Z"/></svg>',
  };

  // i18n 没有目录页文案时的兜底（zh / en）。
  function dirStrings() {
    const lang = MDReader.i18n ? MDReader.i18n.getLang() : "en";
    const T = {
      zh: {
        parent: "返回上一级",
        empty: "（空目录）",
        items: (n) => `${n} 项`,
        nameCol: "名称",
        sizeCol: "大小",
        dateCol: "修改时间",
      },
      en: {
        parent: "Parent directory",
        empty: "(empty directory)",
        items: (n) => `${n} item${n === 1 ? "" : "s"}`,
        nameCol: "Name",
        sizeCol: "Size",
        dateCol: "Date modified",
      },
    };
    return T[lang] || T.en;
  }

  // 构建并替换整页 UI。
  function render(model) {
    const S = dirStrings();
    const dirName =
      decodeURIComponent(location.pathname.replace(/\/$/, "").split("/").pop()) ||
      "/";
    document.title = dirName + "/";

    const root = document.createElement("div");
    root.id = "md-reader-root";
    root.classList.add("md-dirview");
    root.innerHTML = `
      <div id="md-toolbar">
        <span id="md-title"></span>
        <span id="md-spacer"></span>
        <select id="md-lang-select"></select>
        <button id="md-theme-toggle">🌙</button>
      </div>
      <main id="md-dir-main">
        <nav id="md-crumbs" aria-label="breadcrumb"></nav>
        <div id="md-dir-count"></div>
        <ul id="md-dir-list"></ul>
      </main>
    `;

    document.body.innerHTML = "";
    document.body.appendChild(root);

    root.querySelector("#md-title").textContent = dirName + "/";

    // 面包屑
    const crumbsEl = root.querySelector("#md-crumbs");
    buildCrumbs().forEach((c, i, arr) => {
      const a = document.createElement("a");
      a.href = c.href;
      a.textContent = c.label;
      a.className = "md-crumb";
      crumbsEl.appendChild(a);
      if (i < arr.length - 1) {
        const sep = document.createElement("span");
        sep.className = "md-crumb-sep";
        sep.textContent = "›";
        crumbsEl.appendChild(sep);
      }
    });

    // 计数
    root.querySelector("#md-dir-count").textContent = S.items(
      model.entries.length
    );

    const listEl = root.querySelector("#md-dir-list");

    // 返回上一级（置顶，单独样式）
    if (model.parentHref) {
      const li = document.createElement("li");
      li.className = "md-dir-item md-dir-parent";
      li.innerHTML = `<a href="${model.parentHref}"><span class="md-dir-icon">${ICONS.up}</span><span class="md-dir-name">${S.parent}</span></a>`;
      listEl.appendChild(li);
    }

    if (model.entries.length === 0) {
      const li = document.createElement("li");
      li.className = "md-dir-empty";
      li.textContent = S.empty;
      listEl.appendChild(li);
    }

    model.entries.forEach((e) => {
      const li = document.createElement("li");
      li.className =
        "md-dir-item" +
        (e.isDir ? " md-dir-folder" : "") +
        (e.isMd ? " md-dir-md" : "");
      const icon = e.isDir ? ICONS.dir : e.isMd ? ICONS.md : ICONS.file;
      const a = document.createElement("a");
      a.href = e.href;
      a.innerHTML =
        `<span class="md-dir-icon">${icon}</span>` +
        `<span class="md-dir-name"></span>` +
        `<span class="md-dir-size"></span>` +
        `<span class="md-dir-date"></span>`;
      a.querySelector(".md-dir-name").textContent =
        e.name + (e.isDir ? "/" : "");
      a.querySelector(".md-dir-size").textContent = e.isDir ? "" : e.size;
      a.querySelector(".md-dir-date").textContent = e.modified;
      li.appendChild(a);
      listEl.appendChild(li);
    });

    return {
      themeToggle: root.querySelector("#md-theme-toggle"),
      langSelect: root.querySelector("#md-lang-select"),
    };
  }

  // 语言下拉（复用 i18n 的 SUPPORTED/STRINGS）。
  function setupLangSelect(langSelect) {
    const i18n = MDReader.i18n;
    if (!i18n) {
      langSelect.style.display = "none";
      return;
    }
    langSelect.innerHTML = "";
    i18n.SUPPORTED.forEach((code) => {
      const opt = document.createElement("option");
      opt.value = code;
      opt.textContent = i18n.STRINGS[code].langName;
      langSelect.appendChild(opt);
    });
    langSelect.value = i18n.getLang();
    langSelect.addEventListener("change", (e) => i18n.setLang(e.target.value));
  }

  // 语言切换时只刷新依赖语言的文案节点（计数 / 返回上一级 / 空目录提示），
  // 不整页重建——避免重复绑定主题按钮与语言下拉。
  function refreshDirStrings(model) {
    const S = dirStrings();
    const count = document.getElementById("md-dir-count");
    if (count) count.textContent = S.items(model.entries.length);
    const parent = document.querySelector(".md-dir-parent .md-dir-name");
    if (parent) parent.textContent = S.parent;
    const empty = document.querySelector(".md-dir-empty");
    if (empty) empty.textContent = S.empty;
  }

  /**
   * 入口：若当前是目录页则接管并返回 true，否则返回 false（让 content.js 放行）。
   */
  async function tryBuildDirView() {
    if (!isDirectoryListing()) return false;

    // 先解析原生 DOM，再清空重建（清空后就读不到了）。
    const model = parseListing();

    window.__mdReaderActivated = true;
    document.documentElement.classList.add("md-reader-host");

    if (MDReader.i18n) await MDReader.i18n.init();

    const els = render(model);

    setupLangSelect(els.langSelect);
    MDReader.initTheme(els.themeToggle);

    // 语言变化：仅刷新文案节点，不重建（onChange 注册时会立即回调一次，无害）。
    if (MDReader.i18n) {
      MDReader.i18n.onChange(() => {
        refreshDirStrings(model);
        els.langSelect.value = MDReader.i18n.getLang();
        if (MDReader.refreshThemeButtonLabel) MDReader.refreshThemeButtonLabel();
      });
    }

    return true;
  }

  MDReader.tryBuildDirView = tryBuildDirView;
})();
