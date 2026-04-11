"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"login" | "otp">("login");

  const handleLogin = async () => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    // ถ้า Backend ตอบกลับมาว่า requiresOtp ให้เปลี่ยน Step UI
    if (data.requiresOtp) {
      alert(data.message); // รหัสผ่านถูกต้อง กรุณาเช็ค OTP...
      setStep("otp");
    } else {
      // สำหรับกรณียกเว้นที่ไม่ได้บังคับ OTP
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/");
    }
  };

  const handleVerifyOtp = async () => {
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, otp }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    // เมื่อ OTP สำเร็จ
    if (data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
    }
    router.push("/");
  };

  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "10px", maxWidth: "300px" }}>
      <h2>Login</h2>
      {step === "login" ? (
        <>
          <input
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: "8px" }}
          />

          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: "8px" }}
          />

          <button onClick={handleLogin} style={{ padding: "8px", cursor: "pointer" }}>Login</button>
        </>
      ) : (
        <>
          <p>กรุณากรอกรหัส OTP 6 หลักที่ส่งไปที่ {email}</p>
          <input
            type="text"
            placeholder="รหัส OTP 6 หลัก"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            style={{ padding: "8px" }}
          />

          <button onClick={handleVerifyOtp} style={{ padding: "8px", cursor: "pointer" }}>ยืนยัน OTP</button>
        </>
      )}
    </div>
  );
}