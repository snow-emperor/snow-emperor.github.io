// 界面管理模块
const UIManager = {
    // DOM元素引用
    elements: {},
    
    // 初始化UI
    init: function() {
        this.cacheDOM();
        this.bindEvents();
        this.setupEventListeners();
    },
    
    // 缓存DOM元素
    cacheDOM: function() {
        this.elements = {
            // 游戏阶段
            setupPhase: document.getElementById('setupPhase'),
            lobbyPhase: document.getElementById('lobbyPhase'),
            gamePhase: document.getElementById('gamePhase'),
            
            // 设置阶段元素
            playerNameInput: document.getElementById('playerName'),
            roomActionSelect: document.getElementById('roomAction'),
            roomIdGroup: document.getElementById('roomIdGroup'),
            gameConfigDiv: document.getElementById('gameConfig'),
            roomIdInput: document.getElementById('roomId'),
            startBtn: document.getElementById('startBtn'),
            hideTimeInput: document.getElementById('hideTime'),
            locationIntervalInput: document.getElementById('locationInterval'),
            locationDurationInput: document.getElementById('locationDuration'),
            scanCountInput: document.getElementById('scanCount'),
            
            // 大厅阶段元素
            displayRoomId: document.getElementById('displayRoomId'),
            hostName: document.getElementById('hostName'),
            playersContainer: document.getElementById('playersContainer'),
            hostControls: document.getElementById('hostControls'),
            playerControls: document.getElementById('playerControls'),
            randomCatBtn: document.getElementById('randomCatBtn'),
            startGameBtn: document.getElementById('startGameBtn'),
            readyBtn: document.getElementById('readyBtn'),
            
            // 游戏阶段元素
            gameStateText: document.getElementById('gameStateText'),
            timerDisplay: document.getElementById('timer'),
            playerRole: document.getElementById('playerRole'),
            scanCountDisplay: document.getElementById('scanCountDisplay'),
            statusMessage: document.getElementById('statusMessage'),
            gameMap: document.getElementById('gameMap'),
            caughtBtn: document.getElementById('caughtBtn'),
            leaveGameBtn: document.getElementById('leaveGameBtn'),
            gamePlayersContainer: document.getElementById('gamePlayersContainer')
        };
    },
    
    // 绑定事件
    bindEvents: function() {
        // 设置阶段事件
        this.elements.roomActionSelect.addEventListener('change', this.toggleRoomAction.bind(this));
        this.elements.startBtn.addEventListener('click', this.handleStart.bind(this));
        
        // 大厅阶段事件
        this.elements.randomCatBtn.addEventListener('click', this.handleRandomCat.bind(this));
        this.elements.startGameBtn.addEventListener('click', this.handleStartGame.bind(this));
        this.elements.readyBtn.addEventListener('click', this.handleToggleReady.bind(this));
        
        // 游戏阶段事件
        this.elements.caughtBtn.addEventListener('click', this.handleCaught.bind(this));
        this.elements.leaveGameBtn.addEventListener('click', this.handleLeaveGame.bind(this));
        
        // Peer连接事件
        PeerConnectionManager.on('peerOpen', this.onPeerOpen.bind(this));
        PeerConnectionManager.on('peerError', this.onPeerError.bind(this));
        PeerConnectionManager.on('connectionOpen', this.onConnectionOpen.bind(this));
        PeerConnectionManager.on('playerJoined', this.onPlayerJoined.bind(this));
        PeerConnectionManager.on('playerLeft', this.onPlayerLeft.bind(this));
        PeerConnectionManager.on('hostDisconnected', this.onHostDisconnected.bind(this));
        PeerConnectionManager.on('gameStateUpdated', this.onGameStateUpdated.bind(this));
        PeerConnectionManager.on('playersUpdated', this.onPlayersUpdated.bind(this));
        PeerConnectionManager.on('playerReadyChanged', this.onPlayerReadyChanged.bind(this));
        PeerConnectionManager.on('roleAssigned', this.onRoleAssigned.bind(this));
        PeerConnectionManager.on('gameStarted', this.onGameStarted.bind(this));
        PeerConnectionManager.on('playerPositionUpdated', this.onPlayerPositionUpdated.bind(this));
        PeerConnectionManager.on('playerRequestedCatch', this.onPlayerRequestedCatch.bind(this));
        PeerConnectionManager.on('playerCanceledCatch', this.onPlayerCanceledCatch.bind(this));
        PeerConnectionManager.on('playerCaught', this.onPlayerCaught.bind(this));
        PeerConnectionManager.on('scanCountUpdated', this.onScanCountUpdated.bind(this));
        PeerConnectionManager.on('gameOver', this.onGameOver.bind(this));
        PeerConnectionManager.on('backToLobby', this.onBackToLobby.bind(this));
        PeerConnectionManager.on('catAssigned', this.onCatAssigned.bind(this));
        PeerConnectionManager.on('playerCaughtByHost', this.onPlayerCaughtByHost.bind(this));
    },
    
    // 设置事件监听器
    setupEventListeners: function() {
        // 输入验证
        this.elements.playerNameInput.addEventListener('input', () => {
            const validation = Utils.validateNickname(this.elements.playerNameInput.value);
            if (!validation.valid) {
                this.elements.playerNameInput.style.borderColor = '#f44336';
            } else {
                this.elements.playerNameInput.style.borderColor = '';
            }
        });
    },
    
    // 切换创建/加入房间UI
    toggleRoomAction: function() {
        if (this.elements.roomActionSelect.value === 'create') {
            this.elements.roomIdGroup.style.display = 'none';
            this.elements.gameConfigDiv.style.display = 'block';
        } else {
            this.elements.roomIdGroup.style.display = 'block';
            this.elements.gameConfigDiv.style.display = 'none';
        }
    },
    
    // 处理开始按钮点击
    handleStart: function() {
        const name = this.elements.playerNameInput.value.trim();
        const validation = Utils.validateNickname(name);
        
        if (!validation.valid) {
            Utils.showNotification(validation.message, 'error');
            return;
        }
        
        GameStateManager.currentPlayer.name = name;
        
        if (this.elements.roomActionSelect.value === 'create') {
            this.createRoom();
        } else {
            const roomId = this.elements.roomIdInput.value.trim();
            if (!roomId) {
                Utils.showNotification('请输入房间号', 'error');
                return;
            }
            this.joinRoom(roomId);
        }
    },
    
    // 创建房间
    createRoom: function() {
        // 保存游戏配置
        GameStateManager.updateConfig({
            hideTime: parseInt(this.elements.hideTimeInput.value),
            locationInterval: parseInt(this.elements.locationIntervalInput.value),
            locationDuration: parseInt(this.elements.locationDurationInput.value),
            scanCount: parseInt(this.elements.scanCountInput.value)
        });
        
        GameStateManager.currentPlayer.isHost = true;
        GameStateManager.currentPlayer.role = GameStateManager.PlayerRole.UNASSIGNED;
        GameStateManager.currentPlayer.isReady = true; // 房主默认准备
        
        // 使用自己的peer ID作为房间号
        const roomId = GameStateManager.currentPlayer.id;
        this.elements.displayRoomId.textContent = roomId;
        this.elements.hostName.textContent = GameStateManager.currentPlayer.name;
        
        // 添加自己到玩家列表
        GameStateManager.addPlayer(GameStateManager.currentPlayer.id, { ...GameStateManager.currentPlayer });
        
        // 切换到大厅界面
        this.switchPhase(GameStateManager.GameState.LOBBY);
        this.updatePlayersList();
        
        // 显示房主控制按钮
        this.elements.hostControls.style.display = 'block';
        this.elements.playerControls.style.display = 'none';
        
        Utils.showNotification('房间创建成功！房间号: ' + roomId, 'success');
    },
    
    // 加入房间
    joinRoom: function(roomId) {
        GameStateManager.currentPlayer.isHost = false;
        
        // 连接到房主
        PeerConnectionManager.connectToHost(roomId);
        
        this.elements.displayRoomId.textContent = roomId;
        this.elements.hostName.textContent = '连接中...';
        
        // 切换到大厅界面
        this.switchPhase(GameStateManager.GameState.LOBBY);
        
        // 显示玩家控制按钮
        this.elements.hostControls.style.display = 'none';
        this.elements.playerControls.style.display = 'block';
    },
    
    // 处理随机指定猫
    handleRandomCat: function() {
        if (!GameStateManager.currentPlayer.isHost) return;
        
        // 随机选择一名玩家作为猫
        const playerIds = Object.keys(GameStateManager.players);
        if (playerIds.length === 0) return;
        
        const randomIndex = Math.floor(Math.random() * playerIds.length);
        const catPlayerId = playerIds[randomIndex];
        
        PeerConnectionManager.assignCatToPlayer(catPlayerId);
    },
    
    // 处理开始游戏
    handleStartGame: function() {
        if (!GameStateManager.currentPlayer.isHost) return;
        
        GameStateManager.currentState = GameStateManager.GameState.HIDING;
        
        // 获取玩家位置
        this.getPlayerLocation();
        
        // 广播游戏开始
        PeerConnectionManager.broadcast({
            type: 'startGame',
            state: GameStateManager.currentState,
            players: GameStateManager.players,
            config: GameStateManager.config,
            startTime: Date.now()
        });
        
        // 开始游戏计时
        this.startGameTimer();
        
        // 切换到游戏界面
        this.switchPhase(GameStateManager.GameState.HIDING);
        this.updateGameInterface();
        
        Utils.showNotification('游戏开始！', 'success');
    },
    
    // 处理切换准备状态
    handleToggleReady: function() {
        GameStateManager.currentPlayer.isReady = !GameStateManager.currentPlayer.isReady;
        this.elements.readyBtn.textContent = GameStateManager.currentPlayer.isReady ? 
            '<i class="fas fa-times"></i> 取消准备' : 
            '<i class="fas fa-check"></i> 准备';
        
        PeerConnectionManager.sendToHost({
            type: 'playerReady',
            playerId: GameStateManager.currentPlayer.id,
            isReady: GameStateManager.currentPlayer.isReady
        });
    },
    
    // 处理被抓
    handleCaught: function() {
        if (GameStateManager.currentPlayer.role !== GameStateManager.PlayerRole.MOUSE || 
            GameStateManager.currentPlayer.isCaught) return;
        
        if (GameStateManager.currentPlayer.requestingCatch) {
            // 取消被抓请求
            GameStateManager.currentPlayer.requestingCatch = false;
            PeerConnectionManager.sendToHost({
                type: 'cancelCatch',
                playerId: GameStateManager.currentPlayer.id
            });
        } else {
            // 请求被抓
            GameStateManager.currentPlayer.requestingCatch = true;
            PeerConnectionManager.sendToHost({
                type: 'requestCatch',
                playerId: GameStateManager.currentPlayer.id
            });
        }
        
        this.updateGameInterface();
    },
    
    // 处理离开游戏
    handleLeaveGame: function() {
        if (confirm('确定要离开游戏吗？')) {
            if (GameStateManager.currentPlayer.isHost) {
                // 房主离开游戏，通知所有玩家返回大厅
                PeerConnectionManager.broadcast({
                    type: 'backToLobby'
                });
                // 房主自己也返回大厅
                this.switchPhase(GameStateManager.GameState.LOBBY);
                GameStateManager.resetGameState();
                this.updatePlayersList();
            } else {
                // 普通玩家离开游戏，返回大厅
                this.switchPhase(GameStateManager.GameState.LOBBY);
                GameStateManager.resetGameState();
                this.updatePlayersList();
            }
        }
    },
    
    // 切换游戏阶段
    switchPhase: function(phase) {
        // 隐藏所有阶段
        this.elements.setupPhase.classList.remove('active');
        this.elements.lobbyPhase.classList.remove('active');
        this.elements.gamePhase.classList.remove('active');
        
        // 显示当前阶段
        switch (phase) {
            case GameStateManager.GameState.SETUP:
                this.elements.setupPhase.classList.add('active');
                break;
            case GameStateManager.GameState.LOBBY:
                this.elements.lobbyPhase.classList.add('active');
                break;
            case GameStateManager.GameState.HIDING:
            case GameStateManager.GameState.SEEKING:
                this.elements.gamePhase.classList.add('active');
                break;
        }
        
        GameStateManager.currentState = phase;
    },
    
    // 更新玩家列表
    updatePlayersList: function() {
        this.elements.playersContainer.innerHTML = '';
        
        for (const playerId in GameStateManager.players) {
            const player = GameStateManager.players[playerId];
            const playerElement = document.createElement('div');
            playerElement.className = `player ${player.isReady ? 'ready' : ''} ${player.role}`;
            
            let playerActions = '';
            if (GameStateManager.currentPlayer.isHost && playerId !== GameStateManager.currentPlayer.id) {
                playerActions = `
                    <div class="player-actions">
                        <button class="btn-secondary assign-cat-btn" data-player-id="${playerId}">
                            <i class="fas fa-cat"></i> 指定为猫
                        </button>
                    </div>
                `;
            }
            
            const roleIcon = player.role === GameStateManager.PlayerRole.CAT ? 
                '<i class="fas fa-cat role-icon role-cat"></i>' : 
                '<i class="fas fa-mouse role-icon role-mouse"></i>';
            
            playerElement.innerHTML = `
                <span>${player.name} ${player.isHost ? '<i class="fas fa-crown"></i>' : ''}</span>
                <div>
                    <span>${player.isReady ? '<i class="fas fa-check"></i> 已准备' : '<i class="fas fa-clock"></i> 未准备'} | ${roleIcon} ${GameStateManager.getRoleText(player.role)}</span>
                    ${playerActions}
                </div>
            `;
            this.elements.playersContainer.appendChild(playerElement);
        }
        
        // 为指定猫按钮添加事件监听
        document.querySelectorAll('.assign-cat-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const playerId = e.target.closest('.assign-cat-btn').getAttribute('data-player-id');
                PeerConnectionManager.assignCatToPlayer(playerId);
            });
        });
        
        // 更新游戏中的玩家列表
        this.updateGamePlayersList();
        
        // 检查是否所有玩家都准备
        if (GameStateManager.currentPlayer.isHost) {
            this.elements.startGameBtn.disabled = !GameStateManager.checkAllReady();
        }
    },
    
    // 更新游戏中的玩家列表
    updateGamePlayersList: function() {
        this.elements.gamePlayersContainer.innerHTML = '';
        
        for (const playerId in GameStateManager.players) {
            const player = GameStateManager.players[playerId];
            const playerElement = document.createElement('div');
            let playerActions = '';
            
            // 如果是猫，并且当前玩家也是猫，并且有老鼠请求被抓，显示"抓住了