import { Container, Graphics, Renderer } from "pixi.js";
import { Block } from "./block";
import { Settings } from "../settings";
import { Utils } from "../utils/math/math-util";
import { Ball } from "./ball";

class PaddleFace extends Container {
  mouth: Graphics = new Graphics();
  eye_l: Graphics = new Graphics();
  eye_r: Graphics = new Graphics();

  constructor() {
    super();

    const width = 20;
    const height = 14;

    this.mouth.moveTo(0, -height / 2);
    this.mouth.bezierCurveTo(
      width * 0.25,
      height / 2,
      width * 0.75,
      height / 2,
      width,
      -height / 2,
    );
    this.mouth.x = -width / 2;
    this.mouth.y = 2;
    this.mouth.fill("black");
    this.addChild(this.mouth);

    this.eye_l.circle(0, 0, 4);
    this.eye_l.fill("white");
    this.eye_l.circle(0, -2, 2);
    this.eye_l.fill("black");
    this.addChild(this.eye_l);

    this.eye_r.circle(0, 0, 4);
    this.eye_r.fill("white");
    this.eye_r.circle(0, -2, 2);
    this.eye_r.fill("black");
    this.addChild(this.eye_r);
  }
}

export class Paddle extends Block {
  private _face: PaddleFace;
  private _happyExtraScale: number = 0;

  constructor(renderer: Renderer) {
    super(
      renderer,
      Settings.STAGE_W / 2,
      Settings.STAGE_H + Settings.PADDLE_H / 2 - 50,
    );
    this._collisionW = Settings.PADDLE_W;
    this._collisionH = Settings.PADDLE_H;
    this.render(Settings.COLOR_PADDLE);

    this._face = new PaddleFace();
    this._gfx.addChild(this._face);
  }

  collide() {
    this._happyExtraScale = 10;
  }

  update(timeDelta = 1) {
    super.update(timeDelta);
    this._face.visible = Settings.EFFECT_PADDLE_FACE;

    this._face.eye_l.x = -Settings.EFFECT_PADDLE_EYE_SEPARATION;
    this._face.eye_r.x = Settings.EFFECT_PADDLE_EYE_SEPARATION;

    this._happyExtraScale *= 0.95;
    this._face.eye_l.scale.x = this._face.eye_l.scale.y =
      1 + Settings.EFFECT_PADDLE_EYE_SIZE / 100;
    this._face.eye_r.scale.x = this._face.eye_r.scale.y =
      1 + Settings.EFFECT_PADDLE_EYE_SIZE / 100;
  }

  lookAt(ball: Ball) {
    if (Settings.EFFECT_PADDLE_LOOK_AT_BALL) {
      this._face.eye_l.rotation = -Math.atan2(
        this.x + this._face.eye_l.x - ball.x,
        this.y + this._face.eye_l.y - ball.y,
      );
      this._face.eye_r.rotation = -Math.atan2(
        this.x + this._face.eye_r.x - ball.x,
        this.y + this._face.eye_r.y - ball.y,
      );
    } else {
      this._face.eye_l.rotation = this._face.eye_r.rotation = 0;
    }

    this._face.mouth.scale.x = 1;

    let distance = Math.sqrt(
      Math.pow(this.x - ball.x, 2) + Math.pow(this.y - ball.y, 2),
    );

    distance /= 500;
    distance = 1 - Utils.clamp(distance - 0.1, 1, 0);
    distance += this._happyExtraScale;
    this.smile(distance);
  }

  smile(how_much: number) {
    let t = 0;
    if (how_much < 0.4) {
      t = -1 + how_much / 0.4;
      this._face.mouth.scale.y = t;
    } else if (how_much <= 1) {
      this._face.mouth.scale.y = 0.1;
    } else {
      t = 0.1 + ((Utils.clamp(how_much, 2, 0) - 1.0) / 1.0) * 0.9;
      this._face.mouth.scale.y = t;
    }
  }

  render(color: number) {
    this._gfx.clear();
    // 0,0 is at center of block to make effects easier
    this._gfx.rect(
      -Settings.PADDLE_W / 2,
      -Settings.PADDLE_H / 2,
      Settings.PADDLE_W,
      Settings.PADDLE_H,
    );
    this._gfx.fill(color);
  }
}
