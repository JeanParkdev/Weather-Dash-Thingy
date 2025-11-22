// ================= Config =================
const API_KEY = "7c9ed8793e951449fff269b75abd7350"; // <- OpenWeatherMap API key here
const BASE_URL = "https://api.openweathermap.org/data/2.5";

// ================= DOM Elements =================
const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");


const message = document.getElementById("message");

const currentWeatherSection = document.getElementById("current-weather");
const currentCity = document.getElementById("current-city");
const currentDate = document.getElementById("current-date");
const currentTemp = document.getElementById("current-temp");
const currentDescription = document.getElementById("current-description");
const currentIcon = document.getElementById("current-icon");
const currentHumidity = document.getElementById("current-humidity");
const currentWind = document.getElementById("current-wind");
const currentFeelsLike = document.getElementById("current-feels-like");

const forecastSection = document.getElementById("forecast");
const forecastGrid = document.getElementById("forecast-grid");

// ================= Helpers =================
function setMessage(text, type = "info") {
  if (!text) {
    message.textContent = "";
    message.className = "mt-2 small";
    return;
  }

  let className = "mt-2 small";

  if (type === "error") {
    className += " text-danger";
  } else if (type === "success") {
    className += " text-success";
  } else {
    className += " text-muted";
  }

  message.textContent = text;
  message.className = className;
}

function formatDate(timestamp, options = {}) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString(undefined, {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  });
}

function setLoading(isLoading) {
  const buttons = [...searchForm.querySelectorAll("button")];
  buttons.forEach((btn) => (btn.disabled = isLoading));
  cityInput.disabled = isLoading;

  if (isLoading) {
    setMessage("Loading weather data...", "info");
  } else {
    setMessage("");
  }
}

// ================= API Calls =================
async function fetchCurrentWeatherByCity(city) {
  const url = `${BASE_URL}/weather?q=${encodeURIComponent(
    city
  )}&appid=${API_KEY}&units=metric`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("City not found. Try another city name.");
  }
  return res.json();
}

async function fetchCurrentWeatherByCoords(lat, lon) {
  const url = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Could not fetch weather for your location. Please try again.");
  }
  return res.json();
}

async function fetchForecast(lat, lon) {
  const url = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Could not fetch forecast data :( Try again later.");
  }
  return res.json();
}

// ================= Rendering =================
function renderCurrentWeather(data) {
  const {
    name,
    sys: { country },
    main: { temp, feels_like, humidity },
    weather,
    wind,
    dt,
  } = data;

  const [conditions] = weather;
  const iconUrl = `https://openweathermap.org/img/wn/${conditions.icon}@2x.png`;

  currentCity.textContent = `${name}, ${country}`;
  currentDate.textContent = `Updated: ${formatDate(dt)}`;
  currentTemp.textContent = `${Math.round(temp)}°C`;
  currentFeelsLike.textContent = `${Math.round(feels_like)}°C`;
  currentDescription.textContent = conditions.description;
  currentIcon.src = iconUrl;
  currentIcon.alt = conditions.description;
  currentHumidity.textContent = `${humidity}%`;
  currentWind.textContent = `${wind.speed} m/s`;

  currentWeatherSection.classList.remove("d-none");
}

function renderForecast(data) {
  // 5-day forecast: one entry per day around midday
  const dailyMap = new Map();

  data.list.forEach((entry) => {
    const date = new Date(entry.dt * 1000);
    const dayKey = date.toISOString().slice(0, 10); // YYYY-MM-DD
    const hour = date.getHours();

    const current = dailyMap.get(dayKey);
    if (!current || Math.abs(hour - 12) < Math.abs(current.hour - 12)) {
      dailyMap.set(dayKey, { ...entry, hour });
    }
  });

  const dailyEntries = Array.from(dailyMap.values()).slice(0, 5);
  forecastGrid.innerHTML = "";

  dailyEntries.forEach((entry, index) => {
    const date = new Date(entry.dt * 1000);
    const dayName = date.toLocaleDateString(undefined, { weekday: "short" });
    const label = index === 0 ? "Today" : dayName;
    const iconCode = entry.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

    const max = Math.round(entry.main.temp_max);
    const min = Math.round(entry.main.temp_min);

    const col = document.createElement("div");
    col.className = "col-6 col-md-4 col-lg-2";

    const card = document.createElement("div");
    card.className = "forecast-day h-100";

    card.innerHTML = `
      <div class="day-name">${label}</div>
      <div class="date">${date.toLocaleDateString()}</div>
      <img src="${iconUrl}" alt="${entry.weather[0].description}">
      <div class="temps mt-1">
        <span class="max">${max}°C</span>
        <span class="min">${min}°C</span>
      </div>
    `;

    col.appendChild(card);
    forecastGrid.appendChild(col);
  });

  forecastSection.classList.remove("d-none");
}

// ================= Event Handlers =================
async function handleSearchSubmit(e) {
  e.preventDefault();

  const city = cityInput.value.trim();
  if (!city) return;

  setLoading(true);

  try {
    const current = await fetchCurrentWeatherByCity(city);
    renderCurrentWeather(current);

    const { lat, lon } = current.coord;
    const forecast = await fetchForecast(lat, lon);
    renderForecast(forecast);

    setMessage(`Showing weather for ${current.name}, ${current.sys.country}`, "success");
  } catch (err) {
    setMessage(err.message || "Something went wrong. Please try again.", "error");
  } finally {
    setLoading(false);
  }
}


// ================= RANDOM IMAGE STACK =================

const imageList = [
  "https://media1.tenor.com/m/RcCT-Pcsm9MAAAAd/hot-dog.gif",
  "https://media1.tenor.com/m/MIKY8TfBNjkAAAAd/hot-cat.gif",
  "https://media1.tenor.com/m/gUErzB7zjJ0AAAAd/storm-puppies.gif",
  "https://media1.tenor.com/m/aAbI7iFp7lkAAAAd/windy-corgi.gif",
  "https://media1.tenor.com/m/Y7QklzR9M1oAAAAd/snow-dog.gif",
  "https://media1.tenor.com/m/CuQRMd3TXV0AAAAd/panda-animal.gif",
  "https://media1.tenor.com/m/IH5tzJxWJHkAAAAd/funny-animals-dogs.gif",
  "https://media1.tenor.com/m/ppNCvD5sbp4AAAAd/elmo-thunder.gif",
  "https://media1.tenor.com/m/y-sCw-1ZxQEAAAAd/dog-dogs.gif"
];

function displayRandomImages() {
  const container = document.getElementById("random-image-stack");
  if (!container) return;

  // Shuffles array
  const shuffled = imageList.sort(() => Math.random() - 0.5);

  // Takes the first 3 images
  const selected = shuffled.slice(0, 3);

  // Renders images 
  container.innerHTML = selected
    .map(
      (src) => `
        <img
          src="${src}"
          class="img-fluid rounded-4 shadow-sm mb-3"
          style="object-fit: cover; width: 100%; height: 180px;"
          alt="Weather image"
        />
      `
    )
    .join("");
}

document.addEventListener("DOMContentLoaded", displayRandomImages);
// ================= Init =================
searchForm.addEventListener("submit", handleSearchSubmit);

