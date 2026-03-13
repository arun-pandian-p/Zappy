import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, ReactNode } from 'react';

interface ParallaxSectionProps {
  children: ReactNode;
  yOffset?: number;       // px range for vertical parallax (default 40)
  fadeIn?: boolean;        // fade opacity from 0→1 on enter
  scaleUp?: boolean;       // scale from 0.95→1 on enter
  className?: string;
}

const ParallaxSection = ({
  children,
  yOffset = 40,
  fadeIn = true,
  scaleUp = false,
  className = '',
}: ParallaxSectionProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 0.5, 1], [yOffset, 0, -yOffset]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.3, 1, 1, 0.3]);
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.95, 1, 1, 0.95]);

  return (
    <div ref={ref} className={className}>
      <motion.div
        style={{
          y: yOffset ? y : 0,
          opacity: fadeIn ? opacity : 1,
          scale: scaleUp ? scale : 1,
          willChange: 'transform, opacity',
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default ParallaxSection;
