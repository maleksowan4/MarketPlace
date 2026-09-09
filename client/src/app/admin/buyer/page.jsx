"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/config/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminBuyersPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [buyers, setBuyers] = useState([]);
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

  // Fetch list of buyers
  const fetchBuyers = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/buyers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBuyers(data);
      } else {
        setMessage({ type: "error", text: "Failed to load buyers list." });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Network error loading buyers." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBuyers();
    }
  }, [token]);

  // Toggle blocking/unblocking a buyer user account
  const handleToggleBlock = async (userId, currentBlocked) => {
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/block`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId, isBlocked: !currentBlocked })
      });

      if (res.ok) {
        setMessage({
          type: "success",
          text: `Buyer account status updated successfully!`
        });
        fetchBuyers(); // Refresh data
      } else {
        const txt = await res.text();
        setMessage({ type: "error", text: txt });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Network error updating status." });
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
        <p style={{ color: '#4b5563', fontSize: 16 }}>Loading buyers directory...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 32, fontFamily: "Arial, sans-serif", background: "#f9fafb", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 'bold', color: '#111827' }}>Buyers Directory</h1>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b7280' }}>Manage buyer accounts and review wallet balances.</p>
          </div>
          <Link 
            href="/admin/dashboard" 
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
            &larr; Back to Dashboard
          </Link>
        </div>

        {/* Feedback Messages Banner */}
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

        {/* Buyers Table */}
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          {buyers.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#6b7280' }}>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>No buyers registered yet.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '14px 16px', color: '#374151', fontWeight: 600 }}>Buyer Profile</th>
                  <th style={{ padding: '14px 16px', color: '#374151', fontWeight: 600 }}>Wallet Balance</th>
                  <th style={{ padding: '14px 16px', color: '#374151', fontWeight: 600 }}>Account Status</th>
                  <th style={{ padding: '14px 16px', color: '#374151', fontWeight: 600 }}>Joined Date</th>
                  <th style={{ padding: '14px 16px', color: '#374151', fontWeight: 600, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {buyers.map((b, idx) => (
                  <tr key={b.UserID} style={{ borderBottom: idx < buyers.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 600, color: '#111827' }}>{b.Username}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{b.Email}</div>
                    </td>
                    <td style={{ padding: '16px', color: '#111827', fontWeight: 600 }}>
                      ${Number(b.Balance || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '16px' }}>
                      {b.IsBlocked ? (
                        <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Blocked</span>
                      ) : (
                        <span style={{ color: '#10b981', fontWeight: 'bold' }}>Active</span>
                      )}
                    </td>
                    <td style={{ padding: '16px', color: '#6b7280' }}>
                      {new Date(b.CreatedAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      {/* Toggle Account Block */}
                      <button
                        onClick={() => handleToggleBlock(b.UserID, b.IsBlocked)}
                        style={{
                          background: b.IsBlocked ? '#10b981' : '#ef4444',
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
                        {b.IsBlocked ? 'Unblock Buyer' : 'Block Buyer'}
                      </button>
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
