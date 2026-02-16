import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SkillsynccLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  showText?: boolean;
  showPoweredBy?: boolean;
  className?: string;
}

export function SkillsynccLogo({ 
  size = "md", 
  animate = true, 
  showText = false, 
  showPoweredBy = false,
  className 
}: SkillsynccLogoProps) {
  const sizeMap = {
    sm: { icon: 28, stroke: 2, text: "text-sm" },
    md: { icon: 36, stroke: 2.5, text: "text-base" },
    lg: { icon: 52, stroke: 3, text: "text-xl" },
    xl: { icon: 80, stroke: 3.5, text: "text-3xl" },
  };

  const s = sizeMap[size];

  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 1.2, ease: "easeInOut" },
    },
  };

  const glowVariants = {
    idle: { 
      filter: "drop-shadow(0 0 4px hsl(265 85% 65% / 0.4))",
    },
    pulse: {
      filter: [
        "drop-shadow(0 0 4px hsl(265 85% 65% / 0.4))",
        "drop-shadow(0 0 12px hsl(265 85% 65% / 0.8))",
        "drop-shadow(0 0 4px hsl(265 85% 65% / 0.4))",
      ],
      transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
    },
  };

  const orbVariants = {
    orbit: {
      rotate: 360,
      transition: { duration: 6, repeat: Infinity, ease: "linear" },
    },
  };

  return (
    <div className={cn("flex items-center gap-2", className)} data-testid="skillsyncc-logo">
      <motion.div
        className="relative flex-shrink-0"
        variants={glowVariants}
        initial="idle"
        animate={animate ? "pulse" : "idle"}
      >
        <svg
          width={s.icon}
          height={s.icon}
          viewBox="0 0 60 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logoGradPrimary" x1="0" y1="0" x2="60" y2="60">
              <stop offset="0%" stopColor="hsl(265 85% 65%)" />
              <stop offset="100%" stopColor="hsl(320 85% 60%)" />
            </linearGradient>
            <linearGradient id="logoGradSecondary" x1="60" y1="0" x2="0" y2="60">
              <stop offset="0%" stopColor="hsl(160 85% 45%)" />
              <stop offset="100%" stopColor="hsl(265 85% 65%)" />
            </linearGradient>
            <radialGradient id="logoGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(265 85% 65%)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx="30" cy="30" r="28" fill="url(#logoGlow)" />

          <motion.rect
            x="4" y="4" width="52" height="52" rx="14"
            stroke="url(#logoGradPrimary)"
            strokeWidth={s.stroke * 0.6}
            fill="none"
            opacity="0.3"
            variants={animate ? pathVariants : undefined}
            initial={animate ? "hidden" : undefined}
            animate={animate ? "visible" : undefined}
          />

          <motion.path
            d="M38 19C38 19 34 17 30 17C24 17 20 20 20 24C20 28 24 29 28 30C32 31 36 32 36 36C36 40 32 43 26 43C22 43 18 41 18 41"
            stroke="url(#logoGradPrimary)"
            strokeWidth={s.stroke}
            strokeLinecap="round"
            fill="none"
            variants={animate ? pathVariants : undefined}
            initial={animate ? "hidden" : undefined}
            animate={animate ? "visible" : undefined}
          />

          <motion.path
            d="M30 13V17M30 43V47"
            stroke="url(#logoGradSecondary)"
            strokeWidth={s.stroke * 0.8}
            strokeLinecap="round"
            variants={animate ? {
              hidden: { pathLength: 0, opacity: 0 },
              visible: {
                pathLength: 1,
                opacity: 1,
                transition: { duration: 0.6, delay: 0.8, ease: "easeOut" },
              },
            } : undefined}
            initial={animate ? "hidden" : undefined}
            animate={animate ? "visible" : undefined}
          />

          {animate && (
            <motion.g variants={orbVariants} animate="orbit" style={{ originX: "30px", originY: "30px" }}>
              <circle cx="52" cy="30" r="2.5" fill="hsl(160 85% 45%)" opacity="0.7" />
            </motion.g>
          )}

          {animate && (
            <motion.circle
              cx="30" cy="30" r={26}
              stroke="hsl(265 85% 65%)"
              strokeWidth="0.5"
              fill="none"
              animate={{ 
                opacity: [0.2, 0.05, 0.2],
                scale: [1, 1.08, 1],
              }}
              style={{ originX: "30px", originY: "30px" }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </svg>
      </motion.div>

      {showText && (
        <div className="flex flex-col">
          <span className={cn("font-display tracking-tighter text-primary", s.text)}>
            Skill<span className="text-secondary">syncc</span>
          </span>
          {showPoweredBy && (
            <span className="text-[8px] text-muted-foreground tracking-wider">
              Powered by Bluecoderhub
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function SkillsynccLogoTransition({ onComplete }: { onComplete?: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      onAnimationComplete={onComplete}
      style={{ pointerEvents: "none" }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: [0.5, 1.1, 1], opacity: [0, 1, 0.8] }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <SkillsynccLogo size="xl" animate />
      </motion.div>

      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ duration: 0.6 }}
        style={{
          background: "radial-gradient(circle at 50% 50%, hsl(265 85% 65% / 0.15), transparent 70%)",
        }}
      />
    </motion.div>
  );
}
