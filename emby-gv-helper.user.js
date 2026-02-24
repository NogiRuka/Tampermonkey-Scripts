// ==UserScript==
// @name         emby-gv-helper
// @namespace    http://tampermonkey.net/
// @version      2026-02-01
// @description  Emby GV helper for Pornolab and IAFD metadata copy
// @author       乃木流架
// @icon         https://github.com/NogiRuka/Tampermonkey-Scripts/blob/main/favicons/lustfulboy.png?raw=true
// @match        https://pornolab.net/forum/viewtopic.php*
// @match        https://www.iafd.com/title.rme/*
// @match        https://lustfulboy.com/web/index.html*
// @match        https://www.games-video.co.jp/dvd_detail.php*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
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
      resourceOpenButton: '打开资源目录'
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
      resourceOpenButton: 'Open resource folder'
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

    const typeToButtonText = {
      actors: t.metadataActorsCopy,
      genres: t.metadataGenresCopy,
      description: t.metadataDescriptionCopy
    };

    ['actors', 'genres', 'description'].forEach(type => {
      const conf = (config && config[type]) || defaultMetadataConfigs[type];
      if (!conf || !conf.enabled) return;
      const labelText = typeToLabel[type];
      const span = Array.from(body.querySelectorAll('.post-b')).find(s => s.textContent.replace(/\s+/g, ' ').trim().replace(/[:：]\s*$/, '') === labelText);
      if (!span) return;
      const text = renderWithTemplate(meta, conf.template, type);
      if (!text) return;

      const btn = document.createElement('button');
      btn.textContent = typeToButtonText[type];
      btn.style.cssText = 'display:inline-block;margin-left:6px;padding:1px 6px;border-radius:6px;background-color:#ff69b4;color:white;border:none;font-size:11px;cursor:pointer;';
      btn.onclick = () => {
        copyToClipboard(renderWithTemplate(meta, conf.template, type))
          .then(() => showToast(t.metadataCopied))
          .catch(err => {
            console.error(err);
            showToast(t.metadataCopyFailed);
          });
      };

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
        insertAfter.parentNode.insertBefore(btn, insertAfter.nextSibling);
      } else if (span.parentNode) {
        span.parentNode.insertBefore(btn, span.nextSibling);
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

    const typeToButtonText = {
      actors: t.metadataActorsCopy,
      genres: t.metadataGenresCopy,
      description: t.metadataDescriptionCopy
    };

    ['actors', 'genres', 'description'].forEach(type => {
      const conf = (config && config[type]) || defaultMetadataConfigs[type];
      if (!conf || !conf.enabled) return;
      const text = renderWithTemplate(meta, conf.template, type);
      if (!text) return;
      const btn = document.createElement('button');
      btn.textContent = typeToButtonText[type];
      btn.style.cssText = 'padding:2px 8px;border-radius:6px;background-color:' + themeColor + ';color:white;border:none;font-size:11px;cursor:pointer;';
      btn.onclick = () => {
        copyToClipboard(renderWithTemplate(meta, conf.template, type))
          .then(() => showToast(t.metadataCopied))
          .catch(err => {
            console.error(err);
            showToast(t.metadataCopyFailed);
          });
      };
      container.appendChild(btn);
    });

    if (!container.hasChildNodes()) return;
    header.parentNode.insertBefore(container, header.nextSibling);
  }

  const debugPrefix = '🧩 [emby-gv-helper]';
  let embyItemTimer = null;
  let embyItemInterval = null;

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
      }

      const itemViews = document.querySelectorAll('.view-item-item');
      const currentView = itemViews[itemViews.length - 1] || null;
      if (!currentView) {
        if (tries === 1 || tries === maxTries) {
          console.log(debugPrefix, 'no .view-item-item found, try', tries, '/', maxTries);
        }
        if (tries >= maxTries) {
          clearInterval(embyItemTimer);
          embyItemTimer = null;
        }
        return;
      }

      if (tries === 1) {
        console.log(debugPrefix, 'found itemViews count', itemViews.length);
      }

      const sectionTitle = currentView.querySelector('.mediaSources .sectionTitle');
      if (!sectionTitle) {
        if (tries === 1 || tries === maxTries) {
          console.log(debugPrefix, 'no .mediaSources .sectionTitle in currentView, try', tries, '/', maxTries);
        }
        if (tries >= maxTries) {
          clearInterval(embyItemTimer);
          embyItemTimer = null;
        }
        return;
      }

      const pathDiv = sectionTitle.querySelector('div:not(.mediaInfoItems)');
      if (!pathDiv) {
        console.log(debugPrefix, 'sectionTitle found but no pathDiv');
        if (tries >= maxTries) {
          clearInterval(embyItemTimer);
          embyItemTimer = null;
        }
        return;
      }

      const rawPath = pathDiv.textContent.trim();
      if (!rawPath) {
        console.log(debugPrefix, 'pathDiv exists but rawPath is empty');
        if (tries >= maxTries) {
          clearInterval(embyItemTimer);
          embyItemTimer = null;
        }
        return;
      }

      const marker = '/media/lustfulboy/';
      const idx = rawPath.indexOf(marker);
      if (idx === -1) {
        console.log(debugPrefix, 'marker not found in rawPath', { rawPath, marker });
        clearInterval(embyItemTimer);
        embyItemTimer = null;
        return;
      }

      const afterMarker = rawPath.slice(idx + marker.length);
      if (!afterMarker) {
        console.log(debugPrefix, 'afterMarker empty', { rawPath, marker });
        clearInterval(embyItemTimer);
        embyItemTimer = null;
        return;
      }

      const dirPart = afterMarker.replace(/[^/]+$/, '');
      if (!dirPart) {
        console.log(debugPrefix, 'dirPart empty after stripping filename', { afterMarker });
        clearInterval(embyItemTimer);
        embyItemTimer = null;
        return;
      }

      const segments = dirPart.split('/').filter(Boolean).map(encodeURIComponent);
      const relative = segments.join('/');
      console.log(debugPrefix, 'parsed path', { rawPath, dirPart, segments, relative });

      const moreBtn = currentView.querySelector('.btnMoreCommands.detailButton');
      if (!moreBtn) {
        if (tries === 1 || tries === maxTries) {
          console.log(debugPrefix, 'no .btnMoreCommands.detailButton found in currentView, try', tries, '/', maxTries);
        }
        if (tries >= maxTries) {
          clearInterval(embyItemTimer);
          embyItemTimer = null;
        }
        return;
      }

      const base = resourceBaseUrl.replace(/\/+$/, '');
      const url = relative ? base + '/' + relative : base;
      console.log(debugPrefix, 'final resource url', { base, url });

      const existing = currentView.querySelector('[data-dan-resource-link="1"]');
      if (existing) {
        console.log(debugPrefix, 'button already exists in currentView, update onclick only');
        existing.onclick = () => {
          window.open(url, '_blank', 'noopener');
        };
        clearInterval(embyItemTimer);
        embyItemTimer = null;
        return;
      }

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
        console.log(debugPrefix, 'insert new button after moreBtn');
        moreBtn.parentNode.insertBefore(linkBtn, moreBtn.nextSibling);
      }
      clearInterval(embyItemTimer);
      embyItemTimer = null;
    }, 500);
  }

  function initGamesVideo() {
    if (!location.host.includes('games-video.co.jp')) return;
    if (!location.pathname.includes('dvd_detail.php')) return;

    // Unlock copy
    const style = document.createElement('style');
    style.textContent = 'body, * { user-select: text !important; -webkit-user-select: text !important; }';
    document.head.appendChild(style);
    ['copy', 'cut', 'contextmenu', 'selectstart', 'mousedown', 'mouseup', 'keydown', 'keypress', 'keyup'].forEach(type => {
      document.addEventListener(type, e => {
        e.stopPropagation();
      }, true);
    });

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
      if (td.textContent.includes('カテゴリー：')) {
        const links = td.querySelectorAll('a');
        meta.genres = Array.from(links).map(a => a.textContent.trim());
        targetTd = td;
        break;
      }
    }

    if (targetTd && meta.genres.length > 0) {
      const conf = (metadataConfigs && metadataConfigs.genres) || defaultMetadataConfigs.genres;
      
      if (conf && conf.enabled) {
        const btn = document.createElement('button');
        btn.textContent = t.metadataGenresCopy;
        btn.style.cssText = 'display:inline-block;margin-left:6px;padding:1px 6px;border-radius:6px;background-color:' + themeColor + ';color:white;border:none;font-size:11px;cursor:pointer;';
        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          copyToClipboard(renderWithTemplate(meta, conf.template, 'genres'))
            .then(() => showToast(t.metadataCopied))
            .catch(err => {
              console.error(err);
              showToast(t.metadataCopyFailed);
            });
        };
        targetTd.appendChild(btn);
      }
    }
  }

  initGamesVideo();
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
