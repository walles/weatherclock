# Weather Clock
Displays the weather forecast for the upcoming 12 (11?) hours for the current
location on a clock face.

It shows temperature where ordinary clocks show hour numbers.

# TODO
* Put weather symbols on the clock face, between the temperatures and the clock center, but much closer to the temperatures.
* Draw precipitation from the center out. Basically a radial version of what yr.no is doing in their weather graph.
* Handle places like Alcudia where we only get numbers for every three hours.
* Somehow figure out location name and put it on the clock face just below the center, kind of where the brand could be on an actual clock.
* Reset SVG before reloading weather.
* Move the clock hands each minute? Or each time the window is focused?
* Test on phone
* Test on other computer
* Add wind speed visualization?
* Support Fahrenheit?

# DONE
* Display an SVG clock face.
* Demonstrate setting temperature numbers at the different hour positions from Javascript.
* Download weather for hard coded location.
* Put temperature numbers on clock face
* Draw clock hands
* Use the current location
* Appropriately give credit to yr.no for the weather data.
* Clean up the clock to be just a circle with numbers in it.
* Clarify where the line goes between the current temperature and forecasts.
