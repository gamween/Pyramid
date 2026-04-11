"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const beamVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const beamFragmentShader = `
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    float intensity = smoothstep(0.0, 0.5, vUv.x) * smoothstep(1.0, 0.5, vUv.x);
    float core = exp(-pow((vUv.y - 0.5) * 6.0, 2.0));
    float glow = exp(-pow((vUv.y - 0.5) * 3.0, 2.0)) * 0.4;
    float pulse = 0.9 + 0.1 * sin(uTime * 2.0);
    float alpha = (core + glow) * intensity * pulse;
    vec3 color = vec3(1.0, 1.0, 1.0);
    gl_FragColor = vec4(color, alpha * 0.85);
  }
`;

export function LightBeam() {
  const meshRef = useRef();
  const materialRef = useRef();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
    }),
    []
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef} position={[-3.2, 0, 0.1]} rotation={[0, 0, -0.18]}>
      <planeGeometry args={[4.5, 0.15, 1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={beamVertexShader}
        fragmentShader={beamFragmentShader}
        uniforms={uniforms}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
