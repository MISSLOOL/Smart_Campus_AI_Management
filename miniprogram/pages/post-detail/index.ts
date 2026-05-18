const app = getApp() as any;

Page({
  data: {
    postId: 0,
    post: null as any,
    commentList: [] as any[],
    loading: false,
    baseUrl: app.globalData.mybaseurl,
    commentContent: '',
    showCommentInput: false,
    isLogin: false,
    userId: 0,
    nickname: '',
    avatar: ''
  },

  onLoad(options: { id?: string }) {
    const id = parseInt(options.id || '0');
    this.setData({ postId: id });
    this.checkLogin();
    this.fetchPost();
    this.fetchComments();
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

  // 获取帖子详情
  fetchPost() {
    wx.request({
      url: `${this.data.baseUrl}/forum/post/${this.data.postId}`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          this.setData({ post: res.data });
        }
      }
    });
  },

  // 获取评论列表
  fetchComments() {
    this.setData({ loading: true });

    wx.request({
      url: `${this.data.baseUrl}/forum/comments/${this.data.postId}`,
      method: 'GET',
      data: {
        pageNum: 1,
        pageSize: 50
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          const data = res.data as any;
          this.setData({ commentList: data.records || [] });
        }
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  // 点赞
  likePost() {
    if (!this.data.isLogin) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    
    wx.request({
      url: `${this.data.baseUrl}/forum/like/${this.data.postId}`,
      method: 'POST',
      success: (res) => {
        if (res.statusCode === 200) {
          wx.showToast({ title: '点赞成功', icon: 'success' });
          this.fetchPost();
        }
      }
    });
  },

  // 显示评论输入
  showComment() {
    if (!this.data.isLogin) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再评论',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/profile/profile' });
          }
        }
      });
      return;
    }
    this.setData({ showCommentInput: true });
  },

  // 关闭评论输入
  hideComment() {
    this.setData({ showCommentInput: false, commentContent: '' });
  },

  // 监听评论输入
  onCommentInput(e: any) {
    this.setData({ commentContent: e.detail.value });
  },

  // 发表评论
  submitComment() {
    const { commentContent, postId, userId } = this.data;
    
    if (!commentContent) {
      wx.showToast({ title: '请输入评论内容', icon: 'none' });
      return;
    }

    wx.request({
      url: `${this.data.baseUrl}/forum/comment`,
      method: 'POST',
      data: {
        postId: postId,
        content: commentContent,
        userId: userId
      },
      header: { 'content-type': 'application/json' },
      success: (res) => {
        if (res.statusCode === 200) {
          wx.showToast({ title: '评论成功', icon: 'success' });
          this.hideComment();
          this.fetchPost();
          this.fetchComments();
        }
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
    
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${month}-${day} ${hour}:${minute}`;
  }
});