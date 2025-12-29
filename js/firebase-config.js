/**
 * Configuration Firebase pour la galerie partagée
 * 
 * INSTRUCTIONS:
 * 1. Allez sur https://console.firebase.google.com/
 * 2. Créez un nouveau projet (gratuit)
 * 3. Ajoutez une application Web
 * 4. Copiez les valeurs de configuration ci-dessous
 * 5. Activez Firestore Database (mode test)
 * 6. Activez Storage (mode test)
 */

const firebaseConfig = {
    apiKey: "AIzaSyDxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxX",
    authDomain: "votre-projet.firebaseapp.com",
    projectId: "votre-projet",
    storageBucket: "votre-projet.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456789"
};

// Initialize Firebase
let db = null;
let storage = null;
let firebaseInitialized = false;

function initFirebase() {
    try {
        // Check if config is valid (not placeholder values)
        if (firebaseConfig.apiKey.includes('XxXxXx') || firebaseConfig.projectId === 'votre-projet') {
            console.warn('Firebase non configuré. La galerie fonctionne en mode local.');
            return false;
        }
        
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        storage = firebase.storage();
        firebaseInitialized = true;
        console.log('Firebase initialisé avec succès');
        return true;
    } catch (error) {
        console.error('Erreur initialisation Firebase:', error);
        return false;
    }
}

// Initialize on load
initFirebase();
