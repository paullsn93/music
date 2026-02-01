import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, X, MousePointerClick, Minus, Plus, Volume2, Music2, Check } from 'lucide-react';

const PersistentMetronome = ({ onClose }) => {
    // --- State ---
    const [bpm, setBpm] = useState(120);
    const [isPlaying, setIsPlaying] = useState(false);

    // Rhythm Settings
    const [timeSignature, setTimeSignature] = useState('4/4'); // '4/4', '3/4', '6/8'
    const [subdivision, setSubdivision] = useState(1); // 1 = Quarter, 2 = Eighth
    const [volume, setVolume] = useState(0.7); // 0.0 to 1.0

    // Tap Tempo State
    const [tapTimes, setTapTimes] = useState([]);

    // Logic State (Refs for Audio Thread)
    const audioContextRef = useRef(null);
    const nextNoteTimeRef = useRef(0);
    const timerIDRef = useRef(null);
    const currentBeatRef = useRef(0); // 0 to beatsPerBar-1

    const lookahead = 25.0; // ms
    const scheduleAheadTime = 0.1; // s

    // Sync Refs for Audio Scheduler
    const bpmRef = useRef(bpm);
    const timeSignatureRef = useRef(timeSignature);
    const subdivisionRef = useRef(subdivision);
    const volumeRef = useRef(volume);

    useEffect(() => { bpmRef.current = bpm; }, [bpm]);
    useEffect(() => { timeSignatureRef.current = timeSignature; }, [timeSignature]);
    useEffect(() => { subdivisionRef.current = subdivision; }, [subdivision]);
    useEffect(() => { volumeRef.current = volume; }, [volume]);

    // Parse Time Signature to Beats Per Bar
    const getBeatsPerBar = (sig) => {
        switch (sig) {
            case '3/4': return 3;
            case '6/8': return 6;
            case '4/4': default: return 4;
        }
    };

    // --- Audio Engine ---
    useEffect(() => {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        // Don't create context until interaction if possible, or create suspended.
        // But for a metronome, we might as well create it.
        audioContextRef.current = new AudioContext();

        return () => {
            if (timerIDRef.current) window.clearTimeout(timerIDRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, []);

    const nextNote = () => {
        const secondsPerBeat = 60.0 / bpmRef.current;
        nextNoteTimeRef.current += secondsPerBeat;

        const beatsPerBar = getBeatsPerBar(timeSignatureRef.current);
        currentBeatRef.current = (currentBeatRef.current + 1) % beatsPerBar;
    };

    const playClick = (time, isAccent, isSubdivision = false) => {
        if (!audioContextRef.current) return;

        const osc = audioContextRef.current.createOscillator();
        const gainNode = audioContextRef.current.createGain();

        osc.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);

        // Sound Design
        if (isSubdivision) {
            osc.type = 'square';
            osc.frequency.value = 600; // Lower pitch for subdivision
        } else if (isAccent) {
            osc.type = 'square';
            osc.frequency.value = 1500; // High pitch acccent
        } else {
            osc.type = 'square';
            osc.frequency.value = 1000; // Normal click
        }

        // Volume Envelope
        const masterVol = volumeRef.current;
        // Boost gain for 'square' wave to cut through, but respect master volume
        // Subdivision is quieter
        const peakGain = isSubdivision ? (0.3 * masterVol) : (isAccent ? (1.0 * masterVol) : (0.7 * masterVol));

        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(peakGain, time + 0.001);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.03); // Short, sharp click

        osc.start(time);
        osc.stop(time + 0.05);
    };

    const scheduler = () => {
        // while there are notes that will need to play before the next interval, schedule them
        while (nextNoteTimeRef.current < audioContextRef.current.currentTime + scheduleAheadTime) {

            // 1. Play Main Beat
            const beatsPerBar = getBeatsPerBar(timeSignatureRef.current);
            const isAccent = (currentBeatRef.current === 0);
            playClick(nextNoteTimeRef.current, isAccent, false);

            // 2. Play Subdivision if enabled (Eighth Note)
            if (subdivisionRef.current === 2) {
                const secondsPerBeat = 60.0 / bpmRef.current;
                const subTime = nextNoteTimeRef.current + (secondsPerBeat / 2);
                playClick(subTime, false, true); // True = isSubdivision
            }

            nextNote();
        }
        timerIDRef.current = window.setTimeout(scheduler, lookahead);
    };

    const togglePlay = () => {
        if (isPlaying) {
            window.clearTimeout(timerIDRef.current);
            setIsPlaying(false);
        } else {
            if (audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume();
            }
            // Start slightly in the future
            nextNoteTimeRef.current = audioContextRef.current.currentTime + 0.05;
            currentBeatRef.current = 0; // Reset to 1 on start
            scheduler();
            setIsPlaying(true);
        }
    };

    // --- Tap Tempo Logic ---
    const handleTap = () => {
        const now = Date.now();
        const newTapTimes = [...tapTimes, now];

        // Reset if pause too long (> 2s)
        if (newTapTimes.length > 1) {
            const lastDiff = newTapTimes[newTapTimes.length - 1] - newTapTimes[newTapTimes.length - 2];
            if (lastDiff > 2000) {
                setTapTimes([now]);
                return;
            }
        }

        // Keep last 4 taps
        const recentTaps = newTapTimes.slice(-4);
        setTapTimes(recentTaps);

        if (recentTaps.length > 1) {
            const intervals = [];
            for (let i = 1; i < recentTaps.length; i++) {
                intervals.push(recentTaps[i] - recentTaps[i - 1]);
            }
            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const newBpm = Math.round(60000 / avgInterval);

            setBpm(Math.min(Math.max(newBpm, 40), 300));
        }
    };

    const adjustBpm = (amount) => {
        setBpm(prev => Math.min(Math.max(prev + amount, 40), 300));
    };

    // --- UI Render ---
    return (
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-gray-900 border-t border-gray-700 z-50 flex items-center px-4 shadow-[0_-4px_30px_rgba(0,0,0,0.6)] animate-slide-up select-none">
            <div className="w-full max-w-6xl mx-auto flex items-center justify-between gap-4 md:gap-8">

                {/* 1. Playback Controls (Left) */}
                <div className="flex items-center gap-4 flex-shrink-0">
                    <button
                        onClick={togglePlay}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-xl hover:scale-105 active:scale-95 ${isPlaying
                                ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-red-900/40 ring-2 ring-red-400/20'
                                : 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-green-900/40 ring-2 ring-green-400/20'
                            }`}
                        title={isPlaying ? "停止 (Space)" : "開始 (Space)"}
                    >
                        {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                    </button>

                    <button
                        onClick={handleTap}
                        className="flex flex-col items-center justify-center w-14 h-12 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-750 hover:border-gray-600 transition active:scale-95 active:bg-gray-700 group"
                    >
                        <MousePointerClick size={20} className="text-indigo-400 group-hover:text-indigo-300 mb-0.5" />
                        <span className="text-[10px] font-bold text-gray-500 group-hover:text-gray-300">TAP</span>
                    </button>
                </div>

                {/* 2. BPM Section (Compact) */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="flex items-center gap-2 bg-gray-950/50 px-2 py-1 rounded-lg border border-gray-800/50">
                        <button onClick={() => adjustBpm(-1)} className="p-1 text-gray-500 hover:text-white hover:bg-gray-800 rounded transition"><Minus size={14} /></button>
                        <input
                            type="number"
                            value={bpm}
                            onChange={(e) => setBpm(Math.min(300, Math.max(40, parseInt(e.target.value) || 40)))}
                            className="bg-transparent text-3xl font-mono font-bold text-center text-indigo-100 w-16 outline-none appearance-none m-0 p-0 leading-none focus:text-indigo-400 transition-colors"
                        />
                        <button onClick={() => adjustBpm(1)} className="p-1 text-gray-500 hover:text-white hover:bg-gray-800 rounded transition"><Plus size={14} /></button>
                    </div>
                    {/* Compact Slider */}
                    <input
                        type="range"
                        min="40"
                        max="240"
                        value={bpm}
                        onChange={(e) => setBpm(parseInt(e.target.value))}
                        className="w-32 h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all opacity-80 hover:opacity-100"
                    />
                </div>

                {/* 3. Rhythm Section (Center) */}
                <div className="flex items-center gap-3 md:gap-6 border-l border-r border-gray-800 px-4 md:px-8 flex-1 justify-center min-w-0">
                    {/* Time Signature */}
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">拍號</span>
                        <div className="flex bg-gray-800 rounded-md p-0.5">
                            {['4/4', '3/4', '6/8'].map(sig => (
                                <button
                                    key={sig}
                                    onClick={() => setTimeSignature(sig)}
                                    className={`px-2 py-1 text-xs font-bold rounded flex items-center justify-center transition-all ${timeSignature === sig
                                            ? 'bg-gray-600 text-white shadow-sm'
                                            : 'text-gray-500 hover:text-gray-300'
                                        }`}
                                >
                                    {sig}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Subdivision */}
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">細分</span>
                        <div className="flex bg-gray-800 rounded-md p-0.5">
                            <button
                                onClick={() => setSubdivision(1)}
                                className={`w-8 py-1 rounded flex items-center justify-center transition-all ${subdivision === 1 ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'
                                    }`}
                                title="四分音符 (Quarter)"
                            >
                                <span className="text-lg leading-none">♩</span>
                            </button>
                            <button
                                onClick={() => setSubdivision(2)}
                                className={`w-8 py-1 rounded flex items-center justify-center transition-all ${subdivision === 2 ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'
                                    }`}
                                title="八分音符 (Eighth)"
                            >
                                <span className="text-lg leading-none">♫</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* 4. Volume Section (Right) */}
                <div className="flex items-center gap-3 flex-shrink-0 pl-2">
                    <div className="flex items-center gap-2 group">
                        <Volume2 size={18} className="text-gray-500 group-hover:text-indigo-400 transition-colors" />
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="w-20 md:w-24 h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-gray-500 group-hover:accent-indigo-400 transition-all"
                        />
                    </div>

                    <div className="h-8 w-px bg-gray-800 mx-2"></div>

                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 border border-transparent rounded-full transition-all"
                        title="關閉"
                    >
                        <X size={20} />
                    </button>
                </div>

            </div>
        </div>
    );
};

export default PersistentMetronome;
