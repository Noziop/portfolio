import * as THREE from 'three';
import SimplexNoise from 'simplex-noise';
import { UniverseConfig } from '../../config/universe.config';

export class PlanetGenerator {
  constructor(scene) {
    this.scene = scene;
    this.planets = [];

    // Créer les fonctions de bruit à la place de l'instance
    this.simplex = new SimplexNoise();
  }

  generateRandomPlanets(count = 7, worldSize = 500) {
    const minDistance = UniverseConfig.planets.minDistance || (worldSize * 0.3);
    const maxDistance = UniverseConfig.planets.maxDistance || (worldSize * 0.8);
    const minDistanceBetween = UniverseConfig.planets.minDistanceBetween || 200;
    const planetTypes = [
      'earthLike',
      'gasGiant',
      'iceWorld',
      'lavaWorld',
      'desert',
      'ringed',
      'oceanic',
      'toxic',
      'crystalline',
      'volcanic',
      'binary',
      'artificial'
    ];

    // Compteur pour limiter le nombre de planètes par type
    const typeUsageCounter = {};
    planetTypes.forEach(type => {
      typeUsageCounter[type] = 0;
    });

    // Nombre maximum d'utilisations par type (pour assurer la diversité)
    const maxTypeUsage = Math.max(1, Math.ceil(count / planetTypes.length) + 1);

    // Stocker les positions des planètes générées
    const positions = [];
    this.planets = [];

    // Tenter de placer `count` planètes
    let attempts = 0;
    const maxAttempts = count * 20; // Limite d'essais pour éviter boucle infinie

    while (this.planets.length < count && attempts < maxAttempts) {
      attempts++;

      // Générer une position aléatoire sphérique
      const phi = Math.random() * Math.PI * 2; // Angle horizontal
      const theta = Math.acos(2 * Math.random() - 1); // Angle vertical (distribution uniforme)

      // Distance par rapport au centre dans la plage définie
      const distance = minDistance + Math.random() * (maxDistance - minDistance);

      // Convertir en coordonnées cartésiennes
      const position = new THREE.Vector3(
        distance * Math.sin(theta) * Math.cos(phi),
        distance * Math.sin(theta) * Math.sin(phi),
        distance * Math.cos(theta)
      );

      // Vérifier collision avec planètes existantes
      let tooClose = false;
      for (const existingPos of positions) {
        if (position.distanceTo(existingPos) < minDistanceBetween) {
          tooClose = true;
          break;
        }
      }

      // Si trop proche, réessayer
      if (tooClose) continue;

      // Récupérer les types disponibles (pas encore trop utilisés)
      const availableTypes = planetTypes.filter(type =>
        typeUsageCounter[type] < maxTypeUsage
      );

      // Si tous les types ont atteint leur limite, réinitialiser pour la diversité
      if (availableTypes.length === 0) {
        console.log("Réinitialisation des compteurs de type pour plus de diversité");
        planetTypes.forEach(type => {
          typeUsageCounter[type] = 0;
        });
        continue;
      }

      // Choisir aléatoirement un type parmi les disponibles
      const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
      typeUsageCounter[type]++;

      // Éviter d'avoir 2 planètes à anneaux proches l'une de l'autre
      if (type === 'ringed') {
        const nearbyPlanets = positions.filter(pos =>
          position.distanceTo(pos) < minDistanceBetween * 3
        );
        if (nearbyPlanets.length > 0) {
          // Si une planète est déjà proche, essayer un autre emplacement
          typeUsageCounter[type]--; // Ne pas compter cet essai
          continue;
        }
      }

      // Taille variable selon le type
      let size;
      switch (type) {
        case 'gasGiant':
          size = 60 + Math.random() * 10; // Plus grandes
          break;
        case 'binary':
          size = 25 + Math.random() * 8; // Systèmes binaires assez grands
          break;
        case 'ringed':
          size = 28 + Math.random() * 7;
          break;
        case 'earthLike':
        case 'oceanic':
        case 'toxic':
          size = 20 + Math.random() * 6; // Taille moyenne
          break;
        default:
          size = 15 + Math.random() * 8; // Autres planètes plus petites
      }

      console.log(`Création planète de type ${type}, utilisation ${typeUsageCounter[type]}/${maxTypeUsage}`);

      // Créer la planète avec des variations
      const planet = this.createPlanet(type, position, size);

      // Ajouter de la variation aux planètes du même type
      if (typeUsageCounter[type] > 1) {
        this.addPlanetVariation(planet, type);
      }

      // Stocker la position pour les vérifications futures
      positions.push(position.clone());

      // Ajuster les paramètres d'animation
      planet.rotationSpeed = 0.0005 + Math.random() * 0.001;

      this.planets.push(planet);
    }

    // Log pour debug
    console.log(`Généré ${this.planets.length} planètes en ${attempts} tentatives.`);

    return this.planets;
  }

  // Nouvelle méthode pour ajouter de la variation aux planètes du même type
  addPlanetVariation(planet, type) {
    // Si la planète a un matériau
    if (planet.mesh && planet.mesh.material) {
      // Pour les planètes à anneaux, faire varier l'inclinaison et la taille des anneaux
      if (type === 'ringed') {
        // Trouver l'anneau
        planet.mesh.children.forEach(child => {
          if (child.geometry instanceof THREE.RingGeometry) {
            // Varier l'inclinaison
            child.rotation.x = Math.PI / 2 + (Math.random() * 0.8 - 0.4);
            child.rotation.z = Math.random() * 0.3 - 0.15;

            // Varier la taille/épaisseur
            const scale = 0.8 + Math.random() * 0.4;
            child.scale.set(scale, scale, 1);
          }
        });
      }

      // Pour les planètes gazeuses, varier les couleurs
      if (type === 'gasGiant') {
        if (!Array.isArray(planet.mesh.material)) {
          const hue = Math.random();
          const saturation = 0.5 + Math.random() * 0.5;
          const lightness = 0.4 + Math.random() * 0.3;
          planet.mesh.material.color.setHSL(hue, saturation, lightness);
        }
      }

      // Pour les planètes terrestres, variation des nuages et atmosphère
      if (type === 'earthLike' || type === 'oceanic') {
        if (planet.clouds) {
          const cloudOpacity = 0.3 + Math.random() * 0.7;
          planet.clouds.material.opacity = cloudOpacity;
        }

        // Varier l'atmosphère
        planet.mesh.children.forEach(child => {
          if (child.material && child.material.transparent) {
            // Probablement l'atmosphère
            const hue = Math.random();
            const saturation = 0.6 + Math.random() * 0.4;
            const lightness = 0.5 + Math.random() * 0.3;
            child.material.color.setHSL(hue, saturation, lightness);
            child.material.opacity = 0.1 + Math.random() * 0.3;
          }
        });
      }

      // Variation de rotation
      planet.rotationSpeed = 0.0003 + Math.random() * 0.001;
      if (Math.random() > 0.3) {
        // Parfois rotation inversée
        planet.rotationSpeed *= -1;
      }
    }

    return planet;
  }

  createPlanet(type, position, size) {
    let planet;

    switch (type) {
      case 'earthLike':
        planet = this.createEarthLikePlanet(size);
        break;
      case 'gasGiant':
        planet = this.createGasGiantPlanet(size);
        break;
      case 'iceWorld':
        planet = this.createIceWorld(size);
        break;
      case 'lavaWorld':
        planet = this.createLavaWorld(size);
        break;
      case 'desert':
        planet = this.createDesertPlanet(size);
        break;
      case 'ringed':
        planet = this.createRingedPlanet(size);
        break;
        case 'oceanic': planet = this.createOceanicPlanet(size); break;
        case 'toxic': planet = this.createToxicPlanet(size); break;
        case 'crystalline': planet = this.createCrystallinePlanet(size); break;
        case 'volcanic': planet = this.createVolcanicPlanet(size); break;
        case 'binary': planet = this.createBinaryPlanet(size); break;
        case 'artificial': planet = this.createArtificialPlanet(size); break;
        default: planet = this.createEarthLikePlanet(size);
    }

    planet.mesh.position.copy(position);
    this.scene.add(planet.mesh);

    // Ajouter une lumière ambiante à la planète pour qu'elle soit visible de loin
    const light = new THREE.PointLight(0xffffff, 0.5, size * 10);
    planet.mesh.add(light);

    planet.position = position.clone();
    planet.size = size;
    planet.type = type;
    planet.rotationSpeed = 0.0005 + Math.random() * 0.002;

    return planet;
  }

  createEarthLikePlanet(size) {
    // 1. Utiliser une sphère haute résolution pour de bons détails
    const geometry = new THREE.SphereGeometry(size, 64, 64);

    // 2. Générer la texture sur un canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Générer terre, océans, nuages avec noise
    this.generateEarthTexture(ctx, canvas.width, canvas.height);

    // Créer texture Three.js à partir du canvas
    const texture = new THREE.CanvasTexture(canvas);

    // Générer une bump map pour le relief
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 1024;
    bumpCanvas.height = 512;
    const bumpCtx = bumpCanvas.getContext('2d');
    this.generateBumpMap(bumpCtx, bumpCanvas.width, bumpCanvas.height);
    const bumpMap = new THREE.CanvasTexture(bumpCanvas);

    // Matériau avec détails
    const material = new THREE.MeshPhongMaterial({
      map: texture,
      bumpMap: bumpMap,
      bumpScale: 0.5,
      shininess: 10
    });

    const planet = new THREE.Mesh(geometry, material);

    // Ajouter atmosphère
    const atmosphere = this.createAtmosphere(size * 1.025, 0x88aaff, 0.2);
    planet.add(atmosphere);

    // Ajouter les nuages
    const clouds = this.createClouds(size * 1.02);
    planet.add(clouds);

    return { mesh: planet, clouds: clouds };
  }

  createGasGiantPlanet(size) {
    const geometry = new THREE.SphereGeometry(size, 64, 64);
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Générer motifs de planète gazeuse
    this.generateGasGiantTexture(ctx, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);

    // Matériau avec effet lumineux
    const material = new THREE.MeshPhongMaterial({
      map: texture,
      shininess: 30,
    });

    const planet = new THREE.Mesh(geometry, material);

    // Ajouter atmosphère plus dense pour planète gazeuse
    const atmosphere = this.createAtmosphere(size * 1.05, 0xffffaa, 0.3);
    planet.add(atmosphere);

    return { mesh: planet };
  }

  createIceWorld(size) {
    const geometry = new THREE.SphereGeometry(size, 64, 64);
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Texture de glace bleutée
    this.generateIceTexture(ctx, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);

    // Bump map pour crevasses glaciales
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 1024;
    bumpCanvas.height = 512;
    const bumpCtx = bumpCanvas.getContext('2d');
    this.generateIceBumpMap(bumpCtx, bumpCanvas.width, bumpCanvas.height);
    const bumpMap = new THREE.CanvasTexture(bumpCanvas);

    const material = new THREE.MeshPhongMaterial({
      map: texture,
      bumpMap: bumpMap,
      bumpScale: 0.3,
      shininess: 80,
      specular: new THREE.Color(0x99bbff)
    });

    const planet = new THREE.Mesh(geometry, material);
    return { mesh: planet };
  }

  createLavaWorld(size) {
    const geometry = new THREE.SphereGeometry(size, 64, 64);
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Texture de lave
    this.generateLavaTexture(ctx, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);

    // Bump map pour les coulées de lave
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 1024;
    bumpCanvas.height = 512;
    const bumpCtx = bumpCanvas.getContext('2d');
    this.generateLavaBumpMap(bumpCtx, bumpCanvas.width, bumpCanvas.height);
    const bumpMap = new THREE.CanvasTexture(bumpCanvas);

    // Matériau avec émission pour effet de lave en fusion
    const material = new THREE.MeshPhongMaterial({
      map: texture,
      bumpMap: bumpMap,
      bumpScale: 0.5,
      emissive: new THREE.Color(0xff5500),
      emissiveIntensity: 0.5,
      shininess: 20
    });

    const planet = new THREE.Mesh(geometry, material);

    // Effet d'atmosphère rougeoyante
    const atmosphere = this.createAtmosphere(size * 1.03, 0xff3300, 0.2);
    planet.add(atmosphere);

    return { mesh: planet };
  }

  createDesertPlanet(size) {
    const geometry = new THREE.SphereGeometry(size, 64, 64);
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Texture de désert
    this.generateDesertTexture(ctx, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);

    // Bump map pour dunes et cratères
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 1024;
    bumpCanvas.height = 512;
    const bumpCtx = bumpCanvas.getContext('2d');
    this.generateDesertBumpMap(bumpCtx, bumpCanvas.width, bumpCanvas.height);
    const bumpMap = new THREE.CanvasTexture(bumpCanvas);

    const material = new THREE.MeshPhongMaterial({
      map: texture,
      bumpMap: bumpMap,
      bumpScale: 0.5,
      shininess: 5
    });

    const planet = new THREE.Mesh(geometry, material);

    // Légère atmosphère poussiéreuse
    const atmosphere = this.createAtmosphere(size * 1.02, 0xddaa77, 0.15);
    planet.add(atmosphere);

    return { mesh: planet };
  }

  createRingedPlanet(size) {
    // D'abord créer une planète gazeuse
    const planet = this.createGasGiantPlanet(size);

    // Puis ajouter des anneaux
    const innerRadius = size * 1.3;
    const outerRadius = size * 2.2;
    const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);

    // Créer la texture des anneaux sur un canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    this.generateRingTexture(ctx, canvas.width, canvas.height);

    const ringTexture = new THREE.CanvasTexture(canvas);

    // Ajuster les UV pour le mapping de texture correct
    const pos = ringGeometry.attributes.position;
    const v3 = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++){
      v3.fromBufferAttribute(pos, i);
      ringGeometry.attributes.uv.setXY(
        i,
        (v3.length() - innerRadius) / (outerRadius - innerRadius),
        0.5
      );
    }

    const ringMaterial = new THREE.MeshBasicMaterial({
      map: ringTexture,
      transparent: true,
      side: THREE.DoubleSide
    });

    const rings = new THREE.Mesh(ringGeometry, ringMaterial);
    rings.rotation.x = Math.PI / 2 + Math.random() * 0.5 - 0.25; // Inclinaison
    planet.mesh.add(rings);

    return planet;
  }

  createAtmosphere(size, color, opacity) {
    const geometry = new THREE.SphereGeometry(size, 32, 32);
    const material = new THREE.MeshPhongMaterial({
      color: color,
      transparent: true,
      opacity: opacity,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });

    return new THREE.Mesh(geometry, material);
  }

  createClouds(size) {
    const geometry = new THREE.SphereGeometry(size, 32, 32);
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Générer nuages avec bruit perlin
    this.generateCloudsTexture(ctx, canvas.width, canvas.height);

    const cloudsTexture = new THREE.CanvasTexture(canvas);

    const material = new THREE.MeshPhongMaterial({
      map: cloudsTexture,
      transparent: true,
      opacity: 0.8,
      blending: THREE.NormalBlending
    });

    return new THREE.Mesh(geometry, material);
  }

  // === GÉNÉRATION DE TEXTURES ===

  generateEarthTexture(ctx, width, height) {
    // Remplir avec bleu océan
    ctx.fillStyle = '#0077be';
    ctx.fillRect(0, 0, width, height);

    // Générer les continents
    ctx.fillStyle = '#228B22';  // Vert forêt

    // Cette boucle crée des "continents" avec du bruit Simplex
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Coordonnées normalisées pour le bruit
        const nx = x / width - 0.5;
        const ny = y / height - 0.5;

        // Différentes échelles de bruit pour variété
        const freq1 = 1.5;
        const freq2 = 3;
        const freq3 = 6;

        let val = this.simplex.noise2D(nx * freq1, ny * freq1) * 0.5 + 0.5;
        val += this.simplex.noise2D(nx * freq2, ny * freq2) * 0.25 + 0.25;
        val += this.simplex.noise2D(nx * freq3, ny * freq3) * 0.125 + 0.125;
        val /= 1.875;

        // Affecter latitude (plus de glace aux pôles)
        const latitude = Math.abs(ny * 2);
        const coldFactor = Math.max(0, Math.min(1, (latitude - 0.7) * 5));

        // Établir le seuil pour déterminer terre vs océan
        const landThreshold = 0.57;

        // Dessiner continent ou pôle
        if (val > landThreshold) {
          if (coldFactor > 0.5) {
            // Couleur des régions froides (neige)
            ctx.fillStyle = `rgb(255, 255, ${255 - Math.floor(coldFactor * 55)})`;
          } else {
            // Variation de couleur basée sur l'altitude
            const altitude = (val - landThreshold) / (1 - landThreshold);
            const green = 139 + Math.floor(altitude * 80);
            const red = 34 + Math.floor(altitude * 160);
            const blue = 34;
            ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
          }
          ctx.fillRect(x, y, 1, 1);
        }

        // Ajouter le sable sur les côtes
        else if (val > landThreshold - 0.03) {
          ctx.fillStyle = '#C2B280'; // Couleur sable
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }

  generateBumpMap(ctx, width, height) {
    // Terrain bump map en niveaux de gris
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = x / width - 0.5;
        const ny = y / height - 0.5;

        // Différentes fréquences pour générer le relief
        let val = this.simplex.noise2D(nx * 2, ny * 2) * 0.5 + 0.5;
        val += this.simplex.noise2D(nx * 4, ny * 4) * 0.25 + 0.25;
        val += this.simplex.noise2D(nx * 8, ny * 8) * 0.125 + 0.125;
        val /= 1.875;

        const color = Math.floor(val * 255);
        ctx.fillStyle = `rgb(${color}, ${color}, ${color})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  generateCloudsTexture(ctx, width, height) {
    ctx.clearRect(0, 0, width, height);

    // Générer nuages avec bruit perlin
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = x / width - 0.5 + 123.4;  // Offset pour différencier des autres textures
        const ny = y / height - 0.5 + 567.8;

        let val = this.simplex.noise2D(nx * 2, ny * 2) * 0.5 + 0.5;
        val += this.simplex.noise2D(nx * 6, ny * 6) * 0.25 + 0.25;
        val /= 1.75;

        // Seulement créer des nuages où la valeur est assez élevée
        if (val > 0.65) {
          const alpha = (val - 0.65) / 0.35;
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }

  generateGasGiantTexture(ctx, width, height) {
    // Couleurs de base aléatoires pour la planète gazeuse
    const hue = Math.random() * 60 + 20; // Jaunes à oranges
    const baseColor = `hsl(${hue}, 80%, 50%)`;

    // Remplir le fond
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, width, height);

    // Générer des bandes nuageuses
    for (let y = 0; y < height; y++) {
      // Position relative verticale (-1 à 1)
      const vy = (y / height) * 2 - 1;

      // Bandes horizontales - varient en fonction de la latitude
      const bandIntensity = Math.sin(vy * 12) * 0.5 + 0.5;

      // Variation de couleur basée sur les bandes
      const bandHue = hue + bandIntensity * 20 - 10;
      const bandSaturation = 70 + bandIntensity * 20;
      const bandLightness = 40 + bandIntensity * 20;

      for (let x = 0; x < width; x++) {
        // Ajouter du noise pour les détails des tourbillons
        const nx = x / width + 234.5;  // Offset
        const ny = y / height + 123.4;

        const noiseVal = this.simplex.noise2D(nx * 4, ny * 1) * 0.5 + 0.5;
        const detailNoise = this.simplex.noise2D(nx * 10, ny * 10) * 0.5 + 0.5;

        // Combiner bandes et noise
        const hueMod = (noiseVal - 0.5) * 15;
        const finalHue = bandHue + hueMod;
        const finalSaturation = bandSaturation + (detailNoise - 0.5) * 20;
        const finalLightness = bandLightness + (noiseVal - 0.5) * 15;

        ctx.fillStyle = `hsl(${finalHue}, ${finalSaturation}%, ${finalLightness}%)`;
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Ajouter des tempêtes/cyclones
    this.addStorms(ctx, width, height, 3 + Math.floor(Math.random() * 3));
  }

  addStorms(ctx, width, height, count) {
    for (let i = 0; i < count; i++) {
      // Position aléatoire
      const x = Math.random() * width;
      const y = Math.random() * (height * 0.6) + height * 0.2; // Plus probable sur l'équateur

      // Taille aléatoire
      const size = Math.random() * 50 + 20;

      // Couleur aléatoire
      const hue = Math.random() * 40 + 10;
      const color = `hsl(${hue}, 70%, 70%)`;

      // Dessiner la tempête ovale
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(2, 1); // Ovale horizontal

      // Gradient radial pour effet de tempête
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'rgba(255,255,255,0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  generateIceTexture(ctx, width, height) {
    // Fond blanc bleuté
    ctx.fillStyle = '#e0e8ff';
    ctx.fillRect(0, 0, width, height);

    // Ajouter variations de glace
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = x / width - 0.5 + 345.6;
        const ny = y / height - 0.5 + 678.9;

        // Plusieurs niveaux de bruit
        let val = this.simplex.noise2D(nx * 2, ny * 2) * 0.5 + 0.5;
        val += this.simplex.noise2D(nx * 6, ny * 6) * 0.25 + 0.25;
        val += this.simplex.noise2D(nx * 12, ny * 12) * 0.125 + 0.125;
        val /= 1.875;

        // Variation de couleur bleu-blanc
        const blue = 200 + Math.floor(val * 55);
        const green = 210 + Math.floor(val * 45);
        const red = 220 + Math.floor(val * 35);

        ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        ctx.fillRect(x, y, 1, 1);

        // Ajouter crevasses glaciales
        if (val < 0.3) {
          const darkBlue = Math.floor(70 + val * 130);
          ctx.fillStyle = `rgb(${darkBlue - 50}, ${darkBlue}, ${darkBlue + 50})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }

  generateIceBumpMap(ctx, width, height) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = x / width - 0.5 + 345.6;
        const ny = y / height - 0.5 + 678.9;

        let val = this.simplex.noise2D(nx * 3, ny * 3) * 0.5 + 0.5;
        val += this.simplex.noise2D(nx * 9, ny * 9) * 0.25 + 0.25;
        val += this.simplex.noise2D(nx * 18, ny * 18) * 0.125 + 0.125;
        val /= 1.875;

        // Accentuer les crevasses
        if (val < 0.4) val = val * 0.7;

        const gray = Math.floor(val * 255);
        ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  generateLavaTexture(ctx, width, height) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = x / width - 0.5 + 567.8;
        const ny = y / height - 0.5 + 890.1;

        // Plusieurs échelles de bruit
        let val = this.simplex.noise2D(nx * 1.5, ny * 1.5) * 0.5 + 0.5;
        val += this.simplex.noise2D(nx * 4, ny * 4) * 0.25 + 0.25;
        val += this.simplex.noise2D(nx * 16, ny * 16) * 0.125 + 0.125;
        val /= 1.875;

        // Couleur de la lave
        let red, green, blue;

        if (val < 0.45) { // Roche sombre
          red = Math.floor(val * 120) + 20;
          green = Math.floor(val * 40) + 10;
          blue = Math.floor(val * 40);
        } else if (val < 0.55) { // Transition
          red = Math.floor(val * 400) + 20;
          green = Math.floor(val * 100);
          blue = 0;
        } else { // Lave
          red = 255;
          green = Math.floor((val - 0.55) * 510); // 0-255
          blue = 0;
        }

        ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Ajouter des éruptions/points chauds
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 30 + 10;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, 'rgba(255, 255, 100, 1)');
      gradient.addColorStop(0.2, 'rgba(255, 200, 0, 0.8)');
      gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  generateLavaBumpMap(ctx, width, height) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = x / width - 0.5 + 567.8;
        const ny = y / height - 0.5 + 890.1;

        let val = this.simplex.noise2D(nx * 2, ny * 2) * 0.5 + 0.5;
        val += this.simplex.noise2D(nx * 6, ny * 6) * 0.25 + 0.25;
        val += this.simplex.noise2D(nx * 12, ny * 12) * 0.125 + 0.125;
        val /= 1.875;

        // Accentuer relief pour les coulées
        if (val > 0.55) val = val * 1.5 - 0.275;

        const gray = Math.floor(val * 255);
        ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Ajouter cratères et montagnes
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 40 + 10;
      const isCrater = Math.random() > 0.5;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      if (isCrater) {
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(0.7, 'rgba(120, 120, 120, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      } else {
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.7, 'rgba(150, 150, 150, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  generateDesertTexture(ctx, width, height) {
    // Fond sable
    ctx.fillStyle = '#C2B280';
    ctx.fillRect(0, 0, width, height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = x / width - 0.5 + 123.4;
        const ny = y / height - 0.5 + 456.7;

        let val = this.simplex.noise2D(nx * 2, ny * 2) * 0.5 + 0.5;
        val += this.simplex.noise2D(nx * 6, ny * 6) * 0.25 + 0.25;
        val += this.simplex.noise2D(nx * 12, ny * 12) * 0.125 + 0.125;
        val /= 1.875;

        // Couleurs sable variées
        const red = 180 + Math.floor(val * 40);
        const green = 160 + Math.floor(val * 30);
        const blue = 100 + Math.floor(val * 30);

        // Varier les couleurs selon latitude (plus orange aux pôles)
        const latitude = Math.abs((y / height) * 2 - 1);
        const redMod = Math.min(255, red + latitude * 30);
        const greenMod = Math.max(0, green - latitude * 20);

        ctx.fillStyle = `rgb(${redMod}, ${greenMod}, ${blue})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Ajouter quelques cratères
    for (let i = 0; i < 10 + Math.random() * 20; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 30 + 5;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, 'rgba(120, 100, 80, 0.8)');
      gradient.addColorStop(0.7, 'rgba(160, 140, 100, 0.4)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  generateDesertBumpMap(ctx, width, height) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = x / width - 0.5 + 123.4;
        const ny = y / height - 0.5 + 456.7;

        let val = this.simplex.noise2D(nx * 2, ny * 2) * 0.5 + 0.5;
        val += this.simplex.noise2D(nx * 8, ny * 8) * 0.25 + 0.25;
        val += this.simplex.noise2D(nx * 32, ny * 32) * 0.125 + 0.125;
        val /= 1.875;

        const gray = Math.floor(val * 255);
        ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Ajouter des cratères avec relief
    for (let i = 0; i < 10 + Math.random() * 20; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 30 + 5;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, 'rgba(50, 50, 50, 1)'); // Fond de cratère
      gradient.addColorStop(0.6, 'rgba(200, 200, 200, 1)'); // Bord surélevé
      gradient.addColorStop(0.8, 'rgba(100, 100, 100, 0.8)');
      gradient.addColorStop(1, 'rgba(128, 128, 128, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ajouter des dunes de sable
    for (let i = 0; i < 5; i++) {
      const startX = Math.random() * width;
      const startY = Math.random() * height;
      const endX = startX + (Math.random() * 200 - 100);
      const endY = startY + (Math.random() * 200 - 100);
      const controlX = (startX + endX) / 2 + (Math.random() * 100 - 50);
      const controlY = (startY + endY) / 2 + (Math.random() * 100 - 50);

      const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
      gradient.addColorStop(0, 'rgba(200, 200, 200, 0)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(1, 'rgba(200, 200, 200, 0)');

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 20 + Math.random() * 30;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(controlX, controlY, endX, endY);
      ctx.stroke();
    }
  }

  generateRingTexture(ctx, width, height) {
    // Fond transparent
    ctx.clearRect(0, 0, width, height);

    // Générer des anneaux avec différentes opacités
    for (let x = 0; x < width; x++) {
      // Variation radiale
      let val = 0;

      // Superposer plusieurs fréquences de bruit
      val += Math.sin(x * 0.01) * 0.5 + 0.5;
      val += Math.sin(x * 0.05) * 0.25 + 0.25;
      val += Math.sin(x * 0.2) * 0.125 + 0.125;
      val += this.simplex.noise2D(x * 0.01, 0) * 0.125 + 0.125;
      val /= 2;

      // Créer plusieurs bandes d'anneaux
      for (let y = 0; y < height; y++) {
        // Variation additionnelle par y
        const variation = this.simplex.noise2D(x * 0.02, y * 0.1) * 0.5 + 0.5;
        const combinedVal = val * 0.7 + variation * 0.3;

        // Transparence variable
        let alpha;

        // Créer des lacunes dans les anneaux
        if (combinedVal < 0.3) {
          alpha = 0.0; // Transparence complète
        } else if (combinedVal < 0.4) {
          alpha = (combinedVal - 0.3) * 10 * 0.6; // Transition douce
        } else if (combinedVal > 0.7) {
          alpha = (1 - (combinedVal - 0.7) * (10/3)) * 0.6; // Transition douce
        } else {
          alpha = 0.6; // Semi-transparent
        }

        // Coloration légère des anneaux
        const color = 200 + Math.floor(combinedVal * 55);

        if (alpha > 0) {
          ctx.fillStyle = `rgba(${color}, ${color}, ${color}, ${alpha})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    // Ajouter des particules de poussière
    for (let i = 0; i < width * height * 0.01; i++) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);

      // Plus de particules au milieu
      const middle = Math.abs(y - height / 2) / (height / 2);
      if (Math.random() > middle * 1.2) {
        const size = Math.random() < 0.8 ? 1 : 2;
        const alpha = Math.random() * 0.5 + 0.3;

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillRect(x, y, size, size);
      }
    }
  }

  createOceanicPlanet(size) {
    const geometry = new THREE.SphereGeometry(size, 64, 64);
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Fond bleu profond
    ctx.fillStyle = '#003366';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Générer variations de bleu
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const nx = x / canvas.width - 0.5;
        const ny = y / canvas.height - 0.5;

        let val = this.simplex.noise2D(nx * 3, ny * 3) * 0.5 + 0.5;
        val += this.simplex.noise2D(nx * 7, ny * 7) * 0.25 + 0.25;
        val /= 1.75;

        // Couleurs variant du bleu profond au turquoise
        const blue = 120 + Math.floor(val * 135);
        const green = 80 + Math.floor(val * 100);
        const red = 20 + Math.floor(val * 40);

        // Très peu d'îles
        if (val > 0.85) {
          ctx.fillStyle = '#c2b280'; // Sable
          ctx.fillRect(x, y, 1, 1);
        } else {
          ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    // Ajouter des tourbillons océaniques
    this.addOceanSwirls(ctx, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshPhongMaterial({
      map: texture,
      shininess: 90,
      specular: new THREE.Color(0x3399ff)
    });

    const planet = new THREE.Mesh(geometry, material);

    // Atmosphère bleu clair
    const atmosphere = this.createAtmosphere(size * 1.05, 0x66ccff, 0.3);
    planet.add(atmosphere);

    // Ajouter des nuages légers
    const clouds = this.createLightClouds(size * 1.03);
    planet.add(clouds);

    return { mesh: planet, clouds: clouds };
  }

  addOceanSwirls(ctx, width, height) {
    // Ajouter 3-5 grands tourbillons océaniques
    const swirls = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < swirls; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const radius = 30 + Math.random() * 60;

      // Créer un gradient pour le tourbillon
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, 'rgba(150, 220, 255, 0.7)');
      gradient.addColorStop(0.5, 'rgba(100, 180, 235, 0.4)');
      gradient.addColorStop(1, 'rgba(0, 120, 200, 0)');

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.random() * Math.PI * 2);

      // Dessiner un motif spiralé
      ctx.fillStyle = gradient;
      ctx.beginPath();

      for (let angle = 0; angle < Math.PI * 10; angle += 0.1) {
        const spiralRadius = angle / 10 * radius;
        if (spiralRadius > radius) break;

        const sx = Math.cos(angle) * spiralRadius;
        const sy = Math.sin(angle) * spiralRadius;

        if (angle === 0) {
          ctx.moveTo(sx, sy);
        } else {
          ctx.lineTo(sx, sy);
        }
      }

      ctx.fill();
      ctx.restore();
    }
  }

  createLightClouds(size) {
    const geometry = new THREE.SphereGeometry(size, 32, 32);
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Clairsemés et fins
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const nx = x / canvas.width - 0.5 + 789.1;
        const ny = y / canvas.height - 0.5 + 345.6;

        let val = this.simplex.noise2D(nx * 4, ny * 4) * 0.5 + 0.5;
        val += this.simplex.noise2D(nx * 8, ny * 8) * 0.25 + 0.25;
        val /= 1.75;

        // Seulement les zones avec beaucoup de bruit
        if (val > 0.75) {
          const alpha = (val - 0.75) / 0.25 * 0.5; // Max 50% opacité
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    const cloudsTexture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshPhongMaterial({
      map: cloudsTexture,
      transparent: true,
      opacity: 0.6,
      blending: THREE.NormalBlending
    });

    return new THREE.Mesh(geometry, material);
  }

  createToxicPlanet(size) {
    const geometry = new THREE.SphereGeometry(size, 64, 64);
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base jaunâtre/verdâtre
    ctx.fillStyle = '#5a6e28';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Variations de couleur toxique
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const nx = x / canvas.width - 0.5 + 456.7;
        const ny = y / canvas.height - 0.5 + 567.8;

        let val = this.simplex.noise2D(nx * 2, ny * 2) * 0.5 + 0.5;
        val += this.simplex.noise2D(nx * 5, ny * 5) * 0.25 + 0.25;
        val += this.simplex.noise2D(nx * 15, ny * 15) * 0.125 + 0.125;
        val /= 1.875;

        // Couleur toxique variant entre vert et jaune
        const green = 100 + Math.floor(val * 100);
        const red = 70 + Math.floor(val * 70);
        const blue = Math.floor(val * 40);

        ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Ajouter des "lacs" toxiques
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 40 + 10;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, 'rgba(160, 240, 40, 0.8)');
      gradient.addColorStop(0.7, 'rgba(100, 160, 20, 0.5)');
      gradient.addColorStop(1, 'rgba(80, 100, 10, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);

    // Bump map pour terrain accidenté
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 1024;
    bumpCanvas.height = 512;
    const bumpCtx = bumpCanvas.getContext('2d');

    for (let y = 0; y < bumpCanvas.height; y++) {
      for (let x = 0; x < bumpCanvas.width; x++) {
        const nx = x / bumpCanvas.width - 0.5 + 456.7;
        const ny = y / bumpCanvas.height - 0.5 + 567.8;

        let val = this.simplex.noise2D(nx * 3, ny * 3) * 0.5 + 0.5;
        val += this.simplex.noise2D(nx * 9, ny * 9) * 0.25 + 0.25;
        val /= 1.75;

        const gray = Math.floor(val * 255);
        bumpCtx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
        bumpCtx.fillRect(x, y, 1, 1);
      }
    }

    const bumpMap = new THREE.CanvasTexture(bumpCanvas);

    const material = new THREE.MeshPhongMaterial({
      map: texture,
      bumpMap: bumpMap,
      bumpScale: 0.4,
      shininess: 10
    });

    const planet = new THREE.Mesh(geometry, material);

    // Atmosphère dense verdâtre
    const atmosphere = this.createAtmosphere(size * 1.1, 0x88ff44, 0.4);
    planet.add(atmosphere);

    // Brume toxique
    const toxicFog = this.createAtmosphere(size * 1.15, 0xaaff00, 0.15);
    planet.add(toxicFog);

    return { mesh: planet };
  }

  createCrystallinePlanet(size) {
    // Géométrie plus angulaire pour l'effet cristallin
    const geometry = new THREE.DodecahedronGeometry(size, 3);

    // Couleur de base cristalline
    const hue = Math.random() * 60 + 180; // Bleu à violet
    const baseColor = new THREE.Color(`hsl(${hue}, 70%, 60%)`);

    // Matériau brillant, transparent
    const material = new THREE.MeshPhysicalMaterial({
      color: baseColor,
      metalness: 0.3,
      roughness: 0.2,
      transmission: 0.6,
      thickness: size * 0.5,
      envMapIntensity: 1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      normalScale: new THREE.Vector2(0.3, 0.3)
    });

    const planet = new THREE.Mesh(geometry, material);

    // Ajout de cristaux en surface
    this.addCrystals(planet, size);

    // Léger halo lumineux
    const glow = this.createAtmosphere(size * 1.1, baseColor, 0.2);
    planet.add(glow);

    return { mesh: planet };
  }

  addCrystals(planetMesh, size) {
    // Ajouter 15-30 cristaux qui sortent de la surface
    const crystalCount = 15 + Math.floor(Math.random() * 15);

    for (let i = 0; i < crystalCount; i++) {
      // Position aléatoire sur la sphère
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.random() * Math.PI;

      const x = size * Math.sin(theta) * Math.cos(phi);
      const y = size * Math.sin(theta) * Math.sin(phi);
      const z = size * Math.cos(theta);

      // Taille aléatoire
      const crystalSize = size * (0.1 + Math.random() * 0.2);

      // Géométrie de cristal - pyramide ou prisme
      let crystalGeo;
      if (Math.random() > 0.5) {
        crystalGeo = new THREE.ConeGeometry(crystalSize * 0.5, crystalSize * 2, 5);
      } else {
        crystalGeo = new THREE.OctahedronGeometry(crystalSize, 0);
      }

      // Même matériau que la planète mais plus transparent
      const crystalMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(`hsl(${Math.random() * 40 + 180}, 70%, 60%)`),
        metalness: 0.3,
        roughness: 0.1,
        transmission: 0.9,
        thickness: crystalSize * 0.5,
        envMapIntensity: 1.5,
        clearcoat: 1.0
      });

      const crystal = new THREE.Mesh(crystalGeo, crystalMat);

      // Positionner et orienter le cristal pour qu'il pointe vers l'extérieur
      crystal.position.set(x, y, z);
      crystal.lookAt(x * 2, y * 2, z * 2);

      planetMesh.add(crystal);
    }
  }

  createVolcanicPlanet(size) {
    const geometry = new THREE.SphereGeometry(size, 64, 64);
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base noire volcanique
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Générer texture volcanique
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const nx = x / canvas.width - 0.5 + 678.9;
        const ny = y / canvas.height - 0.5 + 789.0;

        let val = this.simplex.noise2D(nx * 2, ny * 2) * 0.5 + 0.5;
        val += this.simplex.noise2D(nx * 6, ny * 6) * 0.25 + 0.25;
        val += this.simplex.noise2D(nx * 12, ny * 12) * 0.125 + 0.125;
        val /= 1.875;

        // Crevasses de lave active
        if (val > 0.65) {
          const lavaIntensity = (val - 0.65) / 0.35;
          const red = 200 + Math.floor(lavaIntensity * 55);
          const green = 50 + Math.floor(lavaIntensity * 80);
          const blue = Math.floor(lavaIntensity * 20);

          ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
          ctx.fillRect(x, y, 1, 1);
        }
        else {
          // Base rocheuse avec variations
          const gray = 20 + Math.floor(val * 60);
          ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    // Ajouter des volcans actifs
    this.addActiveVolcanoes(ctx, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);

    // Bump map très marquée
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 1024;
    bumpCanvas.height = 512;
    const bumpCtx = bumpCanvas.getContext('2d');

    for (let y = 0; y < bumpCanvas.height; y++) {
      for (let x = 0; x < bumpCanvas.width; x++) {
        const nx = x / bumpCanvas.width - 0.5 + 678.9;
        const ny = y / bumpCanvas.height - 0.5 + 789.0;

        let val = this.simplex.noise2D(nx * 4, ny * 4) * 0.5 + 0.5;
        val += this.simplex.noise2D(nx * 8, ny * 8) * 0.25 + 0.25;
        val /= 1.75;

        // Augmenter le contraste pour des reliefs plus marqués
        val = Math.pow(val, 1.5);

        const gray = Math.floor(val * 255);
        bumpCtx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
        bumpCtx.fillRect(x, y, 1, 1);
      }
    }

    // Ajouter les cratères volcaniques au bump map
    this.addVolcanoesToBumpMap(bumpCtx, bumpCanvas.width, bumpCanvas.height);

    const bumpMap = new THREE.CanvasTexture(bumpCanvas);

    // Matériau avec forte émission pour la lave
    const material = new THREE.MeshPhongMaterial({
      map: texture,
      bumpMap: bumpMap,
      bumpScale: 1,
      emissive: new THREE.Color(0xff2200),
      emissiveIntensity: 1,
      shininess: 20
    });

    const planet = new THREE.Mesh(geometry, material);

    // Atmosphère de fumée et cendres
    const atmosphere = this.createAtmosphere(size * 1.05, 0x555555, 0.3);
    planet.add(atmosphere);

    return { mesh: planet };
  }

  addActiveVolcanoes(ctx, width, height) {
    // 5-10 volcans majeurs
    const volcanoes = 5 + Math.floor(Math.random() * 6);

    for (let i = 0; i < volcanoes; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = 20 + Math.random() * 40;

      // Coulée de lave aléatoire depuis le volcan
      const angle = Math.random() * Math.PI * 2;
      const length = size * (1 + Math.random() * 3);
      const endX = x + Math.cos(angle) * length;
      const endY = y + Math.sin(angle) * length;

      // Dessiner la coulée
      const gradient = ctx.createLinearGradient(x, y, endX, endY);
      gradient.addColorStop(0, 'rgba(255, 180, 0, 1)');
      gradient.addColorStop(0.3, 'rgba(255, 100, 0, 0.8)');
      gradient.addColorStop(1, 'rgba(180, 30, 0, 0)');

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 5 + Math.random() * 10;

      // Rendre la coulée plus naturelle avec des courbes
      ctx.beginPath();
      ctx.moveTo(x, y);

      const cp1x = x + (endX - x) * 0.33 + (Math.random() - 0.5) * 30;
      const cp1y = y + (endY - y) * 0.33 + (Math.random() - 0.5) * 30;
      const cp2x = x + (endX - x) * 0.66 + (Math.random() - 0.5) * 30;
      const cp2y = y + (endY - y) * 0.66 + (Math.random() - 0.5) * 30;

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
      ctx.stroke();

      // Dessiner le cratère
      const craterGradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      craterGradient.addColorStop(0, 'rgba(255, 200, 0, 1)');
      craterGradient.addColorStop(0.2, 'rgba(220, 100, 0, 0.9)');
      craterGradient.addColorStop(0.5, 'rgba(180, 30, 0, 0.7)');
      craterGradient.addColorStop(1, 'rgba(100, 20, 0, 0)');

      ctx.fillStyle = craterGradient;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  addVolcanoesToBumpMap(ctx, width, height) {
    // Ajouter des cratères volcaniques pour le bump map
    const volcanoes = 5 + Math.floor(Math.random() * 6);

    for (let i = 0; i < volcanoes; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = 20 + Math.random() * 40;

      // Gradient pour cratère - blanc au centre pour hauteur, puis noir pour dépression
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, 'white');
      gradient.addColorStop(0.2, 'white');
      gradient.addColorStop(0.3, 'black');
      gradient.addColorStop(0.7, 'gray');
      gradient.addColorStop(1, 'rgba(128, 128, 128, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  createBinaryPlanet(size) {
    // Groupe pour contenir les deux planètes
    const group = new THREE.Group();

    // Deux planètes plus petites
    const size1 = size * 0.8;
    const size2 = size * 0.;

    // Choisir aléatoirement deux types pour varier
    const types = ['earthLike', 'gasGiant', 'iceWorld', 'lavaWorld', 'desert'];
    const type1 = types[Math.floor(Math.random() * types.length)];

    let type2;
    do {
      type2 = types[Math.floor(Math.random() * types.length)];
    } while (type1 === type2); // Éviter le même type

    // Créer les deux planètes
    const planet1 = this.createPlanetByType(type1, size1);
    const planet2 = this.createPlanetByType(type2, size2);

    // Position pour éviter collision mais assez proche
    const gap = (size1 + size2) * 1.5;
    planet1.position.set(-gap, 0, 0);
    planet2.position.set(gap * 0.5, 0, 0);

    // Ajouter au groupe
    group.add(planet1);
    group.add(planet2);

    // Ajouter barre énergétique entre les deux
    const connectionMesh = this.createPlanetaryConnection(planet1.position, planet2.position);
    group.add(connectionMesh);

    return {
      mesh: group,
      binary: true, // Flag pour traitement spécial dans l'animation
      planet1: planet1,
      planet2: planet2
    };
  }

  createPlanetByType(type, size) {
    let planetObj;

    switch (type) {
      case 'earthLike': planetObj = this.createEarthLikePlanet(size); break;
      case 'gasGiant': planetObj = this.createGasGiantPlanet(size); break;
      case 'iceWorld': planetObj = this.createIceWorld(size); break;
      case 'lavaWorld': planetObj = this.createLavaWorld(size); break;
      case 'desert': planetObj = this.createDesertPlanet(size); break;
      default: planetObj = this.createEarthLikePlanet(size);
    }

    return planetObj.mesh;
  }

  createPlanetaryConnection(pos1, pos2) {
    // Créer une "connexion énergétique" entre les planètes binaires
    const points = [];
    points.push(new THREE.Vector3(pos1.x, pos1.y, pos1.z));
    points.push(new THREE.Vector3(pos2.x, pos2.y, pos2.z));

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x88aaff,
      linewidth: 3,
      transparent: true,
      opacity: 0.6
    });

    return new THREE.Line(geometry, material);
  }

  createArtificialPlanet(size) {
    // Base de planète terrestre
    const planet = this.createEarthLikePlanet(size);

    // Ajouter des structures artificielles en surface
    this.addArtificialStructures(planet.mesh, size);

    return planet;
  }

  addArtificialStructures(planetMesh, size) {
    // Grille mondiale de structures
    const structureCount = 20 + Math.floor(Math.random() * 30);

    for (let i = 0; i < structureCount; i++) {
      // Position aléatoire sur la sphère
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.random() * Math.PI;

      const x = size * Math.sin(theta) * Math.cos(phi);
      const y = size * Math.sin(theta) * Math.sin(phi);
      const z = size * Math.cos(theta);

      const position = new THREE.Vector3(x, y, z);

      // Type de structure
      const type = Math.floor(Math.random() * 4);
      let structure;

      switch(type) {
        case 0: // Tour
          structure = this.createTower();
          break;
        case 1: // Dôme
          structure = this.createDome();
          break;
        case 2: // Antenne
          structure = this.createAntenna();
          break;
        case 3: // Réseau
          structure = this.createGrid();
          break;
      }

      // Ajuster position et orientation
      structure.position.copy(position);
      structure.lookAt(0, 0, 0);
      structure.rotateX(Math.PI / 2); // Orienter vers l'extérieur

      // Échelle proportionnelle à la planète
      const scale = size * 0.02;
      structure.scale.set(scale, scale, scale);

      planetMesh.add(structure);
    }

    // Ajouter un anneau artificiel
    const ringGeometry = new THREE.RingGeometry(size * 1.3, size * 1.32, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x88aaff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7
    });

    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    planetMesh.add(ring);
  }

  createTower() {
    const group = new THREE.Group();

    // Base de la tour
    const baseGeometry = new THREE.CylinderGeometry(1, 1.5, 3, 6);
    const baseMaterial = new THREE.MeshPhongMaterial({
      color: 0x888888,
      shininess: 50
    });

    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    group.add(base);

    // Tour principale
    const towerGeometry = new THREE.CylinderGeometry(0.5, 1, 8, 6);
    const towerMaterial = new THREE.MeshPhongMaterial({
      color: 0xaaaaaa,
      shininess: 80
    });

    const tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.y = 5;
    group.add(tower);

    // Sommet lumineux
    const topGeometry = new THREE.SphereGeometry(0.7, 16, 16);
    const topMaterial = new THREE.MeshPhongMaterial({
      color: 0x00aaff,
      emissive: 0x0066ff,
      emissiveIntensity: 1,
      shininess: 100
    });

    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = 10;
    group.add(top);

    return group;
  }

  createDome() {
    const group = new THREE.Group();

    // Base du dôme
    const baseGeometry = new THREE.CylinderGeometry(2, 2.2, 0.5, 16);
    const baseMaterial = new THREE.MeshPhongMaterial({
      color: 0x666666,
      shininess: 30
    });

    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.25;
    group.add(base);

    // Dôme transparent
    const domeGeometry = new THREE.SphereGeometry(2, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMaterial = new THREE.MeshPhongMaterial({
      color: 0xaaddff,
      transparent: true,
      opacity: 0.4,
      shininess: 100,
      side: THREE.DoubleSide
    });

    const dome = new THREE.Mesh(domeGeometry, domeMaterial);
    dome.position.y = 2;
    group.add(dome);

    return group;
  }

  createAntenna() {
    const group = new THREE.Group();

    // Base de l'antenne
    const baseGeometry = new THREE.BoxGeometry(3, 0.5, 3);
    const baseMaterial = new THREE.MeshPhongMaterial({
      color: 0x444444,
      shininess: 20
    });

    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.25;
    group.add(base);

    // Mât principal
    const poleGeometry = new THREE.CylinderGeometry(0.2, 0.3, 10, 8);
    const poleMaterial = new THREE.MeshPhongMaterial({
      color: 0x888888,
      shininess: 50
    });

    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = 5.25;
    group.add(pole);

    // Antenne satellite
    const dishGeometry = new THREE.SphereGeometry(1.5, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    const dishMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      shininess: 80
    });

    const dish = new THREE.Mesh(dishGeometry, dishMaterial);
    dish.rotation.x = -Math.PI / 2;
    dish.position.set(0, 8, 1.5);
    group.add(dish);

    return group;
  }

  createGrid() {
    const group = new THREE.Group();

    // Créer une grille de structures
    const size = 5;
    const divisions = 5;

    for (let x = -size/2; x <= size/2; x += size/divisions) {
      for (let z = -size/2; z <= size/2; z += size/divisions) {
        // Petites structures
        if (Math.random() > 0.3) {
          const height = Math.random() * 2 + 0.5;
          const boxGeometry = new THREE.BoxGeometry(0.8, height, 0.8);
          const boxMaterial = new THREE.MeshPhongMaterial({
            color: 0x888888,
            shininess: 50
          });

          const box = new THREE.Mesh(boxGeometry, boxMaterial);
          box.position.set(x, height/2, z);
          group.add(box);
        }
      }
    }

    // Plate-forme de base
    const baseGeometry = new THREE.BoxGeometry(size + 1, 0.2, size + 1);
    const baseMaterial = new THREE.MeshPhongMaterial({
      color: 0x333333,
      shininess: 30
    });

    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.1;
    group.add(base);

    return group;
  }

  // Animation des planètes
  animate(delta) {
    this.planets.forEach(planet => {
      if (planet.mesh) {
        if (planet.binary) {
          // Animation spéciale pour systèmes binaires
          planet.mesh.rotation.y += 0.0002 * delta * 60;

          // Faire orbiter les planètes l'une autour de l'autre
          const orbitSpeed = 0.001 * delta * 60;
          for (let i = 0; i < planet.mesh.children.length; i++) {
            const child = planet.mesh.children[i];
            if (child === planet.planet1 || child === planet.planet2) {
              child.rotation.y += planet.rotationSpeed * delta * 60;
            }
          }
        } else {
          // Animation normale
          planet.mesh.rotation.y += planet.rotationSpeed * delta * 60;

          // Animer les nuages si présents
          if (planet.clouds) {
            planet.clouds.rotation.y += planet.rotationSpeed * 1.5 * delta * 60;
          }
        }
      }
    });
  }

  // Vérification de proximité avec le vaisseau
  checkProximity(position, threshold = 100) {
    const nearbyPlanets = [];

    this.planets.forEach((planet, index) => {
      const distance = position.distanceTo(planet.position);
      if (distance < planet.size + threshold) {
        nearbyPlanets.push({
          planet,
          distance,
          index
        });
      }
    });

    return nearbyPlanets;
  }

  // Nettoyer les ressources
  clearAll() {
    this.planets.forEach(planet => {
      if (planet.mesh) {
        this.scene.remove(planet.mesh);

        // Libérer la mémoire GPU
        if (planet.mesh.geometry) planet.mesh.geometry.dispose();
        if (planet.mesh.material) {
          if (Array.isArray(planet.mesh.material)) {
            planet.mesh.material.forEach(mat => mat.dispose());
          } else {
            planet.mesh.material.dispose();
          }
        }

        // Récupérer les textures
        if (planet.mesh.material && planet.mesh.material.map) {
          planet.mesh.material.map.dispose();
        }

        // Gérer les éléments enfants (nuages, anneaux, etc.)
        while (planet.mesh.children.length > 0) {
          const child = planet.mesh.children[0];
          planet.mesh.remove(child);
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        }
      }
    });

    this.planets = [];
  }
}
