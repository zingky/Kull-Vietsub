(function () {
    'use strict';

    const __ = window.__SUB;

    __.parseASS = function (text) {
        const lines = text.split(/\r?\n/);
        __.subtitles = [];
        const resXMatch = text.match(/PlayResX:\s*(\d+)/i), resYMatch = text.match(/PlayResY:\s*(\d+)/i);
        __.playResX = resXMatch ? parseInt(resXMatch[1]) : 384;
        __.playResY = resYMatch ? parseInt(resYMatch[1]) : 288;
        __.timeShiftMs = 0;
        const tsInput = document.getElementById('ts-input');
        if (tsInput) tsInput.value = '0';
        let section = "";
        for (let line of lines) {
            line = line.trim();
            if (line.startsWith(';') || line.startsWith('!')) continue;
            if (line.startsWith('[')) { section = line.toLowerCase(); continue; }
            if (section.includes('styles') && line.startsWith('Style:')) {
                const p = line.substring(6).split(',');
                const name = p[0].trim();
                const c1 = __.assToHex(p[3]), c3 = __.assToHex(p[5]);
                let defX = __.playResX / 2, defY = (name.toLowerCase().includes('roma')) ? 80 : (name.toLowerCase().includes('kanji') ? 155 : __.playResY - 80);
                __.styleSettings[name] = { color1: c1, color3: c3, posX: defX, posY: defY, fontSize: 23, outlineWidth: 1.5, blur: 2, override: false, visible: true };
            }
            if (section.includes('events') && (line.startsWith('Dialogue:') || line.startsWith('Comment:'))) {
                if (line.startsWith('Comment:')) continue;
                const p = line.substring(9).split(',');
                const rawText = p.slice(9).join(',');
                const pos = rawText.match(/\\pos\(([\d.]+),([\d.]+)\)/);
                const syllables = [];
                let runningTime = 0;
                const kRegex = /\{(?:\\[kK][fpo]?)(\d+)\}([^{]*)/g;
                let m;
                while ((m = kRegex.exec(rawText)) !== null) {
                    const d = parseInt(m[1]) * 10;
                    syllables.push({ timeStart: runningTime, timeEnd: runningTime + d, text: m[2] });
                    runningTime += d;
                }
                __.subtitles.push({
                    start: __.toTime(p[1]),
                    end: __.toTime(p[2]),
                    style: p[3].trim(),
                    syllables,
                    text: syllables.length > 0 ? "" : rawText.replace(/\{[^}]+\}/g, '').replace(/\\N/gi, '\n'),
                    filePos: pos ? { x: parseFloat(pos[1]), y: parseFloat(pos[2]) } : null
                });
            }
        }
        __.saveSubToStorage();
        if (typeof __.renderStyles === 'function') __.renderStyles();
    };
})();