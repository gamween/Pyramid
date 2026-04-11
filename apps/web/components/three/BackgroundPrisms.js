"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function SmallPrism({ position, scale, speed, mousePos }) {
  const meshRef = useRef();
  const basePos = useRef(new THREE.Vector3(...position));

  useFrame(() => {
    if (!meshRef.current) return;
    // Slow idle rotation
    meshRef.current.rotation.x += speed * 0.003;
    meshRef.current.rotation.y += speed * 0.005;

    // Mouse parallax
    const parallaxStrength = 0.15;
    meshRef.current.position.x =
      basePos.current.x + mousePos.current.x * parallaxStrength * (scale + 0.3);
    meshRef.current.position.y =
      basePos.current.y + mousePos.current.y * parallaxStrength * (scale + 0.3);
  });

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <coneGeometry args={[0.5, 0.8, 3]} />
      <meshPhysicalMaterial
        color="#aaaacc"
        transmission={0.8}
        roughness={0.2}
        metalness={0.05}
        ior={1.8}
        thickness={0.5}
        transparent
        opacity={0.35}
        envMapIntensity={0.5}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

const PRISM_CONFIGS = [
  { position: [-3.5, 2.2, -3], scale: 0.6, speed: 0.7 },
  { position: [4.0, 1.8, -4], scale: 0.45, speed: 1.0 },
  { position: [-2.5, -2.0, -2.5], scale: 0.5, speed: 0.9 },
  { position: [3.5, -1.5, -5], scale: 0.35, speed: 1.2 },
  { position: [0.5, 3.0, -6], scale: 0.3, speed: 0.8 },
];

export function BackgroundPrisms({ mousePos }) {
  return (
    <group>
      {PRISM_CONFIGS.map((cfg, i) => (
        <SmallPrism key={i} {...cfg} mousePos={mousePos} />
      ))}
    </group>
  );
}
