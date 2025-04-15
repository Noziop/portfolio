import * as THREE from 'three';

export class Planet {
  constructor(scene, name, position, color, size) {
    this.scene = scene;
    this.name = name;
    this.position = position;
    this.color = color;
    this.size = size;

    // Création de la géométrie de la planète
    const geometry = new THREE.SphereGeometry(size, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.3,
      roughness: 0.7,
      emissive: color,
      emissiveIntensity: 0.2
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(position.x, position.y, position.z);
    this.mesh.name = name;

    // Halo autour de la planète
    const haloGeometry = new THREE.SphereGeometry(size + 0.2, 32, 32);
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.1
    });
    this.halo = new THREE.Mesh(haloGeometry, haloMaterial);
    this.mesh.add(this.halo);

    // Ajouter à la scène
    scene.add(this.mesh);
  }

  // Mettre à jour l'intensité du halo en fonction de la distance
  updateHalo(distanceToShip) {
    const haloIntensity = Math.max(0.1, Math.min(0.5, 5 / distanceToShip));
    this.halo.material.opacity = haloIntensity;

    return haloIntensity > 0.3; // Retourne true si le vaisseau est proche
  }

  // Obtenir la position pour positionner le tooltip
  getScreenPosition(camera) {
    const vector = new THREE.Vector3();
    vector.setFromMatrixPosition(this.mesh.matrixWorld);
    vector.project(camera);

    return {
      x: (vector.x * 0.5 + 0.5) * window.innerWidth,
      y: (-vector.y * 0.5 + 0.5) * window.innerHeight
    };
  }

  // Destruction propre de la planète
  dispose() {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.halo.geometry.dispose();
    this.halo.material.dispose();
    this.scene.remove(this.mesh);
  }
}

// Fonction pour créer plusieurs planètes
export const createPlanets = (scene) => {
  const planets = [
    new Planet(scene, 'About', { x: 15, y: 2, z: -15 }, 0x3498db, 3),
    new Planet(scene, 'Projects', { x: 35, y: 1, z: -18 }, 0xe74c3c, 4),
    new Planet(scene, 'Skills', { x: 55, y: 3, z: -15 }, 0x2ecc71, 3.5),
    new Planet(scene, 'Contact', { x: 75, y: 0, z: -20 }, 0xf39c12, 2.5)
  ];

  return planets;
};
