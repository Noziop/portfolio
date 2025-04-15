<template>
  <!-- Animation du terminal -->
  <div class="terminal-container" v-show="showTerminal">
    <div class="terminal">
      <div class="terminal-header">
        <div class="terminal-buttons">
          <div class="terminal-button close"></div>
          <div class="terminal-button minimize"></div>
          <div class="terminal-button maximize"></div>
        </div>
        <div class="terminal-title">zsh: ~/portfolio</div>
      </div>
      <div class="terminal-content">
        <div v-for="(line, index) in terminalLines" :key="index" class="line">
          <template v-if="line.type === 'command'">
            <span class="prompt">➜ <span class="directory">~/portfolio</span> <span class="git-branch">(main)</span></span>
            <span class="command">{{ line.text }}</span>
          </template>
          <template v-else>
            <span class="output" :class="line.class">{{ line.text }}</span>
          </template>
        </div>
        <div class="line" v-if="showCommandLine">
          <span class="prompt">➜ <span class="directory">~/portfolio</span> <span class="git-branch">(main)</span></span>
          <span class="command">{{ displayedCommand }}</span>
          <span class="cursor" v-show="showCursor"></span>
        </div>
      </div>
    </div>
  </div>

  <!-- Contenu principal (affiché après l'animation) -->
  <transition name="fade">
    <div class="main-content" v-if="showMainContent">
      <transition name="slide-up">
        <h1 class="name" v-if="showName">Fassih Belmokhtar</h1>
      </transition>

      <transition name="expand">
        <hr class="divider" v-if="showDivider" />
      </transition>

      <transition name="slide-down">
        <p class="tagline" v-if="showTagline">{{ tagline }}</p>
      </transition>
    </div>
  </transition>

  <!-- Bouton de reset -->
  <button v-if="showMainContent" @click="resetAnimation" class="reset-button">
    <v-icon>mdi-refresh</v-icon>
  </button>
</template>

<script>
export default {
  name: 'SplashScreen',
  emits: ['completed'],
  data() {
    return {
      showTerminal: false,
      showMainContent: false,
      showCommandLine: true,
      showCursor: true,
      displayedCommand: '',
      terminalLines: [],
      fullCommand: 'sudo ./activate_website.sh',
      commandIndex: 0,
      typingSpeed: 80, // Légèrement plus rapide
      cursorInterval: null,
      // Nouvelles propriétés pour l'animation séquentielle
      showName: false,
      showDivider: false,
      showTagline: false,
      tagline: "Dès aujourd'hui, construisons ensemble, vos applications de demain."
    }
  },
  mounted() {
    this.startAnimation();
    this.blinkCursor();
  },
  methods: {
    startAnimation() {
      // Affiche le terminal
      this.showTerminal = true;

      // Tape la commande
      this.typeCommand(this.fullCommand, () => {
        this.terminalLines.push({
          type: 'command',
          text: this.fullCommand
        });

        // Cache la ligne de commande active
        this.showCommandLine = false;

        // Simule l'exécution avec les 3 étapes
        setTimeout(() => this.executeStep1(), 250); // Accéléré
      });
    },
    blinkCursor() {
      this.cursorInterval = setInterval(() => {
        this.showCursor = !this.showCursor;
      }, 500);
    },
    typeCommand(command, callback) {
      this.commandIndex = 0;
      this.displayedCommand = '';

      const typeNextChar = () => {
        if (this.commandIndex < command.length) {
          this.displayedCommand += command[this.commandIndex];
          this.commandIndex++;
          setTimeout(typeNextChar, this.typingSpeed * (Math.random() * 0.5 + 0.5)); // Vitesse aléatoire pour effet réaliste
        } else {
          callback();
        }
      };

      typeNextChar();
    },
    executeStep1() {
      // Étape 1: Activation de la base de données
      this.terminalLines.push({
        type: 'output',
        text: '🔄 Initialisation de la base de données MariaDB...'
      });

      setTimeout(() => {
        this.terminalLines.push({
          type: 'output',
          text: '[ 1/6 ] Checking MariaDB service...'
        });

        setTimeout(() => {
          this.terminalLines.push({
            type: 'output',
            text: '[ 2/6 ] Starting MariaDB service...'
          });

          setTimeout(() => {
            this.terminalLines.push({
              type: 'output',
              text: '[ 3/6 ] Initializing database schema...'
            });

            setTimeout(() => {
              this.terminalLines.push({
                type: 'output',
                class: 'success',
                text: '✅ Base de données activée avec succès!'
              });

              setTimeout(() => this.executeStep2(), 300); // Accéléré
            }, 300); // Accéléré
          }, 300); // Accéléré
        }, 300); // Accéléré
      }, 300); // Accéléré
    },
    executeStep2() {
      // Étape 2: Activation du backend FastAPI
      this.terminalLines.push({
        type: 'output',
        text: '🔄 Démarrage du backend FastAPI...'
      });

      setTimeout(() => {
        this.terminalLines.push({
          type: 'output',
          text: '[ 4/6 ] Creating virtual environment...'
        });

        setTimeout(() => {
          this.terminalLines.push({
            type: 'output',
            text: 'INFO:     Application startup complete.'
          });

          setTimeout(() => {
            this.terminalLines.push({
              type: 'output',
              text: 'INFO:     Uvicorn running on http://127.0.0.1:8000'
            });

            setTimeout(() => {
              this.terminalLines.push({
                type: 'output',
                class: 'success',
                text: '✅ Backend FastAPI démarré avec succès!'
              });

              setTimeout(() => this.executeStep3(), 300); // Accéléré
            }, 300); // Accéléré
          }, 300); // Accéléré
        }, 300); // Accéléré
      }, 300); // Accéléré
    },
    executeStep3() {
      // Étape 3: Activation du frontend
      this.terminalLines.push({
        type: 'output',
        text: '🔄 Construction du frontend...'
      });

      setTimeout(() => {
        this.terminalLines.push({
          type: 'output',
          text: '[ 5/6 ] npm run build'
        });

        setTimeout(() => {
          this.terminalLines.push({
            type: 'output',
            text: 'vite v6.2.6 building for production...'
          });

          setTimeout(() => {
            this.terminalLines.push({
              type: 'output',
              text: '✓ 382 modules transformed.'
            });

            setTimeout(() => {
              this.terminalLines.push({
                type: 'output',
                text: '[ 6/6 ] Application déployée'
              });

              setTimeout(() => {
                this.terminalLines.push({
                  type: 'output',
                  class: 'success',
                  text: '✅ Frontend construit et déployé avec succès!'
                });

                setTimeout(() => this.completeAnimation(), 800); // Accéléré
              }, 300); // Accéléré
            }, 300); // Accéléré
          }, 300); // Accéléré
        }, 300); // Accéléré
      }, 300); // Accéléré
    },
    completeAnimation() {
      // Message de succès final
      this.terminalLines.push({
        type: 'output',
        class: 'success',
        text: '🚀 Site web activé avec succès! Redirection vers l\'interface...'
      });

      // Attendre puis fermer le terminal
      setTimeout(() => {
        this.showTerminal = false;
        clearInterval(this.cursorInterval);

        // Afficher le contenu principal
        this.showMainContent = true;

        // Animation du nom (apparaît du bas vers le haut maintenant)
        setTimeout(() => {
          this.showName = true;

          // Animation de la ligne horizontale (apparaît en s'étendant)
          setTimeout(() => {
            this.showDivider = true;

            // Animation de la tagline (apparaît du haut vers le bas maintenant)
            setTimeout(() => {
              this.showTagline = true;

              // Redirection vers la page d'accueil après un court délai
              setTimeout(() => {
                this.$emit('completed');
                // Si vous utilisez Vue Router, vous pouvez aussi faire:
                this.$router?.push('/');
              }, 3000);
            }, 800);
          }, 400);
        }, 200);
      }, 1000);
    },
    // Pour le bouton de relance
    resetAnimation() {
      this.showMainContent = false;
      this.showName = false;
      this.showDivider = false;
      this.showTagline = false;
      this.terminalLines = [];
      this.displayedCommand = '';
      this.showCommandLine = true;
      this.startAnimation();
      this.blinkCursor();
    }
  }
}
</script>

<style scoped>
.terminal-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.85);
  z-index: 9999;
}

.terminal {
  width: 80%;
  max-width: 800px;
  height: 500px;
  background-color: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.terminal-header {
  height: 30px;
  background-color: #2E2E2E;
  display: flex;
  align-items: center;
  padding: 0 10px;
}

.terminal-buttons {
  display: flex;
  gap: 8px;
}

.terminal-button {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.terminal-button.close { background-color: #ff5f56; }
.terminal-button.minimize { background-color: #ffbd2e; }
.terminal-button.maximize { background-color: #27c93f; }

.terminal-title {
  flex-grow: 1;
  text-align: center;
  color: #ccc;
  font-size: 14px;
}

.terminal-content {
  padding: 15px;
  height: calc(100% - 30px);
  overflow-y: auto;
  font-family: "Menlo", "Monaco", monospace;
  font-size: 14px;
  line-height: 1.5;
  color: #fff;
}

/* Thème af-magic */
.prompt {
  color: #87ff00;
}

.directory {
  color: #6699cc;
}

.git-branch {
  color: #ff5555;
}

.command {
  color: #f8f8f2;
}

.output {
  color: #cccccc;
}

.output.success {
  color: #87ff00;
}

.output.error {
  color: #ff5555;
}

.output.warning {
  color: #ffbd2e;
}

.cursor {
  display: inline-block;
  width: 10px;
  height: 18px;
  background-color: #f8f8f2;
  animation: blink 1s step-end infinite;
  vertical-align: middle;
  margin-left: 2px;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* Styles pour le contenu principal */
.main-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #2E2E2E; /* Gris anthracite */
  color: #F5F5F5; /* Blanc cassé */
  padding: 20px;
  text-align: center;
}

.name {
  font-size: 4rem;
  margin-bottom: 20px;
  font-weight: 600;
  letter-spacing: 2px;
  color: #F5C6D0; /* Rose poudré */
}

.divider {
  width: 550px;
  height: 2px;
  background-color: #FF007F; /* Rose néon */
  border: none;
  margin-bottom: 20px;
}

.tagline {
  font-size: 1.5rem;
  max-width: 800px;
  line-height: 1.5;
}

.reset-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(46, 46, 46, 0.8);
  backdrop-filter: blur(5px);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #F5C6D0; /* Rose poudré */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  z-index: 100;
}

.reset-button:hover {
  transform: scale(1.1);
  color: #FF007F; /* Rose néon */
}

/* Nouvelles animations plus fluides avec cubic-bezier */
/* Animation du nom (de bas en haut) */
.slide-up-enter-active {
  transition: all 0.8s cubic-bezier(0.215, 0.610, 0.355, 1.000);
  will-change: transform, opacity;
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(50px);
}

/* Animation de la ligne horizontale (s'étend depuis le centre) */
.expand-enter-active {
  transition: all 0.8s cubic-bezier(0.215, 0.610, 0.355, 1.000);
  will-change: width, opacity;
}
.expand-enter-from {
  width: 0;
  opacity: 0;
}

/* Animation de la tagline (de haut en bas) */
.slide-down-enter-active {
  transition: all 0.8s cubic-bezier(0.215, 0.610, 0.355, 1.000);
  will-change: transform, opacity;
}
.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-50px);
}

/* Transitions globales */
.fade-enter-active, .fade-leave-active {
  transition: opacity 1s cubic-bezier(0.215, 0.610, 0.355, 1.000);
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
