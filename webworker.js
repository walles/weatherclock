"use strict";

/* global postMessage */
/* global XMLHttpRequest */
/* global addEventListener */

// See: http://www.html5rocks.com/en/tutorials/workers/basics/
addEventListener('message', function(e) {
  log("Got message from main thread: [" + e.data.join() + "]");
  try {
    handleMessage(e.data);
  } catch (err) {
    logError(err.message + "\n" + err.stack);
  }
}, false);

function log(message) {
  postMessage(['log', message]);
}

function logError(message) {
  postMessage(['logError', message]);
}

function ga() {
  // See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments

  // We can't use Array.from() since it doesn't work in Samsung's Android
  // browser version 4.0.10-53.
  var arg_array = Array.prototype.slice.call(arguments);
  postMessage(['ga'].concat(arg_array));
}

function handleMessage(message) {
  var verb = message[0];
  if (verb == "fetch weather for position") {
    var lat = message[1];
    var lon = message[2];
    var weatherXmlString = fetchWeather(lat, lon);

    postMessage(["setWeatherXmlString", weatherXmlString]);
  } else {
    logError("Unknown verb from main thread: <" + verb + ">");
  }
}

function fetchWeather(lat, lon) {
  // Fetch weather from yr.no, via a proxy (due to upstream's (lack of) CORS
  // settings).
  //
  // Proxy information here: https://github.com/walles/api-met-no-proxy
  var url =
    "https://api-met-no-proxy.appspot.com/weatherapi/locationforecast/1.9/?lat="
    + lat
    + ";lon="
    + lon;
  log("Getting weather from: " + url);

  var t0_millis = (new Date()).getTime();
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", url, false);
  xmlhttp.send();
  var t1_millis = (new Date()).getTime();
  var dt_seconds = (t1_millis - t0_millis) / 1000.0;
  ga('set', 'metric1', dt_seconds.toString());

  if (xmlhttp.status < 200 || xmlhttp.status > 299) {
    throw new Error("Status " + xmlhttp.status + ": " + xmlhttp.statusText);
  }

  // FIXME: Can we return .response here to get a parsed document?
  return xmlhttp.responseText;
}
