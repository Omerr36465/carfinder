// FirebaseConfig.js
import { initializeApp } from '@react-native-firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6",
  authDomain: "sudanstolencarapp.firebaseapp.com",
  projectId: "sudanstolencarapp",
  storageBucket: "sudanstolencarapp.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:android:abc123def456ghi789",
  measurementId: "G-ABCDEF1234"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);

export default app;
