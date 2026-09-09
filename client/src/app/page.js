"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL, USER_SERVICE_BASE_URL, getShopLogoUrl } from "@/config/api";
import Link from "next/link";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [shops, setShops] = useState([]);
  const [shopsLoading, setShopsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  // Redirection and Fetching logic
  useEffect(() => {
    if (authLoading) return;

    if (user && (user.RoleName?.toLowerCase() === "seller" || user.RoleID === 2 || user.roleId === 2)) {
      router.push("/seller/dashboard");
      return;
    }

    const fetchShops = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/shops`);
        if (!res.ok) {
          throw new Error("Failed to fetch shops database list");
        }
        const data = await res.json();
        setShops(data);
      } catch (err) {
        console.error("Fetch shops error:", err);
        setError("Cannot connect to server. Please check your network connection.");
      } finally {
        setShopsLoading(false);
      }
    };

    fetchShops();
  }, [user, authLoading, router]);

  // Filtered Shops Logic
  const filteredShops = shops.filter((shop) => {
    const matchesSearch = 
      shop.ShopName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.Description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.SellerName?.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeCategory === "All") return matchesSearch;
    if (activeCategory === "Tech & PC") {
      return matchesSearch && (shop.ShopName?.toLowerCase().includes("tech") || shop.ShopName?.toLowerCase().includes("pc") || shop.ShopName?.toLowerCase().includes("computer") || shop.ShopName?.toLowerCase().includes("gadget") || shop.ShopName?.toLowerCase().includes("apex"));
    }
    if (activeCategory === "Fashion") {
      return matchesSearch && (shop.ShopName?.toLowerCase().includes("thread") || shop.ShopName?.toLowerCase().includes("wear") || shop.ShopName?.toLowerCase().includes("apparel"));
    }
    if (activeCategory === "Crafts & Books") {
      return matchesSearch && (shop.ShopName?.toLowerCase().includes("artisan") || shop.ShopName?.toLowerCase().includes("book") || shop.ShopName?.toLowerCase().includes("ink") || shop.ShopName?.toLowerCase().includes("green"));
    }
    return matchesSearch;
  });

  // Loading Skeleton screen
  if (authLoading || (shopsLoading && !error)) {
    return (
      <div className="min-h-screen bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="h-8 w-48 rounded bg-zinc-200 animate-pulse mb-8" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-48 rounded-2xl bg-zinc-200/60 animate-pulse border border-zinc-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Filter shops that have valid logos for the marquee slider
  const logoShops = shops.filter(s => s.LogoUrl);
  const marqueeItems = [...logoShops, ...logoShops, ...logoShops, ...logoShops];

  return (
    <div className="min-h-screen bg-zinc-50/50">
      
      {/* 1. SLOW CONTINUOUS LOGO MARQUEE SLIDER */}
      {logoShops.length > 0 && (
        <div className="bg-white border-b border-zinc-200 py-3 overflow-hidden relative">
          <div className="flex w-full overflow-hidden select-none">
            <div className="flex shrink-0 animate-marquee items-center gap-6 py-1 pr-6">
              {marqueeItems.map((shop, index) => (
                <Link
                  key={`${shop.ShopID}-${index}`}
                  href={`/shop/${shop.ShopID}`}
                  className="flex items-center gap-2.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 px-3.5 py-1.5 rounded-lg transition-all duration-200 group shrink-0"
                >
                  <img
                    src={getShopLogoUrl(shop.LogoUrl)}
                    alt={shop.ShopName}
                    className="w-5 h-5 object-cover rounded-md border border-zinc-300 group-hover:scale-105 transition-transform"
                  />
                  <span className="text-xs font-semibold text-zinc-700 group-hover:text-zinc-950">
                    {shop.ShopName}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. INTERACTIVE DISCOVERY BAR & CATEGORY FILTERS */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Modern Search & Category Filter Bar */}
        <div className="bg-white border border-zinc-200/90 rounded-xl p-4 sm:p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Search Input Box */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Find a store, tech hub, or seller..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:bg-white focus:ring-1 focus:ring-zinc-900 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 hover:text-zinc-600 bg-zinc-200/60 rounded-full w-5 h-5 flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {["All", "Tech & PC", "Fashion", "Crafts & Books"].map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all shrink-0 ${
                      isActive
                        ? "bg-zinc-950 text-white"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

          </div>
        </div>

        {/* Error Alert Display */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-6">
            <div className="flex gap-3">
              <span className="text-sm font-medium text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!shopsLoading && filteredShops.length === 0 && !error && (
          <div className="text-center py-16 bg-white border border-zinc-200 rounded-xl">
            <h3 className="text-sm font-semibold text-zinc-900">No stores match your search</h3>
            <p className="mt-1 text-xs text-zinc-500">Try searching for a different keyword or select another category filter.</p>
          </div>
        )}

        {/* ACTIVE SHOPS GRID */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredShops.map((shop) => (
            <Link
              key={shop.ShopID}
              href={`/shop/${shop.ShopID}`}
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-zinc-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-zinc-400 hover:shadow-lg hover:shadow-zinc-950/5"
            >
              <div>
                {/* Shop Header & Logo */}
                <div className="flex items-center gap-3 mb-4">
                  {shop.LogoUrl ? (
                    <img 
                      src={getShopLogoUrl(shop.LogoUrl)}
                      alt={shop.ShopName} 
                      className="w-12 h-12 object-cover rounded-lg border border-zinc-200 shrink-0 group-hover:scale-105 transition-transform" 
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 font-bold text-lg shrink-0">
                      {shop.ShopName ? shop.ShopName.charAt(0).toUpperCase() : 'S'}
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 group-hover:text-zinc-950 transition-colors line-clamp-1">
                      {shop.ShopName}
                    </h3>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      Seller: {shop.SellerName}
                    </span>
                  </div>
                </div>
                
                {/* Shop Description */}
                <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-3 mb-6">
                  {shop.Description || "No description provided for this store."}
                </p>
              </div>

              {/* Centered Button at the bottom middle */}
              <div className="w-full flex justify-center">
                <span className="w-full text-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs">
                  Browse Products
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Marquee Animation CSS (55s) */}
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 55s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
