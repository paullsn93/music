import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';

const Metronome = () => {
    const [bpm, setBpm] = useState(120);
    const [isPlaying, setIsPlaying] = useState(false);

    // Web Audio API refs
    const audioContextRef = useRef(null);
    const nextNoteTimeRef = useRef(0);
    const timerIDRef = useRef(null);
    const lookahead = 25.0; // ms
    const scheduleAheadTime = 0.1; // s

    const nextNote = () => {
        const secondsPerBeat = 60.0 / bpm;
        nextNoteTimeRef.current += secondsPerBeat;
    };

    const playClick = (time) => {
        const osc = audioContextRef.current.createOscillator();
        const gainNode = audioContextRef.current.createGain(); // Use gain node for overlay click

        osc.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);

        osc.frequency.value = 1000;
        gainNode.gain.value = 1;

        osc.start(time);
        osc.stop(time + 0.1);

        // Decay
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    };

    const scheduler = () => {
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
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            // Resume if suspended (browser policy)
            if (audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume();
            }

            nextNoteTimeRef.current = audioContextRef.current.currentTime + 0.05;
            scheduler();
            setIsPlaying(true);
        }
    };

    // Cleanup
    useEffect(() => {
        return () => {
            window.clearTimeout(timerIDRef.current);
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    // Adjust BPM live
    // No need for effect here, `bpm` state is read in `nextNote` closure? 
    // Ah, `nextNote` captures `bpm`. We need `bpm` ref to be safe or use functional state if we were using intervals.
    // Actually, `nextNote` is re-created? No.
    // We need a ref for BPM to be accessed inside the scheduler loop which is async.
    const bpmRef = useRef(bpm);
    useEffect(() => {
        bpmRef.current = bpm;
    }, [bpm]);

    // Redefine nextNote to use ref
    const nextNoteSafe = () => {
        const secondsPerBeat = 60.0 / bpmRef.current;
        nextNoteTimeRef.current += secondsPerBeat;
    };

    // Redefine scheduler to use safe nextNote
    // Wait, I need to update the scheduler function in the timer...
    // simpler: Use a ref for the scheduler function? No.
    // The `scheduler` calls `nextNote`. If I change `nextNote` to `nextNoteSafe` inside `scheduler`, it works.

    // Let's refactor slightly for safety.
    const schedulerSafe = () => {
        // Access ref inside
        while (nextNoteTimeRef.current < audioContextRef.current.currentTime + scheduleAheadTime) {
            playClick(nextNoteTimeRef.current);
            nextNoteSafe();
        }
        timerIDRef.current = window.setTimeout(schedulerSafe, lookahead);
    };

    const togglePlaySafe = () => {
        if (isPlaying) {
            window.clearTimeout(timerIDRef.current);
            setIsPlaying(false);
        } else {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume();
            }
            nextNoteTimeRef.current = audioContextRef.current.currentTime + 0.05;
            schedulerSafe();
            setIsPlaying(true);
        }
    };

    return (
        <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
            <h3 className="text-lg font-bold text-white mb-3">節拍器 (Metronome)</h3>
            <div className="flex items-center justify-between mb-4">
                <div className="text-3xl font-mono text-indigo-400 w-20 text-center">{bpm}</div>
                <button
                    onClick={togglePlaySafe}
                    className={`p-3 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
                >
                    {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                </button>
            </div>
            <input
                type="range"
                min="40"
                max="200"
                value={bpm}
                onChange={e => setBpm(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
        </div>
    );
};

export default Metronome;
