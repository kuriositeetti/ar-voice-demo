# Speechly web AR garden demo

## Running the code locally

* Install the project dependencies by running `yarn install`
* Build the code by running `yarn build`
* Start the node server by running `yarn start`

* Setup USB port forwarding to port `8887` at `chrome://inspect/#devices` on your workstation
* Navigate to `http://localhost:8887` in your Google Chrome (on the AR device)
* You can view the javascript console of your AR device by inspecting the open tab at `chrome://inspect/#devices` on your workstation

## Example sentences: 

Place an object:
```
Plant a flower
Place flower
Put down the flower
```

Place an object of different size:
```
Plant a big flower
Place small flower
Put down the tiny flower
Add huge flower
```

Undo:
```
Undo
Undo flower
Remove the flower
Destroy a flower
```

Reset:
```
Reset
Reset all
Flower begone
Hide all flowers
```

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
