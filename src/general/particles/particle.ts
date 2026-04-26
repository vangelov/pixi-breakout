import { Graphics } from "pixi.js";
import { ParticleEvent } from "./events/particle-event";
import { Utils } from "../../utils/math/math-util";
import gsap from "gsap";

export class Particle extends Graphics {
  protected _tween: gsap.core.Tween;
  protected _scaleValue = 1;

  constructor(lifespan = 2) {
    super();

    this._scaleValue = 1;

    this._tween = gsap.to(this, {
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

  get scaleX() {
    return this.scale.x;
  }

  set scaleX(value: number) {
    this.scale.x = value;
  }

  get scaleY() {
    return this.scale.y;
  }

  set scaleY(value: number) {
    this.scale.y = value;
  }
}
