import { Particle } from "../../general/particles/particle";
import { Settings } from "../../settings";

export class BlockShatterParticle extends Particle {
  constructor() {
    super(0.3 + Math.random() * 0.3);

    this.rect(-7, -7, 14, 14);
    this.fill(Settings.COLOR_BLOCK);
    this.cacheAsTexture(true);

    this._tween.vars.ease = "power1.out";
    this._tween.invalidate();

    const shade = 0.8 + Math.random() * 0.2;
    const value = Math.round(shade * 255);
    this.tint = (value << 16) | (value << 8) | value;
  }

  init(xPos: number, yPos: number, vectorX = 0, vectorY = 0) {
    super.init(xPos, yPos, vectorX, vectorY);
    this.scale.x = this.scale.y = 1;

    this._tween.vars.scaleX = 0.1;
    this._tween.vars.scaleY = 0.1;
    this._tween.invalidate().restart();
  }
}
