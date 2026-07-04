(function () {
    'use strict';

    const __ = window.__SUB;

    __.saveSubToStorage = function () {
        const id = __.getVideoId();
        if (id && __.subtitles.length) {
            chrome.storage.local.set({ [id]: { subtitles: __.subtitles, playResX: __.playResX, playResY: __.playResY, styleSettings: __.styleSettings } });
        }
    };

    __.renderStyles = function () {
        const container = document.getElementById('styleItems');
        if (!container) return;
        container.innerHTML = '';
        const priority = (n) => {
            n = n.toLowerCase();
            return n.includes('viet') ? 1 : n.includes('roma') ? 2 : n.includes('kanji') ? 3 : 99;
        };
        Object.keys(__.styleSettings).sort((a, b) => priority(a) - priority(b)).forEach(sName => {
            const s = __.styleSettings[sName];
            const item = document.createElement('div');
            item.className = 'style-item';
            item.innerHTML = `
                <div class="style-head"><span>${sName}</span><div style="display:flex;align-items:center;gap:6px;"><span class="reset-style-btn" style="cursor:pointer;font-size:10px;color:#ffaa00;" data-style="${sName}">⟳</span><span class="eye-btn" style="cursor:pointer;opacity:${s.visible ? 1 : 0.3}">${s.visible ? '👁️' : '🚫'}</span><label style="display:flex;align-items:center;height:16px;"><input type="checkbox" data-style="${sName}" data-type="override" ${s.override ? 'checked' : ''} style="margin:0;height:12px;"> <span style="font-size:12px;display:flex;align-items:center;">⚙️</span></label><span>▼</span></div></div>
                <div class="style-body" style="display:none;">
                    <div class="g-row" style="margin-bottom:2px;">X <input type="range" data-style="${sName}" data-type="posX" min="0" max="${__.playResX * 2}" value="${s.posX}"> <input type="number" value="${s.posX}" class="num-in" data-style="${sName}" data-type="posX"></div>
                    <div class="g-row" style="margin-bottom:2px;">Y <input type="range" data-style="${sName}" data-type="posY" min="0" max="${__.playResY * 2}" value="${s.posY}"> <input type="number" value="${s.posY}" class="num-in" data-style="${sName}" data-type="posY"></div>
                    <div class="adv-style" style="display:${s.override ? 'block' : 'none'};">
                        <div class="g-row" style="margin-bottom:0px;">
                            <span style="width:18px;color:#aaa;font-weight:bold;font-size:.75em;">1c</span><input type="color" data-style="${sName}" data-type="color1" value="${s.color1}" style="width:27px;height:23px;">
                            <span style="width:18px;color:#aaa;font-weight:bold;font-size:.75em;text-align:center;">3c</span><input type="color" data-style="${sName}" data-type="color3" value="${s.color3}" style="width:27px;height:23px;">
                            <span style="width:10px;color:#aaa;font-weight:bold;font-size:.75em;text-align:center;">S</span><input type="number" data-style="${sName}" data-type="fontSize" value="${s.fontSize}" class="num-in" style="width:35px;max-width:35px;">
                            <span style="width:10px;color:#aaa;font-weight:bold;font-size:.75em;text-align:center;">O</span><input type="number" data-style="${sName}" data-type="outlineWidth" value="${s.outlineWidth}" class="num-in" style="width:35px;max-width:35px;" step="0.1">
                            <span style="width:10px;color:#aaa;font-weight:bold;font-size:.75em;text-align:center;">B</span><input type="number" data-style="${sName}" data-type="blur" value="${s.blur}" class="num-in" style="width:35px;max-width:35px;" step="0.1">
                        </div>
                    </div>
                </div>`;
            item.querySelector('.reset-style-btn').onclick = (e) => {
                e.stopPropagation();
                s.posX = __.playResX / 2;
                if (sName.toLowerCase().includes('roma')) s.posY = 80;
                else if (sName.toLowerCase().includes('kanji')) s.posY = 155;
                else s.posY = __.playResY - 80;
                s.fontSize = 23;
                s.outlineWidth = 1.5;
                s.blur = 2;
                __.saveSubToStorage();
                __.renderStyles();
            };
            item.querySelector('.eye-btn').onclick = (e) => {
                e.stopPropagation();
                s.visible = !s.visible;
                e.target.innerText = s.visible ? '👁️' : '🚫';
                e.target.style.opacity = s.visible ? 1 : 0.3;
                __.saveSubToStorage();
            };
            item.querySelector('.style-head').onclick = (e) => {
                if (e.target.tagName !== 'INPUT' && !e.target.classList.contains('eye-btn') && !e.target.closest('label')) {
                    const b = item.querySelector('.style-body');
                    const wasHidden = b.style.display === 'none';
                    b.style.display = wasHidden ? 'block' : 'none';
                }
            };
            container.appendChild(item);
        });
    };

    // ============ RESIZE LAYER TO COVER FULL PLAYER ============
    // Subtitles always span the full player height (including controls area)
    // so they can appear near the bottom, under the YouTube controls overlay.
    function resizeLayer() {
        const layer = document.getElementById('sub-ultra-layer');
        const video = document.querySelector('video');
        if (!layer || !video) return;
        const player = video.closest('.html5-video-player');
        if (player) {
            const pRect = player.getBoundingClientRect();
            const vRect = video.getBoundingClientRect();
            const offsetLeft = vRect.left - pRect.left;
            const offsetTop = vRect.top - pRect.top;

            if (__.globalSettings.constrainToVideo && typeof __.getActiveVideoRect === 'function') {
                const vr = __.getActiveVideoRect();
                if (vr) {
                    // Keep subtitles inside the active video area (no overflow into controls)
                    layer.style.left = vr.left + 'px';
                    layer.style.top = vr.top + 'px';
                    layer.style.width = vr.width + 'px';
                    layer.style.height = vr.height + 'px';
                    layer.style.position = 'absolute';
                    layer.style.bottom = 'auto';
                    return;
                }
            }
            // Cover full player area (extends into controls area at bottom)
            layer.style.left = '0';
            layer.style.top = '0';
            layer.style.width = '100%';
            layer.style.height = '100%';
            layer.style.position = 'absolute';
            layer.style.bottom = 'auto';
            return;
        }
        // Fallback
        layer.style.left = '0';
        layer.style.top = '0';
        layer.style.width = '100%';
        layer.style.height = '100%';
    }

    // ============ UPDATE SUBTITLES ============
    function updateSubtitle() {
        const video = document.querySelector('video');
        const layer = document.getElementById('sub-ultra-layer');
        if (video && layer && __.subtitles.length) {
            // Resize layer to active video area each frame (handles fullscreen transitions)
            resizeLayer();
            layer.innerHTML = '';
            const time = video.currentTime;
            const shifted = __.getShiftedSubs();
            const active = shifted.filter(s => time >= s.start && time <= s.end);

            // ============ FIRST PASS: compute line data & detect explicit ============
            const lines = [];
            active.forEach(sub => {
                const s = __.styleSettings[sub.style] || { visible: true };
                if (!s.visible) return;
                const isO = s.override;
                const fs = (isO ? s.fontSize : __.globalSettings.fontSize) + (__.isFullscreen ? 10 : 0);
                const ow = isO ? s.outlineWidth : __.globalSettings.outlineWidth;
                const bl = isO ? s.blur : __.globalSettings.blur;
                const oc = isO ? (s.color3 || __.globalSettings.color3) : __.globalSettings.color3;
                const c1 = isO ? s.color1 : __.globalSettings.color1;
                const ub = __.globalSettings.useBox;
                const bc = __.globalSettings.boxColor;
                const bo = __.globalSettings.boxOpacity;
                let posX = sub.filePos ? sub.filePos.x : (s.posX || __.playResX / 2);
                let posY = sub.filePos ? sub.filePos.y : (s.posY || __.playResY - 35);
                // Explicit positioning: has \pos() in ASS, or style's pos differs from parser default
                const isExplicit = !!sub.filePos;

                lines.push({ sub, s, isO, fs, ow, bl, oc, c1, ub, bc, bo, posX, posY, isExplicit });
            });

            // ============ RESOLVE OVERLAP for AUTO-positioned lines ============
            // Only auto-positioned lines (no \pos() in ASS) get auto-stacked
            const autoLines = lines.filter(l => !l.isExplicit).sort((a, b) => a.posY - b.posY);
            let idx = 0;
            while (idx < autoLines.length) {
                let end = idx;
                // Group lines whose Y positions are within 40px of each other
                while (end + 1 < autoLines.length && autoLines[end + 1].posY - autoLines[idx].posY < 40) {
                    end++;
                }
                const group = autoLines.slice(idx, end + 1);
                if (group.length > 1) {
                    // Offset each subsequent line downward by (fontSize + 10px) spacing
                    const baseY = group[0].posY;
                    group.forEach((line, i) => {
                        line.posY = baseY + i * (line.fs + 10);
                    });
                }
                idx = end + 1;
            }

            // ============ SECOND PASS: render all lines ============
            lines.forEach(({ sub, s, isO, fs, ow, bl, oc, c1, ub, bc, bo, posX, posY }) => {
                let opacity = 1;
                const fadIn = __.globalSettings.fadIn / 1000;
                const fadOut = __.globalSettings.fadOut / 1000;
                if (time - sub.start < fadIn) opacity = (time - sub.start) / fadIn;
                else if (sub.end - time < fadOut) opacity = (sub.end - time) / fadOut;

                // Always use percentage-based positioning within the layer
                // (the layer is already sized to active video rect via resizeLayer())
                const div = document.createElement('div');
                div.style.cssText = `position:absolute; left:${(posX / __.playResX * 100)}%; top:${(posY / __.playResY * 100)}%; transform:translate(-50%, -50%); font-size:${fs}px; font-family:'${__.globalSettings.fontFamily}'; font-weight:${__.globalSettings.isBold ? 'bold' : 'normal'}; font-style:${__.globalSettings.isItalic ? 'italic' : 'normal'}; text-decoration:${__.globalSettings.isUnderline ? 'underline' : ''} ${__.globalSettings.isStrike ? 'line-through' : ''}; text-align:center; white-space:nowrap; pointer-events:none; width:calc(100% - 20px); z-index:99; opacity:${Math.max(0, opacity)};`;
                const spanWrap = document.createElement('span');
                if (ub) {
                    spanWrap.style.backgroundColor = __.hexToRgba(bc, bo);
                    spanWrap.style.padding = '4px 10px';
                    spanWrap.style.borderRadius = '6px';
                }
                if (sub.syllables.length > 0) {
                    const lineElapsed = (time - sub.start) * 1000;
                    sub.syllables.forEach(syl => {
                        const span = document.createElement('span');
                        span.innerText = syl.text;
                        span.className = 'syllable';
                        let ks, zoom = 1;
                        let sylBlur = 0;
                        if (lineElapsed < syl.timeStart) {
                            ks = __.globalSettings.kPre;
                            sylBlur = ks.blur;
                        } else if (lineElapsed >= syl.timeStart && lineElapsed < syl.timeEnd) {
                            ks = __.globalSettings.kActive;
                            sylBlur = ks.blur;
                            const sEl = lineElapsed - syl.timeStart;
                            const sRem = syl.timeEnd - lineElapsed;
                            const zIn = ks.zIn || 100;
                            const zOut = ks.zOut || 100;
                            if (sEl < zIn) zoom = 1 + (ks.zoom - 1) * (sEl / zIn);
                            else if (sRem < zOut) zoom = 1 + (ks.zoom - 1) * (sRem / zOut);
                            else zoom = ks.zoom;
                        } else {
                            ks = __.globalSettings.kPost;
                            sylBlur = ks.blur;
                        }
                        const oSize = Number(ks.outl) || 0;
                        Object.assign(span.style, {
                            color: ks.c1,
                            transform: `scale(${zoom})`,
                            textShadow: oSize > 0 || sylBlur > 0 ? `0 0 ${sylBlur}px ${ks.c3}` : 'none',
                            webkitTextStroke: oSize > 0 ? `${oSize}px ${ks.c3}` : 'none',
                            paintOrder: 'stroke fill'
                        });
                        spanWrap.appendChild(span);
                    });
                } else {
                    const outlineSize = isO ? s.outlineWidth : __.globalSettings.outlineWidth;
                    const outlineColor = isO ? (s.color3 || __.globalSettings.color3) : __.globalSettings.color3;
                    if (outlineSize > 0) {
                        spanWrap.style.webkitTextStroke = `${outlineSize}px ${outlineColor}`;
                        spanWrap.style.paintOrder = 'stroke fill';
                    }
                    spanWrap.innerText = sub.text;
                    spanWrap.style.color = c1;
                    spanWrap.style.textShadow = __.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc);
                }
                div.appendChild(spanWrap);
                layer.appendChild(div);
            });
        }
        requestAnimationFrame(updateSubtitle);
    }

    // ============ FULLSCREEN / RESIZE MONITORING ============
    const origRequestFullscreen = HTMLVideoElement.prototype.requestFullscreen || HTMLVideoElement.prototype.webkitRequestFullscreen;
    if (origRequestFullscreen) {
        HTMLVideoElement.prototype.requestFullscreen = HTMLVideoElement.prototype.webkitRequestFullscreen = function () {
            __.isFullscreen = true;
            return origRequestFullscreen.apply(this, arguments);
        };
    }

    document.addEventListener('fullscreenchange', () => { __.isFullscreen = !!document.fullscreenElement; });
    document.addEventListener('webkitfullscreenchange', () => { __.isFullscreen = !!document.webkitFullscreenElement; });
    // YouTube fires transitionend when switching to/from fullscreen
    document.addEventListener('transitionend', (e) => {
        if (e.target.closest && e.target.closest('.html5-video-player')) {
            // invalidate rect cache, next frame will recalculate
        }
    });

    __.startEngine = function () {
        requestAnimationFrame(updateSubtitle);
    };
})();
