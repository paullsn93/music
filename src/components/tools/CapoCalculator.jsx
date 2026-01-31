import React, { useState } from 'react';

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const CapoCalculator = () => {
    const [originalKey, setOriginalKey] = useState('C');
    const [targetKey, setTargetKey] = useState('C');

    const getCapoPosition = () => {
        const origIndex = KEYS.indexOf(originalKey);
        const targetIndex = KEYS.indexOf(targetKey);

        let diff = origIndex - targetIndex;
        if (diff < 0) diff += 12;

        return diff;
    };

    const capoPos = getCapoPosition();
    const playKey = targetKey; // When using Capo at 'capoPos', playing 'playKey' shapes sounds like 'originalKey'

    // Wait, the logic usually is:
    // "I want to sing in Key X (Target), but I want to use chords from Key Y (Play Shape)."
    // Capo = Target - Play Shape

    // Let's rephrase UI: 
    // "原調 (Original Key / Vocal Key)": What you want to hear.
    // "想彈的調 (Play Key / Shape)": What C/G/D shapes you want to use.
    // Result: Capo Fret.

    const [vocalKey, setVocalKey] = useState('G');
    const [playShape, setPlayShape] = useState('C');

    const calculateCapo = () => {
        const vIndex = KEYS.indexOf(vocalKey);
        const pIndex = KEYS.indexOf(playShape);
        let gap = vIndex - pIndex;
        if (gap < 0) gap += 12;
        return gap;
    };

    return (
        <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
            <h3 className="text-lg font-bold text-white mb-3">移調夾計算機 (Capo)</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-xs text-gray-400 mb-1">原曲調性 (Vocal)</label>
                    <select
                        value={vocalKey}
                        onChange={e => setVocalKey(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white"
                    >
                        {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-gray-400 mb-1">想彈的指法 (Shape)</label>
                    <select
                        value={playShape}
                        onChange={e => setPlayShape(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white"
                    >
                        {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-indigo-900/50 p-3 rounded-lg text-center border border-indigo-500/30">
                <span className="text-gray-300 text-sm">請夾在第</span>
                <div className="text-3xl font-bold text-indigo-400 my-1">{calculateCapo()}</div>
                <span className="text-gray-300 text-sm">格 (Capo {calculateCapo()})</span>
            </div>
        </div>
    );
};

export default CapoCalculator;
