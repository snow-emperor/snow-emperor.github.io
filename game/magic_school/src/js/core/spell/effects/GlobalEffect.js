


export class GlobalEffect {
  constructor(game, spell, caster, damage, extra = false) {
    this.game = game;
    this.spell = spell;
    this.caster = caster;
    this.damage = damage;
    this.extra = extra;
  }

  execute() {
    const geo = new THREE.PlaneGeometry(100, 100);
    const mat = new THREE.MeshBasicMaterial({
      color: this.color(),
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const screen = new THREE.Mesh(geo, mat);
    screen.position.copy(this.caster.position);
    screen.position.y = 5;
    screen.rotation.x = Math.PI / 2;
    this.game.sceneManager.scene.add(screen);

    const particles = this.game.resourceManager.getResource('particles',this.spell.element).clone();
    particles.position.copy(this.caster.position);
    particles.scale.set(20, 20, 1);
    this.game.sceneManager.scene.add(particles);

    const update = () => {
      mat.opacity -= 0.02;
      if (mat.opacity <= 0) {
        this.cleanup(screen, particles);
        return;
      }
      this.damageAll();
      requestAnimationFrame(update);
    };
    update();
  }

  damageAll() {
    const enemies = this.game.sceneManager.currentScene.enemies.filter(e => !e.isDead);
    for (const e of enemies) {
      e.takeDamage(this.damage);
      this.game.uiController.showDamageNumber(e.position, this.damage);
      if (this.spell.element === 'thunder' && Math.random() < 0.4) {
        e.addStatusEffect('paralysis', 1);
      }
    }
  }

  color() {
    const el = this.spell.element;
    return el === 'fire' ? 0xff4422 : el === 'ice' ? 0x4488ff : el === 'thunder' ? 0x9944ff : 0x44ff44;
  }

  cleanup(screen, particles) {
    this.game.sceneManager.scene.remove(screen);
    if (particles) this.game.sceneManager.scene.remove(particles);
  }
}