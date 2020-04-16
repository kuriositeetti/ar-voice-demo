import logMessage from './js/logger'
import './css/style.css'

//import * as THREE from './js/third-party/three.module.js';
import { Client, Segment } from '@speechly/browser-client';
import { WebXRButton } from './js/util/webxr-button.js';
import { Scene } from './js/render/scenes/scene.js';
import { Renderer, createWebGLContext } from './js/render/core/renderer.js';
import { Node } from './js/render/core/node.js';
import { Gltf2Node } from './js/render/nodes/gltf2.js';
import { DropShadowNode } from './js/render/nodes/drop-shadow.js';
import { vec3 } from './js/render/math/gl-matrix.js';
import { Ray } from './js/render/math/ray.js';

/*
// We will use 2D canvas element to render our HUD.  
var hudCanvas = document.createElement('canvas');

// Again, set dimensions to fit the screen.
let width = document.body.clientWidth;
let height = document.body.clientHeight;
hudCanvas.width = width;
hudCanvas.height = height;

// Get 2D context and draw something supercool.
var hudBitmap = hudCanvas.getContext('2d');
hudBitmap.font = "Normal 40px Arial";
hudBitmap.textAlign = 'center';
hudBitmap.fillStyle = "rgba(245,245,245,0.75)";
hudBitmap.fillText('Initializing...', width / 2, height / 2);

// Create the camera and set the viewport to match the screen dimensions.
var cameraHUD = new THREE.OrthographicCamera(-width/2, width/2, height/2, -height/2, 0, 30 );

// Create texture from rendered graphics.
var hudTexture = new THREE.Texture(hudCanvas) 
hudTexture.needsUpdate = true;

// Create HUD material.
var material = new THREE.MeshBasicMaterial( {map: hudTexture} );
material.transparent = true;
*/

// Create a new Client.
const client = new Client({
  appId: '754e813b-eb59-4811-9258-3deef0130c6d',
  language: 'en-US'
});

document.getElementById('allow-microphone').addEventListener('click', (event) => {
    console.log('click microphone allow');
    // Initialize the client - this will ask the user for microphone permissions and establish the connection to Speechly API.
    // Make sure you call `initlialize` from a user action handler (e.g. from a button press handler).
    client.initialize((err) => {
      if (err !== undefined) {
        console.error('Failed to initialize Speechly client:', err);
      }
    });
});

// React to the phrases received from the API
function addFlower(size) {
  let objectScale = 1;
  switch(size.toLowerCase()) {
    case 'big': objectScale = 1.4;
    break;
    case 'small': objectScale = 0.6;
    break;
    case 'tiny': objectScale = 0.2;
    break;
    case 'huge': objectScale = 1.8;
    default: console.log('no size detected');
    break;
  }

  if (reticle.visible) {
    addARObjectAt(reticle.matrix, objectScale);
  }
};

client.onSegmentChange(segment => {
  if (segment.isFinal && segment.intent.intent === 'place') {
    console.log(segment.entities);
    console.log(segment.intent.intent);

    let sizes = [];
    let objects = [];

    segment.entities.forEach(entity => {
      if (entity.type === 'size') {
        sizes.push(entity.value);
      }
      if (entity.type === 'object' && entity.value.toLowerCase() === 'flower') {
        objects.push(entity.value);
      }
    });

    if (sizes.length || objects.length) {
      addFlower(sizes.length ? sizes[0] : 'default');
    }
  }

  if (segment.isFinal && segment.intent.intent === 'undo') {
    console.log(segment.entities);
    console.log(segment.intent.intent);

    undo();
  }
});

let microphoneIsOn = false;
let intentDone = false;

// XR globals.
let xrButton = null;
let xrRefSpace = null;
let xrViewerSpace = null;
let xrHitTestSource = null;
let logged = false;
const uiElement = document.getElementById('ui');
const uiDotElement = document.getElementById('ui__dot');

// WebGL scene globals.
let gl = null;
let renderer = null;
let scene = new Scene();
scene.enableStats(false);

let arObject = new Node();
arObject.visible = false;
scene.addNode(arObject);

let flower = new Gltf2Node({url: 'media/gltf/sunflower/sunflower.gltf'});
arObject.addNode(flower);

let reticle = new Gltf2Node({url: 'media/gltf/reticle/reticle.gltf'});
reticle.visible = false;
scene.addNode(reticle);

// Having a really simple drop shadow underneath an object helps ground
// it in the world without adding much complexity.
let shadow = new DropShadowNode();
vec3.set(shadow.scale, 0.15, 0.15, 0.15);
arObject.addNode(shadow);

const MAX_FLOWERS = 30;
let flowers = [];

// Ensure the background is transparent for AR.
scene.clear = false;

function initXR() {
  xrButton = new WebXRButton({
    onRequestSession: onRequestSession,
    onEndSession: onEndSession,
    textEnterXRTitle: "START AR",
    textXRNotFoundTitle: "AR NOT FOUND",
    textExitXRTitle: "EXIT  AR",
  });
  document.querySelector('header').appendChild(xrButton.domElement);

  if (navigator.xr) {
    navigator.xr.isSessionSupported('immersive-ar')
      .then((supported) => {
        xrButton.enabled = supported;
    });
  }
}

function onRequestSession() {
  return navigator.xr.requestSession('immersive-ar', {optionalFeatures: ['dom-overlay'], domOverlay: { root: uiElement }, requiredFeatures: ['local', 'hit-test']})
  .then((session) => {
    xrButton.setSession(session);
    onSessionStarted(session);
  });
}

function onSessionStarted(session) {
  session.addEventListener('end', onSessionEnded);
  session.addEventListener('select', onSelect);

  if (!gl) {
    gl = createWebGLContext({
      xrCompatible: true
    });

    renderer = new Renderer(gl);

    scene.setRenderer(renderer);

    console.log(gl);
  }

  session.updateRenderState({ baseLayer: new XRWebGLLayer(session, gl) });

  // In this sample we want to cast a ray straight out from the viewer's
  // position and render a reticle where it intersects with a real world
  // surface. To do this we first get the viewer space, then create a
  // hitTestSource that tracks it.
  session.requestReferenceSpace('viewer').then((refSpace) => {
    xrViewerSpace = refSpace;
    session.requestHitTestSource({ space: xrViewerSpace }).then((hitTestSource) => {
      xrHitTestSource = hitTestSource;
    });
  });

  session.requestReferenceSpace('local').then((refSpace) => {
    xrRefSpace = refSpace;

    session.requestAnimationFrame(onXRFrame);
  });
}

function onEndSession(session) {
  xrHitTestSource.cancel();
  xrHitTestSource = null;
  stopRecording();
  session.end();
}

function onSessionEnded(event) {
  xrButton.setSession(null);
}

// Adds a new object to the scene at the
// specificed transform.
function addARObjectAt(matrix, objectScale) {
  console.log('add object');
  let newFlower = arObject.clone();
  newFlower.visible = true;
  matrix[0] = objectScale;
  matrix[5] = objectScale;
  matrix[10] = objectScale;
  newFlower.matrix = matrix;
  scene.addNode(newFlower);

  flowers.push(newFlower);

  // For performance reasons if we add too many objects start
  // removing the oldest ones to keep the scene complexity
  // from growing too much.
  if (flowers.length > MAX_FLOWERS) {
    let oldFlower = flowers.shift();
    scene.removeNode(oldFlower);
  }
}

function undo() {
  if (flowers.length) {
    let latestFlower = flowers.pop();
    scene.removeNode(latestFlower);
  }
}

let rayOrigin = vec3.create();
let rayDirection = vec3.create();
function onSelect(event) {
  if (!microphoneIsOn) {
    startRecording();
  } else {
    stopRecording();
  }
}

function startRecording() {
  console.log('start recording');
  // Start recording
  microphoneIsOn = true;
  intentDone = false;
  uiDotElement.classList.add('ui__dot--recording');
  client.startContext((err) => {
    if (err !== undefined) {
      console.error('Failed to start recording:', err);
      stopRecording();
      return;
    }

    // Stop recording after 4 seconds
    setTimeout(() => {
      stopRecording();
    }, 4000);
  });
}

function stopRecording() {
  console.log('stop recording');
  microphoneIsOn = false;
  uiDotElement.classList.remove('ui__dot--recording');
  client.stopContext();
}

// Called every time a XRSession requests that a new frame be drawn.
function onXRFrame(t, frame) {
  let session = frame.session;
  let pose = frame.getViewerPose(xrRefSpace);

  reticle.visible = false;

  // If we have a hit test source, get its results for the frame
  // and use the pose to display a reticle in the scene.
  if (xrHitTestSource && pose) {
    let hitTestResults = frame.getHitTestResults(xrHitTestSource);
    if (hitTestResults.length > 0) {
      let pose = hitTestResults[0].getPose(xrRefSpace);
      reticle.visible = true;
      reticle.matrix = pose.transform.matrix;
    }
  }

  //if (!logged) { logged = true; console.log(gl);}

  scene.startFrame();

  session.requestAnimationFrame(onXRFrame);

  scene.drawXRFrame(frame, pose);

  scene.endFrame();
}

// Start the XR application.
initXR();


// Log message to console
logMessage('Its finished!!')

if (module.hot)       // eslint-disable-line no-undef
  module.hot.accept() // eslint-disable-line no-undef
