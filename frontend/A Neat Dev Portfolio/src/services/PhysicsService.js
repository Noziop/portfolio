import * as CANNON from 'cannon-es';

export class PhysicsWorld {
  constructor() {
    this.world = new CANNON.World();
    this.world.gravity.set(0, 0, 0); // Pas de gravité dans l'espace

    // Sol invisible pour limiter les mouvements verticaux
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // Horizontal
    this.world.addBody(groundBody);

    // Liste des objets physiques
    this.bodies = [];
  }

  addBody(body) {
    this.world.addBody(body);
    this.bodies.push(body);
  }

  update(deltaTime) {
    this.world.step(1 / 60, deltaTime, 3); // Simulation physique à 60 FPS
  }
}
