import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FinalCTAProps {
  onGetStarted: () => void;
}

const FinalCTA = ({ onGetStarted }: FinalCTAProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <section className="relative min-h-[70vh] flex flex-col justify-center items-center overflow-hidden bg-[#111111] py-24 px-6 text-center">
      {/* Background Video */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 mix-blend-screen">
        <video
          ref={videoRef}
          src="/videos/brand-identity-2.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover filter grayscale sepia brightness-90 contrast-125"
        />
      </div>

      {/* Grid Pattern Accent overlay */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.02]" 
        style={{
          backgroundImage: `radial-gradient(circle, #FF6B00 1.5px, transparent 1.5px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center gap-8 md:gap-12">
        <span className="text-xs font-semibold text-[#FF6B00] uppercase tracking-[0.25em]">Get Started Today</span>
        
        <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white uppercase tracking-tighter leading-none max-w-3xl">
          The Next Restaurant <br />
          Success Story <br />
          <span className="text-[#FF6B00]">Starts Here.</span>
        </h2>
        
        <p className="text-base sm:text-lg text-white/60 font-light max-w-xl leading-relaxed">
          Join hundreds of progressive restaurants running their table ordering, digital kitchen KOTs, cashier billing, and loyalty databases under one system.
        </p>

        <Button
          onClick={onGetStarted}
          size="lg"
          className="w-full sm:w-auto px-8 py-7 rounded-full bg-[#FF6B00] hover:bg-[#FF6B00]/95 text-white font-bold text-base shadow-lg shadow-orange-500/10 transition-all duration-300 hover:scale-[1.03]"
        >
          Start With Zappy
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </section>
  );
};

export default FinalCTA;
