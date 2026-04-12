const fs = require('fs');
const path = require('path');

const file = path.join('apps', 'web', 'components', 'Dither.js');
let content = fs.readFileSync(file, 'utf-8');

const oldMove = `  const handlePointerMove = e => {
    if (!enableMouseInteraction) return;
    const rect = gl.domElement.getBoundingClientRect();
    const dpr = gl.getPixelRatio();
    mouseRef.current.set((e.clientX - rect.left) * dpr, (e.clientY - rect.top) * dpr);
  };`;

const newMove = `  useEffect(() => {
    if (!enableMouseInteraction) return;

    const handleGlobalMove = e => {
      const rect = gl.domElement.getBoundingClientRect();
      const dpr = gl.getPixelRatio();
      mouseRef.current.set((e.clientX - rect.left) * dpr, (e.clientY - rect.top) * dpr);
    };

    window.addEventListener("mousemove", handleGlobalMove);
    return () => window.removeEventListener("mousemove", handleGlobalMove);
  }, [enableMouseInteraction, gl]);`;

content = content.replace(oldMove, newMove);

const oldMesh = `      <mesh
        onPointerMove={handlePointerMove}
        position={[0, 0, 0.01]}
        scale={[viewport.width, viewport.height, 1]}
        visible={false}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>`;

content = content.replace(oldMesh, "");

fs.writeFileSync(file, content);
console.log("Updated mouse listener for Dither");
