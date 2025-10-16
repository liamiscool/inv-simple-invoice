/**
Randomly uses an angle and magnitude from supplied position to get a new position.
@param {number} x
@param {number} y
@param {number} mag
@return {p5.Vector}
*/
function generateRandomPos(x, y, mag) {
  var pos = new p5.Vector(x, y);
  
  var randomDirection = new p5.Vector(random(width), random(height));
  
  var vel = p5.Vector.sub(randomDirection, pos);
  vel.normalize();
  vel.mult(mag);
  pos.add(vel);
  
  return pos;
}


/**
Dynamically adds/removes particles to make up the next image.
Homepage version - positions particles on the right side of screen.
*/
function nextImage() {
  console.log('nextImage() called, imgIndex:', imgIndex, 'imgs.length:', imgs.length);
  // Switch index to next image.
  imgIndex++;
  if (imgIndex > imgs.length-1) {
    imgIndex = 0;
  }
  console.log('Loading pixels for image index:', imgIndex);
  console.log('Particle count multiplier:', resSlider.slider.value());
  console.log('Load percentage:', loadPercentageSlider.slider.value());
  console.log('Combined particle chance:', loadPercentageSlider.slider.value() * resSlider.slider.value());
  imgs[imgIndex].loadPixels();
  
  // Create an array of indexes from particle array.
  var particleIndexes = [];
  for (var i = 0; i < allParticles.length; i++) {
    particleIndexes.push(i);
  }
  
  var pixelIndex = 0;
  
  // Go through each pixel of the image.
  for (var y = 0; y < imgs[imgIndex].height; y++) {
    for (var x = 0; x < imgs[imgIndex].width; x++) {
      // Get the pixel's color.
      var pixelR = imgs[imgIndex].pixels[pixelIndex];
      var pixelG = imgs[imgIndex].pixels[pixelIndex+1];
      var pixelB = imgs[imgIndex].pixels[pixelIndex+2];
      var pixelA = imgs[imgIndex].pixels[pixelIndex+3];
      
      pixelIndex += 4;
      
      // Give it small odds that we'll assign a particle to this pixel.
      // resSlider controls particle density multiplier
      var particleChance = loadPercentageSlider.slider.value() * resSlider.slider.value();
      if (random(1.0) > particleChance) {
        continue;
      }
      
      var pixelColor = color(pixelR, pixelG, pixelB);
      
      if (particleIndexes.length > 0) {
        // Re-use existing particle.
        var index = particleIndexes.splice(random(particleIndexes.length-1), 1);
        var newParticle = allParticles[index];
      } else {
        // Create a new particle.
        var newParticle = new Particle(width/2, height/2);
        allParticles.push(newParticle);
      }
      
      // Position particles closer to content with gradient fade
      // Start from 40% of screen width (closer to content) to 100%
      var startX = width * 0.4;
      var rightSideX = startX + (x * (width - startX) / imgs[imgIndex].width);
      var rightSideY = y * height / imgs[imgIndex].height;
      
      // Calculate gradient fade from left (0 opacity) to right (full opacity)
      var fadeStart = startX;
      var fadeEnd = startX + (width * 0.2); // 20% fade distance
      var fadeAlpha = 1.0;
      
      if (rightSideX < fadeEnd) {
        fadeAlpha = map(rightSideX, fadeStart, fadeEnd, 0, 1);
        fadeAlpha = constrain(fadeAlpha, 0, 1);
      }
      
      newParticle.target.x = rightSideX;
      newParticle.target.y = rightSideY;
      
      // Apply gradient fade to color
      var fadedColor = color(red(pixelColor), green(pixelColor), blue(pixelColor), alpha(pixelColor) * fadeAlpha);
      newParticle.endColor = fadedColor;
    }
  }
  
  // Kill off any left over particles that aren't assigned to anything.
  if (particleIndexes.length > 0) {
    for (var i = 0; i < particleIndexes.length; i++) {
      allParticles[particleIndexes[i]].kill();
    }
  }
}
