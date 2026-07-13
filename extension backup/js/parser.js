(function () {
    'use strict';

    const __ = window.__SUB;

    // Alignment helpers
    function parseAlignment(alignStr) {
        const n = parseInt(alignStr);
        if (isNaN(n) || n < 1) return 2; // default center-bottom
        if (n >= 1 && n <= 9) return n;
        return 2;
    }

    function parseDialogueOverrides(rawText) {
        const result = {
            pos: null,
            an: null,
            a: null,
            fn: null,
            fscx: null,
            fscy: null,
            marginL: null,
            marginR: null,
            marginV: null
        };
        // \pos(x,y)
        const posMatch = rawText.match(/\\pos\(([\d.]+),([\d.]+)\)/);
        if (posMatch) result.pos = { x: parseFloat(posMatch[1]), y: parseFloat(posMatch[2]) };
        // \an(1-9)
        const anMatch = rawText.match(/\\an(\d)/);
        if (anMatch) result.an = parseInt(anMatch[1]);
        // \a(1-11 legacy)
        const aMatch = rawText.match(/\\a(\d+)/);
        if (aMatch) result.a = parseInt(aMatch[1]);
        // \fn(font name)
        const fnMatch = rawText.match(/\\fn\(([^)]+)\)/);
        if (fnMatch) result.fn = fnMatch[1].trim();
        // \fscx and \fscy
        const fscx = rawText.match(/\\fscx([\d.]+)/);
        if (fscx) result.fscx = parseFloat(fscx[1]);
        const fscy = rawText.match(/\\fscy([\d.]+)/);
        if (fscy) result.fscy = parseFloat(fscy[1]);
        // \marginL, \marginR, \marginV
        const mL = rawText.match(/\\marginL\(([\d]+)\)/);
        if (mL) result.marginL = parseInt(mL[1]);
        const mR = rawText.match(/\\marginR\(([\d]+)\)/);
        if (mR) result.marginR = parseInt(mR[1]);
        const mV = rawText.match(/\\marginV\(([\d]+)\)/);
        if (mV) result.marginV = parseInt(mV[1]);

        return result;
    }

    function legacyAlignToAss(a) {
        // Legacy \a: 1=bottom left, 2=bottom center, 3=bottom right
        // 5=top left, 6=top center, 7=top right
        // 9=mid left, 10=mid center, 11=mid right
        // Map to ASS 1-9
        const map = { 1:1, 2:2, 3:3, 5:7, 6:8, 7:9, 9:4, 10:5, 11:6 };
        return map[a] || 2;
    }

    __.parseASS = function (text) {
        const lines = text.split(/\r?\n/);
        __.subtitles = [];
        __.styleSettings = {};
        // Store original text for JASSUB/libass engine
        __.lastRawAssText = text;
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
                // ASS Style format (0-indexed): Name(0), Fontname(1), Fontsize(2), Primary(3), Secondary(4), Outline(5), Back(6), Bold(7), Italic(8), Underline(9), StrikeOut(10), ScaleX(11), ScaleY(12), Spacing(13), Angle(14), BorderStyle(15), Outline(16), Shadow(17), Alignment(18), MarginL(19), MarginR(20), MarginV(21), Encoding(22)
                const align = p[18] ? parseAlignment(p[18].trim()) : 2;
                const marginL = p[19] ? parseInt(p[19].trim()) || 10 : 10;
                const marginR = p[20] ? parseInt(p[20].trim()) || 10 : 10;
                const marginV = p[21] ? parseInt(p[21].trim()) || 10 : 10;
                const fontSize = p[2] ? parseFloat(p[2].trim()) || 20 : 20;
                let defX = __.playResX / 2;
                let defY = __.playResY - 40;
                // Use alignment to set default center position
                switch (align) {
                    case 1: case 4: case 7: defX = marginL + 20; break;
                    case 3: case 6: case 9: defX = __.playResX - marginR - 20; break;
                    default: defX = __.playResX / 2;
                }
                switch (align) {
                    case 7: case 8: case 9: defY = marginV + 20; break;
                    case 4: case 5: case 6: defY = __.playResY / 2; break;
                    default: defY = __.playResY - marginV - 20;
                }
                __.styleSettings[name] = {
                    color1: c1, color3: c3,
                    origColor1: c1, origColor3: c3,
                    posX: defX, posY: defY,
                    fontSize: 25, outlineWidth: 2, blur: 2,
                    fontName: fontName,
                    align: align,
                    marginL: marginL, marginR: marginR, marginV: marginV,
                    origAlign: align,
                    origMarginL: marginL, origMarginR: marginR, origMarginV: marginV,
                    origFontSize: fontSize,
                    origOutlineWidth: 2,
                    origShadow: 0,
                    override: !__.globalSettings.useGlobalStyles,
                    visible: true
                };
            }
            if (section.includes('events') && (line.startsWith('Dialogue:') || line.startsWith('Comment:'))) {
                if (line.startsWith('Comment:')) continue;
                const p = line.substring(9).split(',');
                const rawText = p.slice(9).join(',');
                const overrides = parseDialogueOverrides(rawText);

                // Determine effective alignment for this line
                let lineAlign = null;
                if (overrides.an) lineAlign = overrides.an;
                else if (overrides.a) lineAlign = legacyAlignToAss(overrides.a);

                // Get dialogue margin fields (p[5]=MarginL, p[6]=MarginR, p[7]=MarginV)
                const dlgMarginL = p[5] ? parseInt(p[5].trim()) : 0;
                const dlgMarginR = p[6] ? parseInt(p[6].trim()) : 0;
                const dlgMarginV = p[7] ? parseInt(p[7].trim()) : 0;

                // Use inline \marginL/R/V overrides if present
                const effMarginL = overrides.marginL !== null ? overrides.marginL : dlgMarginL;
                const effMarginR = overrides.marginR !== null ? overrides.marginR : dlgMarginR;
                const effMarginV = overrides.marginV !== null ? overrides.marginV : dlgMarginV;

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
                    filePos: overrides.pos,
                    align: lineAlign,
                    marginL: effMarginL,
                    marginR: effMarginR,
                    marginV: effMarginV,
                    fn: overrides.fn,
                    fscx: overrides.fscx,
                    fscy: overrides.fscy
                });
            }
        }
        __.saveCache();
        __.saveSubToStorage();
        if (typeof __.renderStyles === 'function') __.renderStyles();
    };
})();