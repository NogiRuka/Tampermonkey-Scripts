// ==UserScript==
// @name         Live Monitor Pro
// @namespace    http://tampermonkey.net/
// @version      2.1
// @match        https://www.instagram.com/*
// @match        https://www.douyin.com/*
// @grant        none
// @require      file://D:\Projects\Tampermonkey Scripts\live.user.js
// ==/UserScript==

(function () {
    'use strict';

    const isInstagram = location.host.includes('instagram.com');
    const isDouyin = location.host.includes('douyin.com');
    const normalizePath = (path) => {
        const normalized = String(path || '').replace(/\/+$/, '');
        return normalized || '/';
    };
    const isDouyinUserPage = isDouyin && normalizePath(location.pathname).startsWith('/user/');
    const platformName = isDouyin ? 'Douyin Live Monitor' : 'Instagram Live Monitor';
    const keyPrefix = isDouyinUserPage ? 'DY_LIVE_MONITOR' : 'IG_LIVE_MONITOR';
    const STOP_KEY = `${keyPrefix}_STOPPED`;
    const COUNT_KEY = `${keyPrefix}_REFRESH_COUNT`;
    const LAST_LIVE_ID_KEY = `${keyPrefix}_LAST_LIVE_ID`;
    const REFRESH_DELAY = 3000;
    const INITIAL_DELAY = 2000;

    if (!isInstagram && !isDouyinUserPage) return;

    function createToastContainer() {
        let container = document.getElementById('live-monitor-toast-container');
        if (container) return container;

        container = document.createElement('div');
        container.id = 'live-monitor-toast-container';

        Object.assign(container.style, {
            position: 'fixed',
            left: '50%',
            top: '12px',
            zIndex: '999999',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            width: 'min(420px, calc(100vw - 24px))',
            pointerEvents: 'none',
            transform: 'translateX(-50%)'
        });

        document.body.appendChild(container);
        return container;
    }

    function shouldShowStatusPanel() {
        if (isInstagram) return true;
        return isDouyinUserPage && !isDouyinVideoModalView() && isDouyinProfileHomeView();
    }

    function shouldHandleDouyinMonitor() {
        return isDouyinUserPage && !isDouyinVideoModalView() && isDouyinProfileHomeView();
    }

    function isDouyinVideoModalView() {
        if (!isDouyinUserPage) return false;

        try {
            return new URL(location.href).searchParams.has('modal_id');
        } catch (_) {
            return /\bmodal_id=/.test(location.search || '');
        }
    }

    function isDouyinProfileHomeView() {
        if (!isDouyinUserPage) return false;

        // 用户主页主视图会稳定出现用户信息块；进入视频态后这块通常会消失。
        return Boolean(
            document.querySelector('[data-e2e="user-info"]')
            || document.querySelector('[placeholder*="搜索 Ta 的作品"]')
            || document.querySelector('a[data-e2e="web_others_homepage"]')
        );
    }

    function syncStatusPanelVisibility() {
        const panel = document.getElementById('live-monitor-status-panel');
        if (!panel) return;
        panel.style.display = shouldShowStatusPanel() ? 'block' : 'none';
    }

    function toast(text, duration = 4000) {
        const container = createToastContainer();
        const div = document.createElement('div');
        const normalizedText = String(text || '');
        let theme = {
            background: 'rgba(8,8,8,.88)',
            border: '1px solid rgba(255,255,255,.2)',
            boxShadow: '0 8px 20px rgba(0,0,0,.28)'
        };

        if (/失败|错误|未找到|⛔|❌|⚠️/.test(normalizedText)) {
            theme = {
                background: 'rgba(127,29,29,.9)',
                border: '1px solid rgba(252,165,165,.35)',
                boxShadow: '0 8px 20px rgba(127,29,29,.3)'
            };
        } else if (/已复制|✅|恢复|直播中|🔴/.test(normalizedText)) {
            theme = {
                background: 'rgba(22,101,52,.9)',
                border: '1px solid rgba(134,239,172,.35)',
                boxShadow: '0 8px 20px rgba(22,101,52,.28)'
            };
        } else if (/未开播|检测|🟡|⚪/.test(normalizedText)) {
            theme = {
                background: 'rgba(55,65,81,.92)',
                border: '1px solid rgba(209,213,219,.28)',
                boxShadow: '0 8px 20px rgba(31,41,55,.24)'
            };
        }

        div.textContent = normalizedText;

        Object.assign(div.style, {
            width: '100%',
            maxWidth: '100%',
            padding: '7px 14px',
            borderRadius: '999px',
            color: '#fff',
            fontSize: '12px',
            lineHeight: '1.3',
            fontWeight: '600',
            textAlign: 'center',
            background: theme.background,
            backdropFilter: 'blur(10px)',
            border: theme.border,
            boxShadow: theme.boxShadow,
            textShadow: '0 1px 1px rgba(0,0,0,.35)',
            wordBreak: 'break-word',
            pointerEvents: 'none',
            boxSizing: 'border-box',
            opacity: '0',
            transform: 'translateY(-8px)',
            transition: 'opacity .2s ease, transform .2s ease'
        });

        container.appendChild(div);

        requestAnimationFrame(() => {
            div.style.opacity = '1';
            div.style.transform = 'translateY(0)';
        });

        setTimeout(() => {
            div.style.opacity = '0';
            div.style.transform = 'translateY(-8px)';

            setTimeout(() => {
                div.remove();
            }, 200);
        }, duration);
    }

    function createStatusPanel() {
        let panel = document.getElementById('live-monitor-status-panel');
        if (panel) {
            syncStatusPanelVisibility();
            return panel;
        }

        panel = document.createElement('div');
        panel.id = 'live-monitor-status-panel';

        Object.assign(panel.style, {
            position: 'fixed',
            left: '12px',
            top: '12px',
            zIndex: '999999',
            background: 'rgba(10,10,10,.78)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            padding: '8px 10px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,.12)',
            fontSize: '12px',
            minWidth: '0',
            maxWidth: '220px',
            lineHeight: '1.45',
            boxShadow: '0 6px 18px rgba(0,0,0,.18)'
        });

        document.body.appendChild(panel);
        syncStatusPanelVisibility();
        return panel;
    }

    function updateStatus(text, info = null) {
        if (!shouldShowStatusPanel()) return;
        const panel = createStatusPanel();
        const count = Number(localStorage.getItem(COUNT_KEY) || 0);
        const isStopped = localStorage.getItem(STOP_KEY) === '1';

        panel.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <b style="font-size:11px;">${platformName}</b>
                <span style="font-size:11px;opacity:.75;">#${count}</span>
            </div>
            <div style="margin-top:4px;word-break:break-all;">${text}</div>
        `;

        const section = document.createElement('div');
        Object.assign(section.style, {
            marginTop: '6px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px'
        });

        const createMiniButton = (label, background, onClick) => {
            const btn = document.createElement('button');
            btn.textContent = label;
            Object.assign(btn.style, {
                padding: '4px 8px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '11px',
                lineHeight: '1.2',
                fontWeight: '600',
                background,
                color: '#fff'
            });
            btn.onclick = onClick;
            return btn;
        };

        if (info && info.liveId) {
            const idBox = document.createElement('div');
            Object.assign(idBox.style, {
                width: '100%',
                padding: '5px 8px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,.06)',
                border: '1px solid rgba(255,255,255,.08)',
                wordBreak: 'break-all',
                fontFamily: 'Consolas, monospace',
                fontSize: '11px'
            });
            idBox.textContent = info.liveId;
            section.appendChild(idBox);
            section.appendChild(createMiniButton('复制', '#0ea5e9', () => copyText(info.liveId)));
        }

        section.appendChild(
            createMiniButton(isStopped ? '恢复' : '停止', isStopped ? '#16a34a' : '#dc3545', () => toggleMonitor())
        );
        panel.appendChild(section);
    }

    function hideLiveInfo() {
        const statusText = localStorage.getItem(STOP_KEY) === '1' ? '⛔ 已停止' : '⚪ 未开播';
        updateStatus(statusText);
    }

    async function copyText(text) {
        try {
            await navigator.clipboard.writeText(text);
            toast(`已复制：${text}`);
            return true;
        } catch (_) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.setAttribute('readonly', 'readonly');
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            const ok = document.execCommand('copy');
            textarea.remove();
            if (ok) toast(`已复制：${text}`);
            else toast('复制失败，请手动复制');
            return ok;
        }
    }

    function toggleMonitor() {
        if (localStorage.getItem(STOP_KEY) === '1') {
            localStorage.removeItem(STOP_KEY);
            toast('✅ 已恢复检测');
            setTimeout(() => location.reload(), 800);
            return;
        }

        localStorage.setItem(STOP_KEY, '1');
        updateStatus('⛔ 已停止');
        toast('⛔ 已停止检测');
    }

    function createToggleButton() {
        const oldButton = document.getElementById('live-monitor-toggle-btn');
        if (oldButton) oldButton.remove();
    }

    function increaseRefreshCount() {
        const count = Number(localStorage.getItem(COUNT_KEY) || 0);
        localStorage.setItem(COUNT_KEY, String(count + 1));
    }

    function scheduleRefresh() {
        setTimeout(() => {
            if (localStorage.getItem(STOP_KEY) === '1') return;
            increaseRefreshCount();
            location.reload();
        }, REFRESH_DELAY);
    }

    function isInstagramLive() {
        return [...document.querySelectorAll('span')]
            .some(el => el.textContent.trim() === '直播');
    }

    function enterInstagramLiveRoom() {
        const avatarButton = document.querySelector('[role="button"]');

        if (!avatarButton) {
            toast('⚠️ 未找到直播入口');
            return;
        }

        updateStatus('🔴 发现直播');
        toast('🔴 发现直播，正在进入...', 5000);

        setTimeout(() => {
            avatarButton.click();
        }, 1000);
    }

    function parseDouyinLiveInfo() {
        const livingBadge = document.querySelector('[data-e2e="user-info-living"]');
        const preferredLink = livingBadge
            ? livingBadge.closest('a[href*="live.douyin.com/"]')
            : null;
        const liveLink = preferredLink
            || Array.from(document.querySelectorAll('a[data-e2e="web_others_homepage"][href*="live.douyin.com/"]'))
                .find(a => {
                    const text = (a.textContent || '').replace(/\s+/g, '');
                    return text.includes('直播中') || text.includes('直播');
                });

        if (!liveLink) return null;

        const rawHref = liveLink.href || liveLink.getAttribute('href') || '';
        if (!rawHref) return null;

        let liveUrl = '';
        let liveId = '';

        try {
            const url = new URL(rawHref, location.href);
            liveUrl = url.href;
            liveId = (url.pathname.split('/').filter(Boolean)[0] || '').trim();
            if (!liveId) {
                liveId = (url.searchParams.get('room_id') || '').trim();
            }
        } catch (_) {
            return null;
        }

        if (!liveId) return null;

        return { liveId, liveUrl };
    }

    function handleInstagram() {
        updateStatus('🟡 正在检测');

        setTimeout(() => {
            if (localStorage.getItem(STOP_KEY) === '1') return;

            if (isInstagramLive()) {
                enterInstagramLiveRoom();
            } else {
                updateStatus('⚪ 未开播');
                toast('⚪ 未开播，3秒后继续检测');
                scheduleRefresh();
            }
        }, INITIAL_DELAY);
    }

    function handleDouyin() {
        if (!shouldHandleDouyinMonitor()) {
            syncStatusPanelVisibility();
            return;
        }

        updateStatus('🟡 正在检测');

        setTimeout(() => {
            if (localStorage.getItem(STOP_KEY) === '1') return;

            const info = parseDouyinLiveInfo();
            if (info) {
                localStorage.setItem(LAST_LIVE_ID_KEY, info.liveId);
                updateStatus(`🔴 直播中：${info.liveId}`, info);
                toast(`🔴 检测到直播，ID：${info.liveId}`, 5000);
                return;
            }

            updateStatus('⚪ 未开播');
            hideLiveInfo();
            toast('⚪ 未开播，3秒后继续检测');
            scheduleRefresh();
        }, INITIAL_DELAY);
    }

    createStatusPanel();
    createToggleButton();

    if (isDouyin) {
        let lastRouteKey = `${location.pathname}${location.search}${location.hash}`;
        let lastShouldHandleDouyin = shouldHandleDouyinMonitor();
        setInterval(() => {
            const nextRouteKey = `${location.pathname}${location.search}${location.hash}`;
            syncStatusPanelVisibility();
            const nextShouldHandleDouyin = shouldHandleDouyinMonitor();
            const routeChanged = nextRouteKey !== lastRouteKey;
            const becameActive = !lastShouldHandleDouyin && nextShouldHandleDouyin;

            if (!routeChanged && nextShouldHandleDouyin === lastShouldHandleDouyin) {
                return;
            }

            lastRouteKey = nextRouteKey;
            lastShouldHandleDouyin = nextShouldHandleDouyin;

            if (nextShouldHandleDouyin && (becameActive || routeChanged)) {
                if (localStorage.getItem(STOP_KEY) === '1') {
                    updateStatus('⛔ 已停止');
                    return;
                }
                handleDouyin();
            }
        }, 300);
    }

    if (localStorage.getItem(STOP_KEY) === '1') {
        updateStatus('⛔ 已停止');
        return;
    }

    if (isDouyin) {
        handleDouyin();
        return;
    }

    handleInstagram();
})();
