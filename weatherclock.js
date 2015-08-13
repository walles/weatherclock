"use strict";

/* global angular */

var LAT = 60.10;
var LON = 9.58;

var app = angular.module("weatherClockApp", []);

app.controller("weatherClockCtrl", function($scope, $http) {
  $scope.status = "Downloading weather...";

  // http://openweathermap.org/forecast5#geo5
  var url = "http://api.openweathermap.org/data/2.5/forecast?lat=" + LAT + "&lon=" + LON;
  $http.get(url).
    then(function(response) {
      $scope.status = "Weather download succeeded: " + response;
    }, function(response) {
      $scope.status = "Weather download failed: " + response;
    });
});
