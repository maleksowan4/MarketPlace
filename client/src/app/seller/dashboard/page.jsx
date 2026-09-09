"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL, PRODUCT_SERVICE_BASE_URL, getProductImageUrl } from "@/config/api";
import Link from "next/link";


// --- HELPERS & GRAPHICS: SVG DONUT/PIE CHART ---
function ProductSalesPieChart({ data, totalSales }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#06b6d4", "#ec4899"];

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-zinc-50 rounded-xl border border-dashed border-zinc-200 p-6 text-zinc-500">
        <p className="text-sm font-medium">No sales data available to show breakdown.</p>
        <p className="text-xs text-zinc-400 mt-1">Accept some orders to view product sales.</p>
      </div>
    );
  }

  const radius = 50;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius; // ~314.16
  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* SVG Donut Circle */}
      <div className="relative w-40 h-40 flex-shrink-0">
        <svg viewBox="0 0 120 120" className="w-full h-full">
          <circle cx="60" cy="60" r={radius} fill="transparent" stroke="#f4f4f5" strokeWidth={strokeWidth} />
          {data.map((slice, index) => {
            const percentage = slice.value / totalSales;
            const strokeLength = percentage * circumference;
            const currentRotation = -90 + (accumulatedPercent * 360);
            accumulatedPercent += percentage;
            const isHovered = hoveredIndex === index;

            return (
              <circle
                key={index}
                cx="60"
                cy="60"
                r={radius}
                fill="transparent"
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                strokeDasharray={`${strokeLength} ${circumference}`}
                strokeDashoffset="0"
                transform={`rotate(${currentRotation} 60 60)`}
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </svg>

        {/* Center Display labels */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-2">
          {hoveredIndex !== null ? (
            <>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider truncate max-w-[110px]">
                {data[hoveredIndex].name}
              </span>
              <span className="text-lg font-extrabold text-zinc-800">
                ${data[hoveredIndex].value.toFixed(2)}
              </span>
            </>
          ) : (
            <>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Sales</span>
              <span className="text-lg font-extrabold text-zinc-800">${totalSales.toFixed(2)}</span>
            </>
          )}
        </div>
      </div>

      {/* Legend list on the side */}
      <div className="flex-1 w-full space-y-2 max-h-52 overflow-y-auto overflow-x-hidden pr-1">
        {data.map((slice, index) => {
          const percentage = ((slice.value / totalSales) * 100).toFixed(1);
          return (
            <div 
              key={index} 
              className={`flex items-center justify-between text-xs p-1.5 rounded-lg transition-colors ${
                hoveredIndex === index ? "bg-zinc-50" : ""
              }`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span 
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                />
                <span className="font-medium text-zinc-700 truncate">{slice.name}</span>
              </div>
              <span className="font-bold text-zinc-900 ml-4 flex-shrink-0">
                ${slice.value.toFixed(2)} ({percentage}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- HELPERS & GRAPHICS: SVG LINE CHART ---
function WeeklySalesLineChart({ data }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const maxAmount = Math.max(...data.map(d => d.amount), 10);
  const svgWidth = 500;
  const svgHeight = 200;
  const paddingX = 40;
  const paddingY = 30;

  const chartWidth = svgWidth - 2 * paddingX;
  const chartHeight = svgHeight - 2 * paddingY;

  const points = data.map((d, index) => {
    const x = paddingX + (index * chartWidth) / (data.length - 1);
    const y = svgHeight - paddingY - (d.amount / maxAmount) * chartHeight;
    return { x, y, label: d.label, date: d.date, amount: d.amount };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`
    : "";

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto">
        <defs>
          <linearGradient id="lineAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal Background Gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
          const y = paddingY + ratio * chartHeight;
          return (
            <line
              key={index}
              x1={paddingX}
              y1={y}
              x2={svgWidth - paddingX}
              y2={y}
              stroke="#f4f4f5"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          );
        })}

        {areaPath && <path d={areaPath} fill="url(#lineAreaGradient)" />}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="#6366f1"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {hoveredPoint !== null && (
          <line
            x1={points[hoveredPoint].x}
            y1={paddingY}
            x2={points[hoveredPoint].x}
            y2={svgHeight - paddingY}
            stroke="#e4e4e7"
            strokeWidth="1.5"
          />
        )}

        {points.map((p, i) => {
          const isHovered = hoveredPoint === i;
          return (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={isHovered ? 6 : 4}
                fill={isHovered ? "#6366f1" : "#ffffff"}
                stroke="#6366f1"
                strokeWidth={isHovered ? 3 : 2}
                className="transition-all duration-150"
              />
              <circle
                cx={p.x}
                cy={p.y}
                r="16"
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(i)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            </g>
          );
        })}

        {points.map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={svgHeight - 10}
            textAnchor="middle"
            className="text-[10px] fill-zinc-400 font-bold"
          >
            {p.label}
          </text>
        ))}

        <text x={10} y={paddingY + 4} className="text-[9px] fill-zinc-400 font-bold">${maxAmount.toFixed(0)}</text>
        <text x={10} y={svgHeight - paddingY + 4} className="text-[9px] fill-zinc-400 font-bold">$0</text>
      </svg>

      {hoveredPoint !== null && (
        <div 
          className="absolute z-10 bg-zinc-950 text-white rounded-lg p-2 shadow-lg border border-zinc-800 text-[11px] pointer-events-none transition-all duration-150"
          style={{
            left: `${(points[hoveredPoint].x / svgWidth) * 100}%`,
            top: `${(points[hoveredPoint].y / svgHeight) * 100 - 32}%`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="font-semibold">{points[hoveredPoint].date}</div>
          <div className="font-bold text-indigo-300">Sales: ${points[hoveredPoint].amount.toFixed(2)}</div>
        </div>
      )}
    </div>
  );
}

export default function SellerDashboard() { 
  const { user, token, walletBalance, loading: authLoading, fetchBalance } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shopBlocked, setShopBlocked] = useState(false);

  useEffect(() => {
    const checkShopBlock = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE_URL}/shops/my-shop-details`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const shop = await res.json();
          setShopBlocked(shop.IsBlocked);
        }
      } catch (err) {
        console.error("Error checking shop block:", err);
      }
    };
    checkShopBlock();
  }, [token]);

  const [productForm, setProductForm] = useState({
    productName: "",
    price: "",
    quantity: ""
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [editFile, setEditFile] = useState(null);

  const [editingProductId, setEditingProductId] = useState(null);
  const [editForm, setEditForm] = useState({ productName: "", price: "", quantity: "" });

  const [stats, setStats] = useState({
    TotalSales: 0,
    AcceptedOrdersCount: 0,
    PendingOrdersCount: 0
  });

  const [message, setMessage] = useState({ type: "", text: "" });
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  // Fetch seller's products from the backend API
  const fetchProducts = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/products/seller`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  }, [token]);

  // Fetch pre-calculated stats from the backend
  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/orders/seller/stats`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, [token]);

  // Fetch detailed list of seller orders (items, dates, status, names)
  const fetchOrders = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/orders/seller`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  }, [token]);

  // Load products, stats, and orders when user logs in
  useEffect(() => {
    if (user && token) {
      fetchProducts();
      fetchStats();
      fetchOrders();
      if (fetchBalance) fetchBalance();
    }
  }, [user, token, fetchProducts, fetchStats, fetchOrders, fetchBalance]);

  // 1. Process data for Product Sales Pie (Donut) Chart
  const productSalesMap = {};
  orders.forEach(order => {
    if (order.Status === "Accepted") {
      const salesValue = Number(order.Quantity) * Number(order.UnitPrice);
      productSalesMap[order.ProductName] = (productSalesMap[order.ProductName] || 0) + salesValue;
    }
  });

  const pieChartData = Object.entries(productSalesMap).map(([name, value]) => ({
    name,
    value
  })).sort((a, b) => b.value - a.value);

  const totalSalesVal = pieChartData.reduce((sum, item) => sum + item.value, 0);

  // 2. Process data for Weekly Sales Line Chart (last 7 days, including today)
  const past7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    past7Days.push(d);
  }

  const lineChartData = past7Days.map(dayDate => {
    const dayStart = dayDate.getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;

    const daySales = orders.reduce((sum, order) => {
      if (order.Status === "Accepted" && order.OrderDate) {
        const orderTime = new Date(order.OrderDate).getTime();
        if (orderTime >= dayStart && orderTime < dayEnd) {
          return sum + (Number(order.Quantity) * Number(order.UnitPrice));
        }
      }
      return sum;
    }, 0);

    return {
      label: dayDate.toLocaleDateString(undefined, { weekday: 'short' }),
      date: dayDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      amount: daySales
    };
  });

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const { productName, price, quantity } = productForm;
    if (!productName.trim() || !price || !quantity) {
      showMessage("error", "Please fill in all fields.");
      return;
    }

    try {
      const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
      const formData = new FormData();
      formData.append("productName", productName.trim());
      formData.append("price", parseFloat(price));
      formData.append("quantity", parseInt(quantity));
      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      const res = await fetch(`${API_BASE_URL}/products`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${activeToken}`
        },
        body: formData
      });

      if (res.ok) {
        showMessage("success", "Product added successfully!");
        setProductForm({ productName: "", price: "", quantity: "" });
        setSelectedFile(null);
        const fileInput = document.getElementById("productImageInput");
        if (fileInput) fileInput.value = "";
        fetchProducts();
        fetchStats();
        fetchOrders();
      } else {
        const errorText = await res.text();
        showMessage("error", errorText || "Failed to add product.");
      }
    } catch (err) {
      console.error("Error adding product:", err);
      showMessage("error", "Network error. Failed to add product.");
    }
  };

  const handleStartEdit = (product) => {
    setEditingProductId(product.ProductID);
    setEditForm({
      productName: product.ProductName,
      price: product.Price,
      quantity: product.Quantity
    });
  };

  const handleUpdateProduct = async (e, productId) => {
    e.preventDefault();
    const { productName, price, quantity } = editForm;
    if (!productName.trim() || price === "" || quantity === "") {
      showMessage("error", "Please fill in all fields.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("productName", productName.trim());
      formData.append("price", parseFloat(price));
      formData.append("quantity", parseInt(quantity));
      if (editFile) {
        formData.append("image", editFile);
      }

      const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        showMessage("success", "Product updated successfully!");
        setEditingProductId(null);
        setEditFile(null);
        fetchProducts();
        fetchStats();
      } else {
        const errorText = await res.text();
        showMessage("error", errorText || "Failed to update product.");
      }
    } catch (err) {
      console.error("Error updating product:", err);
      showMessage("error", "Network error. Failed to update product.");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        showMessage("success", "Product deleted successfully!");
        fetchProducts();
        fetchStats();
      } else {
        const errorText = await res.text();
        showMessage("error", errorText || "Failed to delete product.");
      }
    } catch (err) {
      console.error("Error deleting product:", err);
      showMessage("error", "Network error. Failed to delete product.");
    }
  };

  if (shopBlocked) {
    return (
      <div className="max-w-xl mx-auto mt-12 p-8 bg-red-50 border border-red-200 rounded-2xl shadow-sm text-center">
        <h2 className="text-xl font-bold text-red-800 mb-2">⚠️ Shop Blocked</h2>
        <p className="text-sm text-red-600 mb-4">
          Your shop has been blocked by the Administrator. You cannot list or manage products at this time.
        </p>
        <p className="text-xs text-zinc-500 font-medium">Please contact the Administrator at support@market.com for more details.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Seller Dashboard</h1>

      {/* Top Section Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Left Column: 4 Stats Cards (2x2 Grid) */}
        <div className="lg:col-span-1 grid grid-cols-2 gap-4 h-fit">
          {/* Card 1: Total Sales */}
          <div className="bg-white border border-zinc-200 p-4 rounded-xl shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Total Sales</span>
            <div className="mt-2 text-xl font-extrabold text-zinc-900 truncate">
              ${Number(stats.TotalSales || 0).toFixed(2)}
            </div>
          </div>

          {/* Card 2: Wallet Balance */}
          <div className="bg-white border border-zinc-200 p-4 rounded-xl shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Wallet Balance</span>
            <div className="mt-2 text-xl font-extrabold text-emerald-600 truncate">
              ${Number(walletBalance || 0).toFixed(2)}
            </div>
          </div>

          {/* Card 3: Accepted Orders */}
          <div className="bg-white border border-zinc-200 p-4 rounded-xl shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Accepted Orders</span>
            <div className="mt-2 text-xl font-extrabold text-zinc-900">
              {stats.AcceptedOrdersCount}
            </div>
          </div>

          {/* Card 4: Pending Orders */}
          <div className="bg-white border border-zinc-200 p-4 rounded-xl shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Pending Orders</span>
            <div className="mt-2 text-xl font-extrabold text-zinc-900">
              {stats.PendingOrdersCount}
            </div>
          </div>

          {/* Card 5: Average Order Value (AOV) */}
          <div className="bg-white border border-zinc-200 p-4 rounded-xl shadow-sm flex flex-col justify-between col-span-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Average Order Value (AOV)</span>
            <div className="mt-2 text-xl font-extrabold text-indigo-600">
              ${(stats.AcceptedOrdersCount > 0 ? (Number(stats.TotalSales || 0) / stats.AcceptedOrdersCount) : 0).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Right Column: Two Diagrams (Horizontal Side-by-Side Grid) */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Sales Pie/Donut Chart */}
          <div className="bg-white border border-zinc-200 p-5 rounded-xl shadow-sm flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="text-xs font-bold text-zinc-900">Product Sales Breakdown</h3>
              <p className="text-[10px] text-zinc-500">Distribution of revenue among accepted orders</p>
            </div>
            <ProductSalesPieChart data={pieChartData} totalSales={totalSalesVal} />
          </div>

          {/* Weekly Sales Line Chart */}
          <div className="bg-white border border-zinc-200 p-5 rounded-xl shadow-sm flex flex-col justify-between">
            <div className="mb-4 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-zinc-900">Sales Trend</h3>
                <p className="text-[10px] text-zinc-500">Daily accepted orders value (past 7 days)</p>
              </div>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                Weekly
              </span>
            </div>
            <div className="mt-auto">
              <WeeklySalesLineChart data={lineChartData} />
            </div>
          </div>
        </div>

      </div>



      {/* Alert Message Box (Sticky floating Toast) */}
      {message.text && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-xl border text-sm shadow-xl max-w-md ${
          message.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
            : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {message.text}
        </div>
      )}

       {/* Add New Product Form Card */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4 text-zinc-950">Add New Product</h2>
        <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
          
          {/* 1. Product Name */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Product Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Wireless Mouse"
              className="w-full rounded-xl border border-zinc-300 bg-white p-2.5 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder-zinc-400"
              value={productForm.productName}
              onChange={(e) => setProductForm({ ...productForm, productName: e.target.value })}
            />
          </div>
          
          {/* 2. Price */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Price ($)</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="e.g. 19.99"
              className="w-full rounded-xl border border-zinc-300 bg-white p-2.5 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder-zinc-400"
              value={productForm.price}
              onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
            />
          </div>
          
          {/* 3. Quantity */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Stock Quantity</label>
            <input
              type="number"
              required
              placeholder="e.g. 10"
              className="w-full rounded-xl border border-zinc-300 bg-white p-2.5 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder-zinc-400"
              value={productForm.quantity}
              onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })}
            />
          </div>

          {/* 4. Product Image Upload */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Product Image</label>
            <input
              id="productImageInput"
              type="file"
              accept="image/*"
              className="w-full text-xs text-zinc-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />
          </div>
          
          {/* 5. Submit Button */}
          <div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm py-2.5 rounded-xl transition-all shadow-sm h-[42px] active:scale-[0.98]"
            >
              Add Product
            </button>
          </div>
          
        </form>
      </div>

      
      {/* My Products List Card */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <h2 className="text-lg font-bold mb-4">My Products</h2>
        {products.length === 0 ? (
          <p className="text-zinc-500 text-sm">No products listed yet.</p>
        ) : (
          <div className="grid gap-4">
            {products.map((p) => {
              const isEditing = editingProductId === p.ProductID;
              return isEditing ? (
                /* Edit Mode: Inline Form */
                <div key={p.ProductID} className="border border-zinc-200 rounded-lg p-4 bg-zinc-50 flex flex-col gap-4">
                  <form onSubmit={(e) => handleUpdateProduct(e, p.ProductID)} className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end w-full">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 mb-1">Product Name</label>
                      <input
                        type="text"
                        required
                        className="w-full rounded-lg border border-zinc-300 bg-white p-2 text-xs text-zinc-900 outline-none focus:border-indigo-500 transition-colors"
                        value={editForm.productName}
                        onChange={(e) => setEditForm({ ...editForm, productName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 mb-1">Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        className="w-full rounded-lg border border-zinc-300 bg-white p-2 text-xs text-zinc-900 outline-none focus:border-indigo-500 transition-colors"
                        value={editForm.price}
                        onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 mb-1">Stock Quantity</label>
                      <input
                        type="number"
                        required
                        className="w-full rounded-lg border border-zinc-300 bg-white p-2 text-xs text-zinc-900 outline-none focus:border-indigo-500 transition-colors"
                        value={editForm.quantity}
                        onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 mb-1">New Image File</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="w-full text-[10px] text-zinc-500"
                        onChange={(e) => setEditFile(e.target.files[0])}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-lg transition-colors shadow-sm"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingProductId(null)}
                        className="flex-1 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-bold text-xs py-2.5 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* View Mode: Product Details & Actions */
                <div key={p.ProductID} className="border border-zinc-100 rounded-lg p-4 flex justify-between items-center bg-zinc-50 hover:bg-zinc-100/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {p.ImageUrl && (
                      <img 
                        src={getProductImageUrl(p.ImageUrl)} 
                        alt={p.ProductName} 
                        className="w-12 h-12 object-cover rounded-lg border border-zinc-200"
                      />
                    )}
                    <div>
                      <h3 className="font-bold text-zinc-950">{p.ProductName}</h3>
                      <p className="text-sm text-zinc-500">Price: ${p.Price} | Stock: {p.Quantity}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStartEdit(p)}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs py-1.5 px-3.5 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.ProductID)}
                      className="bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs py-1.5 px-3.5 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}



  
