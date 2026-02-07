"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { LayoutDashboard, Compass, ChartNoAxesColumn, FileText, Menu, X, Rocket, Zap, Bot, Package } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
    const pathname = usePathname();
    const account = useCurrentAccount();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Handle scroll effect for navbar
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close mobile menu on route change or resize
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setMobileMenuOpen(false);
            }
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [mobileMenuOpen]);

    const navLinks = [
        { name: "MISSION CTRL", href: "/dashboard", icon: LayoutDashboard },
        { name: "INTEL OPS", href: "/analytics", icon: ChartNoAxesColumn },
        { name: "ARSENAL", href: "/strategies", icon: Zap },
        { name: "NEXUS", href: "/marketplace", icon: Package },
        { name: "STRAT LABS", href: "/strategies/builder", icon: Compass },
        { name: "THESIS", href: "/docs", icon: FileText },
        { name: "OPS UNIT", href: "/agents", icon: Bot },
        { name: "MANUAL", href: "/how-to-use", icon: FileText },
    ];

    const closeMobileMenu = useCallback(() => {
        setMobileMenuOpen(false);
    }, []);

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 pointer-events-none">
                {/* Main navbar container */}
                <div
                    className={`
                        pointer-events-auto w-full max-w-7xl 2xl:max-w-[95%] mx-auto 
                        backdrop-blur-md border border-white/10 
                        rounded-2xl sm:rounded-full 
                        px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5
                        flex items-center justify-between 
                        shadow-[0_4px_30px_rgba(0,0,0,0.1)]
                        transition-all duration-300
                        ${scrolled ? "bg-black/60" : "bg-black/40"}
                    `}
                >
                    {/* Left side: Logo + Badge */}
                    <div className="flex items-center gap-2 sm:gap-4 lg:gap-8 min-w-0">
                        {/* Logo Section - Responsive */}
                        <Link href="/" className="flex items-center gap-2 group shrink-0">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-neon-purple to-neon-cyan rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(189,0,255,0.3)] group-hover:scale-110 transition-transform">
                                <span className="text-white font-mono font-bold text-sm sm:text-base">S</span>
                            </div>
                            {/* Logo text - hidden on very small screens, shown on sm+ */}
                            <div className="hidden xs:flex flex-col min-[400px]:flex">
                                <span className="font-bold text-white tracking-tighter leading-none text-sm sm:text-base group-hover:text-neon-cyan transition-colors">
                                    SUILOOP
                                </span>
                                <span className="text-[8px] sm:text-[9px] text-gray-500 font-mono tracking-widest">
                                    PROTOCOL
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Center: Desktop Navigation - visible on laptop (lg) and up */}
                    <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            const Icon = link.icon;

                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`
                                        relative px-2 xl:px-3 py-2 rounded-full text-xs font-medium 
                                        transition-all duration-300 flex items-center gap-1.5 whitespace-nowrap
                                        ${isActive
                                            ? "text-white bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                            : "text-gray-400 hover:text-white hover:bg-white/5"
                                        }
                                    `}
                                >
                                    <Icon size={14} className={isActive ? "text-neon-cyan" : "text-gray-500"} />
                                    <span>{link.name}</span>
                                    {isActive && (
                                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-neon-cyan shadow-[0_0_10px_#00f3ff] rounded-full"></span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right Side: Status + Wallet + CTA + Mobile Toggle */}
                    <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0">
                        {/* Agent Status Indicator - lg+ */}
                        <div className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border ${account ? "bg-green-500/10 border-green-500/20" : "bg-white/5 border-white/10"}`}>
                            <span className="relative flex h-2 w-2">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${account ? "bg-green-400" : "bg-gray-400"}`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${account ? "bg-green-500" : "bg-gray-500"}`}></span>
                            </span>
                            <span className={`text-[10px] font-mono font-bold whitespace-nowrap ${account ? "text-green-400" : "text-gray-500"}`}>
                                UNIT
                            </span>
                        </div>

                        {/* Connect Button - Responsive scaling */}
                        <div className="navbar-connect-btn scale-[0.8] sm:scale-[0.85] md:scale-90 lg:scale-100 origin-right">
                            <ConnectButton className="!bg-neon-cyan !text-black !font-bold !px-3 sm:!px-4 lg:!px-5 !py-2 !rounded-full !text-xs sm:!text-sm !hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] !transition-all !whitespace-nowrap" />
                        </div>

                        {/* CTA Button - Hidden on mobile/tablet, shown on lg+ as icon, full on xl */}
                        <Link
                            href="/strategies"
                            className="hidden lg:flex items-center gap-1.5 bg-neon-cyan text-black px-3 py-2 rounded-full font-mono text-[10px] font-bold hover:bg-white transition-all shadow-[0_0_15px_rgba(0,243,255,0.4)] hover:shadow-[0_0_25px_rgba(255,255,255,0.6)] whitespace-nowrap"
                        >
                            <Rocket size={14} />
                            <span className="hidden xl:inline">INIT VECTOR</span>
                        </Link>

                        {/* Mobile Menu Toggle - Visible on lg and below */}
                        <button
                            className="lg:hidden min-w-[44px] min-h-[44px] w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 active:bg-white/15 transition-colors ml-1"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                            aria-expanded={mobileMenuOpen}
                        >
                            <motion.div
                                animate={{ rotate: mobileMenuOpen ? 90 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                {mobileMenuOpen ? <X size={20} className="sm:w-6 sm:h-6" /> : <Menu size={20} className="sm:w-6 sm:h-6" />}
                            </motion.div>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay & Dropdown */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 xl:hidden"
                            onClick={closeMobileMenu}
                            aria-hidden="true"
                        />

                        {/* Menu Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="fixed top-[72px] sm:top-[80px] left-3 right-3 sm:left-4 sm:right-4 z-50 p-3 sm:p-4 rounded-2xl glass-panel xl:hidden overflow-hidden max-h-[calc(100vh-100px)] overflow-y-auto"
                        >

                            {/* Mobile Status Badge */}
                            <div className="flex items-center justify-end mb-4 pb-3 border-b border-white/5">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/5">
                                    <span className="relative flex h-2 w-2">
                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${account ? "bg-green-400" : "bg-gray-400"}`}></span>
                                        <span className={`relative inline-flex rounded-full h-2 w-2 ${account ? "bg-green-500" : "bg-gray-500"}`}></span>
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-mono">
                                        {account ? "ACTIVE" : "IDLE"}
                                    </span>
                                </div>
                            </div>

                            {/* Navigation Links */}
                            <div className="space-y-1">
                                {navLinks.map((link, index) => {
                                    const isActive = pathname === link.href;
                                    const Icon = link.icon;

                                    return (
                                        <motion.div
                                            key={link.name}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <Link
                                                href={link.href}
                                                onClick={closeMobileMenu}
                                                className={`
                                                    min-h-[48px] p-3 sm:p-4 rounded-xl flex items-center gap-3 sm:gap-4 
                                                    transition-all duration-200 active:scale-[0.98]
                                                    ${isActive
                                                        ? "bg-white/10 text-white border border-neon-cyan/30"
                                                        : "hover:bg-white/5 text-gray-300 hover:text-white"
                                                    }
                                                `}
                                            >
                                                <div className={`
                                                    w-10 h-10 rounded-lg flex items-center justify-center
                                                    ${isActive ? "bg-neon-cyan/20" : "bg-white/5"}
                                                `}>
                                                    <Icon
                                                        size={20}
                                                        className={isActive ? "text-neon-cyan" : "text-gray-400"}
                                                    />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm sm:text-base">{link.name}</span>
                                                    {isActive && (
                                                        <span className="text-[10px] text-neon-cyan font-mono">CURRENT PAGE</span>
                                                    )}
                                                </div>
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Divider */}
                            <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent my-4"></div>

                            {/* CTA Button */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <Link
                                    href="/strategies"
                                    onClick={closeMobileMenu}
                                    className="min-h-[52px] p-4 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-bold border border-white/20 flex items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(0,243,255,0.3)]"
                                >
                                    <Zap size={20} className="text-black" />
                                    <span className="text-sm sm:text-base">INITIALIZE VECTOR</span>
                                    <Rocket size={18} className="text-black" />
                                </Link>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence >
        </>
    );
}
