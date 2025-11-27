// 主应用模块
const App = {
    // 初始化应用
    init: function() {
        console.log('初始化现实版躲猫猫游戏...');
        
        // 初始化游戏状态
        GameStateManager.init();
        
        // 初始化UI
        UIManager.init();
        
        // 初始化Peer连接
        PeerConnectionManager.init();
        
        console.log('游戏初始化完成');
        
        // 显示欢迎消息
        setTimeout(() => {
            Utils.showNotification('欢迎来到现实版躲猫猫游戏！', 'info');
        }, 1000);
    }
};

// 当DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', function() {
    App.init();
});

// 导出到全局作用域
window.App = App;