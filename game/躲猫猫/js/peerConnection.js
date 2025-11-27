// P2P连接管理模块
const PeerConnectionManager = {
    // PeerJS实例
    peer: null,
    
    // 连接列表
    connections: {},
    
    // 房主连接（对于非房主玩家）
    hostConnection: null,
    
    // 消息处理器映射
    messageHandlers: {},
    
    // 初始化PeerJS
    init: function() {
        this.peer = new Peer();
        
        this.peer.on('open', (id) => {
            console.log('My peer ID is: ' + id);
            GameStateManager.currentPlayer.id = id;
            
            // 触发自定义事件
            this.triggerEvent('peerOpen', { id });
        });
        
        this.peer.on('connection', (conn) => {
            console.log('收到连接: ' + conn.peer);
            this.setupConnection(conn);
        });
        
        this.peer.on('error', (err) => {
            console.error('PeerJS错误:', err);
            Utils.showNotification('连接错误: ' + err.message, 'error');
            
            // 触发自定义事件
            this.triggerEvent('peerError', { error: err });
        });
        
        // 初始化消息处理器
        this.initMessageHandlers();
    },
    
    // 初始化消息处理器
    initMessageHandlers: function() {
        this.messageHandlers = {
            'gameState': this.handleGameState,
            'playerJoin': this.handlePlayerJoin,
            'playersUpdate': this.handlePlayersUpdate,
            'playerReady': this.handlePlayerReady,
            'assignCat': this.handleAssignCat,
            'startGame': this.handleStartGame,
            'playerPosition': this.handlePlayerPosition,
            'requestCatch': this.handleRequestCatch,
            'cancelCatch': this.handleCancelCatch,
            'playerCaught': this.handlePlayerCaught,
            'scanUpdate': this.handleScanUpdate,
            'gameOver': this.handleGameOver,
            'backToLobby': this.handleBackToLobby
        };
    },
    
    // 设置连接
    setupConnection: function(conn) {
        conn.on('open', () => {
            console.log('连接已建立: ' + conn.peer);
            this.connections[conn.peer] = conn;
            
            // 如果是房主，保存连接
            if (GameStateManager.currentPlayer.isHost) {
                // 发送当前游戏状态给新玩家
                this.sendToPlayer(conn, {
                    type: 'gameState',
                    state: GameStateManager.currentState,
                    players: GameStateManager.players,
                    config: GameStateManager.config
                });
            } else if (conn.peer === document.getElementById('displayRoomId').textContent) {
                // 如果是玩家，保存房主连接
                this.hostConnection = conn;
                // 发送加入请求
                this.sendToHost({
                    type: 'playerJoin',
                    player: GameStateManager.currentPlayer
                });
            }
            
            // 触发自定义事件
            this.triggerEvent('connectionOpen', { connection: conn });
        });
        
        conn.on('data', (data) => {
            this.handleMessage(data, conn);
        });
        
        conn.on('close', () => {
            console.log('连接关闭: ' + conn.peer);
            delete this.connections[conn.peer];
            
            if (GameStateManager.currentPlayer.isHost) {
                // 从玩家列表中移除
                GameStateManager.removePlayer(conn.peer);
                
                // 触发自定义事件
                this.triggerEvent('playerLeft', { playerId: conn.peer });
            } else if (conn.peer === document.getElementById('displayRoomId').textContent) {
                // 房主断开连接
                Utils.showNotification('房主已断开连接，游戏结束', 'error');
                
                // 触发自定义事件
                this.triggerEvent('hostDisconnected');
            }
        });
        
        conn.on('error', (err) => {
            console.error('连接错误:', err);
            Utils.showNotification('连接错误: ' + err.message, 'error');
        });
    },
    
    // 连接到房主
    connectToHost: function(roomId) {
        this.hostConnection = this.peer.connect(roomId);
        this.setupConnection(this.hostConnection);
    },
    
    // 处理收到的消息
    handleMessage: function(data, conn) {
        console.log('收到消息:', data);
        
        const handler = this.messageHandlers[data.type];
        if (handler) {
            handler.call(this, data, conn);
        } else {
            console.warn('未知消息类型:', data.type);
        }
    },
    
    // 消息处理器
    handleGameState: function(data, conn) {
        GameStateManager.currentState = data.state;
        GameStateManager.players = data.players;
        GameStateManager.config = data.config;
        
        // 触发自定义事件
        this.triggerEvent('gameStateUpdated', { 
            state: data.state, 
            players: data.players, 
            config: data.config 
        });
    },
    
    handlePlayerJoin: function(data, conn) {
        if (GameStateManager.currentPlayer.isHost) {
            // 添加新玩家
            GameStateManager.addPlayer(data.player.id, {
                ...data.player,
                role: GameStateManager.PlayerRole.UNASSIGNED,
                isReady: false,
                position: null,
                isCaught: false,
                requestingCatch: false
            });
            
            // 广播更新后的玩家列表
            this.broadcast({
                type: 'playersUpdate',
                players: GameStateManager.players
            });
            
            // 触发自定义事件
            this.triggerEvent('playerJoined', { player: data.player });
        }
    },
    
    handlePlayersUpdate: function(data, conn) {
        GameStateManager.players = data.players;
        
        // 触发自定义事件
        this.triggerEvent('playersUpdated', { players: data.players });
    },
    
    handlePlayerReady: function(data, conn) {
        if (GameStateManager.currentPlayer.isHost) {
            GameStateManager.updatePlayer(data.playerId, { isReady: data.isReady });
            
            // 触发自定义事件
            this.triggerEvent('playerReadyChanged', { 
                playerId: data.playerId, 
                isReady: data.isReady 
            });
            
            // 广播准备状态更新
            this.broadcast({
                type: 'playersUpdate',
                players: GameStateManager.players
            });
        }
    },
    
    handleAssignCat: function(data, conn) {
        if (GameStateManager.currentPlayer.isHost) {
            this.assignCatToPlayer(data.catPlayerId);
        } else {
            // 更新自己的角色
            if (data.catPlayerId === GameStateManager.currentPlayer.id) {
                GameStateManager.currentPlayer.role = GameStateManager.PlayerRole.CAT;
            } else {
                GameStateManager.currentPlayer.role = GameStateManager.PlayerRole.MOUSE;
            }
            
            // 触发自定义事件
            this.triggerEvent('roleAssigned', { 
                catPlayerId: data.catPlayerId 
            });
        }
    },
    
    handleStartGame: function(data, conn) {
        // 触发自定义事件
        this.triggerEvent('gameStarted', { 
            state: data.state,
            players: data.players,
            config: data.config,
            startTime: data.startTime
        });
    },
    
    handlePlayerPosition: function(data, conn) {
        if (GameStateManager.currentPlayer.isHost) {
            // 更新玩家位置
            GameStateManager.updatePlayer(data.playerId, { position: data.position });
            
            // 如果是猫，广播位置给所有玩家
            if (GameStateManager.players[data.playerId].role === GameStateManager.PlayerRole.CAT) {
                this.broadcast({
                    type: 'playerPosition',
                    playerId: data.playerId,
                    position: data.position,
                    role: GameStateManager.PlayerRole.CAT
                });
            }
            // 如果是老鼠且游戏处于寻找阶段，根据规则广播位置
            else if (GameStateManager.players[data.playerId].role === GameStateManager.PlayerRole.MOUSE && 
                     GameStateManager.currentState === GameStateManager.GameState.SEEKING) {
                // 这里简化处理，实际应根据时间间隔规则广播
                this.broadcast({
                    type: 'playerPosition',
                    playerId: data.playerId,
                    position: data.position,
                    role: GameStateManager.PlayerRole.MOUSE
                });
            }
        } else {
            // 更新其他玩家位置
            if (GameStateManager.players[data.playerId]) {
                GameStateManager.updatePlayer(data.playerId, { position: data.position });
            }
            
            // 触发自定义事件
            this.triggerEvent('playerPositionUpdated', { 
                playerId: data.playerId, 
                position: data.position,
                role: data.role
            });
        }
    },
    
    handleRequestCatch: function(data, conn) {
        if (GameStateManager.currentPlayer.isHost) {
            this.handleRequestCatchHost(data.playerId);
        } else {
            // 更新玩家请求被抓状态
            if (GameStateManager.players[data.playerId]) {
                GameStateManager.updatePlayer(data.playerId, { requestingCatch: true });
            }
            
            // 触发自定义事件
            this.triggerEvent('playerRequestedCatch', { playerId: data.playerId });
        }
    },
    
    handleCancelCatch: function(data, conn) {
        if (GameStateManager.currentPlayer.isHost) {
            this.handleCancelCatchHost(data.playerId);
        } else {
            // 更新玩家请求被抓状态
            if (GameStateManager.players[data.playerId]) {
                GameStateManager.updatePlayer(data.playerId, { requestingCatch: false });
            }
            
            // 触发自定义事件
            this.triggerEvent('playerCanceledCatch', { playerId: data.playerId });
        }
    },
    
    handlePlayerCaught: function(data, conn) {
        if (GameStateManager.currentPlayer.isHost) {
            this.handlePlayerCaughtHost(data.playerId, data.catPlayerId);
        } else {
            // 更新玩家被抓状态
            if (GameStateManager.players[data.playerId]) {
                GameStateManager.updatePlayer(data.playerId, { 
                    isCaught: true,
                    role: GameStateManager.PlayerRole.CAT,
                    requestingCatch: false
                });
            }
            
            // 如果自己被抓，更新角色
            if (data.playerId === GameStateManager.currentPlayer.id) {
                GameStateManager.currentPlayer.role = GameStateManager.PlayerRole.CAT;
                GameStateManager.currentPlayer.isCaught = true;
                GameStateManager.currentPlayer.requestingCatch = false;
                
                // 触发自定义事件
                this.triggerEvent('playerCaught', { 
                    playerId: data.playerId,
                    isSelf: true
                });
            } else {
                // 触发自定义事件
                this.triggerEvent('playerCaught', { 
                    playerId: data.playerId,
                    isSelf: false
                });
            }
        }
    },
    
    handleScanUpdate: function(data, conn) {
        GameStateManager.config.scansRemaining = data.scansRemaining;
        
        // 触发自定义事件
        this.triggerEvent('scanCountUpdated', { 
            scansRemaining: data.scansRemaining 
        });
    },
    
    handleGameOver: function(data, conn) {
        Utils.showNotification('游戏结束！' + data.message, 'info');
        
        // 触发自定义事件
        this.triggerEvent('gameOver', { message: data.message });
    },
    
    handleBackToLobby: function(data, conn) {
        // 触发自定义事件
        this.triggerEvent('backToLobby');
    },
    
    // 房主处理请求被抓
    handleRequestCatchHost: function(playerId) {
        if (!GameStateManager.currentPlayer.isHost) return;
        
        GameStateManager.updatePlayer(playerId, { requestingCatch: true });
        
        // 广播玩家状态更新
        this.broadcast({
            type: 'playersUpdate',
            players: GameStateManager.players
        });
    },
    
    // 房主处理取消被抓请求
    handleCancelCatchHost: function(playerId) {
        if (!GameStateManager.currentPlayer.isHost) return;
        
        GameStateManager.updatePlayer(playerId, { requestingCatch: false });
        
        // 广播玩家状态更新
        this.broadcast({
            type: 'playersUpdate',
            players: GameStateManager.players
        });
    },
    
    // 房主处理玩家被抓
    handlePlayerCaughtHost: function(playerId, catPlayerId) {
        if (!GameStateManager.currentPlayer.isHost) return;
        
        // 更新玩家状态
        GameStateManager.updatePlayer(playerId, {
            isCaught: true,
            role: GameStateManager.PlayerRole.CAT,
            requestingCatch: false
        });
        
        // 广播被抓消息
        this.broadcast({
            type: 'playerCaught',
            playerId: playerId,
            catPlayerId: catPlayerId
        });
        
        // 检查游戏是否结束
        if (GameStateManager.checkGameOver()) {
            this.broadcast({
                type: 'gameOver',
                message: '所有老鼠都被抓住了，猫获胜！'
            });
            
            Utils.showNotification('游戏结束！所有老鼠都被抓住了，猫获胜！', 'success');
        }
        
        // 触发自定义事件
        this.triggerEvent('playerCaughtByHost', { 
            playerId: playerId, 
            catPlayerId: catPlayerId 
        });
    },
    
    // 分配猫给玩家
    assignCatToPlayer: function(catPlayerId) {
        if (!GameStateManager.currentPlayer.isHost) return;
        
        // 重置所有玩家角色为老鼠
        for (const playerId in GameStateManager.players) {
            GameStateManager.updatePlayer(playerId, { role: GameStateManager.PlayerRole.MOUSE });
        }
        
        // 设置猫
        GameStateManager.updatePlayer(catPlayerId, { role: GameStateManager.PlayerRole.CAT });
        
        // 更新当前玩家的角色（如果是房主自己）
        if (catPlayerId === GameStateManager.currentPlayer.id) {
            GameStateManager.currentPlayer.role = GameStateManager.PlayerRole.CAT;
        }
        
        // 广播猫的分配
        this.broadcast({
            type: 'assignCat',
            catPlayerId: catPlayerId
        });
        
        // 触发自定义事件
        this.triggerEvent('catAssigned', { catPlayerId: catPlayerId });
        
        // 更新UI
        UIManager.updatePlayersList();
    },
    
    // 发送消息给房主
    sendToHost: function(message) {
        if (this.hostConnection) {
            this.hostConnection.send(message);
        }
    },
    
    // 发送消息给特定玩家
    sendToPlayer: function(conn, message) {
        conn.send(message);
    },
    
    // 广播消息给所有玩家
    broadcast: function(message) {
        for (const connId in this.connections) {
            connections[connId].send(message);
        }
    },
    
    // 事件系统
    events: {},
    
    // 监听事件
    on: function(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
    },
    
    // 触发事件
    triggerEvent: function(eventName, data) {
        if (this.events[eventName]) {
            this.events[eventName].forEach(callback => {
                callback(data);
            });
        }
    },
    
    // 关闭所有连接
    closeAllConnections: function() {
        for (const connId in this.connections) {
            this.connections[connId].close();
        }
        this.connections = {};
        this.hostConnection = null;
    }
};

// 导出到全局作用域
window.PeerConnectionManager = PeerConnectionManager;