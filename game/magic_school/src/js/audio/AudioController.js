/**
 * 音频控制器
 * 负责管理游戏中的所有音频
 */
export class AudioController {
    constructor(game) {
        this.game = game;

        // 音频上下文
        this.audioContext = null;
        this.sounds = {};
        this.backgroundMusic = null;
        this.musicVolume = 0.7;
        this.sfxVolume = 0.8;
    }

    /**
     * 初始化音频系统
     */
    init() {
        try {
            // 创建Web Audio API上下文
            window.AudioContext = window.AudioContext || new (window.AudioContext || window.webkitAudioContext)();
            this.audioContext = window.AudioContext;

            // 创建主增益节点
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.connect(this.audioContext.destination);

            // 创建音乐增益节点
            this.musicGainNode = this.audioContext.createGain();
            this.musicGainNode.connect(this.masterGainNode);

            // 创建音效增益节点
            this.sfxGainNode = this.audioContext.createGain();
            this.sfxGainNode.connect(this.masterGainNode);

            // 设置初始音量
            this.setMusicVolume(0.7);
            this.setSfxVolume(0.8);

            return true;
        } catch (error) {
            console.error('音频系统初始化失败:', error);
            return false;
        }
    }

    /**
     * 加载音频文件
     * @param {string} id - 音频ID
     * @returns {Promise} 是否加载成功
     */
    async loadSound(id) {
        try {
            // 如果音频已加载，直接返回
            if (this.sounds[id]) {
                return Promise.resolve(this.sounds[id]);
            }

            // 加载音频文件
            const response = await fetch(`src/assets/audio/sfx/${id}.mp3`);

            if (!response.ok) {
                throw new Error(`无法加载音频文件: ${id}`);
            }

            // 转换为ArrayBuffer
            const arrayBuffer = await response.arrayBuffer();

            // 创建音频缓冲
            const audioBuffer = this.audioContext.decodeAudioData(arrayBuffer);

            // 创建音频源
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;

            // 连接到增益节点
            source.connect(this.sfxGainNode);

            // 保存音频引用
            this.sounds[id] = {
                buffer: audioBuffer,
                source: source
            };

            return true;
        } catch (error) {
            console.error(`加载音频失败: ${id}`, error);
            return false;
        }
    }

    /**
     * 播放音效
     * @param {string} id - 音频ID
     * @param {number} volume - 音量（0-1）
     */
    playSound(id, volume = 1) {
        if (!this.sounds[id]) {
            console.warn(`音频未加载: ${id}`);
            return;
        }

        // 创建音频源
        const source = this.audioContext.createBufferSource();
        source.buffer = this.sounds[id].buffer;

        // 连接到增益节点
        source.connect(this.sfxGainNode);

        // 设置音量
        const actualVolume = (volume || 1) * this.sfxVolume;
        this.sfxGainNode.gain.value = actualVolume;

        // 播放音频
        source.start(0);

        // 设置自动停止
        source.onended = () => {
            source.disconnect();
        };
    }

    /**
     * 播放背景音乐
     * @param {string} id - 音乐ID
     * @param {boolean} loop - 是否循环播放
     */
    playBackgroundMusic(id, loop = true) {
        // 停止当前音乐
        this.stopBackgroundMusic();

        // 如果音乐已加载，直接播放
        if (this.sounds[id]) {
            // 创建音频源
            const source = this.audioContext.createBufferSource();
            source.buffer = this.sounds[id].buffer;

            // 连接到音乐增益节点
            source.connect(this.musicGainNode);

            // 设置循环
            source.loop = loop;

            // 播放音频
            source.start(0);

            // 保存当前音乐引用
            this.backgroundMusic = {
                buffer: this.sounds[id].buffer,
                source: source
            };
        } else {
            console.warn(`音乐未加载: ${id}`);
        }
    }

    /**
     * 停止背景音乐
     */
    stopBackgroundMusic() {
        if (this.backgroundMusic && this.backgroundMusic.source) {
            // 停止音频源
            this.backgroundMusic.source.stop();

            // 断开连接
            this.backgroundMusic.source.disconnect();

            // 清除引用
            this.backgroundMusic = null;
        }
    }

    /**
     * 设置音乐音量
     * @param {number} volume - 音量（0-1）
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        this.musicGainNode.gain.value = this.musicVolume;
    }

    /**
     * 设置音效音量
     * @param {number} volume - 音量（0-1）
     */
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.sfxGainNode.gain.value = this.sfxVolume;
    }

    /**
     * 暂停所有音频
     */
    pauseAll() {
        if (this.audioContext.state === 'running') {
            this.audioContext.suspend();
        }
    }

    /**
     * 恢复所有音频
     */
    resumeAll() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    /**
     * 更新音频系统
     * @param {number} deltaTime - 帧间隔时间
     */
    update(deltaTime) {
        // 当前不需要特殊更新
    }
}
// 场景音效管理
class SceneAudioManager {
    constructor(audioController) {
        this.audioController = audioController;
        this.sceneMusic = {
            'tower': 'tower-theme',
            'fire-canyon': 'fire-theme',
            'ice-field': 'ice-theme',
            'thunder-plateau': 'thunder-theme',
            'nature-forest': 'nature-theme',
            'chaos-rift': 'chaos-theme'
        };
    }

    playSceneMusic(sceneId) {
        const musicId = this.sceneMusic[sceneId];
        if (musicId) {
            this.audioController.playBackgroundMusic(musicId);
        }
    }
}

