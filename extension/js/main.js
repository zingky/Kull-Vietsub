(function () {
    'use strict';

    const __ = window.__SUB;

    // ============ FETCH FILE LIST FROM ALL ENABLED SOURCES ============
    __.fetchFileList = async function (forceFetch = false) {
        if (!forceFetch && __.assFileCache && __.assFileCache.length > 0) {
            return __.assFileCache;
        }
        return new Promise((resolve) => {
            chrome.storage.local.get(['github_file_cache'], async (res) => {
                if (!forceFetch && res.github_file_cache && res.github_file_cache.length > 0) {
                    __.assFileCache = res.github_file_cache;
                    resolve(__.assFileCache);
                } else {
                    const allFiles = [];
                    const sources = __.getEnabledSources();
                    for (const src of sources) {
                        try {
                            const apiUrl = `https://api.github.com/repos/${src.repo}/contents/${src.path}`;
                            const files = await (await fetch(apiUrl)).json();
                            if (Array.isArray(files)) {
                                const assFiles = files.filter(f => f.name.endsWith('.ass')).map(f => f.name);
                                assFiles.forEach(f => { if (!allFiles.includes(f)) allFiles.push(f); });
                            }
                        } catch (e) {
                            // skip failed source
                        }
                    }
                    __.assFileCache = allFiles;
                    chrome.storage.local.set({ 'github_file_cache': __.assFileCache });
                    resolve(__.assFileCache);
                }
            });
        });
    };

    // ============ LOAD ASS FROM GITHUB BY NAME (try all sources) ============
    __.loadAssFromGitHub = async function (filename) {
        const sources = __.getEnabledSources();
        for (const src of sources) {
            try {
                const text = await (await fetch(`https://cdn.jsdelivr.net/gh/${src.repo}@main/${src.path}/${filename}`)).text();
                __.parseASS(text);
                const status = document.getElementById('auto-sub-status');
                if (status) { status.className = "status-tag status-ok"; status.innerText = "Loaded ✅"; }
                return true;
            } catch (e) {
                // try next source
            }
        }
        const status = document.getElementById('auto-sub-status');
        if (status) status.innerText = "Error 🚫";
        return false;
    };

    // ============ AUTO FETCH (by video ID - try all sources) ============
    __.autoFetchSub = async function (id) {
        if (!id) return;
        const sources = __.getEnabledSources();
        for (const src of sources) {
            try {
                const apiUrl = `https://api.github.com/repos/${src.repo}/contents/${src.path}`;
                const files = await (await fetch(apiUrl)).json();
                if (!Array.isArray(files)) continue;
                const found = files.find(f => f.name.startsWith(id) && f.name.endsWith('.ass'));
                if (found) {
                    const text = await (await fetch(`https://cdn.jsdelivr.net/gh/${src.repo}@main/${src.path}/${found.name}`)).text();
                    __.parseASS(text);
                    document.getElementById('auto-sub-status').className = "status-tag status-ok";
                    document.getElementById('auto-sub-status').innerText = "Auto-Synced ✅";
                    return;
                }
            } catch (e) {
                // try next source
            }
        }
        document.getElementById('auto-sub-status').innerText = "Not Found ❌";
    };

    __.checkAndLoadVideoSub = async function () {
        const id = __.getVideoId();
        if (!id || id === __.currentVideoId) return;
        __.subtitles = [];
        __.styleSettings = {};
        const layer = document.getElementById('sub-ultra-layer');
        if (layer) layer.innerHTML = '';
        __.currentVideoId = id;
        __.timeShiftMs = 0;
        const tsInput = document.getElementById('ts-input');
        if (tsInput) tsInput.value = '0';
        const idDisp = document.getElementById('yt-id-display');
        if (idDisp) idDisp.innerText = id;
        chrome.storage.local.get([id], (result) => {
            if (result[id]) {
                __.subtitles = result[id].subtitles;
                __.playResX = result[id].playResX;
                __.playResY = result[id].playResY;
                __.styleSettings = result[id].styleSettings;
                if (typeof __.renderStyles === 'function') __.renderStyles();
                document.getElementById('auto-sub-status').innerText = "Cached 💾";
            } else {
                __.autoFetchSub(id);
            }
        });
    };

    // ============ MAINTAIN UI ============
    function maintainUI() {
        const controls = document.querySelector('.ytp-right-controls');
        const player = document.querySelector('.html5-video-player');
        if (!controls || !player) return;
        if (!document.getElementById('sub-ultra-btn')) {
            const btn = document.createElement('div');
            btn.id = 'sub-ultra-btn';
            btn.className = 'ytp-button';
            btn.innerHTML = `<div style="font-weight:bold; font-size:14px; text-align:center; line-height:48px; color:#fff; cursor:pointer;">SUB</div>`;
            controls.prepend(btn);
        }
        if (!document.getElementById('sub-ultra-layer')) {
            const layer = document.createElement('div');
            layer.id = "sub-ultra-layer";
            Object.assign(layer.style, {
                position: 'absolute', left: '0', top: '0', width: '100%', height: '100%',
                pointerEvents: 'none', zIndex: '40'
            });
            player.appendChild(layer);
        }
        if (typeof __.createUI === 'function') __.createUI();
        __.checkAndLoadVideoSub();
    }

    // Listen for popup toggle from background
    chrome.runtime.onMessage.addListener((req) => {
        if (req.action === "toggle_popup" && typeof __.togglePopup === 'function') __.togglePopup();
    });

    // Listen for SUB button mousedown
    document.addEventListener('mousedown', function (e) {
        if (e.target.closest('#sub-ultra-btn')) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof __.togglePopup === 'function') __.togglePopup();
        }
    }, true);

    // Start engine loop
    if (typeof __.startEngine === 'function') __.startEngine();

    // Monitor for YouTube player changes
    setInterval(maintainUI, 1000);
})();