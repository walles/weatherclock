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
        ";content_type=image/png";
    }

    document.getElementById(renderHour + "h").textContent = temperatureString;
    document.getElementById(renderHour + "himage").setAttribute("xlink:href", symbolUrl);
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
