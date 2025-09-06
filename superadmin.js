import { auth, db } from "../firebase-config.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";
import { collection, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

// Logout
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "../login.html";
});

// Fetch Users
async function loadUsers(){
  const usersTable = document.querySelector("#usersTable tbody");
  usersTable.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "users"));
  querySnapshot.forEach((docSnap) => {
    const user = docSnap.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td>${user.role}</td>
      <td>
        ${user.role !== "superadmin" ? `
        <button onclick="makeStaff('${docSnap.id}')">Make Staff</button>
        <button onclick="makePartner('${docSnap.id}')">Make Partner</button>
        ` : "Superadmin"}
      </td>
    `;
    usersTable.appendChild(tr);
  });
}

// Fetch Listings
async function loadListings(){
  const listingsTable = document.querySelector("#listingsTable tbody");
  listingsTable.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "listings"));
  querySnapshot.forEach((docSnap) => {
    const listing = docSnap.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${listing.title}</td>
      <td>${listing.owner}</td>
      <td>${listing.status || "Pending"}</td>
      <td>
        <button class="assign" onclick="assignStaff('${docSnap.id}')">Assign Staff</button>
      </td>
      <td>
        <button class="approve" onclick="approveListing('${docSnap.id}')">Approve</button>
        <button class="reject" onclick="rejectListing('${docSnap.id}')">Reject</button>
      </td>
    `;
    listingsTable.appendChild(tr);
  });
}

// Assign Staff
window.assignStaff = async function(listingId){
  const staffId = prompt("Enter Staff User ID to assign:");
  if(staffId){
    await updateDoc(doc(db, "listings", listingId), {
      staffAssigned: [staffId]
    });
    alert("Staff Assigned!");
    loadListings();
  }
}

// Approve / Reject
window.approveListing = async function(listingId){
  await updateDoc(doc(db, "listings", listingId), { status: "Approved" });
  loadListings();
}
window.rejectListing = async function(listingId){
  await updateDoc(doc(db, "listings", listingId), { status: "Rejected" });
  loadListings();
}

// Change Role
window.makeStaff = async function(userId){
  await updateDoc(doc(db, "users", userId), { role: "staff" });
  loadUsers();
}
window.makePartner = async function(userId){
  await updateDoc(doc(db, "users", userId), { role: "partner" });
  loadUsers();
}

// Analytics
async function loadAnalytics(){
  const usersSnapshot = await getDocs(collection(db, "users"));
  document.getElementById("totalUsers").innerText = usersSnapshot.size;

  const listingsSnapshot = await getDocs(collection(db, "listings"));
  document.getElementById("totalListings").innerText = listingsSnapshot.size;
}

// Load everything
loadUsers();
loadListings();
loadAnalytics();
import { getDocs, collection, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

// Load All Bookings
async function loadAllBookings(){
  const tableBody = document.querySelector("#allBookings tbody");
  tableBody.innerHTML = "";

  const snapshot = await getDocs(collection(db, "bookings"));
  for (let bookingDoc of snapshot.docs){
    const booking = bookingDoc.data();
    const listing = await getDoc(doc(db, "listings", booking.listingId));

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${booking.name}</td>
      <td>${listing.exists() ? listing.data().title : "Deleted"}</td>
      <td>${booking.date}</td>
      <td>${booking.guests}</td>
      <td>${booking.status}</td>
      <td>
        <button onclick="updateBookingStatus('${bookingDoc.id}', 'Confirmed')">Confirm</button>
        <button onclick="updateBookingStatus('${bookingDoc.id}', 'Rejected')">Reject</button>
      </td>
    `;
    tableBody.appendChild(tr);
  }
}

window.updateBookingStatus = async function(bookingId, status){
  await updateDoc(doc(db, "bookings", bookingId), { status });
  alert(`Booking ${status}`);
  loadAllBookings();
}

loadAllBookings();
import { sendNotification } from "../js/notify.js";

window.updateBookingStatus = async function(bookingId, status){
  const bookingRef = doc(db, "bookings", bookingId);
  const bookingSnap = await getDoc(bookingRef);
  if(bookingSnap.exists()){
    const booking = bookingSnap.data();
    await updateDoc(bookingRef, { status });

    // Notify user
    sendNotification(booking.user, `Your booking is ${status}`, "dashboard/user.html#bookings");
  }
  alert(`Booking ${status}`);
  loadAllBookings();
}
