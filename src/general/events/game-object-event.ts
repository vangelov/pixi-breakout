import { GameObjectCollection } from "../collections/game-object-collection";
import { GameObject } from "../gameobjects/game-object";
import { Event } from "./event";

export class GameObjectEvent extends Event<GameObject> {
  static REMOVE = "gameobjectevent_remove";
  static DETACH = "gameobjectevent_detach";

  private _collection: GameObjectCollection | null;
  private _game_object: GameObject;

  constructor(gameObject: GameObject, collection: GameObjectCollection | null) {
    super(gameObject);
    this._game_object = gameObject;
    this._collection = collection;
  }

  clone() {
    return new GameObjectEvent(this.gameObject, this.collection);
  }

  get gameObject() {
    return this._game_object;
  }

  get collection() {
    return this._collection;
  }
}
