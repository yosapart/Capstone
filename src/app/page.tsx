"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "./_components/landingPage";

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

    router.push("/project/create");
  };

  return (
    <main>
      <Navbar />
      <h1 className="font-bold">
        Factory Sim
      </h1>
      <p>App is running.</p>
    </main>
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

  const [name, setName] = useState(""); // 🔥 เพิ่ม
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // 🔥 เพิ่ม

  const handleSubmit = async () => {

    // 🔥 VALIDATE FRONT ก่อนยิง API
    if (mode === "register") {
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

    // 🔥 LOGIN
    if (mode === "login") {
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

      localStorage.setItem("user", JSON.stringify(data.user));
      onClose();
      router.refresh();
    }

    // 🔥 REGISTER
    if (mode === "register") {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.log(data);

        // 🔥 handle zod error
        if (data.errors) {
          alert(JSON.stringify(data.errors.fieldErrors));
        } else {
          alert(data.message);
        }

        return;
      }

      alert("สมัครสำเร็จ 🎉");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded w-80 space-y-3">

        <h2 className="text-lg font-bold text-center">
          {mode === "login" ? "Login" : "Sign up"}
        </h2>

        {/* 🔥 แสดงเฉพาะตอน register */}
        {mode === "register" && (
          <input
            className="border w-full p-2 rounded"
            placeholder="Name"
            onChange={(e) => setName(e.target.value)}
          />
        )}

        <input
          className="border w-full p-2 rounded"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="border w-full p-2 rounded"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* 🔥 confirm password */}
        {mode === "register" && (
          <input
            type="password"
            className="border w-full p-2 rounded"
            placeholder="Confirm Password"
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        )}

        <button
          onClick={handleSubmit}
          className="w-full bg-black text-white py-2 rounded"
        >
          {mode === "login" ? "Login" : "Sign up"}
        </button>

        <button
          onClick={onClose}
          className="w-full text-sm text-gray-500"
        >
          Close
        </button>
      </div>
    </div>
  );
}