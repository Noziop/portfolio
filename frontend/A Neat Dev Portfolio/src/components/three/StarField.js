import * as THREE from 'three';

export const createStarField = (scene) => {
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 100000;

  const positions = [];
  const opacities = [];
  const sizes = [];

  //map size
  for (let i = 0; i < starCount; i++) {
    positions.push((Math.random() - 0.5) * 3000); // x
    positions.push((Math.random() - 0.5) * 3000); // y
    positions.push((Math.random() - 0.5) * 2000);


    opacities.push(Math.random());


    sizes.push(Math.random() * 1.5 + 1);
  }

  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  starGeometry.setAttribute('opacity', new THREE.Float32BufferAttribute(opacities, 1));
  starGeometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));


  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;

  const ctx = canvas.getContext('2d');

  ctx.beginPath();
  ctx.arc(32, 32, 30, 0, Math.PI * 2);


  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fill();

  const starTexture = new THREE.CanvasTexture(canvas);


  const starMaterial = new THREE.PointsMaterial({
    map: starTexture,
    size: 2,
    transparent: true,
    opacity: 1.0,
    blending: THREE.AdditiveBlending,
    vertexColors: false,
    depthWrite: false
  });

  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
  return stars;

  const asteroidGeometry = new THREE.SphereGeometry(50, 32, 32);
  const asteroidMaterial = new THREE.MeshBasicMaterial({ color: 0x444444 });
  for(let i = 0; i < 100; i++) {
    const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
    asteroid.position.set(
      (Math.random() - 0.5) * 10000,
      (Math.random() - 0.5) * 10000,
      (Math.random() - 0.5) * 10000
    );
    scene.add(asteroid);
  }
};


export const twinkleStars = (stars) => {
  if (!stars) return;

  const opacityAttribute = stars.geometry.getAttribute('opacity');
  const sizeAttribute = stars.geometry.getAttribute('size');

  for (let i = 0; i < opacityAttribute.count; i++) {

    let opacity = opacityAttribute.getX(i);
    opacity += (Math.random() - 0.5) * 0.05;
    opacity = Math.max(0.2, Math.min(0.8, opacity));
    opacityAttribute.setX(i, opacity);


    let size = sizeAttribute.getX(i);
    size += (Math.random() - 0.5) * 0.02;
    size = Math.max(0.5, Math.min(2.0, size));
    sizeAttribute.setX(i, size);
  }

  opacityAttribute.needsUpdate = true;
  sizeAttribute.needsUpdate = true;
};

export const updateStarField = (stars) => {
  stars.rotation.x += 0.0001;
  stars.rotation.y += 0.0001;


  twinkleStars(stars);
};


export const resizeStarField = (stars, camera, renderer) => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

export const destroyStarField = (stars, scene) => {
  scene.remove(stars);
  stars.geometry.dispose();
  stars.material.dispose();
};
