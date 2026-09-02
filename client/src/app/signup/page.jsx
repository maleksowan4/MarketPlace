
'use client' 
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {




    const router = useRouter() 

    const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("buyer");
   const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);


  const handleSubmit = async (e) => {

    e.preventDefault()

    setError("")
    setSuccess("")
    setLoading(true) // to prevent double-clicks

    try {

        const res = await fetch("http://localhost:5000/api/users", {

            method : "POST", 
            headers : {

                "Content-Type": "application/json"
            }, 
            body : JSON.stringify({username,email,password,role})
        })

            const  message = await res.text()

            if(res.ok) {

                setSuccess("Account created successfully! Redirecting to login page...")
                setUsername("");
        setEmail("");
        setPassword("");
        setRole("buyer");

        setTimeout(() => {

            router.push("/login")
            
        }, 2000);
            }

            else {
                setError(message || "Registration failed. Please try again.")
            }

    }


    catch (err) {
      console.error("Signup Connection Error:", err);
      setError("Cannot connect to server. Please check your network connection.");
    } finally {
      setLoading(false); // Enable the register button again
    }


  }

   return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        
        {/* Title */}
        <div className="text-center">
          <img 
            src="/logo.png" 
            alt="MarketPortal Logo" 
            className="mx-auto w-12 h-12 object-contain mb-4 rounded-lg"
          />
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Create Account</h2>
          <p className="mt-2 text-sm text-zinc-500">Choose your role and start your journey</p>
        </div>
        {/* Success Alert */}
        {success && (
          <div className="rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-600 border border-emerald-200">
            {success}
          </div>
        )}
        {/* Error Alert */}
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600 border border-red-200">
            {error}
          </div>
        )}
        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            
            {/* Username Input */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-zinc-700">Username</label>
              <input
                id="username"
                type="text"
                required
                className="mt-1 block w-full rounded-xl border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950 text-sm"
                placeholder="Your Name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700">Email Address</label>
              <input
                id="email"
                type="email"
                required
                className="mt-1 block w-full rounded-xl border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950 text-sm"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700">Password</label>
              <input
                id="password"
                type="password"
                required
                className="mt-1 block w-full rounded-xl border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950 text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {/* Role Selection Dropdown */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-zinc-700">I want to:</label>
              <select
                id="role"
                className="mt-1 block w-full rounded-xl border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950 text-sm bg-white"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="buyer">Shop & Buy Products (Buyer)</option>
                <option value="seller">Sell Products & Manage Shop (Seller)</option>
              </select>
            </div>
          </div>
          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Register"}
            </button>
          </div>
          {/* Login Page Redirect Link */}
          <div className="text-center text-sm text-zinc-600 mt-4">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-emerald-600 hover:underline">
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );


}
