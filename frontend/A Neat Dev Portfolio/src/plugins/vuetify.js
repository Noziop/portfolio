// plugins/vuetify.js
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import 'vuetify/styles';
import { aliases, mdi } from 'vuetify/iconsets/mdi';

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        colors: {
          primary: '#F5C6D0', // Rose poudré
          secondary: '#FF007F', // Rose néon
          accent: '#F5F5F5', // Blanc cassé
          background: '#2E2E2E', // Gris anthracite
        },
      },
    },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
});
