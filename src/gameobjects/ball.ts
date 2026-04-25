import { ColorMatrixFilter, Graphics, Point } from "pixi.js";
import { Rainbow } from "../effects/rainbow";
import { GameObject } from "../general/gameobjects/game-object";
import { Settings } from "../settings";
import { Utils } from "../utils/math/math-util";
import { Block } from "./block";
import gsap from "gsap";
import { JuicyEvent } from "../events/juicy-events";

function polar(length: number, angle: number) {
  return new Point(length * Math.cos(angle), length * Math.sin(angle));
}

export class Ball extends GameObject {
  private static SIZE = 15;

  private _trail: Rainbow;
  private _gfx: Graphics;

  private _ball_shakiness: number;
  private _ball_shakiness_vel: number;
  private _ball_rotation: number;
  private _ball_extra_scale: number;

  private _tween_brightness: gsap.core.Tween | null = null;
  private _tween_brightnesProxy = { value: 0 };
  private _brightnessFilter: ColorMatrixFilter | null = null;

  exX = 0;
  exY = 0;

  private _trailCooldown = 0.5;

  constructor(x: number, y: number) {
    super();
    this.x = x;
    this.y = y;

    this._trail = new Rainbow();
    this.addChild(this._trail);

    this._gfx = new Graphics();
    this.drawBall();
    this.addChild(this._gfx);

    const v = polar(5, Math.random() * Math.PI * 2);
    this.velocityX = v.x;
    this.velocityY = v.y;

    this._ball_shakiness = 0;
    this._ball_shakiness_vel = 0;
    this._ball_rotation = 0;
    this._ball_extra_scale = 0;

    const brightnessFilter = new ColorMatrixFilter();
    // prettier-ignore
    brightnessFilter.matrix = [
      1, 0, 0, 0, 1,
      0, 1, 0, 0, 1,
      0, 0, 1, 0, 1,
      0, 0, 0, 1, 0
    ];

    const b = { value: 1 };

    gsap.to(b, {
      value: 0,
      duration: 0.7,
      ease: "back.out",

      onUpdate: () => {
        // prettier-ignore
        brightnessFilter.matrix = [
            1, 0, 0, 0, b.value,
            0, 1, 0, 0, b.value,
            0, 0, 1, 0, b.value,
            0, 0, 0, 1, 0
        ];
      },
    });

    this.filters = [brightnessFilter];
  }

  drawBall() {
    this._gfx.clear();
    this._gfx.rect(-Ball.SIZE / 2, -Ball.SIZE / 2, Ball.SIZE, Ball.SIZE);
    this._gfx.fill(Settings.COLOR_BALL);

    // this._gfx.circle( 0, 0, Ball.SIZE / 2 );
  }

  update(timeDelta = 1): void {
    this.exX = this.x;
    this.exY = this.y;
    super.update(timeDelta);

    if (Settings.EFFECT_BALL_ROTATE) {
      const target_rotation =
        (Math.atan2(this.velocityY, this.velocityX) / Math.PI) * 180;
      this._ball_rotation +=
        (target_rotation - this._ball_rotation) * timeDelta * 0.5;

      if (Settings.EFFECT_BALL_ROTATE_ANIMATED == false)
        this._ball_rotation = target_rotation;

      this._gfx.rotation = this._ball_rotation;
    } else {
      this._gfx.rotation = 0;
    }

    if (Math.abs(this._ball_shakiness) > 0) {
      this._ball_shakiness_vel += timeDelta * -0.25 * this._ball_shakiness;
      this._ball_shakiness_vel -= timeDelta * this._ball_shakiness_vel * 0.1;

      this._ball_shakiness += timeDelta * this._ball_shakiness_vel;
    }

    if (Settings.EFFECT_BALL_STRETCH) {
      if (Settings.EFFECT_BALL_STRETCH_ANIMATED == false) {
        this._gfx.scale.set(
          1 +
            ((this.velocity - Settings.BALL_MIN_VELOCITY) /
              (Settings.BALL_MAX_VELOCITY - Settings.BALL_MIN_VELOCITY)) *
              0.3,

          1 -
            ((this.velocity - Settings.BALL_MIN_VELOCITY) /
              (Settings.BALL_MAX_VELOCITY - Settings.BALL_MIN_VELOCITY)) *
              0.2,
        );
      } else if (Settings.EFFECT_BALL_STRETCH_ANIMATED) {
        let relative = 1.0 + this.velocity / (2 * Settings.BALL_MAX_VELOCITY);
        relative = Utils.clamp(relative, 2.5, 1.0);

        this._gfx.scale.set(
          Utils.clamp(1.0 * relative - this._ball_shakiness, 1.35, 0.85),
          Utils.clamp(1.0 / relative + this._ball_shakiness, 1.35, 0.85),
        );
      }
    } else {
      this._gfx.scale.set(1, 1);
    }

    if (Settings.EFFECT_BALL_EXTRA_SCALE) {
      if (this._ball_extra_scale > 0.01) {
        this._gfx.scale.set(
          this._gfx.scale.x + this._ball_extra_scale,
          this._gfx.scale.y + this._ball_extra_scale,
        );

        this._ball_extra_scale -= timeDelta * this._ball_extra_scale * 0.35;
      }
    } else {
      this._ball_extra_scale = 0;
    }

    if ((this._trailCooldown -= timeDelta) < 0) {
      this._trail.addSegment(this.x, this.y);
      this._trailCooldown = 3;
    }

    this._trail.redrawSegments(this.x, this.y);
  }

  doCollisionEffects(block: Block | null = null) {
    Utils.emitBubblingEvent(
      this,
      JuicyEvent.BALL_COLLIDE,
      new JuicyEvent(this, block),
    );

    this._ball_shakiness = 0.1;
    this._ball_shakiness_vel = 2.5;
    this._ball_extra_scale += 1.5;

    if (Settings.EFFECT_BALL_GLOW) {
      if (!this._brightnessFilter) {
        this._brightnessFilter = new ColorMatrixFilter();
        this.filters = [this._brightnessFilter];
      }

      if (!this._tween_brightness)
        this._tween_brightness = gsap.to(this._tween_brightnesProxy, {
          value: 0,
          duration: 0.7,
          ease: "back.out",
          paused: true,
          onUpdate: () => {
            // prettier-ignore
            if (this._brightnessFilter) {
                // prettier-ignore
                this._brightnessFilter.matrix = [
                    1, 0, 0, 0, this._tween_brightnesProxy.value,
                    0, 1, 0, 0, this._tween_brightnesProxy.value,
                    0, 0, 1, 0, this._tween_brightnesProxy.value,
                    0, 0, 0, 1, 0
                ];
            }
          },
        });

      this._tween_brightnesProxy.value = 1;

      // prettier-ignore
      this._brightnessFilter.matrix = [
        1, 0, 0, 0, this._tween_brightnesProxy.value,
        0, 1, 0, 0, this._tween_brightnesProxy.value,
        0, 0, 1, 0, this._tween_brightnesProxy.value,
        0, 0, 0, 1, 0
      ];

      this._tween_brightness.invalidate().restart();
    }
  }

  collide(
    velocityMultiplierX: number,
    velocityMultiplierY: number,
    block: Block | null = null,
  ) {
    this.velocityX *= velocityMultiplierX;
    this.velocityY *= velocityMultiplierY;
    this.doCollisionEffects(block);
  }
  collideSet(
    newVelocityX: number,
    newVelocityY: number,
    block: Block | null = null,
  ) {
    this.velocityX = newVelocityX;
    this.velocityY = newVelocityY;
    this.doCollisionEffects(block);
  }
}
