(function () {
    'use strict';

    const __ = window.__SUB;

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
        const priority = (n) => {
            n = n.toLowerCase();
            return n.includes('viet') ? 1 : n.includes('roma') ? 2 : n.includes('kanji') ? 3 : 99;
        };
        Object.keys(__.styleSettings).sort((a, b) => priority(a) - priority(b)).forEach(sName => {
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
                s.posX = __.playResX / 2;
                if (sName.toLowerCase().includes('roma')) s.posY = 80;
                else if (sName.toLowerCase().includes('kanji')) s.posY = 155;
                else s.posY = __.playResY - 80;
                s.color1 = s.origColor1 || '#ffffff';
                s.color3 = s.origColor3 || '#000000';
                s.fontSize = 23;
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
        spanWrap.style.color = c1;
        spanWrap.style.textShadow = __.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc);
        spanWrap.style.background = `linear-gradient(90deg, ${c1} 40%, rgba(255,255,255,0.9) 50%, ${c1} 60%)`;
        spanWrap.style.backgroundSize = '200% auto';
        const speed = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.shine_sweep || 4) * 0.08;
        const pos = ((_animFrameCount * speed * 100) % 200) - 50;
        spanWrap.style.backgroundPosition = `${pos}% 50%`;
        spanWrap.style.webkitBackgroundClip = 'text';
        spanWrap.style.backgroundClip = 'text';
        spanWrap.style.color = 'transparent';
        spanWrap.style.webkitTextFillColor = c1;
        spanWrap.innerText = lineText;
    }

    // ============ NEW EFFECT: Split Color ============
    function renderSplitColor(spanWrap, lineText, ow, bl, oc, c1) {
        spanWrap.innerHTML = '';
        spanWrap.style.display = 'inline-block';
        spanWrap.style.position = 'relative';
        spanWrap.style.color = c1;
        spanWrap.style.textShadow = __.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc);
        // Top half white, bottom half #4488ff (blue)
        spanWrap.style.background = 'linear-gradient(180deg, #ffffff 0%, #ffffff 50%, #4488ff 50%, #4488ff 100%)';
        spanWrap.style.webkitBackgroundClip = 'text';
        spanWrap.style.backgroundClip = 'text';
        spanWrap.style.color = 'transparent';
        spanWrap.style.webkitTextFillColor = 'transparent';
        spanWrap.innerText = lineText;
    }

    // ============ NEW EFFECT: 80s Retro Synthwave ============
    function renderRetro80s(spanWrap, lineText, ow, bl, oc, c1) {
        spanWrap.innerHTML = '';
        spanWrap.style.display = 'inline-block';
        spanWrap.style.position = 'relative';
        spanWrap.style.color = '#ff44ff'; // neon pink
        spanWrap.style.textShadow = [
            '4px 4px 0 #00ffff',  // cyan
            '8px 8px 0 #00ffff',
            '12px 12px 0 #00ffff',
            '16px 16px 0 #00ffff',
            '20px 20px 0 #00ffff',
            `0 0 ${bl + 4}px #ff44ff`
        ].join(',');
        spanWrap.innerText = lineText;
    }

    // ============ NEW EFFECT: Golden Text ============
    function renderGolden(spanWrap, lineText, ow, bl, oc, c1) {
        spanWrap.innerHTML = '';
        spanWrap.style.display = 'inline-block';
        spanWrap.style.position = 'relative';
        // gold gradient
        spanWrap.style.background = 'linear-gradient(180deg, #d4a017 0%, #fff8dc 30%, #d4a017 50%, #b8860b 70%, #d4a017 100%)';
        spanWrap.style.webkitBackgroundClip = 'text';
        spanWrap.style.backgroundClip = 'text';
        spanWrap.style.color = 'transparent';
        spanWrap.style.webkitTextFillColor = 'transparent';
        spanWrap.style.textShadow = __.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, '#8b6914') : __.buildShadow(ow, bl, '#8b6914');
        spanWrap.innerText = lineText;
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
        // squish then bounce: quick damped oscillation on line entry
        const speed = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.jello || 6) * 0.2;
        // Use a decreasing bounce over ~30 frames
        const age = _animFrameCount % 60;
        let scaleX = 1, scaleY = 1;
        if (age < 12) {
            const t = age / 12;
            // squish then stretch then recover with overshoot
            scaleX = 1 - Math.sin(t * Math.PI * 2) * 0.15 * (1 - t);
            scaleY = 1 + Math.sin(t * Math.PI * 2) * 0.1 * (1 - t);
        } else {
            // subtle ongoing jiggle
            const t = _animFrameCount * 0.016 * speed;
            scaleX = 1 + Math.sin(t * 2) * 0.01;
            scaleY = 1 - Math.sin(t * 2) * 0.005;
        }
        spanWrap.style.transform = `scale(${scaleX}, ${scaleY})`;
        spanWrap.innerText = lineText;
    }

    // ============ NEW EFFECT: Typewriter ============
    function renderTypewriter(spanWrap, lineText, ow, bl, oc, c1) {
        spanWrap.style.display = 'inline-block';
        spanWrap.style.position = 'relative';
        spanWrap.style.color = c1;
        spanWrap.style.textShadow = __.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc);
        spanWrap.style.overflow = 'hidden';
        spanWrap.style.whiteSpace = 'nowrap';
        const speed = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.typewriter || 10) * 0.03;
        const charCount = Math.floor((_animFrameCount % 200) * speed);
        const visible = lineText.slice(0, Math.min(charCount, lineText.length));
        spanWrap.innerText = visible;
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
        // Hard block shadows (no blur)
        const shadows = [];
        for (let i = 1; i <= 8; i++) {
            shadows.push(`${i}px ${i}px 0 ${oc}`);
        }
        spanWrap.style.textShadow = shadows.join(',');
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

    // ============ EFFECT DISPATCH FOR KARAOKE ============
    // For karaoke with sine_wave: per-char sine + per-syllable zoom
    function renderKaraokeSineWave(spanWrap, sub, lineText, sylArray, ow, bl, oc, c1, ub, bc, bo, fs) {
        const lineElapsed = (__.globalSettings._lastRenderTime - sub.start) * 1000;
        const amp = __.globalSettings.sineWaveAmplitude || 2;
        const tSec = _animFrameCount * 0.016;
        const speed = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.sine_wave || 8) * 0.3;
        const shadowStr = __.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc);
        let charIdxGlobal = 0;
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
            (syl.text || '').split('').forEach(ch => {
                const cSpan = document.createElement('span');
                cSpan.style.cssText = `display:inline-block;white-space:pre;color:${c1};text-shadow:${shadowStr};`;
                const yOff = Math.sin(tSec * speed + charIdxGlobal * 0.5) * -amp;
                cSpan.style.transform = `translateY(${yOff}px) scale(${sylZoom})`;
                cSpan.textContent = ch === ' ' ? '\u00A0' : ch;
                spanWrap.appendChild(cSpan);
                charIdxGlobal++;
            });
        });
        applyBoxStyle(spanWrap, ub, bc, bo);
    }

    // For karaoke with rainbow effects + new effects: full line gradient/effect, per-syllable zoom
    function renderKaraokeFullLineGradient(spanWrap, sub, lineText, sylArray, ow, bl, oc, c1, ub, bc, bo, eff) {
        const lineElapsed = (__.globalSettings._lastRenderTime - sub.start) * 1000;
        let charIdxGlobal = 0;
        const totalChars = lineText.replace(/\u00A0/g, ' ').length;
        const renderChar = (txt, sylZoom, chIdx) => {
            const cSpan = document.createElement('span');
            cSpan.style.cssText = 'display:inline-block;white-space:pre;position:relative;';
            cSpan.style.transform = `scale(${sylZoom})`;

            if (eff === 'shine_sweep') {
                // Shine per char - each char gets the gradient clip
                cSpan.style.color = c1;
                cSpan.style.textShadow = __.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc);
                cSpan.textContent = txt;
                // Shine sweep is handled at full-line level, not per char
            } else if (eff === 'split_color') {
                cSpan.style.background = 'linear-gradient(180deg, #ffffff 0%, #ffffff 50%, #4488ff 50%, #4488ff 100%)';
                cSpan.style.webkitBackgroundClip = 'text'; cSpan.style.backgroundClip = 'text';
                cSpan.style.color = 'transparent';
                cSpan.style.webkitTextFillColor = 'transparent';
                cSpan.style.textShadow = __.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc);
                cSpan.textContent = txt;
            } else if (eff === 'retro_80s') {
                cSpan.style.color = '#ff44ff';
                cSpan.style.textShadow = [
                    '4px 4px 0 #00ffff', '8px 8px 0 #00ffff',
                    '12px 12px 0 #00ffff', '16px 16px 0 #00ffff',
                    `0 0 ${bl + 4}px #ff44ff`
                ].join(',');
                cSpan.textContent = txt;
            } else if (eff === 'golden') {
                cSpan.style.background = 'linear-gradient(180deg, #d4a017 0%, #fff8dc 30%, #d4a017 50%, #b8860b 70%, #d4a017 100%)';
                cSpan.style.webkitBackgroundClip = 'text'; cSpan.style.backgroundClip = 'text';
                cSpan.style.color = 'transparent'; cSpan.style.webkitTextFillColor = 'transparent';
                cSpan.style.textShadow = __.buildShadow(ow, bl, '#8b6914');
                cSpan.textContent = txt;
            } else if (eff === 'd3d_block') {
                const shadows = [];
                for (let i = 1; i <= 6; i++) shadows.push(`${i}px ${i}px 0 ${oc}`);
                cSpan.style.color = c1;
                cSpan.style.textShadow = shadows.join(',');
                cSpan.textContent = txt;
            } else if (eff === 'water_reflection') {
                cSpan.style.color = c1;
                cSpan.style.textShadow = __.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc);
                cSpan.textContent = txt;
                // water reflection handled at parent level
            } else {
                // fallback: normal
                cSpan.style.color = c1;
                cSpan.style.textShadow = __.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc);
                cSpan.textContent = txt;
            }

            spanWrap.appendChild(cSpan);
            return cSpan;
        };

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
            (syl.text || '').split('').forEach(ch => {
                const txt = ch === ' ' ? '\u00A0' : ch;
                renderChar(txt, sylZoom, charIdxGlobal++);
            });
        });

        // For shine_sweep, apply a wrapper with sweep gradient
        if (eff === 'shine_sweep') {
            const wrapper = document.createElement('span');
            wrapper.style.cssText = 'display:inline-block;position:relative;white-space:pre;';
            while (spanWrap.firstChild) wrapper.appendChild(spanWrap.firstChild);
            spanWrap.appendChild(wrapper);
            // Apply background clip to wrapper
            wrapper.style.color = c1;
            wrapper.style.textShadow = __.buildShadow(ow, bl, oc);
            const speed = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.shine_sweep || 4) * 0.08;
            const pos = ((_animFrameCount * speed * 100) % 200) - 50;
            // overlay shine gradient
            const shine = document.createElement('span');
            shine.style.cssText = `position:absolute;left:0;top:0;width:100%;height:100%;color:transparent;background:linear-gradient(90deg, transparent 40%, rgba(255,255,255,0.85) 50%, transparent 60%);background-size:200% auto;background-position:${pos}% 50%;-webkit-background-clip:text;background-clip:text;pointer-events:none;`;
            shine.textContent = lineText;
            wrapper.appendChild(shine);
        }

        // For water_reflection, add reflection below
        if (eff === 'water_reflection') {
            const ref = document.createElement('div');
            ref.style.cssText = `color:${c1};position:relative;`;
            const refInner = ref.cloneNode(false);
            spanWrap.appendChild(refInner);
        }

        applyBoxStyle(spanWrap, ub, bc, bo);
    }

    // For karaoke with full-line effects (float, breathe, jello, typewriter, pulse, shake, glitch, ghosting, glow_pulse)
    // we apply the effect at the parent level; per-syllable zoom still applies
    function renderKaraokeLineEffect(spanWrap, sub, lineText, sylArray, ow, bl, oc, c1, ub, bc, bo, eff) {
        const lineElapsed = (__.globalSettings._lastRenderTime - sub.start) * 1000;
        // First build syllable content with zoom
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
            const span = document.createElement('span');
            span.className = 'syllable';
            span.innerText = syl.text;
            span.style.cssText = `color:${c1};display:inline-block;transform:scale(${sylZoom});`;
            spanWrap.appendChild(span);
        });

        // Now apply the line-level effect
        if (eff === 'float_hover') {
            const speed = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.float_hover || 5) * 0.1;
            const yOff = Math.sin(_animFrameCount * 0.016 * speed) * 8;
            spanWrap.style.transform = `translateY(${yOff}px)`;
            spanWrap.style.textShadow = __.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc);
        } else if (eff === 'breathe') {
            const speed = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.breathe || 3) * 0.06;
            const scale = 1 + Math.sin(_animFrameCount * 0.016 * speed) * 0.05;
            spanWrap.style.transform = `scale(${scale})`;
            spanWrap.style.textShadow = __.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc);
        } else if (eff === 'jello') {
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
            spanWrap.style.textShadow = __.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc);
        } else if (eff === 'pulse') {
            const t = _animFrameCount * 0.016;
            const phase = t % (Math.PI * 2);
            let scale = 1;
            if (phase < 0.15) scale = 1 + 0.08;
            else if (phase < 0.3) scale = 1 - 0.02;
            else if (phase < 0.45) scale = 1 + 0.05;
            else scale = 1;
            spanWrap.style.transform = `scale(${scale})`;
            spanWrap.style.textShadow = __.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc);
        } else if (eff === 'shake') {
            const intensity = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.shake || 8) * 0.15;
            const dx = (Math.random() - 0.5) * intensity * 2;
            const dy = (Math.random() - 0.5) * intensity * 2;
            spanWrap.style.transform = `translate(${dx}px, ${dy}px)`;
            spanWrap.style.textShadow = __.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc);
        } else if (eff === 'glitch') {
            const speed = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.glitch || 5) * 0.05;
            const glitchFrame = Math.sin(_animFrameCount * 0.016 * speed);
            const isGlitch = Math.abs(glitchFrame) > 0.85;
            spanWrap.style.color = c1;
            // Do per-syllable but if glitch, add colored offset ghosts
            if (isGlitch) {
                const glitchRange = glitchFrame * 6;
                // Add red clone
                const rDiv = document.createElement('div');
                rDiv.style.cssText = `position:absolute;left:${glitchRange}px;top:0;color:#ff0000;opacity:0.6;z-index:1;`;
                rDiv.textContent = lineText;
                spanWrap.appendChild(rDiv);
                // Add green clone
                const gDiv = document.createElement('div');
                gDiv.style.cssText = `position:absolute;left:${-glitchRange}px;top:0;color:#00ff00;opacity:0.6;z-index:1;`;
                gDiv.textContent = lineText;
                spanWrap.appendChild(gDiv);
            }
            spanWrap.style.textShadow = __.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc);
        } else if (eff === 'ghosting') {
            spanWrap.style.position = 'relative';
            spanWrap.style.color = c1;
            const speed = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.ghosting || 3) * 0.08;
            const t = _animFrameCount * 0.016 * speed;
            const offX = Math.sin(t) * 15;
            const offY = Math.cos(t * 0.7) * 8;
            const ghost1 = document.createElement('div');
            ghost1.style.cssText = `position:absolute;left:${offX}px;top:${offY}px;color:${c1};opacity:0.2;z-index:0;filter:blur(3px);pointer-events:none;white-space:pre;`;
            ghost1.textContent = lineText;
            spanWrap.appendChild(ghost1);
            const ghost2 = document.createElement('div');
            ghost2.style.cssText = `position:absolute;left:${-offX * 0.6}px;top:${-offY * 0.6}px;color:${c1};opacity:0.15;z-index:0;filter:blur(5px);pointer-events:none;white-space:pre;`;
            ghost2.textContent = lineText;
            spanWrap.appendChild(ghost2);
            spanWrap.style.textShadow = __.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc);
        } else if (eff === 'glow_pulse') {
            const speed = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.glow_pulse || 5) * 0.08;
            const breathe = 0.5 + Math.sin(_animFrameCount * 0.016 * speed) * 0.5;
            const pulseBlur = Math.max(0, bl * breathe);
            const pulseOw = Math.max(0, ow * (0.5 + breathe * 0.5));
            spanWrap.style.textShadow = __.globalSettings.deepGlow ? __.buildDeepGlow(pulseOw, pulseBlur, oc) : __.buildShadow(pulseOw, pulseBlur, oc);
            spanWrap.style.color = c1;
        } else if (eff === 'typewriter') {
            // typewriter: reveal char by char (overwrite children)
            spanWrap.innerHTML = '';
            const speed = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.typewriter || 10) * 0.03;
            const charCount = Math.floor((_animFrameCount % 200) * speed);
            // Build syllables but clip
            let shown = 0;
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
                if (shown >= charCount) return;
                let remaining = charCount - shown;
                const text = syl.text || '';
                const take = Math.min(text.length, remaining);
                const part = text.slice(0, take);
                if (part) {
                    const span = document.createElement('span');
                    span.style.cssText = `display:inline-block;color:${c1};text-shadow:${__.globalSettings.deepGlow ? __.buildDeepGlow(ow, bl, oc) : __.buildShadow(ow, bl, oc)};transform:scale(${sylZoom});`;
                    span.textContent = part;
                    spanWrap.appendChild(span);
                }
                shown += take;
            });
            return; // skip applyBox
        }

        applyBoxStyle(spanWrap, ub, bc, bo);
    }

    // ============ RENDER A SINGLE SUB LINE ============
    function renderSubLine(sub, lineText, li, totalLines, sylArray, fs, posX, posY, ow, bl, oc, c1, ub, bc, bo, opacity, isO, styleName) {
        const lineSpacing = fs * 1.4;
        const startY = posY - ((totalLines - 1) * lineSpacing) / 2;
        const lineY = startY + li * lineSpacing;

        const div = document.createElement('div');

        let useFont = __.globalSettings.fontFamily;
        if (isO && styleName && __.styleSettings[styleName] && __.styleSettings[styleName].fontName) {
            const styleFont = __.getStyleFontFamily(styleName);
            useFont = styleFont;
        }

        div.style.cssText = `position:absolute; left:${(posX / __.playResX * 100)}%; top:${(lineY / __.playResY * 100)}%; transform:translate(-50%, -50%); font-size:${fs}px; font-family:'${useFont}'; font-weight:${__.globalSettings.isBold ? 'bold' : 'normal'}; font-style:${__.globalSettings.isItalic ? 'italic' : 'normal'}; text-decoration:${__.globalSettings.isUnderline ? 'underline' : ''} ${__.globalSettings.isStrike ? 'line-through' : ''}; text-align:center; white-space:nowrap; pointer-events:none; width:calc(100% - 20px); z-index:99; opacity:${Math.max(0, opacity)};`;
        const spanWrap = document.createElement('span');

        if (ub) {
            spanWrap.style.display = 'inline-block';
        }

        const eff = __.globalSettings.specialEffect;
        const hasEffect = eff && eff !== 'none' && !(sylArray && sylArray.length > 0);
        // Effects that apply at the line level (non-per-char) and work with karaoke
        const lineLevelEffects = ['float_hover', 'breathe', 'jello', 'typewriter', 'pulse', 'shake', 'glitch', 'ghosting', 'glow_pulse'];

        if (sylArray && sylArray.length > 0 && eff && eff !== 'none') {
            // ===== KARAOKE WITH EFFECT =====
            spanWrap.style.display = 'inline-block';
            spanWrap.style.whiteSpace = 'pre';
            div.style.whiteSpace = 'pre';

            if (lineLevelEffects.includes(eff)) {
                renderKaraokeLineEffect(spanWrap, sub, lineText, sylArray, ow, bl, oc, c1, ub, bc, bo, eff);
            } else if (eff === 'sine_wave') {
                renderKaraokeSineWave(spanWrap, sub, lineText, sylArray, ow, bl, oc, c1, ub, bc, bo, fs);
            } else if (['shine_sweep', 'split_color', 'retro_80s', 'golden', 'd3d_block', 'water_reflection'].includes(eff)) {
                renderKaraokeFullLineGradient(spanWrap, sub, lineText, sylArray, ow, bl, oc, c1, ub, bc, bo, eff);
            } else if (eff === 'rainbow_outline') {
                // Rainbow outline per-char continuous
                const lineElapsed = (__.globalSettings._lastRenderTime - sub.start) * 1000;
                let charIdxGlobal = 0;
                const totalChars = lineText.replace(/\u00A0/g, ' ').length;
                const speedMul = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.rainbow_outline || 1) * 0.8;
                const baseHue = (_animFrameCount * speedMul) % 360;
                sylArray.forEach(syl => {
                    let sylZoom = 1;
                    if (lineElapsed >= syl.timeStart && lineElapsed < syl.timeEnd) {
                        const kAct = __.globalSettings.kActive;
                        const sEl = lineElapsed - syl.timeStart; const sRem = syl.timeEnd - lineElapsed;
                        const zIn = kAct.zIn || 100; const zOut = kAct.zOut || 100;
                        if (sEl < zIn) sylZoom = 1 + (kAct.zoom - 1) * (sEl / zIn);
                        else if (sRem < zOut) sylZoom = 1 + (kAct.zoom - 1) * (sRem / zOut);
                        else sylZoom = kAct.zoom;
                    }
                    (syl.text || '').split('').forEach(ch => {
                        const txt = ch === ' ' ? '\u00A0' : ch;
                        const cSpan = document.createElement('span');
                        cSpan.style.cssText = 'display:inline-block;white-space:pre;position:relative;color:#ffffff;';
                        cSpan.style.transform = `scale(${sylZoom})`;
                        const textSpan = document.createElement('span');
                        textSpan.textContent = txt;
                        textSpan.style.cssText = 'position:relative;z-index:2;';
                        const shSpan = document.createElement('span');
                        shSpan.textContent = txt;
                        shSpan.style.cssText = 'position:absolute;left:0;top:0;color:transparent;pointer-events:none;';
                        if (ow > 0) {
                            const hue = (baseHue + (charIdxGlobal / Math.max(1, totalChars)) * 360) % 360;
                            shSpan.style.textShadow = __.buildShadow(ow, bl, '#ff0000');
                            shSpan.style.filter = `hue-rotate(${hue}deg)`;
                        }
                        cSpan.appendChild(shSpan);
                        cSpan.appendChild(textSpan);
                        spanWrap.appendChild(cSpan);
                        charIdxGlobal++;
                    });
                });
                applyBoxStyle(spanWrap, ub, bc, bo);
            } else if (eff === 'rainbow_outline_rgb') {
                const speedMul = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.rainbow_outline_rgb || 1) * 1.2;
                const baseBgShift = 200 - ((_animFrameCount * speedMul) % 200);
                let charIdxGlobal = 0;
                const totalChars = lineText.replace(/\u00A0/g, ' ').length;
                const lineElapsed = (__.globalSettings._lastRenderTime - sub.start) * 1000;
                sylArray.forEach(syl => {
                    let sylZoom = 1;
                    if (lineElapsed >= syl.timeStart && lineElapsed < syl.timeEnd) {
                        const kAct = __.globalSettings.kActive;
                        const sEl = lineElapsed - syl.timeStart; const sRem = syl.timeEnd - lineElapsed;
                        const zIn = kAct.zIn || 100; const zOut = kAct.zOut || 100;
                        if (sEl < zIn) sylZoom = 1 + (kAct.zoom - 1) * (sEl / zIn);
                        else if (sRem < zOut) sylZoom = 1 + (kAct.zoom - 1) * (sRem / zOut);
                        else sylZoom = kAct.zoom;
                    }
                    (syl.text || '').split('').forEach(ch => {
                        const txt = ch === ' ' ? '\u00A0' : ch;
                        const cSpan = document.createElement('span');
                        cSpan.style.cssText = 'display:inline-block;white-space:pre;position:relative;color:#ffffff;';
                        cSpan.style.transform = `scale(${sylZoom})`;
                        const textSpan = document.createElement('span');
                        textSpan.textContent = txt;
                        textSpan.style.cssText = 'position:relative;z-index:2;';
                        if (ow > 0) {
                            const charShift = (baseBgShift + (charIdxGlobal / Math.max(1, totalChars)) * 50) % 200;
                            const shSpan = document.createElement('span');
                            shSpan.textContent = txt;
                            shSpan.style.cssText = 'position:absolute;left:0;top:0;color:transparent;pointer-events:none;';
                            shSpan.style.background = 'linear-gradient(90deg,#ff0000,#ff7f00,#ffff00,#00ff00,#0000ff,#4b0082,#9400d3,#ff0000)';
                            shSpan.style.backgroundSize = '200% auto';
                            shSpan.style.backgroundPosition = `${charShift}% 50%`;
                            shSpan.style.webkitBackgroundClip = 'text'; shSpan.style.backgroundClip = 'text';
                            shSpan.style.textShadow = __.buildShadow(ow, bl, 'transparent');
                            shSpan.style.webkitTextStroke = `${ow * 2}px transparent`;
                            shSpan.style.paintOrder = 'stroke fill';
                            cSpan.appendChild(shSpan);
                        }
                        cSpan.appendChild(textSpan);
                        spanWrap.appendChild(cSpan);
                        charIdxGlobal++;
                    });
                });
                applyBoxStyle(spanWrap, ub, bc, bo);
            } else if (eff === 'rainbow_text') {
                const speedMul = (__.globalSettings.effectSpeed && __.globalSettings.effectSpeed.rainbow_text || 1) * 1.2;
                const baseBgShift = 200 - ((_animFrameCount * speedMul) % 200);
                const gradColors = '#ff0000,#ff7f00,#ffff00,#00ff00,#0000ff,#4b0082,#9400d3,#ff0000';
                let charIdxGlobal = 0;
                const totalChars = lineText.replace(/\u00A0/g, ' ').length;
                const lineElapsed = (__.globalSettings._lastRenderTime - sub.start) * 1000;
                sylArray.forEach(syl => {
                    let sylZoom = 1;
                    if (lineElapsed >= syl.timeStart && lineElapsed < syl.timeEnd) {
                        const kAct = __.globalSettings.kActive;
                        const sEl = lineElapsed - syl.timeStart; const sRem = syl.timeEnd - lineElapsed;
                        const zIn = kAct.zIn || 100; const zOut = kAct.zOut || 100;
                        if (sEl < zIn) sylZoom = 1 + (kAct.zoom - 1) * (sEl / zIn);
                        else if (sRem < zOut) sylZoom = 1 + (kAct.zoom - 1) * (sRem / zOut);
                        else sylZoom = kAct.zoom;
                    }
                    (syl.text || '').split('').forEach(ch => {
                        const txt = ch === ' ' ? '\u00A0' : ch;
                        const cSpan = document.createElement('span');
                        cSpan.style.cssText = 'display:inline-block;white-space:pre;position:relative;';
                        cSpan.style.transform = `scale(${sylZoom})`;
                        if (ow > 0) {
                            const shSpan = document.createElement('span');
                            shSpan.textContent = txt;
                            shSpan.style.cssText = 'position:absolute;left:0;top:0;color:transparent;pointer-events:none;';
                            shSpan.style.textShadow = __.buildShadow(ow, bl, oc);
                            cSpan.appendChild(shSpan);
                        }
                        const charShift = (baseBgShift + (charIdxGlobal / Math.max(1, totalChars)) * 50) % 200;
                        const inner = document.createElement('span');
                        inner.style.cssText = [
                            `background:linear-gradient(90deg,${gradColors})`,
                            'background-size:200% auto',
                            `background-position:${charShift}% 50%`,
                            '-webkit-background-clip:text;background-clip:text;',
                            'color:transparent;-webkit-text-fill-color:transparent;',
                            'text-shadow:none;-webkit-text-stroke:none;',
                            'position:relative;z-index:2;'
                        ].join('');
                        inner.textContent = txt;
                        cSpan.appendChild(inner);
                        spanWrap.appendChild(cSpan);
                        charIdxGlobal++;
                    });
                });
                applyBoxStyle(spanWrap, ub, bc, bo);
            }
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
                renderTypewriter(spanWrap, lineText, ow, bl, oc, c1);
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
                let posX = sub.filePos ? sub.filePos.x : (s.posX || __.playResX / 2);
                let posY = sub.filePos ? sub.filePos.y : (s.posY || __.playResY - 35);
                const isExplicit = !!sub.filePos;
                lineInfos.push({ sub, isO, fs, ow, bl, oc, c1, posX, posY, isExplicit });
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

            lineInfos.forEach(({ sub, isO, fs, ow, bl, oc, c1, posX, posY }) => {
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
                    const div = renderSubLine(sub, lineText, li, totalLines, sylArray, fs, posX, posY, ow, bl, oc, c1, ub, bc, bo, opacity, isO, sub.style);
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