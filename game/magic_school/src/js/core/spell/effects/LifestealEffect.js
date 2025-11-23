export class LifestealEffect {
  constructor(game, spell, caster, damage) {
    this.game = game;
    this.spell = spell;
    this.caster = caster;
    this.damage = damage;
  }

  execute() {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(this.game.playerController.mouse, this.game.camera);
    const hits = ray.intersectObjects(
      this.game.sceneManager.scene.children.filter(o => o.userData?.isEnemy),
      true
    );
    if (hits.length === 0) return;

    const target = hits[0].object.userData.controller;

    const pts = [this.caster.position.clone(), target.position.clone()];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color: 0x44ff44,
      linewidth: 3,
      transparent: true,
      opacity: 0.8
    });
    const line = new THREE.Line(geo, mat);
    this.game.sceneManager.scene.add(line);

    const particles = this.game.resourceManager.getResource('particles','heal').clone();
    particles.position.copy(target.position);
    particles.scale.set(0.5, 0.5, 0.5);
    this.game.sceneManager.scene.add(particles);

    const ls = this.spell.lifestealPercent || 0.5;

    const update = () => {
      mat.opacity -= 0.05;
      if (mat.opacity <= 0) {
        this.cleanup(line, particles);
        return;
      }
      const heal = this.damage * ls * 0.016;
      this.caster.heal(heal);
      requestAnimationFrame(update);
    };
    update();

    target.takeDamage(this.damage);
    this.game.uiController.showDamageNumber(target.position, this.damage);
  }

  cleanup(line, particles) {
    this.game.sceneManager.scene.remove(line);
    if (particles) this.game.sceneManager.scene.remove(particles);
  }
}