"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/config/api";
import { useRouter } from "next/navigation";

import Link from "next/link";

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // Fetch all complaints from backend
  const fetchComplaints = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/complaints`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setComplaints(data);
      } else {
        const txt = await res.text();
        setMessage({ type: "error", text: txt || "Failed to load complaints." });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Network error loading complaints." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchComplaints();
  }, [token]);

  // Handle blocking/unblocking a seller user account
  const handleToggleUserBlock = async (userId, currentBlocked) => {
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/block`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ userId, isBlocked: !currentBlocked })
      });
      if (res.ok) {
        setMessage({ type: "success", text: `Seller block status updated successfully!` });
        fetchComplaints();
      } else {
        const txt = await res.text();
        setMessage({ type: "error", text: txt });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Network error updating block status." });
    }
  };

  // Handle blocking/unblocking a shop
  const handleToggleShopBlock = async (shopId, currentBlocked) => {
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/shops/block`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ shopId, isBlocked: !currentBlocked })
      });
      if (res.ok) {
        setMessage({ type: "success", text: `Shop block status updated successfully!` });
        fetchComplaints();
      } else {
        const txt = await res.text();
        setMessage({ type: "error", text: txt });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Network error updating block status." });
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
        <p style={{ color: '#4b5563', fontSize: 16 }}>Loading complaints dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 32, fontFamily: "Arial, sans-serif", background: "#f9fafb", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 24, borderBottom: '1px solid #e5e7eb', paddingBottom: '16px' }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 'bold', color: '#111827' }}>Admin Panel</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>Review buyer complaints and manage shop block actions.</p>
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

        {/* Complaints Table Container */}
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          {complaints.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#6b7280' }}>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>No complaints submitted yet!</p>
              <p style={{ margin: '4px 0 0', fontSize: 13 }}>Shops and sellers are in good standing.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '14px 16px', color: '#374151', fontWeight: 600 }}>Buyer</th>
                  <th style={{ padding: '14px 16px', color: '#374151', fontWeight: 600 }}>Target Shop</th>
                  <th style={{ padding: '14px 16px', color: '#374151', fontWeight: 600 }}>Seller Account</th>
                  <th style={{ padding: '14px 16px', color: '#374151', fontWeight: 600 }}>Reason / Comment</th>
                  <th style={{ padding: '14px 16px', color: '#374151', fontWeight: 600, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c, idx) => (
                  <tr key={c.ComplaintID} style={{ borderBottom: idx < complaints.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <td style={{ padding: '16px', color: '#111827' }}>
                      <div style={{ fontWeight: 500 }}>{c.BuyerName}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{c.BuyerEmail}</div>
                    </td>
                    <td style={{ padding: '16px', color: '#111827' }}>
                      <span style={{
                        display: 'inline-block',
                        background: '#eef2ff',
                        color: '#3730a3',
                        padding: '4px 8px',
                        borderRadius: 6,
                        fontWeight: 600,
                        fontSize: 12
                      }}>
                        {c.ShopName}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: '#111827' }}>
                      <div style={{ fontWeight: 500 }}>{c.SellerName}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{c.SellerEmail}</div>
                    </td>
                    <td style={{ padding: '16px', color: '#4b5563', fontStyle: 'italic', maxWidth: 300, wordBreak: 'break-word' }}>
                      "{c.Comment}"
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        {/* Toggle block seller */}
                        <button
                          onClick={() => handleToggleUserBlock(c.SellerID, c.SellerBlocked)}
                          style={{
                            background: c.SellerBlocked ? '#10b981' : '#ef4444',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                        >
                          {c.SellerBlocked ? 'Unblock Account' : 'Block Account'}
                        </button>
                        
                        {/* Toggle block shop */}
                        <button
                          onClick={() => handleToggleShopBlock(c.ShopID, c.ShopBlocked)}
                          style={{
                            background: c.ShopBlocked ? '#10b981' : '#f59e0b',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                        >
                          {c.ShopBlocked ? 'Unblock Shop' : 'Block Shop'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
