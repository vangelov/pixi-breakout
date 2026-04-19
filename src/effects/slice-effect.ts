import {
  Container,
  Graphics,
  Matrix,
  Point,
  Renderer,
  RenderTexture,
  Texture,
} from "pixi.js";
import { Settings } from "../settings";
import "pixi.js/math-extras";

export class SliceEffect extends Container {
  private _slices: Array<LineSliceObject>;
  private _container: Container;

  constructor(renderer: Renderer, source: Container) {
    super();

    const globalBounds = source.getBounds();
    const localBounds = source.getLocalBounds();

    const rt = RenderTexture.create({
      width: Math.ceil(globalBounds.width),
      height: Math.ceil(globalBounds.height),
    });

    const t = new Matrix();
    t.translate(-localBounds.minX, -localBounds.minY);
    t.rotate(source.rotation);
    t.scale(source.scale.x, source.scale.y);

    renderer.render({
      container: source,
      target: rt,
      transform: t,
      clear: true,
    });

    this._container = new Container();
    this.addChild(this._container);

    this._slices = [];

    this._container.on("childAdded", this.handleAdded);
    this._container.on("childRemoved", this.handleRemoved);

    this.position.set(source.x, source.y);

    const points = [
      new Point(0, 0),
      new Point(rt.width, 0),
      new Point(rt.width, rt.height),
      new Point(0, rt.height),
    ];

    const offset = new Point(
      localBounds.minX * source.scale.x,
      localBounds.minY * source.scale.y,
    );
    for (let i = 0; i < points.length; i++) {
      points[i] = points[i].add(offset);
    }

    const lso = new LineSliceObject(points, rt);
    this._container.addChild(lso);
  }

  update(timeDelta: number) {
    for (const slice of this._slices) {
      slice.x += slice.velocity.x * timeDelta;
      slice.y += slice.velocity.y * timeDelta;
      slice.rotation += slice.velocityR * timeDelta;

      slice.velocity.x -= slice.velocity.x * 0.01 * timeDelta;
      slice.velocity.y -= slice.velocity.y * 0.01 * timeDelta;
      slice.velocityR -= slice.velocityR * 0.01 * timeDelta;
    }
  }

  slice(p1: Point, p2: Point) {
    const toSlice = this._slices.concat();

    for (const slice of toSlice) {
      slice.slice(p1, p2);
    }
  }

  handleAdded = (child: unknown) => {
    if (!(child instanceof LineSliceObject)) return;
    this._slices.push(child);
  };

  handleRemoved = (child: unknown) => {
    if (!(child instanceof LineSliceObject)) return;
    this._slices.splice(this._slices.indexOf(child), 1);
  };

  get slices() {
    return this._slices;
  }
}

class LineSliceObject extends Graphics {
  private _points: Array<Point>;
  private _length: number = 0;
  private _texture: Texture;

  public velocity: Point = new Point();
  public velocityR = 0;

  constructor(points: Array<Point>, texture: Texture) {
    super();

    this._texture = texture;
    this._points = points;
    this.velocity = new Point();
    this.render();
  }

  render() {
    this.clear();
    this.moveTo(this._points[0].x, this._points[0].y);
    this._length = this._points.length;
    for (let i = 1; i < this._length; i++) {
      this.lineTo(this._points[i].x, this._points[i].y);
    }
    this.closePath();
    this.fill({ texture: this._texture });
  }

  slice(point1: Point, point2: Point) {
    if (!this.parent) return;

    const _pt1 = this.toLocal(point1, this.parent);
    const _pt2 = this.toLocal(point2, this.parent);
    const newPoints: Array<Array<Point>> = [[], []];
    let _numCross = 0;

    for (let i = 0; i < this._length; i++) {
      const _pt3 = this._points[i];
      const _pt4 =
        this._points.length > i + 1 ? this._points[i + 1] : this._points[0];
      const _crossPt = this.crossPoint(_pt1, _pt2, _pt3, _pt4);

      newPoints[0].push(_pt3);
      if (_crossPt) {
        newPoints[0].push(_crossPt);
        newPoints[1].push(_crossPt);
        newPoints.reverse();
        _numCross++;
      }
    }

    if (_numCross == 2) {
      const slice1 = new LineSliceObject(newPoints[0], this._texture);
      const slice2 = new LineSliceObject(newPoints[1], this._texture);
      slice1.x = slice2.x = this.x;
      slice1.y = slice2.y = this.y;
      slice1.rotation = slice2.rotation = this.rotation;

      this.parent.addChild(slice1);
      this.parent.addChild(slice2);
      this.parent.removeChild(this);

      const vector = _pt2.subtract(_pt1);
      const angle = Math.atan2(vector.y, vector.x);
      const force = Settings.EFFECT_BLOCK_SHATTER_FORCE;
      const fx = Math.abs(Math.sin(angle));
      const fy = Math.abs(Math.cos(angle));
      const fx1 = newPoints[0][0].x < newPoints[1][0].x ? -fx : fx;
      const fx2 = newPoints[1][0].x < newPoints[0][0].x ? -fx : fx;
      const fy1 = newPoints[0][0].y < newPoints[1][0].y ? -fy : fy;
      const fy2 = newPoints[1][0].y < newPoints[0][0].y ? -fy : fy;

      slice1.velocity = this.velocity.clone();
      slice2.velocity = this.velocity.clone();

      slice1.velocityR =
        this.velocityR +
        Math.random() * Settings.EFFECT_BLOCK_SHATTER_ROTATION -
        Settings.EFFECT_BLOCK_SHATTER_ROTATION / 2;
      slice2.velocityR =
        this.velocityR +
        Math.random() * Settings.EFFECT_BLOCK_SHATTER_ROTATION -
        Settings.EFFECT_BLOCK_SHATTER_ROTATION / 2;

      slice1.velocity.x += fx1 * force;
      slice1.velocity.y += fy1 * force;

      slice2.velocity.x += fx2 * force;
      slice2.velocity.y += fy2 * force;
    }
  }

  crossPoint(pt1: Point, pt2: Point, pt3: Point, pt4: Point) {
    const _vector1: Point = pt2.subtract(pt1);
    const _vector2: Point = pt4.subtract(pt3);

    if (this.cross(_vector1, _vector2) == 0.0) return null;

    const _s =
      this.cross(_vector2, pt3.subtract(pt1)) / this.cross(_vector2, _vector1);
    const _t =
      this.cross(_vector1, pt1.subtract(pt3)) / this.cross(_vector1, _vector2);

    if (LineSliceObject.isCross(_s) && LineSliceObject.isCross(_t)) {
      _vector1.x *= _s;
      _vector1.y *= _s;
      return pt1.add(_vector1);
    } else return null;
  }

  cross(vector1: Point, vector2: Point) {
    return vector1.x * vector2.y - vector1.y * vector2.x;
  }

  static isCross(n: number) {
    return 0 <= n && n <= 1;
  }
}
