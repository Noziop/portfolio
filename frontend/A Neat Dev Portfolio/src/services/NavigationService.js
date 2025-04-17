import * as CANNON from 'cannon-es';

export class NavigationService {
  constructor(spaceship) {
    // Stocker à la fois le vaisseau et son corps physique
    this.spaceship = spaceship;
    this.spaceshipBody = spaceship.getBody();

    this.keys = {
      // Déplacement
      forward: false,    // Flèche haut
      backward: false,   // Flèche bas
      left: false,       // Flèche gauche
      right: false,      // Flèche droite
      ascend: false,     // Shift
      descend: false,    // Ctrl

      // Rotation
      pitchUp: false,    // Z
      pitchDown: false,  // S
      rollLeft: false,   // Q
      rollRight: false,  // D
      yawLeft: false,    // Flèche gauche
      yawRight: false,   // Flèche droite

      // Boost
      boost: false       // Espace
    };

    // Configuration physique
    this.spaceshipBody.linearDamping = 0.85;
    this.spaceshipBody.angularDamping = 0.95;

    // Variables de lissage
    this.currentPitch = 0;
    this.currentRoll = 0;
    this.currentYaw = 0;
    this.lerpFactor = 0.08; // Légèrement réduit pour des transitions plus douces

    // Événements clavier
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
  }

  onKeyDown(e) {
    switch(e.key.toLowerCase()) {
      case 'arrowdown': this.keys.forward = true; break;
      case 'arrowup': this.keys.backward = true; break;
      case 'arrowleft': this.keys.yawLeft = true; break;
      case 'arrowright': this.keys.yawRight = true; break;
      case 'shift': this.keys.ascend = true; break;
      case 'control': this.keys.descend = true; break;
      case 'z': this.keys.pitchUp = true; break;
      case 's': this.keys.pitchDown = true; break;
      case 'd': this.keys.rollLeft = true; break;
      case 'q': this.keys.rollRight = true; break;
      case ' ':
        this.keys.boost = true;
        e.preventDefault();
        break;
    }
  }

  onKeyUp(e) {
    switch(e.key.toLowerCase()) {
      case 'arrowdown': this.keys.forward = false; break;
      case 'arrowup': this.keys.backward = false; break;
      case 'arrowleft': this.keys.yawLeft = false; break;
      case 'arrowright': this.keys.yawRight = false; break;
      case 'shift': this.keys.ascend = false; break;
      case 'control': this.keys.descend = false; break;
      case 'z': this.keys.pitchUp = false; break;
      case 's': this.keys.pitchDown = false; break;
      case 'd': this.keys.rollLeft = false; break;
      case 'q': this.keys.rollRight = false; break;
      case ' ':
        this.keys.boost = false;
        e.preventDefault();
        break;
    }
  }

  update(delta) {
    // Forces de base
    const baseForce = 150;
    const boostMultiplier = this.keys.boost ? 6 : 1;
    const force = new CANNON.Vec3();

    // 1. Découplage complet des rotations

    // Calculer les cibles de rotation pour chaque axe
    const targetPitch = (this.keys.pitchUp ? 1 : 0) - (this.keys.pitchDown ? 1 : 0);
    const targetRoll = (this.keys.rollLeft ? 1 : 0) - (this.keys.rollRight ? 1 : 0);
    const targetYaw = (this.keys.yawLeft ? 1 : 0) - (this.keys.yawRight ? 1 : 0);

    // Lissage des contrôles
    this.currentPitch += (targetPitch - this.currentPitch) * this.lerpFactor;
    this.currentRoll += (targetRoll - this.currentRoll) * this.lerpFactor;
    this.currentYaw += (targetYaw - this.currentYaw) * this.lerpFactor;

    // 2. Appliquer les rotations indépendamment sur chaque axe

    // SENSIBILITÉ RÉDUITE DE MOITIÉ
    const rotationSpeed = 0.025; // Réduit de moitié (était 0.05)

    // Créer des quaternions pour chaque axe de rotation
    const pitchQuat = new CANNON.Quaternion();
    pitchQuat.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), this.currentPitch * rotationSpeed);

    const rollQuat = new CANNON.Quaternion();
    rollQuat.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), this.currentRoll * rotationSpeed);

    const yawQuat = new CANNON.Quaternion();
    yawQuat.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), this.currentYaw * rotationSpeed);

    // Appliquer ces rotations dans le bon ordre
    this.spaceshipBody.quaternion.mult(yawQuat, this.spaceshipBody.quaternion);
    this.spaceshipBody.quaternion.mult(pitchQuat, this.spaceshipBody.quaternion);
    this.spaceshipBody.quaternion.mult(rollQuat, this.spaceshipBody.quaternion);

    // Normaliser pour éviter l'accumulation d'erreurs
    this.spaceshipBody.quaternion.normalize();

    // 3. Mouvement de translation
    const quaternion = this.spaceshipBody.quaternion;

    // Avant/arrière (Z local)
    if(this.keys.forward) force.z -= baseForce * boostMultiplier;
    if(this.keys.backward) force.z += baseForce * boostMultiplier;

    // Montée/descente (Y global)
    if(this.keys.ascend) force.y += baseForce * boostMultiplier;
    if(this.keys.descend) force.y -= baseForce * boostMultiplier;

    // Appliquer la force dans le référentiel du vaisseau
    const worldForce = quaternion.vmult(force);
    this.spaceshipBody.applyForce(worldForce);

    // 4. Effet aérodynamique pour les virages (en option)
    if (targetRoll !== 0 && Math.abs(force.z) > 0.5) {
      // Calculer les vecteurs d'orientation
      const forwardDir = new CANNON.Vec3(0, 0, -1);
      const worldForwardDir = quaternion.vmult(forwardDir);

      // Force latérale simplifiée, proportionnelle au roulis et à la vitesse avant
      // FORCE RÉDUITE de moitié (0.4 au lieu de 0.8)
      const turnDir = new CANNON.Vec3(targetRoll * baseForce * 0.4, 0, 0);
      const worldTurnDir = quaternion.vmult(turnDir);

      this.spaceshipBody.applyForce(worldTurnDir);
    }

    // 5. Limitations de vitesse
    const maxSpeed = this.keys.boost ? 30 : 20;
    if(this.spaceshipBody.velocity.length() > maxSpeed) {
      this.spaceshipBody.velocity.scale(maxSpeed / this.spaceshipBody.velocity.length());
    }

    // Réinitialiser la vitesse angulaire pour éviter toute rotation résiduelle
    this.spaceshipBody.angularVelocity.set(0, 0, 0);

    // CORRECTION: Contrôle des propulseurs basé sur les touches
    if (this.keys.forward) {
      // Allumer les moteurs avec une intensité basée sur le boost
      const intensity = this.keys.boost ? 5.0 : 2.0;
      if (this.spaceship && typeof this.spaceship.setEngineLight === 'function') {
        this.spaceship.setEngineLight(intensity);
      }
    } else {
      // Éteindre les moteurs si on n'accélère pas
      if (this.spaceship && typeof this.spaceship.setEngineLight === 'function') {
        this.spaceship.setEngineLight(0);
      }
    }
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
