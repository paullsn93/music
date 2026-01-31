// --- Constants ---
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Map Note Name -> Index (0-11)
const NOTE_MAP = NOTES.reduce((acc, note, i) => {
    acc[note] = i;
    // Handle flats equivalent
    if (note.includes('#')) {
        const flat = NOTES[(i + 1) % 12] + 'b'; // C# -> Db ?? Wait. C# is index 1. D is 2. Db is D flat.
        // Actually simpler: 
        // C# = Db
        // D# = Eb
        // F# = Gb
        // G# = Ab
        // A# = Bb
    }
    return acc;
}, {});

// Add manual aliases for flats
NOTE_MAP['Db'] = 1;
NOTE_MAP['Eb'] = 3;
NOTE_MAP['Gb'] = 6;
NOTE_MAP['Ab'] = 8;
NOTE_MAP['Bb'] = 10;

/**
 * Shape Definitions (CAGED)
 * frets: Array[6] (String 6 to 1). -1=mute, 0=open, >0=relative fret
 * fingers: Array[6]. 0=none, 1=index, 2=middle, 3=ring, 4=pinky
 * rootString: Which string holds the root note (1-6, 1=High E, 6=Low E)
 * baseRootOffset: The interval of the root note relative to open string.
 *    E.g. E-shape root is on 6th string. Open 6th is E. 
 *    A-shape root is on 5th string. Open 5th is A.
 */
const SHAPES = {
    // === E SHAPE (Root on 6th String) ===
    'E_Major': { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], rootStr: 6, suffix: '' },
    'E_Minor': { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], rootStr: 6, suffix: 'm' },
    'E_7': { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], rootStr: 6, suffix: '7' },
    'E_m7': { frets: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0], rootStr: 6, suffix: 'm7' },
    'E_Maj7': { frets: [0, x => x + 2, 1, 1, 0, x => x], fingers: [1, 3, 2, 4, 0, 0], rootStr: 6, suffix: 'Maj7' }, // Emaj7 x79897 difficult? 
    // Actually Open Emaj7 is 021100.
    // Let's define barre shapes strictly.

    // === A SHAPE (Root on 5th String) ===
    'A_Major': { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 1, 1, 0], rootStr: 5, suffix: '' },
    'A_Minor': { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0], rootStr: 5, suffix: 'm' },
    'A_7': { frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0], rootStr: 5, suffix: '7' },
    'A_m7': { frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0], rootStr: 5, suffix: 'm7' },
    'A_Maj7': { frets: [-1, 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0], rootStr: 5, suffix: 'Maj7' },
};

// Precise Barre Definitions (Relative to Nut/Capo)
// Format: frets relative to "Capo" (Barre). 0 = the barre fret.
// fingers: 1=Barre finger (usually Index). 
const BARRE_SHAPES = {
    // 6th String Root (Based on E Shape)
    '6_Major': { frets: [0, 2, 2, 1, 0, 0], fingers: [1, 3, 4, 2, 1, 1] },
    '6_Minor': { frets: [0, 2, 2, 0, 0, 0], fingers: [1, 3, 4, 1, 1, 1] },
    '6_7': { frets: [0, 2, 0, 1, 0, 0], fingers: [1, 3, 1, 2, 1, 1] },
    '6_m7': { frets: [0, 2, 0, 0, 0, 0], fingers: [1, 3, 1, 1, 1, 1] },
    '6_Maj7': { frets: [0, x => -1, 1, 2, 0, x => -1], fingers: [1, 0, 2, 3, 4, 0] }, // Shell voicing often used: 1x234x (Root-x-7-3-5-x) or just play triad
    // Let's use standard barre Maj7: 1-x-2-3-1-x doesn't work well. 
    // Standard Jazz: Thumb or Index. x-Root-Maj7-3-5-x is A shape.
    // E-shape Maj7: Root-x-7-3-5-1 (e.g. Fmaj7 132211 - hard). 
    // Let's stick to A-shape for Maj7 usually, or strict 1-3-2-2-1-1 is hard.
    // Let's us 8-x-9-9-8-x type?
    // Let's provide a "Open" lookup first, then fallback to algorithmic.

    // 5th String Root (Based on A Shape)
    '5_Major': { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 1, 2, 3, 4, 1] }, // A shape barre. 
    // Actually, A-shape barre is often played: Index on 0 (barre 5 Strings), Ring bars 3 strings (2,2,2).
    // x-1-3-3-3-1. fingers: x-1-3-3-3-1
    '5_Minor': { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 1, 3, 4, 2, 1] }, // Am shape barre x13421
    '5_7': { frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 1, 3, 1, 4, 1] },
    '5_m7': { frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 1, 3, 1, 2, 1] },
    '5_Maj7': { frets: [-1, 0, 2, 1, 2, 0], fingers: [0, 1, 3, 2, 4, 1] },
};

// Hand-picked Open Chords (priority over barre)
const OPEN_CHORDS = {
    'C_Major': { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
    'A_Major': { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
    'G_Major': { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] }, // Standard 320003
    'E_Major': { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
    'D_Major': { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },

    'A_Minor': { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
    'E_Minor': { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
    'D_Minor': { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },

    'C_7': { frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
    'A_7': { frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0] },
    'G_7': { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
    'E_7': { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
    'B_7': { frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },
    'D_7': { frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },

    'F_Major': { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], barre: { fret: 1 } }, // F is technically barre but vital
};

export const getNoteIndex = (noteName) => NOTE_MAP[noteName];

/**
 * Calculate best chord voicing
 * @param {string} rootName - e.g. "C", "F#"
 * @param {string} quality - "Major", "Minor", "7", "m7", "Maj7"
 */
export const calculateChord = (rootName, quality) => {
    // 1. Check Open Chords first
    const key = `${rootName}_${quality}`;
    if (OPEN_CHORDS[key]) {
        return { ...OPEN_CHORDS[key], baseFret: 0, name: `${rootName} ${quality}` }; // Open chords always base 0
    }

    // 2. Calculate Barre Position
    const rootIndex = getNoteIndex(rootName); // 0-11
    if (rootIndex === undefined) return null;

    // Check E-Shape (Root on String 6)
    // Open E is index 4.
    // Fret = Target - OpenE
    let fretE = rootIndex - 4;
    if (fretE < 0) fretE += 12; // Wrap around
    // Prefer low frets. If fretE > 7, maybe try A shape? 
    // Wait, E shape at fret 8 (C) vs A shape at fret 3 (C). A shape is better.

    // Check A-Shape (Root on String 5)
    // Open A is index 9.
    let fretA = rootIndex - 9;
    if (fretA < 0) fretA += 12;

    let useShape = '';
    let fretPos = 0;
    let shapeDef = null;

    // Heuristic: Choose lowest fret, but prefer E shape if similar?
    // E.g. B (Index 11). E-shape: 11-4=7. A-shape: 11-9=2. Choose A-shape (fret 2).
    // F (Index 5). E-shape: 1. A-shape: 8. Choose E-shape (fret 1).
    if (fretE <= fretA && fretE > 0) {
        useShape = `6_${quality}`;
        fretPos = fretE;
    } else {
        useShape = `5_${quality}`;
        fretPos = fretA;

        // Edge case: if fretA is very high (e.g. > 9), maybe E shape was better even if higher? 
        // nah, keep it simple.
    }

    // Check if shape exists
    if (!BARRE_SHAPES[useShape]) {
        // Fallback to Major if complex type not found? Or return null.
        return null;
    }

    shapeDef = BARRE_SHAPES[useShape];

    // Construct Result
    return {
        frets: shapeDef.frets, // Relative frets. In renderer, add baseFret.
        fingers: shapeDef.fingers,
        baseFret: fretPos, // The Barre is here.
        barre: { fret: 1, from: useShape.startsWith('6') ? 1 : 1, to: useShape.startsWith('6') ? 6 : 5 }, // Relative barre at 1
        name: `${rootName} ${quality}` // Clean display name
    };
};

export const ALL_ROOTS = NOTES;
export const ALL_QUALITIES = ['Major', 'Minor', '7', 'Maj7', 'm7'];
