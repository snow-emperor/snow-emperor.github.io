// index.js - 初始设置页面逻辑

class PeekabooGameIndex {
    constructor() {
        this.players = [];
        this.gameSettings = {
            hideTime: 60,
            scanDuration: 5,
            scanCooldown: 10
        };
        this.localPlayer = null;
        this.catPlayer = null;
        this.peer = null;
        this.connections = new Map();
        this.networkInitialized = false; // 新增标志位，防止重复初始化
        this.votes = new Map(); // 存储投票信息 {voterId: votedPlayerId}
        this.hasVoted = false; // 本地玩家是否已投票
        this.voteCounts = new Map(); // 存储实时票数统计 {playerId: voteCount}
        this.init();
    }

    async init() {
        // 初始化事件监听器
        document.getElementById('generate-peer-id').addEventListener('click', () => {
            this.generatePeerIdAndInitializeNetwork();
        });

        document.getElementById('copy-peer-id').addEventListener('click', () => {
            this.copyPeerId();
        });

        document.getElementById('connect-btn').addEventListener('click', () => {
            this.connectToPeer();
        });

        document.getElementById('vote-cat').addEventListener('click', () => {
            this.voteCat();
        });

        document.getElementById('ready-btn').addEventListener('click', () => {
            this.setReady();
        });

        document.getElementById('start-game').addEventListener('click', () => {
            this.startGame();
        });

        // 添加刷新连接按钮事件监听器
        document.getElementById('refresh-connection').addEventListener('click', () => {
            this.refreshConnection();
        });

        // 监听输入变化
        document.getElementById('player-name').addEventListener('input', (e) => {
            this.updatePlayerName(e.target.value);
        });

        document.getElementById('hide-time').addEventListener('input', (e) => {
            this.updateGameSetting('hideTime', parseInt(e.target.value));
        });

        document.getElementById('scan-duration').addEventListener('input', (e) => {
            this.updateGameSetting('scanDuration', parseInt(e.target.value));
        });

        document.getElementById('scan-cooldown').addEventListener('input', (e) => {
            this.updateGameSetting('scanCooldown', parseInt(e.target.value));
        });

        // 添加网络状态监听器
        window.addEventListener('online', () => {
            this.showMessage('网络已连接', 'success');
        });

        window.addEventListener('offline', () => {
            this.showMessage('网络已断开，游戏功能可能受限', 'error');
        });

      

        // 监听页面可见性变化，处理手机切后台问题
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.networkInitialized) {
                // 页面重新可见时，检查连接状态
                this.checkAndRestoreConnections();
            }
        });

        // 初始化本地玩家
        this.localPlayer = {
            id: '',
            name: '',
            isReady: false,
            isCat: false
        };

        this.updatePlayerList();
    }

    async generatePeerIdAndInitializeNetwork() {
        if (!this.localPlayer.name) {
            this.showMessage('请先输入玩家昵称', 'warning');
            return;
        }

        // 防止重复初始化
        if (this.networkInitialized) {
            return;
        }

        try {
            // 生成peerId
            const peerId = this.generatePeerId(this.localPlayer.name);
            this.localPlayer.id = peerId;
            this.networkInitialized = true;
            
            // 初始化PeerJS
            this.peer = new Peer(peerId, {
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
                        // 其他公共STUN服务器
                        { urls: 'stun:stun.ekiga.net' },
                        { urls: 'stun:stun.ideasip.com' },
                        { urls: 'stun:stun.rixtelecom.se' },
                        { urls: 'stun:stun.schlund.de' },
                        { urls: 'stun:stun.voiparound.com' },
                        { urls: 'stun:stun.voipbuster.com' },
                        { urls: 'stun:stun.voipstunt.com' },
                        { urls: 'stun:stun.voxgratia.org' },
                        // 添加更多STUN服务器
                        { urls: 'stun:stunserver.org' },
                        { urls: 'stun:stun.xten.com' },
                        { urls: 'stun:stun.fwdnet.net' },
                        { urls: 'stun:stun.sipgate.net' },
                        { urls: 'stun:stun.callwithus.com' },
                        { urls: 'stun:stun.counterpath.net' },
                        { urls: 'stun:stun.internetcalls.com' },
                        // 添加TURN服务器（需要认证的示例，实际使用时需要有效的TURN服务器）
                        // 注意：这些是示例服务器，生产环境应使用自己的TURN服务器或付费服务
                        { 
                            urls: 'turn:turn.anyfirewall.com:443?transport=tcp',
                            username: 'webrtc',
                            credential: 'webrtc'
                        },
                        { 
                            urls: 'turn:turn.betazeus.com:3478?transport=udp',
                            username: 'betauser',
                            credential: 'betapass'
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
                document.getElementById('peer-id').value = id;
                this.updatePlayerList();
                this.checkStartConditions();
                this.showMessage('网络连接已建立', 'success');
            });
            
            this.peer.on('connection', (conn) => {
                this.handleIncomingConnection(conn);
            });
            
            this.peer.on('error', (err) => {
                console.error('PeerJS error:', err);
                // 如果ID被占用，提示用户但不自动生成新ID
                if (err.type === 'unavailable-id' || (err.message && err.message.includes('ID "'))) {
                    this.showMessage('ID已被占用，请关闭其他使用相同ID的页面或重新开始游戏', 'error');
                } else {
                    this.showMessage('P2P网络错误: ' + err.message, 'error');
                }
            });
        } catch (error) {
            console.error('网络初始化失败:', error);
            this.showMessage('网络初始化失败: ' + error.message + 
                  '\n\n可能的原因:' +
                  '\n1. 网络连接问题' +
                  '\n2. PeerJS服务器不可用' +
                  '\n3. 防火墙阻止了连接', 'error');
        }
    }

    async generatePeerIdAndInitializeNetwork() {
        if (!this.localPlayer.name) {
            this.showMessage('请先输入玩家昵称', 'warning');
            return;
        }

        // 防止重复初始化
        if (this.networkInitialized) {
            return;
        }

        try {
            // 生成peerId
            const peerId = this.generatePeerId(this.localPlayer.name);
            this.localPlayer.id = peerId;
            
            // 初始化网络
            await this.initializeNetwork(peerId);
        } catch (error) {
            console.error('生成Peer ID并初始化网络失败:', error);
            this.showMessage('初始化网络失败，请重试', 'error');
        }
    }

    async initializeNetwork(peerId) {
        return new Promise((resolve, reject) => {
            try {
                // 初始化PeerJS
                this.peer = new Peer(peerId, {
                    host: '0.peerjs.com',
                    port: 443,
                    path: '/',
                    secure: true,
                    debug: 2,
                    // 使用多个STUN/TURN服务器提高NAT穿透成功率，特别针对国内网络环境
                    config: {
                        iceServers: [
                            // 国内可用的STUN服务器
                            { urls: 'stun:stun.qq.com:3478' },
                            { urls: 'stun:stun.aliyun.com:3478' },
                            { urls: 'stun:stun.miwifi.com:3478' },
                            { urls: 'stun:stun.bigeast.com:3478' },
                            { urls: 'stun:stun.webrtc.com.cn:3478' },
                            { urls: 'stun:stun.voipbuster.com:3478' },
                            
                            // 腾讯云STUN服务器
                            { urls: 'stun:stun.cloud.tencent.com:3478' },
                            
                            // 阿里云STUN服务器
                            { urls: 'stun:stun.cn-hangzhou.aliyuncs.com:3478' },
                            
                            // 华为云STUN服务器
                            { urls: 'stun:stun.myhuaweicloud.com:3478' },
                            
                            // Google STUN服务器（在国内可能不稳定，但保留作为备选）
                            { urls: 'stun:stun.l.google.com:19302' },
                            { urls: 'stun:stun1.l.google.com:19302' },
                            
                            // 其他国际STUN服务器（作为备选）
                            { urls: 'stun:stun.ekiga.net' },
                            { urls: 'stun:stun.ideasip.com' },
                            { urls: 'stun:stun.rixtelecom.se' },
                            { urls: 'stun:stun.voiparound.com' },
                            { urls: 'stun:stun.voxgratia.org' },
                            { urls: 'stun:stunserver.org' },
                            
                            // 国内可用的TURN服务器（需要认证的示例，实际使用时需要有效的TURN服务器）
                            { 
                                urls: 'turn:turn.bigeast.com:3478?transport=udp',
                                username: 'bigeast',
                                credential: 'bigeast'
                            },
                            { 
                                urls: 'turn:turn.bigeast.com:3478?transport=tcp',
                                username: 'bigeast',
                                credential: 'bigeast'
                            },
                            { 
                                urls: 'turn:turn.webrtc.com.cn:3478?transport=udp',
                                username: 'webrtc',
                                credential: 'webrtc'
                            },
                            { 
                                urls: 'turn:turn.webrtc.com.cn:3478?transport=tcp',
                                username: 'webrtc',
                                credential: 'webrtc'
                            },
                            
                            // 腾讯云TURN服务器（示例，需要实际账号）
                            { 
                                urls: 'turn:turn.cloud.tencent.com:3478?transport=udp',
                                username: 'tencent',
                                credential: 'tencent'
                            },
                            { 
                                urls: 'turn:turn.cloud.tencent.com:3478?transport=tcp',
                                username: 'tencent',
                                credential: 'tencent'
                            },
                            
                            // 阿里云TURN服务器（示例，需要实际账号）
                            { 
                                urls: 'turn:turn.cn-hangzhou.aliyuncs.com:3478?transport=udp',
                                username: 'aliyun',
                                credential: 'aliyun'
                            },
                            { 
                                urls: 'turn:turn.cn-hangzhou.aliyuncs.com:3478?transport=tcp',
                                username: 'aliyun',
                                credential: 'aliyun'
                            }
                        ],
                        iceCandidatePoolSize: 30, // 增加ICE候选池大小
                        iceTransportPolicy: 'all', // 允许所有类型的ICE候选
                        // 针对国内复杂网络环境的优化设置
                        iceConnectionReceivingTimeout: 4500, // 增加接收超时时间
                        iceConnectionTimeout: 3000, // 增加连接超时时间
                        bundlePolicy: 'max-bundle',
                        rtcpMuxPolicy: 'require',
                        // 增加连接重试和恢复机制
                        iceRestartEnabled: true,
                        continualGatheringPolicy: 'gather_continually' // 持续收集ICE候选
                    }
                });
                
                this.peer.on('open', (id) => {
                    console.log('My peer ID is: ' + id);
                    document.getElementById('peer-id').value = id;
                    this.updatePlayerList();
                    this.checkStartConditions();
                    this.showMessage('网络连接已建立', 'success');
                    resolve();
                });
                
                this.peer.on('connection', (conn) => {
                    this.handleIncomingConnection(conn);
                });
                
                this.peer.on('error', (err) => {
                    console.error('PeerJS error:', err);
                    // 如果ID被占用，提示用户但不自动生成新ID
                    if (err.type === 'unavailable-id' || (err.message && err.message.includes('ID "'))) {
                        this.showMessage('ID已被占用，请关闭其他使用相同ID的页面或重新开始游戏', 'error');
                    } else {
                        this.showMessage('P2P网络错误: ' + err.message, 'error');
                    }
                    reject(err);
                });
                
                this.networkInitialized = true;
            } catch (error) {
                console.error('初始化网络失败:', error);
                this.showMessage('网络初始化失败: ' + error.message + 
                      '\n\n可能的原因:' +
                      '\n1. 网络连接问题' +
                      '\n2. PeerJS服务器不可用' +
                      '\n3. 防火墙阻止了连接', 'error');
                reject(error);
            }
        });
    }

    generatePeerId(nickname) {
        // 使用简化版哈希算法结合时间戳生成唯一ID
        let hash = 0;
        for (let i = 0; i < nickname.length; i++) {
            const char = nickname.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        
        // 添加更丰富的时间戳和随机数以增加唯一性
        const timestamp = Date.now().toString(36);
        const random1 = Math.random().toString(36).substr(2, 8);
        const random2 = Math.random().toString(36).substr(2, 8);
        
        return `user_${Math.abs(hash).toString(36)}_${timestamp}_${random1}${random2}`;
    }

    handleIncomingConnection(conn) {
        conn.on('open', () => {
            console.log(`与节点 ${conn.peer} 建立连接`);
            this.connections.set(conn.peer, conn);
            
            // 发送当前用户信息
            conn.send({
                type: 'USER_INFO',
                payload: {
                    id: this.localPlayer.id,
                    name: this.localPlayer.name,
                    isReady: this.localPlayer.isReady,
                    isCat: this.localPlayer.isCat
                }
            });
            
            // 发送现有玩家列表
            this.sendPlayerList(conn);
            
            // 发送已连接玩家的ID列表，以便建立网状网络
            const connectedPlayerIds = Array.from(this.connections.keys());
            conn.send({
                type: 'CONNECTED_PLAYERS',
                payload: connectedPlayerIds
            });
            
            // 如果已经有猫玩家，发送猫玩家信息
            if (this.catPlayer) {
                conn.send({
                    type: 'CAT_SELECTED',
                    catPlayerId: this.catPlayer.id
                });
            }
            
            // 发送当前游戏设置
            conn.send({
                type: 'GAME_SETTINGS_UPDATE',
                payload: this.gameSettings
            });
            
            // 如果本地玩家已投票或已选定猫玩家，发送当前投票状态
            if (this.hasVoted || this.catPlayer) {
                // 发送当前投票统计
                conn.send({
                    type: 'VOTE_STATUS',
                    payload: {
                        votes: Array.from(this.votes.entries()),
                        voteCounts: Array.from(this.voteCounts.entries()),
                        catPlayer: this.catPlayer ? this.catPlayer.id : null
                    }
                });
            }
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

    updateGameSetting(settingName, value) {
        this.gameSettings[settingName] = value;
        
        // 广播游戏设置更新（新格式，发送整个设置对象）
        this.broadcast({
            type: 'GAME_SETTINGS_UPDATE',
            payload: this.gameSettings
        });
        
        this.updatePlayerList();
        this.checkStartConditions();
    }

    handleMessage(peerId, data) {
        switch (data.type) {
            case 'USER_INFO':
                this.addPlayer(data.payload.name, data.payload.id, data.payload.isReady, data.payload.isCat);
                break;
                
            case 'PLAYER_LIST':
                data.payload.forEach(player => {
                    if (player.id !== this.localPlayer.id) {
                        this.addPlayer(player.name, player.id, player.isReady, player.isCat);
                    }
                });
                // 广播更新确保所有玩家都有最新的列表
                this.broadcastUpdatedPlayerList();
                break;
                
            case 'PLAYER_LIST_UPDATE':
                // 处理玩家列表更新
                data.payload.forEach(player => {
                    if (player.id === this.localPlayer.id) {
                        // 更新本地玩家信息
                        this.localPlayer.name = player.name;
                        this.localPlayer.isReady = player.isReady;
                        this.localPlayer.isCat = player.isCat;
                        return;
                    }
                    
                    // 查找是否已有该玩家
                    const existingPlayer = this.players.find(p => p.id === player.id);
                    if (existingPlayer) {
                        // 更新现有玩家信息
                        existingPlayer.name = player.name;
                        existingPlayer.isReady = player.isReady;
                        existingPlayer.isCat = player.isCat;
                    } else {
                        // 添加新玩家
                        this.players.push({
                            id: player.id,
                            name: player.name,
                            isReady: player.isReady,
                            isCat: player.isCat
                        });
                    }
                });
                
                // 移除不在更新列表中的玩家（除了本地玩家）
                this.players = this.players.filter(localPlayer => {
                    return data.payload.some(updatePlayer => updatePlayer.id === localPlayer.id);
                });
                
                this.updatePlayerList();
                this.checkStartConditions();
                break;
                
            case 'CONNECTED_PLAYERS':
                // 连接到已有的玩家，形成网状网络
                data.payload.forEach(playerId => {
                    // 不要连接到自己或已经连接的玩家
                    if (playerId !== this.localPlayer.id && !this.connections.has(playerId)) {
                        this.connectToPlayer(playerId);
                    }
                });
                break;
                
            case 'PLAYER_READY':
                this.updatePlayerReadyStatus(data.playerId, data.ready);
                break;
                
            case 'CAT_SELECTED':
                this.updateCatPlayer(data.catPlayerId);
                break;
                
            case 'VOTE_CAT':
                this.receiveVote(peerId, data.playerId);
                break;
                
            case 'CAT_DECIDED':
                this.updateCatPlayer(data.catPlayerId);
                break;
                
            case 'GAME_SETTINGS_UPDATE':
                if (typeof data.payload === 'object' && !Array.isArray(data.payload)) {
                    // 整个设置对象
                    this.gameSettings = {...this.gameSettings, ...data.payload};
                }
                
                // 更新UI显示
                document.getElementById('hide-time').value = this.gameSettings.hideTime;
                document.getElementById('scan-duration').value = this.gameSettings.scanDuration;
                document.getElementById('scan-cooldown').value = this.gameSettings.scanCooldown;
                this.updatePlayerList();
                this.checkStartConditions();
                break;
                
            case 'VOTE_STATUS':
                // 新玩家加入时同步投票状态
                this.votes = new Map(data.payload.votes);
                // 正确设置本地玩家的投票状态
                this.hasVoted = false; // 新加入的玩家默认未投票
                
                this.voteCounts = new Map(data.payload.voteCounts);
                
                // 如果已经有猫玩家结果，更新猫玩家
                if (data.payload.catPlayer) {
                    this.updateCatPlayer(data.payload.catPlayer);
                }
                
                // 更新玩家列表显示
                this.updatePlayerList();
                
                // 更新按钮状态
                const voteButtons = document.querySelectorAll('#vote-cat');
                voteButtons.forEach(button => {
                    if (data.payload.catPlayer) {
                        button.disabled = true;
                        button.textContent = '投票结束';
                    }
                });
                break;
                
            case 'GAME_START':
                console.log('收到GAME_START消息，准备跳转到游戏页面');
                // 导航到游戏页面
                this.navigateToGame(data.payload);
                break;
                
            default:
                console.log('收到未知消息类型:', data.type);
        }
    }

    sendPlayerList(conn) {
        const allPlayers = [this.localPlayer, ...this.players];
        conn.send({
            type: 'PLAYER_LIST',
            payload: allPlayers
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
        console.log('广播消息给所有连接的玩家:', data.type, '连接数:', this.connections.size);
        let sentCount = 0;
        for (const [peerId, conn] of this.connections) {
            if (conn.open) {
                conn.send(data);
                sentCount++;
                console.log('消息已发送给:', peerId);
            } else {
                console.log('连接未打开，无法发送消息给:', peerId);
            }
        }
        console.log('总共发送消息给', sentCount, '个玩家');
    }

    copyPeerId() {
        const peerIdInput = document.getElementById('peer-id');
        peerIdInput.select();
        document.execCommand('copy');
        this.showMessage('Peer ID 已复制到剪贴板', 'info');
    }

    connectToPeer() {
        const otherId = document.getElementById('other-id').value.trim();
        if (!otherId) {
            this.showMessage('请输入其他人的 Peer ID', 'warning');
            return;
        }

        if (!this.peer || !this.networkInitialized) {
            this.showMessage('请先生成自己的 Peer ID', 'warning');
            return;
        }

        // 检查是否已经连接
        if (this.connections.has(otherId)) {
            this.showMessage('已经与该玩家连接', 'info');
            return;
        }

        // 检测网络连接状态
        if (!navigator.onLine) {
            this.showMessage('设备当前处于离线状态，请检查网络连接', 'error');
            return;
        }

       

        // 查找玩家信息
        const player = this.players.find(p => p.id === otherId) || { name: otherId };
        
        // 显示连接提示
        this.showMessage(`正在尝试连接到玩家 ${player.name || otherId}，请稍候...`, 'info');
        
        // 增加重试次数，特别针对蜂窝网络
        this.attemptConnection(player, otherId, 5); // 增加到5次重试
    }

    handleDisconnection(peerId) {
        console.log(`与节点 ${peerId} 的连接已断开`);
        this.connections.delete(peerId);
        this.players = this.players.filter(p => p.id !== peerId);
        this.updatePlayerList();
        this.checkStartConditions();
    }

    updatePlayerName(name) {
        this.localPlayer.name = name;
        
        // 只更新玩家列表和检查开始条件
        this.updatePlayerList();
        this.checkStartConditions();
    }

    addPlayer(name, id, isReady = false, isCat = false) {
        // 检查玩家是否已存在
        const existingPlayer = this.players.find(p => p.id === id);
        if (existingPlayer) {
            // 更新现有玩家信息
            existingPlayer.name = name;
            existingPlayer.isReady = isReady;
            existingPlayer.isCat = isCat;
            this.updatePlayerList();
            this.checkStartConditions();
            
            // 广播更新后的玩家列表
            this.broadcastUpdatedPlayerList();
            return;
        }

        const player = {
            id: id,
            name: name,
            isReady: isReady,
            isCat: isCat
        };

        this.players.push(player);
        this.updatePlayerList();
        this.checkStartConditions();
        
        // 广播更新后的玩家列表
        this.broadcastUpdatedPlayerList();
    }

    removePlayer(id) {
        this.players = this.players.filter(p => p.id !== id);
        this.updatePlayerList();
        this.checkStartConditions();
    }

    updatePlayerList() {
        const playerList = document.getElementById('player-list');
        playerList.innerHTML = '';

        if (this.localPlayer.id) {
            const li = document.createElement('li');
            li.className = 'self-player';
            // 显示票数
            const voteCount = this.voteCounts.get(this.localPlayer.id) || 0;
            li.textContent = `${this.localPlayer.name} (${this.localPlayer.id}) ${this.localPlayer.isReady ? '✅ 已准备' : '⏳ 未准备'} ${this.localPlayer.isCat ? '🐱 猫' : '🐭 老鼠'} ${this.hasVoted ? '🗳️ 已投票' : '⏳ 未投票'} [${voteCount}票]`;
            playerList.appendChild(li);
        }

        this.players.forEach(player => {
            const li = document.createElement('li');
            // 显示票数
            const voteCount = this.voteCounts.get(player.id) || 0;
            const hasVoted = this.votes.has(player.id) ? '🗳️ 已投票' : '⏳ 未投票';
            li.textContent = `${player.name} (${player.id}) ${player.isReady ? '✅ 已准备' : '⏳ 未准备'} ${player.isCat ? '🐱 猫' : '🐭 老鼠'} ${hasVoted} [${voteCount}票]`;
            
            // 添加角色特定的CSS类
            if (player.isCat) {
                li.classList.add('cat-player');
            } else {
                li.classList.add('mouse-player');
            }
            
            playerList.appendChild(li);
        });
    }

    updatePlayerReadyStatus(playerId, ready) {
        if (this.localPlayer.id === playerId) {
            this.localPlayer.isReady = ready;
        } else {
            const player = this.players.find(p => p.id === playerId);
            if (player) {
                player.isReady = ready;
            }
        }
        this.updatePlayerList();
        this.checkStartConditions();
        
        // 广播更新后的玩家列表
        this.broadcastUpdatedPlayerList();
    }

    updateCatPlayer(catPlayerId) {
        // 重置所有玩家的猫状态
        this.localPlayer.isCat = (this.localPlayer.id === catPlayerId);
        this.players.forEach(player => {
            player.isCat = (player.id === catPlayerId);
        });
        
        // 更新猫玩家
        const allPlayers = [this.localPlayer, ...this.players];
        this.catPlayer = allPlayers.find(p => p.id === catPlayerId);
        
        if (this.catPlayer) {
            document.getElementById('cat-status').textContent = 
                `当前猫: ${this.catPlayer.name}`;
        }
        
        this.updatePlayerList();
        this.checkStartConditions();
        
        // 广播更新后的玩家列表
        this.broadcastUpdatedPlayerList();
    }

    voteCat() {
        // 检查玩家是否已经投过票
        if (this.hasVoted) {
            alert('您已经投过票了！');
            return;
        }

        // 合并本地玩家和网络玩家
        const allPlayers = [...this.players];
        if (this.localPlayer.id) {
            allPlayers.unshift(this.localPlayer);
        }

        if (allPlayers.length === 0) {
            alert('没有玩家加入游戏');
            return;
        }

        // 创建更好的用户界面来选择猫玩家
        const selectContainer = document.createElement('div');
        selectContainer.style.position = 'fixed';
        selectContainer.style.top = '50%';
        selectContainer.style.left = '50%';
        selectContainer.style.transform = 'translate(-50%, -50%)';
        selectContainer.style.backgroundColor = 'white';
        selectContainer.style.padding = '20px';
        selectContainer.style.borderRadius = '8px';
        selectContainer.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        selectContainer.style.zIndex = '1000';
        selectContainer.innerHTML = `
            <h3>请选择猫玩家（只能投一次票）</h3>
            <select id="cat-select" style="width: 100%; padding: 10px; margin: 10px 0;">
                <option value="">弃权（随机选择）</option>
                ${allPlayers.map((player, index) => 
                    `<option value="${player.id}">${player.name}</option>`
                ).join('')}
            </select>
            <div>
                <button id="confirm-cat" style="background-color: #3498db; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; margin: 5px;">确认投票</button>
                <button id="cancel-cat" style="background-color: #95a5a6; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; margin: 5px;">取消</button>
            </div>
            <div id="vote-status" style="margin-top: 10px; font-weight: bold;"></div>
        `;
        
        document.body.appendChild(selectContainer);
        
        // 更新投票状态显示
        this.updateVoteStatus(selectContainer.querySelector('#vote-status'));
        
        document.getElementById('confirm-cat').addEventListener('click', () => {
            const selectedPlayerId = document.getElementById('cat-select').value;
            
            // 设置本地已投票标志
            this.hasVoted = true;
            
            // 广播投票信息
            this.broadcast({
                type: 'VOTE_CAT',
                playerId: selectedPlayerId || null // null表示弃权
            });
            
            // 更新本地投票统计
            if (selectedPlayerId) {
                this.voteCounts.set(selectedPlayerId, (this.voteCounts.get(selectedPlayerId) || 0) + 1);
            }
            
            // 更新玩家列表显示
            this.updatePlayerList();
            
            // 检查是否所有玩家都已投票
            this.checkAllVotes();
            
            document.body.removeChild(selectContainer);
        });
        
        document.getElementById('cancel-cat').addEventListener('click', () => {
            document.body.removeChild(selectContainer);
        });
    }

    receiveVote(peerId, playerId) {
        // 检查玩家是否已经投过票
        if (this.votes.has(peerId)) {
            console.warn(`玩家 ${peerId} 已经投过票了！`);
            return;
        }
        
        // 记录其他玩家的投票
        this.votes.set(peerId, playerId);
        
        // 更新投票统计
        if (playerId) {
            this.voteCounts.set(playerId, (this.voteCounts.get(playerId) || 0) + 1);
        }
        
        // 更新玩家列表显示
        this.updatePlayerList();
        
        // 检查是否所有玩家都已投票
        this.checkAllVotes();
    }

    updateVoteStatus(statusElement) {
        if (!statusElement) return;
        
        // 获取所有玩家（包括本地玩家）
        const allPlayers = [this.localPlayer, ...this.players];
        const connectedPlayers = allPlayers.filter(p => p.id);
        
        // 统计投票情况
        const votedPlayers = connectedPlayers.filter(player => 
            this.votes.has(player.id) || (player.id === this.localPlayer.id && this.hasVoted));
        
        statusElement.textContent = `投票进度: ${votedPlayers.length}/${connectedPlayers.length}`;
    }

    checkAllVotes() {
        // 获取所有玩家（包括本地玩家）
        const allPlayers = [this.localPlayer, ...this.players];
        const connectedPlayers = allPlayers.filter(p => p.id);
        
        // 检查是否所有连接的玩家都已投票
        const allVoted = connectedPlayers.every(player => 
            this.votes.has(player.id) || (player.id === this.localPlayer.id && this.hasVoted));
        
        // 更新投票状态显示
        const voteButtons = document.querySelectorAll('#vote-cat');
        if (voteButtons.length > 0) {
            voteButtons.forEach(button => {
                if (this.hasVoted) {
                    button.disabled = true;
                    button.textContent = '已投票';
                } else if (allVoted) {
                    button.disabled = true;
                    button.textContent = '投票结束';
                }
            });
        }
        
        if (allVoted && connectedPlayers.length > 0) {
            // 找出获得最多票数的玩家
            let maxVotes = -1;
            let catPlayerId = null;
            let candidatesWithMaxVotes = []; // 存储所有最高票数的候选人
            
            // 重新统计票数以确保准确性
            const finalVoteCount = new Map();
            connectedPlayers.forEach(player => {
                finalVoteCount.set(player.id, 0);
            });
            
            // 统计每名玩家获得的票数
            for (const [voterId, votedPlayerId] of this.votes) {
                // 忽略弃权票
                if (votedPlayerId && finalVoteCount.has(votedPlayerId)) {
                    finalVoteCount.set(votedPlayerId, finalVoteCount.get(votedPlayerId) + 1);
                }
            }
            
            // 加上本地玩家的投票
            if (this.hasVoted) {
                const localSelect = document.getElementById('cat-select');
                if (localSelect) {
                    const localVote = localSelect.value || null;
                    if (localVote && finalVoteCount.has(localVote)) {
                        finalVoteCount.set(localVote, finalVoteCount.get(localVote) + 1);
                    }
                }
            }
            
            // 找出获得最多票数的玩家
            for (const [playerId, votes] of finalVoteCount) {
                if (votes > maxVotes) {
                    maxVotes = votes;
                    candidatesWithMaxVotes = [playerId];
                } else if (votes === maxVotes) {
                    candidatesWithMaxVotes.push(playerId);
                }
            }
            
            // 如果没有人获得票数（全部弃权）或出现平票，则随机选择一个玩家作为猫
            if (candidatesWithMaxVotes.length > 0) {
                if (candidatesWithMaxVotes.length === 1) {
                    catPlayerId = candidatesWithMaxVotes[0];
                } else {
                    // 平票情况下随机选择
                    const randomIndex = Math.floor(Math.random() * candidatesWithMaxVotes.length);
                    catPlayerId = candidatesWithMaxVotes[randomIndex];
                }
            } else {
                // 全部弃权的情况下随机选择一个玩家
                const randomIndex = Math.floor(Math.random() * connectedPlayers.length);
                catPlayerId = connectedPlayers[randomIndex].id;
            }
            
            // 广播最终的猫玩家选择
            this.broadcast({
                type: 'CAT_DECIDED',
                catPlayerId: catPlayerId
            });
            
            // 更新本地猫玩家
            this.updateCatPlayer(catPlayerId);
        }
    }

    setReady() {
        if (!this.catPlayer) {
            alert('请先选择猫玩家');
            return;
        }

        this.localPlayer.isReady = true;
        document.getElementById('ready-btn').disabled = true;
        
        // 广播准备状态
        this.broadcast({
            type: 'PLAYER_READY',
            playerId: this.localPlayer.id,
            ready: true
        });
        
        // 准备好自己的不加密URL存储信息和sessionStorage存储，但不传递
        this.prepareLocalStorage();
        
        this.updatePlayerList();
        this.checkStartConditions();
    }

    checkStartConditions() {
        // 检查是否可以开始游戏
        const hasName = this.localPlayer.name.trim() !== '';
        const hasCat = !!this.catPlayer;
        const allPlayers = [this.localPlayer, ...this.players];
        const allReady = allPlayers.length >= 2 && allPlayers.every(player => player.isReady);
        const minPlayers = allPlayers.length >= 2;
        
        document.getElementById('generate-peer-id').disabled = !hasName || this.networkInitialized;
        document.getElementById('ready-btn').disabled = !hasName || !this.peer || !this.networkInitialized || !!this.localPlayer.isReady;
        document.getElementById('start-game').disabled = !(hasName && hasCat && allReady && minPlayers);
    }

    // 准备本地存储（不中断连接）
    prepareLocalStorage() {
        // 合并所有玩家信息
        const allPlayers = [this.localPlayer, ...this.players];
        
        // 准备游戏数据，包含ID-昵称映射和本地玩家昵称
        const gameData = {
            players: allPlayers,
            settings: this.gameSettings,
            catPlayer: this.catPlayer,
            localPlayerNickname: this.localPlayer.name, // 存储本地玩家昵称
            localPlayerId: this.localPlayer.id         // 存储本地玩家ID
        };

        // 存储到 sessionStorage
        sessionStorage.setItem('peekabooGameData', JSON.stringify(gameData));
        
        // 同时通过 URL 参数传递数据
        const urlParams = new URLSearchParams();
        urlParams.set('data', encodeURIComponent(JSON.stringify(gameData)));
        
        // 保存 URL 参数到全局变量，供后续跳转使用
        this.preparedGameUrl = 'game.html?' + urlParams.toString();
        
        console.log('准备阶段存储游戏数据，本地玩家:', this.localPlayer.name, this.localPlayer.id);
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
        
        // 确保Peer实例被完全销毁
        this.peer = null;
        
        // 注意：不重置networkInitialized标志，因为我们要保留Peer ID
        // this.networkInitialized = false; // 注释掉这行
    }

    // 刷新连接和游戏状态
    refreshConnection() {
        if (!this.networkInitialized) {
            this.showMessage('请先生成Peer ID', 'error');
            return;
        }

        this.showMessage('正在刷新连接...', 'info');
        
        // 保存当前Peer ID，不重新生成
        const currentPeerId = this.localPlayer.id;
        
        // 保存当前连接的玩家ID列表
        const connectedPlayerIds = Array.from(this.connections.keys());
        
        // 断开所有现有连接
        this.disconnectAllPeers();
        
        // 重新初始化网络，但保持相同的Peer ID
        this.initializeNetwork(currentPeerId).then(() => {
            // 重新连接到之前的所有玩家
            const reconnectPromises = [];
            for (const playerId of connectedPlayerIds) {
                reconnectPromises.push(this.connectToPlayer(playerId));
            }
            
            // 等待所有重连尝试完成
            Promise.allSettled(reconnectPromises).then(() => {
                // 广播当前玩家状态
                this.broadcast({
                    type: 'USER_INFO',
                    player: this.localPlayer
                });
                
                // 广播当前游戏设置
                this.broadcast({
                    type: 'GAME_SETTINGS',
                    settings: this.gameSettings
                });
                
                // 请求更新玩家列表
                this.broadcast({
                    type: 'PLAYER_LIST_REQUEST'
                });
                
                this.showMessage('连接已刷新', 'success');
            });
        }).catch(error => {
            console.error('刷新连接失败:', error);
            this.showMessage('刷新连接失败，请重试', 'error');
        });
    }

    // 检查并恢复连接
    checkAndRestoreConnections() {
        if (!this.networkInitialized) return;
        
        console.log('检查连接状态...');
        let disconnectedPeers = 0;
        
        // 检查所有连接状态
        for (const [playerId, conn] of this.connections) {
            if (!conn.open) {
                disconnectedPeers++;
                console.log(`玩家 ${playerId} 连接已断开，尝试重新连接...`);
                this.connectToPlayer(playerId);
            }
        }
        
        if (disconnectedPeers > 0) {
            this.showMessage(`检测到 ${disconnectedPeers} 个断开的连接，正在尝试恢复...`, 'info');
        }
    }

    startGame() {
        // 合并所有玩家信息
        const allPlayers = [this.localPlayer, ...this.players];
        
        // 验证所有条件
        if (allPlayers.length < 2) {
            alert('至少需要2个玩家才能开始游戏');
            return;
        }
        
        if (!this.catPlayer) {
            alert('请先选择猫玩家');
            return;
        }
        
        const allReady = allPlayers.every(player => player.isReady);
        if (!allReady) {
            alert('所有玩家都需要准备就绪才能开始游戏');
            return;
        }
        
        // 准备游戏数据，包含ID-昵称映射和本地玩家昵称
        const gameData = {
            players: allPlayers,
            settings: this.gameSettings,
            catPlayer: this.catPlayer,
            localPlayerNickname: this.localPlayer.name, // 存储本地玩家昵称
            localPlayerId: this.localPlayer.id         // 存储本地玩家ID
        };

        // 广播游戏开始消息给所有玩家（只包含基本数据，不含本地玩家标识）
        const broadcastData = {
            players: allPlayers,
            settings: this.gameSettings,
            catPlayer: this.catPlayer
        };
        
        this.broadcast({
            type: 'GAME_START',
            payload: broadcastData
        });

        // 断开所有PeerJS连接，避免ID冲突
        this.disconnectAllPeers();
        
        // 延迟跳转到游戏页面，确保连接完全断开
        setTimeout(() => {
            // 使用预先准备好的URL跳转到游戏页面（包含本地玩家标识）
            window.location.href = this.preparedGameUrl || 'game.html';
        }, 2000); // 延迟2000毫秒以确保连接完全断开
    }

    // 添加导航到游戏页面的方法
    navigateToGame(gameData) {
        console.log('准备跳转到游戏页面，游戏数据:', gameData);
        
        // 从本地存储获取完整的游戏数据（包含本地玩家标识）
        const localStoredData = sessionStorage.getItem('peekabooGameData');
        let fullGameData = gameData;
        
        if (localStoredData) {
            try {
                fullGameData = JSON.parse(localStoredData);
                console.log('使用本地存储的游戏数据:', fullGameData);
            } catch (e) {
                console.error('解析本地存储数据失败:', e);
            }
        }
        
        // 通过 sessionStorage 存储数据
        sessionStorage.setItem('peekabooGameData', JSON.stringify(fullGameData));
        
        // 同时通过 URL 参数传递数据
        const urlParams = new URLSearchParams();
        urlParams.set('data', encodeURIComponent(JSON.stringify(fullGameData)));
        
        // 验证数据是否正确存储
        try {
            const storedData = sessionStorage.getItem('peekabooGameData');
            if (!storedData) {
                throw new Error('数据存储失败');
            }
            
            const parsedData = JSON.parse(storedData);
            if (!parsedData.players || !parsedData.settings) {
                throw new Error('数据存储不完整');
            }
        } catch (e) {
            alert('数据存储验证失败: ' + e.message);
            return;
        }
        
        // 跳转到游戏页面
        console.log('正在跳转到游戏页面');
        window.location.href = 'game.html?' + urlParams.toString();
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
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 3000);
    }

    // 添加一个新方法用于广播更新后的玩家列表
    broadcastUpdatedPlayerList() {
        const allPlayers = [this.localPlayer, ...this.players];
        this.broadcast({
            type: 'PLAYER_LIST_UPDATE',
            payload: allPlayers
        });
    }

    connectToPlayer(playerId) {
        // 检查是否已经连接
        if (this.connections.has(playerId)) {
            console.log(`已经与节点 ${playerId} 建立连接`);
            return;
        }

        // 查找玩家信息
        const player = this.players.find(p => p.id === playerId) || { name: playerId };
        
        this.attemptConnection(player, playerId, 3); // 最多重试3次
    }

    attemptConnection(player, playerId, retriesLeft) {
        try {
            // 设置更长的连接超时时间，特别针对国内复杂网络环境
            const conn = this.peer.connect(playerId, { 
                reliable: true,
                // 增加连接超时时间，国内网络需要更长时间建立连接
                timeout: 45000,
                // 使用更宽松的配置选项
                serialization: 'json',
                // 启用更积极的重连策略
                maxRetries: 8, // 增加重试次数
                retryDelay: 3000, // 增加重试间隔
                // 添加连接配置以增强NAT穿透
                config: {
                    iceServers: this.peer.options.config.iceServers,
                    iceCandidatePoolSize: 30,
                    iceTransportPolicy: 'all',
                    continualGatheringPolicy: 'gather_continually'
                }
            });
            
            // 设置连接超时计时器
            const connectionTimeout = setTimeout(() => {
                if (!conn.open) {
                    console.warn(`连接到 ${playerId} 超时`);
                    conn.close();
                    
                    // 如果还有重试次数，继续重试
                    if (retriesLeft > 1) {
                        console.log(`连接到 ${playerId} 超时，${retriesLeft-1} 次重试机会剩余`);
                        setTimeout(() => {
                            this.attemptConnection(player, playerId, retriesLeft - 1);
                        }, 5000); // 国内网络需要更长的重试间隔
                    } else {
                        this.showMessage(`与玩家 ${player.name || playerId} 连接超时，请检查网络连接后重试`, 'error');
                    }
                }
            }, 45000); // 45秒超时，适合国内网络环境
            
            conn.on('open', () => {
                clearTimeout(connectionTimeout); // 清除超时计时器
                console.log(`与节点 ${playerId} 建立连接`);
                this.connections.set(playerId, conn);
                this.showMessage(`成功连接到玩家 ${player.name || playerId}`, 'success');
            });
            
            conn.on('data', (data) => {
                this.handleMessage(playerId, data);
            });
            
            conn.on('close', () => {
                clearTimeout(connectionTimeout); // 清除超时计时器
                this.handleDisconnection(playerId);
            });
            
            conn.on('error', (error) => {
                clearTimeout(connectionTimeout); // 清除超时计时器
                console.error(`与节点 ${playerId} 的连接错误:`, error);
                
                // 如果还有重试次数，使用原ID重连
                if (retriesLeft > 1) {
                    console.log(`连接到 ${playerId} 失败，${retriesLeft-1} 次重试机会剩余`);
                    setTimeout(() => {
                        this.attemptConnection(player, playerId, retriesLeft - 1);
                    }, 5000); // 国内网络需要更长的重试间隔
                } else {
                    this.handleDisconnection(playerId);
                    // 提供更具体的错误信息
                    let errorMessage = error.message || '未知错误';
                    if (error.type === 'peer-unavailable') {
                        errorMessage = '对方玩家不可用，可能已离线';
                    } else if (error.type === 'network') {
                        errorMessage = '网络连接问题，请检查网络设置或尝试切换网络环境';
                    } else if (error.type === 'server-error') {
                        errorMessage = '连接服务器错误，请稍后重试';
                    } else if (error.type === 'webrtc') {
                        errorMessage = 'WebRTC连接错误，可能是NAT穿透失败，建议尝试使用TURN服务器';
                    }
                    
                    this.showMessage(`与玩家 ${player.name || playerId} 连接失败: ${errorMessage}`, 'error');
                }
            });
            
            console.log(`尝试连接到玩家 ${player.name || playerId} (${playerId}), 剩余重试次数: ${retriesLeft-1}`);
        } catch (error) {
            console.error(`连接到玩家 ${playerId} 失败:`, error);
            if (retriesLeft > 1) {
                console.log(`连接到 ${playerId} 异常，${retriesLeft-1} 次重试机会剩余`);
                setTimeout(() => {
                    this.attemptConnection(player, playerId, retriesLeft - 1);
                }, 5000); // 国内网络需要更长的重试间隔
            } else {
                this.showMessage(`连接到玩家 ${player.name || playerId} 失败: ${error.message}`, 'error');
            }
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

window.addEventListener('unload', () => {
    if (window.peekabooGameIndex) {
        window.peekabooGameIndex.disconnectAllPeers();
    }
});

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.peekabooGameIndex = new PeekabooGameIndex();
});