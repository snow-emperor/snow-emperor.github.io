/**
 * 事件总线
 * 用于游戏各模块之间的通信
 */
export class EventBus {
    constructor() {
        this.listeners = {};
    }

    /**
     * 注册事件监听器
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     * @param {Object} context - 上下文对象（可选）
     */
    on(event, callback, context = null) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }

        this.listeners[event].push({
            callback,
            context
        });
    }

    /**
     * 移除事件监听器
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     */
    off(event, callback) {
        if (!this.listeners[event]) {
            return;
        }

        const index = this.listeners[event].findIndex(listener => listener.callback === callback);
        if (index !== -1) {
            this.listeners[event].splice(index, 1);
        }
    }

    /**
     * 触发事件
     * @param {string} event - 事件名称
     * @param {...any} args - 传递给监听器的参数
     */
    emit(event, ...args) {
        if (!this.listeners[event]) {
            return;
        }

        this.listeners[event].forEach(listener => {
            try {
                if (listener.context) {
                    listener.callback.call(listener.context, ...args);
                } else {
                    listener.callback(...args);
                }
            } catch (error) {
                console.error(`事件处理错误 (${event}):`, error);
            }
        });
    }

    /**
     * 清除所有事件监听器
     */
    clear() {
        this.listeners = {};
    }
}
