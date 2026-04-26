import { Mesh, MeshGeometry, Texture } from "pixi.js";
import { Settings } from "../settings";

export class Rainbow extends Mesh {
  private _segments: Array<Segment> = []; // holds the previous positions of the ball
  private _verts: Array<number> = []; // the vertices used for the draw call
  private _indices: Array<number> = []; // the indices that form triangles, also used in the draw call

  constructor() {
    super({
      geometry: new MeshGeometry({
        positions: new Float32Array([]),
        indices: new Uint32Array([]),
      }),

      texture: Texture.WHITE,
    });
  }

  addSegment(x: number, y: number) {
    let seg: Segment | null | undefined = null;

    // first, pop off any segments that exceed the maximum trail length
    while (this._segments.length > Settings.EFFECT_BALL_TRAIL_LENGTH)
      seg = this._segments.shift();

    // if no segments were popped off, create a new one
    if (!seg) seg = new Segment();

    // move the segment to the new position
    seg.x = x;
    seg.y = y;

    // and move it to the other end of the list
    this._segments.push(seg);

    // it's a good idea to reuse the segments to be easier on the garbage collection
    // creating and releasing a bunch of objects every frame can be expensive performance wise
  }

  redrawSegments(offsetX = 0, offsetY = 0) {
    if (!Settings.EFFECT_BALL_TRAIL) return;

    let s1: Segment | null = null; // current segment
    let s2: Segment | null = null; // previous segment
    let vertIndex = 0; // keeps track of which vertex index we're at
    let offset: number; // temporary storage for amount to extend line outwards, bigger value = wider trail
    let ang: number; // temporary storage of the inter-segment angles
    let sin = 0; // as above
    let cos = 0; // again, as above

    // first we make sure that the vertice list is the same length as we want
    // each segment (except the first) will create two vertices with two values (x/y) each
    if (this._verts.length != (this._segments.length - 1) * 4) {
      // if it's not the correct length we clear the entire list
      this._verts.length = 0;
    }

    // now, we loop over all the segments, the list has the "youngest" segment at the end
    // so the loop starts at the "ball" and moves away
    for (let j = 0; j < this._segments.length; ++j) {
      // store the active segment in a variable for convenience
      s1 = this._segments[j];

      // if there's a previous segment, it's time to do some math
      if (s2) {
        // we calculate the angle between the two segments
        // the result will be in radians, so adding half of pi will "turn" the angle 90 degrees
        // that means we can use the sin and cos values to "expand" the line outwards
        ang = Math.atan2(s1.y - s2.y, s1.x - s2.x) + Math.PI / 2;
        sin = Math.sin(ang);
        cos = Math.cos(ang);

        // now it's time to create the two vertices that will represent this pair of segments
        // using a loop here is probably a bit overkill since it's only two iterations

        for (let i = 0; i < 2; ++i) {
          // this makes the first segment stand out to the "left" of the line
          // and the second to the right, changing that magic number at the end will alter the line width
          offset = (-0.5 + i / 1) * 9.0;

          // if the trail scale effect is enabled, we scale down the offset as we move down the list
          if (Settings.EFFECT_BALL_TRAIL_SCALE) {
            offset *= j / this._segments.length;
          }

          // finally we put two values in the vert list
          // using the segment coordinates as a base we add the "extended" point
          // offsetX and offsetY are used here to move the entire trail
          this._verts[vertIndex++] = s1.x + cos * offset - offsetX;
          this._verts[vertIndex++] = s1.y + sin * offset - offsetY;
        }
      }

      // finally, store the current segment as the previous segment and go for another round
      s2 = s1;
    }

    // we need at least four vertices (eight values) to draw something
    if (this._verts.length >= 8) {
      // now, we have a triangle "strip", but flash can't draw that without
      // instructions for which vertices to connect, so it's time to make those

      // here, we loop over all the vertices and pair them together in triangles
      // each group of four vertices forms two triangles

      for (let k = 0; k < this._verts.length / 4 - 1; k++) {
        this._indices[k * 6 + 0] = k * 2 + 0;
        this._indices[k * 6 + 1] = k * 2 + 1;
        this._indices[k * 6 + 2] = k * 2 + 2;

        this._indices[k * 6 + 3] = k * 2 + 1;
        this._indices[k * 6 + 4] = k * 2 + 2;
        this._indices[k * 6 + 5] = k * 2 + 3;
      }

      // and, finally, it's time to draw the entire thing

      this.geometry = new MeshGeometry({
        positions: new Float32Array(this._verts),
        uvs: new Float32Array(this._verts.length),
        indices: new Uint32Array(this._indices),
      });
      this.tint = Settings.COLOR_TRAIL;
    }
  }

  // convenience functions to get the first and last segments of the rainbow

  get head() {
    return this._segments.length
      ? this._segments[Math.trunc(this._segments.length - 1)]
      : null;
  }

  get tail() {
    return this._segments.length ? this._segments[0] : null;
  }
}

// this is an internal class used to store the segment positions,
// it's no different from a regular class except it's _only_ visible to the Rainbow class
class Segment {
  x = 0.0;
  y = 0.0;
}
