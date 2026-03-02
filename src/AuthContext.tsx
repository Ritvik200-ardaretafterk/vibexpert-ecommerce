import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_URL = 'https://vibexpert-backend-main.onrender.com';

interface User {
    id: string;
    username: string;
    email: string;
    college?: string;
    profile_pic?: string;
    bio?: string;
    isPremium?: boolean;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    logout: () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for SSO token in URL on mount
    useEffect(() => {
        const handleAuth = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const ssoToken = urlParams.get('sso_token');

            if (ssoToken) {
                // Verify SSO token with backend
                try {
                    const response = await fetch(`${API_URL}/api/sso/verify-token`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ssoToken }),
                    });

                    const data = await response.json();

                    if (data.success && data.user) {
                        // Store auth data in localStorage
                        localStorage.setItem('shop_auth_token', data.token);
                        localStorage.setItem('shop_user', JSON.stringify(data.user));
                        setUser(data.user);

                        // Clean the URL (remove sso_token param)
                        const cleanUrl = window.location.origin + window.location.pathname;
                        window.history.replaceState({}, document.title, cleanUrl);
                    }
                } catch (error) {
                    console.error('SSO verification failed:', error);
                }
            } else {
                // Check for existing session in localStorage
                const savedUser = localStorage.getItem('shop_user');
                const savedToken = localStorage.getItem('shop_auth_token');

                if (savedUser && savedToken) {
                    try {
                        setUser(JSON.parse(savedUser));
                    } catch {
                        localStorage.removeItem('shop_user');
                        localStorage.removeItem('shop_auth_token');
                    }
                }
            }

            setIsLoading(false);
        };

        handleAuth();
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('shop_auth_token');
        localStorage.removeItem('shop_user');
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
