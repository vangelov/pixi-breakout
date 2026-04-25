import { Point, Sprite } from "pixi.js";
import { GameObject } from "../gameobjects/game-object";
import { GameObjectEvent } from "../events/game-object-event";

export class GameObjectCollection extends Sprite {
  protected _collection: Array<GameObject>;

  constructor() {
    super();
    this._collection = new Array<GameObject>();
    this.on(GameObjectEvent.REMOVE, this.handleRemove);
  }

  handleRemove = (e: GameObjectEvent) => {
    this.remove(e.target, false);
  };

  getClosest(
    x: number,
    y: number,
    maxDistance = Number.MAX_VALUE,
    classFilter: (new () => GameObject) | null = null,
    filterObject: GameObject | null = null,
  ) {
    let dist = 0.0;
    let minDist = maxDistance;
    if (minDist != Number.MAX_VALUE) minDist *= minDist;
    let minObj: GameObject | null = null;

    for (const go of this._collection) {
      if ((!classFilter || go instanceof classFilter) && go !== filterObject) {
        dist = (go.x - x) * (go.x - x) + (go.y - y) * (go.y - y);
        if (dist < minDist) {
          minDist = dist;
          minObj = go;
        }
      }
    }

    return minObj;
  }

  add(go: GameObject) {
    this._collection.push(go);
    this.addChild(go);
    return go;
  }

  addAt(go: GameObject, index: number) {
    this._collection.splice(index - 1, 0, go);
    this.addChild(go);
    return go;
  }

  removeAtIndex(pos: number, doRemove: boolean) {
    const go: GameObject = this._collection[pos];
    this._collection.splice(pos, 1);
    go.handleDetach(this);
    //removeChild(go);
    if (doRemove) go.remove();
    return go;
  }

  remove(go: GameObject, doRemove: boolean) {
    const i = this._collection.indexOf(go);

    if (this._collection[i] && this._collection[i] == go) {
      this._collection.splice(i, 1);
      go.handleDetach(this);

      if (doRemove) go.remove();
      return go;
    }

    return null;
  }

  getIndex(go: GameObject) {
    for (let i = this._collection.length - 1; i >= 0; --i) {
      if (this._collection[i] && this._collection[i] === go) return i;
    }
    return -1;
  }

  getRandom() {
    if (this._collection.length == 0) return null;
    let go: GameObject | null = null;
    let tries = 0;
    while (!go && tries < 10) {
      go =
        this._collection[Math.trunc(Math.random() * this._collection.length)];
      tries++;
    }
    return go;
  }

  checkCollision(
    x: number,
    y: number,
    classFilter: (new () => GameObject) | null = null,
    filterObject: GameObject | null = null,
  ) {
    const hitGo = this.getClosest(
      x,
      y,
      Number.MAX_VALUE,
      classFilter,
      filterObject,
    );
    const local = hitGo && hitGo.toLocal(new Point(x, y));

    if (
      hitGo &&
      !hitGo.flaggedForRemoval &&
      local &&
      hitGo.containsPoint(local)
    )
      return hitGo;

    return null;
  }

  hasItemOfClass(findClass: new () => GameObject) {
    return this._collection.some((go) => go instanceof findClass);
  }

  update(timeDelta = 1) {
    for (let i = this._collection.length - 1; i >= 0; --i) {
      this._collection[i].update(timeDelta);
    }
  }

  clear() {
    for (let i = this._collection.length - 1; i >= 0; --i) {
      this._collection[i].remove();
    }
    this._collection.length = 0;
  }

  get head() {
    if (this._collection.length) return this._collection[0];
    return null;
  }

  get tail() {
    if (this._collection.length)
      return this._collection[this._collection.length - 1];
    return null;
  }

  get collection() {
    return this._collection;
  }

  get size() {
    return this._collection;
  }
}
