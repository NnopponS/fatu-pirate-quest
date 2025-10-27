import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Trophy } from "lucide-react";
import { PirateBackdrop } from "@/components/PirateBackdrop";

// Game constants
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const BIRD_WIDTH = 40;
const BIRD_HEIGHT = 30;
const GRAVITY = 0.5;
const JUMP_STRENGTH = -8;
const PIPE_WIDTH = 60;
const PIPE_GAP = 180;
const PIPE_SPEED = 2;
const SPAWN_INTERVAL = 1500; // milliseconds

interface Bird {
  x: number;
  y: number;
  velocity: number;
}

interface Pipe {
  x: number;
  topHeight: number;
  scored: boolean;
}

const FlappyBird = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameOver">("idle");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("flappyBirdHighScore");
    return saved ? parseInt(saved) : 0;
  });

  const birdRef = useRef<Bird>({ x: 100, y: 300, velocity: 0 });
  const pipesRef = useRef<Pipe[]>([]);
  const lastSpawnRef = useRef(0);
  const animationRef = useRef<number>();

  const resetGame = useCallback(() => {
    birdRef.current = { x: 100, y: 300, velocity: 0 };
    pipesRef.current = [];
    lastSpawnRef.current = 0;
    setScore(0);
    setGameState("idle");
  }, []);

  const jump = useCallback(() => {
    if (gameState === "idle") {
      setGameState("playing");
    }
    if (gameState !== "gameOver") {
      birdRef.current.velocity = JUMP_STRENGTH;
    }
  }, [gameState]);

  const checkCollision = useCallback((bird: Bird, pipes: Pipe[]): boolean => {
    // Check ground/ceiling collision
    if (bird.y + BIRD_HEIGHT >= CANVAS_HEIGHT || bird.y <= 0) {
      return true;
    }

    // Check pipe collision
    for (const pipe of pipes) {
      if (
        bird.x + BIRD_WIDTH > pipe.x &&
        bird.x < pipe.x + PIPE_WIDTH &&
        (bird.y < pipe.topHeight || bird.y + BIRD_HEIGHT > pipe.topHeight + PIPE_GAP)
      ) {
        return true;
      }
    }

    return false;
  }, []);

  const updateGame = useCallback((timestamp: number) => {
    if (gameState !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Update bird
    const bird = birdRef.current;
    bird.velocity += GRAVITY;
    bird.y += bird.velocity;

    // Spawn pipes
    if (timestamp - lastSpawnRef.current > SPAWN_INTERVAL) {
      const minHeight = 50;
      const maxHeight = CANVAS_HEIGHT - PIPE_GAP - 50;
      const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
      pipesRef.current.push({
        x: CANVAS_WIDTH,
        topHeight,
        scored: false,
      });
      lastSpawnRef.current = timestamp;
    }

    // Update pipes
    pipesRef.current = pipesRef.current.filter((pipe) => pipe.x + PIPE_WIDTH > 0);
    pipesRef.current.forEach((pipe) => {
      pipe.x -= PIPE_SPEED;

      // Score when bird passes pipe
      if (!pipe.scored && pipe.x + PIPE_WIDTH < bird.x) {
        pipe.scored = true;
        setScore((prev) => prev + 1);
      }
    });

    // Check collision
    if (checkCollision(bird, pipesRef.current)) {
      setGameState("gameOver");
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem("flappyBirdHighScore", score.toString());
      }
      return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(1, "#B0E0E6");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw pipes
    pipesRef.current.forEach((pipe) => {
      // Top pipe (wood texture)
      ctx.fillStyle = "#8B4513";
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
      ctx.strokeStyle = "#654321";
      ctx.lineWidth = 2;
      ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);

      // Bottom pipe
      ctx.fillRect(pipe.x, pipe.topHeight + PIPE_GAP, PIPE_WIDTH, CANVAS_HEIGHT - pipe.topHeight - PIPE_GAP);
      ctx.strokeRect(pipe.x, pipe.topHeight + PIPE_GAP, PIPE_WIDTH, CANVAS_HEIGHT - pipe.topHeight - PIPE_GAP);

      // Pipe caps
      ctx.fillStyle = "#654321";
      ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, PIPE_WIDTH + 10, 20);
      ctx.fillRect(pipe.x - 5, pipe.topHeight + PIPE_GAP, PIPE_WIDTH + 10, 20);
    });

    // Draw bird (pirate ship emoji style)
    ctx.save();
    ctx.translate(bird.x + BIRD_WIDTH / 2, bird.y + BIRD_HEIGHT / 2);
    ctx.rotate((bird.velocity * Math.PI) / 180 / 3);
    ctx.font = "40px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🏴‍☠️", 0, 0);
    ctx.restore();

    // Draw ocean waves at bottom
    ctx.fillStyle = "#1E90FF";
    ctx.beginPath();
    for (let x = 0; x < CANVAS_WIDTH; x += 20) {
      const y = CANVAS_HEIGHT - 30 + Math.sin((x + timestamp / 100) / 20) * 5;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.lineTo(0, CANVAS_HEIGHT);
    ctx.closePath();
    ctx.fill();

    // Draw score
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "center";
    ctx.strokeText(`${score}`, CANVAS_WIDTH / 2, 50);
    ctx.fillText(`${score}`, CANVAS_WIDTH / 2, 50);

    animationRef.current = requestAnimationFrame(updateGame);
  }, [gameState, score, highScore, checkCollision]);

  const drawIdleScreen = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Sky
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(1, "#B0E0E6");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Ocean
    ctx.fillStyle = "#1E90FF";
    ctx.fillRect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);

    // Bird
    const bird = birdRef.current;
    bird.y = 250 + Math.sin(Date.now() / 200) * 10; // Floating animation
    ctx.font = "60px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🏴‍☠️", bird.x + BIRD_WIDTH / 2, bird.y + BIRD_HEIGHT / 2);

    // Title
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 4;
    ctx.font = "bold 40px Arial";
    ctx.strokeText("Pirate Flyer", CANVAS_WIDTH / 2, 100);
    ctx.fillText("Pirate Flyer", CANVAS_WIDTH / 2, 100);

    // Instructions
    ctx.font = "bold 20px Arial";
    ctx.lineWidth = 3;
    ctx.strokeText("คลิกเพื่อบิน!", CANVAS_WIDTH / 2, 400);
    ctx.fillText("คลิกเพื่อบิน!", CANVAS_WIDTH / 2, 400);

    ctx.font = "16px Arial";
    ctx.lineWidth = 2;
    ctx.strokeText("หลบท่อนไม้ให้มากที่สุด!", CANVAS_WIDTH / 2, 440);
    ctx.fillText("หลบท่อนไม้ให้มากที่สุด!", CANVAS_WIDTH / 2, 440);
  }, []);

  useEffect(() => {
    if (gameState === "idle") {
      const interval = setInterval(drawIdleScreen, 50);
      return () => clearInterval(interval);
    } else if (gameState === "playing") {
      animationRef.current = requestAnimationFrame(updateGame);
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [gameState, updateGame, drawIdleScreen]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [jump]);

  return (
    <PirateBackdrop>
      <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col items-center justify-center gap-6">
        {/* Header */}
        <div className="pirate-card px-6 py-4 flex items-center justify-between w-full max-w-md">
          <Button variant="outline" size="sm" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            กลับหน้าแรก
          </Button>
          <div className="flex items-center gap-2 text-yellow-600 font-bold">
            <Trophy className="h-5 w-5" />
            สูงสุด: {highScore}
          </div>
        </div>

        {/* Game Canvas */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onClick={jump}
            className="border-4 border-primary rounded-2xl shadow-2xl cursor-pointer bg-sky-200"
            style={{ maxWidth: "100%", height: "auto" }}
          />

          {/* Game Over Overlay */}
          {gameState === "gameOver" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-2xl">
              <div className="pirate-card px-8 py-6 text-center space-y-4">
                <h2 className="text-3xl font-bold text-primary">เกมจบ!</h2>
                <div className="space-y-2">
                  <p className="text-2xl font-bold">คะแนน: {score}</p>
                  {score > highScore && (
                    <p className="text-yellow-600 font-bold animate-bounce">🎉 สถิติใหม่! 🎉</p>
                  )}
                  <p className="text-lg">สูงสุด: {highScore}</p>
                </div>
                <Button onClick={resetGame} className="gap-2 pirate-button">
                  <RotateCcw className="h-4 w-4" />
                  เล่นอีกครั้ง
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="pirate-card px-6 py-4 max-w-md text-center space-y-2">
          <p className="font-semibold text-primary">วิธีเล่น:</p>
          <p className="text-sm text-foreground/80">
            คลิกที่หน้าจอ หรือกด <kbd className="px-2 py-1 bg-gray-200 rounded border">Space</kbd> เพื่อให้โจรสลัดบิน
          </p>
          <p className="text-sm text-foreground/80">หลีกเลี่ยงท่อนไม้และอย่าให้ตกน้ำ!</p>
        </div>
      </div>
    </PirateBackdrop>
  );
};

export default FlappyBird;

