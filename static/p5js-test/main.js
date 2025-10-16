/*
Particles to image

Particles seek a target to make up an image. 
They get bigger the closer they get to their target.

Controls:
  - Move the mouse to interact.
  - Hold down the mouse button pull particles in.
  - Press any key to change to the next image.
  - Use the on-screen controls to change settings.

Thank's for original Author: Jason Labbe - jasonlabbe3d.com
  
Fork for a case study of an art instalation. j_espanca_bacelar 2020
	
*/
//jb_photo2018-2.jpg

var imgs = [];
var imgNames = [
  "/p5js-test/lion dance2.jpg",
  "/p5js-test/hand-shake-silhouette-2-vector.jpg", 
  "/p5js-test/hank-shake-continue-today-main-200403.png",
  "/p5js-test/istockphoto-1303813710-612x612.jpg"
];
var imgIndex = -1;

var loadPercentage = 0.008; // 0 to 1.0 (optimized for performance)
var closeEnoughTarget = 50;
var boundaryShape = 'circle'; // 'circle', 'square'
var particleShape = 'circle'; // 'circle', 'square', 'triangle'

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
var particleShapeButton;


function preload() {
  console.log('P5JS preload() called');
  // Pre-load all images.
  for (var i = 0; i < imgNames.length; i++) {
    console.log('Loading image:', imgNames[i]);
    var newImg = loadImage(imgNames[i]);
    imgs.push(newImg);
  }
  console.log('Images loaded:', imgs.length);
}


function setup() {
  console.log('P5JS setup() called');
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('p5-canvas-container');
  console.log('Canvas created and parented - full screen');
  
  // Create simple controls (DOM functions are built into P5.js v1.0+)
  console.log('Creating simple sliders and buttons');
  let yPos = 50;
  
  // Only keep the most important sliders with optimized defaults
  particleSizeSlider = new SliderLayout("Particle size", 1, 15, 3, 1, 20, yPos);
  yPos += 50;
  
  speedSlider = new SliderLayout("Speed", 0.5, 3, 2, 0.1, 20, yPos);
  yPos += 50;
  
  resSlider = new SliderLayout("Particle count", 0.5, 2, 0.7, 0.1, 20, yPos);
  yPos += 50;
  
  mouseSizeSlider = new SliderLayout("Mouse size", 50, 200, 150, 10, 20, yPos);
  yPos += 50;
  
  // Remove waviness slider - not needed
  
  nextImageButton = createButton("Next Image");
  nextImageButton.position(20, yPos);
  nextImageButton.mousePressed(nextImage);
  
  // Add a button to show current image info
  let imageInfoButton = createButton("Image Info");
  imageInfoButton.position(120, yPos);
  imageInfoButton.mousePressed(showImageInfo);
  
  // Add a button to log current settings
  let logButton = createButton("Log Settings");
  logButton.position(220, yPos);
  logButton.mousePressed(logCurrentSettings);
  
  // Add boundary shape toggle (keep circle as default)
  yPos += 50;
  boundaryShapeButton = createButton("Boundary: Circle");
  boundaryShapeButton.position(20, yPos);
  boundaryShapeButton.mousePressed(toggleBoundaryShape);
  
  // Remove particle shape toggle - keeping circles only
  
  // Set default values for other sliders (no UI needed)
  loadPercentageSlider = { slider: { value: () => 0.008 } };
  closeEnoughSlider = { slider: { value: () => 40 } };
  colorBlendSlider = { slider: { value: () => 0.02 } };
  maxSpeedSlider = { slider: { value: () => 1.2 } };
  maxForceSlider = { slider: { value: () => 10 } };
  
  // Change to first image.
  console.log('Calling nextImage()');
  nextImage();
  console.log('Setup complete');
}


function draw() {
  background(255);
  // Add a simple test to see if draw is running (very infrequent logging)
  if (frameCount % 600 === 0) {
    console.log('P5JS draw() running, frame:', frameCount);
  }
  
  for (var i = allParticles.length-1; i > -1; i--) {
    allParticles[i].move();
    allParticles[i].draw();
    
    if (allParticles[i].isKilled) {
      if (allParticles[i].isOutOfBounds()) {
        allParticles.splice(i, 1);
      }
    }
  }
  
  // Display only the visible slider labels
  particleSizeSlider.display();
  speedSlider.display();
  resSlider.display();
  mouseSizeSlider.display();
}


function keyPressed() {
  nextImage();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function showImageInfo() {
  console.log('=== CURRENT IMAGE INFO ===');
  console.log('Current image index:', imgIndex);
  console.log('Total images:', imgs.length);
  console.log('Current image name:', imgNames[imgIndex]);
  console.log('Image dimensions:', imgs[imgIndex].width + 'x' + imgs[imgIndex].height);
  console.log('==========================');
}

function toggleBoundaryShape() {
  boundaryShape = boundaryShape === 'circle' ? 'square' : 'circle';
  boundaryShapeButton.html("Boundary: " + boundaryShape.charAt(0).toUpperCase() + boundaryShape.slice(1));
  console.log('Boundary shape changed to:', boundaryShape);
}

function toggleParticleShape() {
  if (particleShape === 'circle') {
    particleShape = 'square';
  } else if (particleShape === 'square') {
    particleShape = 'triangle';
  } else {
    particleShape = 'circle';
  }
  particleShapeButton.html("Particles: " + particleShape.charAt(0).toUpperCase() + particleShape.slice(1));
  console.log('Particle shape changed to:', particleShape);
}

function logCurrentSettings() {
  console.log('=== SIMPLIFIED P5JS SETTINGS ===');
  console.log('Particle size:', particleSizeSlider.slider.value());
  console.log('Speed:', speedSlider.slider.value());
  console.log('Particle count:', resSlider.slider.value());
  console.log('Mouse size:', mouseSizeSlider.slider.value());
  console.log('Boundary shape:', boundaryShape);
  console.log('Particle shape:', particleShape);
  console.log('Total particles:', allParticles.length);
  console.log('Current image:', imgNames[imgIndex]);
  console.log('================================');
}