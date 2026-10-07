import { createContext, useState, useEffect, type ReactNode } from 'react';
import { API_BASE } from '../config';

interface User {
    _id: string;
    name: string;
    email: string;
    role: 'freelancer' | 'employer' | 'admin';
    token: string;
    bio?: string;
    skills?: string[];
    hourlyRate?: number;
    badge?: string;
    badgeSubscriptionEnd?: string;
}

interface AuthContextType {
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
    isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            // Validate token with server
            fetch(`${API_BASE}/auth/me`, {
                headers: { Authorization: `Bearer ${parsed.token}` },
            }).then(async res => {
                if (!res.ok) {
                    // Token is invalid or user no longer exists — auto logout
                    setUser(null);
                    localStorage.removeItem('user');
                } else {
                    const data = await res.json();
                    const updatedUser = { ...parsed, ...data };
                    // We must not lose the token that was in localStorage. `auth/me` doesn't return a token.
                    updatedUser.token = parsed.token;
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                }
            }).catch(() => {
                // Server unreachable, keep local state
            }).finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
