import {
  Application,
  ColorMatrixFilter,
  Container,
  Graphics,
  Point,
} from "pixi.js";
import { GameObjectCollection } from "./general/collections/game-object-collection";
import { Timestep } from "./general/timestep";
import { Shaker } from "./shaker";
import { Paddle } from "./gameobjects/paddle";
import { JuicyEvent } from "./events/juicy-events";
import { Settings } from "./settings";
import { Block } from "./gameobjects/block";
import { BouncyLine } from "./effects/bouncy-line";
import { Ball } from "./gameobjects/ball";
import { Freezer } from "./freeezer";
import { ParticlePool } from "./general/particles/particle-pool";
import { BallImpactParticle } from "./effects/particles/ball-impact-particle";
import { BlockShatterParticle } from "./effects/particles/block-shatter-particle";
import { ParticleSpawn } from "./general/particles/particle-spawn";
import gsap from "gsap";
import { SoundManager } from "./sound-manager";

export class Main extends Container {
  private _app: Application;

  private _blocks = new GameObjectCollection();
  private _balls = new GameObjectCollection();
  private _lines = new GameObjectCollection();
  private _timestep = new Timestep();
  private _screenshake = new Shaker(this);

  private _paddle: Paddle;

  private _particles_impact = new ParticlePool(BallImpactParticle);
  private _particles_shatter = new ParticlePool(BlockShatterParticle);

  private _mouseDown = false;
  private _mouseVector = new Point();

  private _backgroundGlitchForce = 0;
  private _soundBlockHitCounter = 0;
  private _soundLastTimeHit = 0;

  //private _keyboard: LazyKeyboard;
  private _background = new Graphics();
  private _useColors = false;

  private mouseX = 0;
  private mouseY = 0;

  constructor(app: Application) {
    super();
    this._app = app;
    this._paddle = new Paddle(app.renderer);

    this.init();
  }

  private async init() {
    await SoundManager.init();

    this._app.stage.on("pointermove", (e) => {
      this.mouseX = e.global.x;
      this.mouseY = e.global.y;
    });
    this._app.stage.on("pointerdown", this.handleMouseToggle);
    this._app.stage.on("pointerup", this.handleMouseToggle);

    this._blocks.on(JuicyEvent.BLOCK_DESTROYED, this.handleBlockDestroyed);
    this.addChild(this._blocks);

    // we want to draw these under the ball, that's why it's added here
    this.addChild(this._lines);

    this._balls.on(JuicyEvent.BALL_COLLIDE, this.handleBallCollide);
    this.addChild(this._balls);

    this.addChild(this._particles_impact);

    this.addChild(this._particles_shatter);

    app.ticker.add(this.handleEnterFrame);

    window.addEventListener("keydown", this.handleKeyDown);
    // stage.addEventListener(MouseEvent.MOUSE_DOWN, handleMouseToggle);
    // stage.addEventListener(MouseEvent.MOUSE_UP, handleMouseToggle);

    this._timestep.gameSpeed = 1;

    this._screenshake = new Shaker(this);

    this._background = new Graphics();
    if (this.parent) this.parent.addChildAt(this._background, 0);

    //_keyboard = new LazyKeyboard(stage);

    this.updateColorUse();

    this.reset();
  }

  drawBackground() {
    this._background.clear();
    this._background.rect(5, 5, Settings.STAGE_W - 10, Settings.STAGE_H);

    if (
      Settings.EFFECT_SCREEN_COLOR_GLITCH &&
      this._backgroundGlitchForce > 0.01
    ) {
      this._background.fill(
        ((Settings.COLOR_BACKGROUND * (3 * Math.random())) >>> 0) & 0xffffff,
      );
      this._backgroundGlitchForce *= 0.8;
    } else {
      this._background.fill(Settings.COLOR_BACKGROUND);
    }
  }

  updateColorUse() {
    if (Settings.EFFECT_SCREEN_COLORS) {
      this.filters = null;
      this._background.filters = null;
    } else {
      const filter = new ColorMatrixFilter();

      // approximate "add white"
      filter.matrix = [
        1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0,
      ];

      this.filters = [filter];

      const bgFilter = new ColorMatrixFilter();
      bgFilter.matrix = [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0,
      ];

      this._background.filters = [bgFilter];
    }

    this._useColors = Settings.EFFECT_SCREEN_COLORS;
  }

  reset() {
    this._soundBlockHitCounter = 0;
    this.drawBackground();

    this._blocks.clear();
    this._balls.clear();
    this._lines.clear();

    this._particles_impact.clear();

    for (let j = 0; j < Settings.NUM_BALLS; j++) {
      this.addBall();
    }

    for (let i = 0; i < 80; i++) {
      const block = new Block(
        app.renderer,
        120 + (i % 10) * (Settings.BLOCK_W + 10),
        30 + 47.5 + Math.trunc(i / 10) * (Settings.BLOCK_H + 10),
      );
      this._blocks.add(block);
    }

    const buffer = Settings.EFFECT_BOUNCY_LINES_DISTANCE_FROM_WALLS;
    this._lines.add(
      new BouncyLine(buffer, buffer, Settings.STAGE_W - buffer, buffer),
    );
    this._lines.add(new BouncyLine(buffer, buffer, buffer, Settings.STAGE_H));
    this._lines.add(
      new BouncyLine(
        Settings.STAGE_W - buffer,
        buffer,
        Settings.STAGE_W - buffer,
        Settings.STAGE_H,
      ),
    );

    this._blocks.add(this._paddle);
  }

  isColliding(ball: Ball, block: Block) {
    return (
      ball.x > block.x - block.collisionW / 2 &&
      ball.x < block.x + block.collisionW / 2 &&
      ball.y > block.y - block.collisionH / 2 &&
      ball.y < block.y + block.collisionH / 2
    );
  }

  handleMouseToggle = (e: MouseEvent) => {
    this._mouseDown = e.type == "pointerdown";
  };

  handleEnterFrame = () => {
    this._timestep.tick();

    this._soundLastTimeHit++;

    if (Settings.EFFECT_SCREEN_COLORS !== this._useColors) {
      this.updateColorUse();
    }

    if (!Settings.SOUND_MUSIC) {
      SoundManager.stop("music");
    } else if (!SoundManager.isPlaying("music")) {
      SoundManager.play("music", { loop: true });
    }

    // if (_keyboard.keyIsDown(Keyboard.CONTROL) || _slides.visible) {
    // 			_timestep.gameSpeed = 0;
    // 		} else if (_keyboard.keyIsDown(Keyboard.SHIFT)) {
    // 			_timestep.gameSpeed = .1;
    // 		} else {
    // 			_timestep.gameSpeed = 1;
    // 		}

    this._timestep.gameSpeed *= Freezer.multiplier;

    gsap.globalTimeline.timeScale(this._timestep.gameSpeed);

    this.drawBackground();

    this._balls.update(this._timestep.timeDelta);
    this._blocks.update(this._timestep.timeDelta);
    this._lines.update(this._timestep.timeDelta);
    this._screenshake.update(this._timestep.timeDelta);

    if (this._balls.collection.length)
      this._paddle.lookAt(this._balls.collection[0] as Ball);

    if (Settings.EFFECT_PADDLE_STRETCH) {
      this._paddle.scale.x = 1 + Math.abs(this._paddle.x - this.mouseX) / 100;
      this._paddle.scale.y = 1.5 - this._paddle.scale.x * 0.5;
    } else {
      this._paddle.scale.x = this._paddle.scale.y = 1;
    }

    this._paddle.x = this.mouseX;

    const screen_buffer =
      0.5 * Settings.EFFECT_BOUNCY_LINES_WIDTH +
      Settings.EFFECT_BOUNCY_LINES_DISTANCE_FROM_WALLS;
    for (const ball of this._balls.collection as Array<Ball>) {
      if (ball.x < screen_buffer && ball.velocityX < 0) ball.collide(-1, 1);
      if (ball.x > Settings.STAGE_W - screen_buffer && ball.velocityX > 0)
        ball.collide(-1, 1);
      if (ball.y < screen_buffer && ball.velocityY < 0) ball.collide(1, -1);
      if (ball.y > Settings.STAGE_H && ball.velocityY > 0) ball.collide(1, -1);

      ball.velocityY +=
        (Settings.BALL_GRAVITY / 100) * this._timestep.timeDelta;

      // line ball collision
      for (const line of this._lines.collection as Array<BouncyLine>) {
        line.checkCollision(ball);
      }

      if (this._mouseDown) {
        this._mouseVector.x =
          (ball.x - this.mouseX) *
          Settings.MOUSE_GRAVITY_POWER *
          this._timestep.timeDelta;
        this._mouseVector.y =
          (ball.y - this.mouseY) *
          Settings.MOUSE_GRAVITY_POWER *
          this._timestep.timeDelta;
        if (this._mouseVector.magnitude() > Settings.MOUSE_GRAVITY_MAX)
          this._mouseVector
            .normalize()
            .multiplyScalar(Settings.MOUSE_GRAVITY_MAX, this._mouseVector);

        ball.velocityX -= this._mouseVector.x;
        ball.velocityY -= this._mouseVector.y;
      }

      // hard limit for min vel
      if (ball.velocity < Settings.BALL_MIN_VELOCITY) {
        ball.velocity = Settings.BALL_MIN_VELOCITY;
      }

      // soft limit for max vel
      if (ball.velocity > Settings.BALL_MAX_VELOCITY) {
        ball.velocity -=
          ball.velocity *
          Settings.BALL_VELOCITY_LOSS *
          this._timestep.timeDelta;
      }

      for (const block of this._blocks.collection as Array<Block>) {
        // check for collisions
        if (block.collidable && this.isColliding(ball, block)) {
          // back the ball out of the block
          const v = new Point(ball.velocityX, ball.velocityY);
          v.normalize().multiplyScalar(2, v);
          while (this.isColliding(ball, block)) {
            ball.x -= v.x;
            ball.y -= v.y;
          }

          block.collide(ball);

          // figure out which way to bounce

          // slicer powerup
          if (Settings.POWERUP_SLICER_BALL && !(block instanceof Paddle))
            ball.collide(1, 1, block);
          // top
          else if (
            ball.y <= block.y - block.collisionH / 2 &&
            ball.velocityY > 0
          )
            ball.collide(1, -1, block);
          // bottom
          else if (
            ball.y >= block.y + block.collisionH / 2 &&
            ball.velocityY < 0
          )
            ball.collide(1, -1, block);
          // left
          else if (ball.x <= block.x - block.collisionW / 2)
            ball.collide(-1, 1, block);
          // right
          else if (ball.x >= block.x + block.collisionW / 2)
            ball.collide(-1, 1, block);
          // wtf!
          else ball.collide(-1, -1, block);

          break; // only collide with one block per update
        }
      }
    }
  };

  handleBlockDestroyed = (e: JuicyEvent) => {
    if (Settings.EFFECT_PARTICLE_BLOCK_SHATTER && e.ball) {
      ParticleSpawn.burst(
        e.ball.x,
        e.ball.y,
        5,
        45,
        (-Math.atan2(e.ball.velocityX, e.ball.velocityY) * 180) / Math.PI,
        50 + e.ball.velocity * 10,
        0.5,
        this._particles_shatter,
      );
    }
  };

  handleKeyDown = (e: KeyboardEvent) => {
    console.log("test", e);

    if (e.code == "Space") this.reset();
    if (e.code == "KeyB") this.addBall();

    if (e.code == "KeyP") {
      const b = this._balls.collection[0] as Ball;
      ParticleSpawn.burst(
        b.x,
        b.y,
        10,
        360,
        (Math.atan2(b.velocityY, b.velocityX) * 180) / Math.PI,
        100,
        0.1,
        this._particles_impact,
      );
    }
  };

  handleBallCollide = (e: JuicyEvent) => {
    if (e.block != null && e.block !== this._paddle)
      this._backgroundGlitchForce = 0.05;

    if (Settings.EFFECT_PARTICLE_BALL_COLLISION && e.ball) {
      ParticleSpawn.burst(
        e.ball.x,
        e.ball.y,
        5,
        90,
        (-Math.atan2(e.ball.velocityX, e.ball.velocityY) * 180) / Math.PI,
        e.ball.velocity * 5,
        0.5,
        this._particles_impact,
      );
    }

    if (Settings.EFFECT_SCREEN_SHAKE && e.ball)
      this._screenshake.shake(
        -e.ball.velocityX * Settings.EFFECT_SCREEN_SHAKE_POWER,
        -e.ball.velocityY * Settings.EFFECT_SCREEN_SHAKE_POWER,
      );

    if (Settings.EFFECT_BLOCK_JELLY) {
      for (const block of this._blocks.collection as Array<Block>) {
        //var dist:Number = block.getDistance(e.ball);
        //dist = dist / Settings.STAGE_W;
        //dist = MathUtil.clamp(dist, 1, 0) * .2;
        block.jellyEffect(0.2, Math.random() * 0.02);
      }
    }

    if (e.ball) e.ball.velocity = Settings.BALL_MAX_VELOCITY;

    // wall collision
    if (e.block instanceof Paddle) {
      if (Settings.SOUND_PADDLE) SoundManager.play("ball-paddle");

      if (Settings.EFFECT_PARTICLE_PADDLE_COLLISION && e.ball) {
        // ParticleSpawn.burst(
        //   e.ball.x,
        //   e.ball.y,
        //   20,
        //   90,
        //   -180,
        //   600,
        //   1,
        //   _particles_confetti,
        // );
      }
    } else if (e.block) {
      this._soundBlockHitCounter++;

      if (this._soundLastTimeHit > 60) this._soundBlockHitCounter = 0;

      this._soundLastTimeHit = 0;
      if (Settings.SOUND_BLOCK) {
        const id = 1 + (this._soundBlockHitCounter % 12);
        SoundManager.play(`pling${id}`);
      }
    } else {
      if (Settings.SOUND_WALL) SoundManager.play("ball-wall");
    }
  };

  addBall() {
    this._balls.add(new Ball(Settings.STAGE_W / 2, Settings.STAGE_H / 2 + 100));
  }
}

const app = new Application();
app.stage.eventMode = "static";

await app.init({
  resizeTo: window,
  antialias: true,
});

document.getElementById("pixi-container")!.appendChild(app.canvas);

app.stage.addChild(new Main(app));
