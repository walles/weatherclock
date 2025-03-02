# Weather Clock

Try it here: <https://walles.github.io/weatherclock/>

[![Screenshot](weatherclock-screenshot.webp)](https://walles.github.io/weatherclock/)

Displays the weather forecast for the upcoming 11 hours for the current location
on a clock face. On clear nights it shows northern ligths forecasts.

It shows temperature where ordinary clocks show hour numbers, and weather
symbols for each hour.

You can force a position using query parameters `?latitude=...&longitude=...`.

## Clock Face Graphics

To update the clock face graphics:

- Edit `src/images/clock-frame.blend` using [Blender](https://blender.org)
- Render and save as `public/clock-frame.png`

## Favicon

To update the favicon:

- Edit `src/images/weatherclock.xcf` using [GIMP](https://gimp.org/)
- Overwrite the following files with your changes:
  - `public/favicon.ico`
  - `public/logo192.png`
  - `public/logo512.png`
- Commit changes to `src/weatherclock.xcf` and the icons in `public/`

## Northern Lights Icons

To update the northern lights icons:

- Edit `src/images/aurora-icon.blend` using [Blender](https://blender.org)
- Render icons into `public/aurora-high.png` and `public/aurora-low.png`

## Deploy

To deploy updates:

```bash
npm run deploy
```

## Proxy

Since <yr.no>'s REST API doesn't (or didn't) support being run from browsers,
there's a Google Cloud Function proxying the requests. Source code lives in
the [proxy-go](proxy-go) directory.

## TODO

- Tick the hands automatically
- Consider now-vs-tomorrow dropdown placement on both narrow and tall screen
  layouts.
- Make the now-vs-tomorrow dropdown more visible?
- Report a page view each time the page becomes visible. Do we get an initial
  visibility event on page load?
- Report geolocation and weather download timings to Google Analytics
- Remove the Update button since updates should now be automatic

### DONE

- Test the geolocation-failed dialog, including its Retry button until it works
  to my satisfaction. To improve it somebody needs to explain to me how.
- Don't advertise we're downloading new forecasts if we already have them
- Keep the existing forecast if:
  - It is recent enough
  - We haven't moved too far
- If the user hides and re-shows the web page, update it
- Re-add Google Analytics
- Add a "Now" vs "Tomorrow" dropdown in the top right corner.

### NOT DOING

- Consider moving some logic from `componentDidMount()` and `componentDidUpdate()`
  into `render()`. Won't work; `render()` is not allowed to touch `state` or `props`.
- Re-add Facebook Share Button.

---

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br>
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (Webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: <https://facebook.github.io/create-react-app/docs/code-splitting>

### Analyzing the Bundle Size

This section has moved here: <https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size>

### Making a Progressive Web App

This section has moved here: <https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app>

### Advanced Configuration

This section has moved here: <https://facebook.github.io/create-react-app/docs/advanced-configuration>

### Deployment

This section has moved here: <https://facebook.github.io/create-react-app/docs/deployment>

### `npm run build` fails to minify

This section has moved here: <https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify>
