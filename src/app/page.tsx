import { Navbar } from "./_components/Navbar";
import { HeroSection } from "./_components/Hero";
import { DesignSection } from "./_components/Design";
import { AnalyzeSection } from "./_components/Analyze";
import { PDFSection } from "./_components/Pdf";
import { CloseSection } from "./_components/Close";
import { Footer } from "./_components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      
      <HeroSection />
      <DesignSection />
      <AnalyzeSection />
      <PDFSection />
      <CloseSection />
      
      <Footer />
    </>
  );
}
