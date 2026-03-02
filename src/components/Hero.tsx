import React, { useRef, useMemo } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

const HeroLanding: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  // Generate antigravity particles
  const particles: Particle[] = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 2,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 10,
      opacity: Math.random() * 0.5 + 0.1,
    }));
  }, []);

  // Generate floating shapes for antigravity effect
  const shapes = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 80 + 20,
      rotation: Math.random() * 360,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 5,
      type: ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)] as string,
    }));
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #050510 0%, #0a0a20 30%, #0d0d2b 60%, #14143a 100%)',
      }}
    >
      {/* Antigravity Background Particles */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: `${p.x}vw`, y: '110vh', opacity: 0 }}
            animate={{
              y: '-10vh',
              opacity: [0, p.opacity, p.opacity, 0],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${p.id % 3 === 0
                ? 'rgba(124, 58, 237, 0.8)'
                : p.id % 3 === 1
                  ? 'rgba(168, 85, 247, 0.6)'
                  : 'rgba(59, 130, 246, 0.5)'
                }, transparent)`,
              filter: 'blur(1px)',
            }}
          />
        ))}
      </div>

      {/* Antigravity Floating Shapes */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {shapes.map((shape) => (
          <motion.div
            key={`shape-${shape.id}`}
            initial={{
              x: `${shape.x}vw`,
              y: '120vh',
              rotate: shape.rotation,
              opacity: 0,
            }}
            animate={{
              y: '-20vh',
              rotate: shape.rotation + 360,
              opacity: [0, 0.08, 0.08, 0],
            }}
            transition={{
              duration: shape.duration,
              delay: shape.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              position: 'absolute',
              width: shape.size,
              height: shape.size,
              border: `1px solid ${shape.id % 2 === 0
                ? 'rgba(124, 58, 237, 0.3)'
                : 'rgba(59, 130, 246, 0.2)'
                }`,
              borderRadius: shape.type === 'circle' ? '50%' : shape.type === 'square' ? '8px' : '0',
              clipPath: shape.type === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : undefined,
            }}
          />
        ))}
      </div>

      {/* Radial Glow Effects */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80vw',
          height: '80vw',
          maxWidth: '800px',
          maxHeight: '800px',
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.08) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '10%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      {/* Main Content */}
      <motion.div
        style={{ y, opacity, scale }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 10, padding: '0 20px' }}>
          {/* Small Tag */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 20px',
              borderRadius: '50px',
              background: 'rgba(124, 58, 237, 0.1)',
              border: '1px solid rgba(124, 58, 237, 0.2)',
              marginBottom: '32px',
              fontSize: '0.85rem',
              color: '#a855f7',
              fontWeight: 500,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            Now Live — Free Shipping on First Order
          </motion.div>

          {/* Main Title - VIBEXPERT */}
          <motion.h1
            initial={{ opacity: 0, y: 60, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              fontSize: 'clamp(3rem, 15vw, 12rem)',
              fontWeight: 900,
              lineHeight: 0.9,
              letterSpacing: '-0.04em',
              fontFamily: "'Space Grotesk', 'Inter', sans-serif",
              margin: 0,
              padding: 0,
              userSelect: 'none',
            }}
          >
            <span
              style={{
                background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 40%, #a855f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              VIBEXPERT
            </span>
          </motion.h1>

          {/* .SHOP */}
          <motion.h1
            initial={{ opacity: 0, y: 60, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              fontSize: 'clamp(2.5rem, 12vw, 10rem)',
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              fontFamily: "'Space Grotesk', 'Inter', sans-serif",
              margin: 0,
              padding: 0,
              userSelect: 'none',
            }}
          >
            <span
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              .SHOP
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.3rem)',
              color: '#94a3b8',
              maxWidth: '600px',
              margin: '32px auto 0',
              lineHeight: 1.6,
              fontWeight: 400,
            }}
          >
            Your vibe, your style. Premium gifts, accessories & lifestyle products curated just for you.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.3 }}
            style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
              marginTop: '48px',
              flexWrap: 'wrap',
            }}
          >
            <motion.a
              href="/shop"
              whileHover={{ scale: 1.05, boxShadow: '0 8px 30px rgba(124, 58, 237, 0.4)' }}
              whileTap={{ scale: 0.95 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '16px 36px',
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                color: 'white',
                borderRadius: '14px',
                fontWeight: 700,
                fontSize: '1.05rem',
                textDecoration: 'none',
                cursor: 'pointer',
                border: 'none',
              }}
            >
              Explore Shop
              <span style={{ fontSize: '1.2rem' }}>→</span>
            </motion.a>

            <motion.a
              href="https://www.vibexpert.online"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '16px 36px',
                background: 'transparent',
                color: '#f1f5f9',
                borderRadius: '14px',
                fontWeight: 600,
                fontSize: '1.05rem',
                textDecoration: 'none',
                cursor: 'pointer',
                border: '1px solid rgba(148, 163, 184, 0.2)',
              }}
            >
              Visit VibExpert.Online
            </motion.a>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.6 }}
            style={{
              display: 'flex',
              gap: '48px',
              justifyContent: 'center',
              marginTop: '64px',
              flexWrap: 'wrap',
            }}
          >
            {[
              { value: '10K+', label: 'Happy Vibers' },
              { value: '200+', label: 'Products' },
              { value: '4.9★', label: 'Avg Rating' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.8 + i * 0.1 }}
                style={{ textAlign: 'center' }}
              >
                <div
                  style={{
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #f1f5f9, #a855f7)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 1 }}
        style={{
          position: 'absolute',
          bottom: '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span style={{ fontSize: '0.75rem', color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Scroll to explore
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: '24px',
            height: '40px',
            borderRadius: '12px',
            border: '2px solid rgba(148, 163, 184, 0.2)',
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '8px',
          }}
        >
          <div
            style={{
              width: '3px',
              height: '8px',
              borderRadius: '4px',
              background: '#a855f7',
            }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default HeroLanding;
