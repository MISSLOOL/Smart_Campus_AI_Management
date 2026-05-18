// pages/index/index.ts

Page({
  data: {
    modules: [
      {
        id: 1,
        type: 'market',
        title: '校园二手市场',
        desc: '书籍、电子、闲置好物交易',
        icon: '🛒',
        color: '#FF9F43'
      },
      {
        id: 2,
        type: 'lost',
        title: '失物招领',
        desc: '寻找丢失物品，发布招领信息',
        icon: '🔍',
        color: '#54a0ff'
      },
      {
        id: 3,
        type: 'forum',
        title: '校园论坛',
        desc: '交流灌水，分享校园生活',
        icon: '💬',
        color: '#5f27cd'
      },
      {
        id: 4,
        type: 'newapi',
        title: 'API中转站',
        desc: '注册就送200万$额度',
        icon: '🚀',
        color: '#00d2d3'
      },
      {
        id: 5,
        type: 'monitor',
        title: 'Sub2API监控站',
        desc: '监控所有模型连接状态',
        icon: '📊',
        color: '#10ac84'
      },
      {
        id: 6,
        type: 'chats',
        title: '实时聊天',
        desc: '随时随地聊天',
        icon: '💬',
        color: '#00d2d3'
      }
    ]
  },

  goToHome() {
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const currentRoute = currentPage.route;
    if (currentRoute === 'pages/index/index') {
      return; 
    }
    wx.navigateTo({
      url: '/pages/index/index'
    })
  },

  goToAiChat() {
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const currentRoute = currentPage.route;
    if (currentRoute === 'pages/ai/ai') {
      return; 
    }
    wx.navigateTo({
      url: '/pages/ai/ai'
    })
  },

  goToProfile() {
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const currentRoute = currentPage.route;
    if (currentRoute === 'pages/profile/profile') {
      return; 
    }
    wx.navigateTo({
      url: '/pages/profile/profile'
    })
  },

  onCardClick: function(e) {
    const type = e.currentTarget.dataset.type;

    if (type === 'lost') {
      wx.navigateTo({
        url: '/pages/lost/index',
      });
    } else if (type === 'market') {
      wx.navigateTo({
        url: '/pages/market/index',
      });
    } else if (type === 'forum') {
      wx.navigateTo({
        url: '/pages/debate/debate',
      });
    } else if (type === 'newapi') {
      // 复制链接到剪贴板
      wx.setClipboardData({
        data: 'https://newapi.zxklwllove.asia/',
        success: () => {
          wx.showModal({
            title: '链接已复制',
            content: 'NewAPI中转站链接已复制到剪贴板，请在浏览器中打开\n\n注册就送200万额度！',
            confirmText: '知道了',
            showCancel: false
          });
        }
      });
    } else if (type === 'monitor') {
      // 复制链接到剪贴板
      wx.setClipboardData({
        data: 'https://sub.zxklwllove.asia/monitor',
        success: () => {
          wx.showModal({
            title: '链接已复制',
            content: 'Sub2API监控站链接已复制到剪贴板，请在浏览器中打开\n\n监控所有模型连接状态',
            confirmText: '知道了',
            showCancel: false
          });
        }
      });
    } else if (type === 'chats') {
      wx.navigateTo({
        url: '/pages/chats/chats',
      });
    }
  },
  
  // 宠物点击事件
  onPetTap(e: any) {
    const animation = e.detail.animation;
    wx.showToast({
      title: `宠物正在${animation === 'idle' ? '待机' : animation === 'jump' ? '跳跃' : '奔跑'}`,
      icon: 'none',
      duration: 1500
    });
  }
});