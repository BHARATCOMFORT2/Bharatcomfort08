// auth.js
import { auth, db } from "../firebase-config.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

// REGISTER
const registerForm = document.getElementById("registerForm");
if(registerForm){
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const role = document.getElementById("role").value;

        try{
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Save role in Firestore
            await setDoc(doc(db, "users", user.uid), {
                name: name,
                email: email,
                role: role,
                assignedListings: []  // For staff/partner assignments later
            });

            alert("Registration successful! Login now.");
            window.location.href = "login.html";
        } catch(error){
            alert(error.message);
        }
    });
}

// LOGIN
const loginForm = document.getElementById("loginForm");
if(loginForm){
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try{
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Get role from Firestore
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if(userDoc.exists()){
                const role = userDoc.data().role;

                // Redirect based on role
                if(role === "superadmin") window.location.href = "dashboard/superadmin.html";
                else if(role === "partner") window.location.href = "dashboard/partner.html";
                else if(role === "staff") window.location.href = "dashboard/staff.html";
                else window.location.href = "dashboard/user.html";
            }
        } catch(error){
            alert(error.message);
        }
    });
}
