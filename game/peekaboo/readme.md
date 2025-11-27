

游戏概述

现实版躲猫猫是一款基于地理位置和P2P技术的多人游戏，玩家分为"猫"和"老鼠"两个角色，在现实世界中展开追逐。

游戏特色

· 🎮 基于真实地理位置的增强现实体验
· 👥 支持多人在线实时互动
· 🗺️ 集成高德地图，实时显示玩家位置
· ⚡ 使用WebRTC技术实现P2P连接
· 📱 响应式设计，支持多种设备

游戏设定

角色分配

· 猫 (Cat): 追捕者角色，拥有地图显示功能，可以看到所有玩家的实时位置
· 老鼠 (Mouse): 躲藏者角色，没有地图显示，只能看到自己的状态

游戏流程

1. 房间创建与加入: 玩家创建或加入游戏房间
2. 准备阶段: 房主分配角色，所有玩家准备就绪
3. 躲藏阶段: 老鼠寻找躲藏地点，猫等待倒计时结束
4. 寻找阶段: 猫开始寻找老鼠，可以使用扫描功能
5. 游戏结束: 所有老鼠都被抓住时游戏结束

核心机制

· 扫描功能: 猫每隔设定时间自动扫描老鼠位置
· 抓住机制: 老鼠可以主动请求被抓，猫确认后角色转换
· 位置追踪: 实时获取和更新玩家地理位置

模块架构

1. GameStateManager (游戏状态管理)

核心属性

```javascript
GameState: {
    SETUP: 'setup',    // 初始设置
    LOBBY: 'lobby',    // 房间等待
    HIDING: 'hiding',  // 躲藏阶段
    SEEKING: 'seeking',// 寻找阶段
    ENDED: 'ended'     // 游戏结束
}

PlayerRole: {
    UNASSIGNED: 'unassigned',
    CAT: 'cat',
    MOUSE: 'mouse'
}
```

主要方法接口

· init(): 初始化游戏状态
· updateConfig(newConfig): 更新游戏配置
· addPlayer(playerId, playerData): 添加玩家
· updatePlayer(playerId, updates): 更新玩家状态
· checkAllReady(): 检查所有玩家是否准备就绪
· checkGameOver(): 检查游戏是否结束
· resetGameState(): 重置游戏状态（保持房间）
· resetGame(): 完全重置游戏

2. PeerConnectionManager (P2P连接管理)

核心功能

· 管理PeerJS连接
· 处理P2P消息通信
· 维护玩家连接状态

主要方法接口

· init(): 初始化PeerJS连接
· connectToHost(roomId): 连接到房主
· broadcast(message): 广播消息给所有玩家
· sendToHost(message): 发送消息给房主
· assignCatToPlayer(catPlayerId): 分配猫角色
· on(eventName, callback): 注册事件监听器

消息类型

· gameState: 游戏状态同步
· playerJoin: 玩家加入
· playersUpdate: 玩家列表更新
· playerReady: 准备状态变化
· assignCat: 角色分配
· startGame: 开始游戏
· playerPosition: 位置更新
· requestCatch: 请求被抓
· playerCaught: 确认抓住

3. MapManager (地图管理)

核心功能

· 高德地图初始化和管理
· 玩家位置标记显示
· 地图视图控制

主要方法接口

· init(containerId): 初始化地图
· updatePlayerMarkers(): 更新所有玩家标记
· addPlayerMarker(playerId, player): 添加单个玩家标记
· locateToCurrentPlayer(): 定位到当前玩家位置
· updateMapVisibility(): 更新地图可见性（仅猫可见）

4. UIManager (界面管理)

核心功能

· 管理所有UI界面和交互
· 处理用户输入和操作
· 更新界面状态

主要方法接口

· init(): 初始化UI组件和事件
· switchPhase(phase): 切换游戏阶段界面
· updatePlayersList(): 更新玩家列表显示
· updateGameInterface(): 更新游戏界面状态
· getPlayerLocation(): 获取玩家地理位置
· startGameTimer(): 开始游戏倒计时

界面阶段

· setupPhase: 初始设置界面
· lobbyPhase: 房间等待界面
· gamePhase: 游戏进行界面

5. Utils (工具函数)

核心功能

· 提供通用工具函数
· 数据处理和验证
· 用户通知管理

主要方法接口

· generateId(length): 生成随机ID
· formatTime(seconds): 格式化时间显示
· calculateDistance(lat1, lon1, lat2, lon2): 计算坐标距离
· validateNickname(nickname): 验证昵称格式
· showNotification(message, type, duration): 显示用户通知

快速开始

环境要求

· 现代浏览器（支持WebRTC和Geolocation API）
· HTTPS环境（地理位置API要求）
· 高德地图API Key

安装步骤

1. 申请高德地图API Key
2. 在index.html中替换你的高德地图Key
3. 部署到支持HTTPS的Web服务器
4. 确保所有文件路径正确

游戏配置

房主可以在创建房间时设置以下参数：

· 躲藏时间: 老鼠躲藏的时间（默认5分钟）
· 扫描冷却: 猫扫描位置的间隔时间（默认10分钟）
· 扫描时间: 每次扫描显示老鼠位置的时间（默认60秒）
· 扫描次数: 猫可以扫描的总次数（默认3次）

技术架构

前端技术栈

· HTML5/CSS3: 界面结构和样式
· JavaScript ES6+: 业务逻辑
· PeerJS: WebRTC P2P连接库
· 高德地图API: 地理位置和地图服务
· Font Awesome: 图标库

模块依赖关系

```
app.js (主入口)
    ├── GameStateManager (状态管理)
    ├── PeerConnectionManager (网络通信)
    ├── UIManager (界面控制)
    ├── MapManager (地图服务)
    └── Utils (工具函数)
```

故障排除

常见问题

1. 位置获取失败
   · 确保浏览器已授权地理位置权限
   · 检查网络连接状态
   · 确认使用HTTPS协议
2. 连接失败
   · 检查网络防火墙设置
   · 验证PeerJS服务器可用性
   · 确认房间号正确
3. 地图不显示
   · 验证高德地图API Key
   · 检查网络连接
   · 确认只有猫角色能看到地图

调试模式

在浏览器控制台中可以查看详细的调试信息：

· 玩家连接状态
· 消息通信日志
· 位置获取状态
· 游戏状态变化

扩展开发

添加新功能

1. 在GameStateManager中添加新的状态
2. 在PeerConnectionManager中定义新的消息类型
3. 在UIManager中实现对应的界面逻辑
4. 在MapManager中扩展地图功能（如需要）

自定义样式

修改css/style.css和css/responsive.css来自定义游戏外观。

许可证

本项目采用MIT许可证，详见LICENSE文件。

贡献指南

欢迎提交Issue和Pull Request来改进这个项目！

---

注意：游戏体验受实际网络环境和地理位置精度影响。建议在开阔区域和稳定网络环境下进行游戏。