"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function SellerShopSettingsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  // State for shop details & form
  const [shop, setShop] = useState(null);
  const [shopName, setShopName] = useState("");
  const [description, setDescription] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  // Loaders and messages
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  // Auth Guard: Ensure only sellers can access
  useEffect(() => {
    if (!authLoading) {
      const isSeller = user && (
        user.RoleID === 2 || 
        user.roleId === 2 || 
        user.RoleName?.toLowerCase() === "seller" ||
        user.roleName?.toLowerCase() === "seller"
      );
      if (!isSeller) {
        router.push("/");
      }
    }
  }, [user, authLoading, router]);

  // Fetch current seller shop details
  useEffect(() => {
    const fetchShopDetails = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("http://localhost:5000/api/shops/my-shop-details", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setShop(data);
          setShopName(data.ShopName || "");
          setDescription(data.Description || "");
          if (data.LogoUrl) {
            setLogoPreview(`http://localhost:5002${data.LogoUrl}`);
          }
        } else {
          showMessage("error", "Failed to fetch shop details.");
        }
      } catch (err) {
        console.error("Error loading shop details:", err);
        showMessage("error", "Network error. Failed to load shop data.");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      if (user && token) {
        fetchShopDetails();
      } else {
        setLoading(false);
      }
    }
  }, [user, token, authLoading]);

  // Handle image file selection preview
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shopName.trim()) {
      showMessage("error", "Shop name is required.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("shopName", shopName.trim());
      formData.append("description", description.trim());
      if (logoFile) {
        formData.append("logo", logoFile);
      }

      const res = await fetch("http://localhost:5000/api/shops/my-shop", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        showMessage("success", "Shop profile updated successfully!");
        setLogoFile(null);
        // Refresh details
        const refreshed = await fetch("http://localhost:5000/api/shops/my-shop-details", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (refreshed.ok) {
          const updatedData = await refreshed.json();
          setShop(updatedData);
        }
      } else {
        const errorText = await res.text();
        showMessage("error", errorText || "Failed to update shop.");
      }
    } catch (err) {
      console.error("Error updating shop:", err);
      showMessage("error", "Network error. Failed to save changes.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950">Shop Settings & Profile</h1>
          <p className="text-sm text-zinc-500">Customize your storefront name, description, and branding logo.</p>
        </div>
        <Link
          href="/seller/dashboard"
          className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100/50 px-3.5 py-2 rounded-xl transition-all"
        >
          &larr; Back to Dashboard
        </Link>
      </div>

      {/* Floating Alert Messages */}
      {message.text && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-xl border text-sm shadow-xl max-w-md ${
          message.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
            : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {message.text}
        </div>
      )}

      {/* Main Settings Card */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. Shop Logo Section */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-2">Shop Logo / Banner Image</label>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 flex items-center justify-center overflow-hidden shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Shop logo preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-zinc-400">No Logo</span>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-xs text-zinc-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all"
                />
                <p className="text-[11px] text-zinc-400 mt-1.5">Recommended: Square PNG or JPG image, max 5MB.</p>
              </div>
            </div>
          </div>

          {/* 2. Shop Name */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Shop Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Tech Central Store"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          {/* 3. Shop Description */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Shop Description</label>
            <textarea
              rows={4}
              placeholder="Tell buyers about your products, warranty policies, or business..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          {/* 4. Action Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? "Saving changes..." : "Save Shop Profile"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
