import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { route } from "@/utils/routes";
import Navbar from "@/Components/Navbar";

export default function DashboardLayout({ children }) {
    const { user } = useAuth();
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(path + "/");
    };

    // Navigation items based on user role
    const getNavItems = () => {
        const items = [
            {
                name: "Overview",
                path: route("dashboard"),
                icon: "📊",
                roles: ["user", "helper", "business"]
            },
            {
                name: "Applications",
                path: user?.role === "user"
                    ? route("job-applications.my-request-applications")
                    : route("job-applications.my-applications"),
                icon: "📋",
                roles: ["user", "helper", "business"]
            },
            {
                name: "Messages",
                path: route("messages"),
                icon: "💬",
                roles: ["user", "helper", "business"]
            },
            {
                name: "Profile",
                path: route("profile.edit"),
                icon: "👤",
                roles: ["user", "helper", "business"]
            }
        ];

        // Add role-specific items
        if (user?.role === "user") {
            items.push(
                {
                    name: "My Job Postings",
                    path: route("job-posts.index"),
                    icon: "📅",
                    roles: ["user"]
                }
            );
        }

        if (user?.role === "helper") {
            items.push(
                {
                    name: "My Service Listings",
                    path: route("service-listings.my-listings"),
                    icon: "📝",
                    roles: ["helper"]
                },
                {
                    name: "Documents",
                    path: "/dashboard/documents",
                    icon: "📄",
                    roles: ["helper"]
                },
            );
        }

        if (user?.role === "business") {
            items.push(
                {
                    name: "Documents",
                    path: "/dashboard/documents",
                    icon: "📄",
                    roles: ["business"]
                },
            );
        }

        if (user?.role === "business") {
            items.push(
                {
                    name: "Workers",
                    path: route("business.workers.index"),
                    icon: "👥",
                    roles: ["business"]
                }
            );
        }

        return items.filter(item => item.roles.includes(user?.role));
    };

    const navItems = getNavItems();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            {/* Top Navigation Bar */}
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
                <Navbar />
            </div>

            <div className="flex pt-4 md:pt-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 gap-8">
                {/* Sidebar */}
                <aside className="hidden lg:block w-72 shrink-0">
                    <div className="sticky top-28 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                        {/* User Profile Summary in Sidebar */}
                        <div className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-center">
                            <div className="w-20 h-20 mx-auto bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-3xl mb-3 shadow-inner border border-white/30">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <h3 className="font-bold text-lg truncate">{user?.name}</h3>
                            <p className="text-indigo-100 text-xs uppercase tracking-wider font-medium">{user?.role}</p>
                        </div>

                        <nav className="p-4 space-y-1">
                            {navItems.map((item) => {
                                const active = isActive(item.path);
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${active
                                            ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 shadow-sm"
                                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-indigo-600 dark:hover:text-indigo-400 hover:pl-5"
                                            }`}
                                    >
                                        <span className={`mr-3 text-xl transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`}>
                                            {item.icon}
                                        </span>
                                        <span>{item.name}</span>
                                        {active && (
                                            <span className="ml-auto w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 text-center">
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                © 2025 KamWaalay
                            </p>
                        </div>
                    </div>
                </aside>


                {/* Main Content */}
                <main className="flex-1 min-w-0 pb-12">
                    {/* Page Content Animation Wrapper */}
                    <div className="animate-fade-in-up">
                        {children}
                    </div>
                </main>
            </div>

            {/* Visual Background Elements */}
            <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] transform translate-x-1/3 -translate-y-1/3"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] transform -translate-x-1/3 translate-y-1/3"></div>
            </div>
        </div>
    );
}
