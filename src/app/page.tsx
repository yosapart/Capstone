"use client";
import { Navbar } from "./_components/Navbar";
import { HeroSection } from "./_components/Hero";
import { DesignSection } from "./_components/Design";
import { AnalyzeSection } from "./_components/Analyze";
import { PDFSection } from "./_components/Pdf";
import { CloseSection } from "./_components/Close";
import { Footer } from "./_components/Footer";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const [showAuth, setShowAuth] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");

  const handleCreate = () => {
    const user = localStorage.getItem("user");

    if (!user) {
      setMode("login");
      setShowAuth(true);
      return;
    }

    router.push("/home");
  };

  return (
    <>
      <Navbar 
        onLoginClick={() => { setMode("login"); setShowAuth(true); }}
        onSignUpClick={() => { setMode("register"); setShowAuth(true); }}
      />
      
      <main>
        <HeroSection onCreateClick={handleCreate} />
        <DesignSection />
        <AnalyzeSection />
        <PDFSection />
        <CloseSection />
      </main>
      
      <Footer />
      
      {showAuth && (
        <AuthModal 
          mode={mode} 
          onClose={() => setShowAuth(false)} 
        />
      )}
      </>
  );
}

function AuthModal({
  mode,
  onClose,
}: {
  mode: "login" | "register";
  onClose: () => void;
}) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // 🔥 สำหรับโหมด OTP
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await handleSubmitInner();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitInner = async () => {

    // 🔥 VALIDATE FRONT ก่อนยิง API
    if (mode === "register") {
      if (!email.endsWith("@gmail.com")) {
         alert("ระบบรองรับเฉพาะ @gmail.com เท่านั้น");
         return;
      }
      if (!name || !email || !password || !confirmPassword) {
        alert("กรอกข้อมูลให้ครบ");
        return;
      }

      if (password.length < 6) {
        alert("Password ต้องอย่างน้อย 6 ตัว");
        return;
      }

      if (password !== confirmPassword) {
        alert("Password ไม่ตรงกัน");
        return;
      }
    }

    // 🔥 LOGIN (ขั้นแรก หรือส่ง OTP)
    if (mode === "login" && !showOtp) {
      if (!email.endsWith("@gmail.com")) {
         alert("ระบบรองรับเฉพาะ @gmail.com เท่านั้น");
         return;
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      if (data.requiresOtp) {
        alert("ส่งรหัส OTP ไปที่อีเมลแล้ว กรุณาตรวจสอบอีเมลของคุณ");
        setShowOtp(true);
      } else {
        // เผื่อไว้กรณีที่บางทีอาจจะไม่ติด OTP
        localStorage.setItem("user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("user-changed"));
        onClose();
        router.refresh();
      }
    }

    // 🔥 VERIFY OTP (ขั้นสอง)
    if (mode === "login" && showOtp) {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      // OTP สำเร็จ → เข้าหน้า project เลย
      localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("user-changed"));
      onClose();
      router.push("/home");
    }

    // 🔥 REGISTER
    if (mode === "register") {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          alert(JSON.stringify(data.errors.fieldErrors));
        } else {
          alert(data.message);
        }
        return;
      }

      // สมัครสำเร็จ → ส่ง OTP อัตโนมัติผ่าน login API
      alert("สมัครสำเร็จ 🎉 กำลังส่ง OTP ไปที่อีเมลของคุณ...");

      const otpRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const otpData = await otpRes.json();

      if (!otpRes.ok) {
        alert(otpData.message);
        return;
      }

      if (otpData.requiresOtp) {
        setShowOtp(true); // เปิดหน้ากรอก OTP เลย
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000]">
      <div className="bg-white p-6 rounded-2xl w-80 space-y-4 shadow-xl relative overflow-hidden">

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-2xl" style={{ animation: 'fadeIn 0.2s ease' }}>
            <div style={{
              width: 40, height: 40,
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #1594dd',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p className="text-sm text-gray-500 mt-3 font-medium">กำลังดำเนินการ...</p>
            <style>{`
              @keyframes spin { to { transform: rotate(360deg); } }
              @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
          </div>
        )}

        <h2 className="text-xl font-bold text-center text-[#34495e]">
          {showOtp ? "ใส่รหัส OTP" : (mode === "login" ? "Login" : "Sign up")}
        </h2>

        {!showOtp ? (
          <>
            {mode === "register" && (
              <input
                className="border border-gray-300 w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}

            <input
              className="border border-gray-300 w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Email (@gmail.com)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              className="border border-gray-300 w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {mode === "register" && (
              <input
                type="password"
                className="border border-gray-300 w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            )}
          </>
        ) : (
          <>
            <p className="text-sm text-center text-gray-500 mb-2">เช็คอีเมล {email} ของคุณ</p>
            <input
              type="text"
              maxLength={6}
              className="border border-gray-300 w-full p-3 rounded-lg text-center tracking-widest text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#1594dd] text-white font-bold py-3 rounded-lg hover:bg-[#1973c8] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {showOtp ? "ยืนยัน OTP" : (mode === "login" ? "Login" : "Sign up")}
        </button>

        <button
          onClick={() => {
            if (showOtp) setShowOtp(false);
            else onClose();
          }}
          className="w-full text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors"
        >
          {showOtp ? "ย้อนกลับ" : "Close"}
        </button>
      </div>
    </div>
  );
}