
// js/main.js

import { CAR_CONFIG, CHECKPOINTS, initialRaceState, defaultPlayerData } from './config.js';
import * as Physics from './physics.js';

// --- 全局变量 ---
const LOCAL_STORAGE_KEY = 'racingGamePlayerProfile';
const MAX_LAPS = CAR_CONFIG.MAX_LAPS;

let peer;
let connection;
let playerData = { ...defaultPlayerData };

// 比赛状态
let raceActive = false;
let isHost = false; 
let myRaceState = { ...initialRaceState };
let remoteRaceState = { ...initialRaceState };


// --- 数据持久化与 UI ---

function loadPlayerData() {
    const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedData) {
        try {
            playerData = JSON.parse(storedData);
        } catch (e) {
            console.error('解析玩家数据失败:', e);
            playerData = { ...defaultPlayerData };
        }
    }
    updateUI();
}

function savePlayerData() {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(playerData));
    updateUI();
}

export function saveTestData() {
    playerData = { credits: 5000, cars: [{ name: "Test Racer 9000", engineLevel: 3, tireLevel: 2 }] };
    savePlayerData();
}

export function addCredits(amount) {
    playerData.credits += amount;
    savePlayerData();
}

function updateUI() {
    document.getElementById('credits-display').innerText = playerData.credits;
    const car = playerData.cars[0];
    document.getElementById('car-config-display').innerText = 
        `引擎: Lv.${car.engineLevel}, 轮胎: Lv.${car.tireLevel}`;
        
    updateGarageUI(car);
    Physics.updatePhysicsParameters(car);
    updateRaceUI();
}

function updateGarageUI(car) {
    // 引擎 UI
    const engineLevel = car.engineLevel;
    const engineConfig = CAR_CONFIG.engine;
    document.getElementById('current-engine-level').innerText = engineLevel;
    document.getElementById('current-engine-perf').innerText = engineConfig.getForce(engineLevel).toFixed(5);
    
    const nextEngineLevel = engineLevel + 1;
    const btn = document.getElementById('engine-upgrade-button');
    if (engineLevel < engineConfig.maxLevel) {
        btn.innerText = `升级到 Lv.${nextEngineLevel} (花费: ${engineConfig.getCost(nextEngineLevel)})`;
        btn.disabled = false;
    } else {
        btn.innerText = "已达最高等级";
        btn.disabled = true;
    }

    // 轮胎 UI
    const tireLevel = car.tireLevel;
    const tireConfig = CAR_CONFIG.tires;
    // ... (类似地更新轮胎 UI)
    const btnTire = document.getElementById('tires-upgrade-button');
    const nextTireLevel = tireLevel + 1;
    document.getElementById('current-tire-level').innerText = tireLevel;
    document.getElementById('current-tire-perf').innerText = tireConfig.getSteering(tireLevel).toFixed(3);
    if (tireLevel < tireConfig.maxLevel) {
        btnTire.innerText = `升级到 Lv.${nextTireLevel} (花费: ${tireConfig.getCost(nextTireLevel)})`;
        btnTire.disabled = false;
    } else {
        btnTire.innerText = "已达最高等级";
        btnTire.disabled = true;
    }
}

export function upgradePart(partName) {
    let car = playerData.cars[0];
    let config = CAR_CONFIG[partName];
    let partKey = partName === 'engine' ? 'engineLevel' : 'tireLevel';
    
    if (car[partKey] >= config.maxLevel) {
        document.getElementById('upgrade-message').innerText = `${partName} 已达最高等级!`;
        return;
    }
    
    const nextLevel = car[partKey] + 1;
    const upgradeCost = config.getCost(nextLevel);

    if (playerData.credits >= upgradeCost) {
        playerData.credits -= upgradeCost;
        car[partKey] = nextLevel;
        savePlayerData();
        document.getElementById('upgrade-message').style.color = 'green';
        document.getElementById('upgrade-message').innerText = `${partName} 升级成功! 费用: ${upgradeCost}。`;
    } else {
        document.getElementById('upgrade-message').style.color = 'red';
        document.getElementById('upgrade-message').innerText = `金币不足! 需要 ${upgradeCost}。`;
    }
}


// --- 比赛逻辑 ---

function updateRaceUI() {
    document.getElementById('my-lap-count').innerText = `${myRaceState.lap} / ${MAX_LAPS}`;
    document.getElementById('my-checkpoint').innerText = myRaceState.label;
    document.getElementById('remote-lap-count').innerText = `${Physics.getRemoteCar() ? remoteRaceState.lap : 'N/A'} / ${MAX_LAPS}`;
    document.getElementById('race-active-status').innerText = raceActive ? (isHost ? '进行中 (主机)' : '进行中 (客户端)') : '未开始';
}

function handleCollision(event) {
    if (!raceActive || myRaceState.finished) return;

    const pairs = event.pairs;

    pairs.forEach(pair => {
        let checkpointBody;
        if ((pair.bodyA.label === 'MyCar' && pair.bodyB.label.startsWith('CP')) || 
            (pair.bodyB.label === 'MyCar' && pair.bodyA.label.startsWith('CP'))) {
            checkpointBody = pair.bodyA.label.startsWith('CP') ? pair.bodyA : pair.bodyB;
            
            const checkpointIndex = checkpointBody.index;

            if (checkpointIndex === myRaceState.nextCheckpoint) {
                // 如果通过了终点线，且之前通过了所有检查点 (即 nextCheckpoint 等于最后一个检查点的 index)
                if (checkpointBody.label === 'Finish Line' && myRaceState.nextCheckpoint === CHECKPOINTS.length) { 
                    myRaceState.lap++;
                    myRaceState.nextCheckpoint = 1; 
                } else if (checkpointBody.label !== 'Finish Line') {
                    // 普通检查点
                    myRaceState.nextCheckpoint++;
                } else if (checkpointBody.label === 'Finish Line' && myRaceState.nextCheckpoint !== CHECKPOINTS.length) {
                    // 还没通过所有检查点就通过终点线，忽略
                    return;
                }
                
                myRaceState.label = checkpointBody.label;
                updateRaceUI();
                sendRaceStateUpdate();
                
                if (myRaceState.lap >= MAX_LAPS) {
                    finishRace(true); 
                }
            } 
        }
    });
}

export function startRace() {
    if (!peer || !peer.id) return alert("请先初始化 PeerJS。");
    
    isHost = true;
    myRaceState = { ...initialRaceState };
    remoteRaceState = { ...initialRaceState };
    raceActive = true;
    myRaceState.finishTime = null; 
    remoteRaceState.finishTime = null;
    updateRaceUI();
    
    if (connection && connection.open) connection.send({ type: 'race_start' });
    document.getElementById('start-race-button').disabled = true;
}

function finishRace(isMyCar) {
    if (!raceActive) return;
    
    const state = isMyCar ? myRaceState : remoteRaceState;
    if (state.finished) return; 
    
    state.finished = true;
    state.finishTime = Date.now();
    
    if (isMyCar) sendRaceStateUpdate(); 

    // 主机负责最终结算
    if (isHost) {
        const remoteFinished = !Physics.getRemoteCar() || remoteRaceState.finished;
        if (myRaceState.finished && remoteFinished) {
            // 如果是单人或两人都完成
            const myCarWon = !Physics.getRemoteCar() || (myRaceState.finishTime < remoteRaceState.finishTime);
            hostSettleRace(myCarWon);
        }
    }
}

function hostSettleRace(myCarWon) {
    if (!isHost) return;
    
    const reward = myCarWon ? 3000 : 1000;
    const resultMessage = myCarWon ? "恭喜，你赢了比赛!" : "你输了，但获得安慰奖。";
    
    if (connection && connection.open) {
        const remoteReward = myCarWon ? 1000 : 3000;
        connection.send({ type: 'settlement', credits_awarded: remoteReward, message: remoteReward > 1000 ? "你赢得了比赛!" : "你输了比赛。" });
    }
    
    // 结算给自己
    addCredits(reward);
    document.getElementById('upgrade-message').style.color = 'green';
    document.getElementById('upgrade-message').innerText = `${resultMessage} 奖励: ${reward} 金币。`;
    
    raceActive = false;
    document.getElementById('start-race-button').disabled = false;
    document.getElementById('my-lap-count').innerText = `${MAX_LAPS} / ${MAX_LAPS}`;
}


// --- PeerJS & 联机逻辑 ---

function initializePeer() {
    peer = new Peer({ debug: 2 }); 

    peer.on('open', (id) => {
        document.getElementById('my-peer-id').innerText = id;
        document.getElementById('my-peer-id').className = 'status-badge status-connected';
        Physics.initPhysics(playerData.cars[0]);
        Physics.onCollisionStart(handleCollision); // 注册碰撞回调
        setInterval(sendGameState, 1000 / 30);
    });

    peer.on('connection', (conn) => {
        connection = conn;
        setupConnectionListeners(conn);
    });
}

export function connectToPeer() {
    const remoteId = document.getElementById('remote-id').value;
    if (!remoteId) return alert('请输入对方的 Peer ID');
    connection = peer.connect(remoteId);
    setupConnectionListeners(connection);
}

function setupConnectionListeners(conn) {
    const statusDisplay = document.getElementById('connection-status');
    
    conn.on('open', () => {
        statusDisplay.innerText = '已连接';
        statusDisplay.className = 'status-badge status-connected';
        const myCar = Physics.getMyCar();
        conn.send({ type: 'config', config: playerData.cars[0], x: myCar.position.x, y: myCar.position.y });
    });

    conn.on('data', handleReceivedData);
    conn.on('close', () => {
        statusDisplay.innerText = '已断开';
        statusDisplay.className = 'status-badge status-disconnected';
        Physics.removeRemoteCar();
    });
}

function sendGameState() {
    const myCar = Physics.getMyCar();
    if (connection && connection.open && myCar) {
        const state = { type: 'position', x: myCar.position.x, y: myCar.position.y, a: myCar.angle };
        connection.send(state);
    }
}

function sendRaceStateUpdate() {
    if (connection && connection.open) {
        connection.send({ type: 'race_state', lap: myRaceState.lap, nextCp: myRaceState.nextCheckpoint, label: myRaceState.label, finished: myRaceState.finished });
    }
}

export function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value;
    if (!connection || connection.open === false) return alert('尚未建立连接!');
    if (message) {
        connection.send({ type: 'chat', message: message });
        input.value = '';
        const log = document.getElementById('messages-log');
        const entry = document.createElement('p');
        entry.innerHTML = `**[自己]** 发送: ${message}`;
        log.prepend(entry);
    }
}

function handleReceivedData(data) {
    const log = document.getElementById('messages-log');
    const entry = document.createElement('p');
    
    if (data.type === 'chat') { entry.innerHTML = `**[消息]** 收到: ${data.message}`; } 
    else if (data.type === 'position') {
        Physics.updateRemoteCar(data.x, data.y, data.a);
        document.getElementById('game-status-log').innerHTML = `**[游戏同步]** 对方位置: (X:${data.x.toFixed(0)}, Y:${data.y.toFixed(0)})`;
        return; 
    } else if (data.type === 'config') {
        Physics.addRemoteCar(data.x, data.y);
        entry.innerHTML = `**[配置同步]** 收到赛车配置: 引擎 Lv.${data.config.engineLevel}。已创建对手赛车。`;
    } else if (data.type === 'race_start') {
        isHost = false; raceActive = true; myRaceState = { ...initialRaceState }; remoteRaceState = { ...initialRaceState }; updateRaceUI();
        document.getElementById('start-race-button').disabled = true;
        entry.innerHTML = `**[比赛通知]** 主机开始了比赛!`;
    } else if (data.type === 'race_state') {
        remoteRaceState.lap = data.lap; remoteRaceState.nextCheckpoint = data.nextCp; remoteRaceState.label = data.label;
        if (data.finished && !remoteRaceState.finished) finishRace(false);
        updateRaceUI();
        return; 
    } else if (data.type === 'settlement') {
        addCredits(data.credits_awarded); 
        document.getElementById('upgrade-message').style.color = 'green';
        document.getElementById('upgrade-message').innerText = `收到比赛结算: ${data.message} 奖励: ${data.credits_awarded} 金币。`;
        raceActive = false;
        document.getElementById('start-race-button').disabled = false;
    } else { entry.innerHTML = `**[未知数据]** ${JSON.stringify(data)}`; }
    
    log.prepend(entry);
}


// --- 移动端适配和事件监听 ---

function handleTouch(key, isDown) {
    const stateKey = key.toUpperCase();
    if (Physics.KEY_STATE.hasOwnProperty(stateKey)) {
        Physics.KEY_STATE[stateKey] = isDown;
    }
}

function setupTouchControls() {
    const controls = [
        { id: 'btn-up', key: 'UP' }, { id: 'btn-down', key: 'DOWN' },
        { id: 'btn-left', key: 'LEFT' }, { id: 'btn-right', key: 'RIGHT' }
    ];

    controls.forEach(control => {
        const btn = document.getElementById(control.id);
        if (btn) {
            // 触摸事件
            btn.addEventListener('touchstart', (e) => { e.preventDefault(); handleTouch(control.key, true); });
            btn.addEventListener('touchend', (e) => { e.preventDefault(); handleTouch(control.key, false); });
            // 鼠标事件 (桌面端辅助)
            btn.addEventListener('mousedown', (e) => { e.preventDefault(); handleTouch(control.key, true); });
            btn.addEventListener('mouseup', (e) => { e.preventDefault(); handleTouch(control.key, false); });
            btn.addEventListener('mouseleave', () => { if (Physics.KEY_STATE[control.key]) handleTouch(control.key, false); });
        }
    });
}

function setupKeyboardControls() {
    document.addEventListener('keydown', (event) => {
        if (event.key === 'w' || event.key === 'W') Physics.KEY_STATE.UP = true;
        if (event.key === 's' || event.key === 'S') Physics.KEY_STATE.DOWN = true;
        if (event.key === 'a' || event.key === 'A') Physics.KEY_STATE.LEFT = true;
        if (event.key === 'd' || event.key === 'D') Physics.KEY_STATE.RIGHT = true;
    });

    document.addEventListener('keyup', (event) => {
        if (event.key === 'w' || event.key === 'W') Physics.KEY_STATE.UP = false;
        if (event.key === 's' || event.key === 'S') Physics.KEY_STATE.DOWN = false;
        if (event.key === 'a' || event.key === 'A') Physics.KEY_STATE.LEFT = false;
        if (event.key === 'd' || event.key === 'D') Physics.KEY_STATE.RIGHT = false;
    });
}


// --- 启动流程 ---

// 将核心函数挂载到 window 对象，以便 HTML 中的 onclick 调用
window.game = {
    saveTestData,
    addCredits,
    upgradePart,
    connectToPeer,
    sendMessage,
    startRace
};

// 确保在 DOM 完全加载后执行初始化
document.addEventListener('DOMContentLoaded', () => {
    loadPlayerData();
    initializePeer();
    setupTouchControls();
    setupKeyboardControls();
});
