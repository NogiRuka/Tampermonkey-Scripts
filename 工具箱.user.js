// ==UserScript==
// @name         工具箱
// @namespace    http://tampermonkey.net/
// @version      2025-08-30
// @description  链接新窗口打开，鼠标到右下角显示滚动按钮，炫酷光标特效 + 可通过油猴菜单切换光标样式
// @author       乃木流架
// @icon         https://youke1.picui.cn/s1/2025/08/30/68b1f11b8db08.png
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @run-at       document-end
// @license      GPL-3.0 License
// ==/UserScript==

(function () {
  "use strict";

  /** ====== 日志工具 ====== */
  const log = (msg, ctx = "") => {
    console.log(`%c[乃木流架]%c${ctx ? `[${ctx}]` : ""} ${msg}`,
      "color:#a5b7ff;font-weight:bold;",
      "color:inherit;font-weight:normal;"
    );
  };

  const host = location.hostname;

  /** ====== 样式 ====== */
  GM_addStyle(`
    .nogiruka-btn-container {
      position: fixed;
      right: 20px;
      bottom: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      z-index: 9999;
      opacity: 0;
      pointer-events: none;
      transition: opacity .3s ease;
    }
    .nogiruka-btn-container.active {
      opacity: 1;
      pointer-events: auto;
    }
    .nogiruka-scroll-btn {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: #a5b7ff;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 0 4px rgba(180,160,255,.25);
      cursor: pointer;
      transition: transform .25s ease, box-shadow .25s ease;
    }
    .nogiruka-scroll-btn:hover {
      transform: scale(1.15) rotate(3deg);
      box-shadow: 0 0 14px 5px rgba(165,183,255,.65);
    }
    .nogiruka-scroll-btn svg {
      width: 12px;
    }
    .nogiruka-scroll-btn svg path {
      fill: #fff;
    }
  `);

  /** ====== 滚动按钮功能 ====== */
  function scrollBtns() {
    const scrollTo = top => window.scrollTo({ top, behavior: "smooth" });

    const makeBtn = (dir, fn) => {
      const b = document.createElement("button");
      b.className = "nogiruka-scroll-btn";
      b.dataset.direction = dir;
      b.innerHTML = `<svg viewBox="0 0 384 512"><path d="${
        dir === "up"
          ? "M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"
          : "M169.4 470.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 370.8V64c0-17.7-14.3-32-32-32s-32 14.3-32 32v306.8L54.6 246.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5 32.8 0 45.3l160 160z"
      }"></path></svg>`;
      b.onclick = e => {
        e.stopPropagation();
        fn();
      };
      return b;
    };

    const container = document.createElement("div");
    container.className = "nogiruka-btn-container";
    container.appendChild(makeBtn("up", () => scrollTo(0)));
    container.appendChild(makeBtn("down", () => scrollTo(document.documentElement.scrollHeight)));
    document.body.appendChild(container);

    // 右下角触发显示
    document.addEventListener("mousemove", e => {
      const fromRight = window.innerWidth - e.clientX;
      const fromBottom = window.innerHeight - e.clientY;
      container.classList.toggle("active", fromRight < 300 && fromBottom < 300);
    });

    log("右下角触发显示滚动按钮已启用", "Scroll");
  }

  /** ====== 修复 Google 搜索链接（新窗口打开） ====== */
  function fixGoogleLinks() {
    const update = () => {
      let count = 0;
      document.querySelectorAll("a:not([data-nogiruka-fixed])").forEach(a => {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.dataset.nogirukaFixed = "true";
        count++;
      });
      if (count) log(`已更新 ${count} 个链接`, "Google");
    };
    requestIdleCallback(update);
    new MutationObserver(() => requestIdleCallback(update))
      .observe(document.body, { childList: true, subtree: true });
  }

  /** ====== 光标特效配置 ====== */
  const cursorConfig = {
    enabled: true, // 是否开启光标特效
    type: "rainbowCursor",
    options: {
      length: 20,
      colors: [
        "#FE0000",
        "#FD8C00",
        "#FFE500",
        "#119F0B",
        "#0644B3",
        "#C22EDC",
      ],
      size: 3
    }
  };

  let _nogirukaCursorInstance = null;

  /** ====== 应用光标特效 ====== */
  async function applyCursorEffect() {
    try {
      const module = await import("https://unpkg.com/cursor-effects@latest/dist/esm.js");
      if (_nogirukaCursorInstance?.destroy) _nogirukaCursorInstance.destroy();
      if (cursorConfig.enabled && module[cursorConfig.type]) {
        _nogirukaCursorInstance = new module[cursorConfig.type](cursorConfig.options);
        log(`光标已启用: ${cursorConfig.type}`, "Cursor");
      } else {
        _nogirukaCursorInstance = null;
        log("光标特效已关闭", "Cursor");
      }
    } catch (e) {
      log("光标特效加载失败: " + e, "Cursor");
    }
  }

  /** ====== 注册油猴菜单命令切换光标 ====== */
  function registerCursorMenu() {
    GM_registerMenuCommand(`${cursorConfig.enabled ? "关闭" : "开启"}光标特效`, () => {
      cursorConfig.enabled = !cursorConfig.enabled;
      applyCursorEffect();
      registerCursorMenu(); // 更新菜单显示文字
    });

    const types = ["rainbowCursor", "fairyDustCursor", "ghostCursor", "bubbleCursor", "emojiCursor"];
    types.forEach(type => {
      GM_registerMenuCommand(`切换光标: ${type}`, () => {
        cursorConfig.type = type;
        applyCursorEffect();
      });
    });
  }

  /** ====== 主入口 ====== */
  if (host === "www.google.com") {
    fixGoogleLinks();
  } else {
    scrollBtns();
    applyCursorEffect();
    registerCursorMenu();
  }

})();
