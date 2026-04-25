import { Container, Point } from "pixi.js";

function polarPoint(length: number, angleRadians: number) {
  return new Point(
    length * Math.cos(angleRadians),
    length * Math.sin(angleRadians),
  );
}

export class Shaker {
  private _velocity: Point;
  private _position: Point;
  private _target: Container;
  private _drag = 0.1;
  private _elasticity = 0.1;

  constructor(target: Container) {
    this._target = target;
    this._velocity = new Point();
    this._position = new Point();
  }

  shake(powerX: number, powerY: number): void {
    this._velocity.x += powerX;
    this._velocity.y += powerY;
  }

  shakeRandom(power: number) {
    this._velocity = polarPoint(power, Math.random() * Math.PI * 2);
  }

  update(delta: number) {
    this._velocity.x -= this._velocity.x * this._drag * delta;
    this._velocity.y -= this._velocity.y * this._drag * delta;

    this._velocity.x -= this._position.x * this._elasticity * delta;
    this._velocity.y -= this._position.y * this._elasticity * delta;

    this._position.x += this._velocity.x * delta;
    this._position.y += this._velocity.y * delta;

    this._target.x = this._position.x;
    this._target.y = this._position.y;
  }
}
