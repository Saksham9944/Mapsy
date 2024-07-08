"use strict";

const form = document.querySelector(".form");
const inpDistance = document.querySelector(".form__input--distance");
const inpDuration = document.querySelector(".form__input--duration");
const inpFrom = document.querySelector(".form__input--from");
const inpTo = document.querySelector(".form__input--to");
const travelType = document.querySelector(".form__input--type");
const deleteall = document.querySelector(".deleteall");
const current = document.querySelector(".current");

// Travel Log data
class TravelLog {
  date = new Date();

  constructor(from, to, distance, duration, type, lat, lng) {
    this.id = Date.now();
    this.from = from;
    this.to = to;
    this.distance = distance;
    this.duration = duration;
    this.type = type;
    this.lat = lat;
    this.lng = lng;
    this._setDescription();
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `💚For  ${this.to} on ${this.date.getDate()} ${
      months[this.date.getMonth()]
    } `;
  }
}

// MAPTY APP

class Mapty {
  #currentLat;
  #currentLng;
  #map;
  #mapEvent;
  #travelLogs = [];

  constructor() {
    // get current position
    this._getPosition();
    // When click to current location
    current.addEventListener("click", this._currentLocation.bind(this));
    // when form submitted
    form.addEventListener("submit", this._travelLog.bind(this));
    // get local storage
    this._getLocalStorage();
    // Delete all from storage
    deleteall.addEventListener("click", this._deleteAllLogs.bind(this));
  }

  _getPosition() {
    // MAP
    navigator.geolocation.getCurrentPosition(this._loadMap, function () {
      alert("Couldn't get your position");
    });
  }

  _loadMap = (position) => {
    // To get current location co-ordinates
    const { latitude, longitude } = position.coords;
    this.#currentLat = latitude;
    this.#currentLng = longitude;
    this.#map = L.map("map").setView([latitude, longitude], 9);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // putting mark on current location
    this._putMark(latitude, longitude);

    // To put circle on the current location
    L.circle([latitude, longitude], {
      color: "red",
      radius: 2000,
      fillOpacity: 0,
    }).addTo(this.#map);

    // when click on map
    this.#map.on("click", this._showForm.bind(this));

    // put travel location on map
    this.#travelLogs.forEach((log) => {
      this._putMark(log.lat, log.lng);
    });
  };

  // To add mark on that location
  _putMark(lat, lng) {
    // Fetching the location name and put mark on that

    this._getLocationName(lat, lng).then((result) => {
      var m = L.layerGroup().addTo(this.#map);
      L.marker([lat, lng])
        .addTo(m)
        .bindPopup(
          L.popup({
            maxWidth: 250,
            minWidth: 100,
            autoClose: false,
            closeOnClick: false,
            className: "running-popup",
          })
        )
        .setPopupContent(result.display_name)
        .openPopup();
    });
  }

  // To fetch current location name
  async _getLocationName(lat, lng) {
    let response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    );

    let data = await response.json();
    return data;
  }

  _currentLocation() {
    this.#map.setView([this.#currentLat, this.#currentLng], 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;

    form.classList.remove("hidden");

    const { lat, lng } = this.#mapEvent.latlng;

    // To fill input field with the selected location
    this._getLocationName(lat, lng).then((result) => {
      // const str = result.address.county;

      let str =
        Object.values(result.address)[0] +
        "," +
        Object.values(result.address)[1];
      str = str.slice(-6) === "Tehsil" ? str.substr(0, str.length - 7) : str;

      const locationName = str; //Here 7 is subtracted because .county gives "city+ Tehsil" so to remove tehsil we use this

      inpTo.value = locationName;
    });

    inpTo.focus();
  }

  _travelLog(e) {
    e.preventDefault();
    const check = this._checkData();
    console.log(check);
    if (check) {
      const { lat, lng } = this.#mapEvent.latlng;
      this._putMark(lat, lng);
    }
  }

  _checkData() {
    // get data from input field
    let check = true;
    const from = inpFrom.value;
    const to = inpTo.value;
    let type = travelType.value;
    const distance = inpDistance.value;
    const duration = inpDuration.value;

    // check the type of travel
    if (type === "Walk") type = "🚶‍♂️Walk";
    else if (type === "Cycle") type = "🚴‍♀️Cycle";
    else if (type === "Bike") type = "🛵Bike";
    else if (type === "Car") type = "🚖Car";
    else if (type === "Bus") type = "🚍Bus";
    else if (type === "Train") type = "🚅Train";
    else if (type === "Flight") type = "🛫Flight";

    // check the data
    if (Number(distance) <= 0 || Number(duration) <= 0) {
      alert("Please upload a positive value");
      inpDistance.value = "";
      inpDuration.value = "";
      check = false;
    }

    if (check) {
      const { lat, lng } = this.#mapEvent.latlng;
      const log = new TravelLog(from, to, distance, duration, type, lat, lng);
      this.#travelLogs.push(log);

      // showing the travel log
      this._showTravelLog(log);
      // removing the log form
      this._hideForm();

      // set local storage to all workouts
      this._setLocalStorage(this.#travelLogs);
    }
    return check;
  }

  _showTravelLog(log) {
    const html = `<li class="workout workout--running" data-id="${log.id}">
      <div class="heading">
          <h2 class="workout__title">${log.description}</h2>
         
       </div>
       <div class="details">   
           <div class="workout__details">
            <span class="workout__icon">🏡From: </span>
            <span class="workout__value">${log.from}</span>
            <span class="workout__unit"></span>
          </div>

          <div class="workout__details">
            <span class="workout__icon">🏁To: </span>
            <span class="workout__value">${log.to}</span>
            <span class="workout__unit"></span>
          </div>

          <div class="workout__details">
            <span class="workout__icon">🚀Travel by: </span>
            <span class="workout__value">${log.type}</span>
            <span class="workout__unit"></span>
          </div>
         
          <div class="workout__details">
            <span class="workout__icon">⏲Distance: </span>
            <span class="workout__value">${log.distance}</span>
            <span class="workout__unit">km</span>
          </div>
         
          <div class="workout__details">
            <span class="workout__icon">⏱Duration: </span>
            <span class="workout__value">${log.duration}</span>
            <span class="workout__unit">hr</span>
          </div>
          </div>
        
          
          <div class="op-btn" >
          <div class="move" data-id="${log.id}"><i class="fa-solid fa-location-dot"></i><button class="move-btn">Locate</button></div>
            <div class="delete" data-id="${log.id}"><i class="fa-solid fa-trash"></i><button class="delete-btn">Delete</button></div>
          </div>
        </li>`;

    form.insertAdjacentHTML("afterend", html);

    const deleteLog = document.querySelector(".delete");
    const moveLocation = document.querySelector(".move");

    // when click to move
    moveLocation.addEventListener("click", this._moveToMarker.bind(this));

    // when click to delete
    deleteLog.addEventListener("click", this._deleteLog.bind(this));
  }

  _hideForm() {
    inpFrom.value = inpTo.value = inpDistance.value = inpDuration.value = "";
    form.classList.add("hidden");
  }

  _moveToMarker(e) {
    const travelEle = e.target.closest(".workout");

    //if click is outside the travel log
    if (!travelEle) return;
    // find the clicked log using id
    const currentLog = this.#travelLogs.find(
      (eachLog) => eachLog.id === Number(travelEle.dataset.id)
    );
    // now move the view to clicked log location on the map
    this.#map.setView([currentLog.lat, currentLog.lng], 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _deleteLog(e) {
    let log = e.target.closest(".workout");

    let ele = this.#travelLogs.find(
      (eachLog) => eachLog.id === Number(log.dataset.id)
    );

    let idx = this.#travelLogs.indexOf(ele);
    this.#travelLogs.splice(idx, 1);

    alert(`Your travel to ${ele.to} log is deleted successfully!`);

    // stored travel log is cleared
    localStorage.clear();
    // then set to new travel log in storage
    this._setLocalStorage(this.#travelLogs);

    // reload the page
    location.reload();
  }

  _setLocalStorage(travel) {
    localStorage.setItem("travelLogs", JSON.stringify(travel));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("travelLogs"));
    console.log(data);
    if (!data) return;
    this.#travelLogs = data;

    this.#travelLogs.forEach((log) => {
      this._showTravelLog(log);
    });
  }

  _deleteAllLogs() {
    if (this.#travelLogs.length !== 0)
      alert("All travel logs deleted successfully!");

    localStorage.clear();
    this._setLocalStorage([]);
    location.reload();
  }
}

const obj = new Mapty();
