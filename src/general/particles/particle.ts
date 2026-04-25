import { Container, Graphics } from "pixi.js";
import { ParticleEvent } from "./events/particle-event";
import { Utils } from "../../utils/math/math-util";

export class Particle extends Container {
  protected _graphics = new Graphics();
  protected _tween: gsap.core.Tween;
  protected _scaleValue = 1;

  constructor(lifespan = 2) {
    super();
    this.addChild(this._graphics);

    this._scaleValue = 1;

    this._tween = gsap.to(this._graphics, {
      duration: lifespan,
      paused: true,
      onComplete: () => this.die(),
    });
  }

  reset() {
    this._tween.pause(0);
  }

  init(xPos: number, yPos: number, vectorX = 0, vectorY = 0) {
    this.x = xPos;
    this.y = yPos;

    this._tween.vars.x = xPos + vectorX;
    this._tween.vars.y = yPos + vectorY;
    this._tween.invalidate().restart();
  }

  die = () => {
    Utils.emitBubblingEvent(this, ParticleEvent.DIE, new ParticleEvent(this));
  };

  get scaleValue() {
    return this._scaleValue;
  }

  set scaleValue(value: number) {
    this._scaleValue = value;

    if (this._scaleValue < 0.5) {
      this.scale.x = this._scaleValue * 2;
      this.scale.y = this._scaleValue * 2;
    } else {
      this.scale.x = 2 - this._scaleValue * 2;
      this.scale.y = 2 - this._scaleValue * 2;
    }
  }
}
