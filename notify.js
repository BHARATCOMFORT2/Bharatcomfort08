import { db } from "../firebase-config.js";
import { addDoc, collection } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

export async function sendNotification(toUser, message, link){
  await addDoc(collection(db, "notifications"), {
    toUser,
    message,
    link,
    read: false,
    createdAt: new Date()
  });
}
