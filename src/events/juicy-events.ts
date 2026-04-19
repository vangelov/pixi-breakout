import { Ball } from "../gameobjects/ball";
import { Block } from "../gameobjects/block";
import { Event } from "../general/events/event";

export class JuicyEvent extends Event {
  static BLOCK_DESTROYED = "juicyevent_block_destroyed";
  static BALL_COLLIDE = "juicyevent_ball_collide";

  private _ball: Ball | null = null;
  private _block: Block | null = null;

  constructor(ball: Ball | null, block: Block | null) {
    super(undefined);
    this._ball = ball;
    this._block = block;
  }

  get ball(): Ball | null {
    return this._ball;
  }

  get block(): Block | null {
    return this._block;
  }
}
