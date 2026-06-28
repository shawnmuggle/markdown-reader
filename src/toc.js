/*
 * toc.js — 侧边目录导航
 * 扫描正文 h1-h6 → 生成可点击的嵌套目录 → 滚动时高亮当前章节。
 * 挂到 window.MDReader.buildToc，由 content.js 调用。
 */
(function () {
  "use strict";

  const MDReader = (window.MDReader = window.MDReader || {});

  // 把标题文本转成稳定、唯一的锚点 id（slug）。
  function slugify(text, used) {
    let base =
      text
        .toLowerCase()
        .trim()
        .replace(/[^\w一-龥\- ]/g, "") // 保留中英文/数字/连字符/空格
        .replace(/\s+/g, "-") || "section";
    let slug = base;
    let i = 1;
    while (used.has(slug)) slug = `${base}-${i++}`;
    used.add(slug);
    return slug;
  }

  /**
   * 在 content 容器内生成 TOC，注入到 tocEl。
   * @param {HTMLElement} contentEl 正文容器
   * @param {HTMLElement} tocEl 目录容器（侧栏）
   * @returns {boolean} 是否生成了任何条目
   */
  function buildToc(contentEl, tocEl) {
    const headings = Array.from(
      contentEl.querySelectorAll("h1, h2, h3, h4, h5, h6")
    );
    if (headings.length === 0) {
      tocEl.classList.add("md-toc-empty");
      return false;
    }

    const used = new Set();
    const list = document.createElement("ul");
    list.className = "md-toc-list";

    headings.forEach((h) => {
      if (!h.id) h.id = slugify(h.textContent, used);
      else used.add(h.id);

      const level = Number(h.tagName.substring(1)); // 1..6
      const li = document.createElement("li");
      li.className = `md-toc-item md-toc-l${level}`;

      const a = document.createElement("a");
      a.href = `#${h.id}`;
      a.textContent = h.textContent;
      a.dataset.target = h.id;
      a.addEventListener("click", (e) => {
        e.preventDefault();
        h.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", `#${h.id}`);
      });

      li.appendChild(a);
      list.appendChild(li);
    });

    tocEl.appendChild(list);
    setupScrollSpy(headings, tocEl);
    return true;
  }

  // 滚动时高亮当前可见章节对应的 TOC 条目。
  function setupScrollSpy(headings, tocEl) {
    const linkById = new Map();
    tocEl.querySelectorAll("a[data-target]").forEach((a) => {
      linkById.set(a.dataset.target, a);
    });

    let activeId = null;
    const setActive = (id) => {
      if (id === activeId) return;
      if (activeId && linkById.get(activeId))
        linkById.get(activeId).classList.remove("md-toc-active");
      activeId = id;
      const link = linkById.get(id);
      if (link) {
        link.classList.add("md-toc-active");
        // 让高亮项保持在 TOC 视口内
        link.scrollIntoView({ block: "nearest" });
      }
    };

    // 顶部留出 80px 触发线：标题滚到接近顶部即视为“当前章节”。
    const observer = new IntersectionObserver(
      (entries) => {
        // 取所有当前与触发线相交的标题里位置最靠上的那个
        const visible = entries
          .filter((en) => en.isIntersecting)
          .map((en) => en.target);
        if (visible.length > 0) {
          visible.sort((a, b) => a.offsetTop - b.offsetTop);
          setActive(visible[0].id);
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );

    headings.forEach((h) => observer.observe(h));

    // 初始高亮第一个标题
    if (headings[0]) setActive(headings[0].id);
  }

  MDReader.buildToc = buildToc;
})();
