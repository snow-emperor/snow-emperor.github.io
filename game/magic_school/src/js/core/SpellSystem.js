/**
 * 咒语系统
 * 负责管理统筹咒语数据、碰撞检测、效果应用、学习和施放等功能
 */
import { SpellData } from './spell/SpellData.js';
import { SpellCollision } from './spell/SpellCollision.js';
import { SpellEffects } from './spell/SpellEffects.js';
import { SpellLearning } from './spell/SpellLearning.js';
import { SpellCasting } from './spell/SpellCasting.js';

export class SpellSystem {
    constructor(game) {
        this.game = game;
        this.spellData = new SpellData();
        this.collision = new SpellCollision(game);
        this.effects = new SpellEffects(game);
        this.learning = new SpellLearning(game, this.spellData);
        this.casting = new SpellCasting(game, this.spellData, this.collision, this.effects);
    }

    /**
     * 检查是否可以学习咒语
     * @param {string} spellId - 咒语ID
     * @returns {boolean} 是否可以学习
     */
    canLearnSpell(spellId) {
        return this.learning.canLearnSpell(spellId);
    }

    /**
     * 学习咒语
     * @param {string} spellId - 咒语ID
     */
    learnSpell(spellId) {
        return this.learning.learnSpell(spellId);
    }

    /**
     * 施放咒语
     * @param {string} spellId - 咒语ID
     * @param {Object} caster - 施法者
     */
    castSpell(spellId, caster) {
        this.casting.castSpell(spellId, caster);
    }
}