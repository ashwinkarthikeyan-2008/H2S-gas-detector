import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface SafetyBeacon3DProps { variant?: 'admin' | 'worker' }

export const SafetyBeacon3D: React.FC<SafetyBeacon3DProps> = ({ variant = 'admin' }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = mountRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch (error) {
      console.warn('3D safety beacon is unavailable; showing dashboard without WebGL.', error);
      return;
    }
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 1.1, 7.8);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    host.appendChild(renderer.domElement);

    const rig = new THREE.Group();
    scene.add(rig);
    const core = new THREE.Group();
    rig.add(core);
    core.position.y = 0.58;
    const navy = new THREE.MeshStandardMaterial({ color: 0x253952, metalness: 0.72, roughness: 0.22 });
    const darkMetal = new THREE.MeshStandardMaterial({ color: 0x71869a, metalness: 0.78, roughness: 0.27 });
    const amber = new THREE.MeshPhysicalMaterial({ color: variant === 'worker' ? 0xc8f26a : 0x64c9ff, emissive: variant === 'worker' ? 0x3e8c56 : 0x135b9b, emissiveIntensity: 0.7, metalness: 0.55, roughness: 0.18, clearcoat: 1 });
    const glass = new THREE.MeshPhysicalMaterial({ color: variant === 'worker' ? 0x8ce0bd : 0x9ae9ff, emissive: variant === 'worker' ? 0x15936e : 0x187da9, emissiveIntensity: 0.42, roughness: 0.12, metalness: 0.12, transmission: 0.38, thickness: 0.6, clearcoat: 1 });
    const product = new THREE.Group();
    core.add(product);
    if (variant === 'admin') {
      const suit = new THREE.MeshStandardMaterial({ color: 0x1b3450, metalness: 0.3, roughness: 0.34 });
      const lapelMaterial = new THREE.MeshStandardMaterial({ color: 0x31516c, metalness: 0.38, roughness: 0.32 });
      const shirt = new THREE.MeshStandardMaterial({ color: 0xf3f6f5, metalness: 0.06, roughness: 0.48 });
      const tie = new THREE.MeshStandardMaterial({ color: 0x28a6ad, emissive: 0x0b424d, emissiveIntensity: 0.34, metalness: 0.3, roughness: 0.25 });
      const skin = new THREE.MeshStandardMaterial({ color: 0xd49a73, roughness: 0.62 });
      const admin = new THREE.Group();
      product.add(admin);
      const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.48, 0.72, 10, 32), suit);
      torso.position.y = -0.38;
      admin.add(torso);
      const shirtFront = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.38, 6, 20), shirt);
      shirtFront.scale.set(1, 1, 0.35);
      shirtFront.position.set(0, -0.22, 0.44);
      admin.add(shirtFront);
      const tieKnot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.1), tie);
      tieKnot.position.set(0, 0.05, 0.51);
      admin.add(tieKnot);
      const tieBody = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.44, 4), tie);
      tieBody.position.set(0, -0.27, 0.53);
      admin.add(tieBody);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 32, 28), skin);
      head.position.y = 0.77;
      admin.add(head);
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.37, 40, 28, 0, Math.PI * 2, 0, Math.PI * 0.58), new THREE.MeshStandardMaterial({ color: 0x26313a, roughness: 0.76 }));
      hair.position.y = 0.88;
      admin.add(hair);
      const collarL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.23, 0.08), shirt);
      collarL.position.set(-0.14, 0.02, 0.48);
      collarL.rotation.z = -0.28;
      admin.add(collarL);
      const collarR = collarL.clone();
      collarR.position.x = 0.14;
      collarR.rotation.z = 0.28;
      admin.add(collarR);
      const lapelShape = new THREE.Shape();
      lapelShape.moveTo(0, 0.42);
      lapelShape.lineTo(0.16, 0.16);
      lapelShape.lineTo(0.04, -0.04);
      lapelShape.lineTo(-0.02, 0.12);
      lapelShape.closePath();
      const lapelGeometry = new THREE.ShapeGeometry(lapelShape);
      const leftLapel = new THREE.Mesh(lapelGeometry, lapelMaterial);
      leftLapel.position.set(-0.23, -0.06, 0.48);
      leftLapel.rotation.z = -0.08;
      admin.add(leftLapel);
      const rightLapel = new THREE.Mesh(lapelGeometry, lapelMaterial);
      rightLapel.position.set(0.23, -0.06, 0.48);
      rightLapel.rotation.y = Math.PI;
      rightLapel.rotation.z = 0.08;
      admin.add(rightLapel);
      const shoulder = (side: number) => {
        const start = new THREE.Vector3(side * 0.4, 0.05, 0);
        const handEnd = new THREE.Vector3(side * 0.65, -0.72, 0.04);
        const direction = new THREE.Vector3().subVectors(handEnd, start);
        const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, direction.length(), 20), suit);
        sleeve.position.copy(start).add(handEnd).multiplyScalar(0.5);
        sleeve.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
        admin.add(sleeve);
      };
      shoulder(-1); shoulder(1);
      const badge = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.045), amber);
      badge.position.set(0.3, -0.04, 0.48);
      badge.rotation.z = 0.05;
      admin.add(badge);
      const badgeMark = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), glass);
      badgeMark.position.set(0.3, 0, 0.51);
      admin.add(badgeMark);
      const badgeLine = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.025, 0.018), navy);
      badgeLine.position.set(0.3, -0.07, 0.52);
      admin.add(badgeLine);
      const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.025), lapelMaterial);
      pocket.position.set(-0.3, -0.48, 0.45);
      admin.add(pocket);
      const pocketLine = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.035, 0.03), amber);
      pocketLine.position.set(-0.3, -0.4, 0.47);
      admin.add(pocketLine);
      const adminLegs = new THREE.MeshStandardMaterial({ color: 0x202e3e, metalness: 0.22, roughness: 0.48 });
      [-1, 1].forEach((side) => {
        const from = new THREE.Vector3(side * 0.22, -0.88, 0);
        const to = new THREE.Vector3(side * 0.27, -1.62, 0);
        const direction = new THREE.Vector3().subVectors(to, from);
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, direction.length(), 20), adminLegs);
        leg.position.copy(from).add(to).multiplyScalar(0.5);
        leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
        admin.add(leg);
      });
    } else {
      const skin = new THREE.MeshStandardMaterial({ color: 0xc98e67, roughness: 0.68 });
      const jacket = new THREE.MeshStandardMaterial({ color: 0x24445a, metalness: 0.24, roughness: 0.48 });
      const reflective = new THREE.MeshStandardMaterial({ color: 0xc8f26a, emissive: 0x527d28, emissiveIntensity: 0.28, metalness: 0.12, roughness: 0.32 });
      const visor = new THREE.MeshStandardMaterial({ color: 0x7de2c0, metalness: 0.62, roughness: 0.2, transparent: true, opacity: 0.82 });
      const person = new THREE.Group();
      core.add(person);
      const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.48, 0.72, 8, 24), jacket);
      torso.position.y = -0.38;
      person.add(torso);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 32, 28), skin);
      head.position.y = 0.76;
      person.add(head);
      const helmetDome = new THREE.Mesh(new THREE.SphereGeometry(0.43, 36, 24, 0, Math.PI * 2, 0, Math.PI / 2), amber);
      helmetDome.position.y = 1.02;
      person.add(helmetDome);
      const helmetBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.54, 0.09, 48), amber);
      helmetBrim.position.y = 1.02;
      person.add(helmetBrim);
      const vest = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.68, 0.14), reflective);
      vest.position.set(0, -0.27, 0.42);
      person.add(vest);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.075, 0.16), visor);
      stripe.position.set(0, -0.48, 0.44);
      person.add(stripe);
      const segment = (from: THREE.Vector3, to: THREE.Vector3, radius: number, material: THREE.Material) => {
        const direction = new THREE.Vector3().subVectors(to, from);
        const limb = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.82, radius, direction.length(), 20), material);
        limb.position.copy(from).add(to).multiplyScalar(0.5);
        limb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
        person.add(limb);
      };
      segment(new THREE.Vector3(-0.4, 0.05, 0), new THREE.Vector3(-0.65, -0.72, 0.04), 0.16, jacket);
      segment(new THREE.Vector3(0.4, 0.05, 0), new THREE.Vector3(0.65, -0.72, 0.04), 0.16, jacket);
      segment(new THREE.Vector3(-0.22, -0.88, 0), new THREE.Vector3(-0.27, -1.62, 0), 0.19, navy);
      segment(new THREE.Vector3(0.22, -0.88, 0), new THREE.Vector3(0.27, -1.62, 0), 0.19, navy);
      const visorPlate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.045), visor);
      visorPlate.position.set(0, 0.77, 0.325);
      person.add(visorPlate);
      const workerBadge = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 16), glass);
      workerBadge.position.set(0.25, -0.04, 0.53);
      person.add(workerBadge);
    }

    const pointsCount = 220;
    const pointPositions = new Float32Array(pointsCount * 3);
    for (let i = 0; i < pointsCount; i += 1) {
      const radius = 2 + Math.random() * 2.35;
      const angle = Math.random() * Math.PI * 2;
      pointPositions[i * 3] = Math.cos(angle) * radius;
      pointPositions[i * 3 + 1] = (Math.random() - 0.5) * 3.6;
      pointPositions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3));
    const points = new THREE.Points(pointsGeometry, new THREE.PointsMaterial({ color: variant === 'worker' ? 0x71cda5 : 0x74cfff, size: 0.035, transparent: true, opacity: 0.75, sizeAttenuation: true }));
    rig.add(points);

    scene.add(new THREE.HemisphereLight(0xf5f0e8, 0x26354a, 2.2));
    const key = new THREE.PointLight(variant === 'worker' ? 0x7fe0b5 : 0x54c9ff, 48, 14);
    key.position.set(2.5, 3.6, 4.2);
    scene.add(key);
    const fill = new THREE.PointLight(0x83b9d2, 24, 14);
    fill.position.set(-3, -1.5, -2.5);
    scene.add(fill);

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    let targetX = 0;
    let targetY = 0;
    const onPointerMove = (event: PointerEvent) => {
      const bounds = host.getBoundingClientRect();
      targetY = ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.72;
      targetX = ((event.clientY - bounds.top) / bounds.height - 0.5) * 0.3;
    };
    const onPointerLeave = () => { targetX = 0; targetY = 0; };
    host.addEventListener('pointermove', onPointerMove);
    host.addEventListener('pointerleave', onPointerLeave);
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const tick = (time: number) => {
      frame = requestAnimationFrame(tick);
      if (motion.matches) {
        renderer.render(scene, camera);
        return;
      }
      const t = time * 0.001;
      core.rotation.y += (targetY - core.rotation.y) * 0.035;
      core.rotation.x += (targetX - core.rotation.x) * 0.035;
      core.position.y = 0.58 + Math.sin(t * 1.2) * 0.055;
      if (product) product.scale.setScalar(1 + Math.sin(t * 2.2) * 0.018);
      points.rotation.y -= 0.00055;
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      host.removeEventListener('pointermove', onPointerMove);
      host.removeEventListener('pointerleave', onPointerLeave);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry.dispose();
          const material = object.material;
          (Array.isArray(material) ? material : [material]).forEach((item) => item.dispose());
        }
      });
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, [variant]);

  return <div ref={mountRef} aria-label={variant === 'worker' ? 'Interactive three dimensional worker safety equipment model' : 'Interactive three dimensional industrial safety beacon'} role="img" className="w-full h-full min-h-[240px] cursor-crosshair" />;
};

