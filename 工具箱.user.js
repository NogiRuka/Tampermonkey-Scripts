// ==UserScript==
// @name         工具箱
// @namespace    http://tampermonkey.net/
// @version      2026-02-01
// @description  链接新窗口打开，鼠标到右下角显示滚动按钮
// @author       乃木流架
// @icon         https://github.com/NogiRuka/Tampermonkey-Scripts/blob/main/favicons/icons8-code-blocks-480.png?raw=true
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @run-at       document-end
// @license      GPL-3.0 License
// @require      file://D:\Projects\Tampermonkey Scripts\工具箱.user.js
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
  const SCROLL_EXCLUDE_KEY = "nogiruka_scroll_btn_excludes";

  const normalizeHost = (h) => String(h || "").trim().toLowerCase();
  const getScrollExcludedHosts = () => {
    try {
      const raw = localStorage.getItem(SCROLL_EXCLUDE_KEY);
      const arr = JSON.parse(raw || "[]");
      if (!Array.isArray(arr)) return [];
      const out = [];
      arr.forEach(v => {
        const h = normalizeHost(v);
        if (h && !out.includes(h)) out.push(h);
      });
      return out;
    } catch (_) {
      return [];
    }
  };
  const setScrollExcludedHosts = (hosts) => {
    const arr = Array.isArray(hosts) ? hosts.map(normalizeHost).filter(Boolean) : [];
    const uniq = [];
    arr.forEach(h => {
      if (!uniq.includes(h)) uniq.push(h);
    });
    localStorage.setItem(SCROLL_EXCLUDE_KEY, JSON.stringify(uniq));
  };
  const addScrollExcludedHost = (h) => {
    const hostKey = normalizeHost(h);
    if (!hostKey) return false;
    const list = getScrollExcludedHosts();
    if (list.includes(hostKey)) return false;
    list.push(hostKey);
    setScrollExcludedHosts(list);
    return true;
  };
  const isScrollExcludedHost = (h) => getScrollExcludedHosts().includes(normalizeHost(h));

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

    .nogiruka-context-menu {
      position: fixed;
      z-index: 10000;
      min-width: 240px;
      padding: 6px;
      border-radius: 10px;
      background: rgba(20, 20, 24, 0.92);
      border: 1px solid rgba(165,183,255,.35);
      box-shadow: 0 10px 30px rgba(0,0,0,.35);
      color: #fff;
      font-size: 13px;
      display: none;
      backdrop-filter: blur(8px);
    }
    .nogiruka-context-menu .nogiruka-menu-title {
      padding: 6px 10px;
      opacity: .85;
      font-size: 12px;
    }
    .nogiruka-context-menu .nogiruka-menu-item {
      padding: 8px 10px;
      border-radius: 8px;
      cursor: pointer;
      user-select: none;
    }
    .nogiruka-context-menu .nogiruka-menu-item:hover {
      background: rgba(165,183,255,.18);
    }
  `);

  /** ====== 滚动按钮功能 ====== */
  function scrollBtns() {
    if (isScrollExcludedHost(location.hostname)) {
      log(`已在排除名单：${location.hostname}`, "Scroll");
      return;
    }

    const scrollTo = top => window.scrollTo({ top, behavior: "smooth" });
    const hideMenu = () => {
      const menu = document.getElementById("nogiruka-scroll-menu");
      if (!menu) return;
      menu.style.display = "none";
    };
    const showMenu = (x, y, container, onMouseMove) => {
      let menu = document.getElementById("nogiruka-scroll-menu");
      if (!menu) {
        menu = document.createElement("div");
        menu.id = "nogiruka-scroll-menu";
        menu.className = "nogiruka-context-menu";
        menu.innerHTML = `
          <div class="nogiruka-menu-title"></div>
          <div class="nogiruka-menu-item" data-action="exclude">将当前域名加入排除名单</div>
          <div class="nogiruka-menu-item" data-action="cancel">取消</div>
        `;
        document.body.appendChild(menu);

        document.addEventListener("click", (e) => {
          const t = e.target;
          if (!(t instanceof Element)) return;
          if (menu.contains(t)) return;
          hideMenu();
        }, true);
        document.addEventListener("keydown", (e) => {
          if (e.key === "Escape") hideMenu();
        }, true);
        window.addEventListener("scroll", () => hideMenu(), true);
      }

      const title = menu.querySelector(".nogiruka-menu-title");
      if (title) title.textContent = `域名：${location.hostname}`;

      menu.onclick = (e) => {
        const t = e.target;
        if (!(t instanceof Element)) return;
        const action = t.getAttribute("data-action");
        if (!action) return;
        if (action === "exclude") {
          const added = addScrollExcludedHost(location.hostname);
          hideMenu();
          if (added) {
            try {
              if (typeof document.removeEventListener === "function" && onMouseMove) {
                document.removeEventListener("mousemove", onMouseMove);
              }
            } catch (_) {}
            try {
              if (container && container.parentNode) container.parentNode.removeChild(container);
            } catch (_) {}
            log(`已加入排除名单：${location.hostname}`, "Scroll");
          } else {
            log(`已在排除名单：${location.hostname}`, "Scroll");
          }
          return;
        }
        if (action === "cancel") {
          hideMenu();
        }
      };

      const padding = 8;
      menu.style.display = "block";
      const rect = menu.getBoundingClientRect();
      const maxX = Math.max(padding, window.innerWidth - rect.width - padding);
      const maxY = Math.max(padding, window.innerHeight - rect.height - padding);
      menu.style.left = `${Math.min(x, maxX)}px`;
      menu.style.top = `${Math.min(y, maxY)}px`;
    };

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
    const onMouseMove = e => {
      const fromRight = window.innerWidth - e.clientX;
      const fromBottom = window.innerHeight - e.clientY;
      
      // 检查是否在弹出框内
      const isInModal = e.target.closest('.modal, .popup, .dialog, .overlay, .lightbox, [role="dialog"], [aria-modal="true"]');
      const isInFixedElement = e.target.closest('[style*="position: fixed"], [style*="position:fixed"]');
      
      // 只有在主页面且鼠标在右下角时才显示
      const shouldShow = !isInModal && !isInFixedElement && fromRight < 300 && fromBottom < 300;
      container.classList.toggle("active", shouldShow);
    };
    document.addEventListener("mousemove", onMouseMove);

    container.querySelectorAll(".nogiruka-scroll-btn").forEach(btn => {
      btn.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        showMenu(e.clientX, e.clientY, container, onMouseMove);
      }, true);
    });

    log("右下角触发显示滚动按钮已启用", "Scroll");
  }

  /** ====== 修复链接（新窗口打开） ====== */
  function fixLinks() {
    const update = () => {
      let count = 0;
      document.querySelectorAll("a:not([data-nogiruka-fixed])").forEach(a => {
        if (host.includes("4horlover.com")) {
          if (a.closest("#masthead") || a.closest("nav.navigation.pagination")) {
            a.dataset.nogirukaFixed = "true";
            return;
          }
        }
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.dataset.nogirukaFixed = "true";
        count++;
      });
      if (count) log(`已更新 ${count} 个链接`, "Links");
    };
    requestIdleCallback(update);
    new MutationObserver(() => requestIdleCallback(update))
      .observe(document.body, { childList: true, subtree: true });
  }



  /** ====== Bilibili 创作中心搜索历史 ====== */
  function initBilibiliSearchHistory() {
    log("初始化 Bilibili 搜索历史功能", "Bilibili");

    // 样式
    GM_addStyle(`
      .nogiruka-search-history {
        position: absolute;
        top: 100%;
        left: 0;
        width: 100%;
        background: #fff;
        border: 1px solid #e7e7e7;
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        z-index: 9999;
        max-height: 300px;
        overflow-y: auto;
        display: none;
      }
      .nogiruka-search-history.active {
        display: block;
      }
      .nogiruka-history-item {
        padding: 8px 12px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #333;
        font-size: 14px;
        transition: background-color 0.2s;
      }
      .nogiruka-history-item:hover {
        background-color: #f4f4f4;
      }
      .nogiruka-history-delete {
        color: #999;
        font-size: 16px;
        padding: 0 4px;
        line-height: 1;
        opacity: 0.6;
        transition: opacity 0.2s, color 0.2s;
      }
      .nogiruka-history-delete:hover {
        color: #ff4d4f;
        opacity: 1;
      }
      .nogiruka-history-clear {
        padding: 8px 12px;
        text-align: center;
        color: #999;
        border-top: 1px solid #eee;
        cursor: pointer;
        font-size: 12px;
        transition: background-color 0.2s;
      }
      .nogiruka-history-clear:hover {
        color: #666;
        background-color: #f9f9f9;
      }
    `);

    const STORAGE_KEY = 'nogiruka_bili_search_history';
    
    // 获取历史记录
    const getHistory = () => {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      } catch (e) {
        return [];
      }
    };

    // 保存历史记录
    const saveHistory = (keyword) => {
      if (!keyword || !keyword.trim()) return;
      keyword = keyword.trim();
      let history = getHistory();
      // 移除已存在的相同关键词
      history = history.filter(k => k !== keyword);
      // 添加到头部
      history.unshift(keyword);
      // 限制数量
      if (history.length > 20) history.pop();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    };

    // 删除单条历史
    const deleteHistory = (keyword) => {
      let history = getHistory();
      history = history.filter(k => k !== keyword);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    };

    // 清空历史
    const clearHistory = () => {
      localStorage.removeItem(STORAGE_KEY);
    };

    // 渲染历史记录列表
    const renderHistory = (container, inputElement) => {
      const history = getHistory();
      container.innerHTML = '';
      
      if (history.length === 0) {
        container.classList.remove('active');
        return;
      }

      // 更新位置
      const updatePosition = () => {
        const rect = inputElement.parentElement.getBoundingClientRect();
        container.style.top = `${rect.bottom + window.scrollY}px`;
        container.style.left = `${rect.left + window.scrollX}px`;
        container.style.width = `${rect.width}px`;
      };
      updatePosition();

      history.forEach(keyword => {
        const item = document.createElement('div');
        item.className = 'nogiruka-history-item';
        
        const text = document.createElement('span');
        text.textContent = keyword;
        
        const delBtn = document.createElement('span');
        delBtn.className = 'nogiruka-history-delete';
        delBtn.innerHTML = '×';
        delBtn.title = '删除';
        delBtn.onclick = (e) => {
          e.stopPropagation();
          deleteHistory(keyword);
          renderHistory(container, inputElement);
          inputElement.focus();
        };

        item.onclick = () => {
          inputElement.value = keyword;
          // 触发 Vue 的 input 事件更新 v-model
          inputElement.dispatchEvent(new Event('input', { bubbles: true }));
          // 触发搜索 (模拟回车)
          inputElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, keyCode: 13 }));
          // 尝试点击搜索按钮
          const searchBtn = inputElement.parentElement.querySelector('.search-input');
          if (searchBtn) searchBtn.click();
          
          container.classList.remove('active');
        };

        item.appendChild(text);
        item.appendChild(delBtn);
        container.appendChild(item);
      });

      // 清空按钮
      if (history.length > 0) {
        const clearBtn = document.createElement('div');
        clearBtn.className = 'nogiruka-history-clear';
        clearBtn.textContent = '清空历史记录';
        clearBtn.onclick = (e) => {
            e.stopPropagation();
            if(confirm('确定要清空所有搜索历史吗？')) {
                clearHistory();
                renderHistory(container, inputElement);
                inputElement.focus();
            }
        };
        container.appendChild(clearBtn);
      }
      
      container.classList.add('active');
    };

    // 查找并处理搜索框
    const observeSearchInput = () => {
      const observer = new MutationObserver(() => {
        const wrapper = document.querySelector('.bcc-search-input-wrapper');
        const input = document.querySelector('.bcc-search-input-wrapper input.bcc-search-input');
        
        if (wrapper && input && !wrapper.dataset.historyInited) {
          wrapper.dataset.historyInited = 'true';
          // wrapper.style.position = 'relative'; // 移除这行，避免影响布局

          // 创建下拉框容器，挂载到 body
          const historyContainer = document.createElement('div');
          historyContainer.className = 'nogiruka-search-history';
          document.body.appendChild(historyContainer);

          // 监听输入框事件
          input.addEventListener('focus', () => {
            renderHistory(historyContainer, input);
          });
          
          input.addEventListener('input', () => {
             // 输入时隐藏历史
             historyContainer.classList.remove('active');
          });
          
          // 滚动时隐藏
          window.addEventListener('scroll', () => {
             historyContainer.classList.remove('active');
          }, true);
          window.addEventListener('resize', () => {
             historyContainer.classList.remove('active');
          });

          // 延迟隐藏，以便点击
          input.addEventListener('blur', () => {
            setTimeout(() => {
              historyContainer.classList.remove('active');
            }, 200);
          });

          // 监听回车保存
          input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              saveHistory(input.value);
            }
          });

          // 监听搜索按钮点击
          const searchIcon = wrapper.querySelector('i.search-input');
          if (searchIcon) {
            searchIcon.addEventListener('click', () => {
              saveHistory(input.value);
            });
          }
          
          log("已注入搜索历史功能", "Bilibili");
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    };

    observeSearchInput();
  }

  /** ====== 主入口 ====== */
  // 特定网站功能
  if (host.includes("google.com") || host.includes("gaytor.rent") || host.includes("4horlover.com")) {
    fixLinks();
  }

  if (host === "member.bilibili.com") {
    initBilibiliSearchHistory();
  }

  // 通用功能（所有网站适用）
  scrollBtns();

})();
