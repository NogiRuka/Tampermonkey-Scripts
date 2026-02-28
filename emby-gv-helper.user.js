// ==UserScript==
// @name         emby-gv-helper
// @namespace    http://tampermonkey.net/
// @version      2026-02-28
// @description  Emby GV helper for Pornolab and IAFD metadata copy
// @author       乃木流架
// @icon         https://github.com/NogiRuka/Tampermonkey-Scripts/blob/main/favicons/lustfulboy.png?raw=true
// @match        https://pornolab.net/forum/viewtopic.php*
// @match        https://*.iafd.com/title.rme/*
// @match        https://*.lustfulboy.com/web/index.html*
// @match        https://*.games-video.co.jp/*
// @match        https://*.fratx.com/*
// @match        https://*.daiichisouko.com/*
// @match        https://*.trance-video.com/*
// @match        https://*.hunk-ch.com/*
// @match        https://*.sayuncle.com/*
// @match        https://*.boy-studio.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @connect      lustfulboy.com
// @connect      self
// @require      file://D:\Projects\Tampermonkey Scripts\emby-gv-helper.user.js
// ==/UserScript==

(function () {
  'use strict';

  const savedLang = GM_getValue('lang', 'auto');
  const browserLang = navigator.language.startsWith('zh') ? 'zh' : 'en';
  const lang = savedLang === 'auto' ? browserLang : savedLang;
  let shortcut = GM_getValue('shortcut', 'ctrl+shift+m');
  let themeColor = GM_getValue('themeColor', '#ff69b4');

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

  const t = {
    zh: {
      settings: '⚙️ 设置',
      language: '语言 / Language',
      shortcutSettings: '快捷键设置',
      themeColorSection: '主题色 / Theme Color',
      metadataSettings: '元数据复制模板',
      metadataHelp: '支持 {{title}}, {{genres}}, {{description}} 等，占位符；数组字段使用 {{#actors}}...{{/actors}} 或 {{#genres}}...{{/genres}}，内部用 {{name}}。',
      metadataActorsTitle: '演员模板',
      metadataGenresTitle: '标签模板',
      metadataDescriptionTitle: '简介模板',
      metadataEnable: '启用并显示复制按钮',
      metadataActorsCopy: '复制演员',
      metadataGenresCopy: '复制标签',
      metadataDescriptionCopy: '复制简介',
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
      embyApiSettings: 'Emby API 设置',
      embyApiUrlLabel: 'Emby 服务器地址 (例如 https://lustfulboy.com/emby)',
      embyApiTokenLabel: 'Emby API 密钥 (X-Emby-Token)',
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
      invalidJson: 'JSON 格式错误'
    },
    en: {
      settings: '⚙️ Settings',
      language: 'Language / 语言',
      shortcutSettings: 'Shortcut Settings',
      themeColorSection: 'Theme Color / 主题色',
      metadataSettings: 'Metadata Templates',
      metadataHelp: 'Supports {{title}}, {{genres}}, {{description}} etc; for arrays use {{#actors}}...{{/actors}} or {{#genres}}...{{/genres}} with {{name}} inside.',
      metadataActorsTitle: 'Actors Template',
      metadataGenresTitle: 'Genres Template',
      metadataDescriptionTitle: 'Description Template',
      metadataEnable: 'Enable and show copy button',
      metadataActorsCopy: 'Copy actors',
      metadataGenresCopy: 'Copy genres',
      metadataDescriptionCopy: 'Copy description',
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
      embyApiSettings: 'Emby API Settings',
      embyApiUrlLabel: 'Emby Server URL (e.g. https://lustfulboy.com/emby)',
      embyApiTokenLabel: 'Emby API Key (X-Emby-Token)',
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
      invalidJson: 'Invalid JSON'
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
      const nextTheme = themeText.value.trim();
      if (/^#[0-9a-fA-F]{6}$/.test(nextTheme)) {
        GM_setValue('themeColor', nextTheme);
      }
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

  function renderWithTemplate(meta, tpl, type) {
    if (!tpl || !meta) return '';
    let result = tpl;

    ['actors', 'genres'].forEach(field => {
      result = result.replace(
        new RegExp(`{{#${field}}}([\\s\\S]*?){{\\/${field}}}`, 'g'),
        (_, block) => {
          const arr = meta[field];
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
      const arr = meta[type];
      if (!arr || !arr.length) return '';
      result = arr.map(name => {
        let chunk = tpl;
        chunk = chunk.replace(/{{\s*name\s*}}/g, name);
        return chunk;
      }).join('');
    }

    const genresText = meta.genres && meta.genres.length ? meta.genres.join(', ') : '';
    const actorsText = meta.actors && meta.actors.length ? meta.actors.join(', ') : '';
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

  function addTagsToEmby(itemId, tags, skipPreview = false) {
    if (!embyApiUrl || !embyApiToken) {
      alert(t.embyApiSettings + ' ' + t.clickToSet);
      openSettings();
      return;
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
      input.style.cssText = 'width:60px;padding:1px 4px;font-size:11px;border:1px solid #666;border-radius:4px;background:#222;color:#fff;margin-left:4px;height:20px;';
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
        addTagsToEmby(input.value.trim(), meta.genres, false);
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
          addTagsToEmby(val, meta.genres, true);
        } else {
          showToast(t.missingItemId);
          input.focus();
        }
      };

      container.appendChild(input);
      container.appendChild(jsonBtn);
      container.appendChild(addBtn);
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

    // 1. Description
    const descDiv = document.querySelector('div.intro_text');
    if (descDiv) {
        // Replace <br> with newlines and remove HTML tags
        let text = descDiv.innerHTML.replace(/<br\s*\/?>/gi, '\n');
        text = text.replace(/<[^>]+>/g, '').trim();

        const meta = { description: text };
        const conf = (metadataConfigs && metadataConfigs.description) || defaultMetadataConfigs.description;
        
        if (conf && conf.enabled && text) {
            const controls = createMetadataControls('description', meta, conf);
            descDiv.parentNode.insertBefore(controls, descDiv.nextSibling);
            controls.style.marginBottom = '10px';
            controls.style.display = 'block';
        }
    }

    // 2. Genres (Label + Category)
    const genreSet = new Set();
    // Locate the product category list
    const prodCat = document.querySelector('div.prod_category ul');
    if (prodCat) {
        const lis = prodCat.querySelectorAll('li');
        lis.forEach(li => {
            const strong = li.querySelector('strong');
            if (!strong) return;
            const label = strong.textContent.trim();
            // Check for "レーベル" (Label) or "カテゴリ" (Category)
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
        const conf = (metadataConfigs && metadataConfigs.genres) || defaultMetadataConfigs.genres;
        
        if (conf && conf.enabled) {
            const controls = createMetadataControls('genres', meta, conf);
            // Append after the prod_category div
            const prodCatDiv = document.querySelector('div.prod_category');
            if (prodCatDiv) {
                prodCatDiv.parentNode.insertBefore(controls, prodCatDiv.nextSibling);
                controls.style.marginTop = '10px';
                controls.style.display = 'block';
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

  function initBoyStudio() {
    if (!location.host.includes('boy-studio.com')) return;

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
          if (valueText) meta.extra += `Series: ${valueText}\n`;
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

    let descP = null;
    if (descDetails) {
      descP = descDetails.querySelector('div > p');
      if (descP) {
        meta.description = descP.textContent.trim();
      }
    }

    const config = (metadataConfigs && typeof metadataConfigs === 'object') ? metadataConfigs : defaultMetadataConfigs;

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
          if (descP.parentNode) {
            descP.parentNode.insertBefore(controls, descP.nextSibling);
          }
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

  initSayUncle();
  initBoyStudio();
  initHunkCh();
  initGamesVideo();
  initFratx();
  initDaiichisouko();
  initTranceVideo();
  initPornolab();
  initIafd();
  initEmbyItem();

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
