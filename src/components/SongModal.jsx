import React, { useState, useEffect } from 'react';
import { Plus, Pencil, X, Youtube, Upload } from 'lucide-react';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const SongModal = ({ isOpen, onClose, onSave, mode = 'add', initialData = null }) => {
    const [formData, setFormData] = useState({
        title: '',
        artist: '',
        sourceUrl: '',
    });
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [existingTabUrls, setExistingTabUrls] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (isOpen) {
            setErrorMsg('');
            setSelectedFiles([]);
            setUploading(false);

            if (mode === 'edit' && initialData) {
                setFormData({
                    title: initialData.title || '',
                    artist: initialData.artist || '',
                    sourceUrl: initialData.sourceUrl || '',
                });
                if (initialData.tabUrls && Array.isArray(initialData.tabUrls)) {
                    setExistingTabUrls(initialData.tabUrls);
                } else if (initialData.tabUrl) {
                    setExistingTabUrls([initialData.tabUrl]);
                } else {
                    setExistingTabUrls([]);
                }
            } else {
                setFormData({ title: '', artist: '', sourceUrl: '' });
                setExistingTabUrls([]);
            }
        }
    }, [isOpen, mode, initialData]);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        let files = Array.from(e.target.files);
        files.sort((a, b) => {
            return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        });

        setSelectedFiles(files);
        setErrorMsg('');
    };

    const handleRemoveExisting = (indexToRemove) => {
        setExistingTabUrls(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (existingTabUrls.length === 0 && selectedFiles.length === 0) {
            setErrorMsg('請至少保留或上傳一張圖片');
            return;
        }

        setUploading(true);
        setErrorMsg('');

        try {
            const uploadedUrls = [];
            for (const file of selectedFiles) {
                const storageRef = ref(storage, `tab_images/${Date.now()}_${file.name}`);
                await uploadBytes(storageRef, file);
                const downloadUrl = await getDownloadURL(storageRef);
                uploadedUrls.push(downloadUrl);
            }

            const finalTabUrls = [...existingTabUrls, ...uploadedUrls];

            const songData = {
                ...formData,
                titleLength: formData.title.length,
                tabUrls: finalTabUrls,
                tabUrl: finalTabUrls[0],
                ...(mode === 'add' ? { createdAt: new Date().toISOString() } : {})
            };

            await onSave(songData);
            onClose();
        } catch (err) {
            console.error("Save error:", err);
            setErrorMsg('儲存失敗：' + err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl max-w-lg w-full p-6 border border-gray-700 animate-fade-in shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {mode === 'add' ? <Plus size={20} className="text-indigo-400" /> : <Pencil size={20} className="text-indigo-400" />}
                        {mode === 'add' ? '新增吉他譜' : '編輯吉他譜'}
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
                                value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} disabled={uploading} />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">演唱者</label>
                            <input required type="text" className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:border-indigo-500 outline-none"
                                value={formData.artist} onChange={e => setFormData({ ...formData, artist: e.target.value })} disabled={uploading} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">音樂來源 (YouTube Music 連結)</label>
                        <div className="relative">
                            <Youtube className="absolute left-3 top-2.5 text-red-500" size={18} />
                            <input type="url" placeholder="https://music.youtube.com/..." className="w-full pl-10 bg-gray-700 border border-gray-600 rounded p-2 text-white focus:border-indigo-500 outline-none"
                                value={formData.sourceUrl} onChange={e => setFormData({ ...formData, sourceUrl: e.target.value })} disabled={uploading} />
                        </div>
                    </div>

                    {/* 圖片管理區 */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">吉他譜圖片 (可上傳多張)</label>
                        {existingTabUrls.length > 0 && (
                            <div className="mb-3 space-y-2">
                                <p className="text-xs text-gray-500">已存在的圖片 (點擊右側 X 刪除):</p>
                                {existingTabUrls.map((url, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-gray-700/50 p-2 rounded border border-gray-600">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span className="text-indigo-400 font-bold text-xs">#{idx + 1}</span>
                                            <img src={url} className="h-8 w-8 object-cover rounded" alt="thumb" />
                                            <span className="text-xs text-gray-400 truncate w-32">...{url.slice(-10)}</span>
                                        </div>
                                        <button type="button" onClick={() => handleRemoveExisting(idx)} className="text-red-400 hover:text-red-300 p-1">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className={`border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors bg-gray-700/30`}>
                            <input
                                type="file"
                                id="fileInput"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                                disabled={uploading}
                            />
                            <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                                <Upload className="text-gray-400" size={32} />
                                <span className="text-sm text-indigo-400 font-medium">點擊上傳新圖片</span>
                                <span className="text-xs text-gray-500">
                                    可依需求動態增加
                                </span>
                            </label>
                        </div>

                        {selectedFiles.length > 0 && (
                            <div className="mt-2 space-y-1">
                                {Array.from(selectedFiles).map((file, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-xs text-green-400">
                                        <Plus size={12} /> 新增: {file.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} disabled={uploading} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition">取消</button>
                        <button type="submit" disabled={uploading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition font-medium flex items-center justify-center gap-2">
                            {uploading ? (
                                <>
                                    <div className="spinner"></div> 儲存中...
                                </>
                            ) : (mode === 'add' ? '新增入庫' : '儲存修改')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SongModal;
