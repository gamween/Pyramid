const fs = require('fs');

let code = fs.readFileSync('apps/web/components/three/LEDPyramid.js', 'utf8');

code = code.replace(
  'camera.position.set(0, 3.2, 9.0);',
  'camera.position.set(0, 2.5, 6.5); // Zoomez pour la rendre plus grande'
);

code = code.replace(
  'camera.lookAt(0, 0.8, 0);',
  'camera.lookAt(0, 0.7, 0);'
);

code = code.replace(
  'bgCamera.lookAt(0, 0.8, 0);',
  'bgCamera.lookAt(0, 0.7, 0);'
);

fs.writeFileSync('apps/web/components/three/LEDPyramid.js', code, 'utf8');
console.log('Pyramid resized (zoomed in)!');
