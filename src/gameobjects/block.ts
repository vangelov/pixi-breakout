import { ColorMatrixFilter, Graphics, Point, Renderer } from "pixi.js";
import { Settings } from "../settings";
import { GameObject } from "../general/gameobjects/game-object";
import { SliceEffect } from "../effects/slice-effect";
import { Ball } from "./ball";
import { Freezer } from "../freeezer";
import { JuicyEvent } from "../events/juicy-events";
import gsap from "gsap";
import { Utils } from "../utils/math/math-util";

export class Block extends GameObject {
  private _renderer: Renderer;

  protected _collisionW = Settings.BLOCK_W;
  protected _collisionH = Settings.BLOCK_H;

  protected _collidable = true;
  protected _gfx: Graphics;

  private _sliceEffect: SliceEffect | null = null;

  constructor(renderer: Renderer, x: number, y: number) {
    super();
    this.x = x;
    this.y = y;
    this._renderer = renderer;

    this._gfx = new Graphics();
    this.addChild(this._gfx);

    this.render(Settings.COLOR_BLOCK);

    if (Settings.EFFECT_TWEENIN_ENABLED) {
      if (Settings.EFFECT_TWEENIN_PROPERTY_Y) this._gfx.y = -500;
      if (Settings.EFFECT_TWEENIN_PROPERTY_ROTATION)
        this._gfx.rotation = Math.random() * 90 - 45;
      if (Settings.EFFECT_TWEENIN_PROPERTY_SCALE)
        this._gfx.scale.x = this._gfx.scale.y = 0.2;

      const easing: Array<gsap.EaseString> = [
        "none", // Linear.easeNone
        "power1.out", // Quadratic.easeOut
        "back.out", // Back.easeOut
        "bounce.out", // Bounce.easeOut
      ];
      const delay = Math.random() * Settings.EFFECT_TWEENIN_DELAY;
      const ease = easing[Settings.EFFECT_TWEENIN_EQUATION];
      gsap.to(this._gfx, {
        duration: Settings.EFFECT_TWEENIN_DURATION,
        y: 0,
        rotation: 0,
        delay,
        ease,
      });
      gsap.to(this._gfx.scale, {
        duration: Settings.EFFECT_TWEENIN_DURATION,
        x: 1,
        y: 1,
        delay,
        ease,
      });
    }
  }

  collide(ball: Ball) {
    this._collidable = false;

    // little hack to get the animation complete callback for all cominations of rotation/scaling
    let delayDestruction = false;

    if (Settings.EFFECT_BLOCK_DARKEN) {
      const filter = new ColorMatrixFilter();
      // prettier-ignore
      filter.matrix = [
          0.7, 0,   0,   0, 0,
          0,   0.7, 0,   0, 0,
          0,   0,   0.8, 0, 0,
          0,   0,   0,   1, 0
        ];
      this.filters = [filter];
    }

    if (Settings.EFFECT_BLOCK_PUSH) {
      const v = new Point(this.x - ball.x, this.y - ball.y);
      v.normalize().multiplyScalar(ball.velocity, v);

      this.velocityX += v.x;
      this.velocityY += v.y;
      delayDestruction = true;
    }

    // move block in front
    if (this.parent)
      this.parent.setChildIndex(this, this.parent.children.length - 1);

    this._sliceEffect = new SliceEffect(this._renderer, this._gfx);
    this.addChild(this._sliceEffect);
    this._gfx.visible = false;

    Freezer.freeze();

    if (Settings.EFFECT_BLOCK_ROTATE && !Settings.EFFECT_BLOCK_SHATTER) {
      this._sliceEffect.slices[0].velocityR =
        Math.random() > 0.5
          ? Settings.EFFECT_BLOCK_SHATTER_ROTATION
          : -Settings.EFFECT_BLOCK_SHATTER_ROTATION;
      delayDestruction = true;
    }

    if (Settings.EFFECT_BLOCK_SHATTER) {
      this._sliceEffect.slice(
        new Point(
          ball.x - this.x + ball.velocityX * 10,
          ball.y - this.y + ball.velocityY * 10,
        ),
        new Point(
          ball.x - this.x - ball.velocityX * 10,
          ball.y - this.y - ball.velocityY * 10,
        ),
      );
      delayDestruction = true;
    }

    if (Settings.EFFECT_BLOCK_SCALE) {
      for (const slice of this._sliceEffect.slices) {
        gsap.to(slice.scale, {
          duration: Settings.EFFECT_BLOCK_DESTRUCTION_DURATION,
          x: 0,
          y: 0,
          ease: "power1.out", // Quadratic.easeOut
        });
      }

      delayDestruction = true;
    }

    Utils.emitBubblingEvent(
      this,
      JuicyEvent.BLOCK_DESTROYED,
      new JuicyEvent(ball, this),
    );
    // if no animation is used, remove instantly
    if (!delayDestruction) {
      this.remove();
    } else {
      gsap.delayedCall(
        Settings.EFFECT_BLOCK_DESTRUCTION_DURATION,
        this.handleRemoveTweenComplete,
      );
    }
  }

  jellyEffect(strength = 0.2, delay = 0) {
    gsap.to(this._gfx.scale, {
      duration: 0.05,
      x: 1 + strength,
      delay,
      ease: "power1.inOut", // Quadratic.easeInOut
      onComplete: () => {
        gsap.to(this._gfx.scale, {
          duration: 0.6,
          x: 1,
          ease: "elastic.out",
        });
      },
    });

    // Y axis (slightly delayed)
    gsap.to(this._gfx.scale, {
      duration: 0.05,
      y: 1 + strength,
      delay: delay + 0.05,
      ease: "power1.inOut",
      onComplete: () => {
        gsap.to(this._gfx.scale, {
          duration: 0.6,
          y: 1,
          ease: "elastic.out",
        });
      },
    });
  }

  update(timeDelta = 1) {
    super.update(timeDelta);

    if (this._sliceEffect) this._sliceEffect.update(timeDelta);

    if (Settings.EFFECT_BLOCK_GRAVITY && !this._collidable) {
      this.velocityY += 0.4 * timeDelta;
    }
  }

  handleRemoveTweenComplete = () => {
    this.remove();
  };

  render(color: number) {
    this._gfx.clear();

    // 0,0 is at center of block to make effects easier
    this._gfx.rect(
      -Settings.BLOCK_W / 2,
      -Settings.BLOCK_H / 2,
      Settings.BLOCK_W,
      Settings.BLOCK_H,
    );
    this._gfx.fill(color);
  }

  get collidable() {
    return this._collidable;
  }

  get collisionW() {
    return this._collisionW;
  }

  get collisionH() {
    return this._collisionH;
  }
}
