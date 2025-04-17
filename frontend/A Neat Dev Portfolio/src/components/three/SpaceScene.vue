<template>
  <div class="space-scene">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script>
import { onMounted, ref, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
import { initThree } from '@/plugins/three';
import { createStarField, updateStarField, destroyStarField } from './StarField';
import { NavigationService } from '@/services/NavigationService';
import { PhysicsWorld } from '@/services/PhysicsService';
import { Spaceship } from './Spaceship';
import { UIController } from '@/components/ui/UIController';
import { UniverseController } from '@/controllers/UniverseController';
import { CameraController } from '@/controllers/CameraController';
import { UniverseConfig } from '@/config/universe.config';

export default {
  name: 'SpaceScene',
  setup() {
    const canvas = ref(null);

    // Services et contrôleurs
    let scene, camera, renderer;
    let physicsWorld, navigationService, cameraController;
    let uiController, universeController;
    let spaceship, stars, clock;
    let animationFrameId;

    // Handler d'événements pour les manœuvres intensives
    const handleKeyDown = (event) => {
      if ((event.code === 'ControlLeft' || event.code === 'ControlRight' ||
           event.code === 'ShiftLeft' || event.code === 'ShiftRight' ||
           event.code === 'ArrowDown') && cameraController) {

        cameraController.notifyIntensiveManeuver();
      }
    };

    onMounted(async () => {
      // Initialiser Three.js
      ({ scene, camera, renderer } = initThree(canvas.value));
      clock = new THREE.Clock();

      // Initialiser services et contrôleurs
      uiController = new UIController();
      physicsWorld = new PhysicsWorld();
      cameraController = new CameraController(camera);

      // Ajouter étoiles
      stars = createStarField(scene);

      // Configurer éclairage
      setupLighting(scene);

      // Initialiser l'univers
      universeController = new UniverseController(scene, camera, physicsWorld);
      await universeController.initialize(uiController);

      // Créer le vaisseau et configurer la navigation
      spaceship = new Spaceship(scene, physicsWorld);
      spaceship.onReady(() => {
        navigationService = new NavigationService(spaceship);
        cameraController.setTarget(spaceship); // Définir le vaisseau comme cible de la caméra
      });

      // Ajouter les écouteurs d'événements
      window.addEventListener('resize', handleResize);
      window.addEventListener('keydown', handleKeyDown);

      // Démarrer la boucle d'animation
      animate();
    });

    // Configuration de l'éclairage
    const setupLighting = (scene) => {
      scene.add(new THREE.AmbientLight(0x404040, 0.8));
      const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
      dirLight.position.set(5, 10, 7);
      scene.add(dirLight);
    };

    // Gestionnaire de redimensionnement
    const handleResize = () => {
      if (!renderer) return;
      renderer.setSize(window.innerWidth, window.innerHeight);
      if (cameraController) {
        cameraController.handleResize();
      }
    };

    // Boucle d'animation
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Mise à jour de tous les systèmes
      physicsWorld.update(delta);

      if (navigationService) {
        navigationService.update(delta);
      }

      if (spaceship) {
        spaceship.update();

        // Vérifier si le vaisseau est dans les limites
        const shipPosition = spaceship.getPosition();
        if (shipPosition && universeController && universeController.checkBoundaries(shipPosition)) {
          universeController.resetPlayerPosition(spaceship);
        }
      }

      // Mise à jour de la caméra
      if (cameraController) {
        cameraController.update(delta);
      }

      // Mise à jour de l'univers
      if (universeController) {
        universeController.update(delta);
      }

      // Mise à jour des étoiles
      updateStarField(stars);

      // Rendu de la scène
      renderer.render(scene, camera);
    };

    onBeforeUnmount(() => {
      try {
        // Nettoyage des ressources
        if (universeController) universeController.dispose();
        if (stars && scene) destroyStarField(stars, scene);

        cancelAnimationFrame(animationFrameId);
        navigationService = null;

        // Supprimer les écouteurs d'événements
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('keydown', handleKeyDown);
      } catch (error) {
        console.warn('Error during component cleanup:', error);
      }
    });

    return { canvas };
  }
};
</script>

<style scoped>
.space-scene {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

canvas {
  display: block;
}
</style>
