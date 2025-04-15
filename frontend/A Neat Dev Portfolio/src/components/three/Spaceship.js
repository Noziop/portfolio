// Importation des modules nécessaires
import * as THREE from 'three'; // Pour gérer la scène 3D
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'; // Pour charger le modèle GLB
import * as CANNON from 'cannon-es'; // Pour gérer la physique

export class Spaceship {
  constructor(scene, physicsWorld) {
    // Charger le modèle 3D du vaisseau
    const loader = new GLTFLoader();

    loader.load(
      '/src/assets/models/spaceship.glb', // Chemin vers le modèle
      (gltf) => {
        this.mesh = gltf.scene;

        // Ajuster l'échelle et la position initiale du vaisseau
        this.mesh.scale.set(0.3, 0.3, 0.3);
        this.mesh.position.set(0, -10, -8);

        // Créer un corps physique pour le vaisseau
        const shape = new CANNON.Box(new CANNON.Vec3(1.5, 1.5, 4)); // Approximation en boîte
        this.body = new CANNON.Body({
          mass: 1, // Masse du vaisseau (affecte l'inertie)
          shape: shape,
          position: new CANNON.Vec3(0, -2, -8), // Position initiale
        });

        // Ajouter le corps physique au monde physique
        physicsWorld.addBody(this.body);

        // Ajouter le modèle 3D à la scène
        scene.add(this.mesh);
      },
      undefined,
      (error) => {
        console.error('Erreur lors du chargement du modèle :', error);
      }
    );
  }

  update() {
    if (this.mesh && this.body) {
      // Synchroniser la position et la rotation entre Cannon.js et Three.js
      this.mesh.position.copy(this.body.position);
      this.mesh.quaternion.copy(this.body.quaternion);
    }
  }
}
