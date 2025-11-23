/**
 * 资源管理器
 * 负责加载和管理游戏中的模型、纹理、音频等资源
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class ResourceManager {
    constructor(game) {
        this.game = game;
        // 使用Map统一管理资源，便于扩展
        this.resources = new Map();
        this.resourceTypes = ['models', 'textures', 'audio', 'particles'];

        // 初始化资源容器
        for (const type of this.resourceTypes) {
            this.resources.set(type, {});
        }

        // 加载进度
        this.totalResources = 0;
        this.loadedResources = 0;
    }

    /**
     * 计算总资源数量
     */
    calculateTotalResources() {
        // 模型资源
        this.totalResources += Object.keys(this.modelConfigs).length;

        // 纹理资源
        this.totalResources += Object.keys(this.textureConfigs).length;

        // 音频资源
        this.totalResources += Object.keys(this.audioConfigs).length;

        // 粒子效果资源
        this.totalResources += Object.keys(this.particleConfigs).length;
    }

    /**
     * 验证资源配置
     * 检查资源URL是否有效（在实际项目中可以添加更多验证）
     */
    // ... existing code ...
    validateResourceConfigs() {
        const validateConfig = (configs, type) => {
            for (const [key, config] of Object.entries(configs)) {
                // 粒子配置使用texture字段，其他配置使用url字段
                if (type === '粒子效果') {
                    if (!config.texture && !config.maxParticles) {
                        console.warn(`${type}资源配置缺少必要字段: ${key}`, config);
                    }
                } else {
                    if (!config.url && !config.type) {
                        console.warn(`${type}资源配置缺少必要字段: ${key}`, config);
                    }
                    if (config.url && !config.url.startsWith('src/assets/')) {
                        console.warn(`${type}资源路径可能不正确: ${key} - ${config.url}`);
                    }
                }
            }
        };

        validateConfig(this.modelConfigs, '模型');
        validateConfig(this.textureConfigs, '纹理');
        validateConfig(this.audioConfigs, '音频');
        validateConfig(this.particleConfigs, '粒子效果');

        console.log('资源配置验证完成');
    }
    // ... existing code ...


    /**
     * 加载所有资源
     */
    async loadAllResources() {
        try {
            // 验证资源配置
            this.validateResourceConfigs();

            // 计算总资源数量
            this.calculateTotalResources();

            console.log(`开始加载资源，总计 ${this.totalResources} 个资源`);

            // 按类型顺序加载
            await this.loadTextures();
            await this.loadModels();
            await this.loadAudio();
            await this.loadParticles();

            console.log('所有资源加载完成');
            console.log(`总计加载: ${this.loadedResources}/${this.totalResources} 个资源`);
        } catch (error) {
            console.error('资源加载失败:', error);
            throw error;
        }
    }

    /**
     * 加载纹理
     */
    async loadTextures() {
        const loader = new THREE.TextureLoader();

        for (const [key, config] of Object.entries(this.textureConfigs)) {
            try {
                const texture = await loader.loadAsync(config.url);

                // 应用配置
                if (config.wrapS !== undefined) texture.wrapS = config.wrapS;
                if (config.wrapT !== undefined) texture.wrapT = config.wrapT;
                if (config.magFilter !== undefined) texture.magFilter = config.magFilter;
                if (config.minFilter !== undefined) texture.minFilter = config.minFilter;

                // 设置重复
                if (config.repeat) {
                    texture.repeat.set(config.repeat[0], config.repeat[1]);
                }

                this.resources.get('textures')[key] = texture;

                this.loadedResources++;
                this.updateLoadingProgress();

            } catch (error) {
                console.warn(`纹理加载失败: ${key}`, error);
                // 创建占位符纹理
                this.createPlaceholderTexture(key, config);
            }
        }
    }

    /**
     * 加载模型
     */
    async loadModels() {
        const loader = new GLTFLoader();

        for (const [key, config] of Object.entries(this.modelConfigs)) {
            try {
                const gltf = await loader.loadAsync(config.url);

                // 应用缩放
                if (config.scale) {
                    gltf.scene.scale.setScalar(config.scale);
                }

                this.resources.get('models')[key] = gltf.scene;

                this.loadedResources++;
                this.updateLoadingProgress();

            } catch (error) {
                console.warn(`模型加载失败: ${key}`, error);
                // 创建默认模型作为回退
                this.createDefaultModel(key, config);
            }
        }
    }

    /**
     * 加载音频
     */
    async loadAudio() {
        const loader = new THREE.AudioLoader();
        const audioContext = this.game.audioController.context;

        for (const [key, config] of Object.entries(this.audioConfigs)) {
            try {
                const buffer = await loader.loadAsync(config.url);
                this.resources.get('audio')[key] = buffer;

                this.loadedResources++;
                this.updateLoadingProgress();

            } catch (error) {
                console.warn(`音频加载失败: ${key}`, error);
                // 创建静音缓冲区作为回退
                this.createSilentAudioBuffer(key, config);
            }
        }
    }

    /**
     * 加载粒子效果
     */
    // 替换 loadParticles 方法
    async loadParticles() {
        // 粒子效果通常不需要额外的加载，直接使用配置创建
        // 这里可以扩展为加载粒子纹理等资源
        for (const [key, config] of Object.entries(this.particleConfigs)) {
            try {
                // 为粒子效果创建程序化纹理
                if (config.texture) {
                    config.texture = this.createProceduralParticleTexture(key);
                }

                this.resources.get('particles')[key] = config;
                this.loadedResources++;
                this.updateLoadingProgress();

            } catch (error) {
                console.warn(`粒子效果配置加载失败: ${key}`, error);
                // 即使没有纹理，也保留基础配置
                this.resources.get('particles')[key] = config;
                this.loadedResources++;
                this.updateLoadingProgress();
            }
        }
    }

    /**
     * 创建程序化粒子纹理
     * @param {string} type - 粒子类型
     * @returns {THREE.Texture} 粒子纹理
     */
    createProceduralParticleTexture(type) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext('2d');

        // 创建径向渐变
        const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);

        if (type === 'fire') {
            // 火焰粒子：橙色到透明
            gradient.addColorStop(0, 'rgba(255, 165, 0, 1)');
            gradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
        } else if (type === 'ice') {
            // 冰霜粒子：蓝色到透明
            gradient.addColorStop(0, 'rgba(135, 206, 235, 1)');
            gradient.addColorStop(1, 'rgba(0, 191, 255, 0)');
        } else {
            // 默认粒子：白色到透明
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        }

        context.fillStyle = gradient;
        context.fillRect(0, 0, 64, 64);

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }


    /**
     * 获取资源
     * @param {string} type - 资源类型
     * @param {string} key - 资源键名
     * @returns {*} 资源对象
     */
    getResource(type, key) {
        const resources = this.resources.get(type);
        if (!resources) {
            throw new Error(`未知资源类型: ${type}`);
        }
        const resource = resources[key];
        if (!resource) {
            console.warn(`资源不存在: ${type}.${key}`);
            return null;
        }
        return resource;
    }

    /**
     * 预加载关键资源
     * @param {Array} priorityResources - 优先加载的资源列表
     */
    async preloadPriorityResources(priorityResources) {
        const loader = new THREE.TextureLoader();

        for (const { type, key, url } of priorityResources) {
            try {
                if (type === 'textures') {
                    const texture = await loader.loadAsync(url);
                    this.resources.get('textures')[key] = texture;
                    console.log(`优先资源加载完成: ${key}`);
                }
            } catch (error) {
                console.warn(`优先资源加载失败: ${key}`, error);
            }
        }
    }

    /**
     * 卸载资源以释放内存
     * @param {string} type - 资源类型
     * @param {string} key - 资源键名
     */
    unloadResource(type, key) {
        const resources = this.resources.get(type);
        if (resources && resources[key]) {
            const resource = resources[key];

            // 根据资源类型执行清理
            if (type === 'textures' && resource.dispose) {
                resource.dispose();
            } else if (type === 'models' && resource.traverse) {
                // 清理模型几何体和材质
                resource.traverse((child) => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(material => material.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                });
            }

            delete resources[key];
            console.log(`资源已卸载: ${type}.${key}`);
        }
    }

    /**
     * 获取加载进度百分比
     * @returns {number} 加载进度 (0-100)
     */
    getLoadingProgress() {
        if (this.totalResources === 0) return 0;
        return Math.round((this.loadedResources / this.totalResources) * 100);
    }

    /**
     * 检查资源是否已加载
     * @param {string} type - 资源类型
     * @param {string} key - 资源键名
     * @returns {boolean} 是否已加载
     */
    isResourceLoaded(type, key) {
        const resources = this.resources.get(type);
        return resources && resources[key] !== undefined;
    }

    /**
     * 获取资源加载统计信息
     * @returns {Object} 统计信息
     */
    getResourceStats() {
        const stats = {
            total: this.totalResources,
            loaded: this.loadedResources,
            progress: this.getLoadingProgress(),
            byType: {}
        };

        // 按类型统计
        for (const type of this.resourceTypes) {
            const resources = this.resources.get(type);
            stats.byType[type] = {
                total: Object.keys(this[`${type}Configs`] || {}).length,
                loaded: Object.keys(resources || {}).length,
                resources: Object.keys(resources || {})
            };
        }

        return stats;
    }

    /**
     * 清理所有资源
     */
    disposeAll() {
        console.log('开始清理所有资源...');

        for (const type of this.resourceTypes) {
            const resources = this.resources.get(type);
            if (resources) {
                for (const key of Object.keys(resources)) {
                    this.unloadResource(type, key);
                }
            }
        }

        this.resources.clear();
        this.totalResources = 0;
        this.loadedResources = 0;

        console.log('所有资源已清理完成');
    }

    /**
     * 重新加载指定类型的资源
     * @param {string} type - 资源类型
     */
    async reloadResourceType(type) {
        console.log(`重新加载 ${type} 类型资源...`);

        const resources = this.resources.get(type);
        if (resources) {
            // 先卸载现有资源
            for (const key of Object.keys(resources)) {
                this.unloadResource(type, key);
            }
        }

        // 重新加载
        switch (type) {
            case 'textures':
                await this.loadTextures();
                break;
            case 'models':
                await this.loadModels();
                break;
            case 'audio':
                await this.loadAudio();
                break;
            case 'particles':
                await this.loadParticles();
                break;
        }

        console.log(`${type} 类型资源重新加载完成`);
    }

    /**
     * 创建占位符纹理
     * @param {string} key - 资源键名
     * @param {Object} config - 原始配置
     */
    createPlaceholderTexture(key, config) {
        try {
            // 创建canvas作为占位符
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const context = canvas.getContext('2d');

            // 绘制占位符图案
            context.fillStyle = '#ff0000';
            context.fillRect(0, 0, 32, 32);
            context.fillRect(32, 32, 32, 32);
            context.fillStyle = '#ffffff';
            context.fillRect(32, 0, 32, 32);
            context.fillRect(0, 32, 32, 32);

            // 添加文字标识
            context.fillStyle = '#000000';
            context.font = '12px Arial';
            context.textAlign = 'center';
            context.fillText('MISSING', 32, 36);

            const texture = new THREE.CanvasTexture(canvas);

            // 应用原始配置
            if (config.wrapS !== undefined) texture.wrapS = config.wrapS;
            if (config.wrapT !== undefined) texture.wrapT = config.wrapT;
            if (config.magFilter !== undefined) texture.magFilter = config.magFilter;
            if (config.minFilter !== undefined) texture.minFilter = config.minFilter;
            if (config.repeat) {
                texture.repeat.set(config.repeat[0], config.repeat[1]);
            }

            this.resources.get('textures')[key] = texture;
            this.loadedResources++;
            this.updateLoadingProgress();

            console.warn(`创建占位符纹理: ${key}`);
        } catch (error) {
            console.error(`创建占位符纹理失败: ${key}`, error);
        }
    }

    /**
     * 创建默认模型（立方体）
     * @param {string} key - 资源键名
     * @param {Object} config - 原始配置
     */
    createDefaultModel(key, config) {
        try {
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                wireframe: true
            });
            const mesh = new THREE.Mesh(geometry, material);

            // 应用缩放
            if (config.scale) {
                mesh.scale.setScalar(config.scale);
            }

            this.resources.get('models')[key] = mesh;
            this.loadedResources++;
            this.updateLoadingProgress();

            console.warn(`创建默认模型: ${key}`);
        } catch (error) {
            console.error(`创建默认模型失败: ${key}`, error);
        }
    }

    /**
     * 创建静音音频缓冲区
     * @param {string} key - 资源键名
     * @param {Object} config - 原始配置
     */
    createSilentAudioBuffer(key, config) {
        try {
            // 创建1秒的静音音频缓冲区
            const duration = 1.0;
            const sampleRate = 44100;
            const numChannels = 2;
            const buffer = this.game.audioController.context.createBuffer(
                numChannels,
                duration * sampleRate,
                sampleRate
            );

            // 填充静音数据
            for (let channel = 0; channel < numChannels; channel++) {
                const channelData = buffer.getChannelData(channel);
                for (let i = 0; i < channelData.length; i++) {
                    channelData[i] = 0;
                }
            }

            this.resources.get('audio')[key] = buffer;
            this.loadedResources++;
            this.updateLoadingProgress();

            console.warn(`创建静音音频缓冲区: ${key}`);
        } catch (error) {
            console.error(`创建静音音频缓冲区失败: ${key}`, error);
        }
    }

    /**
  * 更新加载进度
  */
    updateLoadingProgress() {
        const progress = Math.round((this.loadedResources / this.totalResources) * 100);
        if (this.game && typeof this.game.updateLoadingProgress === 'function') {
            this.game.updateLoadingProgress(progress, '加载游戏资源...');
        }
    }


    // 资源配置定义
    get modelConfigs() {
        return {
            // 玩家模型 - 男性版本，用于玩家角色创建
            'player-male': {
                url: 'src/assets/models/players/player-male.glb',
                scale: 1.0,
                description: '男性玩家角色模型'
            },
            // 玩家模型 - 女性版本，用于玩家角色创建
            'player-female': {
                url: 'src/assets/models/players/player-female.glb',
                scale: 1.0,
                description: '女性玩家角色模型'
            },
            // 宝箱模型 - 用于火峡谷场景的宝箱交互
            'treasure-chest': {
                url: 'src/assets/models/props/treasure-chest.glb',
                scale: 0.8,
                description: '宝箱模型，用于场景中的宝箱交互'
            },
            // 远古石碑模型 - 用于火峡谷场景的石碑交互
            'ancient-stone': {
                url: 'src/assets/models/props/ancient-stone.glb',
                scale: 1.2,
                description: '远古石碑模型，用于场景中的石碑交互'
            },
            // 塔楼物体模型 - 技能书
            'skill-book': {
                url: 'src/assets/models/props/skill-book.glb',
                scale: 1.0,
                description: '技能书模型，用于塔楼场景的技能学习'
            },
            // 塔楼物体模型 - 任务面板
            'task-board': {
                url: 'src/assets/models/props/task-board.glb',
                scale: 1.0,
                description: '任务面板模型，用于塔楼场景的任务交互'
            },
            // 塔楼物体模型 - 存档石碑
            'save-stone': {
                url: 'src/assets/models/props/save-stone.glb',
                scale: 1.2,
                description: '存档石碑模型，用于塔楼场景的存档功能'
            },
            // 塔楼物体模型 - 书架
            'bookshelf': {
                url: 'src/assets/models/props/bookshelf.glb',
                scale: 1.0,
                description: '书架模型，用于塔楼场景的知识展示'
            },
            // 冰虫模型 - 用于冰原场景的敌人
            'ice-worm': {
                url: 'src/assets/models/creatures/ice-worm.glb',
                scale: 1.5,
                description: '冰虫模型，用于冰原场景的敌人'
            },
            // 冰元素模型 - 用于冰原场景的敌人
            'ice-elemental': {
                url: 'src/assets/models/creatures/ice-elemental.glb',
                scale: 1.0,
                description: '冰元素模型，用于冰原场景的敌人'
            },// 火焰峡谷敌人
            'fire-beast': {
                url: 'src/assets/models/creatures/fire-beast.glb',
                scale: 1.0,
                description: '火焰幼兽模型，用于火焰峡谷场景的敌人'
            },
            'fire-lord': {
                url: 'src/assets/models/creatures/fire-lord.glb',
                scale: 1.5,
                description: '火焰领主模型，'
            },


            // 雷电高原敌人
            'thunder-bat': {
                url: 'src/assets/models/creatures/thunder-bat.glb',
                scale: 1.0,
                description: '雷电蝙蝠模型，用于雷电高原场景的敌人'
            },
            'thunder-messenger': {
                url: 'src/assets/models/creatures/thunder-messenger.glb',
                scale: 1.2,
                description: '雷电使者模型，用于雷电高原场景的敌人'
            },
            'thunder-lord': {
                url: 'src/assets/models/creatures/thunder-lord.glb',
                scale: 1.5,
                description: '雷电领主模型，'
            },



            // 自然森林敌人
            'vine-monster': {
                url: 'src/assets/models/creatures/vine-monster.glb',
                scale: 1.0,
                description: '藤蔓怪模型，用于自然森林场景的敌人'
            },
            'nature-guardian': {
                url: 'src/assets/models/creatures/nature-guardian.glb',
                scale: 1.5,
                description: '自然守护者模型，用于自然森林场景的精英敌人'
            },

            // 基础敌人模型 - 用于通用敌人
            'enemy': {
                url: 'src/assets/models/creatures/enemy.glb',
                scale: 1.0,
                description: '基础敌人模型'
            },
            // NPC模型 - 商人
            'npc-merchant': {
                //url: 'src/assets/models/npcs/merchant.glb',
                url: 'src/assets/models/npcs/角色-A.glb',
                scale: 1.0,
                description: '商人NPC模型'
            },
            // NPC模型 - 导师
            'npc-mentor': {
                // url: 'src/assets/models/npcs/mentor.glb',
                url: 'src/assets/models/npcs/角色-B.glb',
                scale: 1.0,
                description: '导师NPC模型'
            },
            // NPC模型 - 村民
            'npc-villager': {
                //url: 'src/assets/models/npcs/villager.glb',
                url: 'src/assets/models/npcs/角色-C.glb',
                scale: 1.0,
                description: '村民NPC模型'
            },
            // NPC模型 - 守卫
            'npc-guard': {
                //url: 'src/assets/models/npcs/guard.glb',
                url: 'src/assets/models/npcs/角色-D.glb',
                scale: 1.0,
                description: '守卫NPC模型'
            },
            // NPC模型 - 法师
            'npc-mage': {
                //url: 'src/assets/models/npcs/mage.glb',
                url: 'src/assets/models/npcs/角色-E.glb',
                scale: 1.0,
                description: '法师NPC模型'
            },

            // 塔楼场景模型
            'tower-scene': {
                url: 'src/assets/models/scenes/the_tower_of_starfall_magic_academy.glb',
                scale: 1.0,
                description: '星陨之塔魔法学院场景模型'
            },

            // 场景模型 - 火焰峡谷
            'fire-canyon': {
                url: 'src/assets/models/scenes/fire_canyon_scene.glb',
                scale: 1.0,
                description: '火焰峡谷场景模型'
            },
            // 场景模型 - 冰原
            'ice-field': {
                url: 'src/assets/models/scenes/ice_field_scene.glb',
                scale: 1.0,
                description: '冰原场景模型'
            },
            // 场景模型 - 雷霆高原
            'thunder-plateau': {
                url: 'src/assets/models/scenes/thunder_plateau_scene.glb',
                scale: 1.0,
                description: '雷霆高原场景模型'
            },
            // 场景模型 - 自然森林
            'nature-forest': {
                url: 'src/assets/models/scenes/nature_forest_scene.glb',
                scale: 1.0,
                description: '自然森林场景模型'
            },
            // 场景模型 - 混沌裂隙
            'chaos-rift': {
                url: 'src/assets/models/scenes/chaos_rift_scene.glb',
                scale: 1.0,
                description: '混沌裂隙场景模型'
            }
        };
    }

    get textureConfigs() {
        return {
            // UI金币图标纹理
            'ui-gold-icon': {
                url: 'src/assets/icons/gold.png',
                wrapS: THREE.ClampToEdgeWrapping,
                wrapT: THREE.ClampToEdgeWrapping,
                magFilter: THREE.LinearFilter,
                minFilter: THREE.LinearFilter,
                description: 'UI金币图标'
            },
            // UI按钮纹理
            'ui-button': {
                url: 'src/assets/textures/ui/button.png',
                wrapS: THREE.ClampToEdgeWrapping,
                wrapT: THREE.ClampToEdgeWrapping,
                magFilter: THREE.LinearFilter,
                minFilter: THREE.LinearFilter,
                description: 'UI按钮纹理'
            },
            // UI面板背景纹理
            'ui-panel-bg': {
                url: 'src/assets/textures/ui/panel-bg.png',
                wrapS: THREE.ClampToEdgeWrapping,
                wrapT: THREE.ClampToEdgeWrapping,
                magFilter: THREE.LinearFilter,
                minFilter: THREE.LinearFilter,
                description: 'UI面板背景纹理'
            },
            // NPC导师系列纹理 - 用于复用角色-B.glb模型
            'npc-mentor-fire': {
                url: 'src/assets/textures/npcs/mentor-fire.png',
                wrapS: THREE.ClampToEdgeWrapping,
                wrapT: THREE.ClampToEdgeWrapping,
                magFilter: THREE.LinearFilter,
                minFilter: THREE.LinearFilter,
                description: '火焰导师纹理'
            },
            'npc-mentor-ice': {
                url: 'src/assets/textures/npcs/mentor-ice.png',
                wrapS: THREE.ClampToEdgeWrapping,
                wrapT: THREE.ClampToEdgeWrapping,
                magFilter: THREE.LinearFilter,
                minFilter: THREE.LinearFilter,
                description: '冰霜导师纹理'
            },
            'npc-mentor-thunder': {
                url: 'src/assets/textures/npcs/mentor-thunder.png',
                wrapS: THREE.ClampToEdgeWrapping,
                wrapT: THREE.ClampToEdgeWrapping,
                magFilter: THREE.LinearFilter,
                minFilter: THREE.LinearFilter,
                description: '雷电导师纹理'
            },
            'npc-mentor-nature': {
                url: 'src/assets/textures/npcs/mentor-nature.png',
                wrapS: THREE.ClampToEdgeWrapping,
                wrapT: THREE.ClampToEdgeWrapping,
                magFilter: THREE.LinearFilter,
                minFilter: THREE.LinearFilter,
                description: '自然导师纹理'
            },
            // NPC法师系列纹理 - 用于复用角色-E.glb模型
            'npc-mage': {
                url: 'src/assets/textures/npcs/mage.png',
                wrapS: THREE.ClampToEdgeWrapping,
                wrapT: THREE.ClampToEdgeWrapping,
                magFilter: THREE.LinearFilter,
                minFilter: THREE.LinearFilter,
                description: '法师纹理'
            },
            'npc-principal': {
                url: 'src/assets/textures/npcs/principal.png',
                wrapS: THREE.ClampToEdgeWrapping,
                wrapT: THREE.ClampToEdgeWrapping,
                magFilter: THREE.LinearFilter,
                minFilter: THREE.LinearFilter,
                description: '校长纹理'
            },
            'npc-wizard': {
                url: 'src/assets/textures/npcs/wizard.png',
                wrapS: THREE.ClampToEdgeWrapping,
                wrapT: THREE.ClampToEdgeWrapping,
                magFilter: THREE.LinearFilter,
                minFilter: THREE.LinearFilter,
                description: '魔法师纹理'
            },
            // NPC村民系列纹理 - 用于复用角色-C.glb模型
            'npc-alchemist': {
                url: 'src/assets/textures/npcs/alchemist.png',
                wrapS: THREE.ClampToEdgeWrapping,
                wrapT: THREE.ClampToEdgeWrapping,
                magFilter: THREE.LinearFilter,
                minFilter: THREE.LinearFilter,
                description: '药剂师纹理'
            }
        };
    }
    // NPC纹理映射配置 - 用于NPC模型的纹理替换
    get npcTextureMapConfigs() {
        return {
            // 导师系列NPC纹理映射
            'npc-mentor': {
                'fire-tutor': 'npc-mentor-fire',
                'ice-tutor': 'npc-mentor-ice',
                'thunder-tutor': 'npc-mentor-thunder',
                'nature-tutor': 'npc-mentor-nature',
                description: '导师系列NPC纹理映射配置'
            },
            // 法师系列NPC纹理映射
            'npc-mage': {
                'headmaster': 'npc-principal',
                'magician': 'npc-wizard',
                description: '法师系列NPC纹理映射配置'
            },
            // 村民系列NPC纹理映射
            'npc-villager': {
                'alchemist': 'npc-alchemist',
                description: '村民系列NPC纹理映射配置'
            }
        };
    }
    get audioConfigs() {
        return {
            // 施法音效 - 用于咒语施放
            'cast': {
                url: 'src/assets/audio/sfx/cast.mp3',
                volume: 0.7,
                description: '施法音效'
            },
            // 受击音效 - 用于角色受伤
            'hit': {
                url: 'src/assets/audio/sfx/player-hit.mp3',
                volume: 0.8,
                description: '受击音效'
            },
            // 火焰咒语音效 - 用于火系咒语
            'fire-spell': {
                url: 'src/assets/audio/sfx/fire-spell.mp3',
                volume: 0.9,
                description: '火焰咒语音效'
            },
            // 冰霜咒语音效 - 用于冰系咒语
            'ice-spell': {
                url: 'src/assets/audio/sfx/ice-spell.mp3',
                volume: 0.9,
                description: '冰霜咒语音效'
            },
            // 雷电咒语音效 - 用于雷系咒语
            'thunder-spell': {
                url: 'src/assets/audio/sfx/thunder-spell.mp3',
                volume: 0.9,
                description: '雷电咒语音效'
            },
            // 自然咒语音效 - 用于自然系咒语
            'nature-spell': {
                url: 'src/assets/audio/sfx/nature-spell.mp3',
                volume: 0.9,
                description: '自然咒语音效'
            },
            // 宝箱开启音效 - 用于宝箱交互
            'chest-open': {
                url: 'src/assets/audio/sfx/chest-open.mp3',
                volume: 0.6,
                description: '宝箱开启音效'
            },
            // 等级提升音效 - 用于玩家升级
            'level-up': {
                url: 'src/assets/audio/sfx/level-up.mp3',
                volume: 0.8,
                description: '等级提升音效'
            },
            // 胜利音效 - 用于战斗胜利
            'victory': {
                url: 'src/assets/audio/sfx/victory.mp3',
                volume: 0.9,
                description: '胜利音效'
            },
            // UI点击音效 - 用于界面交互
            'ui-click': {
                url: 'src/assets/audio/sfx/UI-click.mp3',
                volume: 0.5,
                description: 'UI点击音效'
            },
            // 敌人受击音效 - 用于敌人受伤
            'enemy-hit': {
                url: 'src/assets/audio/sfx/enemy-hit.mp3',
                volume: 0.7,
                description: '敌人受击音效'
            },
            // 玩家受击音效 - 用于玩家受伤
            'player-hit': {
                url: 'src/assets/audio/sfx/player-hit.mp3',
                volume: 0.8,
                description: '玩家受击音效'
            },
            // 背景音效 - 用于场景氛围
            'ambient': {
                url: 'src/assets/audio/music/main-theme.mp3',
                volume: 0.3,
                loop: true,
                description: '环境背景音效'
            },
            // 主界面背景音乐
            'main-theme': {
                url: 'src/assets/audio/music/main-theme.mp3',
                volume: 0.4,
                loop: true,
                description: '主界面背景音乐'
            },
            // 火焰峡谷背景音乐
            'fire-canyon-theme': {
                url: 'src/assets/audio/music/fire-canyon-theme.mp3',
                volume: 0.4,
                loop: true,
                description: '火焰峡谷背景音乐'
            },
            // 冰原背景音乐
            'ice-field-theme': {
                url: 'src/assets/audio/music/ice-field-theme.mp3',
                volume: 0.4,
                loop: true,
                description: '冰原背景音乐'
            },
            // 雷原背景音乐
            'thunder-plateau-theme': {
                url: 'src/assets/audio/music/thunder-plateau-theme.mp3',
                volume: 0.4,
                loop: true,
                description: '雷原背景音乐'
            },
            // 自然森林背景音乐
            'nature-forest-theme': {
                url: 'src/assets/audio/music/nature-forest-theme.mp3',
                volume: 0.4,
                loop: true,
                description: '自然森林背景音乐'
            },
            // 混沌裂隙背景音乐
            'chaos-rift-theme': {
                url: 'src/assets/audio/music/chaos-rift-theme.mp3',
                volume: 0.4,
                loop: true,
                description: '混沌裂隙背景音乐'
            },
            // 塔背景音乐
            'tower-theme': {
                url: 'src/assets/audio/music/tower-theme.mp3',
                volume: 0.4,
                loop: true,
                description: '塔背景音乐'
            },
            // 战斗背景音乐
            'battle-theme': {
                url: 'src/assets/audio/music/battle-theme.mp3',
                volume: 0.5,
                loop: true,
                description: '战斗背景音乐'
            }
        };
    }


    // 粒子效果配置 - 用于各种特效
    get particleConfigs() {
        return {
            // 火焰粒子效果 - 用于火系魔法和环境
            'fire': {
                texture: 'fire-particle',
                maxParticles: 1000,
                emissionRate: 50,
                lifeTime: 2.0,
                startSize: 0.1,
                endSize: 0.3,
                startColor: [1.0, 0.4, 0.0, 1.0],
                endColor: [1.0, 0.0, 0.0, 0.0],
                velocity: [0.0, 1.0, 0.0],
                acceleration: [0.0, 0.5, 0.0],
                gravity: [0.0, -0.5, 0.0],
                description: '火焰粒子效果'
            },
            // 冰霜粒子效果 - 用于冰系魔法
            'ice': {
                texture: 'ice-particle',
                maxParticles: 800,
                emissionRate: 40,
                lifeTime: 3.0,
                startSize: 0.05,
                endSize: 0.15,
                startColor: [0.7, 0.9, 1.0, 1.0],
                endColor: [0.3, 0.5, 1.0, 0.0],
                velocity: [0.0, 0.5, 0.0],
                acceleration: [0.0, 0.2, 0.0],
                gravity: [0.0, -0.3, 0.0],
                description: '冰霜粒子效果'
            },
            // 雷电粒子效果 - 用于雷系魔法
            'thunder': {
                texture: 'thunder-particle',
                maxParticles: 600,
                emissionRate: 30,
                lifeTime: 1.5,
                startSize: 0.03,
                endSize: 0.25,
                startColor: [1.0, 1.0, 0.0, 1.0],
                endColor: [0.8, 0.8, 1.0, 0.0],
                velocity: [0.0, 2.0, 0.0],
                acceleration: [0.0, 1.0, 0.0],
                gravity: [0.0, -1.0, 0.0],
                description: '雷电粒子效果'
            },
            // 自然粒子效果 - 用于自然系魔法
            'nature': {
                texture: 'nature-particle',
                maxParticles: 700,
                emissionRate: 35,
                lifeTime: 3.5,
                startSize: 0.04,
                endSize: 0.12,
                startColor: [0.2, 1.0, 0.2, 1.0],
                endColor: [0.0, 0.8, 0.0, 0.0],
                velocity: [0.0, 0.8, 0.0],
                acceleration: [0.0, 0.3, 0.0],
                gravity: [0.0, -0.2, 0.0],
                description: '自然粒子效果'
            },
            // 混沌粒子效果 - 用于混沌系魔法
            'chaos': {
                texture: 'chaos-particle',
                maxParticles: 900,
                emissionRate: 45,
                lifeTime: 2.8,
                startSize: 0.06,
                endSize: 0.18,
                startColor: [0.5, 0.0, 1.0, 1.0],
                endColor: [1.0, 0.0, 0.5, 0.0],
                velocity: [0.0, 1.2, 0.0],
                acceleration: [0.0, 0.4, 0.0],
                gravity: [0.0, -0.6, 0.0],
                description: '混沌粒子效果'
            },
            // 魔法光环粒子效果 - 用于施法特效
            'magic-circle': {
                texture: 'magic-circle-particle',
                maxParticles: 500,
                emissionRate: 20,
                lifeTime: 4.0,
                startSize: 0.2,
                endSize: 0.1,
                startColor: [1.0, 1.0, 0.0, 1.0],
                endColor: [1.0, 0.5, 0.0, 0.0],
                velocity: [0.0, 0.0, 0.0],
                acceleration: [0.0, 0.0, 0.0],
                gravity: [0.0, 0.0, 0.0],
                description: '魔法光环粒子效果'
            },
            // 升级粒子效果 - 用于角色升级
            'level-up': {
                texture: 'level-up-particle',
                maxParticles: 1200,
                emissionRate: 60,
                lifeTime: 2.5,
                startSize: 0.02,
                endSize: 0.2,
                startColor: [1.0, 1.0, 0.0, 1.0],
                endColor: [1.0, 0.5, 0.0, 0.0],
                velocity: [0.0, 1.0, 0.0],
                acceleration: [0.0, 0.3, 0.0],
                gravity: [0.0, -0.4, 0.0],
                description: '升级粒子效果'
            },
            // 治疗粒子效果 - 用于治疗魔法
            'heal': {
                texture: 'heal-particle',
                maxParticles: 500,
                emissionRate: 25,
                lifeTime: 2.2,
                startSize: 0.08,
                endSize: 0.16,
                startColor: [0.0, 1.0, 0.5, 1.0],
                endColor: [0.0, 0.5, 1.0, 0.0],
                velocity: [0.0, 0.6, 0.0],
                acceleration: [0.0, 0.2, 0.0],
                gravity: [0.0, -0.3, 0.0],
                description: '治疗粒子效果'
            },
            // 暴击粒子效果 - 用于暴击攻击
            'critical': {
                texture: 'critical-particle',
                maxParticles: 1500,
                emissionRate: 75,
                lifeTime: 1.8,
                startSize: 0.01,
                endSize: 0.3,
                startColor: [1.0, 0.2, 0.0, 1.0],
                endColor: [1.0, 1.0, 0.0, 0.0],
                velocity: [0.0, 1.5, 0.0],
                acceleration: [0.0, 0.8, 0.0],
                gravity: [0.0, -0.8, 0.0],
                description: '暴击粒子效果'
            },
            // 传送粒子效果 - 用于传送魔法
            'teleport': {
                texture: 'teleport-particle',
                maxParticles: 1000,
                emissionRate: 80,
                lifeTime: 3.0,
                startSize: 0.1,
                endSize: 0.0,
                startColor: [0.5, 0.5, 1.0, 1.0],
                endColor: [0.0, 0.0, 1.0, 0.0],
                velocity: [0.0, 0.0, 0.0],
                acceleration: [0.0, 0.0, 0.0],
                gravity: [0.0, 0.0, 0.0],
                description: '传送粒子效果'
            }
        };
    }
          

    /**
     * 创建粒子系统实例
     * @param {string} type - 粒子类型
     * @returns {Object} 粒子系统配置和实例
     */
    createParticleSystem(type) {
        const config = this.particleConfigs[type];
        if (!config) {
            console.warn(`未知的粒子类型: ${type}`);
            return null;
        }

        // 创建粒子几何体
        const geometry = new THREE.BufferGeometry();
        const count = config.maxParticles || 100;
        
        // 创建粒子属性数组
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const velocities = [];
        const lifetimes = new Float32Array(count);
        
        // 初始化粒子数据
        for (let i = 0; i < count; i++) {
            // 随机初始位置
            positions[i * 3] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
            
            // 颜色（从配置中获取）
            colors[i * 3] = config.startColor[0];
            colors[i * 3 + 1] = config.startColor[1];
            colors[i * 3 + 2] = config.startColor[2];
            
            // 大小（从配置中获取）
            sizes[i] = config.startSize || 0.1;
            
            // 生命周期
            lifetimes[i] = Math.random() * (config.lifeTime || 2.0);
            
            // 速度（从配置中获取）
            velocities.push({
                x: (config.velocity[0] || 0) + (Math.random() - 0.5) * 0.5,
                y: (config.velocity[1] || 0) + (Math.random() - 0.5) * 0.5,
                z: (config.velocity[2] || 0) + (Math.random() - 0.5) * 0.5
            });
        }
        
        // 设置几何体属性
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
        
        // 创建材质
        const material = new THREE.PointsMaterial({
            size: config.startSize || 0.1,
            vertexColors: true,
            transparent: true,
            opacity: config.startColor[3] || 1.0,
            blending: THREE.AdditiveBlending
        });
        
        // 创建粒子系统
        const particleSystem = new THREE.Points(geometry, material);
        particleSystem.userData = {
            type: type,
            config: config,
            velocities: velocities,
            emissionRate: config.emissionRate || 10,
            lastEmission: 0
        };
        
        return particleSystem;
    }
}