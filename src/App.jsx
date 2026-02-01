import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'; // Custom tokens?
import { collection, onSnapshot, query, orderBy, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import Player from './components/Player';
import SongModal from './components/SongModal';
import ToolsModal from './components/ToolsModal'; // New

import PersistentMetronome from './components/tools/PersistentMetronome';

const App = () => {
    const [userRole, setUserRole] = useState(null); // 'user', 'admin', or null
    const [songs, setSongs] = useState([]);
    const [currentSong, setCurrentSong] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // UI States
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isToolsOpen, setIsToolsOpen] = useState(false); // New
    const [isMetronomeOpen, setIsMetronomeOpen] = useState(false); // Persistent Metronome

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [editingSong, setEditingSong] = useState(null);

    // Initialize Auth & Data
    useEffect(() => {
        const initAuth = async () => {
            try {
                // Check specifically for global token (from preview environment if any)
                if (window.__initial_auth_token) {
                    // Need signInWithCustomToken import if we use this
                    // For now, default to anonymous which is standard for this app
                    await signInAnonymously(auth);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (error) {
                console.error("Auth Error:", error);
            }
        };
        initAuth();

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                const q = query(collection(db, 'songs'), orderBy('createdAt', 'desc'));
                const unsubscribeSongs = onSnapshot(q, (snapshot) => {
                    const songsData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setSongs(songsData);
                    setLoading(false);
                }, (error) => {
                    console.error("Error fetching songs:", error);
                    setLoading(false);
                });
                return () => unsubscribeSongs();
            }
        });

        return () => unsubscribeAuth();
    }, []);

    const handleSaveSong = async (songData) => {
        if (modalMode === 'add') {
            await addDoc(collection(db, 'songs'), songData);
        } else {
            if (editingSong) {
                await updateDoc(doc(db, 'songs', editingSong.id), songData);
                if (currentSong && currentSong.id === editingSong.id) {
                    setCurrentSong({ ...currentSong, ...songData });
                }
            }
        }
    };

    const handleDeleteSong = async (songId) => {
        if (userRole !== 'admin') return;
        try {
            await deleteDoc(doc(db, 'songs', songId));
            if (currentSong?.id === songId) setCurrentSong(null);
        } catch (err) {
            alert("刪除失敗");
            console.error(err);
        }
    };

    const openAddModal = () => {
        setModalMode('add');
        setEditingSong(null);
        setIsModalOpen(true);
    };

    const openEditModal = (e, song) => {
        if (e) e.stopPropagation();
        setModalMode('edit');
        setEditingSong(song);
        setIsModalOpen(true);
    };

    // Reset state on song change
    useEffect(() => {
        if (currentSong) {
            setIsSidebarOpen(false); // Auto collapse
        }
    }, [currentSong]);

    const filteredSongs = songs.filter(song => {
        const term = searchTerm.toLowerCase();
        const title = song.title.toLowerCase();
        const artist = song.artist.toLowerCase();
        // Handle potential missing titleLength
        const len = (song.titleLength || song.title.length || 0).toString();
        return title.includes(term) || artist.includes(term) || len === term;
    });

    if (!userRole) {
        return <LoginScreen onLogin={setUserRole} />;
    }

    return (
        <div className="flex h-screen bg-gray-900 overflow-hidden text-gray-100 font-sans">
            <Sidebar
                songs={songs}
                currentSong={currentSong}
                setCurrentSong={setCurrentSong}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                userRole={userRole}
                setUserRole={setUserRole}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                openAddModal={openAddModal}
                openEditModal={openEditModal}
                handleDeleteSong={handleDeleteSong}
                loading={loading}
                filteredSongs={filteredSongs}
                onOpenTools={() => setIsToolsOpen(true)} // Pass this prop
            />

            <Player
                currentSong={currentSong}
                setCurrentSong={setCurrentSong}
                userRole={userRole}
                openAddModal={openAddModal}
            />

            <SongModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveSong}
                mode={modalMode}
                initialData={editingSong}
            />

            <ToolsModal
                isOpen={isToolsOpen}
                onClose={() => setIsToolsOpen(false)}
                onOpenMetronome={() => {
                    setIsToolsOpen(false);
                    setIsMetronomeOpen(true);
                }}
            />

            {isMetronomeOpen && (
                <PersistentMetronome onClose={() => setIsMetronomeOpen(false)} />
            )}
        </div>
    );
};

export default App;