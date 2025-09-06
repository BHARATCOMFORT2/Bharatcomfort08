// staff.js
import { auth, db } from "../firebase-config.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

// Logout
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "../login.html";
});

let staffId = null;
let assignedListings = [];

// When staff logs in, load assigned listings
onAuthStateChanged(auth, async (user) => {
  if(user){
    staffId = user.uid;

    const userDoc = await getDoc(doc(db, "users", staffId));
    if(userDoc.exists()){
      assignedListings = userDoc.data().assignedListings || [];
      loadAssignedListings();
      loadReviews();
    }
  } else {
    window.location.href = "../login.html";
  }
});

// Load Assigned Listings
async function loadAssignedListings(){
  const tableBody = document.querySelector("#staffListings tbody");
  tableBody.innerHTML = "";

  for(let listingId of assignedListings){
    const listingDoc = await getDoc(doc(db, "listings", listingId));
    if(listingDoc.exists()){
      const listing = listingDoc.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${listing.title}</td>
        <td>${listing.price}</td>
        <td>${listing.services.join(", ")}</td>
        <td>
          <button onclick="editListing('${listingId}', '${listing.title}', '${listing.details}', '${listing.price}')">Edit</button>
        </td>
      `;
      tableBody.appendChild(tr);
    }
  }
}

// Edit Listing (Staff cannot delete)
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
    alert("Listing updated by Staff!");
    loadAssignedListings();
  }
}

// Load Reviews for Assigned Listings
async function loadReviews(){
  const container = document.getElementById("reviewsContainer");
  container.innerHTML = "";

  for(let listingId of assignedListings){
    const listingDoc = await getDoc(doc(db, "listings", listingId));
    if(listingDoc.exists()){
      const listing = listingDoc.data();

      if(listing.reviews && listing.reviews.length > 0){
        const section = document.createElement("div");
        section.innerHTML = `<h3>${listing.title}</h3>`;

        listing.reviews.forEach((review, index) => {
          const reviewDiv = document.createElement("div");
          reviewDiv.style.border = "1px solid #ccc";
          reviewDiv.style.margin = "10px 0";
          reviewDiv.style.padding = "10px";

          reviewDiv.innerHTML = `
            <p><strong>User:</strong> ${review.user}</p>
            <p><strong>Comment:</strong> ${review.comment}</p>
            <p><strong>Reply:</strong> ${review.reply || "No reply yet"}</p>
            <button onclick="replyReview('${listingId}', ${index})">Reply</button>
          `;
          section.appendChild(reviewDiv);
        });

        container.appendChild(section);
      }
    }
  }
}

// Reply to Review
window.replyReview = async function(listingId, reviewIndex){
  const replyText = prompt("Enter your reply:");
  if(replyText){
    const listingDoc = await getDoc(doc(db, "listings", listingId));
    if(listingDoc.exists()){
      let listing = listingDoc.data();
      listing.reviews[reviewIndex].reply = replyText;

      await updateDoc(doc(db, "listings", listingId), {
        reviews: listing.reviews
      });

      alert("Reply added!");
      loadReviews();
    }
  }
}
async function loadStaffBookings(){
  const tableBody = document.querySelector("#staffBookings tbody");
  tableBody.innerHTML = "";

  const snapshot = await getDocs(collection(db, "bookings"));
  for (let bookingDoc of snapshot.docs){
    const booking = bookingDoc.data();
    if(assignedListings.includes(booking.listingId)){
      const listingSnap = await getDoc(doc(db, "listings", booking.listingId));
      if(listingSnap.exists()){
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
}

loadStaffBookings();
const reviewUser = listing.reviews[reviewIndex].user;
sendNotification(reviewUser, `Your review on ${listing.title} got a reply!`, "dashboard/user.html#reviews");
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
