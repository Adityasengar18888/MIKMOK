"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, UserButton } from "@clerk/clerk-react";
import {
  Home,
  Search,
  PlusSquare,
  Bell,
  User,
  Shield,
  Compass,
} from "lucide-react";
import { useAuthSync } from "@/hooks/useAuthSync";
import { useUserStore } from "@/stores/userStore";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/feed", label: "Home", icon: Home },
  { href: "/feed?type=trending", label: "Explore", icon: Compass },
  { href: "/upload", label: "Upload", icon: PlusSquare, accent: true },
  { href: "/search", label: "Search", icon: Search },
  { href: "/notifications", label: "Alerts", icon: Bell },
];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useAuthSync();
  const pathname = usePathname();
  const { isSignedIn } = useUser();
  const dbUser = useUserStore((s) => s.user);

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[240px_1fr]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-[240px] fixed left-0 top-0 bottom-0 border-r border-border/40 glass z-40 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 px-6 py-6 group">
          <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-[#40E0D0] to-[#00CED1] flex items-center justify-center shadow-lg shadow-[#40E0D0]/30 group-hover:scale-105 transition-transform duration-300">
            <span className="text-black font-black text-lg">M</span>
          </div>
          <span className="text-2xl font-black gradient-text tracking-tight">MikMok</span>
        </Link>

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-2 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href.split("?")[0]);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "bg-[#40E0D0] text-black shadow-md shadow-[#40E0D0]/20"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:translate-x-1",
                  item.accent && !isActive && "text-[#40E0D0]"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5",
                    item.accent && !isActive && "text-[#40E0D0]"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {item.label}
              </Link>
            );
          })}

          {isSignedIn && dbUser && (
            <Link
              href={`/profile/${dbUser.username}`}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200",
                pathname.includes("/profile")
                  ? "bg-[#40E0D0] text-black shadow-md shadow-[#40E0D0]/20"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:translate-x-1"
              )}
            >
              <User className="w-5 h-5" strokeWidth={pathname.includes("/profile") ? 2.5 : 2} />
              Profile
            </Link>
          )}

          {dbUser?.role === "admin" && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200",
                pathname.startsWith("/admin")
                  ? "bg-[#40E0D0] text-black shadow-md shadow-[#40E0D0]/20"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:translate-x-1"
              )}
            >
              <Shield className="w-5 h-5" strokeWidth={pathname.startsWith("/admin") ? 2.5 : 2} />
              Admin
            </Link>
          )}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-border">
          {isSignedIn ? (
            <div className="flex items-center gap-3">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9 rounded-xl",
                  },
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {dbUser?.name || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  @{dbUser?.username || "..."}
                </p>
              </div>
            </div>
          ) : (
            <Link
              href="/sign-in"
              className="flex items-center justify-center w-full py-2.5 px-4 bg-gradient-to-r from-[#40E0D0] to-[#00CED1] text-black text-sm font-bold rounded-xl hover:opacity-90 transition-opacity"
            >
              Log in
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="col-start-2 pb-20 lg:pb-0 min-h-screen">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass border-t border-border z-50">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href.split("?")[0]);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors",
                  isActive ? "text-[#40E0D0]" : "text-muted-foreground"
                )}
              >
                {item.accent ? (
                  <div className="w-10 h-8 rounded-lg bg-gradient-to-r from-[#40E0D0] to-[#00CED1] flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-black" />
                  </div>
                ) : (
                  <item.icon className="w-5 h-5" />
                )}
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          {isSignedIn ? (
            <Link
              href={`/profile/${dbUser?.username || ""}`}
              className={cn(
                "flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors",
                pathname.includes("/profile") ? "text-[#40E0D0]" : "text-muted-foreground"
              )}
            >
              <User className="w-5 h-5" />
              <span className="text-[10px] font-medium">Me</span>
            </Link>
          ) : (
            <Link
              href="/sign-in"
              className="flex flex-col items-center gap-0.5 py-1 px-3 text-muted-foreground"
            >
              <User className="w-5 h-5" />
              <span className="text-[10px] font-medium">Log in</span>
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
