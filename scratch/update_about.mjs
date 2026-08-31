import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBVmSAxOR4nZxvzMZZS1uH4II_sdoJSQ1g",
  authDomain: "bishal-mishra-3c559.firebaseapp.com",
  projectId: "bishal-mishra-3c559",
  storageBucket: "bishal-mishra-3c559.firebasestorage.app",
  messagingSenderId: "459193835216",
  appId: "1:459193835216:web:32de44a9f2d52ed80b88d5",
  measurementId: "G-V89CSR1TXR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const newBio = "Hi! I'm Bishal, a full-stack developer based in Nepal. I've spent the past 3+ years designing and building web solutions that bridge the gap between clean, scalable backends and fast, intuitive user interfaces. I love taking complex business ideas and turning them into solid, maintainable code.\n\nTo me, engineering isn't just about using the latest framework; it's about solving real-world problems, optimizing for the user experience, and ensuring that everything is secure, fast, and easy to maintain. I work primarily with Next.js, React, Node.js, and cloud ecosystems, building everything from custom APIs to full e-commerce architectures.";

async function run() {
  console.log("Updating Firestore about settings...");
  await setDoc(doc(db, 'settings', 'about'), {
    title: 'Full-Stack Web Architect',
    experience: '3+ Years',
    bio: newBio,
    phone: '+977 9827801575',
    email: 'developer@bishalcodes.com',
    imageUrl: 'https://www.bishalcodes.com/bishal.png',
    images: ['https://www.bishalcodes.com/bishal.png'],
    projectsCompleted: '300+',
    whatsappUrl: 'https://wa.me/9779827801575'
  }, { merge: true });
  console.log("Updated about settings successfully!");
  process.exit(0);
}

run().catch(err => {
  console.error("Firestore update failed:", err);
  process.exit(1);
});
