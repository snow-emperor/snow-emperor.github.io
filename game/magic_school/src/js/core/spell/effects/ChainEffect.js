export class ChainEffect {
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

    const primary = hits[0].object.userData.controller;
    const maxChain = this.spell.chainCount || 3;
    const enemies = this.game.sceneManager.currentScene.enemies
      .filter(e => !e.isDead && e !== primary)
      .sort((a, b) => primary.position.distanceTo(a) - primary.position.distanceTo(b))
      .slice(0, maxChain - 1);
    const targets = [primary, ...enemies];

    const lines = [];
    const particleGroups = [];

    for (let i = 0; i < targets.length; i++) {
      const pts = [];
      if (i === 0) pts.push(this.caster.position.clone(), targets[i].position.clone());
      else pts.push(targets[i - 1].position.clone(), targets[i].position.clone());
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: this.spell.element === 'thunder' ? 0x9944ff : 0x4488ff,
        linewidth: 2,
        transparent: true,
        opacity: 0.8
      });
      const line = new THREE.Line(geo, mat);
      this.game.sceneManager.scene.add(line);
      lines.push(line);

      const p = this.game.resourceManager.getResource('particles',this.spell.element).clone();
      p.position.copy(targets[i].position);
      p.scale.set(0.5, 0.5, 0.5);
      this.game.sceneManager.scene.add(p);
      particleGroups.push(p);
    }

    this.applyDamage(targets);

    const update = () => {
      let done = true;
      lines.forEach(l => {
        l.material.opacity -= 0.05;
        if (l.material.opacity <= 0) {
          this.game.sceneManager.scene.remove(l);
        } else done = false;
      });
      particleGroups.forEach(g => {
        g.material.opacity -= 0.05;
        if (g.material.opacity <= 0) {
          this.game.sceneManager.scene.remove(g);
        } else done = false;
      });
      if (!done) requestAnimationFrame(update);
    };
    update();
  }

  applyDamage(targets) {
    const reduction = this.spell.damageReduction || 0.2;
    targets.forEach((t, i) => {
      let dmg = this.damage;
      if (i > 0) dmg *= (1 - reduction * i);
      t.takeDamage(dmg);
      this.game.uiController.showDamageNumber(t.position, dmg);
    });
  }
}