window.Aegi = {
    settings: {}, styles: {}, subtitles: [], rawAss: "", playResX: 384, playResY: 288,
    isFullscreen: false, videoId: "", hasKaraokeTags: false,
    STORAGE_KEY: 'yt_sub_pro_v10',
    DEFAULTS: {
        useLibass: false, fontSize: 23, outlineWidth: 1.5, blur: 2, color1: '#ffffff', color3: '#000000',
        useBox: false, boxColor: '#000000', boxOpacity: 0.5, fontFamily: 'VNF-Comic Sans',
        fadIn: 200, fadOut: 200, popupOpacity: 0.95, popupFontSize: 13,
        posX: 350, posY: 100, width: 820, height: 600,
        isBold: true, isItalic: false, isUnderline: false, isStrike: false, kEnable: true,
        kPre: { c1: '#ffffff', c3: '#000000', outl: 1.5, blur: 2, zoom: 1.0 },
        kActive: { c1: '#ffffff', c3: '#000000', outl: 1.5, blur: 2, zoom: 1.3, zIn: 100, zOut: 100 },
        kPost: { c1: '#ffffff', c3: '#000000', outl: 1.5, blur: 2, zoom: 1.0 }
    }
};

(function () {
    Aegi.settings = JSON.parse(localStorage.getItem(Aegi.STORAGE_KEY)) || { ...Aegi.DEFAULTS };
    if (typeof Aegi.settings.useLibass === 'undefined') Aegi.settings.useLibass = false;
    document.addEventListener('fullscreenchange', () => Aegi.isFullscreen = !!document.fullscreenElement);

    const fontUrl = chrome.runtime.getURL("vnf-comic-sans.ttf");
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `@font-face { font-family: 'VNF-Comic Sans'; src: url('${fontUrl}'); } #sub-pro-popup * { font-family: 'Segoe UI', Roboto, sans-serif !important; box-sizing: border-box; background: transparent; } .g-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; font-size: 1em; } .g-row label { width: 95px; color: #aaa; font-weight: bold; font-size: 0.9em; } .g-row input[type="range"] { flex: 1; margin: 0 10px; height: 4px; cursor: pointer; } .num-in { background:rgba(255,255,255,0.1) !important; border:1px solid #444; color:#fff; font-size:10px; width:50px; height:22px; text-align:center; border-radius:3px; } .hex-in { background:rgba(255,255,255,0.1) !important; border:1px solid #444; color:#00ffaa; font-size:9px; width:65px; text-align:center; border-radius:2px; } .k-tabs { display: flex; gap: 2px; margin-top: 5px; } .k-tab-btn { flex: 1; padding: 4px; font-size: 10px; background: rgba(255,255,255,0.1); border: 1px solid #444; color: #888; cursor: pointer; } .k-tab-btn.active { background: #3ea6ff; color: #fff; border-bottom: none; } .k-tab-content { background: rgba(255,255,255,0.03); padding: 8px; border: 1px solid #444; border-top: none; } .style-item { border:1px solid rgba(255,255,255,0.1); border-radius:8px; margin-bottom:5px; background:rgba(255,255,255,0.03); overflow:hidden; } .style-head { padding:6px 10px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); } .style-body { padding:10px; display:none; border-top:1px dashed rgba(255,255,255,0.1); } .one-line { display: flex; align-items: center; justify-content: space-between; gap: 4px; width: 100%; margin-top: 5px; font-size: 0.9em; color:#ccc; } .format-btn { background:rgba(255,255,255,0.1); border:1px solid #444; color:#fff; padding:3px 10px; cursor:pointer; border-radius:3px; font-weight:bold; font-size: 12px; } .format-btn.active { background:#3ea6ff !important; border-color:#fff !important; color:#fff !important; } input[type="color"] { width:26px; height:20px; border:none; background:none; padding:0; cursor:pointer; } .status-tag { font-size: 10px; padding: 1px 5px; border-radius: 4px; font-weight: bold; } .status-ok { color: #00ffaa; border: 1px solid #00ffaa; } .status-none { color: #ff4e45; border: 1px solid #ff4e45; } .btn-apply { background:#ffaa00; color:#000; border:none; padding:1px 8px; border-radius:3px; font-size:10px; font-weight:bold; cursor:pointer; } .syllable { display: inline-block; transition: transform 0.15s ease-out; white-space: pre; } .karaoke-wrapper.disabled { opacity: 0.4; pointer-events: none; filter: grayscale(1); }`;
    document.head.appendChild(styleEl);

    Aegi.createUI = function() {
        if (document.getElementById('sub-pro-popup')) return;
        const popup = document.createElement('div'); popup.id = "sub-pro-popup";
        Object.assign(popup.style, { position: 'fixed', width: Aegi.settings.width+'px', height: Aegi.settings.height+'px', top: Aegi.settings.posY+'px', left: Aegi.settings.posX+'px', background: `rgba(15, 15, 15, ${Aegi.settings.popupOpacity})`, backdropFilter: 'blur(15px)', color: '#fff', zIndex: '2147483647', borderRadius: '12px', border: '1px solid #444', display: 'none', flexDirection: 'column', resize: 'both', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' });
        popup.innerHTML = `
            <div id="sub-header" style="padding: 10px 15px; background: rgba(255,255,255,0.05); cursor: move; display: flex; justify-content: space-between; align-items: center; border-bottom:1px solid rgba(255,255,255,0.1);">
                <div style="display:flex; gap:5px; align-items:center;">
                    <button id="reset-ui" style="border:1px solid #555; color:#ccc; cursor:pointer; background:rgba(255,255,255,0.1); font-size:10px; padding:2px 8px; border-radius:4px; z-index:999;">🔄 RESET</button>
                    <button id="toggle-libass" style="border:1px solid ${Aegi.settings.useLibass ? '#00ffaa' : '#ff4e45'}; color:${Aegi.settings.useLibass ? '#00ffaa' : '#ff4e45'}; background:rgba(0,0,0,0.2); font-size:10px; padding:2px 8px; border-radius:4px; font-weight:bold; cursor:pointer; z-index:999;">LIBASS: ${Aegi.settings.useLibass ? 'ON' : 'OFF'}</button>
                </div>
                <span style="font-weight: bold; color: #3ea6ff; font-size: 12px; flex:1; text-align:center; padding: 0 10px;">AEGISUB LOADER v10.6</span>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="display:flex; align-items:center; gap:5px;"><span style="font-size:9px; color:#aaa;">UI</span><input type="range" id="pop-ui-size" min="10" max="22" value="${Aegi.settings.popupFontSize}" style="width:40px;"></div>
                    <div style="display:flex; align-items:center; gap:5px;"><span style="font-size:10px; color:#aaa;">OPA</span><input type="range" id="pop-opacity" min="0.2" max="1" step="0.05" value="${Aegi.settings.popupOpacity}" style="width:40px;"></div>
                    <span id="closeSubPopup" style="cursor:pointer; font-size:22px; line-height:20px; z-index:999;">&times;</span>
                </div>
            </div>
            <div id="popup-inner" style="display:flex; flex:1; overflow:hidden; font-size:${Aegi.settings.popupFontSize}px;">
                <div style="flex:1; padding:15px; border-right:1px solid rgba(255,255,255,0.1); overflow-y:auto; background:transparent;">
                    <div style="margin-bottom:10px; background:rgba(255,255,255,0.03); padding:8px; border-radius:8px;">
                        <div class="g-row">ID: <span id="yt-id-display" style="color:#3ea6ff; font-weight:bold;">N/A</span></div>
                        <div class="g-row" style="margin-bottom:10px;">
                            <span>Status: <span id="auto-sub-status" class="status-tag status-none">Searching...</span></span>
                            <button id="btn-re-auto" title="Fetch GitHub" style="background:none; border:1px solid #444; color:#aaa; cursor:pointer; font-size:10px; border-radius:3px; padding:1px 5px;">🔄 Fetch</button>
                        </div>
                        <div class="g-row"><b>Sub:</b> <input type="file" id="assFile" accept=".ass" style="font-size:10px; flex:1;"></div>
                    </div>
                    <div style="color: #00ffaa; font-weight: bold; font-size: 0.85em; margin-bottom: 8px;">GLOBAL SETTINGS</div>
                    <div class="g-row"><label>Size</label><input type="range" id="g-fontSize" min="10" max="150" step="1" value="${Aegi.settings.fontSize}"><input type="number" id="g-fontSizeVal" value="${Aegi.settings.fontSize}" class="num-in"></div>
                    <div class="g-row"><label>Outline</label><input type="range" id="g-outlineWidth" min="0" max="10" step="0.1" value="${Aegi.settings.outlineWidth}"><input type="number" id="g-outlineWidthVal" value="${Aegi.settings.outlineWidth}" class="num-in"></div>
                    <div class="g-row"><label>Blur</label><input type="range" id="g-blur" min="0" max="10" step="0.1" value="${Aegi.settings.blur}"><input type="number" id="g-blurVal" value="${Aegi.settings.blur}" class="num-in"></div>
                    <div class="g-row" style="background: rgba(255,255,255,0.05); padding: 5px; border-radius: 4px;">
                        <div style="display:flex; align-items:center; gap:5px; flex:1;">Text(1c) <input type="color" id="g-color1" value="${Aegi.settings.color1}"></div>
                        <div style="display:flex; align-items:center; gap:5px; flex:1; justify-content:flex-end;">Outl(3c) <input type="color" id="g-color3" value="${Aegi.settings.color3}"></div>
                    </div>
                    
                    <div style="margin-top:10px; border-top:1px solid #444; padding-top:10px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <b style="color:#ffaa00; font-size:11px;">KARAOKE EFFECT</b>
                            <div style="display:flex; gap:5px; align-items:center;">
                                <button id="btn-k-apply" class="btn-apply">Apply</button>
                                <input type="checkbox" id="g-kEnable" ${Aegi.settings.kEnable?'checked':''}>
                            </div>
                        </div>
                        <div id="karaoke-tabs-wrapper" class="karaoke-wrapper ${Aegi.settings.kEnable ? '' : 'disabled'}">
                            <div class="k-tabs" id="k-tabs-container">
                                <button class="k-tab-btn active" data-tab="pre">Pre</button>
                                <button class="k-tab-btn" data-tab="active">Active</button>
                                <button class="k-tab-btn" data-tab="post">Post</button>
                            </div>
                            <div class="k-tab-panels" id="k-tab-container-inner">
                                <div id="k-pre-panel" class="k-tab-content">${renderKTab('kPre')}</div>
                                <div id="k-active-panel" class="k-tab-content" style="display:none">${renderKTab('kActive')}</div>
                                <div id="k-post-panel" class="k-tab-content" style="display:none">${renderKTab('kPost')}</div>
                            </div>
                        </div>
                    </div>

                    <!-- ĐÃ KHÔI PHỤC BOX THEO ĐÚNG YÊU CẦU -->
                    <div style="margin-top:10px; background:rgba(255,255,255,0.05); padding:8px; border-radius:8px; display: flex; align-items: center; gap: 5px; flex-wrap: wrap;">
                        <input type="checkbox" id="g-useBox" ${Aegi.settings.useBox?'checked':''}> <b>Box</b>
                        <input type="color" id="g-boxColor" value="${Aegi.settings.boxColor}">
                        <input type="text" id="g-boxColorHex" value="${Aegi.settings.boxColor}" class="hex-in">
                        <input type="range" id="g-boxOpacity" min="0" max="1" step="0.1" value="${Aegi.settings.boxOpacity}" style="flex:1;">
                    </div>

                </div>
                <div id="styleListContainer" style="flex: 1.2; padding: 12px; overflow-y: auto; background: transparent;">
                    <div style="display:flex; align-items:center; margin-bottom: 8px;">
                        <span style="color: #ffaa00; font-weight: bold; font-size: 0.85em;">STYLES STRUCTURE</span>
                    </div>
                    <div id="styleItems"></div>
                </div>
            </div>`;
        document.body.appendChild(popup);
        setupUIEvents(popup);
    };

    function renderKTab(key) {
        const obj = Aegi.settings[key]; const isAct = key === 'kActive';
        return `<div class="one-line" style="justify-content: space-between; flex-wrap:wrap;">
            <div>1c:<input type="color" data-k="${key}" data-type="c1" value="${obj.c1}"></div>
            <div>3c:<input type="color" data-k="${key}" data-type="c3" value="${obj.c3}"></div>
            O:<input type="number" data-k="${key}" data-type="outl" value="${obj.outl}" class="num-in" step="0.1">
            B:<input type="number" data-k="${key}" data-type="blur" value="${obj.blur}" class="num-in" step="0.1">
            Z:<input type="number" data-k="${key}" data-type="zoom" value="${obj.zoom}" class="num-in" step="0.1">
            ${isAct ? `<div class="one-line" style="width:100%; border-top:1px dashed #444; padding-top:5px; margin-top:5px;">
                Z-In:<input type="number" data-k="${key}" data-type="zIn" value="${obj.zIn}" class="num-in" step="10">
                Z-Out:<input type="number" data-k="${key}" data-type="zOut" value="${obj.zOut}" class="num-in" step="10">
            </div>` : ''}
        </div>`;
    }

    Aegi.renderStylesUI = function() {
        const container = document.getElementById('styleItems'); if (!container) return; container.innerHTML = '';
        
        // THUẬT TOÁN SẮP XẾP CHUẨN XÁC: 1: vietsub, 2: romaji, 3: kanji
        const getPriority = (name) => { 
            const n = name.toLowerCase().trim();
            if (n === 'vietsub') return 10;
            if (n.startsWith('vietsub')) return 11;
            if (n === 'romaji') return 20;
            if (n.startsWith('romaji')) return 21;
            if (n === 'kanji') return 30;
            if (n.startsWith('kanji')) return 31;
            return 40; // Xếp hạng 40 cho các style còn lại
        };
        
        const styleNames = Object.keys(Aegi.styles);
        styleNames.sort((a, b) => {
            const pA = getPriority(a); const pB = getPriority(b);
            if (pA !== pB) return pA - pB;
            return a.localeCompare(b); // Nếu cùng hạng 40 thì xếp A-Z
        });
        
        styleNames.forEach(sName => {
            const s = Aegi.styles[sName], item = document.createElement('div'); item.className = 'style-item';
            item.innerHTML = `
                <div class="style-head"><span>${sName}</span><div style="display:flex;align-items:center;gap:12px;"><span class="eye-btn" style="cursor:pointer;opacity:${s.visible?1:0.3}">${s.visible?'👁️':'🚫'}</span><label><input type="checkbox" data-style="${sName}" data-type="override" ${s.override?'checked':''}> ⚙️</label><span>▼</span></div></div>
                <div class="style-body" style="display:${s.override?'block':'none'};">
                    <div class="g-row">X <input type="range" data-style="${sName}" data-type="posX" min="0" max="${Aegi.playResX*2}" value="${s.posX}"> <input type="number" value="${s.posX}" class="num-in" data-style="${sName}" data-type="posX"></div>
                    <div class="g-row">Y <input type="range" data-style="${sName}" data-type="posY" min="0" max="${Aegi.playResY*2}" value="${s.posY}"> <input type="number" value="${s.posY}" class="num-in" data-style="${sName}" data-type="posY"></div>
                    <div class="one-line">S:<input type="number" data-style="${sName}" data-type="fontSize" value="${s.fontSize}" class="num-in"> O:<input type="number" data-style="${sName}" data-type="outlineWidth" value="${s.outlineWidth}" class="num-in" step="0.1"> 1c:<input type="color" data-style="${sName}" data-type="color1" value="${s.color1}"> 3c:<input type="color" data-style="${sName}" data-type="color3" value="${s.color3}"></div>
                </div>`;
            item.querySelector('.eye-btn').onclick = (e) => { s.visible = !s.visible; e.target.innerText = s.visible?'👁️':'🚫'; e.target.style.opacity = s.visible?1:0.3; Aegi.saveCache(); };
            item.querySelector('.style-head').onclick = (e) => { if (e.target.tagName !== 'INPUT' && !e.target.classList.contains('eye-btn') && !e.target.closest('label')) { const b = item.querySelector('.style-body'); b.style.display = b.style.display === 'none' ? 'block' : 'none'; } };
            container.appendChild(item);
        });
    }

    function setupUIEvents(popup) {
        const header = popup.querySelector('#sub-header'); let isDragging = false, offset = [0, 0];
        header.onmousedown = (e) => { if(e.target.closest('button') || e.target.tagName==='INPUT' || e.target.id === 'closeSubPopup') return; isDragging=true; offset=[popup.offsetLeft-e.clientX, popup.offsetTop-e.clientY]; };
        document.addEventListener('mousemove', (e) => { if(isDragging){ popup.style.left=(e.clientX+offset[0])+'px'; popup.style.top=(e.clientY+offset[1])+'px'; }});
        document.addEventListener('mouseup', () => { if(isDragging) Aegi.saveCache(); isDragging=false; });

        document.getElementById('reset-ui').addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation(); localStorage.removeItem(Aegi.STORAGE_KEY); chrome.storage.local.clear(() => location.reload());
        });

        document.getElementById('toggle-libass').onclick = (e) => {
            e.preventDefault(); e.stopPropagation(); Aegi.settings.useLibass = !Aegi.settings.useLibass; Aegi.saveCache(); location.reload(); 
        };

        // ĐÃ FIX: SỰ KIỆN CLICK CHO 3 TAB KARAOKE
        const tabBtns = popup.querySelectorAll('.k-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = e.target.getAttribute('data-tab');
                tabBtns.forEach(b => b.classList.remove('active'));
                popup.querySelectorAll('.k-tab-content').forEach(pnl => pnl.style.display = 'none');
                e.target.classList.add('active');
                document.getElementById(`k-${tabId}-panel`).style.display = 'block';
            });
        });

        // Tự động vô hiệu hóa nếu tắt Checkbox
        const kEnableCheck = document.getElementById('g-kEnable');
        const kWrapper = document.getElementById('karaoke-tabs-wrapper');
        if (kEnableCheck) {
            kEnableCheck.addEventListener('change', (e) => {
                Aegi.settings.kEnable = e.target.checked;
                if (Aegi.settings.kEnable) kWrapper.classList.remove('disabled');
                else kWrapper.classList.add('disabled');
                Aegi.saveCache();
            });
        }

        popup.addEventListener('input', (e) => {
            const id = e.target.id, style = e.target.getAttribute('data-style'), type = e.target.getAttribute('data-type'), kTab = e.target.getAttribute('data-k');
            let val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;

            if (kTab) Aegi.settings[kTab][type] = (e.target.type === 'number') ? parseFloat(val) : val;
            else if (style) {
                Aegi.styles[style][type] = (e.target.type === 'number') ? parseFloat(val) : val;
                if (type === 'posX' || type === 'posY') { const sibling = e.target.closest('div').querySelector(`input[data-type="${type}"][type="${e.target.type==='range'?'number':'range'}"]`); if (sibling) sibling.value = val; }
            } else if (id && id !== 'g-kEnable') {
                if (id === 'pop-ui-size') { Aegi.settings.popupFontSize = val; document.getElementById('popup-inner').style.fontSize = val + 'px'; }
                else {
                    const key = id.replace('g-', '').replace('Val', '');
                    Aegi.settings[key] = (e.target.type === 'number' || e.target.type === 'range') ? parseFloat(val) : val;
                    const pair = document.getElementById(id.includes('Val') ? id.replace('Val', '') : id + 'Val'); if (pair) pair.value = val;
                    if (id === 'pop-opacity') popup.style.background = `rgba(15, 15, 15, ${val})`;
                }
            } Aegi.saveCache();
        });

        document.getElementById('closeSubPopup').onclick = () => popup.style.display = 'none';
        document.getElementById('assFile').onchange = async (e) => { const text = await e.target.files[0].text(); Aegi.rawAss = text; Aegi.parseASS(text); };
    }

    Aegi.parseASS = function(text) {
        const lines = text.split(/\r?\n/); Aegi.subtitles = []; Aegi.hasKaraokeTags = false;
        const resXMatch = text.match(/PlayResX:\s*(\d+)/i), resYMatch = text.match(/PlayResY:\s*(\d+)/i);
        Aegi.playResX = resXMatch ? parseInt(resXMatch[1]) : 384; Aegi.playResY = resYMatch ? parseInt(resYMatch[1]) : 288;
        let section = "";
        for (let line of lines) {
            line = line.trim();
            if (line.startsWith('[')) { section = line.toLowerCase(); continue; }
            if (section.includes('styles') && line.startsWith('Style:')) {
                const p = line.substring(6).split(','); const name = p[0].trim();
                let defX = Aegi.playResX/2, defY = (name.toLowerCase().includes('roma'))?80:(name.toLowerCase().includes('kanji')?135:Aegi.playResY-80);
                if (!Aegi.styles[name]) Aegi.styles[name] = { color1: '#ffffff', color3: '#000000', posX: defX, posY: defY, fontSize: 23, outlineWidth: 1.5, blur: 2, override: false, visible: true };
            }
            if (section.includes('events') && line.startsWith('Dialogue:')) {
                const p = line.substring(9).split(','), rawText = p.slice(9).join(','), pos = rawText.match(/\\pos\(([\d.]+),([\d.]+)\)/);
                const syllables = []; let runningTime = 0, kRegex = /\{(?:\\[kK][fpo]?)(\d+)\}([^{]*)/g, m;
                while ((m = kRegex.exec(rawText)) !== null) { const d = parseInt(m[1]) * 10; syllables.push({ timeStart: runningTime, timeEnd: runningTime + d, text: m[2] }); runningTime += d; }
                if (syllables.length > 0) Aegi.hasKaraokeTags = true;
                const tToSec = (t) => { const x = t.trim().split(':'); return (parseInt(x[0]) * 3600) + (parseInt(x[1]) * 60) + parseFloat(x[2]); };
                Aegi.subtitles.push({ start: tToSec(p[1]), end: tToSec(p[2]), style: p[3].trim(), syllables, text: syllables.length > 0 ? "" : rawText.replace(/\{[^}]+\}/g, '').replace(/\\N/gi, '\n'), filePos: pos ? {x: parseFloat(pos[1]), y: parseFloat(pos[2])} : null });
            }
        }
        
        // Tự động tắt Karaoke nếu file ASS không có thẻ \k
        const kCheck = document.getElementById('g-kEnable');
        const kWrap = document.getElementById('karaoke-tabs-wrapper');
        if (!Aegi.hasKaraokeTags) {
            Aegi.settings.kEnable = false;
            if (kCheck) kCheck.checked = false;
            if (kWrap) kWrap.classList.add('disabled');
        } else {
            Aegi.settings.kEnable = true;
            if (kCheck) kCheck.checked = true;
            if (kWrap) kWrap.classList.remove('disabled');
        }

        Aegi.saveCache(); Aegi.renderStylesUI();
        if (window.onAegiDataReady) window.onAegiDataReady(); 
    };

    Aegi.saveCache = function() {
        localStorage.setItem(Aegi.STORAGE_KEY, JSON.stringify(Aegi.settings));
        if (Aegi.videoId && Aegi.subtitles.length) {
            chrome.storage.local.set({ [Aegi.videoId]: { subtitles: Aegi.subtitles, playResX: Aegi.playResX, playResY: Aegi.playResY, styleSettings: Aegi.styles, rawAssContent: Aegi.rawAss } });
        }
    };

    setInterval(() => {
        const controls = document.querySelector('.ytp-right-controls'), player = document.querySelector('.html5-video-player');
        if (!controls || !player) return;
        if (!document.getElementById('sub-ultra-btn')) {
            const btn = document.createElement('div'); btn.id = 'sub-ultra-btn'; btn.className = 'ytp-button'; btn.innerHTML = `<div style="font-weight:bold; font-size:14px; text-align:center; line-height:48px; color:#fff; cursor:pointer;">SUB</div>`;
            controls.prepend(btn);
            btn.onclick = () => { const p = document.getElementById('sub-pro-popup'); p.style.display = p.style.display === 'none' ? 'flex' : 'none'; if(p.style.display==='flex') Aegi.renderStylesUI(); };
        }
        Aegi.createUI();
        const vId = new URLSearchParams(window.location.search).get('v');
        if (vId && vId !== Aegi.videoId) {
            Aegi.videoId = vId; document.getElementById('yt-id-display').innerText = vId;
            chrome.storage.local.get([vId], (res) => {
                if (res[vId]) { 
                    Aegi.subtitles = res[vId].subtitles; Aegi.styles = res[vId].styleSettings; Aegi.rawAss = res[vId].rawAssContent;
                    Aegi.playResX = res[vId].playResX; Aegi.playResY = res[vId].playResY;
                    document.getElementById('auto-sub-status').innerText = "Cached 💾"; Aegi.renderStylesUI();
                    if (window.onAegiDataReady) window.onAegiDataReady();
                }
            });
        }
    }, 1000);
})();