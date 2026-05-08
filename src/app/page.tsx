"use client";
import { Navbar } from "./_components/Navbar";
import { HeroSection } from "./_components/Hero";
import { DesignSection } from "./_components/Design";
import { AnalyzeSection } from "./_components/Analyze";
import { PDFSection } from "./_components/Pdf";
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