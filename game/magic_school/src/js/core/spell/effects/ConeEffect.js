

export class ConeEffect {
  constructor(game, spell, caster, damage) {
    this.game = game;
    this.spell = spell;
    this.caster = caster;
    this.damage = damage;
  }

  execute() {
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.caster.model.quaternion);
    const geo = new THREE.ConeGeometry(5, 10, 8);
    const mat = new THREE.MeshBasicMaterial({
      color: this.color(),
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const cone = new THREE.Mesh(geo, mat);
    cone.position.copy(this.caster.position);
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    this.game.sceneManager.scene.add(cone);

    const particles = this.game.resourceManager.getResource('particles',this.spell.element).clone();
    particles.position.copy(this.caster.position);
    particles.scale.set(1.5, 3, 1.5);
    this.game.sceneManager.scene.add(particles);

    const enemiesHit = new Set();
    const duration = (this.spell.duration || 2) * 1000;
    const start = Date.now();

    const update = () => {
      const elapsed = Date.now() - start;
      if (elapsed >= duration) {
        this.cleanup(cone, particles);
        return;
      }
      this.checkEnemies(dir, enemiesHit);
      requestAnimationFrame(update);
    };
    update();
  }

  checkEnemies(dir, enemiesHit) {
    const enemies = this.game.sceneManager.currentScene.enemies.filter(e => !e.isDead);
    for (const e of enemies) {
      const to = new THREE.Vector3().subVectors(e.position, this.caster.position).normalize();
      const angle = to.angleTo(dir);
      if (angle < Math.PI / 6 && this.caster.position.distanceTo(e.position) <= 5) {
        if (!enemiesHit.has(e)) {
          enemiesHit.add(e);
          e.takeDamage(this.damage);
          this.game.uiController.showDamageNumber(e.position, this.damage);
        }
      }
    }
  }

  color() {
    const el = this.spell.element;
    return el === 'fire' ? 0xff4422 : el === 'ice' ? 0x4488ff : 0x44ff44;
  }

  cleanup(cone, particles) {
    this.game.sceneManager.scene.remove(cone);
    if (particles) this.game.sceneManager.scene.remove(particles);
  }
}