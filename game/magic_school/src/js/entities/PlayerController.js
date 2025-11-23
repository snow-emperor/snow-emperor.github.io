/**
 * 玩家控制器
 * 负责处理玩家移动、动画、属性和交互
 */
import * as THREE from 'three';
export class PlayerController {
    constructor(game) {
        this.game = game;

        // 玩家模型
        this.model = null;
        this.mixer = null;
        this.animations = {};

        // 玩家位置和旋转
        this.position = new THREE.Vector3();
        this.rotation = new THREE.Euler();

        // 玩家移动
        this.velocity = new THREE.Vector3();
        this.moveSpeed = 2.0; // 基础移动速度 (m/s)
        this.jumpSpeed = 5.0;
        this.isGrounded = false;
        this.canJump = true;
        this.jumpCooldown = 1000; // 跳跃冷却时间 (ms)
        this.lastJumpTime = 0;

        // 玩家状态
        this.isInteracting = false;
        this.isAttacking = false;
        this.isCasting = false;
        this.isDodging = false;
        this.isInvincible = false;

        // 玩家属性
        this.level = 1;
        this.experience = 0;
        this.experienceToNext = 100;
        this.health = 100;
        this.maxHealth = 100;
        this.mana = 80;
        this.maxMana = 80;
        this.attack = 10;
        this.defense = 5;
        this.castSpeed = 1.0;
        this.specialization = null; // null, 'fire', 'ice', 'thunder', 'nature'

        // 玩家外观
        this.gender = 'male'; // 'male', 'female'
        this.hairStyle = 'short'; // 'short', 'medium', 'long'
        this.hairColor = 'black'; // 'black', 'brown', 'gold', 'silver', 'blue', 'purple'
        this.robe = 'basic'; // 'basic', 'fire', 'ice', 'thunder', 'nature'
        this.wand = 'basic'; // 'basic', 'fire', 'ice', 'thunder', 'nature', 'ultimate'
        this.accessory = null; // null, 'life-necklace', 'mana-necklace', 'attack-ring', 'defense-ring', 'cast-cloak', 'chaos-amulet'

        // 玩家物品
        this.gold = 100;
        this.learnedSpells = [];
        this.selectedSpell = null;

        // 输入状态
        this.keys = {};
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();

        // 技能冷却
        this.spellCooldowns = {};
        this.dodgeCooldown = 5000; // 闪避冷却时间 (ms)
        this.lastDodgeTime = 0;

        // 相机控制
        this.camera = this.game.camera;
        this.cameraOffset = new THREE.Vector3(0, 5, 10);
        this.cameraLookAt = new THREE.Vector3();

        // 事件监听
        this.setupEventListeners();
    }

    /**
     * 初始化玩家
     */
    async init() {
        // 加载玩家模型
        await this.loadPlayerModel();

        // 设置玩家初始位置
        this.position.copy(this.game.sceneManager.currentScene.playerStartPosition);

        // 更新相机
        this.updateCamera();

        // 添加到场景
        this.game.sceneManager.scene.add(this.model);
    }

    /**
     * 加载玩家模型
     */
    async loadPlayerModel() {
        const modelId = this.gender === 'male' ? 'player-male' : 'player-female';
        const model = this.game.resourceManager.getResource('models',modelId);

        if (model) {
            // 克隆模型
            this.model = model.clone();

            // 设置位置和缩放
            this.model.position.copy(this.position);
            this.model.scale.set(1, 1, 1);

            // 设置阴影
            this.model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            // 设置动画混合器
            this.mixer = new THREE.AnimationMixer(this.model);

            // 获取所有动画
            this.model.animations.forEach((clip) => {
                this.animations[clip.name] = this.mixer.clipAction(clip);
            });

            // 播放待机动画
            this.playAnimation('idle');
        } else {
            // 如果没有模型，创建一个简单的占位符
            const geometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8);
            const material = new THREE.MeshPhongMaterial({ color: 0x88aaff });
            this.model = new THREE.Mesh(geometry, material);
            this.model.position.copy(this.position);
            this.model.castShadow = true;
            this.model.receiveShadow = true;
        }
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 键盘按下
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;

            // 处理特殊按键
            switch (event.code) {
                case 'Space':
                    this.jump();
                    break;
                case 'ShiftLeft':
                case 'ShiftRight':
                    this.dodge();
                    break;
                case 'KeyE':
                    this.isInteracting = true;
                    break;
            }
        });

        // 键盘释放
        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;

            // 处理特殊按键
            switch (event.code) {
                case 'KeyE':
                    this.isInteracting = false;
                    break;
            }
        });

        // 鼠标移动
        document.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });

        // 鼠标点击
        document.addEventListener('mousedown', (event) => {
            if (event.button === 0) { // 左键
                this.attack();
            }
        });

        // 右键点击
        document.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            this.castSpell();
        });
    }

    /**
     * 更新玩家
     * @param {number} deltaTime - 帧间隔时间
     */
    update(deltaTime) {
        // 更新移动
        this.updateMovement(deltaTime);

        // 更新动画
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }

        // 更新相机
        this.updateCamera();

        // 更新冷却时间
        this.updateCooldowns(deltaTime);

        // 更新状态
        this.updateStatus(deltaTime);
    }

    /**
     * 更新移动
     * @param {number} deltaTime - 帧间隔时间
     */
    updateMovement(deltaTime) {
        // 如果正在施法或攻击，不能移动
        if (this.isCasting || this.isAttacking) {
            return;
        }

        // 获取移动方向
        const moveDirection = new THREE.Vector3();

        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            moveDirection.z -= 1;
        }
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            moveDirection.z += 1;
        }
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            moveDirection.x -= 1;
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            moveDirection.x += 1;
        }

        // 如果有移动方向
        if (moveDirection.length() > 0) {
            // 标准化方向
            moveDirection.normalize();

            // 应用移动速度
            const currentMoveSpeed = this.moveSpeed * (1 + this.level * 0.05);
            moveDirection.multiplyScalar(currentMoveSpeed * deltaTime);

            // 更新位置
            this.position.add(moveDirection);

            // 更新旋转（面向移动方向）
            this.rotation.y = Math.atan2(moveDirection.x, moveDirection.z);

            // 更新模型位置和旋转
            if (this.model) {
                this.model.position.copy(this.position);
                this.model.rotation.y = this.rotation.y;
            }

            // 播放移动动画
            this.playAnimation('walk');
        } else {
            // 播放待机动画
            this.playAnimation('idle');
        }
    }

    /**
     * 更新相机
     */
    updateCamera() {
        // 计算相机位置
        const cameraPosition = new THREE.Vector3().copy(this.position);
        cameraPosition.add(this.cameraOffset);

        // 设置相机位置
        this.camera.position.copy(cameraPosition);

        // 设置相机朝向
        this.cameraLookAt.copy(this.position);
        this.cameraLookAt.y += 1; // 稍微向上看
        this.camera.lookAt(this.cameraLookAt);
    }

    /**
     * 更新冷却时间
     * @param {number} deltaTime - 帧间隔时间
     */
    updateCooldowns(deltaTime) {
        const currentTime = Date.now();

        // 更新跳跃冷却
        if (currentTime - this.lastJumpTime > this.jumpCooldown) {
            this.canJump = true;
        }

        // 更新闪避冷却
        if (currentTime - this.lastDodgeTime > this.dodgeCooldown) {
            // 闪避冷却结束，可以再次闪避
        }

        // 更新咒语冷却
        for (const spellId in this.spellCooldowns) {
            this.spellCooldowns[spellId] -= deltaTime;
            if (this.spellCooldowns[spellId] <= 0) {
                delete this.spellCooldowns[spellId];
            }
        }
    }

    /**
     * 更新状态
     * @param {number} deltaTime - 帧间隔时间
     */
    updateStatus(deltaTime) {
        // 检查生命值状态
        if (this.health <= 0) {
            // 游戏结束
            this.game.gameOver(false);
            return;
        }

        // 检查受伤状态
        if (this.health < this.maxHealth * 0.3) {
            if (this.health < this.maxHealth * 0.1) {
                // 濒死状态
                this.applyStatusEffect('dying', deltaTime);
            } else {
                // 受伤状态
                this.applyStatusEffect('injured', deltaTime);
            }
        } else {
            // 正常状态
            this.applyStatusEffect('normal', deltaTime);
        }

        // 更新UI
        this.game.uiController.updatePlayerStats();
    }

    /**
     * 应用状态效果
     * @param {string} status - 状态名称
     * @param {number} deltaTime - 帧间隔时间
     */
    applyStatusEffect(status, deltaTime) {
        switch (status) {
            case 'normal':
                // 正常状态，无特殊效果
                break;

            case 'injured':
                // 受伤状态，移动速度降低20%，施法速度降低10%
                // 这些效果在属性计算时应用
                break;

            case 'dying':
                // 濒死状态，每2秒恢复5点生命值
                if (!this.lastHealTime || Date.now() - this.lastHealTime > 2000) {
                    this.lastHealTime = Date.now();
                    const healAmount = 5;
                    if (this.specialization === 'nature') {
                        healAmount += 3; // 自然专精额外恢复
                    }
                    this.heal(healAmount);
                }
                break;
        }
    }

    /**
     * 跳跃
     */
    jump() {
        // 检查是否可以跳跃
        if (!this.canJump || !this.isGrounded) {
            return;
        }

        // 设置跳跃状态
        this.isGrounded = false;
        this.canJump = false;
        this.lastJumpTime = Date.now();

        // 应用跳跃速度
        this.velocity.y = this.jumpSpeed;

        // 播放跳跃动画
        this.playAnimation('jump');
    }

    /**
     * 闪避
     */
    dodge() {
        // 检查是否可以闪避
        const currentTime = Date.now();
        if (currentTime - this.lastDodgeTime < this.dodgeCooldown || this.mana < 10) {
            return;
        }

        // 消耗魔法值
        this.mana -= 10;

        // 设置闪避状态
        this.isDodging = true;
        this.isInvincible = true;
        this.lastDodgeTime = currentTime;

        // 获取移动方向
        let dodgeDirection = new THREE.Vector3();

        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            dodgeDirection.z -= 1;
        }
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            dodgeDirection.z += 1;
        }
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            dodgeDirection.x -= 1;
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            dodgeDirection.x += 1;
        }

        // 如果没有移动方向，使用当前朝向
        if (dodgeDirection.length() === 0) {
            dodgeDirection.z = -1;
            dodgeDirection.applyEuler(this.rotation);
        } else {
            dodgeDirection.normalize();
        }

        // 计算闪避距离
        const dodgeDistance = 2; // 角色身高 * 2
        dodgeDirection.multiplyScalar(dodgeDistance);

        // 更新位置
        this.position.add(dodgeDirection);

        // 播放闪避动画
        this.playAnimation('dodge');

        // 0.5秒后结束无敌状态
        setTimeout(() => {
            this.isDodging = false;
            this.isInvincible = false;
        }, 500);
    }

    /**
     * 物理攻击
     */
    attack() {
        // 检查是否可以攻击
        if (this.isAttacking || this.isCasting) {
            return;
        }

        // 设置攻击状态
        this.isAttacking = true;

        // 播放攻击动画
        this.playAnimation('attack');

        // 计算伤害
        const damage = this.attack * 0.5;

        // 射线检测
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.game.sceneManager.scene.children, true);

        // 检查是否击中敌人
        for (const intersect of intersects) {
            const object = intersect.object;

            // 检查是否是敌人
            if (object.userData.isEnemy) {
                // 造成伤害
                object.userData.controller.takeDamage(damage);

                // 播放击中音效
                this.game.audioController.playSound('enemy-hit');

                // 显示伤害数字
                this.game.uiController.showDamageNumber(intersect.point, damage);

                break;
            }
        }

        // 攻击动画结束后重置状态
        setTimeout(() => {
            this.isAttacking = false;
        }, 500);
    }

    /**
     * 施放咒语
     */
    castSpell() {
        // 检查是否可以施法
        if (this.isCasting || this.isAttacking || !this.selectedSpell) {
            return;
        }

        // 获取咒语数据
        if (!this.game.spellSystem) {
            console.warn("SpellSystem未初始化");
            return;
        }
        const spell = this.game.spellSystem.getSpell(this.selectedSpell);

        if (!spell) {
            return;
        }

        // 检查魔法值是否足够
        if (this.mana < spell.cost) {
            this.game.uiController.showNotification('魔法值不足');
            return;
        }

        // 检查冷却时间
        if (this.spellCooldowns[spell.id]) {
            this.game.uiController.showNotification('咒语冷却中');
            return;
        }

        // 设置施法状态
        this.isCasting = true;

        // 消耗魔法值
        this.mana -= spell.cost;

        // 播放施法动画
        this.playAnimation('cast');

        // 设置冷却时间
        if (spell.cooldown > 0) {
            this.spellCooldowns[spell.id] = spell.cooldown;
        }

        // 计算施法时间
        const castTime = spell.castTime / this.castSpeed;
        const minCastTime = 0.3; // 最小施法时间
        const actualCastTime = Math.max(castTime, minCastTime);

        // 施法前摇
        setTimeout(() => {
            // 执行咒语效果
            this.game.spellSystem.castSpell(spell.id, this);

            // 播放咒语音效
            this.game.audioController.playSound(`${spell.element}-spell`);

            // 更新统计
            this.game.stats.spellsCast++;
        }, actualCastTime * 1000);

        // 施法动画结束后重置状态
        setTimeout(() => {
            this.isCasting = false;
        }, actualCastTime * 1000 + 200);
    }

    /**
     * 受到伤害
     * @param {number} damage - 伤害值
     */
    takeDamage(damage) {
        // 如果无敌，不受到伤害
        if (this.isInvincible) {
            return;
        }

        // 计算实际伤害
        const actualDamage = Math.max(0, damage - this.defense);

        // 减少生命值
        this.health -= actualDamage;

        // 确保生命值不低于0
        this.health = Math.max(0, this.health);

        // 播放受伤动画
        this.playAnimation('hurt');

        // 播放受伤音效
        this.game.audioController.playSound('player-hit');

        // 屏幕边缘添加红色渐变遮罩
        this.game.uiController.showDamageEffect();

        // 更新统计
        this.game.stats.damageTaken += actualDamage;

        // 更新UI
        this.game.uiController.updatePlayerStats();
    }

    /**
     * 治疗
     * @param {number} amount - 治疗量
     */
    heal(amount) {
        // 增加生命值
        this.health += amount;

        // 确保生命值不超过最大值
        this.health = Math.min(this.health, this.maxHealth);

        // 播放治疗音效
        this.game.audioController.playSound('heal');

        // 显示治疗数字
        this.game.uiController.showDamageNumber(
            this.position.clone().add(new THREE.Vector3(0, 2, 0)),
            amount,
            true
        );

        // 更新UI
        this.game.uiController.updatePlayerStats();
    }

    /**
     * 增加经验值
     * @param {number} amount - 经验值
     */
    addExperience(amount) {
        // 增加经验值
        this.experience += amount;

        // 检查是否升级
        while (this.experience >= this.experienceToNext) {
            this.levelUp();
        }

        // 更新UI
        this.game.uiController.updatePlayerStats();
    }

    /**
     * 升级
     */
    levelUp() {
        // 增加等级
        this.level++;

        // 减少经验值
        this.experience -= this.experienceToNext;

        // 计算下一级所需经验值
        this.experienceToNext = 100 + (this.level - 1) * 50;

        // 增加属性
        this.maxHealth += 20;
        this.health = this.maxHealth; // 升级时恢复满血
        this.maxMana += 15;
        this.mana = this.maxMana; // 升级时恢复满蓝
        this.attack += 5;
        this.defense += 3;
        this.castSpeed += 0.1;

        // 根据专精增加额外属性
        if (this.specialization === 'fire') {
            this.attack += 3;
        } else if (this.specialization === 'ice') {
            this.defense += 2;
        } else if (this.specialization === 'thunder') {
            this.maxMana += 5;
            this.mana = this.maxMana;
        } else if (this.specialization === 'nature') {
            this.maxHealth += 5;
            this.health = this.maxHealth;
        }

        // 播放升级音效
        this.game.audioController.playSound('level-up');

        // 显示升级特效
        this.game.uiController.showLevelUpEffect();

        // 显示通知
        this.game.uiController.showNotification(`恭喜升到 ${this.level} 级！`);

        // 保存游戏
        this.game.saveSystem.autoSave();
    }

    /**
     * 播放动画
     * @param {string} animationName - 动画名称
     */
    playAnimation(animationName) {
        if (!this.mixer || !this.animations[animationName]) {
            return;
        }

        // 停止所有动画
        for (const name in this.animations) {
            this.animations[name].stop();
        }

        // 播放指定动画
        this.animations[animationName].play();
    }

    /**
     * 重置玩家
     */
    reset() {
        // 重置属性
        this.level = 1;
        this.experience = 0;
        this.experienceToNext = 100;
        this.health = 100;
        this.maxHealth = 100;
        this.mana = 80;
        this.maxMana = 80;
        this.attack = 10;
        this.defense = 5;
        this.castSpeed = 1.0;
        this.specialization = null;

        // 重置外观
        this.gender = 'male';
        this.hairStyle = 'short';
        this.hairColor = 'black';
        this.robe = 'basic';
        this.wand = 'basic';
        this.accessory = null;

        // 重置物品
        this.gold = 100;
        this.learnedSpells = [];
        this.selectedSpell = null;

        // 重置状态
        this.isInteracting = false;
        this.isAttacking = false;
        this.isCasting = false;
        this.isDodging = false;
        this.isInvincible = false;

        // 重置冷却
        this.spellCooldowns = {};
        this.lastJumpTime = 0;
        this.lastDodgeTime = 0;

        // 重新加载模型
        this.loadPlayerModel();
    }
}
