'use client'
import { useAuth } from '@/context/AuthContext';

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function ProfilePage() { 

      const { user, walletBalance, fetchBalance, token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMessage, setDepositMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');


  useEffect(() => {
    const loadOrders = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/orders/buyer', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Could not load order history.');
        }

        const data = await res.json();
        setOrders(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [token]);

  const handleDepositSubmit = async (event) => {

    event.preventDefault() // preventing refresh browser
    setErrorMessage('')
    setDepositMessage('')

    const amount = parseFloat(depositAmount)
    if(!amount || amount <=0) {  // validate input 
        setErrorMessage('Enter a valid amount')
        return
    }

      try {
    const res = await fetch('http://localhost:5000/api/wallet/deposit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount }),
    });

    if (!res.ok) {
      throw new Error('Deposit failed.');
    }

    const data = await res.json();
        setDepositMessage(data.message || 'Deposit successful!');
    setDepositAmount('');
    fetchBalance();
  } catch (err) {
    setErrorMessage(err.message || 'Deposit failed.');
  }
};




/* Place this at top of render (before blocks 4A-4C) */
if (loading) return <div className="p-8">Loading profile...</div>;

if (!user) {
  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-md text-center">
        <h2 className="text-xl font-semibold">Not signed in</h2>
        <p className="mt-2 text-sm text-zinc-600">Please log in to view your profile and orders.</p>
        <Link href="/login" className="mt-6 inline-flex rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white">
          Sign in
        </Link>
      </div>
    </div>
  );
}

/* Then render main container and include Blocks 4A, 4B, 4C inside it */
return (
  <div className="min-h-screen bg-zinc-50 px-4 py-10 text-zinc-900">
    <div className="mx-auto max-w-5xl space-y-8">
   <section className="rounded-2xl bg-white p-6 shadow-sm">
  <h1 className="text-2xl font-bold">Profile</h1>
  <p className="mt-3 text-sm text-zinc-600">View your account details and wallet balance.</p>

  <div className="mt-6 grid gap-4 sm:grid-cols-2">
    <div>
      <h2 className="text-sm font-semibold text-zinc-700">Name</h2>
      <p className="mt-1 text-base text-zinc-900">{user?.Username || '—'}</p>
    </div>

    <div>
      <h2 className="text-sm font-semibold text-zinc-700">Email</h2>
      <p className="mt-1 text-base text-zinc-900">{user?.Email || '—'}</p>
    </div>

    <div>
      <h2 className="text-sm font-semibold text-zinc-700">Role</h2>
      <p className="mt-1 text-base text-zinc-900">{user?.RoleName || '—'}</p>
    </div>

    <div>
      <h2 className="text-sm font-semibold text-zinc-700">Wallet Balance</h2>
      <p className="mt-1 text-base text-indigo-600">${Number(walletBalance ?? 0).toFixed(2)}</p>
    </div>
  </div>
</section>

{/* Block 4B: deposit form */}
<section className="rounded-2xl bg-white p-6 shadow-sm">
  <h2 className="text-xl font-semibold">Deposit funds</h2>

  <form onSubmit={handleDepositSubmit} className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
    <label className="flex-1">
      <span className="text-sm font-medium text-zinc-700">Amount</span>
      <input
        type="number"
        step="0.01"
        min="0"
        value={depositAmount}
        onChange={(e) => setDepositAmount(e.target.value)}
        className="mt-2 w-full rounded-xl border border-zinc-200 p-3"
        placeholder="Enter amount"
      />
    </label>

    <button
      type="submit"
      className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
    >
      Deposit
    </button>
  </form>

  {depositMessage && <p className="mt-3 text-sm text-emerald-700">{depositMessage}</p>}
  {errorMessage && <p className="mt-3 text-sm text-red-600">{errorMessage}</p>}
</section>


{/* Block 4C: purchase history */}
<section className="rounded-2xl bg-white p-6 shadow-sm">
  <h2 className="text-xl font-semibold">Purchase history</h2>

  {orders.length === 0 ? (
    <p className="mt-4 text-sm text-zinc-600">No purchases yet.</p>
  ) : (
    <div className="mt-4 space-y-4">
      {orders.map((order) => (
        <div key={order.OrderID} className="rounded-2xl border border-zinc-200 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-zinc-900">Order #{order.OrderID}</p>
              <p className="text-sm text-zinc-600">{new Date(order.OrderDate).toLocaleString()}</p>
            </div>

            <div className="text-sm text-zinc-700">
              <span className="font-medium">{order.Status}</span> · ${Number(order.TotalAmount).toFixed(2)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</section>
    </div>
  </div>
);




}