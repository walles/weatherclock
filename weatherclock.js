"use strict";

/* global document */
/* global console */
/* global navigator */
/* global XMLHttpRequest */

function log(message) {
  document.getElementById("log").innerHTML
  += message
  + "\n";
  console.log(message);
}

/* Parses weather XML from yr.no into a weather object that maps timestamps (in
* seconds since the epoch) to forecasts. A forecast has these fields:
*
* .celsius: The forecasted temperatures in centigrades
*
* .wind_m_s: The forecasted wind speed
*
* .symbol: The weather symbol index. Resolve using
*         http://api.yr.no/weatherapi/weathericon
*/
function parseWeatherXml(weatherXml) {
  var allPrognoses = weatherXml.getElementsByTagName("time");
  log("Parsing " + allPrognoses.length + " prognoses...");

  var forecasts = {};
  for (var i = 0; i < allPrognoses.length; i++) {
    var prognosis = allPrognoses[i];
    var from = prognosis.attributes.from.value;
    var to = prognosis.attributes.to.value;
    if (from !== to) {
      // We only want the per-hour prognoses
      continue;
    }

    var timestamp = Date.parse(from);

    var celsiusNode = prognosis.getElementsByTagName("temperature")[0];
    var celsiusValue = celsiusNode.attributes.value.value;

    var windNode = prognosis.getElementsByTagName("windSpeed")[0];
    var windValue = windNode.attributes.mps.value;

    var symbolNode = nextPrognosis.getElementsByTagName("symbol")[0];
    var symbolNumber = symbolNode.attributes.number.value;

    var forecast = {};
    forecast.celsius = celsiusValue;
    forecast.wind_m_s = windValue;
    forecast.symbol = symbolNumber;

    forecasts[timestamp] = forecast;
  }

  return forecasts;
}

function fetchWeather(lat, lon) {
  // Fetch weather from yr.no
  var url =
    "http://crossorigin.me/http://api.met.no/weatherapi/locationforecast/1.9/?lat="
    + lat
    + ";lon="
    + lon;
  log("Getting weather from: " + url);

  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", url, false);
  xmlhttp.send();
  var xmldoc = xmlhttp.responseXML;
  log("Got weather XML...");
  log(xmldoc);

  return parseWeatherXml(xmldoc);
}

function renderClock(weather) {
  // Empty the current hour marker to indicate where the forecast wraps
  var currentHour = new Date().getHours() % 12;
  document.getElementById(currentHour + "h").textContent = "";

  // yr.no gives us data starting from the next hour
  var baseHour = (currentHour + 1) % 12;

  // Loop over 11 hours, because we want to keep the one where the forecast
  // wraps blank.
  for (var dh = 0; dh < 11; dh++) {
    var h = (baseHour + dh) % 12;
    log(h + ": "
      + weather.symbols[dh] + ", "
      + weather.precipitation[dh] + "mm, "
      + weather.temperatures[dh] + "C, "
      + weather.wind[dh] + "m/s");

    // Show temperature for this hour
    var temperatureString = Math.round(weather.temperatures[dh]) + "°";
    document.getElementById(h + "h").textContent = temperatureString;

    // Note that we *could* download an SVG weather symbol, but that doesn't
    // work on Firefox 38.0.5 so we do PNG instead. And since cell phone screens
    // are what we're aiming for, PNG should be fine.
    var symbolUrl =
      "http://crossorigin.me/http://api.met.no/weatherapi/weathericon/1.1/?symbol=" +
      weather.symbols[dh] +
      ";content_type=image/png";
    document.getElementById(h + "himage").setAttribute("xlink:href", symbolUrl);
  }
}

function setPosition(position) {
  var lat = position.coords.latitude;
  var lon = position.coords.longitude;
  log("Position: lat="
  + lat
  + " lon="
  + lon);

  renderClock(fetchWeather(lat, lon));
}

function positioningError(positionError) {
  log("ERROR: " + positionError.message);
  log("ERROR: Can't show weather for unknown location, giving up :(");
}

function setClock() { // eslint-disable-line no-unused-vars
  var currentHour = new Date().getHours();
  currentHour %= 12;
  var currentMinutes = new Date().getMinutes();
  var hourTransform = "rotate(" + (((currentHour * 60) + currentMinutes) * 360 / (12 * 60)) + ")";
  log("Hour transform: " + hourTransform);
  document.getElementById("hour-hand").setAttributeNS(null, "transform", hourTransform);

  var minuteTransform = "rotate(" + (currentMinutes * 360 / 60) + ")";
  log("Minute transform: " + minuteTransform);
  document.getElementById("minute-hand").setAttributeNS(null, "transform", minuteTransform);
}

// One-shot position request.
navigator.geolocation.getCurrentPosition(setPosition, positioningError);
