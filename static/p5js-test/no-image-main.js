/* No-image test version - Test if particles work without images
*/

var imgs = [];
var imgNames = []; // Empty array - no images
var imgIndex = -1;

var loadPercentage = 0.003;
var closeEnoughTarget = 50;
var boundaryShape = 'square';
var particleShape = 'circle';

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
  console.log('No-image P5JS preload() called');
  // No images to preload
  console.log('No images to preload');
}

function setup() {
  console.log('No-image P5JS setup() called');
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('p5-canvas-container');
  console.log('Canvas created and parented - full screen');
  
  console.log('Creating homepage controls in bottom right');
  
  // Position controls in bottom right corner, avoiding content area
  let startX = width - 300; // Start 300px from right edge to avoid content
  let startY = height - 350; // Start 350px from bottom to avoid content
  let yPos = startY;
  
  // Only keep the most important sliders with optimized defaults
  particleSizeSlider = new SliderLayout("Particle size", 1, 15, 3, 1, startX, yPos);
  yPos += 50;
  
  speedSlider = new SliderLayout("Speed", 0.5, 3, 2, 0.1, startX, yPos);
  yPos += 50;
  
  resSlider = new SliderLayout("Particle count", 0.3, 1.5, 0.5, 0.1, startX, yPos);
  yPos += 50;
  
  mouseSizeSlider = new SliderLayout("Mouse size", 50, 200, 150, 10, startX, yPos);
  yPos += 50;
  
  // Buttons
  nextImageButton = createButton("Next Image");
  nextImageButton.position(startX, yPos);
  nextImageButton.mousePressed(nextImage);
  
  let imageInfoButton = createButton("Image Info");
  imageInfoButton.position(startX + 100, yPos);
  imageInfoButton.mousePressed(showImageInfo);
  
  let logButton = createButton("Log Settings");
  logButton.position(startX + 200, yPos);
  logButton.mousePressed(logCurrentSettings);
  
  yPos += 50;
  
  // Add boundary shape toggle (square as default)
  boundaryShapeButton = createButton("Boundary: Square");
  boundaryShapeButton.position(startX, yPos);
  boundaryShapeButton.mousePressed(toggleBoundaryShape);
  
  // Set default values for other sliders (no UI needed)
  loadPercentageSlider = { slider: { value: () => 0.003 } };
  closeEnoughSlider = { slider: { value: () => 40 } };
  colorBlendSlider = { slider: { value: () => 0.02 } };
  maxSpeedSlider = { slider: { value: () => 1.2 } };
  maxForceSlider = { slider: { value: () => 10 } };
  
  // Create some random particles since we have no images
  console.log('Creating random particles since no images available');
  createRandomParticles();
  console.log('Setup complete');
}

function createRandomParticles() {
  // Create 50 random particles across the right side of the screen
  for (var i = 0; i < 50; i++) {
    var newParticle = new Particle(width/2, height/2);
    allParticles.push(newParticle);
    
    // Position on right side
    newParticle.target.x = width/2 + random(width/2);
    newParticle.target.y = random(height);
    newParticle.endColor = color(random(255), random(255), random(255));
  }
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
  
  // Display slider labels (positioned in bottom right)
  particleSizeSlider.display();
  speedSlider.display();
  resSlider.display();
  mouseSizeSlider.display();
  
  // Log every 1200 frames for performance
  if (frameCount % 1200 === 0) {
    console.log('No-image P5JS draw() running, frame:', frameCount);
  }
}

function keyPressed() {
  // Since no images, just create new random particles
  createRandomParticles();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  
  // Reposition controls for new window size
  let startX = width - 300;
  let startY = height - 350;
  
  if (particleSizeSlider) {
    particleSizeSlider.slider.position(startX, startY);
  }
  if (speedSlider) {
    speedSlider.slider.position(startX, startY + 50);
  }
  if (resSlider) {
    resSlider.slider.position(startX, startY + 100);
  }
  if (mouseSizeSlider) {
    mouseSizeSlider.slider.position(startX, startY + 150);
  }
  
  if (nextImageButton) {
    nextImageButton.position(startX, startY + 200);
  }
  if (boundaryShapeButton) {
    boundaryShapeButton.position(startX, startY + 250);
  }
}

function showImageInfo() {
  console.log('=== NO IMAGE INFO ===');
  console.log('No images loaded - using random particles');
  console.log('Total particles:', allParticles.length);
  console.log('==========================');
}

function toggleBoundaryShape() {
  boundaryShape = boundaryShape === 'circle' ? 'square' : 'circle';
  boundaryShapeButton.html("Boundary: " + boundaryShape.charAt(0).toUpperCase() + boundaryShape.slice(1));
  console.log('Boundary shape changed to:', boundaryShape);
}

function logCurrentSettings() {
  console.log('=== NO-IMAGE P5JS SETTINGS ===');
  console.log('Particle size:', particleSizeSlider.slider.value());
  console.log('Speed:', speedSlider.slider.value());
  console.log('Particle count:', resSlider.slider.value());
  console.log('Mouse size:', mouseSizeSlider.slider.value());
  console.log('Boundary shape:', boundaryShape);
  console.log('Particle shape:', particleShape);
  console.log('Total particles:', allParticles.length);
  console.log('No images - using random particles');
  console.log('================================');
}
