/*
 * theme.js — 深 / 浅色切换
 * 在 <html data-theme="light|dark"> 上切换；偏好存 chrome.storage.local。
 * 首次无偏好时跟随系统配色。挂到 window.MDReader.initTheme。
 */
(function () {
  "use strict";

  const MDReader = (window.MDReader = window.MDReader || {});
  const STORAGE_KEY = "md-reader-theme";

  function systemPrefersDark() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    // 主题变化后重渲染 mermaid，使图表配色跟随。
    const content = document.getElementById("md-content");
    if (content && MDReader.renderMermaid) {
      // 清掉已渲染的 svg，让 mermaid 用新主题重画
      content.querySelectorAll(".mermaid").forEach((el) => {
        if (el.dataset.source) {
          el.removeAttribute("data-processed");
          el.innerHTML = el.dataset.source;
        }
      });
      MDReader.renderMermaid(content);
    }
  }

  // chrome.storage 在 content script 中可用（manifest 已申请 storage 权限）。
  function loadSavedTheme() {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.get(STORAGE_KEY, (res) => {
          resolve(res && res[STORAGE_KEY]);
        });
      } catch (e) {
        resolve(null);
      }
    });
  }

  function saveTheme(theme) {
    try {
      chrome.storage.local.set({ [STORAGE_KEY]: theme });
    } catch (e) {
      /* storage 不可用时忽略，不影响切换本身 */
    }
  }

  /**
   * 初始化主题并绑定切换按钮。
   * @param {HTMLElement} toggleBtn 顶部 ☀/🌙 按钮
   */
  async function initTheme(toggleBtn) {
    const saved = await loadSavedTheme();
    const initial = saved || (systemPrefersDark() ? "dark" : "light");
    applyTheme(initial);
    updateButton(toggleBtn, initial);

    toggleBtn.addEventListener("click", () => {
      const current =
        document.documentElement.getAttribute("data-theme") === "dark"
          ? "dark"
          : "light";
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      updateButton(toggleBtn, next);
      saveTheme(next);
    });
  }

  let themeBtnRef = null;

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark"
      : "light";
  }

  function updateButton(btn, theme) {
    themeBtnRef = btn;
    // 显示“切换到的目标”图标：当前暗色 → 显示 ☀（点了变亮）。
    btn.textContent = theme === "dark" ? "☀️" : "🌙";
    // 文案走 i18n；i18n 未就绪时退化到中文兜底。
    const i18n = MDReader.i18n;
    const label = i18n
      ? theme === "dark"
        ? i18n.t("themeToLight")
        : i18n.t("themeToDark")
      : theme === "dark"
      ? "切换到浅色"
      : "切换到深色";
    btn.title = label;
    btn.setAttribute("aria-label", label);
  }

  // 供语言切换时调用：用当前主题状态重刷按钮文案。
  function refreshThemeButtonLabel() {
    if (themeBtnRef) updateButton(themeBtnRef, currentTheme());
  }

  MDReader.initTheme = initTheme;
  MDReader.refreshThemeButtonLabel = refreshThemeButtonLabel;
})();
