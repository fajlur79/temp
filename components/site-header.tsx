"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Menu, Search, Sparkles, X } from "lucide-react";
import { ProfileDropdown } from "./profiledropdown";

const nav = [
    { href: "/", label: "Home" },
    { href: "/eMagazine", label: "eMagazine" },
    { href: "/poems", label: "Department" },
    { href: "/gallery", label: "Archive" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
    const pathname = usePathname();
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Handle scroll effect for glass navbar
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
            setSearchQuery("");
            setMobileMenuOpen(false);
        }
    };

    return (
        <header
            className={cn(
                "sticky top-0 z-50 w-full transition-all duration-300 border-b border-transparent",
                scrolled || mobileMenuOpen ? "glass border-border/40 shadow-sm" : "bg-transparent"
            )}
        >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link 
                    href="/" 
                    className="flex items-center gap-2.5 group" 
                    aria-label="Apodartho Home"
                    onClick={() => setMobileMenuOpen(false)}
                >
                    <div className="relative flex items-center justify-center size-8 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-foreground/90 group-hover:text-foreground transition-colors">
                        Apodartho
                    </span>
                </Link>

                {/* Desktop Navigation - Centered Pill Style */}
                <nav aria-label="Primary" className="hidden md:flex items-center gap-1 bg-background/50 p-1 rounded-full border border-border/50 shadow-sm backdrop-blur-md">
                    {nav.map(item => {
                        const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                                    active
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Right Side Actions */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Desktop Search Trigger (Optional visual) */}
                    <Button variant="ghost" size="icon" className="hidden lg:flex text-muted-foreground hover:text-primary" aria-label="Search">
                        <Search className="w-4 h-4" />
                    </Button>

                    <Button asChild className="hidden sm:inline-flex rounded-full px-5" size="sm">
                        <Link href="/contribute">Contribute</Link>
                    </Button>

                    <ProfileDropdown />

                    {/* Mobile Menu Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden text-muted-foreground"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>
            </div>

            {/* Mobile Navigation Dropdown */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-16 left-0 right-0 glass border-b border-border/40 animate-slide-up h-[calc(100vh-4rem)]">
                    <div className="container mx-auto px-4 py-6 flex flex-col gap-6">
                        {/* Mobile Search */}
                        <form onSubmit={handleSearch} className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search articles..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-9 bg-muted/50 border-transparent focus:bg-background transition-all"
                            />
                        </form>

                        {/* Links */}
                        <div className="grid gap-2">
                            {nav.map(item => {
                                const active =
                                    pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all",
                                            active
                                                ? "bg-primary/10 text-primary"
                                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {item.label}
                                        {active && <Sparkles className="w-3 h-3 text-primary" />}
                                    </Link>
                                );
                            })}
                        </div>

                        <Button asChild className="w-full rounded-xl py-6 text-base mt-auto mb-10" size="lg">
                            <Link href="/contribute" onClick={() => setMobileMenuOpen(false)}>
                                Submit an Article
                            </Link>
                        </Button>
                    </div>
                </div>
            )}
        </header>
    );
}