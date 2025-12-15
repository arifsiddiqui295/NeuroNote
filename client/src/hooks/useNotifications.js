import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const BASE_URL = import.meta.env.VITE_API_URL;

export const useNotifications = () => {
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;
        // console.log("Setting up notification stream for user:", user);
        // Connect to the stream
        // Note: EventSource doesn't support custom headers (like Authorization) natively.
        // We usually pass the token in the query string for SSE.
        const url = `${BASE_URL}/notifications/stream?token=${user.token}`;
        const eventSource = new EventSource(url);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'ROLE_UPDATED') {
                // Dispatch a custom window event so any component can listen
                // This is a simple way to broadcast to your whole app
                const customEvent = new CustomEvent('role-updated', { detail: data });
                window.dispatchEvent(customEvent);
            }
        };

        return () => {
            eventSource.close();
        };
    }, [user]);
};