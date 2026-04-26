import { Point } from "pixi.js";
import { ParticlePool } from "./particle-pool";

export class ParticleSpawn {
  static burst(
    spawnX: number,
    spawnY: number,
    count: number,
    spread: number,
    baseAngle: number,
    speed: number,
    speedVariance: number,
    pool: ParticlePool,
  ) {
    let speedRnd = 0;
    const angleVector: Point = new Point();
    let spreadRnd = 0;

    for (let i = 0; i < count; i++) {
      const particle = pool.add();

      particle.x = spawnX;
      particle.y = spawnY;

      speedRnd = Math.random() * speedVariance - speedVariance / 2;
      spreadRnd = Math.random() * spread - spread / 2;

      angleVector.x =
        Math.sin(((-baseAngle + spreadRnd) / 180) * Math.PI) *
        speed *
        (1 + speedRnd);
      angleVector.y =
        Math.cos(((-baseAngle + spreadRnd) / 180) * Math.PI) *
        speed *
        (1 + speedRnd);

      particle.init(spawnX, spawnY, angleVector.x, angleVector.y);
    }
  }

  explode(
    spawnX: number,
    spawnY: number,
    count: number,
    distanceMultiplier: number,
    pool: ParticlePool,
    randomRange: number = 2,
    vector: Point | null = null,
    spawnAreaSize: number = 0,
  ) {
    if (vector == null) vector = new Point(0, 0);

    for (let i = 0; i < count; i++) {
      const particle = pool.add();
      particle.init(
        spawnX + (Math.random() - 0.5) * spawnAreaSize,
        spawnY + (Math.random() - 0.5) * spawnAreaSize,
        (vector.x + (Math.random() - 0.5) * randomRange) * distanceMultiplier,
        (vector.y + (Math.random() - 0.5) * randomRange) * distanceMultiplier,
      );
    }
  }

  explode2(
    position: Point,
    pool: ParticlePool,
    count: number,
    randomRange: Point | null = null,
    vector: Point | null = null,
    spawnAreaSize = 0,
    distanceMultiplier = 1,
  ) {
    if (randomRange == null) randomRange = new Point(0, 0);
    if (vector == null) vector = new Point(0, 0);
    for (let i = 0; i < count; i++) {
      const particle = pool.add();
      particle.init(
        position.x + (Math.random() - 0.5) * spawnAreaSize,
        position.y + (Math.random() - 0.5) * spawnAreaSize,
        (vector.x + (Math.random() - 0.5) * randomRange.x) * distanceMultiplier,
        (vector.y + (Math.random() - 0.5) * randomRange.y) * distanceMultiplier,
      );
    }
  }
}
