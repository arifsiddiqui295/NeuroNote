import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
    const navigate = useNavigate();
    useEffect(() => {
        const changeRotu = () => {
            navigate('/dashboard');
        }
        changeRotu();
    }, []);
    return (
        <div className="min-h-screen bg-gray-700">
            <Navbar />
            <main >
                {/* The Outlet component renders the current page */}
                <Outlet />
            </main>
        </div>
    );
}