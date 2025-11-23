
import * as THREE from 'three';
import { SceneManager } from './SceneManager.js';
import { ResourceManager } from './ResourceManager.js';
import { PlayerController } from '../entities/PlayerController.js';
import { NPCController } from '../entities/NPCController.js';
import { UIController } from '../ui/UIController.js';
import { AudioController } from '../audio/AudioController.js';
import { SaveSystem } from './SaveSystem.js';
import { EventBus } from './EventBus.js';
import { SpellSystem } from './SpellSystem.js';
import { QuestSystem } from './QuestSystem.js';
import { InventorySystem } from './InventorySystem.js';

// 将 THREE 设为全局变量，以便其他文件使用
window.THREE = THREE;
/**
 * 游戏主控制器
 * 负责初始化和管理所有游戏系统
 */
export class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.loadingScreen = document.getElementById('loading-screen');
        this.loadingProgress = document.getElementById('loading-progress');
        this.loadingText = document.getElementById('loading-text');

        // 游戏状态
        this.isInitialized = false;
        this.isPaused = false;

        // 核心系统
        this.sceneManager = null;
        this.resourceManager = null;
        this.playerController = null;
        this.npcController = null;
        this.uiController = null;
        this.audioController = null;
        this.saveSystem = null;
        this.spellSystem = null;
        this.questSystem = null;
        this.inventorySystem = null;

        // 渲染相关
        this.renderer = null;
        this.camera = null;
        this.clock = null;

        // 事件总线
        this.eventBus = new EventBus();
        
        // 游戏统计
        this.stats = {
            playTime: 0,
            enemiesKilled: 0,
            spellsCast: 0,
            damageDealt: 0,
            damageTaken: 0
        };
    }

    /**
     * 初始化游戏
     */
    async init() {
        try {
            // 更新加载提示
            this.updateLoadingProgress(5, '初始化渲染器...');

            // 初始化Three.js渲染器
            this.initRenderer();

            // 初始化核心系统
            this.updateLoadingProgress(10, '初始化游戏系统...');
            this.sceneManager = new SceneManager(this);
            this.resourceManager = new ResourceManager(this);
            this.npcController = new NPCController(this);
            this.uiController = new UIController(this);
            this.audioController = new AudioController(this);
            this.saveSystem = new SaveSystem(this);
            this.spellSystem = new SpellSystem(this);
            this.questSystem = new QuestSystem(this);
            this.inventorySystem = new InventorySystem(this);
          
            // 初始化时钟
            this.clock = new THREE.Clock();

            // 加载资源
            this.updateLoadingProgress(20, '加载游戏资源...');
            await this.resourceManager.loadAllResources();

            // 初始化场景
            this.updateLoadingProgress(60, '初始化游戏场景...');
            await this.sceneManager.init();

            // 初始化玩家
            this.updateLoadingProgress(80, '初始化玩家角色...');
            this.playerController = new PlayerController(this);
            await this.playerController.init();

            // 初始化UI
            this.updateLoadingProgress(90, '初始化用户界面...');
            this.uiController.init();
            
            // 初始化物品系统
            this.inventorySystem.init();

            // 设置事件监听
            this.setupEventListeners();

            // 尝试加载存档
            this.updateLoadingProgress(95, '加载游戏存档...');
            this.saveSystem.loadGame();

            // 完成初始化
            this.updateLoadingProgress(100, '游戏加载完成！');

            // 隐藏加载界面，显示游戏
            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
                this.isInitialized = true;

                // 开始游戏循环
                this.startGameLoop();

                // 播放背景音乐
                this.audioController.playBackgroundMusic('main-theme');

                // 如果是新游戏，显示初始对话
                if (!this.saveSystem.hasSaveData()) {
                    this.sceneManager.startNewGame();
                }
            }, 1000);

        } catch (error) {
            console.error('游戏初始化错误:', error);
            throw error;
        }
    }

    /**
     * 初始化Three.js渲染器
     */
    initRenderer() {
        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false
        });

        // 设置渲染器属性
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        // 创建相机
        this.camera = new THREE.PerspectiveCamera(
            75, // 视野角度
            window.innerWidth / window.innerHeight, // 长宽比
            0.1, // 近裁剪面
            1000 // 远裁剪面
        );
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 窗口大小变化
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // 页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });

        // 键盘事件
        document.addEventListener('keydown', (event) => {
            // 如果游戏未初始化或正在显示对话框，则不处理
            if (!this.isInitialized || this.uiController.isDialogueActive) {
                return;
            }

            // 处理特殊按键
            switch (event.code) {
                case 'KeyC':
                    this.uiController.togglePanel('attributes-panel');
                    break;
                case 'KeyV':
                    this.uiController.togglePanel('spells-panel');
                    break;
                case 'KeyQ':
                    this.uiController.togglePanel('quests-panel');
                    break;
                case 'KeyM':
                    this.sceneManager.switchToNextScene();
                    break;
                case 'Escape':
                    // 暂停游戏
                    this.togglePause();
                    break;
            }
        });

        // 鼠标事件
        document.addEventListener('mousedown', (event) => {
            if (!this.isInitialized || this.uiController.isDialogueActive) {
                return;
            }

            if (event.button === 0) { // 左键
                this.playerController.handleMouseClick(event);
            }
        });

        document.addEventListener('contextmenu', (event) => {
            // 阻止右键菜单
            event.preventDefault();

            if (!this.isInitialized || this.uiController.isDialogueActive) {
                return;
            }

            if (event.button === 2) { // 右键
                this.playerController.handleRightClick(event);
            }
        });
    }

    /**
     * 开始游戏循环
     */
    startGameLoop() {
        const animate = () => {
            requestAnimationFrame(animate);

            if (!this.isPaused) {
                const deltaTime = this.clock.getDelta();

                // 更新场景
                this.sceneManager.update(deltaTime);

                // 更新玩家
                this.playerController.update(deltaTime);

                // 更新UI
                this.uiController.update(deltaTime);

                // 更新音频
                this.audioController.update();

                // 渲染场景
                this.renderer.render(this.sceneManager.scene, this.camera);
            }
        };

        animate();
    }

    /**
     * 更新加载进度
     * @param {number} progress - 进度百分比 (0-100)
     * @param {string} text - 加载提示文本
     */
    updateLoadingProgress(progress, text) {
        this.loadingProgress.style.width = `${progress}%`;
        this.loadingText.textContent = `${text} ${progress}%`;
    }

    /**
     * 暂停游戏
     */
    pause() {
        if (!this.isPaused) {
            this.isPaused = true;
            this.audioController.pauseAll();
            this.eventBus.emit('game-paused');
        }
    }

    /**
     * 恢复游戏
     */
    resume() {
        if (this.isPaused) {
            this.isPaused = false;
            this.audioController.resumeAll();
            this.eventBus.emit('game-resumed');
        }
    }

    /**
     * 切换暂停状态
     */
    togglePause() {
        if (this.isPaused) {
            this.resume();
        } else {
            this.pause();
        }
    }

    /**
     * 游戏结束
     * @param {boolean} isVictory - 是否胜利
     */
    gameOver(isVictory) {
        this.isPaused = true;

        const gameOverScreen = document.getElementById('game-over-screen');
        const gameOverTitle = document.getElementById('game-over-title');
        const gameOverMessage = document.getElementById('game-over-message');
        const restartBtn = document.getElementById('restart-btn');

        if (isVictory) {
            gameOverTitle.textContent = '恭喜通关！';
            gameOverMessage.textContent = '你成功封印了混沌领主，成为了埃瑟里亚大陆的守护者！';
        } else {
            gameOverTitle.textContent = '挑战失败';
            gameOverMessage.textContent = '你被混沌魔兽击败了，但不要放弃，再试一次吧！';
        }

        gameOverScreen.classList.remove('hidden');

        // 重新开始按钮事件
        restartBtn.onclick = () => {
            gameOverScreen.classList.add('hidden');
            this.saveSystem.loadGame(); // 加载存档重新开始
            this.isPaused = false;
        };
    }
}

// 将Game类暴露为全局变量
window.Game = Game;