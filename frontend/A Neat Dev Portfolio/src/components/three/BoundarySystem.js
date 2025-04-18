import * as THREE from 'three';
import { UniverseConfig } from '../../config/universe.config';

export class BoundarySystem {
  constructor(scene) {
    this.scene = scene;
    this.warningBoundary = null;
    this.resetBoundary = null;
    this.warningActive = false;

    // Configuration
    this.universeSize = UniverseConfig.universeSize; // Récupérer de la config globale
    this.warningDistance = UniverseConfig.boundaries.warning; // Récupérer de la config globale
    this.resetDistance = UniverseConfig.boundaries.reset; // Récupérer de la config globale

    // Seuil de visibilité - à quelle distance les murs commencent à apparaître
    this.visibilityThreshold = 0.7; // Commence à 70% de la distance d'avertissement

    this.createBoundaries();
  }

  createBoundaries() {
    // Frontière d'avertissement
    const warningGeometry = new THREE.BoxGeometry(
      this.warningDistance * 2,
      this.warningDistance * 2,
      this.warningDistance * 2
    );
    const warningMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0, // Initialement invisible
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    this.warningBoundary = new THREE.Mesh(warningGeometry, warningMaterial);
    this.scene.add(this.warningBoundary);

    // Frontière de réinitialisation
    const resetGeometry = new THREE.BoxGeometry(
      this.resetDistance * 2,
      this.resetDistance * 2,
      this.resetDistance * 2
    );
    const resetMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0, // Initialement invisible
      side: THREE.BackSide
    });
    this.resetBoundary = new THREE.Mesh(resetGeometry, resetMaterial);
    this.scene.add(this.resetBoundary);
  }

  checkBoundary(position, uiController) {
    // Distance au centre (utilise le maximum des coordonnées absolues)
    const distance = Math.max(
      Math.abs(position.x),
      Math.abs(position.y),
      Math.abs(position.z)
    );

    // Calcul de visibilité progressive
    const visibilityStart = this.warningDistance * this.visibilityThreshold;

    // Rendre visible seulement à l'approche des limites
    if (distance > visibilityStart) {
      // Opacité progressive pour la première frontière
      const warningProgress = Math.min(1, (distance - visibilityStart) / (this.warningDistance - visibilityStart));
      const warningOpacity = warningProgress * 0.2;

      if (this.warningBoundary) {
        this.warningBoundary.material.opacity = warningOpacity;
      }

      // Opacité progressive pour la deuxième frontière
      if (distance > this.warningDistance) {
        const resetProgress = Math.min(1, (distance - this.warningDistance) / (this.resetDistance - this.warningDistance));
        const resetOpacity = 0.2 + resetProgress * 0.4; // De 0.2 à 0.6

        if (this.resetBoundary) {
          this.resetBoundary.material.opacity = resetOpacity;
        }
      } else {
        // Masquer le mur de réinitialisation tant qu'on n'est pas dans la zone d'avertissement
        if (this.resetBoundary) {
          this.resetBoundary.material.opacity = 0;
        }
      }
    } else {
      // Tout est invisible quand on est loin des limites
      if (this.warningBoundary) {
        this.warningBoundary.material.opacity = 0;
      }
      if (this.resetBoundary) {
        this.resetBoundary.material.opacity = 0;
      }
    }

    // Vérifier les limites comme avant
    if (distance > this.resetDistance) {
      return 'reset';
    }

    if (distance > this.warningDistance) {
      if (!this.warningActive) {
        this.warningActive = true;
        if (uiController) {
          uiController.showMessage("Attention: Vous approchez de la limite de l'univers");
        }
      }
      return 'warning';
    } else if (this.warningActive) {
      this.warningActive = false;
      if (uiController) {
        uiController.hideMessage();
      }
    }

    return null;
  }

  update() {
    // Animation subtile (pulsation) seulement si les murs sont visibles
    const time = Date.now() * 0.001;

    if (this.warningBoundary && this.warningBoundary.material.opacity > 0) {
      const baseOpacity = this.warningBoundary.material.opacity;
      // Petite variation de l'opacité existante
      this.warningBoundary.material.opacity = baseOpacity * (0.9 + Math.sin(time * 2) * 0.1);
    }

    if (this.resetBoundary && this.resetBoundary.material.opacity > 0) {
      const baseOpacity = this.resetBoundary.material.opacity;
      this.resetBoundary.material.opacity = baseOpacity * (0.9 + Math.sin(time * 3) * 0.1);
    }
  }

  dispose() {
    // Supprimer les murs de la scène et libérer les ressources
    if (this.warningBoundary) {
      this.scene.remove(this.warningBoundary);
      this.warningBoundary.geometry.dispose();
      this.warningBoundary.material.dispose();
      this.warningBoundary = null;
    }

    if (this.resetBoundary) {
      this.scene.remove(this.resetBoundary);
      this.resetBoundary.geometry.dispose();
      this.resetBoundary.material.dispose();
      this.resetBoundary = null;
    }
  }
}
