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

/* Parses weather XML from yr.no into a weather object with three
* array properties.  Each array has twelve element; one for each hour
* of the clock.
*
* The first element of each array is for the upcoming hour.
* * temperatures (in celsius)
* * wind (in m/s)
* * precipitation  (in mm)
* * weather symbol (string, FIXME: should maybe be URL to icon?)
*/
function parseWeatherXml(weatherXml) {
  var allPrognoses = weatherXml.getElementsByTagName("time");
  log("Parsing " + allPrognoses.length + " prognoses...");

  var temperatures = [];
  var wind = [];
  var precipitation = [];
  var symbols = [];
  for (var i = 0; i < allPrognoses.length; i++) {
    var prognosis = allPrognoses[i];
    var from = prognosis.attributes.from.value;
    var to = prognosis.attributes.to.value;
    if (from !== to) {
      // We only want the per-hour prognoses
      continue;
    }

    var celsiusNode = prognosis.getElementsByTagName("temperature")[0];
    var celsiusValue = celsiusNode.attributes.value.value;
    var windNode = prognosis.getElementsByTagName("windSpeed")[0];
    var windValue = windNode.attributes.mps.value;

    var nextPrognosis = allPrognoses[i + 1];

    var precipitationNode = nextPrognosis.getElementsByTagName("precipitation")[0];
    var precipitationValue = precipitationNode.attributes.value.value;
    var symbolNode = nextPrognosis.getElementsByTagName("symbol")[0];
    var symbolValue = symbolNode.attributes.id.value;

    temperatures.push(celsiusValue);
    wind.push(windValue);
    precipitation.push(precipitationValue);
    symbols.push(symbolValue);

    if (temperatures.length >= 12) {
      break;
    }
  }

  var weather = {};
  weather.temperatures = temperatures;
  weather.wind = wind;
  weather.precipitation = precipitation;
  weather.symbols = symbols;
  return weather;
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
  var currentHour = new Date().getHours();
  currentHour %= 12;

  for (var dh = 0; dh < 12; dh++) {
    var h0 = (currentHour + dh) % 12;
    if (h0 === 0) {
      h0 = 12;
    }
    var h1 = (h0 + 1) % 12;
    if (h1 === 0) {
      h1 = 12;
    }
    log(h0 + "-" + h1 + ": "
    + weather.symbols[dh] + ", "
    + weather.precipitation[dh] + "mm");
    log("  " + h1 + ": "
    + weather.temperatures[dh] + "C, "
    + weather.wind[dh] + "m/s");

    // Show temperature for this hour
    document.getElementById(h1 + "h").textContent =
    Math.round(weather.temperatures[dh])
    + "°";
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
