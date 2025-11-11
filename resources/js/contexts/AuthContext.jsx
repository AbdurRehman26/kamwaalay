import React, { createContext, useState, useEffect, useContext } from "react";
import { authService } from "../services/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is authenticated
        if (authService.isAuthenticated()) {
            // Fetch current user from API
            authService.getCurrentUser()
                .then((response) => {
                    setUser(response.user);
                    setLoading(false);
                })
                .catch((error) => {
                    console.error("Error fetching user:", error);
                    // Only remove token if it's a 401 (Unauthorized) - token is invalid
                    if (error.response?.status === 401) {
                        // Token is invalid - remove it
                        authService.removeToken();
                        setUser(null);
                        setLoading(false);
                    } else {
                        // For other errors (network, 500, etc.), keep token but set loading to false
                        // The ProtectedRoute will handle showing loading if token exists but user is null
                        // Retry once after a short delay for network errors
                        if (!error.response || error.response.status >= 500) {
                            console.log("Network error, retrying user fetch...");
                            setTimeout(() => {
                                authService.getCurrentUser()
                                    .then((response) => {
                                        setUser(response.user);
                                        setLoading(false);
                                    })
                                    .catch((retryError) => {
                                        console.error("Retry failed:", retryError);
                                        setLoading(false);
                                    });
                            }, 1000);
                        } else {
                            setLoading(false);
                        }
                    }
                });
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (credentials) => {
        try {
            const response = await authService.login(credentials);
            if (response.user) {
                setUser(response.user);
            }
            return response;
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setUser(null);
            authService.removeToken();
        }
    };

    const updateUser = (userData) => {
        setUser(userData);
    };

    const value = {
        user,
        loading,
        login,
        logout,
        updateUser,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

