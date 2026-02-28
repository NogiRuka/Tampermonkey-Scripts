// ==UserScript==
// @name         Pornolab 增强 - 预览图+下载
// @name:en      Pornolab Enhanced - Previews + Downloads
// @namespace    http://tampermonkey.net/
// @version      2026-02-01
// @description  给 Pornolab 帖子列表自动加载预览图，添加一键下载种子按钮，支持查看原图及多语言切换。🤓🖼️💦
// @description:en Automatically loads preview images for post lists, adds a one-click download button, and supports original image viewing and multilingual switching. 🤓🖼️💦
// @author       乃木流架
// @icon         https://github.com/NogiRuka/Tampermonkey-Scripts/blob/main/favicons/pornolab.jpg?raw=true
// @match        https://pornolab.net/forum/tracker.php*
// @match        https://pornolab.net/forum/viewforum.php*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @connect      pornolab.net
// @license      GPL-3.0 License
// @require      file://D:\Projects\Tampermonkey Scripts\pornolab.user.js
// ==/UserScript==

(function () {
  'use strict';

  /* ---------- 语言配置 / Language Config ---------- */
  // 获取用户设置的语言，如果没有设置则默认为 'auto'
  // Get user preferred language, default is 'auto'
  const savedLang = GM_getValue('lang', 'auto');
  const browserLang = navigator.language.startsWith('zh') ? 'zh' : 'en';
  const lang = savedLang === 'auto' ? browserLang : savedLang;
  
  // 快捷键设置 / Shortcut Config
  let shortcut = GM_getValue('shortcut', 'ctrl+p');

  const savedImgSize = GM_getValue('imgSize', '200');
  const openInNewTab = GM_getValue('openInNewTab', true);

  const t = {
    zh: {
      settings: '⚙️ 设置',
      language: '语言 / Language',
      shortcutSettings: '快捷键设置',
      imgSizeSettings: '预览图大小',
      linkSettings: '链接设置',
      openInNewTab: '在新标签页打开帖子链接',
      sizeSmall: '小 (150px)',
      sizeMedium: '中 (200px)',
      sizeLarge: '大 (300px)',
      sizeOriginal: '原图 (500px)',
      clickToSet: '点击设置',
      pressKey: '请按键...',
      close: '关闭',
      saveAndReload: '保存并刷新',
      start: '[预览图脚本] 🟣 启动中...',
      detected: (count, type) => `[预览图脚本] 🎯 检测到 ${count} 条帖子，当前页面类型: ${type}`,
      searchResult: '搜索结果',
      normalPage: '普通页面',
      parsingLink: (index, link) => `[第${index}条] 🔗 解析链接: ${link}`,
      skipContentNotFound: (link) => `[跳过] ❌ 找不到内容区: ${link}`,
      contentFound: (count) => `[内容分析] ✅ 找到 ${count} 张图`,
      downloadTorrent: '🍑 下载种子',
      limitReached: '[限制] 🚫 已经20张，跳过剩余的图片',
      imgSize: (url, w, h) => `[图尺寸] ${url} = ${w}x${h}`,
      imgTooSmall: (url) => `[图忽略] ❌ 尺寸太小 ${url}`,
      loadFailed: (url) => `[加载失败] 💩 ${url}`,
      requestFailed: (index, link) => `[第${index}条] ❌ 请求失败: ${link}`
    },
    en: {
      settings: '⚙️ Settings',
      language: 'Language / 语言',
      shortcutSettings: 'Shortcut Settings',
      imgSizeSettings: 'Preview Image Size',
      linkSettings: 'Link Settings',
      openInNewTab: 'Open post links in new tab',
      sizeSmall: 'Small (150px)',
      sizeMedium: 'Medium (200px)',
      sizeLarge: 'Large (300px)',
      sizeOriginal: 'Original (500px)',
      clickToSet: 'Click to Set',
      pressKey: 'Press Key...',
      close: 'Close',
      saveAndReload: 'Save & Reload',
      start: '[Preview Script] 🟣 Starting...',
      detected: (count, type) => `[Preview Script] 🎯 Detected ${count} posts, Page Type: ${type}`,
      searchResult: 'Search Results',
      normalPage: 'Normal Page',
      parsingLink: (index, link) => `[#${index}] 🔗 Parsing link: ${link}`,
      skipContentNotFound: (link) => `[Skip] ❌ Content area not found: ${link}`,
      contentFound: (count) => `[Analysis] ✅ Found ${count} images`,
      downloadTorrent: '🍑 Download Torrent',
      limitReached: '[Limit] 🚫 20 images reached, skipping the rest',
      imgSize: (url, w, h) => `[Size] ${url} = ${w}x${h}`,
      imgTooSmall: (url) => `[Ignored] ❌ Size too small ${url}`,
      loadFailed: (url) => `[Load Failed] 💩 ${url}`,
      requestFailed: (index, link) => `[#${index}] ❌ Request failed: ${link}`
    }
  }[lang];

  // 全局快捷键监听 / Global Shortcut Listener
  document.addEventListener('keydown', (e) => {
      // 忽略输入框中的按键
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      const keys = [];
      if (e.ctrlKey) keys.push('ctrl');
      if (e.altKey) keys.push('alt');
      if (e.shiftKey) keys.push('shift');
      if (e.metaKey) keys.push('meta');
      
      if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;
      
      keys.push(e.key.toLowerCase());
      const pressed = keys.join('+');
      
      if (pressed === shortcut) {
          e.preventDefault();
          openSettings();
      }
  });

  /* ---------- 设置面板 / Settings Panel ---------- */
  function openSettings() {
    // 如果面板已存在，则不再创建
    if (document.querySelector('#dan-settings-panel')) return;

    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.id = 'dan-settings-panel';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0,0,0,0.6);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.2s;
    `;

    // 创建面板主体
    const panel = document.createElement('div');
    panel.style.cssText = `
      background: #222;
      color: #eee;
      width: 400px;
      border-radius: 12px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.5);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transform: scale(0.95);
      transition: transform 0.2s;
    `;

    // 标题栏
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 16px 24px;
      background: linear-gradient(to right, #2c2c2c, #252525);
      border-bottom: 1px solid #3a3a3a;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    const title = document.createElement('h3');
    title.textContent = t.settings;
    title.style.cssText = 'margin: 0; font-size: 18px; font-weight: 600; color: #fff; letter-spacing: 0.5px;';
    
    // 关闭按钮 (X)
    const closeIcon = document.createElement('div');
    closeIcon.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;
    closeIcon.style.cssText = `
      cursor: pointer; 
      opacity: 0.5; 
      padding: 6px; 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center;
      transition: all 0.2s;
    `;
    closeIcon.onmouseover = () => {
        closeIcon.style.opacity = '1';
        closeIcon.style.backgroundColor = 'rgba(255,255,255,0.1)';
    };
    closeIcon.onmouseout = () => {
        closeIcon.style.opacity = '0.5';
        closeIcon.style.backgroundColor = 'transparent';
    };
    closeIcon.onclick = closePanel;

    header.appendChild(title);
    header.appendChild(closeIcon);

    // 内容区域
    const content = document.createElement('div');
    content.style.cssText = 'padding: 20px; max-height: 60vh; overflow-y: auto;';

    // --- 辅助函数：创建设置组 ---
    function createSection(titleText) {
        const section = document.createElement('div');
        section.style.marginBottom = '24px';
        const sectionTitle = document.createElement('div');
        sectionTitle.textContent = titleText;
        sectionTitle.style.cssText = 'font-size: 13px; color: #ff69b4; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; font-weight: 700;';
        section.appendChild(sectionTitle);
        return section;
    }

    // --- 1. 语言设置组 ---
    const langSection = createSection(t.language);
    
    const langOptions = [
        { label: '🇨🇳 中文', value: 'zh' },
        { label: '🇺🇸 English', value: 'en' }
    ];

    const langContainer = document.createElement('div');
    langContainer.style.cssText = `
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
    `;

    langOptions.forEach(opt => {
        const label = document.createElement('label');
        label.style.cssText = `
            display: flex; 
            align-items: center; 
            padding: 12px 16px; 
            background: #2a2a2a; 
            border-radius: 8px; 
            cursor: pointer;
            border: 1px solid #3a3a3a;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        `;
        // 选中状态样式
        if (lang === opt.value) {
            label.style.borderColor = '#ff69b4';
            label.style.background = 'rgba(255, 105, 180, 0.1)';
            label.style.boxShadow = '0 0 10px rgba(255, 105, 180, 0.1)';
        }

        label.onmouseover = () => { if (lang !== opt.value) label.style.background = '#333'; };
        label.onmouseout = () => { if (lang !== opt.value) label.style.background = '#2a2a2a'; };

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'dan-lang-setting';
        input.value = opt.value;
        input.checked = lang === opt.value;
        input.style.marginRight = '12px';
        input.style.accentColor = '#ff69b4';
        
        // 点击即保存
        input.onchange = () => {
             GM_setValue('lang', opt.value);
             location.reload();
        };

        label.appendChild(input);
        label.appendChild(document.createTextNode(opt.label));
        langContainer.appendChild(label);
    });

    langSection.appendChild(langContainer);
    content.appendChild(langSection);

    // --- 2. 快捷键设置组 ---
    const shortcutSection = createSection(t.shortcutSettings);
    
    const shortcutContainer = document.createElement('div');
    shortcutContainer.style.cssText = `
        display: flex; 
        align-items: center; 
        justify-content: space-between;
        padding: 12px 16px; 
        background: #2a2a2a; 
        border-radius: 8px; 
        border: 1px solid #3a3a3a;
    `;
    
    const shortcutLabel = document.createElement('span');
    shortcutLabel.textContent = shortcut.toUpperCase();
    shortcutLabel.style.cssText = 'font-family: monospace; font-size: 14px; background: #444; padding: 4px 8px; border-radius: 4px; color: #fff;';
    
    const setBtn = document.createElement('button');
    setBtn.textContent = t.clickToSet;
    setBtn.style.cssText = `
        padding: 6px 12px;
        background: #ff69b4;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        transition: all 0.2s;
    `;
    
    setBtn.onclick = () => {
        setBtn.textContent = t.pressKey;
        setBtn.disabled = true;
        setBtn.style.background = '#666';
        
        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;

            const keys = [];
            if (e.ctrlKey) keys.push('ctrl');
            if (e.altKey) keys.push('alt');
            if (e.shiftKey) keys.push('shift');
            if (e.metaKey) keys.push('meta');
            keys.push(e.key.toLowerCase());
            
            const newShortcut = keys.join('+');
            GM_setValue('shortcut', newShortcut);
            shortcut = newShortcut; 
            
            shortcutLabel.textContent = newShortcut.toUpperCase();
            setBtn.textContent = t.clickToSet;
            setBtn.disabled = false;
            setBtn.style.background = '#ff69b4';
            
            document.removeEventListener('keydown', handler, true);
        };
        
        document.addEventListener('keydown', handler, true);
    };

    shortcutContainer.appendChild(shortcutLabel);
    shortcutContainer.appendChild(setBtn);
    shortcutSection.appendChild(shortcutContainer);
    content.appendChild(shortcutSection);

    // --- 3. 图片尺寸设置组 ---
    const imgSizeSection = createSection(t.imgSizeSettings);
    
    const sizeOptions = [
        { label: t.sizeSmall, value: '150' },
        { label: t.sizeMedium, value: '200' },
        { label: t.sizeLarge, value: '300' },
        { label: t.sizeOriginal, value: '500' }
    ];

    const sizeContainer = document.createElement('div');
    sizeContainer.style.cssText = `
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
    `;

    sizeOptions.forEach(opt => {
        const label = document.createElement('label');
        label.style.cssText = `
            display: flex; 
            align-items: center; 
            padding: 10px; 
            background: #2a2a2a; 
            border-radius: 8px; 
            cursor: pointer;
            border: 1px solid #3a3a3a;
            transition: all 0.2s;
        `;
        
        if (savedImgSize === opt.value) {
            label.style.borderColor = '#ff69b4';
            label.style.background = 'rgba(255, 105, 180, 0.1)';
        }

        label.onmouseover = () => { if (savedImgSize !== opt.value) label.style.background = '#333'; };
        label.onmouseout = () => { if (savedImgSize !== opt.value) label.style.background = '#2a2a2a'; };

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'dan-img-size';
        input.value = opt.value;
        input.checked = savedImgSize === opt.value;
        input.style.marginRight = '8px';
        input.style.accentColor = '#ff69b4';
        
        input.onchange = () => {
             GM_setValue('imgSize', opt.value);
             location.reload();
        };

        label.appendChild(input);
        label.appendChild(document.createTextNode(opt.label));
        sizeContainer.appendChild(label);
    });
    
    imgSizeSection.appendChild(sizeContainer);
    content.appendChild(imgSizeSection);

    // --- 4. 链接设置组 ---
    const linkSection = createSection(t.linkSettings);
    
    const linkLabel = document.createElement('label');
    linkLabel.style.cssText = `
        display: flex;
        align-items: center;
        padding: 12px 16px;
        background: #2a2a2a;
        border-radius: 8px;
        cursor: pointer;
        border: 1px solid #3a3a3a;
        justify-content: space-between;
        transition: all 0.2s;
    `;
    linkLabel.onmouseover = () => { linkLabel.style.background = '#333'; };
    linkLabel.onmouseout = () => { linkLabel.style.background = '#2a2a2a'; };
    
    const linkText = document.createElement('span');
    linkText.textContent = t.openInNewTab;
    
    const toggleSwitch = document.createElement('div');
    toggleSwitch.style.cssText = `
        width: 40px;
        height: 20px;
        background: ${openInNewTab ? '#ff69b4' : '#555'};
        border-radius: 20px;
        position: relative;
        transition: background 0.3s;
    `;
    
    const toggleKnob = document.createElement('div');
    toggleKnob.style.cssText = `
        width: 16px;
        height: 16px;
        background: white;
        border-radius: 50%;
        position: absolute;
        top: 2px;
        left: ${openInNewTab ? '22px' : '2px'};
        transition: left 0.3s;
    `;
    
    toggleSwitch.appendChild(toggleKnob);
    
    linkLabel.onclick = (e) => {
        e.preventDefault();
        const currentVal = GM_getValue('openInNewTab', true);
        GM_setValue('openInNewTab', !currentVal);
        location.reload();
    };
    
    linkLabel.appendChild(linkText);
    linkLabel.appendChild(toggleSwitch);
    linkSection.appendChild(linkLabel);
    content.appendChild(linkSection);

    // 组装面板
    panel.appendChild(header);
    panel.appendChild(content);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    // 动画入场
    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        panel.style.transform = 'scale(1)';
    });

    // 关闭函数
    function closePanel() {
        overlay.style.opacity = '0';
        panel.style.transform = 'scale(0.95)';
        setTimeout(() => overlay.remove(), 200);
    }

    // 点击背景关闭
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closePanel();
    });
  }

  // 注册油猴菜单 / Register Tampermonkey menu
  GM_registerMenuCommand(t.settings, openSettings);

  function showToast(message) {
    let container = document.querySelector('#dan-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'dan-toast-container';
      container.style.cssText = `
        position: fixed;
        left: 50%;
        top: 16px;
        transform: translateX(-50%);
        z-index: 99999;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      max-width: 80vw;
      background: rgba(20,20,20,0.96);
      color: #f5f5f5;
      padding: 8px 14px;
      border-radius: 999px;
      font-size: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.6);
      border: 1px solid #ff69b4;
      opacity: 0;
      transform: translateY(-10px);
      transition: opacity 0.2s ease, transform 0.2s ease;
      pointer-events: auto;
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        toast.remove();
        if (!container.hasChildNodes()) {
          container.remove();
        }
      }, 200);
    }, 3000);
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (!ok) {
          reject(new Error('execCommand copy failed'));
        } else {
          resolve();
        }
      } catch (e) {
        reject(e);
      }
    });
  }

  /* ---------- 全屏查看器 ---------- */
  function createFullscreenViewer(imgUrl) {
    if (document.querySelector('#dan-img-viewer')) return;

    const overlay = document.createElement('div');
    overlay.id = 'dan-img-viewer';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0,0,0,0.95);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      cursor: zoom-out;
      padding: 0;
      margin: 0;
      box-sizing: border-box;
    `;

    const img = document.createElement('img');
    img.src = imgUrl;
    img.style.cssText = `
      max-width: 100vw;
      max-height: 100vh;
      width: 100%;
      height: auto;
      object-fit: contain;
      box-shadow: 0 0 40px rgba(255,255,255,0.3);
      border-radius: 10px;
      transition: transform 0.3s ease;
      display: block;
    `;

    overlay.appendChild(img);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', () => overlay.remove());
  }

  /* ---------- 主流程 ---------- */
  console.log(t.start);

  const isTrackerPage = location.pathname.includes('/tracker.php');
  const rows = isTrackerPage
    ? document.querySelectorAll('tr.tCenter')
    : document.querySelectorAll('tr[id^="tr-"]');

  console.log(
    t.detected(rows.length, isTrackerPage ? t.searchResult : t.normalPage)
  );

  rows.forEach((row, index) => {
    let anchor, td, fullLink;

    if (isTrackerPage) {
      td = row.querySelector('td.row4.tLeft');
      anchor = td?.querySelector('a.tLink');
    } else {
      td = row.querySelector('td.tt');
      anchor = td?.querySelector('.torTopic a');
    }

    if (!anchor) return;

    // Open link in new tab
    if (openInNewTab) {
      anchor.target = '_blank';
    }

    const rawHref = anchor.getAttribute('href');
    const href = rawHref.startsWith('http')
      ? rawHref
      : new URL(rawHref.replace(/^\.\//, '/forum/'), window.location.origin).href;
    fullLink = href;

    console.log(t.parsingLink(index + 1, fullLink));

    GM_xmlhttpRequest({
      method: 'GET',
      url: fullLink,
      headers: {
        Referer: fullLink,
        'User-Agent': navigator.userAgent,
      },
      onload(response) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(response.responseText, 'text/html');
        const postContent = doc.querySelector('.post_body');

        if (!postContent) {
          console.warn(t.skipContentNotFound(fullLink));
          return;
        }

        const vars = Array.from(postContent.querySelectorAll('var.postImg'));
        const dl = postContent.querySelector('.dl-stub.dl-link');

        console.log(t.contentFound(vars.length));

        if (!td) return;

        const container = document.createElement('div');
        const downloadBtn = document.createElement('a');

        /* ---------- 下载按钮 ---------- */
        if (dl) {
          downloadBtn.href = dl.href;
          downloadBtn.textContent = t.downloadTorrent;
          downloadBtn.target = '_blank';
          downloadBtn.style.cssText = `
            padding: 1px 8px;
            border-radius: 6px;
            background-color: #ff69b4;
            color: white;
            font-size: 13px;
            text-decoration: none;
            font-weight: normal;
            width: fit-content;
            cursor: pointer;
            transition: background-color 0.3s;
            display: inline-block;
            margin-right: 10px;
          `;
          downloadBtn.onmouseenter = () =>
            (downloadBtn.style.backgroundColor = '#e7549f');
          downloadBtn.onmouseleave = () =>
            (downloadBtn.style.backgroundColor = '#ff69b4');
        }

        /* ---------- 预览图 ---------- */
        let imgCount = 0;
        for (const v of vars) {
          if (imgCount >= 20) {
            console.log(t.limitReached);
            break;
          }
    
          const imgUrl = v.getAttribute('title');
          if (!imgUrl) continue;

          const tempImg = new Image();
          tempImg.src = imgUrl;

          tempImg.onload = () => {
            const { width, height } = tempImg;
            console.log(t.imgSize(imgUrl, width, height));

            if (width >= 200 && height >= 200) {
              container.style.cssText = `
                margin-top: 5px;
                display: flex;
                overflow: hidden;
                max-width: 1500px;
                gap: 6px;
                flex-wrap: wrap;
              `;

              const preview = document.createElement('img');
              preview.src = imgUrl;
              preview.style.cssText = `
                max-height: ${savedImgSize}px;
                display: block;
                cursor: zoom-in;
                border-radius: 4px;
              `;
              preview.loading = 'lazy';
              preview.addEventListener('click', () =>
                createFullscreenViewer(imgUrl)
              );

              container.appendChild(preview);
            } else {
              console.log(t.imgTooSmall(imgUrl));
            }
          };

          tempImg.onerror = () => {
            console.warn(t.loadFailed(imgUrl));
          };

          imgCount++;
        }

        td.appendChild(container);
        td.appendChild(downloadBtn);
      },
      onerror(err) {
        console.error(t.requestFailed(index + 1, fullLink), err);
      },
    });
  });
})();
