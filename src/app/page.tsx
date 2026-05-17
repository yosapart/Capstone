"use client";
import { Navbar } from "./_components/Navbar";
import { HeroSection } from "./_components/Hero";
import { Features } from "./_components/Features";
import { HowItsWorks } from "./_components/HowItsWork";
import { CloseSection } from "./_components/Close";
import { Footer } from "./_components/Footer";
import AuthModal from "./_components/AuthModal";

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

  const handleSignUp = () => {
    setMode("register");
    setShowAuth(true);
  };

  return (
    <>
      <Navbar
        onLoginClick={() => { setMode("login"); setShowAuth(true); }}
        onSignUpClick={() => { setMode("register"); setShowAuth(true); }}
      />

      <main>
        <HeroSection onCreateClick={handleCreate} />
        <Features />
        <HowItsWorks/>
        <CloseSection onCreateClick={handleSignUp} />
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