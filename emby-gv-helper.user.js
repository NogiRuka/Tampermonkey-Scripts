// ==UserScript==
// @name         emby-gv-helper
// @namespace    http://tampermonkey.net/
// @version      2026-02-28
// @description  Emby GV helper for Pornolab and IAFD metadata copy
// @author       乃木流架
// @icon         https://github.com/NogiRuka/Tampermonkey-Scripts/blob/main/favicons/lustfulboy.png?raw=true
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @connect      lustfulboy.com
// @connect      hunk-ch.com
// @connect      *.hunk-ch.com
// @connect      ck-download.com
// @connect      *.ck-download.com
// @connect      self
// @connect      *
// @require      file://D:\Projects\Tampermonkey Scripts\emby-gv-helper.user.js
// ==/UserScript==

(function () {
  'use strict';

  const savedLang = GM_getValue('lang', 'auto');
  const browserLang = navigator.language.startsWith('zh') ? 'zh' : 'en';
  const lang = savedLang === 'auto' ? browserLang : savedLang;
  let shortcut = GM_getValue('shortcut', 'ctrl+shift+m');
  let themeColor = GM_getValue('themeColor', '#ff69b4');
  let enableConsoleLogs = GM_getValue('enableConsoleLogs', true);
  let hunkChPosterFilename = GM_getValue('hunkChPosterFilename', 'poster.jpg');
  let hunkChDownloadMode = GM_getValue('hunkChDownloadMode', 'direct');
  let fourHorLoverImgWidth = parseInt(GM_getValue('fourHorLoverImgWidth', 200), 10);
  if (!Number.isFinite(fourHorLoverImgWidth) || fourHorLoverImgWidth <= 0) fourHorLoverImgWidth = 200;
  fourHorLoverImgWidth = Math.max(50, Math.min(800, fourHorLoverImgWidth));

  const defaultMetadataConfigs = {
    actors: {
      enabled: true,
      template: [
        '<actor>',
        '  <name>{{name}}</name>',
        '  <type>Actor</type>',
        '</actor>'
      ].join('\n')
    },
    genres: {
      enabled: false,
      template: '{{genres}}'
    },
    description: {
      enabled: false,
      template: '{{description}}'
    }
  };

  const metadataConfigs = GM_getValue('metadataConfigs', defaultMetadataConfigs);
  const resourceBaseUrl = GM_getValue('resourceBaseUrl', '');
  const embyApiUrl = GM_getValue('embyApiUrl', 'https://lustfulboy.com/emby');
  const embyApiToken = GM_getValue('embyApiToken', '');
  const nativeConsole = globalThis.console;
  const console = ['log', 'info', 'warn', 'error', 'debug'].reduce((acc, method) => {
    acc[method] = (...args) => {
      if (!enableConsoleLogs) return;
      const fn = nativeConsole && typeof nativeConsole[method] === 'function'
        ? nativeConsole[method].bind(nativeConsole)
        : null;
      if (fn) fn(...args);
    };
    return acc;
  }, {});

  const t = {
    zh: {
      settings: '⚙️ 设置',
      language: '语言 / Language',
      shortcutSettings: '快捷键设置',
      themeColorSection: '主题色 / Theme Color',
      consoleLogSection: '控制台日志',
      consoleLogLabel: '启用脚本控制台日志输出',
      metadataSettings: '元数据复制模板',
      metadataHelp: '支持 {{title}}, {{genres}}, {{description}} 等，占位符；数组字段使用 {{#actors}}...{{/actors}} 或 {{#genres}}...{{/genres}}，内部用 {{name}}。',
      metadataActorsTitle: '演员模板',
      metadataGenresTitle: '标签模板',
      metadataDescriptionTitle: '简介模板',
      metadataEnable: '启用并显示复制按钮',
      metadataActorsCopy: '复制演员',
      metadataGenresCopy: '复制标签',
      metadataDescriptionCopy: '复制简介',
      actorPreview: '预览',
      actorNames: '名单',
      actorNameCopied: '演员名已复制',
      metadataCopied: '元数据已复制到剪贴板',
      metadataCopyFailed: '复制失败，请检查模板或控制台日志',
      metadataParseFailed: '未能从页面解析出元数据',
      saveAndReload: '保存并刷新',
      clickToSet: '点击设置',
      pressKey: '请按键...',
      themeColorLabel: '主题色（影响按钮、边框等高亮）',
      resourceBaseLabel: '资源站基址（例如：https://example.com/filebrowser/files/media/lustfulboy）',
      resourceBasePlaceholder: '请输入资源站根路径',
      resourceOpenButton: '打开资源目录',
      hunkChSettings: 'Hunk-Ch 设置',
      hunkChPosterFilenameLabel: '大图下载文件名（默认 poster.jpg）',
      hunkChPosterFilenamePlaceholder: '例如：poster.jpg',
      hunkChDownloadModeLabel: '下载方式（默认直接下载）',
      hunkChDownloadModeDirect: '直接下载',
      hunkChDownloadModeSaveAs: '弹出另存为',
      hunkChDownloadImage: '下载图片',
      hunkChDownloading: '开始下载图片…',
      hunkChDownloadOk: '图片已开始下载',
      hunkChDownloadFailed: '下载失败',
      embyApiSettings: 'Emby API 设置',
      embyApiUrlLabel: 'Emby 服务器地址 (例如 https://lustfulboy.com/emby)',
      embyApiTokenLabel: 'Emby API 密钥 (X-Emby-Token)',
      fourHorLoverSettings: '4horlover 设置',
      fourHorLoverImageWidthLabel: '列表图片宽度（px，默认 200）',
      uploadImage: '修改图片',
      uploadSuccess: '图片上传成功，请手动刷新页面',
      uploadFailed: '图片上传失败',
      addToEmby: '添加标签到 Emby',
      itemIdPlaceholder: '输入 Item ID',
      tagsAdded: '标签添加成功',
      tagsAddFailed: '标签添加失败',
      missingItemId: '请输入 Item ID',
      jsonPreview: 'JSON 预览',
      send: '发送',
      cancel: '取消',
      invalidJson: 'JSON 格式错误',
      copyItemId: '复制 Item ID',
      itemIdCopied: 'Item ID 已复制'
    },
    en: {
      settings: '⚙️ Settings',
      language: 'Language / 语言',
      shortcutSettings: 'Shortcut Settings',
      themeColorSection: 'Theme Color / 主题色',
      consoleLogSection: 'Console Logs',
      consoleLogLabel: 'Enable script console logging',
      metadataSettings: 'Metadata Templates',
      metadataHelp: 'Supports {{title}}, {{genres}}, {{description}} etc; for arrays use {{#actors}}...{{/actors}} or {{#genres}}...{{/genres}} with {{name}} inside.',
      metadataActorsTitle: 'Actors Template',
      metadataGenresTitle: 'Genres Template',
      metadataDescriptionTitle: 'Description Template',
      metadataEnable: 'Enable and show copy button',
      metadataActorsCopy: 'Copy actors',
      metadataGenresCopy: 'Copy genres',
      metadataDescriptionCopy: 'Copy description',
      actorPreview: 'Preview',
      actorNames: 'Names',
      actorNameCopied: 'Actor name copied',
      metadataCopied: 'Metadata copied to clipboard',
      metadataCopyFailed: 'Copy failed, please check template or console log',
      metadataParseFailed: 'Failed to parse metadata from page',
      saveAndReload: 'Save & Reload',
      clickToSet: 'Click to Set',
      pressKey: 'Press Key...',
      themeColorLabel: 'Theme color (buttons, borders and highlights)',
      resourceBaseLabel: 'Resource base URL (e.g. https://example.com/filebrowser/files/media/lustfulboy)',
      resourceBasePlaceholder: 'Enter resource root URL',
      resourceOpenButton: 'Open resource folder',
      hunkChSettings: 'Hunk-Ch Settings',
      hunkChPosterFilenameLabel: 'Download filename for large image (default poster.jpg)',
      hunkChPosterFilenamePlaceholder: 'e.g. poster.jpg',
      hunkChDownloadModeLabel: 'Download mode (default direct)',
      hunkChDownloadModeDirect: 'Direct download',
      hunkChDownloadModeSaveAs: 'Save as dialog',
      hunkChDownloadImage: 'Download image',
      hunkChDownloading: 'Downloading image…',
      hunkChDownloadOk: 'Download started',
      hunkChDownloadFailed: 'Download failed',
      embyApiSettings: 'Emby API Settings',
      embyApiUrlLabel: 'Emby Server URL (e.g. https://lustfulboy.com/emby)',
      embyApiTokenLabel: 'Emby API Key (X-Emby-Token)',
      fourHorLoverSettings: '4horlover Settings',
      fourHorLoverImageWidthLabel: 'List image width (px, default 200)',
      uploadImage: 'Upload Image',
      uploadSuccess: 'Image uploaded successfully, please refresh manually',
      uploadFailed: 'Image upload failed',
      addToEmby: 'Add Tags to Emby',
      itemIdPlaceholder: 'Enter Item ID',
      tagsAdded: 'Tags added successfully',
      tagsAddFailed: 'Failed to add tags',
      missingItemId: 'Please enter Item ID',
      jsonPreview: 'JSON Preview',
      send: 'Send',
      cancel: 'Cancel',
      invalidJson: 'Invalid JSON',
      copyItemId: 'Copy Item ID',
      itemIdCopied: 'Item ID copied'
    }
  }[lang];

  function showToast(message) {
    let container = document.querySelector('#dan-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'dan-toast-container';
      container.style.cssText = 'position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:99999;display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none;';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = 'max-width:80vw;background:rgba(20,20,20,0.96);color:#f5f5f5;padding:8px 14px;border-radius:999px;font-size:12px;box-shadow:0 4px 16px rgba(0,0,0,0.6);border:1px solid ' + themeColor + ';opacity:0;transform:translateY(-10px);transition:opacity 0.2s ease,transform 0.2s ease;pointer-events:auto;';

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

  function enableUniversalCopyUnlock() {
    const root = document.documentElement;
    if (root && root.dataset && root.dataset.embyCopyUnlockReady === '1') return;
    if (root && root.dataset) root.dataset.embyCopyUnlockReady = '1';

    const ensureStyle = () => {
      if (!document.head) return;
      if (document.getElementById('emby-copy-unlock-style')) return;
      const style = document.createElement('style');
      style.id = 'emby-copy-unlock-style';
      style.textContent = `
        * {
          user-select: text !important;
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
        }
      `;
      document.head.appendChild(style);
    };

    const nullifyInlineHandlers = () => {
      if (document.body) {
        document.body.oncopy = null;
        document.body.oncut = null;
        document.body.onselectstart = null;
        document.body.oncontextmenu = null;
      }
      document.oncopy = null;
      document.oncut = null;
      document.onselectstart = null;
      document.oncontextmenu = null;
    };

    const stop = (e) => {
      try { e.stopImmediatePropagation(); } catch (_) {}
      try { e.stopPropagation(); } catch (_) {}
    };

    ensureStyle();
    nullifyInlineHandlers();

    const events = ['selectstart'];
    events.forEach(type => document.addEventListener(type, stop, true));

    const ctxState = {
      down: false,
      moved: false,
      x: 0,
      y: 0,
      suppressUntil: 0
    };
    const ctxMoveThreshold = 6;

    const isAllowedContextMenuTarget = (target) => {
      if (!(target instanceof Element)) return false;
      if (target.closest('[data-emby-allow-contextmenu="1"], .emby-allow-contextmenu')) return true;
      if (target.closest('.nogiruka-scroll-btn, .nogiruka-context-menu')) return true;
      return false;
    };

    const isEditableTarget = (target) => {
      if (!(target instanceof Element)) return false;
      const el = target.closest('input, textarea, [contenteditable=""], [contenteditable="true"], [role="textbox"]');
      if (!el) return false;
      if (el instanceof HTMLInputElement) return !el.disabled && !el.readOnly;
      if (el instanceof HTMLTextAreaElement) return !el.disabled && !el.readOnly;
      return true;
    };

    document.addEventListener('mousedown', (e) => {
      if (e.button !== 2) return;
      if (isAllowedContextMenuTarget(e.target)) return;
      ctxState.down = true;
      ctxState.moved = false;
      ctxState.x = e.clientX;
      ctxState.y = e.clientY;
    }, true);

    document.addEventListener('mousemove', (e) => {
      if (!ctxState.down) return;
      const dx = e.clientX - ctxState.x;
      const dy = e.clientY - ctxState.y;
      if ((dx * dx + dy * dy) > (ctxMoveThreshold * ctxMoveThreshold)) {
        ctxState.moved = true;
      }
    }, true);

    document.addEventListener('mouseup', (e) => {
      if (e.button !== 2) return;
      if (!ctxState.down) return;
      ctxState.down = false;
      if (ctxState.moved) {
        ctxState.suppressUntil = Date.now() + 600;
      }
    }, true);

    document.addEventListener('contextmenu', (e) => {
      if (isAllowedContextMenuTarget(e.target)) {
        ctxState.down = false;
        ctxState.moved = false;
        ctxState.suppressUntil = 0;
        return;
      }
      const now = Date.now();
      const shouldSuppress = !!(ctxState.moved || (ctxState.suppressUntil && now < ctxState.suppressUntil));
      if (shouldSuppress) {
        try { e.preventDefault(); } catch (_) {}
        ctxState.moved = false;
        ctxState.suppressUntil = 0;
      }
      stop(e);
    }, true);

    const stopIfNotEditable = (e) => {
      if (isEditableTarget(e.target)) return;
      stop(e);
    };
    document.addEventListener('copy', stopIfNotEditable, true);
    document.addEventListener('cut', stopIfNotEditable, true);

    if (!document.head || !document.body) {
      window.addEventListener('DOMContentLoaded', () => {
        ensureStyle();
        nullifyInlineHandlers();
      }, { once: true });
    }
  }

  function getHunkChPosterFilenameSetting() {
    const v = (typeof GM_getValue === 'function')
      ? GM_getValue('hunkChPosterFilename', hunkChPosterFilename || 'poster.jpg')
      : (hunkChPosterFilename || 'poster.jpg');
    const s = (v || '').trim();
    return s || 'poster.jpg';
  }

  function getHunkChSaveAsSetting() {
    const v = (typeof GM_getValue === 'function')
      ? GM_getValue('hunkChDownloadMode', hunkChDownloadMode || 'direct')
      : (hunkChDownloadMode || 'direct');
    const modeRaw = (v || '').trim() || 'direct';
    const mode = modeRaw === 'prompt' ? 'saveAs' : modeRaw;
    return mode === 'saveAs';
  }

  function createDownloadFabButton({ title, right = 12, left = null, bottom = 12, zIndex = 30, size = 50 } = {}) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'emby-hunkch-download-btn';
    btn.title = title || '';
    btn.setAttribute('aria-label', title || '');
    btn.style.cssText = [
      'position:absolute',
      (Number.isFinite(left) ? ('left:' + left + 'px') : ('right:' + right + 'px')),
      'bottom:' + bottom + 'px',
      'z-index:' + zIndex,
      'width:' + size + 'px',
      'height:' + size + 'px',
      'padding:0',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'border-radius:999px',
      'border:1px solid rgba(255,255,255,.22)',
      'background:' + themeColor,
      'color:#fff',
      'cursor:pointer',
      'box-shadow:0 6px 18px rgba(0,0,0,.45)'
    ].join(';');
    btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><path d="M12 3v10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M8 11l4 4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 21h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    return btn;
  }

  function downloadByUrl(url, filename, saveAs, options = {}) {
    if (!url) {
      showToast(t.hunkChDownloadFailed);
      return;
    }

    showToast(t.hunkChDownloading);
    const safeOptions = (options && typeof options === 'object') ? options : {};
    const headers = (safeOptions.headers && typeof safeOptions.headers === 'object') ? safeOptions.headers : undefined;
    const timeout = Number.isFinite(safeOptions.timeout) ? safeOptions.timeout : undefined;
    const normalizedFilename = String(filename || '').trim() || 'download';

    const buildErrText = (err) => {
      if (!err) return '';
      if (typeof err === 'string') return err;
      if (typeof err === 'object') {
        const parts = [];
        if (err.error) parts.push(String(err.error));
        if (err.details) parts.push(String(err.details));
        if (err.status) parts.push(String(err.status));
        if (err.statusText) parts.push(String(err.statusText));
        if (err.finalUrl) parts.push(String(err.finalUrl));
        if (parts.length) return parts.join(' | ');
        try {
          return JSON.stringify(err).slice(0, 160);
        } catch (_) {
          return String(err);
        }
      }
      return String(err);
    };

    const anchorDownload = (href, downloadName, cleanup) => {
      const a = document.createElement('a');
      a.href = href;
      a.download = downloadName;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      if (typeof cleanup === 'function') {
        setTimeout(() => {
          try { cleanup(); } catch (_) {}
        }, 30000);
      }
      showToast(t.hunkChDownloadOk);
    };

    const directDownload = () => {
      console.warn('[emby-gv-helper] using direct download fallback', { url, filename: normalizedFilename, saveAs });
      if (typeof GM_download === 'function') {
        try {
          GM_download({
            url,
            name: normalizedFilename,
            saveAs: !!saveAs,
            headers,
            timeout,
            onload: () => showToast(t.hunkChDownloadOk),
            onerror: (err) => {
              console.error('[emby-gv-helper] download failed', { url, filename: normalizedFilename, saveAs, err });
              const extra = buildErrText(err);
              showToast(extra ? (t.hunkChDownloadFailed + ': ' + extra) : t.hunkChDownloadFailed);
            }
          });
          return true;
        } catch (err) {
          console.error('[emby-gv-helper] GM_download threw', { url, filename: normalizedFilename, saveAs, err });
          const extra = (err && err.message) ? err.message : String(err || '');
          showToast(extra ? (t.hunkChDownloadFailed + ': ' + extra) : t.hunkChDownloadFailed);
          return true;
        }
      }

      anchorDownload(url, normalizedFilename);
      return true;
    };

    const blobDownload = (blob) => {
      if (!(blob instanceof Blob) || blob.size === 0) {
        return directDownload();
      }

      console.info('[emby-gv-helper] using blob download', { url, filename: normalizedFilename, size: blob.size, type: blob.type || '' });
      const blobUrl = URL.createObjectURL(blob);
      const revoke = () => URL.revokeObjectURL(blobUrl);
      anchorDownload(blobUrl, normalizedFilename, revoke);
      return true;
    };

    if (typeof GM_xmlhttpRequest === 'function') {
      try {
        GM_xmlhttpRequest({
          method: 'GET',
          url,
          headers,
          timeout,
          responseType: 'blob',
          onload: (resp) => {
            const okStatus = resp && resp.status >= 200 && resp.status < 300;
            const blob = resp ? resp.response : null;
            if (okStatus && blob) {
              blobDownload(blob);
              return;
            }
            console.warn('[emby-gv-helper] blob request fallback to direct download', { url, filename: normalizedFilename, resp });
            directDownload();
          },
          onerror: (err) => {
            console.warn('[emby-gv-helper] blob request error, fallback to direct download', { url, filename: normalizedFilename, err });
            directDownload();
          },
          ontimeout: () => {
            console.warn('[emby-gv-helper] blob request timeout, fallback to direct download', { url, filename: normalizedFilename });
            directDownload();
          }
        });
        return;
      } catch (err) {
        console.warn('[emby-gv-helper] GM_xmlhttpRequest threw, fallback to direct download', { url, filename: normalizedFilename, saveAs, err });
      }
    }

    directDownload();
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

  function openSettings() {
    if (document.querySelector('#dan-meta-settings-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'dan-meta-settings-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background-color:rgba(0,0,0,0.6);z-index:99998;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s;';

    const panel = document.createElement('div');
    panel.style.cssText = 'width:480px;max-width:90vw;background:#181818;color:#f5f5f5;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.7);border:1px solid #333;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;transform:scale(0.95);transition:transform 0.2s;';

    const header = document.createElement('div');
    header.style.cssText = 'padding:14px 18px;border-bottom:1px solid #333;display:flex;align-items:center;justify-content:space-between;';
    const title = document.createElement('div');
    title.textContent = t.settings;
    title.style.cssText = 'font-size:14px;font-weight:600;color:' + themeColor + ';';
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = 'width:24px;height:24px;border-radius:999px;border:none;background:#333;color:#eee;cursor:pointer;font-size:16px;line-height:1;';
    closeBtn.onclick = () => closePanel();
    header.appendChild(title);
    header.appendChild(closeBtn);

    const content = document.createElement('div');
    content.style.cssText = 'padding:16px 18px 18px 18px;max-height:70vh;overflow:auto;';

    function createSection(titleText) {
      const section = document.createElement('div');
      section.style.marginBottom = '16px';
      const sectionTitle = document.createElement('div');
      sectionTitle.textContent = titleText;
      sectionTitle.style.cssText = 'font-size:13px;color:' + themeColor + ';text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;font-weight:700;';
      section.appendChild(sectionTitle);
      return section;
    }

    const themeSection = createSection(t.themeColorSection);
    const themeLabel = document.createElement('div');
    themeLabel.textContent = t.themeColorLabel;
    themeLabel.style.cssText = 'font-size:11px;color:#ccc;margin-bottom:6px;';
    const themeInputRow = document.createElement('div');
    themeInputRow.style.cssText = 'display:flex;align-items:center;gap:8px;';
    const themeInput = document.createElement('input');
    themeInput.type = 'color';
    themeInput.value = themeColor;
    themeInput.style.cssText = 'width:32px;height:20px;border:none;padding:0;background:transparent;';
    const themeText = document.createElement('input');
    themeText.type = 'text';
    themeText.value = themeColor;
    themeText.style.cssText = 'flex:1;min-width:0;padding:4px 6px;border-radius:4px;border:1px solid #3a3a3a;background:#111;color:#eee;font-size:12px;font-family:monospace;';
    themeInput.oninput = () => {
      themeText.value = themeInput.value;
    };
    themeText.onblur = () => {
      const v = themeText.value.trim();
      if (/^#[0-9a-fA-F]{6}$/.test(v)) {
        themeInput.value = v;
      }
    };
    themeInputRow.appendChild(themeInput);
    themeInputRow.appendChild(themeText);
    themeSection.appendChild(themeLabel);
    themeSection.appendChild(themeInputRow);
    content.appendChild(themeSection);

    const consoleSection = createSection(t.consoleLogSection);
    const consoleToggleLabel = document.createElement('label');
    consoleToggleLabel.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;background:#1f1f1f;border-radius:8px;border:1px solid #333;cursor:pointer;';
    const consoleToggleText = document.createElement('span');
    consoleToggleText.textContent = t.consoleLogLabel;
    consoleToggleText.style.cssText = 'font-size:12px;color:#eee;';
    const consoleToggleInput = document.createElement('input');
    consoleToggleInput.type = 'checkbox';
    consoleToggleInput.checked = !!enableConsoleLogs;
    consoleToggleInput.style.accentColor = themeColor;
    consoleToggleLabel.appendChild(consoleToggleText);
    consoleToggleLabel.appendChild(consoleToggleInput);
    consoleSection.appendChild(consoleToggleLabel);
    content.appendChild(consoleSection);

    const langSection = createSection(t.language);
    const langOptions = [
      { label: '🇨🇳 中文', value: 'zh' },
      { label: '🇺🇸 English', value: 'en' }
    ];
    const langContainer = document.createElement('div');
    langContainer.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;';
    langOptions.forEach(opt => {
      const label = document.createElement('label');
      label.style.cssText = 'display:flex;align-items:center;padding:10px 12px;background:#1f1f1f;border-radius:8px;cursor:pointer;border:1px solid #333;transition:all 0.2s;';
      if (lang === opt.value) {
        label.style.borderColor = themeColor;
        label.style.background = 'rgba(255,105,180,0.12)';
      }
      label.onmouseover = () => { if (lang !== opt.value) label.style.background = '#262626'; };
      label.onmouseout = () => { if (lang !== opt.value) label.style.background = '#1f1f1f'; };

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'dan-lang-setting';
      input.value = opt.value;
      input.checked = lang === opt.value;
      input.style.marginRight = '8px';
      input.style.accentColor = themeColor;
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

    const shortcutSection = createSection(t.shortcutSettings);
    const shortcutContainer = document.createElement('div');
    shortcutContainer.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#1f1f1f;border-radius:8px;border:1px solid #333;';
    const shortcutLabel = document.createElement('span');
    shortcutLabel.textContent = shortcut.toUpperCase();
    shortcutLabel.style.cssText = 'font-family:monospace;font-size:13px;background:#333;padding:4px 8px;border-radius:4px;color:#fff;';
    const setBtn = document.createElement('button');
    setBtn.textContent = t.clickToSet;
    setBtn.style.cssText = 'padding:6px 10px;background:' + themeColor + ';color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:600;';
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
        setBtn.style.background = themeColor;
        document.removeEventListener('keydown', handler, true);
      };
      document.addEventListener('keydown', handler, true);
    };
    shortcutContainer.appendChild(shortcutLabel);
    shortcutContainer.appendChild(setBtn);
    shortcutSection.appendChild(shortcutContainer);
    content.appendChild(shortcutSection);

    const sectionTitle = document.createElement('div');
    sectionTitle.textContent = t.metadataSettings;
    sectionTitle.style.cssText = 'font-size:13px;color:#ff69b4;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;font-weight:700;';
    content.appendChild(sectionTitle);

    const metaHelp = document.createElement('div');
    metaHelp.textContent = t.metadataHelp;
    metaHelp.style.cssText = 'font-size:11px;color:#999;margin:2px 0 10px;';
    content.appendChild(metaHelp);

    const metaTypes = [
      { key: 'actors', title: t.metadataActorsTitle },
      { key: 'genres', title: t.metadataGenresTitle },
      { key: 'description', title: t.metadataDescriptionTitle }
    ];

    const metaInputs = {};

    metaTypes.forEach(({ key, title: titleText }) => {
      const conf = (metadataConfigs && metadataConfigs[key]) || defaultMetadataConfigs[key];

      const block = document.createElement('div');
      block.style.cssText = 'margin-bottom:14px;padding:10px 12px;background:#1c1c1c;border-radius:6px;border:1px solid #333;';

      const headerRow = document.createElement('div');
      headerRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;';

      const titleSpan = document.createElement('span');
      titleSpan.textContent = titleText;
      titleSpan.style.cssText = 'font-size:12px;color:' + themeColor + ';';

      const enableLabel = document.createElement('label');
      enableLabel.style.cssText = 'font-size:11px;color:#ccc;display:flex;align-items:center;gap:4px;';

      const enableInput = document.createElement('input');
      enableInput.type = 'checkbox';
      enableInput.checked = conf && conf.enabled;

      const enableText = document.createElement('span');
      enableText.textContent = t.metadataEnable;

      enableLabel.appendChild(enableInput);
      enableLabel.appendChild(enableText);

      headerRow.appendChild(titleSpan);
      headerRow.appendChild(enableLabel);
      block.appendChild(headerRow);

      const textarea = document.createElement('textarea');
      textarea.value = (conf && conf.template) || '';
      textarea.style.cssText = 'width:100%;min-height:80px;background:#111;color:#eee;border:1px solid #3a3a3a;border-radius:4px;padding:6px;font-family:monospace;font-size:12px;resize:vertical;';
      block.appendChild(textarea);

      content.appendChild(block);
      metaInputs[key] = { enableInput, textarea };
    });

    const resourceBlock = document.createElement('div');
    resourceBlock.style.cssText = 'margin-top:14px;padding:10px 12px;background:#1c1c1c;border-radius:6px;border:1px solid #333;';

    const resourceLabel = document.createElement('div');
    resourceLabel.textContent = t.resourceBaseLabel;
    resourceLabel.style.cssText = 'font-size:11px;color:#ccc;margin-bottom:6px;';
    resourceBlock.appendChild(resourceLabel);

    const resourceInput = document.createElement('input');
    resourceInput.type = 'text';
    resourceInput.value = resourceBaseUrl || '';
    resourceInput.placeholder = t.resourceBasePlaceholder;
    resourceInput.style.cssText = 'width:100%;padding:6px 8px;border-radius:4px;border:1px solid #3a3a3a;background:#111;color:#eee;font-size:12px;';
    resourceBlock.appendChild(resourceInput);

    content.appendChild(resourceBlock);

    const hunkChBlock = document.createElement('div');
    hunkChBlock.style.cssText = 'margin-top:14px;padding:10px 12px;background:#1c1c1c;border-radius:6px;border:1px solid #333;';

    const hunkChTitle = document.createElement('div');
    hunkChTitle.textContent = t.hunkChSettings;
    hunkChTitle.style.cssText = 'font-size:12px;color:' + themeColor + ';margin-bottom:8px;font-weight:600;';
    hunkChBlock.appendChild(hunkChTitle);

    const posterFilenameLabel = document.createElement('div');
    posterFilenameLabel.textContent = t.hunkChPosterFilenameLabel;
    posterFilenameLabel.style.cssText = 'font-size:11px;color:#ccc;margin-bottom:4px;';
    hunkChBlock.appendChild(posterFilenameLabel);

    const posterFilenameInput = document.createElement('input');
    posterFilenameInput.type = 'text';
    posterFilenameInput.value = (hunkChPosterFilename || 'poster.jpg');
    posterFilenameInput.placeholder = t.hunkChPosterFilenamePlaceholder;
    posterFilenameInput.style.cssText = 'width:100%;padding:6px 8px;border-radius:4px;border:1px solid #3a3a3a;background:#111;color:#eee;font-size:12px;';
    hunkChBlock.appendChild(posterFilenameInput);

    const downloadModeLabel = document.createElement('div');
    downloadModeLabel.textContent = t.hunkChDownloadModeLabel;
    downloadModeLabel.style.cssText = 'font-size:11px;color:#ccc;margin:10px 0 6px;';
    hunkChBlock.appendChild(downloadModeLabel);

    const modeRow = document.createElement('div');
    modeRow.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;';

    const modeName = 'hunkch-download-mode';
    const makeModeOption = (value, text) => {
      const label = document.createElement('label');
      label.style.cssText = 'display:flex;align-items:center;gap:6px;padding:6px 10px;background:#111;border:1px solid #3a3a3a;border-radius:999px;cursor:pointer;font-size:12px;color:#eee;';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = modeName;
      input.value = value;
      input.checked = (hunkChDownloadMode || 'direct') === value;
      input.style.accentColor = themeColor;
      const span = document.createElement('span');
      span.textContent = text;
      label.appendChild(input);
      label.appendChild(span);
      return { label, input };
    };

    const normalizedMode = (hunkChDownloadMode === 'prompt') ? 'saveAs' : (hunkChDownloadMode || 'direct');
    const directOpt = makeModeOption('direct', t.hunkChDownloadModeDirect);
    directOpt.input.checked = normalizedMode === 'direct';
    const saveAsOpt = makeModeOption('saveAs', t.hunkChDownloadModeSaveAs);
    saveAsOpt.input.checked = normalizedMode === 'saveAs';
    modeRow.appendChild(directOpt.label);
    modeRow.appendChild(saveAsOpt.label);
    hunkChBlock.appendChild(modeRow);

    content.appendChild(hunkChBlock);

    const fourHorLoverBlock = document.createElement('div');
    fourHorLoverBlock.style.cssText = 'margin-top:14px;padding:10px 12px;background:#1c1c1c;border-radius:6px;border:1px solid #333;';

    const fourHorLoverTitle = document.createElement('div');
    fourHorLoverTitle.textContent = t.fourHorLoverSettings;
    fourHorLoverTitle.style.cssText = 'font-size:12px;color:' + themeColor + ';margin-bottom:8px;font-weight:600;';
    fourHorLoverBlock.appendChild(fourHorLoverTitle);

    const fourHorLoverWidthLabel = document.createElement('div');
    fourHorLoverWidthLabel.textContent = t.fourHorLoverImageWidthLabel;
    fourHorLoverWidthLabel.style.cssText = 'font-size:11px;color:#ccc;margin-bottom:4px;';
    fourHorLoverBlock.appendChild(fourHorLoverWidthLabel);

    const fourHorLoverImgWidthInput = document.createElement('input');
    fourHorLoverImgWidthInput.type = 'number';
    fourHorLoverImgWidthInput.min = '50';
    fourHorLoverImgWidthInput.max = '800';
    fourHorLoverImgWidthInput.step = '10';
    fourHorLoverImgWidthInput.value = String(fourHorLoverImgWidth || 200);
    fourHorLoverImgWidthInput.placeholder = '200';
    fourHorLoverImgWidthInput.style.cssText = 'width:100%;padding:6px 8px;border-radius:4px;border:1px solid #3a3a3a;background:#111;color:#eee;font-size:12px;';
    fourHorLoverBlock.appendChild(fourHorLoverImgWidthInput);

    content.appendChild(fourHorLoverBlock);

    // Emby API Settings Block
    const apiBlock = document.createElement('div');
    apiBlock.style.cssText = 'margin-top:14px;padding:10px 12px;background:#1c1c1c;border-radius:6px;border:1px solid #333;';
    
    const apiTitle = document.createElement('div');
    apiTitle.textContent = t.embyApiSettings;
    apiTitle.style.cssText = 'font-size:12px;color:' + themeColor + ';margin-bottom:8px;font-weight:600;';
    apiBlock.appendChild(apiTitle);

    // API URL
    const apiUrlLabel = document.createElement('div');
    apiUrlLabel.textContent = t.embyApiUrlLabel;
    apiUrlLabel.style.cssText = 'font-size:11px;color:#ccc;margin-bottom:4px;';
    apiBlock.appendChild(apiUrlLabel);

    const apiUrlInput = document.createElement('input');
    apiUrlInput.type = 'text';
    apiUrlInput.value = embyApiUrl || '';
    apiUrlInput.style.cssText = 'width:100%;padding:6px 8px;border-radius:4px;border:1px solid #3a3a3a;background:#111;color:#eee;font-size:12px;margin-bottom:10px;';
    apiBlock.appendChild(apiUrlInput);

    // API Token
    const apiTokenLabel = document.createElement('div');
    apiTokenLabel.textContent = t.embyApiTokenLabel;
    apiTokenLabel.style.cssText = 'font-size:11px;color:#ccc;margin-bottom:4px;';
    apiBlock.appendChild(apiTokenLabel);

    const apiTokenInput = document.createElement('input');
    apiTokenInput.type = 'text';
    apiTokenInput.value = embyApiToken || '';
    apiTokenInput.style.cssText = 'width:100%;padding:6px 8px;border-radius:4px;border:1px solid #3a3a3a;background:#111;color:#eee;font-size:12px;';
    apiBlock.appendChild(apiTokenInput);

    content.appendChild(apiBlock);

    const metaSaveBtn = document.createElement('button');
    metaSaveBtn.textContent = t.saveAndReload;
    metaSaveBtn.style.cssText = 'padding:6px 12px;background:' + themeColor + ';color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:600;margin-top:8px;';
    metaSaveBtn.onclick = () => {
      const nextConfigs = {};
      metaTypes.forEach(({ key }) => {
        const inputs = metaInputs[key];
        if (!inputs) return;
        nextConfigs[key] = {
          enabled: inputs.enableInput.checked,
          template: inputs.textarea.value
        };
      });
      GM_setValue('metadataConfigs', nextConfigs);
      GM_setValue('resourceBaseUrl', resourceInput.value.trim());
      GM_setValue('embyApiUrl', apiUrlInput.value.trim());
      GM_setValue('embyApiToken', apiTokenInput.value.trim());
      const rawPoster = posterFilenameInput.value.trim() || 'poster.jpg';
      const safePoster = rawPoster.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim();
      GM_setValue('hunkChPosterFilename', safePoster || 'poster.jpg');
      const selectedMode = (directOpt.input.checked ? 'direct' : (saveAsOpt.input.checked ? 'saveAs' : 'direct'));
      GM_setValue('hunkChDownloadMode', selectedMode);
      hunkChDownloadMode = selectedMode;
      const nextImgWidthRaw = parseInt(fourHorLoverImgWidthInput.value, 10);
      const nextImgWidth = Number.isFinite(nextImgWidthRaw) ? nextImgWidthRaw : 200;
      const nextClampedImgWidth = Math.max(50, Math.min(800, nextImgWidth));
      GM_setValue('fourHorLoverImgWidth', nextClampedImgWidth);
      fourHorLoverImgWidth = nextClampedImgWidth;
      const nextTheme = themeText.value.trim();
      if (/^#[0-9a-fA-F]{6}$/.test(nextTheme)) {
        GM_setValue('themeColor', nextTheme);
      }
      GM_setValue('enableConsoleLogs', !!consoleToggleInput.checked);
      enableConsoleLogs = !!consoleToggleInput.checked;
      location.reload();
    };

    content.appendChild(metaSaveBtn);

    panel.appendChild(header);
    panel.appendChild(content);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      panel.style.transform = 'scale(1)';
    });

    function closePanel() {
      overlay.style.opacity = '0';
      panel.style.transform = 'scale(0.95)';
      setTimeout(() => overlay.remove(), 200);
    }

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closePanel();
    });
  }

  GM_registerMenuCommand(t.settings, openSettings);

  document.addEventListener('keydown', (e) => {
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

  function normalizeNameValue(v) {
    if (v === null || v === undefined) return '';
    if (typeof v === 'string') return v.replace(/\s+/g, ' ').trim();
    if (typeof v === 'object') {
      const name = typeof v.name === 'string' ? v.name : (typeof v.Name === 'string' ? v.Name : '');
      if (name) return name.replace(/\s+/g, ' ').trim();
    }
    return String(v).replace(/\s+/g, ' ').trim();
  }

  function normalizeNameList(list) {
    if (!list) return [];
    const arr = Array.isArray(list) ? list : Array.from(list);
    const out = [];
    for (const it of arr) {
      const s = normalizeNameValue(it);
      if (s) out.push(s);
    }
    return out;
  }

  function renderWithTemplate(meta, tpl, type) {
    if (!tpl || !meta) return '';
    let result = tpl;

    ['actors', 'genres'].forEach(field => {
      result = result.replace(
        new RegExp(`{{#${field}}}([\\s\\S]*?){{\\/${field}}}`, 'g'),
        (_, block) => {
          const arr = normalizeNameList(meta[field]);
          if (!arr || !arr.length) return '';
          return arr.map(name => {
            let chunk = block;
            chunk = chunk.replace(/{{\s*name\s*}}/g, name);
            return chunk;
          }).join('');
        }
      );
    });

    if ((type === 'actors' || type === 'genres') && result.includes('{{name}}')) {
      const arr = normalizeNameList(meta[type]);
      if (!arr || !arr.length) return '';
      result = arr.map(name => {
        let chunk = tpl;
        chunk = chunk.replace(/{{\s*name\s*}}/g, name);
        return chunk;
      }).join('');
    }

    const genresText = normalizeNameList(meta.genres).join(', ');
    const actorsText = normalizeNameList(meta.actors).join(', ');
    const map = {
      title: meta.title || '',
      year: meta.year || '',
      country: meta.country || '',
      genres: genresText,
      duration: meta.duration || '',
      director: meta.director || '',
      studio: meta.studio || '',
      description: meta.description || '',
      extra: meta.extra || '',
      actors: actorsText
    };
    result = result.replace(/{{\s*(\w+)\s*}}/g, (m, key) => {
      if (Object.prototype.hasOwnProperty.call(map, key)) {
        return map[key];
      }
      return '';
    });
    return result.trim();
  }

  function showJsonEditor(initialData, onConfirm) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:100000;display:flex;align-items:center;justify-content:center;';
    
    const panel = document.createElement('div');
    panel.style.cssText = 'background:#181818;color:#f5f5f5;border-radius:8px;padding:16px;width:500px;max-width:90vw;display:flex;flex-direction:column;gap:12px;border:1px solid #333;box-shadow:0 10px 40px rgba(0,0,0,0.5);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;';
    
    const title = document.createElement('h3');
    title.textContent = t.jsonPreview;
    title.style.cssText = 'margin:0;font-size:16px;font-weight:600;color:' + themeColor + ';';
    
    const textarea = document.createElement('textarea');
    textarea.value = JSON.stringify(initialData, null, 2);
    textarea.style.cssText = 'width:100%;height:300px;background:#111;color:#eee;border:1px solid #333;border-radius:4px;padding:8px;font-family:monospace;font-size:12px;resize:vertical;outline:none;';
    textarea.onfocus = () => { textarea.style.borderColor = themeColor; };
    textarea.onblur = () => { textarea.style.borderColor = '#333'; };
    
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;justify-content:flex-end;gap:8px;';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = t.cancel;
    cancelBtn.style.cssText = 'padding:6px 12px;border-radius:4px;border:1px solid #444;background:transparent;color:#ccc;cursor:pointer;font-size:13px;transition:all 0.2s;';
    cancelBtn.onmouseover = () => { cancelBtn.style.borderColor = '#666'; cancelBtn.style.color = '#fff'; };
    cancelBtn.onmouseout = () => { cancelBtn.style.borderColor = '#444'; cancelBtn.style.color = '#ccc'; };
    cancelBtn.onclick = () => {
        document.body.removeChild(overlay);
    };
    
    const sendBtn = document.createElement('button');
    sendBtn.textContent = t.send;
    sendBtn.style.cssText = `padding:6px 16px;border-radius:4px;border:none;background:${themeColor};color:white;cursor:pointer;font-weight:600;font-size:13px;box-shadow:0 2px 4px rgba(0,0,0,0.2);transition:transform 0.1s;`;
    sendBtn.onmousedown = () => { sendBtn.style.transform = 'scale(0.96)'; };
    sendBtn.onmouseup = () => { sendBtn.style.transform = 'scale(1)'; };
    sendBtn.onclick = () => {
        try {
            const parsed = JSON.parse(textarea.value);
            document.body.removeChild(overlay);
            onConfirm(parsed);
        } catch (e) {
            alert(t.invalidJson + ': ' + e.message);
        }
    };
    
    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(sendBtn);
    
    panel.appendChild(title);
    panel.appendChild(textarea);
    panel.appendChild(btnRow);
    overlay.appendChild(panel);
    
    document.body.appendChild(overlay);
  }

  function showTextPreview(titleText, contentText, names) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:100000;display:flex;align-items:center;justify-content:center;';

    const panel = document.createElement('div');
    panel.style.cssText = 'background:#181818;color:#f5f5f5;border-radius:10px;padding:14px;width:780px;max-width:92vw;max-height:88vh;display:flex;flex-direction:column;gap:12px;border:1px solid #333;box-shadow:0 10px 40px rgba(0,0,0,0.55);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;';

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:10px;';

    const title = document.createElement('div');
    title.textContent = titleText || '';
    title.style.cssText = 'font-size:15px;font-weight:700;color:' + themeColor + ';';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = 'width:32px;height:32px;border-radius:8px;border:1px solid #333;background:#111;color:#ddd;cursor:pointer;font-size:20px;line-height:28px;';
    closeBtn.onclick = () => document.body.removeChild(overlay);

    header.appendChild(title);
    header.appendChild(closeBtn);

    const textarea = document.createElement('textarea');
    textarea.value = contentText || '';
    textarea.readOnly = true;
    textarea.style.cssText = 'width:100%;height:260px;background:#0f0f0f;color:#eee;border:1px solid #333;border-radius:8px;padding:10px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono",monospace;font-size:12px;resize:vertical;outline:none;';
    textarea.onfocus = () => { textarea.style.borderColor = themeColor; };
    textarea.onblur = () => { textarea.style.borderColor = '#333'; };

    const list = document.createElement('div');
    list.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;align-items:flex-start;max-height:220px;overflow:auto;padding:2px;';

    const normalized = normalizeNameList(names);
    normalized.forEach((n) => {
      const b = document.createElement('button');
      b.textContent = n;
      b.style.cssText = 'padding:6px 10px;border-radius:999px;border:1px solid #333;background:#111;color:#eee;cursor:pointer;font-size:12px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
      b.onmouseover = () => { b.style.borderColor = themeColor; };
      b.onmouseout = () => { b.style.borderColor = '#333'; };
      b.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        copyToClipboard(n)
          .then(() => showToast(t.actorNameCopied))
          .catch(() => showToast(t.metadataCopyFailed));
      };
      list.appendChild(b);
    });

    panel.appendChild(header);
    panel.appendChild(textarea);
    if (normalized.length) panel.appendChild(list);
    overlay.appendChild(panel);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) document.body.removeChild(overlay);
    });

    document.body.appendChild(overlay);
  }

  function addTagsToEmby(itemId, tags, skipPreview = false) {
    if (!embyApiUrl || !embyApiToken) {
      alert(t.embyApiSettings + ' ' + t.clickToSet);
      openSettings();
      return;
    }

    // Fix: Remove Array.prototype.toJSON if present, as it causes double-serialization 
    // on sites using old libraries (e.g. hunk-ch.com)
    if (Array.prototype.toJSON) {
        console.warn(debugPrefix, 'Removing non-standard Array.prototype.toJSON to fix JSON serialization');
        delete Array.prototype.toJSON;
    }

    const performRequest = (id, data) => {
        if (!id) {
            showToast(t.missingItemId);
            return;
        }
        const url = `${embyApiUrl.replace(/\/+$/, '')}/Items/${id}/Tags/Add`;
        
        console.log(debugPrefix, 'Sending AddTags Request:', {
            url: url,
            method: 'POST',
            body: data
        });

        GM_xmlhttpRequest({
            method: 'POST',
            url: url,
            headers: {
            'X-Emby-Token': embyApiToken,
            'Content-Type': 'application/json'
            },
            data: JSON.stringify(data),
            onload: (resp) => {
                console.log(debugPrefix, 'AddTags Response:', {
                    status: resp.status,
                    statusText: resp.statusText,
                    responseText: resp.responseText,
                    responseHeaders: resp.responseHeaders
                });

                if (resp.status >= 200 && resp.status < 300) {
                    showToast(t.tagsAdded);
                } else {
                    console.error(debugPrefix, 'add tags failed', resp);
                    showToast(t.tagsAddFailed + ': ' + resp.status);
                }
            },
            onerror: (err) => {
                console.error(debugPrefix, 'add tags error', err);
                showToast(t.tagsAddFailed);
            }
        });
    };

    console.log(debugPrefix, 'addTagsToEmby input tags:', tags);

    let finalTags = [];
    
    // Normalize input to an array
    let rawArray = [];
    if (Array.isArray(tags)) {
        rawArray = tags;
    } else if (typeof tags === 'string') {
        const trimmed = tags.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) {
                    rawArray = parsed;
                } else {
                    rawArray = [trimmed];
                }
            } catch (e) {
                console.warn(debugPrefix, 'JSON parse error for tags string:', e);
                rawArray = [trimmed];
            }
        } else {
            rawArray = [trimmed];
        }
    } else if (tags) {
        // Handle array-like objects or single values
        rawArray = Array.from(tags).length > 0 ? Array.from(tags) : [tags];
    }

    // Normalize each item to { Name: string }
    finalTags = rawArray.map(item => {
        if (item === null || item === undefined) return null;
        // If item is already an object with Name, use it
        if (typeof item === 'object' && item.Name) {
            return { Name: String(item.Name) };
        }
        // Otherwise treat as string
        return { Name: String(item) };
    }).filter(item => item !== null);

    const initialData = {
      Tags: finalTags
    };
    
    console.log(debugPrefix, 'Preview Tags Data (Normalized):', initialData);

    if (skipPreview && itemId) {
        performRequest(itemId, initialData);
    } else {
        showJsonEditor(initialData, (data) => {
            performRequest(itemId, data);
        });
    }
  }

  function createMetadataControls(type, meta, conf) {
    const container = document.createElement('span');
    container.style.cssText = 'display:inline-flex;align-items:center;gap:4px;margin-left:6px;vertical-align:middle;';

    const copyBtn = document.createElement('button');
    const copyText = {
      actors: t.metadataActorsCopy,
      genres: t.metadataGenresCopy,
      description: t.metadataDescriptionCopy
    }[type] || 'Copy';
    
    copyBtn.textContent = copyText;
    copyBtn.style.cssText = 'padding:2px 6px;border-radius:4px;background-color:' + themeColor + ';color:white;border:none;font-size:11px;cursor:pointer;line-height:1.5;vertical-align:middle;';
    copyBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      copyToClipboard(renderWithTemplate(meta, conf.template, type))
        .then(() => showToast(t.metadataCopied))
        .catch(err => {
          console.error(err);
          showToast(t.metadataCopyFailed);
        });
    };
    container.appendChild(copyBtn);

    if (type === 'genres') {
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'Item ID';
      input.style.cssText = 'width:60px;box-sizing:border-box;padding:0 6px;font-size:11px;border:1px solid #666;border-radius:4px;background:#222;color:#fff;margin:0 0 0 4px;height:20px;line-height:20px;';
      input.onclick = (e) => e.stopPropagation();
      input.onkeydown = (e) => e.stopPropagation();

      const jsonBtn = document.createElement('button');
      jsonBtn.textContent = '{}';
      jsonBtn.title = t.jsonPreview;
      jsonBtn.style.cssText = 'padding:0 6px;border-radius:4px;background-color:#2196F3;color:white;border:none;font-size:12px;cursor:pointer;margin-left:2px;line-height:20px;height:20px;vertical-align:middle;font-family:monospace;';
      jsonBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Pass current input value as itemId, but don't skip preview
        addTagsToEmby(input.value.trim(), normalizeNameList(meta.genres), false);
      };

      const addBtn = document.createElement('button');
      addBtn.textContent = '+';
      addBtn.title = t.addToEmby;
      addBtn.style.cssText = 'padding:0 6px;border-radius:4px;background-color:#4CAF50;color:white;border:none;font-size:14px;cursor:pointer;margin-left:2px;line-height:20px;height:20px;vertical-align:middle;';
      addBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const val = input.value.trim();
        if (val) {
          // Skip preview if we have an ID
          addTagsToEmby(val, normalizeNameList(meta.genres), true);
        } else {
          showToast(t.missingItemId);
          input.focus();
        }
      };

      container.appendChild(input);
      container.appendChild(jsonBtn);
      container.appendChild(addBtn);
    }

    if (type === 'actors') {
      const namesBtn = document.createElement('button');
      namesBtn.textContent = t.actorNames;
      namesBtn.style.cssText = 'padding:2px 6px;border-radius:4px;background-color:#333;color:#fff;border:1px solid #444;font-size:11px;cursor:pointer;line-height:1.5;vertical-align:middle;';
      namesBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const names = normalizeNameList(meta.actors);
        if (!names.length) return;

        const existing = container.querySelector('.emby-actor-names-panel');
        if (existing) {
          existing.remove();
          return;
        }

        if (getComputedStyle(container).position === 'static') {
          container.style.position = 'relative';
        }

        const panel = document.createElement('div');
        panel.className = 'emby-actor-names-panel';
        panel.style.cssText = 'position:absolute;top:100%;right:0;margin-top:6px;min-width:160px;max-width:260px;max-height:240px;overflow:auto;background:#0f0f0f;border:1px solid #333;border-radius:10px;padding:8px;box-shadow:0 12px 32px rgba(0,0,0,0.65);z-index:99999;display:flex;flex-direction:column;gap:6px;';

        names.forEach((n) => {
          const b = document.createElement('button');
          b.textContent = n;
          b.style.cssText = 'text-align:left;padding:6px 8px;border-radius:8px;border:1px solid #333;background:#151515;color:#eee;cursor:pointer;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
          b.onmouseover = () => { b.style.borderColor = themeColor; };
          b.onmouseout = () => { b.style.borderColor = '#333'; };
          b.onclick = (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            copyToClipboard(n)
              .then(() => showToast(t.actorNameCopied))
              .catch(() => showToast(t.metadataCopyFailed));
          };
          panel.appendChild(b);
        });

        container.appendChild(panel);

        const onDocClick = (ev) => {
          if (ev.target === namesBtn) return;
          if (panel.contains(ev.target)) return;
          panel.remove();
          document.removeEventListener('click', onDocClick, true);
        };
        document.addEventListener('click', onDocClick, true);
      };

      const previewBtn = document.createElement('button');
      previewBtn.textContent = t.actorPreview;
      previewBtn.style.cssText = 'padding:2px 6px;border-radius:4px;background-color:#1f1f1f;color:#fff;border:1px solid #444;font-size:11px;cursor:pointer;line-height:1.5;vertical-align:middle;';
      previewBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const names = normalizeNameList(meta.actors);
        const text = renderWithTemplate(meta, conf.template, type);
        showTextPreview(t.metadataActorsTitle, text, names);
      };

      container.appendChild(namesBtn);
      container.appendChild(previewBtn);
    }

    return container;
  }

  function initPornolab() {
    if (!location.host.includes('pornolab.net')) return;
    if (!location.pathname.includes('/forum/viewtopic.php')) return;
    const body = document.querySelector('.post_body');
    if (!body) return;

    const meta = {
      title: '',
      year: '',
      country: '',
      genres: [],
      duration: '',
      director: '',
      studio: '',
      actors: [],
      description: '',
      extra: ''
    };

    const titleEl = body.querySelector('.post-color-text');
    if (titleEl) {
      meta.title = titleEl.textContent.trim();
    }

    const labelMap = {
      'Год производства': 'year',
      'Страна': 'country',
      'Жанр': 'genres',
      'Продолжительность': 'duration',
      'Режиссер': 'director',
      'Студия': 'studio',
      'В ролях': 'actors',
      'Описание': 'description',
      'Доп. информация': 'extra'
    };

    function collectLabelValue(span) {
      let text = '';
      let node = span.nextSibling;
      while (node) {
        if (node.nodeType === 1 && node.classList.contains('post-b')) break;
        if (node.nodeType === 1 && node.tagName === 'DIV') break;
        if (node.nodeType === 3) {
          text += node.textContent;
        } else if (node.nodeType === 1) {
          if (node.tagName === 'BR') {
            text += '\n';
          } else {
            text += node.textContent;
          }
        }
        node = node.nextSibling;
      }
      return text.replace(/^[\s:]+/, '').replace(/\s+$/g, '');
    }

    const spans = body.querySelectorAll('.post-b');
    spans.forEach(span => {
      const label = span.textContent.replace(/\s+/g, ' ').trim().replace(/[:：]\s*$/, '');
      const key = labelMap[label];
      if (!key) return;
      const value = collectLabelValue(span);
      if (!value) return;
      if (key === 'genres') {
        meta.genres = value.split(',').map(s => s.trim()).filter(Boolean);
      } else if (key === 'actors') {
        meta.actors = value.split(',').map(s => s.trim()).filter(Boolean);
      } else {
        meta[key] = value;
      }
    });

    const config = (metadataConfigs && typeof metadataConfigs === 'object') ? metadataConfigs : defaultMetadataConfigs;

    const typeToLabel = {
      actors: 'В ролях',
      genres: 'Жанр',
      description: 'Описание'
    };

    ['actors', 'genres', 'description'].forEach(type => {
      const conf = (config && config[type]) || defaultMetadataConfigs[type];
      if (!conf || !conf.enabled) return;
      const labelText = typeToLabel[type];
      const span = Array.from(body.querySelectorAll('.post-b')).find(s => s.textContent.replace(/\s+/g, ' ').trim().replace(/[:：]\s*$/, '') === labelText);
      if (!span) return;
      const text = renderWithTemplate(meta, conf.template, type);
      if (!text) return;

      const controls = createMetadataControls(type, meta, conf);

      let insertAfter = span;
      let node = span.nextSibling;
      while (node) {
        if (node.nodeType === 1 && node.classList.contains('post-b')) break;
        if (node.nodeType === 1 && node.classList.contains('post-br')) {
          insertAfter = node;
          break;
        }
        insertAfter = node;
        node = node.nextSibling;
      }

      if (insertAfter && insertAfter.parentNode) {
        insertAfter.parentNode.insertBefore(controls, insertAfter.nextSibling);
      } else if (span.parentNode) {
        span.parentNode.insertBefore(controls, span.nextSibling);
      }
    });
  }

  function initIafd() {
    if (!location.host.includes('iafd.com')) return;
    const titleEl = document.querySelector('h1');
    if (!titleEl) return;

    const titleText = titleEl.textContent.trim();

    const meta = {
      title: titleText.replace(/\s*\(\d{4}\)$/, ''),
      year: '',
      country: '',
      genres: [],
      duration: '',
      director: '',
      studio: '',
      actors: [],
      description: '',
      extra: ''
    };

    const yearMatch = titleText.match(/\((\d{4})\)/);
    if (yearMatch) {
      meta.year = yearMatch[1];
    }

    const bioHeadings = document.querySelectorAll('p.bioheading');
    bioHeadings.forEach(heading => {
      const label = heading.textContent.trim();
      const data = heading.nextElementSibling && heading.nextElementSibling.classList.contains('biodata') ? heading.nextElementSibling : null;
      if (!data) return;
      const text = data.textContent.replace(/\s+/g, ' ').trim();
      if (!text) return;
      if (label === 'Minutes') {
        meta.duration = text;
      } else if (label === 'Director') {
        meta.director = text;
      } else if (label === 'Studio') {
        meta.studio = text;
      }
    });

    const castBoxes = document.querySelectorAll('.castbox a');
    castBoxes.forEach(a => {
      const name = a.textContent.replace(/\s+/g, ' ').trim();
      if (name) {
        meta.actors.push(name);
      }
    });

    const config = (metadataConfigs && typeof metadataConfigs === 'object') ? metadataConfigs : defaultMetadataConfigs;

    const header = Array.from(document.querySelectorAll('.panel-heading h3')).find(h => h.textContent.trim() === 'Performers');
    if (!header) return;

    const container = document.createElement('div');
    container.style.cssText = 'margin:6px 0 4px 0;display:flex;flex-wrap:wrap;gap:6px;';

    ['actors', 'genres', 'description'].forEach(type => {
      const conf = (config && config[type]) || defaultMetadataConfigs[type];
      if (!conf || !conf.enabled) return;
      const text = renderWithTemplate(meta, conf.template, type);
      if (!text) return;
      
      const controls = createMetadataControls(type, meta, conf);
      controls.style.marginLeft = '0'; // Reset margin as flex gap handles it
      container.appendChild(controls);
    });

    if (!container.hasChildNodes()) return;
    header.parentNode.insertBefore(container, header.nextSibling);
  }

  const debugPrefix = '🧩 [emby-gv-helper]';
  let embyItemTimer = null;
  let embyItemInterval = null;

  // Cache for people data: MainItemId -> { Name: ActorId }
  const peopleCacheMap = {};
  const peopleFetchStatus = {}; // MainItemId -> 'pending' | 'done' | 'failed'

  function initEmbyItem() {
    console.log(debugPrefix, 'initEmbyItem called', {
      host: location.host,
      pathname: location.pathname,
      hash: location.hash,
      resourceBaseUrl
    });

    if (!location.host.includes('lustfulboy.com')) {
      console.log(debugPrefix, 'exit: host not lustfulboy.com');
      return;
    }
    if (!location.pathname.includes('/web/index.html')) {
      console.log(debugPrefix, 'exit: pathname not /web/index.html');
      return;
    }
    if (!location.hash.includes('item?id=')) {
      console.log(debugPrefix, 'exit: hash does not contain item?id=');
      return;
    }

    // Inject styles for hover effect
    if (!document.getElementById('dan-emby-styles')) {
       const style = document.createElement('style');
       style.id = 'dan-emby-styles';
       style.textContent = `
         .cardBox .dan-hover-reveal { opacity: 0; transition: opacity 0.2s ease-in-out; }
         .cardBox:hover .dan-hover-reveal, .cardBox:focus-within .dan-hover-reveal { opacity: 1; }
       `;
       document.head.appendChild(style);
    }

    // Helper for image upload
    const uploadImage = (itemId, file) => {
      if (!embyApiUrl || !embyApiToken) {
        alert(t.embyApiSettings + ' ' + t.clickToSet);
        openSettings();
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Data = e.target.result.split(',')[1];
        if (!base64Data) {
          showToast(t.uploadFailed);
          return;
        }

        const url = `${embyApiUrl.replace(/\/+$/, '')}/Items/${itemId}/Images/Primary`;
        GM_xmlhttpRequest({
          method: 'POST',
          url: url,
          headers: {
            'X-Emby-Token': embyApiToken,
            'Content-Type': file.type || 'image/jpeg'
          },
          data: base64Data,
          onload: (resp) => {
            if (resp.status >= 200 && resp.status < 300) {
              showToast(t.uploadSuccess);
            } else {
              console.error(debugPrefix, 'upload failed', resp);
              showToast(t.uploadFailed + ': ' + resp.status);
            }
          },
          onerror: (err) => {
            console.error(debugPrefix, 'upload error', err);
            showToast(t.uploadFailed);
          }
        });
      };
      reader.readAsDataURL(file);
    };

    const triggerUpload = (itemId) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          uploadImage(itemId, file);
        }
      };
      document.body.appendChild(input);
      input.click();
      setTimeout(() => input.remove(), 1000); // Cleanup
    };

    if (!resourceBaseUrl) {
      console.log(debugPrefix, 'exit: resourceBaseUrl is empty');
      return;
    }

    if (embyItemTimer) {
      console.log(debugPrefix, 'clear previous timer');
      clearInterval(embyItemTimer);
      embyItemTimer = null;
    }

    let tries = 0;
    const maxTries = 20;
    embyItemTimer = setInterval(() => {
      if (tries === 0) {
        console.log(debugPrefix, 'timer started for item button');
      }
      tries += 1;
      if (tries > maxTries) {
        console.log(debugPrefix, 'maxTries exceeded, stop timer');
        clearInterval(embyItemTimer);
        embyItemTimer = null;
        return;
      }

      const itemViews = document.querySelectorAll('.view-item-item');
      if (itemViews.length === 0) {
        if (tries === 1 || tries === maxTries) {
          console.log(debugPrefix, 'no .view-item-item found, try', tries, '/', maxTries);
        }
        return;
      }

      if (tries === 1) {
        console.log(debugPrefix, 'found itemViews count', itemViews.length);
      }

      // Iterate all views to ensure stacked views get buttons
      itemViews.forEach((view, index) => {
        // --- 0. Get Main Item ID for API calls ---
        let mainItemId = view.getAttribute('data-id'); // Try view itself first
        if (!mainItemId) {
           const mainItemElem = view.querySelector('.detailImageContainerCard[data-id]') || view.querySelector('.btnPlaystate[data-id]');
           if (mainItemElem) mainItemId = mainItemElem.getAttribute('data-id');
        }
        
        // Fallback: Try to get ID from URL params (e.g. ?id=12345)
        if (!mainItemId) {
           const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
           if (urlParams.has('id')) mainItemId = urlParams.get('id');
        }

        // --- Fetch People if needed ---
        if (mainItemId && embyApiUrl && embyApiToken) {
          if (!peopleFetchStatus[mainItemId]) {
            peopleFetchStatus[mainItemId] = 'pending';
            // Use the endpoint that returns Item details including People
            const url = `${embyApiUrl.replace(/\/+$/, '')}/Items?Ids=${mainItemId}&Fields=People`;
            GM_xmlhttpRequest({
              method: 'GET',
              url: url,
              headers: { 'X-Emby-Token': embyApiToken, 'Accept': 'application/json' },
              onload: (resp) => {
                if (resp.status === 200) {
                  try {
                    let data = JSON.parse(resp.responseText);
                    let people = [];
                    // Normalize: Expecting { Items: [ { People: [...] } ] }
                    if (data && data.Items && data.Items.length > 0 && data.Items[0].People) {
                       people = data.Items[0].People;
                    } else if (Array.isArray(data)) {
                       // Fallback for direct array return (unlikely for this endpoint but safe to keep)
                       people = data;
                    } else if (data && Array.isArray(data.People)) {
                       // Fallback for direct object return
                       people = data.People;
                    }
                    
                    peopleCacheMap[mainItemId] = {};
                    people.forEach(p => {
                      if (p.Name && p.Id) peopleCacheMap[mainItemId][p.Name] = p.Id;
                    });
                    console.log(debugPrefix, 'Fetched people for', mainItemId, 'count:', Object.keys(peopleCacheMap[mainItemId]).length);
                    peopleFetchStatus[mainItemId] = 'done';
                  } catch (e) {
                    console.error(debugPrefix, 'Error parsing people', e);
                    peopleFetchStatus[mainItemId] = 'failed';
                  }
                } else {
                  console.error(debugPrefix, 'API Error', resp.status);
                  peopleFetchStatus[mainItemId] = 'failed';
                }
              },
              onerror: (err) => { 
                 console.error(debugPrefix, 'Request Error', err);
                 peopleFetchStatus[mainItemId] = 'failed'; 
              }
            });
          }
        }

        // --- 1. Resource Button Logic ---
        const sectionTitle = view.querySelector('.mediaSources .sectionTitle');
        const moreBtn = view.querySelector('.btnMoreCommands.detailButton');
        
        if (sectionTitle && moreBtn) {
           const existing = view.querySelector('[data-dan-resource-link="1"]');
           if (!existing) {
             const pathDiv = sectionTitle.querySelector('div:not(.mediaInfoItems)');
             if (pathDiv) {
               const rawPath = pathDiv.textContent.trim();
               const marker = '/media/lustfulboy/';
               const idx = rawPath.indexOf(marker);
               if (idx !== -1) {
                 const afterMarker = rawPath.slice(idx + marker.length);
                 const dirPart = afterMarker.replace(/[^/]+$/, '');
                 if (dirPart) {
                    const segments = dirPart.split('/').filter(Boolean).map(encodeURIComponent);
                    const relative = segments.join('/');
                    const base = resourceBaseUrl.replace(/\/+$/, '');
                    const url = relative ? base + '/' + relative : base;
                    
                    console.log(debugPrefix, `adding button to view ${index}`, { url });
            
                    const linkBtn = document.createElement('button');
                    linkBtn.type = 'button';
                    linkBtn.setAttribute('is', 'emby-button');
                    linkBtn.className = 'btnMainPlay raised detailButton emby-button';
                    linkBtn.dataset.danResourceLink = '1';
                    linkBtn.textContent = t.resourceOpenButton;
                    linkBtn.style.cssText = 'margin-left:.5em;background:' + themeColor + ';border-color:' + themeColor + ';';
                    linkBtn.onclick = () => {
                      window.open(url, '_blank', 'noopener');
                    };
            
                    if (moreBtn.parentNode) {
                      moreBtn.parentNode.insertBefore(linkBtn, moreBtn.nextSibling);
                    }
                 }
               }
             }
           }
        }

        // --- 2. Main Title Image Button Logic ---
        const titleContainer = view.querySelector('.itemPrimaryNameContainer');
        if (titleContainer) {
          const existingImgBtn = titleContainer.querySelector('[data-dan-img-upload="1"]');
          if (!existingImgBtn) {
            const imgBtn = document.createElement('button');
            imgBtn.setAttribute('is', 'paper-icon-button-light');
            imgBtn.className = 'btnDetailEdit btnEditImages secondaryText flex-shrink-zero paper-icon-button-light';
            imgBtn.title = t.uploadImage;
            imgBtn.ariaLabel = t.uploadImage;
            imgBtn.dataset.danImgUpload = '1';
            imgBtn.innerHTML = '<i class="md-icon" style="color:' + themeColor + '">add_a_photo</i>';
            imgBtn.onclick = () => {
              // Extract ItemId from URL hash
              const match = location.hash.match(/id=(\d+)/);
              const itemId = match ? match[1] : null;
              if (itemId) {
                triggerUpload(itemId);
              } else {
                console.error(debugPrefix, 'Could not find ItemId in hash');
              }
            };
            titleContainer.appendChild(imgBtn);
          }

          // New: Copy Item ID Button
          const existingCopyBtn = titleContainer.querySelector('[data-dan-copy-id="1"]');
          if (!existingCopyBtn) {
            const copyBtn = document.createElement('button');
            copyBtn.setAttribute('is', 'paper-icon-button-light');
            copyBtn.className = 'btnDetailEdit secondaryText flex-shrink-zero paper-icon-button-light';
            copyBtn.title = t.copyItemId;
            copyBtn.ariaLabel = t.copyItemId;
            copyBtn.dataset.danCopyId = '1';
            copyBtn.innerHTML = '<i class="md-icon" style="color:' + themeColor + '">content_copy</i>';
            copyBtn.onclick = () => {
               const match = location.hash.match(/id=(\d+)/);
               const itemId = match ? match[1] : null;
               if (itemId) {
                   copyToClipboard(itemId).then(() => {
                       showToast(t.itemIdCopied + ': ' + itemId);
                   }).catch((err) => {
                       console.error(debugPrefix, 'Copy failed', err);
                       showToast(t.metadataCopyFailed);
                   });
               } else {
                   console.error(debugPrefix, 'Could not find ItemId in hash');
               }
            };
            titleContainer.appendChild(copyBtn);
          }
        }

        // --- 3. Actor Card Image Button Logic ---
        // Since actor cards can be many and virtualized, we check them in every tick
        const actorCards = view.querySelectorAll('.peopleItemsContainer .virtualScrollItem, .peopleItemsContainer .card');
        actorCards.forEach(card => {
          // Check if already has button
          if (card.querySelector('[data-dan-actor-upload="1"]')) return;

          // Try to get Item ID from multiple sources
          let actorId = null;
          
          // 0. Try People Cache (API Source - Most Reliable for missing images)
          if (mainItemId && peopleCacheMap[mainItemId]) {
             // Find name element
             let name = null;
             const nameBtn = card.querySelector('.cardTextActionButton') || card.querySelector('[data-action="link"]');
             if (nameBtn && nameBtn.textContent) {
                name = nameBtn.textContent.trim();
             } else {
                // Try title attribute on name button or card content
                if (nameBtn && nameBtn.title) name = nameBtn.title;
                // Try finding any text node that might be the name
                else {
                    const textNode = card.querySelector('.cardText');
                    if (textNode) name = textNode.textContent.trim();
                }
             }
             
             if (name) {
                // Exact match
                if (peopleCacheMap[mainItemId][name]) {
                   actorId = peopleCacheMap[mainItemId][name];
                } else {
                   // Case-insensitive match
                   const lowerName = name.toLowerCase();
                   const foundKey = Object.keys(peopleCacheMap[mainItemId]).find(k => k.toLowerCase() === lowerName);
                   if (foundKey) actorId = peopleCacheMap[mainItemId][foundKey];
                }
             }
          }
          
          // 1. Try image src (common case)
          if (!actorId) {
            const img = card.querySelector('img.cardImage');
            if (img && img.src && !img.src.includes('default')) {
              const idMatch = img.src.match(/\/Items\/(\d+)\/Images/);
              if (idMatch) actorId = idMatch[1];
            }
          }

          // 2. Try background-image style (sometimes used for covers)
          if (!actorId) {
             const bgDiv = card.querySelector('.cardImageContainer');
             if (bgDiv && bgDiv.style.backgroundImage) {
                const idMatch = bgDiv.style.backgroundImage.match(/\/Items\/(\d+)\/Images/);
                if (idMatch) actorId = idMatch[1];
             }
          }

          // 3. Try data attributes on card or any descendant
          if (!actorId) {
             // Check card itself
             if (card.getAttribute('data-id')) actorId = card.getAttribute('data-id');
             if (card.getAttribute('data-itemid')) actorId = card.getAttribute('data-itemid');
             
             // Check descendants
             if (!actorId) {
                const idElem = card.querySelector('[data-id], [data-itemid]');
                if (idElem) {
                   actorId = idElem.getAttribute('data-id') || idElem.getAttribute('data-itemid');
                }
             }
          }

          // 4. Try link hrefs
          if (!actorId) {
             const links = card.querySelectorAll('a[href*="id="]');
             for (const link of links) {
               const hrefMatch = link.href && link.href.match(/id=(\d+)/);
               if (hrefMatch) { actorId = hrefMatch[1]; break; }
             }
          }
          
          // 5. Last resort: Try to find ID in onclick handler string (risky but possible)
          if (!actorId) {
             const clickable = card.querySelector('[onclick*="Item"]');
             if (clickable) {
                const match = clickable.getAttribute('onclick').match(/Item.*['"](\d+)['"]/);
                if (match) actorId = match[1];
             }
          }

          if (!actorId) return;

          // Strategy: Append to cardBox to avoid overlay interference
          // The cardBox is usually the relative parent.
          const cardBox = card.querySelector('.cardBox') || card;
          
          // Check if button already exists in cardBox (or card if cardBox missing)
          if (cardBox.querySelector('.cardOverlayButton-tr')) return;

          // Create button container for top-right
          const btnContainer = document.createElement('div');
          btnContainer.className = 'cardOverlayButton-tr dan-hover-reveal'; // Custom class with hover effect
          // Position absolute top-right. Ensure z-index is higher than overlays (usually 1-10)
          // Adjusted position to be more top-right
          btnContainer.style.cssText = 'position:absolute;top:2px;right:2px;z-index:9999;pointer-events:auto;';
          
          const uploadBtn = document.createElement('button');
          uploadBtn.type = 'button';
          uploadBtn.setAttribute('is', 'paper-icon-button-light');
          uploadBtn.className = 'paper-icon-button-light cardOverlayButton cardOverlayButton-hover itemAction md-icon cardOverlayButtonIcon cardOverlayButtonIcon-hover';
          uploadBtn.dataset.danActorUpload = '1';
          uploadBtn.title = t.uploadImage;
          // Smaller button size (24px), smaller icon, no margin needed due to absolute positioning
          uploadBtn.style.cssText = 'width:24px;height:24px;padding:0;min-width:24px;margin:0;border-radius:50%;overflow:hidden;';
          // Adjusted icon size and background
          uploadBtn.innerHTML = '<i class="md-icon" style="font-size:1.1rem;color:' + themeColor + ';background:rgba(0,0,0,0.7);width:100%;height:100%;display:flex;align-items:center;justify-content:center;">add_a_photo</i>';
          uploadBtn.onclick = (e) => {
             e.preventDefault();
             e.stopPropagation();
             triggerUpload(actorId);
          };

          btnContainer.appendChild(uploadBtn);
          
          // Make sure cardBox is positioned so absolute child works
          const computedStyle = window.getComputedStyle(cardBox);
          if (computedStyle.position === 'static') {
             cardBox.style.position = 'relative';
          }
          
          cardBox.appendChild(btnContainer);
        });

      });
      
      // Do NOT clear interval here, keep polling until maxTries to catch late-loading views
    }, 500);
  }

  function initFratx() {
    if (!location.host.includes('fratx.com')) return;
    
    const tagsWrap = document.querySelector('.VideoTagsWrap');
    if (!tagsWrap) return;

    const meta = {
        genres: []
    };

    const tags = tagsWrap.querySelectorAll('a.tag .tag-text');
    tags.forEach(span => {
        meta.genres.push(span.textContent.trim());
    });

    if (meta.genres.length === 0) return;

    const conf = (metadataConfigs && metadataConfigs.genres) || defaultMetadataConfigs.genres;
    if (!conf || !conf.enabled) return;
    
    const controls = createMetadataControls('genres', meta, conf);
    controls.style.marginTop = '10px';
    controls.style.display = 'block';
    
    tagsWrap.appendChild(controls);
  }

  function initGamesVideo() {
    if (!location.host.includes('games-video.co.jp')) return;

    // Unlock copy for all pages
    const style = document.createElement('style');
    style.textContent = 'body, * { user-select: text !important; -webkit-user-select: text !important; }';
    document.head.appendChild(style);
    ['copy', 'cut', 'contextmenu', 'selectstart', 'mousedown', 'mouseup', 'keydown', 'keypress', 'keyup'].forEach(type => {
      document.addEventListener(type, e => {
        e.stopPropagation();
      }, true);
    });

    // Metadata parsing only for detail page
    if (!location.pathname.includes('dvd_detail.php')) return;

    const titleEl = document.querySelector('.titlebar h2');
    const title = titleEl ? titleEl.textContent.trim() : '';

    const meta = {
      title: title,
      year: '',
      country: '',
      genres: [],
      duration: '',
      director: '',
      studio: '',
      actors: [],
      description: '',
      extra: ''
    };

    const tds = document.querySelectorAll('td');
    let targetTd = null;
    for (const td of tds) {
      if (td.textContent.trim().startsWith('カテゴリー：')) {
        const links = td.querySelectorAll('a');
        meta.genres = Array.from(links)
          .map(a => a.textContent.trim())
          .filter(text => text.length > 0);
        targetTd = td;
        break;
      }
    }

    if (targetTd && meta.genres.length > 0) {
      const conf = (metadataConfigs && metadataConfigs.genres) || defaultMetadataConfigs.genres;
      
      if (conf && conf.enabled) {
        const controls = createMetadataControls('genres', meta, conf);
        targetTd.appendChild(controls);
      }
    }
  }

  function initDaiichisouko() {
    if (!location.host.includes('daiichisouko.com')) return;

    // 1. Description
    // The description is inside <p class="clear">...</p>
    const descP = document.querySelector('p.clear');
    if (descP) {
        // Replace <br> with newlines
        let text = descP.innerHTML.replace(/<br\s*\/?>/gi, '\n');
        // Remove HTML tags
        text = text.replace(/<[^>]+>/g, '').trim();

        const meta = { description: text };
        const conf = (metadataConfigs && metadataConfigs.description) || defaultMetadataConfigs.description;
        
        if (conf && conf.enabled && text) {
            const controls = createMetadataControls('description', meta, conf);
            // Insert after the p.clear element
            descP.parentNode.insertBefore(controls, descP.nextSibling);
            controls.style.marginBottom = '10px';
            controls.style.display = 'block';
        }
    }

    // 2. Genres (Type + Genre)
    // "Type" is category_id=6, 5, 8 etc.
    // "Genre" is play_id=4, 9 etc.
    // They are in <dl><dt><p>タイプ</p></dt><dd>...</dd></dl> and <dl><dt><p>ジャンル</p></dt><dd>...</dd></dl>
    const genreSet = new Set();
    const dls = document.querySelectorAll('div.stc dl');
    
    dls.forEach(dl => {
        const dt = dl.querySelector('dt p');
        if (!dt) return;
        const label = dt.textContent.trim();
        if (label === 'タイプ' || label === 'ジャンル') {
            const anchors = dl.querySelectorAll('dd a');
            anchors.forEach(a => {
                genreSet.add(a.textContent.trim());
            });
        }
    });

    if (genreSet.size > 0) {
        const meta = { genres: Array.from(genreSet) };
        const conf = (metadataConfigs && metadataConfigs.genres) || defaultMetadataConfigs.genres;
        
        if (conf && conf.enabled) {
            const controls = createMetadataControls('genres', meta, conf);
            // Insert after the last dl
            const lastDl = dls[dls.length - 1];
            if (lastDl) {
                lastDl.parentNode.appendChild(controls);
                controls.style.marginTop = '10px';
                controls.style.display = 'block';
            }
        }
    }
  }

  function initTranceVideo() {
    if (!location.host.includes('trance-video.com')) return;

    const requestHeaders = { Referer: location.href, Origin: location.origin };

    const reportOnce = (() => {
      let done = false;
      return (title, err) => {
        if (done) return;
        done = true;
        try {
          const extra = err ? `: ${String(err && (err.message || err)).slice(0, 200)}` : '';
          showToast(`TranceVideo 未初始化${extra}`);
        } catch (_) {}
        try {
          console.error('[emby-gv-helper] TranceVideo init failed:', title, err);
        } catch (_) {}
      };
    })();

    const safeCall = (title, fn) => {
      try {
        return fn();
      } catch (e) {
        reportOnce(title, e);
        return undefined;
      }
    };

    const toAbsUrlLocal = (raw, baseHref = location.href) => {
      const s = String(raw || '').trim();
      if (!s) return '';
      try {
        return new URL(s, baseHref).href;
      } catch (_) {
        return '';
      }
    };

    const normalizeTranceImageUrl = (raw) => {
      const abs = toAbsUrlLocal(raw, location.href);
      if (!abs) return '';
      try {
        const u = new URL(abs);
        u.pathname = u.pathname.replace(/_5(\.(?:jpe?g|png|webp))$/i, '_1$1');
        return u.href;
      } catch (_) {
        return abs.replace(/_5(\.(?:jpe?g|png|webp))$/i, '_1$1');
      }
    };

    const buildIndexedFilename = (idx) => {
      const base = getHunkChPosterFilenameSetting();
      const n = String(idx).padStart(2, '0');
      const m = String(base || '').trim().match(/^(.*?)(\.[a-z0-9]+)$/i);
      if (m) return `${m[1]}-${n}${m[2]}`;
      return `poster-${n}.jpg`;
    };

    const ensureTranceStyle = () => {
      if (!document.head) return;
      if (document.getElementById('emby-trancevideo-style')) return;
      const style = document.createElement('style');
      style.id = 'emby-trancevideo-style';
      style.textContent = `
        .title_photo .photo_flexslider .slides img { cursor: zoom-in !important; }
        .title_photo .photo_flexslider .flex-control-thumbs img { cursor: zoom-in !important; }

        .emby-trancevideo-lightbox { position: fixed !important; inset: 0 !important; display: none !important; align-items: center !important; justify-content: center !important; background: rgba(0,0,0,.92) !important; z-index: 2147483647 !important; cursor: zoom-out !important; padding: 0 !important; margin: 0 !important; }
        .emby-trancevideo-lightbox[aria-hidden="false"] { display: flex !important; }
        .emby-trancevideo-lightbox img { max-width: 96vw !important; max-height: 96vh !important; width: auto !important; height: auto !important; object-fit: contain !important; display: block !important; }
        body.emby-trancevideo-lightbox-open { overflow: hidden !important; }
      `;
      document.head.appendChild(style);
    };

    const ensureTranceLightbox = () => {
      if (!document.body || document.body.dataset.embyTranceLightboxReady === '1') return;
      document.body.dataset.embyTranceLightboxReady = '1';

      const overlay = document.createElement('div');
      overlay.className = 'emby-trancevideo-lightbox';
      overlay.setAttribute('aria-hidden', 'true');
      const viewerImg = document.createElement('img');
      viewerImg.alt = '';
      overlay.appendChild(viewerImg);
      document.body.appendChild(overlay);

      const close = () => {
        overlay.setAttribute('aria-hidden', 'true');
        viewerImg.removeAttribute('src');
        document.body.classList.remove('emby-trancevideo-lightbox-open');
      };

      const open = (url) => {
        if (!url) return;
        viewerImg.src = url;
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('emby-trancevideo-lightbox-open');
      };

      window.__embyTranceVideoLightboxOpen = open;
      window.__embyTranceVideoLightboxClose = close;

      overlay.addEventListener('click', () => close(), true);
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); }, true);

      document.addEventListener('click', (e) => {
        const target = e.target;
        if (!(target instanceof Element)) return;
        if (target.closest('.emby-hunkch-download-btn')) return;
        if (overlay.getAttribute('aria-hidden') === 'false' && overlay.contains(target)) return;

        const img = target.closest('.title_photo .photo_flexslider .slides img, .title_photo .photo_flexslider .flex-control-thumbs img');
        if (!img) return;
        const url = normalizeTranceImageUrl(img.currentSrc || img.src);
        if (!url) return;

        e.preventDefault();
        e.stopPropagation();

        if (overlay.getAttribute('aria-hidden') === 'false') {
          close();
          return;
        }
        open(url);
      }, true);
    };

    const injectGalleryButtons = () => {
      const lis = Array.from(document.querySelectorAll('.title_photo .photo_flexslider .slides > li:not(.clone)'));
      if (lis.length === 0) return;

      lis.forEach((li, i) => {
        if (!(li instanceof HTMLElement)) return;
        if (li.dataset.embyTranceGalleryReady === '1') return;
        const img = li.querySelector('img');
        if (!img) return;
        const url = normalizeTranceImageUrl(img.currentSrc || img.src);
        if (!url) return;

        if (getComputedStyle(li).position === 'static') li.style.position = 'relative';
        const btn = createDownloadFabButton({ title: t.hunkChDownloadImage, right: 10, bottom: 10, zIndex: 30, size: 42 });
        btn.classList.add('emby-trancevideo-gallery-download');
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const saveAs = getHunkChSaveAsSetting();
          downloadByUrl(url, buildIndexedFilename(i + 1), saveAs, { headers: requestHeaders });
        });
        li.appendChild(btn);
        li.dataset.embyTranceGalleryReady = '1';
      });
    };

    ensureTranceStyle();
    safeCall('ensureTranceLightbox', () => ensureTranceLightbox());
    safeCall('injectGalleryButtons', () => injectGalleryButtons());
    setInterval(() => safeCall('injectGalleryButtons', () => injectGalleryButtons()), 1000);

    safeCall('injectDescriptionAndGenres', () => {
      const descDiv = document.querySelector('div.intro_text');
      if (descDiv) {
          let text = descDiv.innerHTML.replace(/<br\s*\/?>/gi, '\n');
          text = text.replace(/<[^>]+>/g, '').trim();

          const meta = { description: text };
          const conf = ((typeof metadataConfigs !== 'undefined' && metadataConfigs) ? metadataConfigs : defaultMetadataConfigs).description || defaultMetadataConfigs.description;

          if (conf && conf.enabled && text) {
              const controls = createMetadataControls('description', meta, conf);
              descDiv.parentNode.insertBefore(controls, descDiv.nextSibling);
              controls.style.marginBottom = '10px';
              controls.style.display = 'block';
          }
      }

      const genreSet = new Set();
      const prodCat = document.querySelector('div.prod_category ul');
      if (prodCat) {
          const lis = prodCat.querySelectorAll('li');
          lis.forEach(li => {
              const strong = li.querySelector('strong');
              if (!strong) return;
              const label = strong.textContent.trim();
              if (label === 'レーベル' || label === 'カテゴリ') {
                  const items = li.querySelectorAll('div.item a');
                  items.forEach(a => {
                      genreSet.add(a.textContent.trim());
                  });
              }
          });
      }

      if (genreSet.size > 0) {
          const meta = { genres: Array.from(genreSet) };
          const conf = ((typeof metadataConfigs !== 'undefined' && metadataConfigs) ? metadataConfigs : defaultMetadataConfigs).genres || defaultMetadataConfigs.genres;

          if (conf && conf.enabled) {
              const controls = createMetadataControls('genres', meta, conf);
              const prodCatDiv = document.querySelector('div.prod_category');
              if (prodCatDiv) {
                  prodCatDiv.parentNode.insertBefore(controls, prodCatDiv.nextSibling);
                  controls.style.marginTop = '10px';
                  controls.style.display = 'block';
              }
          }
      }
    });
  }

  function initLatinBoyz() {
    if (!location.host.includes('latinboyz.com')) return;
    
    // Iterate over all tag containers found on the page
    // This supports both list view (multiple items) and single page view
    const tagContainers = document.querySelectorAll('ul.post-tags');
    
    tagContainers.forEach(tagsUl => {
        // Prevent double injection
        if (tagsUl.parentNode && tagsUl.parentNode.querySelector('.emby-metadata-controls')) return;

        // Determine scope: find the closest post container, or default to document for single page
        const container = tagsUl.closest('.ttfmp-post-list-item') || document;
        
        const meta = {
          title: '',
          year: '',
          country: '',
          genres: [],
          duration: '',
          director: '',
          studio: 'LatinBoyz',
          actors: [],
          description: '',
          extra: ''
        };

        // Extract tags from the current container
        tagsUl.querySelectorAll('li a').forEach(a => {
            meta.genres.push(a.textContent.trim());
        });

        // Attempt to find title within scope
        let titleEl;
        if (container !== document) {
             titleEl = container.querySelector('.ttfmp-post-list-item-title a');
        } else {
             titleEl = container.querySelector('h1.entry-title') || container.querySelector('h1.post-title');
        }
        if (titleEl) {
            meta.title = titleEl.textContent.trim();
        }

        // Attempt to find description within scope
        let descEl;
        if (container !== document) {
            descEl = container.querySelector('.ttfmp-post-list-item-content p');
        } else {
            descEl = container.querySelector('.entry-content p') || container.querySelector('.ttfmp-post-list-item-content p');
        }
        if (descEl) {
             // Clone to safely remove "read more" links without affecting DOM
             const clone = descEl.cloneNode(true);
             const moreLink = clone.querySelector('.more-link');
             if (moreLink) moreLink.remove();
             meta.description = clone.textContent.trim();
        }

        // Attempt to find date within scope
        let dateEl;
        if (container !== document) {
            dateEl = container.querySelector('.ttfmp-post-list-item-date a');
        } else {
             dateEl = container.querySelector('.ttfmp-post-list-item-date a') || container.querySelector('.date a') || container.querySelector('time');
        }
        
        if (dateEl) {
            const dateText = dateEl.textContent.trim();
            const dateMatch = dateText.match(/(\d{4})/);
            if (dateMatch) {
                meta.year = dateMatch[1];
            }
        }

        const config = (typeof metadataConfigs !== 'undefined' && metadataConfigs) ? metadataConfigs : defaultMetadataConfigs;

        if (meta.genres.length > 0) {
            const type = 'genres';
            const conf = (config && config[type]) || defaultMetadataConfigs[type];
            if (conf && conf.enabled) {
                 const text = renderWithTemplate(meta, conf.template, type);
                 if (text && text.trim()) {
                     const controls = createMetadataControls(type, meta, conf);
                     controls.classList.add('emby-metadata-controls'); // Mark to avoid duplicates
                     controls.style.display = 'inline-flex';
                     controls.style.marginLeft = '10px';
                     
                     // Inject after the UL
                     if (tagsUl.parentNode) {
                         tagsUl.parentNode.appendChild(controls);
                     }
                 }
            }
        }
    });
  }

  function initSayUncle() {
    if (!location.host.includes('sayuncle.com')) return;

    const meta = {
      title: '',
      year: '',
      country: 'USA',
      genres: [],
      duration: '',
      director: '',
      studio: 'SayUncle',
      actors: [],
      description: '',
      extra: ''
    };

    const titleEl = document.querySelector('h1.sceneTitle');
    if (titleEl) meta.title = titleEl.textContent.trim();

    const dateEl = document.querySelector('.sceneDate');
    if (dateEl) {
      const dateText = dateEl.textContent.trim();
      meta.extra += `Release Date: ${dateText}\n`;
      const match = dateText.match(/(\d{4})/);
      if (match) meta.year = match[1];
    }

    const actorLinks = document.querySelectorAll('.contentTitle .model-name-link');
    actorLinks.forEach(a => {
      meta.actors.push({ name: a.textContent.trim() });
    });

    const descEl = document.querySelector('.sceneDesc');
    if (descEl) {
      meta.description = descEl.textContent.trim();
    }

    const tagLinks = document.querySelectorAll('.tags-container a');
    tagLinks.forEach(a => {
      const tag = a.textContent.trim().replace(/,\s*$/, '');
      if (tag) meta.genres.push(tag);
    });

    const seriesEl = document.querySelector('.siteName');
    if (seriesEl) {
      meta.extra += `Series: ${seriesEl.textContent.trim()}\n`;
    }

    const config = (metadataConfigs && typeof metadataConfigs === 'object') ? metadataConfigs : defaultMetadataConfigs;

    // 1. Description Controls
    if (descEl && meta.description) {
      const type = 'description';
      const conf = (config && config[type]) || defaultMetadataConfigs[type];
      if (conf && conf.enabled) {
        const text = renderWithTemplate(meta, conf.template, type);
        if (text && text.trim()) {
          const controls = createMetadataControls(type, meta, conf);
          controls.style.marginTop = '10px';
          controls.style.display = 'block';
          if (descEl.parentNode) {
            descEl.parentNode.insertBefore(controls, descEl.nextSibling);
          }
        }
      }
    }

    // 2. Genres Controls
    const tagsContainer = document.querySelector('.tags-container');
    if (tagsContainer && meta.genres.length > 0) {
      const type = 'genres';
      const conf = (config && config[type]) || defaultMetadataConfigs[type];
      if (conf && conf.enabled) {
        const text = renderWithTemplate(meta, conf.template, type);
        if (text && text.trim()) {
          const controls = createMetadataControls(type, meta, conf);
          controls.style.marginTop = '10px';
          controls.style.display = 'block';
          tagsContainer.appendChild(controls);
        }
      }
    }

    // 3. Actors Controls (Optional but helpful)
    const contentTitle = document.querySelector('.contentTitle');
    if (contentTitle && meta.actors.length > 0) {
      const type = 'actors';
      const conf = (config && config[type]) || defaultMetadataConfigs[type];
      if (conf && conf.enabled) {
        const text = renderWithTemplate(meta, conf.template, type);
        if (text && text.trim()) {
          const controls = createMetadataControls(type, meta, conf);
          controls.style.marginLeft = '10px';
          controls.style.display = 'inline-flex';
          contentTitle.appendChild(controls);
        }
      }
    }
  }

  function initSayUncle() {
        if (!location.host.includes('sayuncle.com')) return;

        const meta = {
            title: '',
            year: '',
            country: 'USA',
            genres: [],
            duration: '',
            director: '',
            studio: 'SayUncle',
            actors: [],
            description: '',
            extra: ''
        };

        const titleEl = document.querySelector('h1.sceneTitle');
        if (titleEl) meta.title = titleEl.textContent.trim();

        const dateEl = document.querySelector('.sceneDate');
        if (dateEl) {
            const dateText = dateEl.textContent.trim();
            meta.extra += `Release Date: ${dateText}\n`;
            const match = dateText.match(/(\d{4})/);
            if (match) meta.year = match[1];
        }

        const actorLinks = document.querySelectorAll('.contentTitle .model-name-link');
        actorLinks.forEach(a => {
            meta.actors.push({ name: a.textContent.trim() });
        });

        const descEl = document.querySelector('.sceneDesc');
        if (descEl) {
            meta.description = descEl.textContent.trim();
        }

        const tagLinks = document.querySelectorAll('.tags-container a');
        tagLinks.forEach(a => {
            const tag = a.textContent.trim().replace(/,\s*$/, '');
            if (tag) meta.genres.push(tag);
        });

        const seriesEl = document.querySelector('.siteName');
        if (seriesEl) {
            meta.extra += `Series: ${seriesEl.textContent.trim()}\n`;
        }

        const config = (metadataConfigs && typeof metadataConfigs === 'object') ? metadataConfigs : defaultMetadataConfigs;

        // 1. Description Controls
        if (descEl && meta.description) {
            const type = 'description';
            const conf = (config && config[type]) || defaultMetadataConfigs[type];
            if (conf && conf.enabled) {
                const text = renderWithTemplate(meta, conf.template, type);
                if (text && text.trim()) {
                    const controls = createMetadataControls(type, meta, conf);
                    controls.style.marginTop = '10px';
                    controls.style.display = 'block';
                    if (descEl.parentNode) {
                        descEl.parentNode.insertBefore(controls, descEl.nextSibling);
                    }
                }
            }
        }

        // 2. Genres Controls
        const tagsContainer = document.querySelector('.tags-container');
        if (tagsContainer && meta.genres.length > 0) {
            const type = 'genres';
            const conf = (config && config[type]) || defaultMetadataConfigs[type];
            if (conf && conf.enabled) {
                const text = renderWithTemplate(meta, conf.template, type);
                if (text && text.trim()) {
                    const controls = createMetadataControls(type, meta, conf);
                    controls.style.marginTop = '10px';
                    controls.style.display = 'block';
                    tagsContainer.appendChild(controls);
                }
            }
        }

        // 3. Actors Controls (Optional but helpful)
        const contentTitle = document.querySelector('.contentTitle');
        if (contentTitle && meta.actors.length > 0) {
            const type = 'actors';
            const conf = (config && config[type]) || defaultMetadataConfigs[type];
            if (conf && conf.enabled) {
                const text = renderWithTemplate(meta, conf.template, type);
                if (text && text.trim()) {
                    const controls = createMetadataControls(type, meta, conf);
                    controls.style.marginLeft = '10px';
                    controls.style.display = 'inline-flex';
                    contentTitle.appendChild(controls);
                }
            }
        }
    }

    function initHunkCh() {
    if (!location.host.includes('hunk-ch.com')) return;
    
    const setupSearchDock = () => {
      const searchBox = document.querySelector('#search_box');
      const searchForm = searchBox ? searchBox.closest('form') : null;
      if (!searchBox || !searchForm || !document.body) return;

      if (!document.getElementById('emby-hunkch-search-sticky-style')) {
        const style = document.createElement('style');
        style.id = 'emby-hunkch-search-sticky-style';
        style.textContent = `
          .emby-hunkch-search-dock {
            display: block !important;
          }
          .emby-hunkch-search-dock-fixed {
            position: fixed !important;
            top: 10px !important;
            right: auto !important;
            z-index: 9999 !important;
            margin: 0 !important;
          }
          .emby-hunkch-search-dock-placeholder {
            display: none;
          }
          .emby-hunkch-search-dock-placeholder.is-active {
            display: block;
          }
        `;
        document.head.appendChild(style);
      }

      let placeholder = searchForm.previousElementSibling;
      if (!(placeholder instanceof HTMLElement) || !placeholder.classList.contains('emby-hunkch-search-dock-placeholder')) {
        placeholder = document.createElement('div');
        placeholder.className = 'emby-hunkch-search-dock-placeholder';
        searchForm.parentNode.insertBefore(placeholder, searchForm);
      }

      searchForm.classList.add('emby-hunkch-search-dock');

      if (searchForm.dataset.embyHunkChSearchDockReady === '1') {
        if (typeof window.__embyHunkChSearchDockUpdate === 'function') {
          window.__embyHunkChSearchDockUpdate();
        }
        return;
      }
      searchForm.dataset.embyHunkChSearchDockReady = '1';

      const topOffset = 10;
      const updatePosition = () => {
        const wasFixed = searchForm.classList.contains('emby-hunkch-search-dock-fixed');
        if (wasFixed) {
          searchForm.classList.remove('emby-hunkch-search-dock-fixed');
          searchForm.style.left = '';
          searchForm.style.width = '';
        }

        placeholder.classList.remove('is-active');
        placeholder.style.height = '0px';

        const naturalRect = searchForm.getBoundingClientRect();
        const naturalTop = naturalRect.top + window.scrollY;
        const naturalLeft = Math.round(naturalRect.left);
        const naturalWidth = Math.max(1, Math.round(naturalRect.width));
        const naturalHeight = Math.max(1, Math.round(naturalRect.height));
        placeholder.style.width = `${naturalWidth}px`;

        const shouldFix = window.scrollY > naturalTop - topOffset;
        if (!shouldFix) return;

        searchForm.classList.add('emby-hunkch-search-dock-fixed');
        searchForm.style.left = `${naturalLeft}px`;
        searchForm.style.width = `${naturalWidth}px`;
        placeholder.style.height = `${naturalHeight}px`;
        placeholder.classList.add('is-active');
      };

      window.__embyHunkChSearchDockUpdate = updatePosition;
      window.addEventListener('scroll', updatePosition, { passive: true });
      window.addEventListener('resize', updatePosition);
      updatePosition();
    };

    setupSearchDock();

    if (location.pathname.includes('search.php')) {

      const anchors = document.querySelectorAll('a[href*="movie_detail.php?code="]');
      if (anchors.length === 0) return;

      function getContrastTextColor(hex) {
        const m = /^#?([0-9a-fA-F]{6})$/.exec((hex || '').trim());
        if (!m) return '#fff';
        const n = m[1];
        const r = parseInt(n.slice(0, 2), 16) / 255;
        const g = parseInt(n.slice(2, 4), 16) / 255;
        const b = parseInt(n.slice(4, 6), 16) / 255;
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        return lum > 0.6 ? '#111' : '#fff';
      }

      const fg = getContrastTextColor(themeColor);
      anchors.forEach(a => {
        if (a.classList.contains('button_movie_detail')) return;
        if (a.querySelector('img')) return;
        if (a.querySelector('.emby-hunkch-code-badge')) return;

        let code = '';
        try {
          const u = new URL(a.href, location.href);
          code = u.searchParams.get('code') || '';
        } catch (_) {
          return;
        }
        code = code.trim();
        if (!code) return;

        const badge = document.createElement('span');
        badge.className = 'emby-hunkch-code-badge';
        badge.textContent = code;
        badge.style.cssText = [
          'display:inline-block',
          'margin-right:6px',
          'padding:1px 6px',
          'border-radius:4px',
          `background:${themeColor}`,
          `color:${fg}`,
          'font-weight:800',
          'font-size:12px',
          'line-height:16px',
          'border:1px solid rgba(255,255,255,.22)',
          'box-shadow:0 1px 6px rgba(0,0,0,.35)'
        ].join(';');

        a.insertBefore(badge, a.firstChild);
      });
      return;
    }

    if (!location.pathname.includes('movie_detail.php')) return;

    const meta = {
      title: '',
      year: '',
      country: 'Japan',
      genres: [],
      duration: '',
      director: '',
      studio: '',
      actors: [],
      description: '',
      extra: ''
    };

    const titleEl = document.querySelector('div.product_detail_centre h2');
    if (titleEl) {
      meta.title = titleEl.textContent.trim();
    }

    const slider = document.querySelector('.flexslider2');
    if (slider) {
      const attachDownloadBtn = () => {
        const viewport = slider.querySelector('.flex-viewport');
        if (!viewport) return false;

        const existingBtns = slider.querySelectorAll('.emby-hunkch-download-btn');
        existingBtns.forEach(b => {
          if (b.parentNode !== viewport) {
            b.remove();
          }
        });

        if (viewport.querySelector('.emby-hunkch-download-btn')) return true;

        if (getComputedStyle(viewport).position === 'static') {
          viewport.style.position = 'relative';
        }

        const btn = createDownloadFabButton({ title: t.hunkChDownloadImage, right: 12, bottom: 12, zIndex: 30, size: 50 });
        viewport.appendChild(btn);

        const getActiveImg = () => {
          return slider.querySelector('ul.slides li.flex-active-slide img') || slider.querySelector('ul.slides li img');
        };

        const resolveActiveUrl = () => {
          const img = getActiveImg();
          if (!img) return '';
          const src = img.currentSrc || img.getAttribute('src') || img.src || '';
          if (!src) return '';
          try {
            return new URL(src, location.href).href;
          } catch (_) {
            return '';
          }
        };

        const updateBtnVisibility = () => {
          const url = resolveActiveUrl();
          console.log(debugPrefix, url);
          btn.style.display = url ? 'flex' : 'none';
          btn.dataset.url = url;
        };

        const triggerDownload = (url) => {
          const filename = getHunkChPosterFilenameSetting();
          const saveAs = getHunkChSaveAsSetting();
          downloadByUrl(url, filename, saveAs);
        };

        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          triggerDownload(btn.dataset.url || resolveActiveUrl());
        });

        updateBtnVisibility();

        const slides = slider.querySelector('ul.slides');
        if (slides) {
          const obs = new MutationObserver(() => updateBtnVisibility());
          obs.observe(slides, { subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
        }

        slider.addEventListener('click', () => setTimeout(updateBtnVisibility, 0), true);
        window.addEventListener('resize', () => setTimeout(updateBtnVisibility, 0));
        return true;
      };

      if (!attachDownloadBtn()) {
        setTimeout(() => attachDownloadBtn(), 500);
      }
      const rootObs = new MutationObserver(() => attachDownloadBtn());
      rootObs.observe(slider, { childList: true, subtree: true });
    }

    let introP = null;
    const storyImg = document.querySelector('div.detail_title.new img[title="ストーリー"]');
    if (storyImg) {
      const titleDiv = storyImg.closest('div.detail_title.new');
      if (titleDiv) {
        const p = titleDiv.nextElementSibling;
        if (p && p.tagName === 'P') {
           introP = p;
           let descHtml = p.innerHTML;
           descHtml = descHtml.replace(/<br\s*\/?>/gi, '\n');
           const tempDiv = document.createElement('div');
           tempDiv.innerHTML = descHtml;
           meta.description = tempDiv.textContent.trim();
        }
      }
    }

    const dataDiv = document.querySelector('div.data');
    let lastGenreLink = null;
    if (dataDiv) {
      const text = dataDiv.textContent;
      
      const studioLink = dataDiv.querySelector('a[href*="b="]');
      if (studioLink) {
        meta.studio = studioLink.textContent.trim();
      }

      const dateMatch = text.match(/発売日：(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        meta.year = dateMatch[1].substring(0, 4);
        meta.extra += `Release Date: ${dateMatch[1]}\n`;
      }

      const durationMatch = text.match(/収録時間：(\d+分?)/);
      if (durationMatch) {
        meta.duration = durationMatch[1];
      }

      const genreLinks = dataDiv.querySelectorAll('a[href*="c="]');
      genreLinks.forEach(a => {
        meta.genres.push(a.textContent.trim());
      });
      if (genreLinks.length > 0) {
        lastGenreLink = genreLinks[genreLinks.length - 1];
      }
    }
    
    const config = (metadataConfigs && typeof metadataConfigs === 'object') ? metadataConfigs : defaultMetadataConfigs;

    // 1. Description Controls
    if (introP) {
        const type = 'description';
        const conf = (config && config[type]) || defaultMetadataConfigs[type];
        if (conf && conf.enabled && meta.description) {
             const text = renderWithTemplate(meta, conf.template, type);
             if (text && text.trim()) {
                 const controls = createMetadataControls(type, meta, conf);
                 controls.style.marginTop = '10px';
                 controls.style.display = 'block';
                 if (introP.parentNode) {
                     introP.parentNode.insertBefore(controls, introP.nextSibling);
                 }
             }
        }
    }

    // 2. Genres Controls
    if (meta.genres.length > 0) {
        const type = 'genres';
        const conf = (config && config[type]) || defaultMetadataConfigs[type];
        if (conf && conf.enabled) {
             const text = renderWithTemplate(meta, conf.template, type);
             if (text && text.trim()) {
                 const controls = createMetadataControls(type, meta, conf);
                 controls.style.display = 'inline-flex';
                 controls.style.marginLeft = '10px';
                 
                 if (lastGenreLink && lastGenreLink.parentNode) {
                     lastGenreLink.parentNode.insertBefore(controls, lastGenreLink.nextSibling);
                 } else if (dataDiv) {
                     dataDiv.appendChild(controls);
                 }
             }
        }
    }
  }

  function init4HorLover() {
    if (!location.host.includes('4horlover.com')) return;

    const getDownloadedKey = (postId) => `4hlDownloaded:${String(postId || '').trim()}`;
    const getDownloaded = (postId) => {
      const key = getDownloadedKey(postId);
      if (typeof GM_getValue === 'function') return !!GM_getValue(key, false);
      try { return localStorage.getItem(key) === '1'; } catch (_) { return false; }
    };
    const setDownloaded = (postId) => {
      const key = getDownloadedKey(postId);
      if (typeof GM_setValue === 'function') GM_setValue(key, true);
      else {
        try { localStorage.setItem(key, '1'); } catch (_) {}
      }
    };
    const getPostIdFromArticle = (article) => {
      if (!article) return '';
      const id = String(article.getAttribute('id') || '').trim();
      const m = id.match(/^post-(\d+)$/);
      if (m) return m[1];
      const a = article.querySelector('.entry-title a[href*="?p="]');
      const href = a ? (a.getAttribute('href') || a.href || '') : '';
      const m2 = href.match(/[?&]p=(\d+)/);
      return m2 ? m2[1] : '';
    };

    const autoPassAgeGate = () => {
      const form = document.querySelector('form.age-gate-form') || document.querySelector('form[action*="age_gate_submit"]');
      if (!form) return false;
      if (document.body && document.body.dataset && document.body.dataset.emby4hlAgeGateDone === '1') return true;

      const d = document.getElementById('age-gate-d') || form.querySelector('input[name="age_gate[d]"]');
      const m = document.getElementById('age-gate-m') || form.querySelector('input[name="age_gate[m]"]');
      const y = document.getElementById('age-gate-y') || form.querySelector('input[name="age_gate[y]"]');
      if (!d || !m || !y) return false;

      const setVal = (input, value) => {
        input.focus();
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.blur();
      };

      setVal(d, '09');
      setVal(m, '09');
      setVal(y, '1999');

      const remember = form.querySelector('input[type="checkbox"][name="age_gate[remember]"]');
      if (remember) remember.checked = true;

      if (document.body && document.body.dataset) document.body.dataset.emby4hlAgeGateDone = '1';

      const submitBtn = form.querySelector('input[type="submit"], button[type="submit"], .age-gate-submit');
      setTimeout(() => {
        try {
          if (submitBtn && typeof submitBtn.click === 'function') {
            submitBtn.click();
          } else if (typeof form.requestSubmit === 'function') {
            form.requestSubmit();
          } else if (typeof form.submit === 'function') {
            form.submit();
          }
        } catch (e) {
          console.error(debugPrefix, '4horlover age gate submit failed', e);
        }
      }, 50);
      return true;
    };

    if (autoPassAgeGate()) return;

    const ensureStyle = () => {
      if (document.getElementById('emby-4horlover-style')) return;
      const style = document.createElement('style');
      style.id = 'emby-4horlover-style';
      style.textContent = `
        #post-70776 { display:none !important; }
        #custom_html-7, #media_image-2 { display:none !important; }
        #custom_html-2 { display:none !important; }

        #page { width: calc(100% - 24px) !important; max-width: 1700px !important; margin: 0 auto !important; }
        #content { padding: 0 0 24px !important; }
        .site-header { padding: 0 !important; margin: 0 0 0.5em !important; }
        #masthead .site-header-inner { padding: 0.5em 0 !important; }

        article { margin: 0 !important; padding: 0 !important; padding-left: 0 !important; border-bottom: 1px solid rgba(255,255,255,.08) !important; }
        article.emby-4hl-downloaded .entry-content { background: rgba(255,255,255,.035) !important; border-color: rgba(255,255,255,.18) !important; }
        article.emby-4hl-downloaded .entry-content { border-radius: 10px !important; }
        @media (prefers-color-scheme: light) {
          article.emby-4hl-downloaded .entry-content { background: rgba(46, 204, 113, .10) !important; border-color: rgba(46, 204, 113, .25) !important; }
        }
        .entry-header { margin: 0 0 8px !important; }

        .entry-content { border: 1px solid rgba(255,255,255,.12) !important; }


        .entry-title { margin: 0 !important; line-height: 1.2 !important; }
        .entry-title { --wpdm-link-hover-color: ${themeColor}; }
        .entry-title, .entry-title a { color: ${themeColor} !important; }
        .entry-title a:hover, .entry-title a:focus, .entry-title a:active { color: ${themeColor} !important; filter: none !important; }
        html.wp-dark-mode-active:not([data-wp-dark-mode-preset="0"]) body .entry-title a:hover,
        html[data-wp-dark-mode-active]:not([data-wp-dark-mode-preset="0"]) body .entry-title a:hover,
        html[data-wp-dark-mode-loading]:not([data-wp-dark-mode-preset="0"]) body .entry-title a:hover { color: ${themeColor} !important; filter: none !important; }
        .entry-meta { margin: 0 0 6px !important; font-size: 12px !important; opacity: .9 !important; }
        .entry-content p { margin: 6px 0 !important; }
        .entry-content img { width: ${fourHorLoverImgWidth}px !important; max-width: 100% !important; height: auto !important; }
        .entry-content iframe { max-width: 100% !important; }
        .entry-content img { cursor: zoom-in !important; }

        .emby-4hl-lightbox { position: fixed !important; inset: 0 !important; display: none !important; align-items: center !important; justify-content: center !important; background: rgba(0,0,0,.92) !important; z-index: 2147483647 !important; cursor: zoom-out !important; padding: 0 !important; margin: 0 !important; }
        .emby-4hl-lightbox[aria-hidden="false"] { display: flex !important; }
        .emby-4hl-lightbox img { max-width: 96vw !important; max-height: 96vh !important; width: auto !important; height: auto !important; object-fit: contain !important; display: block !important; }
        body.emby-4hl-lightbox-open { overflow: hidden !important; }

        #main.site-main { display: grid !important; grid-template-columns: 1fr !important; gap: 12px 16px !important; align-items: start !important; }
        #main.site-main > * { min-width: 0 !important; }
        #main.site-main > nav.navigation.pagination { grid-column: 1 / -1 !important; }

        .sidebar #primary { padding-right: 20px !important; }
        #secondary { padding-left: 0 !important; }
        #secondary .widget { margin: 0 0 0 !important; }
        #secondary iframe { width: 100% !important; }
        #custom_html-4 iframe { height: 650px !important; }

        #secondary .widget h3.widget-title, #colophon .widget h3.widget-title { margin-bottom: 0 !important; }
        @media (min-width: 980px) {
          #custom_html-5 .textwidget.custom-html-widget { display: flex !important; align-items: center !important; flex-wrap: nowrap !important; }
          #custom_html-5 .textwidget.custom-html-widget > center { flex: 1 1 49% !important; min-width: 0 !important; margin: 0 !important; padding: 0 !important; white-space: nowrap !important; }
          #custom_html-5 .textwidget.custom-html-widget > center:nth-of-type(2) { flex: 0 0 2% !important; }
        }


        .site-footer { margin-top: 0 !important; padding-top: 0 !important; padding-bottom: 1em !important;}
        .site-info { margin-top: 1em !important;}
        .pagination { margin-top: 1em !important;}

        @media (min-width: 980px) {
          #main.site-main { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }

        @media (min-width: 1100px) {
          #primary { width: calc(100% - 480px) !important; }
          #secondary { width: 460px !important; }
          body.emby-4hl-secondary-sticky #secondary { position: sticky !important; top: 12px !important; align-self: start !important; }
        }
      `;
      document.head.appendChild(style);
    };

    const safeRemove = (el) => {
      try {
        if (el && el.parentNode) el.parentNode.removeChild(el);
      } catch (_) {}
    };

    const setupArchivesCollapse = () => {
      const aside = document.getElementById('archives-2');
      if (!aside || aside.dataset.embyArchivesReady === '1') return;
      const title = aside.querySelector('.widget-title') || aside.querySelector('h3');
      const ul = aside.querySelector('ul');
      if (!title || !ul) return;

      aside.dataset.embyArchivesReady = '1';
      const storageKey = '4hlArchivesExpanded';
      const getExpanded = () => (typeof GM_getValue === 'function') ? !!GM_getValue(storageKey, false) : false;
      const setExpanded = (expanded) => {
        if (typeof GM_setValue === 'function') GM_setValue(storageKey, !!expanded);
      };

      const setSecondarySticky = (sticky) => {
        if (!document.body) return;
        document.body.classList.toggle('emby-4hl-secondary-sticky', !!sticky);
      };

      ul.hidden = !getExpanded();

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'emby-4horlover-archives-toggle';
      btn.textContent = ul.hidden ? '展开' : '收起';
      btn.setAttribute('aria-expanded', ul.hidden ? 'false' : 'true');
      btn.style.cssText = [
        'margin-left:auto',
        'padding:4px 10px',
        'border-radius:999px',
        'border:1px solid rgba(255,255,255,.18)',
        'background:rgba(0,0,0,.25)',
        'color:#fff',
        'cursor:pointer',
        'font-size:12px',
        'line-height:18px'
      ].join(';');

      title.style.display = 'flex';
      title.style.alignItems = 'center';
      title.style.gap = '10px';
      title.appendChild(btn);

      setSecondarySticky(ul.hidden);

      btn.onclick = () => {
        const willExpand = ul.hidden;
        ul.hidden = !willExpand;
        btn.textContent = willExpand ? '收起' : '展开';
        btn.setAttribute('aria-expanded', willExpand ? 'true' : 'false');
        setExpanded(willExpand);
        setSecondarySticky(ul.hidden);
      };
    };

    const setupImageLightbox = () => {
      if (document.body.dataset.emby4hlLightboxReady === '1') return;
      document.body.dataset.emby4hlLightboxReady = '1';

      const overlay = document.createElement('div');
      overlay.className = 'emby-4hl-lightbox';
      overlay.setAttribute('aria-hidden', 'true');
      const viewerImg = document.createElement('img');
      viewerImg.alt = '';
      overlay.appendChild(viewerImg);
      document.body.appendChild(overlay);

      const close = () => {
        overlay.setAttribute('aria-hidden', 'true');
        viewerImg.removeAttribute('src');
        document.body.classList.remove('emby-4hl-lightbox-open');
      };

      const open = (url) => {
        if (!url) return;
        viewerImg.src = url;
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('emby-4hl-lightbox-open');
      };

      overlay.addEventListener('click', () => close(), true);
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
      }, true);

      document.addEventListener('click', (e) => {
        const target = e.target;
        if (!(target instanceof Element)) return;
        if (overlay.getAttribute('aria-hidden') === 'false' && overlay.contains(target)) return;
        const img = target.closest('.entry-content img');
        if (!img) return;

        const link = img.closest('a');
        let url = (img.currentSrc || img.src || '').trim();
        if (link) {
          const href = (link.getAttribute('href') || link.href || '').trim();
          if (href) url = href;
        }

        if (!url) return;
        e.preventDefault();
        e.stopPropagation();

        if (overlay.getAttribute('aria-hidden') === 'false') {
          close();
          return;
        }
        open(url);
      }, true);
    };

    const setupDownloadedTracking = () => {
      if (!document.body || document.body.dataset.emby4hlDownloadedReady === '1') return;
      document.body.dataset.emby4hlDownloadedReady = '1';

      document.addEventListener('click', (e) => {
        const target = e.target;
        if (!(target instanceof Element)) return;
        const a = target.closest('a');
        if (!a) return;
        const text = (a.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
        if (text !== 'download file') return;
        const article = a.closest('article[id^="post-"]');
        if (!article) return;
        const postId = getPostIdFromArticle(article);
        if (!postId) return;
        setDownloaded(postId);
        article.classList.add('emby-4hl-downloaded');
      }, true);
    };

    const applyDownloadedIndicator = () => {
      const articles = document.querySelectorAll('article[id^="post-"]');
      if (!articles.length) return;
      articles.forEach(article => {
        const postId = getPostIdFromArticle(article);
        if (!postId) return;
        article.classList.toggle('emby-4hl-downloaded', getDownloaded(postId));
      });
    };

    const apply = () => {
      ensureStyle();
      safeRemove(document.getElementById('post-70776'));
      safeRemove(document.getElementById('custom_html-7'));
      safeRemove(document.getElementById('media_image-2'));
      setupArchivesCollapse();
      setupImageLightbox();
      setupDownloadedTracking();
      applyDownloadedIndicator();
    };

    apply();
    const obs = new MutationObserver(() => apply());
    obs.observe(document.body, { childList: true, subtree: true });
  }

  function initAdultContentsFc2() {
    if (!location.host.includes('adult.contents.fc2.com')) return;

    const requestHeaders = { Referer: location.href, Origin: location.origin };

    const toAbsUrl = (raw, baseHref = location.href) => {
      const s = String(raw || '').trim();
      if (!s) return '';
      try {
        return new URL(s, baseHref).href;
      } catch (_) {
        return s;
      }
    };

    const normalizeFc2ImageUrl = (raw, baseHref = location.href) => {
      const abs = toAbsUrl(raw, baseHref);
      if (!abs) return '';
      try {
        const u = new URL(abs);
        const host = (u.hostname || '').toLowerCase();
        const isThumb = /(^|\.)contents-thumbnail\d*\.fc2\.com$/.test(host);
        if (!isThumb) return u.href;
        const m = u.pathname.match(/^\/w\d+\/storage(\d+)\.contents\.fc2\.com(\/.+)$/i);
        if (!m) return u.href;
        const storageId = m[1];
        const restPath = m[2];
        return `https://storage${storageId}.contents.fc2.com${restPath}`;
      } catch (_) {
        return abs;
      }
    };

    const isFc2ContentImageUrl = (raw, baseHref = location.href) => {
      const abs = toAbsUrl(raw, baseHref);
      if (!abs) return false;
      try {
        const u = new URL(abs);
        const host = (u.hostname || '').toLowerCase();
        return /(^|\.)contents-thumbnail\d*\.fc2\.com$/.test(host) || /(^|\.)storage\d+\.contents\.fc2\.com$/.test(host);
      } catch (_) {
        return false;
      }
    };

    const pickImgUrl = (img) => {
      if (!img) return '';
      const candidates = [
        img.currentSrc,
        img.getAttribute('src'),
        img.src,
        img.getAttribute('data-src'),
        img.getAttribute('data-original'),
        img.getAttribute('data-lazy'),
        img.getAttribute('data-image'),
        img.getAttribute('data-img')
      ];
      for (const c of candidates) {
        const s = String(c || '').trim();
        if (s) return s;
      }
      return '';
    };

    const ensureBtnIconVisible = (btn) => {
      if (!btn) return;
      btn.style.setProperty('color', '#fff', 'important');
      const svg = btn.querySelector('svg');
      if (svg) svg.style.setProperty('display', 'block', 'important');
      btn.querySelectorAll('path').forEach(p => {
        p.style.setProperty('stroke', '#fff', 'important');
        p.style.setProperty('stroke-width', '2', 'important');
        p.style.setProperty('fill', 'none', 'important');
      });
    };

    const ensureStyle = () => {
      if (document.getElementById('emby-fc2-style')) return;
      const style = document.createElement('style');
      style.id = 'emby-fc2-style';
      style.textContent = `
        .items_article_left img { cursor: zoom-in !important; }

        .emby-fc2-lightbox { position: fixed !important; inset: 0 !important; display: none !important; align-items: center !important; justify-content: center !important; background: rgba(0,0,0,.92) !important; z-index: 2147483647 !important; cursor: zoom-out !important; padding: 0 !important; margin: 0 !important; }
        .emby-fc2-lightbox[aria-hidden="false"] { display: flex !important; }
        .emby-fc2-lightbox img { max-width: 96vw !important; max-height: 96vh !important; width: auto !important; height: auto !important; object-fit: contain !important; display: block !important; }
        body.emby-fc2-lightbox-open { overflow: hidden !important; }
      `;
      document.head.appendChild(style);
    };

    const setupImageLightbox = () => {
      if (!document.body || document.body.dataset.embyFc2LightboxReady === '1') return;
      document.body.dataset.embyFc2LightboxReady = '1';

      const overlay = document.createElement('div');
      overlay.className = 'emby-fc2-lightbox';
      overlay.setAttribute('aria-hidden', 'true');
      const viewerImg = document.createElement('img');
      viewerImg.alt = '';
      overlay.appendChild(viewerImg);
      document.body.appendChild(overlay);

      const close = () => {
        overlay.setAttribute('aria-hidden', 'true');
        viewerImg.removeAttribute('src');
        document.body.classList.remove('emby-fc2-lightbox-open');
      };

      const open = (url) => {
        if (!url) return;
        viewerImg.src = url;
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('emby-fc2-lightbox-open');
      };

      window.__embyFc2LightboxOpen = open;
      window.__embyFc2LightboxClose = close;

      overlay.addEventListener('click', () => close(), true);
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
      }, true);

      document.addEventListener('click', (e) => {
        const target = e.target;
        if (!(target instanceof Element)) return;
        if (overlay.getAttribute('aria-hidden') === 'false' && overlay.contains(target)) return;

        const img = target.closest('.items_article_left img');
        if (!img) return;

        const link = img.closest('a');
        let raw = pickImgUrl(img);
        if (link) {
          const href = (link.getAttribute('href') || link.href || '').trim();
          if (href) raw = href;
        }

        if (!raw) return;
        if (!isFc2ContentImageUrl(raw)) return;
        const url = normalizeFc2ImageUrl(raw);
        if (!url) return;

        e.preventDefault();
        e.stopPropagation();

        if (overlay.getAttribute('aria-hidden') === 'false') {
          close();
          return;
        }
        open(url);
      }, true);
    };

    const enhanceDescriptionIframes = () => {
      const iframes = document.querySelectorAll('iframe[data-iframe="description"], iframe[src*="/widget/article/"][src*="/description"]');
      if (!iframes.length) return false;

      const openTopLightbox = (fromDoc, url) => {
        if (!url) return false;
        try {
          const topDoc = fromDoc && fromDoc.defaultView && fromDoc.defaultView.top ? fromDoc.defaultView.top.document : document;
          const overlay = topDoc.querySelector('.emby-fc2-lightbox');
          const viewerImg = overlay ? overlay.querySelector('img') : null;
          if (!overlay || !viewerImg) return false;

          const isOpen = overlay.getAttribute('aria-hidden') === 'false';
          if (isOpen) {
            overlay.setAttribute('aria-hidden', 'true');
            viewerImg.removeAttribute('src');
            topDoc.body.classList.remove('emby-fc2-lightbox-open');
            return true;
          }

          viewerImg.src = url;
          overlay.setAttribute('aria-hidden', 'false');
          topDoc.body.classList.add('emby-fc2-lightbox-open');
          return true;
        } catch (_) {
          return false;
        }
      };

      const ensureIframeStyle = (doc) => {
        if (!doc || !doc.head) return;
        if (doc.getElementById('emby-fc2-iframe-style')) return;
        const style = doc.createElement('style');
        style.id = 'emby-fc2-iframe-style';
        style.textContent = `
          img { cursor: zoom-in !important; }
        `;
        doc.head.appendChild(style);
      };

      const createDownloadFabButtonInDoc = (doc, { title, right = 12, left = null, bottom = 12, zIndex = 30, size = 50 } = {}) => {
        const btn = doc.createElement('button');
        btn.type = 'button';
        btn.className = 'emby-hunkch-download-btn';
        btn.title = title || '';
        btn.setAttribute('aria-label', title || '');
        btn.style.cssText = [
          'position:absolute',
          (Number.isFinite(left) ? ('left:' + left + 'px') : ('right:' + right + 'px')),
          'bottom:' + bottom + 'px',
          'z-index:' + zIndex,
          'width:' + size + 'px',
          'height:' + size + 'px',
          'padding:0',
          'display:flex',
          'align-items:center',
          'justify-content:center',
          'border-radius:999px',
          'border:1px solid rgba(255,255,255,.22)',
          'background:' + themeColor,
          'color:#fff',
          'cursor:pointer',
          'box-shadow:0 6px 18px rgba(0,0,0,.45)'
        ].join(';');
        btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><path d="M12 3v10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M8 11l4 4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 21h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
        btn.style.setProperty('position', 'absolute', 'important');
        if (Number.isFinite(left)) {
          btn.style.setProperty('left', left + 'px', 'important');
        } else {
          btn.style.setProperty('right', right + 'px', 'important');
        }
        btn.style.setProperty('bottom', bottom + 'px', 'important');
        btn.style.setProperty('z-index', String(zIndex), 'important');
        return btn;
      };

      const isCandidateDescImage = (img) => {
        if (!img) return false;
        const src = pickImgUrl(img);
        if (!src) return false;
        const rect = img.getBoundingClientRect ? img.getBoundingClientRect() : null;
        const w = rect ? rect.width : (img.naturalWidth || 0);
        const h = rect ? rect.height : (img.naturalHeight || 0);
        if (w && h && w < 40 && h < 40) return false;
        return true;
      };

      const ensureWrapperForTargetInDoc = (doc, target, imgForSizing) => {
        if (!doc || !doc.body || !target) return null;
        const existing = target.closest && target.closest('.emby-fc2-img-wrap');
        if (existing) return existing;

        const wrap = doc.createElement('span');
        wrap.className = 'emby-fc2-img-wrap';
        wrap.style.setProperty('position', 'relative', 'important');
        wrap.style.setProperty('display', 'inline-block', 'important');
        wrap.style.setProperty('max-width', '100%', 'important');
        wrap.style.setProperty('line-height', '0', 'important');

        try {
          const img = imgForSizing || (target.tagName === 'IMG' ? target : target.querySelector && target.querySelector('img'));
          const imgStyle = (img && doc.defaultView) ? doc.defaultView.getComputedStyle(img) : null;
          if (imgStyle && (imgStyle.display === 'block' || imgStyle.width === '100%')) {
            wrap.style.setProperty('display', 'block', 'important');
            wrap.style.setProperty('width', '100%', 'important');
            wrap.style.setProperty('line-height', 'normal', 'important');
          }
        } catch (_) {}

        const parent = target.parentNode;
        if (!parent) return null;
        parent.insertBefore(wrap, target);
        wrap.appendChild(target);
        return wrap;
      };

      const injectDownloadBtnsInDoc = (doc) => {
        if (!doc || !doc.body) return false;
        const imgs = doc.querySelectorAll('img');
        if (!imgs.length) return false;

        let injected = false;
        imgs.forEach(img => {
          if (!isCandidateDescImage(img)) return;
          const link = img.closest('a');
          const target = link || img;
          const wrap = ensureWrapperForTargetInDoc(doc, target, img);
          if (!wrap) return;
          if (wrap.querySelector('.emby-hunkch-download-btn.emby-fc2-img-download')) return;

          const raw = (() => {
            const href = link ? (link.getAttribute('href') || link.href || '') : '';
            return String(href || '').trim() || pickImgUrl(img);
          })();
          if (!raw) return;

          const baseHref = (() => {
            try {
              return doc.location && doc.location.href ? doc.location.href : location.href;
            } catch (_) {
              return location.href;
            }
          })();

          const url = isFc2ContentImageUrl(raw, baseHref) ? normalizeFc2ImageUrl(raw, baseHref) : toAbsUrl(raw, baseHref);
          if (!url) return;

          const btn = createDownloadFabButtonInDoc(doc, { title: t.hunkChDownloadImage, right: 10, bottom: 10, zIndex: 30, size: 40 });
          btn.classList.add('emby-fc2-img-download');
          ensureBtnIconVisible(btn);
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const filename = getHunkChPosterFilenameSetting();
            const saveAs = getHunkChSaveAsSetting();
            downloadByUrl(url, filename, saveAs, { headers: requestHeaders });
          });

          wrap.appendChild(btn);
          injected = true;
        });
        return injected;
      };

      const setupLightboxInDoc = (doc) => {
        if (!doc || !doc.body) return false;
        if (doc.body.dataset.embyFc2DescLightboxReady === '1') return true;
        doc.body.dataset.embyFc2DescLightboxReady = '1';

        doc.addEventListener('click', (e) => {
          const target = e.target;
          if (!(target instanceof doc.defaultView.Element)) return;
          if (target.closest('.emby-hunkch-download-btn')) return;

          const img = target.closest('img');
          if (!img) return;
          if (!isCandidateDescImage(img)) return;

          const raw = (() => {
            const link = img.closest('a');
            const href = link ? (link.getAttribute('href') || link.href || '') : '';
            return String(href || '').trim() || pickImgUrl(img);
          })();
          if (!raw) return;

          const baseHref = (() => {
            try {
              return doc.location && doc.location.href ? doc.location.href : location.href;
            } catch (_) {
              return location.href;
            }
          })();

          const url = isFc2ContentImageUrl(raw, baseHref) ? normalizeFc2ImageUrl(raw, baseHref) : toAbsUrl(raw, baseHref);
          if (!url) return;

          e.preventDefault();
          e.stopPropagation();

          openTopLightbox(doc, url);
        }, true);

        return true;
      };

      const enhanceIframe = (iframe) => {
        if (!iframe) return false;
        let doc = null;
        let href = '';
        try {
          doc = iframe.contentDocument;
          href = iframe.contentWindow && iframe.contentWindow.location ? (iframe.contentWindow.location.href || '') : '';
        } catch (_) {
          return false;
        }
        if (!doc) return false;
        if (iframe.dataset.embyFc2DocHref === href && iframe.dataset.embyFc2Enhanced === '1') return true;

        ensureIframeStyle(doc);
        setupLightboxInDoc(doc);
        injectDownloadBtnsInDoc(doc);

        iframe.dataset.embyFc2Enhanced = '1';
        iframe.dataset.embyFc2DocHref = href;

        if (doc.body && doc.body.dataset.embyFc2DescObs !== '1') {
          doc.body.dataset.embyFc2DescObs = '1';
          const obs = new MutationObserver(() => {
            try {
              injectDownloadBtnsInDoc(doc);
            } catch (_) {}
          });
          obs.observe(doc.body, { childList: true, subtree: true });
        }

        return true;
      };

      let ok = false;
      iframes.forEach(iframe => {
        iframe.addEventListener('load', () => enhanceIframe(iframe), true);
        ok = enhanceIframe(iframe) || ok;
      });
      return ok;
    };

    const injectDownloadBtns = () => {
      const root = document.querySelector('.items_article_left');
      if (!root) return false;

      const imgs = root.querySelectorAll('img');
      if (!imgs.length) return false;

      let injected = false;
      imgs.forEach(img => {
        const rect = img.getBoundingClientRect ? img.getBoundingClientRect() : null;
        const small = rect ? (rect.width < 40 && rect.height < 40) : false;

        const link = img.closest('a');
        let raw = link ? (link.getAttribute('href') || link.href || '') : '';
        raw = String(raw || '').trim() || pickImgUrl(img);
        if (!raw) return;
        if (!isFc2ContentImageUrl(raw)) return;
        if (small && !img.closest('.items_article_MainitemThumb, .items_article_SampleImagesArea')) return;

        const container = img.closest('a') || img.parentElement;
        if (!container) return;
        if (container.querySelector('.emby-hunkch-download-btn.emby-fc2-img-download')) return;

        if (getComputedStyle(container).position === 'static') {
          container.style.position = 'relative';
        }

        const btn = createDownloadFabButton({ title: t.hunkChDownloadImage, right: 10, bottom: 10, zIndex: 30, size: 40 });
        btn.classList.add('emby-fc2-img-download');
        ensureBtnIconVisible(btn);
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();

          const link = img.closest('a');
          let raw = link ? (link.getAttribute('href') || link.href || '') : '';
          raw = String(raw || '').trim() || pickImgUrl(img);
          if (!raw) return;
          if (!isFc2ContentImageUrl(raw)) return;
          const url = normalizeFc2ImageUrl(raw);
          if (!url) return;

          const filename = getHunkChPosterFilenameSetting();
          const saveAs = getHunkChSaveAsSetting();
          downloadByUrl(url, filename, saveAs, { headers: requestHeaders });
        });
        container.appendChild(btn);
        injected = true;
      });

      return injected;
    };

    const injectTagControls = () => {
      const tagArea = document.querySelector('.items_article_TagArea');
      if (!tagArea) return false;
      if (tagArea.querySelector('.emby-fc2-genres-controls')) return true;

      const meta = {
        title: '',
        year: '',
        country: 'JP',
        genres: [],
        duration: '',
        director: '',
        studio: '',
        actors: [],
        description: '',
        extra: ''
      };

      const titleEl = document.querySelector('.items_article_headerInfo h3');
      if (titleEl) meta.title = (titleEl.textContent || '').replace(/\s+/g, ' ').trim();

      tagArea.querySelectorAll('a.tagTag, a[data-tag]').forEach(a => {
        const v = (a.getAttribute('data-tag') || a.textContent || '').replace(/\s+/g, ' ').trim();
        if (v) meta.genres.push(v);
      });
      meta.genres = Array.from(new Set(normalizeNameList(meta.genres)));

      if (!meta.genres.length) return false;

      const config = (typeof metadataConfigs !== 'undefined' && metadataConfigs) ? metadataConfigs : defaultMetadataConfigs;
      const type = 'genres';
      const conf = (config && config[type]) || defaultMetadataConfigs[type];
      if (!conf || !conf.enabled) return false;

      const text = renderWithTemplate(meta, conf.template, type);
      if (!text || !text.trim()) return false;

      const controls = createMetadataControls(type, meta, conf);
      controls.style.marginTop = '8px';
      controls.style.display = 'block';
      controls.classList.add('emby-metadata-controls', 'emby-fc2-genres-controls');

      const h3 = tagArea.querySelector('h3');
      if (h3 && h3.parentNode) {
        h3.parentNode.insertBefore(controls, h3.nextSibling);
      } else {
        tagArea.appendChild(controls);
      }

      return true;
    };

    const apply = () => {
      ensureStyle();
      setupImageLightbox();
      injectDownloadBtns();
      injectTagControls();
      enhanceDescriptionIframes();
    };

    apply();
    {
      let tries = 0;
      const maxTries = 20;
      const interval = setInterval(() => {
        tries++;
        try {
          injectDownloadBtns();
          injectTagControls();
        } catch (_) {}
        if (tries >= maxTries) clearInterval(interval);
      }, 1000);
    }
  }

  function initMensRushTv() {
    if (!location.host.includes('mensrush.tv')) return;

    const nextElement = (el) => {
      let cur = el ? el.nextSibling : null;
      while (cur && cur.nodeType !== 1) cur = cur.nextSibling;
      return cur && cur.nodeType === 1 ? cur : null;
    };

    const run = () => {
      const requestHeaders = { Referer: location.href, Origin: location.origin };
      const playerEl = document.querySelector('#playerElement');
      const videoEl = playerEl ? playerEl.querySelector('video') : null;

      const posterImgEl = document.querySelector('#movie_area img.no-save, #movie_area .player img, #movie_area img');
      const posterUrl = (() => {
        const v = videoEl ? ((videoEl.getAttribute('poster') || videoEl.poster || '').trim()) : '';
        if (v) return v;
        const i = posterImgEl;
        if (!i) return '';
        return String(i.currentSrc || i.getAttribute('src') || i.src || '').trim();
      })();

      const posterContainer = (() => {
        if (playerEl) return playerEl;
        if (!posterImgEl) return null;
        return posterImgEl.closest('a') || posterImgEl.parentElement;
      })();

      const codeInput = document.querySelector('input[name="fid"][value], input[name="id"][value]');
      const code = codeInput ? (codeInput.getAttribute('value') || '').trim() : '';

      if (posterContainer && !posterContainer.querySelector('.emby-hunkch-download-btn.emby-mensrush-poster-download')) {
        if (getComputedStyle(posterContainer).position === 'static') posterContainer.style.position = 'relative';
        const btn = createDownloadFabButton({ title: t.hunkChDownloadImage, right: 10, bottom: 10, zIndex: 50, size: 46 });
        btn.classList.add('emby-mensrush-poster-download');
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const url = posterUrl;
          if (!url) return;
          const saveAs = getHunkChSaveAsSetting();
          const filename = getHunkChPosterFilenameSetting();
          downloadByUrl(url, filename, saveAs, { headers: requestHeaders });
        });
        posterContainer.appendChild(btn);
      }

      const meta = {
        title: '',
        year: '',
        country: 'Japan',
        genres: [],
        duration: '',
        director: '',
        studio: 'MensRush',
        actors: [],
        description: '',
        extra: ''
      };

      const titleEl = document.querySelector('.detail_title h2');
      if (titleEl) meta.title = titleEl.textContent.replace(/\s+/g, ' ').trim();

      if (code) meta.extra += `Code: ${code}\n`;

      const movieDetail = document.querySelector('.movie_detail');
      if (movieDetail) {
        const makerLink = movieDetail.querySelector('a[href*="maid="]');
        if (makerLink) meta.studio = makerLink.textContent.replace(/\s+/g, ' ').trim() || meta.studio;

        const durationP = Array.from(movieDetail.querySelectorAll('p')).find(p => p.textContent && p.textContent.includes('再生時間'));
        if (durationP) {
          const m = durationP.textContent.match(/(\d+)\s*分/);
          if (m) meta.duration = `${m[1]} min`;
        }

        const genreP = Array.from(movieDetail.querySelectorAll('p')).find(p => (p.textContent || '').includes('ジャンル') && p.querySelector('a[href*="geid="]'));
        if (genreP) {
          genreP.querySelectorAll('a[href*="geid="]').forEach(a => {
            const g = a.textContent.replace(/\s+/g, ' ').trim();
            if (g) meta.genres.push(g);
          });
        }

        const detailH3 = Array.from(movieDetail.querySelectorAll('h3')).find(h3 => h3.textContent && h3.textContent.replace(/\s+/g, ' ').trim() === '作品詳細');
        if (detailH3) {
          let p = nextElement(detailH3);
          while (p && p.tagName !== 'P') p = nextElement(p);
          if (p) meta.description = p.textContent.replace(/\s+/g, ' ').trim();
        }
      }

      meta.genres = Array.from(new Set(normalizeNameList(meta.genres)));

      const config = (typeof metadataConfigs !== 'undefined' && metadataConfigs) ? metadataConfigs : defaultMetadataConfigs;
      let injected = false;

      const genreP = movieDetail
        ? Array.from(movieDetail.querySelectorAll('p')).find(p => (p.textContent || '').includes('ジャンル') && p.querySelector('a[href*="geid="]'))
        : null;
      if (genreP && meta.genres.length > 0) {
        if (!genreP.querySelector('.emby-metadata-controls.emby-mensrush-genres')) {
          const type = 'genres';
          const conf = (config && config[type]) || defaultMetadataConfigs[type];
          if (conf && conf.enabled) {
            const text = renderWithTemplate(meta, conf.template, type);
            if (text && text.trim()) {
              const controls = createMetadataControls(type, meta, conf);
              controls.style.marginLeft = '10px';
              controls.style.display = 'inline-flex';
              controls.classList.add('emby-metadata-controls', 'emby-mensrush-genres');
              genreP.appendChild(controls);
              injected = true;
            }
          }
        } else {
          injected = true;
        }
      }

      if (movieDetail && meta.description) {
        const detailH3 = Array.from(movieDetail.querySelectorAll('h3')).find(h3 => h3.textContent && h3.textContent.replace(/\s+/g, ' ').trim() === '作品詳細');
        if (detailH3) {
          let p = nextElement(detailH3);
          while (p && p.tagName !== 'P') p = nextElement(p);
          if (p && !p.parentNode.querySelector('.emby-metadata-controls.emby-mensrush-desc')) {
            const type = 'description';
            const conf = (config && config[type]) || defaultMetadataConfigs[type];
            if (conf && conf.enabled) {
              const text = renderWithTemplate(meta, conf.template, type);
              if (text && text.trim()) {
                const controls = createMetadataControls(type, meta, conf);
                controls.style.marginTop = '10px';
                controls.style.display = 'block';
                controls.classList.add('emby-metadata-controls', 'emby-mensrush-desc');
                if (p.parentNode) p.parentNode.insertBefore(controls, p.nextSibling);
                injected = true;
              }
            }
          } else if (p) {
            injected = true;
          }
        }
      }

      return injected;
    };

    run();
    setInterval(run, 1000);
  }

  function initBoyStudio() {
    if (!location.host.includes('boy-studio.com')) return;
    
    // Auto-expand details
    const expandDetails = () => {
        const summaries = document.querySelectorAll('summary');
        summaries.forEach(summary => {
            const text = summary.textContent.trim();
            if (text.includes('詳細を表示') || text.includes('商品説明を読む')) {
                const details = summary.parentElement;
                // Check if it's a DETAILS element
                if (details && details.tagName === 'DETAILS' && !details.open) {
                    details.open = true;
                }
            }
        });
    };

    const injectPlayerPosterDownloadBtn = () => {
        const iframe = document.querySelector('iframe.video-player-iframe[src*="cloudflarestream.com"][src*="poster="]');
        if (!iframe) return;

        const container = iframe.closest('.item__sample-player') || iframe.parentElement;
        if (!container) return;
        if (container.querySelector('.emby-hunkch-download-btn.emby-boystudio-player-poster-download')) return;

        const src = (iframe.getAttribute('src') || iframe.src || '').trim();
        if (!src) return;

        let posterUrl = '';
        try {
          const u = new URL(src, location.href);
          posterUrl = (u.searchParams.get('poster') || '').trim();
        } catch (_) {
          const m = src.match(/[?&]poster=([^&]+)/i);
          posterUrl = m ? m[1] : '';
          try {
            posterUrl = decodeURIComponent(posterUrl);
          } catch (_) {}
          posterUrl = String(posterUrl || '').trim();
        }
        if (!posterUrl) return;
        if (/%[0-9a-f]{2}/i.test(posterUrl)) {
          try {
            posterUrl = decodeURIComponent(posterUrl);
          } catch (_) {}
        }
        if (!posterUrl) return;

        if (getComputedStyle(container).position === 'static') {
          container.style.position = 'relative';
        }
        const btn = createDownloadFabButton({ title: t.hunkChDownloadImage, right: 12, bottom: 12, zIndex: 30, size: 50 });
        btn.classList.add('emby-boystudio-player-poster-download');
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const requestHeaders = { Referer: location.href, Origin: location.origin };
          const filename = getHunkChPosterFilenameSetting();
          const saveAs = getHunkChSaveAsSetting();
          downloadByUrl(posterUrl, filename, saveAs, { headers: requestHeaders });
        });
        container.appendChild(btn);
    };

    // Run enhancements
    expandDetails();
    injectPlayerPosterDownloadBtn();
    // Re-run periodically for dynamic content
    setInterval(() => {
      expandDetails();
      injectPlayerPosterDownloadBtn();
    }, 2000);

    const meta = {
      title: '',
      year: '',
      country: 'Japan',
      genres: [],
      duration: '',
      director: '',
      studio: 'Boy Studio',
      actors: [],
      description: '',
      extra: ''
    };

    // 1. Title
    const titleEl = document.querySelector('.item__title span') || document.querySelector('h2.item__title');
    if (titleEl) meta.title = titleEl.textContent.trim();

    // 2. Table Metadata
    const table = document.querySelector('table.table--item-data');
    let genresTd = null;
    let actorsTd = null;

    if (table) {
      const rows = table.querySelectorAll('tr');
      rows.forEach(row => {
        const th = row.querySelector('th');
        const td = row.querySelector('td');
        if (!th || !td) return;

        const headerText = th.textContent.trim();
        const valueText = td.textContent.trim();

        if (headerText.includes('品番')) {
          meta.extra += `Code: ${valueText}\n`;
        } else if (headerText.includes('レーベル')) {
          const a = td.querySelector('a');
          meta.studio = a ? a.textContent.trim() : valueText;
        } else if (headerText.includes('シリーズ')) {
          if (valueText) {
              meta.extra += `Series: ${valueText}\n`;
              meta.genres.push(valueText);
          }
        } else if (headerText.includes('ジャンル')) {
          genresTd = td;
          const links = td.querySelectorAll('a');
          links.forEach(a => {
            meta.genres.push(a.textContent.trim());
          });
        } else if (headerText.includes('出演モデル')) {
          actorsTd = td;
          const links = td.querySelectorAll('a');
          links.forEach(a => {
            meta.actors.push({ name: a.textContent.trim() });
          });
        } else if (headerText.includes('配信開始日')) {
          meta.extra += `Release Date: ${valueText}\n`;
          const match = valueText.match(/(\d{4})/);
          if (match) meta.year = match[1];
        } else if (headerText.includes('収録時間')) {
          meta.duration = valueText;
        }
      });
    }

    // 3. Description
    const descDetails = Array.from(document.querySelectorAll('details')).find(d => {
      const s = d.querySelector('summary');
      return s && s.textContent.includes('商品説明を読む');
    });

    let descContainer = null;
    if (descDetails) {
      descContainer = descDetails.querySelector('div') || descDetails;
      const ps = Array.from(descContainer.querySelectorAll('p'))
        .map(p => (p.textContent || '').trim())
        .filter(Boolean);
      if (ps.length > 0) meta.description = ps.join('\n\n');
    }

    const config = (metadataConfigs && typeof metadataConfigs === 'object') ? metadataConfigs : defaultMetadataConfigs;

    // Inject Controls

    // Description Controls
    if (descContainer && meta.description) {
      if (descContainer.querySelector('.emby-metadata-controls.emby-boystudio-desc')) return;
      const type = 'description';
      const conf = (config && config[type]) || defaultMetadataConfigs[type];
      if (conf && conf.enabled) {
        const text = renderWithTemplate(meta, conf.template, type);
        if (text && text.trim()) {
          const controls = createMetadataControls(type, meta, conf);
          controls.style.marginTop = '10px';
          controls.style.display = 'block';
          controls.classList.add('emby-metadata-controls', 'emby-boystudio-desc');
          descContainer.appendChild(controls);
        }
      }
    }

    // Genres Controls
    if (genresTd && meta.genres.length > 0) {
      const type = 'genres';
      const conf = (config && config[type]) || defaultMetadataConfigs[type];
      if (conf && conf.enabled) {
        const text = renderWithTemplate(meta, conf.template, type);
        if (text && text.trim()) {
          const controls = createMetadataControls(type, meta, conf);
          controls.style.marginTop = '5px';
          controls.style.display = 'block';
          genresTd.appendChild(controls);
        }
      }
    }

    // Actors Controls
    if (actorsTd && meta.actors.length > 0) {
      const type = 'actors';
      const conf = (config && config[type]) || defaultMetadataConfigs[type];
      if (conf && conf.enabled) {
        const text = renderWithTemplate(meta, conf.template, type);
        if (text && text.trim()) {
          const controls = createMetadataControls(type, meta, conf);
          controls.style.marginLeft = '10px';
          controls.style.display = 'inline-flex';
          actorsTd.appendChild(controls);
        }
      }
    }
  }

  function initJgvData() {
    if (!location.host.includes('jgvdata.com')) return;

    const meta = {
      title: '',
      year: '',
      country: '',
      genres: [],
      duration: '',
      director: '',
      studio: '',
      actors: [],
      description: '',
      extra: ''
    };

    // 1. Title
    const titleEl = document.querySelector('h1.title.single');
    if (titleEl) {
        meta.title = titleEl.textContent.trim();
    }

    // 2. Metadata (DL)
    const dls = document.querySelectorAll('.pcontent dl');
    let labelDd = null;
    let contextDd = null;

    dls.forEach(dl => {
        const dts = dl.querySelectorAll('dt');
        dts.forEach(dt => {
            const label = dt.textContent.trim();
            const dd = dt.nextElementSibling;
            if (!dd || dd.tagName !== 'DD') return;

            const value = dd.textContent.trim();

            if (label.includes('GV Code')) {
                meta.extra += `Code: ${value}\n`;
            } else if (label.includes('Runtime')) {
                meta.duration = value;
            } else if (label.includes('Release Date')) {
                meta.extra += `Release Date: ${value}\n`;
                const match = value.match(/(\d{4})/);
                if (match) meta.year = match[1];
            } else if (label.includes('Label')) {
                labelDd = dd;
                const links = dd.querySelectorAll('a');
                links.forEach(a => {
                    const tag = a.textContent.trim().replace(/,$/, '');
                    // Check if it's studio (usually first tag or matches studio logic)
                    // But here studio is also in .mg-blog-category
                    if (tag) meta.genres.push(tag);
                });
            } else if (label.includes('Context')) {
                contextDd = dd;
                meta.description = value;
            }
        });
    });

    // Studio (from category header if available, otherwise maybe from tags?)
    const studioEl = document.querySelector('.mg-blog-category a');
    if (studioEl) {
        meta.studio = studioEl.textContent.trim();
        // Remove studio from genres if present
        const studioIndex = meta.genres.indexOf(meta.studio);
        if (studioIndex > -1) {
            meta.genres.splice(studioIndex, 1);
        }
    } else {
        // Fallback: assume first tag might be studio if matches specific logic, 
        // but for now let's just leave it in genres if not sure.
        // Based on HTML, "BOY" is first tag and "BOYSTUDIO" is category.
        // Let's rely on .mg-blog-category for Studio.
    }

    const config = (typeof metadataConfigs !== 'undefined' && metadataConfigs) ? metadataConfigs : defaultMetadataConfigs;

    // Inject Controls
    
    // Genres
    if (labelDd && meta.genres.length > 0) {
        const type = 'genres';
        const conf = (config && config[type]) || defaultMetadataConfigs[type];
        if (conf && conf.enabled) {
            const text = renderWithTemplate(meta, conf.template, type);
            if (text && text.trim()) {
                const controls = createMetadataControls(type, meta, conf);
                controls.style.marginTop = '5px';
                controls.style.display = 'block';
                labelDd.appendChild(controls);
            }
        }
    }

    // Description
    if (contextDd && meta.description) {
        const type = 'description';
        const conf = (config && config[type]) || defaultMetadataConfigs[type];
        if (conf && conf.enabled) {
            const text = renderWithTemplate(meta, conf.template, type);
            if (text && text.trim()) {
                const controls = createMetadataControls(type, meta, conf);
                controls.style.marginTop = '10px';
                controls.style.display = 'block';
                contextDd.appendChild(controls);
            }
        }
    }
  }

  function initStr8Boys() {
    if (!location.host.includes('str8boys2023.com')) return;
    
    // Auto expand sections if needed (similar to gokumen)
    // Currently str8boys structure seems static, but check for drawer/accordion if any

    const meta = {
      title: '',
      year: '',
      country: 'Japan',
      genres: [],
      duration: '',
      director: '',
      studio: 'STR8 BOYS',
      actors: [],
      description: '',
      extra: ''
    };

    // 1. Title
    const titleEl = document.querySelector('.detailleft h1');
    if (titleEl) meta.title = titleEl.textContent.trim();

    // 2. Metadata List (dl/dt/dd)
    const dls = document.querySelectorAll('.detail-table-list li dl');
    dls.forEach(dl => {
      const dt = dl.querySelector('dt');
      const dd = dl.querySelector('dd');
      if (!dt || !dd) return;

      const label = dt.textContent.trim();
      const value = dd.textContent.trim();

      if (label.includes('品番')) {
        meta.extra += `Code: ${value}\n`;
      } else if (label.includes('SERIES')) {
        dd.querySelectorAll('a').forEach(a => {
            const tag = a.textContent.trim();
            if (tag) meta.genres.push(tag);
        });
      } else if (label.includes('PLAY LIST')) {
        dd.querySelectorAll('a').forEach(a => {
            const tag = a.textContent.trim();
            if (tag) meta.genres.push(tag);
        });
      } else if (label.includes('MODEL TYPE')) {
        dd.querySelectorAll('a').forEach(a => {
            const tag = a.textContent.trim();
            if (tag) meta.genres.push(tag);
        });
      } else if (label.includes('レーベル')) {
        meta.studio = value;
      } else if (label.includes('MODEL NAME')) {
        dd.querySelectorAll('a').forEach(a => {
            const name = a.textContent.trim();
            if (name) meta.actors.push(name);
        });
      } else if (label.includes('公開日')) {
        meta.extra += `Release Date: ${value}\n`;
        const match = value.match(/(\d{4})/);
        if (match) meta.year = match[1];
      } else if (label.includes('TIME') || label.includes('タイム')) {
        meta.duration = value;
      }
    });

    // 3. Description
    const descEls = document.querySelectorAll('.detailtextblock .cp_container p');
    for (const p of descEls) {
        const txt = p.textContent.trim();
        if (txt) {
            meta.description = txt;
            break;
        }
    }
    
    meta.genres = [...new Set(meta.genres)];
    meta.actors = [...new Set(meta.actors)];

    // 4. Inject Controls
    const lists = document.querySelectorAll('ul.detail-table-list');

    lists.forEach(ul => {
        const localDls = ul.querySelectorAll('li dl');
        let targetDl = null;
        let actorDl = null;

        localDls.forEach(dl => {
            const dt = dl.querySelector('dt');
            if (!dt) return;
            const label = dt.textContent.trim();
            if (label.includes('MODEL TYPE') || label.includes('PLAY LIST') || label.includes('SERIES')) {
                targetDl = dl;
            }
            if (label.includes('MODEL NAME')) {
                actorDl = dl;
            }
        });

        if (targetDl && meta.genres.length > 0) {
            const type = 'genres';
            const conf = (metadataConfigs && metadataConfigs[type]) || defaultMetadataConfigs[type];
            if (conf && conf.enabled) {
                const parent = targetDl.parentNode;
                if (parent && !parent.querySelector(`.emby-metadata-controls[data-type="${type}"]`)) {
                    const controls = createMetadataControls(type, meta, conf);
                    controls.dataset.type = type;
                    controls.style.marginTop = '5px';
                    controls.classList.add('emby-metadata-controls');
                    parent.appendChild(controls);
                }
            }
        }

        if (actorDl && meta.actors.length > 0) {
            const type = 'actors';
            const conf = (metadataConfigs && metadataConfigs[type]) || defaultMetadataConfigs[type];
            if (conf && conf.enabled) {
                const parent = actorDl.parentNode;
                if (parent && !parent.querySelector(`.emby-metadata-controls[data-type="${type}"]`)) {
                    const controls = createMetadataControls(type, meta, conf);
                    controls.dataset.type = type;
                    controls.style.marginTop = '5px';
                    controls.classList.add('emby-metadata-controls');
                    parent.appendChild(controls);
                }
            }
        }
    });

    if (descEls.length > 0 && meta.description) {
        const type = 'description';
        const conf = (metadataConfigs && metadataConfigs[type]) || defaultMetadataConfigs[type];
        if (conf && conf.enabled) {
            descEls.forEach(p => {
                const parent = p.parentNode;
                if (parent && !parent.querySelector(`.emby-metadata-controls[data-type="${type}"]`)) {
                    const controls = createMetadataControls(type, meta, conf);
                    controls.dataset.type = type;
                    controls.style.marginTop = '10px';
                    controls.classList.add('emby-metadata-controls');
                    parent.appendChild(controls);
                }
            });
        }
    }

    const coverAnchors = Array.from(document.querySelectorAll('.detailleft a.popup-img[href]'));
    let coverAnchor = coverAnchors.find(a => {
      const href = (a.getAttribute('href') || a.href || '').trim();
      return /\/0\.(jpg|jpeg|png|webp)(?:$|\?)/i.test(href);
    });
    if (!coverAnchor) {
      coverAnchor = document.querySelector('.detailleft .MainPhotoblock a.popup-img[href]') || document.querySelector('.MainPhotoblock a.popup-img[href]') || null;
    }
    if (coverAnchor && !coverAnchor.dataset.embyCoverDlReady) {
      coverAnchor.dataset.embyCoverDlReady = '1';

      const getCoverUrl = () => {
        const img = coverAnchor.querySelector('img');
        const fromImg = img ? ((img.currentSrc || img.getAttribute('src') || img.src || '').trim()) : '';
        const raw = fromImg || (coverAnchor.getAttribute('href') || coverAnchor.href || '').trim();
        if (!raw) return '';
        try {
          return new URL(raw, location.href).href;
        } catch (_) {
          return raw;
        }
      };

      const guessFilename = (url) => {
        let ext = '.jpg';
        try {
          const u = new URL(url);
          const name = (u.pathname.split('/').pop() || '').trim();
          const m = name.match(/\.(jpg|jpeg|png|webp)(?:$|\?)/i);
          if (m) ext = '.' + m[1].toLowerCase();
        } catch (_) {}

        const codeMatch = (meta.extra || '').match(/^\s*Code:\s*(.+)\s*$/m);
        const code = codeMatch ? codeMatch[1].trim() : '';
        const safeCode = code.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim();
        if (safeCode) return `${safeCode}-cover${ext}`;
        return `cover${ext}`;
      };

      const getConfiguredFilename = (url) => {
        const configured = getHunkChPosterFilenameSetting();
        const raw = (configured || '').trim();
        if (!raw) return guessFilename(url);

        const codeMatch = (meta.extra || '').match(/^\s*Code:\s*(.+)\s*$/m);
        const code = codeMatch ? codeMatch[1].trim() : '';
        const safeCode = code.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim();

        let ext = 'jpg';
        try {
          const u = new URL(url);
          const name = (u.pathname.split('/').pop() || '').trim();
          const m = name.match(/\.(jpg|jpeg|png|webp)(?:$|\?)/i);
          if (m) ext = m[1].toLowerCase();
        } catch (_) {}

        const resolved = raw
          .replace(/{{\s*code\s*}}/gi, safeCode || 'cover')
          .replace(/{{\s*ext\s*}}/gi, ext);
        const safeResolved = resolved.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim();
        return safeResolved || guessFilename(url);
      };

      const triggerDownload = (url) => {
        if (!url) {
          showToast(t.hunkChDownloadFailed);
          return;
        }
        const filename = getConfiguredFilename(url);
        const saveAs = getHunkChSaveAsSetting();
        downloadByUrl(url, filename, saveAs);
      };

      if (getComputedStyle(coverAnchor).position === 'static') {
        coverAnchor.style.position = 'relative';
      }

      const btn = createDownloadFabButton({ title: t.hunkChDownloadImage, right: 12, bottom: 12, zIndex: 30, size: 50 });
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        triggerDownload(getCoverUrl());
      };

      coverAnchor.appendChild(btn);
    }
  }

  function initGayerdar() {
    if (!location.host.includes('gayerdar.com')) return;

    const run = () => {
        const tagsUl = document.querySelector('ul.iq-blogtag');
        if (!tagsUl) return false;

        // Prevent double injection
        if (tagsUl.parentNode && tagsUl.parentNode.querySelector('.emby-metadata-controls')) return true;

        const meta = {
            title: '',
            year: '',
            country: '',
            genres: [],
            duration: '',
            director: '',
            studio: 'Gayerdar',
            actors: [],
            description: '',
            extra: ''
        };

        // 1. Title
        const titleEl = document.querySelector('h2.trending-text');
        if (titleEl) {
            meta.title = titleEl.textContent.trim();
        }

        // 2. Code (GDSR-005-1)
        const codeEl = document.querySelector('div.list-inline a.text-primary');
        if (codeEl) {
            const code = codeEl.textContent.trim();
            meta.extra += `Code: ${code}\n`;
        }

        // 3. Year / Date
        const dateEl = document.querySelector('.trending-year');
        if (dateEl) {
            const dateText = dateEl.textContent.trim();
            meta.extra += `Release Date: ${dateText}\n`;
            const match = dateText.match(/(\d{4})/);
            if (match) meta.year = match[1];
        }

        // 4. Genres / Tags
        tagsUl.querySelectorAll('li a.title').forEach(a => {
            meta.genres.push(a.textContent.trim());
        });

        // 5. Description
        const descEl = document.querySelector('#description-01 .description-content p');
        if (descEl) {
            meta.description = descEl.textContent.trim();
        }

        // 6. Actors
        const actorsList = document.querySelectorAll('.tab-content ul li h6');
        actorsList.forEach(h6 => {
            meta.actors.push({ name: h6.textContent.trim() });
        });

        const config = (typeof metadataConfigs !== 'undefined' && metadataConfigs) ? metadataConfigs : defaultMetadataConfigs;

        // Inject Controls
        
        // Genres
        if (tagsUl && meta.genres.length > 0) {
            const type = 'genres';
            const conf = (config && config[type]) || defaultMetadataConfigs[type];
            if (conf && conf.enabled) {
                const text = renderWithTemplate(meta, conf.template, type);
                if (text && text.trim()) {
                    const controls = createMetadataControls(type, meta, conf);
                    controls.classList.add('emby-metadata-controls');
                    controls.style.marginLeft = '10px';
                    controls.style.display = 'inline-flex';
                    // Append to parent div (flex container)
                    if (tagsUl.parentNode) {
                        tagsUl.parentNode.appendChild(controls);
                    }
                }
            }
        }

        // Description
        if (descEl && meta.description) {
            const type = 'description';
            const conf = (config && config[type]) || defaultMetadataConfigs[type];
            if (conf && conf.enabled) {
                const text = renderWithTemplate(meta, conf.template, type);
                if (text && text.trim()) {
                    const controls = createMetadataControls(type, meta, conf);
                    controls.classList.add('emby-metadata-controls');
                    controls.style.marginTop = '10px';
                    controls.style.display = 'block';
                    if (descEl.parentNode) {
                        descEl.parentNode.appendChild(controls);
                    }
                }
            }
        }
        
        // Actors (optional injection point)
        const actorsTab = document.querySelector('.tab-content ul');
        if (actorsTab && meta.actors.length > 0) {
            const type = 'actors';
            const conf = (config && config[type]) || defaultMetadataConfigs[type];
            if (conf && conf.enabled) {
                const text = renderWithTemplate(meta, conf.template, type);
                if (text && text.trim()) {
                    const controls = createMetadataControls(type, meta, conf);
                    controls.classList.add('emby-metadata-controls');
                    controls.style.marginTop = '10px';
                    controls.style.display = 'block';
                    if (actorsTab.parentNode) {
                        actorsTab.parentNode.insertBefore(controls, actorsTab);
                    }
                }
            }
        }
        return true;
    };

    // Attempt to run immediately
    if (run()) return;

    // Retry for dynamic content (SPA)
    let retryCount = 0;
    const maxRetries = 20; // 20 seconds
    const interval = setInterval(() => {
        retryCount++;
        if (run() || retryCount >= maxRetries) {
            clearInterval(interval);
        }
    }, 1000);
  }

  function initGokumen() {
    if (!location.host.includes('gokumen.jp')) return;

    // Auto expand sections
    const accordions = document.querySelectorAll('.js-accordion_btn');
    accordions.forEach(btn => {
        const text = btn.textContent.trim();
        if (text.includes('商品説明') || text.includes('商品詳細')) {
             if (!btn.classList.contains('-active')) {
                 btn.click(); // Try click first
                 btn.classList.add('-active'); // Ensure active class
             }
             const body = btn.nextElementSibling;
             if (body && body.classList.contains('js-accordion_body')) {
                 body.classList.remove('accordion-close');
                 body.style.display = 'block';
             }
        }
    });

    const meta = {
      title: document.title.replace(' | GOKUMEN', '').trim(),
      year: '',
      country: 'JP',
      genres: [],
      duration: '',
      director: '',
      studio: 'GOKUMEN',
      actors: [],
      description: '',
      extra: ''
    };

    // Description
    const descEl = document.querySelector('.productDescription_text');
    if (descEl) {
        // Clone to avoid "read more" text if any, though here it seems plain text
        meta.description = descEl.textContent.trim();
        
        // Try to extract title from description if formatted as 『Title』
        const titleMatch = meta.description.match(/『(.*?)』/);
        if (titleMatch) {
            meta.title = titleMatch[1];
        }
    }

    // Extract Metadata from DL
    const dts = document.querySelectorAll('.productDetail_dt');
    let targetDd = null;

    dts.forEach(dt => {
        const key = dt.textContent.trim();
        const dd = dt.nextElementSibling;
        if (!dd || dd.tagName !== 'DD') return;

        if (key.includes('品番')) {
             const code = dd.textContent.trim();
             meta.extra += `Code: ${code}\n`;
        } else if (key.includes('レーベル')) {
             const label = dd.textContent.trim();
             if (label) meta.studio = label;
        } else if (key.includes('シリーズ')) {
             const series = dd.textContent.trim();
             meta.extra += `Series: ${series}\n`;
             if (series) meta.genres.push(series);
             targetDd = dd;
             // If title is generic, append series?
             if (!meta.title || meta.title === 'GOKUMEN') {
                 meta.title = series;
             }
        } else if (key.includes('ジャンル')) {
             targetDd = dd;
             dd.querySelectorAll('span').forEach(span => {
                 const g = span.textContent.trim();
                 if (g) meta.genres.push(g);
             });
        }
    });

    const config = (typeof metadataConfigs !== 'undefined' && metadataConfigs) ? metadataConfigs : defaultMetadataConfigs;

    // Inject Controls
    
    // Genres (in Details section)
    if (targetDd && meta.genres.length > 0) {
        const type = 'genres';
        const conf = (config && config[type]) || defaultMetadataConfigs[type];
        if (conf && conf.enabled) {
            const text = renderWithTemplate(meta, conf.template, type);
            if (text && text.trim()) {
                const controls = createMetadataControls(type, meta, conf);
                controls.style.marginTop = '5px';
                controls.style.display = 'block';
                // Append to DD
                targetDd.appendChild(controls);
            }
        }
    }

    // Description
    if (descEl && meta.description) {
         const type = 'description';
         const conf = (config && config[type]) || defaultMetadataConfigs[type];
         if (conf && conf.enabled) {
             const text = renderWithTemplate(meta, conf.template, type);
             if (text && text.trim()) {
                 const controls = createMetadataControls(type, meta, conf);
                 controls.style.marginTop = '10px';
                 controls.style.display = 'block';
                 if (descEl.parentNode) {
                     // Insert after description
                     descEl.parentNode.insertBefore(controls, descEl.nextSibling);
                 }
             }
         }
    }
  }

  function initCkDownload() {
    if (!location.host.includes('ck-download.com')) return;

    const meta = {
      title: '',
      year: '',
      country: 'JP',
      genres: [],
      duration: '',
      director: '',
      studio: 'CK Original',
      actors: [],
      description: '',
      extra: ''
    };

    // 1. Title
    const titleEl = document.querySelector('#Contents h3');
    if (titleEl) {
        meta.title = titleEl.textContent.trim();
    }

    // 2. Description
    const descEl = document.querySelector('.intro_text');
    if (descEl) {
        meta.description = descEl.textContent.trim();
    }

    // 3. Date
    const dateEl = document.querySelector('.date');
    if (dateEl) {
        const dateText = dateEl.textContent.replace('UP', '').trim();
        meta.extra += `Release Date: ${dateText}\n`;
        const match = dateText.match(/(\d{4})/);
        if (match) meta.year = match[1];
    }

    // 4. Tags (Play Content & Model Type)
    const categoryLis = document.querySelectorAll('.prod_category ul li');
    categoryLis.forEach(li => {
        const strong = li.querySelector('strong');
        if (!strong) return;
        const label = strong.textContent.trim();
        if (label === 'プレイ内容' || label === 'モデルタイプ') {
             li.querySelectorAll('.item a').forEach(a => {
                 const tag = a.textContent.trim();
                 if (tag) meta.genres.push(tag);
             });
        }
    });

    // 5. Table Data (Code, Duration, Maker, Label)
    const table = document.querySelector('table.prod_data');
    if (table) {
        table.querySelectorAll('tr').forEach(tr => {
            tr.querySelectorAll('th').forEach(th => {
                const key = th.textContent.trim();
                const td = th.nextElementSibling;
                if (td && td.tagName === 'TD') {
                    const value = td.textContent.trim();
                    if (key === 'プロダクトナンバー') {
                        meta.extra += `Code: ${value}\n`;
                    } else if (key === 'メーカー') {
                        meta.studio = value;
                    } else if (key.includes('レーベル')) {
                        // User wants label in tags too
                        const labelLink = td.querySelector('a');
                        const labelName = labelLink ? labelLink.textContent.trim() : value;
                        if (labelName) {
                             meta.extra += `Label: ${labelName}\n`;
                             meta.genres.push(labelName);
                        }
                    } else if (key === '再生時間') {
                        meta.duration = value;
                    }
                }
            });
        });
    }

    meta.genres = [...new Set(meta.genres)];

    const config = (typeof metadataConfigs !== 'undefined' && metadataConfigs) ? metadataConfigs : defaultMetadataConfigs;

    // Inject Controls

    // 1. Tags Controls (Inject after .prod_category)
    const categoryDiv = document.querySelector('.prod_category');
    if (categoryDiv && meta.genres.length > 0) {
        const type = 'genres';
        const conf = (config && config[type]) || defaultMetadataConfigs[type];
        if (conf && conf.enabled) {
             const text = renderWithTemplate(meta, conf.template, type);
             if (text && text.trim()) {
                 const controls = createMetadataControls(type, meta, conf);
                 controls.style.marginTop = '10px';
                 controls.style.display = 'block';
                 controls.classList.add('emby-metadata-controls');
                 if (categoryDiv.parentNode) {
                     categoryDiv.parentNode.insertBefore(controls, categoryDiv.nextSibling);
                 }
             }
        }
    }

    // 2. Description Controls
    if (descEl && meta.description) {
        const type = 'description';
        const conf = (config && config[type]) || defaultMetadataConfigs[type];
        if (conf && conf.enabled) {
             const text = renderWithTemplate(meta, conf.template, type);
             if (text && text.trim()) {
                 const controls = createMetadataControls(type, meta, conf);
                 controls.style.marginTop = '10px';
                 controls.style.display = 'block';
                 controls.classList.add('emby-metadata-controls');
                 if (descEl.parentNode) {
                     descEl.parentNode.insertBefore(controls, descEl.nextSibling);
                 }
             }
        }
    }

    const slider = document.querySelector('.photo_flexslider');
    if (slider) {
      const requestHeaders = { Referer: location.href, Origin: location.origin };
      const attachDownloadBtn = () => {
        const viewport = slider.querySelector('.flex-viewport');
        if (!viewport) return false;

        const existingBtns = slider.querySelectorAll('.emby-hunkch-download-btn');
        existingBtns.forEach(b => {
          if (b.parentNode !== viewport) b.remove();
        });
        if (viewport.querySelector('.emby-hunkch-download-btn')) return true;

        if (getComputedStyle(viewport).position === 'static') {
          viewport.style.position = 'relative';
        }

        const btn = createDownloadFabButton({ title: t.hunkChDownloadImage, right: 12, bottom: 12, zIndex: 30, size: 50 });
        viewport.appendChild(btn);

        const resolveActiveUrl = () => {
          const img = slider.querySelector('ul.slides li.flex-active-slide img') || slider.querySelector('ul.slides li img');
          if (!img) return '';
          const src = (img.currentSrc || img.getAttribute('src') || img.src || '').trim();
          if (!src) return '';
          try {
            return new URL(src, location.href).href;
          } catch (_) {
            return src;
          }
        };

        const updateBtnVisibility = () => {
          const url = resolveActiveUrl();
          btn.style.display = url ? 'flex' : 'none';
          btn.dataset.url = url;
        };

        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const url = btn.dataset.url || resolveActiveUrl();
          const filename = getHunkChPosterFilenameSetting();
          const saveAs = getHunkChSaveAsSetting();
          downloadByUrl(url, filename, saveAs, { headers: requestHeaders });
        });

        updateBtnVisibility();

        const slides = slider.querySelector('ul.slides');
        if (slides) {
          const obs = new MutationObserver(() => updateBtnVisibility());
          obs.observe(slides, { subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
        }

        slider.addEventListener('click', () => setTimeout(updateBtnVisibility, 0), true);
        window.addEventListener('resize', () => setTimeout(updateBtnVisibility, 0));
        return true;
      };

      if (!attachDownloadBtn()) {
        setTimeout(() => attachDownloadBtn(), 500);
      }
      const rootObs = new MutationObserver(() => attachDownloadBtn());
      rootObs.observe(slider, { childList: true, subtree: true });
    } else {
      const attachStaticDownloadBtn = () => {
        const img = document.querySelector('.set_photo img') || document.querySelector('.title_photo img');
        if (!img) return false;

        const container = img.closest('.inbox') || img.parentElement;
        if (!container) return false;

        const existingBtns = container.querySelectorAll('.emby-hunkch-download-btn');
        existingBtns.forEach(b => b.remove());

        if (getComputedStyle(container).position === 'static') {
          container.style.position = 'relative';
        }

        const btn = createDownloadFabButton({ title: t.hunkChDownloadImage, right: 12, bottom: 12, zIndex: 30, size: 50 });
        container.appendChild(btn);

        const resolveUrl = () => {
          const targetImg = document.querySelector('.set_photo img') || document.querySelector('.title_photo img');
          if (!targetImg) return '';
          const src = (targetImg.currentSrc || targetImg.getAttribute('src') || targetImg.src || '').trim();
          if (!src) return '';
          try {
            return new URL(src, location.href).href;
          } catch (_) {
            return src;
          }
        };

        const updateBtnVisibility = () => {
          const url = resolveUrl();
          btn.style.display = url ? 'flex' : 'none';
          btn.dataset.url = url;
        };

        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const url = btn.dataset.url || resolveUrl();
          const filename = getHunkChPosterFilenameSetting();
          const saveAs = getHunkChSaveAsSetting();
          downloadByUrl(url, filename, saveAs, { headers: { Referer: location.href, Origin: location.origin } });
        });

        updateBtnVisibility();

        const obs = new MutationObserver(() => updateBtnVisibility());
        obs.observe(img, { attributes: true, attributeFilter: ['src', 'srcset'] });
        return true;
      };

      if (!attachStaticDownloadBtn()) {
        setTimeout(() => attachStaticDownloadBtn(), 500);
      }
    }
  }

  function initMenCom() {
    if (!location.host.includes('men.com')) return;

    let retries = 0;
    const maxRetries = 20;

    function run() {
        const meta = {
            title: '',
            year: '',
            country: 'USA',
            genres: [],
            duration: '',
            director: '',
            studio: 'Men.com',
            actors: [],
            description: '',
            extra: ''
        };

        // 1. Title & Date
        const h2s = Array.from(document.querySelectorAll('h2'));
        const dateRegex = /^[A-Z][a-z]+ \d{1,2}, \d{4}$/; // e.g., March 6, 2026
        
        for (let i = 0; i < h2s.length; i++) {
            const h2 = h2s[i];
            const text = h2.textContent.trim();
            if (dateRegex.test(text)) {
                const date = new Date(text);
                if (!isNaN(date.getTime())) {
                    meta.year = date.getFullYear().toString();
                    const mm = String(date.getMonth() + 1).padStart(2, '0');
                    const dd = String(date.getDate()).padStart(2, '0');
                    meta.extra += `Date: ${date.getFullYear()}-${mm}-${dd}\n`;
                    
                    let next = h2.nextElementSibling;
                    while(next && next.tagName !== 'H2') {
                        next = next.nextElementSibling;
                    }
                    if (next && next.tagName === 'H2') {
                        meta.title = next.textContent.trim();
                    }
                    break;
                }
            }
        }

        if (!meta.title) {
            const metaTitle = document.querySelector('meta[property="og:title"]');
            if (metaTitle) {
                meta.title = metaTitle.content.replace(' - Men.com', '').trim();
            } else {
                 meta.title = document.title.replace(' - Men.com', '').trim();
            }
        }

        // 2. Description
        const descSection = document.querySelector('section[data-cy="description"]');
        if (descSection) {
            const p = descSection.querySelector('p');
            if (p) {
                meta.description = p.textContent.trim();
            }
        }

        // 3. Tags
        const divs = Array.from(document.querySelectorAll('div'));
        const tagsLabelDiv = divs.find(d => d.textContent.trim() === 'Tags');
        let tagsContainer = null;
        if (tagsLabelDiv) {
            tagsContainer = tagsLabelDiv.nextElementSibling;
            if (tagsContainer) {
                tagsContainer.querySelectorAll('a').forEach(a => {
                    const tag = a.textContent.trim();
                    if (tag) meta.genres.push(tag);
                });
            }
        }

        // 4. Actors
        const actorLinks = document.querySelectorAll('a[href*="/modelprofile/"]');
        const actorSet = new Set();
        actorLinks.forEach(a => {
            const name = a.textContent.trim();
            if (name && !actorSet.has(name)) {
                actorSet.add(name);
                meta.actors.push({ name });
            }
        });
        
        // 5. Studio Subsite
        const siteLink = document.querySelector('a[href*="/scenes?site="]');
        if (siteLink) {
            const siteName = siteLink.textContent.trim();
            if (siteName && siteName !== 'Men') {
                meta.studio = `Men.com (${siteName})`;
            }
        }

        const config = (typeof metadataConfigs !== 'undefined' && metadataConfigs) ? metadataConfigs : defaultMetadataConfigs;

        // Inject Controls
        let injected = false;

        // Tags
        if (tagsContainer && meta.genres.length > 0) {
            if (!tagsContainer.querySelector('.emby-metadata-controls[data-type="genres"]')) {
                const type = 'genres';
                const conf = (config && config[type]) || defaultMetadataConfigs[type];
                if (conf && conf.enabled) {
                    const text = renderWithTemplate(meta, conf.template, type);
                    if (text && text.trim()) {
                        const controls = createMetadataControls(type, meta, conf);
                        controls.style.marginTop = '5px';
                        controls.style.display = 'block';
                        controls.classList.add('emby-metadata-controls');
                        tagsContainer.appendChild(controls);
                        injected = true;
                    }
                }
            } else {
                injected = true; // Already injected
            }
        }

        // Actors
        if (meta.actors.length > 0) {
            const firstActorLink = document.querySelector('a[href*="/modelprofile/"]');
            if (firstActorLink) {
                let container = firstActorLink.closest('h2');
                if (!container) container = firstActorLink.parentNode;
                
                if (container && container.parentNode) {
                    if (!container.parentNode.querySelector('.emby-metadata-controls[data-type="actors"]')) {
                        const type = 'actors';
                        const conf = (config && config[type]) || defaultMetadataConfigs[type];
                        if (conf && conf.enabled) {
                            const text = renderWithTemplate(meta, conf.template, type);
                            if (text && text.trim()) {
                                const controls = createMetadataControls(type, meta, conf);
                                controls.style.marginTop = '5px';
                                controls.style.display = 'block';
                                controls.classList.add('emby-metadata-controls');
                                container.parentNode.insertBefore(controls, container.nextSibling);
                                injected = true;
                            }
                        }
                    } else {
                        injected = true;
                    }
                }
            }
        }

        const attachPosterDownloadBtn = () => {
            const playBtn = document.querySelector('button[aria-label="Play"]');
            let container = playBtn ? playBtn.parentElement : null;
            let img = container ? container.querySelector('img') : null;

            if (!img) {
                img = document.querySelector('img[alt*="Scene Poster"], img[src*="/poster/"]');
                container = img ? (img.parentElement || null) : null;
            }
            if (!img || !container) return false;

            if (container.querySelector('.emby-hunkch-download-btn.emby-mencom-poster-download')) return true;

            if (getComputedStyle(container).position === 'static') {
                container.style.position = 'relative';
            }

            const resolvePosterUrl = () => {
                const direct = (img.currentSrc || img.getAttribute('src') || img.src || '').trim();
                if (direct) return direct;
                const srcset = (img.getAttribute('srcset') || '').trim();
                if (!srcset) return '';
                const last = srcset.split(',').map(s => s.trim()).filter(Boolean).pop() || '';
                return (last.split(/\s+/)[0] || '').trim();
            };

            const btn = createDownloadFabButton({ title: t.hunkChDownloadImage, right: 12, bottom: 12, zIndex: 60, size: 50 });
            btn.classList.add('emby-mencom-poster-download');
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const url = resolvePosterUrl();
                const filename = getHunkChPosterFilenameSetting();
                const saveAs = getHunkChSaveAsSetting();
                downloadByUrl(url, filename, saveAs, { headers: { Referer: location.href, Origin: location.origin } });
            });
            container.appendChild(btn);
            return true;
        };
        if (attachPosterDownloadBtn()) injected = true;

        return injected;
    }

    // Try immediately
    if (run()) return;

    // Polling for SPA
    const interval = setInterval(() => {
        try {
            if (run()) {
                // Keep running for a few more times in case of partial load, but reduce frequency? 
                // For now, if we injected something, we can probably stop, but maybe one part loaded and another didn't.
                // However, run() re-checks existence before injecting.
                // Let's stop if we found at least one target or max retries reached.
                clearInterval(interval);
            } else {
                retries++;
                if (retries >= maxRetries) clearInterval(interval);
            }
        } catch (e) {
            console.error('initMenCom error', e);
        }
    }, 1000);
  }

  function initVoyrCom() {
    if (!location.host.includes('voyr.com')) return;

    const requestHeaders = { Referer: location.href, Origin: location.origin };
    const normalizeText = (s) => String(s || '').replace(/\s+/g, ' ').trim();

    const extractBgImageUrl = (bg) => {
      const s = String(bg || '').trim();
      if (!s) return '';
      const m = s.match(/url\((['"]?)(.*?)\1\)/i);
      return m ? String(m[2] || '').trim() : '';
    };

    const resolvePosterUrl = () => {
      const posterDiv = document.querySelector('.vjs-poster') || null;
      if (!posterDiv) return '';
      const fromAttr = extractBgImageUrl(posterDiv.getAttribute('style') || '');
      if (fromAttr) return fromAttr;
      const fromComputed = extractBgImageUrl(getComputedStyle(posterDiv).backgroundImage || '');
      return fromComputed;
    };

    const attachCoverDownloadBtn = () => {
      const posterDiv = document.querySelector('.vjs-poster') || null;
      if (!posterDiv) return false;
      if (posterDiv.querySelector('.emby-hunkch-download-btn.emby-voyr-cover-download')) return true;
      const url = resolvePosterUrl();
      if (!url) return false;

      if (getComputedStyle(posterDiv).position === 'static') posterDiv.style.position = 'relative';
      const btn = createDownloadFabButton({ title: t.hunkChDownloadImage, right: 12, bottom: 12, zIndex: 60, size: 50 });
      btn.classList.add('emby-voyr-cover-download');
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const posterUrl = resolvePosterUrl();
        const filename = getHunkChPosterFilenameSetting();
        const saveAs = getHunkChSaveAsSetting();
        downloadByUrl(posterUrl, filename, saveAs, { headers: requestHeaders });
      });
      posterDiv.appendChild(btn);
      return true;
    };

    const expandInformation = () => {
      const infoHeader = Array.from(document.querySelectorAll('h2')).find(h2 => normalizeText(h2.textContent) === 'Information');
      if (!infoHeader || !infoHeader.parentElement) return false;
      const headerRow = infoHeader.parentElement;
      const toggleBtn = headerRow.querySelector('button');
      const content = headerRow.nextElementSibling;
      if (!toggleBtn || !content) return false;

      const cs = getComputedStyle(content);
      const collapsed = cs.visibility === 'hidden' || cs.height === '0px' || content.clientHeight === 0;
      if (collapsed) {
        try { toggleBtn.click(); } catch (_) {}
      }
      return true;
    };

    const injectGenresControls = () => {
      const infoHeader = Array.from(document.querySelectorAll('h2')).find(h2 => normalizeText(h2.textContent) === 'Information');
      if (!infoHeader || !infoHeader.parentElement) return false;
      const content = infoHeader.parentElement.nextElementSibling;
      if (!(content instanceof HTMLElement)) return false;

      const tagLabel = Array.from(content.querySelectorAll('div')).find(d => normalizeText(d.textContent) === 'Tags') || null;
      const tagWrap = tagLabel ? tagLabel.nextElementSibling : null;
      if (!(tagWrap instanceof HTMLElement)) return false;
      if (tagWrap.querySelector('.emby-metadata-controls.emby-voyr-genres-controls')) return true;

      const meta = {
        title: '',
        year: '',
        country: 'USA',
        genres: [],
        duration: '',
        director: '',
        studio: 'Voyr',
        actors: [],
        description: '',
        extra: ''
      };

      const titleEl = document.querySelector('meta[property="og:title"]') || document.querySelector('title');
      meta.title = normalizeText(titleEl ? (titleEl.content || titleEl.textContent || '') : '');

      tagWrap.querySelectorAll('a').forEach(a => {
        const t0 = normalizeText(a.textContent);
        if (t0) meta.genres.push(t0);
      });
      meta.genres = Array.from(new Set(normalizeNameList(meta.genres)));
      if (meta.genres.length === 0) return false;

      const config = (typeof metadataConfigs !== 'undefined' && metadataConfigs) ? metadataConfigs : defaultMetadataConfigs;
      const type = 'genres';
      const conf = (config && config[type]) || defaultMetadataConfigs[type];
      if (!conf || !conf.enabled) return false;

      const text = renderWithTemplate(meta, conf.template, type);
      if (!text || !text.trim()) return false;

      const controls = createMetadataControls(type, meta, conf);
      controls.style.marginTop = '10px';
      controls.style.display = 'block';
      controls.classList.add('emby-metadata-controls', 'emby-voyr-genres-controls');
      tagWrap.appendChild(controls);
      return true;
    };

    const run = () => {
      let ok = false;
      if (attachCoverDownloadBtn()) ok = true;
      if (expandInformation()) ok = true;
      if (injectGenresControls()) ok = true;
      return ok;
    };

    run();
    setInterval(run, 1000);
  }

  function initTwinkPop() {
    if (!location.host.includes('twinkpop.com')) return;

    const requestHeaders = { Referer: location.href, Origin: location.origin };
    const normalizeText = (s) => String(s || '').replace(/\s+/g, ' ').trim();

    const attachCoverDownloadBtn = () => {
      const playBtn = document.querySelector('button[aria-label="Play"]');
      let container = playBtn ? playBtn.parentElement : null;
      let img = container ? container.querySelector('img') : null;

      if (!img) {
        img = document.querySelector('img[alt*="Scene Poster"], img[src*="/poster/"]');
        container = img ? (img.parentElement || null) : null;
      }
      if (!img || !container) return false;

      if (container.querySelector('.emby-hunkch-download-btn.emby-twinkpop-cover-download')) return true;

      if (getComputedStyle(container).position === 'static') {
        container.style.position = 'relative';
      }

      const resolvePosterUrl = () => {
        const direct = (img.currentSrc || img.getAttribute('src') || img.src || '').trim();
        if (direct) return direct;
        const srcset = (img.getAttribute('srcset') || '').trim();
        if (!srcset) return '';
        const last = srcset.split(',').map(s => s.trim()).filter(Boolean).pop() || '';
        return (last.split(/\s+/)[0] || '').trim();
      };

      const btn = createDownloadFabButton({ title: t.hunkChDownloadImage, right: 12, bottom: 12, zIndex: 60, size: 50 });
      btn.classList.add('emby-twinkpop-cover-download');
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const url = resolvePosterUrl();
        const filename = getHunkChPosterFilenameSetting();
        const saveAs = getHunkChSaveAsSetting();
        downloadByUrl(url, filename, saveAs, { headers: requestHeaders });
      });
      container.appendChild(btn);
      return true;
    };

    const injectGenresControls = () => {
      const categoriesH2 = Array.from(document.querySelectorAll('h2')).find(h2 => {
        const t0 = normalizeText(h2.textContent);
        return t0 === 'Categories:' || t0 === 'Categories';
      }) || null;
      if (!categoriesH2 || !categoriesH2.parentElement) return false;

      const tagsRoot = categoriesH2.parentElement.nextElementSibling;
      if (!(tagsRoot instanceof HTMLElement)) return false;

      const tagLabel = Array.from(tagsRoot.children).find(d => normalizeText(d.textContent) === 'Tags') || null;
      const tagWrap = tagLabel ? tagLabel.nextElementSibling : null;
      if (!(tagWrap instanceof HTMLElement)) return false;

      if (tagWrap.querySelector('.emby-metadata-controls.emby-twinkpop-genres-controls')) return true;

      const meta = {
        title: '',
        year: '',
        country: 'USA',
        genres: [],
        duration: '',
        director: '',
        studio: 'TwinkPop',
        actors: [],
        description: '',
        extra: ''
      };

      const titleH1 = document.querySelector('h1');
      meta.title = normalizeText(titleH1 ? titleH1.textContent : '') || normalizeText(document.querySelector('meta[property="og:title"]')?.content || '');

      tagWrap.querySelectorAll('a').forEach(a => {
        const t0 = normalizeText(a.textContent);
        if (t0) meta.genres.push(t0);
      });
      meta.genres = Array.from(new Set(normalizeNameList(meta.genres)));
      if (meta.genres.length === 0) return false;

      const config = (typeof metadataConfigs !== 'undefined' && metadataConfigs) ? metadataConfigs : defaultMetadataConfigs;
      const type = 'genres';
      const conf = (config && config[type]) || defaultMetadataConfigs[type];
      if (!conf || !conf.enabled) return false;

      const text = renderWithTemplate(meta, conf.template, type);
      if (!text || !text.trim()) return false;

      const controls = createMetadataControls(type, meta, conf);
      controls.style.marginTop = '10px';
      controls.style.display = 'block';
      controls.classList.add('emby-metadata-controls', 'emby-twinkpop-genres-controls');
      tagWrap.appendChild(controls);
      return true;
    };

    const run = () => {
      let ok = false;
      if (attachCoverDownloadBtn()) ok = true;
      if (injectGenresControls()) ok = true;
      return ok;
    };

    run();
    setInterval(run, 1000);
  }

  function initSeanCody() {
    if (!location.host.includes('seancody.com')) return;

    const run = () => {
      const requestHeaders = { Referer: location.href, Origin: location.origin };

      const attachPosterDownloadBtn = () => {
        const playBtn = document.querySelector('button[aria-label="Play"]');
        let container = playBtn ? playBtn.parentElement : null;
        let img = container ? container.querySelector('img') : null;

        if (!img) {
          img = document.querySelector('img[alt*="Scene Poster"]');
          container = img ? (img.parentElement || null) : null;
        }

        if (!img || !container) return false;

        const existing = container.querySelector('.emby-hunkch-download-btn.emby-seancody-poster-download');
        if (existing) return true;

        if (getComputedStyle(container).position === 'static') {
          container.style.position = 'relative';
        }

        const resolvePosterUrl = () => {
          const direct = (img.currentSrc || img.src || '').trim();
          if (direct) return direct;
          const srcset = (img.getAttribute('srcset') || '').trim();
          if (!srcset) return '';
          const last = srcset.split(',').map(s => s.trim()).filter(Boolean).pop() || '';
          return (last.split(/\s+/)[0] || '').trim();
        };

        const btn = createDownloadFabButton({ title: t.hunkChDownloadImage, right: 12, bottom: 12, zIndex: 30, size: 50 });
        btn.classList.add('emby-seancody-poster-download');
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const url = resolvePosterUrl();
          const filename = getHunkChPosterFilenameSetting();
          const saveAs = getHunkChSaveAsSetting();
          downloadByUrl(url, filename, saveAs, { headers: requestHeaders });
        });

        container.appendChild(btn);
        return true;
      };

      attachPosterDownloadBtn();

      const meta = {
        title: '',
        year: '',
        country: 'USA',
        genres: [],
        duration: '',
        director: '',
        studio: 'SeanCody',
        actors: [],
        description: '',
        extra: ''
      };

      const h2s = Array.from(document.querySelectorAll('h2'));
      const dateRegex = /^[A-Z][a-z]+ \d{1,2}, \d{4}$/;
      let headerSection = null;

      for (let i = 0; i < h2s.length; i++) {
        const h2 = h2s[i];
        const text = h2.textContent.trim();
        if (!dateRegex.test(text)) continue;
        const date = new Date(text);
        if (isNaN(date.getTime())) continue;

        meta.year = date.getFullYear().toString();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        meta.extra += `Date: ${date.getFullYear()}-${mm}-${dd}\n`;

        let next = h2.nextElementSibling;
        while (next && next.tagName !== 'H2') {
          next = next.nextElementSibling;
        }
        if (next && next.tagName === 'H2') {
          meta.title = next.textContent.trim();
        }

        headerSection = h2.closest('section') || null;
        break;
      }

      if (!meta.title) {
        meta.title = document.title.replace(/\s*[–-]\s*seancody\b.*$/i, '').trim();
      }

      const descSection = document.querySelector('section[data-cy="description"]');
      if (descSection) {
        const p = descSection.querySelector('p');
        if (p) meta.description = p.textContent.trim();
      }

      const divs = Array.from(document.querySelectorAll('div'));
      const tagsLabelDiv = divs.find(d => d.textContent.trim() === 'Tags');
      const tagsContainer = tagsLabelDiv ? tagsLabelDiv.nextElementSibling : null;
      if (tagsContainer) {
        const tagSet = new Set();
        tagsContainer.querySelectorAll('a[href*="tags="]').forEach(a => {
          const tag = a.textContent.trim();
          if (tag && !tagSet.has(tag)) {
            tagSet.add(tag);
            meta.genres.push(tag);
          }
        });
      }

      const actorScope = headerSection || (meta.title ? h2s.find(h => h.textContent.trim() === meta.title)?.closest('section') : null) || document;
      const actorSet = new Set();
      actorScope.querySelectorAll('a[href^="/model/"]').forEach(a => {
        const name = a.textContent.trim();
        if (name && !actorSet.has(name)) {
          actorSet.add(name);
          meta.actors.push(name);
        }
      });

      const config = (typeof metadataConfigs !== 'undefined' && metadataConfigs) ? metadataConfigs : defaultMetadataConfigs;
      let injected = false;

      if (descSection && meta.description) {
        if (!descSection.parentNode.querySelector('.emby-metadata-controls.emby-seancody-desc')) {
          const type = 'description';
          const conf = (config && config[type]) || defaultMetadataConfigs[type];
          if (conf && conf.enabled) {
            const text = renderWithTemplate(meta, conf.template, type);
            if (text && text.trim()) {
              const controls = createMetadataControls(type, meta, conf);
              controls.style.marginTop = '8px';
              controls.style.display = 'block';
              controls.classList.add('emby-metadata-controls', 'emby-seancody-desc');
              if (descSection.parentNode) {
                descSection.parentNode.insertBefore(controls, descSection.nextSibling);
                injected = true;
              }
            }
          }
        } else {
          injected = true;
        }
      }

      if (tagsContainer && meta.genres.length > 0) {
        if (!tagsContainer.querySelector('.emby-metadata-controls.emby-seancody-genres')) {
          const type = 'genres';
          const conf = (config && config[type]) || defaultMetadataConfigs[type];
          if (conf && conf.enabled) {
            const text = renderWithTemplate(meta, conf.template, type);
            if (text && text.trim()) {
              const controls = createMetadataControls(type, meta, conf);
              controls.style.marginTop = '6px';
              controls.style.display = 'block';
              controls.classList.add('emby-metadata-controls', 'emby-seancody-genres');
              tagsContainer.appendChild(controls);
              injected = true;
            }
          }
        } else {
          injected = true;
        }
      }

      if (meta.actors.length > 0) {
        const firstActorLink = actorScope.querySelector('a[href^="/model/"]');
        if (firstActorLink) {
          const container = firstActorLink.closest('h2') || firstActorLink.parentElement;
          if (container && container.parentElement) {
            if (!container.parentElement.querySelector('.emby-metadata-controls.emby-seancody-actors')) {
              const type = 'actors';
              const conf = (config && config[type]) || defaultMetadataConfigs[type];
              if (conf && conf.enabled) {
                const text = renderWithTemplate(meta, conf.template, type);
                if (text && text.trim()) {
                  const controls = createMetadataControls(type, meta, conf);
                  controls.style.marginTop = '6px';
                  controls.style.display = 'block';
                  controls.classList.add('emby-metadata-controls', 'emby-seancody-actors');
                  container.parentElement.insertBefore(controls, container.nextSibling);
                  injected = true;
                }
              }
            } else {
              injected = true;
            }
          }
        }
      }

      return injected;
    };

    run();
    setInterval(run, 1000);
  }

  function initCockyBoysStore() {
    if (!location.host.includes('cockyboysstore.com')) return;

    const run = () => {
      const requestHeaders = { Referer: location.href, Origin: location.origin };

      const safeFilenameBase = (raw) => {
        const s = (raw || '').replace(/\s+/g, ' ').trim();
        return s.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim() || 'image';
      };

      const guessExt = (url) => {
        try {
          const u = new URL(url, location.origin);
          const name = (u.pathname.split('/').pop() || '').trim();
          const m = name.match(/\.(jpg|jpeg|png|webp)(?:$|\?)/i);
          if (m) return m[1].toLowerCase();
        } catch (_) {}
        return 'jpg';
      };

      const resolveBestFromSrcset = (srcset) => {
        const s = (srcset || '').trim();
        if (!s) return '';
        const parts = s.split(',').map(x => x.trim()).filter(Boolean);
        let bestUrl = '';
        let bestW = -1;
        for (const part of parts) {
          const seg = part.split(/\s+/).filter(Boolean);
          const url = (seg[0] || '').trim();
          const w = seg.length > 1 ? parseInt(seg[1].replace(/w$/i, ''), 10) : NaN;
          if (!url) continue;
          if (Number.isFinite(w)) {
            if (w > bestW) {
              bestW = w;
              bestUrl = url;
            }
          } else {
            bestUrl = url;
          }
        }
        return bestUrl;
      };

      const attachBoxcoverDownloadBtns = () => {
        const roots = [];
        const toast = document.querySelector('#carttoastboxcover');
        if (toast) roots.push(toast);
        const details = document.querySelector('#video-container-details');
        if (details) roots.push(details);

        const boxcovers = roots.flatMap(root => Array.from(root.querySelectorAll ? root.querySelectorAll('.boxcover') : []))
          .concat(toast ? [toast] : [])
          .filter(el => el && el.querySelector && el.querySelector('img.boxcover-image'));

        boxcovers.forEach(container => {
          const img = container.querySelector('img.boxcover-image');
          if (!img) return;
          if (container.querySelector('.emby-hunkch-download-btn.emby-cockyboys-boxcover-download')) return;

          if (getComputedStyle(container).position === 'static') {
            container.style.position = 'relative';
          }

          const resolveUrl = () => {
            const dataSrc = (img.getAttribute('data-src') || img.dataset.src || '').trim();
            const dataSrcset = (img.getAttribute('data-srcset') || img.dataset.srcset || '').trim();
            const srcset = (img.getAttribute('srcset') || '').trim();
            const best = resolveBestFromSrcset(dataSrcset || srcset);
            const direct = (img.currentSrc || img.src || '').trim();
            return best || dataSrc || direct;
          };

          const btn = createDownloadFabButton({ title: t.hunkChDownloadImage, right: 12, bottom: 12, zIndex: 30, size: 50 });
          btn.classList.add('emby-cockyboys-boxcover-download');
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const url = resolveUrl();
            const filename = getHunkChPosterFilenameSetting();
            const saveAs = getHunkChSaveAsSetting();
            downloadByUrl(url, filename, saveAs, { headers: requestHeaders });
          });
          container.appendChild(btn);
        });
      };

      const attachPerformerDownloadBtns = () => {
        const performers = document.querySelectorAll('.video-performer');
        performers.forEach(card => {
          const a = card.querySelector('a');
          if (!a) return;
          if (a.querySelector('.emby-hunkch-download-btn.emby-cockyboys-performer-download')) return;

          const name = (card.querySelector('.performer-name')?.textContent || a.getAttribute('title') || '').trim();
          if (!name) return;

          const img = a.querySelector('img');
          const fromData = img ? (img.getAttribute('data-bgsrc') || img.dataset.bgsrc || '') : '';
          const styleVal = img ? (img.style.backgroundImage || '') : '';
          const fromStyle = (() => {
            const m = styleVal.match(/url\((['"]?)(.*?)\1\)/i);
            return m ? m[2] : '';
          })();
          const url = (fromData || fromStyle || '').trim();
          if (!url) return;

          if (getComputedStyle(a).position === 'static') {
            a.style.position = 'relative';
          }

          const btn = createDownloadFabButton({ title: t.hunkChDownloadImage, right: 6, bottom: 6, zIndex: 10, size: 36 });
          btn.classList.add('emby-cockyboys-performer-download');
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const ext = guessExt(url);
            const filename = `${safeFilenameBase(name)}.${ext}`;
            const saveAs = getHunkChSaveAsSetting();
            downloadByUrl(url, filename, saveAs, { headers: requestHeaders });
          });
          a.appendChild(btn);
        });
      };

      attachBoxcoverDownloadBtns();
      attachPerformerDownloadBtns();

      const meta = {
        title: '',
        year: '',
        country: 'USA',
        genres: [],
        duration: '',
        director: '',
        studio: 'CockyBoysStore',
        actors: [],
        description: '',
        extra: ''
      };

      const titleEl = document.querySelector('h1.description');
      if (titleEl) meta.title = titleEl.textContent.trim();

      const synopsisP = document.querySelector('.synopsis p');
      if (synopsisP) meta.description = synopsisP.textContent.trim();

      const studioA = document.querySelector('.studio a');
      if (studioA) meta.studio = studioA.textContent.trim() || meta.studio;

      const directorDiv = document.querySelector('.director');
      if (directorDiv) {
        const names = Array.from(directorDiv.querySelectorAll('a')).map(a => a.textContent.trim()).filter(Boolean);
        if (names.length) meta.director = names.join(', ');
      }

      const releaseDivs = Array.from(document.querySelectorAll('.release-date'));
      const releasedRow = releaseDivs.find(d => /Released:/i.test(d.textContent || ''));
      if (releasedRow) {
        const txt = releasedRow.textContent.replace(/\s+/g, ' ').trim();
        const m = txt.match(/Released:\s*(.+)$/i);
        const rawDate = m ? m[1].trim() : '';
        if (rawDate) {
          const date = new Date(rawDate);
          if (!isNaN(date.getTime())) {
            meta.year = date.getFullYear().toString();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            meta.extra += `Date: ${date.getFullYear()}-${mm}-${dd}\n`;
          } else {
            meta.extra += `Released: ${rawDate}\n`;
          }
        }
      }

      const lengthRow = releaseDivs.find(d => /Length:/i.test(d.textContent || ''));
      if (lengthRow) {
        const txt = lengthRow.textContent.replace(/\s+/g, ' ').trim();
        const m = txt.match(/Length:\s*(.+)$/i);
        if (m && m[1]) meta.duration = m[1].trim();
      }

      const categoriesDiv = document.querySelector('.categories');
      if (categoriesDiv) {
        const set = new Set();
        categoriesDiv.querySelectorAll('a').forEach(a => {
          const g = a.textContent.replace(/\s+/g, ' ').trim();
          if (g && !set.has(g)) set.add(g);
        });
        meta.genres = Array.from(set);
      }

      const actorSet = new Set();
      document.querySelectorAll('.video-performer .performer-name').forEach(el => {
        const n = el.textContent.replace(/\s+/g, ' ').trim();
        if (n && !actorSet.has(n)) {
          actorSet.add(n);
          meta.actors.push(n);
        }
      });
      document.querySelectorAll('.video-details a[data-label="Performer"]').forEach(a => {
        const n = a.textContent.replace(/\s+/g, ' ').trim();
        if (n && !actorSet.has(n)) {
          actorSet.add(n);
          meta.actors.push(n);
        }
      });

      const config = (typeof metadataConfigs !== 'undefined' && metadataConfigs) ? metadataConfigs : defaultMetadataConfigs;
      let injected = false;

      if (synopsisP && meta.description) {
        if (!synopsisP.parentNode.querySelector('.emby-metadata-controls.emby-cockyboys-desc')) {
          const type = 'description';
          const conf = (config && config[type]) || defaultMetadataConfigs[type];
          if (conf && conf.enabled) {
            const text = renderWithTemplate(meta, conf.template, type);
            if (text && text.trim()) {
              const controls = createMetadataControls(type, meta, conf);
              controls.style.marginTop = '8px';
              controls.style.display = 'block';
              controls.classList.add('emby-metadata-controls', 'emby-cockyboys-desc');
              synopsisP.parentNode.insertBefore(controls, synopsisP.nextSibling);
              injected = true;
            }
          }
        } else {
          injected = true;
        }
      }

      if (categoriesDiv && meta.genres.length > 0) {
        if (!categoriesDiv.querySelector('.emby-metadata-controls.emby-cockyboys-genres')) {
          const type = 'genres';
          const conf = (config && config[type]) || defaultMetadataConfigs[type];
          if (conf && conf.enabled) {
            const text = renderWithTemplate(meta, conf.template, type);
            if (text && text.trim()) {
              const controls = createMetadataControls(type, meta, conf);
              controls.style.marginTop = '8px';
              controls.style.display = 'inline-flex';
              controls.classList.add('emby-metadata-controls', 'emby-cockyboys-genres');
              categoriesDiv.appendChild(controls);
              injected = true;
            }
          }
        } else {
          injected = true;
        }
      }

      if (meta.actors.length > 0) {
        const videoDetails = document.querySelector('.video-details');
        if (videoDetails && !videoDetails.querySelector('.emby-metadata-controls.emby-cockyboys-actors')) {
          const type = 'actors';
          const conf = (config && config[type]) || defaultMetadataConfigs[type];
          if (conf && conf.enabled) {
            const text = renderWithTemplate(meta, conf.template, type);
            if (text && text.trim()) {
              const controls = createMetadataControls(type, meta, conf);
              controls.style.marginTop = '8px';
              controls.style.display = 'block';
              controls.classList.add('emby-metadata-controls', 'emby-cockyboys-actors');
              videoDetails.insertBefore(controls, videoDetails.firstChild);
              injected = true;
            }
          }
        } else if (videoDetails) {
          injected = true;
        }
      }

      return injected;
    };

    run();
    setInterval(run, 1000);
  }

  function initCockyBoysCom() {
    if (!location.host.includes('cockyboys.com')) return;
    if (location.host.includes('cockyboysstore.com')) return;

    const run = () => {
      const requestHeaders = { Referer: location.href, Origin: location.origin };

      if (!document.head.querySelector('style[data-emby-cockyboys-underplayer]')) {
        const style = document.createElement('style');
        style.setAttribute('data-emby-cockyboys-underplayer', '1');
        style.textContent = '.underPlayer{display:block!important;}';
        document.head.appendChild(style);
      }

      const safeFilenameBase = (raw) => {
        const s = (raw || '').replace(/\s+/g, ' ').trim();
        return s.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim() || 'image';
      };

      const guessExt = (url) => {
        try {
          const u = new URL(url, location.origin);
          const name = (u.pathname.split('/').pop() || '').trim();
          const m = name.match(/\.(jpg|jpeg|png|webp)(?:$|\?)/i);
          if (m) return m[1].toLowerCase();
        } catch (_) {}
        return 'jpg';
      };

      const resolveImgUrl = (img) => {
        if (!img) return '';
        const direct = (img.currentSrc || img.src || '').trim();
        if (direct) return direct;
        const srcset = (img.getAttribute('srcset') || '').trim();
        if (!srcset) return '';
        const last = srcset.split(',').map(s => s.trim()).filter(Boolean).pop() || '';
        return (last.split(/\s+/)[0] || '').trim();
      };

      const attachDownloadBtn = ({ container, className, resolveUrl, resolveFilename, size = 36, right = 6, left = null, bottom = 6, zIndex = 10 }) => {
        if (!container) return;
        if (container.querySelector(`.emby-hunkch-download-btn.${className}`)) return;
        if (getComputedStyle(container).position === 'static') {
          container.style.position = 'relative';
        }
        const btn = createDownloadFabButton({ title: t.hunkChDownloadImage, right, left, bottom, zIndex, size });
        btn.classList.add(className);
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const url = resolveUrl();
          const filename = resolveFilename(url);
          const saveAs = getHunkChSaveAsSetting();
          downloadByUrl(url, filename, saveAs, { headers: requestHeaders });
        });
        container.appendChild(btn);
      };

      const attachConfiguredDownloadBtns = (root, imgSelector, className, opts = {}) => {
        if (!root) return;
        root.querySelectorAll(imgSelector).forEach(img => {
          const container = img.closest('a') || img.parentElement;
          if (!container) return;
          attachDownloadBtn({
            container,
            className,
            resolveUrl: () => resolveImgUrl(img),
            resolveFilename: () => getHunkChPosterFilenameSetting(),
            ...opts
          });
        });
      };

      const attachModelThumbDownloadBtn = () => {
        const img = document.querySelector('#modelInfo img.thumb');
        if (!img) return;
        const container = img.closest('#modelInfo') || img.parentElement;
        if (!container) return;
        attachDownloadBtn({
          container,
          className: 'emby-cockyboys-model-thumb-download',
          resolveUrl: () => resolveImgUrl(img),
          resolveFilename: (url) => {
            const name = (img.getAttribute('alt') || document.querySelector('#movieHeader h1')?.textContent || '').trim();
            const ext = guessExt(url);
            return `${safeFilenameBase(name)}.${ext}`;
          },
          size: 50,
          right: 12,
          bottom: 12,
          zIndex: 30
        });
      };

      const attachYouMightAlsoLikeDownloadBtns = () => {
        attachConfiguredDownloadBtns(document, '.horizontal.alsolike .item img', 'emby-cockyboys-alsolike-download');
      };

      const attachModelPageDownloadBtns = () => {
        const tabInfo = document.querySelector('#tabInfo');
        attachConfiguredDownloadBtns(tabInfo, '.modelScenes img', 'emby-cockyboys-model-scenes-download');
        attachConfiguredDownloadBtns(tabInfo, '.modelDVDs img', 'emby-cockyboys-model-dvds-download');

        const tabScenes = document.querySelector('#tabScenes');
        attachConfiguredDownloadBtns(tabScenes, '.thumbCover img', 'emby-cockyboys-model-tabscenes-download');
      };

      const attachDvdPageDownloadBtns = () => {
        attachConfiguredDownloadBtns(document, '#tabOverview .movieDVDs > img', 'emby-cockyboys-dvd-cover-download', {
          size: 50,
          left: 12,
          bottom: 12,
          zIndex: 30
        });
        attachConfiguredDownloadBtns(document, '#tabEpisodes .thumbCover img', 'emby-cockyboys-dvd-episodes-download');
      };

      const attachDvdCastDownloadBtns = () => {
        const tabCast = document.querySelector('#tabCast');
        if (!tabCast) return;
        tabCast.querySelectorAll('a.fade img').forEach(img => {
          const a = img.closest('a.fade') || img.parentElement;
          if (!a) return;
          attachDownloadBtn({
            container: a,
            className: 'emby-cockyboys-dvd-cast-download',
            resolveUrl: () => resolveImgUrl(img),
            resolveFilename: (url) => {
              const name = (img.getAttribute('alt') || a.getAttribute('title') || '').trim();
              const ext = guessExt(url);
              return `${safeFilenameBase(name)}.${ext}`;
            }
          });
        });
      };

      const attachSearchPageDownloadBtns = () => {
        attachConfiguredDownloadBtns(
          document,
          '.sceneList.newReleases.responsive .thumbCover img, .sceneList.newReleases .thumbCover img',
          'emby-cockyboys-search-download'
        );
      };

      attachModelThumbDownloadBtn();
      attachYouMightAlsoLikeDownloadBtns();
      attachModelPageDownloadBtns();
      attachDvdPageDownloadBtns();
      attachDvdCastDownloadBtns();
      attachSearchPageDownloadBtns();

      const meta = {
        title: '',
        year: '',
        country: 'USA',
        genres: [],
        duration: '',
        director: '',
        studio: 'CockyBoys',
        actors: [],
        description: '',
        extra: ''
      };

      const titleEl = document.querySelector('h1.sectionTitle');
      if (titleEl) meta.title = titleEl.textContent.replace(/\s+/g, ' ').trim();

      const tagsDiv = document.querySelector('#tags');
      if (tagsDiv) {
        tagsDiv.querySelectorAll('a').forEach(a => {
          const name = a.textContent.replace(/\s+/g, ' ').trim();
          if (!name) return;
          const href = (a.getAttribute('href') || '').trim();
          if (/\/sets\.php\b/i.test(href)) meta.actors.push(name);
          else meta.genres.push(name);
        });
      }

      const info = document.querySelector('#info');
      if (info) {
        const spans = Array.from(info.querySelectorAll('span'));
        const released = spans.find(s => /Released:/i.test(s.textContent || ''));
        if (released) {
          const txt = released.textContent.replace(/\s+/g, ' ').trim();
          const m = txt.match(/Released:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
          if (m && m[1]) {
            const parts = m[1].split('/');
            const mm = parts[0].padStart(2, '0');
            const dd = parts[1].padStart(2, '0');
            const yy = parts[2];
            meta.year = yy;
            meta.extra += `Date: ${yy}-${mm}-${dd}\n`;
          }
        }

        const categorized = spans.find(s => /Categorized Under:/i.test(s.textContent || ''));
        if (categorized) {
          categorized.querySelectorAll('a').forEach(a => {
            const g = a.textContent.replace(/\s+/g, ' ').trim();
            if (g) meta.genres.push(g);
          });
        }

        const featuring = spans.find(s => /Featuring:/i.test(s.textContent || ''));
        if (featuring) {
          featuring.querySelectorAll('a[href*="sets.php"]').forEach(a => {
            const n = a.textContent.replace(/\s+/g, ' ').trim();
            if (n) meta.actors.push(n);
          });
        }
      }

      const featuredDvdNameEl = document.querySelector('.movieDVDs p a[href^="/dvds.php"]');
      if (featuredDvdNameEl && !document.querySelector('#tabOverview .movieDVDs')) {
        const dvdName = featuredDvdNameEl.textContent.replace(/\s+/g, ' ').trim();
        if (dvdName) meta.genres.push(dvdName);
      }

      let dvdFeaturingP = null;
      let dvdDescP = null;
      const dvdOverview = document.querySelector('#tabOverview .movieDVDs');
      if (dvdOverview) {
        const dvdTitle = dvdOverview.querySelector('h1');
        if (dvdTitle && !meta.title) meta.title = dvdTitle.textContent.replace(/\s+/g, ' ').trim();

        dvdOverview.querySelectorAll('p').forEach(p => {
          const t0 = p.textContent.replace(/\s+/g, ' ').trim();
          if (/^Director:/i.test(t0)) {
            meta.director = t0.replace(/^Director:\s*/i, '').trim();
          } else if (/^Featuring:/i.test(t0)) {
            dvdFeaturingP = p;
            p.querySelectorAll('a[href^="/models/"]').forEach(a => {
              const n = a.getAttribute('title') || a.textContent;
              const name = (n || '').replace(/\s+/g, ' ').trim();
              if (name) meta.actors.push(name);
            });
          } else if (/^Description:/i.test(t0)) {
            dvdDescP = p;
            meta.description = t0.replace(/^Description:\s*/i, '').trim();
          }
        });
      }

      const descBox = document.querySelector('.movieLeft .movieDesc');
      if (descBox) {
        let txt = descBox.textContent.replace(/\s+/g, ' ').trim();
        txt = txt.replace(/^Description\b\s*/i, '');
        if (txt) meta.description = txt;
      } else {
        const topDesc = document.querySelector('.movieTop .movieDesc');
        if (topDesc) meta.description = topDesc.textContent.replace(/\s+/g, ' ').trim();
      }

      meta.genres = Array.from(new Set(normalizeNameList(meta.genres)));
      meta.actors = Array.from(new Set(normalizeNameList(meta.actors)));

      const config = (typeof metadataConfigs !== 'undefined' && metadataConfigs) ? metadataConfigs : defaultMetadataConfigs;
      let injected = false;

      if (tagsDiv && meta.actors.length > 0) {
        if (!tagsDiv.querySelector('.emby-metadata-controls.emby-cockyboyscom-actors')) {
          const type = 'actors';
          const conf = (config && config[type]) || defaultMetadataConfigs[type];
          if (conf && conf.enabled) {
            const text = renderWithTemplate(meta, conf.template, type);
            if (text && text.trim()) {
              const controls = createMetadataControls(type, meta, conf);
              controls.style.marginTop = '10px';
              controls.style.display = 'inline-flex';
              controls.classList.add('emby-metadata-controls', 'emby-cockyboyscom-actors');
              tagsDiv.appendChild(controls);
              injected = true;
            }
          }
        } else {
          injected = true;
        }
      }

      if (tagsDiv && meta.genres.length > 0) {
        if (!tagsDiv.querySelector('.emby-metadata-controls.emby-cockyboyscom-genres')) {
          const type = 'genres';
          const conf = (config && config[type]) || defaultMetadataConfigs[type];
          if (conf && conf.enabled) {
            const text = renderWithTemplate(meta, conf.template, type);
            if (text && text.trim()) {
              const controls = createMetadataControls(type, meta, conf);
              controls.style.marginTop = '10px';
              controls.style.display = 'inline-flex';
              controls.classList.add('emby-metadata-controls', 'emby-cockyboyscom-genres');
              tagsDiv.appendChild(controls);
              injected = true;
            }
          }
        } else {
          injected = true;
        }
      }

      if (descBox && meta.description) {
        if (!descBox.querySelector('.emby-metadata-controls.emby-cockyboyscom-desc')) {
          const type = 'description';
          const conf = (config && config[type]) || defaultMetadataConfigs[type];
          if (conf && conf.enabled) {
            const text = renderWithTemplate(meta, conf.template, type);
            if (text && text.trim()) {
              const controls = createMetadataControls(type, meta, conf);
              controls.style.marginTop = '10px';
              controls.style.display = 'block';
              controls.classList.add('emby-metadata-controls', 'emby-cockyboyscom-desc');
              descBox.appendChild(controls);
              injected = true;
            }
          }
        } else {
          injected = true;
        }
      }

      if (dvdFeaturingP && meta.actors.length > 0) {
        if (!dvdFeaturingP.querySelector('.emby-metadata-controls.emby-cockyboyscom-dvd-actors')) {
          const type = 'actors';
          const conf = (config && config[type]) || defaultMetadataConfigs[type];
          if (conf && conf.enabled) {
            const text = renderWithTemplate(meta, conf.template, type);
            if (text && text.trim()) {
              const controls = createMetadataControls(type, meta, conf);
              controls.style.marginTop = '10px';
              controls.style.display = 'inline-flex';
              controls.classList.add('emby-metadata-controls', 'emby-cockyboyscom-dvd-actors');
              dvdFeaturingP.appendChild(controls);
              injected = true;
            }
          }
        } else {
          injected = true;
        }
      }

      if (dvdDescP && meta.description) {
        if (!dvdDescP.querySelector('.emby-metadata-controls.emby-cockyboyscom-dvd-desc')) {
          const type = 'description';
          const conf = (config && config[type]) || defaultMetadataConfigs[type];
          if (conf && conf.enabled) {
            const text = renderWithTemplate(meta, conf.template, type);
            if (text && text.trim()) {
              const controls = createMetadataControls(type, meta, conf);
              controls.style.marginTop = '10px';
              controls.style.display = 'inline-flex';
              controls.classList.add('emby-metadata-controls', 'emby-cockyboyscom-dvd-desc');
              dvdDescP.appendChild(controls);
              injected = true;
            }
          }
        } else {
          injected = true;
        }
      }

      return injected;
    };

    run();
    setInterval(run, 1000);
  }

  function initGayDvdEmpire() {
    if (!location.host.includes('gaydvdempire.com')) return;

    const run = () => {
      const requestHeaders = { Referer: location.href, Origin: location.origin };

      const safeFilenameBase = (raw) => {
        const s = (raw || '').replace(/\s+/g, ' ').trim();
        return s.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim() || 'image';
      };

      const guessExt = (url) => {
        try {
          const u = new URL(url, location.origin);
          const name = (u.pathname.split('/').pop() || '').trim();
          const m = name.match(/\.(jpg|jpeg|png|webp)(?:$|\?)/i);
          if (m) return m[1].toLowerCase();
        } catch (_) {}
        return 'jpg';
      };

      const ensurePerformerStyle = () => {
        if (!document.head) return;
        if (document.getElementById('emby-gaydvdempire-performer-style')) return;
        const style = document.createElement('style');
        style.id = 'emby-gaydvdempire-performer-style';
        style.textContent = `
          .movie-page__content-tags__performers a { vertical-align: middle; }
          .movie-page__content-tags__performers .hover-popover { display: none !important; }
          .movie-page__content-tags__performers .hover-popover-container { display: inline-flex !important; align-items: center !important; gap: 10px !important; }
          .movie-page__content-tags__performers .emby-gde-performer-thumb { width: auto !important; height: var(--emby-gde-thumb-h, 120px) !important; border-radius: 10px !important; display: block !important; cursor: zoom-in !important; }
          .movie-page__content-tags__performers .emby-gde-performer-list { --emby-gde-thumb-h: 120px; --emby-gde-row-gap: 10px; max-height: calc(var(--emby-gde-thumb-h) * 3 + var(--emby-gde-row-gap) * 2) !important; overflow-y: auto !important; padding-right: 10px !important; margin-top: 8px !important; display: flex !important; flex-direction: column !important; gap: var(--emby-gde-row-gap) !important; }
          .movie-page__content-tags__performers .emby-gde-performer-list a { display: block !important; }
          .movie-page__content-tags__performers .emby-gde-performer-list .hover-popover-container { width: 100% !important; display: inline-flex !important; }
          .emby-gde-lightbox { position: fixed !important; inset: 0 !important; display: none !important; align-items: center !important; justify-content: center !important; background: rgba(0,0,0,.92) !important; z-index: 2147483647 !important; cursor: zoom-out !important; padding: 0 !important; margin: 0 !important; }
          .emby-gde-lightbox[aria-hidden="false"] { display: flex !important; }
          .emby-gde-lightbox img { max-width: 96vw !important; max-height: 96vh !important; width: auto !important; height: auto !important; object-fit: contain !important; display: block !important; }
          body.emby-gde-lightbox-open { overflow: hidden !important; }
        `;
        document.head.appendChild(style);
      };

      const ensurePerformerList = (performers) => {
        if (!performers) return null;
        const existing = performers.querySelector(':scope > .emby-gde-performer-list');
        if (existing) return existing;

        const list = document.createElement('div');
        list.className = 'emby-gde-performer-list';

        const strong = performers.querySelector(':scope > strong');
        if (strong && strong.nextSibling) performers.insertBefore(list, strong.nextSibling);
        else performers.appendChild(list);

        Array.from(performers.childNodes).forEach(n => {
          if (n.nodeType !== Node.TEXT_NODE) return;
          const t = String(n.textContent || '');
          if (/^[\s,]+$/.test(t)) n.remove();
        });

        Array.from(performers.children).forEach(ch => {
          if (ch && ch.tagName === 'A') list.appendChild(ch);
        });

        return list;
      };

      const ensureLightbox = () => {
        if (!document.body || document.body.dataset.embyGdeLightboxReady === '1') return;
        document.body.dataset.embyGdeLightboxReady = '1';
        const overlay = document.createElement('div');
        overlay.className = 'emby-gde-lightbox';
        overlay.setAttribute('aria-hidden', 'true');
        const viewerImg = document.createElement('img');
        viewerImg.alt = '';
        overlay.appendChild(viewerImg);
        document.body.appendChild(overlay);
        const close = () => {
          overlay.setAttribute('aria-hidden', 'true');
          viewerImg.removeAttribute('src');
          document.body.classList.remove('emby-gde-lightbox-open');
        };
        const open = (url) => {
          if (!url) return;
          viewerImg.src = url;
          overlay.setAttribute('aria-hidden', 'false');
          document.body.classList.add('emby-gde-lightbox-open');
        };
        window.__embyGdeLightboxOpen = open;
        window.__embyGdeLightboxClose = close;
        overlay.addEventListener('click', () => close(), true);
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); }, true);
      };

      const boxcover = document.querySelector('#Boxcover');
      if (boxcover && !boxcover.querySelector('.emby-hunkch-download-btn.emby-gaydvdempire-boxcover-download')) {
        if (getComputedStyle(boxcover).position === 'static') boxcover.style.position = 'relative';
        const btn = createDownloadFabButton({ title: t.hunkChDownloadImage, right: 12, bottom: 12, zIndex: 50, size: 50 });
        btn.classList.add('emby-gaydvdempire-boxcover-download');
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const active = boxcover.querySelector('a.fancy.active') || boxcover.querySelector('a#front-cover') || boxcover.querySelector('a.fancy');
          const img = active ? active.querySelector('img') : null;
          const url = (active && (active.getAttribute('data-href') || active.getAttribute('href') || active.href)) || (img && (img.currentSrc || img.src)) || '';
          const filename = getHunkChPosterFilenameSetting();
          const saveAs = getHunkChSaveAsSetting();
          downloadByUrl(url, filename, saveAs, { headers: requestHeaders });
        });
        boxcover.appendChild(btn);
      }

      const meta = {
        title: '',
        year: '',
        country: 'USA',
        genres: [],
        duration: '',
        director: '',
        studio: 'GayDVDEmpire',
        actors: [],
        description: '',
        extra: ''
      };

      const titleEl = document.querySelector('h1.movie-page__heading__title');
      if (titleEl) {
        const clone = titleEl.cloneNode(true);
        clone.querySelectorAll('span').forEach(s => s.remove());
        meta.title = clone.textContent.replace(/\s+/g, ' ').trim();
      }

      const infoEl = document.querySelector('.movie-page__heading__movie-info');
      if (infoEl) {
        const studioA = infoEl.querySelector('a');
        if (studioA) meta.studio = studioA.textContent.replace(/\s+/g, ' ').trim() || meta.studio;
        const yearEl = infoEl.querySelector('small');
        if (yearEl) {
          const m = yearEl.textContent.match(/(\d{4})/);
          if (m) meta.year = m[1];
        }
      }

      const performers = document.querySelector('.movie-page__content-tags__performers');
      if (performers) {
        ensurePerformerStyle();
        ensureLightbox();
        const performerList = ensurePerformerList(performers);

        (performerList || performers).querySelectorAll('a').forEach(a => {
          const hover = a.querySelector('.hover-popover-container');
          if (!hover) return;
          if (hover.dataset.embyGdeInlineReady === '1') return;

          const popImg = hover.querySelector('.hover-popover-detail img') || hover.querySelector('.hover-popover img') || null;
          const imgUrl = popImg ? (popImg.currentSrc || popImg.src || '') : '';
          const actorName = normalizeNameList([popImg ? (popImg.getAttribute('title') || popImg.title || popImg.getAttribute('alt') || popImg.alt || '') : ''])[0] || '';
          if (!imgUrl || !actorName) return;

          const oldText = (hover.childNodes && hover.childNodes[0] && hover.childNodes[0].textContent) ? hover.childNodes[0].textContent : '';
          if (oldText && oldText.trim()) {
            try { hover.childNodes[0].textContent = ''; } catch (_) {}
          }

          const imgWrap = document.createElement('span');
          imgWrap.className = 'emby-gde-performer-imgwrap';
          imgWrap.style.cssText = 'position:relative;display:inline-block;flex:0 0 auto;';

          const thumb = document.createElement('img');
          thumb.className = 'img-responsive emby-gde-performer-thumb';
          thumb.alt = actorName;
          thumb.title = actorName;
          thumb.src = imgUrl;
          thumb.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const url = (thumb.currentSrc || thumb.src || '').trim();
            if (!url) return;
            if (typeof window.__embyGdeLightboxOpen === 'function') window.__embyGdeLightboxOpen(url);
          }, true);
          imgWrap.appendChild(thumb);

          const btn = createDownloadFabButton({ title: t.hunkChDownloadImage, right: 4, bottom: 4, zIndex: 10, size: 36 });
          btn.classList.add('emby-gaydvdempire-performer-download');
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const url = (thumb.currentSrc || thumb.src || '').trim();
            const ext = guessExt(url);
            const filename = `${safeFilenameBase(actorName)}.${ext}`;
            const saveAs = getHunkChSaveAsSetting();
            downloadByUrl(url, filename, saveAs, { headers: requestHeaders });
          });
          imgWrap.appendChild(btn);

          const nameSpan = document.createElement('span');
          nameSpan.className = 'emby-gde-performer-name';
          nameSpan.textContent = actorName;

          hover.insertBefore(imgWrap, hover.firstChild);
          hover.appendChild(nameSpan);

          hover.dataset.embyGdeInlineReady = '1';
        });

        (performerList || performers).querySelectorAll('a').forEach(a => {
          const hover = a.querySelector('.hover-popover-container');
          const inlineName = hover ? hover.querySelector('.emby-gde-performer-name') : null;
          const popImg = hover ? (hover.querySelector('.hover-popover-detail img') || hover.querySelector('.hover-popover img')) : null;
          const raw = (inlineName && inlineName.textContent)
            || (popImg && (popImg.getAttribute('title') || popImg.title || popImg.getAttribute('alt') || popImg.alt))
            || (hover && hover.childNodes && hover.childNodes[0] && hover.childNodes[0].textContent ? hover.childNodes[0].textContent : '')
            || a.textContent;
          const name = (raw || '').replace(/\s+/g, ' ').trim();
          if (name) meta.actors.push(name);
        });
      }

      const categories = document.querySelector('.movie-page__content-tags__categories');
      if (categories) {
        categories.querySelectorAll('a').forEach(a => {
          const g = a.textContent.replace(/\s+/g, ' ').trim();
          if (g) meta.genres.push(g);
        });
      }

      const synopsis = document.querySelector('#synopsis-container .synopsis-content');
      if (synopsis) {
        const txt = synopsis.textContent.replace(/\s+/g, ' ').trim();
        if (txt) meta.description = txt;
      }

      meta.genres = Array.from(new Set(normalizeNameList(meta.genres)));
      meta.actors = Array.from(new Set(normalizeNameList(meta.actors)));

      const config = (typeof metadataConfigs !== 'undefined' && metadataConfigs) ? metadataConfigs : defaultMetadataConfigs;
      let injected = false;

      if (performers && meta.actors.length > 0) {
        if (!performers.querySelector('.emby-metadata-controls.emby-gaydvdempire-actors')) {
          const type = 'actors';
          const conf = (config && config[type]) || defaultMetadataConfigs[type];
          if (conf && conf.enabled) {
            const text = renderWithTemplate(meta, conf.template, type);
            if (text && text.trim()) {
              const controls = createMetadataControls(type, meta, conf);
              controls.style.marginLeft = '8px';
              controls.style.display = 'inline-flex';
              controls.classList.add('emby-metadata-controls', 'emby-gaydvdempire-actors');
              performers.appendChild(controls);
              injected = true;
            }
          }
        } else {
          injected = true;
        }
      }

      if (categories && meta.genres.length > 0) {
        if (!categories.querySelector('.emby-metadata-controls.emby-gaydvdempire-genres')) {
          const type = 'genres';
          const conf = (config && config[type]) || defaultMetadataConfigs[type];
          if (conf && conf.enabled) {
            const text = renderWithTemplate(meta, conf.template, type);
            if (text && text.trim()) {
              const controls = createMetadataControls(type, meta, conf);
              controls.style.marginLeft = '8px';
              controls.style.display = 'inline-flex';
              controls.classList.add('emby-metadata-controls', 'emby-gaydvdempire-genres');
              categories.appendChild(controls);
              injected = true;
            }
          }
        } else {
          injected = true;
        }
      }

      return injected;
    };

    run();
    setInterval(run, 1000);
  }

  function initGaywire() {
    if (!location.host.includes('gaywire.com')) return;

    let retries = 0;
    const maxRetries = 20;

    function getCleanText(el) {
        if (!el) return '';
        const clone = el.cloneNode(true);
        clone.querySelectorAll('label, svg, title').forEach(n => n.remove());
        return clone.textContent.replace(/\s+/g, ' ').trim();
    }

    function expandDescription() {
        const inputs = document.querySelectorAll('section[data-cy="description"] input[type="checkbox"][id^="desc-"]');
        if (inputs.length === 0) return false;
        inputs.forEach(input => {
            if (!input.checked) {
                input.checked = true;
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
        return true;
    }

    function expandInformation() {
        const infoHeader = Array.from(document.querySelectorAll('h2')).find(h2 => h2.textContent.trim() === 'Information');
        if (!infoHeader || !infoHeader.parentElement) return false;
        const headerRow = infoHeader.parentElement;
        const toggleBtn = headerRow.querySelector('button');
        const content = headerRow.nextElementSibling;
        if (!toggleBtn || !content) return false;

        const collapsed = content.clientHeight === 0 || (content.scrollHeight > 0 && content.clientHeight < 10);
        if (collapsed) toggleBtn.click();
        return true;
    }

    function run() {
        expandDescription();
        expandInformation();

        const meta = {
            title: '',
            year: '',
            country: 'USA',
            genres: [],
            duration: '',
            director: '',
            studio: 'Gaywire',
            actors: [],
            description: '',
            extra: ''
        };

        const h2s = Array.from(document.querySelectorAll('h2'));
        const dateRegex = /^[A-Z][a-z]+ \d{1,2}, \d{4}$/;
        let mainTitleH2 = null;
        for (let i = 0; i < h2s.length; i++) {
            const h2 = h2s[i];
            const text = h2.textContent.trim();
            if (!dateRegex.test(text)) continue;

            const date = new Date(text);
            if (isNaN(date.getTime())) continue;

            meta.year = date.getFullYear().toString();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            meta.extra += `Date: ${date.getFullYear()}-${mm}-${dd}\n`;

            let next = h2.nextElementSibling;
            while (next && next.tagName !== 'H2') next = next.nextElementSibling;
            if (next && next.tagName === 'H2') {
                mainTitleH2 = next;
                meta.title = next.textContent.trim();
            }
            break;
        }

        if (!meta.title) {
            meta.title = document.title.replace(/\s*\|\s*Gaywire.*$/i, '').trim();
        }

        const descSection = document.querySelector('section[data-cy="description"]');
        const descP = descSection ? descSection.querySelector('p') : null;
        if (descP) meta.description = getCleanText(descP);

        let actorScope = null;
        if (mainTitleH2) {
            let node = mainTitleH2.nextElementSibling;
            let steps = 0;
            while (node && steps < 8) {
                if (node.querySelectorAll && node.querySelectorAll('a[href^="/model/"]').length > 0) {
                    actorScope = node;
                    break;
                }
                node = node.nextElementSibling;
                steps++;
            }
        }

        const actorLinks = actorScope ? actorScope.querySelectorAll('a[href^="/model/"]') : document.querySelectorAll('a[href^="/model/"]');
        const actorSet = new Set();
        actorLinks.forEach(a => {
            const name = a.textContent.trim();
            if (name && !actorSet.has(name)) {
                actorSet.add(name);
                meta.actors.push({ name });
            }
        });

        const infoHeader = Array.from(document.querySelectorAll('h2')).find(h2 => h2.textContent.trim() === 'Information');
        const infoContent = (infoHeader && infoHeader.parentElement) ? infoHeader.parentElement.nextElementSibling : null;

        const subsiteLink = infoContent ? infoContent.querySelector('a[href^="/videos/site/"]') : document.querySelector('a[href^="/videos/site/"]');
        if (subsiteLink) {
            const subsite = subsiteLink.textContent.trim();
            if (subsite) meta.studio = `Gaywire (${subsite})`;
        }

        const tagLinks = infoContent ? infoContent.querySelectorAll('a[href^="/videos/tags/"]') : document.querySelectorAll('a[href^="/videos/tags/"]');
        const tagSet = new Set();
        tagLinks.forEach(a => {
            const tag = a.textContent.trim();
            if (tag && !tagSet.has(tag)) {
                tagSet.add(tag);
                meta.genres.push(tag);
            }
        });
        const tagsContainer = tagLinks.length > 0 ? tagLinks[0].parentElement : null;

        const config = (typeof metadataConfigs !== 'undefined' && metadataConfigs) ? metadataConfigs : defaultMetadataConfigs;

        let injected = false;

        if (tagsContainer && meta.genres.length > 0) {
            if (!tagsContainer.querySelector('.emby-gaywire-genres-controls')) {
                const type = 'genres';
                const conf = (config && config[type]) || defaultMetadataConfigs[type];
                if (conf && conf.enabled) {
                    const text = renderWithTemplate(meta, conf.template, type);
                    if (text && text.trim()) {
                        const controls = createMetadataControls(type, meta, conf);
                        controls.style.marginTop = '6px';
                        controls.style.display = 'block';
                        controls.classList.add('emby-metadata-controls', 'emby-gaywire-genres-controls');
                        tagsContainer.appendChild(controls);
                        injected = true;
                    }
                }
            } else {
                injected = true;
            }
        }

        if (meta.actors.length > 0) {
            const firstActorLink = actorScope ? actorScope.querySelector('a[href^="/model/"]') : document.querySelector('a[href^="/model/"]');
            if (firstActorLink) {
                const container = firstActorLink.closest('h2') || firstActorLink.parentElement;
                if (container && container.parentElement) {
                    if (!container.parentElement.querySelector('.emby-gaywire-actors-controls')) {
                        const type = 'actors';
                        const conf = (config && config[type]) || defaultMetadataConfigs[type];
                        if (conf && conf.enabled) {
                            const text = renderWithTemplate(meta, conf.template, type);
                            if (text && text.trim()) {
                                const controls = createMetadataControls(type, meta, conf);
                                controls.style.marginTop = '6px';
                                controls.style.display = 'block';
                                controls.classList.add('emby-metadata-controls', 'emby-gaywire-actors-controls');
                                container.parentElement.insertBefore(controls, container.nextSibling);
                                injected = true;
                            }
                        }
                    } else {
                        injected = true;
                    }
                }
            }
        }

        if (descSection && meta.description) {
            if (!descSection.querySelector('.emby-gaywire-desc-controls')) {
                const type = 'description';
                const conf = (config && config[type]) || defaultMetadataConfigs[type];
                if (conf && conf.enabled) {
                    const text = renderWithTemplate(meta, conf.template, type);
                    if (text && text.trim()) {
                        const controls = createMetadataControls(type, meta, conf);
                        controls.style.marginTop = '8px';
                        controls.style.display = 'block';
                        controls.classList.add('emby-metadata-controls', 'emby-gaywire-desc-controls');
                        if (descSection.parentNode) {
                            descSection.parentNode.insertBefore(controls, descSection.nextSibling);
                            injected = true;
                        }
                    }
                }
            } else {
                injected = true;
            }
        }

        return injected;
    }

    if (run()) return;

    const interval = setInterval(() => {
        try {
            if (run()) {
                clearInterval(interval);
            } else {
                retries++;
                if (retries >= maxRetries) clearInterval(interval);
            }
        } catch (e) {
            console.error('initGaywire error', e);
        }
    }, 1000);
  }

  function initWaybig() {
    if (!location.host.includes('waybig.com')) return;

    const meta = {
        title: '',
        year: '',
        country: 'USA',
        genres: [],
        duration: '',
        director: '',
        studio: 'WAYBIG',
        actors: [],
        description: '',
        extra: ''
    };

    function normalizeText(text) {
        return (text || '').replace(/\s+/g, ' ').trim();
    }

    function addGenre(value) {
        const v = normalizeText(value);
        if (!v) return;
        const key = v.toLowerCase();
        if (!meta.genres.some(g => g.toLowerCase() === key)) {
            meta.genres.push(v);
        }
    }

    const titleH2 = document.querySelector('.title-col.-content h2');
    if (titleH2) {
        const full = normalizeText(titleH2.textContent);
        const parts = full.split(' - ');
        if (parts.length > 1) {
            const maybeStudio = normalizeText(parts[parts.length - 1]);
            if (maybeStudio) meta.studio = maybeStudio;
            meta.title = normalizeText(parts.slice(0, -1).join(' - ')).replace(/\s*\([^)]*\)\s*$/, '');
        } else {
            meta.title = full.replace(/\s*\([^)]*\)\s*$/, '');
        }
    }

    const breadcrumbStudio = document.querySelector('.breadcrumb-col a[href*="/studios/"]');
    if (breadcrumbStudio) {
        const name = normalizeText(breadcrumbStudio.textContent);
        if (name) meta.studio = name;
    }

    const dateEl = Array.from(document.querySelectorAll('.content-base-info .info-elem')).find(el => el.querySelector('svg[data-icon="calendar"]'));
    if (dateEl) {
        const text = normalizeText(dateEl.querySelector('.sub-label') ? dateEl.querySelector('.sub-label').textContent : dateEl.textContent);
        if (text) {
            meta.extra += `Date: ${text}\n`;
            const m = text.match(/^(\d{4})/);
            if (m) meta.year = m[1];
        }
    }

    const durEl = Array.from(document.querySelectorAll('.content-base-info .info-elem')).find(el => el.querySelector('svg[data-icon="clock"]'));
    if (durEl) {
        const text = normalizeText(durEl.querySelector('.sub-label') ? durEl.querySelector('.sub-label').textContent : durEl.textContent);
        if (text) meta.duration = text;
    }

    const descInner = document.querySelector('.content-desc .expand-inner');
    if (descInner) meta.description = normalizeText(descInner.textContent);

    const modelLabels = document.querySelectorAll('.content-links.-models .models-box a .sub-label');
    const actorSet = new Set();
    modelLabels.forEach(span => {
        const name = normalizeText(span.textContent);
        if (name && !actorSet.has(name)) {
            actorSet.add(name);
            meta.actors.push({ name });
        }
    });

    const categoriesDiv = document.querySelector('.content-links.-niches');
    if (categoriesDiv) {
        categoriesDiv.querySelectorAll('a').forEach(a => addGenre(a.textContent));
    }

    const tagsDiv = document.querySelector('.content-links.-tags');
    if (tagsDiv) {
        tagsDiv.querySelectorAll('a').forEach(a => addGenre(a.textContent));
    }

    const config = (typeof metadataConfigs !== 'undefined' && metadataConfigs) ? metadataConfigs : defaultMetadataConfigs;

    if (tagsDiv && meta.genres.length > 0) {
        if (!tagsDiv.querySelector('.emby-waybig-genres-controls')) {
            const type = 'genres';
            const conf = (config && config[type]) || defaultMetadataConfigs[type];
            if (conf && conf.enabled) {
                const text = renderWithTemplate(meta, conf.template, type);
                if (text && text.trim()) {
                    const controls = createMetadataControls(type, meta, conf);
                    controls.style.marginTop = '6px';
                    controls.style.display = 'block';
                    controls.classList.add('emby-metadata-controls', 'emby-waybig-genres-controls');
                    tagsDiv.appendChild(controls);
                }
            }
        }
    }

    const modelsDiv = document.querySelector('.content-links.-models');
    if (modelsDiv && meta.actors.length > 0) {
        if (!modelsDiv.querySelector('.emby-waybig-actors-controls')) {
            const type = 'actors';
            const conf = (config && config[type]) || defaultMetadataConfigs[type];
            if (conf && conf.enabled) {
                const text = renderWithTemplate(meta, conf.template, type);
                if (text && text.trim()) {
                    const controls = createMetadataControls(type, meta, conf);
                    controls.style.marginTop = '6px';
                    controls.style.display = 'block';
                    controls.classList.add('emby-metadata-controls', 'emby-waybig-actors-controls');
                    modelsDiv.appendChild(controls);
                }
            }
        }
    }

    const descWrap = document.querySelector('.content-desc');
    if (descWrap && meta.description) {
        if (!descWrap.parentNode.querySelector('.emby-waybig-desc-controls')) {
            const type = 'description';
            const conf = (config && config[type]) || defaultMetadataConfigs[type];
            if (conf && conf.enabled) {
                const text = renderWithTemplate(meta, conf.template, type);
                if (text && text.trim()) {
                    const controls = createMetadataControls(type, meta, conf);
                    controls.style.marginTop = '6px';
                    controls.style.display = 'block';
                    controls.classList.add('emby-metadata-controls', 'emby-waybig-desc-controls');
                    descWrap.parentNode.insertBefore(controls, descWrap.nextSibling);
                }
            }
        }
    }
  }

  function initKoVideo() {
    if (!location.host.includes('ko-video.com')) return;

    const normalizeActorName = (raw) => {
      return String(raw || '')
        .replace(/\u3000/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const injectCarouselDownloadBtns = () => {
      const requestHeaders = { Referer: location.href, Origin: location.origin };
      const anchors = document.querySelectorAll('#main_item a.fancybox[href]');
      if (!anchors.length) return false;

      let injectedAny = false;
      anchors.forEach(a => {
        const container = a.closest('li') || a;
        if (!container) return;
        if (container.querySelector('.emby-hunkch-download-btn.emby-kovideo-carousel-download')) return;

        const raw = (a.getAttribute('href') || a.href || '').trim();
        if (!raw || /^javascript:/i.test(raw)) return;

        let url = '';
        try {
          url = new URL(raw, location.href).href;
        } catch (_) {
          url = raw;
        }
        if (!url) return;

        if (getComputedStyle(container).position === 'static') {
          container.style.position = 'relative';
        }

        const btn = createDownloadFabButton({ title: t.hunkChDownloadImage, right: 10, bottom: 10, zIndex: 30, size: 46 });
        btn.classList.add('emby-kovideo-carousel-download');
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const filename = getHunkChPosterFilenameSetting();
          const saveAs = getHunkChSaveAsSetting();
          downloadByUrl(url, filename, saveAs, { headers: requestHeaders });
        });
        container.appendChild(btn);
        injectedAny = true;
      });

      return injectedAny;
    };

    const injectActorThumbDownloadBtns = () => {
      const requestHeaders = { Referer: location.href, Origin: location.origin };
      const imgs = document.querySelectorAll('.model_performance .owl-carousel .owl-item .item img[src]');
      if (!imgs.length) return false;

      const safeFilenameBase = (raw) => {
        const s = (raw || '').replace(/\s+/g, ' ').trim();
        return s.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim() || 'actor';
      };

      const guessExt = (url) => {
        try {
          const u = new URL(url, location.href);
          const name = (u.pathname.split('/').pop() || '').trim();
          const m = name.match(/\.(jpg|jpeg|png|webp)(?:$|\?)/i);
          if (m) return m[1].toLowerCase();
        } catch (_) {}
        return 'jpg';
      };

      let injectedAny = false;
      imgs.forEach(img => {
        const imgRect = img.getBoundingClientRect();
        const candidates = [
          img.closest('a'),
          img.closest('.item'),
          img.closest('.owl-item'),
          img.parentElement
        ].filter(Boolean);
        const pick = candidates.find(el => {
          const r = el.getBoundingClientRect();
          if (r.width < 20 || r.height < 20) return false;
          if (imgRect.width >= 10 && imgRect.height >= 10) {
            if (r.width + 1 < imgRect.width) return false;
            if (r.height + 1 < imgRect.height) return false;
          }
          return true;
        }) || candidates[0];
        const container = pick;
        if (!container) return;
        if (container.querySelector('.emby-hunkch-download-btn.emby-kovideo-actor-download')) return;

        const raw = (img.getAttribute('src') || img.src || '').trim();
        if (!raw || /^data:/i.test(raw) || /^javascript:/i.test(raw)) return;

        let url = '';
        try {
          url = new URL(raw, location.href).href;
        } catch (_) {
          url = raw;
        }
        if (!url) return;

        if (getComputedStyle(container).position === 'static') {
          container.style.position = 'relative';
        }

        const btn = createDownloadFabButton({ title: t.hunkChDownloadImage, right: 8, bottom: 34, zIndex: 30, size: 38 });
        btn.classList.add('emby-kovideo-actor-download');
        btn.style.setProperty('position', 'absolute', 'important');
        btn.style.setProperty('right', '8px', 'important');
        btn.style.setProperty('bottom', '34px', 'important');
        btn.style.setProperty('z-index', '99999', 'important');
        btn.style.setProperty('display', 'flex', 'important');
        btn.style.setProperty('opacity', '1', 'important');
        btn.style.setProperty('visibility', 'visible', 'important');
        btn.style.setProperty('pointer-events', 'auto', 'important');
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const actorName = normalizeActorName((img.getAttribute('alt') || '').trim()
            || (img.closest('a')?.querySelector('span')?.textContent || '').trim())
            || 'actor';
          const filename = `${safeFilenameBase(actorName)}.${guessExt(url)}`;
          const saveAs = getHunkChSaveAsSetting();
          downloadByUrl(url, filename, saveAs, { headers: requestHeaders });
        });
        container.appendChild(btn);
        injectedAny = true;
      });

      return injectedAny;
    };

    injectCarouselDownloadBtns();
    injectActorThumbDownloadBtns();
    {
      let tries = 0;
      const maxTries = 20;
      const interval = setInterval(() => {
        tries++;
        try {
          injectCarouselDownloadBtns();
          injectActorThumbDownloadBtns();
        } catch (_) {}
        if (tries >= maxTries) clearInterval(interval);
      }, 1000);
    }

    const meta = {
      title: '',
      year: '',
      country: 'JP',
      genres: [],
      duration: '',
      director: '',
      studio: '',
      actors: [],
      description: '',
      extra: ''
    };

    function normalizeText(text) {
      return (text || '').replace(/\s+/g, ' ').trim();
    }

    function cleanDdText(dd) {
      const raw = normalizeText(dd ? dd.textContent : '');
      return raw.replace(/^[：:]\s*/, '').trim();
    }

    const titleEl = document.querySelector('.title_bar h2');
    if (titleEl) {
      meta.title = normalizeText(titleEl.textContent);
      if (meta.title.includes('×')) {
        const parts = meta.title.split('×').map(s => normalizeText(s)).filter(Boolean);
        const set = new Set();
        parts.forEach(name => {
          if (!set.has(name)) {
            set.add(name);
            meta.actors.push(name);
          }
        });
      }
    }

    {
      const root = document.querySelector('.model_performance');
      if (root) {
        const anchors = root.querySelectorAll('.owl-carousel .owl-item .item a');
        if (anchors.length) {
          const existed = new Set();
          const merged = [];
          normalizeNameList(meta.actors).forEach(n => {
            if (!existed.has(n)) {
              existed.add(n);
              merged.push(n);
            }
          });
          anchors.forEach(a => {
            const img = a.querySelector('img');
            const raw = normalizeActorName((img?.getAttribute('alt') || '') || (a.querySelector('span')?.textContent || ''));
            if (!raw) return;
            if (existed.has(raw)) return;
            existed.add(raw);
            merged.push(raw);
          });
          meta.actors = merged;
        }
      }
    }

    const dl = document.querySelector('.detail_product dl');
    if (dl) {
      const genreSet = new Set();
      const dts = Array.from(dl.querySelectorAll('dt'));
      dts.forEach(dt => {
        const dd = dt.nextElementSibling;
        if (!dd || dd.tagName !== 'DD') return;
        const key = normalizeText(dt.textContent);

        if (key.includes('商品発売日')) {
          const v = cleanDdText(dd);
          if (v) {
            meta.extra += `Release Date: ${v}\n`;
            const m = v.match(/(\d{4})/);
            if (m) meta.year = m[1];
          }
          return;
        }

        if (key.includes('収録時間')) {
          const v = cleanDdText(dd);
          if (v) meta.duration = v;
          return;
        }

        if (key.includes('メーカー') || key.includes('レーベル')) {
          const makerLink = dd.querySelector('a[href*="maker="]') || dd.querySelector('a');
          const labelLink = dd.querySelector('a[href*="label="]');
          const maker = normalizeText(makerLink ? makerLink.textContent : '');
          const label = normalizeText(labelLink ? labelLink.textContent : '');
          if (maker) {
            meta.studio = maker;
            genreSet.add(maker);
          }
          if (label) {
            meta.extra += `Label: ${label}\n`;
            genreSet.add(label);
          }
          return;
        }

        if (key.includes('シリーズ') || key.includes('ジャンル')) {
          dd.querySelectorAll('a[href*="series="], a[href*="genre="]').forEach(a => {
            const v = normalizeText(a.textContent);
            if (v) genreSet.add(v);
          });
          return;
        }

        if (key.includes('モデル')) {
          dd.querySelectorAll('a[href*="mgenre="]').forEach(a => {
            const v = normalizeText(a.textContent);
            if (v) genreSet.add(v);
          });
        }
      });

      meta.genres = Array.from(genreSet);
    }

    const descP = document.querySelector('p.deitail_txt');
    if (descP) {
      let text = descP.innerHTML.replace(/<br\s*\/?>/gi, '\n');
      text = text.replace(/<[^>]+>/g, '');
      const lines = text.split('\n').map(s => s.trim()).filter(Boolean);
      meta.description = lines.join('\n');
    }

    const config = (typeof metadataConfigs !== 'undefined' && metadataConfigs) ? metadataConfigs : defaultMetadataConfigs;

    const detailProduct = document.querySelector('.detail_product');
    if (detailProduct && meta.genres.length > 0) {
      if (!detailProduct.querySelector('.emby-ko-video-genres-controls')) {
        const type = 'genres';
        const conf = (config && config[type]) || defaultMetadataConfigs[type];
        if (conf && conf.enabled) {
          const text = renderWithTemplate(meta, conf.template, type);
          if (text && text.trim()) {
            const controls = createMetadataControls(type, meta, conf);
            controls.style.marginTop = '8px';
            controls.style.display = 'block';
            controls.classList.add('emby-metadata-controls', 'emby-ko-video-genres-controls');
            detailProduct.appendChild(controls);
          }
        }
      }
    }

    const actorRoot = document.querySelector('.model_performance');
    if (actorRoot && meta.actors.length > 0) {
      if (!actorRoot.querySelector('.emby-ko-video-actors-controls')) {
        const type = 'actors';
        const conf = (config && config[type]) || defaultMetadataConfigs[type];
        if (conf && conf.enabled) {
          const text = renderWithTemplate(meta, conf.template, type);
          if (text && text.trim()) {
            const controls = createMetadataControls(type, meta, conf);
            controls.style.marginTop = '8px';
            controls.style.display = 'block';
            controls.classList.add('emby-metadata-controls', 'emby-ko-video-actors-controls');
            const actorTitle = actorRoot.querySelector('h3');
            if (actorTitle && actorTitle.parentNode) {
              actorTitle.parentNode.insertBefore(controls, actorTitle.nextSibling);
            } else {
              actorRoot.insertBefore(controls, actorRoot.firstChild);
            }
          }
        }
      }
    }

    if (descP && meta.description) {
      const parent = descP.parentNode;
      if (parent && !parent.querySelector('.emby-ko-video-desc-controls')) {
        const type = 'description';
        const conf = (config && config[type]) || defaultMetadataConfigs[type];
        if (conf && conf.enabled) {
          const text = renderWithTemplate(meta, conf.template, type);
          if (text && text.trim()) {
            const controls = createMetadataControls(type, meta, conf);
            controls.style.marginTop = '8px';
            controls.style.display = 'block';
            controls.classList.add('emby-metadata-controls', 'emby-ko-video-desc-controls');
            parent.insertBefore(controls, descP.nextSibling);
          }
        }
      }
    }
  }

  function initFalconStudios() {
    if (!location.host.includes('falconstudios.com')) return;

    const requestHeaders = { Referer: location.href, Origin: location.origin };
    const normalizeText = (s) => String(s || '').replace(/\s+/g, ' ').trim();

    const run = () => {
      const titleEl = document.querySelector('h1.DvdInfo-Title');
      if (!titleEl) return;

      const meta = {
        title: '',
        year: '',
        country: 'USA',
        genres: [],
        duration: '',
        director: '',
        studio: 'Falcon Studios',
        actors: [],
        description: '',
        extra: ''
      };

      meta.title = normalizeText(titleEl.textContent);

      const publishedEl = document.querySelector('.DvdInfo-PublishedDate-Text');
      const published = publishedEl ? normalizeText(publishedEl.textContent) : '';
      if (published) {
        meta.extra += `Date: ${published}\n`;
        const m = published.match(/(\d{4})/);
        if (m) meta.year = m[1];
      }

      const lenRoot = document.querySelector('.DvdInfo-TotalLength');
      if (lenRoot) {
        const parts = Array.from(lenRoot.querySelectorAll('.Text')).map(el => normalizeText(el.textContent)).filter(Boolean);
        if (parts.length) meta.duration = parts[parts.length - 1];
      }

      const actorSet = new Set();
      document.querySelectorAll('.DvdInfo-ActorsList button').forEach(btn => {
        const n = normalizeText(btn.textContent);
        if (n && !actorSet.has(n)) {
          actorSet.add(n);
          meta.actors.push(n);
        }
      });

      const genreSet = new Set();
      document.querySelectorAll('.DvdInfo-CategoriesList button').forEach(btn => {
        const g = normalizeText(btn.textContent);
        if (g) genreSet.add(g);
      });
      meta.genres = Array.from(genreSet);

      const descEl = document.querySelector('.DvdInfo-DecriptionWrapper-Paragraph');
      if (descEl) meta.description = normalizeText(descEl.textContent);

      const config = (typeof metadataConfigs !== 'undefined' && metadataConfigs) ? metadataConfigs : defaultMetadataConfigs;

      const coverWrapper = document.querySelector('.DvdInfo-CoverWrapper');
      if (coverWrapper) {
        const img = coverWrapper.querySelector('img');
        if (img && !coverWrapper.querySelector('.emby-hunkch-download-btn.emby-falcon-cover-download')) {
          if (getComputedStyle(coverWrapper).position === 'static') {
            coverWrapper.style.position = 'relative';
          }
          const btn = createDownloadFabButton({ title: t.hunkChDownloadImage, right: 12, bottom: 12, zIndex: 30, size: 50 });
          btn.classList.add('emby-falcon-cover-download');
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const url = normalizeText(img.currentSrc || img.src);
            const filename = getHunkChPosterFilenameSetting();
            const saveAs = getHunkChSaveAsSetting();
            downloadByUrl(url, filename, saveAs, { headers: requestHeaders });
          });
          coverWrapper.appendChild(btn);
        }
      }

      const actorsList = document.querySelector('.DvdInfo-ActorsList');
      if (actorsList && meta.actors.length > 0) {
        const root = actorsList.parentElement || actorsList;
        if (!root.querySelector('.emby-metadata-controls.emby-falcon-actors-controls')) {
          const type = 'actors';
          const conf = (config && config[type]) || defaultMetadataConfigs[type];
          if (conf && conf.enabled) {
            const text = renderWithTemplate(meta, conf.template, type);
            if (text && text.trim()) {
              const controls = createMetadataControls(type, meta, conf);
              controls.style.marginTop = '10px';
              controls.style.display = 'block';
              controls.classList.add('emby-metadata-controls', 'emby-falcon-actors-controls');
              actorsList.parentNode.insertBefore(controls, actorsList.nextSibling);
            }
          }
        }
      }

      const categoriesList = document.querySelector('.DvdInfo-CategoriesList');
      if (categoriesList && meta.genres.length > 0) {
        const root = categoriesList.parentElement || categoriesList;
        if (!root.querySelector('.emby-metadata-controls.emby-falcon-genres-controls')) {
          const type = 'genres';
          const conf = (config && config[type]) || defaultMetadataConfigs[type];
          if (conf && conf.enabled) {
            const text = renderWithTemplate(meta, conf.template, type);
            if (text && text.trim()) {
              const controls = createMetadataControls(type, meta, conf);
              controls.style.marginTop = '10px';
              controls.style.display = 'block';
              controls.classList.add('emby-metadata-controls', 'emby-falcon-genres-controls');
              categoriesList.parentNode.insertBefore(controls, categoriesList.nextSibling);
            }
          }
        }
      }

      if (descEl && meta.description) {
        const root = descEl.parentElement || descEl;
        if (!root.querySelector('.emby-metadata-controls.emby-falcon-desc-controls')) {
          const type = 'description';
          const conf = (config && config[type]) || defaultMetadataConfigs[type];
          if (conf && conf.enabled) {
            const text = renderWithTemplate(meta, conf.template, type);
            if (text && text.trim()) {
              const controls = createMetadataControls(type, meta, conf);
              controls.style.marginTop = '10px';
              controls.style.display = 'block';
              controls.classList.add('emby-metadata-controls', 'emby-falcon-desc-controls');
              descEl.parentNode.insertBefore(controls, descEl.nextSibling);
            }
          }
        }
      }
    };

    run();
    setInterval(run, 1000);
  }

  function initCatholicBoys() {
    if (!location.host.includes('catholicboys.com')) return;

    const requestHeaders = { Referer: location.href, Origin: location.origin };
    const normalizeText = (s) => String(s || '').replace(/\s+/g, ' ').trim();

    const safeFilenameBase = (raw) => {
      const s = (raw || '').replace(/\s+/g, ' ').trim();
      return s.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim() || 'image';
    };

    const guessExt = (url) => {
      try {
        const u = new URL(url, location.origin);
        const name = (u.pathname.split('/').pop() || '').trim();
        const m = name.match(/\.(jpg|jpeg|png|webp)(?:$|\?)/i);
        if (m) return m[1].toLowerCase();
      } catch (_) {}
      return 'jpg';
    };

    const parseFirstSrcsetUrl = (srcset) => {
      const s = String(srcset || '').trim();
      if (!s) return '';
      const first = s.split(',')[0] || '';
      return normalizeText(first.split(/\s+/)[0] || '');
    };

    const ensureLightboxStyle = () => {
      if (!document.head) return;
      if (document.getElementById('emby-catholicboys-style')) return;
      const style = document.createElement('style');
      style.id = 'emby-catholicboys-style';
      style.textContent = `
        #myGallery img { cursor: zoom-in !important; }
        .emby-catholicboys-lightbox { position: fixed !important; inset: 0 !important; display: none !important; align-items: center !important; justify-content: center !important; background: rgba(0,0,0,.92) !important; z-index: 2147483647 !important; cursor: zoom-out !important; padding: 0 !important; margin: 0 !important; }
        .emby-catholicboys-lightbox[aria-hidden="false"] { display: flex !important; }
        .emby-catholicboys-lightbox img { max-width: 96vw !important; max-height: 96vh !important; width: auto !important; height: auto !important; object-fit: contain !important; display: block !important; }
        body.emby-catholicboys-lightbox-open { overflow: hidden !important; }
      `;
      document.head.appendChild(style);
    };

    const setupImageLightbox = () => {
      if (!document.body || document.body.dataset.embyCatholicBoysLightboxReady === '1') return;
      document.body.dataset.embyCatholicBoysLightboxReady = '1';

      const overlay = document.createElement('div');
      overlay.className = 'emby-catholicboys-lightbox';
      overlay.setAttribute('aria-hidden', 'true');
      const viewerImg = document.createElement('img');
      viewerImg.alt = '';
      overlay.appendChild(viewerImg);
      document.body.appendChild(overlay);

      const close = () => {
        overlay.setAttribute('aria-hidden', 'true');
        viewerImg.removeAttribute('src');
        document.body.classList.remove('emby-catholicboys-lightbox-open');
      };

      const open = (url) => {
        if (!url) return;
        viewerImg.src = url;
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('emby-catholicboys-lightbox-open');
      };

      overlay.addEventListener('click', () => close(), true);
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
      }, true);

      document.addEventListener('click', (e) => {
        const target = e.target;
        if (!(target instanceof Element)) return;
        if (overlay.getAttribute('aria-hidden') === 'false' && overlay.contains(target)) return;

        const img = target.closest('#myGallery a.jg-entry img');
        if (!img) return;
        const url = normalizeText(img.currentSrc || img.src);
        if (!url) return;

        e.preventDefault();
        e.stopPropagation();

        if (overlay.getAttribute('aria-hidden') === 'false') {
          close();
          return;
        }
        open(url);
      }, true);
    };

    const run = () => {
      const title1 = normalizeText(document.querySelector('.dvdTitleScene')?.textContent || '');
      const title2 = normalizeText(document.querySelector('.sceneTitle')?.textContent || '');
      const pageTitle = normalizeText(document.querySelector('h1')?.textContent || '');

      const meta = {
        title: '',
        year: '',
        country: 'USA',
        genres: [],
        duration: '',
        director: '',
        studio: 'CatholicBoys',
        actors: [],
        description: '',
        extra: ''
      };

      meta.title = normalizeText([title1, title2].filter(Boolean).join(' - ')) || pageTitle;

      const genreSet = new Set();
      document.querySelectorAll('#catMovie a.singleCategory').forEach(a => {
        const g = normalizeText(a.textContent);
        if (g) genreSet.add(g);
      });
      meta.genres = Array.from(genreSet);

      const actorSet = new Set();
      document.querySelectorAll('.modelProfile img[alt]').forEach(img => {
        const n = normalizeText(img.getAttribute('alt'));
        if (n && !actorSet.has(n)) {
          actorSet.add(n);
          meta.actors.push(n);
        }
      });

      const descRoot = document.querySelector('.textDescription');
      const fullTxt = descRoot ? descRoot.querySelector('.full-txt') : null;
      if (fullTxt) {
        const desc = normalizeText(fullTxt.textContent);
        if (desc) meta.description = desc;
      }

      const config = (typeof metadataConfigs !== 'undefined' && metadataConfigs) ? metadataConfigs : defaultMetadataConfigs;

      const catMovie = document.querySelector('#catMovie');
      if (catMovie && meta.genres.length > 0) {
        if (!catMovie.parentElement?.querySelector('.emby-metadata-controls.emby-catholicboys-genres-controls')) {
          const type = 'genres';
          const conf = (config && config[type]) || defaultMetadataConfigs[type];
          if (conf && conf.enabled) {
            const text = renderWithTemplate(meta, conf.template, type);
            if (text && text.trim()) {
              const controls = createMetadataControls(type, meta, conf);
              controls.style.marginTop = '10px';
              controls.style.display = 'block';
              controls.classList.add('emby-metadata-controls', 'emby-catholicboys-genres-controls');
              catMovie.parentNode.insertBefore(controls, catMovie.nextSibling);
            }
          }
        }
      }

      const modelSection = document.querySelector('.row.videosTour.margin-bootstrap-16');
      if (modelSection && meta.actors.length > 0) {
        if (!modelSection.querySelector('.emby-metadata-controls.emby-catholicboys-actors-controls')) {
          const type = 'actors';
          const conf = (config && config[type]) || defaultMetadataConfigs[type];
          if (conf && conf.enabled) {
            const text = renderWithTemplate(meta, conf.template, type);
            if (text && text.trim()) {
              const controls = createMetadataControls(type, meta, conf);
              controls.style.marginTop = '10px';
              controls.style.display = 'block';
              controls.classList.add('emby-metadata-controls', 'emby-catholicboys-actors-controls');
              modelSection.appendChild(controls);
            }
          }
        }
      }

      if (descRoot && meta.description) {
        if (!descRoot.querySelector('.emby-metadata-controls.emby-catholicboys-desc-controls')) {
          const type = 'description';
          const conf = (config && config[type]) || defaultMetadataConfigs[type];
          if (conf && conf.enabled) {
            const text = renderWithTemplate(meta, conf.template, type);
            if (text && text.trim()) {
              const controls = createMetadataControls(type, meta, conf);
              controls.style.marginTop = '10px';
              controls.style.display = 'block';
              controls.classList.add('emby-metadata-controls', 'emby-catholicboys-desc-controls');
              descRoot.appendChild(controls);
            }
          }
        }
      }

      const firstHalf = document.querySelector('.textDescription .first-half');
      const full = document.querySelector('.textDescription .full-txt');
      const firstWords = document.getElementById('firstWords');
      const readmore = document.getElementById('readmore');
      if (firstHalf) firstHalf.style.display = 'none';
      if (full) full.style.display = 'block';
      if (firstWords) firstWords.style.display = 'none';
      if (readmore) readmore.style.display = 'none';

      const video = document.querySelector('video[poster]');
      const posterUrl = video ? normalizeText(video.getAttribute('poster') || video.poster) : '';
      if (video && posterUrl) {
        const wrap = video.closest('.movie_wrapper') || video.parentElement;
        if (wrap && !wrap.querySelector('.emby-hunkch-download-btn.emby-catholicboys-poster-download')) {
          if (getComputedStyle(wrap).position === 'static') {
            wrap.style.position = 'relative';
          }
          const btn = createDownloadFabButton({ title: t.hunkChDownloadImage, right: 12, bottom: 12, zIndex: 30, size: 50 });
          btn.classList.add('emby-catholicboys-poster-download');
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const filename = getHunkChPosterFilenameSetting();
            const saveAs = getHunkChSaveAsSetting();
            downloadByUrl(posterUrl, filename, saveAs, { headers: requestHeaders });
          });
          wrap.appendChild(btn);
        }
      }

      document.querySelectorAll('#myGallery a.jg-entry').forEach(a => {
        const img = a.querySelector('img');
        if (!img) return;
        if (a.querySelector('.emby-hunkch-download-btn.emby-catholicboys-gallery-download')) return;
        if (getComputedStyle(a).position === 'static') {
          a.style.position = 'relative';
        }
        const btn = createDownloadFabButton({ title: t.hunkChDownloadImage, right: 6, bottom: 6, zIndex: 10, size: 36 });
        btn.classList.add('emby-catholicboys-gallery-download');
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const url = normalizeText(img.currentSrc || img.src);
          const saveAs = getHunkChSaveAsSetting();
          downloadByUrl(url, 'fanart.jpg', saveAs, { headers: requestHeaders });
        });
        a.appendChild(btn);
      });

      document.querySelectorAll('.modelProfile picture').forEach(picture => {
        const img = picture.querySelector('img');
        if (!img) return;
        const name = normalizeText(img.getAttribute('alt'));
        if (!name) return;
        const container = picture.parentElement;
        if (!container) return;
        if (container.querySelector('.emby-hunkch-download-btn.emby-catholicboys-model-download')) return;

        const url = normalizeText(
          picture.getAttribute('data-iesrc')
          || picture.dataset.iesrc
          || parseFirstSrcsetUrl(picture.querySelector('source')?.getAttribute('srcset') || '')
          || img.currentSrc
          || img.getAttribute('src')
          || img.src
        );
        if (!url || url === 'undefined') return;

        if (getComputedStyle(container).position === 'static') {
          container.style.position = 'relative';
        }
        const btn = createDownloadFabButton({ title: t.hunkChDownloadImage, right: 6, bottom: 6, zIndex: 10, size: 36 });
        btn.classList.add('emby-catholicboys-model-download');
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const ext = guessExt(url);
          const filename = `${safeFilenameBase(name)}.${ext}`;
          const saveAs = getHunkChSaveAsSetting();
          downloadByUrl(url, filename, saveAs, { headers: requestHeaders });
        });
        container.appendChild(btn);
      });
    };

    ensureLightboxStyle();
    setupImageLightbox();
    run();
    setInterval(run, 1000);
  }

  function initCarnalPlus() {
    if (!location.host.includes('carnalplus.com')) return;

    const requestHeaders = { Referer: location.href, Origin: location.origin };
    const normalizeText = (s) => String(s || '').replace(/\s+/g, ' ').trim();

    const toAbsUrlLocal = (raw, baseHref = location.href) => {
      const s = String(raw || '').trim();
      if (!s) return '';
      try {
        return new URL(s, baseHref).href;
      } catch (_) {
        return '';
      }
    };

    const safeFilenameBase = (raw) => {
      const s = (raw || '').replace(/\s+/g, ' ').trim();
      return s.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim() || 'image';
    };

    const guessExt = (url) => {
      try {
        const u = new URL(url, location.origin);
        const name = (u.pathname.split('/').pop() || '').trim();
        const m = name.match(/\.(jpg|jpeg|png|webp)(?:$|\?)/i);
        if (m) return m[1].toLowerCase();
      } catch (_) {}
      return 'jpg';
    };

    const parseFirstSrcsetUrl = (srcset) => {
      const s = String(srcset || '').trim();
      if (!s) return '';
      const first = s.split(',')[0] || '';
      return normalizeText(first.split(/\s+/)[0] || '');
    };

    const ensureLightboxStyle = () => {
      if (!document.head) return;
      if (document.getElementById('emby-carnalplus-style')) return;
      const style = document.createElement('style');
      style.id = 'emby-carnalplus-style';
      style.textContent = `
        #myGallery img { cursor: zoom-in !important; }
        .emby-carnalplus-lightbox { position: fixed !important; inset: 0 !important; display: none !important; align-items: center !important; justify-content: center !important; background: rgba(0,0,0,.92) !important; z-index: 2147483647 !important; cursor: zoom-out !important; padding: 0 !important; margin: 0 !important; }
        .emby-carnalplus-lightbox[aria-hidden="false"] { display: flex !important; }
        .emby-carnalplus-lightbox img { max-width: 96vw !important; max-height: 96vh !important; width: auto !important; height: auto !important; object-fit: contain !important; display: block !important; }
        body.emby-carnalplus-lightbox-open { overflow: hidden !important; }
      `;
      document.head.appendChild(style);
    };

    const setupImageLightbox = () => {
      if (!document.body || document.body.dataset.embyCarnalPlusLightboxReady === '1') return;
      document.body.dataset.embyCarnalPlusLightboxReady = '1';

      const overlay = document.createElement('div');
      overlay.className = 'emby-carnalplus-lightbox';
      overlay.setAttribute('aria-hidden', 'true');
      const viewerImg = document.createElement('img');
      viewerImg.alt = '';
      overlay.appendChild(viewerImg);
      document.body.appendChild(overlay);

      const close = () => {
        overlay.setAttribute('aria-hidden', 'true');
        viewerImg.removeAttribute('src');
        document.body.classList.remove('emby-carnalplus-lightbox-open');
      };

      const open = (url) => {
        if (!url) return;
        viewerImg.src = url;
        overlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('emby-carnalplus-lightbox-open');
      };

      overlay.addEventListener('click', () => close(), true);
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
      }, true);

      document.addEventListener('click', (e) => {
        const target = e.target;
        if (!(target instanceof Element)) return;
        if (target.closest('.emby-hunkch-download-btn')) return;
        if (overlay.getAttribute('aria-hidden') === 'false' && overlay.contains(target)) return;

        const img = target.closest('#myGallery .jg-entry img');
        if (!img) return;
        const url = toAbsUrlLocal(normalizeText(img.currentSrc || img.src), location.href);
        if (!url) return;

        e.preventDefault();
        e.stopPropagation();

        if (overlay.getAttribute('aria-hidden') === 'false') {
          close();
          return;
        }
        open(url);
      }, true);
    };

    const run = () => {
      const player = document.querySelector('#video-bb');
      if (player && !player.querySelector('.emby-hunkch-download-btn.emby-carnalplus-cover-download')) {
        const video = player.querySelector('video');
        const rawPoster = normalizeText(
          (video && (video.getAttribute('poster') || video.poster))
          || player.getAttribute('poster')
          || ''
        );
        const posterUrl = toAbsUrlLocal(rawPoster, location.href);
        if (posterUrl) {
          if (getComputedStyle(player).position === 'static') player.style.position = 'relative';
          const btn = createDownloadFabButton({ title: t.hunkChDownloadImage, right: 12, bottom: 86, zIndex: 60, size: 50 });
          btn.classList.add('emby-carnalplus-cover-download');
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const filename = getHunkChPosterFilenameSetting();
            const saveAs = getHunkChSaveAsSetting();
            downloadByUrl(posterUrl, filename, saveAs, { headers: requestHeaders });
          });
          player.appendChild(btn);
        }
      }

      document.querySelectorAll('.grid-latest .swiper-slide').forEach((slide, idx) => {
        if (!(slide instanceof HTMLElement)) return;
        if (slide.querySelector('.emby-hunkch-download-btn.emby-carnalplus-chapter-cover-download')) return;
        const a = slide.querySelector('a.control_thumb');
        if (!a) return;
        const picture = a.querySelector('picture');
        const img = a.querySelector('img');

        const rawUrl = normalizeText(
          (picture && (picture.getAttribute('data-iesrc') || picture.dataset.iesrc))
          || (picture && parseFirstSrcsetUrl(picture.querySelector('source')?.getAttribute('srcset') || ''))
          || (img && (img.getAttribute('data-src') || img.dataset.src || img.currentSrc || img.src))
          || ''
        );
        const url = toAbsUrlLocal(rawUrl, location.href);
        if (!url) return;

        const title = normalizeText(
          a.getAttribute('title')
          || slide.querySelector('.updateInfos .update-title')?.textContent
          || ''
        );

        if (getComputedStyle(a).position === 'static') a.style.position = 'relative';
        const btn = createDownloadFabButton({ title: t.hunkChDownloadImage, right: 12, bottom: 12, zIndex: 60, size: 42 });
        btn.classList.add('emby-carnalplus-chapter-cover-download');
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const ext = guessExt(url);
          const filename = `${safeFilenameBase(title || `poster-${idx + 1}`)}.${ext}`;
          const saveAs = getHunkChSaveAsSetting();
          downloadByUrl(url, filename, saveAs, { headers: requestHeaders });
        });
        a.appendChild(btn);
      });

      const titleEl = document.querySelector('h1.video-detail-h2');
      const tagWrap = document.querySelector('.update_tags');
      if (titleEl && tagWrap) {
        const meta = {
          title: normalizeText(titleEl.textContent),
          year: '',
          country: 'USA',
          genres: [],
          duration: '',
          director: '',
          studio: '',
          actors: [],
          description: '',
          extra: ''
        };

        tagWrap.querySelectorAll('a.chip-tag, a.chip-tag span.txt-tags').forEach(el => {
          const a = el.closest('a');
          const t0 = normalizeText(a ? a.textContent : el.textContent);
          if (t0) meta.genres.push(t0);
        });
        meta.genres = Array.from(new Set(normalizeNameList(meta.genres)));

        if (meta.genres.length > 0 && !tagWrap.querySelector('.emby-metadata-controls.emby-carnalplus-genres-controls')) {
          const config = (typeof metadataConfigs !== 'undefined' && metadataConfigs) ? metadataConfigs : defaultMetadataConfigs;
          const type = 'genres';
          const conf = (config && config[type]) || defaultMetadataConfigs[type];
          if (conf && conf.enabled) {
            const text = renderWithTemplate(meta, conf.template, type);
            if (text && text.trim()) {
              const controls = createMetadataControls(type, meta, conf);
              controls.style.marginTop = '10px';
              controls.style.display = 'block';
              controls.classList.add('emby-metadata-controls', 'emby-carnalplus-genres-controls');
              tagWrap.appendChild(controls);
            }
          }
        }
      }

      const readmore = document.getElementById('readmore');
      const firstWords = document.getElementById('firstWords');
      const hidden = document.querySelector('.textDescription .hiddenDescription') || document.querySelector('.hiddenDescription');
      const showless = document.getElementById('showless');

      const isVisible = (el) => {
        if (!el) return false;
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
        return el.getClientRects().length > 0;
      };

      if (hidden) {
        const hiddenDisplay = getComputedStyle(hidden).display;
        if ((hiddenDisplay === 'none' || hiddenDisplay === '') && isVisible(readmore)) {
          try { readmore.click(); } catch (_) {}
        }
        hidden.style.display = 'block';
      }
      if (readmore) readmore.style.display = 'none';
      if (firstWords) firstWords.style.display = 'none';
      if (showless) showless.style.display = 'inline';

      document.querySelectorAll('.characters-model-list .grid-item-character .control_thumb_model').forEach(wrap => {
        if (!(wrap instanceof HTMLElement)) return;
        if (wrap.querySelector('.emby-hunkch-download-btn.emby-carnalplus-actor-download')) return;
        const card = wrap.closest('.grid-item-character');
        const picture = wrap.querySelector('picture');
        const img = wrap.querySelector('img');

        const actorName = normalizeText(
          (img && (img.getAttribute('title') || img.title || img.getAttribute('alt') || img.alt))
          || (card && card.querySelector('.characters-infos h6') && card.querySelector('.characters-infos h6').textContent)
          || ''
        );
        if (!actorName) return;

        const rawUrl = normalizeText(
          (picture && (picture.getAttribute('data-iesrc') || picture.dataset.iesrc))
          || (picture && parseFirstSrcsetUrl(picture.querySelector('source')?.getAttribute('srcset') || ''))
          || (img && (img.getAttribute('data-src') || img.dataset.src || img.currentSrc || img.src))
          || ''
        );
        const url = toAbsUrlLocal(rawUrl, location.href);
        if (!url) return;

        if (getComputedStyle(wrap).position === 'static') wrap.style.position = 'relative';
        const btn = createDownloadFabButton({ title: t.hunkChDownloadImage, right: 10, bottom: 10, zIndex: 30, size: 42 });
        btn.classList.add('emby-carnalplus-actor-download');
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const ext = guessExt(url);
          const filename = `${safeFilenameBase(actorName)}.${ext}`;
          const saveAs = getHunkChSaveAsSetting();
          downloadByUrl(url, filename, saveAs, { headers: requestHeaders });
        });
        wrap.appendChild(btn);
      });
    };

    ensureLightboxStyle();
    setupImageLightbox();
    run();
    setInterval(run, 1000);
  }

  function initHelixStudios() {
    if (!location.host.includes('helixstudios.com')) return;

    const requestHeaders = { Referer: location.href, Origin: location.origin };

    const safeFilenameBase = (raw) => {
      const s = (raw || '').replace(/\s+/g, ' ').trim();
      return s.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim() || 'image';
    };

    const guessExt = (url) => {
      try {
        const u = new URL(url, location.origin);
        const name = (u.pathname.split('/').pop() || '').trim();
        const m = name.match(/\.(jpg|jpeg|png|webp)(?:$|\?)/i);
        if (m) return m[1].toLowerCase();
      } catch (_) {}
      return 'jpg';
    };

    const attachPerformerDownloadBtns = () => {
      const performers = document.querySelectorAll('.video-performer');
      performers.forEach(card => {
        const a = card.querySelector('a');
        if (!a) return;
        if (a.querySelector('.emby-hunkch-download-btn.emby-helix-performer-download')) return;

        const name = (card.querySelector('.performer-name')?.textContent || a.getAttribute('title') || '').trim();
        if (!name) return;

        const img = a.querySelector('img');
        const fromData = img ? (img.getAttribute('data-bgsrc') || img.dataset.bgsrc || '') : '';
        const styleVal = img ? (img.style.backgroundImage || '') : '';
        const fromStyle = (() => {
          const m = styleVal.match(/url\((['"]?)(.*?)\1\)/i);
          return m ? m[2] : '';
        })();
        const url = (fromData || fromStyle || '').trim();
        if (!url) return;

        if (getComputedStyle(a).position === 'static') {
          a.style.position = 'relative';
        }

        const btn = createDownloadFabButton({ title: t.hunkChDownloadImage, right: 6, bottom: 6, zIndex: 10, size: 36 });
        btn.classList.add('emby-helix-performer-download');
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const ext = guessExt(url);
          const filename = `${safeFilenameBase(name)}.${ext}`;
          const saveAs = getHunkChSaveAsSetting();
          downloadByUrl(url, filename, saveAs, { headers: requestHeaders });
        });
        a.appendChild(btn);
      });
    };

    attachPerformerDownloadBtns();

    const meta = {
      title: '',
      year: '',
      country: 'USA',
      genres: [],
      duration: '',
      director: '',
      studio: 'Helix Studios',
      actors: [],
      description: '',
      extra: ''
    };

    // 1. Title
    const titleEl = document.querySelector('h1.description');
    if (titleEl) {
        meta.title = titleEl.textContent.trim();
    }

    // 2. Metadata (Released, Studio, Director, Length)
    const col5 = document.querySelector('.col-sm-5');
    if (col5) {
        // Released
        const releasedEl = Array.from(col5.querySelectorAll('.release-date')).find(el => el.textContent.includes('Released:'));
        if (releasedEl) {
            const text = releasedEl.textContent.replace('Released:', '').trim();
            meta.extra += `Release Date: ${text}\n`;
            const date = new Date(text);
            if (!isNaN(date.getTime())) {
                meta.year = date.getFullYear().toString();
            }
        }

        // Studio
        const studioEl = col5.querySelector('.studio');
        if (studioEl) {
             const text = studioEl.textContent.replace('Studio:', '').trim();
             meta.studio = text;
        }

        // Director
        const directorEl = col5.querySelector('.director');
        if (directorEl) {
             const text = directorEl.textContent.replace('Director:', '').trim();
             meta.director = text;
        }

        // Length
        const lengthEl = Array.from(col5.querySelectorAll('.release-date')).find(el => el.textContent.includes('Length:'));
        if (lengthEl) {
             const text = lengthEl.textContent.replace('Length:', '').trim();
             meta.duration = text;
        }
    }

    // 3. Tags
    const tagsDiv = document.querySelector('.tags') || document.querySelector('.categories');
    if (tagsDiv) {
        tagsDiv.querySelectorAll('a').forEach(a => {
            const tag = a.textContent.trim();
            if (tag) meta.genres.push(tag);
        });
    }

    // 4. Performers
    // Try data-label="Performer" first (covers both image and text links)
    const performerLinks = document.querySelectorAll('a[data-label="Performer"]');
    if (performerLinks.length > 0) {
        performerLinks.forEach(a => {
            // If it has a .performer-name child, use that (image card)
            const nameDiv = a.querySelector('.performer-name');
            let name = '';
            if (nameDiv) {
                name = nameDiv.textContent.trim();
            } else {
                // Otherwise use own text (text link)
                name = a.textContent.trim();
            }
            
            if (name && !meta.actors.some(actor => actor.name === name)) {
                meta.actors.push({ name: name });
            }
        });
    } else {
        // Fallback to old selector
        const performerNames = document.querySelectorAll('.video-performer .performer-name');
        performerNames.forEach(div => {
            const name = div.textContent.trim();
            if (name && !meta.actors.some(actor => actor.name === name)) {
                meta.actors.push({ name: name });
            }
        });
    }

    // 5. Description
    const descP = document.querySelector('.synopsis p');
    if (descP) {
        meta.description = descP.textContent.trim();
    }

    const config = (typeof metadataConfigs !== 'undefined' && metadataConfigs) ? metadataConfigs : defaultMetadataConfigs;

    // Inject Controls

    // Description Controls
    if (descP && meta.description) {
        const type = 'description';
        const conf = (config && config[type]) || defaultMetadataConfigs[type];
        if (conf && conf.enabled) {
            const text = renderWithTemplate(meta, conf.template, type);
            if (text && text.trim()) {
                const controls = createMetadataControls(type, meta, conf);
                controls.style.marginTop = '10px';
                controls.style.display = 'block';
                controls.classList.add('emby-metadata-controls', 'emby-helix-desc-controls');
                const synopsis = descP.closest('.synopsis');
                if (synopsis) {
                  if (!synopsis.querySelector('.emby-metadata-controls.emby-helix-desc-controls')) {
                    synopsis.appendChild(controls);
                  }
                } else if (descP.parentNode && !descP.parentNode.querySelector('.emby-metadata-controls.emby-helix-desc-controls')) {
                  descP.parentNode.insertBefore(controls, descP.nextSibling);
                }
            }
        }
    }

    // Tags
    if (tagsDiv && meta.genres.length > 0) {
        const type = 'genres';
        const conf = (config && config[type]) || defaultMetadataConfigs[type];
        if (conf && conf.enabled) {
             const text = renderWithTemplate(meta, conf.template, type);
             if (text && text.trim()) {
                 const controls = createMetadataControls(type, meta, conf);
                 controls.style.marginTop = '5px';
                 controls.style.display = 'block';
                 controls.classList.add('emby-metadata-controls');
                 tagsDiv.appendChild(controls);
             }
        }
    }

    // Actors
    const performerContainer = document.querySelector('.video-performer-container');
    if (performerContainer && meta.actors.length > 0) {
        const type = 'actors';
        const conf = (config && config[type]) || defaultMetadataConfigs[type];
        if (conf && conf.enabled) {
             const text = renderWithTemplate(meta, conf.template, type);
             if (text && text.trim()) {
                 const controls = createMetadataControls(type, meta, conf);
                 controls.style.marginTop = '10px';
                 controls.style.display = 'block';
                 controls.classList.add('emby-metadata-controls');
                 if (performerContainer.parentNode) {
                     performerContainer.parentNode.insertBefore(controls, performerContainer);
                 }
             }
        }
    }
  }

  function initEnglishLads() {
    if (!location.host.includes('englishlads.com')) return;

    const meta = {
      title: '',
      year: '',
      country: 'UK',
      genres: [],
      duration: '',
      director: '',
      studio: 'English Lads',
      actors: [],
      description: '',
      extra: ''
    };

    // 1. Title, Date, Actor from H2
    // Format: "22nd Jul 2012 - Title - "
    const h2 = document.querySelector('.shoot-header-row-title h2');
    let titleText = '';
    if (h2) {
        // Extract raw text excluding children (anchor tag usually follows title)
        titleText = h2.childNodes[0].textContent.trim();
        const parts = titleText.split('-').map(s => s.trim()).filter(s => s);
        
        if (parts.length > 0) {
            // Part 0: Date "22nd Jul 2012"
            const dateStr = parts[0];
            // Remove st/nd/rd/th suffix from day
            const cleanDateStr = dateStr.replace(/(\d+)(st|nd|rd|th)/, '$1');
            const date = new Date(cleanDateStr);
            if (!isNaN(date.getTime())) {
                meta.year = date.getFullYear().toString();
                const mm = String(date.getMonth() + 1).padStart(2, '0');
                const dd = String(date.getDate()).padStart(2, '0');
                meta.extra += `Date: ${date.getFullYear()}-${mm}-${dd}\n`;
            }
        }
        
        if (parts.length > 1) {
            // Part 1: Title
            meta.title = parts[1];
        } else {
             meta.title = titleText;
        }

        // Actor Link inside H2
        const actorLink = h2.querySelector('a');
        if (actorLink) {
            meta.actors.push(actorLink.textContent.trim());
        }
    }

    // 2. Duration
    const durEl = document.querySelector('.shoot-type');
    if (durEl) {
        meta.duration = durEl.textContent.trim();
    }

    // 3. Description
    // Find div after .large-update
    const largeUpdate = document.querySelector('.large-update');
    let descEl = null;
    if (largeUpdate) {
        // The description div is usually the next element sibling
        descEl = largeUpdate.nextElementSibling;
        // Verify it's a div and contains text
        if (descEl && descEl.tagName === 'DIV' && descEl.textContent.trim().length > 0) {
             meta.description = descEl.textContent.trim();
        }
    }

    // 4. Genres (Tags)
    // Find all 'a' tags with href containing 'tag='
    const tagLinks = document.querySelectorAll('a[href*="tag="]');
    tagLinks.forEach(a => {
        const tag = a.textContent.trim();
        if (tag) meta.genres.push(tag);
    });

    const config = (metadataConfigs && typeof metadataConfigs === 'object') ? metadataConfigs : defaultMetadataConfigs;

    // Inject Controls
    
    // A. Description Controls
    if (descEl && meta.description) {
        const type = 'description';
        const conf = (config && config[type]) || defaultMetadataConfigs[type];
        if (conf && conf.enabled) {
             const text = renderWithTemplate(meta, conf.template, type);
             if (text && text.trim()) {
                 const controls = createMetadataControls(type, meta, conf);
                 controls.style.marginTop = '10px';
                 controls.style.display = 'block';
                 controls.classList.add('emby-metadata-controls');
                 if (descEl.parentNode) {
                     descEl.parentNode.insertBefore(controls, descEl.nextSibling);
                 }
             }
        }
    }

    // B. Tags Controls
    // Find where to inject: after the last tag link
    if (tagLinks.length > 0) {
        const lastTagLink = tagLinks[tagLinks.length - 1];
        // Check if followed by BR
        let injectPoint = lastTagLink;
        if (lastTagLink.nextSibling && lastTagLink.nextSibling.tagName === 'BR') {
            injectPoint = lastTagLink.nextSibling;
        }

        const type = 'genres';
        const conf = (config && config[type]) || defaultMetadataConfigs[type];
        if (conf && conf.enabled) {
             const text = renderWithTemplate(meta, conf.template, type);
             if (text && text.trim()) {
                 const controls = createMetadataControls(type, meta, conf);
                 controls.style.marginTop = '10px';
                 controls.style.display = 'inline-block';
                 controls.classList.add('emby-metadata-controls');
                 
                 if (injectPoint.parentNode) {
                     injectPoint.parentNode.insertBefore(controls, injectPoint.nextSibling);
                     // Add spacing
                     const space = document.createTextNode(' ');
                     injectPoint.parentNode.insertBefore(space, controls);
                 }
             }
        }
    }
  }

  function initSketchySex() {
    if (!location.host.includes('sketchysex.com')) return;

    const meta = {
      title: '',
      year: '',
      country: 'USA',
      genres: [],
      duration: '',
      director: '',
      studio: 'Sketchy Sex',
      actors: [],
      description: '',
      extra: ''
    };

    // 1. Title
    const titleEl = document.querySelector('.VideoInfoWrap .info .name span');
    if (titleEl) {
        meta.title = titleEl.textContent.trim();
    }

    // 2. Date & Description
    const descEl = document.querySelector('.VideoDescription');
    if (descEl) {
        const text = descEl.textContent.trim();
        // Format: "March 4th, 2026 - Description..."
        const match = text.match(/^([A-Za-z]+ \d+(?:st|nd|rd|th)?, \d{4}) - (.*)$/s);
        if (match) {
            const dateText = match[1];
            meta.extra += `Release Date: ${dateText}\n`;
            
            // Parse year
            const yearMatch = dateText.match(/(\d{4})/);
            if (yearMatch) meta.year = yearMatch[1];
            
            meta.description = match[2].trim();
        } else {
            meta.description = text;
        }
    }
    
    // Fallback date
    const dateDiv = document.querySelector('.VideoInfoWrap .info .date');
    if (dateDiv && !meta.year) {
        const dateText = dateDiv.textContent.trim();
        if (dateText) {
             meta.extra += `Release Date: ${dateText}\n`;
             const match = dateText.match(/(\d{4})/);
             if (match) meta.year = match[1];
        }
    }

    // 3. Tags
    const tagLinks = document.querySelectorAll('.VideoTagsWrap .tag .tag-text');
    tagLinks.forEach(span => {
        const tag = span.textContent.trim();
        if (tag) meta.genres.push(tag);
    });

    // 4. Actors
    const actorLinks = document.querySelectorAll('.ModelNamesWrap .ModelNames li a, .ModelNamesWrap .ModelNames a');
    actorLinks.forEach(a => {
        const name = a.textContent.trim();
        if (name) meta.actors.push({ name });
    });

    const config = (typeof metadataConfigs !== 'undefined' && metadataConfigs) ? metadataConfigs : defaultMetadataConfigs;

    // Inject Controls
    
    // Tags Controls
    const tagsWrap = document.querySelector('.VideoTagsWrap');
    if (tagsWrap && meta.genres.length > 0) {
        const type = 'genres';
        const conf = (config && config[type]) || defaultMetadataConfigs[type];
        if (conf && conf.enabled) {
             const text = renderWithTemplate(meta, conf.template, type);
             if (text && text.trim()) {
                 const controls = createMetadataControls(type, meta, conf);
                 controls.style.marginTop = '10px';
                 controls.style.display = 'block';
                 controls.classList.add('emby-metadata-controls');
                 tagsWrap.appendChild(controls);
             }
        }
    }

    // Description Controls
    if (descEl && meta.description) {
        const type = 'description';
        const conf = (config && config[type]) || defaultMetadataConfigs[type];
        if (conf && conf.enabled) {
             const text = renderWithTemplate(meta, conf.template, type);
             if (text && text.trim()) {
                 const controls = createMetadataControls(type, meta, conf);
                 controls.style.marginTop = '10px';
                 controls.style.display = 'block';
                 controls.classList.add('emby-metadata-controls');
                 if (descEl.parentNode) {
                     descEl.parentNode.insertBefore(controls, descEl.nextSibling);
                 }
             }
        }
    }
    
    // Actors Controls
    const actorsWrap = document.querySelector('.ModelNamesWrap');
    if (actorsWrap && meta.actors.length > 0) {
        const type = 'actors';
        const conf = (config && config[type]) || defaultMetadataConfigs[type];
        if (conf && conf.enabled) {
             const text = renderWithTemplate(meta, conf.template, type);
             if (text && text.trim()) {
                 const controls = createMetadataControls(type, meta, conf);
                 controls.style.marginTop = '5px';
                 controls.style.display = 'block';
                 controls.classList.add('emby-metadata-controls');
                 actorsWrap.appendChild(controls);
             }
        }
    }
  }

  function initClips4Sale() {
    if (!location.host.includes('clips4sale.com')) return;

    const run = () => {
        // Auto-expand "Read More"
        const buttons = document.querySelectorAll('button, div[role="button"], span[role="button"], a[role="button"]');
        for (const btn of buttons) {
            const text = btn.textContent ? btn.textContent.trim().toLowerCase() : '';
            if (text === 'read more' && btn.offsetParent !== null) {
                btn.click();
            }
        }

        // Find main content wrapper to ensure page is loaded
        const titleEl = document.querySelector('h1[data-testid="clip-page-clipTitle"]');
        if (!titleEl) return;

        const meta = {
            title: titleEl.textContent.trim(),
            year: '',
            country: 'USA',
            genres: [],
            duration: '',
            director: '',
            studio: '',
            actors: [],
            description: '',
            extra: ''
        };

        // 2. Date
        const dateEl = document.querySelector('span[data-testid="individualClip-clip-date-added"]');
        if (dateEl) {
            const dateText = dateEl.textContent.replace('Added:', '').trim();
            meta.extra += `Release Date: ${dateText}\n`;
            const date = new Date(dateText);
            if (!isNaN(date.getTime())) {
                meta.year = date.getFullYear().toString();
            }
        }

        // 3. Duration
        const durEl = document.querySelector('span[data-testid="individualClip-clip-duration"]');
        if (durEl) meta.duration = durEl.textContent.trim();

        // 4. Studio
        const studioEl = document.querySelector('a[data-testid="clip-page-studioName"]');
        if (studioEl) meta.studio = studioEl.textContent.trim();

        // 5. Description
        const descEl = document.querySelector('div.read-more--text');
        if (descEl) meta.description = descEl.textContent.trim();

        // 6. Tags (Category + Related Categories + Keywords)
        // Category
        const catEl = document.querySelector('a[data-testid="clip-page-clipCategory"]');
        if (catEl) meta.genres.push(catEl.textContent.trim().replace(/,$/, ''));

        // Related Categories
        const relatedEls = document.querySelectorAll('span[data-testid="clip-page-relatedCategories"] a');
        relatedEls.forEach(a => {
            const t = a.textContent.trim().replace(/,$/, '');
            if (t) meta.genres.push(t);
        });

        // Keywords
        const keywordEls = document.querySelectorAll('span[data-testid="clip-page-keywords"] a');
        keywordEls.forEach(a => {
            const t = a.textContent.trim().replace(/,$/, '');
            if (t) meta.genres.push(t);
        });

        // Deduplicate genres
        meta.genres = [...new Set(meta.genres)];

        const config = (typeof metadataConfigs !== 'undefined' && metadataConfigs) ? metadataConfigs : defaultMetadataConfigs;

        // Inject Controls
        
        // Description Controls
        if (descEl && meta.description) {
            // Check if already injected
            if (descEl.parentNode.querySelector('.emby-metadata-controls.desc-controls')) return;

            const type = 'description';
            const conf = (config && config[type]) || defaultMetadataConfigs[type];
            if (conf && conf.enabled) {
                const text = renderWithTemplate(meta, conf.template, type);
                if (text && text.trim()) {
                    const controls = createMetadataControls(type, meta, conf);
                    controls.style.marginTop = '10px';
                    controls.style.display = 'block';
                    controls.classList.add('emby-metadata-controls', 'desc-controls');
                    if (descEl.parentNode) {
                        descEl.parentNode.insertBefore(controls, descEl.nextSibling);
                    }
                }
            }
        }

        // Genres Controls
        const keywordsSpan = document.querySelector('span[data-testid="clip-page-keywords"]');
        const relatedSpan = document.querySelector('span[data-testid="clip-page-relatedCategories"]');
        const targetEl = keywordsSpan || relatedSpan || catEl;

        if (targetEl && meta.genres.length > 0) {
            const container = targetEl.closest('div');
            // Check if already injected in this container
            if (container && container.parentNode && container.parentNode.querySelector('.emby-metadata-controls.genre-controls')) return;

            const type = 'genres';
            const conf = (config && config[type]) || defaultMetadataConfigs[type];
            if (conf && conf.enabled) {
                const text = renderWithTemplate(meta, conf.template, type);
                if (text && text.trim()) {
                    const controls = createMetadataControls(type, meta, conf);
                    controls.style.marginTop = '10px';
                    controls.style.display = 'block';
                    controls.classList.add('emby-metadata-controls', 'genre-controls');
                    
                    if (container && container.parentNode) {
                        container.parentNode.insertBefore(controls, container.nextSibling);
                    }
                }
            }
        }
    };

    // Run initially
    run();
    
    // Poll every 1s for SPA changes
    setInterval(run, 1000);
  }

  initCkDownload();
  initKoVideo();
  initAdultContentsFc2();
  initMenCom();
  initVoyrCom();
  initTwinkPop();
  initMensRushTv();
  initSeanCody();
  initCockyBoysStore();
  initCockyBoysCom();
  initGayDvdEmpire();
  initGaywire();
  initWaybig();
  initSketchySex();
  initClips4Sale();
  initFalconStudios();
  initCatholicBoys();
  initCarnalPlus();
  initHelixStudios();
  initEnglishLads();
  initLatinBoyz();
  initGokumen();
  initStr8Boys();
  initGayerdar();
  initSayUncle();
  initBoyStudio();
  initJgvData();
  initHunkCh();
  init4HorLover();
  initGamesVideo();
  initFratx();
  initDaiichisouko();
  initTranceVideo();
  initPornolab();
  initIafd();
  initEmbyItem();

  enableUniversalCopyUnlock();

  if (location.host.includes('lustfulboy.com') && location.pathname.includes('/web/index.html')) {
    window.addEventListener('hashchange', () => {
      console.log(debugPrefix, 'hashchange', location.hash);
      initEmbyItem();
    });

    if (!embyItemInterval) {
      embyItemInterval = setInterval(() => {
        console.log(debugPrefix, 'periodic initEmbyItem tick');
        initEmbyItem();
      }, 2000);
      console.log(debugPrefix, 'start periodic initEmbyItem interval');
    }
  }
})();
