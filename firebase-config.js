// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBVZBxXn4HVw-c8z8J0NaPj9X5qf_xtjrw",
  authDomain: "doodle-meet.firebaseapp.com",
  projectId: "doodle-meet",
  storageBucket: "doodle-meet.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456ghi789",
  databaseURL: "https://doodle-meet.firebaseio.com",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get references to Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Configure Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.addScope("profile");
googleProvider.addScope("email");

// Configure Facebook Auth Provider
const facebookProvider = new firebase.auth.FacebookAuthProvider();
facebookProvider.addScope("email");
facebookProvider.addScope("public_profile");
