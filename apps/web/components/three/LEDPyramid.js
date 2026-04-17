"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function LEDPyramid() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 2.5, 6.5); // Zoom in to make it larger
    camera.lookAt(0, 0.7, 0);

    // Separate scene for background gradient (no pixel effect)
    const bgScene = new THREE.Scene();
    const bgCamera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    bgCamera.position.copy(camera.position);
    bgCamera.lookAt(0, 0.7, 0);

    // Lights - maximum intensity for very bright pyramid
    scene.add(new THREE.AmbientLight(0x8899bb, 3.0));
    const sun = new THREE.DirectionalLight(0xffffff, 8.0);
    sun.position.set(5, 10, 4);
    sun.castShadow = true;
    scene.add(sun);
    const fill = new THREE.PointLight(0x99aaff, 8.0, 22);
    fill.position.set(-6, 3, 3);
    scene.add(fill);
    const rim = new THREE.PointLight(0x00ffff, 6.0, 14);
    rim.position.set(3, -1, -5);
    scene.add(rim);

    // Pyramid geometry - larger and flatter
    const HALF = 2.2,
      H = 2.2;
    const C0 = new THREE.Vector3(HALF, 0, 0);
    const C1 = new THREE.Vector3(0, 0, HALF);
    const C2 = new THREE.Vector3(-HALF, 0, 0);
    const C3 = new THREE.Vector3(0, 0, -HALF);
    const APEX = new THREE.Vector3(0, H, 0);
    const CORNERS = [C0, C1, C2, C3];

    function buildFaceGrid(A, B, apex, N) {
      const pts = [];
      const rows = [];

      for (let i = 0; i <= N; i++) {
        const v = i / N;
        const L = new THREE.Vector3().lerpVectors(A, apex, v);
        const R = new THREE.Vector3().lerpVectors(B, apex, v);
        const n = N - i;
        const row = [];

        if (n === 0) {
          row.push(apex.clone());
        } else {
          for (let j = 0; j <= n; j++) {
            row.push(new THREE.Vector3().lerpVectors(L, R, j / n));
          }
        }
        rows.push(row);
      }

      for (let i = 0; i <= N; i++) {
        const r = rows[i];
        for (let j = 0; j < r.length - 1; j++) {
          const p = r[j],
            q = r[j + 1];
          pts.push(p.x, p.y, p.z, q.x, q.y, q.z);
        }
      }

      for (let i = 0; i < N; i++) {
        const rA = rows[i],
          rB = rows[i + 1];
        for (let j = 0; j < rB.length; j++) {
          const p1 = rA[j],
            p2 = rB[j];
          pts.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
          const p3 = rA[j + 1];
          pts.push(p3.x, p3.y, p3.z, p2.x, p2.y, p2.z);
        }
      }

      return pts;
    }

    let allGridPts = [];
    for (let f = 0; f < 4; f++) {
      allGridPts = allGridPts.concat(
        buildFaceGrid(CORNERS[f], CORNERS[(f + 1) % 4], APEX, 8)
      );
    }

    const gridGeo = new THREE.BufferGeometry();
    gridGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(allGridPts), 3)
    );
    const gridMaterial = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        varying vec3 vPosition;
        void main() {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vPosition;
        void main() {
          gl_FragColor = vec4(1.5, 1.5, 1.5, 1.0);
        }
      `,
      transparent: false,
      depthTest: true,
      depthWrite: true,
    });
    const gridMesh = new THREE.LineSegments(gridGeo, gridMaterial);

    const faceVerts = [];
    for (let f = 0; f < 4; f++) {
      const A = CORNERS[f],
        B = CORNERS[(f + 1) % 4];
      faceVerts.push(A.x, A.y, A.z, B.x, B.y, B.z, APEX.x, APEX.y, APEX.z);
    }
    const glassGeo = new THREE.BufferGeometry();
    glassGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(faceVerts), 3)
    );
    glassGeo.computeVertexNormals();
    const glassMesh = new THREE.Mesh(
      glassGeo,
      new THREE.MeshPhongMaterial({
        color: 0xaaccff,
        emissive: 0x5588cc,
        specular: 0xffffff,
        shininess: 240,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );

    const baseV = [C0.x, 0, C0.z, C1.x, 0, C1.z, C2.x, 0, C2.z, C3.x, 0, C3.z];
    const baseGeo = new THREE.BufferGeometry();
    baseGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(baseV), 3)
    );
    baseGeo.setIndex([0, 1, 2, 0, 2, 3]);
    baseGeo.computeVertexNormals();
    const baseMesh = new THREE.Mesh(
      baseGeo,
      new THREE.MeshPhongMaterial({
        color: 0x2a3a4a,
        specular: 0x6688aa,
        shininess: 80,
        transparent: true,
        opacity: 0.6,
      })
    );

    const pyramidGroup = new THREE.Group();
    pyramidGroup.add(glassMesh, gridMesh, baseMesh);
    pyramidGroup.position.y = 0.1;
    scene.add(pyramidGroup);

    // Reflection
    const reflGeo = new THREE.BufferGeometry();
    reflGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(allGridPts), 3)
    );
    const reflMesh = new THREE.LineSegments(
      reflGeo,
      new THREE.LineBasicMaterial({
        color: 0x5599cc,
        transparent: true,
        opacity: 0.25,
      })
    );
    reflMesh.scale.y = -1;
    const reflGroup = new THREE.Group();
    reflGroup.add(reflMesh);
    reflGroup.position.y = pyramidGroup.position.y;
    scene.add(reflGroup);

    // Gradient background plane
    const gradientMat = new THREE.ShaderMaterial({
      uniforms: {
        uColor1: { value: new THREE.Color(0x000074) },
        uColor2: { value: new THREE.Color(0x6ec7ff) },
        uColor3: { value: new THREE.Color(0x7f5fe1) },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;

        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;
        varying vec2 vUv;
        varying vec3 vPosition;

        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy));
          vec2 x0 = v -   i + dot(i, C.xx);
          vec2 i1;
          i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
          m = m*m;
          m = m*m;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
          vec3 g;
          g.x  = a0.x  * x0.x  + h.x  * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }

        void main() {
          vec2 uv = vUv;

          float noise1 = snoise(uv * 5.5) * 1.5;
          float noise2 = snoise(uv * 2.1 + vec2(100.0)) * 1.5;
          float noise3 = snoise(uv * 3.5 + vec2(50.0)) * 1.5;

          float n = (noise1 + noise2 * 0.5 + noise3 * 0.3) * 0.5 + 0.5;

          float gradX = vPosition.x * 0.1 + 0.5;
          float gradY = vPosition.y * 0.1 + 0.5;

          vec3 color = mix(uColor1, uColor2, n * 0.6 + gradX * 0.4);
          color = mix(color, uColor3, noise2 * 0.5 + gradY * 0.3);

          float grain = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
          color += (grain - 0.5) * 0.08;

          color *= 0.35;

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    });

    const gradientPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(35, 35),
      gradientMat
    );
    gradientPlane.position.z = -10;
    gradientPlane.position.y = 1;
    gradientPlane.rotation.z = (50 * Math.PI) / 180;
    bgScene.add(gradientPlane);

    // Ground - almost invisible for very dark background
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 18),
      new THREE.MeshPhongMaterial({
        color: 0x000000,
        specular: 0x0a1f2f,
        shininess: 100,
        transparent: true,
        opacity: 0.05,
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = pyramidGroup.position.y - 0.01;
    ground.receiveShadow = true;
    scene.add(ground);

    // Render targets
    let rt_scene = null;
    let rt_led = null;
    let rt_bloomH = null;

    function makeRTs(w, h) {
      [rt_scene, rt_led, rt_bloomH].forEach((r) => r && r.dispose());
      const opts = {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
      };
      rt_scene = new THREE.WebGLRenderTarget(w, h, opts);
      rt_led = new THREE.WebGLRenderTarget(w, h, opts);
      rt_bloomH = new THREE.WebGLRenderTarget(Math.floor(w / 2), Math.floor(h / 2), opts);
      return { rt_scene, rt_led, rt_bloomH };
    }

    function makeQuad() {
      const g = new THREE.BufferGeometry();
      g.setAttribute(
        "position",
        new THREE.BufferAttribute(
          new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]),
          3
        )
      );
      g.setAttribute(
        "uv",
        new THREE.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2)
      );
      return g;
    }

    const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const pixelSize = 4;

    // LED shader
    const ledMat = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        resolution: { value: new THREE.Vector2() },
        uPixelSize: { value: pixelSize },
      },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec2      resolution;
        uniform float     uPixelSize;
        varying vec2      vUv;

        float luma(vec3 c){ return dot(c,vec3(0.2126,0.7152,0.0722)); }

        void main(){
          vec2 uv=vUv;
          vec2 np=vec2(uPixelSize)/resolution;

          float col=floor(uv.x/np.x);
          float stagger=mod(col,2.0)*0.5*np.y;
          vec2 uvS=vec2(uv.x, uv.y+stagger);

          vec2 uvP=np*floor(uvS/np);
          vec4 color=texture2D(tDiffuse, clamp(uvP,0.,1.));

          vec2 cellUV=fract(uvS/np);
          float l=luma(color.rgb);

          float subCol=floor(cellUV.x*3.0);
          float subOff=mod(subCol,2.0)*0.14;
          vec2 subUV=vec2(fract(cellUV.x*3.0), cellUV.y+subOff);

          float dist=length(subUV-0.5);
          float radius=mix(0.04,0.48,l);
          float aa=fwidth(dist)*0.8;
          float circle=smoothstep(radius+aa, radius-aa, dist);
          float glow=smoothstep(radius+0.15, radius-0.02, dist)*0.1;

          vec3 led=color.rgb*(4.0+3.0*circle)+color.rgb*glow*2.0;

          vec3 bg=vec3(0.0);
          float contrast = pow(circle, 0.5);
          led = mix(bg, led, contrast);

          led *= 2.5;

          float alpha = max(circle, 0.1);
          gl_FragColor=vec4(led, alpha);
        }
      `,
      depthTest: false,
      depthWrite: false,
    });
    const ledScene = new THREE.Scene();
    ledScene.add(new THREE.Mesh(makeQuad(), ledMat));

    // Bloom horizontal shader
    const bloomHMat = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        uTexelSize: { value: new THREE.Vector2() },
        uThreshold: { value: 0.08 },
      },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec2      uTexelSize;
        uniform float     uThreshold;
        varying vec2      vUv;

        float W[7];

        vec3 blueShift(vec3 c){
          float br = max(c.r, max(c.g, c.b));
          vec3 tint1 = vec3(0.43, 0.78, 1.0);
          vec3 tint2 = vec3(0.5, 0.37, 0.88);
          vec3 tint = mix(tint1, tint2, vUv.x);
          return mix(c, c * tint * 4.5, smoothstep(uThreshold, uThreshold+0.5, br));
        }

        void main(){
          W[0]=0.2270; W[1]=0.1945; W[2]=0.1216; W[3]=0.0540; W[4]=0.0162; W[5]=0.0038; W[6]=0.0008;

          vec3 result = vec3(0.0);
          float totalW = 0.0;

          for(int i=-6; i<=6; i++){
            vec2 off = vec2(float(i)*uTexelSize.x*2.0, 0.0);
            vec4 s = texture2D(tDiffuse, vUv + off);
            float br = max(s.r, max(s.g, s.b));
            float contrib = smoothstep(uThreshold-0.1, uThreshold+0.5, br);
            vec3 tinted = blueShift(s.rgb) * contrib * 1.5;
            float w = W[abs(i)];
            result   += tinted * w;
            totalW   += w;
          }

          gl_FragColor = vec4(result / totalW, 1.0);
        }
      `,
      depthTest: false,
      depthWrite: false,
    });
    const bloomHScene = new THREE.Scene();
    bloomHScene.add(new THREE.Mesh(makeQuad(), bloomHMat));

    const bloomStrength = 0.0;

    // Composite shader
    const compositeMat = new THREE.ShaderMaterial({
      uniforms: {
        tLed: { value: null },
        tBloomH: { value: null },
        uTexelSize: { value: new THREE.Vector2() },
        uBloomStrength: { value: bloomStrength },
      },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
      fragmentShader: `
        uniform sampler2D tLed;
        uniform sampler2D tBloomH;
        uniform vec2      uTexelSize;
        uniform float     uBloomStrength;
        varying vec2      vUv;

        float W[7];

        void main(){
          W[0]=0.2270; W[1]=0.1945; W[2]=0.1216; W[3]=0.0540; W[4]=0.0162; W[5]=0.0038; W[6]=0.0008;

          vec3 bloom = vec3(0.0);
          float totalW = 0.0;
          for(int i=-6; i<=6; i++){
            vec2 off = vec2(0.0, float(i)*uTexelSize.y*2.0);
            vec3 s = texture2D(tBloomH, vUv + off).rgb;
            float w = W[abs(i)];
            bloom  += s * w;
            totalW += w;
          }
          bloom /= totalW;

          vec4 ledSample = texture2D(tLed, vUv);
          vec3 led = ledSample.rgb;
          float alpha = ledSample.a;

          vec3 result = led + bloom * uBloomStrength * 4.5;

          result = result / (result + 0.2);
          result *= 4.5;

          vec2 uv2 = vUv*2.-1.;
          float vig = 1.0 - dot(uv2,uv2)*0.18;
          result *= vig;

          gl_FragColor = vec4(result, alpha);
        }
      `,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      blending: THREE.NormalBlending,
    });
    const compositeScene = new THREE.Scene();
    compositeScene.add(new THREE.Mesh(makeQuad(), compositeMat));

    function onResize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const rts = makeRTs(w, h);
      rt_scene = rts.rt_scene;
      rt_led = rts.rt_led;
      rt_bloomH = rts.rt_bloomH;
      ledMat.uniforms.resolution.value.set(w, h);
      bloomHMat.uniforms.uTexelSize.value.set(1 / (w / 2), 1 / (h / 2));
      compositeMat.uniforms.uTexelSize.value.set(1 / w, 1 / h);
    }

    window.addEventListener("resize", onResize);
    onResize();

    const clock = new THREE.Clock();
    let animationId;

    function animate() {
      animationId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      const angle = t * 0.28;
      pyramidGroup.rotation.y = angle;
      reflGroup.rotation.y = angle;

      camera.position.x = Math.sin(t * 0.09) * 0.5;
      camera.position.y = 3.2 + Math.sin(t * 0.07) * 0.15;
      camera.lookAt(0, 0.8, 0);

      fill.intensity = 8.0 + Math.sin(t * 0.65) * 1.0;
      rim.intensity = 6.0 + Math.cos(t * 0.45) * 0.8;

      if (rt_scene && rt_led && rt_bloomH) {
        // First render background gradient directly to screen (no pixel effect)
        renderer.setRenderTarget(null);
        renderer.clear();
        renderer.render(bgScene, bgCamera);

        // Render pyramid scene to render target
        renderer.setRenderTarget(rt_scene);
        renderer.clear();
        renderer.render(scene, camera);

        // Apply LED pixel shader
        ledMat.uniforms.tDiffuse.value = rt_scene.texture;
        renderer.setRenderTarget(rt_led);
        renderer.render(ledScene, quadCam);

        // Apply bloom horizontal
        bloomHMat.uniforms.tDiffuse.value = rt_led.texture;
        renderer.setRenderTarget(rt_bloomH);
        renderer.render(bloomHScene, quadCam);

        // Composite pixelated pyramid on top of gradient background
        compositeMat.uniforms.tLed.value = rt_led.texture;
        compositeMat.uniforms.tBloomH.value = rt_bloomH.texture;
        renderer.setRenderTarget(null);
        renderer.autoClear = false;
        renderer.render(compositeScene, quadCam);
        renderer.autoClear = true;
      }
    }

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", onResize);
      [rt_scene, rt_led, rt_bloomH].forEach((r) => r && r.dispose());
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" />;
}
