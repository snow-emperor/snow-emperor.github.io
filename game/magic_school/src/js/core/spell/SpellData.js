/**
 * 咒语数据模块
 * 管理所有咒语的静态数据
 */
export class SpellData {
    constructor() {
        this.spells = {
            // 火焰系咒语
            'fireball': {
                id: 'fireball',
                name: '火焰弹',
                element: 'fire',
                level: 1,
                cost: 10,
                castTime: 0.5,
                cooldown: 0,
                damageMultiplier: 1.2,
                description: '发射一个火焰弹，对目标造成伤害。',
                requirement: '1级火焰专精'
            },
            'flamethrower': {
                id: 'flamethrower',
                name: '火焰喷射',
                element: 'fire',
                level: 3,
                cost: 25,
                castTime: 0.8,
                cooldown: 8,
                damageMultiplier: 0.8,
                duration: 2,
                description: '向前方喷射火焰，对范围内的敌人造成持续伤害。',
                requirement: '3级火焰专精'
            },
            'fire-barrier': {
                id: 'fire-barrier',
                name: '火焰结界',
                element: 'fire',
                level: 5,
                cost: 35,
                castTime: 1.0,
                cooldown: 10,
                damageMultiplier: 0.6,
                duration: 5,
                radius: 4,
                description: '在自身周围生成火焰结界，对进入的敌人造成伤害，并提升自身火焰伤害。',
                requirement: '5级火焰专精'
            },
            'meteor': {
                id: 'meteor',
                name: '陨石坠落',
                element: 'fire',
                level: 7,
                cost: 50,
                castTime: 1.2,
                cooldown: 15,
                damageMultiplier: 2.5,
                radius: 3,
                description: '从天空中召唤陨石，对指定区域造成巨大伤害。',
                requirement: '7级火焰专精'
            },
            'dragon-roar': {
                id: 'dragon-roar',
                name: '火龙咆哮',
                element: 'fire',
                level: 9,
                cost: 70,
                castTime: 1.5,
                cooldown: 25,
                damageMultiplier: 3.5,
                description: '召唤火龙释放直线范围伤害，摧毁前方的所有敌人。',
                requirement: '9级火焰专精'
            },

            // 冰霜系咒语
            'ice-shard': {
                id: 'ice-shard',
                name: '冰锥术',
                element: 'ice',
                level: 1,
                cost: 10,
                castTime: 0.5,
                cooldown: 0,
                damageMultiplier: 1.1,
                slowDuration: 2,
                description: '发射一个冰锥，对目标造成伤害并减速。',
                requirement: '1级冰霜专精'
            },
            'ice-shield': {
                id: 'ice-shield',
                name: '冰霜护盾',
                element: 'ice',
                level: 3,
                cost: 20,
                castTime: 0.6,
                cooldown: 10,
                shieldMultiplier: 3,
                duration: 6,
                description: '生成一个能吸收伤害的冰霜护盾。',
                requirement: '3级冰霜专精'
            },
            'blizzard': {
                id: 'blizzard',
                name: '冰雾弥漫',
                element: 'ice',
                level: 5,
                cost: 30,
                castTime: 0.9,
                cooldown: 12,
                slowDuration: 4,
                castSlowDuration: 2,
                radius: 5,
                description: '在目标区域生成冰雾，降低敌人的移动和施法速度。',
                requirement: '5级冰霜专精'
            },
            'freeze': {
                id: 'freeze',
                name: '冰封术',
                element: 'ice',
                level: 7,
                cost: 45,
                castTime: 1.0,
                cooldown: 18,
                damageMultiplier: 1.8,
                freezeDuration: 2,
                description: '冻结单个目标，结束后造成伤害。',
                requirement: '7级冰霜专精'
            },
            'ice-dragon': {
                id: 'ice-dragon',
                name: '冰龙突袭',
                element: 'ice',
                level: 9,
                cost: 65,
                castTime: 1.4,
                cooldown: 22,
                damageMultiplier: 3.2,
                freezeChance: 0.3,
                freezeDuration: 1.5,
                description: '召唤冰龙破土而出，有几率冻结目标。',
                requirement: '9级冰霜专精'
            },

            // 雷电系咒语
            'lightning': {
                id: 'lightning',
                name: '雷击术',
                element: 'thunder',
                level: 1,
                cost: 10,
                castTime: 0.4,
                cooldown: 0,
                damageMultiplier: 1.3,
                critChance: 0.5,
                critMultiplier: 1.5,
                description: '从天空召唤雷电，有几率造成暴击。',
                requirement: '1级雷电专精'
            },
            'chain-lightning': {
                id: 'chain-lightning',
                name: '雷电连锁',
                element: 'thunder',
                level: 3,
                cost: 25,
                castTime: 0.7,
                cooldown: 7,
                damageMultiplier: 1.2,
                chainCount: 3,
                damageReduction: 0.2,
                description: '攻击目标后，雷电会连锁到附近的敌人。',
                requirement: '3级雷电专精'
            },
            'static-field': {
                id: 'static-field',
                name: '静电场',
                element: 'thunder',
                level: 5,
                cost: 30,
                castTime: 0.8,
                cooldown: 11,
                radius: 2.5,
                paralysisDuration: 0.5,
                castSpeedBonus: 0.1,
                description: '在自身周围生成静电场，麻痹接近的敌人并提升施法速度。',
                requirement: '5级雷电专精'
            },
            'thunderstorm': {
                id: 'thunderstorm',
                name: '雷暴降临',
                element: 'thunder',
                level: 7,
                cost: 55,
                castTime: 1.1,
                cooldown: 16,
                damageMultiplier: 1.0,
                duration: 3,
                strikeCount: 3,
                description: '在目标区域召唤雷暴，持续降下雷电。',
                requirement: '7级雷电专精'
            },
            'thunder-fury': {
                id: 'thunder-fury',
                name: '雷神之怒',
                element: 'thunder',
                level: 9,
                cost: 75,
                castTime: 1.6,
                cooldown: 30,
                damageMultiplier: 2.8,
                paralysisChance: 0.4,
                paralysisDuration: 1,
                description: '召唤雷电之力，对全屏敌人造成伤害并有几率麻痹。',
                requirement: '9级雷电专精'
            },

            // 自然系咒语
            'vine-bind': {
                id: 'vine-bind',
                name: '藤蔓缠绕',
                element: 'nature',
                level: 1,
                cost: 10,
                castTime: 0.6,
                cooldown: 0,
                damageMultiplier: 0.9,
                bindDuration: 1.5,
                description: '用藤蔓束缚目标，造成持续伤害。',
                requirement: '1级自然专精'
            },
            'life-drain': {
                id: 'life-drain',
                name: '生命汲取',
                element: 'nature',
                level: 3,
                cost: 20,
                castTime: 0.7,
                cooldown: 9,
                damageMultiplier: 1.0,
                lifestealPercent: 0.5,
                description: '汲取目标的生命力，转化为自身的生命值。',
                requirement: '3级自然专精'
            },
            'nature-blessing': {
                id: 'nature-blessing',
                name: '自然祝福',
                element: 'nature',
                level: 5,
                cost: 35,
                castTime: 0.8,
                cooldown: 14,
                healPerSecond: 5,
                duration: 8,
                defenseBonus: 0.1,
                description: '获得自然的祝福，持续恢复生命值并提升防御力。',
                requirement: '5级自然专精'
            },
            'summon-plants': {
                id: 'summon-plants',
                name: '丛林召唤',
                element: 'nature',
                level: 7,
                cost: 50,
                castTime: 1.2,
                cooldown: 17,
                damageMultiplier: 0.7,
                duration: 6,
                plantCount: 3,
                description: '召唤食人花攻击周围的敌人。',
                requirement: '7级自然专精'
            },
            'nature-fury': {
                id: 'nature-fury',
                name: '自然之怒',
                element: 'nature',
                level: 9,
                cost: 65,
                castTime: 1.5,
                cooldown: 28,
                damageMultiplier: 3.0,
                healPercent: 0.2,
                description: '召唤巨型藤蔓攻击全屏敌人，并恢复自身生命值。',
                requirement: '9级自然专精'
            }
        };
    }

    /**
     * 获取咒语数据
     * @param {string} spellId - 咒语ID
     * @returns {Object} 咒语数据
     */
    getSpell(spellId) {
        return this.spells[spellId] || null;
    }

    /**
     * 获取所有咒语
     * @returns {Array} 咒语数组
     */
    getAllSpells() {
        const spells = [];
        for (const id in this.spells) {
            spells.push(this.spells[id]);
        }
        return spells;
    }

    /**
     * 根据元素获取咒语
     * @param {string} element - 元素类型
     * @returns {Array} 咒语数组
     */
    getSpellsByElement(element) {
        const spells = [];
        for (const id in this.spells) {
            if (this.spells[id].element === element) {
                spells.push(this.spells[id]);
            }
        }
        return spells;
    }
}