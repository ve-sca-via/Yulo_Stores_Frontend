// OTP verification — validates the code, creates the customer session, and
// redirects back to the QR/menu/cart flow the customer came from (PRD §7).
// Includes resend cooldown and a clear error path.

import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { requestJson, storeToken } from "@/api";
import CustomerLayout from "./CustomerLayout";
import { useCustomer } from "./CustomerApp";

const OTP_LENGTH = 4;

export default function OtpVerify() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, setSession } = useCustomer();
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(30);
  const inputs = useRef([]);

  const from = location.state?.from ?? "/order/menu";
  const devOtp = location.state?.devOtp;

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Guard: don't show OTP entry if we never captured a number.
  if (!session.mobile) {
    return <Navigate to="/order/login" replace />;
  }

  function setDigit(index, value) {
    const char = value.replace(/\D/g, "").slice(-1);
    setDigits((current) => {
      const next = [...current];
      next[index] = char;
      return next;
    });
    if (char && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index, event) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function verify(event) {
    event?.preventDefault();
    const otp = digits.join("");
    if (otp.length !== OTP_LENGTH) {
      setError("Enter the 4-digit code");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload = await requestJson("/customer/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: session.mobile, otp, name: session.name }),
      });
      storeToken(payload.data.token);
      setSession((current) => ({
        ...current,
        verified: true,
        customer: payload.data.customer,
        name: payload.data.customer.name || current.name,
      }));
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (cooldown > 0) return;
    try {
      await requestJson("/customer/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: session.mobile }),
      });
      setCooldown(30);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <CustomerLayout title="Enter OTP" showBack onBack={() => navigate("/order/login")}>
      <form className="flex flex-col gap-6 px-5 py-8" onSubmit={verify}>
        <div>
          <h2 className="text-xl font-bold">Verify mobile number</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the 4-digit code sent to <span className="font-semibold">+91 {session.mobile}</span>.
          </p>
          {devOtp ? (
            <p className="mt-2 inline-block rounded-lg bg-brand-orange/10 px-2.5 py-1 text-xs font-medium text-brand-orange">
              Demo OTP: {devOtp}
            </p>
          ) : null}
        </div>

        <div className="flex justify-between gap-3">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputs.current[index] = el)}
              value={digit}
              onChange={(e) => setDigit(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              inputMode="numeric"
              maxLength={1}
              autoFocus={index === 0}
              className="h-16 w-full rounded-xl border border-brand-cream/80 bg-white text-center text-2xl font-bold outline-none focus:border-brand-orange"
            />
          ))}
        </div>

        {error ? <p className="text-sm text-brand-maroon">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand-gradient py-3.5 text-base font-bold text-white transition hover:brightness-105 disabled:opacity-60"
        >
          {loading ? "Verifying…" : "Verify & Continue"}
        </button>

        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0}
          className="text-center text-sm font-medium text-brand-orange disabled:text-muted-foreground"
        >
          {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
        </button>
      </form>
    </CustomerLayout>
  );
}
