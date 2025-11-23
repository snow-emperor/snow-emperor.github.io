

export class BuffEffect {
  constructor(game, spell, caster) {
    this.game = game;
    this.spell = spell;
    this.caster = caster;
  }

  execute() {
    const geo = new THREE.RingGeometry(2, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: this.spell.element === 'nature' ? 0x44ff44 : 0x4488ff,
      transparent: true,
      opacity: 0.5
    });
    const buff = new THREE.Mesh(geo, mat);
    buff.position.copy(this.caster.position);
    buff.position.y = 1;
    buff.rotation.x = Math.PI / 2;
    this.game.sceneManager.scene.add(buff);

    const particles = this.game.resourceManager.getResource('particles',this.spell.element).clone();
    particles.position.copy(this.caster.position);
    particles.scale.set(2, 2, 2);
    this.game.sceneManager.scene.add(particles);

    const duration = (this.spell.duration || 8) * 1000;
    const start = Date.now();

    if (this.spell.element === 'nature') {
      this.caster.defense *= (1 + (this.spell.defenseBonus || 0.1));
    }

    const update = () => {
      const elapsed = Date.now() - start;
      if (elapsed >= duration) {
        this.cleanup(buff, particles);
        return;
      }
      if (this.spell.element === 'nature') {
        const heal = (this.spell.healPerSecond || 5) * 0.016;
        this.caster.heal(heal);
      }
      requestAnimationFrame(update);
    };
    update();
  }

  cleanup(buff, particles) {
    this.game.sceneManager.scene.remove(buff);
    if (particles) this.game.sceneManager.scene.remove(particles);
  }
}