import * as THREE from 'three';
import { UniverseConfig } from '@/config/universe.config';

export const createStarField = (scene) => {
  const starGeometry = new THREE.BufferGeometry();
  // Utiliser la configuration pour le nombre d'étoiles
  const starCount = UniverseConfig.stars.count*2;

  const positions = [];
  const opacities = [];
  const sizes = [];

  // Conserver la distribution spatiale actuelle qui fonctionne bien
  const fullRange = UniverseConfig.universeSize;
  for (let i = 0; i < starCount; i++) {
    positions.push(Math.random() * 2 * fullRange - fullRange); // x
    positions.push(Math.random() * 2 * fullRange - fullRange); // y
    positions.push(Math.random() * 2 * fullRange - fullRange); // z

    opacities.push(Math.random());

    // Utiliser la configuration pour la taille (avec valeurs par défaut sécurisées)
    const minSize = UniverseConfig?.stars?.size?.min || 1;
    const maxSize = UniverseConfig?.stars?.size?.max || 2.5;
    sizes.push(Math.random() * (maxSize - minSize) + minSize);
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
};

export const twinkleStars = (stars) => {
  if (!stars || !stars.geometry) return;

  const opacityAttribute = stars.geometry.getAttribute('opacity');
  const sizeAttribute = stars.geometry.getAttribute('size');

  if (!opacityAttribute || !sizeAttribute) return;

  // Optimisation: ne mettre à jour qu'une partie des étoiles à chaque frame
  const updateCount = Math.min(5000, opacityAttribute.count);
  const startIdx = Math.floor(Math.random() * (opacityAttribute.count - updateCount));

  for (let i = startIdx; i < startIdx + updateCount; i++) {
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
  if (!stars) return;

  stars.rotation.x += 0.0001;
  stars.rotation.y += 0.0001;

  twinkleStars(stars);
};

export const resizeStarField = (stars, camera, renderer) => {
  if (!camera || !renderer) return;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

export const destroyStarField = (stars, scene) => {
  if (!stars || !scene) return;

  scene.remove(stars);

  if (stars.geometry) stars.geometry.dispose();
  if (stars.material) {
    if (stars.material.map) stars.material.map.dispose();
    stars.material.dispose();
  }
};
