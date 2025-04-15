<!-- FixedHeader.vue -->
<template>
  <div class="centered-header">
    <h1 class="name">Fassih Belmokhtar</h1>
    <h2 class="subtitle">Créateur d'expériences numériques exceptionnelles</h2>
  </div>
</template>

<style scoped>
.centered-header {
  position: absolute;
  top: 10%;
  left: 0;
  width: 100%;
  text-align: center;
  z-index: 10;
  pointer-events: none; /* Permet de cliquer à travers */
}

.name {
  font-family: 'Orbitron', sans-serif;
  font-size: 3rem;
  color: #00f3ff;
  text-shadow: 0 0 15px rgba(0, 243, 255, 0.7);
  margin-bottom: 0.5rem;
  letter-spacing: 3px;
}

.subtitle {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.5rem;
  color: #ffffff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  letter-spacing: 2px;
}
</style>
