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

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  
  // 🔥 สำหรับโหมด OTP
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const getNameErrorMessage = (value: string) => {
    if (!value) return "กรุณากรอกชื่อผู้ใช้";
    return "";
  };

  const getEmailErrorMessage = (value: string) => {
    if (!value) return "กรุณากรอกอีเมล";
    if (!value.endsWith("@gmail.com")) return "รองรับเฉพาะ @gmail.com เท่านั้น";
    return "";
  };

  const getPasswordErrorMessage = (value: string) => {
    if (!value) return "กรุณากรอกรหัสผ่าน";
    if (value.length < 6) return "รหัสผ่านต้องมีอย่างน้อย 6 ตัว";
    return "";
  };

  const getConfirmPasswordErrorMessage = (value: string) => {
    if (!value) return "กรุณายืนยันรหัสผ่าน";
    if (value.length < 6) return "รหัสผ่านต้องมีอย่างน้อย 6 ตัว";
    return "";
  };

  const handleNameBlur = () => {
    const message = getNameErrorMessage(name);
    setErrors((prev) => ({ ...prev, name: message }));
  };

  const handleEmailBlur = () => {
    const message = getEmailErrorMessage(email);
    setErrors((prev) => ({ ...prev, email: message }));
  };

  const handlePasswordBlur = () => {
    const message = getPasswordErrorMessage(password);
    setErrors((prev) => ({ ...prev, password: message }));
  };

  const handleConfirmPasswordBlur = () => {
    const message = getConfirmPasswordErrorMessage(confirmPassword);
    setErrors((prev) => ({ ...prev, confirmPassword: message }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await handleSubmitInner();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitInner = async () => {
    const newErrors = { name: "", email: "", password: "", confirmPassword: "" };
    setErrors(newErrors);
    let hasError = false;

    newErrors.email = getEmailErrorMessage(email);
    if (newErrors.email) hasError = true;
    
    newErrors.password = getPasswordErrorMessage(password);
    if (newErrors.password) hasError = true;
    //Validate Sign up
    if (mode === "register") {
      newErrors.name = getNameErrorMessage(name);
      if (newErrors.name) hasError = true;

      newErrors.confirmPassword = getConfirmPasswordErrorMessage(confirmPassword);
      if (newErrors.confirmPassword) hasError = true;

      if (hasError) {
        setErrors(newErrors);
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
    if (showOtp) {
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
    if (mode === "register" && !showOtp) {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors && data.errors.fieldErrors) {
          const fieldErrors = data.errors.fieldErrors;
          setErrors({
            name: fieldErrors.name ? fieldErrors.name[0] : "",
            email: fieldErrors.email ? fieldErrors.email[0] : "",
            password: fieldErrors.password ? fieldErrors.password[0] : "",
            confirmPassword: fieldErrors.confirmPassword ? fieldErrors.confirmPassword[0] : "",
          });
        } else if (data.message) {
          if (data.message.includes("Email")) {
            setErrors(prev => ({ ...prev, email: data.message }));
          }
        }
        return;
      }

      if (data.requiresOtp) {
        alert("กรุณาตรวจสอบ OTP ในอีเมลของคุณเพื่อยืนยันการสมัคร");
        setShowOtp(true);
      } 
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000]">
      <div className="bg-white p-6 rounded-2xl w-[330px] flex flex-col items-center space-y-4 shadow-xl relative overflow-hidden">

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

        <h2 className="text-[22px] font-bold text-center text-[#34495e]">
          {showOtp ? "ใส่รหัส OTP" : (mode === "login" ? "Login" : "─ Sign up ─")}
        </h2>

        {!showOtp ? (
          <>
            {mode === "register" && (
              <div className="w-[275px] min-h-[60px] flex flex-col items-start">
                <input
                  className={`border w-[275px] p-3 rounded-lg focus:outline-none focus:ring-2 transition-all 
                    ${errors.name 
                    ? "border-red-500 focus:ring-red-400 bg-red-50" 
                    : "border-gray-300 focus:ring-blue-400"
                  }`}
                  placeholder="Name"
                  value={name}
                  onBlur={handleNameBlur}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors(prev => ({ ...prev, name: "" }));
                  }}
                />
                  <div className="h-1.5 mt-1.5">
                    {errors.name && <p className="text-[12px] text-red-500 pl-1 font-medium leading-none">{errors.name}</p>}
                  </div>
              </div>
            )}

            <div className="w-[275px] min-h-[60px] flex flex-col items-start">
              <input
                className={`border w-[275px] p-3 rounded-lg focus:outline-none focus:ring-2 transition-all
                  ${errors.email 
                    ? "border-red-500 focus:ring-red-400 bg-red-50" 
                    : "border-gray-300 focus:ring-blue-400"
                  }`}
                placeholder="Email (@gmail.com)"
                value={email}
                onBlur={handleEmailBlur}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: "" }));
                }}
                
              />
              <div className="h-1.5 mt-1.5"> 
                {errors.email && (
                  <p className="text-[12px] text-red-500 pl-1 font-medium leading-none">{errors.email}</p>
                )}
              </div>
            </div>
            
            <div className="w-[275px] min-h-[60px] flex flex-col items-start">
                <input
                  type="password"
                  className={`border w-[275px] p-3 rounded-lg focus:outline-none focus:ring-2 transition-all 
                    ${errors.password 
                    ? "border-red-500 focus:ring-red-400 bg-red-50" 
                    : "border-gray-300 focus:ring-blue-400"
                  }`}
                  placeholder="Password"
                  value={password}
                  onBlur={handlePasswordBlur}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors(prev => ({ ...prev, password: "" }));
                  }}
                />
                  <div className="h-1.5 mt-1.5">
                    {errors.password && <p className="text-[12px] text-red-500 pl-1 font-medium leading-none">{errors.password}</p>}
                  </div>
              </div>
            
            {mode === "register" && (
              <div className="w-[275px] min-h-[60px] flex flex-col items-start">
                <input
                  type="password"
                  className={`border w-[275px] p-3 rounded-lg focus:outline-none focus:ring-2 transition-all 
                    ${errors.confirmPassword 
                    ? "border-red-500 focus:ring-red-400 bg-red-50" 
                    : "border-gray-300 focus:ring-blue-400"
                  }`}
                  placeholder="Confirm Password"
                  onBlur={handleConfirmPasswordBlur}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: "" }));
                  }}
                />
                  <div className="h-1.5 mt-1.5">
                    {errors.confirmPassword && <p className="text-[12px] text-red-500 pl-1 font-medium leading-none">{errors.confirmPassword}</p>}
                  </div>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-sm text-center text-gray-500 mb-2">เช็คอีเมล {email} ของคุณ</p>
            <input
              type="text"
              maxLength={6}
              className="border border-gray-300 w-[275px] p-3 rounded-lg text-center tracking-widest text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-[275px] bg-[#1594dd] text-white font-bold py-3 rounded-lg hover:bg-[#1973c8] cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {showOtp ? "ยืนยัน OTP" : (mode === "login" ? "Login" : "Sign up")}
        </button>

        <button
          onClick={() => {
            if (showOtp) setShowOtp(false);
            else onClose();
          }}
          className="w-full text-sm font-semibold text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
        >
          {showOtp ? "ย้อนกลับ" : "Close"}
        </button>
      </div>
    </div>
  );
}
