let treeImg;
let particles = [];
let branchPoints = [];
let poem = "Those hours that with gentle work did frame The lovely gaze where every eye doth dwell, Will play the tyrants to the very same And that unfair which fairly doth excel: For never-resting time leads summer on To hideous winter and confounds him there; Sap check’d with frost and lusty leaves quite gone, Beauty o’ersnow’d and bareness every where: Then, were not summer’s distillation left, A liquid prisoner pent in walls of glass, Beauty’s effect with beauty were bereft, Nor it, nor no remembrance what it was: But flowers distill’d, though they with winter meet, Leese but their show; their substance still lives sweet.";
let poemIndex = 0;
let isFinished = false;
let groundMap = []; 

// 引入用于平滑晃动的变量
let currentSway = 0; 

let config = {
  fontSize: 15,
  maxFallSpeed: 1.5,     
  drag: 0.97,            
  spawnIntensity: 12,    
  swayAmplitude: 0.007,  // 你设定的较小的摇摆幅度
  letterSpacing: 20,     
  groundY: 0.95,          
  driftRange: 0.5,       
  rotateSpeed: 0.7,      
  margin: 0.2            
};

function preload() {
  treeImg = loadImage('./tree.png');
}

function setup() {
  pixelDensity(1);
  createCanvas(treeImg.width, treeImg.height);
  
  let baseLine = height * config.groundY;
  for (let i = 0; i < width; i++) groundMap[i] = baseLine;

  treeImg.loadPixels();
  for (let x = 0; x < treeImg.width; x += 6) {
    for (let y = 0; y < treeImg.height; y += 6) {
      let index = (x + y * treeImg.width) * 4;
      if (treeImg.pixels[index + 3] > 50) branchPoints.push({ x, y });
    }
  }
  
  textFont('Georgia');
  textSize(config.fontSize);
  textAlign(CENTER, CENTER);
}

function draw() {
  background(255);

  // 修复：统一使用 config.margin
  let m = width * config.margin; 
  // 确保这一行里的 margin 全部替换为 m 或 config.margin
  let isHovering = (mouseX > m && mouseX < width - m && mouseY > m && mouseY < height - m);

  // --- 平滑晃动逻辑 ---
  let targetSway = (isHovering && !isFinished) ? sin(frameCount * 0.08) * config.swayAmplitude : 0;
  
  // 使用 lerp 让 currentSway 缓缓逼近 targetSway
  // 0.05 是平滑系数，越小停下来就越慢、越柔和
  currentSway = lerp(currentSway, targetSway, 0.05);

  push();
  // 使用平滑后的 currentSway 进行错切变换
  translate(width / 2, height); 
  shearX(currentSway);                
  translate(-width / 2, -height);
  image(treeImg, 0, 0);
  pop();

  // --- 生成逻辑 ---
  if (isHovering && !isFinished) {
    for (let i = 0; i < config.spawnIntensity; i++) {
      if (poemIndex < poem.length) {
        let pt = random(branchPoints);
        if (poem[poemIndex] !== " ") {
          particles.push(new Letter(pt.x, pt.y, poem[poemIndex]));
        }
        poemIndex++;
      } else { isFinished = true; }
    }
  }

  // --- 更新与显示 ---
  for (let p of particles) {
    p.update();
    p.display();
  }
}

class Letter {
  constructor(x, y, char) {
    this.pos = createVector(x, y);
    this.vel = createVector(random(-0.5, 0.5), random(0.1, 0.5));
    this.acc = createVector(0, 0.04); 
    this.char = char;
    this.isStatic = false;
    this.angle = random(TWO_PI);
    this.noiseSeed = random(1000);
    this.finalAngle = random(-0.4, 0.4);
  }

  update() {
    if (this.isStatic) return;

    let breeze = map(noise(this.noiseSeed, frameCount * 0.015), 0, 1, -config.driftRange, config.driftRange);
    this.vel.x += breeze * 0.15;
    this.vel.add(this.acc);
    this.vel.mult(config.drag); 
    if (this.vel.y > config.maxFallSpeed) this.vel.y = config.maxFallSpeed;

    this.pos.add(this.vel);
    this.angle += (this.vel.mag() * 0.08) * config.rotateSpeed;

    let xIdx = floor(constrain(this.pos.x, 0, width - 1));
    if (this.pos.y >= groundMap[xIdx]) {
      this.pos.y = groundMap[xIdx];
      this.isStatic = true;
      
      let r = config.letterSpacing / 2;
      for (let i = -r; i <= r; i++) {
        let checkX = floor(constrain(xIdx + i, 0, width - 1));
        let lift = map(abs(i), 0, r, config.fontSize * 0.65, 0);
        groundMap[checkX] -= lift;
      }
    }
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.isStatic ? this.finalAngle : this.angle);
    fill(70, this.isStatic ? 200 : 160);
    noStroke();
    text(this.char, 0, 0);
    pop();
  }
}