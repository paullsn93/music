import React, { useState } from 'react';
import { X, Calculator, Watch, Music } from 'lucide-react';
import CapoCalculator from './tools/CapoCalculator';
import Metronome from './tools/Metronome';
import ChordLibrary from './tools/ChordLibrary';

const ToolsModal = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('capo'); // 'capo', 'metronome', 'chords'

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl max-w-md w-full p-4 border border-gray-700 shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">工具箱</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-4 bg-gray-900/50 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('capo')}
                        className={`flex-1 py-2 rounded-md flex items-center justify-center gap-2 text-sm transition ${activeTab === 'capo' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        <Calculator size={16} /> Capo
                    </button>
                    <button
                        onClick={() => setActiveTab('metronome')}
                        className={`flex-1 py-2 rounded-md flex items-center justify-center gap-2 text-sm transition ${activeTab === 'metronome' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        <Watch size={16} /> 節拍器
                    </button>
                    <button
                        onClick={() => setActiveTab('chords')}
                        className={`flex-1 py-2 rounded-md flex items-center justify-center gap-2 text-sm transition ${activeTab === 'chords' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        <Music size={16} /> 和弦
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {activeTab === 'capo' && <CapoCalculator />}
                    {activeTab === 'metronome' && <Metronome />}
                    {activeTab === 'chords' && <ChordLibrary />}
                </div>
            </div>
        </div>
    );
};

export default ToolsModal;
