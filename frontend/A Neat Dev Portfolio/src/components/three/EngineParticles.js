import * as THREE from 'three';

export const createEngineParticles = () => {
  // Configuration géométrie
  const particleCount = 1000;
  const particles = new THREE.BufferGeometry();
  const posArray = new Float32Array(particleCount * 3);

  for(let i = 0; i < particleCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 0.1; // Position aléatoire autour de l'origine
  }

  particles.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

  // Configuration matériau
  const material = new THREE.PointsMaterial({
    size: 0.02,
    color: 0x00aaff,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  return new THREE.Points(particles, material);
};

export const updateEngineParticles = (particles, intensity) => {
  const positions = particles.geometry.attributes.position.array;

  for(let i = 0; i < positions.length; i += 3) {
    // Déplacer les particules vers l'arrière
    positions[i + 2] -= intensity * 0.1;

    // Réinitialiser les particules trop éloignées
    if(positions[i + 2] < -2) {
      positions[i] = (Math.random() - 0.5) * 0.1;
      positions[i + 1] = (Math.random() - 0.5) * 0.1;
      positions[i + 2] = 0;
    }
  }

  particles.geometry.attributes.position.needsUpdate = true;
};
