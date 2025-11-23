import * as THREE from 'three';
import { TowerScene } from '../scenes/TowerScene.js';
import { FireCanyonScene } from '../scenes/FireCanyonScene.js';
import { IceFieldScene } from '../scenes/IceFieldScene.js';
import { ThunderPlateauScene } from '../scenes/ThunderPlateauScene.js';
import { NatureForestScene } from '../scenes/NatureForestScene.js';
import { ChaosRiftScene } from '../scenes/ChaosRiftScene.js';

/**
 * 场景管理器
 * 负责加载、切换和管理游戏中的各个场景
 */
export class SceneManager {
    constructor(game) {
        this.game = game;
        this.scene = null;
        this.currentScene = null;
        this.scenes = {};
        this.currentSceneIndex = 0;
        this.sceneOrder = ['tower', 'fire-canyon', 'ice-field', 'thunder-plateau', 'nature-forest', 'chaos-rift'];
    }

    /**
     * 初始化场景管理器
     */
    async init() {
        // 创建Three.js场景
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x000000, 10, 100);

        // 创建环境光
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        // 初始化所有场景
        this.scenes['tower'] = new TowerScene(this.game);
        this.scenes['fire-canyon'] = new FireCanyonScene(this.game);
        this.scenes['ice-field'] = new IceFieldScene(this.game);
        this.scenes['thunder-plateau'] = new ThunderPlateauScene(this.game);
        this.scenes['nature-forest'] = new NatureForestScene(this.game);
        this.scenes['chaos-rift'] = new ChaosRiftScene(this.game);

        // 初始化每个场景
        for (const key in this.scenes) {
            await this.scenes[key].init();
        }

        // 默认加载塔场景
        await this.loadScene('tower');
    }

    /**
     * 加载指定场景
     * @param {string} sceneId - 场景ID
     */
    async loadScene(sceneId) {
        if (!this.scenes[sceneId]) {
            console.error(`场景 ${sceneId} 不存在`);
            return;
        }

        // 卸载当前场景
        if (this.currentScene) {
            this.currentScene.unload();
        }

        // 更新当前场景索引
        this.currentSceneIndex = this.sceneOrder.indexOf(sceneId);

        // 加载新场景
        this.currentScene = this.scenes[sceneId];
        await this.currentScene.load();

        // 更新玩家位置
        this.game.playerController.position.copy(this.currentScene.playerStartPosition);
        this.game.playerController.updateCamera();

        // 触发场景加载事件
        this.game.eventBus.emit('scene-loaded', sceneId);
    }

    /**
     * 切换到下一个场景
     */
    async switchToNextScene() {
        const nextIndex = (this.currentSceneIndex + 1) % this.sceneOrder.length;
        const nextSceneId = this.sceneOrder[nextIndex];
        await this.loadScene(nextSceneId);
    }

    /**
     * 更新场景
     * @param {number} deltaTime - 帧间隔时间
     */
    update(deltaTime) {
        if (this.currentScene) {
            this.currentScene.update(deltaTime);
        }
    }

    /**
     * 开始新游戏
     */
    startNewGame() {
        // 重置玩家状态
        this.game.playerController.reset();

        // 加载塔场景
        this.loadScene('tower');

        // 触发新游戏事件
        this.game.eventBus.emit('new-game-started');

        // 显示初始对话
        this.game.uiController.showDialogue(
            '院长',
            '欢迎来到星陨之塔，年轻的魔法师。我是这里的院长。你的天赋非常出色，但还需要不断学习和锻炼。首先，请选择你的元素专精，这将决定你未来能学习的咒语类型。'
        );
    }
}