import React, { useState } from 'react';

// Simplified Chord Data (just a few examples for demo)
const CHORDS = {
    'C': {
        name: 'C',
        frets: [-1, 3, 2, 0, 1, 0], // -1 = mute, 0 = open
        fingers: [0, 3, 2, 0, 1, 0] // 0 = no finger
    },
    'D': {
        name: 'D',
        frets: [-1, -1, 0, 2, 3, 2],
        fingers: [0, 0, 0, 1, 3, 2]
    },
    'G': {
        name: 'G',
        frets: [3, 2, 0, 0, 0, 3],
        fingers: [2, 1, 0, 0, 0, 3]
    },
    'Em': {
        name: 'Em',
        frets: [0, 2, 2, 0, 0, 0],
        fingers: [0, 2, 3, 0, 0, 0]
    },
    'Am': {
        name: 'Am',
        frets: [-1, 0, 2, 2, 1, 0],
        fingers: [0, 0, 2, 3, 1, 0]
    },
    'F': {
        name: 'F',
        frets: [1, 3, 3, 2, 1, 1],
        fingers: [1, 3, 4, 2, 1, 1], // Barre chord roughly
        barre: { fret: 1, from: 1, to: 6 }
    }
};

const ChordLibrary = () => {
    const [selectedRoot, setSelectedRoot] = useState('C');
    // const [quality, setQuality] = useState('Major'); // To be implemented with more data

    // Drawing the SVG
    const chord = CHORDS[selectedRoot] || CHORDS['C'];

    // Grid Props
    const width = 120;
    const height = 140;
    const padding = 20;
    const stringGap = (width - padding * 2) / 5;
    const fretGap = (height - padding * 2) / 5;

    return (
        <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
            <h3 className="text-lg font-bold text-white mb-3">常用和弦庫</h3>
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
                {Object.keys(CHORDS).map(k => (
                    <button
                        key={k}
                        onClick={() => setSelectedRoot(k)}
                        className={`px-3 py-1 rounded-full text-sm border font-bold ${selectedRoot === k ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-400 hover:text-white'}`}
                    >
                        {k}
                    </button>
                ))}
            </div>

            <div className="flex justify-center bg-white rounded-xl p-4 shadow-inner">
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Frets (Horizontal) */}
                    {[0, 1, 2, 3, 4].map(i => (
                        <line
                            key={`fret-${i}`}
                            x1={padding}
                            y1={padding + i * fretGap}
                            x2={width - padding}
                            y2={padding + i * fretGap}
                            stroke="#333"
                            strokeWidth={i === 0 ? 4 : 1} // Nut is thicker
                        />
                    ))}

                    {/* Strings (Vertical) */}
                    {[0, 1, 2, 3, 4, 5].map(i => (
                        <line
                            key={`str-${i}`}
                            x1={padding + i * stringGap}
                            y1={padding}
                            x2={padding + i * stringGap}
                            y2={height - padding * 0.5}
                            stroke="#333"
                            strokeWidth="1"
                        />
                    ))}

                    {/* Dots / Mutes */}
                    {chord.frets.map((fret, strIdx) => {
                        const x = padding + strIdx * stringGap;
                        if (fret === -1) {
                            // X
                            return <text key={strIdx} x={x} y={padding - 5} textAnchor="middle" fontSize="12" fill="red">×</text>;
                        }
                        if (fret === 0) {
                            // O
                            return <text key={strIdx} x={x} y={padding - 5} textAnchor="middle" fontSize="12" fill="#333">○</text>;
                        }
                        // Finger Dot
                        const y = padding + (fret - 0.5) * fretGap;
                        return (
                            <g key={strIdx}>
                                <circle cx={x} cy={y} r="6" fill="#4f46e5" />
                                {chord.fingers[strIdx] > 0 && <text x={x} y={y + 3} textAnchor="middle" fontSize="8" fill="white">{chord.fingers[strIdx]}</text>}
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};

export default ChordLibrary;
