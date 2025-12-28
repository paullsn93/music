<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>吉他譜彈唱機 Pro</title>
    
    <!-- React & ReactDOM -->
    <script crossorigin src="https://unpkg.com/react@18.2.0/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js"></script>
    
    <!-- Babel for JSX -->
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Firebase SDKs (Compat versions) -->
    <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
    
    <style>
        /* Custom scrollbar for dark theme */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-track {
            background: #1f2937; 
        }
        ::-webkit-scrollbar-thumb {
            background: #4b5563; 
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #6b7280; 
        }
        .animate-fade-in {
            animation: fadeIn 0.3s ease-in-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body class="bg-gray-900 text-gray-100 font-sans antialiased h-screen overflow-hidden">
    <div id="root"></div>

    <script type="text/babel">
        const { useState, useEffect, useRef, useMemo } = React;
        
        // --- 內嵌圖示元件 (解決 CDN 相容性問題) ---
        // 這些圖示原本來自 lucide-react，現在直接寫成 React SVG 元件以確保 100% 穩定
        const IconBase = ({ children, size = 24, className = "", ...props }) => (
            <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width={size} 
                height={size} 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className={className} 
                {...props}
            >
                {children}
            </svg>
        );

        const Icons = {
            Music: (props) => <IconBase {...props}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></IconBase>,
            Search: (props) => <IconBase {...props}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></IconBase>,
            Plus: (props) => <IconBase {...props}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></IconBase>,
            Trash2: (props) => <IconBase {...props}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></IconBase>,
            Settings: (props) => <IconBase {...props}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></IconBase>,
            Play: (props) => <IconBase {...props}><polygon points="5 3 19 12 5 21 5 3"/></IconBase>,
            Pause: (props) => <IconBase {...props}><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></IconBase>,
            ExternalLink: (props) => <IconBase {...props}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></IconBase>,
            Lock: (props) => <IconBase {...props}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></IconBase>,
            LogOut: (props) => <IconBase {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></IconBase>,
            Guitar: (props) => <IconBase {...props}><path d="M6 21c3.866 0 7-3.134 7-7 0-3.866-3.134-7-7-7-3.866 0-7 3.134-7 7 0 3.866 3.134 7 7 7Z"/><path d="m11 11 10-10"/><path d="m17 7 4 4"/></IconBase>,
            Youtube: (props) => <IconBase {...props}><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></IconBase>,
            X: (props) => <IconBase {...props}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></IconBase>
        };

        const { 
            Music, Search, Plus, Trash2, Settings, Play, Pause, ExternalLink, Lock, LogOut, Guitar, Youtube, X 
        } = Icons;


        // =========================================================================
        // ★★★ 請在此處填入您的 FIREBASE 設定 ★★★
        // 您可以從 Firebase Console -> Project Settings -> General -> CDN 複製這些內容
        // =========================================================================
        
        // 部署到 GitHub 時，請務必將下方的字串替換為您真實的 Firebase 設定
        const yourFirebaseConfig = {
            apiKey: "您的API_KEY",
            authDomain: "您的專案ID.firebaseapp.com",
            projectId: "您的專案ID",
            storageBucket: "您的專案ID.appspot.com",
            messagingSenderId: "您的SENDER_ID",
            appId: "您的APP_ID"
        };

        const firebaseConfig = (typeof __firebase_config !== 'undefined') 
            ? JSON.parse(__firebase_config) 
            : yourFirebaseConfig;

        // 初始化 Firebase
        let app, auth, db;
        try {
            if (typeof firebase !== 'undefined') {
                if (!firebase.apps.length) {
                    app = firebase.initializeApp(firebaseConfig);
                } else {
                    app = firebase.app();
                }
                auth = firebase.auth();
                db = firebase.firestore();
                console.log("Firebase initialized successfully");
            } else {
                console.error("Firebase SDK not loaded properly.");
            }
        } catch (error) {
            console.error("Firebase init error:", error);
            // 避免 alert 阻擋，僅在 console 顯示
        }

        const isPreviewEnv = typeof __app_id !== 'undefined';
        const APP_ID = isPreviewEnv ? __app_id : 'guitar-tab-app';
        
        // 取得資料庫路徑的輔助函式
        const getSongsCollection = () => {
            if (isPreviewEnv) {
                // 預覽環境使用沙盒路徑
                return db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('songs');
            } else {
                // 部署後使用正式路徑
                return db.collection('songs');
            }
        };

        // --- Components ---

        // 1. Login/Security Screen
        const LoginScreen = ({ onLogin }) => {
            const [password, setPassword] = useState('');
            const [error, setError] = useState('');

            const handleLogin = (e) => {
                e.preventDefault();
                // 預設密碼
                if (password === '1234') {
                    onLogin('user');
                } else if (password === 'admin') {
                    onLogin('admin');
                } else {
                    setError('密碼錯誤，請重試');
                }
            };

            return (
                <div className="flex flex-col items-center justify-center h-screen bg-gray-900 p-4">
                    <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700">
                        <div className="flex justify-center mb-6">
                            <div className="bg-indigo-600 p-4 rounded-full">
                                <Guitar size={48} className="text-white" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-center mb-2 text-white">吉他譜彈唱機 Pro</h1>
                        <p className="text-gray-400 text-center mb-6 text-sm">私人收藏庫 • 自動滾動 • YouTube Music</p>
                        
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">存取密碼</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
                                    <input 
                                        type="password" 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white transition"
                                        placeholder="請輸入密碼..."
                                        autoFocus
                                    />
                                </div>
                            </div>
                            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                            <button 
                                type="submit" 
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                            >
                                進入系統
                            </button>
                            <p className="text-xs text-gray-500 text-center mt-4">
                                訪客密碼: 1234 <br/> 管理員密碼: admin
                            </p>
                        </form>
                    </div>
                </div>
            );
        };

        // 2. Add Song Modal
        const AddSongModal = ({ isOpen, onClose, onAdd }) => {
            const [formData, setFormData] = useState({
                title: '',
                artist: '',
                sourceUrl: '',
                tabUrl: '',
            });

            if (!isOpen) return null;

            const handleSubmit = (e) => {
                e.preventDefault();
                const titleLength = formData.title.length;
                onAdd({ ...formData, titleLength, createdAt: new Date().toISOString() });
                setFormData({ title: '', artist: '', sourceUrl: '', tabUrl: '' });
                onClose();
            };

            return (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-xl max-w-lg w-full p-6 border border-gray-700 animate-fade-in shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Plus size={20} className="text-indigo-400" /> 新增吉他譜
                            </h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">歌名</label>
                                    <input required type="text" className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:border-indigo-500 outline-none" 
                                        value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">演唱者</label>
                                    <input required type="text" className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:border-indigo-500 outline-none" 
                                        value={formData.artist} onChange={e => setFormData({...formData, artist: e.target.value})} />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">音樂來源 (YouTube Music 連結)</label>
                                <div className="relative">
                                    <Youtube className="absolute left-3 top-2.5 text-red-500" size={18} />
                                    <input type="url" placeholder="https://music.youtube.com/..." className="w-full pl-10 bg-gray-700 border border-gray-600 rounded p-2 text-white focus:border-indigo-500 outline-none" 
                                        value={formData.sourceUrl} onChange={e => setFormData({...formData, sourceUrl: e.target.value})} />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">建議使用 YouTube Music 連結</p>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">吉他譜圖片網址 (URL)</label>
                                <input required type="url" placeholder="https://example.com/tab.jpg" className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:border-indigo-500 outline-none" 
                                    value={formData.tabUrl} onChange={e => setFormData({...formData, tabUrl: e.target.value})} />
                                <p className="text-xs text-gray-500 mt-1">請貼上圖片的直接連結 (可使用 Imgur 等圖床)</p>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={onClose} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition">取消</button>
                                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition font-medium">新增入庫</button>
                            </div>
                        </form>
                    </div>
                </div>
            );
        };

        // 3. Main Application Component
        const App = () => {
            const [userRole, setUserRole] = useState(null); // 'user', 'admin', or null
            const [songs, setSongs] = useState([]);
            const [currentSong, setCurrentSong] = useState(null);
            const [loading, setLoading] = useState(true);
            const [searchTerm, setSearchTerm] = useState('');
            const [isModalOpen, setIsModalOpen] = useState(false);
            
            // Auto Scroll State
            const [isScrolling, setIsScrolling] = useState(false);
            const [scrollSpeed, setScrollSpeed] = useState(1); // 1-10
            const scrollContainerRef = useRef(null);

            // Initialize Auth & Data
            useEffect(() => {
                if (!auth || !db) {
                    setLoading(false);
                    return;
                }

                const initAuth = async () => {
                    try {
                        // 在預覽環境使用 Custom Token，在正式環境使用匿名登入
                        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                            await auth.signInWithCustomToken(__initial_auth_token);
                        } else {
                            // 部署到 GitHub Pages 時會執行這行
                            await auth.signInAnonymously();
                        }
                    } catch (error) {
                        console.error("Auth Error:", error);
                        // 如果登入失敗，通常是因為 Firebase 設定有誤或功能未啟用
                    }
                };
                initAuth();

                const unsubscribeAuth = auth.onAuthStateChanged((user) => {
                    if (user) {
                        // 監聽資料庫
                        const collectionRef = getSongsCollection();
                        
                        const unsubscribeSongs = collectionRef.onSnapshot((snapshot) => {
                            const songsData = snapshot.docs.map(doc => ({
                                id: doc.id,
                                ...doc.data()
                            }));
                            setSongs(songsData);
                            setLoading(false);
                        }, (error) => {
                            console.error("Error fetching songs:", error);
                            if (error.code === 'permission-denied') {
                                // 忽略這個 alert 避免干擾，改為 console 輸出
                                console.warn("權限不足：請檢查 Firebase Firestore Rules。");
                            }
                            setLoading(false);
                        });
                        return () => unsubscribeSongs();
                    }
                });

                return () => unsubscribeAuth();
            }, []);

            // Auto Scroll Logic
            useEffect(() => {
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
            }, [isScrolling, scrollSpeed, currentSong]);


            const handleAddSong = async (newSong) => {
                if (userRole !== 'admin') return;
                try {
                    const collectionRef = getSongsCollection();
                    await collectionRef.add(newSong);
                } catch (err) {
                    alert("新增失敗: " + err.message);
                    console.error(err);
                }
            };

            const handleDeleteSong = async (e, songId) => {
                e.stopPropagation();
                if (userRole !== 'admin') return;
                if (!confirm("確定要刪除這首歌嗎？")) return;
                
                try {
                    const collectionRef = getSongsCollection();
                    await collectionRef.doc(songId).delete();
                    if (currentSong?.id === songId) setCurrentSong(null);
                } catch (err) {
                    alert("刪除失敗");
                    console.error(err);
                }
            };

            const getYouTubeEmbedId = (url) => {
                if(!url) return null;
                const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                const match = url.match(regExp);
                return (match && match[2].length === 11) ? match[2] : null;
            };

            const filteredSongs = songs.filter(song => 
                song.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                song.artist.toLowerCase().includes(searchTerm.toLowerCase())
            );

            // Render Logic
            if (!userRole) {
                return <LoginScreen onLogin={setUserRole} />;
            }

            return (
                <div className="flex h-screen bg-gray-900 overflow-hidden">
                    {/* Sidebar / Song List */}
                    <div className={`${currentSong ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 border-r border-gray-800 bg-gray-900 z-10 flex-shrink-0 transition-all duration-300`}>
                        {/* Header */}
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
                                        <button onClick={() => setIsModalOpen(true)} className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-lg">
                                            <Plus size={18} />
                                        </button>
                                    )}
                                    <button onClick={() => setUserRole(null)} className="p-2 text-gray-500 hover:text-gray-300">
                                        <LogOut size={18} />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="搜尋歌名或歌手..." 
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* List */}
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
                                            setIsScrolling(false); // Reset scroll on change
                                        }}
                                        className={`group p-3 rounded-xl cursor-pointer border border-transparent transition-all duration-200 ${currentSong?.id === song.id ? 'bg-indigo-900/30 border-indigo-500/50' : 'hover:bg-gray-800 border-gray-800'}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className={`font-semibold ${currentSong?.id === song.id ? 'text-indigo-400' : 'text-gray-200'}`}>{song.title}</h3>
                                                <p className="text-sm text-gray-500 mt-0.5">{song.artist}</p>
                                            </div>
                                            {userRole === 'admin' && (
                                                <button 
                                                    onClick={(e) => handleDeleteSong(e, song.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 transition"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="text-xs text-gray-600 bg-gray-800/50 px-1.5 py-0.5 rounded">字數: {song.titleLength || song.title.length}</span>
                                            {song.sourceUrl && <Youtube size={12} className="text-gray-600" />}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Main Content / Player Area */}
                    <div className={`flex-1 flex flex-col h-full relative bg-gray-950 ${!currentSong ? 'hidden md:flex' : 'flex'}`}>
                        {currentSong ? (
                            <>
                                {/* Player Header */}
                                <div className="h-16 border-b border-gray-800 bg-gray-900/95 backdrop-blur flex items-center justify-between px-4 md:px-6 z-20 flex-shrink-0">
                                    <button onClick={() => setCurrentSong(null)} className="md:hidden text-gray-400 hover:text-white mr-2">
                                        ← 返回
                                    </button>
                                    
                                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 overflow-hidden">
                                        <h2 className="text-lg font-bold text-white truncate max-w-[200px] md:max-w-md">{currentSong.title}</h2>
                                        <span className="hidden md:inline text-gray-600">|</span>
                                        <p className="text-sm text-indigo-400">{currentSong.artist}</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Link to YouTube Music */}
                                        {currentSong.sourceUrl && (
                                            <a 
                                                href={currentSong.sourceUrl} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="hidden md:flex items-center gap-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 px-3 py-1.5 rounded-full text-sm font-medium transition"
                                            >
                                                <Music size={16} /> 
                                                <span>YouTube Music</span>
                                                <ExternalLink size={14} />
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Content Area (Scrollable) */}
                                <div 
                                    ref={scrollContainerRef}
                                    className="flex-1 overflow-y-auto relative bg-gray-950 scroll-smooth"
                                    style={{ paddingBottom: '120px' }} // Space for floating controls
                                >
                                    {/* Embed Player (Optional, pinned to top of content or side) */}
                                    {getYouTubeEmbedId(currentSong.sourceUrl) && (
                                        <div className="w-full max-w-3xl mx-auto mt-4 px-4 mb-6">
                                            <div className="aspect-video rounded-xl overflow-hidden shadow-2xl bg-black border border-gray-800">
                                                <iframe 
                                                    width="100%" 
                                                    height="100%" 
                                                    src={`https://www.youtube.com/embed/${getYouTubeEmbedId(currentSong.sourceUrl)}`}
                                                    title="YouTube video player" 
                                                    frameBorder="0" 
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                                    allowFullScreen
                                                ></iframe>
                                            </div>
                                        </div>
                                    )}

                                    {/* The Tab Image */}
                                    <div className="max-w-4xl mx-auto px-2 md:px-4">
                                        {currentSong.tabUrl ? (
                                            <img 
                                                src={currentSong.tabUrl} 
                                                alt="Guitar Tab" 
                                                className="w-full h-auto rounded-lg shadow-lg border border-gray-800 bg-white"
                                                onError={(e) => {
                                                    e.target.onerror = null; 
                                                    e.target.src = 'https://placehold.co/600x800/1f2937/white?text=Image+Load+Error';
                                                }}
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-20 text-gray-600 border-2 border-dashed border-gray-800 rounded-xl m-4">
                                                <Guitar size={48} className="mb-2 opacity-50" />
                                                <p>未設定吉他譜圖片</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Floating Action Bar (Auto Scroll Controls) */}
                                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800/90 backdrop-blur border border-gray-700 p-2 md:p-3 rounded-2xl shadow-2xl z-30 flex items-center gap-4 min-w-[300px] justify-between animate-fade-in">
                                    <button 
                                        onClick={() => setIsScrolling(!isScrolling)}
                                        className={`p-3 rounded-full flex items-center justify-center transition-all ${isScrolling ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/30'}`}
                                    >
                                        {isScrolling ? <Pause fill="currentColor" size={24} /> : <Play fill="currentColor" className="ml-1" size={24} />}
                                    </button>

                                    <div className="flex-1 flex flex-col gap-1">
                                        <div className="flex justify-between text-xs font-medium text-gray-400">
                                            <span>滾動速度</span>
                                            <span>{scrollSpeed}x</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="0.5" 
                                            max="5" 
                                            step="0.5" 
                                            value={scrollSpeed}
                                            onChange={(e) => setScrollSpeed(parseFloat(e.target.value))}
                                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                        />
                                    </div>

                                    {/* Mobile External Link (if space is tight in header) */}
                                    {currentSong.sourceUrl && (
                                        <a href={currentSong.sourceUrl} target="_blank" className="md:hidden p-2 text-gray-400 hover:text-white">
                                            <Music size={20} />
                                        </a>
                                    )}
                                </div>
                            </>
                        ) : (
                            // Empty State
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                                <div className="bg-gray-900 p-6 rounded-full mb-4 shadow-inner">
                                    <Guitar size={64} className="text-gray-700" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-300 mb-2">準備好彈唱了嗎？</h2>
                                <p className="max-w-md mx-auto mb-8">從左側選擇一首歌曲，或是使用管理員模式新增您的第一份吉他譜。</p>
                                {userRole === 'admin' && (
                                    <button 
                                        onClick={() => setIsModalOpen(true)}
                                        className="bg-gray-800 hover:bg-gray-700 text-indigo-400 px-6 py-2 rounded-full font-medium transition flex items-center gap-2 border border-gray-700"
                                    >
                                        <Plus size={18} /> 新增樂譜
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <AddSongModal 
                        isOpen={isModalOpen} 
                        onClose={() => setIsModalOpen(false)} 
                        onAdd={handleAddSong} 
                    />
                </div>
            );
        };

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
    </script>
</body>
</html>