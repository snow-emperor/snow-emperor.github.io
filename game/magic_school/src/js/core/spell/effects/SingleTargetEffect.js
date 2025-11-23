
export class SingleTargetEffect {
  constructor(game, spell, caster, damage, hasEffect = false) {
    this.game = game;
    this.spell = spell;
    this.caster = caster;
    this.damage = damage;
    this.hasEffect = hasEffect;
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

    const points = [this.caster.position.clone(), target.position.clone()];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: this.color(),
      linewidth: 3,
      transparent: true,
      opacity: 0.8
    });
    const line = new THREE.Line(geo, mat);
    this.game.sceneManager.scene.add(line);

    const particles = this.game.resourceManager.getResource('particles',this.spell.element).clone();
    particles.position.copy(target.position);
    particles.scale.set(0.5, 0.5, 0.5);
    this.game.sceneManager.scene.add(particles);

    const update = () => {
      mat.opacity -= 0.05;
      if (mat.opacity <= 0) {
        this.cleanup(line, particles);
        return;
      }
      if (this.hasEffect) this.applyEffect(target);
      requestAnimationFrame(update);
    };
    update();

    target.takeDamage(this.damage);
    this.game.uiController.showDamageNumber(target.position, this.damage);
  }

  applyEffect(target) {
    if (this.spell.element === 'ice') {
      target.addStatusEffect('freeze', this.spell.freezeDuration || 2);
    }
  }

  color() {
    const el = this.spell.element;
    return el === 'fire' ? 0xff4422 : el === 'ice' ? 0x4488ff : el === 'thunder' ? 0x9944ff : 0x44ff44;
  }

  cleanup(line, particles) {
    this.game.sceneManager.scene.remove(line);
    if (particles) this.game.sceneManager.scene.remove(particles);
  }
}