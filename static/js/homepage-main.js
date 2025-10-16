/* Particles to image - Homepage Version
Particles seek a target to make up an image. They get bigger the closer they get to their target.
Controls positioned in bottom right corner for homepage integration.

Thank's for original Author: Jason Labbe - jasonlabbe3d.com
Fork for a case study of an art instalation. j_espanca_bacelar 2020
*/

var imgs = [];
var imgNames = [
  "/js/hank-shake.webp"
];
var imgIndex = -1;

var loadPercentage = 0.003; // 0 to 1.0 (heavily optimized for homepage)
var closeEnoughTarget = 50;
var boundaryShape = 'square'; // 'circle', 'square'
var particleShape = 'circle'; // 'circle', 'square', 'triangle'

// Fixed settings - no UI controls needed
var fixedParticleSize = 2;
var fixedSpeed = 2.6;
var fixedParticleCount = 0.5;
var fixedMouseSize = 150;

var allParticles = [];

var mouseSizeSlider;
var particleSizeSlider;
var speedSlider;
var resSlider;
var nextImageButton;
var loadPercentageSlider;
var closeEnoughSlider;
var colorBlendSlider;
var maxSpeedSlider;
var maxForceSlider;
var boundaryShapeButton;

function preload() {
  console.log('P5JS preload() called');
  // Pre-load all images.
  for (var i = 0; i < imgNames.length; i++) {
    var newImg = loadImage(imgNames[i]);
    imgs.push(newImg);
  }
  console.log('Preloaded', imgs.length, 'images');
}

function setup() {
  console.log('P5JS setup() called');
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('p5-canvas-container');
  console.log('Canvas created and parented - full screen');
  
  // No visible controls - using fixed settings
  console.log('Using fixed settings - no UI controls');
  
  // Set fixed values for sliders (no UI needed)
  loadPercentageSlider = { slider: { value: () => 0.003 } };
  closeEnoughSlider = { slider: { value: () => 40 } };
  colorBlendSlider = { slider: { value: () => 0.02 } };
  maxSpeedSlider = { slider: { value: () => 1.2 } };
  maxForceSlider = { slider: { value: () => 10 } };
  
  // Create fake sliders with fixed values
  particleSizeSlider = { slider: { value: () => fixedParticleSize } };
  speedSlider = { slider: { value: () => fixedSpeed } };
  resSlider = { slider: { value: () => fixedParticleCount } };
  mouseSizeSlider = { slider: { value: () => fixedMouseSize } };
  
  // Change to first image.
  console.log('Calling nextImage()');
  nextImage();
  console.log('Setup complete');
}

function draw() {
  background(255);
  
  // Only update particles every other frame for performance
  if (frameCount % 2 === 0) {
    for (var i = allParticles.length-1; i > -1; i--) {
      allParticles[i].move();
      allParticles[i].draw();
      if (allParticles[i].isKilled) {
        if (allParticles[i].isOutOfBounds()) {
          allParticles.splice(i, 1);
        }
      }
    }
  } else {
    // On odd frames, just draw particles without moving them
    for (var i = allParticles.length-1; i > -1; i--) {
      allParticles[i].draw();
    }
  }
  
  // No UI controls to display
  
  // Log every 1200 frames for performance
  if (frameCount % 1200 === 0) {
    console.log('P5JS draw() running, frame:', frameCount);
  }
}

function keyPressed() {
  nextImage();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
