/**
 * 敌人控制器
 * 负责管理游戏中的所有敌人，包括AI、战斗、掉落等
 */

export class EnemyController {
    constructor(game) {
        this.game = game;
        this.enemies = new Map();
        this.enemyTypes = new Map();
        this.combatLog = [];
        
        // 初始化敌人类型
        this.initializeEnemyTypes();
    }

    /**
     * 初始化敌人类型数据
     */
    initializeEnemyTypes() {
        // 普通敌人
        this.enemyTypes.set('fire-beastling', {
            name: '火焰幼兽',
            type: 'normal',
            level: 2,
            health: 80,
            maxHealth: 80,
            attack: 12,
            defense: 3,
            moveSpeed: 1.5,
            attackSpeed: 2.0,
            scale: 0.8,
            color: 0xff4444,
            loot: [{ item: 'fire-crystal', chance: 1.0, count: 1 }],
            ai: 'chase'
        });

        this.enemyTypes.set('ice-worm', {
            name: '冰霜蠕虫',
            type: 'normal',
            level: 2,
            health: 90,
            maxHealth: 90,
            attack: 11,
            defense: 4,
            moveSpeed: 1.2,
            attackSpeed: 2.5,
            scale: 1.0,
            color: 0x44aaff,
            loot: [{ item: 'ice-crystal', chance: 1.0, count: 1 }],
            ai: 'ambush'
        });

        this.enemyTypes.set('thunder-bat', {
            name: '雷电蝙蝠',
            type: 'normal',
            level: 2,
            health: 70,
            maxHealth: 70,
            attack: 13,
            defense: 2,
            moveSpeed: 1.8,
            attackSpeed: 1.8,
            scale: 0.6,
            color: 0xaa44ff,
            loot: [{ item: 'thunder-crystal', chance: 1.0, count: 1 }],
            ai: 'fly'
        });

        this.enemyTypes.set('vine-monster', {
            name: '藤蔓怪',
            type: 'normal',
            level: 2,
            health: 85,
            maxHealth: 85,
            attack: 10,
            defense: 3,
            moveSpeed: 1.1,
            attackSpeed: 2.2,
            scale: 1.0,
            color: 0x44ff44,
            loot: [{ item: 'nature-crystal', chance: 1.0, count: 1 }],
            ai: 'slow-chase'
        });

        this.enemyTypes.set('chaos-servant', {
            name: '混沌仆从',
            type: 'normal',
            level: 4,
            health: 150,
            maxHealth: 150,
            attack: 20,
            defense: 6,
            moveSpeed: 2.0,
            attackSpeed: 1.5,
            scale: 1.0,
            color: 0x444444,
            loot: [{ item: 'chaos-fragment', chance: 1.0, count: 1 }],
            ai: 'aggressive-chase'
        });

        this.enemyTypes.set('shadow-beetle', {
            name: '暗影甲虫',
            type: 'normal',
            level: 4,
            health: 130,
            maxHealth: 130,
            attack: 22,
            defense: 5,
            moveSpeed: 1.6,
            attackSpeed: 1.6,
            scale: 0.7,
            color: 0x222222,
            loot: [{ item: 'chaos-fragment', chance: 1.0, count: 1 }],
            ai: 'swarm'
        });

        // 精英敌人
        this.enemyTypes.set('fire-lord', {
            name: '火焰领主',
            type: 'elite',
            level: 6,
            health: 300,
            maxHealth: 300,
            attack: 40,
            defense: 15,
            moveSpeed: 1.3,
            attackSpeed: 1.2,
            scale: 1.3,
            color: 0xff2222,
            loot: [
                { item: 'advanced-fire-crystal', chance: 1.0, count: 1 },
                { item: 'chaos-fragment', chance: 1.0, count: 2 }
            ],
            ai: 'elite-fire',
            skills: ['fire-blast']
        });

        this.enemyTypes.set('ice-queen', {
            name: '冰霜女王',
            type: 'elite',
            level: 6,
            health: 320,
            maxHealth: 320,
            attack: 38,
            defense: 18,
            moveSpeed: 1.1,
            attackSpeed: 1.0,
            scale: 1.2,
            color: 0x22aaff,
            loot: [
                { item: 'advanced-ice-crystal', chance: 1.0, count: 1 },
                { item: 'chaos-fragment', chance: 1.0, count: 2 }
            ],
            ai: 'elite-ice',
            skills: ['freeze']
        });

        this.enemyTypes.set('thunder-messenger', {
            name: '雷电使者',
            type: 'elite',
            level: 6,
            health: 280,
            maxHealth: 280,
            attack: 45,
            defense: 12,
            moveSpeed: 1.5,
            attackSpeed: 0.8,
            scale: 1.1,
            color: 0x8822ff,
            loot: [
                { item: 'advanced-thunder-crystal', chance: 1.0, count: 1 },
                { item: 'chaos-fragment', chance: 1.0, count: 2 }
            ],
            ai: 'elite-thunder',
            skills: ['thunder-chain']
        });

        this.enemyTypes.set('nature-guardian', {
            name: '自然守护者',
            type: 'elite',
            level: 6,
            health: 350,
            maxHealth: 350,
            attack: 35,
            defense: 16,
            moveSpeed: 1.0,
            attackSpeed: 1.1,
            scale: 1.2,
            color: 0x22ff22,
            loot: [
                { item: 'advanced-nature-crystal', chance: 1.0, count: 1 },
                { item: 'chaos-fragment', chance: 1.0, count: 2 }
            ],
            ai: 'elite-nature',
            skills: ['heal']
        });

        // BOSS敌人
        this.enemyTypes.set('chaos-knight', {
            name: '混沌骑士',
            type: 'boss',
            level: 8,
            health: 800,
            maxHealth: 800,
            attack: 70,
            defense: 30,
            moveSpeed: 1.2,
            attackSpeed: 0.9,
            scale: 1.5,
            color: 0x111111,
            loot: [
                { item: 'chaos-core', chance: 1.0, count: 1 },
                { item: 'chaos-fragment', chance: 1.0, count: 5 }
            ],
            ai: 'boss-chaos',
            skills: ['chaos-slash', 'defense-aura']
        });

        this.enemyTypes.set('shadow-mage', {
            name: '暗影法师',
            type: 'boss',
            level: 8,
            health: 750,
            maxHealth: 750,
            attack: 75,
            defense: 25,
            moveSpeed: 1.0,
            attackSpeed: 0.7,
            scale: 1.3,
            color: 0x000000,
            loot: [
                { item: 'chaos-core', chance: 1.0, count: 1 },
                { item: 'chaos-fragment', chance: 1.0, count: 5 }
            ],
            ai: 'boss-mage',
            skills: ['shadow-missile', 'shadow-shield']
        });

        this.enemyTypes.set('abyss-beast', {
            name: '深渊巨兽',
            type: 'boss',
            level: 9,
            health: 1200,
            maxHealth: 1200,
            attack: 90,
            defense: 40,
            moveSpeed: 0.8,
            attackSpeed: 1.0,
            scale: 1.8,
            color: 0x333333,
            loot: [
                { item: 'chaos-core', chance: 1.0, count: 2 },
                { item: 'chaos-fragment', chance: 1.0, count: 8 }
            ],
            ai: 'boss-beast',
            skills: ['abyss-roar', 'beast-stomp']
        });

        this.enemyTypes.set('chaos-lord-clone', {
            name: '混沌领主分身',
            type: 'boss',
            level: 9,
            health: 1500,
            maxHealth: 1500,
            attack: 100,
            defense: 45,
            moveSpeed: 1.1,
            attackSpeed: 0.8,
            scale: 1.4,
            color: 0x1a1a1a,
            loot: [
                { item: 'chaos-core', chance: 1.0, count: 3 },
                { item: 'chaos-fragment', chance: 1.0, count: 10 }
            ],
            ai: 'boss-chaos-lord',
            skills: ['chaos-storm', 'teleport']
        });

        this.enemyTypes.set('chaos-lord', {
            name: '混沌领主',
            type: 'final-boss',
            level: 10,
            health: 2000,
            maxHealth: 2000,
            attack: 120,
            defense: 50,
            moveSpeed: 1.0,
            attackSpeed: 0.6,
            scale: 2.0,
            color: 0x000000,
            loot: [
                { item: 'chaos-core', chance: 1.0, count: 5 },
                { item: 'ultimate-wand', chance: 1.0, count: 1 },
                { item: 'legendary-robe', chance: 1.0, count: 1 }
            ],
            ai: 'final-boss',
            skills: ['chaos-eruption', 'dark-portal', 'chaos-armor', 'reality-tear']
        });
    }

    /**
     * 生成敌人
     * @param {string} typeId - 敌人类型ID
     * @param {THREE.Vector3} position - 生成位置
     * @param {string} id - 敌人唯一ID
     */
    spawnEnemy(typeId, position, id = null) {
        const enemyType = this.enemyTypes.get(typeId);
        if (!enemyType) {
            console.error(`敌人类型不存在: ${typeId}`);
            return null;
        }

        const enemyId = id || `${typeId}_${Date.now()}_${Math.random()}`;
        
        const enemy = {
            id: enemyId,
            typeId: typeId,
            name: enemyType.name,
            type: enemyType.type,
            level: enemyType.level,
            health: enemyType.health,
            maxHealth: enemyType.health,
            attack: enemyType.attack,
            defense: enemyType.defense,
            moveSpeed: enemyType.moveSpeed,
            attackSpeed: enemyType.attackSpeed,
            scale: enemyType.scale,
            color: enemyType.color,
            loot: enemyType.loot,
            ai: enemyType.ai,
            skills: enemyType.skills || [],
            position: position.clone(),
            model: null,
            target: null,
            lastAttackTime: 0,
            lastSkillTime: 0,
            state: 'idle', // idle, chasing, attacking, dead
            buffs: [],
            debuffs: []
        };

        this.enemies.set(enemyId, enemy);
        this.loadEnemyModel(enemy);
        
        return enemyId;
    }

    /**
     * 加载敌人模型
     * @param {Object} enemy - 敌人对象
     */
    async loadEnemyModel(enemy) {
        try {
            // 创建敌人模型（使用简单的几何体作为占位符）
            const geometry = new THREE.SphereGeometry(0.5 * enemy.scale, 8, 8);
            const material = new THREE.MeshPhongMaterial({ 
                color: enemy.color,
                transparent: true,
                opacity: 0.9
            });
            
            enemy.model = new THREE.Mesh(geometry, material);
            enemy.model.position.copy(enemy.position);
            enemy.model.castShadow = true;
            enemy.model.receiveShadow = true;
            enemy.model.userData = { type: 'enemy', id: enemy.id };

            // 添加血条
            this.addHealthBar(enemy);

            this.game.sceneManager.scene.add(enemy.model);
        } catch (error) {
            console.error(`加载敌人模型失败: ${enemy.id}`, error);
        }
    }

    /**
     * 添加血条
     * @param {Object} enemy - 敌人对象
     */
    addHealthBar(enemy) {
        // 创建血条背景
        const bgGeometry = new THREE.PlaneGeometry(2, 0.2);
        const bgMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x333333,
            transparent: true,
            opacity: 0.8
        });
        const bgBar = new THREE.Mesh(bgGeometry, bgMaterial);
        bgBar.position.set(0, enemy.scale + 0.5, 0);
        
        // 创建血条
        const healthGeometry = new THREE.PlaneGeometry(2, 0.2);
        const healthMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0.9
        });
        const healthBar = new THREE.Mesh(healthGeometry, healthMaterial);
        healthBar.position.set(0, enemy.scale + 0.5, 0.01);
        
        enemy.model.add(bgBar);
        enemy.model.add(healthBar);
        
        enemy.healthBar = healthBar;
        enemy.bgBar = bgBar;
    }

    /**
     * 更新敌人血条
     * @param {Object} enemy - 敌人对象
     */
    updateHealthBar(enemy) {
        if (!enemy.healthBar) return;
        
        const healthPercent = enemy.health / enemy.maxHealth;
        enemy.healthBar.scale.x = healthPercent;
        enemy.healthBar.position.x = (1 - healthPercent) * -1;
        
        // 根据血量改变颜色
        if (healthPercent > 0.6) {
            enemy.healthBar.material.color.setHex(0x00ff00); // 绿色
        } else if (healthPercent > 0.3) {
            enemy.healthBar.material.color.setHex(0xffff00); // 黄色
        } else {
            enemy.healthBar.material.color.setHex(0xff0000); // 红色
        }
    }

    /**
     * 更新所有敌人
     * @param {number} deltaTime - 帧间隔时间
     */
    update(deltaTime) {
        const player = this.game.playerController;
        
        for (const [id, enemy] of this.enemies) {
            if (enemy.state === 'dead') {
                this.removeEnemy(id);
                continue;
            }

            // 更新AI
            this.updateEnemyAI(enemy, player, deltaTime);
            
            // 更新buff/debuff
            this.updateBuffs(enemy, deltaTime);
            
            // 更新模型位置
            if (enemy.model) {
                enemy.model.position.copy(enemy.position);
            }
        }
    }

    /**
     * 更新敌人AI
     * @param {Object} enemy - 敌人对象
     * @param {Object} player - 玩家对象
     * @param {number} deltaTime - 帧间隔时间
     */
    updateEnemyAI(enemy, player, deltaTime) {
        const distanceToPlayer = enemy.position.distanceTo(player.position);
        const currentTime = Date.now();

        switch (enemy.ai) {
            case 'chase':
                this.chaseAI(enemy, player, distanceToPlayer, currentTime);
                break;
            case 'ambush':
                this.ambushAI(enemy, player, distanceToPlayer, currentTime);
                break;
            case 'fly':
                this.flyAI(enemy, player, distanceToPlayer, currentTime);
                break;
            case 'slow-chase':
                this.slowChaseAI(enemy, player, distanceToPlayer, currentTime);
                break;
            case 'aggressive-chase':
                this.aggressiveChaseAI(enemy, player, distanceToPlayer, currentTime);
                break;
            case 'swarm':
                this.swarmAI(enemy, player, distanceToPlayer, currentTime);
                break;
            case 'elite-fire':
                this.eliteFireAI(enemy, player, distanceToPlayer, currentTime);
                break;
            case 'elite-ice':
                this.eliteIceAI(enemy, player, distanceToPlayer, currentTime);
                break;
            case 'elite-thunder':
                this.eliteThunderAI(enemy, player, distanceToPlayer, currentTime);
                break;
            case 'elite-nature':
                this.eliteNatureAI(enemy, player, distanceToPlayer, currentTime);
                break;
            case 'boss-chaos':
                this.bossChaosAI(enemy, player, distanceToPlayer, currentTime);
                break;
            case 'boss-mage':
                this.bossMageAI(enemy, player, distanceToPlayer, currentTime);
                break;
            case 'boss-beast':
                this.bossBeastAI(enemy, player, distanceToPlayer, currentTime);
                break;
            case 'boss-chaos-lord':
                this.bossChaosLordAI(enemy, player, distanceToPlayer, currentTime);
                break;
            case 'final-boss':
                this.finalBossAI(enemy, player, distanceToPlayer, currentTime);
                break;
        }
    }

    /**
     * 追击AI
     */
    chaseAI(enemy, player, distanceToPlayer, currentTime) {
        const detectionRange = 10;
        const attackRange = 2;

        if (distanceToPlayer <= detectionRange) {
            if (distanceToPlayer <= attackRange) {
                // 攻击
                if (currentTime - enemy.lastAttackTime >= enemy.attackSpeed * 1000) {
                    this.enemyAttack(enemy, player);
                    enemy.lastAttackTime = currentTime;
                }
            } else {
                // 追击
                const direction = new THREE.Vector3()
                    .subVectors(player.position, enemy.position)
                    .normalize();
                
                enemy.position.add(direction.multiplyScalar(enemy.moveSpeed * 0.016));
            }
        }
    }

    /**
     * 伏击AI
     */
    ambushAI(enemy, player, distanceToPlayer, currentTime) {
        const detectionRange = 5;
        const attackRange = 2;

        if (distanceToPlayer <= detectionRange) {
            if (distanceToPlayer <= attackRange) {
                if (currentTime - enemy.lastAttackTime >= enemy.attackSpeed * 1000) {
                    this.enemyAttack(enemy, player);
                    enemy.lastAttackTime = currentTime;
                }
            } else {
                const direction = new THREE.Vector3()
                    .subVectors(player.position, enemy.position)
                    .normalize();
                
                enemy.position.add(direction.multiplyScalar(enemy.moveSpeed * 0.016 * 2)); // 快速接近
            }
        }
    }

    /**
     * 飞行AI
     */
    flyAI(enemy, player, distanceToPlayer, currentTime) {
        const detectionRange = 12;
        const attackRange = 3;

        if (distanceToPlayer <= detectionRange) {
            if (distanceToPlayer <= attackRange) {
                if (currentTime - enemy.lastAttackTime >= enemy.attackSpeed * 1000) {
                    this.enemyAttack(enemy, player);
                    enemy.lastAttackTime = currentTime;
                }
            } else {
                // 飞行追击，稍微复杂的路径
                const direction = new THREE.Vector3()
                    .subVectors(player.position, enemy.position)
                    .normalize();
                
                // 添加一些随机性
                direction.x += (Math.random() - 0.5) * 0.2;
                direction.z += (Math.random() - 0.5) * 0.2;
                direction.normalize();
                
                enemy.position.add(direction.multiplyScalar(enemy.moveSpeed * 0.016));
            }
        }
    }

    /**
     * 其他AI实现...
     */
    slowChaseAI(enemy, player, distanceToPlayer, currentTime) {
        const detectionRange = 8;
        const attackRange = 2;

        if (distanceToPlayer <= detectionRange) {
            if (distanceToPlayer <= attackRange) {
                if (currentTime - enemy.lastAttackTime >= enemy.attackSpeed * 1000) {
                    this.enemyAttack(enemy, player);
                    enemy.lastAttackTime = currentTime;
                }
            } else {
                const direction = new THREE.Vector3()
                    .subVectors(player.position, enemy.position)
                    .normalize();
                
                enemy.position.add(direction.multiplyScalar(enemy.moveSpeed * 0.016 * 0.8));
            }
        }
    }

    aggressiveChaseAI(enemy, player, distanceToPlayer, currentTime) {
        const detectionRange = 15;
        const attackRange = 2;

        if (distanceToPlayer <= detectionRange) {
            if (distanceToPlayer <= attackRange) {
                if (currentTime - enemy.lastAttackTime >= enemy.attackSpeed * 1000) {
                    this.enemyAttack(enemy, player);
                    enemy.lastAttackTime = currentTime;
                }
            } else {
                const direction = new THREE.Vector3()
                    .subVectors(player.position, enemy.position)
                    .normalize();
                
                enemy.position.add(direction.multiplyScalar(enemy.moveSpeed * 0.016 * 1.5));
            }
        }
    }

    swarmAI(enemy, player, distanceToPlayer, currentTime) {
        const detectionRange = 12;
        const attackRange = 2;

        if (distanceToPlayer <= detectionRange) {
            if (distanceToPlayer <= attackRange) {
                if (currentTime - enemy.lastAttackTime >= enemy.attackSpeed * 1000) {
                    this.enemyAttack(enemy, player);
                    enemy.lastAttackTime = currentTime;
                }
            } else {
                // 群体行为：稍微围绕玩家
                const direction = new THREE.Vector3()
                    .subVectors(player.position, enemy.position)
                    .normalize();
                
                // 添加圆周运动
                const angle = Date.now() * 0.001;
                direction.x += Math.cos(angle) * 0.3;
                direction.z += Math.sin(angle) * 0.3;
                direction.normalize();
                
                enemy.position.add(direction.multiplyScalar(enemy.moveSpeed * 0.016));
            }
        }
    }

    eliteFireAI(enemy, player, distanceToPlayer, currentTime) {
        const detectionRange = 15;
        const attackRange = 3;
        const skillCooldown = 5000; // 5秒

        if (distanceToPlayer <= detectionRange) {
            // 使用技能
            if (currentTime - enemy.lastSkillTime >= skillCooldown) {
                this.useSkill(enemy, 'fire-blast', player);
                enemy.lastSkillTime = currentTime;
            }

            if (distanceToPlayer <= attackRange) {
                if (currentTime - enemy.lastAttackTime >= enemy.attackSpeed * 1000) {
                    this.enemyAttack(enemy, player);
                    enemy.lastAttackTime = currentTime;
                }
            } else {
                const direction = new THREE.Vector3()
                    .subVectors(player.position, enemy.position)
                    .normalize();
                
                enemy.position.add(direction.multiplyScalar(enemy.moveSpeed * 0.016));
            }
        }
    }

    eliteIceAI(enemy, player, distanceToPlayer, currentTime) {
        const detectionRange = 15;
        const attackRange = 4;
        const skillCooldown = 6000; // 6秒

        if (distanceToPlayer <= detectionRange) {
            if (currentTime - enemy.lastSkillTime >= skillCooldown) {
                this.useSkill(enemy, 'freeze', player);
                enemy.lastSkillTime = currentTime;
            }

            if (distanceToPlayer <= attackRange) {
                if (currentTime - enemy.lastAttackTime >= enemy.attackSpeed * 1000) {
                    this.enemyAttack(enemy, player);
                    enemy.lastAttackTime = currentTime;
                }
            } else {
                const direction = new THREE.Vector3()
                    .subVectors(player.position, enemy.position)
                    .normalize();
                
                enemy.position.add(direction.multiplyScalar(enemy.moveSpeed * 0.016));
            }
        }
    }

    eliteThunderAI(enemy, player, distanceToPlayer, currentTime) {
        const detectionRange = 15;
        const attackRange = 3;
        const skillCooldown = 4000; // 4秒

        if (distanceToPlayer <= detectionRange) {
            if (currentTime - enemy.lastSkillTime >= skillCooldown) {
                this.useSkill(enemy, 'thunder-chain', player);
                enemy.lastSkillTime = currentTime;
            }

            if (distanceToPlayer <= attackRange) {
                if (currentTime - enemy.lastAttackTime >= enemy.attackSpeed * 1000) {
                    this.enemyAttack(enemy, player);
                    enemy.lastAttackTime = currentTime;
                }
            } else {
                const direction = new THREE.Vector3()
                    .subVectors(player.position, enemy.position)
                    .normalize();
                
                enemy.position.add(direction.multiplyScalar(enemy.moveSpeed * 0.016));
            }
        }
    }

    eliteNatureAI(enemy, player, distanceToPlayer, currentTime) {
        const detectionRange = 15;
        const attackRange = 2;
        const skillCooldown = 7000; // 7秒

        if (distanceToPlayer <= detectionRange) {
            // 生命值低时使用治疗
            if (enemy.health < enemy.maxHealth * 0.3 && currentTime - enemy.lastSkillTime >= skillCooldown) {
                this.useSkill(enemy, 'heal', enemy);
                enemy.lastSkillTime = currentTime;
            }

            if (distanceToPlayer <= attackRange) {
                if (currentTime - enemy.lastAttackTime >= enemy.attackSpeed * 1000) {
                    this.enemyAttack(enemy, player);
                    enemy.lastAttackTime = currentTime;
                }
            } else {
                const direction = new THREE.Vector3()
                    .subVectors(player.position, enemy.position)
                    .normalize();
                
                enemy.position.add(direction.multiplyScalar(enemy.moveSpeed * 0.016));
            }
        }
    }

    // BOSS AI 实现（简化版本）
    bossChaosAI(enemy, player, distanceToPlayer, currentTime) {
        const detectionRange = 20;
        const attackRange = 3;
        const skillCooldown = 3000; // 3秒

        if (distanceToPlayer <= detectionRange) {
            // 随机使用技能
            if (currentTime - enemy.lastSkillTime >= skillCooldown) {
                const skills = ['chaos-slash', 'defense-aura'];
                const randomSkill = skills[Math.floor(Math.random() * skills.length)];
                this.useSkill(enemy, randomSkill, player);
                enemy.lastSkillTime = currentTime;
            }

            if (distanceToPlayer <= attackRange) {
                if (currentTime - enemy.lastAttackTime >= enemy.attackSpeed * 1000) {
                    this.enemyAttack(enemy, player);
                    enemy.lastAttackTime = currentTime;
                }
            } else {
                const direction = new THREE.Vector3()
                    .subVectors(player.position, enemy.position)
                    .normalize();
                
                enemy.position.add(direction.multiplyScalar(enemy.moveSpeed * 0.016));
            }
        }
    }

    bossMageAI(enemy, player, distanceToPlayer, currentTime) {
        const detectionRange = 25;
        const attackRange = 8;
        const skillCooldown = 2000; // 2秒

        if (distanceToPlayer <= detectionRange) {
            if (currentTime - enemy.lastSkillTime >= skillCooldown) {
                const skills = ['shadow-missile', 'shadow-shield'];
                const randomSkill = skills[Math.floor(Math.random() * skills.length)];
                this.useSkill(enemy, randomSkill, player);
                enemy.lastSkillTime = currentTime;
            }

            if (distanceToPlayer <= attackRange) {
                if (currentTime - enemy.lastAttackTime >= enemy.attackSpeed * 1000) {
                    this.enemyAttack(enemy, player);
                    enemy.lastAttackTime = currentTime;
                }
            } else {
                const direction = new THREE.Vector3()
                    .subVectors(player.position, enemy.position)
                    .normalize();
                
                enemy.position.add(direction.multiplyScalar(enemy.moveSpeed * 0.016));
            }
        }
    }

    bossBeastAI(enemy, player, distanceToPlayer, currentTime) {
        const detectionRange = 18;
        const attackRange = 4;
        const skillCooldown = 4000; // 4秒

        if (distanceToPlayer <= detectionRange) {
            if (currentTime - enemy.lastSkillTime >= skillCooldown) {
                const skills = ['abyss-roar', 'beast-stomp'];
                const randomSkill = skills[Math.floor(Math.random() * skills.length)];
                this.useSkill(enemy, randomSkill, player);
                enemy.lastSkillTime = currentTime;
            }

            if (distanceToPlayer <= attackRange) {
                if (currentTime - enemy.lastAttackTime >= enemy.attackSpeed * 1000) {
                    this.enemyAttack(enemy, player);
                    enemy.lastAttackTime = currentTime;
                }
            } else {
                const direction = new THREE.Vector3()
                    .subVectors(player.position, enemy.position)
                    .normalize();
                
                enemy.position.add(direction.multiplyScalar(enemy.moveSpeed * 0.016));
            }
        }
    }

    bossChaosLordAI(enemy, player, distanceToPlayer, currentTime) {
        const detectionRange = 22;
        const attackRange = 3;
        const skillCooldown = 2500; // 2.5秒

        if (distanceToPlayer <= detectionRange) {
            if (currentTime - enemy.lastSkillTime >= skillCooldown) {
                const skills = ['chaos-storm', 'teleport'];
                const randomSkill = skills[Math.floor(Math.random() * skills.length)];
                this.useSkill(enemy, randomSkill, player);
                enemy.lastSkillTime = currentTime;
            }

            if (distanceToPlayer <= attackRange) {
                if (currentTime - enemy.lastAttackTime >= enemy.attackSpeed * 1000) {
                    this.enemyAttack(enemy, player);
                    enemy.lastAttackTime = currentTime;
                }
            } else {
                const direction = new THREE.Vector3()
                    .subVectors(player.position, enemy.position)
                    .normalize();
                
                enemy.position.add(direction.multiplyScalar(enemy.moveSpeed * 0.016));
            }
        }
    }

    finalBossAI(enemy, player, distanceToPlayer, currentTime) {
        const detectionRange = 30;
        const attackRange = 4;
        const skillCooldown = 2000; // 2秒

        if (distanceToPlayer <= detectionRange) {
            if (currentTime - enemy.lastSkillTime >= skillCooldown) {
                const skills = ['chaos-eruption', 'dark-portal', 'chaos-armor', 'reality-tear'];
                const randomSkill = skills[Math.floor(Math.random() * skills.length)];
                this.useSkill(enemy, randomSkill, player);
                enemy.lastSkillTime = currentTime;
            }

            if (distanceToPlayer <= attackRange) {
                if (currentTime - enemy.lastAttackTime >= enemy.attackSpeed * 1000) {
                    this.enemyAttack(enemy, player);
                    enemy.lastAttackTime = currentTime;
                }
            } else {
                const direction = new THREE.Vector3()
                    .subVectors(player.position, enemy.position)
                    .normalize();
                
                enemy.position.add(direction.multiplyScalar(enemy.moveSpeed * 0.016));
            }
        }
    }

    /**
     * 敌人攻击玩家
     * @param {Object} enemy - 敌人对象
     * @param {Object} player - 玩家对象
     */
    enemyAttack(enemy, player) {
        // 计算伤害
        const baseDamage = enemy.attack;
        const defense = player.defense;
        const damage = Math.max(1, baseDamage - defense * 0.5);
        
        // 应用伤害
        player.health -= damage;
        
        // 显示战斗信息
        this.game.uiController.showCombatText(`-${damage}`, player.position, 0xff0000);
        
        // 触发受伤动画
        this.game.playerController.playAnimation('hit');
        
        // 播放音效
        this.game.audioController.playSound('player-hit');
        
        // 记录战斗日志
        this.combatLog.push({
            time: Date.now(),
            attacker: enemy.name,
            target: '玩家',
            damage: damage,
            type: 'physical'
        });
        
        // 检查玩家死亡
        if (player.health <= 0) {
            this.game.gameOver('被 ' + enemy.name + ' 击败');
        }
        
        // 更新UI
        this.game.uiController.updatePlayerStats();
    }

    /**
     * 使用技能
     * @param {Object} enemy - 敌人对象
     * @param {string} skillId - 技能ID
     * @param {Object} target - 目标对象
     */
    useSkill(enemy, skillId, target) {
        switch (skillId) {
            case 'fire-blast':
                this.fireBlastSkill(enemy, target);
                break;
            case 'freeze':
                this.freezeSkill(enemy, target);
                break;
            case 'thunder-chain':
                this.thunderChainSkill(enemy, target);
                break;
            case 'heal':
                this.healSkill(enemy);
                break;
            case 'chaos-slash':
                this.chaosSlashSkill(enemy, target);
                break;
            case 'defense-aura':
                this.defenseAuraSkill(enemy);
                break;
            case 'shadow-missile':
                this.shadowMissileSkill(enemy, target);
                break;
            case 'shadow-shield':
                this.shadowShieldSkill(enemy);
                break;
            case 'abyss-roar':
                this.abyssRoarSkill(enemy, target);
                break;
            case 'beast-stomp':
                this.beastStompSkill(enemy, target);
                break;
            case 'chaos-storm':
                this.chaosStormSkill(enemy, target);
                break;
            case 'teleport':
                this.teleportSkill(enemy, target);
                break;
            case 'chaos-eruption':
                this.chaosEruptionSkill(enemy, target);
                break;
            case 'dark-portal':
                this.darkPortalSkill(enemy, target);
                break;
            case 'chaos-armor':
                this.chaosArmorSkill(enemy);
                break;
            case 'reality-tear':
                this.realityTearSkill(enemy, target);
                break;
        }
    }

    /**
     * 技能实现
     */
    fireBlastSkill(enemy, target) {
        const damage = enemy.attack * 1.5;
        target.health -= damage;
        
        this.game.uiController.showCombatText(`火焰爆炸 -${damage}`, target.position, 0xff4444);
        this.game.audioController.playSound('fire-spell');
        
        // 添加火焰粒子效果
        this.game.spellSystem.effects.createFireExplosion(target.position);
    }

    freezeSkill(enemy, target) {
        // 冻结效果
        target.isFrozen = true;
        target.frozenEndTime = Date.now() + 1000; // 1秒
        
        this.game.uiController.showCombatText('冻结!', target.position, 0x44aaff);
        this.game.audioController.playSound('ice-spell');
        
        // 添加冰霜效果
        this.game.spellSystem.effects.createIceEffect(target.position);
    }

    thunderChainSkill(enemy, target) {
        const damage = enemy.attack * 1.2;
        target.health -= damage;
        
        this.game.uiController.showCombatText(`雷电连锁 -${damage}`, target.position, 0xaa44ff);
        this.game.audioController.playSound('thunder-spell');
        
        // 添加雷电效果
        this.game.spellSystem.effects.createThunderChain(enemy.position, target.position);
    }

    healSkill(enemy) {
        const healAmount = 50;
        enemy.health = Math.min(enemy.maxHealth, enemy.health + healAmount);
        
        this.game.uiController.showCombatText(`+${healAmount}`, enemy.position, 0x44ff44);
        this.game.audioController.playSound('nature-spell');
        
        // 更新血条
        this.updateHealthBar(enemy);
    }

    chaosSlashSkill(enemy, target) {
        const damage = enemy.attack * 1.8;
        target.health -= damage;
        
        this.game.uiController.showCombatText(`混沌斩击 -${damage}`, target.position, 0x444444);
        this.game.audioController.playSound('enemy-hit');
    }

    defenseAuraSkill(enemy) {
        enemy.defense *= 1.2; // 提升20%防御
        enemy.auraEndTime = Date.now() + 10000; // 10秒
        
        this.game.uiController.showCombatText('防御光环!', enemy.position, 0x888888);
    }

    shadowMissileSkill(enemy, target) {
        // 发射3枚暗影弹
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const damage = enemy.attack * 0.8;
                target.health -= damage;
                this.game.uiController.showCombatText(`暗影弹 -${damage}`, target.position, 0x000000);
            }, i * 200);
        }
    }

    shadowShieldSkill(enemy) {
        enemy.shield = 200;
        enemy.shieldEndTime = Date.now() + 15000; // 15秒或直到被打破
        
        this.game.uiController.showCombatText('暗影护盾!', enemy.position, 0x333333);
    }

    abyssRoarSkill(enemy, target) {
        // 全屏减速
        target.moveSpeed *= 0.7; // 减速30%
        target.slowEndTime = Date.now() + 3000; // 3秒
        
        this.game.uiController.showCombatText('深渊咆哮! 减速30%', target.position, 0x333333);
        this.game.audioController.playSound('enemy-hit');
    }

    beastStompSkill(enemy, target) {
        const damage = enemy.attack * 2.0;
        target.health -= damage;
        
        this.game.uiController.showCombatText(`巨兽践踏 -${damage}`, target.position, 0x666666);
        
        // 屏幕震动效果
        this.game.uiController.shakeScreen(0.5, 300);
    }

    chaosStormSkill(enemy, target) {
        const damage = enemy.attack * 0.8;
        // 持续5秒，每秒伤害
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                target.health -= damage;
                this.game.uiController.showCombatText(`混沌风暴 -${damage}`, target.position, 0x1a1a1a);
            }, i * 1000);
        }
    }

    teleportSkill(enemy, target) {
        // 传送到玩家附近
        const angle = Math.random() * Math.PI * 2;
        const distance = 3 + Math.random() * 2;
        
        enemy.position.x = target.position.x + Math.cos(angle) * distance;
        enemy.position.z = target.position.z + Math.sin(angle) * distance;
        
        this.game.uiController.showCombatText('瞬移!', enemy.position, 0x1a1a1a);
    }

    chaosEruptionSkill(enemy, target) {
        const damage = enemy.attack * 3.5;
        target.health -= damage;
        
        this.game.uiController.showCombatText(`混沌爆发 -${damage}`, target.position, 0x000000);
        this.game.audioController.playSound('spell-cast');
    }

    darkPortalSkill(enemy, target) {
        // 召唤黑暗传送门，持续伤害
        const portalDamage = enemy.attack * 1.0;
        // 持续10秒，每秒伤害
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                target.health -= portalDamage;
                this.game.uiController.showCombatText(`黑暗传送门 -${portalDamage}`, target.position, 0x000000);
            }, i * 1000);
        }
    }

    chaosArmorSkill(enemy) {
        enemy.defense *= 1.5; // 提升50%防御
        enemy.armorEndTime = Date.now() + 20000; // 20秒
        
        this.game.uiController.showCombatText('混沌护甲!', enemy.position, 0x000000);
    }

    realityTearSkill(enemy, target) {
        const damage = enemy.attack * 4.0;
        target.health -= damage;
        
        this.game.uiController.showCombatText(`现实撕裂 -${damage}!`, target.position, 0x000000);
        this.game.audioController.playSound('spell-cast');
    }

    /**
     * 更新buff/debuff
     * @param {Object} enemy - 敌人对象
     * @param {number} deltaTime - 帧间隔时间
     */
    updateBuffs(enemy, deltaTime) {
        const currentTime = Date.now();
        
        // 检查buff结束时间
        if (enemy.auraEndTime && currentTime >= enemy.auraEndTime) {
            enemy.defense = this.enemyTypes.get(enemy.typeId).defense; // 重置防御
            enemy.auraEndTime = null;
        }
        
        if (enemy.shieldEndTime && currentTime >= enemy.shieldEndTime) {
            enemy.shield = null;
            enemy.shieldEndTime = null;
        }
        
        if (enemy.armorEndTime && currentTime >= enemy.armorEndTime) {
            enemy.defense = this.enemyTypes.get(enemy.typeId).defense; // 重置防御
            enemy.armorEndTime = null;
        }
        
        // 检查玩家debuff
        if (this.game.playerController.slowEndTime && currentTime >= this.game.playerController.slowEndTime) {
            this.game.playerController.moveSpeed = this.game.playerController.baseMoveSpeed;
            this.game.playerController.slowEndTime = null;
        }
        
        if (this.game.playerController.frozenEndTime && currentTime >= this.game.playerController.frozenEndTime) {
            this.game.playerController.isFrozen = false;
            this.game.playerController.frozenEndTime = null;
        }
    }

    /**
     * 玩家攻击敌人
     * @param {string} enemyId - 敌人ID
     * @param {number} damage - 伤害值
     * @param {string} damageType - 伤害类型
     */
    playerAttackEnemy(enemyId, damage, damageType = 'physical') {
        const enemy = this.enemies.get(enemyId);
        if (!enemy || enemy.state === 'dead') return false;

        // 应用护盾
        if (enemy.shield && enemy.shield > 0) {
            const shieldDamage = Math.min(damage, enemy.shield);
            enemy.shield -= shieldDamage;
            damage -= shieldDamage;
            
            if (enemy.shield <= 0) {
                enemy.shield = 0;
                this.game.uiController.showCombatText('护盾破碎!', enemy.position, 0xffaa00);
            }
        }

        // 应用防御
        const finalDamage = Math.max(1, damage - enemy.defense * 0.5);
        enemy.health -= finalDamage;
        
        // 显示伤害数字
        this.game.uiController.showCombatText(`-${finalDamage}`, enemy.position, 0xff0000);
        
        // 播放受击音效
        this.game.audioController.playSound('enemy-hit');
        
        // 更新血条
        this.updateHealthBar(enemy);
        
        // 检查敌人死亡
        if (enemy.health <= 0) {
            this.enemyDie(enemy);
        }
        
        return true;
    }

    /**
     * 敌人死亡
     * @param {Object} enemy - 敌人对象
     */
    enemyDie(enemy) {
        enemy.state = 'dead';
        
        // 播放死亡音效
        this.game.audioController.playSound('victory');
        
        // 显示死亡特效
        this.game.spellSystem.effects.createDeathEffect(enemy.position);
        
        // 掉落物品
        this.dropLoot(enemy);
        
        // 给予经验值
        const expGain = enemy.level * 20;
        this.game.playerController.gainExperience(expGain);
        
        // 更新统计
        this.game.stats.enemiesKilled++;
        
        // 显示通知
        this.game.uiController.showNotification(`击败了 ${enemy.name}! 获得 ${expGain} 经验值`);
        
        // 移除模型（延迟执行，让死亡动画播放）
        setTimeout(() => {
            if (enemy.model) {
                this.game.sceneManager.scene.remove(enemy.model);
            }
        }, 1000);
    }

    /**
     * 掉落物品
     * @param {Object} enemy - 敌人对象
     */
    dropLoot(enemy) {
        if (!enemy.loot) return;
        
        for (const loot of enemy.loot) {
            if (Math.random() <= loot.chance) {
                this.game.inventorySystem.addItem(loot.item, loot.count || 1);
                this.game.uiController.showNotification(`获得 ${loot.item} x${loot.count || 1}`);
            }
        }
    }

    /**
     * 移除敌人
     * @param {string} enemyId - 敌人ID
     */
    removeEnemy(enemyId) {
        const enemy = this.enemies.get(enemyId);
        if (enemy && enemy.model) {
            this.game.sceneManager.scene.remove(enemy.model);
        }
        this.enemies.delete(enemyId);
    }

    /**
     * 获取附近的敌人
     * @param {THREE.Vector3} position - 位置
     * @param {number} maxDistance - 最大距离
     * @returns {Array} 附近的敌人数组
     */
    getNearbyEnemies(position, maxDistance = 10) {
        const nearby = [];
        
        for (const [id, enemy] of this.enemies) {
            if (enemy.state === 'dead') continue;
            
            const distance = position.distanceTo(enemy.position);
            if (distance <= maxDistance) {
                nearby.push({ enemy, distance });
            }
        }
        
        // 按距离排序
        nearby.sort((a, b) => a.distance - b.distance);
        
        return nearby.map(item => item.enemy);
    }

    /**
     * 清理所有敌人
     */
    clear() {
        for (const [id, enemy] of this.enemies) {
            if (enemy.model) {
                this.game.sceneManager.scene.remove(enemy.model);
            }
        }
        this.enemies.clear();
    }

    /**
     * 获取敌人类型数据
     * @param {string} typeId - 类型ID
     * @returns {Object} 敌人类型数据
     */
    getEnemyType(typeId) {
        return this.enemyTypes.get(typeId);
    }

    /**
     * 获取所有敌人类型
     * @returns {Map} 敌人类型映射
     */
    getAllEnemyTypes() {
        return this.enemyTypes;
    }
}