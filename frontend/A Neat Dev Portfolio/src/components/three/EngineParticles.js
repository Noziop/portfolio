import * as THREE from 'three';

export const createEngineParticles = () => {
  // Configuration géométrie avec plus de particules
  const particleCount = 2000;
  const particles = new THREE.BufferGeometry();
  const posArray = new Float32Array(particleCount * 3);
  const colorArray = new Float32Array(particleCount * 3);

  // Créer une distribution conique pour les particules
  for(let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    // Position x et y plus concentrée au centre
    posArray[i3] = (Math.random() - 0.5) * 0.2;
    posArray[i3 + 1] = (Math.random() - 0.5) * 0.2;
    // Position z négative pour créer une traînée derrière le vaisseau
    posArray[i3 + 2] = -Math.random() * 3;

    // Couleurs variant du bleu clair (près du moteur) au blanc/transparent (loin)
    const blueIntensity = Math.random() * 0.5 + 0.5;
    colorArray[i3] = blueIntensity * 0.2;    // R
    colorArray[i3 + 1] = blueIntensity * 0.7; // G
    colorArray[i3 + 2] = blueIntensity;       // B
  }

  particles.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  particles.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

  // Configuration matériau avec dégradé de couleur
  const material = new THREE.PointsMaterial({
    size: 0.3,  // Augmenté pour meilleure visibilité
    vertexColors: true,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  });

  return new THREE.Points(particles, material);
};

export const updateEngineParticles = (particles, intensity) => {
  if (!particles || !particles.geometry) return;

  const positions = particles.geometry.attributes.position.array;
  const colors = particles.geometry.attributes.color.array;

  // Facteur d'animation lié à l'intensité (1-5)
  const speedFactor = Math.max(0.5, intensity);

  for(let i = 0; i < positions.length; i += 3) {
    // Déplacer les particules vers l'arrière
    positions[i + 2] -= speedFactor * 0.9;

    // Légère dispersion latérale
    positions[i] += (Math.random() - 0.5) * 0.02;
    positions[i + 1] += (Math.random() - 0.5) * 0.02;

    // Faire disparaître progressivement les particules
    const distanceFromEngine = Math.abs(positions[i + 2]);
    const opacity = Math.max(0, 1 - distanceFromEngine / 3);

    // Mettre à jour la couleur avec disparition
    colors[i] = 0.2 * opacity;     // R
    colors[i + 1] = 0.7 * opacity; // G
    colors[i + 2] = opacity;       // B

    // Réinitialiser les particules trop éloignées
    if(positions[i + 2] < -3 || opacity < 0.1) {
      positions[i] = (Math.random() - 0.5) * 0.2;
      positions[i + 1] = (Math.random() - 0.5) * 0.2;
      positions[i + 2] = -0.1; // Démarrer près du moteur
    }
  }

  particles.geometry.attributes.position.needsUpdate = true;
  particles.geometry.attributes.color.needsUpdate = true;
};
