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
                player.role === GameStateManager.PlayerRole.MOUSE ?
                '<i class="fas fa-mouse role-icon role-mouse"></i>' :
                '<i class="fas fa-question role-icon"></i>';
            
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
            
            // 如果是猫，并且当前玩家也是猫，并且有老鼠请求被抓，显示"抓住了"按钮
            if (GameStateManager.currentPlayer.role === GameStateManager.PlayerRole.CAT && 
                player.role === GameStateManager.PlayerRole.MOUSE && 
                !player.isCaught && 
                player.requestingCatch) {
                playerActions = `
                    <div class="player-actions">
                        <button class="btn-secondary catch-btn" data-player-id="${playerId}">
                            <i class="fas fa-hand-paper"></i> 抓住了
                        </button>
                    </div>
                `;
            }
            
            const roleIcon = player.role === GameStateManager.PlayerRole.CAT ? 
                '<i class="fas fa-cat role-icon role-cat"></i>' : 
                '<i class="fas fa-mouse role-icon role-mouse"></i>';
            
            let statusText = '';
            if (player.isCaught) {
                statusText = '<span style="color: #f44336;"><i class="fas fa-skull-crossbones"></i> 已抓住</span>';
            } else if (player.requestingCatch) {
                statusText = '<span style="color: #ff9800;"><i class="fas fa-hand-paper"></i> 请求被抓</span>';
            }
            
            playerElement.className = `player ${player.role} ${player.isCaught ? 'caught' : ''} ${player.requestingCatch ? 'requesting-catch' : ''}`;
            playerElement.innerHTML = `
                <span>${player.name}</span>
                <div>
                    <span>${roleIcon} ${GameStateManager.getRoleText(player.role)} ${statusText}</span>
                    ${playerActions}
                </div>
            `;
            this.elements.gamePlayersContainer.appendChild(playerElement);
        }
        
        // 为抓住了按钮添加事件监听
        document.querySelectorAll('.catch-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const playerId = e.target.closest('.catch-btn').getAttribute('data-player-id');
                this.confirmCatch(playerId);
            });
        });
    },
    
    // 确认抓住
    confirmCatch: function(playerId) {
        if (GameStateManager.currentPlayer.role !== GameStateManager.PlayerRole.CAT) return;
        
        PeerConnectionManager.sendToHost({
            type: 'playerCaught',
            playerId: playerId,
            catPlayerId: GameStateManager.currentPlayer.id
        });
    },
    
    // 更新游戏界面
    updateGameInterface: function() {
        // 更新游戏状态文本
        if (GameStateManager.currentState === GameStateManager.GameState.HIDING) {
            this.elements.gameStateText.textContent = '躲藏阶段';
            this.elements.statusMessage.textContent = '尽快找到躲藏的地方！';
            this.elements.statusMessage.className = 'status-message status-hiding';
            
            // 如果是猫，显示提示
            if (GameStateManager.currentPlayer.role === GameStateManager.PlayerRole.CAT) {
                this.elements.statusMessage.textContent = '你是猫，等待躲藏时间结束后开始寻找老鼠！';
            }
        } else if (GameStateManager.currentState === GameStateManager.GameState.SEEKING) {
            this.elements.gameStateText.textContent = '寻找阶段';
            this.elements.statusMessage.textContent = '猫正在寻找老鼠！';
            this.elements.statusMessage.className = 'status-message status-seeking';
            
            // 根据角色显示不同提示
            if (GameStateManager.currentPlayer.role === GameStateManager.PlayerRole.CAT) {
                this.elements.statusMessage.textContent = '你是猫，快去抓住老鼠！';
            } else if (GameStateManager.currentPlayer.role === GameStateManager.PlayerRole.MOUSE) {
                this.elements.statusMessage.textContent = '你是老鼠，小心不要被猫抓住！';
            }
        }
        
        // 更新角色显示
        const roleIcon = GameStateManager.currentPlayer.role === GameStateManager.PlayerRole.CAT ? 
            '<i class="fas fa-cat role-icon role-cat"></i>' : 
            GameStateManager.currentPlayer.role === GameStateManager.PlayerRole.MOUSE ?
            '<i class="fas fa-mouse role-icon role-mouse"></i>' :
            '<i class="fas fa-question role-icon"></i>';
        this.elements.playerRole.innerHTML = `${roleIcon} ${GameStateManager.getRoleText(GameStateManager.currentPlayer.role)}`;
        
        // 更新扫描次数显示
        this.updateScanCountDisplay();
        
        // 更新玩家列表
        this.updateGamePlayersList();
        
        // 更新地图可见性
        MapManager.updateMapVisibility();
        
        // 根据角色显示/隐藏被抓按钮
        if (GameStateManager.currentPlayer.role === GameStateManager.PlayerRole.MOUSE && 
            !GameStateManager.currentPlayer.isCaught) {
            this.elements.caughtBtn.style.display = 'block';
            if (GameStateManager.currentPlayer.requestingCatch) {
                this.elements.caughtBtn.innerHTML = '<i class="fas fa-times"></i> 取消被抓请求';
                this.elements.caughtBtn.className = 'btn-secondary';
            } else {
                this.elements.caughtBtn.innerHTML = '<i class="fas fa-hand-paper"></i> 我被抓住了';
                this.elements.caughtBtn.className = 'btn-caught';
            }
        } else {
            this.elements.caughtBtn.style.display = 'none';
        }
    },
    
    // 更新扫描次数显示
    updateScanCountDisplay: function() {
        this.elements.scanCountDisplay.textContent = 
            `${GameStateManager.config.scansRemaining}/${GameStateManager.config.scanCount}`;
    },
    
    // 开始游戏计时器
    startGameTimer: function() {
        GameStateManager.resetTimers();
        
        const startTime = Date.now();
        const hideTimeMs = GameStateManager.config.hideTime * 60 * 1000;
        
        GameStateManager.timers.gameTimer = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = hideTimeMs - elapsed;
            
            if (remaining <= 0) {
                // 躲藏时间结束，切换到寻找阶段
                GameStateManager.currentState = GameStateManager.GameState.SEEKING;
                this.updateGameInterface();
                
                // 开始位置更新计时器
                this.startLocationUpdateTimer();
                
                clearInterval(GameStateManager.timers.gameTimer);
                this.elements.timerDisplay.textContent = '00:00';
                
                Utils.showNotification('躲藏时间结束！猫开始寻找老鼠！', 'warning');
            } else {
                const minutes = Math.floor(remaining / 60000);
                const seconds = Math.floor((remaining % 60000) / 1000);
                this.elements.timerDisplay.textContent = 
                    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    },
    
    // 开始位置更新计时器
    startLocationUpdateTimer: function() {
        // 先立即获取一次位置
        this.getPlayerLocation();
        
        GameStateManager.timers.locationUpdateTimer = setInterval(() => {
            // 更新自己的位置
            this.getPlayerLocation();
            
            // 如果还有扫描次数，广播老鼠位置给所有玩家
            if (GameStateManager.currentPlayer.isHost && GameStateManager.config.scansRemaining > 0) {
                this.broadcastMousePositions();
                
                // 减少扫描次数
                GameStateManager.config.scansRemaining--;
                this.updateScanCountDisplay();
                
                // 广播扫描次数更新
                PeerConnectionManager.broadcast({
                    type: 'scanUpdate',
                    scansRemaining: GameStateManager.config.scansRemaining
                });
                
                Utils.showNotification(`扫描完成！剩余扫描次数: ${GameStateManager.config.scansRemaining}`, 'info');
                
                // 设置定时器停止显示老鼠位置
                clearTimeout(GameStateManager.timers.locationDisplayTimer);
                GameStateManager.timers.locationDisplayTimer = setTimeout(() => {
                    // 停止显示老鼠位置
                    // 在实际实现中，这里应该清除老鼠的位置显示
                }, GameStateManager.config.locationDuration * 1000);
            }
            
            // 如果没有扫描次数了，停止计时器
            if (GameStateManager.config.scansRemaining <= 0) {
                clearInterval(GameStateManager.timers.locationUpdateTimer);
                Utils.showNotification('所有扫描次数已用完！', 'warning');
            }
        }, GameStateManager.config.locationInterval * 60 * 1000);
    },
    
    // 广播老鼠位置
    broadcastMousePositions: function() {
        if (!GameStateManager.currentPlayer.isHost) return;
        
        for (const playerId in GameStateManager.players) {
            if (GameStateManager.players[playerId].role === GameStateManager.PlayerRole.MOUSE && 
                !GameStateManager.players[playerId].isCaught && 
                GameStateManager.players[playerId].position) {
                PeerConnectionManager.broadcast({
                    type: 'playerPosition',
                    playerId: playerId,
                    position: GameStateManager.players[playerId].position,
                    role: GameStateManager.PlayerRole.MOUSE
                });
            }
        }
    },
    
    // 获取玩家位置
    getPlayerLocation: function() {
        if (!navigator.geolocation) {
            Utils.showNotification('你的浏览器不支持地理定位', 'error');
            return;
        }
        
        // 设置位置获取选项 - 增加超时时间并降低精度要求
        const options = {
            enableHighAccuracy: false, // 改为false以提高成功率
            timeout: 15000, // 增加到15秒
            maximumAge: 60000
        };
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const newPosition = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };
                
                GameStateManager.currentPlayer.position = newPosition;
                
                // 发送位置给房主
                if (!GameStateManager.currentPlayer.isHost) {
                    PeerConnectionManager.sendToHost({
                        type: 'playerPosition',
                        playerId: GameStateManager.currentPlayer.id,
                        position: newPosition
                    });
                } else {
                    // 房主更新自己的位置
                    GameStateManager.updatePlayer(GameStateManager.currentPlayer.id, { position: newPosition });
                    
                    // 如果是猫，广播位置
                    if (GameStateManager.currentPlayer.role === GameStateManager.PlayerRole.CAT) {
                        PeerConnectionManager.broadcast({
                            type: 'playerPosition',
                            playerId: GameStateManager.currentPlayer.id,
                            position: newPosition,
                            role: GameStateManager.PlayerRole.CAT
                        });
                    }
                }
                
                // 更新地图
                MapManager.updatePlayerMarkers();
                
                // 如果是猫，将地图中心定位到猫的位置
                if (GameStateManager.currentPlayer.role === GameStateManager.PlayerRole.CAT) {
                    MapManager.locateToCurrentPlayer();
                }
            },
            (error) => {
                console.error('获取位置失败:', error);
                let errorMessage = '无法获取你的位置';
                
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = '位置服务被拒绝，请允许浏览器访问位置信息';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = '无法获取位置信息，请检查设备定位功能';
                        break;
                    case error.TIMEOUT:
                        errorMessage = '获取位置信息超时，请重试';
                        // 如果是超时错误，可以尝试再次获取
                        setTimeout(() => {
                            this.getPlayerLocation();
                        }, 2000);
                        break;
                }
                
                Utils.showNotification(errorMessage, 'error');
                
                // 使用默认位置作为后备
                const defaultPosition = {
                    latitude: 39.90923,
                    longitude: 116.397428,
                    accuracy: 1000
                };
                
                GameStateManager.currentPlayer.position = defaultPosition;
                
                // 发送默认位置
                if (!GameStateManager.currentPlayer.isHost) {
                    PeerConnectionManager.sendToHost({
                        type: 'playerPosition',
                        playerId: GameStateManager.currentPlayer.id,
                        position: defaultPosition
                    });
                } else {
                    GameStateManager.updatePlayer(GameStateManager.currentPlayer.id, { position: defaultPosition });
                }
                
                // 更新地图
                MapManager.updatePlayerMarkers();
            },
            options
        );
    },
    
    // Peer连接事件处理
    onPeerOpen: function(data) {
        console.log('Peer连接已建立:', data.id);
    },
    
    onPeerError: function(data) {
        console.error('Peer连接错误:', data.error);
    },
    
    onConnectionOpen: function(data) {
        console.log('连接已建立:', data.connection.peer);
    },
    
    onPlayerJoined: function(data) {
        console.log('玩家加入:', data.player.name);
        Utils.showNotification(`玩家 ${data.player.name} 加入了房间`, 'info');
        this.updatePlayersList();
    },
    
    onPlayerLeft: function(data) {
        console.log('玩家离开:', data.playerId);
        Utils.showNotification('有玩家离开了房间', 'warning');
        this.updatePlayersList();
    },
    
    onHostDisconnected: function() {
        Utils.showNotification('房主已断开连接，返回主界面', 'error');
        this.switchPhase(GameStateManager.GameState.SETUP);
        GameStateManager.resetGame();
    },
    
    onGameStateUpdated: function(data) {
        console.log('游戏状态更新:', data.state);
        
        if (data.state === GameStateManager.GameState.LOBBY) {
            this.switchPhase(GameStateManager.GameState.LOBBY);
            this.updatePlayersList();
        }
    },
    
    onPlayersUpdated: function(data) {
        this.updatePlayersList();
    },
    
    onPlayerReadyChanged: function(data) {
        console.log('玩家准备状态改变:', data.playerId, data.isReady);
        this.updatePlayersList();
    },
    
    onRoleAssigned: function(data) {
        console.log('角色分配:', data.catPlayerId);
        
        // 更新当前玩家的角色
        if (data.catPlayerId === GameStateManager.currentPlayer.id) {
            GameStateManager.currentPlayer.role = GameStateManager.PlayerRole.CAT;
        } else {
            GameStateManager.currentPlayer.role = GameStateManager.PlayerRole.MOUSE;
        }
        
        Utils.showNotification('角色已分配', 'info');
        this.updatePlayersList();
    },
    
    onGameStarted: function(data) {
        console.log('游戏开始');
        GameStateManager.currentState = data.state;
        GameStateManager.players = data.players;
        GameStateManager.config = data.config;
        
        // 更新自己的角色
        if (GameStateManager.players[GameStateManager.currentPlayer.id]) {
            GameStateManager.currentPlayer.role = GameStateManager.players[GameStateManager.currentPlayer.id].role;
            GameStateManager.currentPlayer.isCaught = GameStateManager.players[GameStateManager.currentPlayer.id].isCaught;
            GameStateManager.currentPlayer.requestingCatch = GameStateManager.players[GameStateManager.currentPlayer.id].requestingCatch;
        }
        
        // 获取玩家位置
        this.getPlayerLocation();
        
        // 开始游戏计时
        this.startGameTimer();
        
        // 切换到游戏界面
        this.switchPhase(GameStateManager.GameState.HIDING);
        this.updateGameInterface();
    },
    
    onPlayerPositionUpdated: function(data) {
        MapManager.updatePlayerMarkers();
    },
    
    onPlayerRequestedCatch: function(data) {
        this.updateGamePlayersList();
    },
    
    onPlayerCanceledCatch: function(data) {
        this.updateGamePlayersList();
    },
    
    onPlayerCaught: function(data) {
        if (data.isSelf) {
            Utils.showNotification('你已被抓住，现在你也是猫了！', 'info');
        }
        this.updateGameInterface();
    },
    
    onScanCountUpdated: function(data) {
        this.updateScanCountDisplay();
    },
    
    onGameOver: function(data) {
        Utils.showNotification('游戏结束！' + data.message, 'success');
        this.switchPhase(GameStateManager.GameState.LOBBY);
        GameStateManager.resetGameState();
        this.updatePlayersList();
    },
    
    onBackToLobby: function() {
        this.switchPhase(GameStateManager.GameState.LOBBY);
        GameStateManager.resetGameState();
        this.updatePlayersList();
        Utils.showNotification('游戏已结束，返回大厅', 'info');
    },
    
    onCatAssigned: function(data) {
        this.updatePlayersList();
    },
    
    onPlayerCaughtByHost: function(data) {
        this.updatePlayersList();
        this.updateGamePlayersList();
    }
};

// 导出到全局作用域
window.UIManager = UIManager;