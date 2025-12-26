import React, { useState } from 'react';
import { User, Lock, Phone } from 'lucide-react';

const Register = ({ onRegister, switchToLogin }) => {
    const [formData, setFormData] = useState({ name: '', phone: '', password: '' });
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onRegister(formData.name, formData.phone, formData.password, setError);
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800">Ro'yxatdan o'tish</h2>
                    <p className="text-gray-500 mt-2">Yangi hisob yarating</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ism</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:border-purple-500 focus:outline-none"
                                placeholder="Ismingiz"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefon raqam</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:border-purple-500 focus:outline-none"
                                placeholder="+998901234567"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Parol</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:border-purple-500 focus:outline-none"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition font-semibold shadow-lg shadow-purple-200"
                    >
                        Ro'yxatdan o'tish
                    </button>
                </form>

                <p className="mt-6 text-center text-gray-600">
                    Allaqachon hisobingiz bormi?{' '}
                    <button
                        onClick={switchToLogin}
                        className="text-purple-600 font-semibold hover:underline"
                    >
                        Kirish
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Register;
