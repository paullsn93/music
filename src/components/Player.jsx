import React, { useState, useEffect, useRef } from 'react';
import { Pause, Play, Video, ExternalLink, BookOpen, Scroll, Guitar, Plus } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

const Player = ({ currentSong, setCurrentSong, userRole, openAddModal }) => {
    // UI States
    const [viewMode, setViewMode] = useState('paged'); // 'paged' or 'scroll'
    const [pageIndex, setPageIndex] = useState(0); // For Paged Mode

    // Auto Scroll State
    const [isScrolling, setIsScrolling] = useState(false);
    const [scrollSpeed, setScrollSpeed] = useState(1);
    const scrollContainerRef = useRef(null);
    const saveSpeedTimeoutRef = useRef(null);

    // YouTube Player State
    const [ytPlayer, setYtPlayer] = useState(null);
    const [ytIsPlaying, setYtIsPlaying] = useState(false);
    const playerContainerRef = useRef(null);

    // YouTube API Initialization
    useEffect(() => {
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }
    }, []);

    const getYouTubeEmbedId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    // Current Song Effects
    useEffect(() => {
        if (currentSong) {
            const saved = currentSong.savedSpeed !== undefined ? currentSong.savedSpeed : 1;
            setScrollSpeed(saved);
            setIsScrolling(false);
            setPageIndex(0); // Reset page to start

            // Handle YouTube Video Load
            const videoId = getYouTubeEmbedId(currentSong.sourceUrl);
            if (videoId) {
                if (ytPlayer && ytPlayer.loadVideoById) {
                    ytPlayer.loadVideoById(videoId);
                    ytPlayer.pauseVideo();
                } else if (window.YT && window.YT.Player && !ytPlayer) {
                    // Initialize Player if not ready
                    if (playerContainerRef.current) {
                        // eslint-disable-next-line no-new
                        new window.YT.Player(playerContainerRef.current, {
                            height: '1',
                            width: '1',
                            videoId: videoId,
                            playerVars: {
                                'playsinline': 1,
                                'controls': 0
                            },
                            events: {
                                'onReady': (event) => setYtPlayer(event.target),
                                'onStateChange': (event) => {
                                    setYtIsPlaying(event.data === window.YT.PlayerState.PLAYING);
                                }
                            }
                        });
                    }
                }
            } else {
                if (ytPlayer && ytPlayer.stopVideo) {
                    ytPlayer.stopVideo();
                    setYtIsPlaying(false);
                }
            }
        }
    }, [currentSong]);

    window.onYouTubeIframeAPIReady = () => { };

    const toggleYtPlay = () => {
        if (!ytPlayer) return;
        if (ytIsPlaying) {
            ytPlayer.pauseVideo();
        } else {
            ytPlayer.playVideo();
        }
    };

    // Auto Scroll Logic
    useEffect(() => {
        if (viewMode !== 'scroll') return;

        let animationFrameId;
        const scroll = () => {
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop += (scrollSpeed * 0.3);
            }
            animationFrameId = requestAnimationFrame(scroll);
        };
        if (isScrolling && currentSong) {
            animationFrameId = requestAnimationFrame(scroll);
        }
        return () => cancelAnimationFrame(animationFrameId);
    }, [isScrolling, scrollSpeed, currentSong, viewMode]);

    // Spacebar Navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (currentSong && viewMode === 'paged' && e.code === 'Space') {
                e.preventDefault();
                nextPage();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentSong, viewMode, pageIndex]);

    const handleSpeedChange = (newSpeed) => {
        setScrollSpeed(newSpeed);
        if (currentSong) {
            if (saveSpeedTimeoutRef.current) {
                clearTimeout(saveSpeedTimeoutRef.current);
            }
            saveSpeedTimeoutRef.current = setTimeout(async () => {
                try {
                    const docRef = doc(db, 'songs', currentSong.id);
                    await updateDoc(docRef, { savedSpeed: newSpeed });
                } catch (err) {
                    console.error("Failed to save speed", err);
                }
            }, 1000);
        }
    };

    // Pagination Logic
    const getCurrentPageImages = () => {
        if (!currentSong) return [];
        const urls = currentSong.tabUrls && currentSong.tabUrls.length > 0 ? currentSong.tabUrls : (currentSong.tabUrl ? [currentSong.tabUrl] : []);

        if (urls.length <= 1) return urls;

        // Multi-page mode: return 2 images at a time
        const start = pageIndex;
        const end = start + 2;
        return urls.slice(start, end);
    };

    const nextPage = () => {
        if (!currentSong) return;
        const urls = currentSong.tabUrls && currentSong.tabUrls.length > 0 ? currentSong.tabUrls : [];
        if (pageIndex + 2 < urls.length) {
            setPageIndex(pageIndex + 2);
        } else {
            setPageIndex(0);
        }
    };

    if (!currentSong) {
        return (
            <div className={`flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center h-full bg-gray-950`}>
                <div className="bg-gray-900 p-6 rounded-full mb-4 shadow-inner">
                    <Guitar size={64} className="text-gray-700" />
                </div>
                <h2 className="text-2xl font-bold text-gray-300 mb-2">準備好彈唱了嗎？</h2>
                <p className="max-w-md mx-auto mb-8">從左側選擇一首歌曲，或是使用管理員模式新增您的第一份吉他譜。</p>
                {userRole === 'admin' && (
                    <button
                        onClick={openAddModal}
                        className="bg-gray-800 hover:bg-gray-700 text-indigo-400 px-6 py-2 rounded-full font-medium transition flex items-center gap-2 border border-gray-700"
                    >
                        <Plus size={18} /> 新增樂譜
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className={`flex-1 flex flex-col h-full relative bg-gray-950`}>
            {/* Header */}
            <div className="h-16 border-b border-gray-800 bg-gray-900/95 backdrop-blur flex items-center justify-between px-4 md:px-6 z-20 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => setCurrentSong(null)} className="md:hidden text-gray-400 hover:text-white">
                        ← 返回
                    </button>

                    <div className="flex flex-col">
                        <h2 className="text-lg font-bold text-white truncate max-w-[150px] md:max-w-xs">{currentSong.title}</h2>
                        <p className="text-xs text-indigo-400">{currentSong.artist}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Play Controls */}
                    {currentSong.sourceUrl && getYouTubeEmbedId(currentSong.sourceUrl) && (
                        <button
                            onClick={toggleYtPlay}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold transition border ${ytIsPlaying ? 'bg-red-600/20 text-red-400 border-red-600/30' : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'}`}
                        >
                            {ytIsPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                            <span className="hidden sm:inline">{ytIsPlaying ? '暫停' : '播放'}</span>
                        </button>
                    )}

                    {currentSong.sourceUrl && (
                        <a
                            href={currentSong.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition hover:underline"
                        >
                            <Video size={16} />
                            <span className="hidden sm:inline">影片: {currentSong.title}</span>
                            <span className="sm:hidden">影片</span>
                            <ExternalLink size={12} />
                        </a>
                    )}
                </div>
            </div>

            {/* Main Content (Tab Display) */}
            <div
                ref={scrollContainerRef}
                className={`flex-1 overflow-y-auto relative bg-gray-950 ${viewMode === 'paged' ? 'no-scrollbar' : 'scroll-smooth'}`}
                style={{ paddingBottom: '0px' }}
            >
                {/* Hidden YouTube Player */}
                <div className="absolute top-0 left-0 w-0 h-0 overflow-hidden opacity-0 pointer-events-none">
                    <div ref={playerContainerRef}></div>
                </div>

                <div className={`w-full h-full flex items-center justify-center ${viewMode === 'scroll' ? 'block pt-4 px-2 pb-32 max-w-4xl mx-auto space-y-4' : 'p-0'}`}>

                    {/* SCROLL MODE: Stacked */}
                    {viewMode === 'scroll' && (
                        <>
                            {currentSong.tabUrls && currentSong.tabUrls.length > 0 ? (
                                currentSong.tabUrls.map((url, index) => (
                                    <img key={index} src={url} alt={`Tab ${index}`} className="w-full h-auto rounded-lg bg-white" />
                                ))
                            ) : currentSong.tabUrl ? (
                                <img src={currentSong.tabUrl} alt="Tab" className="w-full h-auto rounded-lg bg-white" />
                            ) : (
                                <div className="text-gray-500">無圖片</div>
                            )}
                        </>
                    )}

                    {/* PAGED MODE: Side-by-Side */}
                    {viewMode === 'paged' && (
                        <div className="w-full h-full flex items-center justify-center bg-gray-950">
                            {(() => {
                                const visibleImages = getCurrentPageImages();
                                if (visibleImages.length === 0) return <div className="text-gray-500">無圖片</div>;

                                // Single Image Layout (Centered)
                                if (visibleImages.length === 1) {
                                    return (
                                        <div className="w-full h-full flex items-center justify-center p-2">
                                            <img src={visibleImages[0]} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl bg-white" alt="tab page" />
                                        </div>
                                    );
                                }

                                // Two Images Layout (Split)
                                return (
                                    <div className="w-full h-full flex flex-row">
                                        <div className="w-1/2 h-full flex items-center justify-center p-1 border-r border-gray-800">
                                            <img src={visibleImages[0]} className="max-w-full max-h-full object-contain rounded-lg bg-white" alt="tab left" />
                                        </div>
                                        <div className="w-1/2 h-full flex items-center justify-center p-1">
                                            <img src={visibleImages[1]} className="max-w-full max-h-full object-contain rounded-lg bg-white" alt="tab right" />
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Page Indicator Overlay */}
                            {(currentSong.tabUrls?.length > 2) && (
                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800/80 px-3 py-1 rounded-full text-xs text-white">
                                    頁數: {pageIndex + 1}-{Math.min(pageIndex + 2, currentSong.tabUrls.length)} / {currentSong.tabUrls.length}
                                    <span className="ml-2 text-gray-400">(按空白鍵翻頁)</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Control Bar (Right Bottom) */}
            <div className="absolute bottom-6 right-6 z-30 flex flex-col items-end gap-3 animate-fade-in">

                {/* View Mode Toggle */}
                <button
                    onClick={() => setViewMode(viewMode === 'paged' ? 'scroll' : 'paged')}
                    className="bg-gray-800/90 backdrop-blur border border-gray-700 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition flex items-center gap-2"
                    title={viewMode === 'paged' ? "切換至自動滾動模式" : "切換至分頁閱讀模式"}
                >
                    {viewMode === 'paged' ? <BookOpen size={20} /> : <Scroll size={20} />}
                    <span className="text-xs font-bold">{viewMode === 'paged' ? '分頁' : '捲動'}</span>
                </button>

                {/* Scroll Controls (Only in Scroll Mode) */}
                {viewMode === 'scroll' && (
                    <div className="bg-gray-800/90 backdrop-blur border border-gray-700 p-2 rounded-xl shadow-2xl flex flex-col items-center gap-2 w-auto">
                        <div className="text-[10px] text-gray-400 font-medium">
                            <span className="text-indigo-400">{scrollSpeed.toFixed(1)}x</span>
                        </div>

                        <input
                            type="range"
                            min="0.5"
                            max="5.0"
                            step="0.1"
                            value={scrollSpeed}
                            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                            className="h-24 w-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            style={{ writingMode: 'bt-lr', WebkitAppearance: 'slider-vertical' }}
                        />

                        <button
                            onClick={() => setIsScrolling(!isScrolling)}
                            className={`p-2 rounded-full flex items-center justify-center transition-all ${isScrolling ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/30'}`}
                            title={isScrolling ? "暫停滾動" : "開始滾動"}
                        >
                            {isScrolling ? <Pause fill="currentColor" size={16} /> : <Play fill="currentColor" size={16} className="ml-0.5" />}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Player;
