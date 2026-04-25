import {
  Application,
  Container,
  Geometry,
  Graphics,
  Matrix,
  Mesh,
  MeshGeometry,
  Point,
  Polygon,
  Rectangle,
  RenderTexture,
  Shader,
  Sprite,
  Texture,
} from "pixi.js";
import { Rainbow } from "./effects/rainbow";
import { Ball } from "./gameobjects/ball";
import { Block } from "./gameobjects/block";
import { Paddle } from "./gameobjects/paddle";
import { BouncyLine } from "./effects/bouncy-line";

// Create a new application
const app = new Application();

// Initialize the application
await app.init({
  resizeTo: window,
});

// Append the application canvas to the document body
document.getElementById("pixi-container")!.appendChild(app.canvas);

// const r = new Rainbow();
// app.stage.addChild(r);

// r.addSegment(0, 0);
// r.addSegment(50, 50);
// r.addSegment(70, 300);

// r.addSegment(500, 800);

// r.redrawSegments(0, 0);

// const g = new Graphics();
// g.moveTo(0, 0);
// g.lineTo(50, 50);
// g.lineTo(70, 300);
// g.lineTo(500, 800);
// g.stroke({ width: 3, color: "red" });
// app.stage.addChild(g);

// const b = new Ball(100, 100);
// b.velocityX = 10;
// b.velocityY = 0;

// app.stage.addChild(b);

// app.ticker.add(({ deltaTime }) => {
//   //b.update(deltaTime);
// });

// setTimeout(() => {
//   console.log("do");
//   b.doCollisionEffects(null);
// }, 3000);

// const block = new Block(app.renderer, 200, 100);
// app.stage.addChild(block);

// const ball = new Ball(0, 500);
// app.stage.addChild(ball);

// ball.velocityY = -10 / 4;
// ball.velocityX = 5.5 / 4;
// //block.collide(ball);

// function isColliding(ball: Ball, block: Block) {
//   return (
//     ball.x > block.x - block.collisionW / 2 &&
//     ball.x < block.x + block.collisionW / 2 &&
//     ball.y > block.y - block.collisionH / 2 &&
//     ball.y < block.y + block.collisionH / 2
//   );
// }

// app.ticker.add(({ deltaTime }) => {
//   ball.update(deltaTime);
//   block.update(deltaTime);

//   if (block.collidable && isColliding(ball, block)) {
//     const v = new Point(ball.velocityX, ball.velocityY);

//     v.normalize().multiplyScalar(2, v);

//     while (isColliding(ball, block)) {
//       ball.x -= v.x;
//       ball.y -= v.y;
//     }

//     block.collide(ball);
//   }
// });
const b = new BouncyLine(10, 10, 10, 300);

const p = new Ball(400, 40);
p.velocityX = -10;
p.velocityY = 0;

app.ticker.add(() => {
  p.update();
  b.update();
  b.checkCollision(p);
});

app.stage.addChild(b);
app.stage.addChild(p);
