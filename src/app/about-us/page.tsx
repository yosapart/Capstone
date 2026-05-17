  "use client";
  import React, { useEffect, useRef, useState } from "react";
  import Image from 'next/image';
  import { Navbar } from "../_components/Navbar";
  import { Footer } from "../_components/Footer";

  function useFadeIn(threshold = 0.15) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const obs = new IntersectionObserver(
        ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
        { threshold }
      );
      obs.observe(el);
      return () => obs.disconnect();
    }, [threshold]);
    return { ref, visible };
  }

  function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
    const [count, setCount] = useState(0);
    const { ref, visible } = useFadeIn(0.3);
    useEffect(() => {
      if (!visible) return;
      let n = 0;
      const step = Math.ceil(target / 60);
      const t = setInterval(() => {
        n += step;
        if (n >= target) { setCount(target); clearInterval(t); }
        else setCount(n);
      }, 16);
      return () => clearInterval(t);
    }, [visible, target]);
    return <span ref={ref}>{count}{suffix}</span>;
  }

  const team = [
    { name: "นาย pea pea", role: "Lord of Darkness", avatar: "/chat1.png" },
    { name: "นายคีน คีน", role: "The Cookierun King", avatar: "/chatgen1.png" },
    { name: "นายงู", role: "The Best Crawler", avatar: "/chatuse.png" },
  ];

  const values = [
    { icon:"", title: "Precision", desc: "Every simulation is built on rigorous engineering principles so your decisions are grounded in reality." },
    { icon: "", title: "Speed", desc: "From blank canvas to optimized layout in minutes not weeks." },
    { icon: "", title: "Collaboration", desc: "Designed for teams: share, comment, and iterate together in real time." },
    { icon: "", title: "Insight", desc: "Turn raw simulation data into clear, actionable reports for every stakeholder." },
  ];

  export default function AboutPage() {
    const words = ["Simulate.", "Optimize.", "Deliver."];
    const [wordIdx, setWordIdx] = useState(0);
    const [fade, setFade] = useState(true);
    useEffect(() => {
      const id = setInterval(() => {
        setFade(false);
        setTimeout(() => { setWordIdx(i => (i + 1) % words.length); setFade(true); }, 350);
      }, 2200);
      return () => clearInterval(id);
    }, []);

    const mission = useFadeIn();
    const valuesRef = useFadeIn();
    const teamRef = useFadeIn();
    const statsRef = useFadeIn();

    const fadeStyle = (visible: boolean, delay = "0s") => ({
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(32px)",
      transition: `opacity 0.8s ease ${delay}, transform 0.8s ease ${delay}`,
    });

    return (
      <>
        <Navbar />

        {/* Hero */}
        <section className="relative flex flex-col items-center justify-center text-center bg-[#3f5973] text-white overflow-hidden py-20 sm:py-28 md:py-36 px-6">

          <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-blue-300 mb-3 sm:mb-4 font-semibold">
            About FacSim
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4 max-w-xs sm:max-w-xl md:max-w-3xl">
            Built for factories that refuse to stand still.
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/70 max-w-xs sm:max-w-md md:max-w-xl mb-8">
            We make industrial simulation accessible, fast, and beautiful so engineers can focus on what matters.
          </p>
          <div className="text-2xl sm:text-3xl font-bold text-blue-300 h-10 sm:h-12 flex items-center justify-center">
            <span style={{ opacity: fade ? 1 : 0, transform: fade ? "translateY(0)" : "translateY(-8px)", transition: "opacity 0.35s ease, transform 0.35s ease" }}>
              {words[wordIdx]}
            </span>
          </div>
        </section>

        {/* ── Stats ── */}
        <section ref={statsRef.ref} className="bg-white border-b border-gray-100" style={fadeStyle(statsRef.visible)}>
          <div className="max-w-5xl mx-auto py-10 sm:py-14 px-6 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
            {[
              { label: "Simulations Run", target: 1200, suffix: "+" },
              { label: "Factories Served", target: 340, suffix: "+" },
              { label: "Hours Saved", target: 2000, suffix: "+" },
              { label: "Team Members", target: 3, suffix: "" },
            ].map(s => (
              <div key={s.label}>
                <p className="text-3xl sm:text-4xl font-bold text-[#34495e]">
                  <Counter target={s.target} suffix={s.suffix} />
                </p>
                <p className="text-gray-500 mt-1 text-xs sm:text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Mission */}
        <section ref={mission.ref} className="max-w-4xl mx-auto py-14 sm:py-20 px-6 text-center" style={fadeStyle(mission.visible)}>
          <span className="inline-block mb-4 text-xs font-semibold uppercase tracking-widest text-[#1594dd] bg-blue-50 px-3 py-1 rounded-full">
            Our Mission
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#34495e] mb-6 leading-snug">
            Close the gap between planning and reality.
          </h2>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            FacSim was born from a simple frustration: factory planning still relies on whiteboards and spreadsheets.
            We believe every production engineer deserves powerful simulation tools that are intuitive enough to use in a daily workflow
            not just reserved for specialists with months of training.
          </p>
        </section>

        {/* ── Values ── */}
        <section ref={valuesRef.ref} className="bg-gray-50 py-14 sm:py-20 px-6 text-center" style={fadeStyle(valuesRef.visible, "0.1s")}>
          <div className="max-w-5xl mx-auto">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-[#1594dd] mb-2">What We Stand For</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#34495e] text-center mb-8 sm:mb-12">Our Core Values</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {values.map((v, i) => (
                <div key={v.title}
                  className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                  style={{ transitionDelay: `${i *1}ms` }}>
                  <div className="text-2xl sm:text-3xl mb-3 sm:mb-4">{v.icon}</div>
                  <h3 className="text-base sm:text-lg font-bold text-[#34495e] mb-2">{v.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Team ── */}
        <section ref={teamRef.ref} className="max-w-5xl mx-auto py-14 sm:py-20 px-6 flex flex-col items-center text-center" style={fadeStyle(teamRef.visible)}>
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-[#1594dd] mb-2">Meet the People Behind FacSim</p>
          <div className="flex items-center gap-4 mb-8 sm:mb-12 whitespace-nowrap">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#34495e] m-0">Meet the Team</h2>
          </div>

          <div className="flex justify-center flex-wrap gap-6 sm:gap-8 w-full">
            {team.map((m, i) => (
              <div key={m.name} className="w-1/2 md:w-1/4 flex flex-col items-center text-center group" style={{ animationDelay: `${i * 100}ms` }}>
                  {m.avatar ? (
                    <Image
                      src={m.avatar}
                      alt={m.name}
                      width={80}
                      height={80}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover mb-3 sm:mb-4"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#34495e] text-white flex items-center justify-center text-lg sm:text-xl font-bold mb-3 sm:mb-4
                                  group-hover:bg-[#1594dd] transition-colors duration-300 shadow-md">
                    </div>
                  )}
                <p className="font-bold text-sm sm:text-base text-[#34495e]">{m.name}</p>
                <p className="text-xs sm:text-sm text-gray-500">{m.role}</p>
              </div>
            ))}
          </div>
        </section>

        <style>{`
          @keyframes ping-slow {
            0%, 100% { transform: scale(1); opacity: 0.4; }
            50%       { transform: scale(1.08); opacity: 0.15; }
          }
        `}</style>

        <Footer />
      </>
    );
  }