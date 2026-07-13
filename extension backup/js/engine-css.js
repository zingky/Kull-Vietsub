(function () {
    'use strict';

    const __ = window.__SUB;

    // If libass mode is on, skip CSS engine entirely
    if (__.globalSettings.libassMode) {
        if (!__.startEngine) {
            __.startEngine = function () {};
        }
        return;
    }

    // Known available fonts check
    function isFontAvailable(fontName) {
        if (!fontName) return false;
        const testStr = 'abcdefghijklmnopqrstuvwxyz';
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 30;
        const ctx = canvas.getContext('2d');
        ctx.font = '20px ' + fontName;
        const refW = ctx.measureText(testStr).width;
        ctx.font = '20px VNF-Comic Sans';
        const altW = ctx.measureText(testStr).width;
        ctx.font = '20px "' + fontName + '", monospace';
        const mw = ctx.measureText(testStr).width;
        ctx.font = '20px monospace';
        const fw = ctx.measureText(testStr).width;
        return Math.abs(mw - fw) > 2;
    }

    __.availableFontsCache = {};

    __.getStyleFontFamily = function (styleName) {
        const s = __.styleSettings[styleName];
        if (!s || !s.fontName) return __.globalSettings.fontFamily;
        if (s.fontName.toLowerCase() === 'arial' || s.fontName.toLowerCase() === 'tahoma' || s.fontName.toLowerCase() === 'verdana' || s.fontName.toLowerCase() === 'segoe ui' || s.fontName.toLowerCase() === 'times new roman' || s.fontName.toLowerCase() === 'vnf-comic sans') {
            return s.fontName;
        }
        if (__.availableFontsCache[s.fontName] === undefined) {
            __.availableFontsCache[s.fontName] = isFontAvailable(s.fontName);
        }
        if (__.availableFontsCache[s.fontName]) {
            return s.fontName;
        }
        return __.globalSettings.fontFamily;
    };

    // ============ INJECT SPECIAL EFFECTS KEYFRAMES ============
    (function injectEffectKeyframes() {
        if (document.getElementById('eff-keyframes')) return;
        const style = document.createElement('style');
        style.id = 'eff-keyframes';
        style.textContent = `
            .eff-sine-char {
                display: inline-block;
                white-space: pre;
            }
        `;
        document.head.appendChild(style);
    })();

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
        // Collect which styles are actually used by subtitle lines
        const usedStyles = new Set();
        if (__.subtitles && __.subtitles.length) {
            __.subtitles.forEach(sub => {
                if (sub.style) usedStyles.add(sub.style);
            });
        }
        const priority = (n) => {
            n = n.toLowerCase();
            return n.includes('viet') ? 1 : n.includes('roma') ? 2 : n.includes('kanji') ? 3 : 99;
        };
        Object.keys(__.styleSettings).sort((a, b) => priority(a) - priority(b)).forEach(sName => {
            // Skip styles with no subtitle lines using them
            if (!usedStyles.has(sName)) return;
            const s = __.styleSettings[sName];
            const fontAvailable = __.getStyleFontFamily(sName);
            const fontWarn = (s.fontName && fontAvailable !== s.fontName) ? ' ⚠️' : '';
            const item = document.createElement('div');
            item.className = 'style-item';
            item.innerHTML = `
                <div class="style-head"><span title="Font: ${s.fontName || 'default'}">${sName}${fontWarn}</span><div style="display:flex;align-items:center;gap:6px;"><span class="reset-style-btn" style="cursor:pointer;font-size:10px;color:#ffaa00;" data-style="${sName}">⟳</span><span class="eye-btn" style="cursor:pointer;opacity:${s.visible ? 1 : 0.3}">${s.visible ? '👁️' : '🚫'}</span><label style="display:flex;align-items:center;height:16px;"><input type="checkbox" data-style="${sName}" data-type="override" ${s.override ? 'checked' : ''} style="margin:0;height:12px;"> <span style="font-size:12px;display:flex;align-items:center;">⚙️</span></label><span>▼</span></div></div>
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
                // Reset to original ASS position (fallback to current align/margins if orig missing)
                const a = s.origAlign || s.align || 2;
                const mL = (s.origMarginL !== undefined && s.origMarginL !== null) ? s.origMarginL : (s.marginL || 10);
                const mR = (s.origMarginR !== undefined && s.origMarginR !== null) ? s.origMarginR : (s.marginR || 10);
                const mV = (s.origMarginV !== undefined && s.origMarginV !== null) ? s.origMarginV : (s.marginV || 10);
                switch (a) {
                    case 1: case 4: case 7: s.posX = mL + 10; break;
                    case 3: case 6: case 9: s.posX = __.playResX - mR - 10; break;
                    default: s.posX = __.playResX / 2;
                }
                switch (a) {
                    case 7: case 8: case 9: s.posY = mV + 10; break;
                    case 4: case 5: case 6: s.posY = __.playResY / 2; break;
                    default: s.posY = __.playResY - mV - 10;
                }
                s.color1 = s.origColor1 || '#ffffff';
                s.color3 = s.origColor3 || '#000000';
                s.fontSize = 25;
                s.outlineWidth = 2;
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
        const listContainer = container.closest('#styleListContainer');
        if (listContainer) {
            const count = Object.keys(__.styleSettings).length;
            if (count > 4) {
                listContainer.style.overflowY = 'auto';
                listContainer.style.maxHeight = 'none';
            } else {
                listContainer.style.overflowY = 'auto';
                listContainer.style.maxHeight = 'none';
            }
        }
    };

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
                    layer.style.left = vr.left + 'px';
                    layer.style.top = vr.top + 'px';
                    layer.style.width = vr.width + 'px';
                    layer.style.height = vr.height + 'px';
                    layer.style.position = 'absolute';
                    layer.style.bottom = 'auto';
                    return;
                }
            }
            layer.style.left = '0';
            layer.style.top = '0';
            layer.style.width = '100%';
            layer.style.height = '100%';
            layer.style.position = 'absolute';
            layer.style.bottom = 'auto';
            return;
        }
        layer.style.left = '0';
        layer.style.top = '0';
        layer.style.width = '100%';
        layer.style.height = '100%';
    }

    // ============ ANIMATION STATE ============
    let _animFrameCount = 0;

    // ============ RAINBOW OUTLINE WITH SEPARATE STROKE ============
    function renderRainbowOutline(spanWrap, lineText, ow, bl, oc) {
        spanWrap.style.color = '#ffffff';
        spanWrap.style.webkitTextStroke = 'none';
        spanWrap.style.textShadow = 'none';
        spanWrap.style.filter = '';
        spanWrap.style.position = 'relative';
        const textSpan = document.createElement('span');
        textSpan.textContent = lineText;
        textSpan.style.color = '#ffffff';
        textSpan.style.position = 'relative';
        textSpan.style.zIndex = '2';
        const shadowLayer = document.createElement('span');
        shadowLayer.textContent = lineText;
        shadowLayer.style.position = 'absolute';
        shadowLayer.style.left = '0';
        shadowLayer.style.top = '0';
        shadowLayer.style.color = 'transparent';
        shadowLayer.style.zIndex = '1';
        const speedMul = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.rainbow_outline || 1) * 0.8;
        const hueDeg = (_animFrameCount * speedMul) % 360;
        if (ow > 0) {
            shadowLayer.style.textShadow = __.buildShadow(ow, bl, '#ff0000');
            shadowLayer.style.filter = `hue-rotate(${hueDeg}deg)`;
        }
        shadowLayer.style.pointerEvents = 'none';
        spanWrap.style.display = 'inline-block';
        spanWrap.style.position = 'relative';
        spanWrap.appendChild(textSpan);
        spanWrap.appendChild(shadowLayer);
    }

    function renderRainbowOutlineRgb(spanWrap, lineText, ow, bl, oc) {
        spanWrap.style.color = '#ffffff';
        spanWrap.style.webkitTextStroke = 'none';
        spanWrap.style.textShadow = 'none';
        spanWrap.style.filter = '';
        spanWrap.style.position = 'relative';
        const speedMul = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.rainbow_outline_rgb || 1) * 1.2;
        const bgShift = 200 - ((_animFrameCount * speedMul) % 200);
        const textSpan = document.createElement('span');
        textSpan.textContent = lineText;
        textSpan.style.color = '#ffffff';
        textSpan.style.position = 'relative';
        textSpan.style.zIndex = '2';
        const shadowLayer = document.createElement('span');
        shadowLayer.textContent = lineText;
        shadowLayer.style.position = 'absolute';
        shadowLayer.style.left = '0';
        shadowLayer.style.top = '0';
        shadowLayer.style.zIndex = '1';
        shadowLayer.style.color = 'transparent';
        shadowLayer.style.webkitTextStroke = 'none';
        shadowLayer.style.pointerEvents = 'none';
        if (ow > 0) {
            shadowLayer.style.background = `linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000)`;
            shadowLayer.style.backgroundSize = '200% auto';
            shadowLayer.style.backgroundPosition = `${bgShift}% 50%`;
            shadowLayer.style.webkitBackgroundClip = 'text';
            shadowLayer.style.backgroundClip = 'text';
            shadowLayer.style.color = 'transparent';
            shadowLayer.style.textShadow = __.buildShadow(ow, bl, 'transparent');
            shadowLayer.style.webkitTextStroke = `${ow * 2}px transparent`;
            shadowLayer.style.paintOrder = 'stroke fill';
        }
        spanWrap.style.display = 'inline-block';
        spanWrap.style.position = 'relative';
        spanWrap.appendChild(textSpan);
        spanWrap.appendChild(shadowLayer);
    }

    function renderRainbowText(spanWrap, lineText, ow, bl, oc) {
        const speedMul = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.rainbow_text || 1) * 1.2;
        const bgShift = 200 - ((_animFrameCount * speedMul) % 200);
        const gradientColors = '#ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000';
        spanWrap.innerHTML = '';
        spanWrap.style.display = 'inline-block';
        spanWrap.style.position = 'relative';
        spanWrap.style.textShadow = 'none';
        if (ow > 0) {
            const shadowLayer = document.createElement('span');
            shadowLayer.textContent = lineText;
            shadowLayer.style.cssText = [
                'position: absolute',
                'left: 0', 'top: 0',
                'color: transparent',
                'z-index: 1',
                'pointer-events: none',
                `text-shadow: ${__.buildShadow(ow, bl, oc)}`
            ].join(';');
            spanWrap.appendChild(shadowLayer);
        }
        const inner = document.createElement('span');
        inner.style.cssText = [
            `background: linear-gradient(90deg, ${gradientColors})`,
            'background-size: 200% auto',
            `background-position: ${bgShift}% 50%`,
            '-webkit-background-clip: text',
            'background-clip: text',
            'color: transparent',
            '-webkit-text-fill-color: transparent',
            'text-shadow: none',
            '-webkit-text-stroke: none',
            'position: relative',
            'z-index: 2'
        ].join(';');
        inner.textContent = lineText;
        spanWrap.appendChild(inner);
    }

    function applyBoxStyle(spanWrap, ub, bc, bo) {
        if (ub) {
            spanWrap.style.backgroundColor = __.hexToRgba(bc, bo);
            spanWrap.style.padding = '4px 10px';
            spanWrap.style.borderRadius = '6px';
            spanWrap.style.display = 'inline-block';
        } else {
            spanWrap.style.backgroundColor = 'transparent';
            spanWrap.style.padding = '0';
            spanWrap.style.borderRadius = '0';
        }
    }

    // ============ NEW EFFECT: Shine/Sweep ============
    function renderShineSweep(spanWrap, lineText, ow, bl, oc, c1) {
        spanWrap.innerHTML = '';
        spanWrap.style.display = 'inline-block';
        spanWrap.style.position = 'relative';
        spanWrap.style.color = 'transparent';
        const speed = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.shine_sweep || 4) * 0.08;
        const pos = ((_animFrameCount * speed * 100) % 200) - 50;
        // Base layer: solid colored text with outline (positioned absolute so it doesn't affect layout)
        const base = document.createElement('span');
        base.textContent = lineText;
        base.style.cssText = `position:absolute;left:0;top:0;white-space:pre;color:${c1};text-shadow:${__.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc)};`;
        spanWrap.appendChild(base);
        // Shine overlay: white sweep gradient via background-clip
        const shine = document.createElement('span');
        shine.textContent = lineText;
        shine.style.cssText = `position:relative;color:transparent;white-space:pre;background:linear-gradient(90deg, rgba(255,255,255,0) 25%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0) 75%);background-size:200% auto;background-position:${pos}% 50%;-webkit-background-clip:text;background-clip:text;`;
        spanWrap.appendChild(shine);
    }

    // ============ NEW EFFECT: Split Color ============
    function renderSplitColor(spanWrap, lineText, ow, bl, oc, c1) {
        spanWrap.innerHTML = '';
        spanWrap.style.display = 'inline-block';
        spanWrap.style.position = 'relative';
        spanWrap.style.color = 'transparent';
        // Outline layer underneath
        const outl = document.createElement('span');
        outl.textContent = lineText;
        outl.style.cssText = `position:absolute;left:0;top:0;white-space:pre;color:transparent;text-shadow:${__.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc)};`;
        spanWrap.appendChild(outl);
        // Colored text layer with split gradient
        const txt = document.createElement('span');
        txt.textContent = lineText;
        txt.style.cssText = `position:relative;white-space:pre;color:transparent;background:linear-gradient(180deg, #ffffff 0%, #ffffff 50%, #4488ff 50%, #4488ff 100%);-webkit-background-clip:text;background-clip:text;`;
        spanWrap.appendChild(txt);
    }

    // ============ NEW EFFECT: 80s Retro Synthwave ============
    function renderRetro80s(spanWrap, lineText, ow, bl, oc, c1) {
        spanWrap.innerHTML = '';
        spanWrap.style.display = 'inline-block';
        spanWrap.style.position = 'relative';
        spanWrap.style.color = '#ff44ff';
        spanWrap.style.textShadow = [
            '2px 2px 0 #00ffff',
            '4px 4px 0 #00ffff',
            '6px 6px 0 #00ffff',
            '8px 8px 0 #00ffff',
            '10px 10px 0 #00ffff',
            `0 0 ${Math.max(bl, 2)}px #ff44ff`,
            `0 0 ${Math.max(bl + 4, 4)}px #ff44ff`
        ].join(',');
        spanWrap.style.fontWeight = 'bold';
        spanWrap.innerText = lineText;
    }

    // ============ NEW EFFECT: Golden Text ============
    function renderGolden(spanWrap, lineText, ow, bl, oc, c1) {
        spanWrap.innerHTML = '';
        spanWrap.style.display = 'inline-block';
        spanWrap.style.position = 'relative';
        spanWrap.style.color = 'transparent';
        // Outline layer with dark gold shadow
        const outl = document.createElement('span');
        outl.textContent = lineText;
        outl.style.cssText = `position:absolute;left:0;top:0;white-space:pre;color:transparent;text-shadow:${__.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, '#8b6914') : __.buildShadow(ow, bl, '#8b6914')};`;
        spanWrap.appendChild(outl);
        // Gold gradient text
        const txt = document.createElement('span');
        txt.textContent = lineText;
        txt.style.cssText = `position:relative;white-space:pre;color:transparent;background:linear-gradient(180deg, #d4a017 0%, #fff8dc 30%, #d4a017 50%, #b8860b 70%, #d4a017 100%);-webkit-background-clip:text;background-clip:text;`;
        spanWrap.appendChild(txt);
    }

    // ============ NEW EFFECT: Float/Hover ============
    function renderFloatHover(spanWrap, lineText, ow, bl, oc, c1) {
        spanWrap.style.display = 'inline-block';
        spanWrap.style.position = 'relative';
        spanWrap.style.color = c1;
        spanWrap.style.textShadow = __.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc);
        const speed = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.float_hover || 5) * 0.1;
        const yOff = Math.sin(_animFrameCount * 0.016 * speed) * 8;
        spanWrap.style.transform = `translateY(${yOff}px)`;
        spanWrap.innerText = lineText;
    }

    // ============ NEW EFFECT: Breathe / Zoom Pulse ============
    function renderBreathe(spanWrap, lineText, ow, bl, oc, c1) {
        spanWrap.style.display = 'inline-block';
        spanWrap.style.position = 'relative';
        spanWrap.style.color = c1;
        spanWrap.style.textShadow = __.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc);
        const speed = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.breathe || 3) * 0.06;
        const scale = 1 + Math.sin(_animFrameCount * 0.016 * speed) * 0.05;
        spanWrap.style.transform = `scale(${scale})`;
        spanWrap.innerText = lineText;
    }

    // ============ NEW EFFECT: Jello ============
    function renderJello(spanWrap, lineText, ow, bl, oc, c1) {
        spanWrap.style.display = 'inline-block';
        spanWrap.style.position = 'relative';
        spanWrap.style.color = c1;
        spanWrap.style.textShadow = __.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc);
        const speed = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.jello || 6) * 0.2;
        // Entry bounce on first ~30 frames then settle
        const age = _animFrameCount % 60;
        let scaleX = 1, scaleY = 1;
        if (age < 12) {
            const t = age / 12;
            scaleX = 1 - Math.sin(t * Math.PI * 2) * 0.15 * (1 - t);
            scaleY = 1 + Math.sin(t * Math.PI * 2) * 0.1 * (1 - t);
        } else {
            const t = _animFrameCount * 0.016 * speed;
            scaleX = 1 + Math.sin(t * 2) * 0.01;
            scaleY = 1 - Math.sin(t * 2) * 0.005;
        }
        spanWrap.style.transform = `scale(${scaleX}, ${scaleY})`;
        spanWrap.innerText = lineText;
    }

    // ============ NEW EFFECT: Typewriter ============
    function renderTypewriter(spanWrap, lineText, ow, bl, oc, c1, sub) {
        spanWrap.style.display = 'inline-block';
        spanWrap.style.position = 'relative';
        spanWrap.style.color = c1;
        spanWrap.style.textShadow = __.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc);
        spanWrap.style.overflow = 'hidden';
        spanWrap.style.whiteSpace = 'nowrap';
        const speed = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.typewriter || 10) * 0.03;
        // Use line elapsed time - NOT global frame count - so it doesn't loop
        const timeElapsedMs = sub ? Math.max(0, (__.globalSettings._lastRenderTime - sub.start) * 1000) : 0;
        const charCount = Math.min(Math.floor(timeElapsedMs / (200 / speed)), lineText.length);
        const visible = lineText.slice(0, charCount);
        spanWrap.innerText = visible || '';
    }

    // ============ NEW EFFECT: Pulse / Heartbeat ============
    function renderPulse(spanWrap, lineText, ow, bl, oc, c1) {
        spanWrap.style.display = 'inline-block';
        spanWrap.style.position = 'relative';
        spanWrap.style.color = c1;
        spanWrap.style.textShadow = __.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc);
        const speed = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.pulse || 6) * 0.15;
        // heartbeat: double thump pattern
        const t = (_animFrameCount * 0.016) * speed;
        const phase = t % (Math.PI * 2);
        let scale = 1;
        if (phase < 0.15) scale = 1 + 0.08;
        else if (phase < 0.3) scale = 1 - 0.02;
        else if (phase < 0.45) scale = 1 + 0.05;
        else scale = 1;
        spanWrap.style.transform = `scale(${scale})`;
        spanWrap.innerText = lineText;
    }

    // ============ NEW EFFECT: Shake / Quake ============
    function renderShake(spanWrap, lineText, ow, bl, oc, c1) {
        spanWrap.style.display = 'inline-block';
        spanWrap.style.position = 'relative';
        spanWrap.style.color = c1;
        spanWrap.style.textShadow = __.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc);
        const intensity = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.shake || 8) * 0.15;
        const dx = (Math.random() - 0.5) * intensity * 2;
        const dy = (Math.random() - 0.5) * intensity * 2;
        spanWrap.style.transform = `translate(${dx}px, ${dy}px)`;
        spanWrap.innerText = lineText;
    }

    // ============ NEW EFFECT: Glitch ============
    function renderGlitch(spanWrap, lineText, ow, bl, oc, c1) {
        spanWrap.innerHTML = '';
        spanWrap.style.display = 'inline-block';
        spanWrap.style.position = 'relative';
        const speed = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.glitch || 5) * 0.05;
        const glitchFrame = Math.sin(_animFrameCount * 0.016 * speed);
        const isGlitch = Math.abs(glitchFrame) > 0.85;
        // Main text
        const mainSpan = document.createElement('span');
        mainSpan.textContent = lineText;
        mainSpan.style.cssText = `color:${c1};text-shadow:${__.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc)};position:relative;z-index:2;`;
        spanWrap.appendChild(mainSpan);
        if (isGlitch) {
            const glitchRange = glitchFrame * 6;
            // Red offset layer
            const red = document.createElement('span');
            red.textContent = lineText;
            red.style.cssText = `position:absolute;left:${glitchRange}px;top:0;color:#ff0000;opacity:0.7;z-index:1;text-shadow:none;`;
            spanWrap.appendChild(red);
            // Green offset layer
            const green = document.createElement('span');
            green.textContent = lineText;
            green.style.cssText = `position:absolute;left:${-glitchRange}px;top:0;color:#00ff00;opacity:0.7;z-index:1;text-shadow:none;`;
            spanWrap.appendChild(green);
        }
    }

    // ============ NEW EFFECT: Ghosting / Drunk ============
    function renderGhosting(spanWrap, lineText, ow, bl, oc, c1) {
        spanWrap.innerHTML = '';
        spanWrap.style.display = 'inline-block';
        spanWrap.style.position = 'relative';
        const mainSpan = document.createElement('span');
        mainSpan.textContent = lineText;
        mainSpan.style.cssText = `color:${c1};text-shadow:${__.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc)};position:relative;z-index:3;`;
        spanWrap.appendChild(mainSpan);
        const speed = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.ghosting || 3) * 0.08;
        const t = _animFrameCount * 0.016 * speed;
        const offX = Math.sin(t) * 15;
        const offY = Math.cos(t * 0.7) * 8;
        // Ghost 1
        const g1 = document.createElement('span');
        g1.textContent = lineText;
        g1.style.cssText = `position:absolute;left:${offX}px;top:${offY}px;color:${c1};opacity:0.2;z-index:1;text-shadow:none;filter:blur(3px);`;
        spanWrap.appendChild(g1);
        // Ghost 2
        const g2 = document.createElement('span');
        g2.textContent = lineText;
        g2.style.cssText = `position:absolute;left:${-offX * 0.6}px;top:${-offY * 0.6}px;color:${c1};opacity:0.15;z-index:2;text-shadow:none;filter:blur(5px);`;
        spanWrap.appendChild(g2);
    }

    // ============ NEW EFFECT: Water Reflection ============
    function renderWaterReflection(spanWrap, lineText, ow, bl, oc, c1) {
        spanWrap.innerHTML = '';
        spanWrap.style.display = 'inline-block';
        spanWrap.style.position = 'relative';
        const mainSpan = document.createElement('span');
        mainSpan.textContent = lineText;
        mainSpan.style.cssText = `color:${c1};text-shadow:${__.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc)};display:block;`;
        spanWrap.appendChild(mainSpan);
        // Reflection (flipped + fade)
        const ref = document.createElement('span');
        ref.textContent = lineText;
        ref.style.cssText = `display:block;color:${c1};text-shadow:${__.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc)};transform:scaleY(-1);opacity:0.35;filter:blur(2px);margin-top:4px;`;
        spanWrap.appendChild(ref);
    }

    // ============ NEW EFFECT: 3D Block ============
    function render3DBlock(spanWrap, lineText, ow, bl, oc, c1) {
        spanWrap.innerHTML = '';
        spanWrap.style.display = 'inline-block';
        spanWrap.style.position = 'relative';
        spanWrap.style.color = c1;
        // Hard block shadows - 4 layers is enough for subtle 3D
        spanWrap.style.textShadow = [
            '1px 1px 0 ' + oc,
            '2px 2px 0 ' + oc,
            '3px 3px 0 ' + oc,
            '4px 4px 0 ' + oc
        ].join(',');
        spanWrap.innerText = lineText;
    }

    // ============ NEW EFFECT: Glow Pulse ============
    function renderGlowPulse(spanWrap, lineText, ow, bl, oc, c1) {
        spanWrap.style.display = 'inline-block';
        spanWrap.style.position = 'relative';
        spanWrap.style.color = c1;
        const speed = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.glow_pulse || 5) * 0.08;
        const breathe = 0.5 + Math.sin(_animFrameCount * 0.016 * speed) * 0.5;
        const pulseBlur = Math.max(0, bl * breathe);
        const pulseOw = Math.max(0, ow * (0.5 + breathe * 0.5));
        spanWrap.style.textShadow = __.globalSettings.deepGlow ? __.buildDeepGlow(pulseOw, pulseBlur, oc) : __.buildShadow(pulseOw, pulseBlur, oc);
        spanWrap.innerText = lineText;
    }

    // ============ UNIFIED KARAOKE + EFFECT RENDERER ============
    // Handles ALL effects with per-char rendering + per-syllable zoom
    // Also applies line-level post-processing (float, breathe, etc.)
    function renderKaraokeWithEffect(spanWrap, sub, lineText, sylArray, ow, bl, oc, c1, ub, bc, bo, eff) {
        const lineElapsed = (__.globalSettings._lastRenderTime - sub.start) * 1000;
        let charIdxGlobal = 0;

        function addChar(ch, sylZoom) {
            const txt = ch === ' ' ? '\u00A0' : ch;
            const cSpan = document.createElement('span');
            cSpan.style.cssText = 'display:inline-block;white-space:pre;position:relative;';
            cSpan.style.transform = `scale(${sylZoom})`;

            if (eff === 'rainbow_outline') {
                const speedMul = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.rainbow_outline || 1) * 0.8;
                const hue = ((_animFrameCount * speedMul) + (charIdxGlobal * 15)) % 360;
                // Same as non-karaoke: white text + red shadow with hue-rotate filter
                cSpan.style.color = '#ffffff';
                if (ow > 0) {
                    cSpan.style.textShadow = __.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, '#ff0000') : __.buildShadow(ow, bl, '#ff0000');
                    cSpan.style.filter = `hue-rotate(${hue}deg)`;
                }
                cSpan.textContent = txt;
            } else if (eff === 'rainbow_outline_rgb') {
                const speedMul = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.rainbow_outline_rgb || 1) * 1.2;
                const baseBgShift = 200 - ((_animFrameCount * speedMul) % 200);
                const charShift = (baseBgShift + charIdxGlobal * 5) % 200;
                // Same as non-karaoke: white text + gradient RGB outline via webkitTextStroke on gradient layer
                const txtSpan = document.createElement('span');
                txtSpan.textContent = txt;
                txtSpan.style.cssText = 'position:relative;z-index:2;color:#ffffff;';
                cSpan.appendChild(txtSpan);
                if (ow > 0) {
                    const shSpan = document.createElement('span');
                    shSpan.textContent = txt;
                    shSpan.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;z-index:1;color:transparent;';
                    shSpan.style.background = 'linear-gradient(90deg,#ff0000,#ff7f00,#ffff00,#00ff00,#0000ff,#4b0082,#9400d3,#ff0000)';
                    shSpan.style.backgroundSize = '200% auto';
                    shSpan.style.backgroundPosition = `${charShift}% 50%`;
                    shSpan.style.webkitBackgroundClip = 'text';
                    shSpan.style.backgroundClip = 'text';
                    shSpan.style.webkitTextStroke = `${ow * 2}px transparent`;
                    shSpan.style.paintOrder = 'stroke fill';
                    shSpan.style.textShadow = __.buildShadow(ow, bl, 'transparent');
                    cSpan.appendChild(shSpan);
                }
            } else if (eff === 'rainbow_text') {
                // Same as non-karaoke: outline underneath + rainbow gradient text on top
                const speedMul = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.rainbow_text || 1) * 1.2;
                const baseBgShift = 200 - ((_animFrameCount * speedMul) % 200);
                const lineShift = baseBgShift; // line-based shift
                const inner = document.createElement('span');
                inner.style.cssText = 'position:relative;display:inline-block;';
                // Outline shadow on inner
                if (ow > 0) {
                    inner.style.textShadow = __.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc);
                }
                // Rainbow gradient text
                const gradColors = ['#ff0000','#ff7f00','#ffff00','#00ff00','#0000ff','#4b0082','#9400d3','#ff0000'].join(',');
                inner.style.background = `linear-gradient(90deg,${gradColors})`;
                inner.style.backgroundSize = '200% auto';
                inner.style.backgroundPosition = `${lineShift}% 50%`;
                inner.style.webkitBackgroundClip = 'text'; inner.style.backgroundClip = 'text';
                inner.style.color = 'transparent';
                inner.style.webkitTextFillColor = 'transparent';
                inner.textContent = txt;
                cSpan.appendChild(inner);
            } else if (eff === 'sine_wave') {
                cSpan.style.color = c1;
                cSpan.style.textShadow = __.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc);
                const amp = __.globalSettings.sineWaveAmplitude || 2;
                const tSec = _animFrameCount * 0.016;
                const speed = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.sine_wave || 8) * 0.3;
                const yOff = Math.sin(tSec * speed + charIdxGlobal * 0.5) * -amp;
                cSpan.style.transform += ` translateY(${yOff}px)`;
                cSpan.textContent = txt;
            } else if (eff === 'shine_sweep') {
                // base text with outline - shine overlay added at line level
                cSpan.style.color = c1;
                cSpan.style.textShadow = __.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc);
                cSpan.textContent = txt;
            } else if (eff === 'split_color') {
                const outl = document.createElement('span');
                outl.textContent = txt;
                outl.style.cssText = 'position:absolute;left:0;top:0;color:transparent;pointer-events:none;';
                outl.style.textShadow = __.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc);
                cSpan.appendChild(outl);
                cSpan.style.background = 'linear-gradient(180deg, #ffffff 0%, #ffffff 50%, #4488ff 50%, #4488ff 100%)';
                cSpan.style.webkitBackgroundClip = 'text'; cSpan.style.backgroundClip = 'text';
                cSpan.style.color = 'transparent';
                cSpan.textContent = txt;
            } else if (eff === 'retro_80s') {
                cSpan.style.color = '#ff44ff';
                cSpan.style.textShadow = ['2px 2px 0 #00ffff','4px 4px 0 #00ffff','6px 6px 0 #00ffff','8px 8px 0 #00ffff','10px 10px 0 #00ffff',`0 0 ${Math.max(bl,2)}px #ff44ff`].join(',');
                cSpan.textContent = txt;
            } else if (eff === 'golden') {
                const outl = document.createElement('span');
                outl.textContent = txt;
                outl.style.cssText = 'position:absolute;left:0;top:0;color:transparent;pointer-events:none;';
                outl.style.textShadow = __.buildShadow(ow, bl, '#8b6914');
                cSpan.appendChild(outl);
                cSpan.style.background = 'linear-gradient(180deg, #d4a017 0%, #fff8dc 30%, #d4a017 50%, #b8860b 70%, #d4a017 100%)';
                cSpan.style.webkitBackgroundClip = 'text'; cSpan.style.backgroundClip = 'text';
                cSpan.style.color = 'transparent';
                cSpan.textContent = txt;
            } else if (eff === 'd3d_block') {
                const shadows = [];
                for (let i = 1; i <= 4; i++) shadows.push(`${i}px ${i}px 0 ${oc}`);
                cSpan.style.color = c1;
                cSpan.style.textShadow = shadows.join(',');
                cSpan.textContent = txt;
            } else if (eff === 'water_reflection') {
                cSpan.style.color = c1;
                cSpan.style.textShadow = __.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc);
                cSpan.textContent = txt;
            } else if (eff === 'glow_pulse') {
                const speed = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.glow_pulse || 5) * 0.08;
                const breathe = 0.5 + Math.sin(_animFrameCount * 0.016 * speed) * 0.5;
                const pulseBlur = Math.max(0, bl * breathe);
                const pulseOw = Math.max(0, ow * (0.5 + breathe * 0.5));
                cSpan.style.color = c1;
                cSpan.style.textShadow = __.globalSettings.deepGlow ? __.buildDeepGlow(pulseOw, pulseBlur, oc) : __.buildShadow(pulseOw, pulseBlur, oc);
                cSpan.textContent = txt;
            } else if (eff === 'typewriter') {
                cSpan.style.color = c1;
                cSpan.style.textShadow = __.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc);
                cSpan.textContent = txt;
            } else {
                // float_hover, breathe, jello, pulse, shake, glitch, ghosting
                cSpan.style.color = c1;
                cSpan.style.textShadow = __.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc);
                cSpan.textContent = txt;
            }
            spanWrap.appendChild(cSpan);
            charIdxGlobal++;
        }

        // Build characters from syllables with zoom
        sylArray.forEach(syl => {
            let sylZoom = 1;
            if (lineElapsed >= syl.timeStart && lineElapsed < syl.timeEnd) {
                const kAct = __.globalSettings.kActive;
                const sEl = lineElapsed - syl.timeStart;
                const sRem = syl.timeEnd - lineElapsed;
                const zIn = kAct.zIn || 100; const zOut = kAct.zOut || 100;
                if (sEl < zIn) sylZoom = 1 + (kAct.zoom - 1) * (sEl / zIn);
                else if (sRem < zOut) sylZoom = 1 + (kAct.zoom - 1) * (sRem / zOut);
                else sylZoom = kAct.zoom;
            }
            (syl.text || '').split('').forEach(ch => addChar(ch, sylZoom));
        });

        // ====== LINE-LEVEL POST-PROCESSING ======
        if (eff === 'shine_sweep') {
            // Create a shine overlay using CSS mask for reliable sweep effect
            const wrapper = document.createElement('span');
            wrapper.style.cssText = 'display:inline-block;position:relative;white-space:pre;';
            while (spanWrap.firstChild) wrapper.appendChild(spanWrap.firstChild);
            spanWrap.appendChild(wrapper);
            const speed = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.shine_sweep || 4) * 0.08;
            const pos = ((_animFrameCount * speed * 100) % 200) - 50;
            const shine = document.createElement('div');
            shine.textContent = lineText;
            shine.style.cssText = `position:absolute;left:0;top:0;width:100%;height:100%;color:white;pointer-events:none;white-space:pre;z-index:10;text-shadow:none;-webkit-mask-image:linear-gradient(90deg, transparent 28%, #000 48%, #000 52%, transparent 72%);-webkit-mask-size:200% auto;-webkit-mask-position:${pos}% 50%;mask-image:linear-gradient(90deg, transparent 28%, #000 48%, #000 52%, transparent 72%);mask-size:200% auto;mask-position:${pos}% 50%;`;
            wrapper.appendChild(shine);
        }
        if (eff === 'float_hover') {
            const speed = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.float_hover || 5) * 0.1;
            const yOff = Math.sin(_animFrameCount * 0.016 * speed) * 8;
            spanWrap.style.transform = `translateY(${yOff}px)`;
        }
        if (eff === 'breathe') {
            const speed = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.breathe || 3) * 0.06;
            const scale = 1 + Math.sin(_animFrameCount * 0.016 * speed) * 0.05;
            spanWrap.style.transform = `scale(${scale})`;
        }
        if (eff === 'jello') {
            const age = _animFrameCount % 60;
            let scaleX = 1, scaleY = 1;
            if (age < 12) {
                const t = age / 12;
                scaleX = 1 - Math.sin(t * Math.PI * 2) * 0.15 * (1 - t);
                scaleY = 1 + Math.sin(t * Math.PI * 2) * 0.1 * (1 - t);
            } else {
                const t = _animFrameCount * 0.016;
                scaleX = 1 + Math.sin(t * 2) * 0.01;
                scaleY = 1 - Math.sin(t * 2) * 0.005;
            }
            spanWrap.style.transform = `scale(${scaleX}, ${scaleY})`;
        }
        if (eff === 'pulse') {
            const t = _animFrameCount * 0.016;
            const phase = t % (Math.PI * 2);
            let scale = 1;
            if (phase < 0.15) scale = 1 + 0.08;
            else if (phase < 0.3) scale = 1 - 0.02;
            else if (phase < 0.45) scale = 1 + 0.05;
            else scale = 1;
            spanWrap.style.transform = `scale(${scale})`;
        }
        if (eff === 'shake') {
            const intensity = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.shake || 8) * 0.15;
            const dx = (Math.random() - 0.5) * intensity * 2;
            const dy = (Math.random() - 0.5) * intensity * 2;
            spanWrap.style.transform = `translate(${dx}px, ${dy}px)`;
        }
        if (eff === 'glitch') {
            const speed = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.glitch || 5) * 0.05;
            const glitchFrame = Math.sin(_animFrameCount * 0.016 * speed);
            const isGlitch = Math.abs(glitchFrame) > 0.85;
            if (isGlitch) {
                const glitchRange = glitchFrame * 6;
                const rDiv = document.createElement('div');
                rDiv.style.cssText = `position:absolute;left:${glitchRange}px;top:0;color:#ff0000;opacity:0.6;z-index:1;pointer-events:none;white-space:pre;`;
                rDiv.textContent = lineText;
                spanWrap.appendChild(rDiv);
                const gDiv = document.createElement('div');
                gDiv.style.cssText = `position:absolute;left:${-glitchRange}px;top:0;color:#00ff00;opacity:0.6;z-index:1;pointer-events:none;white-space:pre;`;
                gDiv.textContent = lineText;
                spanWrap.appendChild(gDiv);
            }
        }
        if (eff === 'ghosting') {
            spanWrap.style.position = 'relative';
            const speed = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.ghosting || 3) * 0.08;
            const t = _animFrameCount * 0.016 * speed;
            const offX = Math.sin(t) * 15;
            const offY = Math.cos(t * 0.7) * 8;
            const ghost1 = document.createElement('div');
            ghost1.style.cssText = `position:absolute;left:${offX}px;top:${offY}px;color:${c1};opacity:0.2;z-index:1;filter:blur(3px);pointer-events:none;white-space:pre;`;
            ghost1.textContent = lineText;
            spanWrap.appendChild(ghost1);
            const ghost2 = document.createElement('div');
            ghost2.style.cssText = `position:absolute;left:${-offX * 0.6}px;top:${-offY * 0.6}px;color:${c1};opacity:0.15;z-index:1;filter:blur(5px);pointer-events:none;white-space:pre;`;
            ghost2.textContent = lineText;
            spanWrap.appendChild(ghost2);
        }
        if (eff === 'water_reflection') {
            const ref = document.createElement('div');
            ref.textContent = lineText;
            ref.style.cssText = `color:${c1};text-shadow:${__.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc)};transform:scaleY(-1);opacity:0.35;filter:blur(2px);margin-top:4px;`;
            spanWrap.appendChild(ref);
        }
        if (eff === 'typewriter') {
            // clip children to only show first N characters - ONE PASS PER LINE (no loop)
            const speed = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.typewriter || 10) * 0.03;
            // Calculate based on line elapsed time, NOT global frame count (no loop)
            const timeElapsedMs = Math.max(0, (__.globalSettings._lastRenderTime - sub.start) * 1000);
            const charCount = Math.min(Math.floor(timeElapsedMs / (200 / speed)), lineText.length);
            let shown = 0;
            Array.from(spanWrap.children).forEach(child => {
                const txt = child.textContent;
                if (shown >= charCount) { child.style.display = 'none'; return; }
                const take = Math.min(txt.length, charCount - shown);
                shown += txt.length;
            });
        }

        applyBoxStyle(spanWrap, ub, bc, bo);
    }

    // ============ RENDER A SINGLE SUB LINE ============
    function renderSubLine(sub, lineText, li, totalLines, sylArray, fs, posX, posY, ow, bl, oc, c1, ub, bc, bo, opacity, isO, styleName, align) {
        // alignment 1-9 ASS: 1=bottom-left, 2=bottom-center, 3=bottom-right,
        // 4=mid-left, 5=mid-center, 6=mid-right,
        // 7=top-left, 8=top-center, 9=top-right
        const a = align || 2; // default bottom-center

        // Line stacking direction based on vertical position in ASS alignment
        // Bottom (1-3): lines stack upward (first line at bottom, last line at top)
        // Mid (4-6): lines stack centered
        // Top (7-9): lines stack downward (first line at top, last line at bottom)
        const lineSpacing = fs * 1.4;
        let startY;
        if (a >= 7) { // top
            startY = posY;
        } else if (a >= 4) { // mid
            startY = posY - ((totalLines - 1) * lineSpacing) / 2;
        } else { // bottom
            startY = posY - (totalLines - 1) * lineSpacing;
        }
        const lineY = startY + li * lineSpacing;

        // Transform translate based on alignment
        let tx, ty;
        // Horizontal
        if (a === 1 || a === 4 || a === 7) { tx = '0%'; }      // left
        else if (a === 3 || a === 6 || a === 9) { tx = '-100%'; }  // right
        else { tx = '-50%'; }                                    // center

        // Vertical
        if (a === 7 || a === 8 || a === 9) { ty = '0%'; }     // top
        else if (a === 4 || a === 5 || a === 6) { ty = '-50%'; }  // mid
        else { ty = '-100%'; }                                   // bottom

        // Text alignment within the div
        let textAlign;
        if (a === 1 || a === 4 || a === 7) textAlign = 'left';
        else if (a === 3 || a === 6 || a === 9) textAlign = 'right';
        else textAlign = 'center';

        const div = document.createElement('div');

        let useFont = __.globalSettings.fontFamily;
        if (isO && styleName && __.styleSettings[styleName] && __.styleSettings[styleName].fontName) {
            const styleFont = __.getStyleFontFamily(styleName);
            useFont = styleFont;
        }

        div.style.cssText = `position:absolute; left:${(posX / __.playResX * 100)}%; top:${(lineY / __.playResY * 100)}%; transform:translate(${tx}, ${ty}); font-size:${fs}px; font-family:'${useFont}'; font-weight:${__.globalSettings.isBold ? 'bold' : 'normal'}; font-style:${__.globalSettings.isItalic ? 'italic' : 'normal'}; text-decoration:${__.globalSettings.isUnderline ? 'underline' : ''} ${__.globalSettings.isStrike ? 'line-through' : ''}; text-align:${textAlign}; white-space:nowrap; pointer-events:none; width:calc(100% - 20px); z-index:99; opacity:${Math.max(0, opacity)};`;
        const spanWrap = document.createElement('span');

        if (ub) {
            spanWrap.style.display = 'inline-block';
        }

        const eff = __.globalSettings.specialEffect;
        const hasEffect = eff && eff !== 'none' && !(sylArray && sylArray.length > 0);
        // Effects that apply at the line level (non-per-char) and work with karaoke
        const lineLevelEffects = ['float_hover', 'breathe', 'jello', 'typewriter', 'pulse', 'shake', 'glitch', 'ghosting', 'glow_pulse'];

        if (sylArray && sylArray.length > 0 && eff && eff !== 'none') {
            // ===== KARAOKE WITH EFFECT: unified renderer for ALL effects =====
            spanWrap.style.display = 'inline-block';
            spanWrap.style.whiteSpace = 'pre';
            div.style.whiteSpace = 'pre';
            renderKaraokeWithEffect(spanWrap, sub, lineText, sylArray, ow, bl, oc, c1, ub, bc, bo, eff);
        } else if (sylArray && sylArray.length > 0) {
            // ===== KARAOKE WITHOUT EFFECT: per-syllable styling =====
            const lineElapsed = (__.globalSettings._lastRenderTime - sub.start) * 1000;
            sylArray.forEach(syl => {
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

                let useC1, useC3;
                let useOutl = Number(ks.outl) || 0;
                let useSylBlur = sylBlur;
                let sylZoom = zoom;

                if (lineElapsed >= syl.timeStart && lineElapsed < syl.timeEnd) {
                    useC1 = ks.c1;
                    useC3 = ks.c3;
                    useOutl = Number(ks.outl) || 0;
                    useSylBlur = sylBlur;
                    if (isO) {
                        const s = __.styleSettings[sub.style];
                        useOutl = s ? s.outlineWidth : __.globalSettings.outlineWidth;
                        useSylBlur = s ? s.blur : __.globalSettings.blur;
                    }
                } else if (isO) {
                    const s = __.styleSettings[sub.style];
                    useC1 = s ? s.color1 : '#ffffff';
                    useC3 = s ? s.color3 : '#000000';
                    useOutl = s ? s.outlineWidth : __.globalSettings.outlineWidth;
                    useSylBlur = s ? s.blur : __.globalSettings.blur;
                } else {
                    useC1 = ks.c1;
                    useC3 = ks.c3;
                }

                Object.assign(span.style, {
                    color: useC1,
                    transform: `scale(${sylZoom})`,
                    textShadow: __.buildShadow(useOutl, useSylBlur, useC3),
                    webkitTextStroke: 'none'
                });
                spanWrap.appendChild(span);
            });
            applyBoxStyle(spanWrap, ub, bc, bo);
        } else {
            // ===== NON-KARAOKE: full line rendering =====
            spanWrap.style.color = '';
            spanWrap.style.textShadow = '';
            spanWrap.style.webkitTextStroke = '';
            spanWrap.style.paintOrder = '';
            spanWrap.style.background = '';
            spanWrap.style.backgroundSize = '';
            spanWrap.style.webkitBackgroundClip = '';
            spanWrap.style.webkitTextFillColor = '';
            spanWrap.style.filter = '';
            spanWrap.style.transform = '';
            spanWrap.style.position = '';
            spanWrap.style.overflow = '';
            spanWrap.style.whiteSpace = '';
            spanWrap.innerHTML = '';

            if (eff === 'rainbow_outline') {
                renderRainbowOutline(spanWrap, lineText, ow, bl, oc);
            } else if (eff === 'rainbow_outline_rgb') {
                renderRainbowOutlineRgb(spanWrap, lineText, ow, bl, oc);
            } else if (eff === 'rainbow_text') {
                renderRainbowText(spanWrap, lineText, ow, bl, oc);
            } else if (eff === 'sine_wave') {
                const amplitude = __.globalSettings.sineWaveAmplitude || 2;
                spanWrap.style.whiteSpace = 'pre';
                div.style.whiteSpace = 'pre';
                spanWrap.style.color = c1;
                spanWrap.style.webkitTextStroke = 'none';
                spanWrap.style.textShadow = __.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc);
                const chars = lineText.split('');
                const tSec = _animFrameCount * 0.016;
                const speed = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.sine_wave || 8) * 0.3;
                chars.forEach((ch, chIdx) => {
                    const cSpan = document.createElement('span');
                    cSpan.style.display = 'inline-block';
                    cSpan.style.whiteSpace = 'pre';
                    const yOff = Math.sin(tSec * speed + chIdx * 0.5) * -amplitude;
                    cSpan.style.transform = `translateY(${yOff}px)`;
                    cSpan.textContent = ch === ' ' ? '\u00A0' : ch;
                    spanWrap.appendChild(cSpan);
                });
                applyBoxStyle(spanWrap, ub, bc, bo);
            } else if (eff === 'shine_sweep') {
                renderShineSweep(spanWrap, lineText, ow, bl, oc, c1);
            } else if (eff === 'split_color') {
                renderSplitColor(spanWrap, lineText, ow, bl, oc, c1);
            } else if (eff === 'retro_80s') {
                renderRetro80s(spanWrap, lineText, ow, bl, oc, c1);
            } else if (eff === 'golden') {
                renderGolden(spanWrap, lineText, ow, bl, oc, c1);
            } else if (eff === 'float_hover') {
                renderFloatHover(spanWrap, lineText, ow, bl, oc, c1);
            } else if (eff === 'breathe') {
                renderBreathe(spanWrap, lineText, ow, bl, oc, c1);
            } else if (eff === 'jello') {
                renderJello(spanWrap, lineText, ow, bl, oc, c1);
            } else if (eff === 'typewriter') {
                renderTypewriter(spanWrap, lineText, ow, bl, oc, c1, sub);
            } else if (eff === 'pulse') {
                renderPulse(spanWrap, lineText, ow, bl, oc, c1);
            } else if (eff === 'shake') {
                renderShake(spanWrap, lineText, ow, bl, oc, c1);
            } else if (eff === 'glitch') {
                renderGlitch(spanWrap, lineText, ow, bl, oc, c1);
            } else if (eff === 'ghosting') {
                renderGhosting(spanWrap, lineText, ow, bl, oc, c1);
            } else if (eff === 'water_reflection') {
                renderWaterReflection(spanWrap, lineText, ow, bl, oc, c1);
            } else if (eff === 'd3d_block') {
                render3DBlock(spanWrap, lineText, ow, bl, oc, c1);
            } else if (eff === 'glow_pulse') {
                renderGlowPulse(spanWrap, lineText, ow, bl, oc, c1);
            } else {
                spanWrap.style.color = c1;
                spanWrap.style.webkitTextStroke = 'none';
                spanWrap.innerText = lineText;
                spanWrap.style.textShadow = __.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc);
                applyBoxStyle(spanWrap, ub, bc, bo);
            }
        }

        if (ub) {
            spanWrap.style.display = 'inline-block';
        }
        div.appendChild(spanWrap);
        return div;
    }

    // ============ UPDATE SUBTITLES ============
    function updateSubtitle(now) {
        _animFrameCount++;
        const video = document.querySelector('video');
        const layer = document.getElementById('sub-ultra-layer');
        if (video && layer && __.subtitles.length) {
            resizeLayer();
            layer.innerHTML = '';
            const time = video.currentTime;
            __.globalSettings._lastRenderTime = time;
            const shifted = __.getShiftedSubs();
            const active = shifted.filter(sub => time >= sub.start && time <= sub.end);

            const lineInfos = [];
            active.forEach(sub => {
                const s = __.styleSettings[sub.style] || { visible: true };
                if (!s.visible) return;
                const isO = s.override;
                const fs = (isO ? s.fontSize : __.globalSettings.fontSize) + (__.isFullscreen ? 10 : 0);
                const ow = isO ? s.outlineWidth : __.globalSettings.outlineWidth;
                const bl = isO ? s.blur : __.globalSettings.blur;
                const oc = isO ? (s.color3 || __.globalSettings.color3) : __.globalSettings.color3;
                const c1 = isO ? s.color1 : __.globalSettings.color1;

                // Determine effective alignment for rendering: per-line overrides style
                const effectiveAlign = sub.align || s.origAlign || 2;

                let posX, posY;
                const isExplicit = !!sub.filePos;
                if (isExplicit) {
                    // \pos(x,y) overrides everything
                    posX = sub.filePos.x;
                    posY = sub.filePos.y;
                } else {
                    // Use the style position from parser (set by alignment+margins initially),
                    // which can be adjusted via X/Y sliders in the UI
                    posX = s.posX;
                    posY = s.posY;
                }
                lineInfos.push({ sub, isO, fs, ow, bl, oc, c1, posX, posY, isExplicit, align: effectiveAlign });
            });

            const autoLines = lineInfos.filter(l => !l.isExplicit).sort((a, b) => a.posY - b.posY);
            let idx = 0;
            while (idx < autoLines.length) {
                let end = idx;
                while (end + 1 < autoLines.length && autoLines[end + 1].posY - autoLines[idx].posY < 40) {
                    end++;
                }
                const group = autoLines.slice(idx, end + 1);
                if (group.length > 1) {
                    const baseY = group[0].posY;
                    group.forEach((line, i) => {
                        line.posY = baseY + i * (line.fs * 1.4);
                    });
                }
                idx = end + 1;
            }

            const ub = __.globalSettings.useBox;
            const bc = __.globalSettings.boxColor;
            const bo = __.globalSettings.boxOpacity;

            lineInfos.forEach(({ sub, isO, fs, ow, bl, oc, c1, posX, posY, align }) => {
                let opacity = 1;
                const fadIn = __.globalSettings.fadIn / 1000;
                const fadOut = __.globalSettings.fadOut / 1000;
                if (time - sub.start < fadIn) opacity = (time - sub.start) / fadIn;
                else if (sub.end - time < fadOut) opacity = (sub.end - time) / fadOut;

                let groups = sub.syllableGroups;
                if (!groups || groups.length === 0) {
                    const lines = (sub.text || '').split('\n');
                    groups = lines.map(l => ({ syllables: sub.syllables || [], text: l }));
                }

                const totalLines = groups.length;
                groups.forEach((group, li) => {
                    const lineText = group.text || '';
                    const sylArray = group.syllables || [];
                    const div = renderSubLine(sub, lineText, li, totalLines, sylArray, fs, posX, posY, ow, bl, oc, c1, ub, bc, bo, opacity, isO, sub.style, align);
                    layer.appendChild(div);
                });
            });
        }
        requestAnimationFrame(updateSubtitle);
    }

    const origRequestFullscreen = HTMLVideoElement.prototype.requestFullscreen || HTMLVideoElement.prototype.webkitRequestFullscreen;
    if (origRequestFullscreen) {
        HTMLVideoElement.prototype.requestFullscreen = HTMLVideoElement.prototype.webkitRequestFullscreen = function () {
            __.isFullscreen = true;
            return origRequestFullscreen.apply(this, arguments);
        };
    }

    document.addEventListener('fullscreenchange', () => { __.isFullscreen = !!document.fullscreenElement; });
    document.addEventListener('webkitfullscreenchange', () => { __.isFullscreen = !!document.webkitFullscreenElement; });

    __.startEngine = function () {
        requestAnimationFrame(updateSubtitle);
    };
})();