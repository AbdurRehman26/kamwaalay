import { Link, useLocation } from "react-router-dom";

export default function ResponsiveNavLink({
    active = false,
    className = "",
    children,
    href,
    ...props
}) {
    const location = useLocation();
    const isActive = active || location.pathname === href;
    
    return (
        <Link
            to={href}
            {...props}
            className={`flex w-full items-start border-l-4 py-2 pe-4 ps-3 ${
                isActive
                    ? "border-blue-400 bg-blue-50 text-blue-700 focus:border-blue-700 focus:bg-blue-100 focus:text-blue-800"
                    : "border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 focus:border-gray-300 focus:bg-gray-50 focus:text-gray-800"
            } text-base font-medium transition duration-150 ease-in-out focus:outline-none ${className}`}
        >
            {children}
        </Link>
    );
}
