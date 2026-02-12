import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RotatingTextProps {
  words: string[];
  colors?: string[]; // Optional color gradients for each word
  interval?: number;
  className?: string;
}

const RotatingText = ({
  words,
  colors,
  interval = 3500,
  className = ""
}: RotatingTextProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, interval);

    return () => clearInterval(timer);
  }, [words.length, interval]);

  // Calculate the width of the longest word to maintain consistent width
  const longestWord = words.reduce((a, b) => (a.length > b.length ? a : b));

  // Get current color gradient
  const currentColor = colors?.[currentIndex] || "";

  return (
    <div
      className="relative inline-flex items-center justify-center overflow-hidden"
      style={{
        minWidth: `${longestWord.length * 0.55}em`,
        height: "1.2em",
        lineHeight: "1.2em",
      }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={currentIndex}
          className={`block leading-none ${currentColor || className}`}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{
            duration: 0.6,
            ease: "easeInOut",
          }}
        >
          {words[currentIndex]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

export default RotatingText;
