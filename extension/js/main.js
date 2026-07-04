(function () {
    'use strict';

    const __ = window.__SUB;

    // ============ FETCH FILE LIST FROM GITHUB ============
    __.fetchFileList = async function () {
        try {
            const apiUrl = `https://api.github.com/repos/${__.GITHUB_REPO}/contents/${__.GITHUB_PATH}`;
            const files = await (await fetch(apiUrl)).json();
            if (Array.isArray(files)) {
                __.assFileCache = files.filter(f => f.name.endsWith('.ass')).map(f => f.name);
            }
        } catch (e) {
            __.assFileCache = [];
        }
        return __.assFileCache;
    };

    // ============ LOAD ASS FROM GITHUB BY NAME ============
    __.loadAssFromGitHub = async function (filename) {
        try {
            const text = await (await fetch(`https://cdn.jsdelivr.net/gh/${__.GITHUB_REPO}@main/${__.GITHUB_PATH}/${filename}`)).text();
            __.parseASS(text);
            const status = document.getElementById('auto-sub-status');
            if (status) { status.className = "status-tag status-ok"; status.innerText = "Loaded ✅"; }
            return true;
        } catch (e) {
            const status = document.getElementById('auto-sub-status');
            if (status) status.innerText = "Error 🚫";
            return false;
        }
    };

    // ============ AUTO FETCH (by video ID - legacy) ============
    __.autoFetchSub = async function (id) {
        if (!id) return;
        try {
            const apiUrl = `https://api.github.com/repos/${__.GITHUB_REPO}/contents/${__.GITHUB_PATH}`;
            const files = await (await fetch(apiUrl)).json();
            const found = files.find(f => f.name.startsWith(id) && f.name.endsWith('.ass'));
            if (found) {
                const text = await (await fetch(`https://cdn.jsdelivr.net/gh/${__.GITHUB_REPO}@main/${__.GITHUB_PATH}/${found.name}`)).text();
                __.parseASS(text);
                document.getElementById('auto-sub-status').className = "status-tag status-ok";
                document.getElementById('auto-sub-status').innerText = "Auto-Synced ✅";
            } else {
                document.getElementById('auto-sub-status').innerText = "Not Found ❌";
            }
        } catch (e) {
            document.getElementById('auto-sub-status').innerText = "Error 🚫";
        }
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
                pointerEvents: 'none', zIndex: '99'
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