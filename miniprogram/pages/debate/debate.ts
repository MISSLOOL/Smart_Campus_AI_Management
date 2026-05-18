const app = getApp() as any;

Page({
  data: {
    currentCategory: '全部',
    categories: ['全部', '学习交流', '校园生活', '二手交易'],
    postList: [] as any[],
    loading: false,
    baseUrl: app.globalData.mybaseurl,
    searchValue: '',
    isLogin: false,
    userId: 0,
    nickname: '',
    avatar: ''
  },

  onLoad() {
    this.checkLogin();
    this.fetchPosts();
  },

  onShow() {
    this.checkLogin();
    this.fetchPosts();
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

  // 返回首页
  goHome() {
    wx.navigateBack();
  },

  // 切换分类
  switchCategory(e: any) {
    const category = e.currentTarget.dataset.category;
    if (category !== this.data.currentCategory) {
      this.setData({ currentCategory: category });
      this.fetchPosts();
    }
  },

  // 搜索
  onSearch(e: any) {
    this.setData({ searchValue: e.detail.value });
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.fetchPosts();
    }, 300);
  },

  // 清除搜索
  clearSearch() {
    this.setData({ searchValue: '' });
    this.fetchPosts();
  },

  // 去帖子详情
  goToPost(e: any) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/post-detail/index?id=${id}`
    });
  },

  // 去发帖
  goToPublish() {
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
    
    const category = this.data.currentCategory === '全部' ? '' : this.data.currentCategory;
    wx.navigateTo({
      url: `/pages/forum-detail/index?title=${category}`
    });
  },

  // 获取帖子列表
  fetchPosts() {
    this.setData({ loading: true });

    const category = this.data.currentCategory === '全部' ? '' : this.data.currentCategory;

    wx.request({
      url: `${this.data.baseUrl}/forum/list`,
      method: 'GET',
      data: {
        pageNum: 1,
        pageSize: 20,
        category: category,
        keyword: this.data.searchValue.trim()
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          const data = res.data as any;
          this.setData({ postList: data.records || [] });
        }
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  searchTimer: null as any
});