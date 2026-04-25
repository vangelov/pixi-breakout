import { Graphics, Point } from "pixi.js";
import { GameObject } from "../general/gameobjects/game-object";
import "pixi.js/math-extras";
import { Settings } from "../settings";
import { Ball } from "../gameobjects/ball";

export class BouncyLine extends GameObject {
  private pos1 = new Point();
  private pos2 = new Point();
  private pos_middle = new Point();
  private length = 0;

  // offset from the center ...
  private wobble_middle = new Point();
  private wobble_velocity = new Point();
  private line_rotation = 0;

  //
  private bounce_speed = 0.25; // 0.25f default
  private bounciness = 0.85; //  0.85f default bigger the number, the longer the vibrations... over 1 adds to the vibrations

  private collisionCounter = 0;
  private graphics = new Graphics();

  constructor(x1 = 0, y1 = 0, x2 = 0, y2 = 0) {
    super();
    this.addChild(this.graphics);
    this.set(x1, y1, x2, y2);
  }

  set(x1: number, y1: number, x2: number, y2: number): void {
    this.pos1.x = x1;
    this.pos1.y = y1;
    this.pos2.x = x2;
    this.pos2.y = y2;

    let delta: Point;
    delta = this.pos2.clone();
    delta = delta.subtract(this.pos1); // pos2 - pos1 ?

    length = delta.magnitude();
    delta.normalize();
    this.line_rotation = Math.atan2(delta.y, delta.x);

    delta.normalize().multiplyScalar(this.length * 0.5);

    this.pos_middle = this.pos1.clone();
    this.pos_middle = this.pos_middle.add(delta);

    // wobble_middle.y = 500;
  }

  // wobble pos is the new position of the anchor, that is going to be wobbled to the middle
  wobble(x: number, y: number) {
    // move this to local coordinate system

    const wobble_pos: Point = new Point(
      x - this.pos_middle.x,
      y - this.pos_middle.y,
    );

    const tx = wobble_pos.x;
    wobble_pos.x =
      wobble_pos.x * Math.cos(this.line_rotation) -
      wobble_pos.y * Math.sin(this.line_rotation);
    wobble_pos.y =
      tx * Math.sin(this.line_rotation) +
      wobble_pos.y * Math.cos(this.line_rotation);

    // wobble_pos = wobble_pos.add( pos_middle );

    this.wobble_middle = wobble_pos; // wobble_middle.add( wobble_pos );
    /*
			CVector2< Type > D = *this - centre;
			D.Rotate( angle );

			D += centre;
			Set( D.x, D.y );
			*/
    /*types::vector2 middle_result = end_pos.Rotate( paddle_pos_middle, paddle_rotation );
			paddle_middle += middle_result - paddle_pos_middle;*/
  }

  update() {
    if (Math.abs(this.wobble_middle.y) > 0) {
      this.wobble_velocity.y += -this.bounce_speed * this.wobble_middle.y;
      this.wobble_velocity.y *= this.bounciness;
    }
    /*
			if( ceng::math::Absolute( paddle_middle.y ) > 0 ) {
				paddle_middle_velocity.y += -bounce_speed * paddle_middle.y;
				paddle_middle_velocity.y *= bounciness;
			}*/

    if (Math.abs(this.wobble_middle.x) > 0) {
      this.wobble_middle.x *= 0.95;
    }

    this.wobble_middle = this.wobble_middle.add(this.wobble_velocity);

    /*
			if( ceng::math::Absolute( paddle_middle.x ) > 0 ) {
				paddle_middle.x *= bounciness;
			}

			paddle_middle += paddle_middle_velocity;
			*/

    this.graphics.clear();

    // Move to start
    this.graphics.moveTo(this.pos1.x, this.pos1.y);

    const m = this.middle;

    // Draw path
    if (Settings.EFFECT_BOUNCY_LINES_ENABLED) {
      this.graphics.quadraticCurveTo(m.x, m.y, this.pos2.x, this.pos2.y);
    } else {
      this.graphics.lineTo(this.pos2.x, this.pos2.y);
    }

    // Apply stroke style (v8 way)
    this.graphics.stroke({
      width: Settings.EFFECT_BOUNCY_LINES_WIDTH,
      color: Settings.COLOR_BOUNCY_LINES,
      alpha: 1,
      cap: "square",
      join: "miter",
    });

    // Decrement collision counter
    if (this.collisionCounter > 0) {
      this.collisionCounter--;
    }
  }

  get position1() {
    return this.pos1;
  }

  get position2() {
    return this.pos2;
  }

  get middle(): Point {
    let temp: Point = this.wobble_middle.clone();

    const angle = -this.line_rotation;
    const tx = temp.x;
    temp.x = temp.x * Math.cos(angle) - temp.y * Math.sin(angle);
    temp.y = tx * Math.sin(angle) + temp.y * Math.cos(angle);
    // x = (Type)x * (Type)cos(angle) - y * (Type)sin(angle);
    // y = (Type)tx * (Type)sin(angle) + y * (Type)cos(angle);

    temp = temp.add(this.pos_middle);
    return temp;
  }

  checkCollision(ball: Ball) {
    if (this.collisionCounter > 0) return;
    const dist = this.distanceFromLine(
      this.pos1,
      this.pos2,
      new Point(ball.x, ball.y),
    );
    // var col:Point = lineIntersectLine( pos1, pos2, new Point( ball.x, ball.y ), new Point( ball.exX, ball.exY ) );

    const max_distance =
      0.5 * Settings.EFFECT_BOUNCY_LINES_WIDTH +
      Settings.EFFECT_BOUNCY_LINES_DISTANCE_FROM_WALLS;
    // we collided
    if (dist <= max_distance) {
      // this wobble
      this.wobble(
        ball.x + Settings.EFFECT_BOUNCY_LINES_STRENGHT * ball.velocityX,
        ball.y + Settings.EFFECT_BOUNCY_LINES_STRENGHT * ball.velocityY,
      );

      this.collisionCounter = 2;
    }
  }

  closestPointOnLineSegment(a: Point, b: Point, p: Point): Point {
    const c = new Point(p.x - a.x, p.y - a.y);
    const v = new Point(b.x - a.x, b.y - a.y);
    const distance = v.magnitude();

    // optimized normalized
    // v = v.Normalise();
    if (distance != 0) {
      v.x /= distance;
      v.y /= distance;
    }

    const t = v.x * c.x + v.y * c.y;
    // float t = Dot( v, c );

    if (t < 0) return a.clone();

    if (t > distance) return b.clone();

    v.x *= t;
    v.y *= t;

    return a.add(v);
  }

  distanceFromLine(a: Point, b: Point, p: Point) {
    const delta = this.closestPointOnLineSegment(a, b, p);
    delta.x = delta.x - p.x;
    delta.y = delta.y - p.y;

    return delta.magnitude();
  }
}
