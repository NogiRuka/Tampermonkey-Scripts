// ==UserScript==
// @name         Emby Mixed Library Tabs
// @namespace    https://tampermonkey.net/
// @version      0.1
// @description  混合内容媒体库恢复节目Tab，并默认进入指定Tab
// @author       ChatGPT
// @match        https://lustfulboy.com/*
// @grant        none
// @run-at       document-idle
// @require      file://D:\Projects\Tampermonkey Scripts\emby-plus.user.js
// ==/UserScript==

(function () {
    'use strict';

    /**********************
     * 配置
     **********************/
    const CONFIG = {
        // 是否显示隐藏的"节目"Tab
        showSeriesTab: true,

        // 默认打开哪个Tab
        // 0 = 节目
        // 1 = 影片和节目
        // 12 = 文件夹
        defaultTab: 1,

        // 是否只在当前是"文件夹"时自动切换
        onlyWhenFolderActive: true,

        // 鼠标进入页面最右侧热区时，扩大滚动条拖拽命中范围
        scrollbarHoverExpand: true,
        scrollbarEdgeTriggerWidth: 20,

        debug: true
    };

    let lastParentId = null;
    let autoSwitched = false;

    function log(...args) {
        if (CONFIG.debug) {
            console.log("[MixedTab]", ...args);
        }
    }

    function setupScrollbarHoverExpand() {
        if (!CONFIG.scrollbarHoverExpand || window.__mixedTabScrollbarInit) {
            return;
        }

        window.__mixedTabScrollbarInit = true;

        const PROXY_THUMB_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAAACXBIWXMAAAsTAAALEwEAmpwYAAAEJ0lEQVR4nO2b3VMbVRiHD17oRfVKvREv1Sv9S5gC8c9wpLXlzX6ETFCrI4pQGGySzceNyo3SNiVlSdCRSrO7gXFkOmQgWMeWTtX6URttJ7sJ7RznoHGYiAPpK9ldeJ+Z393Z3TfPvOfs2d0JYwRBbKNvXH9MjhnHlVRxLRgzaiJqqrgqacaxwU9Kj24fSzRxImZ2ypp1dWiqdO9cqcLnb97fyvmVCn/n09I9VTPXgxOFZ5qPI9jfnadZV1Nf3thcuMX5TkldurGpJKwydeIOSHHzNdF5/yWvkaGplbtyvNC30zkONUrCKotpu5vAcysVriaKq27X6zmCMaP2xc37uwoUY6S44bhdr+eAaGFXeY2IsW7X6zmABD48g4P8kVYFimPYYUcdX3haipmqHDdvvf7hV/ZeBYqxSsL8ETRDEedgh41XPph/XEmaY1LctMey69Xptbt77r5GxDHiWHEONWmd7h/OH2GHgZNnFnolzfx1LFuufr5Rb1lccz7bqPPRC2VbnDN4xuhlBxbOO5SE+X44vVQ9X/odLe5f+8NShQ+kl6pywnpXXIsdtMc0NWnqb368XBUd83/La2Ruo85PTS7bSrKoi2uyAwHnHWrSyr53tuRc+uHBvslrZP77B3xoquQoSStzIDpRilujb3z0dVX8sP2Wt13iqcnlqqyZI8zPBKOF7lB60RZTq13y/rm5XK/xUGrRluOXjzI/0j+cPyInzF+mrvzWdnmNnL1yh2/dnVOFJ5jfkDUrNpJZc9yS18hIZtVRElac+YmT2vxTkmY6c9drrsoTmbtW23p7o0wsPsn8QjBmRkany3t+NNvvjGbWHDlhhJkv4LxD1qzbD/N4tl/JrP6xtRb6YltzYsJ8aSC9uOur+XZH1NQfNV5kXicYM46PX1yvui2sOaezZVuKXX6VeZ1Q2spPLv3kurDmiJrUZFFnXkdNFb+dLntn/WtErMlqsvgN8zqyZt3OX3NcF9ac/HcOFxt75nWC0UK9nc+9e42oCaKFOvM60MK3jXbHFx+jgATiABKIA0ggDiCBOIAE4gASiANIIA4ggTiABOIAEogDSCAOIIE4gATiABKIA0ggDiCBOIAE4gASiANIIA4ggTiABOIAEogDSCAOIIE4gATiABKIA0ggDiCBOIAE4gASiANIIA4ggTiABOIAEogDSCAOIIE4gATiABKIA0hg6wQk/dlAJKf3DOh2d2iGezmixkAkl+sKZ59nXpHXE9Yrx7TS5tuZn/nwbMXTETX2aSubveHZO12hbKfb/pjoPFGQ22Jajaj55Ujuotv+mJgSfui8nTqxe0Cvuu2P9YRmfCnwrQseERiI5HJ+ncKByKz7f8DuVWZeEAuyKMgPnSg676+biF45quSeY16gK5TtFAuymM6e38aEZmzReZ6RRxAMw5/dgC1Po2P3CwAAAABJRU5ErkJggg==";

        const style = document.createElement("style");
        style.id = "mixed-tab-scrollbar-style";
        style.textContent = `
            @media (pointer: fine) {
                body.mixed-tab-scrollbar-dragging {
                    user-select: none !important;
                    cursor: grabbing !important;
                }

                div.overflowYScroll {
                    scrollbar-width: none !important;
                    -ms-overflow-style: none;
                }

                div.overflowYScroll::-webkit-scrollbar {
                    width: 0 !important;
                    height: 0 !important;
                }

                #mixed-tab-scrollbar-proxy {
                    position: fixed;
                    right: 0;
                    top: 0;
                    width: ${CONFIG.scrollbarEdgeTriggerWidth}px;
                    height: 0;
                    display: block;
                    opacity: 0;
                    visibility: hidden;
                    z-index: 99999;
                    box-sizing: border-box;
                    background: transparent;
                    border-left: none;
                    box-shadow: none;
                    backdrop-filter: none;
                    pointer-events: auto;
                    transition: opacity 0.18s ease, visibility 0.18s ease;
                }

                #mixed-tab-scrollbar-proxy.is-active {
                    opacity: 1;
                    visibility: visible;
                }

                #mixed-tab-scrollbar-thumb {
                    position: absolute;
                    left: 0;
                    right: 0;
                    top: 0;
                    min-height: 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: stretch;
                    cursor: grab;
                    overflow: hidden;
                }

                .mixed-tab-thumb-segment {
                    display: block;
                    width: 100%;
                    background-position: center center;
                    background-repeat: no-repeat;
                    background-size: 100% auto;
                    image-rendering: auto;
                    pointer-events: none;
                    flex-shrink: 0;
                }

                #mixed-tab-scrollbar-thumb-top {
                    background-position: center bottom;
                }

                #mixed-tab-scrollbar-thumb-middle {
                    flex: 1 1 auto;
                    min-height: 1px;
                    background-repeat: repeat-y;
                    background-position: center top;
                    background-size: 100% auto;
                    margin-top: -1px;
                    margin-bottom: -1px;
                    flex-shrink: 1;
                }

                #mixed-tab-scrollbar-thumb-bottom {
                    background-position: center top;
                }
            }
        `;

        (document.head || document.documentElement).appendChild(style);

        const proxy = document.createElement("div");
        proxy.id = "mixed-tab-scrollbar-proxy";

        const thumb = document.createElement("div");
        thumb.id = "mixed-tab-scrollbar-thumb";

        const thumbTop = document.createElement("div");
        thumbTop.id = "mixed-tab-scrollbar-thumb-top";
        thumbTop.className = "mixed-tab-thumb-segment";

        const thumbMiddle = document.createElement("div");
        thumbMiddle.id = "mixed-tab-scrollbar-thumb-middle";
        thumbMiddle.className = "mixed-tab-thumb-segment";

        const thumbBottom = document.createElement("div");
        thumbBottom.id = "mixed-tab-scrollbar-thumb-bottom";
        thumbBottom.className = "mixed-tab-thumb-segment";

        thumb.appendChild(thumbTop);
        thumb.appendChild(thumbMiddle);
        thumb.appendChild(thumbBottom);
        proxy.appendChild(thumb);
        document.body.appendChild(proxy);

        let minThumbHeight = CONFIG.scrollbarEdgeTriggerWidth;

        const applyThumbSkin = (topUrl, middleUrl, bottomUrl) => {
            thumbTop.style.backgroundImage = `url("${topUrl}")`;
            thumbMiddle.style.backgroundImage = `url("${middleUrl}")`;
            thumbBottom.style.backgroundImage = `url("${bottomUrl}")`;
        };

        const buildThumbSkin = () => {
            const image = new Image();

            image.onload = () => {
                const sourceCanvas = document.createElement("canvas");
                sourceCanvas.width = image.naturalWidth;
                sourceCanvas.height = image.naturalHeight;

                const sourceCtx = sourceCanvas.getContext("2d");
                if (!sourceCtx) return;

                sourceCtx.drawImage(image, 0, 0);

                const imageData = sourceCtx.getImageData(
                    0,
                    0,
                    sourceCanvas.width,
                    sourceCanvas.height
                ).data;

                let minX = sourceCanvas.width;
                let minY = sourceCanvas.height;
                let maxX = -1;
                let maxY = -1;

                for (let y = 0; y < sourceCanvas.height; y++) {
                    for (let x = 0; x < sourceCanvas.width; x++) {
                        const alpha = imageData[(y * sourceCanvas.width + x) * 4 + 3];
                        if (alpha === 0) continue;

                        if (x < minX) minX = x;
                        if (y < minY) minY = y;
                        if (x > maxX) maxX = x;
                        if (y > maxY) maxY = y;
                    }
                }

                const cropLeft = maxX >= 0 ? minX : 0;
                const cropTop = maxY >= 0 ? minY : 0;
                const cropWidth = maxX >= 0 ? maxX - minX + 1 : sourceCanvas.width;
                const cropHeight = maxY >= 0 ? maxY - minY + 1 : sourceCanvas.height;

                const croppedCanvas = document.createElement("canvas");
                croppedCanvas.width = cropWidth;
                croppedCanvas.height = cropHeight;

                const croppedCtx = croppedCanvas.getContext("2d");
                if (!croppedCtx) return;

                croppedCtx.drawImage(
                    sourceCanvas,
                    cropLeft,
                    cropTop,
                    cropWidth,
                    cropHeight,
                    0,
                    0,
                    cropWidth,
                    cropHeight
                );

                const cropCanvasToContent = (canvas, options = {}) => {
                    const { trimX = true, trimY = true } = options;
                    const ctx = canvas.getContext("2d");
                    if (!ctx) return canvas;

                    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                    let localMinX = canvas.width;
                    let localMinY = canvas.height;
                    let localMaxX = -1;
                    let localMaxY = -1;

                    for (let y = 0; y < canvas.height; y++) {
                        for (let x = 0; x < canvas.width; x++) {
                            const alpha = data[(y * canvas.width + x) * 4 + 3];
                            if (alpha === 0) continue;

                            if (x < localMinX) localMinX = x;
                            if (y < localMinY) localMinY = y;
                            if (x > localMaxX) localMaxX = x;
                            if (y > localMaxY) localMaxY = y;
                        }
                    }

                    if (localMaxX < 0 || localMaxY < 0) {
                        return canvas;
                    }

                    const nextLeft = trimX ? localMinX : 0;
                    const nextTop = trimY ? localMinY : 0;
                    const nextWidth = trimX ? localMaxX - localMinX + 1 : canvas.width;
                    const nextHeight = trimY ? localMaxY - localMinY + 1 : canvas.height;

                    if (
                        nextLeft === 0 &&
                        nextTop === 0 &&
                        nextWidth === canvas.width &&
                        nextHeight === canvas.height
                    ) {
                        return canvas;
                    }

                    const trimmedCanvas = document.createElement("canvas");
                    trimmedCanvas.width = nextWidth;
                    trimmedCanvas.height = nextHeight;

                    const trimmedCtx = trimmedCanvas.getContext("2d");
                    if (!trimmedCtx) return canvas;

                    trimmedCtx.drawImage(
                        canvas,
                        nextLeft,
                        nextTop,
                        nextWidth,
                        nextHeight,
                        0,
                        0,
                        nextWidth,
                        nextHeight
                    );

                    return trimmedCanvas;
                };


                const topCoreHeight = Math.max(Math.floor(cropHeight * 0.75), 1);
                const middleSliceHeight = 1;
                const seamSampleY = Math.min(
                    Math.max(topCoreHeight - 1, 0),
                );
                const topSliceHeight = seamSampleY + 1;
                const bottomSliceStartY = seamSampleY;
                const bottomSliceHeight = Math.max(
                    cropHeight - bottomSliceStartY,
                    1
                );
                const makeSliceCanvas = (sourceY, sliceHeight) => {
                    const canvas = document.createElement("canvas");
                    canvas.width = cropWidth;
                    canvas.height = sliceHeight;

                    const ctx = canvas.getContext("2d");
                    if (!ctx) return null;

                    ctx.drawImage(
                        croppedCanvas,
                        0,
                        sourceY,
                        cropWidth,
                        sliceHeight,
                        0,
                        0,
                        cropWidth,
                        sliceHeight
                    );

                    return canvas;
                };

                const topCanvas = cropCanvasToContent(
                    makeSliceCanvas(0, topSliceHeight),
                    { trimX: false, trimY: true }
                );
                const middleCanvas = makeSliceCanvas(seamSampleY, middleSliceHeight);
                const bottomCanvas = cropCanvasToContent(
                    makeSliceCanvas(bottomSliceStartY, bottomSliceHeight),
                    { trimX: false, trimY: true }
                );

                const topUrl = topCanvas.toDataURL("image/png");
                const middleUrl = middleCanvas.toDataURL("image/png");
                const bottomUrl = bottomCanvas.toDataURL("image/png");

                if (topUrl && middleUrl && bottomUrl) {
                    applyThumbSkin(topUrl, middleUrl, bottomUrl);
                }

                const thumbWidth = Math.max(proxy.clientWidth, CONFIG.scrollbarEdgeTriggerWidth);
                const scale = thumbWidth / Math.max(cropWidth, 1);
                const topHeight = Math.max(Math.round(topCanvas.height * scale), 1);
                const middleMinHeight = Math.max(Math.round(middleSliceHeight * scale), 1);
                const bottomHeight = Math.max(Math.round(bottomCanvas.height * scale), 1);

                thumbTop.style.height = `${topHeight}px`;
                thumbTop.style.flex = `0 0 ${topHeight}px`;
                thumbBottom.style.height = `${bottomHeight}px`;
                thumbBottom.style.flex = `0 0 ${bottomHeight}px`;
                thumbMiddle.style.minHeight = `${middleMinHeight}px`;
                thumb.style.minHeight = `${topHeight + middleMinHeight + bottomHeight}px`;
                minThumbHeight = topHeight + middleMinHeight + bottomHeight;
            };

            image.src = PROXY_THUMB_IMAGE;
        };

        buildThumbSkin();

        const isScrollable = (element) => {
            if (!element) return false;

            const styleDecl = window.getComputedStyle(element);
            return (
                styleDecl.display !== "none" &&
                styleDecl.visibility !== "hidden" &&
                element.clientHeight > 0 &&
                element.scrollHeight > element.clientHeight + 1
            );
        };

        const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

        const getPrimaryScrollableTarget = (clientY) => {
            const candidates = Array
                .from(document.querySelectorAll("div.overflowYScroll"))
                .filter((element) => !element.classList.contains("mainDrawer") && isScrollable(element))
                .sort((a, b) => {
                    const rectA = a.getBoundingClientRect();
                    const rectB = b.getBoundingClientRect();
                    const scoreA =
                        (a.classList.contains("is-active") ? 100 : 0) +
                        (rectA.top <= clientY && rectA.bottom >= clientY ? 50 : 0) +
                        Math.max(0, rectA.height / 20);
                    const scoreB =
                        (b.classList.contains("is-active") ? 100 : 0) +
                        (rectB.top <= clientY && rectB.bottom >= clientY ? 50 : 0) +
                        Math.max(0, rectB.height / 20);

                    return scoreB - scoreA;
                });

            return candidates[0] || null;
        };

        const getMetrics = (element) => {
            const rect = element.getBoundingClientRect();
            const visibleTop = clamp(rect.top, 0, window.innerHeight);
            const visibleBottom = clamp(rect.bottom, 0, window.innerHeight);
            const visibleHeight = Math.max(visibleBottom - visibleTop, 0);

            if (visibleHeight < 40) return null;

            const scrollRange = Math.max(element.scrollHeight - element.clientHeight, 0);
            const thumbHeight = Math.min(
                visibleHeight,
                Math.max((visibleHeight * visibleHeight) / Math.max(element.scrollHeight, 1), minThumbHeight)
            );
            const trackHeight = Math.max(visibleHeight - thumbHeight, 0);
            const thumbTop = scrollRange > 0
                ? (element.scrollTop / scrollRange) * trackHeight
                : 0;

            return {
                top: visibleTop,
                height: visibleHeight,
                thumbHeight,
                thumbTop,
                scrollRange
            };
        };

        let lastPointerX = -1;
        let lastPointerY = Math.round(window.innerHeight / 2);
        let dragState = null;
        let proxyState = null;
        let rafId = 0;

        const renderProxy = () => {
            rafId = 0;

            const shouldShowProxy = Boolean(dragState) || (
                lastPointerX >= 0 &&
                window.innerWidth - lastPointerX <= CONFIG.scrollbarEdgeTriggerWidth
            );
            if (!shouldShowProxy) {
                proxy.classList.remove("is-active");
                proxyState = null;
                return;
            }

            const target = dragState?.target || getPrimaryScrollableTarget(lastPointerY);
            if (!target || !isScrollable(target)) {
                proxy.classList.remove("is-active");
                proxyState = null;
                return;
            }

            const metrics = getMetrics(target);
            if (!metrics) {
                proxy.classList.remove("is-active");
                proxyState = null;
                return;
            }

            proxy.classList.add("is-active");
            proxy.style.top = `${metrics.top}px`;
            proxy.style.height = `${metrics.height}px`;
            thumb.style.height = `${metrics.thumbHeight}px`;
            thumb.style.transform = `translateY(${metrics.thumbTop}px)`;

            proxyState = {
                target,
                ...metrics
            };
        };

        const scheduleRender = () => {
            if (rafId) return;
            rafId = requestAnimationFrame(renderProxy);
        };

        const stopDrag = () => {
            dragState = null;
            if (document.body) {
                document.body.classList.remove("mixed-tab-scrollbar-dragging");
            }
            scheduleRender();
        };

        proxy.addEventListener("mousedown", (event) => {
            if (event.button !== 0 || !proxyState) return;

            const { target, thumbHeight, thumbTop, height, scrollRange } = proxyState;
            const proxyRect = proxy.getBoundingClientRect();
            const localY = clamp(event.clientY - proxyRect.top, 0, height);
            const isOnThumb = localY >= thumbTop && localY <= thumbTop + thumbHeight;
            const dragOffset = isOnThumb ? localY - thumbTop : thumbHeight / 2;
            const trackHeight = Math.max(height - thumbHeight, 0);

            if (!isOnThumb && scrollRange > 0 && trackHeight > 0) {
                const nextThumbTop = clamp(localY - thumbHeight / 2, 0, trackHeight);
                target.scrollTop = (nextThumbTop / trackHeight) * scrollRange;
                scheduleRender();
            }

            dragState = {
                target,
                dragOffset
            };

            if (document.body) {
                document.body.classList.add("mixed-tab-scrollbar-dragging");
            }

            event.preventDefault();
            event.stopPropagation();
        }, true);

        document.addEventListener("mousemove", (event) => {
            lastPointerX = event.clientX;
            lastPointerY = event.clientY;

            if (!dragState || !proxyState || dragState.target !== proxyState.target) {
                scheduleRender();
                return;
            }

            const { target, dragOffset } = dragState;
            const { top, height, thumbHeight, scrollRange } = proxyState;
            const trackHeight = Math.max(height - thumbHeight, 0);

            if (scrollRange <= 0 || trackHeight <= 0) return;

            const rawThumbTop = event.clientY - top - dragOffset;
            const nextThumbTop = clamp(rawThumbTop, 0, trackHeight);
            target.scrollTop = (nextThumbTop / trackHeight) * scrollRange;

            scheduleRender();
            event.preventDefault();
        }, true);

        document.addEventListener("scroll", scheduleRender, true);
        window.addEventListener("resize", scheduleRender);
        document.addEventListener("mouseup", stopDrag, true);
        document.addEventListener("mouseleave", () => {
            lastPointerX = -1;
            stopDrag();
        });
        window.addEventListener("blur", stopDrag);

        scheduleRender();
    }

    function patch() {


        const tabs = document.querySelectorAll(".main-tab-button");
        if (!tabs.length) return;

        const series = document.querySelector('.main-tab-button[data-index="0"]');
        const mixed = document.querySelector('.main-tab-button[data-index="1"]');
        const folder = document.querySelector('.main-tab-button[data-index="12"]');
        const active = document.querySelector(".main-tab-button.emby-tab-button-active");

        if (!active || !mixed) return;

        // 当前 hash 参数
        const hash = location.hash;
        const [, query = ""] = hash.split("?");
        const params = new URLSearchParams(query);

        const parentId = params.get("parentId");
        const currentTab = params.get("tab");

        // 进入了新的媒体库
        if (parentId !== lastParentId) {

            lastParentId = parentId;
            autoSwitched = false;

            log("Enter Library:", parentId);
        }

        // 第一阶段：默认进入文件夹 => 认为是混合媒体库
        if (
            CONFIG.defaultTab === 1 &&
            folder &&
            active.dataset.index === "12" &&
            !autoSwitched
        ) {

            autoSwitched = true;

            params.set("tab", "moviesshows");

            const newHash =
                hash.split("?")[0] + "?" + params.toString();

            log("Auto Switch:", newHash);

            location.replace(location.pathname + location.search + newHash);

            return;
        }

        // 第二阶段：已经进入 moviesshows
        if (currentTab === "moviesshows") {

            if (CONFIG.showSeriesTab && series) {

                const showSeriesTab = () => {
                    series.classList.remove("hide");
                    series.hidden = false;
                    series.style.removeProperty("display");
                };

                // 先显示一次
                showSeriesTab();

                // 只监听一次
                if (!series.dataset.mixedObserver) {

                    series.dataset.mixedObserver = "1";

                    const observer = new MutationObserver(() => {

                        if (series.classList.contains("hide")) {
                            log("Restore Series Tab");
                            showSeriesTab();
                        }

                    });

                    observer.observe(series, {
                        attributes: true,
                        attributeFilter: ["class"]
                    });
                }
            }
        }
    }

    let timer;

    const observer = new MutationObserver(() => {
        clearTimeout(timer);
        timer = requestAnimationFrame(patch);
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    setupScrollbarHoverExpand();
    window.addEventListener("load", patch);

})();
