"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const rainbowVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const rainbowFragmentShader = `
  uniform float uTime;
  uniform float uDistortion;
  uniform float uScrollSpeed;
  varying vec2 vUv;

  vec3 getRainbowColor(float t) {
    vec3 red    = vec3(1.0, 0.1, 0.1);
    vec3 orange = vec3(1.0, 0.5, 0.0);
    vec3 yellow = vec3(1.0, 1.0, 0.1);
    vec3 green  = vec3(0.1, 1.0, 0.2);
    vec3 blue   = vec3(0.1, 0.4, 1.0);
    vec3 indigo = vec3(0.3, 0.0, 0.8);
    vec3 violet = vec3(0.6, 0.0, 1.0);

    if (t < 0.143) return mix(red, orange, t / 0.143);
    if (t < 0.286) return mix(orange, yellow, (t - 0.143) / 0.143);
    if (t < 0.429) return mix(yellow, green, (t - 0.286) / 0.143);
    if (t < 0.571) return mix(green, blue, (t - 0.429) / 0.143);
    if (t < 0.714) return mix(blue, indigo, (t - 0.571) / 0.143);
    if (t < 0.857) return mix(indigo, violet, (t - 0.714) / 0.143);
    return violet;
  }

  // Simplex-like noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    vec2 uv = vUv;

    // Turbulence driven by scroll speed
    float turbulence = uDistortion * 0.3;
    float n = noise(uv * 4.0 + uTime * 0.5) * turbulence;
    float n2 = noise(uv * 8.0 - uTime * 0.3) * turbulence * 0.5;

    // Stretch the rainbow based on scroll
    float stretch = 1.0 + uDistortion * 0.5;
    float yOffset = uv.y + n + n2;

    // Color based on vertical position
    float colorT = clamp(yOffset, 0.0, 1.0);
    vec3 rainbow = getRainbowColor(colorT);

    // Fade from left to right (origin → spread)
    float fadeX = smoothstep(0.0, 0.15, uv.x) * (0.7 + 0.3 * smoothstep(1.0, 0.3, uv.x));

    // Vertical gaussian falloff from center
    float centerDist = abs(uv.y - 0.5) * 2.0;
    float fadeY = exp(-centerDist * centerDist * 2.0);

    // Glow effect
    float glow = exp(-centerDist * centerDist * 0.8) * 0.3;

    float alpha = (fadeX * fadeY + glow) * (0.85 + 0.15 * sin(uTime + uv.x * 3.0));

    // Add chromatic shimmer
    rainbow += vec3(
      sin(uTime * 1.3 + uv.x * 5.0) * 0.05,
      sin(uTime * 1.7 + uv.x * 4.0) * 0.05,
      sin(uTime * 2.1 + uv.x * 6.0) * 0.05
    );

    gl_FragColor = vec4(rainbow, alpha * 0.9);
  }
`;

export function RainbowDiffraction({ scrollSpeed }) {
  const meshRef = useRef();
  const materialRef = useRef();
  const smoothedDistortion = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDistortion: { value: 0 },
      uScrollSpeed: { value: 0 },
    }),
    []
  );

  useFrame((state) => {
    if (!materialRef.current) return;
    const mat = materialRef.current;
    mat.uniforms.uTime.value = state.clock.elapsedTime;

    // Smooth the distortion
    const target = Math.abs(scrollSpeed.current) * 3.0;
    smoothedDistortion.current = THREE.MathUtils.lerp(
      smoothedDistortion.current,
      Math.min(target, 2.0),
      0.08
    );
    mat.uniforms.uDistortion.value = smoothedDistortion.current;
    mat.uniforms.uScrollSpeed.value = scrollSpeed.current;
  });

  return (
    <mesh ref={meshRef} position={[2.8, 0, 0.1]} rotation={[0, 0, 0.18]}>
      <planeGeometry args={[5, 2.5, 1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={rainbowVertexShader}
        fragmentShader={rainbowFragmentShader}
        uniforms={uniforms}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
