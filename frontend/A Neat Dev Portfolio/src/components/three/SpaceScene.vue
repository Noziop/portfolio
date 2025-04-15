<template>
  <div class="space-scene">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script>
import { onMounted, ref, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { initThree } from '@/plugins/three';
import { createStarField } from './StarField';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { NavigationService } from '@/services/NavigationService';
import { RingSystem } from './RingSystem';

export default {
  name: 'SpaceScene',
  setup() {
    const canvas = ref(null);
    let scene, camera, renderer, stars, spaceship, spaceshipBody, engineLight, clock, physicsWorld, navigationService;
    let animationFrameId;
    let ringSystem;

    // Augmenter le décalage Y de la caméra pour une vue plus élevée
    const cameraOffset = new THREE.Vector3(0, 5, -15);
    const cameraLerpFactor = 0.1;

    onMounted(() => {
      ({ scene, camera, renderer } = initThree(canvas.value));
      clock = new THREE.Clock();

      // Initialisation physique
      physicsWorld = new CANNON.World();
      physicsWorld.gravity.set(0, 0, 0);
      physicsWorld.solver.iterations = 10;

      // Étoiles
      stars = createStarField(scene);

      // Éclairage
      scene.add(new THREE.AmbientLight(0x404040, 0.6));
      const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
      dirLight.position.set(5, 10, 7);
      scene.add(dirLight);

      engineLight = new THREE.PointLight(0x00aaff, 0, 50);
      scene.add(engineLight);

      // Chargement modèle vaisseau
      const loader = new GLTFLoader();
      loader.load(
        '/src/assets/models/spaceship.glb',
        (gltf) => {
          spaceship = gltf.scene;
          spaceship.scale.set(0.1, 0.1, 0.1);

          // Corps physique du vaisseau (position basse)
          spaceshipBody = new CANNON.Body({
            mass: 1,
            shape: new CANNON.Box(new CANNON.Vec3(1, 0.5, 2)),
            position: new CANNON.Vec3(0, -2, 0)
          });

          physicsWorld.addBody(spaceshipBody);
          spaceship.position.copy(spaceshipBody.position);
          spaceship.quaternion.copy(spaceshipBody.quaternion);

          engineLight.position.set(0, 0, -1.5);
          spaceship.add(engineLight);
          scene.add(spaceship);

          navigationService = new NavigationService(spaceshipBody);

          // Initialisation des anneaux APRÈS le chargement du vaisseau
          ringSystem = new RingSystem(scene, {
            particlesCount: 600,
            particleSize: 0.3,
          });

          // Création des anneaux (positionnés bas également)
          const ring1 = ringSystem.addRing(
            new THREE.Vector3(-50, 0, 125),
            {
              color: 0xff00cc, // Magenta
              onCollide: () => console.log("Portfolio direct")
            }
          );

          const ring2 = ringSystem.addRing(
            new THREE.Vector3(50, 0, 125),
            {
              color: 0x00ffcc, // Cyan
              onCollide: () => console.log("Mode jeu")
            }
          );

          // Ajout des textes aux anneaux
          ringSystem.addTextToRing(ring1, "To Portfolio", "AND BEYOND!");
          ringSystem.addTextToRing(ring2, "MEH!!!", "HERE TO PLAY, BABY!");

        },
        undefined,
        (error) => console.error('Erreur chargement modèle :', error)
      );

      window.addEventListener('resize', handleResize);

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const delta = clock.getDelta();

        // Mise à jour physique
        physicsWorld.step(1 / 60);

        // Mise à jour contrôles
        if (navigationService) navigationService.update(delta);

        // Synchronisation modèle vaisseau
        if (spaceship && spaceshipBody) {
          spaceship.position.copy(spaceshipBody.position);
          spaceship.quaternion.copy(spaceshipBody.quaternion);
        }

        // Gestion caméra modifiée
        if (spaceshipBody) {
          const shipPosition = new THREE.Vector3().copy(spaceshipBody.position);
          camera.position.lerp(shipPosition.clone().add(cameraOffset), cameraLerpFactor * delta * 60);

          // Créer un point de visée décalé vers le haut
          const lookAtTarget = shipPosition.clone();
          lookAtTarget.y += 5; // Déplace le point de visée vers le haut

          // Faire regarder la caméra vers ce point décalé au lieu du vaisseau
          camera.lookAt(lookAtTarget);
        }

        // Animation et collisions
        if (ringSystem && spaceshipBody) {
          ringSystem.animate();
          ringSystem.checkCollisions(spaceshipBody.position);
        }

        renderer.render(scene, camera);
      };

      animate();
    });

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    onBeforeUnmount(() => {
      if (ringSystem) ringSystem.clearAll();
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
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
