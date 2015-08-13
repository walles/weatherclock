"use strict";

/* global angular */

var LAT = 60.10;
var LON = 9.58;

var app = angular.module("weatherClockApp", []);

app.controller("weatherClockCtrl", function($scope, $http) {
  $scope.status = "Downloading weather...";

  // http://api.met.no/weatherapi/locationforecast/1.9/documentation
  var url = "http://api.met.no/weatherapi/locationforecast/1.9/?lat=" + LAT + ";lon=" + LON;
  $http.get(url).
    then(function(response) {
      $scope.status = "Weather download succeeded: " + response;
    }, function(response) {
      $scope.status = "Weather download failed: " + response;
    });
});
