import { Game } from './core/Game.js';



// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', () => {
    // 创建游戏实例
    const game = new Game();

    // 初始化游戏
    game.init().catch(error => {
        console.error('游戏初始化失败:', error);
        document.getElementById('loading-text').textContent = '游戏加载失败，请刷新页面重试';
    });
});
