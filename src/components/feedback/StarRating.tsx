import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
};

const StarRating = ({ value, onChange, size = 'lg', disabled = false }: StarRatingProps) => {
  const [hoverValue, setHoverValue] = useState(0);

  const handleClick = (rating: number) => {
    if (!disabled) {
      onChange(rating);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hoverValue || value);
        
        return (
          <motion.button
            key={star}
            type="button"
            disabled={disabled}
            whileHover={{ scale: disabled ? 1 : 1.2 }}
            whileTap={{ scale: disabled ? 1 : 0.9 }}
            onClick={() => handleClick(star)}
            onMouseEnter={() => !disabled && setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            className={cn(
              'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full p-1',
              disabled && 'cursor-not-allowed opacity-70'
            )}
          >
            <motion.div
              initial={false}
              animate={{
                scale: isFilled ? [1, 1.3, 1] : 1,
                rotate: isFilled ? [0, 15, -15, 0] : 0,
              }}
              transition={{ duration: 0.3 }}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  'transition-all duration-200',
                  isFilled 
                    ? 'fill-yellow-400 text-yellow-400 drop-shadow-lg' 
                    : 'text-muted-foreground hover:text-yellow-300'
                )}
              />
            </motion.div>
          </motion.button>
        );
      })}
    </div>
  );
};

export default StarRating;
