const app = getApp() as any;

Page({
  data: {
    category: '',
    categoryName: '',
    postList: [] as any[],
    loading: false,
    baseUrl: app.globalData.mybaseurl,
    pageNum: 1,
    hasMore: true,
    showPublish: false,
    publishTitle: '',
    publishContent: '',
    isLogin: false,
    userId: 0,
    nickname: '',
    avatar: ''
  },

  onLoad(options: { title?: string }) {
    const category = options.title || '';
    this.setData({ 
      category: category,
      categoryName: category || '全部'
    });
    this.checkLogin();
    this.fetchPosts();
  },

  onShow() {
    this.checkLogin();
  },

  // 检查登录状态
  checkLogin() {
    const userInfoStr = wx.getStorageSync('userInfo');
    const userId = wx.getStorageSync('userId');
    
    if (userInfoStr && userId) {
      const userInfo = JSON.parse(userInfoStr);
      this.setData({
        isLogin: true,
        userId: userId,
        nickname: userInfo.nickname || '微信用户',
        avatar: userInfo.avatar || ''
      });
    } else {
      this.setData({
        isLogin: false,
        userId: 0,
        nickname: '',
        avatar: ''
      });
    }
  },

  // 返回
  goBack() {
    wx.navigateBack();
  },

  // 去帖子详情
  goToPost(e: any) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/post-detail/index?id=${id}`
    });
  },

  // 显示发布弹窗
  showPublishModal() {
    if (!this.data.isLogin) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再发帖',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/profile/profile' });
          }
        }
      });
      return;
    }
    this.setData({ showPublish: true });
  },

  // 关闭发布弹窗
  closePublishModal() {
    this.setData({ showPublish: false, publishTitle: '', publishContent: '' });
  },

  // 监听标题输入
  onTitleInput(e: any) {
    this.setData({ publishTitle: e.detail.value });
  },

  // 监听内容输入
  onContentInput(e: any) {
    this.setData({ publishContent: e.detail.value });
  },

  // 发布帖子
  publishPost() {
    const { publishTitle, publishContent, category, userId } = this.data;
    
    if (!publishTitle) {
      wx.showToast({ title: '请输入标题', icon: 'none' });
      return;
    }
    if (!publishContent) {
      wx.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '发布中...' });

    wx.request({
      url: `${this.data.baseUrl}/forum/post`,
      method: 'POST',
      data: {
        title: publishTitle,
        content: publishContent,
        category: category || '校园生活',
        userId: userId
      },
      header: { 'content-type': 'application/json' },
      success: (res) => {
        if (res.statusCode === 200) {
          wx.showToast({ title: '发布成功', icon: 'success' });
          this.closePublishModal();
          this.fetchPosts();
        } else {
          wx.showToast({ title: '发布失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  // 获取帖子列表
  fetchPosts() {
    this.setData({ loading: true });

    wx.request({
      url: `${this.data.baseUrl}/forum/list`,
      method: 'GET',
      data: {
        pageNum: this.data.pageNum,
        pageSize: 20,
        category: this.data.category
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          const data = res.data as any;
          const records = data.records || [];
          
          this.setData({
            postList: records,
            hasMore: records.length >= 20
          });
        }
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  // 格式化时间
  formatTime(time: string) {
    if (!time) return '';
    const date = new Date(time);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';
    
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}-${day}`;
  }
});