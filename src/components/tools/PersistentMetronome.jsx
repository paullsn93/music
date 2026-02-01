import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, X, Music, MousePointerClick, Minus, Plus } from 'lucide-react';

const PersistentMetronome = ({ onClose }) => {
    const [bpm, setBpm] = useState(120);
    const [isPlaying, setIsPlaying] = useState(false);

    // Tap Tempo State
    const [tapTimes, setTapTimes] = useState([]);

    // Web Audio API refs
    const audioContextRef = useRef(null);
    const nextNoteTimeRef = useRef(0);
    const timerIDRef = useRef(null);
    const lookahead = 25.0; // ms
    const scheduleAheadTime = 0.1; // s

    // Initialize AudioContext
    useEffect(() => {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContext();

        return () => {
            if (timerIDRef.current) window.clearTimeout(timerIDRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, []);

    // BPM Ref for scheduler access
    const bpmRef = useRef(bpm);
    useEffect(() => {
        bpmRef.current = bpm;
    }, [bpm]);

    const nextNote = () => {
        const secondsPerBeat = 60.0 / bpmRef.current;
        nextNoteTimeRef.current += secondsPerBeat;
    };

    const playClick = (time) => {
        if (!audioContextRef.current) return;

        const osc = audioContextRef.current.createOscillator();
        const gainNode = audioContextRef.current.createGain();

        osc.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);

        osc.frequency.value = 1000;
        gainNode.gain.value = 1;

        osc.start(time);
        osc.stop(time + 0.1);

        // Crisp decay
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    };

    const scheduler = () => {
        // While there are notes that will need to play before the next interval, 
        // schedule them and advance the pointer.
        while (nextNoteTimeRef.current < audioContextRef.current.currentTime + scheduleAheadTime) {
            playClick(nextNoteTimeRef.current);
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
            nextNoteTimeRef.current = audioContextRef.current.currentTime + 0.05;
            scheduler();
            setIsPlaying(true);
        }
    };

    // Tap Tempo Logic
    const handleTap = () => {
        const now = Date.now();
        const newTapTimes = [...tapTimes, now]; // Keep all taps initially

        // Remove taps that are too old (> 2 seconds interval resets)
        if (newTapTimes.length > 1) {
            const lastDiff = newTapTimes[newTapTimes.length - 1] - newTapTimes[newTapTimes.length - 2];
            if (lastDiff > 2000) {
                setTapTimes([now]); // Start over
                return;
            }
        }

        // Keep last 4 taps for average
        const recentTaps = newTapTimes.slice(-4);
        setTapTimes(recentTaps);

        if (recentTaps.length > 1) {
            const intervals = [];
            for (let i = 1; i < recentTaps.length; i++) {
                intervals.push(recentTaps[i] - recentTaps[i - 1]);
            }
            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const newBpm = Math.round(60000 / avgInterval);

            // Constrain BPM
            const clampedBpm = Math.min(Math.max(newBpm, 40), 240);
            setBpm(clampedBpm);

            // If running, restart to sync? 
            // Usually good metronomes sync on tap, but for now let's just change BPM logic which is reactive
        }
    };

    const adjustBpm = (amount) => {
        setBpm(prev => Math.min(Math.max(prev + amount, 40), 240));
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-gray-900 border-t border-gray-800 z-50 flex items-center px-4 md:px-8 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] animate-slide-up">
            <div className="flex items-center w-full max-w-5xl mx-auto justify-between gap-4">

                {/* Left Controls: Play & BPM Display */}
                <div className="flex items-center gap-4 md:gap-6">
                    <button
                        onClick={togglePlay}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg ${isPlaying
                                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30'
                                : 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/30'
                            }`}
                        title={isPlaying ? "停止" : "開始"}
                    >
                        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => adjustBpm(-1)}
                            className="p-1 text-gray-400 hover:text-white transition"
                        >
                            <Minus size={16} />
                        </button>
                        <div className="flex flex-col items-center w-16">
                            <span className="text-2xl font-mono font-bold text-white leading-none">{bpm}</span>
                            <span className="text-[10px] text-gray-500 font-medium">BPM</span>
                        </div>
                        <button
                            onClick={() => adjustBpm(1)}
                            className="p-1 text-gray-400 hover:text-white transition"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                </div>

                {/* Center: Slider (Hidden on small mobile if needed, but flex-1 handles it) */}
                <div className="flex-1 max-w-md hidden sm:flex items-center px-4">
                    <input
                        type="range"
                        min="40"
                        max="240"
                        value={bpm}
                        onChange={(e) => setBpm(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
                    />
                </div>

                {/* Right: Tap Tempo & Close */}
                <div className="flex items-center gap-3 border-l border-gray-800 pl-4">
                    <button
                        onClick={handleTap}
                        className="group flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg hover:bg-gray-800 transition active:scale-95 active:bg-gray-700"
                        title="點擊設定速度 (Tap Tempo)"
                    >
                        <MousePointerClick size={20} className="text-indigo-400 group-hover:text-indigo-300" />
                        <span className="text-[10px] font-medium text-gray-400 group-hover:text-gray-300">TAP</span>
                    </button>

                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:text-white transition hover:bg-gray-800 rounded-full ml-2"
                        title="關閉節拍器"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PersistentMetronome;
