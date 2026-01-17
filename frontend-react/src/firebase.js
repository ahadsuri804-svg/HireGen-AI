// Firebase initialization (modular SDK v11)
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyCN13vH7rONc8Ll44HC-oZMIQZTT7qXDZY",
  authDomain: "hiregen-ai-35c98.firebaseapp.com",
  projectId: "hiregen-ai-35c98",
  storageBucket: "hiregen-ai-35c98.firebasestorage.app",
  messagingSenderId: "229327756328",
  appId: "1:229327756328:web:439bdbc37b1cd39b1da91d",
  measurementId: "G-JY6721LQJF"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export default app
