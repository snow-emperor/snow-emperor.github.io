/**
 * 咒语碰撞检测模块
 * 处理咒语与目标的碰撞逻辑
 */
export class SpellCollision {
    constructor(game) {
        this.game = game;
    }

    /**
     * 检测咒语的目标
     * @param {Object} spell - 咒语数据
     * @param {Object} caster - 施法者
     * @returns {Array} 目标列表
     */
    detectTargets(spell, caster) {
        const targets = [];
        const enemies = this.game.enemyController.enemies;

        for (const enemy of enemies) {
            const distanceSquared = this.calculateDistanceSquared(caster, enemy);

            // 根据咒语类型判断是否命中
            if (this.isTargetInRange(spell, caster, enemy, distanceSquared)) {
                targets.push(enemy);
            }
        }

        return targets;
    }

    /**
     * 计算两点间距离
     * @param {Object} a - 第一个对象
     * @param {Object} b - 第二个对象
     * @returns {number} 距离
     */
    calculateDistance(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 计算两点间距离的平方
     * @param {Object} a - 第一个对象
     * @param {Object} b - 第二个对象
     * @returns {number} 距离的平方
     */
    calculateDistanceSquared(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return dx * dx + dy * dy;
    }

    /**
     * 判断目标是否在咒语范围内
     * @param {Object} spell - 咒语数据
     * @param {Object} caster - 施法者
     * @param {Object} target - 目标
     * @param {number} distanceSquared - 距离的平方
     * @returns {boolean} 是否在范围内
     */
    isTargetInRange(spell, caster, target, distanceSquared) {
        // 单体目标咒语
        if (!spell.radius) {
            return distanceSquared <= 25; // 5^2
        }

        // 范围咒语
        return distanceSquared <= spell.radius * spell.radius;
    }
}
