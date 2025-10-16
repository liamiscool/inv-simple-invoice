/* Ultra-light particles for homepage - Minimal performance impact
Only shows a few particles with very simple movement
*/

var imgs = [];
var imgNames = [
  "/p5js-test/hank-shake-continue-today-main-200403.png"
];
var imgIndex = -1;

var loadPercentage = 0.001; // Ultra light - only 0.1% of pixels
var closeEnoughTarget = 50;
var boundaryShape = 'square';
var particleShape = 'circle';

var allParticles = [];
var frameSkip = 0;

function preload() {
  console.log('Ultra-light P5JS preload() called');
  // Pre-load all images.
  for (var i = 0; i < imgNames.length; i++) {
    var newImg = loadImage(imgNames[i]);
    imgs.push(newImg);
  }
  console.log('Preloaded', imgs.length, 'images');
}

function setup() {
  console.log('Ultra-light P5JS setup() called');
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('p5-canvas-container');
  console.log('Canvas created and parented - full screen');
  
  // No UI controls for ultra-light version
  // Set default values
  loadPercentageSlider = { slider: { value: () => 0.001 } };
  closeEnoughSlider = { slider: { value: () => 40 } };
  colorBlendSlider = { slider: { value: () => 0.02 } };
  maxSpeedSlider = { slider: { value: () => 1.2 } };
  maxForceSlider = { slider: { value: () => 10 } };
  
  // Create sliders for testing (hidden by default)
  let startX = width - 250;
  let startY = height - 200;
  
  particleSizeSlider = new SliderLayout("Size", 1, 8, 3, 1, startX, startY);
  speedSlider = new SliderLayout("Speed", 0.5, 2, 1, 0.1, startX, startY + 50);
  resSlider = new SliderLayout("Count", 0.2, 1, 0.3, 0.1, startX, startY + 100);
  mouseSizeSlider = new SliderLayout("Mouse", 50, 150, 100, 10, startX, startY + 150);
  
  // Change to first image.
  console.log('Calling nextImage()');
  nextImage();
  console.log('Ultra-light setup complete');
}

function draw() {
  background(255);
  
  // Only update every 3rd frame for maximum performance
  frameSkip++;
  if (frameSkip % 3 === 0) {
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
    // Just draw without moving
    for (var i = allParticles.length-1; i > -1; i--) {
      allParticles[i].draw();
    }
  }
  
  // Display slider labels (positioned in bottom right)
  particleSizeSlider.display();
  speedSlider.display();
  resSlider.display();
  mouseSizeSlider.display();
  
  // Log every 1800 frames for performance
  if (frameCount % 1800 === 0) {
    console.log('Ultra-light P5JS draw() running, frame:', frameCount, 'particles:', allParticles.length);
  }
}

function keyPressed() {
  nextImage();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  
  // Reposition controls for new window size
  let startX = width - 250;
  let startY = height - 200;
  
  if (particleSizeSlider) particleSizeSlider.slider.position(startX, startY);
  if (speedSlider) speedSlider.slider.position(startX, startY + 50);
  if (resSlider) resSlider.slider.position(startX, startY + 100);
  if (mouseSizeSlider) mouseSizeSlider.slider.position(startX, startY + 150);
}

function logCurrentSettings() {
  console.log('=== ULTRA-LIGHT P5JS SETTINGS ===');
  console.log('Particle size:', particleSizeSlider.slider.value());
  console.log('Speed:', speedSlider.slider.value());
  console.log('Particle count:', resSlider.slider.value());
  console.log('Mouse size:', mouseSizeSlider.slider.value());
  console.log('Total particles:', allParticles.length);
  console.log('Current image:', imgNames[imgIndex]);
  console.log('================================');
}
