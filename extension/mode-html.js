(function() {
    if (window.Aegi.settings.useLibass) return;

    function hexToRgba(hex, alpha) { 
        const r = parseInt(hex.slice(1,3), 16), g = parseInt(hex.slice(3,5), 16), b = parseInt(hex.slice(5,7), 16); 
        return `rgba(${r},${g},${b},${alpha})`; 
    }

    function htmlRenderLoop() {
        const video = document.querySelector('video.html5-main-video') || document.querySelector('video');
        let layer = document.getElementById('sub-ultra-layer');
        
        if (video && layer && window.Aegi.subtitles.length > 0) {
            const time = video.currentTime; 
            const active = window.Aegi.subtitles.filter(s => time >= s.start && time <= s.end);
            layer.innerHTML = '';
            
            active.forEach(sub => {
                const s = window.Aegi.styles[sub.style] || { visible: true }; 
                if (!s.visible) return;
                
                const isO = s.override;
                
                // ĐÃ FIX: LẤY MÀU SẮC ĐÚNG THEO TỪNG STYLE KHI BẬT OVERRIDE
                const c1 = isO ? s.color1 : window.Aegi.settings.color1;
                const c3 = isO ? s.color3 : window.Aegi.settings.color3;
                const fs = (isO ? s.fontSize : window.Aegi.settings.fontSize) + (window.Aegi.isFullscreen ? 10 : 0);
                const ow = isO ? s.outlineWidth : window.Aegi.settings.outlineWidth;
                const bl = isO ? s.blur : window.Aegi.settings.blur;

                // ĐÃ FIX: HIỂN THỊ BOX XUNG QUANH CHỮ
                const ub = window.Aegi.settings.useBox;
                const bc = window.Aegi.settings.boxColor;
                const bo = window.Aegi.settings.boxOpacity;

                // TỌA ĐỘ ƯU TIÊN
                const posX = sub.filePos ? sub.filePos.x : (s.posX !== undefined ? s.posX : window.Aegi.playResX/2);
                const posY = sub.filePos ? sub.filePos.y : (s.posY !== undefined ? s.posY : window.Aegi.playResY-35);
                
                let opacity = 1, fadIn = window.Aegi.settings.fadIn / 1000, fadOut = window.Aegi.settings.fadOut / 1000;
                if (time - sub.start < fadIn) opacity = (time - sub.start) / fadIn; 
                else if (sub.end - time < fadOut) opacity = (sub.end - time) / fadOut;

                const div = document.createElement('div');
                div.style.cssText = `position:absolute; left:${(posX/window.Aegi.playResX*100)}%; top:${(posY/window.Aegi.playResY*100)}%; transform:translate(-50%, -50%); font-size:${fs}px; font-family:'${window.Aegi.settings.fontFamily}'; font-weight:${window.Aegi.settings.isBold?'bold':'normal'}; font-style:${window.Aegi.settings.isItalic?'italic':'normal'}; text-decoration:${window.Aegi.settings.isUnderline?'underline':''} ${window.Aegi.settings.isStrike?'line-through':''}; text-align:center; white-space:nowrap; pointer-events:none; width:calc(100% - 20px); z-index:99; opacity:${Math.max(0, opacity)};`;
                
                const spanWrap = document.createElement('span');
                
                // ÁP DỤNG MÀU NỀN CHO BOX
                if (ub) { 
                    spanWrap.style.backgroundColor = hexToRgba(bc, bo); 
                    spanWrap.style.padding = '4px 10px'; 
                    spanWrap.style.borderRadius = '6px'; 
                }
                
                if (window.Aegi.settings.kEnable && sub.syllables.length > 0) {
                    const lineElapsed = (time - sub.start) * 1000;
                    sub.syllables.forEach(syl => {
                        const span = document.createElement('span'); span.innerText = syl.text; span.className = 'syllable';
                        let ks, zoom = 1;
                        if (lineElapsed < syl.timeStart) ks = window.Aegi.settings.kPre;
                        else if (lineElapsed >= syl.timeStart && lineElapsed < syl.timeEnd) {
                            ks = window.Aegi.settings.kActive;
                            const sEl = lineElapsed - syl.timeStart, sRem = syl.timeEnd - lineElapsed;
                            if (sEl < ks.zIn) zoom = 1 + (ks.zoom - 1) * (sEl / ks.zIn);
                            else if (sRem < ks.zOut) zoom = 1 + (ks.zoom - 1) * (sRem / ks.zOut);
                            else zoom = ks.zoom;
                        } else ks = window.Aegi.settings.kPost;
                        
                        Object.assign(span.style, { color: ks.c1, transform: `scale(${zoom})`, textShadow: `0 0 ${ks.blur}px ${ks.c3}, ${ks.outl}px ${ks.outl}px ${ks.blur}px ${ks.c3}, -${ks.outl}px -${ks.outl}px ${ks.blur}px ${ks.c3}, ${ks.outl}px -${ks.outl}px ${ks.blur}px ${ks.c3}, -${ks.outl}px ${ks.outl}px ${ks.blur}px ${ks.c3}` });
                        spanWrap.appendChild(span);
                    });
                } else {
                    spanWrap.innerText = sub.text; 
                    spanWrap.style.color = c1; // Đổi màu chữ theo Style
                    spanWrap.style.textShadow = `0 0 ${bl}px ${c3}, ${ow}px ${ow}px ${bl}px ${c3}, -${ow}px -${ow}px ${bl}px ${c3}, ${ow}px -${ow}px ${bl}px ${c3}, -${ow}px ${ow}px ${bl}px ${c3}`;
                }
                div.appendChild(spanWrap); layer.appendChild(div);
            });
        }
        requestAnimationFrame(htmlRenderLoop);
    }
    
    requestAnimationFrame(htmlRenderLoop);
})();