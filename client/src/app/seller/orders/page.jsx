"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/config/api";
import Link from "next/link";

export default function SellerOrdersPage() {
const { user, token, walletBalance, loading: authLoading, updateWalletBalance } = useAuth();
  const router = useRouter();



  // Core states for data and loading
  const [orders, setOrders] = useState([]);                  // Stores grouped orders array from backend
  const [loading, setLoading] = useState(true);              // Tracks if API fetch is in progress
  const [activeTab, setActiveTab] = useState("all");          // Tracks currently active tab: "all", "pending", "accepted"
  const [actionLoading, setActionLoading] = useState(null);   // Tracks OrderID of order currently being accepted

  // Message alert alerts
  const [message, setMessage] = useState({ type: "", text: "" });

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };


  // Redirection guard: Ensure only logged-in sellers can view this page
  useEffect(() => {
    if (!authLoading) {
      const isSeller = user && (
        user.RoleID === 2 || 
        user.roleId === 2 || 
        user.RoleName?.toLowerCase() === "seller" ||
        user.roleName?.toLowerCase() === "seller"
      );
      if (!isSeller) {
        router.push("/"); // Redirect non-sellers to the home page
      }
    }
  }, [user, authLoading, router]);

  // Fetch pre-grouped orders from backend API
  // Fetch pre-grouped orders from backend API
  const fetchOrders = useCallback(async () => {
    const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
    if (!activeToken) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/orders/seller/incoming`, {
        headers: { "Authorization": `Bearer ${activeToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else {
        showMessage("error", "Failed to retrieve incoming orders.");
      }
    } catch (err) {
      console.error("Error fetching incoming orders:", err);
      showMessage("error", "Network error. Failed to load orders.");
    } finally {
      setLoading(false); // Guarantees loading spinner stops
    }
  }, [token]);

  // Load orders once authentication check finishes
  useEffect(() => {
    if (!authLoading) {
      const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
      if (user && activeToken) {
        fetchOrders();
      } else {
        setLoading(false); // Stop loading if guest or token is missing
      }
    }
  }, [user, token, authLoading, fetchOrders]);


  // Accept a pending order and transfer funds
  const handleAcceptOrder = async (orderId) => {
    const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
    if (!activeToken || actionLoading) return;
    
    setActionLoading(orderId); // Start loading spinner for this specific order
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/accept`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${activeToken}`
        }
      });

      if (res.ok) {
        showMessage("success", `Order #${orderId} accepted successfully!`);
        
        // 1. Instantly update the seller's wallet balance in the navbar/context
        if (updateWalletBalance) {
          await updateWalletBalance();
        }
        
        // 2. Refresh the orders list to update statuses
        await fetchOrders();
      } else {
        const errMsg = await res.text();
        showMessage("error", errMsg || "Failed to accept order.");
      }
    } catch (err) {
      console.error("Error accepting order:", err);
      showMessage("error", "Network error. Failed to accept order.");
    } finally {
      setActionLoading(null); // Clear loading state
    }
  };

  // Filter the pre-grouped orders based on the active tab selection
  const filteredOrders = orders.filter(order => {
    if (activeTab === "pending") return order.status === "Pending";
    if (activeTab === "accepted") return order.status === "Accepted";
    return true; // 'all' tab displays everything
  });


  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950">Incoming Orders</h1>
          <p className="text-sm text-zinc-500">Manage buyer requests and accept incoming orders.</p>
        </div>
        <Link 
          href="/seller/dashboard"
          className="text-xs font-bold text-indigo-600 hover:text-indigo-500 bg-indigo-50 hover:bg-indigo-100/50 px-3.5 py-2 rounded-xl transition-all self-start sm:self-center"
        >
          &larr; Back to Dashboard
        </Link>
      </div>

      {/* Alert Messages (Sticky floating Toast) */}
      {message.text && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-xl border text-sm shadow-xl max-w-md ${
          message.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
            : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {message.text}
        </div>
      )}

      {/* Tabs Filter Bar */}
      <div className="flex border-b border-zinc-200 gap-4 mb-6">
        {["all", "pending", "accepted"].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold capitalize transition-all border-b-2 outline-none ${
                isActive 
                  ? "border-indigo-600 text-indigo-600" 
                  : "border-transparent text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {tab} Orders
            </button>
          );
        })}
      </div>

            {/* Loader Spinner */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      ) : filteredOrders.length === 0 ? (
        /* Empty State Illustration */
        <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center shadow-sm">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-50 text-zinc-400 mb-4 border border-zinc-100">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-zinc-900">No orders found</h3>
          <p className="text-xs text-zinc-500 mt-1 capitalize">There are currently no {activeTab !== "all" ? activeTab : ""} orders.</p>
        </div>
      ) : (
        /* Grouped Orders list */
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const isPending = order.status === "Pending";
            return (
              <div 
                key={order.orderId}
                className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Order Card Header */}
                <div className="bg-zinc-50 border-b border-zinc-100 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-zinc-950">Order #{order.orderId}</span>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      {new Date(order.orderDate).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500 font-medium">Buyer: <span className="font-semibold text-zinc-700">{order.buyerName}</span></span>
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      isPending 
                        ? "bg-amber-50 text-amber-800 border border-amber-100" 
                        : "bg-emerald-50 text-emerald-800 border border-emerald-100"
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Order Itemized Products Table */}
                <div className="p-4 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-100 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                        <th className="pb-2">Product</th>
                        <th className="pb-2 text-center">Qty</th>
                        <th className="pb-2 text-right">Unit Price</th>
                        <th className="pb-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {order.items.map((item, idx) => (
                        <tr key={idx} className="text-xs text-zinc-700">
                          <td className="py-2.5 font-medium text-zinc-900">{item.productName}</td>
                          <td className="py-2.5 text-center">{item.quantity}</td>
                          <td className="py-2.5 text-right">${Number(item.unitPrice).toFixed(2)}</td>
                          <td className="py-2.5 text-right font-medium text-zinc-950">${item.totalPrice.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Card Footer: Summary & Accept Action */}
                <div className="border-t border-zinc-100 p-4 bg-zinc-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm">
                    <span className="text-zinc-500">Order Revenue:</span>{" "}
                    <span className="font-extrabold text-zinc-900 text-lg">${order.total.toFixed(2)}</span>
                  </div>
                  {isPending && (
                    <button
                      onClick={() => handleAcceptOrder(order.orderId)}
                      disabled={actionLoading !== null}
                      className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-1.5"
                    >
                      {actionLoading === order.orderId ? (
                        <>
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Accepting...
                        </>
                      ) : (
                        "Accept Order"
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


