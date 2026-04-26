import { Sprite } from "pixi.js";
import { ObjectPool } from "../object-pool";
import { ParticleEvent } from "./events/particle-event";
import { Particle } from "./particle";

export class ParticlePool extends Sprite {
  private _particleclass: new () => Particle;
  private _pool: ObjectPool;

  constructor(particleClass: new () => Particle, size = 20) {
    super();
    this._particleclass = particleClass;
    this._pool = new ObjectPool(true);
    this._pool.allocate(this._particleclass, size);
    this._pool.initialize("reset", []);

    this.on(ParticleEvent.DIE, this.handleParticleDeath);
  }

  clear() {
    while (this.children.length) {
      const p = this.getChildAt(0);
      this.removeChild(p);
      this._pool.object = p;
    }
  }

  handleParticleDeath = (e: ParticleEvent) => {
    const p = e.target;
    this.removeChild(p);
    this._pool.object = p;
  };

  add() {
    const p = this._pool.object as Particle;
    this.addChild(p);
    return p;
  }
}
