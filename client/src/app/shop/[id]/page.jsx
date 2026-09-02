"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function ShopPage({ params: paramsPromise }) {


    const params = use(paramsPromise)
    const shopId = parseInt(params.id)

const { user, token } = useAuth();
     const router = useRouter()
 
//=============================state hooks==============================

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantities, setQuantities] = useState({});// Object to hold selected quantities for each product
  const [cartItemCount, setCartItemCount] = useState(0);
  const [cartMessage, setCartMessage] = useState("")

    // Complaint modal states
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [complaintComment, setComplaintComment] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!complaintComment.trim()) return;

    setReportLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          shopId, 
          comment: complaintComment.trim() 
        })
      });

      if (res.ok) {
        alert("Report submitted successfully to the administrator!");
        setIsReportModalOpen(false);
        setComplaintComment("");
      } else {
        const errMsg = await res.text();
        alert(errMsg || "Failed to submit report.");
      }
    } catch (err) {
      console.error("Error reporting shop:", err);
      alert("Network error. Failed to report shop.");
    } finally {
      setReportLoading(false);
    }
  };



  const [addedStatus, setAddedStatus] = useState({});

  const readCart = () => {
    try {
      const cartString = localStorage.getItem("cart");
      const cart = JSON.parse(cartString || "[]") || [];
      return cart;
    } catch (error) {
      console.error("Error reading cart:", error);
      return [];
    }
  };

  const saveCart = (cart) => {
    localStorage.setItem("cart", JSON.stringify(cart));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("cart_updated"));
    }
  };

useEffect(() => {

  const updateCartCount = () => {

    try {

      const cart = readCart() || []

      const totalItemsCount = cart.reduce(
        (total, item) => total + item.Quantity,
        0
      )

      setCartItemCount(totalItemsCount)

    } catch (error) {

      console.error("Failed to update cart count", error)
      setCartItemCount(0)

    }
  }

  // Run once on page load
  updateCartCount()

  // Listen for storage and cart updates
  window.addEventListener("storage", updateCartCount)
  window.addEventListener("cart_updated", updateCartCount)

  // Cleanup
  return () => {
    window.removeEventListener("storage", updateCartCount)
    window.removeEventListener("cart_updated", updateCartCount)
  }

}, [])

useEffect(  ()=>  {

  const fetchShopData = async () => {

    try {
      const shopRes = await fetch(`http://localhost:5000/api/shops/${shopId}`)

      if (!shopRes.ok) {
                throw new Error("Shop not found");

      }

      const shopData = await shopRes.json() 

      setShop(shopData) 

      const productRes = await fetch(`http://localhost:5000/api/shops/${shopId}/products`)

      if(!productRes.ok) {
        throw new Error ("Failed to fetch data")
      }
      const productData = await productRes.json() 
      setProducts(productData)

      const initializeQuantities = {};
      productData.forEach((product) => {
        initializeQuantities[product.ProductID] = 1;
      });
      setQuantities(initializeQuantities);


    }



    catch (error) {
      console.error("Storefront fetch error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

    fetchShopData();


  }
,[shopId])

const updateQuantity = (productId, amount, stock) => {
  setQuantities((prev) => {
    const current = prev[productId] || 1;
    const next = current + amount;

    if (next < 1 || next > stock) {
      return prev;
    }

    return {
      ...prev,
      [productId]: next,
    };
  });
};

const addToCart = (product) => {
  const selectedQuantity = quantities[product.ProductID] || 1;

  const cart = readCart() || [];

  const newItem = {
    ProductID: product.ProductID,
    ProductName: product.ProductName,
    Price: product.Price,
    Quantity: selectedQuantity,
    ShopID: shopId,
    ShopName: shop?.ShopName || "Shop",
  };

  if (cart.length > 0 && cart[0].ShopID !== shopId) {
    alert("You have items from another shop. Clear cart to continue.");
    return;
  }

  const existingItem = cart.find(
    (item) => item.ProductID === product.ProductID && item.ShopID === shopId
  );

  let nextCart = [];

  if (existingItem) {
    nextCart = cart.map((item) =>
      item.ProductID === product.ProductID && item.ShopID === shopId
        ? { ...item, Quantity: item.Quantity + selectedQuantity }
        : item
    );
  } else {
    nextCart = [...cart, newItem];
  }

  saveCart(nextCart);
  setAddedStatus((prev) => ({ ...prev, [product.ProductID]: true }));
  setTimeout(() => {
    setAddedStatus((prev) => ({ ...prev, [product.ProductID]: false }));
  }, 1800);
};

const clearCartAndContinue = (product) => {
  const selectedQuantity = quantities[product.ProductID] || 1;

  const newItem = {
    ProductID: product.ProductID,
    ProductName: product.ProductName,
    Price: product.Price,
    Quantity: selectedQuantity,
    ShopID: shopId,
    ShopName: shop?.ShopName || "Shop",
  };

  saveCart([newItem]);
};

if (loading) {
  return <div>Loading shop...</div>;
}

if (error) {
  return <div>Error: {error}</div>;
}

return (
  <div style={{ padding: 24, fontFamily: "Arial, sans-serif", background: "#ffffff", color: "#111111", minHeight: "100vh" }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
      {shop?.LogoUrl && (
        <img 
          src={`http://localhost:5002${shop.LogoUrl}`} 
          alt={shop.ShopName} 
          style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 12, border: '1px solid #e4e4e7' }} 
        />
      )}
      <div>
        <h1 style={{ margin: '0 0 4px', color: "#111111" }}>{shop?.ShopName}</h1>
        <p style={{ margin: '0 0 4px', color: "#222222" }}>{shop?.Description}</p>
        <p style={{ margin: 0, color: "#666666", fontSize: '13px' }}>Owner: {shop?.SellerName}</p>
      </div>
    </div>

    {token && (user?.RoleName?.toLowerCase() === "buyer" || user?.roleName?.toLowerCase() === "buyer" || user?.roleId === 3 || user?.RoleID === 3) && (
      <button 
        type="button"
        onClick={() => setIsReportModalOpen(true)}
        style={{ 
          background: '#fef2f2', 
          color: '#991b1b', 
          padding: '6px 12px', 
          border: '1px solid #fee2e2', 
          borderRadius: 8, 
          fontWeight: 600, 
          fontSize: '12px', 
          cursor: 'pointer', 
          marginBottom: 20 
        }}
      >
        ⚠️ Report Shop / File Complaint
      </button>
    )}

    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <h2 style={{ marginBottom: 0, color: "#111111" }}>Products</h2>
      <Link href="/cart" style={{ background: '#eef2ff', color: '#3730a3', padding: '6px 10px', borderRadius: 8, fontWeight: 600, textDecoration: 'none' }}>
        View cart ({cartItemCount})
      </Link>
    </div>

    {cartMessage && (
      <p style={{ color: "green", fontWeight: "bold" }}>{cartMessage}</p>
    )}

    <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
      {products.map((product) => (
        <div
          key={product.ProductID}
          style={{
            border: "1px solid #f4f4f5",
            borderRadius: 14,
            padding: 14,
            background: "#ffffff",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        >
          <div>
            {product.ImageUrl ? (
              <div style={{
                width: '100%',
                height: 150,
                background: '#f8fafc',
                borderRadius: 10,
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: '1px solid #f1f5f9',
                padding: 6
              }}>
                <img 
                  src={`http://localhost:5003${product.ImageUrl}`} 
                  alt={product.ProductName} 
                  style={{
                    maxHeight: '100%',
                    maxWidth: '100%',
                    objectFit: 'contain'
                  }}
                />
              </div>
            ) : (
              <div style={{
                width: '100%',
                height: 150,
                background: '#f8fafc',
                borderRadius: 10,
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                fontSize: '12px',
                fontWeight: '600',
                border: '1px solid #f1f5f9'
              }}>
                No Image
              </div>
            )}
            <h3 style={{ margin: "0 0 4px", fontSize: '13px', fontWeight: '700', color: "#09090b" }}>{product.ProductName}</h3>
            <p style={{ margin: "0 0 10px", fontSize: '11px', color: "#71717a", lineHeight: '1.3', minHeight: '30px' }}>{product.Description}</p>
          </div>
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#18181b' }}>${product.Price}</span>
              <span style={{ 
                fontSize: '10px', 
                fontWeight: '600',
                color: '#18181b', 
                background: '#f4f4f5', 
                padding: '2px 6px', 
                borderRadius: '4px' 
              }}>
                Stock: {product.Quantity}
              </span>
            </div>

            {/* Quantity Selector - Moved ABOVE button */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#71717a' }}>Select Quantity:</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: '#f4f4f5', borderRadius: 6, padding: '2px' }}>
                <button 
                  onClick={() => updateQuantity(product.ProductID, -1, product.Quantity)} 
                  style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '4px', 
                    border: 'none', 
                    background: '#ffffff', 
                    fontSize: '12px', 
                    fontWeight: 'bold',
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                >
                  -
                </button>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#18181b', minWidth: '14px', textAlign: 'center' }}>
                  {quantities[product.ProductID] || 1}
                </span>
                <button 
                  onClick={() => updateQuantity(product.ProductID, 1, product.Quantity)} 
                  style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '4px', 
                    border: 'none', 
                    background: '#ffffff', 
                    fontSize: '12px', 
                    fontWeight: 'bold',
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Standalone Add to Cart Button */}
            <button 
              onClick={() => addToCart(product)} 
              style={{ 
                width: '100%',
                height: '36px',
                background: addedStatus[product.ProductID] ? '#047857' : '#059669', 
                color: '#ffffff', 
                border: 'none', 
                borderRadius: 6, 
                fontWeight: '600', 
                fontSize: '12px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'background 0.2s ease',
                display: 'block'
              }}
            >
              {addedStatus[product.ProductID] ? "✓ Added to cart!" : "Add to cart"}
            </button>
          </div>
        </div>
      ))}
    </div>

    {cartItemCount > 0 && (
      <p style={{ marginTop: 20, color: "#444" }}>Cart contains items from this shop</p>
    )}
    {/* Complaint Modal Overlay */}
    {isReportModalOpen && (
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.4)',
        padding: 16
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          padding: 24,
          maxWidth: 400,
          width: '100%',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 'bold', color: '#111827' }}>Report Shop</h3>
          <p style={{ margin: '0 0 16px', fontSize: 12, color: '#6b7280' }}>Please describe your complaint in detail below.</p>
          
          <form onSubmit={handleReportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <textarea
              required
              rows={4}
              value={complaintComment}
              onChange={(e) => setComplaintComment(e.target.value)}
              placeholder="e.g. Seller is selling counterfeit items or not delivering..."
              style={{
                width: '100%',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                padding: 12,
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'none'
              }}
            />
            
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                type="submit" 
                disabled={reportLoading}
                style={{ 
                  flex: 1, 
                  background: '#4f46e5', 
                  color: '#ffffff', 
                  border: 'none', 
                  borderRadius: 10, 
                  padding: '10px', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  fontSize: 13
                }}
              >
                {reportLoading ? "Submitting..." : "Submit"}
              </button>
              <button 
                type="button" 
                onClick={() => setIsReportModalOpen(false)}
                style={{ 
                  flex: 1, 
                  background: '#f3f4f6', 
                  color: '#374151', 
                  border: 'none', 
                  borderRadius: 10, 
                  padding: '10px', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  fontSize: 13
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
);


}








