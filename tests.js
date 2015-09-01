var parseXml;

// From: http://stackoverflow.com/a/3054210/473672
if (window.DOMParser) {
  parseXml = function(xmlStr) {
    return ( new window.DOMParser() ).parseFromString(xmlStr, "text/xml");
  };
} else if (typeof window.ActiveXObject != "undefined" && new window.ActiveXObject("Microsoft.XMLDOM")) {
  parseXml = function(xmlStr) {
    var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
    xmlDoc.async = "false";
    xmlDoc.loadXML(xmlStr);
    return xmlDoc;
  };
} else {
  parseXml = function() { return null; }
}

var xml_string = '<weatherdata><product class="pointData">' +
  '<time datatype="forecast" from="2015-08-27T19:00:00Z" to="2015-08-27T19:00:00Z">' +
  '  <location altitude="24" latitude="59.3190" longitude="18.0518">' +
  '    <temperature id="TTT" unit="celsius" value="17.9"/>' +
  '    <windDirection id="dd" deg="203.2" name="SW"/>' +
  '    <windSpeed id="ff" mps="3.2" beaufort="2" name="Svak vind"/>' +
  '    <windGust id="ff_gust" mps="5.7"/>' +
  '    <humidity value="74.1" unit="percent"/>' +
  '    <pressure id="pr" unit="hPa" value="1004.3"/>' +
  '    <cloudiness id="NN" percent="22.9"/>' +
  '    <fog id="FOG" percent="-0.0"/>' +
  '    <lowClouds id="LOW" percent="22.8"/>' +
  '    <mediumClouds id="MEDIUM" percent="0.0"/>' +
  '    <highClouds id="HIGH" percent="0.2"/>' +
  '    <dewpointTemperature id="TD" unit="celsius" value="13.3"/>' +
  '  </location>' +
  '</time>' +
  '<time datatype="forecast" from="2015-08-27T18:00:00Z" to="2015-08-27T19:00:00Z">' +
  '  <location altitude="24" latitude="59.3190" longitude="18.0518">' +
  '    <precipitation unit="mm" value="0.0" minvalue="0.0" maxvalue="0.0"/>' +
  '    <symbol id="LightCloud" number="2"/>' +
  '  </location>' +
  '</time>' +
  '</product></weatherdata>';
var xml = parseXml(xml_string);

QUnit.test("Weather XML Parsing Test", function(assert) {
  var expected = {};

  var d0 = new Date("2015-08-27T19:00:00Z");
  expected[d0] = {
    "celsius": "17.9",
    "symbol": undefined,
    "wind_m_s": "3.2"
  };

  var d1 = new Date("2015-08-27T18:00:00Z");
  expected[d1] = {
    "symbol": "2"
  };

  assert.deepEqual(parseWeatherXml(xml), expected);
});

QUnit.test("Temperature Positioning Test", function(assert) {
  var coordinates = getCoordinates(1, 35);
  assert.equal(coordinates.x, 17);
  assert.equal(coordinates.y, -30);

  coordinates = getCoordinates(8, 25, 9);
  assert.equal(coordinates.x, -22);
  assert.equal(coordinates.y, 13);
  assert.equal(coordinates.x0, -26);
  assert.equal(coordinates.y0, 9);
});
