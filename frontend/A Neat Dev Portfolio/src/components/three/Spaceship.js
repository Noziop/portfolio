// Importation des modules nécessaires
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';
import { createEngineParticles, updateEngineParticles } from './EngineParticles';

export class Spaceship {
  constructor(scene, physicsWorld) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.mesh = null;
    this.body = null;
    this.engineLight = null;
    this.engineParticles = null;
    this.thrusterPower = 0;
    this.isReady = false;
    this.readyCallbacks = [];

    // Charger le modèle 3D du vaisseau
    this.loadModel();
  }

  loadModel() {
    const loader = new GLTFLoader();

    loader.load(
      '/src/assets/models/spaceship.glb',
      (gltf) => {
        this.mesh = gltf.scene;

        // Ajuster l'échelle du modèle
        this.mesh.scale.set(0.1, 0.1, 0.1);

        // Créer un corps physique pour le vaisseau
        const shape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 2));
        this.body = new CANNON.Body({
          mass: 1,
          shape: shape,
          position: new CANNON.Vec3(0, -2, 0),
        });

        // Ajouter le corps physique au monde physique
        this.physicsWorld.addBody(this.body);

        // Synchroniser la position initiale
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);

        // Ajouter la lumière du moteur
        this.engineLight = new THREE.PointLight(0x00aaff, 0, 50);
        this.engineLight.position.set(0, 0, -1.5);
        this.mesh.add(this.engineLight);

        // Créer et ajouter les particules du moteur
        this.engineParticles = createEngineParticles();
        this.engineParticles.position.set(0, 0, -2); // Position légèrement derrière le vaisseau
        this.mesh.add(this.engineParticles);

        // Ajouter le modèle 3D à la scène
        this.scene.add(this.mesh);

        // Marquer comme prêt et exécuter les callbacks
        this.isReady = true;
        this.readyCallbacks.forEach(callback => callback());
      },
      undefined,
      (error) => {
        console.error('Erreur lors du chargement du modèle :', error);
      }
    );
  }

  // Méthode pour ajouter un callback à exécuter quand le vaisseau est prêt
  onReady(callback) {
    if (this.isReady) {
      callback();
    } else {
      this.readyCallbacks.push(callback);
    }
  }

  update() {
    if (this.mesh && this.body) {
      // Synchroniser la position et la rotation entre Cannon.js et Three.js
      this.mesh.position.copy(this.body.position);
      this.mesh.quaternion.copy(this.body.quaternion);

      // Mettre à jour les particules du moteur si elles existent
      if (this.engineParticles && this.thrusterPower > 0) {
        updateEngineParticles(this.engineParticles, this.thrusterPower);
      }
    }
  }

  // Récupérer la position actuelle du vaisseau
  getPosition() {
    if (this.body) {
      return new THREE.Vector3().copy(this.body.position);
    }
    return null;
  }

  // Récupérer le corps physique
  getBody() {
    return this.body;
  }

  getQuaternion() {
    // Si tu utilises un mesh Three.js
    if (this.mesh) {
      return this.mesh.quaternion;
    }

    // Si tu utilises un corps physique CANNON.js
    if (this.body) {
      return new THREE.Quaternion(
        this.body.quaternion.x,
        this.body.quaternion.y,
        this.body.quaternion.z,
        this.body.quaternion.w
      );
    }

    // Valeur par défaut (pas de rotation)
    return new THREE.Quaternion();
  }

  // Allumer/éteindre les moteurs et mettre à jour la puissance des propulseurs
  setEngineLight(intensity) {
    if (this.engineLight) {
      this.engineLight.intensity = intensity;
      this.thrusterPower = intensity > 0 ? intensity / 4 : 0;
    }
  }
}
