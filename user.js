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

let map, directionsService, directionsRenderer, distanceMatrixService, placesService;
let userCoords = null; // { lat, lng }

window.initMap = function() {
  // Default center (Patna)
  const defaultCenter = { lat: 25.5941, lng: 85.1376 };
  map = new google.maps.Map(document.getElementById("map"), {
    center: defaultCenter,
    zoom: 12,
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ map });
  distanceMatrixService = new google.maps.DistanceMatrixService();
  placesService = new google.maps.places.PlacesService(map);
};

// Utility: geocode an address to LatLng
async function geocodeAddress(address) {
  return new Promise((resolve, reject) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === "OK" && results[0]) {
        const loc = results[0].geometry.location;
        resolve({ lat: loc.lat(), lng: loc.lng(), label: results[0].formatted_address });
      } else {
        reject(new Error("Geocode failed: " + status));
      }
    });
  });
}

// Utility: find nearest place (type = 'airport' or 'train_station')
async function findNearestPlace(type, locationLatLng, radius = 50000) {
  return new Promise((resolve, reject) => {
    const request = {
      location: new google.maps.LatLng(locationLatLng.lat, locationLatLng.lng),
      radius,
      type: type // 'airport' or 'train_station'
    };
    placesService.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results.length) {
        // pick the nearest (first is usually nearest)
        const r = results[0];
        resolve({
          name: r.name,
          placeId: r.place_id,
          location: {
            lat: r.geometry.location.lat(),
            lng: r.geometry.location.lng()
          },
          address: r.vicinity || r.formatted_address || ""
        });
      } else {
        resolve(null); // no station/airport found within radius
      }
    });
  });
}

// Use browser's geolocation
document.getElementById("useLocationBtn").addEventListener("click", async () => {
  if (!navigator.geolocation) return alert("Geolocation not supported by your browser.");
  navigator.geolocation.getCurrentPosition((pos) => {
    userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    document.getElementById("originInput").value = "My Location";
    map.setCenter(userCoords);
    new google.maps.Marker({ position: userCoords, map, title: "You are here" });
  }, (err) => {
    alert("Could not get your location: " + err.message);
  }, { enableHighAccuracy: true });
});

// Plan Travel button
document.getElementById("planBtn").addEventListener("click", async () => {
  const originText = document.getElementById("originInput").value.trim();
  const destText = document.getElementById("destinationInput").value.trim();
  const mode = document.getElementById("plannerMode").value;

  if (!destText) return alert("Please enter destination.");

  let originLatLng = null;
  try {
    if (originText && originText.toLowerCase() !== "my location") {
      originLatLng = await geocodeAddress(originText);
    } else if (userCoords) {
      originLatLng = { lat: userCoords.lat, lng: userCoords.lng, label: "My Location" };
    } else {
      // try browser geolocation if origin not specified
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true })
      );
      userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      originLatLng = { lat: userCoords.lat, lng: userCoords.lng, label: "My Location" };
      new google.maps.Marker({ position: userCoords, map, title: "You are here" });
    }
  } catch (e) {
    return alert("Origin lookup failed: " + e.message);
  }

  // Geocode destination
  let destLatLng = null;
  try {
    destLatLng = await geocodeAddress(destText);
  } catch (e) {
    return alert("Destination lookup failed: " + e.message);
  }

  // Clear previous route
  directionsRenderer.setDirections({ routes: [] });

  // If mode is AIR or RAIL, find nearest airport / station and compute distance/time to that point
  if (mode === "AIR" || mode === "RAIL") {
    const type = mode === "AIR" ? "airport" : "train_station";
    // Search near destination first (most helpful), if not found then near origin
    let nearest = await findNearestPlace(type, destLatLng);
    if (!nearest) nearest = await findNearestPlace(type, originLatLng);

    // Compute distance/time from origin -> nearest place and nearest place -> destination
    const resultHtml = document.getElementById("plannerResult");
    resultHtml.innerHTML = `<h3>Nearest ${mode === "AIR" ? "Airport" : "Train Station"}</h3>`;

    if (!nearest) {
      resultHtml.innerHTML += `<p>No nearby ${type} found (within search radius). Try a different location.</p>`;
      return;
    }

    // Distance and duration between origin and nearest place
    distanceMatrixService.getDistanceMatrix({
      origins: [ new google.maps.LatLng(originLatLng.lat, originLatLng.lng) ],
      destinations: [ new google.maps.LatLng(nearest.location.lat, nearest.location.lng) ],
      travelMode: google.maps.TravelMode.DRIVING,
      unitSystem: google.maps.UnitSystem.METRIC,
    }, (response1, status1) => {
      if (status1 !== "OK") {
        resultHtml.innerHTML += `<p>Error getting distance info: ${status1}</p>`;
        return;
      }

      const el1 = response1.rows[0].elements[0];
      const originToNearest = el1.status === "OK" ? `${el1.distance.text} • ${el1.duration.text}` : "N/A";

      // Distance between nearest place and destination (likely short)
      distanceMatrixService.getDistanceMatrix({
        origins: [ new google.maps.LatLng(nearest.location.lat, nearest.location.lng) ],
        destinations: [ new google.maps.LatLng(destLatLng.lat, destLatLng.lng) ],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
      }, (response2, status2) => {
        if (status2 !== "OK") {
          resultHtml.innerHTML += `<p>Error getting onward distance: ${status2}</p>`;
          return;
        }
        const el2 = response2.rows[0].elements[0];
        const nearestToDest = el2.status === "OK" ? `${el2.distance.text} • ${el2.duration.text}` : "N/A";

        // Render result
        resultHtml.innerHTML += `
          <div class="travel-card">
            <h4>${nearest.name}</h4>
            <p><strong>Address:</strong> ${nearest.address}</p>
            <p><strong>From Origin → ${nearest.name}:</strong> ${originToNearest}</p>
            <p><strong>${nearest.name} → Destination:</strong> ${nearestToDest}</p>
            <p>
              <button onclick="openMapsDirections(${originLatLng.lat}, ${originLatLng.lng}, ${nearest.location.lat}, ${nearest.location.lng})">Directions to ${nearest.name}</button>
              <button onclick="openMapsPlace('${encodeURIComponent(nearest.name + " " + nearest.address)}')">Open in Google Maps</button>
            </p>
          </div>
        `;

        // Place markers on map
        map.setCenter({ lat: destLatLng.lat, lng: destLatLng.lng });
        new google.maps.Marker({ position: { lat: originLatLng.lat, lng: originLatLng.lng }, map, title: "Origin" });
        new google.maps.Marker({ position: { lat: destLatLng.lat, lng: destLatLng.lng }, map, title: "Destination" });
        new google.maps.Marker({ position: { lat: nearest.location.lat, lng: nearest.location.lng }, map, title: nearest.name });

      }); // end response2
    }); // end response1

    return;
  }

  // For DRIVING / TRANSIT / WALKING: show route & distance
  const travelMode = mode === "TRANSIT" ? google.maps.TravelMode.TRANSIT
                    : mode === "WALKING" ? google.maps.TravelMode.WALKING
                    : google.maps.TravelMode.DRIVING;

  // Directions (draw route on map)
  directionsService.route({
    origin: new google.maps.LatLng(originLatLng.lat, originLatLng.lng),
    destination: new google.maps.LatLng(destLatLng.lat, destLatLng.lng),
    travelMode,
    transitOptions: {},
    drivingOptions: { departureTime: new Date() }
  }, (result, status) => {
    if (status === "OK") {
      directionsRenderer.setDirections(result);
      // Fit map to route bounds
      const bounds = new google.maps.LatLngBounds();
      const route = result.routes[0];
      route.overview_path.forEach(p => bounds.extend(p));
      map.fitBounds(bounds);
    } else {
      console.warn("Directions request failed:", status);
    }
  });

  // Distance Matrix for estimated distance/time
  distanceMatrixService.getDistanceMatrix({
    origins: [ new google.maps.LatLng(originLatLng.lat, originLatLng.lng) ],
    destinations: [ new google.maps.LatLng(destLatLng.lat, destLatLng.lng) ],
    travelMode,
    unitSystem: google.maps.UnitSystem.METRIC,
  }, (response, status) => {
    const out = document.getElementById("plannerResult");
    out.innerHTML = `<h3>Travel Options</h3>`;
    if (status !== "OK") {
      out.innerHTML += `<p>Distance service error: ${status}</p>`;
      return;
    }

    const element = response.rows[0].elements[0];
    if (element.status !== "OK") {
      out.innerHTML += `<p>Route not available: ${element.status}</p>`;
      return;
    }

    out.innerHTML += `
      <div class="travel-card">
        <p><strong>From:</strong> ${originLatLng.label || originText || "Origin"}</p>
        <p><strong>To:</strong> ${destLatLng.label}</p>
        <p><strong>Mode:</strong> ${mode}</p>
        <p><strong>Distance:</strong> ${element.distance.text}</p>
        <p><strong>Estimated time:</strong> ${element.duration.text}</p>
        <p>
          <button onclick="openMapsDirections(${originLatLng.lat}, ${originLatLng.lng}, ${destLatLng.lat}, ${destLatLng.lng})">Open Directions</button>
          <button onclick="visitListingByLatLng(${destLatLng.lat}, ${destLatLng.lng})">Open Destination in Maps</button>
        </p>
      </div>
    `;

    // Marker for destination and origin
    new google.maps.Marker({ position: { lat: originLatLng.lat, lng: originLatLng.lng }, map, title: "Origin" });
    new google.maps.Marker({ position: { lat: destLatLng.lat, lng: destLatLng.lng }, map, title: destLatLng.label });
  });
});

// Open Google Maps directions (external)
window.openMapsDirections = function(origLat, origLng, destLat, destLng){
  const url = `https://www.google.com/maps/dir/?api=1&origin=${origLat},${origLng}&destination=${destLat},${destLng}`;
  window.open(url, "_blank");
}

// Open Google Maps place search
window.openMapsPlace = function(q){
  const url = `https://www.google.com/maps/search/?api=1&query=${q}`;
  window.open(url, "_blank");
}

// Helper to open a coordinate in maps
window.visitListingByLatLng = function(lat, lng){
  const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  window.open(url, "_blank");
}
import { db, auth } from "./firebase.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

async function loadMyTrips(){
  const user = auth.currentUser;
  if(!user) return;

  const q = query(collection(db, "trips"), where("userId", "==", user.uid));
  const snapshot = await getDocs(q);

  const container = document.getElementById("tripsContainer");
  container.innerHTML = "";

  if(snapshot.empty){
    container.innerHTML = "<p>No trips saved yet.</p>";
    return;
  }

  snapshot.forEach(docSnap => {
    const trip = docSnap.data();
    const div = document.createElement("div");
    div.classList.add("trip-card");
    div.innerHTML = `
      <h3>${trip.origin} → ${trip.destination}</h3>
      <p><strong>Mode:</strong> ${trip.mode}</p>
      <p><strong>Distance:</strong> ${trip.distance}</p>
      <p><strong>Duration:</strong> ${trip.duration}</p>
      <p><strong>Date:</strong> ${trip.date}</p>
      <p><strong>Notes:</strong> ${trip.notes || "No notes"}</p>
    `;
    container.appendChild(div);
  });
}

// Load trips when dashboard opens
auth.onAuthStateChanged(user => {
  if(user){
    loadMyTrips();
  }
});
window.bookNow = function(listingId, title, price){
  const options = {
    key: "YOUR_RAZORPAY_KEY", 
    amount: price * 100, // amount in paise
    currency: "INR",
    name: "BharatComfort",
    description: "Booking for " + title,
    handler: function (response){
      saveBooking(listingId, price, "Razorpay", response.razorpay_payment_id);
    },
    prefill: {
      name: auth.currentUser?.displayName || "User",
      email: auth.currentUser?.email || "user@example.com",
    },
    theme: {
      color: "#3399cc"
    }
  };
  const rzp = new Razorpay(options);
  rzp.open();
}
import { db, auth } from "./firebase.js";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Load wallet balance
async function loadWallet(){
  const user = auth.currentUser;
  if(!user) return;

  const ref = doc(db, "wallets", user.uid);
  const snap = await getDoc(ref);

  if(snap.exists()){
    document.getElementById("walletBalance").innerText = snap.data().balance;
  } else {
    await setDoc(ref, { balance: 0 });
    document.getElementById("walletBalance").innerText = "0";
  }

  loadWalletTransactions();
}

// Load wallet transactions
async function loadWalletTransactions(){
  const user = auth.currentUser;
  const q = query(collection(db, "transactions"), where("userId", "==", user.uid));
  const snap = await getDocs(q);

  const container = document.getElementById("walletTransactions");
  container.innerHTML = "";

  snap.forEach(docSnap => {
    const t = docSnap.data();
    const div = document.createElement("div");
    div.classList.add("trip-card");
    div.innerHTML = `
      <p><strong>${t.type}</strong> - ₹${t.amount}</p>
      <p>${t.method} | ${t.status}</p>
      <small>${t.createdAt?.toDate().toLocaleString()}</small>
    `;
    container.appendChild(div);
  });
}

// Wallet top-up using Razorpay
window.topUpWallet = function(){
  const options = {
    key: "YOUR_RAZORPAY_KEY",
    amount: 50000, // default ₹500 top-up
    currency: "INR",
    name: "BharatComfort Wallet",
    handler: async function (response){
      const user = auth.currentUser;
      const ref = doc(db, "wallets", user.uid);
      const snap = await getDoc(ref);
      let balance = snap.exists() ? snap.data().balance : 0;
      await updateDoc(ref, { balance: balance + 500 });

      await addDoc(collection(db, "transactions"), {
        userId: user.uid,
        amount: 500,
        type: "Wallet Top-Up",
        method: "Razorpay",
        status: "Success",
        createdAt: serverTimestamp()
      });

      alert("Wallet topped up successfully!");
      loadWallet();
    }
  };
  const rzp = new Razorpay(options);
  rzp.open();
}

auth.onAuthStateChanged(user => {
  if(user) loadWallet();
});
import { db, auth } from "./firebase.js";
import { collection, query, where, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

async function loadUserBookings(){
  const user = auth.currentUser;
  if(!user) return;

  const q = query(collection(db, "bookings"), where("userId", "==", user.uid));
  const snap = await getDocs(q);

  const container = document.getElementById("userBookingsContainer");
  container.innerHTML = "";

  if(snap.empty){
    container.innerHTML = "<p>No bookings found.</p>";
    return;
  }

  for(const docSnap of snap.docs){
    const booking = docSnap.data();

    // Fetch listing name
    const listingRef = doc(db, "listings", booking.listingId);
    const listingSnap = await getDoc(listingRef);
    const listingName = listingSnap.exists() ? listingSnap.data().title : "Unknown Listing";

    const div = document.createElement("div");
    div.classList.add("trip-card");
    div.innerHTML = `
      <h3>${listingName}</h3>
      <p><strong>Amount:</strong> ₹${booking.amount}</p>
      <p><strong>Status:</strong> ${booking.status}</p>
      <p><strong>Payment:</strong> ${booking.paymentMethod}</p>
      <small>${booking.createdAt?.toDate().toLocaleString()}</small>
    `;
    container.appendChild(div);
  }
}

auth.onAuthStateChanged(user => {
  if(user) loadUserBookings();
});
