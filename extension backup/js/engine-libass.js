(function () {
    'use strict';

    const __ = window.__SUB;

    // Only start if ASS.js mode is enabled
    if (!__.globalSettings.libassMode) return;

    // ============ weizhenye/ASS ============
    let _instance = null;
    let _containerDiv = null;
    let _resizeTimer = null;
    let _observer = null;
    let _initialized = false;

    // ============ DESTROY HELPER ============
    function destroyInstance() {
        if (_instance) {
            try { _instance.destroy(); } catch(e) {}
            _instance = null;
        }
        if (_containerDiv) {
            try { _containerDiv.remove(); } catch(e) {}
            _containerDiv = null;
        }
        if (_observer) {
            try { _observer.disconnect(); } catch(e) {}
            _observer = null;
        }
        if (_resizeTimer) {
            clearTimeout(_resizeTimer);
            _resizeTimer = null;
        }
    }

    // Expose destroyAssJs so main.js can call it on video change
    __.destroyAssJs = destroyInstance;

    // ============ PREPROCESS ASS TEXT ============
    // 1. Scale style font sizes by 0.7
    // 2. Fix ASSDraw (\p1) + karaoke (\k) conflict:
    //    ASS.js splits karaoke on \k tags into syllables. If \p1
    //    appears in a karaoke line, the drawing commands get scattered
    //    across syllables and rendered as plain text.
    //    Solution: strip ALL \k tags from lines containing \p[1-9].

    function preprocessAssText(text) {
        const lines = text.split(/\r?\n/);
        const result = [];
        let inV4Styles = false;
        let inEvents = false;

        for (let line of lines) {
            const trimmed = line.trim();

            // Track sections
            if (/^\[v4\+?\s*styles\]$/i.test(trimmed)) {
                inV4Styles = true;
                inEvents = false;
                result.push(line);
                continue;
            }
            if (/^\[events\]$/i.test(trimmed)) {
                inV4Styles = false;
                inEvents = true;
                result.push(line);
                continue;
            }
            if (/^\[/.test(trimmed)) {
                inV4Styles = false;
                inEvents = false;
                result.push(line);
                continue;
            }

            // ── Scale Fontsize in [V4+ Styles] ──
            if (inV4Styles && /^Style:/i.test(trimmed)) {
                const idxComma = line.indexOf(',');
                if (idxComma < 0) { result.push(line); continue; }
                const afterName = line.substring(idxComma + 1);
                const idxComma2 = afterName.indexOf(',');
                if (idxComma2 < 0) { result.push(line); continue; }
                const fontname = afterName.substring(0, idxComma2);
                const fontSizeStr = afterName.substring(idxComma2 + 1).split(',')[0];
                const fontSize = parseFloat(fontSizeStr.trim());
                if (!isNaN(fontSize)) {
                    const newSize = Math.round(fontSize * 0.7);
                    const capped = Math.max(6, Math.min(80, newSize));
                    const restAfterSize = afterName.substring(idxComma2 + 1).substring(fontSizeStr.length);
                    result.push(line.substring(0, idxComma + 1) + fontname + ',' + capped + restAfterSize);
                    continue;
                }
                result.push(line);
                continue;
            }

            // ── Process Dialogue/Events ──
            if (inEvents && /^Dialogue:/i.test(trimmed)) {
                const parts = line.split(',');
                if (parts.length < 10) { result.push(line); continue; }
                const textPart = parts.slice(9).join(',');

                // Check for ASSDraw drawing mode \p1..\p9
                if (/\\[pP][1-9]/.test(textPart)) {
                    // Strip ALL karaoke timing tags from drawing lines
                    let newText = textPart.replace(/\{[^}]*\\[kK][fpo]?\d+[^}]*\}/g, '');

                    // Scale inline \fs
                    newText = newText.replace(
                        /\\(fs)(\d+)/gi,
                        (match, cmd, val) => {
                            const parsed = parseFloat(val);
                            if (isNaN(parsed)) return match;
                            const newSize = Math.round(parsed * 0.7);
                            const capped = Math.max(6, Math.min(80, newSize));
                            return `\\${cmd}${capped}`;
                        }
                    );

                    const rebuilt = parts.slice(0, 9).join(',') + ',' + newText;
                    result.push(rebuilt);
                    continue;
                }

                // No ASSDraw - only scale inline \fs if present
                if (/\\fs\d+/i.test(textPart)) {
                    const newText = textPart.replace(
                        /\\(fs)(\d+)/gi,
                        (match, cmd, val) => {
                            const parsed = parseFloat(val);
                            if (isNaN(parsed)) return match;
                            const newSize = Math.round(parsed * 0.7);
                            const capped = Math.max(6, Math.min(80, newSize));
                            return `\\${cmd}${capped}`;
                        }
                    );
                    const rebuilt = parts.slice(0, 9).join(',') + ',' + newText;
                    result.push(rebuilt);
                    continue;
                }

                result.push(line);
                continue;
            }

            // ── Everything else ──
            result.push(line);
        }

        return result.join('\n');
    }

    // ============ CONSTRAIN TO VIDEO FRAME ============
    function applyConstrain() {
        if (!_containerDiv) return;

        if (!__.globalSettings.constrainToVideo) {
            _containerDiv.style.cssText = [
                'position: absolute',
                'left: 0',
                'top: 0',
                'width: 100%',
                'height: 100%',
                'pointer-events: none',
                'z-index: 41',
                'overflow: hidden'
            ].join(';');
            return;
        }

        const rect = __.getActiveVideoRect();
        if (!rect) return;

        const video = document.querySelector('video');
        if (!video) return;
        const player = video.closest('.html5-video-player');
        if (!player) return;

        const pRect = player.getBoundingClientRect();
        const leftPct = (rect.left / pRect.width) * 100;
        const topPct = (rect.top / pRect.height) * 100;
        const widthPct = (rect.width / pRect.width) * 100;
        const heightPct = (rect.height / pRect.height) * 100;

        _containerDiv.style.cssText = [
            'position: absolute',
            `left: ${leftPct}%`,
            `top: ${topPct}%`,
            `width: ${widthPct}%`,
            `height: ${heightPct}%`,
            'pointer-events: none',
            'z-index: 41',
            'overflow: hidden'
        ].join(';');
    }

    function scheduleResize() {
        if (_resizeTimer) clearTimeout(_resizeTimer);
        _resizeTimer = setTimeout(applyConstrain, 100);
    }

    // ============ CREATE OVERLAY CONTAINER ============
    function ensureContainer() {
        if (_containerDiv && _containerDiv.parentNode) return _containerDiv;

        const video = document.querySelector('video');
        if (!video) return null;

        _containerDiv = document.createElement('div');
        _containerDiv.id = '__ass_container';
        applyConstrain();

        const player = video.closest('.html5-video-player');
        if (player) {
            player.appendChild(_containerDiv);
        } else {
            video.insertAdjacentElement('afterend', _containerDiv);
        }

        _observer = new ResizeObserver(() => scheduleResize());
        _observer.observe(video);
        document.addEventListener('fullscreenchange', scheduleResize);
        document.addEventListener('webkitfullscreenchange', scheduleResize);
        window.addEventListener('resize', scheduleResize);

        return _containerDiv;
    }

    // ============ LOAD SUB TO ASS.JS ============
    __.loadSubToAssJs = function (assText) {
        if (!assText) return;

        // Destroy old instance before creating new one
        destroyInstance();

        const video = document.querySelector('video');
        if (!video) {
            console.error('[Libass] No video element');
            return;
        }

        const container = ensureContainer();
        if (!container) {
            console.error('[Libass] No container');
            return;
        }

        // Preprocess: scale fonts 0.7x + fix ASSDraw karaoke conflict
        const processedText = preprocessAssText(assText);

        try {
            _instance = new ASS(processedText, video, {
                container: container,
                resampling: 'video_height'
            });
            _instance.show();
            console.log('[ASS.js] Initialized');
            setTimeout(applyConstrain, 50);
        } catch (e) {
            console.error('[ASS.js] Init error:', e);
        }
    };

    // ============ ENGINE START ============
    __.startEngine = async function () {
        console.log('[ASS.js] Starting engine...');
        if (!__.globalSettings.libassMode) return;

        let video = document.querySelector('video');
        let attempts = 0;
        while (!video && attempts < 60) {
            await new Promise(r => setTimeout(r, 200));
            video = document.querySelector('video');
            attempts++;
        }
        if (!video) {
            console.error('[Libass] No video element found');
            return;
        }

        ensureContainer();
        console.log('[ASS.js] Engine ready - waiting for sub data');
    };

    // ============ PATCH PARSER ============
    const origParseASS = __.parseASS;
    if (origParseASS) {
        __.parseASS = function (text) {
            origParseASS.call(this, text);
            __.loadSubToAssJs(text);
        };
    }

    console.log('[ASS.js] Engine loaded');
})();