"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    const navItems = [
        { path: "/", label: "Home" },
        { path: "/query", label: "Query" },
        { path: "/explore", label: "Explore" },
        { path: "/history", label: "History" },
        { path: "/metrics", label: "Metrics" },
        { path: "/mlops", label: "MLOps" },
        { path: "/about", label: "About" },
    ];

    return (
        <header className="border-b border-gray-200 bg-white sticky top-0 z-50 backdrop-blur-sm bg-white/90">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo - Text only */}
                    <Link href="/" className="text-lg font-medium text-gray-900 hover:text-gray-700 transition-colors">
                        Grasp
                    </Link>

                    {/* Navigation - Text only */}
                    <nav className="flex items-center gap-1">
                        {navItems.map((item) => {
                            const active = isActive(item.path);

                            return (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${active
                                        ? "bg-gray-100 text-gray-900"
                                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>
        </header>
    );
}
