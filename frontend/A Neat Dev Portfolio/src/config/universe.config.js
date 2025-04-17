export const UniverseConfig = {
  universeSize: 10000, //du centre de la scène jusqu'à la limite
  boundaries: {
    warning: 9800,
    reset: 10000
  },

  // Configuration de la physique
  physics: {
    gravitationalConstant: 0.5,
    maxGravityDistance: 100,
    collisionDamping: 0.4,
    debugMode: false
  },

  // Configuration de la caméra
  camera: {
    offset: { x: 0, y: 5, z: -15 },
    lerpFactor: 0.1,
    mode: 'immediate',  // 'adaptive', 'smooth', or 'immediate'
    fov: 75,
    near: 0.1,
    far: 10000,
    shake: {
      enabled: true,
      intensityFactor: 1.0
    }
  },

  // Étoiles
  stars: {
    count: 1000000,
    size: {min: 0.5, max: 2.0}
  },

  // Planètes
  planets: {
    count: 10,
    minDistance: 2000,
    maxDistance: 1700,
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
