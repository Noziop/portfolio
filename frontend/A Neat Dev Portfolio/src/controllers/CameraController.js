import * as THREE from 'three';
import { UniverseConfig } from '@/config/universe.config';

export class CameraController {
  constructor(camera, target = null) {
    this.camera = camera;
    this.target = target;  // Le vaisseau ou autre objet à suivre
    this.offset = new THREE.Vector3(
      UniverseConfig.camera.offset.x,
      UniverseConfig.camera.offset.y,
      UniverseConfig.camera.offset.z
    );

    // Autres paramètres depuis la configuration
    this.lerpFactor = UniverseConfig.camera.lerpFactor;
    this.mode = UniverseConfig.camera.mode || 'adaptive';

    // État interne
    this.isIntensiveManeuver = false;
    this.lastIntensiveTime = 0;
    this.lookAtOffset = new THREE.Vector3(0, 3, 0);
  }

  setTarget(target) {
    this.target = target;
  }

  notifyIntensiveManeuver() {
    this.isIntensiveManeuver = true;
    this.lastIntensiveTime = Date.now();

    // Revenir à la normale après un délai
    setTimeout(() => {
      if (Date.now() - this.lastIntensiveTime > 300) {
        this.isIntensiveManeuver = false;
      }
    }, 150);
  }

  update(delta) {
    if (!this.target || !this.camera) return;

    // Obtenir position et orientation du vaisseau
    const targetPosition = this.target.getPosition?.();
    if (!targetPosition) return;

    const targetQuaternion = this.target.getQuaternion?.();
    if (!targetQuaternion) return;

    // Vérifier si getVelocity existe avant de l'appeler
    let speed = 0;
    if (typeof this.target.getVelocity === 'function') {
      const velocity = this.target.getVelocity();
      speed = velocity ? velocity.length() : 0;
    }

    // Position de base (sans effet dynamique)
    const baseOffset = this.offset.clone();
    const transformedBaseOffset = baseOffset.clone().applyQuaternion(targetQuaternion);
    const baseCameraPos = targetPosition.clone().add(transformedBaseOffset);

    // Position avec effet dynamique (si activé)
    let targetCameraPos = baseCameraPos.clone();
    if (UniverseConfig.camera.dynamicOffset && UniverseConfig.camera.dynamicOffset.enabled) {
      const speedFactor = UniverseConfig.camera.dynamicOffset.speedFactor;
      const maxDistance = UniverseConfig.camera.dynamicOffset.maxDistance;

      const extraDistance = Math.min(speed * speedFactor, maxDistance);

      // Calculer un vecteur "recul" dans la direction du vaisseau
      const shipDirection = new THREE.Vector3(0, 0, 1).applyQuaternion(targetQuaternion);
      shipDirection.multiplyScalar(-extraDistance); // Direction opposée

      // Appliquer le recul à la position cible
      targetCameraPos.add(shipDirection);

      if (speed > 10) {
        console.log(`Vitesse: ${speed.toFixed(2)}, Éloignement: ${extraDistance.toFixed(2)}`);
      }
    }

    // Appliquer différents modes de caméra avec la bonne position cible
    switch(this.mode) {
      case 'immediate':
        // Position immédiate sans interpolation
        this.camera.position.copy(targetCameraPos);
        break;

      case 'adaptive':
        // Adaptation selon la vitesse et les manœuvres
        if (this.isIntensiveManeuver) {
          // Déplacement immédiat pour manœuvres intensives
          this.camera.position.copy(targetCameraPos);
        } else {
          // Interpolation adaptative basée sur la vitesse
          const dynamicLerpFactor = Math.min(0.2, this.lerpFactor * (1 + speed / 20));
          this.camera.position.lerp(targetCameraPos, dynamicLerpFactor * delta * 60);
        }
        break;

      case 'smooth':
      default:
        // Interpolation standard
        this.camera.position.lerp(targetCameraPos, this.lerpFactor * delta * 60);
        break;
    }

    // Point de visée avec le même offset
    const lookAtTarget = targetPosition.clone().add(
      this.lookAtOffset.clone().applyQuaternion(targetQuaternion)
    );
    this.camera.lookAt(lookAtTarget);
  }

  shake(intensity = 0.5, duration = 300) {
    if (!this.camera) return;

    // Effet secousse de caméra
    const originalPosition = this.camera.position.clone();
    const shakeInterval = setInterval(() => {
      const shakeOffset = new THREE.Vector3(
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity
      );
      this.camera.position.add(shakeOffset);
    }, 50);

    // Arrêter après la durée
    setTimeout(() => {
      clearInterval(shakeInterval);
    }, duration);
  }

  handleResize() {
    if (!this.camera) return;

    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }
}
