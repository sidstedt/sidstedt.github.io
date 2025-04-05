import API_KEYS from "./config.js";

/*
 * Main entry point: Waits for the DOM to load before initializing the dashboard
 * and setting up event listeners.
 */
document.addEventListener("DOMContentLoaded", function () {
  // ==========================
  // Constants and Variables
  // ==========================
  /*
   * Constants to store user preferences and saved data from localStorage.
   */
  const savedLinks = JSON.parse(localStorage.getItem("links")) || [];
  const savedBackgroundImage = localStorage.getItem("backgroundImage");
  const savedTitle = localStorage.getItem("title");
  const savedNote = localStorage.getItem("notes");
  const userCity = localStorage.getItem("userCity");

  // ==========================
  // Initialization
  // ==========================
  /*
   * Initializes the dashboard by loading saved data and setting up the UI.
   */
  initializeDashboard();
  setupEventListeners();

  // ==========================
  // Event Listeners
  // ==========================
  /*
   * Sets up all event listeners for user interactions, such as button clicks,
   * form submissions, and input changes.
   */
  function setupEventListeners() {
    // Updates the clock every second
    setInterval(myClock, 1000);

    // Fetches a Chuck Norris joke when the button is clicked
    document
      .getElementById("chuck-button")
      .addEventListener("click", setChuckNorris);

    // Fetches a new background image when the button is clicked
    document
      .getElementById("get-background")
      .addEventListener("click", fetchUnsplash);

    // Saves the dashboard title to localStorage when it is edited
    document
      .querySelector(".dashboard-title")
      .addEventListener("input", (event) => {
        localStorage.setItem("title", event.target.textContent);
      });

    // Opens modals when buttons with data-modal-target attributes are clicked
    document.querySelectorAll("[data-modal-target]").forEach((button) => {
      button.addEventListener("click", (event) => {
        const modalId = event.target.dataset.modalTarget;
        toggleModal(modalId, true);
      });
    });

    // Saves notes to localStorage when the notes area is edited
    document.querySelector(".notes-area").addEventListener("input", (event) => {
      localStorage.setItem("notes", event.target.value);
    });

    // Sets up form submission handling for modals
    setupModalForms();

    // Closes modals when close buttons are clicked
    document.querySelectorAll(".close-button").forEach((button) => {
      button.addEventListener("click", (event) => {
        const modal = event.target.closest(".modal");
        modal.style.display = "none";
      });
    });
  }

  // ==========================
  // Initialization Functions
  // ==========================
  /*
   * Loads saved data and updates the dashboard UI accordingly.
   */
  function initializeDashboard() {
    loadSavedLinks();
    setBackgroundImage();
    setDashboardTitle();
    setNotes();
    if (userCity) fetchWeather(userCity);
  }

  // ==========================
  // API Requests
  // ==========================
  /*
   * Fetches weather data for the user's city or current location and updates
   * the weather widget.
   */
  async function fetchWeather(userCity) {
    try {
      let cityName = userCity;

      if (!cityName) {
        const { lat, lon } = await getCurrentLocation();
        const apiUrlGeo = `https://geocode.maps.co/reverse?lat=${lat}&lon=${lon}&api_key=${API_KEYS.geocode}`;
        const responseGeo = await fetch(apiUrlGeo);
        const geoData = await responseGeo.json();
        cityName = geoData.address.city;
      }

      const apiUrlWeather = `http://api.weatherapi.com/v1/forecast.json?key=${API_KEYS.weather}&q=${cityName}&days=3&aqi=no&alerts=no`;
      const responseWeather = await fetch(apiUrlWeather);
      const weatherData = await responseWeather.json();
      populateWeatherWidget(weatherData);
    } catch (error) {
      showError("Unable to fetch weather data. Please try again later.");
      console.error("Error fetching location or weather data:", error);
    }
  }

  /*
   * Fetches a random background image from Unsplash and updates the dashboard.
   */
  async function fetchUnsplash() {
    const url = `https://api.unsplash.com/photos/random?client_id=${API_KEYS.unsplash}`;
    const img = document.querySelector(".background");

    try {
      const response = await fetch(url);
      const data = await response.json();
      const newImage = new Image();
      newImage.src = data.urls.full;
      newImage.onload = () => {
        img.style.backgroundImage = `url(${data.urls.full})`;
        localStorage.setItem("backgroundImage", data.urls.full);
      };
    } catch (error) {
      showError("Unable to fetch background image. Please try again later.");
      console.error("Error fetching background image:", error);
    }
  }

  /*
   * Fetches a random Chuck Norris joke and updates the Chuck Norris widget.
   */
  async function setChuckNorris() {
    const url = `https://api.chucknorris.io/jokes/random`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      populateChuckNorris(data);
    } catch (error) {
      console.error("Error fetching Chuck Norris:", error);
    }
  }

  // ==========================
  // Utility Functions
  // ==========================
  /*
   * Gets the user's current location using the browser's geolocation API.
   */
  function getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          resolve({ lat, lon });
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  /*
   * Updates the clock and date on the dashboard every second.
   */
  function myClock() {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const date = new Date();
    const timeString = `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")}`;
    const dateString = `${String(date.getDate()).padStart(2, "0")} ${
      monthNames[date.getMonth()]
    } ${date.getFullYear()}`;

    document.querySelector(".time").textContent = timeString;
    document.querySelector(".date").textContent = dateString;
  }

  // ==========================
  // UI Update Functions
  // ==========================
  /*
   * Loads saved links from localStorage and displays them in the link widget.
   */
  function loadSavedLinks() {
    savedLinks.forEach((link) => {
      const linkWidget = document.querySelector(".link-widget");
      const linkButton = document.getElementById("link-button");

      const linkElement = createLinkElement(link.title, link.url);
      linkWidget.insertBefore(linkElement, linkButton);
    });
  }

  /*
   * Sets the background image of the dashboard, either from localStorage or by
   * fetching a new one from Unsplash.
   */
  function setBackgroundImage() {
    const img = document.querySelector(".background");
    if (savedBackgroundImage) {
      img.style.backgroundImage = `url(${savedBackgroundImage})`;
    } else {
      fetchUnsplash();
    }
  }

  /*
   * Sets the dashboard title from localStorage.
   */
  function setDashboardTitle() {
    if (savedTitle) {
      document.querySelector(".dashboard-title").textContent = savedTitle;
    }
  }

  /*
   * Sets the notes area content from localStorage.
   */
  function setNotes() {
    if (savedNote) {
      document.querySelector(".notes-area").textContent = savedNote;
    }
  }

  /*
   * Populates the weather widget with data fetched from the weather API.
   */
  async function populateWeatherWidget(weatherData) {
    const weatherWidget = document.querySelector(".weather-widget");

    const weatherItems = weatherWidget.querySelectorAll(".weather-item");
    weatherItems.forEach((item) => item.remove());

    const button = weatherWidget.querySelector("button");

    const today = new Date();
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(today.getDate() + 2);
    const dayAfterTomorrowName = dayAfterTomorrow.toLocaleDateString("en-US", {
      weekday: "long",
    });

    const days = ["Today", "Tomorrow", dayAfterTomorrowName];

    for (let i = 0; i < 3; i++) {
      const day = days[i];
      const description =
        weatherData.forecast.forecastday[i].day.condition.text;
      const temperature = weatherData.forecast.forecastday[i].day.avgtemp_c;
      const iconUrl = weatherData.forecast.forecastday[i].day.condition.icon;

      const weatherElement = createWeatherElement(
        day,
        description,
        temperature,
        iconUrl
      );
      weatherWidget.insertBefore(weatherElement, button);
    }
  }

  /*
   * Populates the Chuck Norris widget with a fetched joke.
   */
  async function populateChuckNorris(joke) {
    const chuckWidget = document.querySelector(".chuck-widget");

    const chuckRemove = chuckWidget.querySelectorAll(".chuck-item");
    chuckRemove.forEach((item) => item.remove());

    const chuckItem = document.createElement("div");
    chuckItem.classList.add("chuck-item");

    const button = document.getElementById("chuck-button");

    const jokeElement = document.createElement("p");

    jokeElement.textContent = joke.value;
    chuckItem.appendChild(jokeElement);
    chuckWidget.insertBefore(chuckItem, button);
  }

  /*
   * Creates a weather element for the weather widget.
   */
  function createWeatherElement(day, description, temperature, iconUrl) {
    const weatherElement = document.createElement("div");
    weatherElement.classList.add("weather-item");

    const weatherIcon = document.createElement("img");
    weatherIcon.src = iconUrl;
    weatherIcon.alt = description;
    weatherIcon.classList.add("weather-icon");

    const dayElement = document.createElement("h4");
    dayElement.textContent = day;

    const descriptionElement = document.createElement("p");
    descriptionElement.textContent = description;

    const temperatureElement = document.createElement("p");
    temperatureElement.textContent = `${temperature}°C`;

    weatherElement.appendChild(weatherIcon);
    weatherElement.appendChild(dayElement);
    weatherElement.appendChild(descriptionElement);
    weatherElement.appendChild(temperatureElement);

    return weatherElement;
  }

  /*
   * Creates a link element for the link widget.
   */
  function createLinkElement(title, url) {
    const linkElement = document.createElement("div");
    linkElement.classList.add("link-item");

    const favicon = document.createElement("img");
    favicon.src = `https://www.google.com/s2/favicons?domain=${url}&sz=256`;
    favicon.alt = "Favicon";
    favicon.classList.add("favicon");

    const linkAnchor = document.createElement("a");
    linkAnchor.href = url;
    linkAnchor.target = "_blank";
    linkAnchor.textContent = title;

    linkAnchor.prepend(favicon);
    linkElement.appendChild(linkAnchor);

    const deleteButton = document.createElement("button");
    deleteButton.classList.add("delete-button");

    const deleteIcon = document.createElement("i");
    deleteIcon.classList.add("fa-solid", "fa-circle-minus");
    deleteButton.appendChild(deleteIcon);

    deleteButton.addEventListener("click", () => {
      const index = savedLinks.findIndex((link) => link.url === url);
      if (index !== -1) {
        savedLinks.splice(index, 1);
        localStorage.setItem("links", JSON.stringify(savedLinks));
      }
      linkElement.remove();
    });

    linkElement.appendChild(deleteButton);

    return linkElement;
  }

  /*
   * Displays an error message on the dashboard.
   */
  function showError(message) {
    const errorElement = document.querySelector(".error-message");
    errorElement.textContent = message;
    errorElement.style.display = "block";
  }

  /*
   * Sets up form submission handling for modals.
   */
  function setupModalForms() {
    document.querySelectorAll("form").forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const formId = form.id;

        if (formId === "link-form") {
          const title = document.getElementById("link-title").value;
          const url = document.getElementById("link-url").value;

          const linkWidget = document.querySelector(".link-widget");
          const linkElement = createLinkElement(title, url);

          const linkButton = document.getElementById("link-button");
          linkWidget.insertBefore(linkElement, linkButton);

          savedLinks.push({ title, url });
          localStorage.setItem("links", JSON.stringify(savedLinks));
        } else if (formId === "city-form") {
          const city = document.getElementById("city-input").value;
          localStorage.setItem("userCity", city);
          fetchWeather(city);
        }

        toggleModal(form.closest(".modal").id, false);
        form.reset();
      });
    });
  }

  /*
   * Toggles the visibility of a modal.
   */
  function toggleModal(modalId, show) {
    const modal = document.getElementById(modalId);
    modal.style.display = show ? "block" : "none";
  }
});
