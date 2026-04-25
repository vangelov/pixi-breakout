import { Renderer, Sprite } from "pixi.js";
import { Block } from "./block";
import { Settings } from "../settings";
import { Utils } from "../utils/math/math-util";
import { Ball } from "./ball";

class PaddleFace extends Sprite {
  mouth: Sprite = new Sprite();
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
    //super.collide(ball);
    this._happyExtraScale = 10;
  }

  update(timeDelta = 1) {
    super.update(timeDelta);
    this._face.visible = Settings.EFFECT_PADDLE_FACE;
    //this._face.mouth.gotoAndStop(Settings.EFFECT_PADDLE_SMILE);

    // this._face.eye_l.x = -Settings.EFFECT_PADDLE_EYE_SEPARATION;
    // this._face.eye_r.x = Settings.EFFECT_PADDLE_EYE_SEPARATION;

    this._happyExtraScale *= 0.95;
    // _face.eye_l.scaleX = _face.eye_l.scaleY =
    //   1 + Settings.EFFECT_PADDLE_EYE_SIZE / 100;
    // _face.eye_r.scaleX = _face.eye_r.scaleY =
    //   1 + Settings.EFFECT_PADDLE_EYE_SIZE / 100;
  }

  lookAt(ball: Ball): void {
    if (Settings.EFFECT_PADDLE_LOOK_AT_BALL) {
      //   _face.eye_l.rotation =
      //     (-Math.atan2(
      //       this.x + _face.eye_l.x - ball.x,
      //       this.y + _face.eye_l.y - ball.y,
      //     ) *
      //       180) /
      //     Math.PI;
      //   _face.eye_r.rotation =
      //     (-Math.atan2(
      //       this.x + _face.eye_r.x - ball.x,
      //       this.y + _face.eye_r.y - ball.y,
      //     ) *
      //       180) /
      //     Math.PI;
    } else {
      //_face.eye_l.rotation = _face.eye_r.rotation = 0;
    }

    //_face.mouth.scaleX = 1;

    let distance = Math.sqrt(
      Math.pow(this.x - ball.x, 2) + Math.pow(this.y - ball.y, 2),
    );

    distance /= 500;
    distance = 1 - Utils.clamp(distance - 0.1, 1, 0);
    distance += this._happyExtraScale;
    this.smile(distance);
    // _face.mouth.scaleY = 0.1;
    // }
  }

  smile(how_much: number) {
    //let t = 0;
    if (how_much < 0.4) {
      //t = -1 + how_much / 0.4;
      // _face.mouth.scaleY = t;
    } else if (how_much <= 1) {
      // _face.mouth.scaleY = 0.1;
    } else {
      //t = 0.1 + ((Utils.clamp(how_much, 2, 0) - 1.0) / 1.0) * 0.9;
      // _face.mouth.scaleY = t;
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
