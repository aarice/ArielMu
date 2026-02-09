let config = {
  topBoundary: 200,
  riseSpeed: 0.1,
  fallSpeed: 4.5,
  lineGapInitial: 70,
  lineGapCompressed: 48,
  paddingBottom: 40,
  trailDensity: 12,
  waveCurvature: 2,
  textGapRatio: 1.3, 
  closingSpeed: 0.15,
  bgColor: 245 // 统一背景色变量
};

let waves = [];
let activeWaveIdx = -1;
let hasBeenClicked = false;

function setup() {
  createCanvas(1280, 623);
  textFont('Special Elite');

  let labels = ["Graphic Design", "Visual Display", "Social Media Content"];
  for (let i = 0; i < labels.length; i++) {
    textSize(17);
    let tw = textWidth(labels[i]) * config.textGapRatio;
    let startY = 350 + i * config.lineGapInitial;
    waves.push(new Wave(startY, labels[i], i, tw));
  }
}

function draw() {
  background(config.bgColor);
  drawUI();
  updateTargetPositions();

  for (let w of waves) {
    w.update();
    w.display();
  }
}

function updateTargetPositions() {
  let currentGapY = hasBeenClicked ? config.lineGapCompressed : config.lineGapInitial;
  let lastLineY = height - config.paddingBottom;
  let firstLineY = lastLineY - (2 * currentGapY);

  for (let i = 0; i < waves.length; i++) {
    waves[i].homeY = firstLineY + i * currentGapY;
  }
}

class Wave {
  constructor(y, txt, id, fullWidth) {
    this.homeY = y;
    this.currentY = y;
    this.txt = txt;
    this.id = id;
    this.state = 'IDLE';
    this.displayOpacity = 255;
    this.textBaseWidth = fullWidth;
    this.currentTextScale = 1.0; 
    this.waterTrails = [];
    this.noiseSeed = random(1000);
    this.centerX = [width * 0.28, width * 0.5, width * 0.72][id];
  }

  update() {
    if (activeWaveIdx !== -1 && activeWaveIdx !== this.id) {
      this.displayOpacity = lerp(this.displayOpacity, 0, 0.15);
    } else {
      this.displayOpacity = lerp(this.displayOpacity, 255, 0.1);
    }

    if (this.state === 'RISING') {
      this.currentY = lerp(this.currentY, config.topBoundary, config.riseSpeed);
      this.currentTextScale = lerp(this.currentTextScale, 0, config.closingSpeed);
      this.generateFullWidthTrails();
      if (this.currentY <= config.topBoundary + 2) this.state = 'FALLING';
    } 
    else if (this.state === 'FALLING') {
      this.currentY += config.fallSpeed;
      if (this.currentY > this.homeY - 150) {
        this.currentTextScale = lerp(this.currentTextScale, 1.0, 0.08); 
      }
      if (this.currentY >= this.homeY) {
        this.state = 'IDLE';
        activeWaveIdx = -1;
      }
    } else {
      this.currentY = lerp(this.currentY, this.homeY, 0.1);
      this.currentTextScale = lerp(this.currentTextScale, 1.0, 0.1);
    }

    for (let i = this.waterTrails.length - 1; i >= 0; i--) {
      let t = this.waterTrails[i];
      t.y += t.speed;
      t.opacity -= 3;
      if (t.opacity <= 0) this.waterTrails.splice(i, 1);
    }
  }

  display() {
    if (this.displayOpacity < 5) return;

    push();
    // 1. 绘制颗粒
    for (let t of this.waterTrails) {
      stroke(180, 190, 200, t.opacity * (this.displayOpacity / 255));
      strokeWeight(t.thickness);
      line(t.x, t.y, t.x, t.y + t.len);
    }

    // 2. 绘制【绝对完整】的波浪线
    for (let i = 0; i < 2; i++) {
      let yOff = i * 4;
      let alpha = i === 0 ? 255 : 80;
      stroke(0, alpha * (this.displayOpacity / 255));
      strokeWeight(i === 0 ? 1.5 : 0.8);
      noFill();
      this.drawSingleLongWave(yOff);
    }

    // 3. 【核心步骤】遮挡线条
    let gapWidth = this.textBaseWidth * this.currentTextScale;
    if (gapWidth > 0.5) {
      noStroke();
      fill(config.bgColor); // 使用背景色进行遮挡
      rectMode(CENTER);
      // 遮挡块高度要能盖住波动范围
      rect(this.centerX, this.currentY + 2, gapWidth, 50);
    }

    // 4. 绘制文字
    if (this.currentTextScale > 0.02) {
      push();
      translate(this.centerX, this.currentY + 2);
      scale(this.currentTextScale, 1.0);
      noStroke();
      fill(0, this.displayOpacity * Math.pow(this.currentTextScale, 1.5));
      textAlign(CENTER, CENTER);
      textSize(17);
      text(this.txt, 0, 0);
      pop();
    }
    pop();
  }

  // 只画一根线，从头到尾
  drawSingleLongWave(yOffset) {
    beginShape();
    let gapHalf = (this.textBaseWidth * this.currentTextScale) / 2;
    
    curveVertex(-20, this.currentY + yOffset);
    for (let x = 0; x <= width; x += 15) {
      let nx = x * 0.004;
      let noiseVal = noise(nx, this.noiseSeed + yOffset);
      let baseMod = map(noiseVal, 0, 1, -25, 25) * config.waveCurvature;
      
      // 平滑逻辑：在文字区域把波浪压平，这样遮罩矩形不需要太高
      let distToCenter = abs(x - this.centerX);
      let taper = map(distToCenter, gapHalf * 0.5, gapHalf * 1.5, 0, 1, true);
      if (this.currentTextScale < 0.1) taper = 1;

      curveVertex(x, this.currentY + yOffset + baseMod * taper);
    }
    curveVertex(width + 20, this.currentY + yOffset);
    endShape();
  }

  generateFullWidthTrails() {
    for (let i = 0; i < config.trailDensity; i++) {
      let rx = random(0, width);
      let gapHalf = (this.textBaseWidth * this.currentTextScale) / 2;
      // 颗粒也不要在文字遮挡区产生
      if (rx > this.centerX - gapHalf && rx < this.centerX + gapHalf) continue;

      this.waterTrails.push({
        x: rx, y: this.currentY + random(-5, 5),
        len: random(30, 80), speed: random(4, 8),
        thickness: random(0.5, 1.8), opacity: random(100, 200)
      });
    }
  }

  checkClick(mx, my) {
    if (activeWaveIdx === -1 && abs(my - this.currentY) < 35) {
      this.state = 'RISING';
      activeWaveIdx = this.id;
      hasBeenClicked = true;
      for(let i=0; i<60; i++) this.generateFullWidthTrails();
    }
  }
}

function mousePressed() {
  for (let w of waves) w.checkClick(mouseX, mouseY);
}

function drawUI() {
  push();
  fill(0, activeWaveIdx === -1 ? 255 : 40);
  textSize(48);
  text("Works.", 100, 150);
  pop();
}