import { db, auth } from "./firebase.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let map, directionsService, directionsRenderer;
let currentTrip = null;

window.initMap = function () {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 25.5941, lng: 85.1376 }, // Default: Patna
    zoom: 6,
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();
  directionsRenderer.setMap(map);
};

window.calculateRoute = function () {
  const origin = document.getElementById("originInput").value;
  const destination = document.getElementById("destinationInput").value;
  const mode = document.getElementById("travelMode").value;

  if (!origin || !destination) {
    alert("Please enter both origin and destination");
    return;
  }

  if (mode === "AIR" || mode === "RAIL") {
    // For now, just show message (we’ll add airport/rail APIs later)
    document.getElementById("tripResults").innerHTML =
      `<p>Showing nearest ${mode === "AIR" ? "airports" : "railway stations"} feature coming soon...</p>`;
    return;
  }

  directionsService.route(
    {
      origin,
      destination,
      travelMode: google.maps.TravelMode[mode],
    },
    (result, status) => {
      if (status === "OK") {
        directionsRenderer.setDirections(result);
        const route = result.routes[0].legs[0];
        const routeData = {
          origin,
          destination,
          mode,
          distance: route.distance.text,
          duration: route.duration.text,
        };

        currentTrip = routeData;
        document.getElementById("tripResults").innerHTML = `
          <h3>Trip Details</h3>
          <p><strong>From:</strong> ${origin}</p>
          <p><strong>To:</strong> ${destination}</p>
          <p><strong>Mode:</strong> ${mode}</p>
          <p><strong>Distance:</strong> ${route.distance.text}</p>
          <p><strong>Duration:</strong> ${route.duration.text}</p>
        `;
        document.getElementById("saveTripSection").style.display = "block";
      } else {
        alert("Could not calculate route: " + status);
      }
    }
  );
};

window.saveTrip = async function () {
  const user = auth.currentUser;
  if (!user) {
    alert("Please login to save your trip.");
    return;
  }

  const tripDate = document.getElementById("tripDate").value;
  const tripNotes = document.getElementById("tripNotes").value;

  if (!tripDate) {
    alert("Please select a trip date.");
    return;
  }

  try {
    await addDoc(collection(db, "trips"), {
      userId: user.uid,
      ...currentTrip,
      date: tripDate,
      notes: tripNotes,
      createdAt: serverTimestamp(),
    });
    alert("Trip saved successfully!");
    document.getElementById("saveTripSection").style.display = "none";
  } catch (err) {
    console.error("Error saving trip: ", err);
    alert("Failed to save trip.");
  }
};
