import { Container } from "pixi.js";

	/**
	 * ...
	 * @author Martin Jonasson
	 */
	export class ParticlePool extends Container {

		private  _particleclass	:Class;
		private  _pool			:ObjectPool;

		public function ParticlePool(particleClass:Class, size:int = 20) {
			_particleclass = particleClass;
			_pool = new ObjectPool(true);
			_pool.allocate(_particleclass, size);
			_pool.initialize("reset", []);

			addEventListener(ParticleEvent.DIE, handleParticleDeath, true);
		}

		public function clear():void {
			while (numChildren) {
				var p:Particle = Particle(getChildAt(0));
				removeChild(p);
				_pool.object = p;
			}
		}

		private function handleParticleDeath(e:ParticleEvent):void {
			var p:Particle = Particle(e.target);
			removeChild(p);
			_pool.object = p;
		}

		public function add():Particle {
			var p:Particle = _pool.object;
			addChild(p);
			return p;
		}

	}

