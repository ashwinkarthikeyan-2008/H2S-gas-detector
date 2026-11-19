import React, { useEffect, useRef } from 'react';

interface LoginHeroVisualProps {
  variant: 'admin' | 'worker';
}

interface MeshNode {
  x: number; y: number; z: number;
  homeX: number; homeY: number; homeZ: number;
  vx: number; vy: number; vz: number;
  phase: number;
  hue: number;
}

export const LoginHeroVisual: React.FC<LoginHeroVisualProps> = ({ variant }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef({ x: -1000, y: -1000, active: false, tiltX: 0, tiltY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const nodeCount = 390;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const nodes: MeshNode[] = Array.from({ length: nodeCount }, (_, index) => {
      const y = 1 - 2 * (index + 0.5) / nodeCount;
      const ring = Math.sqrt(1 - y * y);
      const angle = goldenAngle * index;
      const x = Math.cos(angle) * ring;
      const z = Math.sin(angle) * ring;
      return { x, y, z, homeX: x, homeY: y, homeZ: z, vx: 0, vy: 0, vz: 0, phase: index * 1.71, hue: (index * 17) % 90 };
    });

    const neighbors: Array<[number, number]> = [];
    nodes.forEach((node, index) => {
      const closest = nodes.map((other, otherIndex) => ({
        otherIndex,
        distance: (node.homeX - other.homeX) ** 2 + (node.homeY - other.homeY) ** 2 + (node.homeZ - other.homeZ) ** 2,
      })).filter((item) => item.otherIndex !== index).sort((a, b) => a.distance - b.distance).slice(0, 3);
      closest.forEach(({ otherIndex }) => { if (otherIndex > index) neighbors.push([index, otherIndex]); });
    });

    let width = 0;
    let height = 0;
    let frame = 0;
    let lastTime = 0;
    let elapsed = 0;
    let stopped = false;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const render = (time: number) => {
      if (stopped) return;
      const dt = Math.min((time - (lastTime || time)) / 1000, 0.032);
      lastTime = time;
      elapsed += dt;
      context.clearRect(0, 0, width, height);

      const radius = Math.max(30, Math.min(height * 0.465, width * 0.34));
      const centerX = width * 0.5;
      const centerY = height * 0.49;
      const pointer = pointerRef.current;
      const angleY = (reducedMotion ? 0 : elapsed * 0.13) + pointer.tiltY * 0.1;
      const angleX = (reducedMotion ? 0 : Math.sin(elapsed * 0.23) * 0.11) + pointer.tiltX * 0.08;
      const cosY = Math.cos(angleY), sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX), sinX = Math.sin(angleX);
      const projected: Array<{ x: number; y: number; z: number; glow: number }> = [];
      const pushRadius = radius * 0.74;
      const spring = 5.2;
      const drag = Math.exp(-3.7 * dt);

      nodes.forEach((node, index) => {
        let x = node.x, y = node.y, z = node.z;
        const rotateXy = x * cosY - z * sinY;
        z = x * sinY + z * cosY;
        x = rotateXy;
        const rotateYx = y * cosX - z * sinX;
        z = y * sinX + z * cosX;
        y = rotateYx;
        const perspective = 1 / (1 - z * 0.16);
        const screenX = centerX + x * radius * perspective;
        const screenY = centerY + y * radius * perspective;

        if (pointer.active && dt > 0) {
          const dx = screenX - pointer.x;
          const dy = screenY - pointer.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < pushRadius && distance > 0.1) {
            const strength = (1 - distance / pushRadius) ** 2 * 5.4 * dt;
            node.vx += (dx / distance) * strength;
            node.vy += (dy / distance) * strength;
            node.vz += (z + 0.14) * strength * 0.8;
          }
        }

        node.vx += (node.homeX - node.x) * spring * dt;
        node.vy += (node.homeY - node.y) * spring * dt;
        node.vz += (node.homeZ - node.z) * spring * dt;
        node.vx *= drag; node.vy *= drag; node.vz *= drag;
        node.x += node.vx * dt; node.y += node.vy * dt; node.z += node.vz * dt;

        const finalX = node.x * cosY - node.z * sinY;
        const finalZy = node.x * sinY + node.z * cosY;
        const finalY = node.y * cosX - finalZy * sinX;
        const finalZ = node.y * sinX + finalZy * cosX;
        const finalPerspective = 1 / (1 - finalZ * 0.16);

        const shimmer = 0.72 + (Math.sin(elapsed * 1.6 + node.phase) + 1) * 0.14;
        projected[index] = {
          x: centerX + finalX * radius * finalPerspective,
          y: centerY + finalY * radius * finalPerspective,
          z: finalZ,
          glow: shimmer * (0.58 + (z + 1) * 0.18),
        };
      });

      const isWorker = variant === 'worker';
      neighbors.forEach(([first, second]) => {
        const a = projected[first], b = projected[second];
        const depth = (a.z + b.z + 2) / 4;
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        const stretch = Math.max(0, 1 - Math.max(0, distance - radius * 0.14) / (radius * 0.72));
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.strokeStyle = isWorker
          ? `rgba(94, 224, 204, ${0.09 + depth * 0.25 * stretch})`
          : `rgba(130, 151, 255, ${0.11 + depth * 0.29 * stretch})`;
        context.lineWidth = 0.45 + depth * 0.35;
        context.stroke();
      });

      projected.forEach((point, index) => {
        const node = nodes[index];
        const depth = (point.z + 1) / 2;
        const size = 0.75 + depth * 1.15 + (index % 29 === 0 ? 0.9 : 0);
        const cyan = isWorker || node.hue > 54;
        const color = cyan ? '90, 235, 255' : '172, 160, 255';
        context.beginPath();
        context.fillStyle = `rgba(${color}, ${0.55 + point.glow * 0.4})`;
        context.shadowBlur = index % 29 === 0 ? 11 : 4;
        context.shadowColor = `rgba(${color}, .85)`;
        context.arc(point.x, point.y, size, 0, Math.PI * 2);
        context.fill();
      });
      context.shadowBlur = 0;

      // A few larger, softly pulsing network hubs give the mesh its dimensional focal points.
      [37, 91, 153, 218, 302, 365].forEach((index, hub) => {
        const point = projected[index];
        const pulse = 2.1 + (Math.sin(elapsed * 1.7 + hub) + 1) * 1.1;
        const color = hub % 2 === 0 ? '74, 224, 255' : '181, 155, 255';
        const halo = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, pulse * 5);
        halo.addColorStop(0, `rgba(${color}, .76)`);
        halo.addColorStop(0.22, `rgba(${color}, .23)`);
        halo.addColorStop(1, `rgba(${color}, 0)`);
        context.fillStyle = halo;
        context.beginPath();
        context.arc(point.x, point.y, pulse * 5, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = 'rgba(236, 250, 255, .96)';
        context.beginPath();
        context.arc(point.x, point.y, pulse * 0.62, 0, Math.PI * 2);
        context.fill();
      });

      frame = window.requestAnimationFrame(render);
    };
    frame = window.requestAnimationFrame(render);
    return () => { stopped = true; window.cancelAnimationFrame(frame); observer.disconnect(); };
  }, [variant]);

  const updatePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    pointerRef.current = { x: event.clientX - bounds.left, y: event.clientY - bounds.top, active: true, tiltX: -y, tiltY: x };
    event.currentTarget.style.setProperty('--hero-tilt-x', `${-y * 6}deg`);
    event.currentTarget.style.setProperty('--hero-tilt-y', `${x * 7}deg`);
  };

  const resetPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerRef.current.active = false;
    pointerRef.current.tiltX = 0;
    pointerRef.current.tiltY = 0;
    event.currentTarget.style.setProperty('--hero-tilt-x', '0deg');
    event.currentTarget.style.setProperty('--hero-tilt-y', '0deg');
  };

  return <div className={`login-hero-visual login-hero-visual-${variant}`} onPointerMove={updatePointer} onPointerLeave={resetPointer}>
    <span className="login-hero-particle login-hero-particle-one" />
    <span className="login-hero-particle login-hero-particle-two" />
    <div className="login-hero-model"><canvas ref={canvasRef} className="login-mesh-canvas" role="img" aria-label={`${variant === 'worker' ? 'Worker' : 'Admin'} interactive three-dimensional network model`} /></div>
  </div>;
};
