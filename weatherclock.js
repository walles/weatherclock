"use strict";

/* global document */
/* global console */
/* global navigator */
/* global XMLHttpRequest */

var HOUR_RADIUS = 35;
var SYMBOL_RADIUS = 25;
var SYMBOL_SIZE = 9;

function log(message) {
  document.getElementById("log").innerHTML += message + "\n";
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

    var from = new Date(prognosis.attributes.from.value);
    var to = new Date(prognosis.attributes.to.value);
    var dh = (to.getTime() - from.getTime()) / (3600 * 1000);

    if (dh === 1) {
      // The symbol is really for a range, but we pretend it's for the hour
      // where it starts for now. FIXME: How should we really visualize this?
      var symbolNode = prognosis.getElementsByTagName("symbol")[0];
      var symbolNumber = symbolNode.attributes.number.value;

      var forecast = forecasts[from];
      if (!forecast) {
        forecast = {};
      }
      forecast.symbol = symbolNumber;

      forecasts[from] = forecast;
      continue;
    }

    if (dh != 0) {
      // We only want the per-hour prognoses
      continue;
    }

    var timestamp = from; // (=== to)

    var celsiusNode = prognosis.getElementsByTagName("temperature")[0];
    var celsiusValue = celsiusNode.attributes.value.value;

    var windNode = prognosis.getElementsByTagName("windSpeed")[0];
    var windValue = windNode.attributes.mps.value;

    var forecast = forecasts[timestamp];
    if (!forecast) {
      forecast = {};
    }
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

/**
 * @param {number} hour - What hour to get coordinates for
 * @param {number} radius - How far from the center the coordinate should
 * be, 0-50
 * @param {number} [size] - The width and height of a square we want to draw
 *
 * @returns {object} - Contains center x, y and upper left x0, y0
 */
function getCoordinates(hour, radius, size) {
  var a = 2 * Math.PI * (hour / 12.0);

  var returnMe = {};
  returnMe.x =  Math.round(Math.sin(a) * radius);
  returnMe.y = -Math.round(Math.cos(a) * radius);

  if (size !== undefined) {
    returnMe.x0 = returnMe.x - (size - 1) / 2;
    returnMe.y0 = returnMe.y - (size - 1) / 2;
  }

  return returnMe;
}

function addHourString(hour, string) {
  var text = document.createElement("text");
  text.setAttribute("class", "hour");

  var coordinate = getCoordinates(hour, HOUR_RADIUS);
  text.setAttribute("x", coordinate.x);
  text.setAttribute("y", coordinate.y);

  text.appendChild(document.createTextNode(hour));

  document.getElementById("weatherclock").appendChild(text);

  console.log(text);
}

function renderClock(weather) {
  var baseTimestamp = new Date();
  baseTimestamp.setMinutes(0);
  baseTimestamp.setSeconds(0);
  baseTimestamp.setMilliseconds(0);

  var baseHour = baseTimestamp.getHours() % 12;

  for (var dh = 0; dh < 12; dh++) {
    var renderTimestamp = new Date(baseTimestamp.getTime() + dh * 3600 * 1000);
    var renderHour = (baseHour + dh) % 12;
    var renderWeather = weather[renderTimestamp];

    var temperatureString = "";
    var symbolUrl = "";

    var renderHour24 = renderTimestamp.getHours();

    // FIXME: Replace 2100-0600 night with actual sunset / sunrise based limits
    var isNight = (renderHour24 < 7) || (renderHour24 > 20);

    log(renderHour + ": " + renderTimestamp + ": " + renderWeather);

    if (dh === 0) {
      // To indicate where the line is between now and now + 12h, we leave the
      // current hour empty.
    } else if (renderWeather) {
      temperatureString = Math.round(renderWeather.celsius) + "°";

      // Note that we *could* download an SVG weather symbol, but that doesn't
      // work on Firefox 38.0.5 so we do PNG instead. And since cell phone screens
      // are what we're aiming for, PNG should be fine.
      var symbolUrl =
        "http://crossorigin.me/http://api.met.no/weatherapi/weathericon/1.1/?symbol=" +
        renderWeather.symbol +
        ";content_type=image/png;is_night=" +
        (isNight ? 1 : 0);
    }

    addHourString(renderHour, temperatureString);
    document.getElementById(renderHour + "himage").setAttribute("xlink:href", symbolUrl);
  }
}

function setPosition(position) {
  var lat = position.coords.latitude;
  var lon = position.coords.longitude;
  log("Position: lat=" + lat + " lon=" + lon);

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

function doWeather() {
  if (navigator.geolocation) {
    // One-shot position request
    log("Getting current position...");
    navigator.geolocation.getCurrentPosition(setPosition, positioningError);
  } else {
    log("ERROR: Geolocation unsupported, try enabling it: https://waziggle.com/BrowserAllow.aspx")
  }
}
