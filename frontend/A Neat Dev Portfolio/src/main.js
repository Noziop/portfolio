import { createApp } from 'vue';
import App from './App.vue';
import vuetify from './plugins/vuetify';

const app = createApp(App);

// Utilisation de Vuetify pour les pop-ups
app.use(vuetify);

app.mount('#app');
