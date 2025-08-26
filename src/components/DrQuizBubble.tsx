"use client";
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface DrQuizBubbleProps {
  text: string;
  collapsedText?: string;
}

export default function DrQuizBubble({ text }: DrQuizBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isWiggling, setIsWiggling] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Wiggle animation interval
  useEffect(() => {
    const wiggleInterval = setInterval(() => {
      if (!isOpen) {
        setIsWiggling(true);
        setTimeout(() => setIsWiggling(false), 500); // Duration of the wiggle animation
      }
    }, 10000); // Wiggle every 10 seconds

    return () => clearInterval(wiggleInterval);
  }, [isOpen]);

  // Handle clicks outside the component to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bubbleRef.current && !bubbleRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [bubbleRef]);

  const iconVariants: Variants = {
    hidden: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } },
    visible: { x: 0, opacity: 1, scale: 1 },
  };

  const contentVariants: Variants = {
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 20,
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
    hidden: {
      opacity: 0,
      x: 50,
      transition: {
        type: "tween",
        duration: 0.2,
        when: "afterChildren",
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
  };

  const bubbleVariants: Variants = {
    visible: { y: 0, opacity: 1 },
    hidden: { y: 20, opacity: 0 },
  };

  const drQuizVariants: Variants = {
    visible: { x: 0, opacity: 1 },
    hidden: { x: 50, opacity: 0 },
  };

  return (
    <div ref={bubbleRef} className="fixed bottom-4 right-4 z-50 flex items-end justify-end">
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="bubble-content"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="flex items-end gap-2"
            style={{ maxWidth: '50vw' }}
          >
            <motion.div
              variants={bubbleVariants}
              className="speech-bubble mb-8"
            >
              <p className="text-xs sm:text-sm">{text}</p>
            </motion.div>
            <motion.div
              variants={drQuizVariants}
              className="flex-shrink-0"
              style={{
                width: 'clamp(80px, 15vh, 150px)',
                height: 'clamp(80px, 15vh, 150px)',
              }}
            >
              <Image
                src="/img/DrQuiz.png"
                alt="Dr. Quiz"
                layout="responsive"
                width={150}
                height={150}
              />
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="icon"
            variants={iconVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={() => setIsOpen(true)}
            className={`cursor-pointer ${isWiggling ? 'animate-wiggle' : ''}`}
            style={{
              width: 'clamp(40px, 8vh, 80px)',
              height: 'clamp(40px, 8vh, 80px)',
            }}
          >
            <Image
              src="/favicon.png"
              alt="Help"
              layout="responsive"
              width={80}
              height={80}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}