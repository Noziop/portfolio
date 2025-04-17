import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export class PhysicsWorld {
  constructor() {
    this.world = new CANNON.World();
    this.world.gravity.set(0, 0, 0); // Pas de gravité globale dans l'espace

    // Configuration de la gravité des planètes
    this.gravitationalBodies = [];
    this.G = 6.67; // Constante gravitationnelle (à ajuster pour le gameplay)
    this.maxGravityDistance = 200; // Distance max d'influence gravitationnelle
    this.debugMode = false; // Afficher les sphères d'influence gravitationnelle

    // Liste des objets physiques
    this.bodies = [];

    // Configurer la détection de collisions
    this.setupCollisionDetection();
  }

  get gravity() {
    return this.world.gravity;
  }

  addBody(body) {
    this.world.addBody(body);
    this.bodies.push(body);
    return body;
  }

  /**
   * Ajoute un corps planétaire avec gravité
   */
  addPlanetaryBody(position, radius, mass, scene = null) {
    // Créer un corps physique statique (immobile)
    const shape = new CANNON.Sphere(radius);
    const body = new CANNON.Body({
      mass: 0, // Statique
      position: new CANNON.Vec3(position.x, position.y, position.z),
      shape: shape,
      material: new CANNON.Material({
        friction: 0.3,
        restitution: 0.4 // Rebond
      })
    });

    // Ajouter au monde physique
    this.world.addBody(body);

    // Ajouter à la liste des corps gravitationnels
    this.gravitationalBodies.push({
      body: body,
      radius: radius,
      mass: mass,
      position: position.clone()
    });

    // Ajouter une visualisation de sphère d'influence (debug)
    if (this.debugMode && scene) {
      const influenceGeometry = new THREE.SphereGeometry(this.maxGravityDistance, 16, 16);
      const influenceMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.1,
        wireframe: true
      });

      const influenceSphere = new THREE.Mesh(influenceGeometry, influenceMaterial);
      influenceSphere.position.copy(position);
      scene.add(influenceSphere);
    }

    return body;
  }

  /**
   * Ajoute tous les corps planétaires depuis le générateur de planètes
   */
  addPlanetsPhysics(planetGenerator, scene = null) {
    planetGenerator.planets.forEach(planet => {
      if (!planet.binary) {
        // Planète simple
        const mass = planet.mass || planet.size * 100;
        this.addPlanetaryBody(planet.position, planet.size, mass, scene);
      } else {
        // Système binaire - ajouter chaque planète individuellement
        // Récupérer positions mondiales des enfants
        const positions = [];
        const sizes = [];

        for (let i = 0; i < planet.mesh.children.length; i++) {
          const child = planet.mesh.children[i];
          if (child === planet.planet1 || child === planet.planet2) {
            const worldPosition = new THREE.Vector3();
            child.getWorldPosition(worldPosition);

            // Estimer la taille
            const boundingBox = new THREE.Box3().setFromObject(child);
            const size = boundingBox.getSize(new THREE.Vector3());
            const radius = Math.max(size.x, size.y, size.z) / 2;

            positions.push(worldPosition);
            sizes.push(radius);
          }
        }

        // Créer corps physiques pour chaque planète binaire
        for (let i = 0; i < positions.length; i++) {
          const mass = planet.mass || sizes[i] * 150; // Masses plus importantes
          this.addPlanetaryBody(positions[i], sizes[i], mass, scene);
        }
      }
    });
  }

  /**
   * Configure la détection de collisions entre vaisseaux et planètes
   */
  setupCollisionDetection() {
    this.world.addEventListener('beginContact', (event) => {
      const bodyA = event.bodyA;
      const bodyB = event.bodyB;

      // Si l'un des corps est un vaisseau et l'autre une planète
      if (bodyA.isSpaceship && !bodyB.isSpaceship) {
        this.handleCollision(bodyA, bodyB);
      }
      else if (!bodyA.isSpaceship && bodyB.isSpaceship) {
        this.handleCollision(bodyB, bodyA);
      }
    });
  }

  /**
   * Gère une collision entre vaisseau et planète
   */
  handleCollision(spaceshipBody, planetBody) {
    const collisionSpeed = spaceshipBody.velocity.length();

    // Actions selon la vitesse d'impact
    if (collisionSpeed > 50) {
      // Impact violent - dommages importants
      if (spaceshipBody.onCrash) {
        spaceshipBody.onCrash("severe");
      }
    } else if (collisionSpeed > 20) {
      // Impact moyen - dommages légers
      if (spaceshipBody.onCrash) {
        spaceshipBody.onCrash("moderate");
      }
    } else {
      // Impact faible - rebond
      if (spaceshipBody.onCrash) {
        spaceshipBody.onCrash("light");
      }
    }
  }

  /**
   * Appliquer la gravité de toutes les planètes
   */
  applyGravity() {
    // Pour chaque corps gravitationnel (planète)
    this.gravitationalBodies.forEach(gravBody => {
      // Pour chaque corps dynamique à affecter
      this.bodies.forEach(body => {
        // Ne pas affecter les corps statiques (mass === 0)
        if (body.mass > 0) {
          // Vecteur pointant vers la planète
          const forceDirection = new CANNON.Vec3();
          forceDirection.copy(gravBody.body.position);
          forceDirection.vsub(body.position, forceDirection);

          // Distance au carré
          const distance = forceDirection.length();

          // N'appliquer la gravité qu'à une certaine distance
          if (distance > gravBody.radius * 1.1 && distance < this.maxGravityDistance) {
            // Normaliser la direction
            forceDirection.normalize();

            // Force selon la loi de gravitation de Newton: F = G * (m1 * m2) / r²
            const forceMagnitude = this.G * ((gravBody.mass * body.mass) / (distance * distance));

            // Ajuster la force pour le gameplay
            const finalForce = Math.min(forceMagnitude, body.mass * 20);

            // Appliquer la force
            const force = new CANNON.Vec3();
            forceDirection.scale(finalForce, force);
            body.applyForce(force, body.position);
          }
        }
      });
    });
  }

  update(deltaTime) {
    // Appliquer la gravité avant la simulation physique
    this.applyGravity();

    // Simulation physique
    this.world.step(1 / 60, deltaTime, 3);
  }

  /**
   * Ajuste la constante gravitationnelle (pour équilibrage du gameplay)
   */
  setGravitationalConstant(value) {
    this.G = value;
  }

  /**
   * Définit la distance maximale d'influence gravitationnelle
   */
  setMaxGravityDistance(distance) {
    this.maxGravityDistance = distance;
  }

  /**
   * Active/désactive le mode debug pour visualiser l'influence gravitationnelle
   */
  toggleDebugMode(scene = null) {
    this.debugMode = !this.debugMode;

    if (this.debugMode && scene) {
      // Créer des visualisations pour les corps existants
      this.gravitationalBodies.forEach(gravBody => {
        const influenceGeometry = new THREE.SphereGeometry(this.maxGravityDistance, 16, 16);
        const influenceMaterial = new THREE.MeshBasicMaterial({
          color: 0x00ff00,
          transparent: true,
          opacity: 0.1,
          wireframe: true
        });

        const influenceSphere = new THREE.Mesh(influenceGeometry, influenceMaterial);
        influenceSphere.position.copy(gravBody.position);
        scene.add(influenceSphere);
        gravBody.debugMesh = influenceSphere;
      });
    } else {
      // Supprimer les visualisations
      this.gravitationalBodies.forEach(gravBody => {
        if (gravBody.debugMesh && scene) {
          scene.remove(gravBody.debugMesh);
          gravBody.debugMesh.geometry.dispose();
          gravBody.debugMesh.material.dispose();
          delete gravBody.debugMesh;
        }
      });
    }
  }
}
