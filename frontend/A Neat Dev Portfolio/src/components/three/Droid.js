import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export const createDroid = (physicsWorld) => {
  const droidGroup = new THREE.Group();

  // Corps principal
  const bodyGeometry = new THREE.SphereGeometry(0.5, 32, 32);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0xFF10F0,          // Rose néon vif (#FF10F0)
    metalness: 0.3,           // Réduit pour moins de reflets métalliques
    roughness: 0.1,           // Surface plus lisse
    emissive: 0xFF10F0,       // Même couleur pour le glow
    emissiveIntensity: 1.2,   // Augmenté pour un effet lumineux
    });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  droidGroup.add(body);

  // Yeux
  const eyeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.5
  });

  const eyeLeft = new THREE.Mesh(eyeGeometry, eyeMaterial);
  const eyeRight = new THREE.Mesh(eyeGeometry, eyeMaterial);

  eyeLeft.position.set(-0.2, 0.2, 0.4);
  eyeRight.position.set(0.2, 0.2, 0.4);

  droidGroup.add(eyeLeft);
  droidGroup.add(eyeRight);

  // Pancarte
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;

  const ctx = canvas.getContext('2d');

  ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#00ffcc";
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

  ctx.font = "bold 56px Arial";
  ctx.fillStyle = "#00ffcc";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("projects ==>", canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const signMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide
  });

  const signGeometry = new THREE.PlaneGeometry(8, 2);
  const sign = new THREE.Mesh(signGeometry, signMaterial);
  sign.position.set(0, 1.2, 0);
  droidGroup.add(sign);

  // Corps physique du droïde
  const droidBody = new CANNON.Body({
    mass: 0.5,
    position: new CANNON.Vec3(0, 0, 0),
    shape: new CANNON.Sphere(0.5),
    material: new CANNON.Material({ restitution: 0.8 })
  });

  physicsWorld.addBody(droidBody);

  const neonGlow = new THREE.PointLight(0xFF10F0, 1.5, 5);
  neonGlow.position.set(0, 0, 0);
  droidGroup.add(neonGlow);

  return { mesh: droidGroup, body: droidBody };
};

export const animateDroid = (droid, cameraPosition) => {
  // Synchronisation position/rotation
  droid.mesh.position.copy(droid.body.position);
  droid.mesh.quaternion.copy(droid.body.quaternion);

  // Orientation de la pancarte
  if (cameraPosition && droid.mesh.children[3]) {
    droid.mesh.children[3].lookAt(cameraPosition);
  }
};
