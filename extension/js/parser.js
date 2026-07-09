(function () {
    'use strict';

    const __ = window.__SUB;

    __.parseASS = function (text) {
        const lines = text.split(/\r?\n/);
        __.subtitles = [];
        __.styleSettings = {};
        const resXMatch = text.match(/PlayResX:\s*(\d+)/i), resYMatch = text.match(/PlayResY:\s*(\d+)/i);
        __.playResX = resXMatch ? parseInt(resXMatch[1]) : 384;
        __.playResY = resYMatch ? parseInt(resYMatch[1]) : 288;
        __.timeShiftMs = 0;
        const tsInput = document.getElementById('ts-input');
        if (tsInput) tsInput.value = '0';

        // Reset kActive colors, 3c default red when loading ASS first time
        __.globalSettings.kActive.c1 = '#ffffff';
        __.globalSettings.kActive.c3 = '#ff0000';
        __.globalSettings.kPre.c1 = '#ffffff';
        __.globalSettings.kPre.c3 = '#000000';
        __.globalSettings.kPost.c1 = '#ffffff';
        __.globalSettings.kPost.c3 = '#000000';
        __.globalSettings.specialEffect = 'none';

        let section = "";
        for (let line of lines) {
            line = line.trim();
            if (line.startsWith(';') || line.startsWith('!')) continue;
            if (line.startsWith('[')) { section = line.toLowerCase(); continue; }
            if (section.includes('styles') && line.startsWith('Style:')) {
                const p = line.substring(6).split(',');
                const name = p[0].trim();
                const c1 = __.assToHex(p[3]);     // PrimaryColour
                const c3 = __.assToHex(p[5]);     // OutlineColour
                const fontName = p[1].trim();      // Fontname from Aegisub
                let defX = __.playResX / 2, defY = (name.toLowerCase().includes('roma')) ? 80 : (name.toLowerCase().includes('kanji') ? 155 : __.playResY - 80);
                __.styleSettings[name] = { color1: c1, color3: c3, origColor1: c1, origColor3: c3, posX: defX, posY: defY, fontSize: 23, outlineWidth: 2, blur: 2, fontName: fontName, override: !__.globalSettings.useGlobalStyles, visible: true };
            }
            if (section.includes('events') && (line.startsWith('Dialogue:') || line.startsWith('Comment:'))) {
                if (line.startsWith('Comment:')) continue;
                const p = line.substring(9).split(',');
                const rawText = p.slice(9).join(',');

                const pos = rawText.match(/\\pos\(([\d.]+),([\d.]+)\)/);

                // Split by \N → each segment = 1 line
                const rawLines = rawText.split(/\\N/gi);

                const syllableGroups = [];
                const flatSyllables = [];
                let hasSyllables = false;
                let cumulativeTime = 0;

                rawLines.forEach(rawPart => {
                    // Extract karaoke tags for this segment
                    const kRegex = /\{(?:\\[kK][fpo]?)(\d+)\}([^{]*)/g;
                    const syls = [];
                    let lineDuration = 0;
                    let m;
                    while ((m = kRegex.exec(rawPart)) !== null) {
                        const d = parseInt(m[1]) * 10;
                        const ts = cumulativeTime + lineDuration;
                        syls.push({ timeStart: ts, timeEnd: ts + d, text: m[2] });
                        lineDuration += d;
                    }
                    cumulativeTime += lineDuration;

                    if (syls.length > 0) {
                        hasSyllables = true;
                        syls.forEach(s => flatSyllables.push(s));
                    }

                    const cleanText = rawPart.replace(/\{[^}]+\}/g, '');
                    syllableGroups.push({
                        syllables: syls,
                        text: cleanText
                    });
                });

                // Build display text (with \n between groups)
                let displayText = '';
                syllableGroups.forEach((g, i) => {
                    if (i > 0) displayText += '\n';
                    displayText += g.text;
                });

                __.subtitles.push({
                    start: __.toTime(p[1]),
                    end: __.toTime(p[2]),
                    style: p[3].trim(),
                    syllableGroups: syllableGroups,
                    syllables: flatSyllables,
                    text: displayText,
                    filePos: pos ? { x: parseFloat(pos[1]), y: parseFloat(pos[2]) } : null
                });
            }
        }
        __.saveCache();
        __.saveSubToStorage();
        if (typeof __.renderStyles === 'function') __.renderStyles();
    };
})();