"use client";

import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface VerifyProps {
  idNumber: string;
  csrfToken: string;
  onResend: () => Promise<void>;
}

export default function VerifyCodeBox({ idNumber, csrfToken, onResend }: VerifyProps) {
  const router = useRouter();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(60); // 60s initial cooldown
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Timer logic for resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = (index: number, value: string) => {
    if (/^[0-9]?$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
      if (value && index < 5) inputRefs.current[index + 1]?.focus();
      setError(""); // Clear error on typing
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (code[index] !== "") {
        const newCode = [...code];
        newCode[index] = "";
        setCode(newCode);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleSubmit = async () => {
    const otp = code.join("");
    if (otp.length !== 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp, csrf_token: csrfToken }), // Sending CSRF from props
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Verification failed");

      // Success! Redirect to profile creation (or next step)
      router.push("/auth/create-profile"); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendClick = async () => {
    if (cooldown > 0) return;
    try {
      await onResend();
      setCooldown(60); // Reset timer on success
      setError(""); 
      alert("Code resent successfully!");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center gap-6 p-6">
      <Image src="/OTPverification1.svg" width={200} height={200} alt="Verify Illustration" priority />

      <div>
        <h2 className="text-2xl font-semibold">Verify Code</h2>
        <p className="text-gray-500 text-sm mt-1">Enter the code sent to your email for ID: <b>{idNumber}</b></p>
      </div>

      <div className="flex gap-3">
        {code.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            inputMode="numeric"
            className="w-12 h-12 sm:w-14 sm:h-14 border border-gray-300 rounded-lg text-center text-xl font-bold focus:outline-none focus:border-black"
          />
        ))}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button 
        onClick={handleSubmit} 
        disabled={loading}
        className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-900 transition disabled:opacity-50"
      >
        {loading ? "Verifying..." : "Continue"}
      </button>

      <p className="text-xs text-gray-500">
        Didn’t receive a code?{" "}
        <button 
          onClick={handleResendClick} 
          disabled={cooldown > 0}
          className={`font-medium ${cooldown > 0 ? "text-gray-300 cursor-not-allowed" : "text-black"}`}
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend"}
        </button>
      </p>
    </div>
  );
}
