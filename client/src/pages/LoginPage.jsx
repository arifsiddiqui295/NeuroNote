import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import authService from '../api/authApi';
import axios from 'axios'; 
var BASE_URL = import.meta.env.VITE_API_URL;
export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // New state for the toggle
    const { login } = useAuth();
    const [serverReady, setServerReady] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const userData = await authService.login(email, password);
            login(userData);
        } catch (err) {
            const message = err.response?.data?.message || 'Login failed. Please try again.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        const wakeUpServer = async () => {
            try {
                await axios.get(BASE_URL); 
                setServerReady(true);
            } catch (err) {
                setError('Could not connect to the server. Please try again later.');
            }
        };
        wakeUpServer();
    }, []);


    if (!serverReady) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-center">
                    <h2 className="text-2xl font-bold">Waking up the server...</h2>
                    <p className="text-gray-600">This may take a moment.</p>
                </div>
            </div>
        );
    }
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg rounded-lg">
                <h3 className="text-2xl font-bold text-center">Login to your account</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mt-4">
                        <div>
                            <label className="block" htmlFor="email">Email</label>
                            <input
                                type="email"
                                placeholder="Email"
                                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mt-4">
                            <label className="block">Password</label>
                            {/* --- NEW: Wrapper for the password input and icon --- */}
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"} // Dynamically change input type
                                    placeholder="Password"
                                    className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                {/* --- NEW: The eye icon button --- */}
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500"
                                >
                                    {/* Simple text-based eye emoji for now */}
                                    {showPassword ? '👁️‍🗨️' : '👁️'}
                                </button>
                            </div>
                        </div>
                        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                        <div className="flex">
                            <button
                                type="submit"
                                className="w-full px-6 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-900"
                                disabled={loading}
                            >
                                {loading ? 'Logging in...' : 'Login'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}