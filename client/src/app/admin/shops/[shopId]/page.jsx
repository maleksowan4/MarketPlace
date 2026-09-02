"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminShopDetailsPage({ params }) {
  // Unwrap the Dynamic route params in Next.js
  const unwrappedParams = use(params);
  const shopId = unwrappedParams.shopId;

  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // Redirection guard: Only allow Admins
  useEffect(() => {
    if (!authLoading) {
      const isAdmin = user && (
        user.RoleID === 1 || 
        user.roleId === 1 || 
        user.RoleName?.toLowerCase() === "admin" ||
        user.roleName?.toLowerCase() === "admin"
      );
      if (!isAdmin) {
        router.push("/");
      }
    }
  }, [user, authLoading, router]);

  // Fetch shop details and products
  const fetchShopData = async () => {
    if (!token || !shopId) return;
    try {
      // 1. Fetch shop profile
      const shopRes = await fetch(`http://localhost:5000/api/shops/${shopId}`);
      if (!shopRes.ok) throw new Error("Failed to load shop details.");
      const shopData = await shopRes.json();
      setShop(shopData);

      // 2. Fetch products for this shop
      const prodRes = await fetch(`http://localhost:5000/api/shops/${shopId}/products`);
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.message || "Error loading shop data." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && shopId) {
      fetchShopData();
    }
  }, [token, shopId]);

  // Handle blocking/unblocking the shop
  const handleToggleShopBlock = async () => {
    if (!shop) return;
    setMessage(null);
    try {
      const res = await fetch("http://localhost:5000/api/admin/shops/block", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ shopId: parseInt(shopId), isBlocked: !shop.IsBlocked })
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Shop block status updated successfully!" });
        fetchShopData(); // Refresh details
      } else {
        const txt = await res.text();
        setMessage({ type: "error", text: txt });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Network error updating status." });
    }
  };

  // Admin deletes a product
  const handleDeleteProduct = async (productId) => {
    if (!confirm("Are you sure you want to delete this product as Administrator?")) return;
    setMessage(null);
    try {
      const res = await fetch(`http://localhost:5000/api/admin/products/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Product deleted successfully from marketplace!" });
        fetchShopData(); // Refresh list
      } else {
        const txt = await res.text();
        setMessage({ type: "error", text: txt || "Failed to delete product." });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Network error deleting product." });
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
        <p style={{ color: '#4b5563', fontSize: 16 }}>Loading shop management portal...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 32, fontFamily: "Arial, sans-serif", background: "#f9fafb", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        
        {/* Navigation header */}
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link 
            href="/admin/sellers" 
            style={{
              textDecoration: 'none',
              background: '#ffffff',
              color: '#374151',
              border: '1px solid #d1d5db',
              padding: '8px 16px',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            &larr; Back to Sellers
          </Link>
          <button
            onClick={handleToggleShopBlock}
            style={{
              background: shop?.IsBlocked ? '#10b981' : '#d97706',
              color: '#ffffff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            {shop?.IsBlocked ? '🟢 Unblock Shop' : '⚠️ Block Shop'}
          </button>
        </div>

        {/* Feedback Alert Banner */}
        {message && (
          <div style={{
            background: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fec2c2'}`,
            color: message.type === 'success' ? '#065f46' : '#991b1b',
            borderRadius: 12,
            padding: '12px 16px',
            fontSize: 14,
            fontWeight: 500,
            marginBottom: 20
          }}>
            {message.text}
          </div>
        )}

        {/* Shop Info Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e5e7eb',
          padding: 24,
          marginBottom: 32,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: 20
        }}>
          {shop?.LogoUrl ? (
            <img 
              src={`http://localhost:5002${shop.LogoUrl}`} 
              alt={shop.ShopName} 
              style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 16, border: '1px solid #e5e7eb' }} 
            />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: 16, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 'bold', color: '#9ca3af' }}>
              🏪
            </div>
          )}
          <div>
            <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 'bold', color: '#111827' }}>
              {shop?.ShopName} {shop?.IsBlocked && <span style={{ color: '#ef4444', fontSize: 14, fontWeight: 'bold' }}>(Blocked)</span>}
            </h2>
            <p style={{ margin: '0 0 6px', color: '#4b5563', fontSize: 14 }}>{shop?.Description}</p>
            <p style={{ margin: 0, color: '#9ca3af', fontSize: 12 }}>Seller: {shop?.SellerName}</p>
          </div>
        </div>

        {/* Product Inventory Title */}
        <h3 style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>Shop Inventory</h3>

        {/* 4-Cards-Per-Row Grid */}
        {products.length === 0 ? (
          <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', padding: 48, borderRadius: 16, textAlign: 'center', color: '#6b7280' }}>
            No products found in this shop.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
            {products.map((product) => (
              <div
                key={product.ProductID}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: 14,
                  background: "#ffffff",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  {/* Contain Image Frame */}
                  {product.ImageUrl ? (
                    <div style={{
                      width: '100%',
                      height: 140,
                      background: '#f8fafc',
                      borderRadius: 10,
                      marginBottom: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      border: '1px solid #e5e7eb',
                      padding: 6
                    }}>
                      <img 
                        src={`http://localhost:5003${product.ImageUrl}`} 
                        alt={product.ProductName} 
                        style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                      />
                    </div>
                  ) : (
                    <div style={{ width: '100%', height: 140, background: '#f8fafc', borderRadius: 10, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 12, border: '1px solid #e5e7eb' }}>
                      No Image
                    </div>
                  )}
                  <h4 style={{ margin: "0 0 4px", fontSize: '15px', fontWeight: '700', color: "#111827" }}>{product.ProductName}</h4>
                  <p style={{ margin: "0 0 12px", fontSize: '12px', color: '#6b7280', lineHeight: '1.4', minHeight: '34px' }}>{product.Description}</p>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: '16px', fontWeight: '800', color: '#4f46e5' }}>${product.Price}</span>
                    <span style={{ fontSize: '11px', color: '#374151', background: '#f3f4f6', padding: '3px 8px', borderRadius: '6px' }}>
                      Stock: {product.Quantity}
                    </span>
                  </div>

                  {/* Force delete button */}
                  <button 
                    onClick={() => handleDeleteProduct(product.ProductID)} 
                    style={{ 
                      width: '100%',
                      background: '#fee2e2', 
                      color: '#991b1b', 
                      border: '1px solid #fca5a5', 
                      borderRadius: 8, 
                      padding: '8px 12px', 
                      fontWeight: '600', 
                      fontSize: '12px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'background 0.2s'
                    }}
                  >
                    🗑️ Delete Product
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
