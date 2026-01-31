import React from 'react';
import { Guitar, Plus, LogOut, Menu, X, Search, Trash2, Pencil, Youtube } from 'lucide-react';

const Sidebar = ({
    songs,
    currentSong,
    setCurrentSong,
    searchTerm,
    setSearchTerm,
    userRole,
    setUserRole,
    isSidebarOpen,
    setIsSidebarOpen,
    openAddModal,
    openEditModal,
    handleDeleteSong,
    loading,
    filteredSongs,
    onOpenTools
}) => {
    return (
        <div
            className={`${isSidebarOpen ? 'w-full md:w-96' : 'w-14'} flex-col border-r border-gray-800 bg-gray-900 z-10 flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden relative ${currentSong && !isSidebarOpen ? 'hidden md:flex' : 'flex'}`}
        >
            {/* Collapsed View (Slim Bar) */}
            {!isSidebarOpen && (
                <div className="h-full flex flex-col items-center pt-4 gap-4">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 bg-gray-800 text-indigo-400 rounded-lg hover:bg-gray-700 transition"
                        title="展開譜庫"
                    >
                        <Menu size={20} />
                    </button>
                    <div className="text-xs text-gray-500 font-bold" style={{ writingMode: 'vertical-rl' }}>
                        譜庫列表
                    </div>
                </div>
            )}

            {/* Expanded View */}
            <div className={`flex flex-col h-full ${!isSidebarOpen ? 'hidden' : ''}`}>
                <div className="p-4 border-b border-gray-800 bg-gray-900">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <Guitar className="text-indigo-500" />
                            譜庫
                            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full font-normal">
                                {songs.length}
                            </span>
                        </h1>
                        <div className="flex gap-2">
                            {userRole === 'admin' && (
                                <button onClick={openAddModal} className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-lg">
                                    <Plus size={18} />
                                </button>
                            )}
                            <button onClick={onOpenTools} className="p-2 text-indigo-400 hover:text-indigo-300" title="工具箱">
                                <span className="font-bold text-lg">🛠️</span>
                            </button>
                            <button onClick={() => setUserRole(null)} className="p-2 text-gray-500 hover:text-gray-300" title="登出">
                                <LogOut size={18} />
                            </button>
                            {/* 收摺按鈕 (in header) */}
                            <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-gray-500 hover:text-gray-300 md:hidden">
                                <X size={18} />
                            </button>
                            <button onClick={() => setIsSidebarOpen(false)} className="hidden md:block p-2 text-gray-500 hover:text-gray-300" title="收摺列表">
                                <Menu size={18} />
                            </button>
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="搜尋歌名、歌手或字數(如:4)..."
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {loading ? (
                        <div className="text-center text-gray-500 mt-10">載入中...</div>
                    ) : filteredSongs.length === 0 ? (
                        <div className="text-center text-gray-500 mt-10">
                            <p>沒有找到歌曲</p>
                            {userRole === 'admin' && <p className="text-xs mt-2">點擊上方 + 新增</p>}
                        </div>
                    ) : (
                        filteredSongs.map(song => (
                            <div
                                key={song.id}
                                onClick={() => {
                                    setCurrentSong(song);
                                }}
                                className={`group p-3 rounded-xl cursor-pointer border border-transparent transition-all duration-200 ${currentSong?.id === song.id ? 'bg-indigo-900/30 border-indigo-500/50' : 'hover:bg-gray-800 border-gray-800'}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className={`font-semibold ${currentSong?.id === song.id ? 'text-indigo-400' : 'text-gray-200'}`}>{song.title}</h3>
                                        <p className="text-sm text-gray-500 mt-0.5">{song.artist}</p>
                                    </div>
                                    {userRole === 'admin' && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                            <button onClick={(e) => openEditModal(e, song)} className="p-1.5 text-gray-500 hover:text-indigo-400 transition"><Pencil size={16} /></button>
                                            <button onClick={(e) => handleDeleteSong(e, song.id)} className="p-1.5 text-gray-500 hover:text-red-400 transition"><Trash2 size={16} /></button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="text-xs text-gray-600 bg-gray-800/50 px-1.5 py-0.5 rounded">字數: {song.titleLength || song.title.length}</span>
                                    {song.sourceUrl && <Youtube size={12} className="text-gray-600" />}
                                    {song.savedSpeed && (<span className="text-[10px] text-indigo-500/70 border border-indigo-900/50 px-1 rounded">{song.savedSpeed}x</span>)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
