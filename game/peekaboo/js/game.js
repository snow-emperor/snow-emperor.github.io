// game.js - 游戏主逻辑

class PeekabooGame {
    constructor() {
        this.gameData = null;
        this.localPlayer = null;
        this.map = null;
        this.playerMarkers = {};
        this.gamePhase = 'hiding'; // hiding 或 hunting
        this.phaseEndTime = null;
        this.scanEndTime = null;
        this.cooldownEndTime = null;
        this.peer = null;
        this.connections = new Map();
        this.catchingPlayerId = null;
        this.initialized = false; // 添加初始化完成标志
        this.catchRequestQueue = []; // 添加抓捕请求队列
        this.lastHeartbeatTime = {}; // 存储每个玩家的最后心跳时间
        this.localPosition = null; // 存储本地玩家位置
        this.positionWatchId = null; // 位置监视器ID
        this.receivedLocationRequest = false; // 是否收到了位置请求
        
        console.log('游戏初始化开始');
        this.init();
    }

    init() {
        console.log('游戏初始化开始');
        // 从 URL 参数或 sessionStorage 恢复游戏数据
        const urlParams = new URLSearchParams(window.location.search);
        const dataParam = urlParams.get('data');
        
        let urlStoredData = null;
        if (dataParam) {
            try {
                urlStoredData = JSON.parse(decodeURIComponent(dataParam));
                console.log('从URL参数加载游戏数据');
            } catch (e) {
                console.error('解析URL参数失败:', e);
                alert('从URL加载游戏数据失败: ' + e.message);
            }
        }
        
        let sessionStoredData = null;
        const sessionData = sessionStorage.getItem('peekabooGameData');
        if (sessionData) {
            try {
                sessionStoredData = JSON.parse(sessionData);
                console.log('从Session Storage加载游戏数据');
            } catch (e) {
                console.error('解析Session Storage失败:', e);
                alert('从Session Storage加载游戏数据失败: ' + e.message);
            }
        }
        
        // 优先使用URL参数中的数据，因为它包含了本地玩家标识
        this.gameData = urlStoredData || sessionStoredData;
        
        // 验证游戏数据完整性
        if (!this.isValidGameData(this.gameData)) {
            alert('游戏数据不完整或已损坏，请重新开始游戏');
            window.location.href = 'index.html';
            return;
        }
        
        console.log('游戏数据加载完成:', this.gameData);
        
        // 根据昵称或ID查找本地玩家
        this.localPlayer = null;
        
        // 首先尝试使用昵称查找
        if (this.gameData.localPlayerNickname) {
            this.localPlayer = this.gameData.players.find(p => p.name === this.gameData.localPlayerNickname);
        } 
        
        // 如果通过昵称找不到，则尝试使用存储的ID查找
        if (!this.localPlayer && this.gameData.localPlayerId) {
            this.localPlayer = this.gameData.players.find(p => p.id === this.gameData.localPlayerId);
        }

        console.log('本地玩家:', this.localPlayer);

        // 初始化P2P网络
        this.initializeP2PNetwork();

        // 获取本地位置
        this.startLocationTracking();

        this.setupUI();
        this.startHidingPhase();
        this.updatePlayersStatus();
        this.setupEventListeners();
        
        // 标记初始化完成
        this.initialized = true;
        
        // 处理初始化阶段积压的抓捕请求
        this.processCatchRequestQueue();
    }

    isValidGameData(data) {
        if (!data) return false;
        if (!Array.isArray(data.players)) return false;
        if (!data.settings) return false;
        if (!data.catPlayer) return false;
        
        // 检查必要字段
        if (!data.settings.hideTime || !data.settings.scanDuration || !data.settings.scanCooldown) {
            return false;
        }
        
        // 检查玩家数据
        for (const player of data.players) {
            if (!player.id || !player.name) {
                return false;
            }
        }
        
        // 注意：这里不检查本地玩家标识，因为从广播消息来的数据可能不包含这些信息
        // 本地玩家标识应该从准备阶段存储的数据中获取
        
        return true;
    }

    // 等待之前的连接完全关闭
    async waitForPreviousConnectionsToClose() {
        // 等待一段时间确保之前的连接已经完全断开
        return new Promise(resolve => {
            setTimeout(resolve, 1000); // 等待1秒确保连接完全断开
        });
    }

    async initializeP2PNetwork() {
        try {
            // 确保之前的连接已经完全断开
            await this.waitForPreviousConnectionsToClose();
            
            // 初始化PeerJS，使用从首页传递过来的本地玩家ID
            this.peer = new Peer(this.localPlayer.id, {
                host: '0.peerjs.com',
                port: 443,
                path: '/',
                secure: true,
                debug: 2,
                // 使用多个STUN服务器提高NAT穿透成功率
                config: {
                    iceServers: [
                        // Google STUN服务器 (经过验证的可靠服务器)
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:stun2.l.google.com:19302' },
                        { urls: 'stun:stun3.l.google.com:19302' },
                        { urls: 'stun:stun4.l.google.com:19302' },
                        // Cloudflare STUN服务器 (较新且可靠)
                        { urls: 'stun:stun.cloudflare.com:5349' },
                        // 经过验证的TURN服务器
                        { 
                            urls: 'turn:turn.anyfirewall.com:443?transport=tcp',
                            username: 'webrtc',
                            credential: 'webrtc'
                        },
                        // Cloudflare TURN服务器 (较新且可靠)
                        { 
                            urls: 'turn:turn.cloudflare.com:50000?transport=udp',
                            username: 'user',
                            credential: 'pass'
                        }
                    ],
                    iceCandidatePoolSize: 5,
                    iceTransportPolicy: 'all',
                    iceConnectionReceivingTimeout: 10000,
                    iceConnectionTimeout: 5000
                }
            });
            
            this.peer.on('open', (id) => {
                console.log('My peer ID is: ' + id);
                this.showMessage('P2P网络连接已建立', 'success');
                // 连接到其他玩家
                this.connectToPlayers();
                
                // 开始发送心跳包
                this.startHeartbeat();
            });
            
            this.peer.on('connection', (conn) => {
                this.handleIncomingConnection(conn);
            });
            
            this.peer.on('error', (err) => {
                console.error('PeerJS error:', err);
                // 如果ID已被占用，提示用户但不自动生成新ID
                if (err.type === 'unavailable-id' || (err.message && err.message.includes('ID "'))) {
                    this.showMessage('ID已被占用，请关闭其他使用相同ID的页面或重新开始游戏', 'error');
                } else {
                    this.showMessage('P2P网络错误: ' + err.message, 'error');
                }
            });
        } catch (error) {
            console.error('P2P网络初始化失败:', error);
            this.showMessage('P2P网络初始化失败: ' + error.message + 
                  '\n\n可能的原因:' +
                  '\n1. 网络连接问题' +
                  '\n2. PeerJS服务器不可用' +
                  '\n3. 防火墙阻止了连接', 'error');
        }
    }

    connectToPlayers() {
        // 连接到其他玩家
        for (const player of this.gameData.players) {
            if (player.id !== this.localPlayer.id) {
                this.attemptConnection(player, 3); // 最多重试3次
            }
        }
    }

    attemptConnection(player, retriesLeft) {
        try {
            const conn = this.peer.connect(player.id, { 
                reliable: false, // 使用不可靠连接以减少延迟
                serialization: 'json',
                metadata: { version: '1.0' }
            });
            
            conn.on('open', () => {
                console.log(`与节点 ${player.id} 建立连接`);
                this.connections.set(player.id, conn);
                
                // 发送位置信息
                this.sendLocationUpdate();
            });
            
            conn.on('data', (data) => {
                this.handleMessage(player.id, data);
            });
            
            conn.on('close', () => {
                this.handleDisconnection(player.id);
            });
            
            conn.on('error', (error) => {
                console.error(`与节点 ${player.id} 的连接错误:`, error);
                // 如果还有重试次数，使用原ID重连
                if (retriesLeft > 1) {
                    console.log(`连接到 ${player.id} 失败，${retriesLeft-1} 次重试机会剩余`);
                    setTimeout(() => {
                        this.attemptConnection(player, retriesLeft - 1);
                    }, 1000); // 1秒后重试
                } else {
                    this.handleDisconnection(player.id);
                    // 提示用户连接最终失败
                    this.showMessage(`与玩家 ${player.name} 连接失败: ${error.message}`, 'error');
                }
            });
            
            console.log(`尝试连接到玩家 ${player.name} (${player.id}), 剩余重试次数: ${retriesLeft-1}`);
        } catch (error) {
            console.error(`连接到玩家 ${player.name} 失败:`, error);
            if (retriesLeft > 1) {
                console.log(`连接到 ${player.id} 异常，${retriesLeft-1} 次重试机会剩余`);
                setTimeout(() => {
                    this.attemptConnection(player, retriesLeft - 1);
                }, 1000); // 1秒后重试
            } else {
                this.showMessage(`连接到玩家 ${player.name} 失败: ${error.message}`, 'error');
            }
        }
    }

    handleIncomingConnection(conn) {
        conn.on('open', () => {
            console.log(`与节点 ${conn.peer} 建立连接`);
            this.connections.set(conn.peer, conn);
        });
        
        conn.on('data', (data) => {
            this.handleMessage(conn.peer, data);
        });
        
        conn.on('close', () => {
            this.handleDisconnection(conn.peer);
        });
        
        conn.on('error', (error) => {
            console.error(`与节点 ${conn.peer} 的连接错误:`, error);
            this.handleDisconnection(conn.peer);
        });
    }

    handleMessage(peerId, data) {
        // 如果游戏尚未初始化完成，将抓捕请求放入队列稍后处理
        if (!this.initialized) {
            if (data.type === 'CATCH_REQUEST') {
                console.log('游戏尚未初始化完成，将抓捕请求放入队列:', data.type);
                this.catchRequestQueue.push({peerId, data});
                return;
            }
            console.log('游戏尚未初始化完成，忽略消息:', data.type);
            return;
        }
        
        console.log('收到消息:', data.type, '来自:', peerId, '数据:', data);
        switch (data.type) {
            case 'CATCH_REQUEST':
                // 收到抓捕请求
                this.showCatchConfirmation(data.from);
                break;
                
            case 'CATCH_CONFIRMED':
                // 抓捕被确认
                this.convertToCat(data.playerId);
                break;
                
            case 'PLAYER_READY':
                // 玩家准备状态更新
                this.updatePlayerReadyStatus(data.playerId, data.ready);
                break;
                
            case 'ROLE_CHANGED':
                // 角色变更通知
                const oldCat = this.gameData.players.find(p => p.isCat);
                if (oldCat) {
                    oldCat.isCat = false;
                }
                
                const newCat = this.gameData.players.find(p => p.id === data.newCatId);
                if (newCat) {
                    newCat.isCat = true;
                    
                    // 如果是本地玩家，更新UI
                    if (newCat.id === this.localPlayer.id) {
                        this.localPlayer.isCat = true;
                        document.getElementById('mouse-ui').classList.add('hidden');
                        document.getElementById('cat-ui').classList.remove('hidden');
                        this.initMap();
                    }
                }
                
                this.updatePlayersStatus();
                break;
                
            case 'HB':
                // 更新玩家的心跳时间
                this.lastHeartbeatTime[peerId] = Date.now();
                // 更新玩家状态显示
                this.updatePlayersStatus();
                break;
                
            case 'LOCATION_UPDATE':
                // 接收玩家位置更新
                this.updatePlayerLocation(peerId, data.location);
                break;
                
            case 'REQUEST_LOCATION':
                // 收到位置请求，发送当前位置
                this.receivedLocationRequest = true;
                this.sendLocationUpdate();
                // 5秒后重置请求标志
                setTimeout(() => {
                    this.receivedLocationRequest = false;
                }, 5000);
                break;
                
            default:
                console.log('收到未知消息类型:', data.type);
        }
    }

    // 处理初始化阶段积压的抓捕请求
    processCatchRequestQueue() {
        console.log('处理初始化阶段积压的抓捕请求，队列长度:', this.catchRequestQueue.length);
        while (this.catchRequestQueue.length > 0) {
            const {peerId, data} = this.catchRequestQueue.shift();
            // 直接处理抓捕请求，而不是重新调用handleMessage
            if (data.type === 'CATCH_REQUEST') {
                // 即使处理队列中的请求，也要检查游戏阶段
                if (this.gamePhase === 'hunting') {
                    this.showCatchConfirmation(data.from);
                } else {
                    console.log('当前不是寻找阶段，忽略队列中的抓捕请求');
                    this.showMessage('当前不是寻找阶段，忽略抓捕请求', 'warning');
                }
            }
        }
    }

    sendToPeer(peerId, data) {
        const conn = this.connections.get(peerId);
        if (conn && conn.open) {
            conn.send(data);
            return true;
        }
        return false;
    }

    broadcast(data) {
        for (const [peerId, conn] of this.connections) {
            if (conn.open) {
                conn.send(data);
            }
        }
    }

    handleDisconnection(peerId) {
        console.log(`与节点 ${peerId} 的连接已断开`);
        this.connections.delete(peerId);
        
        // 清除该玩家的心跳时间
        delete this.lastHeartbeatTime[peerId];
        
        // 检查是否是玩家连接断开，如果是则从玩家列表中移除
        const disconnectedPlayer = this.gameData.players.find(p => p.id === peerId);
        if (disconnectedPlayer) {
            console.log(`玩家 ${disconnectedPlayer.name} 已断开连接`);
            this.showMessage(`玩家 ${disconnectedPlayer.name} 已断开连接`, 'warning');
        }
        
        // 更新玩家状态显示
        this.updatePlayersStatus();
    }

    showCatchConfirmation(fromPlayerId) {
        console.log('收到抓捕请求，来自玩家ID:', fromPlayerId);
        // 检查是否在游戏初始化阶段
        if (!this.gameData || !this.localPlayer) {
            console.warn('游戏尚未初始化完成，忽略抓捕请求');
            return;
        }
        
        // 只有在寻找阶段才处理抓捕请求
        if (this.gamePhase !== 'hunting') {
            console.log('当前不是寻找阶段，忽略抓捕请求');
            this.showMessage('当前不是寻找阶段，忽略抓捕请求', 'warning');
            return;
        }
        
        // 查找发送请求的玩家
        const player = this.gameData.players.find(p => p.id === fromPlayerId);
        if (player) {
            // 显示抓捕确认框
            document.querySelector('#catch-confirm h2').textContent = '被抓到了!';
            document.querySelector('#catch-confirm p').textContent = `🐱 ${player.name} 抓住了你! 是否确认被抓?`;
            document.getElementById('catch-confirm').classList.remove('hidden');
            document.getElementById('catch-confirm').style.display = 'flex'; // 确保显示元素
            
            // 添加动画效果
            const modal = document.getElementById('catch-confirm');
            modal.style.animation = 'none';
            setTimeout(() => {
                modal.style.animation = 'shake 0.5s';
            }, 10);
            
            // 保存发送请求的玩家ID，用于后续处理
            this.catchingPlayerId = fromPlayerId;
        }
    }

    convertToCat(playerId) {
        // 将指定玩家转换为猫
        const player = this.gameData.players.find(p => p.id === playerId);
        if (player) {
            // 先保存旧的猫玩家
            const oldCat = this.gameData.players.find(p => p.isCat);
            if (oldCat) {
                oldCat.isCat = false;
            }
            
            player.isCat = true;
            
            // 如果是本地玩家，更新UI
            if (player.id === this.localPlayer.id) {
                this.localPlayer.isCat = true;
                document.getElementById('mouse-ui').classList.add('hidden');
                document.getElementById('cat-ui').classList.remove('hidden');
                this.initMap();
            }
            
            // 更新玩家状态显示
            this.updatePlayersStatus();
            
            // 广播更新到所有玩家
            this.broadcast({
                type: 'ROLE_CHANGED',
                newCatId: playerId
            });
            
            // 检查游戏是否结束（所有老鼠都被抓）
            this.checkGameEnd();
        }
    }

    checkGameEnd() {
        // 检查是否所有玩家都是猫，如果是则游戏结束
        const miceCount = this.gameData.players.filter(p => !p.isCat).length;
        if (miceCount === 0) {
            this.showMessage('游戏结束！所有老鼠都被抓住了！', 'success');
            // 可以在这里添加游戏结束的逻辑
        }
    }

    updatePlayerReadyStatus(playerId, ready) {
        const player = this.gameData.players.find(p => p.id === playerId);
        if (player) {
            player.isReady = ready;
            this.updatePlayersStatus();
        }
    }

    setupUI() {
        // 显示猫或老鼠专属 UI
        if (this.localPlayer.isCat) {
            document.getElementById('cat-ui').classList.remove('hidden');
            this.initMap();
            // 在地图初始化后显示猫的位置
            setTimeout(() => {
                this.showCatPosition();
            }, 1000);
        } else {
            document.getElementById('mouse-ui').classList.remove('hidden');
        }

        // 更新玩家列表显示
        this.updatePlayersStatus();
        
        // 确保抓捕确认框是隐藏的
        this.hideCatchConfirmation();
    }

    // 显示猫的位置
    showCatPosition() {
        if (!this.map || !this.localPlayer.isCat) return;
        
        // 显示猫的位置（本地玩家）
        if (this.localPosition) {
            // 创建或更新猫的位置标记
            let catMarker = this.playerMarkers[this.localPlayer.id];
            if (!catMarker) {
                // 创建新的猫标记
                catMarker = new AMap.Marker({
                    position: [this.localPosition.longitude, this.localPosition.latitude],
                    title: this.localPlayer.name,
                    label: {
                        content: this.localPlayer.name + '(猫)',
                        offset: new AMap.Pixel(0, 0)
                    }
                });
                
                this.map.add(catMarker);
                this.playerMarkers[this.localPlayer.id] = catMarker;
            } else {
                // 更新现有猫标记的位置
                catMarker.setPosition([
                    this.localPosition.longitude,
                    this.localPosition.latitude
                ]);
            }
        }
    }
    
    // 初始化地图
    initMap() {
        // 初始化高德地图
        this.map = new AMap.Map('map-container', {
            zoom: 15,
            center: [116.397428, 39.90923] // 默认北京天安门坐标
        });

        // 添加地图控件
        try {
            // 尝试添加比例尺控件
            if (AMap.Scale) {
                this.map.addControl(new AMap.Scale());
            }
        } catch (e) {
            console.warn('地图比例尺控件初始化失败:', e);
        }
        
        try {
            // 尝试添加工具栏控件
            if (AMap.ToolBar) {
                this.map.addControl(new AMap.ToolBar());
            }
        } catch (e) {
            console.warn('地图工具栏控件初始化失败:', e);
        }
        
        // 添加地图加载完成事件
        this.map.on('complete', () => {
            console.log('地图加载完成');
            this.showMessage('地图加载完成', 'info');
            // 地图加载完成后显示猫的位置
            this.showCatPosition();
        });
        
        // 定期更新猫的位置为中心点
        setInterval(() => {
            if (this.map && this.localPlayer.isCat && this.localPosition) {
                this.map.setCenter([this.localPosition.longitude, this.localPosition.latitude]);
                // 更新猫的位置标记
                this.showCatPosition();
            }
        }, 5000);
    }

    updatePlayersStatus() {
        const statusList = document.getElementById('players-status');
        statusList.innerHTML = '';

        // 按角色排序，猫在前，老鼠在后
        const sortedPlayers = [...this.gameData.players].sort((a, b) => {
            if (a.isCat && !b.isCat) return -1;
            if (!a.isCat && b.isCat) return 1;
            return 0;
        });

        sortedPlayers.forEach(player => {
            const li = document.createElement('li');
            li.className = player.id === this.localPlayer.id ? 'self-player' : '';
            
            // 添加角色标识
            const role = player.isCat ? '🐱' : '🐭';
            
            // 计算延迟（基于心跳包）
            let latencyText = '未知';
            if (this.lastHeartbeatTime[player.id]) {
                const latency = Date.now() - this.lastHeartbeatTime[player.id];
                // 限制最大显示延迟为3倍心跳间隔(9秒)
                const displayLatency = Math.min(latency, 9000);
                latencyText = `${displayLatency}ms`;
                
                // 如果延迟超过5秒，显示警告
                if (latency > 5000) {
                    latencyText += ' ⚠️';
                }
            }
            
            // 显示位置精度
            let accuracyText = '';
            if (player.position && player.position.accuracy) {
                const accuracy = Math.round(player.position.accuracy);
                accuracyText = ` (精度: ${accuracy}米)`;
                // 如果精度大于50米，显示警告
                if (accuracy > 100) {
                    accuracyText += ' ⚠️';
                }
            } else if (player.id === this.localPlayer.id && this.localPosition && this.localPosition.accuracy) {
                const accuracy = Math.round(this.localPosition.accuracy);
                accuracyText = ` (精度: ${accuracy}米)`;
                // 如果精度大于50米，显示警告
                if (accuracy > 150) {
                    accuracyText += ' ⚠️';
                }
            }
            
            // 显示玩家信息包括延迟和精度
            li.textContent = `${player.name} ${role} 延迟: ${latencyText}${accuracyText}`;
            
            if (player.isCat) {
                li.classList.add('cat-player');
            } else {
                li.classList.add('mouse-player');
            }
            
            statusList.appendChild(li);
        });

        // 更新抓捕目标列表
        if (this.localPlayer.isCat) {
            const targetSelect = document.getElementById('target-select');
            targetSelect.innerHTML = '<option value="">选择要抓捕的老鼠</option>';
            
            // 按名称排序老鼠列表
            this.gameData.players
                .filter(player => !player.isCat)
                .sort((a, b) => a.name.localeCompare(b.name))
                .forEach(mouse => {
                    const option = document.createElement('option');
                    option.value = mouse.id;
                    option.textContent = mouse.name;
                    targetSelect.appendChild(option);
                });
        }
    }

    startHidingPhase() {
        this.gamePhase = 'hiding';
        this.phaseEndTime = Date.now() + (this.gameData.settings.hideTime * 1000);
        
        document.getElementById('game-phase').textContent = '躲藏阶段';
        this.updatePhaseTimer();
        
        // 启动计时器
        this.phaseTimer = setInterval(() => {
            this.updatePhaseTimer();
            
            if (Date.now() >= this.phaseEndTime) {
                this.startHuntingPhase();
            }
        }, 1000);
        
        // 确保抓捕确认框是隐藏的
        this.hideCatchConfirmation();
        
        // 保存游戏状态到 sessionStorage
        this.saveGameState();
    }

    startHuntingPhase() {
        clearInterval(this.phaseTimer);
        this.gamePhase = 'hunting';
        
        document.getElementById('game-phase').textContent = '寻找阶段';
        document.getElementById('phase-timer').textContent = '';
        
        // 如果是猫，启用扫描按钮
        if (this.localPlayer.isCat) {
            document.getElementById('scan-btn').disabled = false;
            this.showMessage('寻找阶段开始！你可以开始扫描老鼠位置了。', 'info');
        } else {
            this.showMessage('寻找阶段开始！小心不要被猫找到。', 'info');
        }
        
        // 确保抓捕确认框是隐藏的
        this.hideCatchConfirmation();
        
        // 保存游戏状态到 sessionStorage
        this.saveGameState();
    }

    updatePhaseTimer() {
        if (!this.phaseEndTime) return;
        
        const remaining = Math.max(0, Math.ceil((this.phaseEndTime - Date.now()) / 1000));
        document.getElementById('phase-timer').textContent = 
            `剩余时间: ${remaining} 秒`;
    }

    setupEventListeners() {
        if (this.localPlayer.isCat) {
            document.getElementById('scan-btn').addEventListener('click', () => {
                this.startScan();
            });
            
            document.getElementById('catch-btn').addEventListener('click', () => {
                this.sendCatchRequest();
            });
        }
        
        // 抓捕确认按钮
        document.getElementById('confirm-catch').addEventListener('click', () => {
            this.confirmCatch(true);
        });
        
        document.getElementById('deny-catch').addEventListener('click', () => {
            this.confirmCatch(false);
        });
        
        // 刷新按钮
        document.getElementById('refresh-status').addEventListener('click', () => {
            this.refreshPlayerStatus();
        });
        
        // 确保抓捕确认框是隐藏的
        this.hideCatchConfirmation();
    }
    
    // 刷新玩家状态
    refreshPlayerStatus() {
        // 发送心跳包
        this.sendHeartbeat();
        
        // 发送位置更新
        this.sendLocationUpdate();
        
        // 更新本地玩家的位置信息
        if (this.localPosition) {
            this.localPlayer.position = this.localPosition;
        }
        
        // 更新UI
        this.updatePlayersStatus();
        
        // 如果是猫，更新地图位置
        if (this.localPlayer.isCat) {
            this.showCatPosition();
        }
        
        this.showMessage('玩家状态已刷新', 'info');
    }
    
    // 发送心跳包
    sendHeartbeat() {
        this.broadcast({
            type: 'HB'
        });
        
        // 更新本地玩家的心跳时间
        this.lastHeartbeatTime[this.localPlayer.id] = Date.now();
    }
    
    // 开始心跳包定时发送
    startHeartbeat() {
        setInterval(() => {
            this.sendHeartbeat();
        }, 1000); // 每1秒发送一次心跳包，进一步提高延迟检测灵敏度
    }
    
    // 开始位置跟踪
    startLocationTracking() {
        // 使用新的高级定位服务
        this.startAdvancedLocationTracking();
    }
    
    // 多次尝试获取位置信息
    attemptMultiplePositions(attempts, highAccuracy) {
        if (attempts <= 0) {
            // 所有尝试都失败了，如果之前尝试的是高精度，现在尝试低精度
            if (highAccuracy) {
                this.showMessage('高精度定位多次尝试失败，尝试使用低精度模式', 'warning');
                this.attemptMultiplePositions(3, false); // 尝试3次低精度定位
            } else {
                this.showMessage('无法获取位置信息，请检查定位权限和设置', 'error');
            }
            return;
        }

        const options = {
            enableHighAccuracy: highAccuracy,
            maximumAge: highAccuracy ? 3000 : 30000,
            timeout: highAccuracy ? 45000 : 20000
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.localPosition = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    altitude: position.coords.altitude,
                    altitudeAccuracy: position.coords.altitudeAccuracy,
                    heading: position.coords.heading,
                    speed: position.coords.speed
                };
                                
                // 添加时间戳
                this.localPosition.timestamp = position.timestamp;
                console.log('通过多次尝试获取到位置信息:', this.localPosition);

                // 发送初始位置更新
                this.sendLocationUpdate();

                // 如果是猫，显示猫的位置
                if (this.localPlayer.isCat) {
                    this.showCatPosition();
                }

                // 开始持续监视位置变化
                this.positionWatchId = navigator.geolocation.watchPosition(
                    (position) => {
                        this.localPosition = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy,
                            altitude: position.coords.altitude,
                            altitudeAccuracy: position.coords.altitudeAccuracy,
                            heading: position.coords.heading,
                            speed: position.coords.speed
                        };
                        
                        // 添加时间戳
                        this.localPosition.timestamp = position.timestamp;

                        // 发送位置更新
                        this.sendLocationUpdate();

                        // 如果是猫，更新猫的位置显示
                        if (this.localPlayer.isCat) {
                            this.showCatPosition();
                        }
                    },
                    (watchError) => {
                        console.error('持续位置监控失败:', watchError);
                        this.showMessage('持续位置监控失败: ' + watchError.message, 'error');
                    },
                    {
                        enableHighAccuracy: highAccuracy,
                        maximumAge: highAccuracy ? 2000 : 15000,
                        timeout: highAccuracy ? 45000 : 15000
                    }
                );
            },
            (error) => {
                console.error(`第${4 - attempts}次${highAccuracy ? '高' : '低'}精度定位尝试失败:`, error);
                this.showMessage(`第${4 - attempts}次${highAccuracy ? '高' : '低'}精度定位尝试失败: ` + error.message, 'warning');
                
                // 递归调用，减少尝试次数
                setTimeout(() => {
                    this.attemptMultiplePositions(attempts - 1, highAccuracy);
                }, 1000); // 间隔1秒再次尝试
            },
            options
        ).catch(error => {
            // 捕获可能的Promise错误
            console.error('定位Promise错误:', error);
            this.showMessage('定位服务异常，请稍后重试', 'error');
        });
    }
    
    // 发送位置更新
    sendLocationUpdate() {
        // 只有在扫描期间或收到请求时才发送位置更新
        if (this.localPosition && 
            ((this.scanEndTime && Date.now() < this.scanEndTime) || 
             this.receivedLocationRequest)) {
            this.broadcast({
                type: 'LOCATION_UPDATE',
                location: this.localPosition
            });
        }
    }
    
    // 更新玩家位置
    updatePlayerLocation(playerId, location) {
        const player = this.gameData.players.find(p => p.id === playerId);
        if (player) {
            player.position = location;
            // 只在猫的UI中更新地图标记
            if (this.localPlayer.isCat) {
                this.updateMapMarker(player);
            }
        }
    }
    
    // 更新地图标记
    updateMapMarker(player) {
        if (!this.map) return;
        
        // 如果已经有该玩家的标记，更新位置
        if (this.playerMarkers[player.id]) {
            if (player.position) {
                this.playerMarkers[player.id].setPosition([
                    player.position.longitude,
                    player.position.latitude
                ]);
            }
        } else {
            // 创建新标记
            if (player.position) {
                const content = player.isCat ? player.name + '(猫)' : player.name;
                const marker = new AMap.Marker({
                    position: [player.position.longitude, player.position.latitude],
                    title: player.name,
                    label: {
                        content: content,
                        offset: new AMap.Pixel(0, 0)
                    }
                });
                
                this.map.add(marker);
                this.playerMarkers[player.id] = marker;
            }
        }
    }
    
    // 隐藏抓捕确认框的专用方法
    hideCatchConfirmation() {
        const catchConfirm = document.getElementById('catch-confirm');
        if (catchConfirm) {
            catchConfirm.classList.add('hidden');
            catchConfirm.style.display = 'none'; // 额外确保隐藏
        }
    }
    
    // 保存游戏状态到 sessionStorage
    saveGameState() {
        const gameState = {
            gamePhase: this.gamePhase,
            phaseEndTime: this.phaseEndTime,
            scanEndTime: this.scanEndTime,
            cooldownEndTime: this.cooldownEndTime
        };
        
        sessionStorage.setItem('peekabooGameState', JSON.stringify(gameState));
    }
    
    // 从 sessionStorage 恢复游戏状态
    loadGameState() {
        const gameStateStr = sessionStorage.getItem('peekabooGameState');
        if (gameStateStr) {
            try {
                const gameState = JSON.parse(gameStateStr);
                this.gamePhase = gameState.gamePhase || this.gamePhase;
                this.phaseEndTime = gameState.phaseEndTime || this.phaseEndTime;
                this.scanEndTime = gameState.scanEndTime || this.scanEndTime;
                this.cooldownEndTime = gameState.cooldownEndTime || this.cooldownEndTime;
                return true;
            } catch (e) {
                console.error('解析游戏状态失败:', e);
                return false;
            }
        }
        return false;
    }

    startScan() {
        if (this.gamePhase !== 'hunting') {
            this.showMessage('只有在寻找阶段才能扫描！', 'warning');
            return;
        }
        
        if (this.cooldownEndTime && Date.now() < this.cooldownEndTime) {
            this.showMessage('扫描还在冷却中！', 'warning');
            return;
        }

        this.scanEndTime = Date.now() + (this.gameData.settings.scanDuration * 1000);
        this.cooldownEndTime = Date.now() + 
            ((this.gameData.settings.scanDuration + this.gameData.settings.scanCooldown) * 1000);
        
        document.getElementById('scan-btn').disabled = true;
        
        // 更新扫描计时器
        this.updateScanTimers();
        this.scanTimer = setInterval(() => {
            this.updateScanTimers();
            
            if (Date.now() >= this.scanEndTime) {
                clearInterval(this.scanTimer);
                document.getElementById('scan-btn').disabled = false;
                this.showMessage('扫描结束', 'info');
                
                // 扫描结束后清除地图标记
                Object.values(this.playerMarkers).forEach(marker => {
                    this.map.remove(marker);
                });
                this.playerMarkers = {};
            }
        }, 100);
        
        // 请求所有玩家发送位置更新
        this.broadcast({
            type: 'REQUEST_LOCATION'
        });
        
        // 显示老鼠位置
        this.showMicePositions();
        this.showMessage('开始扫描...', 'info');
        
        // 保存游戏状态
        this.saveGameState();
    }

    showMicePositions() {
        // 在地图上显示老鼠位置（使用真实位置数据）
        if (!this.map) return;
        
        // 清除之前的标记
        Object.values(this.playerMarkers).forEach(marker => {
            this.map.remove(marker);
        });
        this.playerMarkers = {};
        
        // 为每个老鼠添加标记
        this.gameData.players
            .filter(player => !player.isCat)
            .forEach(mouse => {
                // 只有当老鼠有位置数据时才显示
                if (mouse.position) {
                    const marker = new AMap.Marker({
                        position: [mouse.position.longitude, mouse.position.latitude],
                        title: mouse.name,
                        label: {
                            content: mouse.name,
                            offset: new AMap.Pixel(0, 0)
                        }
                    });
                    
                    this.map.add(marker);
                    this.playerMarkers[mouse.id] = marker;
                }
            });
            
        // 显示猫的位置（包括本地猫玩家）
        const catPlayer = this.gameData.players.find(player => player.isCat);
        if (catPlayer && catPlayer.position) {
            // 创建或更新猫的位置标记
            let catMarker = this.playerMarkers[catPlayer.id];
            if (!catMarker) {
                // 创建新的猫标记
                catMarker = new AMap.Marker({
                    position: [catPlayer.position.longitude, catPlayer.position.latitude],
                    title: catPlayer.name,
                    label: {
                        content: catPlayer.name + '(猫)',
                        offset: new AMap.Pixel(0, 0)
                    }
                });
                
                this.map.add(catMarker);
                this.playerMarkers[catPlayer.id] = catMarker;
            } else {
                // 更新现有猫标记的位置
                catMarker.setPosition([
                    catPlayer.position.longitude,
                    catPlayer.position.latitude
                ]);
            }
        }
    }

    updateScanTimers() {
        if (this.scanEndTime) {
            const scanRemaining = Math.max(0, (this.scanEndTime - Date.now()) / 1000).toFixed(1);
            document.getElementById('scan-timer').textContent = 
                `扫描中: ${scanRemaining}s`;
        }
        
        if (this.cooldownEndTime) {
            const cooldownRemaining = Math.max(0, (this.cooldownEndTime - Date.now()) / 1000).toFixed(1);
            document.getElementById('cooldown-timer').textContent = 
                `冷却: ${cooldownRemaining}s`;
        }
    }

    sendCatchRequest() {
        if (this.gamePhase !== 'hunting') {
            this.showMessage('只有在寻找阶段才能抓捕老鼠！', 'warning');
            return;
        }
        
        const targetId = document.getElementById('target-select').value;
        if (!targetId) {
            this.showMessage('请选择要抓捕的老鼠！', 'warning');
            return;
        }
        
        // 检查目标是否还是老鼠
        const targetPlayer = this.gameData.players.find(p => p.id === targetId);
        if (!targetPlayer || targetPlayer.isCat) {
            this.showMessage('目标玩家不存在或已经是猫！', 'warning');
            return;
        }
        
        // 通过P2P网络发送抓捕请求
        if (this.peer) {
            try {
                this.sendToPeer(targetId, {
                    type: 'CATCH_REQUEST',
                    from: this.localPlayer.id
                });
                this.showMessage('抓捕请求已发送', 'success');
            } catch (error) {
                console.error('发送抓捕请求失败:', error);
                this.showMessage('发送抓捕请求失败: ' + error.message, 'error');
            }
        } else {
            this.showMessage('网络未连接，无法发送抓捕请求', 'error');
        }
    }

    confirmCatch(confirmed) {
        this.hideCatchConfirmation();
        
        if (confirmed) {
            // 通过P2P网络发送确认消息
            if (this.peer && this.catchingPlayerId) {
                try {
                    this.sendToPeer(this.catchingPlayerId, {
                        type: 'CATCH_CONFIRMED',
                        playerId: this.localPlayer.id
                    });
                    
                    // 同时也更新本地状态
                    this.convertToCat(this.localPlayer.id);
                } catch (error) {
                    console.error('发送确认消息失败:', error);
                    alert('发送确认消息失败: ' + error.message);
                }
            } else {
                // 如果没有网络连接，只更新本地状态
                this.convertToCat(this.localPlayer.id);
            }
        }
        
        // 清空抓捕玩家ID
        this.catchingPlayerId = null;
    }

    // 添加通用消息显示方法
    showMessage(message, type = 'info') {
        // 创建消息元素
        const messageEl = document.createElement('div');
        messageEl.textContent = message;
        messageEl.style.position = 'fixed';
        messageEl.style.top = '20px';
        messageEl.style.left = '50%';
        messageEl.style.transform = 'translateX(-50%)';
        messageEl.style.padding = '10px 20px';
        messageEl.style.borderRadius = '4px';
        messageEl.style.color = 'white';
        messageEl.style.fontWeight = 'bold';
        messageEl.style.zIndex = '9999';
        messageEl.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        messageEl.style.transition = 'opacity 0.3s';
        
        // 根据消息类型设置样式
        switch(type) {
            case 'success':
                messageEl.style.backgroundColor = '#2ecc71';
                break;
            case 'error':
                messageEl.style.backgroundColor = '#e74c3c';
                break;
            case 'warning':
                messageEl.style.backgroundColor = '#f39c12';
                break;
            case 'info':
            default:
                messageEl.style.backgroundColor = '#3498db';
                break;
        }
        
        // 添加到页面
        document.body.appendChild(messageEl);
        
        // 3秒后自动移除
        setTimeout(() => {
            messageEl.style.opacity = '0';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    }

    // 添加断开所有Peer连接的方法
    disconnectAllPeers() {
        // 断开所有已建立的连接
        for (const [peerId, conn] of this.connections) {
            try {
                if (conn.open) {
                    conn.close();
                }
            } catch (e) {
                console.warn(`关闭连接 ${peerId} 时出错:`, e);
            }
        }
        
        // 关闭本地Peer实例
        if (this.peer) {
            try {
                this.peer.destroy();
            } catch (e) {
                console.warn('销毁Peer实例时出错:', e);
            }
        }
        
        // 清空连接列表
        this.connections.clear();
        
        // 停止位置监视
        if (this.positionWatchId) {
            navigator.geolocation.clearWatch(this.positionWatchId);
            this.positionWatchId = null;
        }
            
        // 停止高级定位服务
        this.stopAdvancedLocationTracking();
    }

    // 在页面卸载时断开连接
    destroy() {
        this.disconnectAllPeers();
    }
    
    // 启用设备传感器以提高定位精度
    enableDeviceSensors() {
        // 尝试启用设备方向传感器
        if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
            DeviceOrientationEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        window.addEventListener('deviceorientation', this.handleDeviceOrientation.bind(this));
                    }
                })
                .catch(console.error);
        } else if (typeof DeviceOrientationEvent !== 'undefined') {
            // 对于不支持权限请求的旧浏览器
            window.addEventListener('deviceorientation', this.handleDeviceOrientation.bind(this));
        }

        // 尝试启用设备运动传感器
        if (typeof DeviceMotionEvent !== 'undefined' && DeviceMotionEvent.requestPermission) {
            DeviceMotionEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        window.addEventListener('devicemotion', this.handleDeviceMotion.bind(this));
                    }
                })
                .catch(console.error);
        } else if (typeof DeviceMotionEvent !== 'undefined') {
            // 对于不支持权限请求的旧浏览器
            window.addEventListener('devicemotion', this.handleDeviceMotion.bind(this));
        }
    }

    // 处理设备方向事件
    handleDeviceOrientation(event) {
        if (this.localPosition) {
            // 存储方向信息，可用于提高定位精度
            this.localPosition.alpha = event.alpha;  // Z轴旋转角度
            this.localPosition.beta = event.beta;    // X轴旋转角度
            this.localPosition.gamma = event.gamma;  // Y轴旋转角度
        }
    }

    // 处理设备运动事件
    handleDeviceMotion(event) {
        if (this.localPosition) {
            // 存储运动信息，可用于辅助定位
            this.localPosition.accelerationX = event.acceleration.x;
            this.localPosition.accelerationY = event.acceleration.y;
            this.localPosition.accelerationZ = event.acceleration.z;
        }
    }

    // 全方位多形态的准确高精度定位服务
    startAdvancedLocationTracking() {
        if (!navigator.geolocation) {
            this.showMessage('浏览器不支持地理定位', 'error');
            return;
        }

        // 初始化定位数据
        this.locationData = {
            gps: null,
            wifi: null,
            cell: null,
            best: null,
            fusion: null
        };

        // 启用设备传感器
        this.enableDeviceSensors();
        
        // 启动多源定位
        this.startMultiSourcePositioning();
    }

    // 启动多源定位
    startMultiSourcePositioning() {
        // 同时启动多种定位方式
        this.startGPSPositioning();
        this.startNetworkPositioning();
        
        // 启动融合定位更新
        this.startLocationFusion();
    }

    // 启动GPS高精度定位
    startGPSPositioning() {
        const gpsOptions = {
            enableHighAccuracy: true,  // 强制使用GPS
            maximumAge: 0,             // 不使用缓存
            timeout: 60000             // 最长等待60秒
        };

        // 获取单次高精度位置
        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.locationData.gps = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    altitude: position.coords.altitude,
                    altitudeAccuracy: position.coords.altitudeAccuracy,
                    heading: position.coords.heading,
                    speed: position.coords.speed,
                    source: 'gps',
                    timestamp: position.timestamp
                };
                
                console.log('GPS定位成功:', this.locationData.gps);
                this.updateBestLocation();
            },
            (error) => {
                console.error('GPS定位失败:', error);
                this.showMessage('GPS定位失败: ' + error.message, 'warning');
            },
            gpsOptions
        );

        // 持续GPS监控
        if (this.gpsWatchId) {
            navigator.geolocation.clearWatch(this.gpsWatchId);
        }
        
        this.gpsWatchId = navigator.geolocation.watchPosition(
            (position) => {
                this.locationData.gps = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    altitude: position.coords.altitude,
                    altitudeAccuracy: position.coords.altitudeAccuracy,
                    heading: position.coords.heading,
                    speed: position.coords.speed,
                    source: 'gps',
                    timestamp: position.timestamp
                };
                
                this.updateBestLocation();
            },
            (error) => {
                console.error('GPS持续定位失败:', error);
            },
            gpsOptions
        );
    }

    // 启动网络定位（WiFi+基站）
    startNetworkPositioning() {
        const networkOptions = {
            enableHighAccuracy: false, // 使用网络定位（WiFi+基站）
            maximumAge: 30000,         // 可使用30秒内的缓存
            timeout: 30000             // 最长等待30秒
        };

        // 获取网络位置
        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.locationData.wifi = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    altitude: position.coords.altitude,
                    altitudeAccuracy: position.coords.altitudeAccuracy,
                    heading: position.coords.heading,
                    speed: position.coords.speed,
                    source: 'network',
                    timestamp: position.timestamp
                };
                
                console.log('网络定位成功:', this.locationData.wifi);
                this.updateBestLocation();
            },
            (error) => {
                console.error('网络定位失败:', error);
                this.showMessage('网络定位失败: ' + error.message, 'warning');
            },
            networkOptions
        );

        // 持续网络监控
        if (this.networkWatchId) {
            navigator.geolocation.clearWatch(this.networkWatchId);
        }
        
        this.networkWatchId = navigator.geolocation.watchPosition(
            (position) => {
                this.locationData.wifi = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    altitude: position.coords.altitude,
                    altitudeAccuracy: position.coords.altitudeAccuracy,
                    heading: position.coords.heading,
                    speed: position.coords.speed,
                    source: 'network',
                    timestamp: position.timestamp
                };
                
                this.updateBestLocation();
            },
            (error) => {
                console.error('网络持续定位失败:', error);
            },
            networkOptions
        );
    }

    // 更新最佳位置
    updateBestLocation() {
        const locations = [this.locationData.gps, this.locationData.wifi].filter(loc => loc !== null);
        
        if (locations.length === 0) return;
        
        // 选择精度最高的位置
        const bestLocation = locations.reduce((best, current) => {
            if (!best) return current;
            return current.accuracy < best.accuracy ? current : best;
        }, null);
        
        if (bestLocation && 
            (!this.locationData.best || bestLocation.accuracy < this.locationData.best.accuracy)) {
            this.locationData.best = {...bestLocation};
            this.localPosition = this.locationData.best;
            
            console.log('更新最佳位置:', this.localPosition);
            
            // 发送位置更新
            this.sendLocationUpdate();
            
            // 如果是猫，显示猫的位置
            if (this.localPlayer.isCat) {
                this.showCatPosition();
            }
        }
    }

    // 启动位置融合算法
    startLocationFusion() {
        // 定期执行位置融合
        setInterval(() => {
            this.fuseLocations();
        }, 5000); // 每5秒执行一次融合
    }

    // 位置融合算法
    fuseLocations() {
        const locations = [this.locationData.gps, this.locationData.wifi].filter(loc => loc !== null);
        
        if (locations.length === 0) return;
        
        // 简单的加权平均融合算法
        let totalWeight = 0;
        let weightedLat = 0;
        let weightedLon = 0;
        let minAccuracy = Infinity;
        let latestTimestamp = 0;
        
        locations.forEach(loc => {
            // 权重与精度成反比
            const weight = 1 / loc.accuracy;
            totalWeight += weight;
            weightedLat += loc.latitude * weight;
            weightedLon += loc.longitude * weight;
            
            // 记录最小精度
            if (loc.accuracy < minAccuracy) {
                minAccuracy = loc.accuracy;
            }
            
            // 记录最新时间戳
            if (loc.timestamp > latestTimestamp) {
                latestTimestamp = loc.timestamp;
            }
        });
        
        if (totalWeight > 0) {
            const fusedLocation = {
                latitude: weightedLat / totalWeight,
                longitude: weightedLon / totalWeight,
                accuracy: minAccuracy,
                source: 'fused',
                timestamp: latestTimestamp
            };
            
            this.locationData.fusion = fusedLocation;
            
            // 如果融合位置比当前最佳位置更准确，则更新
            if (!this.locationData.best || fusedLocation.accuracy < this.locationData.best.accuracy) {
                this.locationData.best = {...fusedLocation};
                this.localPosition = this.locationData.best;
                
                console.log('更新融合位置:', this.localPosition);
                
                // 发送位置更新
                this.sendLocationUpdate();
                
                // 如果是猫，显示猫的位置
                if (this.localPlayer.isCat) {
                    this.showCatPosition();
                }
            }
        }
    }

    // 停止高级定位服务
    stopAdvancedLocationTracking() {
        if (this.gpsWatchId) {
            navigator.geolocation.clearWatch(this.gpsWatchId);
            this.gpsWatchId = null;
        }
        
        if (this.networkWatchId) {
            navigator.geolocation.clearWatch(this.networkWatchId);
            this.networkWatchId = null;
        }
        
        // 清除融合定时器
        if (this.fusionIntervalId) {
            clearInterval(this.fusionIntervalId);
            this.fusionIntervalId = null;
        }
    }
}

// 页面卸载时清理资源
window.addEventListener('beforeunload', (event) => {
    // 添加防误刷新机制
    const confirmationMessage = '确定要刷新或离开页面吗？这可能会中断游戏连接。';
    event.preventDefault();
    event.returnValue = confirmationMessage; // Chrome需要这个属性
    return confirmationMessage; // 其他浏览器需要返回字符串
});

// 添加专门的页面卸载处理函数
window.addEventListener('unload', () => {
    if (window.peekabooGame) {
        window.peekabooGame.destroy();
    }
});

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 在DOM加载完成后，再额外确保一次抓捕确认框是隐藏的
    setTimeout(() => {
        const catchConfirm = document.getElementById('catch-confirm');
        if (catchConfirm) {
            catchConfirm.classList.add('hidden');
            catchConfirm.style.display = 'none';
        }
    }, 100);
    
    window.peekabooGame = new PeekabooGame();
});