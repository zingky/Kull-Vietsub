(function () {
    'use strict';

    const __ = window.__SUB;

    // ============ MIGRATE OLD CACHED SUBS TO NEW FORMAT ============
    function migrateSubs(subs) {
        if (!Array.isArray(subs)) return subs;
        subs.forEach(sub => {
            if (!sub.syllableGroups || sub.syllableGroups.length === 0) {
                const text = sub.text || '';
                const lines = text.split('\n');
                sub.syllableGroups = lines.map(l => ({
                    syllables: sub.syllables || [],
                    text: l
                }));
                if (sub.syllableGroups.length === 0) {
                    sub.syllableGroups = [{ syllables: sub.syllables || [], text: '' }];
                }
            }
        });
        return subs;
    }

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
                            const apiUrl = `https://api.github.com/repos/${src.repo}/contents/${src.path}?ref=${src.branch}`;
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

    // Flag to prevent autoFetchSub from overwriting user-initiated loads
    __.userInitiatedLoad = false;

    // ============ LOAD ASS FROM GITHUB BY NAME (try all sources) ============
    __.loadAssFromGitHub = async function (filename) {
        __.userInitiatedLoad = true; // prevent autoFetchSub from overwriting
        const sources = __.getEnabledSources();
        for (const src of sources) {
            try {
                const url = `https://raw.githubusercontent.com/${src.repo}/${src.branch}/${src.path}/${filename}`;
                console.log('Trying to load:', url);
                const resp = await fetch(url);
                if (!resp.ok) {
                    console.log('HTTP error:', resp.status, 'for source:', src.repo, src.path);
                    throw new Error('HTTP ' + resp.status);
                }
                const text = await resp.text();
                if (!text || text.length < 50 || text.includes('<!DOCTYPE') || text.includes('<html')) {
                    console.log('Invalid content from source:', src.repo, src.path);
                    throw new Error('Not valid ASS content');
                }
                __.parseASS(text);
                // Save to cache so subsequent auto checks don't re-fetch
                const id = __.getVideoId();
                if (id && __.subtitles.length) {
                    chrome.storage.local.set({ [id]: { subtitles: __.subtitles, playResX: __.playResX, playResY: __.playResY, styleSettings: __.styleSettings } });
                }
                const status = document.getElementById('auto-sub-status');
                if (status) { status.className = "status-tag status-ok"; status.innerText = "Loaded ✅"; }
                return true;
            } catch (e) {
                console.log('Failed source:', src.repo, e.message);
            }
        }
        const status = document.getElementById('auto-sub-status');
        if (status) status.innerText = "Error 🚫";
        return false;
    };

    // ============ AUTO FETCH (by video ID - try all sources) ============
    __.autoFetchSub = async function (id) {
        if (!id) return;
        // Wait a bit for user to possibly initiate a manual load first
        await new Promise(r => setTimeout(r, 800));
        // If user already loaded manually, skip
        if (__.userInitiatedLoad) {
            console.log('autoFetchSub: user initiated load, skipping');
            return;
        }
        const sources = __.getEnabledSources();
        for (const src of sources) {
            try {
                const apiUrl = `https://api.github.com/repos/${src.repo}/contents/${src.path}?ref=${src.branch}`;
                const files = await (await fetch(apiUrl)).json();
                if (!Array.isArray(files)) continue;
                const found = files.find(f => f.name.startsWith(id) && f.name.endsWith('.ass'));
                if (found) {
                    const url = `https://raw.githubusercontent.com/${src.repo}/${src.branch}/${src.path}/${found.name}`;
                    const resp = await fetch(url);
                    if (!resp.ok) throw new Error('HTTP ' + resp.status);
                    const text = await resp.text();
                    if (!text || text.length < 50 || text.includes('<!DOCTYPE') || text.includes('<html')) {
                        throw new Error('Invalid content');
                    }
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
                const data = result[id];
                if (Array.isArray(data.subtitles)) {
                    migrateSubs(data.subtitles);
                }
                __.subtitles = data.subtitles;
                __.playResX = data.playResX;
                __.playResY = data.playResY;
                __.styleSettings = data.styleSettings;
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

    chrome.runtime.onMessage.addListener((req) => {
        if (req.action === "toggle_popup" && typeof __.togglePopup === 'function') __.togglePopup();
    });

    document.addEventListener('mousedown', function (e) {
        if (e.target.closest('#sub-ultra-btn')) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof __.togglePopup === 'function') __.togglePopup();
        }
    }, true);

    if (typeof __.startEngine === 'function') __.startEngine();

    setInterval(maintainUI, 1000);
})();