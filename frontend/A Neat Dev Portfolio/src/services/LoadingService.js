import * as THREE from 'three';
import { UniverseConfig } from '@/config/universe.config';

export class LoadingService {
  constructor() {
    this.listeners = [];
    this.progress = 0;
  }

  on(type, callback) {
    this.listeners.push({ type, callback });
    return this;
  }

  emit(type, data) {
    this.listeners.forEach(listener => {
      if (listener.type === type) listener.callback(data);
    });
  }

  updateProgress(value) {
    this.progress = value;
    this.emit('progress', this.progress);
  }

  /**
   * Génère l'univers de façon progressive et optimisée
   */
  async generateUniverse(scene, camera, physicsWorld) {
    // 1. Générer un champ d'étoiles initial réduit
    await this.generateMinimalStarfield(scene);
    this.updateProgress(15);

    // 2. Créer le vaisseau et configuration de base
    await this.createBasicEnvironment(scene, physicsWorld);
    this.updateProgress(30);

    // 3. Générer progressivement les planètes
    await this.generatePlanetsProgressively(scene, physicsWorld);
    this.updateProgress(60);

    // 4. Ajouter les anneaux et portails
    await this.generateRings(scene);
    this.updateProgress(75);

    // 5. Compléter les étoiles restantes de façon asynchrone
    this.completeStarfieldAsync(scene);
    this.updateProgress(100);

    // Renvoyer les objets principaux pour que la scène soit interactive immédiatement
    return {
      ready: true
    };
  }

  /**
   * Génère un nombre réduit d'étoiles pour le chargement initial
   */
  async generateMinimalStarfield(scene) {
    // Réduire drastiquement le nombre d'étoiles initial (1% du total)
    const initialStarCount = Math.min(50000, Math.floor(UniverseConfig.stars.count * 0.01));

    return new Promise(resolve => {
      setTimeout(() => {
        // Utiliser l'instanciation au lieu de géométries individuelles
        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array(initialStarCount * 3);

        for (let i = 0; i < initialStarCount * 3; i += 3) {
          // Distribution sphérique pour les étoiles
          const radius = UniverseConfig.universeSize * 0.8 * Math.pow(Math.random(), 0.5);
          const theta = 2 * Math.PI * Math.random();
          const phi = Math.acos(2 * Math.random() - 1);

          vertices[i] = radius * Math.sin(phi) * Math.cos(theta);
          vertices[i+1] = radius * Math.sin(phi) * Math.sin(theta);
          vertices[i+2] = radius * Math.cos(phi);
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

        const material = new THREE.PointsMaterial({
          size: 1.5,
          sizeAttenuation: true,
          color: 0xFFFFFF
        });

        const stars = new THREE.Points(geometry, material);
        stars.name = 'initialStarfield';
        scene.add(stars);

        resolve(stars);
      }, 100); // Petit délai pour permettre le rendu UI
    });
  }

  /**
   * Compléter le champ d'étoiles en arrière-plan
   */
  completeStarfieldAsync(scene) {
    // Cette fonction s'exécute après que l'interface est interactive
    const remainingStars = UniverseConfig.stars.count - 50000;
    const batchSize = 150000; // Nombre d'étoiles par batch
    const batches = Math.ceil(remainingStars / batchSize);

    const addStarBatch = (batchIndex) => {
      setTimeout(() => {
        // Calculer combien d'étoiles ajouter dans ce batch
        const starsToAdd = (batchIndex < batches - 1) ?
          batchSize : (remainingStars - batchIndex * batchSize);

        // Créer le batch
        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array(starsToAdd * 3);

        for (let i = 0; i < starsToAdd * 3; i += 3) {
          // Distribution sphérique plus lointaine pour ces batches
          const radius = UniverseConfig.universeSize * 0.6 * (0.8 + 0.2 * Math.random());
          const theta = 2 * Math.PI * Math.random();
          const phi = Math.acos(2 * Math.random() - 1);

          vertices[i] = radius * Math.sin(phi) * Math.cos(theta);
          vertices[i+1] = radius * Math.sin(phi) * Math.sin(theta);
          vertices[i+2] = radius * Math.cos(phi);
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

        const material = new THREE.PointsMaterial({
          size: 1.0, // Plus petites que les étoiles initiales
          sizeAttenuation: true,
          color: 0xFFFFFF
        });

        const starBatch = new THREE.Points(geometry, material);
        starBatch.name = `starfield_batch_${batchIndex}`;
        scene.add(starBatch);

        // Continuer avec le batch suivant s'il en reste
        if (batchIndex < batches - 1) {
          addStarBatch(batchIndex + 1);
        }
      }, 50); // Petit délai entre les batches
    };

    // Commencer à ajouter des batches d'étoiles
    if (batches > 0) {
      addStarBatch(0);
    }
  }

  /**
   * Crée l'environnement de base (vaisseau, lumières)
   */
  async createBasicEnvironment(scene, physicsWorld) {
    return new Promise(resolve => {
      setTimeout(() => {
        // Ajouter les lumières
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1).normalize();
        scene.add(directionalLight);

        // Autres configurations de base...

        resolve();
      }, 200);
    });
  }

  /**
   * Génère les planètes progressivement
   */
  async generatePlanetsProgressively(scene, physicsWorld) {
    const planetCount = UniverseConfig.planets.count;

    // Générer les planètes par lots pour éviter de bloquer le thread principal
    const batchSize = 2; // Générer 2 planètes à la fois
    const batches = Math.ceil(planetCount / batchSize);

    for (let i = 0; i < batches; i++) {
      await this.generatePlanetBatch(scene, physicsWorld, i, batchSize, planetCount);
      // Mise à jour de la progression
      this.updateProgress(30 + (i + 1) / batches * 30);

      // Petite pause pour permettre le rendu UI
      await new Promise(resolve => setTimeout(resolve, 20));
    }
  }

  /**
   * Génère un lot de planètes
   */
  async generatePlanetBatch(scene, physicsWorld, batchIndex, batchSize, totalPlanets) {
    return new Promise(resolve => {
      setTimeout(() => {
        const startIdx = batchIndex * batchSize;
        const endIdx = Math.min(startIdx + batchSize, totalPlanets);

        // Code pour générer les planètes du lot...
        // (Utilisation de PlanetGenerator ou équivalent)

        resolve();
      }, 50);
    });
  }

  /**
   * Génère les anneaux/portails
   */
  async generateRings(scene) {
    return new Promise(resolve => {
      setTimeout(() => {
        // Code pour créer les anneaux de portail...

        resolve();
      }, 150);
    });
  }
}
