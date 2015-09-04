"use strict";

/* global document */
/* global console */
/* global navigator */
/* global XMLHttpRequest */

var HOUR_RADIUS = 35;
var SYMBOL_RADIUS = 25;
var SYMBOL_SIZE = 9;

var SVG_NS = "http://www.w3.org/2000/svg";
var XLINK_NS = "http://www.w3.org/1999/xlink";

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
    var timestamp = new Date((from.getTime() + to.getTime()) / 2);

    var forecast = forecasts[timestamp];
    if (!forecast) {
      forecast = {};
    }

    if (forecast.span_h !== undefined && forecast.span_h <= dh) {
      // There's already better data here
      continue;
    }

    forecast.span_h = dh;

    var symbolNodes = prognosis.getElementsByTagName("symbol")
    if (symbolNodes && symbolNodes.length > 0) {
      var symbolNumber = symbolNodes[0].attributes.number.value;
      forecast.symbol = symbolNumber;
    }

    var celsiusNodes = prognosis.getElementsByTagName("temperature");
    if (celsiusNodes && celsiusNodes.length > 0) {
      var celsiusValue = celsiusNodes[0].attributes.value.value;
      forecast.celsius = celsiusValue;
    }

    var windNodes = prognosis.getElementsByTagName("windSpeed");
    if (windNodes && windNodes.length > 0) {
      var windValue = windNodes[0].attributes.mps.value;
      forecast.wind_m_s = windValue;
    }

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
  var text = document.createElementNS(SVG_NS, "text");
  text.setAttributeNS(null, "class", "hour");

  var coordinate = getCoordinates(hour, HOUR_RADIUS);
  text.setAttributeNS(null, "x", coordinate.x);
  text.setAttributeNS(null, "y", coordinate.y);

  text.appendChild(document.createTextNode(string));

  // Insert text before the hands to get the hands rendered on top
  var clock = document.getElementById("weatherclock");
  var hourHand = document.getElementById("hour-hand");
  clock.insertBefore(text, hourHand);
}

function addHourSymbol(hour, url) {
  var image = document.createElementNS(SVG_NS, "image");

  var coordinate = getCoordinates(hour, SYMBOL_RADIUS, SYMBOL_SIZE);
  image.setAttributeNS(null, "x", coordinate.x0);
  image.setAttributeNS(null, "y", coordinate.y0);

  image.setAttributeNS(null, "width", SYMBOL_SIZE);
  image.setAttributeNS(null, "height", SYMBOL_SIZE);

  image.setAttributeNS(XLINK_NS, "href", url);

  // Insert image before the hands to get the hands rendered on top
  var clock = document.getElementById("weatherclock");
  var hourHand = document.getElementById("hour-hand");
  clock.insertBefore(image, hourHand);
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
    addHourSymbol(renderHour, symbolUrl);
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
