import { Utils } from "../utils/math/math-util";

/**
 * ...
 * @author Martin Jonasson (m@grapefrukt.com)
 */
export class Timestep {
  private _game_speed = 1;
  private _target_frametime = 0.6;
  private _max_speed = 3;
  private _smoothing = 0.5;

  private _real_speed = 0.0;
  private _last_frame_time = 0.0;
  private _delta = 0.0;

  /**
   * Initializes the timestepper
   * @param	fps			The target framerate you wish to maintain
   * @param	gameSpeed	The game's speed, useful for slowdown effects or general speed tweaking. 1 = 100% speed.
   * @param	maxSpeed	The maximum size of a timeDelta, steps will not be bigger than this
   * @param	smoothing	How much to smooth the step size across ticks, 1 gives old value full priority (value will never change), 0 means no smoothing, so new value will be used.
   */
  constructor(fps = 60, gameSpeed = 1.0, maxSpeed = 3.0, smoothing = 0.5) {
    this._target_frametime = 1000 / fps;
    this._smoothing = smoothing;
    this.gameSpeed = gameSpeed;
    this.maxSpeed = maxSpeed;
  }

  /**
   * Call this function every frame to get a updated timeDelta
   * @return	timeDelta
   */
  public tick() {
    this._real_speed =
      (Utils.getTimer() - this._last_frame_time) / this._target_frametime;
    this._last_frame_time = Utils.getTimer();

    if (this._real_speed > this._max_speed) this._real_speed = this._max_speed;

    this._delta -= (this._delta - this._real_speed) * (1 - this._smoothing);

    return this._delta * this._game_speed;
  }

  public get timeDelta() {
    return this._delta * this._game_speed;
  }

  public get maxSpeed() {
    return this._max_speed;
  }
  public set maxSpeed(value: number) {
    this._max_speed = value;
  }

  public get gameSpeed() {
    return this._game_speed;
  }
  public set gameSpeed(value: number) {
    this._game_speed = value;
  }

  public get smoothing() {
    return this._smoothing;
  }
  public set smoothing(value: number) {
    if (value > 1) value = 1;
    if (value < 0) value = 0;
    this._smoothing = value;
  }
}
