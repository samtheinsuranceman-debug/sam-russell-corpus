import { useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";

// ============================================================
// COSMOS CANVAS — 300 bright stars, 3 depth layers, shooting stars,
// 7 nebula clouds. Mouse-reactive parallax. Undeniably visible.
// ============================================================
function CosmosCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    stars: Array<{
      x: number; y: number; z: number; size: number;
      luminosityClass: number; baseOpacity: number; haloMult: number;
      spikeType: 0 | 4 | 6; vx: number; vy: number; vz: number;
      pulseSpeed: number; pulsePhase: number; hue: number;
    }>;
    shootingStars: Array<{
      x: number; y: number; vx: number; vy: number;
      life: number; maxLife: number; size: number;
    }>;
    nebulae: Array<{
      x: number; y: number; radius: number; hue: number;
      opacity: number; vx: number; vy: number; pulsePhase: number;
    }>;
    mouseX: number; mouseY: number; time: number; lastShoot: number;
  } | null>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Mouse tracking for parallax
    const onMouse = (e: MouseEvent) => {
      if (stateRef.current) {
        stateRef.current.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        stateRef.current.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
      }
    };
    window.addEventListener("mousemove", onMouse);

    if (!stateRef.current) {
      // 5 LUMINOSITY CLASSES — each with distinct visual character
      // Class 0: Dim dwarfs (tiny, faint, no halo, fast twinkle)
      // Class 1: Common stars (small-medium, soft glow, no spikes)
      // Class 2: Bright giants (medium, visible halo, slow pulse)
      // Class 3: Supergiants (large, wide halo, 4-point diffraction)
      // Class 4: Hypergiants (huge, intense glow, 6-point diffraction, color-shifted)
      const stars = Array.from({ length: 300 }, () => {
        const z = Math.random(); // 0=far, 1=near
        // Weighted class distribution: many dim, few bright
        const classRoll = Math.random();
        const luminosityClass = classRoll < 0.35 ? 0
          : classRoll < 0.60 ? 1
          : classRoll < 0.80 ? 2
          : classRoll < 0.93 ? 3
          : 4;

        // Each class has unique proportions
        const classProps = [
          { sizeMin: 0.3, sizeMax: 0.7, opacityBase: 0.25, opacityZ: 0.3, haloMult: 0, spikeType: 0, pulseMin: 1.5, pulseMax: 3.5, hueShift: 0 },
          { sizeMin: 0.7, sizeMax: 1.5, opacityBase: 0.35, opacityZ: 0.45, haloMult: 2.0, spikeType: 0, pulseMin: 0.8, pulseMax: 2.0, hueShift: 0 },
          { sizeMin: 1.4, sizeMax: 2.8, opacityBase: 0.5, opacityZ: 0.5, haloMult: 3.0, spikeType: 0, pulseMin: 0.3, pulseMax: 0.8, hueShift: 10 },
          { sizeMin: 2.5, sizeMax: 4.0, opacityBase: 0.6, opacityZ: 0.4, haloMult: 4.5, spikeType: 4, pulseMin: 0.2, pulseMax: 0.5, hueShift: 20 },
          { sizeMin: 3.5, sizeMax: 5.5, opacityBase: 0.75, opacityZ: 0.25, haloMult: 6.0, spikeType: 6, pulseMin: 0.1, pulseMax: 0.3, hueShift: 40 },
        ][luminosityClass];

        const size = classProps.sizeMin + Math.random() * (classProps.sizeMax - classProps.sizeMin);
        const speed = (0.02 + z * 0.1) * (Math.random() > 0.5 ? 1 : -1);
        // Hypergiants tend toward warm white/gold, dwarfs toward cool blue
        const baseHue = luminosityClass >= 3 ? 180 + Math.random() * 40 : 190 + Math.random() * 70;

        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          z,
          size,
          luminosityClass,
          baseOpacity: classProps.opacityBase + z * classProps.opacityZ,
          haloMult: classProps.haloMult,
          spikeType: classProps.spikeType as 0 | 4 | 6,
          vx: speed * (Math.random() - 0.5),
          vy: speed * (Math.random() - 0.5) * 0.5,
          vz: (Math.random() - 0.5) * 0.0006,
          pulseSpeed: classProps.pulseMin + Math.random() * (classProps.pulseMax - classProps.pulseMin),
          pulsePhase: Math.random() * Math.PI * 2,
          hue: baseHue + classProps.hueShift,
        };
      });

      // 7 nebula clouds — UNMISTAKABLE colored clouds
      const nebulae = Array.from({ length: 7 }, (_, i) => ({
        x: (canvas.width * (i + 0.5)) / 7 + (Math.random() - 0.5) * 150,
        y: canvas.height * 0.15 + Math.random() * canvas.height * 0.7,
        radius: 120 + Math.random() * 180, // Smaller = more concentrated = more visible
        hue: [210, 270, 170, 300, 195, 245, 160][i],
        opacity: 0.30 + Math.random() * 0.20, // 30-50% — you WILL see these
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.12,
        pulsePhase: Math.random() * Math.PI * 2,
      }));

      stateRef.current = {
        stars,
        shootingStars: [],
        nebulae,
        mouseX: 0,
        mouseY: 0,
        time: 0,
        lastShoot: 0,
      };
    }

    const draw = () => {
      const s = stateRef.current!;
      s.time += 0.016;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw nebula clouds FIRST (background)
      for (const n of s.nebulae) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -n.radius) n.x = canvas.width + n.radius;
        if (n.x > canvas.width + n.radius) n.x = -n.radius;
        if (n.y < -n.radius) n.y = canvas.height + n.radius;
        if (n.y > canvas.height + n.radius) n.y = -n.radius;

        const pulse = 0.75 + 0.25 * Math.sin(s.time * 0.3 + n.pulsePhase);
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius);
        grad.addColorStop(0, `hsla(${n.hue}, 95%, 65%, ${n.opacity * pulse})`);
        grad.addColorStop(0.25, `hsla(${n.hue}, 85%, 55%, ${n.opacity * pulse * 0.7})`);
        grad.addColorStop(0.5, `hsla(${n.hue}, 75%, 45%, ${n.opacity * pulse * 0.35})`);
        grad.addColorStop(0.8, `hsla(${n.hue}, 60%, 35%, ${n.opacity * pulse * 0.1})`);
        grad.addColorStop(1, `hsla(${n.hue}, 50%, 30%, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(n.x - n.radius, n.y - n.radius, n.radius * 2, n.radius * 2);
      }

      // Draw stars — 5 luminosity classes with distinct rendering
      for (const star of s.stars) {
        star.x += star.vx;
        star.y += star.vy;
        star.z += star.vz;
        if (star.z < 0) { star.z = 1; star.x = Math.random() * canvas.width; star.y = Math.random() * canvas.height; }
        if (star.z > 1) { star.z = 0; star.x = Math.random() * canvas.width; star.y = Math.random() * canvas.height; }
        if (star.x < -30) star.x = canvas.width + 30;
        if (star.x > canvas.width + 30) star.x = -30;
        if (star.y < -30) star.y = canvas.height + 30;
        if (star.y > canvas.height + 30) star.y = -30;

        // Parallax offset based on mouse and depth
        const parallax = star.z * 40;
        const px = star.x + s.mouseX * parallax;
        const py = star.y + s.mouseY * parallax;

        // Twinkle — dim dwarfs flicker fast, hypergiants pulse slowly
        const twinkle = 0.5 + 0.5 * Math.sin(s.time * star.pulseSpeed + star.pulsePhase);
        const opacity = star.baseOpacity * twinkle;
        const currentSize = star.size * (0.7 + star.z * 0.5);

        // === CLASS 0: Dim dwarfs — tiny dots, no halo, just a point ===
        if (star.luminosityClass === 0) {
          ctx.beginPath();
          ctx.arc(px, py, currentSize, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${star.hue}, 50%, 85%, ${opacity})`;
          ctx.fill();
        }
        // === CLASS 1: Common stars — small core + subtle soft glow ===
        else if (star.luminosityClass === 1) {
          ctx.beginPath();
          ctx.arc(px, py, currentSize, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${star.hue}, 65%, 92%, ${opacity})`;
          ctx.fill();
          // Soft glow
          if (opacity > 0.3) {
            ctx.beginPath();
            ctx.arc(px, py, currentSize * star.haloMult, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${star.hue}, 70%, 85%, ${opacity * 0.1})`;
            ctx.fill();
          }
        }
        // === CLASS 2: Bright giants — visible halo ring, warmer core ===
        else if (star.luminosityClass === 2) {
          // Warm white core
          ctx.beginPath();
          ctx.arc(px, py, currentSize, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${star.hue}, 60%, 96%, ${opacity})`;
          ctx.fill();
          // Distinct halo
          ctx.beginPath();
          ctx.arc(px, py, currentSize * star.haloMult, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${star.hue}, 75%, 80%, ${opacity * 0.15})`;
          ctx.fill();
          // Secondary outer glow
          ctx.beginPath();
          ctx.arc(px, py, currentSize * star.haloMult * 1.8, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${star.hue}, 60%, 70%, ${opacity * 0.05})`;
          ctx.fill();
        }
        // === CLASS 3: Supergiants — large halo + 4-point diffraction spikes ===
        else if (star.luminosityClass === 3) {
          // Bright white-blue core
          ctx.beginPath();
          ctx.arc(px, py, currentSize, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${star.hue - 10}, 55%, 97%, ${opacity})`;
          ctx.fill();
          // Wide halo
          ctx.beginPath();
          ctx.arc(px, py, currentSize * star.haloMult, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${star.hue}, 80%, 82%, ${opacity * 0.2})`;
          ctx.fill();
          // 4-point diffraction spikes (cross pattern)
          const spikeLen = currentSize * 7;
          ctx.strokeStyle = `hsla(${star.hue}, 65%, 92%, ${opacity * 0.4})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(px - spikeLen, py);
          ctx.lineTo(px + spikeLen, py);
          ctx.moveTo(px, py - spikeLen);
          ctx.lineTo(px, py + spikeLen);
          ctx.stroke();
        }
        // === CLASS 4: Hypergiants — massive glow + 6-point diffraction + color corona ===
        else {
          // Intense white core
          ctx.beginPath();
          ctx.arc(px, py, currentSize, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${star.hue - 20}, 40%, 98%, ${opacity})`;
          ctx.fill();
          // Inner colored corona
          ctx.beginPath();
          ctx.arc(px, py, currentSize * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${star.hue}, 90%, 75%, ${opacity * 0.25})`;
          ctx.fill();
          // Wide outer halo
          ctx.beginPath();
          ctx.arc(px, py, currentSize * star.haloMult, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${star.hue + 10}, 70%, 70%, ${opacity * 0.12})`;
          ctx.fill();
          // 6-point diffraction spikes (hexagonal pattern)
          const spikeLen = currentSize * 10;
          ctx.strokeStyle = `hsla(${star.hue}, 60%, 94%, ${opacity * 0.35})`;
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          for (let a = 0; a < 6; a++) {
            const angle = (a * Math.PI) / 3;
            ctx.moveTo(px, py);
            ctx.lineTo(px + Math.cos(angle) * spikeLen, py + Math.sin(angle) * spikeLen);
          }
          ctx.stroke();
          // Faint outermost bloom
          ctx.beginPath();
          ctx.arc(px, py, currentSize * star.haloMult * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${star.hue + 20}, 50%, 60%, ${opacity * 0.04})`;
          ctx.fill();
        }
      }

      // Shooting stars — spawn every 2-4 seconds
      if (s.time - s.lastShoot > 2 + Math.random() * 2) {
        s.lastShoot = s.time;
        const fromRight = Math.random() > 0.5;
        s.shootingStars.push({
          x: fromRight ? canvas.width * (0.3 + Math.random() * 0.7) : Math.random() * canvas.width * 0.7,
          y: Math.random() * canvas.height * 0.4,
          vx: (fromRight ? -1 : 1) * (7 + Math.random() * 8),
          vy: 3 + Math.random() * 5,
          life: 0,
          maxLife: 35 + Math.random() * 35,
          size: 1.5 + Math.random() * 2,
        });
      }

      // Draw shooting stars with glowing trails
      s.shootingStars = s.shootingStars.filter((ss) => {
        ss.x += ss.vx;
        ss.y += ss.vy;
        ss.life++;
        const progress = ss.life / ss.maxLife;
        const alpha = progress < 0.1 ? progress * 10 : Math.max(0, 1 - (progress - 0.1) / 0.9);

        // Glowing trail
        const trailLen = 10;
        const grad = ctx.createLinearGradient(
          ss.x, ss.y,
          ss.x - ss.vx * trailLen, ss.y - ss.vy * trailLen
        );
        grad.addColorStop(0, `hsla(200, 95%, 97%, ${alpha * 0.95})`);
        grad.addColorStop(0.3, `hsla(210, 90%, 90%, ${alpha * 0.6})`);
        grad.addColorStop(1, `hsla(220, 80%, 80%, 0)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = ss.size;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(ss.x - ss.vx * trailLen, ss.y - ss.vy * trailLen);
        ctx.stroke();

        // Bright head
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, ss.size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(200, 95%, 97%, ${alpha * 0.7})`;
        ctx.fill();

        return ss.life < ss.maxLife;
      });

      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

// ============================================================
// PAGE VIGNETTE — Depth. The center glows. Edges recede.
// ============================================================
function PageVignette() {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: -1,
        background: `radial-gradient(ellipse at 50% 30%, oklch(0.18 0.04 260) 0%, oklch(0.14 0.035 260) 50%, oklch(0.10 0.03 260) 100%)`,
      }}
    />
  );
}

// ============================================================
// FLOATING DEPTH FIELD — Formulas AND family photos together.
// True 3D: perspective, z-axis motion, scale, opacity all tied to depth.
// Mouse parallax: near objects shift more, far objects barely move.
// Family photos fade in/out at different z-depths.
// ============================================================
const FAMILY_PHOTOS = [
  { src: "/aqal-storage/family_father_children_65dda520.png", label: "father-children" },
  { src: "/aqal-storage/family_together_e25ef6bf.png", label: "family-together" },
];

const FORMULAS = [
  "E = mc²", "φ = 1.618...", "∑(Iₙ × Wₙ) = Q", "∫₀^∞ f(x)dx",
  "P(A|B) = P(B|A)·P(A)/P(B)", "∇·E = ρ/ε₀", "eⁱᵖ + 1 = 0",
  "∂u/∂t = α∇²u", "F = G(m₁m₂)/r²", "H = -Σ pᵢ log pᵢ",
  "d/dx sin x = cos x", "lim(1+1/n)ⁿ = e", "∑ 1/n² = π²/6",
  "λ = h/mv", "∮ E·dA = Q/ε₀", "∇×B = μ₀J",
  "det(A-λI) = 0", "∮ E·dl", "σ = √(Σ(x-μ)²/N)", "Ae^λt",
];

function FloatingDepthField() {
  // Combine formulas + photos into one depth field
  const elements = useMemo(() => {
    const items: Array<{
      type: "formula" | "photo";
      content: string;
      src?: string;
      x: number;
      y: number;
      z: number;
      zDuration: number;
      driftX: number;
      driftY: number;
      delay: number;
      size: number;
    }> = [];

    // 20 formulas
    FORMULAS.forEach((text, i) => {
      items.push({
        type: "formula",
        content: text,
        x: (i * 4.7 + 3) % 90,
        y: (i * 5.3 + 4) % 85,
        z: Math.random(),
        zDuration: 14 + (i % 6) * 3,
        driftX: (i % 2 === 0 ? 1 : -1) * (8 + (i % 5) * 4),
        driftY: (i % 3 === 0 ? -1 : 1) * (5 + (i % 4) * 3),
        delay: i * 0.8,
        size: 0.7 + Math.random() * 0.5,
      });
    });

    // 2 family photos — placed at specific positions for visual balance
    FAMILY_PHOTOS.forEach((photo, i) => {
      items.push({
        type: "photo",
        content: photo.label,
        src: photo.src,
        x: i === 0 ? 15 : 70, // left and right sides
        y: i === 0 ? 25 : 55,
        z: 0.5 + Math.random() * 0.3,
        zDuration: 20 + i * 5,
        driftX: (i % 2 === 0 ? 1 : -1) * 12,
        driftY: (i % 2 === 0 ? -1 : 1) * 8,
        delay: i * 4 + 2,
        size: 1,
      });
    });

    return items;
  }, []);

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 1, perspective: "1200px" }}
    >
      {elements.map((el, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${el.x}%`,
            top: `${el.y}%`,
            transformStyle: "preserve-3d",
          }}
          animate={{
            // Z-axis: coming toward you and receding into distance
            z: [-300, -100, 50, -100, -300],
            scale: [0.3, 0.7, 1.1, 0.7, 0.3],
            opacity: [0.02, 0.15, 0.3, 0.15, 0.02],
            // Drift on X/Y
            x: [0, el.driftX, el.driftX * 1.5, el.driftX, 0],
            y: [0, el.driftY, el.driftY * 1.5, el.driftY, 0],
          }}
          transition={{
            duration: el.zDuration,
            repeat: Infinity,
            delay: el.delay,
            ease: "easeInOut",
          }}
        >
          {el.type === "formula" ? (
            <span
              className="font-mono whitespace-nowrap select-none"
              style={{
                fontSize: `${el.size}rem`,
                color: "oklch(0.9 0.05 210 / 0.6)",
                textShadow: "0 0 8px oklch(0.7 0.15 210 / 0.3)",
              }}
            >
              {el.content}
            </span>
          ) : (
            <div
              className="rounded-xl overflow-hidden shadow-2xl"
              style={{
                width: "120px",
                height: "90px",
                boxShadow: "0 0 30px oklch(0.6 0.1 240 / 0.2)",
              }}
            >
              <img
                src={el.src}
                alt=""
                className="w-full h-full object-cover"
                style={{ filter: "saturate(0.8) brightness(0.9)" }}
                loading="lazy"
              />
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================
// GLOBAL ATMOSPHERE — All layers combined.
// Stars + Nebula + Shooting Stars (canvas) + Formulas + Family Photos (DOM)
// ============================================================
export function GlobalAtmosphere() {
  return (
    <>
      <PageVignette />
      <CosmosCanvas />
      <FloatingDepthField />
    </>
  );
}

export default GlobalAtmosphere;
