// 游戏状态管理模块
const GameStateManager = {
    // 游戏状态
    GameState: {
        SETUP: 'setup',
        LOBBY: 'lobby',
        HIDING: 'hiding',
        SEEKING: 'seeking',
        ENDED: 'ended'
    },
    
    // 玩家角色
    PlayerRole: {
        UNASSIGNED: 'unassigned',
        CAT: 'cat',
        MOUSE: 'mouse'
    },
    
    // 游戏配置
    config: {
        hideTime: 5,
        locationInterval: 10,
        locationDuration: 60,
        scanCount: 3,
        scansRemaining: 3
    },
    
    // 当前游戏状态
    currentState: 'setup',
    
    // 当前玩家信息
    currentPlayer: {
        id: '',
        name: '',
        role: 'unassigned',
        isReady: false,
        isHost: false,
        position: null,
        isCaught: false,
        requestingCatch: false
    },
    
    // 所有玩家信息
    players: {},
    
    // 计时器
    timers: {
        gameTimer: null,
        locationUpdateTimer: null,
        locationDisplayTimer: null
    },
    
    // 初始化游戏状态
    init: function() {
        this.currentState = this.GameState.SETUP;
        this.currentPlayer = {
            id: '',
            name: '',
            role: this.PlayerRole.UNASSIGNED,
            isReady: false,
            isHost: false,
            position: null,
            isCaught: false,
            requestingCatch: false
        };
        this.players = {};
        this.resetTimers();
    },
    
    // 重置计时器
    resetTimers: function() {
        for (let timer in this.timers) {
            if (this.timers[timer]) {
                clearInterval(this.timers[timer]);
                this.timers[timer] = null;
            }
        }
    },
    
    // 更新游戏配置
    updateConfig: function(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.config.scansRemaining = this.config.scanCount;
    },
    
    // 设置当前玩家
    setCurrentPlayer: function(playerData) {
        this.currentPlayer = { ...this.currentPlayer, ...playerData };
    },
    
    // 添加玩家
    addPlayer: function(playerId, playerData) {
        this.players[playerId] = { ...playerData };
    },
    
    // 移除玩家
    removePlayer: function(playerId) {
        delete this.players[playerId];
    },
    
    // 更新玩家状态
    updatePlayer: function(playerId, updates) {
        if (this.players[playerId]) {
            this.players[playerId] = { ...this.players[playerId], ...updates };
        }
    },
    
    // 获取玩家角色文本
    getRoleText: function(role) {
        switch (role) {
            case this.PlayerRole.CAT:
                return '猫';
            case this.PlayerRole.MOUSE:
                return '老鼠';
            default:
                return '未分配';
        }
    },
    
    // 检查是否所有玩家都准备
    checkAllReady: function() {
        if (Object.keys(this.players).length === 0) return false;
        
        let allReady = true;
        let hasCat = false;
        
        for (const playerId in this.players) {
            if (!this.players[playerId].isReady) {
                allReady = false;
                break;
            }
            if (this.players[playerId].role === this.PlayerRole.CAT) {
                hasCat = true;
            }
        }
        
        return allReady && hasCat;
    },
    
    // 检查游戏是否结束
    checkGameOver: function() {
        let miceCount = 0;
        for (const playerId in this.players) {
            if (this.players[playerId].role === this.PlayerRole.MOUSE && 
                !this.players[playerId].isCaught) {
                miceCount++;
            }
        }
        
        return miceCount === 0;
    },
    
    // 重置游戏状态（不重置房间）
    resetGameState: function() {
        this.resetTimers();
        this.currentState = this.GameState.LOBBY;
        
        // 重置当前玩家的游戏状态
        this.currentPlayer.role = this.PlayerRole.UNASSIGNED;
        this.currentPlayer.position = null;
        this.currentPlayer.isCaught = false;
        this.currentPlayer.requestingCatch = false;
        
        // 房主保持准备状态，普通玩家重置准备状态
        if (!this.currentPlayer.isHost) {
            this.currentPlayer.isReady = false;
        }
        
        // 重置所有玩家的游戏状态
        for (const playerId in this.players) {
            this.players[playerId].role = this.PlayerRole.UNASSIGNED;
            this.players[playerId].position = null;
            this.players[playerId].isCaught = false;
            this.players[playerId].requestingCatch = false;
            
            // 房主保持准备状态，普通玩家重置准备状态
            if (!this.players[playerId].isHost) {
                this.players[playerId].isReady = false;
            }
        }
        
        // 重置游戏配置
        this.config.scansRemaining = this.config.scanCount;
    },
    
    // 完全重置游戏
    resetGame: function() {
        this.resetTimers();
        this.currentState = this.GameState.SETUP;
        this.players = {};
        
        this.currentPlayer = {
            id: this.currentPlayer.id,
            name: this.currentPlayer.name,
            role: this.PlayerRole.UNASSIGNED,
            isReady: false,
            isHost: false,
            position: null,
            isCaught: false,
            requestingCatch: false
        };
    }
};

// 导出到全局作用域
window.GameStateManager = GameStateManager;