
export class BarrierEffect {
  constructor(game, spell, caster, damage) {
    this.game = game;
    this.spell = spell;
    this.caster = caster;
    this.damage = damage;
  }

  execute() {
    const radius = this.spell.radius || 4;
    const geo = new THREE.RingGeometry(radius, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: this.color(),
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const bar = new THREE.Mesh(geo, mat);
    bar.position.copy(this.caster.position);
    bar.position.y = 1;
    bar.rotation.x = Math.PI / 2;
    this.game.sceneManager.scene.add(bar);

    const particles = this.game.resourceManager.getResource('particles',this.spell.element).clone();
    particles.position.copy(this.caster.position);
    particles.scale.set(radius, radius, radius);
    this.game.sceneManager.scene.add(particles);

    const enemiesIn = new Set();
    const duration = (this.spell.duration || 5) * 1000;
    const start = Date.now();

    const update = () => {
      const elapsed = Date.now() - start;
      if (elapsed >= duration) {
        this.cleanup(bar, particles);
        return;
      }
      this.checkEnemies(radius, enemiesIn);
      requestAnimationFrame(update);
    };
    update();
  }

  checkEnemies(radius, enemiesIn) {
    const enemies = this.game.sceneManager.currentScene.enemies.filter(e => !e.isDead);
    for (const e of enemies) {
      if (this.caster.position.distanceTo(e.position) <= radius) {
        if (!enemiesIn.has(e)) {
          enemiesIn.add(e);
          e.takeDamage(this.damage);
          this.game.uiController.showDamageNumber(e.position, this.damage);
        }
      }
    }
  }

  color() {
    const el = this.spell.element;
    return el === 'fire' ? 0xff4422 : el === 'ice' ? 0x4488ff : el === 'thunder' ? 0x9944ff : 0x44ff44;
  }

  cleanup(bar, particles) {
    this.game.sceneManager.scene.remove(bar);
    if (particles) this.game.sceneManager.scene.remove(particles);
  }
}