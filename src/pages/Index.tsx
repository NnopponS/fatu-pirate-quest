import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PirateHero } from "@/components/PirateHero";
import { OpeningAnimation } from "@/components/OpeningAnimation";

const Index = () => {
  const navigate = useNavigate();
  const [showOpening, setShowOpening] = useState(true);
  const [hasSeenAnimation, setHasSeenAnimation] = useState(false);

  // Redirect to dashboard if user is logged in
  useEffect(() => {
    const participantId = localStorage.getItem("participantId");
    if (participantId) {
      navigate("/dashboard");
      return;
    }
  }, [navigate]);

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
