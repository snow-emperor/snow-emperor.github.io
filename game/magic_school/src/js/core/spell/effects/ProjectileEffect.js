
export class ProjectileEffect {
  constructor(game, spell, caster, damage, hasEffect = false, canCrit = false) {
    this.game = game;
    this.spell = spell;
    this.caster = caster;
    this.damage = damage;
    this.hasEffect = hasEffect;
    this.canCrit = canCrit;
  }

  execute() {
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.caster.model.quaternion);
    const geo = new THREE.SphereGeometry(0.2, 8, 8);
    const mat = new THREE.MeshBasicMaterial({
      color: this.color(),
      transparent: true,
      opacity: 0.8
    });
    const proj = new THREE.Mesh(geo, mat);
    proj.position.copy(this.caster.position).add(dir.clone().multiplyScalar(1));
    this.game.sceneManager.scene.add(proj);

    const particles = this.game.resourceManager.getResource('particles',this.spell.element).clone();
    particles.position.copy(proj.position);
    particles.scale.set(0.5, 0.5, 0.5);
    this.game.sceneManager.scene.add(particles);

    const speed = 10, maxDist = 20;
    const start = this.caster.position.clone();
    const update = () => {
      proj.position.add(dir.clone().multiplyScalar(speed * 0.016));
      if (particles) particles.position.copy(proj.position);

      const ray = new THREE.Raycaster(proj.position, dir, 0, speed * 0.016 * 2);
      const hits = ray.intersectObjects(
        this.game.sceneManager.scene.children.filter(o => o.userData?.isEnemy),
        true
      );
      if (hits.length > 0) {
        const enemy = hits[0].object.userData.controller;
        let dmg = this.damage;
        if (this.canCrit && Math.random() < 0.5) {
          dmg *= 1.5;
          this.critEffect(proj.position);
        }
        enemy.takeDamage(dmg);
        this.game.uiController.showDamageNumber(proj.position, dmg);
        if (this.hasEffect && this.spell.element === 'ice') {
          enemy.addStatusEffect('slow', 2, 0.2);
        }
        this.cleanup(proj, particles);
        return;
      }
      if (start.distanceTo(proj.position) > maxDist) {
        this.cleanup(proj, particles);
        return;
      }
      requestAnimationFrame(update);
    };
    update();
  }

  cleanup(proj, particles) {
    this.game.sceneManager.scene.remove(proj);
    if (particles) this.game.sceneManager.scene.remove(particles);
  }

  color() {
    const el = this.spell.element;
    return el === 'fire' ? 0xff4422 : el === 'ice' ? 0x4488ff : el === 'thunder' ? 0x9944ff : 0x44ff44;
  }

  critEffect(pos) {
    const geo = new THREE.RingGeometry(0.2, 1.6, 16);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.7 });
    const ring = new THREE.Mesh(geo, mat);
    ring.position.copy(pos).add(new THREE.Vector3(0, 1, 0));
    this.game.sceneManager.scene.add(ring);
    let scale = 0.1, iv = setInterval(() => {
      scale += 0.2;
      ring.scale.set(scale, scale, scale);
      mat.opacity -= 0.1;
      if (mat.opacity <= 0) {
        clearInterval(iv);
        this.game.sceneManager.scene.remove(ring);
      }
    }, 50);
  }
}