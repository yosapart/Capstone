"use client";
import { Navbar } from "./_components/Navbar";
import { HeroSection } from "./_components/Hero";
import { DesignSection } from "./_components/Design";
import { AnalyzeSection } from "./_components/Analyze";
import { PDFSection } from "./_components/Pdf";
import { CloseSection } from "./_components/Close";
import { Footer } from "./_components/Footer";

import styles from './page.module.css';

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const [showAuth, setShowAuth] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");

  const handleCreate = () => {
    const user = sessionStorage.getItem("user");

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
    confirmPassword: "",
    otp: ""
  });

  // 🔥 สำหรับโหมด OTP
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const getNameErrorMessage = (value: string) => {
    if (!value) return "Please enter your username.";
    return "";
  };

  const getEmailErrorMessage = (value: string) => {
    if (!value) return "Please enter your email.";
    if (!value.endsWith("@gmail.com")) return "Only @gmail.com addresses are supported.";
    return "";
  };

  const getPasswordErrorMessage = (value: string) => {
    if (!value) return "Please enter your password.";
    if (value.length < 6) return "Password must be at least 6 characters.";
    return "";
  };

  const getConfirmPasswordErrorMessage = (value: string) => {
    if (!value) return "Please confirm your password.";
    if (value.length < 6) return "Password must be at least 6 characters.";
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
    const newErrors = { name: "", email: "", password: "", confirmPassword: "", otp: "" };
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

      const emailMsg = getEmailErrorMessage(email);
      const passMsg = getPasswordErrorMessage(password);

      if (emailMsg || passMsg) {
        setErrors({ ...errors, email: emailMsg, password: passMsg });
        return;
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({
          ...errors,
          email: " ",
          password: "Invalid email or password"
        });
        return;
      }

      if (data.requiresOtp) {
        setShowOtp(true);
      } else {
        // Login success
        sessionStorage.setItem("user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("user-changed"));
        
        // หน่วงเวลาหมุนโหลดนิดนึงให้ดูสมจริง
        await new Promise(resolve => setTimeout(resolve, 800));

        setSuccess(true);
        setTimeout(() => {
          onClose();
          router.push("/home");
        }, 1500);
      }
    }

    // VERIFY OTP (ขั้นสอง)
    if (showOtp) {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors((prev) => ({
          ...prev,
          otp: "Invalid OTP. Please try again."
        }));
        return;
      }

      // OTP สำเร็จ → เข้าหน้า project เลย
      sessionStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("user-changed"));
      
      // หน่วงเวลาหมุนโหลดนิดนึงให้ดูสมจริง
      await new Promise(resolve => setTimeout(resolve, 800));

      setSuccess(true);
      setTimeout(() => {
        onClose();
        router.push("/home");
      }, 1500);
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
            otp: "",
          });
        } else if (data.message) {
          const lowerMsg = data.message.toLowerCase();
          if (lowerMsg.includes("email") || lowerMsg.includes("gmail")) {
            setErrors(prev => ({ ...prev, email: data.message }));
          } else {
            setErrors(prev => ({ ...prev, password: data.message }));
          }
        }
        return;
      }

      if (data.requiresOtp) {
        setShowOtp(true);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000]">
      <div className="bg-white p-6 rounded-2xl w-[330px] flex flex-col items-center space-y-4 shadow-xl relative overflow-hidden">

        {/* Loading Overlay */}
        {loading && !success && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-2xl" style={{ animation: 'fadeIn 0.2s ease' }}>
            <div style={{
              width: 40, height: 40,
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #1594dd',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p className="text-sm text-gray-500 mt-3 font-medium">Processing...</p>
          </div>
        )}

        {/* Success Overlay */}
        {success && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center z-20 rounded-2xl" style={{ animation: 'scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800">Welcome Back!</h3>
            <p className="text-sm text-gray-500 mt-1">Login successful</p>
            <style>{`
              @keyframes scaleUp { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
              @keyframes spin { to { transform: rotate(360deg); } }
              @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
          </div>
        )}

        <h2 className="text-[22px] font-bold text-center text-[#34495e]">
          {showOtp ? "OTP Verification" : (mode === "login" ? "─ Login ─" : "─ Sign up ─")}
        </h2>

        {!showOtp ? (
          <>
            {mode === "register" && (
              <div className="w-[275px] min-h-[65px] flex flex-col items-start">
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
                <div className="h-2 mt-1.5">
                  {errors.name && <p className="text-[12px] text-red-500 pl-1 font-medium leading-none">{errors.name}</p>}
                </div>
              </div>
            )}

            <div className="w-[275px] min-h-[65px] flex flex-col items-start">
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
              <div className="h-2 mt-1.5">
                {errors.email && (
                  <p className="text-[12px] text-red-500 pl-1 font-medium leading-none">{errors.email}</p>
                )}
              </div>
            </div>

            <div className="w-[275px] min-h-[65px] flex flex-col items-start">
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
              <div className="h-2 mt-1.5">
                {errors.password && <p className="text-[12px] text-red-500 pl-1 font-medium leading-none">{errors.password}</p>}
              </div>
            </div>

            {mode === "register" && (
              <div className="w-[275px] min-h-[70px] flex flex-col items-start">
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
                <div className="h-2 mt-1.5">
                  {errors.confirmPassword && <p className="text-[12px] text-red-500 pl-1 font-medium leading-none">{errors.confirmPassword}</p>}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-sm text-center text-gray-500 mb-5 px-4 break-all">
              An OTP has been sent to your email<br />
              <span
                className="inline-block max-w-full truncate font-medium text-gray-700 align-bottom"
              >
                {maskEmail(email)}
              </span>
              <br />
              Please enter it below.
            </p>

            <div className="w-[260px] min-h-[65px] flex flex-col items-center">
              <input
                type="text"
                maxLength={6}
                className={`border w-full p-3 rounded-lg text-center tracking-widest text-lg font-semibold focus:outline-none focus:ring-2 transition-all
                ${errors.otp
                    ? "border-red-500 bg-red-50 focus:ring-red-400"
                    : "border-gray-300 focus:ring-blue-400"
                  }`}
                placeholder="000000"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value);

                  if (errors.otp) setErrors((prev) => ({ ...prev, otp: "" }));
                }}
              />

              <div className="h-3 mt-1.5 w-full">
                {errors.otp && (
                  <p className="text-[11px] text-red-500 text-center font-medium leading-tight">
                    {errors.otp}
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-[275px] bg-[#1594dd] text-white font-bold py-3 rounded-lg hover:bg-[#1973c8] cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {showOtp ? "Verify OTP" : (mode === "login" ? "Login" : "Sign up")}
        </button>

        <button
          onClick={() => {
            if (showOtp) setShowOtp(false);
            else onClose();
          }}
          className="w-full mt-[-5px] text-sm font-semibold text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
        >
          {showOtp ? "Go Back" : "Close"}
        </button>
      </div>
    </div>
  );
}

// เปลี่ยนชื่อเมลหน้าotp
const maskEmail = (email: string) => {
  if (!email || !email.includes("@")) return email;

  const [localPart, domain] = email.split("@");

  if (localPart.length <= 4) {
    const stars = "*".repeat(localPart.length - 1);
    return `${localPart[0]}${stars}@${domain}`;
  }

  const firstThree = localPart.substring(0, 3);
  const lastChar = localPart.charAt(localPart.length - 1);

  return `${firstThree}*****${lastChar}@${domain}`;
};