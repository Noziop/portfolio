import * as THREE from 'three';
import { UniverseConfig } from '@/config/universe.config';

export function initThree(canvas) {
  // Créer la scène
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // Créer la caméra avec les paramètres de configuration
  const camera = new THREE.PerspectiveCamera(
    UniverseConfig.camera.fov || 75,
    window.innerWidth / window.innerHeight,
    UniverseConfig.camera.near || 0.1,
    UniverseConfig.camera.far || 10000
  );

  // Créer le renderer avec optimisations
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance'
  });

  renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMappingExposure = 1.2;

  // Optimisations selon la configuration
  if (UniverseConfig.performance.adaptiveResolution) {
    renderer.setPixelRatio(1); // Plus basse résolution pour meilleures performances
  }

  if (!UniverseConfig.performance.useShadows) {
    renderer.shadowMap.enabled = false;
  }

  return { scene, camera, renderer };
}
