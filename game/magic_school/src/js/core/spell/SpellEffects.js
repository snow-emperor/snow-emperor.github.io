/**
 * 咒语特效模块
 * 处理咒语的视觉效果和状态影响
 */
export class SpellEffects {
    constructor(game) {
        this.game = game;
        this.activeEffects = [];
    }

    /**
     * 创建咒语效果
     * @param {Object} spell - 咒语数据
     * @param {Object} caster - 施法者
     * @param {Array} targets - 目标列表
     */
    createEffect(spell, caster, targets) {
        // 根据咒语类型创建相应的视觉效果
        switch (spell.element) {
            case 'fire':
                this.createFireEffect(spell, caster, targets);
                break;
            case 'ice':
                this.createIceEffect(spell, caster, targets);
                break;
            case 'thunder':
                this.createThunderEffect(spell, caster, targets);
                break;
            case 'nature':
                this.createNatureEffect(spell, caster, targets);
                break;
        }

        // 添加状态效果
        this.applyStatusEffects(spell, targets);
    }

    /**
     * 创建火焰效果
     * @param {Object} spell - 咒语数据
     * @param {Object} caster - 施法者
     * @param {Array} targets - 目标列表
     */
    createFireEffect(spell, caster, targets) {
        // 创建火焰粒子效果
        this.game.particleSystem.createParticles({
            type: 'fire',
            x: caster.x,
            y: caster.y,
            count: 10,
            speed: 2
        });
    }

    /**
     * 创建冰霜效果
     * @param {Object} spell - 咒语数据
     * @param {Object} caster - 施法者
     * @param {Array} targets - 目标列表
     */
    createIceEffect(spell, caster, targets) {
        // 创建冰霜粒子效果
        this.game.particleSystem.createParticles({
            type: 'ice',
            x: caster.x,
            y: caster.y,
            count: 8,
            speed: 1.5
        });
    }

    /**
     * 创建雷电效果
     * @param {Object} spell - 咒语数据
     * @param {Object} caster - 施法者
     * @param {Array} targets - 目标列表
     */
    createThunderEffect(spell, caster, targets) {
        // 创建雷电粒子效果
        this.game.particleSystem.createParticles({
            type: 'thunder',
            x: caster.x,
            y: caster.y,
            count: 12,
            speed: 3
        });
    }

    /**
     * 创建自然效果
     * @param {Object} spell - 咒语数据
     * @param {Object} caster - 施法者
     * @param {Array} targets - 目标列表
     */
    createNatureEffect(spell, caster, targets) {
        // 创建自然粒子效果
        this.game.particleSystem.createParticles({
            type: 'nature',
            x: caster.x,
            y: caster.y,
            count: 10,
            speed: 1.8
        });
    }

    /**
     * 应用状态效果
     * @param {Object} spell - 咒语数据
     * @param {Array} targets - 目标列表
     */
    applyStatusEffects(spell, targets) {
        for (const target of targets) {
            // 减速效果
            if (spell.slowDuration) {
                target.addEffect({
                    type: 'slow',
                    duration: spell.slowDuration,
                    value: 0.5
                });
            }

            // 冻结效果
            if (spell.freezeDuration && Math.random() < (spell.freezeChance || 1)) {
                target.addEffect({
                    type: 'freeze',
                    duration: spell.freezeDuration
                });
            }

            // 麻痹效果
            if (spell.paralysisDuration && Math.random() < spell.paralysisChance) {
                target.addEffect({
                    type: 'paralysis',
                    duration: spell.paralysisDuration
                });
            }

            // 束缚效果
            if (spell.bindDuration) {
                target.addEffect({
                    type: 'bind',
                    duration: spell.bindDuration
                });
            }
        }
    }
}