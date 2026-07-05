(function () {
    'use strict';

    // ============ CSS + FONT SETUP ============
    const fontUrl = chrome.runtime.getURL("vnf-comic-sans.ttf");
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
        @font-face { font-family: 'VNF-Comic Sans'; src: url('${fontUrl}'); }
        #sub-pro-popup { zoom: 1.0; transition: zoom 0.08s ease-out; }
        #sub-pro-popup * { font-family: 'Segoe UI', Roboto, sans-serif !important; box-sizing: border-box; background: transparent; }
        #sub-pro-popup input, #sub-pro-popup select, #sub-pro-popup button, #sub-pro-popup textarea { }
        .g-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
        .g-row label { width: 70px; color: #aaa; font-weight: bold; font-size: .75em; }
        .g-row input[type="range"] { flex: 1; margin: 0 6px; height: 3px; cursor: pointer; }
        .num-in { background:rgba(255,255,255,0.1) !important; border:1px solid #444; color:#fff; width:43px; max-width:43px; min-height:24px; text-align:center; border-radius:3px; padding:2px 3px; font-size:.85em; }
        .hex-in { background:rgba(255,255,255,0.1) !important; border:1px solid #444; color:#00ffaa; font-size:.8em; min-width:3.8em; text-align:center; border-radius:2px; }
        .k-tabs { display: flex; gap: 2px; margin-top: 5px; }
        .k-tab-btn { flex: 1; padding: 4px; background: rgba(255,255,255,0.1); border: 1px solid #444; color: #888; cursor: pointer; }
        .k-tab-btn.active { background: #3ea6ff; color: #fff; border-bottom: none; }
        .k-tab-content { background: rgba(255,255,255,0.03); padding: 8px; border: 1px solid #444; border-top: none; }
        .style-item { border:1px solid rgba(255,255,255,0.1); border-radius:8px; margin-bottom:5px; background:rgba(255,255,255,0.03); overflow:hidden; }
        .style-head { padding:6px 10px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); }
        .style-body { padding:10px; display:none; border-top:1px dashed rgba(255,255,255,0.1); }
        .one-line { display: flex; align-items: center; justify-content: space-between; gap: 4px; width: 100%; margin-top: 5px; font-size: 0.9em; color:#ccc; }
        .format-btn { background:rgba(255,255,255,0.1); border:1px solid #444; color:#fff; padding:2px 7px; cursor:pointer; border-radius:3px; font-weight:bold; font-size:.8em; }
        .format-btn.active { background:#3ea6ff !important; border-color:#fff !important; color:#fff !important; }
        input[type="color"] { width:31px; height:25px; border:1px solid #444; background:rgba(255,255,255,0.1); padding:2px; cursor:pointer; border-radius:3px; }
        .status-tag { font-size: 9px; padding: 1px 4px; border-radius: 3px; font-weight: bold; }
        .status-ok { color: #00ffaa; border: 1px solid #00ffaa; }
        .status-none { color: #ff4e45; border: 1px solid #ff4e45; }
        .btn-apply { background:#ffaa00; color:#000; border:none; padding:1px 8px; border-radius:3px; font-size:10px; font-weight:bold; cursor:pointer; }
        .syllable { display: inline-block; transition: transform 0.15s ease-out; white-space: pre; }
        #ts-input { background:rgba(255,255,255,0.1) !important; border:1px solid #ffaa00; color:#ffaa00; font-size:11px; font-weight:bold; min-width:60px; width:auto; text-align:center; border-radius:3px; padding:1px 4px; }
        #fontSelect { background:#222 !important; color:#fff !important; border:1px solid #555 !important; border-radius:3px; }
        #fontSelect option { background:#222; color:#fff; }
        .pill-tabs { display:flex; gap:4px; margin-bottom:8px; }
        .pill-tab { flex:1; padding:6px 4px; border-radius:20px; border:1px solid rgba(255,255,255,0.15); background:rgba(255,255,255,0.05); color:#aaa; font-size:10px; font-weight:bold; cursor:pointer; text-align:center; transition:all .2s ease; user-select:none; }
        .pill-tab:hover { background:rgba(255,255,255,0.1); color:#fff; }
        .pill-tab.active { background:#3ea6ff; border-color:#3ea6ff; color:#fff; box-shadow:0 0 12px rgba(62,166,255,0.3); }
        .pill-panel { display:none; animation:fadeIn .2s ease; }
        .pill-panel.open { display:block; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        input[type="range"] { -webkit-appearance:none; appearance:none; height:4px; background:#444; border-radius:4px; outline:none; margin:0 8px; }
        input[type="range"]::-webkit-slider-runnable-track { height:4px; background:#444; border-radius:4px; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:12px; height:12px; border-radius:50%; background:#3ea6ff; border:2px solid #fff; cursor:pointer; margin-top:-4px; transition:transform .15s; }
        input[type="range"]::-webkit-slider-thumb:hover { transform:scale(1.2); }
        input[type="range"]::-moz-range-track { height:4px; background:#444; border-radius:4px; }
        input[type="range"]::-moz-range-thumb { width:12px; height:12px; border-radius:50%; background:#3ea6ff; border:2px solid #fff; cursor:pointer; }
    `;
    document.head.appendChild(styleEl);

    // Fullscreen change listener
    document.addEventListener('fullscreenchange', () => {
        if (window.__SUB) window.__SUB.isFullscreen = !!document.fullscreenElement;
    });

    // ============ IMPORTANT: load split JS files ============
    // All 5 files are listed as content_scripts in manifest.json.
    // Chrome loads them in order in the same isolated world,
    // so this file runs first, then globals.js, parser.js, etc.
})();