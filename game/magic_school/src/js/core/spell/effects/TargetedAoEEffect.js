
export class TargetedAoEEffect {
  constructor(game, spell, caster, damage) {
    this.game = game;
    this.spell = spell;
    this.caster = caster;
    this.damage = damage;
  }

  execute() {
    const mouse = new THREE.Vector2(
      (this.game.playerController.mouse.x * window.innerWidth) / 2,
      (this.game.playerController.mouse.y * window.innerHeight) / 2
    );
    const ray = new THREE.Raycaster();
    ray.setFromCamera(mouse, this.game.camera);
    const ground = this.game.sceneManager.scene.children.filter(o => o.userData?.isGround);
    const hits = ray.intersectObjects(ground, true);
    if (hits.length === 0) return;

    const targetPos = hits[0].point;

    // 指示器
    const indicGeo = new THREE.RingGeometry(this.spell.radius || 3, 32);
    const indicMat = new THREE.MeshBasicMaterial({
      color: this.color(),
      transparent: true,
      opacity: 0.7
    });
    const indic = new THREE.Mesh(indicGeo, indicMat);
    indic.position.copy(targetPos);
    indic.position.y = 0.1;
    indic.rotation.x = Math.PI / 2;
    this.game.sceneManager.scene.add(indic);

    // 陨石
    const metGeo = new THREE.SphereGeometry(1, 16, 16);
    const metMat = new THREE.MeshPhongMaterial({
      color: this.color(),
      emissive: this.emissive(),
      emissiveIntensity: 0.5
    });
    const met = new THREE.Mesh(metGeo, metMat);
    met.position.set(targetPos.x, 10, targetPos.z);
    met.castShadow = true;
    this.game.sceneManager.scene.add(met);

    const particles = this.game.resourceManager.getResource('particles',this.spell.element).clone();
    particles.position.copy(targetPos);
    particles.scale.set(0.5, 0.5, 0.5);
    this.game.sceneManager.scene.add(particles);

    const update = () => {
      met.position.y -= 5 * 0.016;
      met.rotation.x += 0.032;
      met.rotation.z += 0.016;
      if (indic) {
        indic.material.opacity -= 0.02;
        if (indic.material.opacity <= 0) {
          this.game.sceneManager.scene.remove(indic);
          indic = null;
        }
      }
      if (met.position.y <= targetPos.y + 0.5) {
        if (indic) this.game.sceneManager.scene.remove(indic);
        this.explode(targetPos);
        this.damageEnemies(targetPos);
        setTimeout(() => this.game.sceneManager.scene.remove(met), 1000);
        this.cleanup(met, particles);
        return;
      }
      requestAnimationFrame(update);
    };
    let indic_ = indic;
    update();
  }

  explode(pos) {
    const rad = this.spell.radius || 3;
    const geo = new THREE.SphereGeometry(rad, 16, 16);
    const mat = new THREE.MeshBasicMaterial({
      color: this.spell.element === 'fire' ? 0xff8822 : 0x8888ff,
      transparent: true,
      opacity: 0.8
    });
    const exp = new THREE.Mesh(geo, mat);
    exp.position.copy(pos);
    exp.position.y = 0.5;
    this.game.sceneManager.scene.add(exp);

    let scale = 0.1;
    const iv = setInterval(() => {
      scale += 0.3;
      exp.scale.set(scale, scale, scale);
      mat.opacity -= 0.1;
      if (mat.opacity <= 0) {
        clearInterval(iv);
        this.game.sceneManager.scene.remove(exp);
      }
    }, 50);
  }

  damageEnemies(center) {
    const rad = this.spell.radius || 3;
    const enemies = this.game.sceneManager.currentScene.enemies.filter(e => !e.isDead);
    for (const e of enemies) {
      if (center.distanceTo(e.position) <= rad) {
        e.takeDamage(this.damage);
        this.game.uiController.showDamageNumber(e.position, this.damage);
      }
    }
  }

  color() {
    const el = this.spell.element;
    return el === 'fire' ? 0xff4422 : 0x9944ff;
  }
  emissive() {
    return this.spell.element === 'fire' ? 0xff2200 : 0x4400ff;
  }

  cleanup(met, particles) {
    this.game.sceneManager.scene.remove(met);
    if (particles) this.game.sceneManager.scene.remove(particles);
  }
}