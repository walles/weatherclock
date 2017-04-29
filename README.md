# Weather Clock
Try it here: <https://walles.github.io/weatherclock/>

Displays the weather forecast for the upcoming 11 hours for the current
location on a clock face.

It shows temperature where ordinary clocks show hour numbers, and weather
symbols for each hour.

## Clock Face Graphics
To update the clock face graphics:
* Edit `src/clock-face.blend` in [Blender](https://blender.org)
* Render and save as `clock-face.jpg`

## Favicon
To update the favicon:
* Edit `src/weatherclock.xcf` in [GIMP](https://gimp.org/)
* Export as PNG
* Generate favicons using <http://realfavicongenerator.net/>, make sure you
set the directory to `favicons` (no slashes)
* Follow instructions on that web site for how to apply the favicons, possibly
including updating the headers in `index.html`
* Commit changes to `src/weatherclock.xcf` and favicons

# TODO
* Be more obvious if the Geolocation request was denied or failed.
* Use proper sunset / sunrise hours to determine when to use night symbols.
* Somehow figure out location name and put it on the clock face just below the
center, kind of where the brand could be on an actual clock.
* Reset SVG before reloading weather.
* Move the clock hands each minute? Or each time the window is focused?
* Put the most recent log message on the clock face, and make sure the last
message contains the link to yr.no on success.
* Add wind speed visualization?
* Support Fahrenheit?
* Imagine somebody opens this page on a cell phone. They then put the web
  browser in the background. They then bring the web browser to the front again.
  When this happens, we should detect it and refresh ourselves, first the clock
  hands and then the forecasted weather.

# Dropped
* Draw precipitation from the center out. Basically a radial version of what
yr.no is doing in their weather graph. I was unable to come up with a visually
pleasing way of doing this.

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
* Put weather symbols on the clock face, between the temperatures and the clock
center, but much closer to the temperatures.
* Add link to Github project at the top of the page.
* Refactored timestamp handling
* Use night style icons at night.
* Make images properly centered in Firefox (and keep functionality in Chrome and
Safari).
* Check for Geolocation support and inform people if it's unsupported. Maybe
point them to some relevant URL for how to enable it?
* Make the unit tests pass on Firefox
* Position the hour numbers and weather symbols from Javascript
* Think about putting the weather symbols between the temperatures, because
  that's how we get them from yr.no.
* Handle places like Alcudia where we only get numbers for every three hours.
* Test on phone
* Test on other computer
* Fetch the forecast in the background.
* Add wind speed numbers in m/s
* Put some kind of border around / background behind the wind speed numbers
