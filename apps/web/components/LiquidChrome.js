"use client";

import { useRef, useEffect } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';

import './LiquidChrome.css';

export default function LiquidChrome({
  baseColor = [0.0, 0.72, 1.0], // Defaulting to the #00b8ff cyan
  speed = 0.2,
  amplitude = 0.3,
  frequencyX = 3,
  frequencyY = 3,
  interactive = true,
  ...props
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const renderer = new Renderer({ antialias: true, alpha: true }); // Enable alpha for background transparency
    const gl = renderer.gl;
    // Set clear color to transparent so it blends with our background
    gl.clearColor(0, 0, 0, 0);

    const vertexShader = `
      attribute vec2 position;
      attribute vec2 uv;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      uniform float uTime;
      uniform vec3 uResolution;
      uniform vec3 uBaseColor;
      uniform float uAmplitude;
      uniform float uFrequencyX;
      uniform float uFrequencyY;
      uniform vec2 uMouse;
      varying vec2 vUv;

      vec4 renderImage(vec2 uvCoord) {
          vec2 fragCoord = uvCoord * uResolution.xy;
          vec2 uv = (2.0 * fragCoord - uResolution.xy) / min(uResolution.x, uResolution.y);

          for (float i = 1.0; i < 10.0; i++){
              uv.x += uAmplitude / i * cos(i * uFrequencyX * uv.y + uTime + uMouse.x * 3.14159);
              uv.y += uAmplitude / i * cos(i * uFrequencyY * uv.x + uTime + uMouse.y * 3.14159);
          }

          vec2 diff = (uvCoord - uMouse);
          float dist = length(diff);
          float falloff = exp(-dist * 20.0);
          float ripple = sin(10.0 * dist - uTime * 2.0) * 0.05;
          uv += (diff / (dist + 0.0001)) * ripple * falloff;

          // The original requested logic for a dark, deep color mapping
          float hueMod = abs(sin(uTime - uv.y - uv.x));
          vec3 color = uBaseColor / (hueMod + 0.5); 
          
          // Introduce subtle blue/cyan variations to expand the palette slightly
          float variation = sin(uv.x * 3.0 + uTime * 0.7) * cos(uv.y * 3.0 - uTime * 0.5);
          color.r += variation * 0.01; // tiny hint of warmth/purple
          color.g += variation * 0.03; // slight cyan shift
          color.b += variation * 0.08; // richer blue depth
          
          color = max(color, 0.0); // Prevent negative color values
          
          return vec4(color, 1.0);
      }

      void main() {
          vec4 col = vec4(0.0);
          int samples = 0;
          for (int i = -1; i <= 1; i++){
              for (int j = -1; j <= 1; j++){
                  vec2 offset = vec2(float(i), float(j)) * (1.0 / min(uResolution.x, uResolution.y));
                  col += renderImage(vUv + offset);
                  samples++;
              }
          }
          gl_FragColor = col / float(samples);
      }
    `;

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: {
          value: new Float32Array([gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height])
        },
        uBaseColor: { value: new Float32Array(baseColor) },
        uAmplitude: { value: amplitude },
        uFrequencyX: { value: frequencyX },
        uFrequencyY: { value: frequencyY },
        uMouse: { value: new Float32Array([0, 0]) }
      }
    });
    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
      const scale = 1;
      renderer.setSize(container.offsetWidth * scale, container.offsetHeight * scale);
      const resUniform = program.uniforms.uResolution.value;
      resUniform[0] = gl.canvas.width;
      resUniform[1] = gl.canvas.height;
      resUniform[2] = gl.canvas.width / gl.canvas.height;
    }
    window.addEventListener('resize', resize);
    resize();

    function handleMouseMove(event) {
      const x = event.clientX / window.innerWidth;
      const y = 1 - (event.clientY / window.innerHeight);
      const mouseUniform = program.uniforms.uMouse.value;
      mouseUniform[0] = x;
      mouseUniform[1] = y;
    }

    function handleTouchMove(event) {
      if (event.touches.length > 0) {
        const touch = event.touches[0];
        const x = touch.clientX / window.innerWidth;
        const y = 1 - (touch.clientY / window.innerHeight);
        const mouseUniform = program.uniforms.uMouse.value;
        mouseUniform[0] = x;
        mouseUniform[1] = y;
      }
    }

    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleTouchMove);
    }

    let animationId;
    function update(t) {
      animationId = requestAnimationFrame(update);
      // Faster, more fluid speed
      program.uniforms.uTime.value = t * 0.001 * speed;
      renderer.render({ scene: mesh });
    }
    animationId = requestAnimationFrame(update);

    container.appendChild(gl.canvas);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      if (interactive) {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('touchmove', handleTouchMove);
      }
      if (gl.canvas.parentElement) {
        gl.canvas.parentElement.removeChild(gl.canvas);
      }
      if (gl.getExtension('WEBGL_lose_context')) {
        gl.getExtension('WEBGL_lose_context').loseContext();
      }
    };
  }, [baseColor, speed, amplitude, frequencyX, frequencyY, interactive]);

  return <div ref={containerRef} className="liquidChrome-container" {...props} />;
}
