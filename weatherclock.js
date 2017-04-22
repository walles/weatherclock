"use strict";

/* global ga */
/* global alert */
/* global window */
/* global Worker */
/* global console */
/* global document */
/* global location */
/* global navigator */

var HOUR_RADIUS = 35;
var WIND_TEXT_RADIUS = 13;
var SYMBOL_RADIUS = 25;
var SYMBOL_SIZE = 9;

var SVG_NS = "http://www.w3.org/2000/svg";
var XLINK_NS = "http://www.w3.org/1999/xlink";

// WORKER will be initialized lazily the first time we post a message. The unit
// tests didn't work until we made this lazy.
var WORKER = undefined;

// Handle messages from webworker.js, thrown exceptions will be logged
function handleMessage(message) {
  var verb = message[0];
  if (verb == "log") {
    log(message[1]);
  } else if (verb == "logError") {
    logError(message[1]);
  } else if (verb == "ga") {
    ga.apply(ga, message.slice(1));
  } else if (verb == "setWeatherXmlString") {
    var xmlObject = (new window.DOMParser()).parseFromString(message[1], "text/xml");
    var forecasts = parseWeatherXml(xmlObject);
    renderClock(forecasts);

    // We're done, flush metrics to Google Analytics
    ga('send', 'event', 'rendering', 'success');
  } else {
    logError("Unknown verb from worker thread: <" + verb + ">");
  }
}

function log(message) {
  console.log(message);
}

function logError(message) {
  ga('send', 'exception', {
    'exDescription': message,
    'exFatal': true
  });

  console.log("ERROR: " + message);
  ga('send', 'event', 'rendering', 'failure');
  alert(message);
}

/* Parses weather XML from yr.no into a weather object that maps timestamps (in
* seconds since the epoch) to forecasts. A forecast has these fields:
*
* .celsius: The forecasted temperatures in centigrades
*
* .wind_m_s: The forecasted wind speed
*
* .symbol: The weather symbol index. Resolve using
*         https://api.yr.no/weatherapi/weathericon
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

    var symbolNodes = prognosis.getElementsByTagName("symbol");
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
  var now_ms = new Date().getTime();
  var start = new Date(now_ms + 0.75 * 3600 * 1000);
  var end = new Date(now_ms + 11.75 * 3600 * 1000);

  var maxWindMs = undefined;
  var minWindMs = undefined;
  for (var timestamp in weather) {
    if (!weather.hasOwnProperty(timestamp)) {
      continue;
    }

    timestamp = new Date(timestamp);

    if (timestamp < start) {
      continue;
    }

    if (timestamp > end) {
      continue;
    }

    var hour = timestamp.getHours() + timestamp.getMinutes() / 60.0;

    var render_weather = weather[timestamp];

    var celsius = render_weather.celsius;
    if (celsius !== undefined) {
      var temperatureString = Math.round(celsius) + "°";
      addHourString(hour, temperatureString);
    }

    var symbol = render_weather.symbol;
    if (symbol !== undefined) {
      // FIXME: Replace 2100-0600 night with actual sunset / sunrise based limits
      var isNight = (hour < 7) || (hour > 20);

      // Note that we *could* download an SVG weather symbol, but that doesn't
      // work on Firefox 38.0.5 so we do PNG instead. And since cell phone screens
      // are what we're aiming for, PNG should be fine.
      var symbolUrl =
        "https://api.met.no/weatherapi/weathericon/1.1/?symbol=" +
        symbol +
        ";content_type=image/png;is_night=" +
        (isNight ? 1 : 0);

        addHourSymbol(hour, symbolUrl);
    }

    var windMs = Math.round(render_weather.wind_m_s);
    if (maxWindMs == undefined || windMs > maxWindMs) {
      maxWindMs = windMs;
    }
    if (minWindMs == undefined || windMs < minWindMs) {
      minWindMs = windMs;
    }
  }

  drawWind(minWindMs, maxWindMs);
}

function drawWind(minWindMs, maxWindMs) {
  var windString;
  if (minWindMs == maxWindMs) {
    // "3m/s"
    windString = "" + minWindMs + "m/s";
  } else {
    // "3-7 m/s"
    windString = "" + minWindMs + "-" + maxWindMs + " m/s";
  }
  console.log("Wind: " + windString);
  document.getElementById("wind").textContent = windString;
}

function positioningError(positionError) {
  logError(positionError.message);
}

function setClock() {
  var currentHour = new Date().getHours() % 12;
  var currentMinutes = new Date().getMinutes();

  var hourDegrees = (((currentHour * 60) + currentMinutes) * 360 / (12 * 60));
  var hourTransform = "rotate(" + hourDegrees + ")";
  log("Hour transform: " + hourTransform);
  document.getElementById("hour-hand").setAttributeNS(null, "transform", hourTransform);

  var minuteDegrees = (currentMinutes * 360 / 60);
  var minuteTransform = "rotate(" + minuteDegrees + ")";
  log("Minute transform: " + minuteTransform);
  document.getElementById("minute-hand").setAttributeNS(null, "transform", minuteTransform);

  // FIXME: Move the wind text element to a place where it is not obscured by the dials
  // First, score each direction by how far the closest hand is
  var bestDegrees = 0;
  var bestScore = 0;
  for (var i = 0; i < 4; i++) {
    var degrees = i * 90;
    var minuteDistance = degreeDistance(degrees, minuteDegrees);
    var hourDistance = degreeDistance(degrees, hourDegrees);

    // How many degrees away is the closest hand?
    var score = Math.min(minuteDistance, hourDistance);
    console.log("Score for " + degrees + " degrees: " + score);

    if (score > bestScore) {
      bestScore = score;
      bestDegrees = degrees;
    }
  }
  console.log("Best degrees to put wind numbers: " + bestDegrees);
  var bestRadians = bestDegrees * (Math.PI / 180);

  var windText = document.createElementNS(SVG_NS, "text");
  windText.setAttributeNS(null, "class", "wind");
  windText.setAttributeNS(null, "id", "wind");

  windText.setAttributeNS(null, "x", WIND_TEXT_RADIUS * Math.sin(bestRadians));
  windText.setAttributeNS(null, "y", WIND_TEXT_RADIUS * -Math.cos(bestRadians));

  // Insert an empty text node for the wind text, to be filled in by drawWind()
  windText.appendChild(document.createTextNode(""));

  // Insert text after clock frame to make it appear like background
  var clockFrame = document.getElementById("clock-frame");
  // From: http://stackoverflow.com/a/4793630/473672
  clockFrame.parentNode.insertBefore(windText, clockFrame.nextSibling);
}

function degreeDistance(d0, d1) {
  var distance = Math.abs(d1 - d0);
  if (distance > 180) {
    distance = 360 - distance;
  }
  return distance;
}

function postMessage(message) {
  if (WORKER == undefined) {
    WORKER = new Worker("webworker.js");
    WORKER.addEventListener('message', function(e) {
      log("Got message from worker thread: [" + e.data.join() + "]");
      try {
        handleMessage(e.data);
      } catch (err) {
        logError(err.message + "\n" + err.stack);
      }
    }, false);
  }

  WORKER.postMessage(message);
}

function doWeather() {
  if (navigator.geolocation) {
    // One-shot position request
    log("Getting current position...");
    var t0_millis = (new Date()).getTime();
    navigator.geolocation.getCurrentPosition(function _setPosition(position) {
      var t1_millis = (new Date()).getTime();
      var dt_seconds = (t1_millis - t0_millis) / 1000.0;
      ga('set', 'metric2', dt_seconds.toString());

      document.getElementById("hour-hand").style.visibility = "visible";
      document.getElementById("minute-hand").style.visibility = "visible";

      var lat = position.coords.latitude;
      var lon = position.coords.longitude;
      postMessage(["fetch weather for position", lat, lon]);
    }, positioningError);
  } else {
    logError("Geolocation unsupported");
  }

  setClock();
}

function main() { // eslint-disable-line no-unused-vars
  // Redirect to https, this helps with positioning in some circumstances
  var protocol = location.protocol;
  if (protocol == "http:") {
    // From http://stackoverflow.com/a/4723302/473672
    window.location.href = "https:" + window.location.href.substring(window.location.protocol.length);
    return;
  }

  doWeather();
}
