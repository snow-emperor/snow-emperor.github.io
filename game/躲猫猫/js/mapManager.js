// 地图管理模块
const MapManager = {
    // 地图实例
    map: null,
    
    // 标记集合
    markers: {},
    
    // 信息窗口集合
    infoWindows: {},
    
    // 初始化地图
    init: function(containerId) {
        if (!window.AMap) {
            console.error('高德地图API未加载');
            Utils.showNotification('地图加载失败，请检查网络连接', 'error');
            return false;
        }
        
        try {
            // 获取当前位置或使用默认位置
            let center = [108, 34]; // 默认学校中心
            
            if (GameStateManager.currentPlayer.position) {
                center = [
                    GameStateManager.currentPlayer.position.longitude, 
                    GameStateManager.currentPlayer.position.latitude
                ];
            }
            
            // 创建地图实例
            this.map = new AMap.Map(containerId, {
                viewMode: '3D',
                zoom: 16, // 增加初始缩放级别
                center: center,
                mapStyle: 'amap://styles/normal'
            });
            
            // 添加比例尺
            this.map.addControl(new AMap.Scale());
            
            // 添加工具栏
            this.map.addControl(new AMap.ToolBar());
            
            // 添加鹰眼控件
            this.map.addControl(new AMap.OverView());
            
            console.log('地图初始化成功');
            
            // 如果是猫，立即定位到当前位置
            if (GameStateManager.currentPlayer.role === GameStateManager.PlayerRole.CAT) {
                this.locateToCurrentPlayer();
            }
            
            return true;
        } catch (error) {
            console.error('地图初始化失败:', error);
            Utils.showNotification('地图初始化失败: ' + error.message, 'error');
            return false;
        }
    },
    
    // 销毁地图
    destroy: function() {
        if (this.map) {
            this.map.destroy();
            this.map = null;
            this.markers = {};
            this.infoWindows = {};
        }
    },
    
    // 更新玩家位置标记
    updatePlayerMarkers: function() {
        if (!this.map) return;
        
        // 清除所有标记
        for (const playerId in this.markers) {
            this.map.remove(this.markers[playerId]);
        }
        this.markers = {};
        
        // 添加玩家位置标记
        for (const playerId in GameStateManager.players) {
            const player = GameStateManager.players[playerId];
            if (player.position) {
                this.addPlayerMarker(playerId, player);
            }
        }
        
        // 如果是猫，将地图中心定位到猫的位置
        if (GameStateManager.currentPlayer.role === GameStateManager.PlayerRole.CAT && 
            GameStateManager.currentPlayer.position) {
            this.locateToCurrentPlayer();
        }
    },
    
    // 添加玩家标记
    addPlayerMarker: function(playerId, player) {
        if (!this.map) return;
        
        const position = [player.position.longitude, player.position.latitude];
        
        // 根据角色设置标记颜色和内容
        let markerContent = '';
        let markerColor = '';
        let iconClass = '';
        
        if (player.role === GameStateManager.PlayerRole.CAT) {
            markerColor = '#f44336'; // 红色表示猫
            iconClass = 'fas fa-cat';
        } else {
            markerColor = '#4CAF50'; // 绿色表示老鼠
            iconClass = 'fas fa-mouse';
        }
        
        // 如果是当前玩家，添加特殊样式
        const isCurrentPlayer = playerId === GameStateManager.currentPlayer.id;
        const borderStyle = isCurrentPlayer ? '3px solid #FFD700' : '2px solid white';
        const shadowStyle = isCurrentPlayer ? '0 0 10px #FFD700' : '0 2px 5px rgba(0,0,0,0.3)';
        
        // 创建标记内容
        markerContent = `
            <div style="
                background-color: ${markerColor}; 
                width: 40px; 
                height: 40px; 
                border-radius: 50%; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                color: white; 
                font-weight: bold;
                border: ${borderStyle};
                box-shadow: ${shadowStyle};
                position: relative;
            ">
                <i class="${iconClass}"></i>
                ${isCurrentPlayer ? '<div style="position: absolute; bottom: -5px; font-size: 10px; background: #FFD700; color: #000; padding: 1px 3px; border-radius: 3px;">你</div>' : ''}
            </div>
        `;
        
        // 创建标记
        const marker = new AMap.Marker({
            position: position,
            content: markerContent,
            offset: new AMap.Pixel(-20, -20)
        });
        
        // 添加标记到地图
        this.map.add(marker);
        this.markers[playerId] = marker;
        
        // 添加信息窗口
        const infoWindow = new AMap.InfoWindow({
            content: `
                <div style="padding: 10px;">
                    <h4 style="margin: 0 0 5px 0;">${player.name}</h4>
                    <p style="margin: 0;">${GameStateManager.getRoleText(player.role)}</p>
                    ${player.isCaught ? '<p style="margin: 5px 0 0 0; color: #f44336;">已抓住</p>' : ''}
                    ${isCurrentPlayer ? '<p style="margin: 5px 0 0 0; color: #FFD700;">(你)</p>' : ''}
                </div>
            `,
            offset: new AMap.Pixel(0, -45)
        });
        
        this.infoWindows[playerId] = infoWindow;
        
        // 添加点击事件
        marker.on('click', () => {
            // 关闭其他信息窗口
            for (const id in this.infoWindows) {
                if (id !== playerId) {
                    this.infoWindows[id].close();
                }
            }
            
            infoWindow.open(this.map, marker.getPosition());
        });
    },
    
    // 定位到当前玩家位置
    locateToCurrentPlayer: function() {
        if (!this.map || !GameStateManager.currentPlayer.position) return;
        
        const currentPos = [
            GameStateManager.currentPlayer.position.longitude,
            GameStateManager.currentPlayer.position.latitude
        ];
        
        this.map.setCenter(currentPos);
        this.map.setZoom(16);
        
        console.log('地图已定位到玩家位置:', currentPos);
    },
    
    // 更新地图可见性
    updateMapVisibility: function() {
        const gameMap = document.getElementById('gameMap');
        
        // 只有猫角色可以看到地图
        if (GameStateManager.currentPlayer.role === GameStateManager.PlayerRole.CAT) {
            gameMap.style.display = 'block';
            
            // 如果地图未初始化，则初始化
            if (!this.map) {
                this.init('gameMap');
            }
            
            // 更新玩家标记
            this.updatePlayerMarkers();
            
            // 定位到当前玩家位置
            this.locateToCurrentPlayer();
        } else {
            gameMap.style.display = 'none';
        }
    }
};

// 导出到全局作用域
window.MapManager = MapManager;