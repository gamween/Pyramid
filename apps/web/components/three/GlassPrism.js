"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function GlassPrism({ scrollProgress }) {
  const meshRef = useRef();
  const targetRotation = useRef(0);

  useFrame(() => {
    if (!meshRef.current) return;
    targetRotation.current = scrollProgress.current * Math.PI * 2;
    meshRef.current.rotation.y = THREE.MathUtils.lerp(
      meshRef.current.rotation.y,
      targetRotation.current,
      0.05
    );
    // Subtle idle float
    meshRef.current.rotation.z =
      Math.sin(Date.now() * 0.0003) * 0.02;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} rotation={[0, 0, Math.PI]}>
      <coneGeometry args={[1.4, 2.2, 3]} />
      <meshPhysicalMaterial
        color="#ffffff"
        transmission={0.95}
        roughness={0.03}
        metalness={0.0}
        ior={2.4}
        thickness={1.5}
        envMapIntensity={1.5}
        clearcoat={1.0}
        clearcoatRoughness={0.15}
        transparent
        opacity={0.9}
        side={THREE.DoubleSide}
        attenuationColor={new THREE.Color("#c8c8ff")}
        attenuationDistance={2.0}
      />
    </mesh>
  );
}
