// js/config.js

// 赛车和升级配置
export const CAR_CONFIG = {
    MAX_LAPS: 3,
    MAX_SPEED: 5,
    
    // 引擎属性和成本
    engine: {
        baseForce: 0.001,
        maxLevel: 5,
        getCost: (level) => level * 1000, 
        getForce: (level) => 0.001 + (level * 0.0005) 
    },
    
    // 轮胎属性和成本
    tires: {
        baseSteering: 0.02,
        maxLevel: 5,
        getCost: (level) => level * 500,
        getSteering: (level) => 0.02 + (level * 0.01)
    }
};

// 赛道检查点定义
export const CHECKPOINTS = [
    { x: 100, y: 350, w: 10, h: 50, label: 'CP1' }, 
    { x: 700, y: 350, w: 10, h: 50, label: 'CP2' }, 
    { x: 700, y: 50, w: 10, h: 50, label: 'CP3' },  
    { x: 100, y: 50, w: 50, h: 10, label: 'Finish Line' } 
];

// 玩家初始比赛状态
export const initialRaceState = {
    lap: 0,
    nextCheckpoint: 1, 
    finished: false,
    finishTime: null,
    label: 'Ready'
};

// 玩家默认数据
export const defaultPlayerData = {
    credits: 0,
    cars: [{ name: "Starter Car", engineLevel: 1, tireLevel: 1 }]
};
