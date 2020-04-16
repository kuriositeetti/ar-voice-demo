#Speechly web AR garden demo

## What you need to run the demo

* Currently the demo only works in Google Chrome Canary
* [ARCore-capable Android device](https://developers.google.com/ar/discover/#supported_devices) running [Android 8.0 Oreo](https://www.android.com/versions/oreo-8-0/) or later version
* You might need to enable `WebXR Device API` & `WebXR Hit Test` flags from `chrome://flags` and relaunch the browser
* USB cable to connect your AR device to workstation


## Running the code locally

Install the project dependencies by running `yarn install`
Build the code by running `yarn build`
Start the node server by running `yarn start`

Setup USB port forwarding to port `8887` at `chrome://inspect/#devices` on your workstation
Navigate to `http://localhost:8887` in your Google Chrome Canary (on the AR device)
You can view the javascript console of your AR device by inspecting the open tab at `chrome://inspect/#devices` on your workstation

## Credits: 

## Building an augmented reality application with the WebXR Device API
https://github.com/googlecodelabs/ar-with-webxr

AR demo from Google Codelabs

## Speechly browser client
https://github.com/speechly/browser-client

Speechly allows you to easily build applications with voice-enabled UIs.

### Expack - Express and Webpack Boilerplate
https://github.com/bengrunfeld/expack

Expack is the bare-bones Express and Webpack boilerplate with ES6+ babel transpilation, ESLint linting, Hot Module Reloading, and Jest test framework enabled.
