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
                    path: route("bookings.index"),
                    icon: "📅",
                    roles: ["user"]
                }
            );
        }

        if (user?.role === "helper" || user?.role === "business") {
            items.push(
                {
                    name: "My Service Listings",
                    path: route("service-listings.my-listings"),
                    icon: "📝",
                    roles: ["helper", "business"]
                },
                {
                    name: "Documents",
                    path: "/dashboard/documents",
                    icon: "📄",
                    roles: ["helper", "business"]
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
        <div className="min-h-screen bg-gray-50">
            {/* Top Navigation Bar */}
            <Navbar />

            <div className="flex">
                {/* Sidebar */}
                <aside className="hidden lg:flex lg:flex-shrink-0">
                    <div className="flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen">
                        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                            <nav className="flex-1 px-3 space-y-1">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                            isActive(item.path)
                                                ? "bg-primary-50 text-primary-700 border-l-4 border-primary-600"
                                                : "text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                                        }`}
                                    >
                                        <span className="mr-3 text-xl">{item.icon}</span>
                                        <span>{item.name}</span>
                                    </Link>
                                ))}
                            </nav>
                        </div>
                    </div>
                </aside>


                {/* Main Content */}
                <main className="flex-1 min-w-0">
                    {children}
                </main>
            </div>

        </div>
    );
}
