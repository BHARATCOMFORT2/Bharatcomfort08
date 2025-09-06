// partner.js
import { auth, db } from "../firebase-config.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";
import { collection, addDoc, getDocs, query, where, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

// Logout
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "../login.html";
});

// Track partner UID
let partnerId = null;

onAuthStateChanged(auth, (user) => {
  if(user){
    partnerId = user.uid;
    loadMyListings();
  } else {
    window.location.href = "../login.html";
  }
});

// Add Listing
const addListingForm = document.getElementById("addListingForm");
if(addListingForm){
  addListingForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("title").value;
    const details = document.getElementById("details").value;
    const services = document.getElementById("services").value.split(",");
    const price = parseInt(document.getElementById("price").value);

    try{
      await addDoc(collection(db, "listings"), {
        title: title,
        details: details,
        services: services,
        price: price,
        owner: partnerId,
        status: "Pending",
        staffAssigned: [],
        createdAt: new Date()
      });
      alert("Listing submitted for approval!");
      addListingForm.reset();
      loadMyListings();
    } catch(error){
      alert(error.message);
    }
  });
}

// Load Partner Listings
async function loadMyListings(){
  const tableBody = document.querySelector("#partnerListings tbody");
  tableBody.innerHTML = "";

  const q = query(collection(db, "listings"), where("owner", "==", partnerId));
  const snapshot = await getDocs(q);

  snapshot.forEach((docSnap) => {
    const listing = docSnap.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${listing.title}</td>
      <td>${listing.status}</td>
      <td>${listing.price}</td>
      <td>
        <button onclick="editListing('${docSnap.id}', '${listing.title}', '${listing.details}', '${listing.price}')">Edit</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

// Edit Listing
window.editListing = async function(listingId, title, details, price){
  const newTitle = prompt("Edit Title:", title);
  const newDetails = prompt("Edit Details:", details);
  const newPrice = prompt("Edit Price:", price);

  if(newTitle && newDetails && newPrice){
    await updateDoc(doc(db, "listings", listingId), {
      title: newTitle,
      details: newDetails,
      price: parseInt(newPrice)
    });
    alert("Listing updated!");
    loadMyListings();
  }
}
import { getDocs } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

async function loadPartnerBookings(){
  const tableBody = document.querySelector("#partnerBookings tbody");
  tableBody.innerHTML = "";

  const snapshot = await getDocs(collection(db, "bookings"));
  for (let bookingDoc of snapshot.docs){
    const booking = bookingDoc.data();
    const listingSnap = await getDoc(doc(db, "listings", booking.listingId));

    if(listingSnap.exists() && listingSnap.data().owner === partnerId){
      const listing = listingSnap.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${booking.name}</td>
        <td>${listing.title}</td>
        <td>${booking.date}</td>
        <td>${booking.guests}</td>
        <td>${booking.status}</td>
      `;
      tableBody.appendChild(tr);
    }
  }
}

loadPartnerBookings();
import { collection, query, where, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

async function loadNotifications(userId){
  const container = document.getElementById("notificationList");
  container.innerHTML = "";

  const q = query(collection(db, "notifications"), where("toUser", "==", userId));
  const snapshot = await getDocs(q);

  snapshot.forEach(async (docSnap) => {
    const notif = docSnap.data();
    const div = document.createElement("div");
    div.classList.add("notification");
    div.innerHTML = `
      <p>${notif.message}</p>
      <a href="${notif.link}">View</a>
    `;
    container.appendChild(div);

    // Mark as read
    await updateDoc(doc(db, "notifications", docSnap.id), { read: true });
  });
}

window.toggleNotifications = function(){
  document.getElementById("notificationList").classList.toggle("hidden");
}

// Call after login
onAuthStateChanged(auth, (user) => {
  if(user){
    loadNotifications(user.uid);
  }
});
