let bgImg, img1, img2, img3, img4;
let isExtracted = false; 
let currentImg1X = 110;    
let img3Pos; 
let img3Vel; 
let img3State = "HIDDEN"; 
let dropStartTime = 0; 

// --- 调节参数 ---
const driftConfig = {
  speedY: 0.03,         // 垂直下落速度 (0.01-0.03)
  finalX: 220,          
  finalY: 100,          
  swingRange: 3,        // 减小了摆动幅度
  swingSpeed: 2.5,      // 减小了摆动频率
  driftAmplitude: 15    // 纸片左右晃动的物理宽度
};

// --- img4 位置控制参数 ---
const img4Config = {
  x: 850,               // 画布水平位置
  y: 450,               // 画布垂直位置
  w: 260,               // 宽度
  h: 134                // 高度
};

const config = {
  canvasW: 1280,
  canvasH: 623,
  baseX: 1280 * 0.35, 
  baseY: 623 * 0.45,
  img2Size: { w: 308, h: 159 }, 
  img1Size: { w: 117, h: 145 }, 
  img3Size: { w: 135, h: 32 },  
  img4Size: { w: 260, h: 134 }, 
  extractDist: 200,              
  triggerThreshold: 186, 
  img3InitialX: 70,      
  img3InitialY: 65,       
};

function preload() {
  bgImg = loadImage('about-tree-bg.png'); 
  img1 = loadImage('image_1.svg');   
  img2 = loadImage('image_2.svg');   
  img3 = loadImage('image_3.svg');   
  img4 = loadImage('image_4.svg');   
}

function setup() {
  createCanvas(config.canvasW, config.canvasH);
  imageMode(CENTER);
  angleMode(DEGREES);
  img3Pos = createVector(config.img3InitialX, config.img3InitialY);
  img3Vel = createVector(0, 0);
}

function draw() {
  background(255);
  image(bgImg, width/2, height/2, width, height);

  // --- 绘制 img4 (绝对位置，不随信封旋转) ---
  image(img4, img4Config.x, img4Config.y, img4Config.w, img4Config.h);

  push();
  translate(config.baseX, config.baseY);
  rotate(-2); 

  // 1. 图1 逻辑
  let targetX = isExtracted ? config.extractDist : 110; 
  currentImg1X = lerp(currentImg1X, targetX, 0.1);
  
  push();
  translate(currentImg1X, -5);
  rotate(isExtracted ? 5 : sin(frameCount * 2) * 2); 
  image(img1, 0, 0, config.img1Size.w, config.img1Size.h);
  pop();

  // 2. 图3 逻辑
  handleImg3Physics();
  
  push();
  translate(img3Pos.x, img3Pos.y);
  let rotSway = (img3State === "DROPPING") ? sin(frameCount * driftConfig.swingSpeed) * driftConfig.swingRange : 0;
  rotate(rotSway + (isExtracted ? 2 : 0));
  image(img3, 0, 0, config.img3Size.w, config.img3Size.h);
  pop();

  // 3. 图2
  image(img2, 0, 0, config.img2Size.w, config.img2Size.h);
  pop();
}

function handleImg3Physics() {
  if (!isExtracted) {
    // 复位
    img3State = "HIDDEN";
    img3Pos.x = lerp(img3Pos.x, config.img3InitialX, 0.1);
    img3Pos.y = lerp(img3Pos.y, config.img3InitialY, 0.1);
    img3Vel.set(0, 0);
  } else {
    if (img3State === "HIDDEN" || img3State === "SLIDING") {
      if (currentImg1X < config.triggerThreshold) {
        img3Pos.x = lerp(img3Pos.x, config.img3InitialX, 0.1);
        img3Pos.y = config.img3InitialY;
      } else {
        img3State = "DROPPING";
        dropStartTime = frameCount; 
      }
    } 
    
    if (img3State === "DROPPING") {
      let targetPos = createVector(driftConfig.finalX, driftConfig.finalY);
      img3Pos.y = lerp(img3Pos.y, driftConfig.finalY, driftConfig.speedY);
      
      let time = (frameCount - dropStartTime) * driftConfig.swingSpeed;
      let wave = sin(time) * driftConfig.driftAmplitude * (1 - img3Pos.y/driftConfig.finalY);
      
      let baseX = lerp(img3Pos.x, driftConfig.finalX, 0.03);
      img3Pos.x = baseX + wave;

      if (dist(img3Pos.x, img3Pos.y, targetPos.x, targetPos.y) < 0.01) {
        img3Pos.set(targetPos);
        img3State = "STILL";
      }
    }
  }
}

function mousePressed() {
  isExtracted = !isExtracted;
}