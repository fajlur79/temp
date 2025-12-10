"use client";

import { useState } from "react";
import VerifyCodeBox from "@/components/auth/VerifyCodeBox";

export default function SignupPage() {
  const [step, setStep] = useState<"ID_INPUT" | "OTP_VERIFY">("ID_INPUT");
  const [idNumber, setIdNumber] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_number: idNumber }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Signup failed");

      // Store CSRF token from response
      if (data.csrfToken) setCsrfToken(data.csrfToken);
      
      setStep("OTP_VERIFY");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === "OTP_VERIFY") {
    return (
      <div className="flex justify-center w-full min-h-screen items-center">
        <VerifyCodeBox 
            idNumber={idNumber} 
            csrfToken={csrfToken} 
            onResend={() => handleSignup()} // Re-use signup logic for resend
        />
      </div>
    );
  }

  return (
    <div className="flex justify-center w-full min-h-screen items-center">
      <div className="w-full max-w-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">ID Number</label>
            <input
              type="text"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              className="mt-1 w-full p-3 border rounded-lg focus:ring-2 focus:ring-black outline-none"
              placeholder="Enter your ID"
              required
            />
          </div>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-900 transition disabled:opacity-50"
          >
            {loading ? "Sending Code..." : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
}