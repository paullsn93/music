import React, { useState } from 'react';
import { Guitar, Lock } from 'lucide-react';

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
                <p className="text-gray-400 text-center mb-6 text-sm">私人收藏庫 • 分頁閱覽 • YouTube Music</p>

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
                        訪客密碼: 1234 <br /> 管理員密碼: admin
                    </p>
                </form>
            </div>
        </div>
    );
};

export default LoginScreen;
