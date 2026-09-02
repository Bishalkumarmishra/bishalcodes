"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Trophy, Shield, Zap, Sparkles, Code, Copy, Check, ExternalLink, Share2, Smartphone, Monitor, ChevronRight } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';

interface HighScore {
  name: string;
  score: number;
  date: string;
}

export default function CyberPulseGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [health, setHealth] = useState(100);
  const [combo, setCombo] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<HighScore[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [submittingScore, setSubmittingScore] = useState(false);

  // Embed Modal
  const [isEmbedOpen, setIsEmbedOpen] = useState(false);
  const [embedTab, setEmbedTab] = useState<'iframe' | 'react' | 'android'>('iframe');
  const [copied, setCopied] = useState(false);

  // Web Audio Context reference for sound generation
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Game Engine Mutable State
  const engineRef = useRef({
    player: { x: 0, y: 0, width: 40, height: 40, speed: 7, shield: 100 },
    bullets: [] as { x: number; y: number; vx: number; vy: number; radius: number; color: string }[],
    enemies: [] as { x: number; y: number; radius: number; speed: number; hp: number; maxHp: number; color: string; type: 'basic' | 'fast' | 'boss' }[],
    particles: [] as { x: number; y: number; vx: number; vy: number; radius: number; color: string; alpha: number; life: number }[],
    powerups: [] as { x: number; y: number; type: 'shield' | 'triple' | 'emp'; radius: number }[],
    keys: {} as Record<string, boolean>,
    tripleShootTimer: 0,
    empFlashTimer: 0,
    animationFrameId: 0,
    lastSpawn: 0,
    lastShoot: 0,
    touchX: null as number | null
  });

  // Sound Synthesizer using Web Audio API
  const playSound = (type: 'shoot' | 'explosion' | 'hit' | 'powerup' | 'gameover') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'shoot') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'explosion') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'powerup') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'hit') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.6);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      }
    } catch (e) {
      console.warn('Audio synthesis notice:', e);
    }
  };

  useEffect(() => {
    // Load local high score
    const saved = localStorage.getItem('bishalcodes_cyber_game_highscore');
    if (saved) setHighScore(parseInt(saved, 10));

    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const q = query(collection(db, 'cyber_game_leaderboard'), orderBy('score', 'desc'), limit(10));
      const snap = await getDocs(q);
      const list: HighScore[] = snap.docs.map(d => d.data() as HighScore);
      setLeaderboard(list);
    } catch (e) {
      console.warn('Leaderboard fetch notice:', e);
    }
  };

  const handleSaveHighScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || score === 0) return;
    setSubmittingScore(true);
    try {
      const record = {
        name: playerName.trim().slice(0, 15),
        score,
        date: new Date().toLocaleDateString()
      };
      await addDoc(collection(db, 'cyber_game_leaderboard'), record);
      setLeaderboard(prev => [...prev, record].sort((a, b) => b.score - a.score).slice(0, 10));
      setPlayerName('');
    } catch (e) {
      console.warn('Error saving leaderboard score:', e);
    } finally {
      setSubmittingScore(false);
    }
  };

  // Setup Keyboard & Canvas Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'KeyA', 'KeyD', 'KeyW', 'KeyS'].includes(e.code)) {
        engineRef.current.keys[e.code] = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      engineRef.current.keys[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(engineRef.current.animationFrameId);
    };
  }, []);

  const startGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width;
    const height = canvas.height;

    engineRef.current = {
      player: { x: width / 2 - 20, y: height - 60, width: 40, height: 40, speed: 7, shield: 100 },
      bullets: [],
      enemies: [],
      particles: [],
      powerups: [],
      keys: {},
      tripleShootTimer: 0,
      empFlashTimer: 0,
      animationFrameId: 0,
      lastSpawn: Date.now(),
      lastShoot: Date.now(),
      touchX: null
    };

    setScore(0);
    setLevel(1);
    setHealth(100);
    setCombo(1);
    setGameState('playing');

    // Run game loop
    requestAnimationFrame(gameLoop);
  };

  const gameLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const engine = engineRef.current;
    const now = Date.now();

    const W = canvas.width;
    const H = canvas.height;

    // 1. Clear Screen with Cyber Grid Gradient
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, W, H);

    // Draw animated grid background
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    const gridOffset = (now / 20) % 30;
    for (let x = 0; x < W; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = gridOffset; y < H; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // EMP Flash Effect
    if (engine.empFlashTimer > 0) {
      engine.empFlashTimer--;
      ctx.fillStyle = `rgba(229, 37, 33, ${engine.empFlashTimer / 20})`;
      ctx.fillRect(0, 0, W, H);
    }

    // 2. Player Movement
    const keys = engine.keys;
    const p = engine.player;

    if ((keys['ArrowLeft'] || keys['KeyA']) && p.x > 0) {
      p.x -= p.speed;
    }
    if ((keys['ArrowRight'] || keys['KeyD']) && p.x < W - p.width) {
      p.x += p.speed;
    }
    if ((keys['ArrowUp'] || keys['KeyW']) && p.y > 50) {
      p.y -= p.speed;
    }
    if ((keys['ArrowDown'] || keys['KeyS']) && p.y < H - p.height - 10) {
      p.y += p.speed;
    }

    // Touch control support
    if (engine.touchX !== null) {
      const targetX = engine.touchX - p.width / 2;
      p.x += (targetX - p.x) * 0.25;
      if (p.x < 0) p.x = 0;
      if (p.x > W - p.width) p.x = W - p.width;
    }

    // Auto / Space Shooting
    if (now - engine.lastShoot > (engine.tripleShootTimer > 0 ? 120 : 180)) {
      engine.lastShoot = now;
      playSound('shoot');

      if (engine.tripleShootTimer > 0) {
        engine.bullets.push({ x: p.x + p.width / 2, y: p.y, vx: 0, vy: -12, radius: 4, color: '#e52521' });
        engine.bullets.push({ x: p.x + p.width / 2, y: p.y, vx: -3, vy: -11, radius: 4, color: '#ff4d4d' });
        engine.bullets.push({ x: p.x + p.width / 2, y: p.y, vx: 3, vy: -11, radius: 4, color: '#ff4d4d' });
      } else {
        engine.bullets.push({ x: p.x + p.width / 2, y: p.y, vx: 0, vy: -12, radius: 4, color: '#e52521' });
      }
    }

    if (engine.tripleShootTimer > 0) engine.tripleShootTimer--;

    // 3. Enemy Spawning
    const spawnRate = Math.max(500, 1500 - level * 100);
    if (now - engine.lastSpawn > spawnRate) {
      engine.lastSpawn = now;
      const rand = Math.random();
      if (rand > 0.85) {
        // Fast interceptor
        engine.enemies.push({
          x: Math.random() * (W - 40) + 20,
          y: -20,
          radius: 14,
          speed: 4.5 + level * 0.3,
          hp: 1,
          maxHp: 1,
          color: '#f59e0b',
          type: 'fast'
        });
      } else if (rand > 0.70 && level >= 3) {
        // Boss armored core
        engine.enemies.push({
          x: Math.random() * (W - 60) + 30,
          y: -30,
          radius: 28,
          speed: 1.5,
          hp: 6 + level,
          maxHp: 6 + level,
          color: '#ef4444',
          type: 'boss'
        });
      } else {
        // Standard enemy
        engine.enemies.push({
          x: Math.random() * (W - 40) + 20,
          y: -20,
          radius: 18,
          speed: 2 + level * 0.2,
          hp: 2,
          maxHp: 2,
          color: '#38bdf8',
          type: 'basic'
        });
      }
    }

    // 4. Update Bullets
    for (let i = engine.bullets.length - 1; i >= 0; i--) {
      const b = engine.bullets[i];
      b.x += b.vx;
      b.y += b.vy;

      // Draw Bullet
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      if (b.y < -10 || b.x < -10 || b.x > W + 10) {
        engine.bullets.splice(i, 1);
      }
    }

    // 5. Update Enemies & Collisions
    for (let i = engine.enemies.length - 1; i >= 0; i--) {
      const e = engine.enemies[i];
      e.y += e.speed;

      // Draw Enemy
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.beginPath();
      ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
      ctx.fillStyle = e.color;
      ctx.shadowColor = e.color;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Health bar for boss/armored
      if (e.maxHp > 1) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-e.radius, -e.radius - 8, e.radius * 2, 4);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(-e.radius, -e.radius - 8, (e.radius * 2 * e.hp) / e.maxHp, 4);
      }
      ctx.restore();

      // Bullet Collision with Enemy
      for (let j = engine.bullets.length - 1; j >= 0; j--) {
        const b = engine.bullets[j];
        const dist = Math.hypot(b.x - e.x, b.y - e.y);
        if (dist < b.radius + e.radius) {
          e.hp--;
          engine.bullets.splice(j, 1);

          // Hit Spark Particle
          for (let k = 0; k < 4; k++) {
            engine.particles.push({
              x: b.x,
              y: b.y,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              radius: Math.random() * 2 + 1,
              color: b.color,
              alpha: 1,
              life: 15
            });
          }

          if (e.hp <= 0) {
            // Destroy Enemy
            playSound('explosion');

            // Powerup drop chance (15%)
            if (Math.random() < 0.15) {
              const types: ('shield' | 'triple' | 'emp')[] = ['shield', 'triple', 'emp'];
              engine.powerups.push({
                x: e.x,
                y: e.y,
                type: types[Math.floor(Math.random() * types.length)],
                radius: 12
              });
            }

            // Explosion Particles
            for (let k = 0; k < 14; k++) {
              engine.particles.push({
                x: e.x,
                y: e.y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                radius: Math.random() * 4 + 2,
                color: e.color,
                alpha: 1,
                life: 25
              });
            }

            // Score calculation
            const pts = (e.type === 'boss' ? 300 : e.type === 'fast' ? 150 : 100) * combo;
            setScore(prev => {
              const next = prev + pts;
              if (next > highScore) {
                setHighScore(next);
                localStorage.setItem('bishalcodes_cyber_game_highscore', next.toString());
              }
              // Level Up every 1500 points
              const newLevel = Math.floor(next / 1500) + 1;
              if (newLevel !== level) setLevel(newLevel);
              return next;
            });

            engine.enemies.splice(i, 1);
            break;
          }
        }
      }

      // Player Collision with Enemy
      const distToPlayer = Math.hypot(p.x + p.width / 2 - e.x, p.y + p.height / 2 - e.y);
      if (distToPlayer < p.width / 2 + e.radius) {
        playSound('hit');
        const dmg = e.type === 'boss' ? 30 : 15;
        p.shield -= dmg;
        setHealth(Math.max(0, p.shield));
        engine.enemies.splice(i, 1);

        if (p.shield <= 0) {
          playSound('gameover');
          setGameState('gameover');
          return;
        }
      }

      // Enemy past screen
      if (e.y > H + 20) {
        engine.enemies.splice(i, 1);
        p.shield -= 5;
        setHealth(Math.max(0, p.shield));
        if (p.shield <= 0) {
          playSound('gameover');
          setGameState('gameover');
          return;
        }
      }
    }

    // 6. Update Powerups
    for (let i = engine.powerups.length - 1; i >= 0; i--) {
      const pw = engine.powerups[i];
      pw.y += 2;

      // Draw Powerup
      ctx.save();
      ctx.beginPath();
      ctx.arc(pw.x, pw.y, pw.radius, 0, Math.PI * 2);
      ctx.fillStyle = pw.type === 'shield' ? '#10b981' : pw.type === 'triple' ? '#e52521' : '#8b5cf6';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();

      // Catch Powerup
      const dist = Math.hypot(p.x + p.width / 2 - pw.x, p.y + p.height / 2 - pw.y);
      if (dist < p.width / 2 + pw.radius) {
        playSound('powerup');
        if (pw.type === 'shield') {
          p.shield = Math.min(100, p.shield + 30);
          setHealth(p.shield);
        } else if (pw.type === 'triple') {
          engine.tripleShootTimer = 300; // 5 seconds
        } else if (pw.type === 'emp') {
          engine.empFlashTimer = 15;
          // Clear all enemies on screen
          engine.enemies.forEach(e => {
            for (let k = 0; k < 8; k++) {
              engine.particles.push({
                x: e.x,
                y: e.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                radius: 3,
                color: '#e52521',
                alpha: 1,
                life: 20
              });
            }
          });
          engine.enemies = [];
          setScore(prev => prev + 500);
        }
        engine.powerups.splice(i, 1);
      } else if (pw.y > H + 20) {
        engine.powerups.splice(i, 1);
      }
    }

    // 7. Update Particles
    for (let i = engine.particles.length - 1; i >= 0; i--) {
      const pt = engine.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life--;
      pt.alpha = pt.life / 25;

      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.alpha);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fillStyle = pt.color;
      ctx.fill();
      ctx.restore();

      if (pt.life <= 0) {
        engine.particles.splice(i, 1);
      }
    }

    // 8. Draw Player Cyber Defender Ship (Black & Red `#e52521`)
    ctx.save();
    ctx.translate(p.x + p.width / 2, p.y + p.height / 2);

    // Ship Thruster Trail
    ctx.beginPath();
    ctx.moveTo(-8, p.height / 2);
    ctx.lineTo(0, p.height / 2 + Math.random() * 14 + 6);
    ctx.lineTo(8, p.height / 2);
    ctx.fillStyle = '#e52521';
    ctx.shadowColor = '#e52521';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Ship Wings & Body (Sleek Red/Black Polygon)
    ctx.beginPath();
    ctx.moveTo(0, -p.height / 2); // Nose
    ctx.lineTo(p.width / 2, p.height / 2);
    ctx.lineTo(p.width / 4, p.height / 3);
    ctx.lineTo(0, p.height / 2);
    ctx.lineTo(-p.width / 4, p.height / 3);
    ctx.lineTo(-p.width / 2, p.height / 2);
    ctx.closePath();
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#e52521';
    ctx.lineWidth = 2.5;
    ctx.fill();
    ctx.stroke();

    // Energy Core Center
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#e52521';
    ctx.shadowColor = '#e52521';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();

    // Continue loop if playing
    engine.animationFrameId = requestAnimationFrame(gameLoop);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    if (touch) {
      engineRef.current.touchX = touch.clientX - rect.left;
    }
  };

  const handleTouchEnd = () => {
    engineRef.current.touchX = null;
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bishalcodes.com';
  const embedUrl = `${origin}/tools/cyber-defender?embed=true`;

  const getEmbedCode = () => {
    if (embedTab === 'iframe') {
      return `<!-- CyberPulse Defender Game | Powered by Bishal Codes -->
<iframe src="${embedUrl}" width="100%" height="680" frameborder="0" style="border:1px solid #e2e8f0; border-radius:20px; box-shadow:0 10px 30px rgba(0,0,0,0.1);" allow="autoplay"></iframe>`;
    } else if (embedTab === 'react') {
      return `import React from 'react';

export const CyberDefenderWidget = () => (
  <iframe
    src="${embedUrl}"
    width="100%"
    height="680"
    style={{ border: '1px solid #e2e8f0', borderRadius: '20px' }}
    title="CyberPulse Defender"
  />
);`;
    } else {
      return `// Android Webview Embed
WebView webView = findViewById(R.id.cyber_game_webview);
webView.getSettings().setJavaScriptEnabled(true);
webView.loadUrl("${embedUrl}");`;
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getEmbedCode()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 text-left">
      
      {/* Top Header & Embed Action */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#e52521]/10 border border-[#e52521]/20 text-[#e52521] rounded-lg text-xs font-semibold uppercase tracking-wider mb-2">
            <Zap size={14} /> Handcrafted Arcade Engine
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">CyberPulse Defender 2026</h1>
          <p className="text-slate-500 text-xs mt-1">
            Defend the cyber grid from rogue malware waves. Built natively with HTML5 Canvas, Web Audio API & Zero Dependencies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 cursor-pointer"
            title="Toggle Sound Effects"
          >
            {soundEnabled ? <Volume2 size={16} className="text-[#e52521]" /> : <VolumeX size={16} className="text-slate-400" />}
          </button>

          <button
            onClick={() => setIsEmbedOpen(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer border border-slate-800"
          >
            <Code size={15} className="text-[#e52521]" /> Embed Game
          </button>
        </div>
      </div>

      {/* Main Game Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Canvas Display Column (lg:col-span-8) */}
        <div className="lg:col-span-8 bg-slate-955 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
          
          {/* HUD Top Bar */}
          <div className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl text-white text-xs font-mono mb-3 z-10">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Shield size={14} className="text-emerald-400" />
                <span className="font-bold text-emerald-400">{health}%</span>
              </div>
              <div className="text-slate-400">
                LEVEL: <span className="text-white font-bold">{level}</span>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="text-slate-400">
                SCORE: <span className="text-[#e52521] font-bold text-sm">{score}</span>
              </div>
              <div className="text-slate-400 hidden sm:block">
                HIGH: <span className="text-amber-400 font-bold">{highScore}</span>
              </div>
            </div>
          </div>

          {/* HTML5 Canvas */}
          <div className="relative w-full aspect-[4/3] max-h-[520px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
            
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="w-full h-full object-contain cursor-crosshair touch-none"
            />

            {/* Overlay Screens */}
            {gameState === 'start' && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white space-y-5 animate-in fade-in">
                <div className="w-16 h-16 rounded-2xl bg-[#e52521]/10 border border-[#e52521]/40 flex items-center justify-center text-[#e52521] shadow-lg shadow-[#e52521]/20">
                  <Zap size={36} />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-white">CYBERPULSE DEFENDER</h2>
                  <p className="text-slate-400 text-xs mt-1.5 max-w-sm">
                    Control your defender ship using <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300">A / D</kbd> or <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300">Arrow Keys</kbd> (or touch on mobile). Shoot rogue malware cores & catch power-ups!
                  </p>
                </div>
                <button
                  onClick={startGame}
                  className="px-8 py-3.5 bg-[#e52521] hover:bg-[#d01f1c] text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#e52521]/30 flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Play size={16} /> Start Game
                </button>
              </div>
            )}

            {gameState === 'gameover' && (
              <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white space-y-5 animate-in fade-in">
                <div className="text-rose-500 font-black text-3xl tracking-tighter uppercase">SYSTEM COMPROMISED</div>
                <div>
                  <div className="text-slate-400 text-xs uppercase tracking-wider">Final Score</div>
                  <div className="text-4xl font-black text-white mt-1">{score}</div>
                  {score >= highScore && score > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-xs font-bold mt-2">
                      <Trophy size={13} /> New Personal Best!
                    </div>
                  )}
                </div>

                {/* Submit High Score Form */}
                <form onSubmit={handleSaveHighScore} className="flex items-center gap-2 max-w-xs w-full">
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter your name..."
                    maxLength={15}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#e52521]"
                  />
                  <button
                    type="submit"
                    disabled={submittingScore || !playerName.trim()}
                    className="px-4 py-2 bg-[#e52521] text-white font-bold text-xs rounded-xl disabled:opacity-50"
                  >
                    Save
                  </button>
                </form>

                <button
                  onClick={startGame}
                  className="px-6 py-3 bg-white text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-100 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw size={14} /> Play Again
                </button>
              </div>
            )}

          </div>

          {/* Controls Footer */}
          <div className="w-full flex items-center justify-between text-[11px] text-slate-400 pt-3 font-mono">
            <span className="hidden sm:inline">Desktop Controls: Arrow Keys / A-D to Move | Auto Laser Active</span>
            <span className="sm:hidden">Touch & Drag to Move Ship</span>
            <span className="text-[#e52521] font-bold">100% Handcrafted HTML5 Canvas</span>
          </div>

        </div>

        {/* Global Leaderboard Column (lg:col-span-4) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="text-amber-500" size={16} /> Global Leaderboard
            </h3>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Top 10</span>
          </div>

          <div className="space-y-2">
            {leaderboard.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs italic">
                No high scores posted yet. Be the first to claim the #1 spot!
              </div>
            ) : (
              leaderboard.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                    idx === 0
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 font-bold'
                      : idx === 1
                      ? 'bg-slate-100 border-slate-200 text-slate-900 font-semibold'
                      : idx === 2
                      ? 'bg-amber-900/5 border-amber-900/20 text-slate-800'
                      : 'bg-slate-50 border-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-full text-[10px] font-extrabold flex items-center justify-center ${
                      idx === 0 ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="text-xs truncate max-w-[110px]">{item.name}</span>
                  </div>
                  <span className="font-mono text-xs font-extrabold text-[#e52521]">{item.score.toLocaleString()} pts</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Embed Game Modal */}
      {isEmbedOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-2xl w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-5 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#e52521]/10 text-[#e52521] flex items-center justify-center border border-[#e52521]/20">
                  <Code size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Embed CyberPulse Defender</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Add this game directly to your website, blog, or mobile app</p>
                </div>
              </div>
              <button
                onClick={() => setIsEmbedOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Tab Selector */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setEmbedTab('iframe')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  embedTab === 'iframe' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Monitor size={14} /> HTML iFrame
              </button>
              <button
                onClick={() => setEmbedTab('react')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  embedTab === 'react' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Code size={14} /> React
              </button>
              <button
                onClick={() => setEmbedTab('android')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  embedTab === 'android' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Smartphone size={14} /> Android Webview
              </button>
            </div>

            {/* Code Box */}
            <div className="relative bg-slate-900 text-emerald-400 rounded-xl p-4 font-mono text-[11px] border border-slate-800 overflow-x-auto select-all leading-relaxed">
              <pre className="whitespace-pre-wrap break-all">{getEmbedCode()}</pre>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500 font-medium">Includes Bishal Codes License & Free Hosting</span>
              <button
                onClick={handleCopyCode}
                className="bg-[#e52521] hover:bg-[#d01f1c] text-white font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied Code!' : 'Copy Embed Code'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
