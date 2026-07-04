(function () {
    'use strict';

    window.__SUB = {};

    const STORAGE_KEY_GLOBAL = 'yt_sub_pro_v77_final';
    const STORAGE_KEY_SOURCES = 'kull_sub_sources_v1';
    const DEFAULT_SOURCES = [
        { id: 'default', repo: 'zingky/Kull-Vietsub', path: 'subs', enabled: true }
    ];

    const DEFAULTS = {
        fontSize: 23, outlineWidth: 1.5, blur: 2, color1: '#ffffff', color3: '#000000',
        useBox: false, deepGlow: false, boxColor: '#000000', boxOpacity: 0.5, fontFamily: 'VNF-Comic Sans',
        fadIn: 200, fadOut: 200, popupOpacity: 0.95, popupZoom: 1.0,
        posX: 350, posY: 100, width: 820, height: 600,
        isBold: true, isItalic: false, isUnderline: false, isStrike: false,
        kPre:    { c1: '#ffffff', c3: '#000000', outl: 1.5, blur: 2, zoom: 1.0 },
        kActive: { c1: '#ffffff', c3: '#000000', outl: 1.5, blur: 2, zoom: 1.3, zIn: 100, zOut: 100 },
        kPost:   { c1: '#ffffff', c3: '#000000', outl: 1.5, blur: 2, zoom: 1.0 },
        closeOnClickOutside: true,
        constrainToVideo: true
    };

    const __ = window.__SUB;
    __.STORAGE_KEY_GLOBAL = STORAGE_KEY_GLOBAL;
    __.STORAGE_KEY_SOURCES = STORAGE_KEY_SOURCES;
    __.DEFAULTS = DEFAULTS;
    __.globalSettings = JSON.parse(localStorage.getItem(STORAGE_KEY_GLOBAL)) || { ...DEFAULTS };
    __.styleSettings = {};
    __.subtitles = [];
    __.playResX = 384;
    __.playResY = 288;
    __.currentVideoId = "";
    __.isFullscreen = false;
    __.timeShiftMs = 0;
    __.fontUrl = chrome.runtime.getURL("vnf-comic-sans.ttf");
    __.assFileCache = [];

    // ============ SUB SOURCES MANAGEMENT ============
    __.subSources = JSON.parse(localStorage.getItem(STORAGE_KEY_SOURCES)) || DEFAULT_SOURCES.map(s => ({ ...s }));

    __.saveSubSources = function () {
        localStorage.setItem(STORAGE_KEY_SOURCES, JSON.stringify(__.subSources));
    };

    __.getEnabledSources = function () {
        return __.subSources.filter(s => s.enabled);
    };

    __.addSource = function (url) {
        // Parse GitHub URL like https://github.com/zingky/Kull-Vietsub/tree/main/subs
        const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/tree\/[^/]+\/(.+)/);
        if (!match) return false;
        const repo = `${match[1]}/${match[2]}`;
        const path = match[3].replace(/\/+$/, '');
        const id = 'src_' + Date.now();
        __.subSources.push({ id, repo, path, enabled: true });
        __.saveSubSources();
        return true;
    };

    __.removeSource = function (id) {
        __.subSources = __.subSources.filter(s => s.id !== id);
        __.saveSubSources();
    };

    __.toggleSource = function (id) {
        const src = __.subSources.find(s => s.id === id);
        if (src) { src.enabled = !src.enabled; __.saveSubSources(); }
    };

    __.getVideoId = function () {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('v');
    };

    __.saveCache = function () {
        localStorage.setItem(STORAGE_KEY_GLOBAL, JSON.stringify(__.globalSettings));
    };

    __.assToHex = function (assStr) {
        let clean = assStr.replace(/&H|&/g, '');
        if (clean.length > 6) clean = clean.substring(2);
        while (clean.length < 6) clean = '0' + clean;
        return `#${clean.substring(4, 6)}${clean.substring(2, 4)}${clean.substring(0, 2)}`;
    };

    __.toTime = function (t) {
        const p = t.trim().split(':');
        return (parseInt(p[0]) * 3600) + (parseInt(p[1]) * 60) + parseFloat(p[2]);
    };

    __.hexToRgba = function (hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    };

    __.hexToAss = function (hex) {
        let h = hex.replace('#', '').toUpperCase();
        return `&H${h.substring(4, 6)}${h.substring(2, 4)}${h.substring(0, 2)}`;
    };

    __.formatTimeAss = function (seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}:${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`;
    };

    __.sanitizeFilename = function (name) {
        return name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, ' ').trim();
    };

    __.getVideoTitle = async function () {
        const titleEl = document.querySelector('h1.ytd-watch-metadata yt-formatted-string');
        if (titleEl) return titleEl.textContent.trim();
        return document.title.replace(' - YouTube', '').trim();
    };

    __.applyTimeShift = function (ms) {
        __.timeShiftMs = ms;
        const tsInput = document.getElementById('ts-input');
        if (tsInput) tsInput.value = ms;
    };

    __.getShiftedSubs = function () {
        if (__.timeShiftMs === 0) return __.subtitles;
        const shiftSec = __.timeShiftMs / 1000;
        return __.subtitles.map(sub => ({
            ...sub,
            start: Math.max(0, sub.start + shiftSec),
            end: Math.max(0, sub.end + shiftSec)
        }));
    };

    __.buildShadow = function (ow, bl, oc) {
        if (ow > 0 || bl > 0) {
            return bl > 0 ? `0 0 ${bl}px ${oc}` : 'none';
        }
        return 'none';
    };

    __.buildDeepGlow = function (ow, bl, oc) {
        const layers = [];
        for (let i = 1; i <= 4; i++) {
            const spread = ow * i * 1.2;
            const blur = bl * i * 1.2;
            layers.push(`${spread}px ${spread}px ${blur}px ${oc}, -${spread}px -${spread}px ${blur}px ${oc}`);
        }
        layers.push(`0 0 ${bl}px ${oc}`);
        return layers.join(', ');
    };

    __.getActiveVideoRect = function () {
        const video = document.querySelector('video');
        if (!video || !video.videoWidth || !video.videoHeight) return null;
        const vw = video.videoWidth, vh = video.videoHeight;
        const ow = video.offsetWidth, oh = video.offsetHeight;
        if (!vw || !vh) return null;
        const videoAspect = vw / vh;
        const containerAspect = ow / oh;
        let rectW, rectH, rectX, rectY;
        if (containerAspect > videoAspect) {
            rectH = oh;
            rectW = oh * videoAspect;
            rectX = (ow - rectW) / 2;
            rectY = 0;
        } else {
            rectW = ow;
            rectH = ow / videoAspect;
            rectX = 0;
            rectY = (oh - rectH) / 2;
        }
        // Offset from the player container
        const player = video.closest('.html5-video-player');
        const vRect = video.getBoundingClientRect();
        const pRect = player ? player.getBoundingClientRect() : vRect;
        const offsetLeft = vRect.left - pRect.left;
        const offsetTop = vRect.top - pRect.top;
        return {
            top: offsetTop + rectY,
            left: offsetLeft + rectX,
            width: rectW,
            height: rectH,
            bottom: offsetTop + rectY + rectH,
            right: offsetLeft + rectX + rectW
        };
    };
})();
