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
import { db, auth } from "./firebase.js";
import { collection, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

async function loadAllTransactions(){
  const snap = await getDocs(collection(db, "transactions"));
  const container = document.getElementById("allTransactions");
  container.innerHTML = "";

  snap.forEach(docSnap => {
    const t = docSnap.data();
    const div = document.createElement("div");
    div.classList.add("trip-card");
    div.innerHTML = `
      <p><strong>${t.type}</strong> - ₹${t.amount}</p>
      <p>User: ${t.userId || "N/A"} | Partner: ${t.partnerId || "N/A"}</p>
      <p>${t.method} | ${t.status}</p>
      <small>${t.createdAt?.toDate().toLocaleString()}</small>
      ${t.type === "Withdrawal Request" && t.status === "Pending" ? `<button onclick="approveWithdrawal('${docSnap.id}', ${t.amount}, '${t.partnerId}')">Approve</button>` : ""}
    `;
    container.appendChild(div);
  });
}

window.approveWithdrawal = async function(txnId, amount, partnerId){
  const walletRef = doc(db, "wallets", partnerId);
  await updateDoc(walletRef, { balance: 0 });

  const txnRef = doc(db, "transactions", txnId);
  await updateDoc(txnRef, { status: "Approved" });

  alert("Withdrawal approved!");
  loadAllTransactions();
}

auth.onAuthStateChanged(user => {
  if(user) loadAllTransactions();
});
import { db, auth } from "./firebase.js";
import { collection, getDocs, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

async function loadAllBookings(){
  const snap = await getDocs(collection(db, "bookings"));
  const container = document.getElementById("allBookingsContainer");
  container.innerHTML = "";

  if(snap.empty){
    container.innerHTML = "<p>No bookings yet.</p>";
    return;
  }

  for(const docSnap of snap.docs){
    const booking = docSnap.data();

    const listingRef = doc(db, "listings", booking.listingId);
    const listingSnap = await getDoc(listingRef);
    const listingName = listingSnap.exists() ? listingSnap.data().title : "Unknown Listing";

    const div = document.createElement("div");
    div.classList.add("trip-card");
    div.innerHTML = `
      <h3>${listingName}</h3>
      <p><strong>User:</strong> ${booking.userId}</p>
      <p><strong>Partner:</strong> ${booking.partnerId}</p>
      <p><strong>Amount:</strong> ₹${booking.amount}</p>
      <p><strong>Status:</strong> ${booking.status}</p>
      <p><strong>Payment:</strong> ${booking.paymentMethod}</p>
      <small>${booking.createdAt?.toDate().toLocaleString()}</small>
      ${booking.status !== "Completed" ? `<button onclick="markBookingComplete('${docSnap.id}')">Mark Complete</button>` : ""}
    `;
    container.appendChild(div);
  }
}

window.markBookingComplete = async function(bookingId){
  const ref = doc(db, "bookings", bookingId);
  await updateDoc(ref, { status: "Completed" });
  alert("Booking marked as completed!");
  loadAllBookings();
}

auth.onAuthStateChanged(user => {
  if(user) loadAllBookings();
});
