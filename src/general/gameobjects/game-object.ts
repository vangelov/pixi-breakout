import { Container } from "pixi.js";
import { GameObjectEvent } from "../events/game-object-event";
import { GameObjectCollection } from "../collections/game-object-collection";

export class GameObject extends Container {
  velocityX = 0;
  velocityY = 0;

  protected _flagged_for_removal = false;
  protected _auto_remove = true;

  update(timeDelta = 1) {
    this.x += this.velocityX * timeDelta;
    this.y += this.velocityY * timeDelta;
  }

  get flaggedForRemoval() {
    return this._flagged_for_removal;
  }

  remove() {
    this._flagged_for_removal = true;
    this.emit(GameObjectEvent.REMOVE, new GameObjectEvent(this, null));
    if (this._auto_remove) this.handleRemoveComplete();
  }

  protected handleRemoveComplete() {
    if (this.parent) this.parent.removeChild(this);
  }

  handleDetach(collection: GameObjectCollection): void {
    this.emit(GameObjectEvent.DETACH, new GameObjectEvent(this, collection));
  }

  getDistance(other: GameObject) {
    return Math.sqrt(
      (this.x - other.x) * (this.x - other.x) +
        (this.y - other.y) * (this.y - other.y),
    );
  }

  get velocity() {
    return Math.sqrt(
      this.velocityX * this.velocityX + this.velocityY * this.velocityY,
    );
  }

  set velocity(value: number) {
    const ratio = value / this.velocity;
    this.velocityX = this.velocityX * ratio;
    this.velocityY = this.velocityY * ratio;
  }
}
