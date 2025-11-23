
export class SummonEffect {
  constructor(game, spell, caster, damage) {
    this.game = game;
    this.spell = spell;
    this.caster = caster;
    this.damage = damage;
  }

  execute() {
    const count = this.spell.plantCount || 3;
    const summons = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const dist = 2 + Math.random() * 2;
      const x = this.caster.position.x + Math.cos(angle) * dist;
      const z = this.caster.position.z + Math.sin(angle) * dist;

      const geo = new THREE.ConeGeometry(0.5, 1, 4);
      const mat = new THREE.MeshPhongMaterial({
        color: 0x44ff44,
        emissive: 0x228822,
        emissiveIntensity: 0.3
      });
      const plant = new THREE.Mesh(geo, mat);
      plant.position.set(x, 0.5, z);
      plant.castShadow = true;
      this.game.sceneManager.scene.add(plant);

      const summon = {
        model: plant,
        target: null,
        range: 3,
        damage: this.damage,
        cooldown: 1000,
        last: 0,
        life: (this.spell.duration || 6) * 1000,
        start: Date.now(),
        update: () => {
          const age = Date.now() - summon.start;
          if (age >= summon.life) {
            this.game.sceneManager.scene.remove(plant);
            return;
          }
          const enemies = this.game.sceneManager.currentScene.enemies.filter(e => !e.isDead);
          if (!summon.target || summon.target.isDead) {
            let near = null, d = Infinity;
            for (const e of enemies) {
              const dist = plant.position.distanceTo(e.position);
              if (dist < d) { d = dist; near = e; }
            }
            summon.target = near;
          }
          if (summon.target && plant.position.distanceTo(summon.target.position) <= summon.range) {
            const now = Date.now();
            if (now - summon.last > summon.cooldown) {
              summon.last = now;
              summon.target.takeDamage(summon.damage);
              this.game.uiController.showDamageNumber(summon.target.position, summon.damage);
            }
          }
        }
      };
      summons.push(summon);
    }

    const particles = this.game.resourceManager.getResource('particles',this.spell.element).clone();
    particles.position.copy(this.caster.position);
    particles.scale.set(3, 3, 3);
    this.game.sceneManager.scene.add(particles);

    const start = Date.now();
    const update = () => {
      const age = Date.now() - start;
      if (age >= (this.spell.duration || 6) * 1000) {
        this.game.sceneManager.scene.remove(particles);
        summons.forEach(s => this.game.sceneManager.scene.remove(s.model));
        return;
      }
      summons.forEach(s => s.update());
      requestAnimationFrame(update);
    };
    update();
  }
}