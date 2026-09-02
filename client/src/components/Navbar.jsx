'use client'
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, useCallback } from "react";

export default function Navbar() {
  const { user, logout, walletBalance } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const isActive = (path) => pathname === path;

  // Helper to read total item count from localStorage cart
  const syncCartCount = useCallback(() => {
    try {
      const cartString = localStorage.getItem("cart");
      if (!cartString) {
        setCartCount(0);
        return;
      }
      const cart = JSON.parse(cartString);
      if (Array.isArray(cart)) {
        const total = cart.reduce((sum, item) => sum + (Number(item.Quantity) || 1), 0);
        setCartCount(total);
      } else {
        setCartCount(0);
      }
    } catch (err) {
      console.error("Error reading cart in Navbar:", err);
      setCartCount(0);
    }
  }, []);

  // Listen to cart updates live
  useEffect(() => {
    syncCartCount();

    const handleCartUpdate = () => syncCartCount();
    window.addEventListener("cart_updated", handleCartUpdate);
    window.addEventListener("storage", handleCartUpdate);

    return () => {
      window.removeEventListener("cart_updated", handleCartUpdate);
      window.removeEventListener("storage", handleCartUpdate);
    };
  }, [syncCartCount]);

  // Helper function to render the correct navigation links based on user roles
  const renderNavLinks = () => {
    if (!user) {
      return (
        <Link 
          href="/" 
          className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-all ${
            isActive("/") 
              ? "text-zinc-950 bg-zinc-100/90 font-bold" 
              : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80"
          }`}
        >
          Marketplace
        </Link>
      );
    }

    // Determine the user's role with robust fallback logic
    let role = "buyer";
    const rawRole = user.RoleName || user.roleName;
    if (rawRole) {
      role = rawRole.toLowerCase();
    } else if (user.RoleID === 1 || user.roleId === 1) {
      role = "admin";
    } else if (user.RoleID === 2 || user.roleId === 2) {
      role = "seller";
    }

    // A. Buyer Links
    if (role === "buyer") {
      return (
        <>
          <Link 
            href="/" 
            className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-all ${
              isActive("/") 
                ? "text-zinc-950 bg-zinc-100/90 font-bold" 
                : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80"
            }`}
          >
            Marketplace
          </Link>
          
          {/* Enhanced My Cart Button with Real-time Badge Counter */}
          <Link 
            href="/cart" 
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg transition-all ${
              isActive("/cart") 
                ? "text-zinc-950 bg-zinc-100/90 font-bold ring-1 ring-zinc-200" 
                : "text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100/80"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-zinc-950">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            <span>My Cart</span>
            <span className={`ml-0.5 px-2 py-0.5 text-xs font-extrabold rounded-full transition-all ${
              cartCount > 0 
                ? "bg-zinc-950 text-white scale-105" 
                : "bg-zinc-200 text-zinc-600"
            }`}>
              {cartCount}
            </span>
          </Link>

          <Link 
            href="/profile" 
            className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-all ${
              isActive("/profile") 
                ? "text-zinc-950 bg-zinc-100/90 font-bold" 
                : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80"
            }`}
          >
            My Profile
          </Link>
        </>
      );
    }

    // B. Seller Links
    if (role === "seller") {
      return (
        <>
          <Link 
            href="/seller/dashboard" 
            className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-all ${
              isActive("/seller/dashboard") 
                ? "text-zinc-950 bg-zinc-100/90 font-bold" 
                : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80"
            }`}
          >
            Shop Dashboard
          </Link>
          <Link 
            href="/seller/orders" 
            className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-all ${
              isActive("/seller/orders") 
                ? "text-zinc-950 bg-zinc-100/90 font-bold" 
                : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80"
            }`}
          >
            Incoming Orders
          </Link>
          <Link 
            href="/seller/shop" 
            className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-all ${
              isActive("/seller/shop") 
                ? "text-zinc-950 bg-zinc-100/90 font-bold" 
                : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80"
            }`}
          >
            Shop Settings
          </Link>
          <Link 
            href="/profile" 
            className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-all ${
              isActive("/profile") 
                ? "text-zinc-950 bg-zinc-100/90 font-bold" 
                : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80"
            }`}
          >
            My Profile
          </Link>
        </>
      );
    }

    // C. Admin Links
    if (role === "admin") {
      return (
        <>
          <Link 
            href="/admin/dashboard" 
            className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-all ${
              isActive("/admin/dashboard") 
                ? "text-zinc-950 bg-zinc-100/90 font-bold" 
                : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80"
            }`}
          >
            Admin Dashboard
          </Link>
          <Link 
            href="/admin/seller" 
            className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-all ${
              isActive("/admin/seller") 
                ? "text-zinc-950 bg-zinc-100/90 font-bold" 
                : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80"
            }`}
          >
            Manage Sellers
          </Link>
          <Link 
            href="/admin/buyer" 
            className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-all ${
              isActive("/admin/buyer") 
                ? "text-zinc-950 bg-zinc-100/90 font-bold" 
                : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80"
            }`}
          >
            Manage Buyers
          </Link>
          <Link 
            href="/profile" 
            className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-all ${
              isActive("/profile") 
                ? "text-zinc-950 bg-zinc-100/90 font-bold" 
                : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80"
            }`}
          >
            My Profile
          </Link>
        </>
      );
    }

    return null;
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* A. LOGO BRAND SECTION */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-zinc-950 group">
              <img 
                src="/logo.png" 
                alt="MarketPortal Logo" 
                className="w-8.5 h-8.5 object-contain rounded-md"
              />
            </Link>
          </div>

          {/* B. MIDDLE NAVIGATION LINKS (Desktop) */}
          <div className="hidden md:flex md:items-center md:space-x-2">
            {renderNavLinks()}
          </div>

          {/* C. USER STATUS & PROFILE BADGE */}
          <div className="hidden md:flex md:items-center md:gap-4">
            {user ? (
              <>
                {/* Wallet Balance Display */}
                <div className="flex items-center rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-3 py-1.5 text-xs font-bold text-emerald-700">
                  <span>Balance: ${Number(walletBalance ?? 0).toFixed(2)}</span>
                </div>

                {/* Clickable Username & Role Badge */}
                <Link 
                  href="/profile" 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-all text-left group"
                >
                  <div className="w-6 h-6 rounded-full bg-zinc-100 text-zinc-700 font-bold text-[11px] flex items-center justify-center border border-zinc-200 shrink-0">
                    {(user.Username || user.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-zinc-700 group-hover:text-zinc-950 transition-colors">
                    {user.Username || user.username}
                  </span>
                </Link>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  className="px-3 py-1.5 text-xs font-bold text-zinc-500 hover:text-red-600 hover:bg-red-50 border border-zinc-200 rounded-lg transition-all"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 rounded-xl transition-all">
                  Log In
                </Link>
                <Link href="/signup" className="bg-zinc-900 px-4 py-2 text-xs font-bold text-white rounded-lg hover:bg-zinc-800 transition-all shadow-xs">
                  Get Started
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
