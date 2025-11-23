
export class LineEffect {
  constructor(game, spell, caster, damage, hasEffect = false) {
    this.game = game;
    this.spell = spell;
    this.caster = caster;
    this.damage = damage;
    this.hasEffect = hasEffect;
  }

  execute() {
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.caster.model.quaternion);
    const len = this.spell.length || 10;
    const wid = this.spell.width || 2;
    const geo = new THREE.BoxGeometry(wid, 1, len);
    const mat = new THREE.MeshBasicMaterial({
      color: this.color(),
      transparent: true,
      opacity: 0.7
    });
    const box = new THREE.Mesh(geo, mat);
    box.position.copy(this.caster.position).add(dir.clone().multiplyScalar(len / 2));
    box.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    this.game.sceneManager.scene.add(box);

    const particles = this.game.resourceManager.getResource('particles',this.spell.element).clone();
    particles.position.copy(this.caster.position);
    particles.scale.set(wid, 1, len);
    this.game.sceneManager.scene.add(particles);

    const enemiesHit = new Set();

    const update = () => {
      mat.opacity -= 0.05;
      if (mat.opacity <= 0) {
        this.cleanup(box, particles);
        return;
      }
      this.checkEnemies(dir, len, wid, enemiesHit);
      requestAnimationFrame(update);
    };
    update();
  }

  checkEnemies(dir, len, wid, enemiesHit) {
    const enemies = this.game.sceneManager.currentScene.enemies.filter(e => !e.isDead);
    for (const e of enemies) {
      const to = new THREE.Vector3().subVectors(e.position, this.caster.position);
      const proj = to.dot(dir);
      if (proj > 0 && proj < len) {
        const dist = Math.sqrt(to.lengthSq() - proj * proj);
        if (dist <= wid / 2) {
          if (!enemiesHit.has(e)) {
            enemiesHit.add(e);
            e.takeDamage(this.damage);
            this.game.uiController.showDamageNumber(e.position, this.damage);
            if (this.hasEffect) this.applyEffect(e);
          }
        }
      }
    }
  }

  applyEffect(enemy) {
    if (this.spell.element === 'ice' && Math.random() < 0.3) {
      enemy.addStatusEffect('freeze', 1.5);
    } else if (this.spell.element === 'thunder' && Math.random() < 0.4) {
      enemy.addStatusEffect('paralysis', 1);
    }
  }

  color() {
    const el = this.spell.element;
    return el === 'fire' ? 0xff4422 : el === 'ice' ? 0x4488ff : el === 'thunder' ? 0x9944ff : 0x44ff44;
  }

  cleanup(box, particles) {
    this.game.sceneManager.scene.remove(box);
    if (particles) this.game.sceneManager.scene.remove(particles);
  }
}