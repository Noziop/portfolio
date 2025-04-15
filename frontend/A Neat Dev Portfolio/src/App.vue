<template>
  <v-app>
    <!-- Splash screen -->
    <SplashScreen v-if="showSplash" @completed="showSplash = false" />

    <!-- Exploration spatiale (visible après le splash screen) -->
    <SpaceScene v-else />
  </v-app>
</template>

<script setup>
import { ref } from 'vue';
import SplashScreen from '@/components/SplashScreen.vue';
import SpaceScene from '@/components/three/SpaceScene.vue';

const showSplash = ref(true);
</script>

<style>
/* Styles globaux */
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden; /* Évite les barres de défilement */
  width: 100%;
  height: 100%;
}

#app {
  width: 100vw;
  height: 100vh;
}

a {
  text-decoration: none;
  color: #F5C6D0;
  transition: color 0.3s ease;
}

a:hover {
  color: #FF007F;
}
</style>
