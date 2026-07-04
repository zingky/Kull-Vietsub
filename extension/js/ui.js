(function () {
    'use strict';

    const __ = window.__SUB;

    function renderKTab(key) {
        const obj = __.globalSettings[key];
        const isAct = key === 'kActive';
        return `
            <div class="g-row" style="background: rgba(255,255,255,0.05); padding: 3px 5px; border-radius: 4px;">
                <div style="display:flex; align-items:center; gap:4px; flex:1;">1c <input type="color" data-k="${key}" data-type="c1" id="ui-k-${key}-c1" value="${obj.c1}"></div>
                <div style="display:flex; align-items:center; gap:4px; flex:1; justify-content:flex-end;">3c <input type="color" data-k="${key}" data-type="c3" id="ui-k-${key}-c3" value="${obj.c3}"></div>
            </div>
            <div class="g-row"><label>Outline</label><input type="range" data-k="${key}" data-type="outl" min="0" max="20" step="0.1" value="${obj.outl}"><input type="number" data-k="${key}" data-type="outl" value="${obj.outl}" class="num-in" step="0.1"></div>
            <div class="g-row"><label>Blur</label><input type="range" data-k="${key}" data-type="blur" min="0" max="100" step="0.1" value="${obj.blur}"><input type="number" data-k="${key}" data-type="blur" value="${obj.blur}" class="num-in" step="0.1"></div>
            <div class="g-row"><label>Zoom</label><input type="range" data-k="${key}" data-type="zoom" min="1.0" max="2.0" step="0.1" value="${obj.zoom}"><input type="number" data-k="${key}" data-type="zoom" value="${obj.zoom}" class="num-in" step="0.1"></div>
            ${isAct ? `<div class="one-line" style="border-top:1px dashed #444; padding-top:5px; margin-top:5px;">
                Z-In:<input type="number" data-k="${key}" data-type="zIn" value="${obj.zIn}" class="num-in" step="10">
                Z-Out:<input type="number" data-k="${key}" data-type="zOut" value="${obj.zOut}" class="num-in" step="10">
            </div>` : ''}
        `;
    }

    function renderGlobalRow(l, k, min, max, s) {
        return `<div class="g-row"><label>${l}</label><input type="range" id="g-${k}" min="${min}" max="${max}" step="${s}" value="${__.globalSettings[k]}"><input type="number" id="g-${k}Val" value="${__.globalSettings[k]}" step="${s}" class="num-in"></div>`;
    }

    // ============ FILE DROPDOWN SEARCH ============
    __.renderFileDropdown = function (dropdown, query) {
        dropdown.innerHTML = '';
        const files = __.assFileCache || [];
        if (!files.length) {
            dropdown.innerHTML = '<div style="padding:6px;color:#888;font-size:8px;">No files. Click ? to load list.</div>';
            return;
        }
        const titleWords = (async () => {
            try {
                const t = await __.getVideoTitle();
                return t ? t.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 1) : [];
            } catch(e) { return []; }
        })();
        // Score function: how well a filename matches
        const scoreFile = (fname, words, q) => {
            const fn = fname.toLowerCase().replace(/[^\w\s]/g, '');
            let s = 0;
            // Search query match
            if (q && q.length > 0) {
                const ql = q.toLowerCase();
                if (fn.includes(ql)) s += 100;
            }
            // Title word matches
            if (words && words.length) {
                words.forEach(w => {
                    if (fn.includes(w)) s += 10;
                });
            }
            return s;
        };
        // Use sync approach with current title state
        const title = document.querySelector('h1.ytd-watch-metadata yt-formatted-string');
        const titleText = title ? title.textContent.trim() : document.title.replace(' - YouTube', '').trim();
        const titleWordsArr = titleText.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 1);
        const q = (query || '').toLowerCase().trim();
        // Score and sort
        const scored = files.map(f => ({ name: f, score: scoreFile(f, titleWordsArr, q) }));
        scored.sort((a, b) => b.score - a.score);
        // Filter: if query, show all; else show top 20
        const show = q ? scored : scored.slice(0, 20);
        if (!show.length) {
            dropdown.innerHTML = '<div style="padding:6px;color:#888;font-size:8px;">No matching files.</div>';
            return;
        }
        show.forEach(item => {
            const div = document.createElement('div');
            div.className = 'sub-file-item';
            div.dataset.filename = item.name;
            div.style.cssText = 'padding:4px 8px; cursor:pointer; font-size:8px; color:#ccc; border-bottom:1px solid rgba(255,255,255,0.05); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;';
            // Highlight matching parts
            if (item.score > 0) {
                div.style.color = '#3ea6ff';
                div.style.background = 'rgba(62,166,255,0.05)';
            }
            div.textContent = item.name;
            div.onmouseenter = () => div.style.background = 'rgba(62,166,255,0.15)';
            div.onmouseleave = () => div.style.background = item.score > 0 ? 'rgba(62,166,255,0.05)' : 'transparent';
            dropdown.appendChild(div);
        });
        // Count
        const info = document.createElement('div');
        info.style.cssText = 'padding:3px 8px; font-size:7px; color:#666; border-top:1px solid rgba(255,255,255,0.1);';
        info.textContent = q ? `${show.length} results` : `${files.length} files (showing top 20)`;
        dropdown.appendChild(info);
    };

    __.togglePopup = function () {
        const p = document.getElementById('sub-pro-popup');
        if (p) {
            p.style.display = (p.style.display === 'none' || p.style.display === '') ? 'flex' : 'none';
            if (p.style.display === 'flex' && typeof __.renderStyles === 'function') __.renderStyles();
        }
    };

    function createUI() {
        if (document.getElementById('sub-pro-popup')) return;
        const popup = document.createElement('div');
        popup.id = "sub-pro-popup";
        Object.assign(popup.style, {
            position: 'fixed', width: 'auto', minWidth: '620px', height: 'auto',
            minHeight: '300px', maxHeight: '90vh',
            top: __.globalSettings.posY + 'px', left: __.globalSettings.posX + 'px',
            background: `rgba(15, 15, 15, ${__.globalSettings.popupOpacity})`, backdropFilter: 'blur(15px)',
            color: '#fff', zIndex: '2147483647', borderRadius: '12px', border: '1px solid #444',
            display: 'none', flexDirection: 'column', resize: 'both', overflow: 'auto',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
        });

        popup.innerHTML = `
            <div id="sub-header" style="padding: 4px 10px; background: rgba(255,255,255,0.05); cursor: move; display: flex; align-items: center; border-bottom:1px solid rgba(255,255,255,0.1); gap:4px;">
                <button id="reset-ui" style="border:1px solid #555; color:#ccc; cursor:pointer; background:rgba(255,255,255,0.1); font-size:9px; padding:1px 6px; border-radius:4px;">Reset 🔄</button>
                <div style="display:flex; align-items:center; gap:2px; font-size:9px; color:#aaa; flex:1;">
                    <span id="yt-id-display" style="color:#3ea6ff; font-weight:bold; font-size:9px;">${__.getVideoId() || 'N/A'}</span>
                    <span id="auto-sub-status" class="status-tag status-none" style="font-size:8px;">Searching...</span>
                    <div style="position:relative; display:inline-flex; align-items:center; gap:2px;">
                        <input id="sub-search-input" type="text" placeholder="Search sub..." style="background:rgba(255,255,255,0.1); border:1px solid #444; color:#fff; font-size:8px; width:100px; border-radius:3px; padding:1px 3px;">
                        <button id="btn-fetch-list" title="Fetch/Refresh file list" style="background:none; border:1px solid #444; color:#aaa; cursor:pointer; font-size:8px; border-radius:3px; padding:0px 3px;">🔍</button>
                        <div id="sub-file-dropdown" style="display:none; position:absolute; top:100%; left:0; background:rgba(20,20,20,0.98); border:1px solid #444; border-radius:4px; max-height:150px; overflow-y:auto; min-width:180px; z-index:2147483647; box-shadow:0 8px 24px rgba(0,0,0,0.8);"></div>
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; gap:1px; align-items:flex-end; position:relative; padding-right:16px;">
                    <div style="display:flex; align-items:center; gap:2px;"><span style="font-size:7px; color:#aaa;">Zoom</span><input type="range" id="pop-zoom" min="1.0" max="1.3" step="0.1" value="${__.globalSettings.popupZoom}" style="width:45px;height:3px;"></div>
                    <div style="display:flex; align-items:center; gap:2px;"><span style="font-size:7px; color:#aaa;">OPA</span><input type="range" id="pop-opacity" min="0.2" max="1" step="0.05" value="${__.globalSettings.popupOpacity}" style="width:45px;height:3px;"></div>
                    <span id="closeSubPopup" style="cursor:pointer; font-size:16px; line-height:22px; position:absolute; right:0; top:50%; transform:translateY(-50%);">&times;</span>
                </div>
            </div>
            <div id="popup-inner" style="display:flex; flex:1; overflow:hidden; position:relative;">
                <div id="panel-left" style="flex:1; padding:10px; overflow-y:auto; background:transparent; min-width:130px;">
                    <div style="margin-bottom:4px; background:rgba(255,255,255,0.03); padding:5px 8px; border-radius:6px;">
                        <div style="display:flex; align-items:center; gap:4px;"><b style="font-size:10px;">Sub:</b><input type="file" id="assFile" accept=".ass" style="font-size:9px; flex:1;"><button id="btn-download-sub" style="background:rgba(255,255,255,0.1); border:1px solid #444; color:#00ffaa; cursor:pointer; font-size:9px; border-radius:3px; padding:1px 4px; white-space:nowrap;">⬇DL</button></div>
                        <div style="display:flex; align-items:center; gap:4px; border-top:1px dashed rgba(255,255,255,0.1); padding-top:4px; margin-top:4px;">
                            <select id="fontSelect" style="flex:1;">
                                <option value="VNF-Comic Sans" ${__.globalSettings.fontFamily === 'VNF-Comic Sans' ? 'selected' : ''}>VNF-Comic Sans</option>
                                <option value="Arial" ${__.globalSettings.fontFamily === 'Arial' ? 'selected' : ''}>Arial</option>
                                <option value="Tahoma" ${__.globalSettings.fontFamily === 'Tahoma' ? 'selected' : ''}>Tahoma</option>
                                <option value="Verdana" ${__.globalSettings.fontFamily === 'Verdana' ? 'selected' : ''}>Verdana</option>
                                <option value="Segoe UI" ${__.globalSettings.fontFamily === 'Segoe UI' ? 'selected' : ''}>Segoe UI</option>
                                <option value="Times New Roman" ${__.globalSettings.fontFamily === 'Times New Roman' ? 'selected' : ''}>Times New Roman</option>
                                <option value="custom">-- Load --</option>
                            </select>
                            <button class="format-btn ${__.globalSettings.isBold ? 'active' : ''}" id="btn-isBold" style="font-size:9px; padding:1px 5px;">B</button>
                            <button class="format-btn ${__.globalSettings.isItalic ? 'active' : ''}" id="btn-isItalic" style="font-size:9px; padding:1px 5px;">I</button>
                            <button class="format-btn ${__.globalSettings.isUnderline ? 'active' : ''}" id="btn-isUnderline" style="font-size:9px; padding:1px 5px;">U</button>
                            <button class="format-btn ${__.globalSettings.isStrike ? 'active' : ''}" id="btn-isStrike" style="font-size:9px; padding:1px 5px;">S</button>
                        </div>
                        <div style="display:flex; align-items:center; justify-content:space-between; width:100%; gap:10px; padding-top:4px; margin-top:2px;">
                            <b style="font-size:9px; color:#ffaa00;">Timeshift ⏱</b>
                            <div style="display:flex; align-items:center; gap:4px;">
                                <button id="ts-dec" style="background:rgba(255,255,255,0.1); border:1px solid #ffaa00; color:#ffaa00; cursor:pointer; border-radius:2px; padding:0px 4px; font-size:9px;">−</button>
                                <input type="text" id="ts-input" value="0" style="min-width:45px;width:45px;">
                                <span style="font-size:8px; color:#888;">ms</span>
                                <button id="ts-inc" style="background:rgba(255,255,255,0.1); border:1px solid #ffaa00; color:#ffaa00; cursor:pointer; border-radius:2px; padding:0px 4px; font-size:9px;">+</button>
                                <button id="ts-reset" style="background:none; border:1px solid #555; color:#aaa; cursor:pointer; border-radius:2px; padding:0px 4px; font-size:8px;">↺</button>
                            </div>
                        </div>
                    </div>

                    <div class="pill-tabs">
                        <div class="pill-tab active" data-pill="settings">⚙️ Settings</div>
                        <div class="pill-tab" data-pill="karaoke">🎤 Karaoke</div>
                        <div class="pill-tab" data-pill="advanced">🛠️ Advanced</div>
                    </div>

                    <div class="pill-panel open" data-pill="settings">
                        ${renderGlobalRow('Size', 'fontSize', 10, 150, 1)}
                        ${renderGlobalRow('Outline', 'outlineWidth', 0, 20, 0.1)}
                        ${renderGlobalRow('Blur', 'blur', 0, 100, 0.1)}
                        <div class="g-row" style="background: rgba(255,255,255,0.05); padding: 3px 5px; border-radius: 4px;">
                            <div style="display:flex; align-items:center; gap:4px; flex:1;">Text(1c) <input type="color" id="g-color1" value="${__.globalSettings.color1}"></div>
                            <div style="display:flex; align-items:center; gap:4px; flex:1; justify-content:flex-end;">Outline(3c) <input type="color" id="g-color3" value="${__.globalSettings.color3}"></div>
                        </div>
                        <div class="g-row"><label style="width:50px;font-size:9px;">Fade</label><input type="number" id="g-fadIn" value="${__.globalSettings.fadIn}" class="num-in"><input type="number" id="g-fadOut" value="${__.globalSettings.fadOut}" class="num-in"></div>
                        <div style="background:rgba(255,255,255,0.05); padding:3px 5px; border-radius:4px; display:flex; align-items:center; gap:4px;">
                            <input type="checkbox" id="g-useBox" ${__.globalSettings.useBox ? 'checked' : ''}> <b style="font-size:9px;">Box</b>
                            <div style="display:flex; align-items:center; gap:3px; flex:1; justify-content:flex-end;"><input type="color" id="g-boxColor" value="${__.globalSettings.boxColor}"><input type="range" id="g-boxOpacity" min="0" max="1" step="0.1" value="${__.globalSettings.boxOpacity}" style="flex:0.5;"></div>
                        </div>
                    </div>

                    <div class="pill-panel" data-pill="karaoke">
                        <div class="k-tabs" style="margin-top:2px;">
                            <button class="k-tab-btn active" data-tab="pre" style="font-size:10px;padding:3px;">Pre</button>
                            <button class="k-tab-btn" data-tab="active" style="font-size:10px;padding:3px;">Active</button>
                            <button class="k-tab-btn" data-tab="post" style="font-size:10px;padding:3px;">Post</button>
                        </div>
                        <div class="k-tab-panels" id="k-tab-container-inner">
                            <div id="k-pre-panel" class="k-tab-content" style="padding:4px;">${renderKTab('kPre')}</div>
                            <div id="k-active-panel" class="k-tab-content" style="display:none;padding:4px;">${renderKTab('kActive')}</div>
                            <div id="k-post-panel" class="k-tab-content" style="display:none;padding:4px;">${renderKTab('kPost')}</div>
                        </div>
                    </div>

                    <div class="pill-panel" data-pill="advanced">
                        <div style="display:flex; align-items:center; gap:4px;">
                            <input type="checkbox" id="g-deepGlow" ${__.globalSettings.deepGlow ? 'checked' : ''}> <b style="font-size:10px;">Deep Glow</b>
                        </div>
                    </div>
                </div>
                <div id="divider" style="width:4px; cursor:col-resize; background:rgba(255,255,255,0.05); flex-shrink:0; border-left:1px solid rgba(255,255,255,0.12); border-right:1px solid rgba(255,255,255,0.05); user-select:none;"></div>
                <div id="styleListContainer" style="flex: 1.3; padding: 8px; overflow-y: auto; background: transparent; min-width:130px;">
                    <div style="display:flex; align-items:center; margin-bottom: 4px;">
                        <span style="color: #ffaa00; font-weight: bold; font-size: 10px;">STYLES</span>
                    </div>
                    <div id="styleItems"></div>
                </div>
            </div>
            <div id="sub-footer" style="padding:4px 12px; background:rgba(255,255,255,0.03); border-top:1px solid rgba(255,255,255,0.1); display:flex; justify-content:space-between; align-items:center; font-size:9px; color:#888;">
                <div style="display:flex; align-items:center; gap:6px;">
                    <span id="footer-popup-settings-btn" style="cursor:pointer; font-size:13px; color:#aaa; display:flex; align-items:center;">⚙️</span>
                    <a href="https://github.com/zingky/Kull-Vietsub" target="_blank" style="color:#3ea6ff; text-decoration:none; font-weight:bold;">🔗 github.com/zingky/Kull-Vietsub</a>
                </div>
                <span style="color:#3ea6ff; font-weight:bold; cursor:pointer;">AEGISUB Loader by Gemini x Kull</span>
            </div>
            <div id="footer-popup-settings-panel" style="display:none; position:absolute; bottom:32px; left:8px; background:rgba(20,20,20,0.98); border:1px solid #444; border-radius:8px; padding:10px; z-index:2147483647; min-width:220px; box-shadow:0 10px 30px rgba(0,0,0,0.8);">Loading...</div>`;
        document.body.appendChild(popup);
        setupUIEvents(popup);
    }

    function setupUIEvents(popup) {
        const header = popup.querySelector('#sub-header');
        let isDragging = false, offset = [0, 0];
        header.onmousedown = (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
            isDragging = true;
            offset = [popup.offsetLeft - e.clientX, popup.offsetTop - e.clientY];
        };
        document.addEventListener('mousemove', (e) => { if (isDragging) { popup.style.left = (e.clientX + offset[0]) + 'px'; popup.style.top = (e.clientY + offset[1]) + 'px'; } });
        document.addEventListener('mouseup', () => { if (isDragging) __.saveCache(); isDragging = false; });

        ['isBold', 'isItalic', 'isUnderline', 'isStrike'].forEach(key => {
            const btn = document.getElementById('btn-' + key);
            if (btn) btn.onclick = () => { __.globalSettings[key] = !__.globalSettings[key]; btn.classList.toggle('active'); __.saveCache(); };
        });

        // Quick Time Shift
        const tsInput = document.getElementById('ts-input');
        document.getElementById('ts-dec').onclick = () => { tsInput.value = parseInt(tsInput.value || 0) - 100; __.applyTimeShift(parseInt(tsInput.value)); };
        document.getElementById('ts-inc').onclick = () => { tsInput.value = parseInt(tsInput.value || 0) + 100; __.applyTimeShift(parseInt(tsInput.value)); };
        document.getElementById('ts-reset').onclick = () => { tsInput.value = 0; __.applyTimeShift(0); };
        tsInput.addEventListener('change', () => __.applyTimeShift(parseInt(tsInput.value) || 0));
        tsInput.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -100 : 100;
            tsInput.value = parseInt(tsInput.value || 0) + delta;
            __.applyTimeShift(parseInt(tsInput.value));
        }, { passive: false });

        // Main input handler
        popup.addEventListener('input', (e) => {
            const id = e.target.id, style = e.target.getAttribute('data-style'), type = e.target.getAttribute('data-type'), kTab = e.target.getAttribute('data-k');
            let val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;

            if (kTab) {
                __.globalSettings[kTab][type] = (e.target.type === 'number' || e.target.type === 'range') ? parseFloat(val) : val;
                const pair = e.target.closest('.g-row').querySelector(`input[data-k="${kTab}"][data-type="${type}"][type="${e.target.type === 'range' ? 'number' : 'range'}"]`);
                if (pair) pair.value = val;
            } else if (style) {
                __.styleSettings[style][type] = (e.target.type === 'number') ? parseFloat(val) : val;
                if (type === 'posX' || type === 'posY') {
                    const sibling = e.target.closest('div').querySelector(`input[data-type="${type}"][type="${e.target.type === 'range' ? 'number' : 'range'}"]`);
                    if (sibling) sibling.value = val;
                }
                if (type === 'override') {
                    const adv = e.target.closest('.style-item').querySelector('.adv-style');
                    if (adv) adv.style.display = val ? 'block' : 'none';
                }
                __.saveSubToStorage();
            } else if (id) {
                if (id === 'pop-zoom') {
                    __.globalSettings.popupZoom = parseFloat(val);
                    document.getElementById('sub-pro-popup').style.zoom = val;
                } else if (id === 'pop-opacity') {
                    __.globalSettings.popupOpacity = parseFloat(val);
                    popup.style.background = `rgba(15, 15, 15, ${val})`;
                } else if (id === 'fontSelect') { __.globalSettings.fontFamily = val; __.saveCache(); }
                else if (id === 'ts-input') { /* handled separately */ }
                else {
                    const key = id.replace('g-', '').replace('Val', '').replace('Hex', '');
                    __.globalSettings[key] = (e.target.type === 'number' || e.target.type === 'range') ? parseFloat(val) : val;
                    const pair = document.getElementById(id.includes('Val') ? id.replace('Val', '') : id + 'Val');
                    if (pair) pair.value = val;
                }
            }
            __.saveCache();
        });

        popup.querySelectorAll('.k-tab-btn').forEach(b => {
            b.onclick = () => {
                popup.querySelectorAll('.k-tab-btn').forEach(x => x.classList.remove('active'));
                popup.querySelectorAll('.k-tab-content').forEach(x => x.style.display = 'none');
                b.classList.add('active');
                document.getElementById(`k-${b.dataset.tab}-panel`).style.display = 'block';
            };
        });

        // Draggable divider
        const divider = document.getElementById('divider');
        if (divider) {
            let isResizing = false;
            divider.addEventListener('mousedown', (e) => { isResizing = true; document.body.style.cursor = 'col-resize'; e.preventDefault(); });
            document.addEventListener('mousemove', (e) => {
                if (!isResizing) return;
                const container = popup.querySelector('#popup-inner');
                const left = document.getElementById('panel-left');
                const right = document.getElementById('styleListContainer');
                const containerRect = container.getBoundingClientRect();
                let leftWidth = e.clientX - containerRect.left - (divider.offsetWidth / 2);
                leftWidth = Math.max(150, Math.min(leftWidth, containerRect.width - 150 - divider.offsetWidth));
                left.style.flex = 'none';
                left.style.width = leftWidth + 'px';
                right.style.flex = '1';
            });
            document.addEventListener('mouseup', () => { if (isResizing) { isResizing = false; document.body.style.cursor = ''; } });
        }

        // Click outside popup to close (persistent listener, never removed)
        document.addEventListener('mousedown', function __clickOutside(e) {
            const p = document.getElementById('sub-pro-popup');
            const btn = document.getElementById('sub-ultra-btn');
            if (p && p.style.display !== 'none' && !p.contains(e.target) && !(btn && btn.contains(e.target)) && __.globalSettings.closeOnClickOutside) {
                p.style.display = 'none';
            }
        });

        // Search input handler
        const searchInput = document.getElementById('sub-search-input');
        const dropdown = document.getElementById('sub-file-dropdown');

        // Fetch file list button - Explicit Refresh
        document.getElementById('btn-fetch-list').onclick = async () => {
            const btnFetch = document.getElementById('btn-fetch-list');
            btnFetch.innerText = '...';
            btnFetch.disabled = true;
            await __.fetchFileList(true); // force refresh from server
            btnFetch.innerText = '🔍';
            btnFetch.disabled = false;
            __.renderFileDropdown(dropdown, searchInput.value);
            dropdown.style.display = 'block';
        };

        searchInput.addEventListener('focus', async () => {
            await __.fetchFileList(false); // load cache if exists
            __.renderFileDropdown(dropdown, searchInput.value);
            dropdown.style.display = 'block';
        });

        searchInput.addEventListener('input', async () => {
            await __.fetchFileList(false); // load cache if exists
            __.renderFileDropdown(dropdown, searchInput.value);
            dropdown.style.display = 'block';
        });

        // Close dropdown when clicking outside
        document.addEventListener('mousedown', function __closeSearchDropdown(e) {
            if (!dropdown.contains(e.target) && e.target !== searchInput) {
                dropdown.style.display = 'none';
            }
        });

        // When user selects a file from dropdown
        dropdown.addEventListener('click', async (e) => {
            const item = e.target.closest('.sub-file-item');
            if (item && item.dataset.filename) {
                dropdown.style.display = 'none';
                searchInput.value = item.dataset.filename;
                const statusEl = document.getElementById('auto-sub-status');
                if (statusEl) { statusEl.className = "status-tag status-none"; statusEl.innerText = "Loading..."; }
                await __.loadAssFromGitHub(item.dataset.filename);
            }
        });
        document.getElementById('reset-ui').onclick = () => { localStorage.clear(); chrome.storage.local.clear(); location.reload(); };
        document.getElementById('closeSubPopup').onclick = () => popup.style.display = 'none';
        document.getElementById('assFile').onchange = async (e) => { if (typeof __.parseASS === 'function') __.parseASS(await e.target.files[0].text()); };
        document.getElementById('btn-download-sub').onclick = __.downloadCurrentSub;

        // Pill Tab switching
        popup.querySelectorAll('.pill-tab').forEach(tab => {
            tab.onclick = () => {
                const key = tab.dataset.pill;
                popup.querySelectorAll('.pill-tab').forEach(t => t.classList.remove('active'));
                popup.querySelectorAll('.pill-panel').forEach(p => p.classList.remove('open'));
                tab.classList.add('active');
                const panel = popup.querySelector(`.pill-panel[data-pill="${key}"]`);
                if (panel) panel.classList.add('open');
            };
        });

        // Footer settings panel toggle
        const footerPanel = document.getElementById('footer-popup-settings-panel');
        const footerBtn = document.getElementById('footer-popup-settings-btn');

        function renderSourcesList() {
            let html = '';
            __.subSources.forEach(src => {
                html += `<div style="display:flex; align-items:center; gap:3px; margin-bottom:2px; font-size:9px;">
                    <input type="checkbox" id="src-tgl-${src.id}" ${src.enabled ? 'checked' : ''} style="margin:0;">
                    <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#ccc;">${src.repo}/${src.path}</span>
                    <button class="src-remove-btn" data-id="${src.id}" style="background:none; border:1px solid #c33; color:#c33; cursor:pointer; border-radius:2px; padding:0px 4px; font-size:8px;">×</button>
                </div>`;
            });
            return html;
        }

        footerPanel.innerHTML = `
            <div style="display:flex; align-items:center; gap:4px; margin-bottom:6px;">
                <input type="checkbox" id="g-closeOnClickOutside" ${__.globalSettings.closeOnClickOutside ? 'checked' : ''}> <b style="font-size:10px;">Close on click outside</b>
            </div>
            <div style="display:flex; align-items:center; gap:4px; margin-bottom:6px;">
                <input type="checkbox" id="g-constrainToVideo" ${__.globalSettings.constrainToVideo ? 'checked' : ''}> <b style="font-size:10px;">Constrain to Video Frame</b>
            </div>
            <div style="border-top:1px solid rgba(255,255,255,0.1); padding-top:6px;">
                <b style="font-size:10px;">📂 Sub Sources</b>
                <div id="sources-list" style="margin-top:3px;">${renderSourcesList()}</div>
                <div style="display:flex; gap:3px; margin-top:4px;">
                    <input type="text" id="new-source-url" placeholder="Paste GitHub URL..." style="flex:1; background:rgba(255,255,255,0.1); border:1px solid #444; color:#fff; font-size:8px; border-radius:3px; padding:1px 4px;">
                    <button id="btn-add-source" style="background:rgba(255,255,255,0.1); border:1px solid #4a4; color:#4a4; cursor:pointer; font-size:9px; border-radius:3px; padding:1px 5px;">+ Add</button>
                </div>
            </div>
            <div style="border-top:1px solid rgba(255,255,255,0.1); padding-top:6px; margin-top:4px;">
                <b style="font-size:10px;">📦 Data Management</b>
                <div style="display:flex; gap:4px; margin-top:4px; flex-wrap:wrap;">
                    <button id="btn-backup-all" style="background:rgba(255,255,255,0.1); border:1px solid #444; color:#fff; font-size:9px; padding:2px 8px; border-radius:4px; cursor:pointer;">Backup All</button>
                    <button id="btn-export-current" style="background:rgba(255,255,255,0.1); border:1px solid #444; color:#fff; font-size:9px; padding:2px 8px; border-radius:4px; cursor:pointer;">Export Current</button>
                    <button id="btn-import-data" style="background:rgba(255,255,255,0.1); border:1px solid #444; color:#fff; font-size:9px; padding:2px 8px; border-radius:4px; cursor:pointer;">Import</button>
                </div>
                <input type="file" id="importFile" accept=".json" style="font-size:8px; width:100%; margin-top:4px; display:none;">
            </div>`;
        // Close on click outside toggle
        popup.addEventListener('change', (e) => {
            if (e.target.id === 'g-closeOnClickOutside') {
                __.globalSettings.closeOnClickOutside = e.target.checked;
                __.saveCache();
            }
            if (e.target.id === 'g-constrainToVideo') {
                __.globalSettings.constrainToVideo = e.target.checked;
                __.saveCache();
            }
        });

        // Sources add/remove/toggle
        document.getElementById('btn-add-source').onclick = () => {
            const url = document.getElementById('new-source-url').value.trim();
            if (!url) return;
            if (__.addSource(url)) {
                document.getElementById('new-source-url').value = '';
                document.getElementById('sources-list').innerHTML = renderSourcesList();
                wireSourceEvents();
            } else {
                alert('Invalid GitHub URL. Expected format: https://github.com/user/repo/tree/branch/path');
            }
        };
        // Allow Enter key to add source
        document.getElementById('new-source-url').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') document.getElementById('btn-add-source').click();
        });

        function wireSourceEvents() {
            document.querySelectorAll('.src-remove-btn').forEach(btn => {
                btn.onclick = () => {
                    __.removeSource(btn.dataset.id);
                    document.getElementById('sources-list').innerHTML = renderSourcesList();
                    wireSourceEvents();
                };
            });
            document.querySelectorAll('#sources-list input[type="checkbox"]').forEach(cb => {
                cb.onchange = () => {
                    const id = cb.id.replace('src-tgl-', '');
                    __.toggleSource(id);
                };
            });
        }
        wireSourceEvents();
        footerBtn.onclick = (e) => {
            e.stopPropagation();
            const isOpen = footerPanel.style.display !== 'none';
            footerPanel.style.display = isOpen ? 'none' : 'block';
        };
        // Close footer panel when clicking outside it
        document.addEventListener('mousedown', function __closeFooterPanel(e2) {
            if (footerPanel.style.display !== 'none' && !footerPanel.contains(e2.target) && e2.target !== footerBtn) {
                footerPanel.style.display = 'none';
            }
        });
        // Backup All
        document.getElementById('btn-backup-all').onclick = () => {
            chrome.storage.local.get(null, (all) => {
                const data = { version: 1, globalSettings: __.globalSettings, videoConfigs: all };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `kull_sub_backup_all_${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(a.href);
            });
        };
        document.getElementById('btn-export-current').onclick = () => {
            const id = __.getVideoId();
            if (!id) return alert('No video ID detected.');
            chrome.storage.local.get([id], (result) => {
                const data = { version: 1, globalSettings: __.globalSettings, videoConfigs: result[id] ? { [id]: result[id] } : {} };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `kull_sub_${id}.json`;
                a.click();
                URL.revokeObjectURL(a.href);
            });
        };
        const importBtn2 = document.getElementById('btn-import-data');
        const importFile2 = document.getElementById('importFile');
        importBtn2.onclick = () => importFile2.click();
        importFile2.onchange = async (e) => {
            if (!e.target.files[0]) return;
            try {
                const data = JSON.parse(await e.target.files[0].text());
                if (data.globalSettings) { Object.assign(__.globalSettings, data.globalSettings); __.saveCache(); }
                if (data.videoConfigs && typeof data.videoConfigs === 'object') {
                    const videoIds = Object.keys(data.videoConfigs);
                    chrome.storage.local.get(videoIds, (existing) => {
                        const merged = {};
                        videoIds.forEach(vid => { merged[vid] = data.videoConfigs[vid]; });
                        chrome.storage.local.set(merged, () => {
                            const curId = __.getVideoId();
                            if (curId && data.videoConfigs[curId]) {
                                const cfg = data.videoConfigs[curId];
                                if (cfg.subtitles) __.subtitles = cfg.subtitles;
                                if (cfg.playResX) __.playResX = cfg.playResX;
                                if (cfg.playResY) __.playResY = cfg.playResY;
                                if (cfg.styleSettings) __.styleSettings = cfg.styleSettings;
                                if (typeof __.renderStyles === 'function') __.renderStyles();
                            }
                            alert(`✅ Imported ${videoIds.length} video(s).`);
                        });
                    });
                } else { alert('✅ Global settings restored.'); }
            } catch (err) { alert('❌ Invalid file: ' + err.message); }
            importFile2.value = '';
        };
    }

    __.createUI = createUI;
    __.setupUIEvents = setupUIEvents;

    // Download function
    __.downloadCurrentSub = async function () {
        const subsToDL = __.getShiftedSubs();
        if (!subsToDL.length) return;

        let assContent = '[Script Info]\n';
        assContent += 'ScriptType: v4.00+\n';
        assContent += `PlayResX: ${__.playResX}\n`;
        assContent += `PlayResY: ${__.playResY}\n\n`;

        assContent += '[V4+ Styles]\n';
        assContent += 'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n';
        Object.keys(__.styleSettings).forEach(name => {
            const s = __.styleSettings[name];
            const c1Ass = __.hexToAss(s.color1);
            const c3Ass = __.hexToAss(s.color3);
            assContent += `Style: ${name},Arial,20,${c1Ass},&H0000FF,${c3Ass},&H000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1\n`;
        });

        assContent += '\n[Events]\n';
        assContent += 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n';
        subsToDL.forEach((sub, idx) => {
            const startStr = __.formatTimeAss(sub.start);
            const endStr = __.formatTimeAss(sub.end);
            const styleName = sub.style;
            let text = '';
            const origSub = __.subtitles[idx];
            if (origSub && origSub.syllables && origSub.syllables.length > 0) {
                origSub.syllables.forEach(syl => {
                    const durCs = Math.round((syl.timeEnd - syl.timeStart) / 10);
                    text += `{\\k${durCs}}${syl.text}`;
                });
            } else {
                text = (origSub ? origSub.text : sub.text || '').replace(/\n/g, '\\N');
            }
            assContent += `Dialogue: 0,${startStr},${endStr},${styleName},,0,0,0,,${text}\n`;
        });

        const vid = __.getVideoId() || 'unknown';
        const title = __.sanitizeFilename(await __.getVideoTitle() || vid);
        const filename = `${vid}_${title}.ass`;

        const blob = new Blob([assContent], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
})();