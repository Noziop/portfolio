export class UIController {
  constructor() {
    this.messageElement = null;
    this.loadingScreen = null;
    this.progressBar = null;
    this.progressFill = null;
    this.statusElement = null;

    // Supprime l'appel à this.createMessageElement() qui cause l'erreur
    this.createLoadingScreen();
  }

  createLoadingScreen() {
    this.loadingScreen = document.createElement('div');
    this.loadingScreen.style.position = 'fixed';
    this.loadingScreen.style.top = '0';
    this.loadingScreen.style.left = '0';
    this.loadingScreen.style.width = '100%';
    this.loadingScreen.style.height = '100%';
    this.loadingScreen.style.backgroundColor = 'rgba(0,0,0,0.9)';
    this.loadingScreen.style.display = 'flex';
    this.loadingScreen.style.flexDirection = 'column';
    this.loadingScreen.style.justifyContent = 'center';
    this.loadingScreen.style.alignItems = 'center';
    this.loadingScreen.style.zIndex = '2000';

    const title = document.createElement('h1');
    title.textContent = 'Préparation de l\'univers...';
    title.style.color = '#ffffff';
    title.style.marginBottom = '20px';
    title.style.fontFamily = 'Arial, sans-serif';

    // Ajouter l'élément de statut avec transition
    this.statusElement = document.createElement('div');
    this.statusElement.textContent = 'Initialisation...';
    this.statusElement.style.color = '#3399ff';
    this.statusElement.style.fontFamily = 'Arial, sans-serif';
    this.statusElement.style.fontSize = '18px';
    this.statusElement.style.marginBottom = '30px';
    this.statusElement.style.textAlign = 'center';
    this.statusElement.style.minHeight = '24px';
    this.statusElement.style.transition = 'opacity 0.3s';

    this.progressBar = document.createElement('div');
    this.progressBar.style.width = '60%';
    this.progressBar.style.height = '10px';
    this.progressBar.style.backgroundColor = '#333333';
    this.progressBar.style.borderRadius = '5px';
    this.progressBar.style.overflow = 'hidden';

    this.progressFill = document.createElement('div');
    this.progressFill.style.width = '0%';
    this.progressFill.style.height = '100%';
    this.progressFill.style.backgroundColor = '#3399ff';
    this.progressFill.style.transition = 'width 0.3s';

    this.progressBar.appendChild(this.progressFill);

    this.loadingScreen.appendChild(title);
    this.loadingScreen.appendChild(this.statusElement);
    this.loadingScreen.appendChild(this.progressBar);

    // Message d'ambiance en bas de l'écran
    const ambientMessage = document.createElement('div');
    ambientMessage.textContent = this.getRandomAmbientMessage();
    ambientMessage.style.color = '#777777';
    ambientMessage.style.fontFamily = 'Arial, sans-serif';
    ambientMessage.style.fontSize = '14px';
    ambientMessage.style.marginTop = '40px';
    ambientMessage.style.fontStyle = 'italic';
    this.loadingScreen.appendChild(ambientMessage);
  }

  showLoadingScreen() {
    if (!this.loadingScreen) {
      this.createLoadingScreen();
    }

    document.body.appendChild(this.loadingScreen);
  }

  hideLoadingScreen() {
    if (this.loadingScreen && this.loadingScreen.parentNode) {
      // Transition de fondu avant de retirer
      this.loadingScreen.style.transition = 'opacity 0.5s';
      this.loadingScreen.style.opacity = '0';

      setTimeout(() => {
        this.loadingScreen.parentNode.removeChild(this.loadingScreen);
      }, 500);
    }
  }

  // Nouvelle méthode pour mettre à jour le message de statut avec effet
  updateLoadingStatus(message) {
    if (this.statusElement) {
      // Effet de transition pour le changement de texte
      this.statusElement.style.opacity = '0';

      setTimeout(() => {
        this.statusElement.textContent = message;
        this.statusElement.style.opacity = '1';
      }, 300);
    }
  }

  updateLoadingProgress(percentage) {
    if (this.progressFill) {
      this.progressFill.style.width = `${percentage}%`;
    }
  }

  // Messages aléatoires pour l'ambiance
  getRandomAmbientMessage() {
    const messages = [
      "L'univers est vaste et rempli de merveilles à découvrir...",
      "La lumière des étoiles lointaines nous parvient après des années...",
      "Les trous noirs déforment l'espace-temps autour d'eux...",
      "La matière noire constitue 85% de la masse de l'univers...",
      "Plus de 100 milliards de galaxies peuplent l'univers observable...",
      "Notre système solaire se trouve dans un bras de la Voie Lactée...",
      "Un voyage vers l'étoile la plus proche prendrait plus de 4 ans à la vitesse de la lumière..."
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  // Affichage de messages dans l'interface
  showMessage(message, duration = 3000) {
    if (!this.messageElement) {
      this.messageElement = document.createElement('div');
      this.messageElement.style.position = 'fixed';
      this.messageElement.style.bottom = '30px';
      this.messageElement.style.left = '50%';
      this.messageElement.style.transform = 'translateX(-50%)';
      this.messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      this.messageElement.style.color = 'white';
      this.messageElement.style.padding = '10px 20px';
      this.messageElement.style.borderRadius = '5px';
      this.messageElement.style.fontFamily = 'Arial, sans-serif';
      this.messageElement.style.zIndex = '1000';
      this.messageElement.style.transition = 'opacity 0.3s';
      document.body.appendChild(this.messageElement);
    }

    this.messageElement.textContent = message;
    this.messageElement.style.opacity = '1';

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    if (duration > 0) {
      this.hideTimeout = setTimeout(() => this.hideMessage(), duration);
    }
  }

  hideMessage() {
    if (this.messageElement) {
      this.messageElement.style.opacity = '0';
    }
  }
}
