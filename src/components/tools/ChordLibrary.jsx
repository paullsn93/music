import React, { useState } from 'react';
import { calculateChord, ALL_ROOTS, ALL_QUALITIES } from '../../utils/chordLogic';

const ChordLibrary = () => {
    const [selectedRoot, setSelectedRoot] = useState('C');
    const [selectedQuality, setSelectedQuality] = useState('Major');

    const chord = calculateChord(selectedRoot, selectedQuality);

    // SVG Config
    const width = 140;
    const height = 160;
    const padding = 25;
    const stringGap = (width - padding * 2) / 5;
    const fretGap = (height - padding * 2) / 5;

    // Determine start fret to draw
    // If baseFret is 0, we draw frets 0-4 (Nut at top)
    // If baseFret > 0, we draw relative frets 1,2,3,4,5. 
    // Wait, barre definition is relative.
    // E.g. Barre at 3. The data says "relative to capo".
    // 0 = Barre, 1 = +1 fret.. 
    // If we draw 5 frets.
    // Logic: 
    //   If open chord: draw frets 0,1,2,3,4. (Nut visible)
    //   If moveable: draw frets base, base+1, base+2...
    //   Actually, simpler: simpler data model is "Absolute Frets".
    //   BUT my logic returns RELATIVE frets (0 = barre).
    //   So let's draw relative frets 0 to 4 in the SVG, 
    //   and label the side with "3fr" if baseFret=3.

    const startFretLabel = chord?.baseFret > 0 ? chord.baseFret : 1;

    return (
        <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600 h-full flex flex-col">
            <h3 className="text-lg font-bold text-white mb-3 flex-shrink-0">常用和弦庫</h3>

            {/* Root Selector */}
            <div className="mb-3 flex gap-2 overflow-x-auto pb-2 no-scrollbar flex-shrink-0">
                {ALL_ROOTS.map(note => (
                    <button
                        key={note}
                        onClick={() => setSelectedRoot(note)}
                        className={`min-w-[40px] px-3 py-1 rounded-full text-sm font-bold border transition ${selectedRoot === note ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-400 hover:text-white'}`}
                    >
                        {note}
                    </button>
                ))}
            </div>

            {/* Quality Selector */}
            <div className="mb-4 flex flex-wrap gap-2 flex-shrink-0">
                {ALL_QUALITIES.map(q => (
                    <button
                        key={q}
                        onClick={() => setSelectedQuality(q)}
                        className={`px-3 py-1 rounded-md text-xs font-medium border transition ${selectedQuality === q ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-gray-800 border-gray-600 text-gray-400 hover:text-white'}`}
                    >
                        {q === 'Major' ? 'Major (大)' : q === 'Minor' ? 'Minor (小)' : q}
                    </button>
                ))}
            </div>

            {/* Chord Display */}
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                {!chord ? (
                    <div className="text-gray-500 text-sm">暫無此和弦指法</div>
                ) : (
                    <div className="relative bg-white rounded-xl p-4 shadow-lg">
                        <span className="absolute top-2 left-3 text-gray-900 font-bold text-xl">{chord.name}</span>
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
                                    strokeWidth={i === 0 && chord.baseFret === 0 ? 4 : 1} // Thick nut ONLY if open chord
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

                            {/* Side Label for Fret Number */}
                            {chord.baseFret > 0 && (
                                <text x={padding - 8} y={padding + 12} fontSize="10" fill="#666" textAnchor="end" fontWeight="bold">
                                    {chord.baseFret}
                                </text>
                            )}

                            {/* Barre Rendering */}
                            {chord.baseFret > 0 && chord.barre && (
                                <g>
                                    <path
                                        d={`M ${padding + (chord.barre.from - 1) * stringGap} ${padding + 0.5 * fretGap} L ${padding + (chord.barre.to - 1) * stringGap} ${padding + 0.5 * fretGap}`}
                                        stroke="#4f46e5"
                                        strokeWidth="8"
                                        strokeLinecap="round"
                                        opacity="0.3"
                                    />
                                    {/* Usually barre is drawn behind, but here simplified */}
                                </g>
                            )}

                            {/* Dots / Mutes */}
                            {chord.frets.map((fretRel, strIdx) => {
                                const x = padding + strIdx * stringGap;

                                // Muted String
                                if (fretRel === -1) {
                                    return <text key={strIdx} x={x} y={padding - 5} textAnchor="middle" fontSize="12" fill="red">×</text>;
                                }

                                // Open String (Only if Nut is at 0, AND played 0)
                                // If baseFret > 0, 0 means "The fret behind the nut"? No.
                                // Logic.js returns relative frets. 
                                // -1 = Mute
                                // 0 = Played at base (Barre or Open)
                                // 1 = Played at base + 1

                                if (fretRel === 0 && chord.baseFret === 0) {
                                    // True Open String
                                    return <text key={strIdx} x={x} y={padding - 5} textAnchor="middle" fontSize="12" fill="#333">○</text>;
                                }

                                // Fingered Note
                                // y position: relative fret 0 is between line 0 and 1? 
                                // Wait.
                                // If Nut is line 0. Fret 1 note is at 0.5 * gap.
                                // If BaseFret=3. (Line 0 represents Fret 3 top wire).
                                // "0" relative fret means played AT fret 3. That is between Line 0 and 1.
                                // So formula: y = padding + (fretRel + 0.5) * fretGap

                                const y = padding + (fretRel + 0.5) * fretGap;

                                // Don't draw if out of bounds (e.g. fretRel > 4)
                                if (fretRel > 4) return null;

                                const finger = chord.fingers ? chord.fingers[strIdx] : 0;

                                return (
                                    <g key={strIdx}>
                                        <circle cx={x} cy={y} r="7" fill={finger === 1 && chord.baseFret > 0 ? "#4f46e5" : "#1f2937"} />
                                        {/* Color code: Barre finger (1) is indigo, others dark gray */}
                                        <text x={x} y={y + 3} textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">{finger > 0 ? finger : ''}</text>
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                )}
                <p className="mt-4 text-xs text-center text-gray-500 leading-relaxed">
                    系統會自動判斷使用「開放指型」或「封閉指型」<br />以提供最順手的按法。
                </p>
            </div>
        </div>
    );
};

export default ChordLibrary;
