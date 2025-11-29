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
        
        // 初始化网络状态监控
        this.initNetworkMonitoring();
        
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
            // 检测网络状态
            const networkStatus = await this.checkNetworkConnectivity();
            if (!networkStatus.online) {
                this.showMessage('网络不可用，请检查网络连接', 'error');
                return;
            }
            
            // 确保之前的连接已经完全断开
            await this.waitForPreviousConnectionsToClose();
            
            // 初始化PeerJS，使用从首页传递过来的本地玩家ID
            this.peer = new Peer(this.localPlayer.id, {
                host: '0.peerjs.com',
                port: 443,
                path: '/',
                secure: true,
                debug: 2,
                // 使用多个STUN/TURN服务器提高NAT穿透成功率，特别针对蜂窝网络
                config: {
                    iceServers: [
                        // Google STUN服务器
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:stun2.l.google.com:19302' },
                        { urls: 'stun:stun3.l.google.com:19302' },
                        { urls: 'stun:stun4.l.google.com:19302' },
                        
                        // Microsoft STUN服务器
                        { urls: 'stun:stun.services.mozilla.com' },
                        { urls: 'stun:stun.xten.com' },
                        
                        // 其他公共STUN服务器
                        { urls: 'stun:stun.ekiga.net' },
                        { urls: 'stun:stun.ideasip.com' },
                        { urls: 'stun:stun.rixtelecom.se' },
                        { urls: 'stun:stun.schlund.de' },
                        { urls: 'stun:stun.voiparound.com' },
                        { urls: 'stun:stun.voipbuster.com' },
                        { urls: 'stun:stun.voipstunt.com' },
                        { urls: 'stun:stun.voxgratia.org' },
                        { urls: 'stun:stunserver.org' },
                        
                        // 添加更多可靠的STUN服务器
                        { urls: 'stun:stun.fwdnet.net' },
                        { urls: 'stun:stun.sipgate.net' },
                        { urls: 'stun:stun.callwithus.com' },
                        { urls: 'stun:stun.counterpath.net' },
                        { urls: 'stun:stun.internetcalls.com' },
                        
                        // 添加TURN服务器（用于对称NAT穿透）
                        { 
                            urls: 'turn:openrelay.metered.ca:80',
                            username: 'openrelayproject',
                            credential: 'openrelayproject'
                        },
                        { 
                            urls: 'turn:openrelay.metered.ca:443',
                            username: 'openrelayproject',
                            credential: 'openrelayproject'
                        },
                        { 
                            urls: 'turn:numb.viagenie.ca:3478',
                            username: 'numb.viagenie.ca@gmail.com',
                            credential: 'muazkh'
                        },
                        { 
                            urls: 'turn:turn.relay.metered.ca:80',
                            username: 'd7b9b2f0a3d54e0b8e5f6c7d8e9f0a1b',
                            credential: 'd7b9b2f0a3d54e0b8e5f6c7d8e9f0a1b'
                        }
                    ],
                    iceCandidatePoolSize: 20,
                    iceTransportPolicy: 'all', // 允许所有类型的ICE候选
                    // 针对蜂窝网络的优化设置
                    iceConnectionReceivingTimeout: 30000,
                    iceConnectionTimeout: 15000,
                    bundlePolicy: 'max-bundle',
                    rtcpMuxPolicy: 'require'
                }
            });
            
            this.peer.on('open', (id) => {
                console.log('My peer ID is: ' + id);
                this.showMessage('P2P网络连接已建立', 'success');
                // 连接到其他玩家
                this.connectToPlayers();
                
                // 开始发送增强心跳包
                this.startEnhancedHeartbeat();
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

    async connectToPlayers() {
        // 连接到其他玩家
        for (const player of this.gameData.players) {
            if (player.id !== this.localPlayer.id) {
                try {
                    // 使用智能重连机制
                    const conn = await this.smartReconnect(player.id);
                    
                    // 设置连接事件处理
                    this.setupConnectionHandlers(conn, player.id);
                    
                    // 存储连接
                    this.connections.set(player.id, conn);
                    
                    // 发送位置信息
                    this.sendLocationUpdate();
                    
                    console.log(`成功连接到玩家 ${player.name} (${player.id})`);
                } catch (error) {
                    console.error(`连接到玩家 ${player.name} 失败:`, error);
                    this.showMessage(`无法连接到玩家 ${player.name}: ${error.message}`, 'error');
                }
            }
        }
    }

    attemptConnection(player, retriesLeft) {
        try {
            const conn = this.peer.connect(player.id, { reliable: true });
            
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
        console.log(`收到来自节点 ${conn.peer} 的连接请求`);
        
        // 设置连接事件处理
        this.setupConnectionHandlers(conn, conn.peer);
        
        // 存储连接
        this.connections.set(conn.peer, conn);
        
        // 发送位置信息
        this.sendLocationUpdate();
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

    /**
     * 检测当前网络类型
     */
    detectNetworkType() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
            return {
                type: connection.effectiveType || 'unknown',
                downlink: connection.downlink || 'unknown',
                rtt: connection.rtt || 'unknown',
                saveData: connection.saveData || false
            };
        }
        return { type: 'unknown' };
    }

    /**
     * 检测网络连接状态
     */
    checkNetworkConnectivity() {
        return new Promise((resolve) => {
            // 检测navigator.onLine状态
            if (!navigator.onLine) {
                resolve({ online: false, reason: '浏览器显示离线状态' });
                return;
            }

            // 尝试连接到多个服务器以检测网络连通性
            const testServers = [
                'https://www.google.com/favicon.ico',
                'https://www.cloudflare.com/favicon.ico',
                'https://www.github.com/favicon.ico'
            ];
            
            let completedTests = 0;
            let successfulTests = 0;
            
            const testConnectivity = (url) => {
                const img = new Image();
                img.onload = () => {
                    successfulTests++;
                    completedTests++;
                    if (completedTests === testServers.length) {
                        resolve({ 
                            online: successfulTests > 0, 
                            successRate: successfulTests / testServers.length,
                            networkType: this.detectNetworkType()
                        });
                    }
                };
                
                img.onerror = () => {
                    completedTests++;
                    if (completedTests === testServers.length) {
                        resolve({ 
                            online: successfulTests > 0, 
                            successRate: successfulTests / testServers.length,
                            networkType: this.detectNetworkType()
                        });
                    }
                };
                
                // 设置超时
                setTimeout(() => {
                    if (!img.complete) {
                        completedTests++;
                        if (completedTests === testServers.length) {
                            resolve({ 
                                online: successfulTests > 0, 
                                successRate: successfulTests / testServers.length,
                                networkType: this.detectNetworkType()
                            });
                        }
                    }
                }, 5000);
                
                img.src = url + '?t=' + new Date().getTime();
            };
            
            // 并行测试所有服务器
            testServers.forEach(testConnectivity);
        });
    }

    /**
     * 智能重试机制
     */
    async smartReconnect(peerId, maxRetries = 3) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                // 检测网络状态
                const networkStatus = await this.checkNetworkConnectivity();
                
                if (!networkStatus.online) {
                    this.showMessage(`网络不可用，请检查网络连接 (${i + 1}/${maxRetries})`, 'error');
                    await this.delay(3000); // 等待3秒后重试
                    continue;
                }
                
                // 根据网络类型调整重试策略
                let retryDelay = 2000; // 默认2秒
                if (networkStatus.networkType.type === 'slow-2g' || networkStatus.networkType.type === '2g') {
                    retryDelay = 5000; // 慢速网络增加等待时间
                } else if (networkStatus.networkType.type === '4g') {
                    retryDelay = 1000; // 4G网络减少等待时间
                }
                
                // 尝试连接
                const conn = this.peer.connect(peerId, {
                    reliable: true,
                    serialization: 'json'
                });
                
                // 设置连接超时
                const timeout = setTimeout(() => {
                    if (conn && conn.open === false) {
                        conn.close();
                    }
                }, 10000);
                
                // 等待连接建立
                await new Promise((resolve, reject) => {
                    conn.on('open', () => {
                        clearTimeout(timeout);
                        resolve(conn);
                    });
                    
                    conn.on('error', (err) => {
                        clearTimeout(timeout);
                        reject(err);
                    });
                });
                
                return conn; // 连接成功
            } catch (error) {
                console.error(`连接尝试 ${i + 1} 失败:`, error);
                
                // 最后一次尝试失败
                if (i === maxRetries - 1) {
                    throw error;
                }
                
                // 等待后重试
                const delay = 2000 * (i + 1); // 递增等待时间
                await this.delay(delay);
            }
        }
    }

    /**
     * 延迟函数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 初始化网络状态监控
     */
    initNetworkMonitoring() {
        // 监听网络状态变化
        window.addEventListener('online', () => {
            this.showMessage('网络已连接', 'success');
            this.attemptReconnection();
        });
        
        window.addEventListener('offline', () => {
            this.showMessage('网络连接已断开', 'error');
        });
        
        // 监听网络质量变化（如果支持）
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
            connection.addEventListener('change', () => {
                const networkType = this.detectNetworkType();
                console.log('网络类型变化:', networkType);
                
                // 根据网络质量调整策略
                if (networkType.type === 'slow-2g' || networkType.type === '2g') {
                    this.showMessage('检测到慢速网络，连接可能不稳定', 'warning');
                }
            });
        }
    }

    /**
     * 尝试重新连接
     */
    async attemptReconnection() {
        if (!this.localPlayer || !this.localPlayer.id) return;
        
        try {
            // 重新初始化网络
            await this.initializeP2PNetwork();
            this.showMessage('网络重新初始化成功', 'success');
        } catch (error) {
            console.error('网络重新初始化失败:', error);
            this.showMessage('网络重新初始化失败，请刷新页面重试', 'error');
        }
    }

    /**
     * 增强心跳机制
     */
    startEnhancedHeartbeat() {
        // 清除之前的心跳定时器
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        // 根据网络类型调整心跳间隔
        const networkType = this.detectNetworkType();
        let heartbeatInterval = 10000; // 默认10秒
        
        if (networkType.type === 'slow-2g' || networkType.type === '2g') {
            heartbeatInterval = 20000; // 慢速网络减少心跳频率
        } else if (networkType.type === '4g' || networkType.type === 'wifi') {
            heartbeatInterval = 5000; // 快速网络增加心跳频率
        }
        
        this.heartbeatInterval = setInterval(() => {
            this.sendHeartbeat();
        }, heartbeatInterval);
    }

    /**
     * 发送心跳包
     */
    sendHeartbeat() {
        const heartbeat = {
            type: 'HB',
            timestamp: Date.now(),
            playerId: this.localPlayer.id
        };
        
        // 广播心跳包
        this.broadcast(heartbeat);
        
        // 检查连接健康状态
        this.checkConnectionHealth();
    }

    /**
     * 检查连接健康状态
     */
    checkConnectionHealth() {
        const now = Date.now();
        const timeoutThreshold = 30000; // 30秒无响应视为连接异常
        
        // 检查所有连接的健康状态
        this.connections.forEach((conn, peerId) => {
            const player = this.gameData.players.find(p => p.id === peerId);
            if (player) {
                // 检查最后接收消息的时间
                if (this.lastHeartbeatTime[peerId] && (now - this.lastHeartbeatTime[peerId] > timeoutThreshold)) {
                    console.warn(`玩家 ${peerId} 可能已断开连接`);
                    this.showMessage(`玩家 ${player.name} 连接不稳定`, 'warning');
                    
                    // 尝试重新连接
                    this.attemptPlayerReconnection(peerId);
                }
            }
        });
    }

    /**
     * 尝试重新连接特定玩家
     */
    async attemptPlayerReconnection(peerId) {
        if (this.reconnectingPlayers && this.reconnectingPlayers.has(peerId)) {
            return; // 已在重连中
        }
        
        if (!this.reconnectingPlayers) {
            this.reconnectingPlayers = new Set();
        }
        
        this.reconnectingPlayers.add(peerId);
        
        try {
            // 关闭旧连接
            const oldConn = this.connections.get(peerId);
            if (oldConn) {
                oldConn.close();
                this.connections.delete(peerId);
            }
            
            // 尝试重新连接
            const conn = await this.smartReconnect(peerId);
            
            // 重新设置连接事件处理
            this.setupConnectionHandlers(conn, peerId);
            
            // 存储新连接
            this.connections.set(peerId, conn);
            
            this.showMessage(`与玩家 ${peerId} 的连接已恢复`, 'success');
        } catch (error) {
            console.error(`重新连接玩家 ${peerId} 失败:`, error);
            this.showMessage(`无法恢复与玩家 ${peerId} 的连接`, 'error');
        } finally {
            this.reconnectingPlayers.delete(peerId);
        }
    }

    /**
     * 设置连接事件处理
     */
    setupConnectionHandlers(conn, peerId) {
        conn.on('data', (data) => {
            this.handleMessage(peerId, data);
        });
        
        conn.on('close', () => {
            this.handleDisconnection(peerId);
        });
        
        conn.on('error', (error) => {
            console.error(`与节点 ${peerId} 的连接错误:`, error);
            this.handleDisconnection(peerId);
        });
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
                latencyText = `${latency}ms`;
            }
            
            // 不再在状态列表中显示位置信息
            li.textContent = `${player.name} ${role} 延迟: ${latencyText}`;
            
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
        
        // 更新UI
        this.updatePlayersStatus();
        
        this.showMessage('玩家状态已刷新', 'info');
    }
    
    // 发送心跳包
    sendHeartbeat() {
        this.broadcast({
            type: 'HB'
        });
    }
    
    // 开始心跳包定时发送
    startHeartbeat() {
        // 使用增强的心跳机制
        this.startEnhancedHeartbeat();
    }
    
    // 开始位置跟踪
    startLocationTracking() {
        if (navigator.geolocation) {
            // 获取高精度位置
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.localPosition = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };
                    console.log('获取到位置信息:', this.localPosition);
                    
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
                                accuracy: position.coords.accuracy
                            };
                            
                            // 发送位置更新
                            this.sendLocationUpdate();
                            
                            // 如果是猫，更新猫的位置显示
                            if (this.localPlayer.isCat) {
                                this.showCatPosition();
                            }
                        },
                        (error) => {
                            console.error('位置获取失败:', error);
                            this.showMessage('位置获取失败: ' + error.message, 'error');
                        },
                        {
                            enableHighAccuracy: true,
                            maximumAge: 10000,
                            timeout: 5000
                        }
                    );
                },
                (error) => {
                    console.error('位置获取失败:', error);
                    this.showMessage('位置获取失败: ' + error.message, 'error');
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 30000,
                    timeout: 10000
                }
            );
        } else {
            this.showMessage('浏览器不支持地理定位', 'error');
        }
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
        }
    }

    // 在页面卸载时断开连接
    destroy() {
        this.disconnectAllPeers();
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