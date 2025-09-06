// user.js
import { auth, db } from "../firebase-config.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";
import { collection, getDocs, doc, updateDoc, getDoc, addDoc, query, where } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

// Logout
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "../login.html";
});

let userId = null;

// Check auth state
onAuthStateChanged(auth, async (user) => {
  if(user){
    userId = user.uid;
    loadListings();
    loadStories();
  } else {
    window.location.href = "../login.html";
  }
});

// Load Approved Listings
async function loadListings(){
  const container = document.getElementById("listingContainer");
  const select = document.getElementById("listingSelect");
  container.innerHTML = "";
  select.innerHTML = "";
// Load Approved Listings
async function loadListings(){
  const container = document.getElementById("listingContainer");
  const select = document.getElementById("listingSelect");
  container.innerHTML = "";
  select.innerHTML = "";

  const q = query(collection(db, "listings"), where("status", "==", "Approved"));
  const snapshot = await getDocs(q);

  snapshot.forEach((docSnap) => {
    const listing = docSnap.data();
    const listingId = docSnap.id;

    const div = document.createElement("div");
    div.classList.add("listing-card");
    div.innerHTML = `
      <h3>${listing.title}</h3>
      <p>${listing.details}</p>
      <p><strong>Price:</strong> ${listing.price}</p>
      <p><strong>Services:</strong> ${listing.services.join(", ")}</p>
      <button onclick="bookNow('${listingId}', '${listing.title}')">Book Now</button>
      <button onclick="visitListing('${listingId}')">Visit</button>
      <button onclick="getDirection('${listing.title}')">Get Direction</button>
    `;
    container.appendChild(div);

    // Add to dropdown for review
    const option = document.createElement("option");
    option.value = listingId;
    option.textContent = listing.title;
    select.appendChild(option);
  });
}
  const q = query(collection(db, "listings"), where("status", "==", "Approved"));
  const snapshot = await getDocs(q);

  snapshot.forEach((docSnap) => {
    const listing = docSnap.data();
    const div = document.createElement("div");
    div.classList.add("listing-card");
    div.innerHTML = `
      <h3>${listing.title}</h3>
      <p>${listing.details}</p>
      <p><strong>Price:</strong> ${listing.price}</p>
      <p><strong>Services:</strong> ${listing.services.join(", ")}</p>
    `;
    container.appendChild(div);

    // Add to dropdown for review
    const option = document.createElement("option");
    option.value = docSnap.id;
    option.textContent = listing.title;
    select.appendChild(option);
  });
}

// Submit Review
const reviewForm = document.getElementById("reviewForm");
reviewForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const listingId = document.getElementById("listingSelect").value;
  const reviewText = document.getElementById("reviewText").value;
  const rating = parseInt(document.getElementById("rating").value);

  const listingRef = doc(db, "listings", listingId);
  const listingSnap = await getDoc(listingRef);

  if(listingSnap.exists()){
    let listing = listingSnap.data();
    if(!listing.reviews) listing.reviews = [];
    listing.reviews.push({
      user: userId,
      comment: reviewText,
      rating: rating,
      reply: null
    });

    await updateDoc(listingRef, { reviews: listing.reviews });
    alert("Review submitted!");
    reviewForm.reset();
  }
});

// Post Story
const storyForm = document.getElementById("storyForm");
storyForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const storyText = document.getElementById("storyText").value;

  await addDoc(collection(db, "stories"), {
    user: userId,
    text: storyText,
    likes: [],
    comments: [],
    createdAt: new Date()
  });

  alert("Story posted!");
  storyForm.reset();
  loadStories();
});

// Load Stories
async function loadStories(){
  const container = document.getElementById("storiesContainer");
  container.innerHTML = "";

  const snapshot = await getDocs(collection(db, "stories"));
  snapshot.forEach((docSnap) => {
    const story = docSnap.data();
    const div = document.createElement("div");
    div.classList.add("story-card");
    div.innerHTML = `
      <p>${story.text}</p>
      <p><strong>Likes:</strong> ${story.likes.length}</p>
      <button onclick="likeStory('${docSnap.id}')">Like</button>
      <button onclick="commentStory('${docSnap.id}')">Comment</button>
    `;
    container.appendChild(div);
  });
}

// Like Story
window.likeStory = async function(storyId){
  const storyRef = doc(db, "stories", storyId);
  const storySnap = await getDoc(storyRef);
  if(storySnap.exists()){
    let story = storySnap.data();
    if(!story.likes.includes(userId)){
      story.likes.push(userId);
      await updateDoc(storyRef, { likes: story.likes });
      loadStories();
    }
  }
}

// Comment on Story
window.commentStory = async function(storyId){
  const comment = prompt("Enter your comment:");
  if(comment){
    const storyRef = doc(db, "stories", storyId);
    const storySnap = await getDoc(storyRef);
    if(storySnap.exists()){
      let story = storySnap.data();
      story.comments.push({ user: userId, text: comment });
      await updateDoc(storyRef, { comments: story.comments });
      loadStories();
    }
  }
}

// Travel Planner
const plannerForm = document.getElementById("plannerForm");
plannerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const dest = document.getElementById("destination").value;
  const mode = document.getElementById("mode").value;

  document.getElementById("plannerResult").innerHTML =
    `<p>You can reach <strong>${dest}</strong> via <strong>${mode}</strong>. (Demo)</p>`;
});
// Book Now
window.bookNow = async function(listingId, title){
  const name = prompt(`Booking at ${title}\nEnter your name:`);
  const guests = prompt("Number of guests:");
  const date = prompt("Booking date (YYYY-MM-DD):");

  if(name && guests && date){
    await addDoc(collection(db, "bookings"), {
      user: userId,
      listingId: listingId,
      name: name,
      guests: parseInt(guests),
      date: date,
      status: "Pending",
      createdAt: new Date()
    });
    alert("Booking request submitted!");
  }
}

// Visit Listing
window.visitListing = function(listingId){
  window.location.href = `listing-detail.html?id=${listingId}`;
}

// Get Direction (using Google Maps)
window.getDirection = function(place){
  const query = encodeURIComponent(place);
  window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
}
async function loadUserBookings(){
  const tableBody = document.querySelector("#userBookings tbody");
  tableBody.innerHTML = "";

  const snapshot = await getDocs(collection(db, "bookings"));
  for (let bookingDoc of snapshot.docs){
    const booking = bookingDoc.data();
    if(booking.user === userId){
      const listingSnap = await getDoc(doc(db, "listings", booking.listingId));
      const listingTitle = listingSnap.exists() ? listingSnap.data().title : "Deleted";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${listingTitle}</td>
        <td>${booking.date}</td>
        <td>${booking.guests}</td>
        <td>${booking.status}</td>
      `;
      tableBody.appendChild(tr);
    }
  }
}

loadUserBookings();
// Notify listing owner & assigned staff
const ownerId = listingSnap.data().owner;
sendNotification(ownerId, `New review on your listing: ${listing.title}`, "dashboard/partner.html#reviews");

if(listing.staffAssigned && listing.staffAssigned.length > 0){
  listing.staffAssigned.forEach(staffId => {
    sendNotification(staffId, `New review on assigned listing: ${listing.title}`, "dashboard/staff.html#reviews");
  });
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
let allListings = []; // Store listings globally

// Load Approved Listings
async function loadListings(){
  const container = document.getElementById("listingContainer");
  const select = document.getElementById("listingSelect");
  container.innerHTML = "";
  select.innerHTML = "";
  allListings = [];

  const q = query(collection(db, "listings"), where("status", "==", "Approved"));
  const snapshot = await getDocs(q);

  snapshot.forEach((docSnap) => {
    const listing = { id: docSnap.id, ...docSnap.data() };
    allListings.push(listing);
  });

  renderListings(allListings);
  loadMap(allListings);
}

function renderListings(listings){
  const container = document.getElementById("listingContainer");
  container.innerHTML = "";
  listings.forEach((listing) => {
    const div = document.createElement("div");
    div.classList.add("listing-card");
    div.innerHTML = `
      <h3>${listing.title}</h3>
      <p>${listing.details}</p>
      <p><strong>Price:</strong> ${listing.price}</p>
      <p><strong>Services:</strong> ${listing.services.join(", ")}</p>
      <button onclick="bookNow('${listing.id}', '${listing.title}')">Book Now</button>
      <button onclick="visitListing('${listing.id}')">Visit</button>
      <button onclick="getDirection('${listing.title}')">Get Direction</button>
    `;
    container.appendChild(div);
  });
}

// Apply Filters
window.applyFilters = function(){
  const search = document.getElementById("searchInput").value.toLowerCase();
  const price = document.getElementById("priceFilter").value;
  const service = document.getElementById("serviceFilter").value;

  let filtered = allListings.filter(l => 
    l.title.toLowerCase().includes(search) || 
    l.details.toLowerCase().includes(search)
  );

  if(price){
    filtered = filtered.filter(l => {
      if(price === "low") return l.price < 1000;
      if(price === "mid") return l.price >= 1000 && l.price <= 5000;
      if(price === "high") return l.price > 5000;
    });
  }

  if(service){
    filtered = filtered.filter(l => l.services.includes(service));
  }

  renderListings(filtered);
  loadMap(filtered);
}
let map, markers = [];

window.initMap = function(){
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 25.5941, lng: 85.1376 }, // Default Patna
    zoom: 12,
  });
}

function loadMap(listings){
  if(!map) return;
  markers.forEach(m => m.setMap(null));
  markers = [];

  listings.forEach(l => {
    if(l.lat && l.lng){
      const marker = new google.maps.Marker({
        position: { lat: l.lat, lng: l.lng },
        map,
        title: l.title,
      });

      const info = new google.maps.InfoWindow({
        content: `<h3>${l.title}</h3><p>${l.details}</p><button onclick="visitListing('${l.id}')">Visit</button>`
      });

      marker.addListener("click", () => info.open(map, marker));
      markers.push(marker);
    }
  });
}
