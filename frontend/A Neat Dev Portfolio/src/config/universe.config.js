export const UniverseConfig = {
  universeSize: 5000, //du centre de la scène jusqu'à la limite
  boundaries: {
    warning: 4800,
    reset: 5000
  },

  // Configuration de la physique
  physics: {
    gravitationalConstant: 0.5,
    maxGravityDistance: 100,
    collisionDamping: 0.4,
    debugMode: true
  },

  // Configuration de la caméra
  camera: {
    offset: { x: 0, y: 5, z: -10 },
    lerpFactor: 0.01,
    mode: 'adaptive',  // 'adaptive', 'smooth', or 'immediate'
    fov: 75,
    near: 0.1,
    far: 9000,
    dynamicOffset: {
      enabled: false, // Si vrai, la caméra s'éloigne en fonction de la vitesse
      speedFactor: 0.05,  // Plus cette valeur est élevée, plus la caméra s'éloigne avec la vitesse
      maxDistance: 10     // Distance maximale d'éloignement supplémentaire
    },
    shake: {
      enabled: false,
      intensityFactor: 1.0
    }
  },

  //Starship
  spaceship: {
    baseForce: 90,
    boostForce: 20,
  },

  // Étoiles
  stars: {
    count: 300000,
    size: {min: 0.1, max: 5.0}
  },

  // Planètes
  planets: {
    count: 10,
    minDistance: 2000,
    maxDistance: 4700,
    minDistanceBetween: 1300 // Distance minimale entre les planètes
  },

    // Anneaux (navigation)
    rings: [
      {
        id: 'portfolio',
        position: {x: -50, y: 0, z: 150},
        color: 0xff00cc,
        text: {top: "TO PORTFOLIO", bottom: "AND BEYOND !"}
      },
      {
        id: 'games',
        position: {x: 50, y: 0, z: 150},
        color: 0x00ffcc,
        text: {top: "WANNA PLAY ?", bottom: "GET INSIDE !"}
      }
    ],

    // Performance
    performance: {
      useLOD: true,
      useWebWorkers: true,
      progressiveLoading: true,
      adaptiveResolution: true,
      reduceShadowsOnFastMovement: true
    }
  };
