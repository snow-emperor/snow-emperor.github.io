/**
 * 咒语学习模块
 * 负责处理咒语的学习逻辑
 */
export class SpellLearning {
    constructor(game, spellData) {
        this.game = game;
        this.spellData = spellData;
    }

    /**
     * 检查是否可以学习咒语
     * @param {string} spellId - 咒语ID
     * @returns {boolean} 是否可以学习
     */
    canLearnSpell(spellId) {
        const spell = this.spellData.getSpell(spellId);
        if (!spell) {
            return false;
        }

        const player = this.game.playerController;

        // 检查专精
        if (player.specialization !== spell.element) {
            return false;
        }

        // 检查等级
        if (player.level < spell.level) {
            return false;
        }

        // 检查是否已学习
        if (player.learnedSpells.includes(spellId)) {
            return false;
        }

        return true;
    }

    /**
     * 学习咒语
     * @param {string} spellId - 咒语ID
     */
    learnSpell(spellId) {
        if (!this.canLearnSpell(spellId)) {
            return false;
        }

        const player = this.game.playerController;

        // 添加到已学习列表
        player.learnedSpells.push(spellId);

        // 如果没有选中的咒语，设置为当前选中的咒语
        if (!player.selectedSpell) {
            player.selectedSpell = spellId;
        }

        // 更新UI
        this.game.uiController.updateSpellsPanel();

        return true;
    }
}