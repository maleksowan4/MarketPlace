
'use client'
 
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link"

export default function LoginPage() {

    const {login} = useAuth ()

    const router = useRouter()

    const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {

    e.preventDefault()


    setError("")

    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        login(data.token, data.user);

        if (data.user?.RoleName?.toLowerCase() === "admin" || data.user?.RoleID === 1) {
          router.push("/admin/dashboard");
          return;
        }

        if (data.user?.RoleName?.toLowerCase() === "seller" || data.user?.RoleID === 2) {
          router.push("/seller/dashboard");
          return;
        }

        router.push("/");
        return;
      }

else {
    setError(data.message || "login failed")
}

    }

   catch (err) {
      console.error("Login API Connection Error:", err);
      setError("Cannot connect to server. Please check your network connection.");
    } finally {
      setLoading(false); // Enable the submit button again
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
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Welcome Back</h2>
          <p className="mt-2 text-sm text-zinc-500">Sign in to your account to continue</p>
        </div>
        {/* Error Alert Display */}
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600 border border-red-200">
            {error}
          </div>
        )}
        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            
            {/* Email Field */}
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
            {/* Password Field */}
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
          </div>
          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>
          {/* Registration Redirect Link */}
          <div className="text-center text-sm text-zinc-600 mt-4">
            Don't have an account?{" "}
            <Link href="/signup" className="font-semibold text-emerald-600 hover:underline">
              Get Started
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
