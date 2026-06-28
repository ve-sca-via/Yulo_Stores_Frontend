import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChefHat, Search, UtensilsCrossed, X } from "lucide-react";
import { useStaffAuth } from "@/context/StaffAuthContext";
import client from "@/api/client";

async function searchRestaurants(q) {
  if (!q.trim()) return [];
  const { data } = await client.get("/restaurants", { params: { q: q.trim() } });
  return data.data.restaurants ?? [];
}

export default function StaffLoginPage() {
  const navigate = useNavigate();
  const { login } = useStaffAuth();

  const [query, setQuery]         = useState("");
  const [results, setResults]     = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected]   = useState(null);
  const [showDrop, setShowDrop]   = useState(false);
  const debounceRef               = useRef(null);

  const [staffCode, setStaffCode] = useState("");
  const [pin, setPin]             = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    if (selected) return;
    clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); setShowDrop(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const list = await searchRestaurants(query);
        setResults(list);
        setShowDrop(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, [query, selected]);

  function pickRestaurant(r) {
    setSelected(r);
    setQuery(r.name);
    setShowDrop(false);
    setResults([]);
    setError("");
  }

  function clearRestaurant() {
    setSelected(null);
    setQuery("");
    setStaffCode("");
    setPin("");
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selected)         { setError("Please select your restaurant first"); return; }
    if (!staffCode.trim()) { setError("Enter your Staff Code (e.g. W01, C02)"); return; }
    if (pin.length < 4)    { setError("PIN must be at least 4 digits"); return; }
    setError("");
    setLoading(true);
    try {
      const staff = await login({
        restaurantId: selected._id,
        staffCode: staffCode.trim().toUpperCase(),
        pin,
      });
      if (staff.role === "waiter") navigate("/waiter", { replace: true });
      else if (staff.role === "chef") navigate("/chef", { replace: true });
      else navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen font-sans">

      {/* ── Left brand panel ── */}
      <div
        className="hidden lg:flex w-[44%] flex-col justify-between p-12"
        style={{ background: "linear-gradient(160deg, #23180E 0%, #1A120A 100%)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="h-8 w-8 rounded-lg"
            style={{ background: "linear-gradient(135deg, #A4161A, #D9480F)" }}
          />
          <span className="text-lg font-bold tracking-tight text-white">Yulo Stores</span>
        </div>

        {/* Hero text */}
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#F2A65A]">
            Staff Portal
          </p>
          <h2 className="text-[32px] font-bold leading-snug text-white">
            Ready for<br />
            <span className="text-[#F2A65A]">your shift?</span>
          </h2>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/40">
            Access your kitchen display or table orders instantly.
            Your workspace is waiting.
          </p>

          {/* Role cards */}
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D9480F]/20">
                <ChefHat className="h-4 w-4 text-[#F2A65A]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Chef</p>
                <p className="text-xs text-white/40">Kitchen display & order queue</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
                <UtensilsCrossed className="h-4 w-4 text-blue-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Waiter</p>
                <p className="text-xs text-white/40">Table management & orders</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-white/20">© 2025 Yulo Stores</p>
      </div>

      {/* ── Right form panel ── */}
      <div
        className="flex flex-1 flex-col items-center justify-center px-6 py-12"
        style={{ background: "linear-gradient(160deg, #1C110A 0%, #140D06 100%)" }}
      >
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <div
            className="h-7 w-7 rounded-lg"
            style={{ background: "linear-gradient(135deg, #A4161A, #D9480F)" }}
          />
          <span className="text-lg font-bold text-white">Yulo Stores</span>
        </div>

        <div className="w-full max-w-[360px]">

          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-white">Staff Login</h1>
            <p className="mt-1.5 text-sm text-[#8a6f5a]">
              Select your restaurant and enter your credentials
            </p>
          </div>

          {/* Card */}
          <div
            className="rounded-2xl p-7"
            style={{ background: "#23180E", border: "1px solid #3A2515" }}
          >
            <form className="space-y-5" onSubmit={handleSubmit}>

              {/* Restaurant search */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#8a6f5a]">
                  Restaurant
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5a3f2a]" />
                  <input
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); if (selected) setSelected(null); }}
                    placeholder="Search by restaurant name…"
                    autoComplete="off"
                    disabled={!!selected}
                    style={{
                      background: "#1A120A",
                      border: "1px solid #3A2515",
                      color: selected ? "#F5DFCE" : "white",
                    }}
                    className="w-full rounded-xl py-3 pl-10 pr-10 text-sm placeholder-[#5a3f2a] outline-none transition focus:border-[#D9480F] focus:ring-1 focus:ring-[#D9480F]/30 disabled:opacity-80"
                  />
                  {selected && (
                    <button
                      type="button"
                      onClick={clearRestaurant}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5a3f2a] hover:text-[#F2A65A]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {searching && !selected && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#5a3f2a]">…</span>
                  )}

                  {/* Dropdown */}
                  {showDrop && results.length > 0 && (
                    <ul
                      className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl shadow-xl"
                      style={{ background: "#2A1A0E", border: "1px solid #3A2515" }}
                    >
                      {results.map((r) => (
                        <li key={r._id}>
                          <button
                            type="button"
                            onClick={() => pickRestaurant(r)}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-white transition hover:bg-[#3A2515]"
                          >
                            <span
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                              style={{ background: "linear-gradient(135deg, #A4161A, #D9480F)" }}
                            >
                              {r.name?.[0]?.toUpperCase()}
                            </span>
                            <div>
                              <p className="font-medium text-white">{r.name}</p>
                              {r.address?.city && (
                                <p className="text-xs text-[#8a6f5a]">{r.address.city}</p>
                              )}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {showDrop && results.length === 0 && !searching && (
                    <div
                      className="absolute z-20 mt-1.5 w-full rounded-xl px-4 py-3 text-sm text-[#8a6f5a]"
                      style={{ background: "#2A1A0E", border: "1px solid #3A2515" }}
                    >
                      No restaurant found
                    </div>
                  )}
                </div>

                {selected && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-[#F2A65A]">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    {selected.name}
                  </p>
                )}
              </div>

              {/* Staff code + PIN (shown after restaurant selected) */}
              {selected && (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#8a6f5a]">
                      Staff Code
                    </label>
                    <input
                      value={staffCode}
                      onChange={(e) => setStaffCode(e.target.value.toUpperCase())}
                      placeholder="W01  ·  C02"
                      autoFocus
                      required
                      style={{ background: "#1A120A", border: "1px solid #3A2515" }}
                      className="w-full rounded-xl px-4 py-3 text-center font-mono text-xl tracking-[0.3em] text-white placeholder-[#5a3f2a] outline-none transition focus:border-[#D9480F] focus:ring-1 focus:ring-[#D9480F]/30"
                    />
                    <p className="mt-1.5 text-center text-xs text-[#5a3f2a]">
                      Waiter → W01, W02 &nbsp;·&nbsp; Chef → C01, C02
                    </p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#8a6f5a]">
                      PIN
                    </label>
                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"}
                        inputMode="numeric"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
                        placeholder="· · · ·"
                        required
                        style={{ background: "#1A120A", border: "1px solid #3A2515" }}
                        className="w-full rounded-xl px-4 py-3 pr-12 text-center text-xl tracking-[0.5em] text-white placeholder-[#5a3f2a] outline-none transition focus:border-[#D9480F] focus:ring-1 focus:ring-[#D9480F]/30"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5a3f2a] hover:text-[#8a6f5a]"
                      >
                        {showPw ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {error && (
                <div
                  className="flex items-start gap-2.5 rounded-xl px-4 py-3"
                  style={{ background: "#3D1010", border: "1px solid #6b1a1a" }}
                >
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !selected}
                className="mt-1 w-full rounded-xl py-3.5 text-sm font-bold text-white shadow transition hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
                style={{ background: "linear-gradient(90deg, #A4161A 0%, #D9480F 100%)" }}
              >
                {loading ? "Logging in…" : "Login"}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-[#5a3f2a]">
            Restaurant owner?{" "}
            <a href="/owner/login" className="font-semibold text-[#F2A65A] hover:underline">
              Owner portal →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
