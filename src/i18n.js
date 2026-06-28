/*
 * i18n.js — 界面文案多语言（中文 / English）
 * 集中管理 UI 文案与当前语言。首次跟随浏览器语言，选择后存 chrome.storage.local。
 * 挂到 window.MDReader.i18n，由 content.js / theme.js 取词。
 */
(function () {
  "use strict";

  const MDReader = (window.MDReader = window.MDReader || {});
  const STORAGE_KEY = "md-reader-lang";

  const STRINGS = {
    zh: {
      langName: "中文",
      tocToggle: "折叠 / 展开目录",
      tocLabel: "目录",
      themeToLight: "切换到浅色",
      themeToDark: "切换到深色",
      langToggle: "界面语言",
    },
    en: {
      langName: "English",
      tocToggle: "Collapse / expand outline",
      tocLabel: "Table of contents",
      themeToLight: "Switch to light theme",
      themeToDark: "Switch to dark theme",
      langToggle: "Interface language",
    },
  };

  const SUPPORTED = ["zh", "en"];

  let current = "en";
  const listeners = [];

  // 把 navigator.language（如 zh-CN / en-US）归一到受支持的语言码。
  function detectFromBrowser() {
    const langs = (navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language || "en"]
    ).map((l) => String(l).toLowerCase());
    for (const l of langs) {
      if (l.startsWith("zh")) return "zh";
      if (l.startsWith("en")) return "en";
    }
    return "en";
  }

  function t(key) {
    const table = STRINGS[current] || STRINGS.en;
    return table[key] != null ? table[key] : STRINGS.en[key] || key;
  }

  function getLang() {
    return current;
  }

  function setLang(lang) {
    if (!SUPPORTED.includes(lang)) return;
    current = lang;
    document.documentElement.setAttribute("lang", lang === "zh" ? "zh-CN" : "en");
    save(lang);
    listeners.forEach((fn) => {
      try {
        fn(lang);
      } catch (e) {
        /* 单个监听器出错不影响其他 */
      }
    });
  }

  // 注册语言变化回调；注册时立即用当前语言回调一次，方便初始化文案。
  function onChange(fn) {
    listeners.push(fn);
    try {
      fn(current);
    } catch (e) {}
  }

  function load() {
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

  function save(lang) {
    try {
      chrome.storage.local.set({ [STORAGE_KEY]: lang });
    } catch (e) {
      /* storage 不可用时忽略 */
    }
  }

  // 初始化：读已存偏好，没有就跟随浏览器。返回最终语言码。
  async function init() {
    const saved = await load();
    current = SUPPORTED.includes(saved) ? saved : detectFromBrowser();
    document.documentElement.setAttribute("lang", current === "zh" ? "zh-CN" : "en");
    return current;
  }

  MDReader.i18n = {
    SUPPORTED,
    STRINGS,
    t,
    getLang,
    setLang,
    onChange,
    init,
  };
})();
