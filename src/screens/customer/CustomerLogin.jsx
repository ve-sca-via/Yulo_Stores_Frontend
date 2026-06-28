import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Mail, ShieldCheck } from "lucide-react";

import { useCustomer } from "./CustomerApp";
import CustomerLayout from "./CustomerLayout";

export default function CustomerLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth, session, setSession } = useCustomer();

  const from = location.state?.from ?? "/order/menu";

  const [isSignup, setIsSignup] = useState(false);
  const [name, setName]         = useState(session.name ?? "");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      return;
    }
    setLoading(true);
    try {
      if (isSignup) {
        await auth.signup({ name, email, password });
      } else {
        await auth.login({ email, password });
      }
      setSession((s) => ({ ...s, verified: true, name: name || email.split("@")[0] }));
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <CustomerLayout title="Sign in" showBack onBack={() => navigate("/order")}>
      <div className="flex flex-col gap-6 px-5 py-8">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-orange/10 text-brand-orange">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{isSignup ? "Create account" : "Sign in"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSignup
              ? "Create an account to place orders and track your food."
              : "Sign in to place orders and track your food in real time."}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {isSignup && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border border-brand-cream/80 bg-white px-4 py-3 text-sm outline-none focus:border-brand-orange"
              />
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <div className="flex items-center gap-2 rounded-xl border border-brand-cream/80 bg-white px-4 py-3 focus-within:border-brand-orange">
              <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-brand-cream/80 bg-white px-4 py-3 text-sm outline-none focus:border-brand-orange"
            />
          </div>

          {error && <p className="text-sm text-brand-maroon">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-gradient py-3.5 text-base font-bold text-white transition hover:brightness-105 disabled:opacity-60"
          >
            {loading ? (isSignup ? "Creating account…" : "Signing in…") : (isSignup ? "Create Account" : "Sign In")}
          </button>
        </form>

        <button
          type="button"
          onClick={() => { setIsSignup((v) => !v); setError(""); }}
          className="text-center text-sm text-brand-orange underline-offset-2 hover:underline"
        >
          {isSignup ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
      </div>
    </CustomerLayout>
  );
}
