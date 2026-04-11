"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function PrismBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.setClearColor(0x020816, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 2.9, 8.3);
    camera.lookAt(0, 0.8, 0);

    scene.add(new THREE.AmbientLight(0x536f9d, 1.3));

    const key = new THREE.DirectionalLight(0xffffff, 2.6);
    key.position.set(5, 8, 4);
    scene.add(key);

    const cyan = new THREE.PointLight(0x78d8ff, 3.4, 24);
    cyan.position.set(-4.5, 2.4, 2.2);
    scene.add(cyan);

    const rim = new THREE.PointLight(0x7f5fe1, 2.8, 20);
    rim.position.set(3.5, 1.0, -4.2);
    scene.add(rim);

    const gradient = new THREE.Mesh(
      new THREE.PlaneGeometry(36, 24),
      new THREE.ShaderMaterial({
        uniforms: {
          c1: { value: new THREE.Color(0x030817) },
          c2: { value: new THREE.Color(0x071a46) },
          c3: { value: new THREE.Color(0x241f63) },
        },
        vertexShader: `
          varying vec2 vUv;
          void main(){
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 c1;
          uniform vec3 c2;
          uniform vec3 c3;
          varying vec2 vUv;
          void main(){
            vec3 col = mix(c1, c2, smoothstep(0.0, 0.8, vUv.y));
            col = mix(col, c3, smoothstep(0.35, 1.0, vUv.x) * 0.4);
            gl_FragColor = vec4(col, 1.0);
          }
        `,
        depthWrite: false,
        depthTest: false,
      })
    );
    gradient.position.set(0, 2, -9);
    scene.add(gradient);

    const half = 2.15;
    const height = 2.15;
    const c0 = new THREE.Vector3(half, 0, 0);
    const c1 = new THREE.Vector3(0, 0, half);
    const c2 = new THREE.Vector3(-half, 0, 0);
    const c3 = new THREE.Vector3(0, 0, -half);
    const apex = new THREE.Vector3(0, height, 0);
    const corners = [c0, c1, c2, c3];

    function buildFaceGrid(a, b, top, n) {
      const pts = [];
      const rows = [];
      for (let i = 0; i <= n; i++) {
        const v = i / n;
        const left = new THREE.Vector3().lerpVectors(a, top, v);
        const right = new THREE.Vector3().lerpVectors(b, top, v);
        const width = n - i;
        const row = [];
        if (width === 0) row.push(top.clone());
        else {
          for (let j = 0; j <= width; j++) {
            row.push(new THREE.Vector3().lerpVectors(left, right, j / width));
          }
        }
        rows.push(row);
      }

      for (let i = 0; i <= n; i++) {
        const row = rows[i];
        for (let j = 0; j < row.length - 1; j++) {
          const p = row[j];
          const q = row[j + 1];
          pts.push(p.x, p.y, p.z, q.x, q.y, q.z);
        }
      }

      for (let i = 0; i < n; i++) {
        const rowA = rows[i];
        const rowB = rows[i + 1];
        for (let j = 0; j < rowB.length; j++) {
          const p1 = rowA[j];
          const p2 = rowB[j];
          const p3 = rowA[j + 1];
          pts.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
          pts.push(p3.x, p3.y, p3.z, p2.x, p2.y, p2.z);
        }
      }
      return pts;
    }

    let lines = [];
    for (let f = 0; f < 4; f++) {
      lines = lines.concat(buildFaceGrid(corners[f], corners[(f + 1) % 4], apex, 8));
    }

    const gridGeometry = new THREE.BufferGeometry();
    gridGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(lines), 3)
    );

    const gridMaterial = new THREE.LineBasicMaterial({
      color: 0xe7f6ff,
      transparent: true,
      opacity: 0.95,
    });

    const grid = new THREE.LineSegments(gridGeometry, gridMaterial);

    const faces = [];
    for (let f = 0; f < 4; f++) {
      const a = corners[f];
      const b = corners[(f + 1) % 4];
      faces.push(a.x, a.y, a.z, b.x, b.y, b.z, apex.x, apex.y, apex.z);
    }

    const glassGeometry = new THREE.BufferGeometry();
    glassGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(faces), 3)
    );
    glassGeometry.computeVertexNormals();

    const glass = new THREE.Mesh(
      glassGeometry,
      new THREE.MeshPhongMaterial({
        color: 0x9fd3ff,
        emissive: 0x1c4f88,
        specular: 0xffffff,
        shininess: 210,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );

    const group = new THREE.Group();
    group.add(glass, grid);
    group.position.y = 0.18;
    scene.add(group);

    const reflection = new THREE.LineSegments(
      gridGeometry.clone(),
      new THREE.LineBasicMaterial({ color: 0x7fc6ff, transparent: true, opacity: 0.18 })
    );
    reflection.scale.y = -1;
    reflection.position.y = 0.36;
    scene.add(reflection);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 18),
      new THREE.MeshPhongMaterial({
        color: 0x02050c,
        specular: 0x1b3f72,
        shininess: 120,
        transparent: true,
        opacity: 0.75,
      })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    window.addEventListener("resize", onResize);

    const clock = new THREE.Clock();
    let rafId = 0;

    const animate = () => {
      const t = clock.getElapsedTime();

      group.rotation.y = t * 0.33;
      reflection.rotation.y = group.rotation.y;

      camera.position.x = Math.sin(t * 0.14) * 0.42;
      camera.position.y = 2.9 + Math.sin(t * 0.08) * 0.12;
      camera.lookAt(0, 0.8, 0);

      cyan.intensity = 3.2 + Math.sin(t * 0.8) * 0.5;
      rim.intensity = 2.7 + Math.cos(t * 0.55) * 0.4;

      renderer.render(scene, camera);
      rafId = window.requestAnimationFrame(animate);
    };

    rafId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      gridGeometry.dispose();
      gridMaterial.dispose();
      glassGeometry.dispose();
      (glass.material).dispose();
      (reflection.geometry).dispose();
      (reflection.material).dispose();
      ground.geometry.dispose();
      (ground.material).dispose();
      (gradient.geometry).dispose();
      (gradient.material).dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full z-0" />;
}
