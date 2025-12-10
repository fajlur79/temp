"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [idNumber, setIdNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_number: idNumber }),
      });

      // Always show success message to prevent enumeration (as per your backend logic)
      if (res.ok) {
        // Redirect to reset page with ID in URL so the user doesn't have to type it again
        router.push(`/auth/reset-password?id=${encodeURIComponent(idNumber)}`);
      } else {
        setMessage("Something went wrong. Please try again.");
      }
    } catch (err) {
      setMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Forgot Password?</h1>
          <p className="text-sm text-gray-500">Enter your ID number to reset your password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            required
            placeholder="ID Number"
            className="w-full p-3 border rounded-lg"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
          />
          
          {message && <p className="text-center text-sm text-red-500">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-900"
          >
            {loading ? "Processing..." : "Send Reset Code"}
          </button>
        </form>
      </div>
    </div>
  );
}