import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

export class RingSystem {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.rings = [];
    this.defaultOptions = {
      radius: 35,
      tube: 2,
      color: 0x00ffcc,
      particlesCount: 200, // Augmenté pour un effet plus dense
      ...options
    };

    // Initialisation du chargeur de police
    this.fontLoader = new FontLoader();
    this.font = null;

    // Chargement de la police
    this.loadFont();
  }

  // Méthode pour charger la police
  loadFont() {
    this.fontLoader.load('/fonts/helvetiker_bold.typeface.json', (font) => {
      this.font = font;
      console.log('Police chargée avec succès');

      // Si des anneaux existent déjà, on peut ajouter des textes
      if (this.rings.length > 0) {
        this.rings.forEach(ring => {
          if (ring.textData) {
            this.addTextToRing(
              ring,
              ring.textData.topText,
              ring.textData.bottomText
            );
          }
        });
      }
    });
  }

  // Création d'un anneau simple mais fonctionnel
  addRing(position, options = {}) {
    const config = { ...this.defaultOptions, ...options };
    const geometry = new THREE.TorusGeometry(config.radius, config.tube, 16, 100);
    const material = new THREE.MeshBasicMaterial({
      color: config.color,
      transparent: true,
      opacity: 0.8
    });

    const ring = new THREE.Mesh(geometry, material);
    ring.position.copy(position);

    this.scene.add(ring);

    // Stocker l'anneau avec plus d'informations
    const ringData = {
      mesh: ring,
      position: position.clone(),
      color: config.color,
      radius: config.radius,
      tube: config.tube,
      onCollide: config.onCollide,
      textData: null // Sera rempli si des textes sont ajoutés
    };

    this.rings.push(ringData);

    const particles = this.createParticles(ringData);

    return ringData;
  }

// Nouvelle méthode pour ajouter des textes à un anneau
addTextToRing(ring, topText, bottomText) {
    // Stocker les informations de texte
    ring.textData = {
        topText: topText,
        bottomText: bottomText
    };

    // Si la police n'est pas encore chargée, on attend
    if (!this.font) {
        console.log('Police non chargée, les textes seront ajoutés plus tard');
        return;
    }

    // Création du texte du haut
    if (topText) {
        const topTextGeometry = new TextGeometry(topText, {
            font: this.font,
            size: 6,
            height: 10,
            depth: 0.9,
            opacity: 3,
            transparent: false,
            blending: THREE.AdditiveBlending,
            curveSegments: 1000,
            bevelEnabled: false
        });

        // Centrer le texte
        topTextGeometry.computeBoundingBox();
        const topTextWidth = topTextGeometry.boundingBox.max.x - topTextGeometry.boundingBox.min.x;
        topTextGeometry.translate(-topTextWidth / 2, 0, 0);

        const topTextMaterial = new THREE.MeshBasicMaterial({
            color: ring.color,
            transparent: false,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });

        const topTextMesh = new THREE.Mesh(topTextGeometry, topTextMaterial);
        topTextMesh.position.set(0, ring.radius + 8, 0);

        topTextMesh.rotation.y = Math.PI;

        ring.mesh.add(topTextMesh);
        ring.topTextMesh = topTextMesh;
    }

    // Création du texte du bas
    if (bottomText) {
        const bottomTextGeometry = new TextGeometry(bottomText, {
            font: this.font,
            size: 4,
            height: 10,  // Réduit à presque plat
            depth: 1,   // Réduit à presque plat
            curveSegments: 1000,
            bevelEnabled: false
        });

        // Centrer le texte
        bottomTextGeometry.computeBoundingBox();
        const bottomTextWidth = bottomTextGeometry.boundingBox.max.x - bottomTextGeometry.boundingBox.min.x;
        bottomTextGeometry.translate(-bottomTextWidth / 2, 0, 0);

        const bottomTextMaterial = new THREE.MeshBasicMaterial({
            color: ring.color,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });

        const bottomTextMesh = new THREE.Mesh(bottomTextGeometry, bottomTextMaterial);
        bottomTextMesh.position.set(0, -ring.radius - 8, 0);

        bottomTextMesh.rotation.y = Math.PI;

        ring.mesh.add(bottomTextMesh);
        ring.bottomTextMesh = bottomTextMesh;
    }
}

createParticles(ring) {
    const particlesCount = this.defaultOptions.particlesCount;
    const geometry = new THREE.BufferGeometry();

    // Création d'une texture circulaire pour des particules douces
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    // Dégradé circulaire pour particules douces
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    const sprite = new THREE.CanvasTexture(canvas);

    // Matériau avec la couleur de l'anneau
    const material = new THREE.PointsMaterial({
        size: 0.8, // Particules plus petites pour un rendu plus fin
        map: sprite,
        transparent: false,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        color: ring.color
    });

    // Positions et autres attributs
    const positions = new Float32Array(particlesCount * 3);
    const sizes = new Float32Array(particlesCount);
    const speeds = new Float32Array(particlesCount);

    const innerRadius = ring.radius - ring.tube; // Rayon intérieur de l'anneau

    for (let i = 0; i < particlesCount; i++) {
        // Position sur le bord INTÉRIEUR de l'anneau
        const angle = Math.random() * Math.PI * 2;

        // Le rayon varie légèrement autour du bord intérieur
        // Ajout d'un petit décalage vers l'intérieur pour que les particules viennent bien du bord
        const radialOffset = innerRadius * (0.95 + Math.random() * 0.1);

        positions[i * 3] = Math.cos(angle) * radialOffset;
        positions[i * 3 + 1] = Math.sin(angle) * radialOffset;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5; // Légère épaisseur en Z

        // Tailles variées des particules
        sizes[i] = 0.3 + Math.random() * 0.7;

        // Vitesses variables
        speeds[i] = 0.2 + Math.random() * 0.3;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particles = new THREE.Points(geometry, material);
    particles.userData = {
        speeds: speeds,
        innerRadius: innerRadius
    };

    ring.mesh.add(particles);
    return particles;
}

  // Animation
  animate() {
    this.rings.forEach(ring => {

      // --- AJOUT DE LA PULSATION ---
      const time = Date.now() * 0.001;
      const baseOpacity = 0.8;
      const pulse = 0.05; // Amplitude de la pulsation
      const speed = 2.8;   // Vitesse de la pulsation
      ring.mesh.material.opacity = baseOpacity + Math.sin(time * speed + ring.mesh.position.x) * pulse;

      // Faire pulser les textes également
      if (ring.topTextMesh) {
        ring.topTextMesh.material.opacity = baseOpacity + Math.sin(time * speed + ring.mesh.position.x) * pulse;
      }
      if (ring.bottomTextMesh) {
        ring.bottomTextMesh.material.opacity = baseOpacity + Math.sin(time * speed + ring.mesh.position.x) * pulse;
      }

      // Animation des particules
      const particles = ring.mesh.children[0]; // Premier enfant = particules
      if (particles && particles instanceof THREE.Points) {
        const positions = particles.geometry.attributes.position.array;
        const sizes = particles.geometry.attributes.size?.array;
        const speeds = particles.userData.speeds;
        const innerRadius = particles.userData.innerRadius;

        for (let i = 0; i < positions.length / 3; i++) {
          const i3 = i * 3;

          // Position actuelle
          const x = positions[i3];
          const y = positions[i3 + 1];

          // Distance au centre
          const distanceToCenter = Math.sqrt(x*x + y*y);

          if (distanceToCenter > 0) {
            // Direction vers le centre (vecteur normalisé)
            const dirX = -x / distanceToCenter;
            const dirY = -y / distanceToCenter;

            // Accélération qui augmente quand on s'approche du centre (effet d'aspiration)
            const acceleration = 0.05 + (innerRadius - distanceToCenter) / innerRadius;

            // Déplacer la particule vers le centre
            positions[i3] += dirX * speeds[i] * acceleration;
            positions[i3 + 1] += dirY * speeds[i] * acceleration;

            // Faire varier la taille selon la distance (plus petite en approchant du centre)
            if (sizes) {
              sizes[i] = 0.3 + (distanceToCenter / innerRadius) * 0.7;
            }

            // Si la particule est très proche du centre, la replacer sur le bord intérieur
            if (distanceToCenter < 1) {
              const newAngle = Math.random() * Math.PI * 2;
              positions[i3] = Math.cos(newAngle) * innerRadius * 0.95;
              positions[i3 + 1] = Math.sin(newAngle) * innerRadius * 0.95;
              positions[i3 + 2] = (Math.random() - 0.5) * 0.5;

              if (sizes) {
                sizes[i] = 0.3 + Math.random() * 0.7;
              }
            }
          }
        }

        particles.geometry.attributes.position.needsUpdate = true;
        if (sizes) particles.geometry.attributes.size.needsUpdate = true;
      }
    });
  }

  // Vérification des collisions avec le vaisseau
  checkCollisions(shipPosition) {
    this.rings.forEach((ring, index) => {
      const distance = shipPosition.distanceTo(ring.position);
      if (distance < 20 && ring.onCollide) {
        ring.onCollide();
      }
    });
  }

  // Nettoyage
  clearAll() {
    this.rings.forEach(ring => {
      this.scene.remove(ring.mesh);
      if (ring.mesh.geometry) ring.mesh.geometry.dispose();
      if (ring.mesh.material) ring.mesh.material.dispose();

      // Nettoyer les textes
      if (ring.topTextMesh) {
        if (ring.topTextMesh.geometry) ring.topTextMesh.geometry.dispose();
        if (ring.topTextMesh.material) ring.topTextMesh.material.dispose();
      }
      if (ring.bottomTextMesh) {
        if (ring.bottomTextMesh.geometry) ring.bottomTextMesh.geometry.dispose();
        if (ring.bottomTextMesh.material) ring.bottomTextMesh.material.dispose();
      }

      // Nettoyer les particules
      if (ring.mesh.children.length > 0) {
        const particles = ring.mesh.children[0];
        if (particles && particles.geometry) particles.geometry.dispose();
        if (particles && particles.material) particles.material.dispose();
      }
    });
    this.rings = [];
  }
}
