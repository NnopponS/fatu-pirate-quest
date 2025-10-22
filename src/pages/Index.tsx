import { useState, useEffect } from "react";
import { PirateHero } from "@/components/PirateHero";
import { OpeningAnimation } from "@/components/OpeningAnimation";

const Index = () => {
  const [showOpening, setShowOpening] = useState(true);
  const [hasSeenAnimation, setHasSeenAnimation] = useState(false);

  // Check if user has seen the animation in this session
  useEffect(() => {
    const seen = sessionStorage.getItem("hasSeenOpeningAnimation");
    if (seen === "true") {
      setShowOpening(false);
      setHasSeenAnimation(true);
    }
  }, []);

  const handleAnimationComplete = () => {
    setShowOpening(false);
    setHasSeenAnimation(true);
    sessionStorage.setItem("hasSeenOpeningAnimation", "true");
  };

  if (showOpening && !hasSeenAnimation) {
    return <OpeningAnimation onComplete={handleAnimationComplete} />;
  }

  return <PirateHero />;
};

export default Index;
