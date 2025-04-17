import { UniverseConfig } from '../config/universe.config';
import { BoundarySystem } from '../components/three/BoundarySystem';
import { PlanetGenerator } from '../components/three/PlanetGenerator';
import { RingSystem } from '../components/three/RingSystem';
import { PhysicsWorld } from '../services/PhysicsService';
import * as THREE from 'three';

export class UniverseController {
  constructor(scene, camera, physicsWorld) {
    this.scene = scene;
    this.camera = camera;
    this.physicsWorld = physicsWorld;
    this.uiController = null;
    this.boundarySystem = null;
    this.planetGenerator = null;
    this.ringSystem = null;
    this.startPosition = new THREE.Vector3(0, 0, 0);
  }

  async initialize(uiController) {
    this.uiController = uiController;

    // Créer des méthodes sécurisées pour la gestion UI
    const safeUI = {
      showLoadingScreen: () => this.uiController?.showLoadingScreen?.(),
      hideLoadingScreen: () => this.uiController?.hideLoadingScreen?.(),
      updateLoadingProgress: (progress) => this.uiController?.updateLoadingProgress?.(progress),
      updateLoadingStatus: (status) => this.uiController?.updateLoadingStatus?.(status),
      showMessage: (msg) => this.uiController?.showMessage?.(msg),
      hideMessage: () => this.uiController?.hideMessage?.()
    };

    // Utiliser safeUI au lieu d'accéder directement à this.uiController
    safeUI.showLoadingScreen();

    // Indiquer le début du chargement
    safeUI.updateLoadingStatus(this.getRandomMessage('intro'));
    await this.sleep(200); // Réduire les délais
    safeUI.updateLoadingProgress(5);

    // Configurer la physique selon les paramètres globaux
    safeUI.updateLoadingStatus(this.getRandomMessage('physics'));
    this.configurePhysics();
    await this.sleep(100);
    safeUI.updateLoadingProgress(15);

    // Création des limites de l'univers
    safeUI.updateLoadingStatus(this.getRandomMessage('boundaries'));
    await this.initBoundaries();
    safeUI.updateLoadingProgress(30);

    // Génération des étoiles
    safeUI.updateLoadingStatus(this.getRandomMessage('stars'));
    await this.sleep(100);
    safeUI.updateLoadingProgress(45);

    // Création des planètes
    safeUI.updateLoadingStatus(this.getRandomMessage('planets'));
    await this.initPlanets();
    safeUI.updateLoadingProgress(75);

    // Configuration des anneaux et portails
    safeUI.updateLoadingStatus(this.getRandomMessage('portals'));
    await this.initRings();
    safeUI.updateLoadingProgress(90);

    // Finalisation
    safeUI.updateLoadingStatus(this.getRandomMessage('final'));
    await this.sleep(100);
    safeUI.updateLoadingProgress(100);

    // Message final avant de commencer
    safeUI.updateLoadingStatus(this.getRandomMessage('ready'));
    await this.sleep(200);

    // Masquer l'écran de chargement
    setTimeout(() => {
      safeUI.hideLoadingScreen();
    }, 200);

    return this;
  }

  // Méthode d'aide pour les délais
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Ajouter cette méthode à ta classe
  getRandomMessage(stage) {
    const messages = {
      intro: [
        "Création du Big Bang...",
        "Génération des particules primordiales...",
        "Initialisation de l'espace-temps...",
        "Calibration des constantes universelles..."
      ],
      physics: [
        "Installation des lois de la physique...",
        "Calibration de la constante gravitationnelle...",
        "Synchronisation des forces fondamentales...",
        "Équilibrage de la force électromagnétique..."
      ],
      boundaries: [
        "Établissement des frontières cosmiques...",
        "Définition des limites de l'univers observable...",
        "Création des barrières dimensionnelles...",
        "Stabilisation des bords de l'univers..."
      ],
      stars: [
        "Formation des étoiles et nébuleuses...",
        "Allumage des réactions thermonucléaires stellaires...",
        "Dispersion des constellations dans la voûte céleste...",
        "Création des pouponnières d'étoiles..."
      ],
      planets: [
        "Création des planètes et systèmes planétaires...",
        "Modélisation des atmosphères et écosystèmes...",
        "Organisation des orbites planétaires...",
        "Placement des lunes et satellites naturels..."
      ],
      portals: [
        "Ouverture des passages interstellaires...",
        "Stabilisation des trous de ver...",
        "Configuration des anneaux de transport spatial...",
        "Création des points de saut hyperspatial..."
      ],
      final: [
        "Finalisation de l'univers...",
        "Vérification de la cohérence cosmique...",
        "Derniers ajustements avant le grand voyage...",
        "Harmonisation des lois physiques universelles..."
      ],
      ready: [
        "Prêt à explorer l'infini...",
        "L'univers vous attend, Commandant...",
        "Vaisseau spatial en attente de vos ordres...",
        "Les étoiles sont à portée de main..."
      ]
    };

    const stageMessages = messages[stage] || messages.intro;
    const randomIndex = Math.floor(Math.random() * stageMessages.length);
    return stageMessages[randomIndex];
  }

  configurePhysics() {
    if (!this.physicsWorld) return;

    // Appliquer les paramètres de la configuration
    const physicsConfig = UniverseConfig.physics;

    this.physicsWorld.setGravitationalConstant(
      physicsConfig.gravitationalConstant
    );

    this.physicsWorld.setMaxGravityDistance(
      physicsConfig.maxGravityDistance
    );

    // Autres configurations possibles
    if (physicsConfig.debugMode) {
      this.physicsWorld.toggleDebugMode(this.scene);
    }
  }

  async initBoundaries() {
    return new Promise(resolve => {
      this.boundarySystem = new BoundarySystem(this.scene);
      setTimeout(resolve, 100); // Délai artificiel pour voir la progression
    });
  }

  async initPlanets() {
    return new Promise(resolve => {
      this.planetGenerator = new PlanetGenerator(this.scene);
      this.planetGenerator.generateRandomPlanets(
        UniverseConfig.planets.count,
        UniverseConfig.universeSize
      );

      // Ajouter la physique aux planètes si physicsWorld est disponible
    if (this.physicsWorld && this.physicsWorld.addPlanetsPhysics) {
      this.physicsWorld.addPlanetsPhysics(this.planetGenerator, this.scene);
    }

      setTimeout(resolve, 300); // Délai plus long car la génération peut prendre du temps
    });
  }

  async initRings() {
    return new Promise(resolve => {
      this.ringSystem = new RingSystem(this.scene);

      // Créer les anneaux définis dans la config
      UniverseConfig.rings.forEach(ringConfig => {
        const position = new THREE.Vector3(
          ringConfig.position.x,
          ringConfig.position.y,
          ringConfig.position.z
        );

        const ring = this.ringSystem.addRing(position, {
          color: ringConfig.color,
          // Ajouter d'autres options si nécessaire
        });

        if (ringConfig.text) {
          this.ringSystem.addTextToRing(
            ring,
            ringConfig.text.top,
            ringConfig.text.bottom
          );
        }
      });

      setTimeout(resolve, 200);
    });
  }

  update(delta) {
    // Mettre à jour les systèmes
    if (this.boundarySystem) {
      this.boundarySystem.update();
    }

    if (this.ringSystem) {
      this.ringSystem.animate();
    }

    if (this.planetGenerator) {
      this.planetGenerator.animate(delta);
    }
  }

  checkBoundaries(position) {
    if (this.boundarySystem && this.uiController) {
      const status = this.boundarySystem.checkBoundary(position, this.uiController);

      if (status === 'reset') {
        return true; // Indique qu'un reset est nécessaire
      }
    }
    return false;
  }

  resetPlayerPosition(spaceship) {
    if (spaceship) {
      // Réinitialiser la position et la vitesse du vaisseau
      const body = spaceship.getBody();
      if (body) {
        body.position.copy(this.startPosition);
        body.velocity.set(0, 0, 0);
        body.angularVelocity.set(0, 0, 0);
      }

      // Notification à l'utilisateur
      if (this.uiController) {
        this.uiController.showMessage("Téléportation au point de départ");
        setTimeout(() => this.uiController.hideMessage(), 3000);
      }
    }
  }

  dispose() {
    // Nettoyer tous les systèmes lors de la destruction
    if (this.boundarySystem) {
      this.boundarySystem.dispose();
    }

    if (this.ringSystem) {
      this.ringSystem.clearAll();
    }

    if (this.planetGenerator) {
      // Supposons qu'une méthode clearAll existe
      if (typeof this.planetGenerator.clearAll === 'function') {
        this.planetGenerator.clearAll();
      }
    }
  }
}
