/**
 * 物品系统
 * 负责管理玩家的物品栏和物品
 */
export class InventorySystem {
    constructor(game) {
        this.game = game;
        this.items = [];
        this.maxSlots = 20;
        this.categories = {
            potion: '药剂',
            equipment: '装备',
            material: '材料',
            quest: '任务物品'
        };
    }

    /**
     * 初始化物品栏
     */
    init() {
        // 初始化一些基础物品
        this.addItem({
            id: 'health-potion',
            name: '生命药剂',
            category: 'potion',
            icon: 'src/assets/icons/items/health-potion.png',
            description: '恢复30点生命值',
            stackable: true,
            maxStack: 10,
            value: 20,
            count: 3
        });

        this.addItem({
            id: 'mana-potion',
            name: '魔法药剂',
            category: 'potion',
            icon: 'src/assets/icons/items/mana-potion.png',
            description: '恢复20点魔法值',
            stackable: true,
            maxStack: 10,
            value: 25,
            count: 2
        });
    }

    /**
     * 添加物品
     * @param {Object} item - 物品对象
     * @returns {boolean} 是否添加成功
     */
    addItem(item) {
        // 检查是否是可堆叠物品
        if (item.stackable) {
            // 查找已有的相同物品
            const existingItem = this.items.find(i => i.id === item.id);

            if (existingItem) {
                // 检查是否达到最大堆叠数
                if (existingItem.count < existingItem.maxStack) {
                    // 增加数量
                    existingItem.count = Math.min(existingItem.count + (item.count || 1), existingItem.maxStack);
                    this.game.uiController.showNotification(`获得 ${item.name} x${item.count || 1}`);
                    return true;
                } else {
                    this.game.uiController.showNotification(`${item.name} 已达到最大堆叠数`);
                    return false;
                }
            }
        }

        // 检查物品栏是否有空位
        if (this.items.length >= this.maxSlots) {
            this.game.uiController.showNotification('物品栏已满');
            return false;
        }

        // 添加新物品
        const newItem = {
            id: item.id,
            name: item.name,
            category: item.category,
            icon: item.icon,
            description: item.description,
            stackable: item.stackable || false,
            maxStack: item.maxStack || 1,
            value: item.value || 0,
            count: item.count || 1
        };

        this.items.push(newItem);
        this.game.uiController.showNotification(`获得 ${item.name} x${item.count || 1}`);
        return true;
    }

    /**
     * 移除物品
     * @param {string} itemId - 物品ID
     * @param {number} count - 移除数量
     * @returns {boolean} 是否移除成功
     */
    removeItem(itemId, count = 1) {
        // 查找物品
        const itemIndex = this.items.findIndex(i => i.id === itemId);

        if (itemIndex === -1) {
            return false;
        }

        const item = this.items[itemIndex];

        // 减少数量
        item.count -= count;

        // 如果数量为0或负数，移除物品
        if (item.count <= 0) {
            this.items.splice(itemIndex, 1);
        }

        return true;
    }

    /**
     * 使用物品
     * @param {string} itemId - 物品ID
     * @returns {boolean} 是否使用成功
     */
    useItem(itemId) {
        // 查找物品
        const item = this.items.find(i => i.id === itemId);

        if (!item) {
            return false;
        }

        // 根据物品类型执行不同操作
        switch (item.id) {
            case 'health-potion':
                // 恢复生命值
                const healAmount = 30;
                this.game.playerController.heal(healAmount);
                this.removeItem(itemId, 1);
                this.game.uiController.showNotification(`使用了${item.name}，恢复${healAmount}点生命值`);
                return true;

            case 'mana-potion':
                // 恢复魔法值
                const manaAmount = 20;
                this.game.playerController.mana = Math.min(
                    this.game.playerController.mana + manaAmount,
                    this.game.playerController.maxMana
                );
                this.removeItem(itemId, 1);
                this.game.uiController.showNotification(`使用了${item.name}，恢复${manaAmount}点魔法值`);
                return true;

            default:
                this.game.uiController.showNotification(`无法使用${item.name}`);
                return false;
        }
    }

    /**
     * 获取物品
     * @param {string} itemId - 物品ID
     * @returns {Object|null} 物品对象
     */
    getItem(itemId) {
        return this.items.find(i => i.id === itemId) || null;
    }

    /**
     * 获取指定类别的物品
     * @param {string} category - 物品类别
     * @returns {Array} 物品数组
     */
    getItemsByCategory(category) {
        return this.items.filter(i => i.category === category);
    }

    /**
     * 获取物品栏数据（用于存档）
     * @returns {Array} 物品数组
     */
    getSaveData() {
        return this.items;
    }

    /**
     * 加载物品栏数据（从存档）
     * @param {Array} data - 物品数组
     */
    loadSaveData(data) {
        this.items = data || [];
    }
}
