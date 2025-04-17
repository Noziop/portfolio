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

  // Création d'un anneau avec apparence 3D améliorée
addRing(position, options = {}) {
  const config = { ...this.defaultOptions, ...options };

  // Augmenter la résolution de la géométrie pour des anneaux plus lisses
  const geometry = new THREE.TorusGeometry(
    config.radius,       // radius
    config.tube,         // tube
    32,                  // radialSegments (plus élevé pour plus de détails)
    128                  // tubularSegments (plus élevé pour plus de détails)
  );

  // Utiliser MeshPhongMaterial ou MeshStandardMaterial pour la réactivité à la lumière
  const material = new THREE.MeshPhongMaterial({
    color: config.color,
    transparent: true,
    opacity: 0.9,
    shininess: 100,        // Augmente la brillance
    specular: 0xffffff,    // Ajoute des reflets blancs
    emissive: config.color, // Émission de lumière de la couleur de base
    emissiveIntensity: 0.4, // Intensité modérée de l'émission
    side: THREE.DoubleSide  // Rend les deux côtés visibles
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
addTextToRing(ring, topText, bottomText, letterSpacing = 1) {
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

  // Fonction utilitaire pour créer du texte avec espacement personnalisé
  const createTextWithCustomSpacing = (text, size, height, depth, bevelThickness, bevelSize, color) => {
    const group = new THREE.Group();
    let xOffset = 0;

    // Matériau commun pour toutes les lettres
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide
    });

    // Créer chaque lettre individuellement
    for (let i = 0; i < text.length; i++) {
      const letter = text[i];

      // Ignorer les espaces mais tenir compte de leur largeur
      if (letter === ' ') {
        xOffset += size * 0.6; // Largeur approximative d'un espace
        continue;
      }

      const letterGeo = new TextGeometry(letter, {
        font: this.font,
        size: size,
        height: height,
        depth: depth,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: bevelThickness,
        bevelSize: bevelSize,
        bevelOffset: 0,
        bevelSegments: 5
      });

      // Calculer la largeur de la lettre
      letterGeo.computeBoundingBox();
      const letterWidth = letterGeo.boundingBox.max.x - letterGeo.boundingBox.min.x;

      // Créer le mesh pour cette lettre
      const letterMesh = new THREE.Mesh(letterGeo, material);
      letterMesh.position.x = xOffset;

      // Ajouter au groupe
      group.add(letterMesh);

      // Mettre à jour la position pour la prochaine lettre, en ajoutant l'espacement personnalisé
      xOffset += letterWidth + letterSpacing;
    }

    // Centrer tout le groupe de texte
    const totalWidth = xOffset - letterSpacing; // Soustraire le dernier espacement ajouté
    for (let i = 0; i < group.children.length; i++) {
      group.children[i].position.x -= totalWidth / 2;
    }

    return group;
  };

  // Création du texte du haut avec espacement personnalisé
  if (topText) {
    const topTextGroup = createTextWithCustomSpacing(
      topText,
      6, // size
      10, // height
      0.8, // depth
      0.5, // bevelThickness
      0.3, // bevelSize
      ring.color // color
    );

    // Positionner le groupe de texte
    topTextGroup.position.set(0, ring.radius + 8, 0);

    // Rotation pour afficher la face avant
    topTextGroup.rotation.x = Math.PI;
    topTextGroup.rotation.z = Math.PI;

    // Ajouter à l'anneau
    ring.mesh.add(topTextGroup);
    ring.topTextMesh = topTextGroup;
  }

  // Création du texte du bas avec le même espacement personnalisé
  if (bottomText) {
    const bottomTextGroup = createTextWithCustomSpacing(
      bottomText,
      4, // size
      10, // height
      0.8, // depth
      0.3, // bevelThickness
      0.2, // bevelSize
      ring.color // color
    );

    // Positionner le groupe de texte
    bottomTextGroup.position.set(0, -ring.radius - 8, 0);

    // Rotation pour afficher la face avant
    bottomTextGroup.rotation.x = Math.PI;
    bottomTextGroup.rotation.z = Math.PI;

    // Ajouter à l'anneau
    ring.mesh.add(bottomTextGroup);
    ring.bottomTextMesh = bottomTextGroup;
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

    // Dégradé circulaire pour particules très lumineuses
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');    // Centre blanc pur
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.9)'); // Haute intensité
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.5)'); // Fondu moins abrupt
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');     // Bord transparent
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    const sprite = new THREE.CanvasTexture(canvas);

    // Matériau avec la couleur de l'anneau
    const material = new THREE.PointsMaterial({
      size: 1.2,                    // Particules plus grandes
      map: sprite,
      transparent: true,            // Activer la transparence
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,        // Taille varie avec la distance
      color: new THREE.Color(ring.color).multiplyScalar(1.8), // Couleur plus intense
      vertexColors: false
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

      // Animer l'anneau
      ring.mesh.material.opacity = baseOpacity + Math.sin(time * speed + ring.mesh.position.x) * pulse;

      // Faire pulser les textes également - gestion des groupes de lettres
      if (ring.topTextMesh) {
        // Si c'est un groupe (avec enfants/lettres)
        if (ring.topTextMesh.children && ring.topTextMesh.children.length > 0) {
          ring.topTextMesh.children.forEach(letterMesh => {
            if (letterMesh.material) {
              letterMesh.material.opacity = baseOpacity + Math.sin(time * speed + ring.mesh.position.x) * pulse;
            }
          });
        }
        // Si c'est un mesh simple avec un seul matériau
        else if (ring.topTextMesh.material) {
          ring.topTextMesh.material.opacity = baseOpacity + Math.sin(time * speed + ring.mesh.position.x) * pulse;
        }
      }

      // Même traitement pour le texte du bas
      if (ring.bottomTextMesh) {
        // Si c'est un groupe (avec enfants/lettres)
        if (ring.bottomTextMesh.children && ring.bottomTextMesh.children.length > 0) {
          ring.bottomTextMesh.children.forEach(letterMesh => {
            if (letterMesh.material) {
              letterMesh.material.opacity = baseOpacity + Math.sin(time * speed + ring.mesh.position.x) * pulse;
            }
          });
        }
        // Si c'est un mesh simple avec un seul matériau
        else if (ring.bottomTextMesh.material) {
          ring.bottomTextMesh.material.opacity = baseOpacity + Math.sin(time * speed + ring.mesh.position.x) * pulse;
        }
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
