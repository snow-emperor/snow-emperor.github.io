// js/physics.js

import { CHECKPOINTS, CAR_CONFIG } from './config.js';

const { Engine, Render, Runner, World, Bodies, Events, Body, Vector } = Matter;

let engine, render, runner, world;
let myCar, remoteCar;
const WIDTH = 800;
const HEIGHT = 400;

// 赛车控制状态（在 main.js 中被设置）
export const KEY_STATE = { UP: false, DOWN: false, LEFT: false, RIGHT: false };

// 动态物理参数
let ACCELERATION_FORCE = 0.001; 
let STEERING_SPEED = 0.02;      

// 初始化 Matter.js 引擎、赛道和赛车
export function initPhysics(playerCarConfig) {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;

    engine = Engine.create();
    world = engine.world;
    world.gravity.y = 0; 
    
    // 渲染器设置
    render = Render.create({
        canvas: canvas,
        engine: engine,
        options: { width: WIDTH, height: HEIGHT, wireframes: false, background: '#eeeeee' }
    });

    // 边界和赛道墙壁
    const walls = [
        Bodies.rectangle(WIDTH / 2, 0, WIDTH, 20, { isStatic: true, label: 'Wall' }),
        Bodies.rectangle(WIDTH / 2, HEIGHT, WIDTH, 20, { isStatic: true, label: 'Wall' }),
        Bodies.rectangle(0, HEIGHT / 2, 20, HEIGHT, { isStatic: true, label: 'Wall' }),
        Bodies.rectangle(WIDTH, HEIGHT / 2, 20, HEIGHT, { isStatic: true, label: 'Wall' }),
        Bodies.rectangle(400, 200, 400, 200, { isStatic: true, label: 'Inner Wall', render: { fillStyle: '#999999' } })
    ];
    World.add(world, walls);
    
    // 创建检查点
    CHECKPOINTS.forEach((cp, index) => {
        let body = Bodies.rectangle(cp.x, cp.y, cp.w, cp.h, { 
            isStatic: true, isSensor: true, 
            label: cp.label,
            render: { fillStyle: cp.label === 'Finish Line' ? '#00FF00' : '#FFFF00', opacity: 0.5 } 
        });
        body.index = index + 1; 
        World.add(world, body);
    });

    // 创建玩家赛车
    myCar = createCar(100, 150, 'blue', 'MyCar');
    World.add(world, myCar);
    updatePhysicsParameters(playerCarConfig); // 初始化物理参数
    
    Render.run(render);
    runner = Runner.create();
    Runner.run(runner, engine);
}

// 供 main.js 导入，用于在改装后更新物理参数
export function updatePhysicsParameters(carConfig) {
    ACCELERATION_FORCE = CAR_CONFIG.engine.getForce(carConfig.engineLevel);
    STEERING_SPEED = CAR_CONFIG.tires.getSteering(carConfig.tireLevel);
}

// 实际的物理控制循环
Events.on(engine, 'beforeUpdate', () => {
    if (!myCar) return;

    const velocity = myCar.velocity;
    const speed = Vector.magnitude(velocity);
    const direction = myCar.angle;

    // 1. 加速/减速
    if (KEY_STATE.UP) {
        const force = Vector.create(ACCELERATION_FORCE * Math.cos(direction), ACCELERATION_FORCE * Math.sin(direction));
        Body.applyForce(myCar, myCar.position, force);
    } else if (KEY_STATE.DOWN) {
        const force = Vector.create(-ACCELERATION_FORCE * 0.5 * Math.cos(direction), -ACCELERATION_FORCE * 0.5 * Math.sin(direction));
        Body.applyForce(myCar, myCar.position, force);
    }

    // 2. 转向
    if (KEY_STATE.LEFT) {
        Body.setAngularVelocity(myCar, myCar.angularVelocity - STEERING_SPEED * (speed / CAR_CONFIG.MAX_SPEED)); 
    } else if (KEY_STATE.RIGHT) {
        Body.setAngularVelocity(myCar, myCar.angularVelocity + STEERING_SPEED * (speed / CAR_CONFIG.MAX_SPEED));
    }

    // 3. 限制速度
    if (speed > CAR_CONFIG.MAX_SPEED) {
         const newVelocity = Vector.mult(Vector.normalise(velocity), CAR_CONFIG.MAX_SPEED);
         Body.setVelocity(myCar, newVelocity);
    }
});

// 赛车 body 创建函数
function createCar(x, y, color, label) {
    return Bodies.rectangle(x, y, 40, 20, {
        label: label,
        frictionAir: 0.1, 
        mass: 5,
        inertia: Infinity, 
        render: { fillStyle: color, strokeStyle: '#000000', lineWidth: 1 }
    });
}

// 导出 getter 和 setter
export const getMyCar = () => myCar;
export const getWorld = () => world;

export function addRemoteCar(x, y) {
    if (!world || remoteCar) return;
    remoteCar = createCar(x, y, 'red', 'RemoteCar');
    World.add(world, remoteCar);
}

export function updateRemoteCar(x, y, angle) {
    if (!remoteCar) return;
    Body.setPosition(remoteCar, { x: x, y: y });
    Body.setAngle(remoteCar, angle);
}

export function removeRemoteCar() {
    if (world && remoteCar) {
        World.remove(world, remoteCar);
        remoteCar = null;
    }
}

// 导出碰撞事件监听注册，在 main.js 中注册比赛逻辑
export function onCollisionStart(callback) {
    Events.on(engine, 'collisionStart', callback);
}
