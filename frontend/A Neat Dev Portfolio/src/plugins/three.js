// plugins/three.js
import * as THREE from 'three';

export const initThree = (canvas) => {
  // Scène
  const scene = new THREE.Scene();

  // Caméra
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  // Rendu
  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);

  return { scene, camera, renderer };
};
