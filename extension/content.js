(function () {
    'use strict';

    const STORAGE_KEY_GLOBAL = 'yt_sub_pro_v90';
    const GITHUB_REPO = "zingky/Kull-Vietsub";
    const GITHUB_PATH = "subs";

    // ---------------------------------------------------------
    // VÙNG 1: BIẾN TOÀN CỤC VÀ CẤU HÌNH GỐC
    // ---------------------------------------------------------
    const DEFAULTS = {
        useLibass: false,
        fontSize: 23, outlineWidth: 1.5, blur: 2, color1: '#ffffff', color3: '#000000',
        useBox: false, boxColor: '#000000', boxOpacity: 0.5, fontFamily: 'VNF-Comic Sans',
        fadIn: 200, fadOut: 200, popupOpacity: 0.95, popupFontSize: 13,
        posX: 350, posY: 100, width: 820, height: 600,
        isBold: true, isItalic: false, isUnderline: false, isStrike: false,
        kEnable: true,
        kPre:    { c1: '#ffffff', c3: '#000000', outl: 1.5, blur: 2, zoom: 1.0 },
        kActive: { c1: '#ffffff', c3: '#000000', outl: 1.5, blur: 2, zoom: 1.3, zIn: 100, zOut: 100 },
        kPost:   { c1: '#ffffff', c3: '#000000', outl: 1.5, blur: 2, zoom: 1.0 }
    };

    let globalSettings = JSON.parse(localStorage.getItem(STORAGE_KEY_GLOBAL)) || { ...DEFAULTS };
    if (typeof globalSettings.useLibass === 'undefined') globalSettings.useLibass = false;

    let styleSettings = {};
    let subtitles = [], playResX = 384, playResY = 288, currentVideoId = "";
    let currentRawAss = "";
    let isFullscreen = false;

    document.addEventListener('fullscreenchange', () => isFullscreen = !!document.fullscreenElement);
    const fontUrl = chrome.runtime.getURL("vnf-comic-sans.ttf");


    // ---------------------------------------------------------
    // VÙNG 2: CHẾ ĐỘ LIBASS OFF (HTML/CSS RENDERER CŨ)
    // Giữ nguyên toàn bộ logic cũ của bạn, đã fix lỗi tọa độ X Y
    // ---------------------------------------------------------
    const HTML_RENDERER = {
        render: function(video, layer) {
            if (!video || !layer || subtitles.length === 0) return;
            
            const time = video.currentTime; 
            const active = subtitles.filter(s => time >= s.start && time <= s.end);
            layer.innerHTML = '';
            
            active.forEach(sub => {
                const s = styleSettings[sub.style] || { visible: true }; 
                if (!s.visible) return;
                
                const isO = s.override;
                const fs = (isO ? s.fontSize : globalSettings.fontSize) + (isFullscreen ? 10 : 0);
                const ow = isO ? s.outlineWidth : globalSettings.outlineWidth;
                const bl = isO ? s.blur : globalSettings.blur;
                const oc = s.color3 || globalSettings.color3;
                const c1 = isO ? s.color1 : globalSettings.color1;
                const ub = isO ? s.useBox : globalSettings.useBox;
                const bc = isO ? s.boxColor : globalSettings.boxColor;
                const bo = isO ? s.boxOpacity : globalSettings.boxOpacity;
                
                // Lấy tọa độ (Ưu tiên tọa độ trong tag \pos nếu có, nếu không lấy theo thanh trượt)
                const posX = sub.filePos ? sub.filePos.x : (s.posX !== undefined ? s.posX : playResX/2);
                const posY = sub.filePos ? sub.filePos.y : (s.posY !== undefined ? s.posY : playResY-35);
                
                let opacity = 1, fadIn = globalSettings.fadIn / 1000, fadOut = globalSettings.fadOut / 1000;
                if (time - sub.start < fadIn) opacity = (time - sub.start) / fadIn; 
                else if (sub.end - time < fadOut) opacity = (sub.end - time) / fadOut;
                
                const div = document.createElement('div');
                div.style.cssText = `position:absolute; left:${(posX/playResX*100)}%; top:${(posY/playResY*100)}%; transform:translate(-50%, -50%); font-size:${fs}px; font-family:'${globalSettings.fontFamily}'; font-weight:${globalSettings.isBold?'bold':'normal'}; font-style:${globalSettings.isItalic?'italic':'normal'}; text-decoration:${globalSettings.isUnderline?'underline':''} ${globalSettings.isStrike?'line-through':''}; text-align:center; white-space:nowrap; pointer-events:none; width:calc(100% - 20px); z-index:99; opacity:${Math.max(0, opacity)};`;
                
                const spanWrap = document.createElement('span');
                if (ub) { spanWrap.style.backgroundColor = hexToRgba(bc, bo); spanWrap.style.padding = '4px 10px'; spanWrap.style.borderRadius = '6px'; }
                
                if (globalSettings.kEnable && sub.syllables.length > 0) {
                    const lineElapsed = (time - sub.start) * 1000;
                    sub.syllables.forEach(syl => {
                        const span = document.createElement('span'); span.innerText = syl.text; span.className = 'syllable';
                        let ks, zoom = 1;
                        if (lineElapsed < syl.timeStart) { ks = globalSettings.kPre; }
                        else if (lineElapsed >= syl.timeStart && lineElapsed < syl.timeEnd) {
                            ks = globalSettings.kActive;
                            const sEl = lineElapsed - syl.timeStart, sRem = syl.timeEnd - lineElapsed, zIn = ks.zIn || 100, zOut = ks.zOut || 100;
                            if (sEl < zIn) zoom = 1 + (ks.zoom - 1) * (sEl / zIn);
                            else if (sRem < zOut) zoom = 1 + (ks.zoom - 1) * (sRem / zOut);
                            else zoom = ks.zoom;
                        } else { ks = globalSettings.kPost; }
                        Object.assign(span.style, { color: ks.c1, transform: `scale(${zoom})`, textShadow: `0 0 ${ks.blur}px ${ks.c3}, ${ks.outl}px ${ks.outl}px ${ks.blur}px ${ks.c3}, -${ks.outl}px -${ks.outl}px ${ks.blur}px ${ks.c3}, ${ks.outl}px -${ks.outl}px ${ks.blur}px ${ks.c3}, -${ks.outl}px ${ks.outl}px ${ks.blur}px ${ks.c3}` });
                        spanWrap.appendChild(span);
                    });
                } else {
                    const shadow = `0 0 ${bl}px ${oc}, ${ow}px ${ow}px ${bl}px ${oc}, -${ow}px -${ow}px ${bl}px ${oc}, ${ow}px -${ow}px ${bl}px ${oc}, -${ow}px ${ow}px ${bl}px ${oc}`;
                    spanWrap.innerText = sub.text; spanWrap.style.color = c1; spanWrap.style.textShadow = shadow;
                }
                div.appendChild(spanWrap); layer.appendChild(div);
            });
        }
    };


    // ---------------------------------------------------------
    // VÙNG 3: CHẾ ĐỘ LIBASS ON (DÙNG SUBTITLES-OCTOPUS TRONG KHUNG RIÊNG)
    // ---------------------------------------------------------
    const LIBASS_RENDERER = {
        instance: null,
        workerBlobUrl: null,

        // Hàm tạo Blob ảo để qua mặt CSP của YouTube
        createWorkerUrl: async function() {
            if (this.workerBlobUrl) return this.workerBlobUrl;
            try {
                const workerUrl = chrome.runtime.getURL('lib/subtitles-octopus-worker.js');
                const wasmUrl = chrome.runtime.getURL('lib/subtitles-octopus-worker.wasm');
                const response = await fetch(workerUrl);
                let text = await response.text();
                // Ép Worker nạp đúng file Wasm của Extension
                text = text.replace(/subtitles-octopus-worker\.wasm/g, wasmUrl);
                const blob = new Blob([text], { type: 'application/javascript' });
                this.workerBlobUrl = URL.createObjectURL(blob);
                return this.workerBlobUrl;
            } catch (e) {
                console.error("Lỗi tạo Blob Worker Libass:", e);
                return chrome.runtime.getURL('lib/subtitles-octopus-worker.js'); // fallback
            }
        },

        setupContainer: function() {
            let container = document.getElementById('libass-external-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'libass-external-container';
                Object.assign(container.style, {
                    position: 'fixed', bottom: '20px', left: '20px', width: '500px', height: '281px',
                    backgroundColor: '#000', border: '2px solid #00ffaa', zIndex: '999999',
                    boxShadow: '0 0 10px #000', borderRadius: '8px', overflow: 'hidden'
                });
                container.innerHTML = `
                    <div style="background:#00ffaa; color:#000; font-size:10px; font-weight:bold; padding:2px 5px; position:absolute; top:0; left:0; z-index:10;">LIBASS ENGINE (VLC MODE)</div>
                    <canvas id="libass-canvas" style="width:100%; height:100%; display:block;"></canvas>
                `;
                document.body.appendChild(container);
            }
            container.style.display = globalSettings.useLibass ? 'block' : 'none';
            return container;
        },

        init: async function(assText) {
            this.setupContainer();
            if (!globalSettings.useLibass || !assText) return;

            if (this.instance) {
                try { this.instance.dispose(); } catch(e){}
                this.instance = null;
            }

            const wUrl = await this.createWorkerUrl();

            try {
                this.instance = new SubtitlesOctopus({
                    canvas: document.getElementById('libass-canvas'),
                    subContent: assText,
                    fonts: [fontUrl],
                    workerUrl: wUrl, 
                    legacyWorkerUrl: chrome.runtime.getURL('lib/subtitles-octopus-worker-legacy.js'),
                    onReady: () => console.log("LIBASS WORKER ĐÃ KHỞI ĐỘNG THÀNH CÔNG!")
                });
            } catch (e) { console.error("Lỗi khởi tạo Libass:", e); }
        },

        sync: function(video) {
            if (this.instance && video) {
                this.instance.setCurrentTime(video.currentTime);
            }
        },

        destroy: function() {
            if (this.instance) { try { this.instance.dispose(); } catch(e){} this.instance = null; }
            const container = document.getElementById('libass-external-container');
            if (container) container.style.display = 'none';
        }
    };


    // ---------------------------------------------------------
    // VÙNG 4: PARSE FILE VÀ CÁC HÀM XỬ LÝ DỮ LIỆU
    // ---------------------------------------------------------
    function parseASS(text) {
        const lines = text.split(/\r?\n/); subtitles = [];
        const resXMatch = text.match(/PlayResX:\s*(\d+)/i), resYMatch = text.match(/PlayResY:\s*(\d+)/i);
        playResX = resXMatch ? parseInt(resXMatch[1]) : 384; playResY = resYMatch ? parseInt(resYMatch[1]) : 288;
        let section = "";
        for (let line of lines) {
            line = line.trim();
            if (line.startsWith('[')) { section = line.toLowerCase(); continue; }
            if (section.includes('styles') && line.startsWith('Style:')) {
                const p = line.substring(6).split(','); const name = p[0].trim();
                const c1 = assToHex(p[3]), c3 = assToHex(p[5]);
                let defX = playResX/2, defY = (name.toLowerCase().includes('roma'))?80:(name.toLowerCase().includes('kanji')?135:playResY-80);
                
                // Giữ lại cài đặt cũ nếu đã chỉnh sửa, nếu chưa có thì gán mặc định
                if (!styleSettings[name]) {
                    styleSettings[name] = { color1: c1, color3: c3, posX: defX, posY: defY, fontSize: 23, outlineWidth: 1.5, blur: 2, override: false, visible: true };
                }
            }
            if (section.includes('events') && line.startsWith('Dialogue:')) {
                const p = line.substring(9).split(','), rawText = p.slice(9).join(','), pos = rawText.match(/\\pos\(([\d.]+),([\d.]+)\)/);
                const syllables = []; let runningTime = 0, kRegex = /\{(?:\\[kK][fpo]?)(\d+)\}([^{]*)/g, m;
                while ((m = kRegex.exec(rawText)) !== null) { const d = parseInt(m[1]) * 10; syllables.push({ timeStart: runningTime, timeEnd: runningTime + d, text: m[2] }); runningTime += d; }
                subtitles.push({ start: toTime(p[1]), end: toTime(p[2]), style: p[3].trim(), syllables, text: syllables.length > 0 ? "" : rawText.replace(/\{[^}]+\}/g, '').replace(/\\N/gi, '\n'), filePos: pos ? {x: parseFloat(pos[1]), y: parseFloat(pos[2])} : null });
            }
        }
        saveSubToStorage(); renderStyles();
    }

    async function autoFetchSub(id) {
        if (!id) return;
        try {
            const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_PATH}`;
            const files = await (await fetch(apiUrl)).json();
            const found = files.find(f => f.name.startsWith(id) && f.name.endsWith('.ass'));
            if (found) {
                const text = await (await fetch(`https://cdn.jsdelivr.net/gh/${GITHUB_REPO}@main/${GITHUB_PATH}/${found.name}`)).text();
                currentRawAss = text; parseASS(text); 
                if (globalSettings.useLibass) LIBASS_RENDERER.init(text);
                document.getElementById('auto-sub-status').className = "status-tag status-ok"; document.getElementById('auto-sub-status').innerText = "Auto-Synced ✅";
            } else { document.getElementById('auto-sub-status').innerText = "Not Found ❌"; }
        } catch (e) { document.getElementById('auto-sub-status').innerText = "Error 🚫"; }
    }

    async function checkAndLoadVideoSub() {
        const id = getVideoId(); if (!id || id === currentVideoId) return;
        subtitles = []; document.getElementById('sub-ultra-layer').innerHTML = ''; currentVideoId = id;
        const idDisp = document.getElementById('yt-id-display'); if(idDisp) idDisp.innerText = id;
        chrome.storage.local.get([id], (result) => {
            if (result[id]) { 
                subtitles = result[id].subtitles; playResX = result[id].playResX; playResY = result[id].playResY; 
                if (result[id].styleSettings) styleSettings = result[id].styleSettings; 
                currentRawAss = result[id].rawAssContent || ""; 
                renderStyles(); 
                if (globalSettings.useLibass && currentRawAss) LIBASS_RENDERER.init(currentRawAss);
                document.getElementById('auto-sub-status').innerText = "Cached 💾"; document.getElementById('auto-sub-status').className = "status-tag status-ok";
            } else { autoFetchSub(id); }
        });
    }

    async function saveSubToStorage() {
        const id = getVideoId(); 
        if (id && subtitles.length) chrome.storage.local.set({ [id]: { subtitles, playResX, playResY, styleSettings, rawAssContent: currentRawAss } });
    }


    // ---------------------------------------------------------
    // VÙNG 5: GIAO DIỆN (UI) VÀ SỰ KIỆN BẤM NÚT
    // ---------------------------------------------------------
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
        @font-face { font-family: 'VNF-Comic Sans'; src: url('${fontUrl}'); }
        #sub-pro-popup * { font-family: 'Segoe UI', Roboto, sans-serif !important; box-sizing: border-box; background: transparent; }
        .g-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; font-size: 1em; }
        .g-row label { width: 95px; color: #aaa; font-weight: bold; font-size: 0.9em; }
        .g-row input[type="range"] { flex: 1; margin: 0 10px; height: 4px; cursor: pointer; }
        .num-in { background:rgba(255,255,255,0.1) !important; border:1px solid #444; color:#fff; font-size:10px; width:50px; height:22px; text-align:center; border-radius:3px; }
        .hex-in { background:rgba(255,255,255,0.1) !important; border:1px solid #444; color:#00ffaa; font-size:9px; width:65px; text-align:center; border-radius:2px; }
        .k-tabs { display: flex; gap: 2px; margin-top: 5px; }
        .k-tab-btn { flex: 1; padding: 4px; font-size: 10px; background: rgba(255,255,255,0.1); border: 1px solid #444; color: #888; cursor: pointer; }
        .k-tab-btn.active { background: #3ea6ff; color: #fff; border-bottom: none; }
        .k-tab-content { background: rgba(255,255,255,0.03); padding: 8px; border: 1px solid #444; border-top: none; }
        .style-item { border:1px solid rgba(255,255,255,0.1); border-radius:8px; margin-bottom:5px; background:rgba(255,255,255,0.03); overflow:hidden; }
        .style-head { padding:6px 10px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); }
        .style-body { padding:10px; display:none; border-top:1px dashed rgba(255,255,255,0.1); }
        .one-line { display: flex; align-items: center; justify-content: space-between; gap: 4px; width: 100%; margin-top: 5px; font-size: 0.9em; color:#ccc; }
        .format-btn { background:rgba(255,255,255,0.1); border:1px solid #444; color:#fff; padding:3px 10px; cursor:pointer; border-radius:3px; font-weight:bold; font-size: 12px; }
        .format-btn.active { background:#3ea6ff !important; border-color:#fff !important; color:#fff !important; }
        input[type="color"] { width:26px; height:20px; border:none; background:none; padding:0; cursor:pointer; }
        .status-tag { font-size: 10px; padding: 1px 5px; border-radius: 4px; font-weight: bold; }
        .status-ok { color: #00ffaa; border: 1px solid #00ffaa; }
        .status-none { color: #ff4e45; border: 1px solid #ff4e45; }
        .btn-apply { background:#ffaa00; color:#000; border:none; padding:1px 8px; border-radius:3px; font-size:10px; font-weight:bold; cursor:pointer; }
        .syllable { display: inline-block; transition: transform 0.15s ease-out; white-space: pre; }
    `;
    document.head.appendChild(styleEl);

    function createUI() {
        if (document.getElementById('sub-pro-popup')) return;
        const popup = document.createElement('div');
        popup.id = "sub-pro-popup";
        Object.assign(popup.style, {
            position: 'fixed', width: globalSettings.width+'px', height: globalSettings.height+'px', top: globalSettings.posY+'px', left: globalSettings.posX+'px',
            background: `rgba(15, 15, 15, ${globalSettings.popupOpacity})`, backdropFilter: 'blur(15px)', color: '#fff', zIndex: '2147483647', borderRadius: '12px', border: '1px solid #444',
            display: 'none', flexDirection: 'column', resize: 'both', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
        });

        popup.innerHTML = `
            <div id="sub-header" style="padding: 10px 15px; background: rgba(255,255,255,0.05); cursor: move; display: flex; justify-content: space-between; align-items: center; border-bottom:1px solid rgba(255,255,255,0.1);">
                <div style="display:flex; gap:5px; align-items:center;">
                    <button id="reset-ui" style="border:1px solid #555; color:#ccc; cursor:pointer; background:rgba(255,255,255,0.1); font-size:10px; padding:2px 8px; border-radius:4px;">🔄 RESET</button>
                    <!-- NÚT CHUYỂN CHẾ ĐỘ LIBASS -->
                    <button id="toggle-libass" style="border:1px solid ${globalSettings.useLibass ? '#00ffaa' : '#ff4e45'}; color:${globalSettings.useLibass ? '#00ffaa' : '#ff4e45'}; background:rgba(0,0,0,0.2); font-size:10px; padding:2px 8px; border-radius:4px; font-weight:bold; cursor:pointer;">LIBASS: ${globalSettings.useLibass ? 'ON' : 'OFF'}</button>
                </div>
                <span style="font-weight: bold; color: #3ea6ff; font-size: 12px; flex:1; text-align:center; padding: 0 10px;">AEGISUB LOADER by Gemini x Kull</span>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="display:flex; align-items:center; gap:5px;"><span style="font-size:9px; color:#aaa;">UI</span><input type="range" id="pop-ui-size" min="10" max="22" value="${globalSettings.popupFontSize}" style="width:40px;"></div>
                    <div style="display:flex; align-items:center; gap:5px;"><span style="font-size:10px; color:#aaa;">OPA</span><input type="range" id="pop-opacity" min="0.2" max="1" step="0.05" value="${globalSettings.popupOpacity}" style="width:40px;"></div>
                    <span id="closeSubPopup" style="cursor:pointer; font-size:22px; line-height:20px;">&times;</span>
                </div>
            </div>
            <div id="popup-inner" style="display:flex; flex:1; overflow:hidden; font-size:${globalSettings.popupFontSize}px;">
                <div style="flex:1; padding:15px; border-right:1px solid rgba(255,255,255,0.1); overflow-y:auto; background:transparent;">
                    <div style="margin-bottom:10px; background:rgba(255,255,255,0.03); padding:8px; border-radius:8px;">
                        <div class="g-row">ID: <span id="yt-id-display" style="color:#3ea6ff; font-weight:bold;">${getVideoId()||'N/A'}</span></div>
                        <div class="g-row" style="margin-bottom:10px;">
                            <span>Status: <span id="auto-sub-status" class="status-tag status-none">Searching...</span></span>
                            <button id="btn-re-auto" title="Fetch GitHub" style="background:none; border:1px solid #444; color:#aaa; cursor:pointer; font-size:10px; border-radius:3px; padding:1px 5px;">🔄 Fetch</button>
                        </div>
                        <div class="g-row"><b>Sub:</b> <input type="file" id="assFile" accept=".ass" style="font-size:10px; flex:1;"></div>
                        <div class="g-row"><b>Font:</b> <select id="fontSelect" style="background:#222; color:#fff; flex:1; border:1px solid #444; border-radius:4px;">
                            <option value="VNF-Comic Sans" ${globalSettings.fontFamily === 'VNF-Comic Sans'?'selected':''}>VNF-Comic Sans</option>
                            <option value="Arial" ${globalSettings.fontFamily === 'Arial'?'selected':''}>Arial</option>
                            <option value="Tahoma" ${globalSettings.fontFamily === 'Tahoma'?'selected':''}>Tahoma</option>
                            <option value="Verdana" ${globalSettings.fontFamily === 'Verdana'?'selected':''}>Verdana</option>
                            <option value="Segoe UI" ${globalSettings.fontFamily === 'Segoe UI'?'selected':''}>Segoe UI</option>
                        </select></div>
                        <div style="display:flex; gap:8px; justify-content:center; margin-top:8px;">
                            <button class="format-btn ${globalSettings.isBold?'active':''}" id="btn-isBold">B</button>
                            <button class="format-btn ${globalSettings.isItalic?'active':''}" id="btn-isItalic">I</button>
                            <button class="format-btn ${globalSettings.isUnderline?'active':''}" id="btn-isUnderline">U</button>
                            <button class="format-btn ${globalSettings.isStrike?'active':''}" id="btn-isStrike">S</button>
                        </div>
                    </div>
                    <div style="color: #00ffaa; font-weight: bold; font-size: 0.85em; margin-bottom: 8px;">GLOBAL SETTINGS</div>
                    ${renderGlobalRow('Size', 'fontSize', 10, 150, 1)} ${renderGlobalRow('Outline', 'outlineWidth', 0, 10, 0.1)} ${renderGlobalRow('Blur', 'blur', 0, 10, 0.1)}
                    
                    <div class="g-row" style="background: rgba(255,255,255,0.05); padding: 5px; border-radius: 4px;">
                        <div style="display:flex; align-items:center; gap:5px; flex:1;">Text(1c) <input type="color" id="g-color1" value="${globalSettings.color1}"></div>
                        <div style="display:flex; align-items:center; gap:5px; flex:1; justify-content:flex-end;">Outl(3c) <input type="color" id="g-color3" value="${globalSettings.color3}"></div>
                    </div>

                    <div class="g-row"><label>Fade:</label><div style="display:flex; gap:5px;"><input type="number" id="g-fadIn" value="${globalSettings.fadIn}" class="num-in"> <input type="number" id="g-fadOut" value="${globalSettings.fadOut}" class="num-in"></div></div>
                    
                    <div style="margin-top:10px; border-top:1px solid #444; padding-top:10px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <b style="color:#ffaa00; font-size:11px;">KARAOKE EFFECT</b>
                            <div style="display:flex; gap:5px; align-items:center;">
                                <button id="btn-k-apply" class="btn-apply">Apply</button>
                                <input type="checkbox" id="g-kEnable" ${globalSettings.kEnable?'checked':''}>
                            </div>
                        </div>
                        <div class="k-tabs">
                            <button class="k-tab-btn active" data-tab="pre">Pre</button><button class="k-tab-btn" data-tab="active">Active</button><button class="k-tab-btn" data-tab="post">Post</button>
                        </div>
                        <div class="k-tab-panels" id="k-tab-container-inner">
                            <div id="k-pre-panel" class="k-tab-content">${renderKTab('kPre')}</div>
                            <div id="k-active-panel" class="k-tab-content" style="display:none">${renderKTab('kActive')}</div>
                            <div id="k-post-panel" class="k-tab-content" style="display:none">${renderKTab('kPost')}</div>
                        </div>
                    </div>
                </div>
                <div id="styleListContainer" style="flex: 1.2; padding: 12px; overflow-y: auto; background: transparent;">
                    <div style="display:flex; align-items:center; margin-bottom: 8px;">
                        <span style="color: #ffaa00; font-weight: bold; font-size: 0.85em;">STYLES STRUCTURE</span>
                        <button id="btn-reset-styles-pos" style="background:none; border:none; color:#ffaa00; cursor:pointer; margin-left:10px;">⟳</button>
                    </div>
                    <div id="styleItems"></div>
                </div>
            </div>`;
        document.body.appendChild(popup);
        setupUIEvents(popup);
    }

    function renderKTab(key) {
        const obj = globalSettings[key]; const isAct = key === 'kActive';
        return `<div class="one-line" style="justify-content: space-between; flex-wrap:wrap;">
            <div>1c:<input type="color" data-k="${key}" data-type="c1" id="ui-k-${key}-c1" value="${obj.c1}"></div>
            <div>3c:<input type="color" data-k="${key}" data-type="c3" id="ui-k-${key}-c3" value="${obj.c3}"></div>
            O:<input type="number" data-k="${key}" data-type="outl" value="${obj.outl}" class="num-in" step="0.1">
            B:<input type="number" data-k="${key}" data-type="blur" value="${obj.blur}" class="num-in" step="0.1">
            Z:<input type="number" data-k="${key}" data-type="zoom" value="${obj.zoom}" class="num-in" step="0.1">
            ${isAct ? `<div class="one-line" style="width:100%; border-top:1px dashed #444; padding-top:5px; margin-top:5px;">
                Z-In:<input type="number" data-k="${key}" data-type="zIn" value="${obj.zIn}" class="num-in" step="10">
                Z-Out:<input type="number" data-k="${key}" data-type="zOut" value="${obj.zOut}" class="num-in" step="10">
            </div>` : ''}
        </div>`;
    }

    function renderGlobalRow(l, k, min, max, s) {
        return `<div class="g-row"><label>${l}</label><input type="range" id="g-${k}" min="${min}" max="${max}" step="${s}" value="${globalSettings[k]}"><input type="number" id="g-${k}Val" value="${globalSettings[k]}" step="${s}" class="num-in"></div>`;
    }

    // ĐÃ FIX SẮP XẾP STYLE: Romaji -> Kanji -> Vietsub -> Others
    function renderStyles() {
        const container = document.getElementById('styleItems'); if (!container) return;
        container.innerHTML = '';
        
        const priority = (n) => { 
            n = n.toLowerCase(); 
            if (n.includes('roma')) return 1;
            if (n.includes('kanji')) return 2;
            if (n.includes('viet')) return 3;
            return 99; 
        };
        
        Object.keys(styleSettings).sort((a,b) => priority(a) - priority(b)).forEach(sName => {
            const s = styleSettings[sName], item = document.createElement('div');
            item.className = 'style-item';
            item.innerHTML = `
                <div class="style-head"><span>${sName}</span><div style="display:flex;align-items:center;gap:12px;"><span class="eye-btn" style="cursor:pointer;opacity:${s.visible?1:0.3}">${s.visible?'👁️':'🚫'}</span><label><input type="checkbox" data-style="${sName}" data-type="override" ${s.override?'checked':''}> ⚙️</label><span>▼</span></div></div>
                <div class="style-body" style="display:${s.override?'block':'none'};">
                    <div class="g-row">X <input type="range" data-style="${sName}" data-type="posX" min="0" max="${playResX*2}" value="${s.posX}"> <input type="number" value="${s.posX}" class="num-in" data-style="${sName}" data-type="posX"></div>
                    <div class="g-row">Y <input type="range" data-style="${sName}" data-type="posY" min="0" max="${playResY*2}" value="${s.posY}"> <input type="number" value="${s.posY}" class="num-in" data-style="${sName}" data-type="posY"></div>
                    <div class="one-line">S:<input type="number" data-style="${sName}" data-type="fontSize" value="${s.fontSize}" class="num-in"> O:<input type="number" data-style="${sName}" data-type="outlineWidth" value="${s.outlineWidth}" class="num-in" step="0.1"> B:<input type="number" data-style="${sName}" data-type="blur" value="${s.blur}" class="num-in" step="0.1"> 1c:<input type="color" data-style="${sName}" data-type="color1" value="${s.color1}"> 3c:<input type="color" data-style="${sName}" data-type="color3" value="${s.color3}"></div>
                </div>`;
            item.querySelector('.eye-btn').onclick = (e) => { s.visible = !s.visible; e.target.innerText = s.visible?'👁️':'🚫'; e.target.style.opacity = s.visible?1:0.3; saveSubToStorage(); };
            item.querySelector('.style-head').onclick = (e) => { if (e.target.tagName !== 'INPUT' && !e.target.classList.contains('eye-btn') && !e.target.closest('label')) { const b = item.querySelector('.style-body'); b.style.display = b.style.display === 'none' ? 'block' : 'none'; } };
            container.appendChild(item);
        });
    }

    function setupUIEvents(popup) {
        const header = popup.querySelector('#sub-header');
        let isDragging = false, offset = [0, 0];
        header.onmousedown = (e) => { if(e.target.tagName==='BUTTON'||e.target.tagName==='INPUT') return; isDragging=true; offset=[popup.offsetLeft-e.clientX, popup.offsetTop-e.clientY]; };
        document.addEventListener('mousemove', (e) => { if(isDragging){ popup.style.left=(e.clientX+offset[0])+'px'; popup.style.top=(e.clientY+offset[1])+'px'; }});
        document.addEventListener('mouseup', () => { if(isDragging) saveCache(); isDragging=false; });

        document.getElementById('toggle-libass').onclick = (e) => {
            globalSettings.useLibass = !globalSettings.useLibass;
            saveCache();
            e.target.innerText = `LIBASS: ${globalSettings.useLibass ? 'ON' : 'OFF'}`;
            e.target.style.color = globalSettings.useLibass ? '#00ffaa' : '#ff4e45';
            e.target.style.borderColor = globalSettings.useLibass ? '#00ffaa' : '#ff4e45';
            
            if (globalSettings.useLibass) {
                document.getElementById('sub-ultra-layer').innerHTML = ''; // Clear HTML render
                LIBASS_RENDERER.init(currentRawAss);
            } else {
                LIBASS_RENDERER.destroy();
            }
        };

        popup.addEventListener('input', (e) => {
            const id = e.target.id, style = e.target.getAttribute('data-style'), type = e.target.getAttribute('data-type'), kTab = e.target.getAttribute('data-k');
            let val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;

            if (kTab) {
                globalSettings[kTab][type] = (e.target.type === 'number') ? parseFloat(val) : val;
            } else if (style) {
                styleSettings[style][type] = (e.target.type === 'number') ? parseFloat(val) : val;
                // Update thanh trượt / số tương ứng ngay lập tức
                if (type === 'posX' || type === 'posY') {
                    const sibling = e.target.closest('div').querySelector(`input[data-type="${type}"][type="${e.target.type==='range'?'number':'range'}"]`);
                    if (sibling) sibling.value = val;
                }
                saveSubToStorage();
            } else if (id) {
                if (id === 'pop-ui-size') { globalSettings.popupFontSize = val; document.getElementById('popup-inner').style.fontSize = val + 'px'; }
                else if (id === 'fontSelect') { globalSettings.fontFamily = val; saveCache(); }
                else {
                    const key = id.replace('g-', '').replace('Val', '');
                    globalSettings[key] = (e.target.type === 'number' || e.target.type === 'range') ? parseFloat(val) : val;
                    const pair = document.getElementById(id.includes('Val') ? id.replace('Val', '') : id + 'Val'); if (pair) pair.value = val;
                    if (id === 'pop-opacity') popup.style.background = `rgba(15, 15, 15, ${val})`;
                }
            }
            saveCache();
        });

        document.getElementById('btn-re-auto').onclick = () => autoFetchSub(getVideoId());
        document.getElementById('reset-ui').onclick = () => { localStorage.clear(); chrome.storage.local.clear(); location.reload(); };
        document.getElementById('closeSubPopup').onclick = () => popup.style.display = 'none';
        
        document.getElementById('assFile').onchange = async (e) => { 
            const text = await e.target.files[0].text();
            currentRawAss = text; 
            parseASS(text); 
            if (globalSettings.useLibass) LIBASS_RENDERER.init(text); 
        };
    }

    function togglePopup() {
        const p = document.getElementById('sub-pro-popup');
        if (p) { p.style.display = (p.style.display === 'none' || p.style.display === '') ? 'flex' : 'none'; if (p.style.display === 'flex') renderStyles(); }
    }
    document.addEventListener('mousedown', function(e) { if (e.target.closest('#sub-ultra-btn')) { e.preventDefault(); e.stopPropagation(); togglePopup(); } }, true);
    chrome.runtime.onMessage.addListener((req) => { if (req.action === "toggle_popup") togglePopup(); });

    // ---------------------------------------------------------
    // VÙNG 6: MAIN LOOP - VÒNG LẶP CẬP NHẬT
    // ---------------------------------------------------------
    function updateSubtitle() {
        const video = document.querySelector('video.html5-main-video') || document.querySelector('video');
        const layer = document.getElementById('sub-ultra-layer');
        
        if (globalSettings.useLibass) {
            LIBASS_RENDERER.sync(video); // Ép khung Libass chạy theo giờ Youtube
        } else {
            HTML_RENDERER.render(video, layer); // Chạy code cũ
        }
        requestAnimationFrame(updateSubtitle);
    }

    function maintainUI() {
        const controls = document.querySelector('.ytp-right-controls'), player = document.querySelector('.html5-video-player');
        if (!controls || !player) return;
        
        if (!document.getElementById('sub-ultra-btn')) {
            const btn = document.createElement('div'); btn.id = 'sub-ultra-btn'; btn.className = 'ytp-button';
            btn.innerHTML = `<div style="font-weight:bold; font-size:14px; text-align:center; line-height:48px; color:#fff; cursor:pointer;">SUB</div>`;
            controls.prepend(btn);
        }
        
        if (!document.getElementById('sub-ultra-layer')) {
            const layer = document.createElement('div'); layer.id = "sub-ultra-layer";
            Object.assign(layer.style, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '99' });
            player.appendChild(layer);
        }
        
        LIBASS_RENDERER.setupContainer(); // Chuẩn bị sẵn khung đen ngoài player
        createUI(); 
        checkAndLoadVideoSub();
    }

    function getVideoId() { const urlParams = new URLSearchParams(window.location.search); return urlParams.get('v'); }
    function saveCache() { localStorage.setItem(STORAGE_KEY_GLOBAL, JSON.stringify(globalSettings)); }
    function assToHex(assStr) { let clean = assStr.replace(/&H|&/g, ''); if (clean.length > 6) clean = clean.substring(2); while (clean.length < 6) clean = '0' + clean; return `#${clean.substring(4, 6)}${clean.substring(2, 4)}${clean.substring(0, 2)}`; }
    function toTime(t) { const p = t.trim().split(':'); return (parseInt(p[0]) * 3600) + (parseInt(p[1]) * 60) + parseFloat(p[2]); }
    function hexToRgba(hex, alpha) { const r = parseInt(hex.slice(1,3), 16), g = parseInt(hex.slice(3,5), 16), b = parseInt(hex.slice(5,7), 16); return `rgba(${r},${g},${b},${alpha})`; }
    
    setInterval(maintainUI, 1000);
    requestAnimationFrame(updateSubtitle);
})();