import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

/**
 * Splash animation sequence (matching brand mockup):
 * Step 0: Blank screen (~0.6s)
 * Step 1: "PRECISE" appears center
 * Step 2: "PRECISE  DM" — DM slides in
 * Step 3: Blood drop falls in between PRECISE and DM
 * Step 4: Welcome text + Next button
 */

const BloodDrop = ({ size = 52 }: { size?: number }) => (
  <svg
    width={size}
    height={size * 1.35}
    viewBox="0 0 52 70"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M26 4C26 4 6 26 6 42C6 50.837 13.163 58 22 58H30C38.837 58 46 50.837 46 42C46 26 26 4 26 4Z"
      fill="#DC2626"
    />
    <ellipse cx="19" cy="36" rx="4" ry="7" fill="white" opacity="0.25" />
  </svg>
);

const SplashScreen = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 600),   // PRECISE
      setTimeout(() => setStep(2), 1400),  // PRECISE DM
      setTimeout(() => setStep(3), 2200),  // Blood drop
      setTimeout(() => setStep(4), 3200),  // Welcome text
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 pb-32 bg-background">
      {/* Logo area */}
      <div className="flex items-center justify-center select-none" style={{ minHeight: 80 }}>
        <AnimatePresence>
          {step >= 1 && (
            <motion.div
              className="flex items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* PRECISE on white bg with blue border */}
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="text-3xl sm:text-4xl font-black italic tracking-wide px-4 py-2 border-[3px] border-primary bg-background text-foreground leading-none"
              >
                PRECISE
              </motion.span>

              {/* Blood drop - appears step 3 */}
              {step >= 3 && (
                <motion.div
                  initial={{ opacity: 0, y: -40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="relative -mx-2 z-10"
                  style={{ marginBottom: -14 }}
                >
                  <BloodDrop size={44} />
                </motion.div>
              )}

              {/* DM on blue bg - appears step 2 */}
              {step >= 2 && (
                <motion.span
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="text-3xl sm:text-4xl font-black italic tracking-wide px-4 py-2 border-[3px] border-primary bg-primary text-primary-foreground leading-none"
                >
                  DM
                </motion.span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Welcome text - step 4 */}
      <AnimatePresence>
        {step >= 4 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-10 text-center"
          >
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Welcome to PreciseDM
            </h1>
            <p className="mt-3 text-muted-foreground leading-relaxed max-w-xs mx-auto">
              Personalized insulin dosing to optimize diabetes management.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next button - step 4 */}
      <AnimatePresence>
        {step >= 4 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.35 }}
            className="fixed bottom-8 left-0 right-0 px-8"
          >
            <Button
              onClick={() => navigate("/onboarding/features")}
              className="w-full h-12 rounded-xl text-base font-semibold"
            >
              Next
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SplashScreen;
