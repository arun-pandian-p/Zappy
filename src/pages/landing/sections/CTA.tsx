import { motion } from 'framer-motion';
import { ArrowRight, Zap, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CTAProps {
  onGetStarted: () => void;
  onBookDemo: () => void;
  onWatchTour: () => void;
}

export const CTA = ({ onGetStarted, onBookDemo, onWatchTour }: CTAProps) => {
  return (
    <section id="cta" className="relative py-24 md:py-32 bg-[#0B1120] text-slate-100 overflow-hidden">
      {/* Light highlights */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-blue-600/10 blur-[140px] rounded-full pointer-events-none" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />

      <div className="container mx-auto px-6 max-w-4xl relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <span className="text-xs font-semibold tracking-widest uppercase text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3.5 py-1 rounded-full inline-block">
            Start upgrading today
          </span>
          
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">
            Ready to experience the <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">future of dining?</span>
          </h2>
          
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Boost seat throughput, recover feedback instantly, and run kitchen operations cleanly. Set up your digital workspace in minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              onClick={onGetStarted}
              size="lg"
              className="w-full sm:w-auto h-14 px-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20 group gap-2"
            >
              <Zap className="w-4.5 h-4.5" />
              Start Free Trial
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button
              onClick={onBookDemo}
              size="lg"
              className="w-full sm:w-auto h-14 px-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold"
            >
              Book Demo
            </Button>

            <Button
              onClick={onWatchTour}
              size="lg"
              variant="ghost"
              className="w-full sm:w-auto h-14 px-8 rounded-full hover:bg-white/5 text-slate-300 hover:text-white font-semibold gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              Watch Tour
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
