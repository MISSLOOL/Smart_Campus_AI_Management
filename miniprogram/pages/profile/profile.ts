const app = getApp() as any;

interface User {
  id: number;
  openid: string;
  nickname: string;
  avatar: string;
  phone: string;
  isLogin: boolean;
}

Page({
  data: {
    userInfo: {
      id: 0,
      openid: '',
      nickname: '',
      avatar: '',
      phone: '',
      isLogin: false
    } as User,
    showEditModal: false,
    showAboutModal: false,
    editType: '' as string,
    editValue: '',
    postCount: 0,
    commentCount: 0
  },

  onLoad() {
    this.checkLoginStatus();
  },

  onShow() {
    this.checkLoginStatus();
    if (this.data.userInfo.isLogin) {
      this.fetchUserStats();
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    const userStr = wx.getStorageSync('userInfo');
    
    if (token && userStr) {
      const userInfo = JSON.parse(userStr);
      this.setData({
        userInfo: {
          ...userInfo,
          isLogin: true
        }
      });
      // 从服务器获取最新用户信息
      this.fetchUserInfo(userInfo.id);
    } else {
      this.resetUserInfo();
    }
  },

  // 从服务器获取用户信息
  fetchUserInfo(userId: number) {
    wx.request({
      url: `${app.globalData.mybaseurl}/api/user/info/${userId}`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          const data = res.data as any;
          const userInfo = {
            id: data.id,
            openid: data.openid || '',
            nickname: data.nickname || '微信用户',
            avatar: data.avatar || '',
            phone: data.phone || '',
            isLogin: true
          };
          this.setData({ userInfo });
          wx.setStorageSync('userInfo', JSON.stringify(userInfo));
        }
      }
    });
  },

  // 获取用户统计（帖子数、评论数）
  fetchUserStats() {
    const userId = this.data.userInfo.id;
    if (!userId) return;
    
    wx.request({
      url: `${app.globalData.mybaseurl}/api/user/stats/${userId}`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          const data = res.data as any;
          this.setData({
            postCount: data.postCount || 0,
            commentCount: data.commentCount || 0
          });
        }
      }
    });
  },

  // 登录
  onLoginTap(e: any) {
    const avatarUrl = e.detail && e.detail.avatarUrl;
    if (!avatarUrl) return;

    wx.showLoading({ title: '登录中...' });

    wx.login({
      success: (res) => {
        if (!res.code) {
          wx.hideLoading();
          wx.showToast({ title: '登录失败', icon: 'none' });
          return;
        }

        wx.request({
          url: app.globalData.mybaseurl + '/api/user/login',
          method: 'POST',
          data: { code: res.code },
          success: (loginRes: any) => {
            wx.hideLoading();
            const data = loginRes.data;

            if (data.token) {
              wx.setStorageSync('token', data.token);
              
              const userInfo = {
                id: data.userId || 0,
                openid: '',
                nickname: data.nickname || '微信用户',
                avatar: avatarUrl,
                phone: data.phone || '',
                isLogin: true
              };
              
              wx.setStorageSync('userInfo', JSON.stringify(userInfo));
              wx.setStorageSync('userId', data.userId);
              
              // 更新头像和昵称到数据库
              this.updateUserToServer(data.userId, data.nickname, avatarUrl);
              
              this.setData({ userInfo });
              wx.showToast({ title: '登录成功' });
            } else {
              wx.showToast({ title: data.msg || '登录失败', icon: 'none' });
            }
          },
          fail: () => {
            wx.hideLoading();
            wx.showToast({ title: '网络错误', icon: 'none' });
          }
        });
      }
    });
  },

  // 更新用户信息到服务器
  updateUserToServer(userId: number, nickname: string, avatar: string) {
    wx.request({
      url: app.globalData.mybaseurl + '/api/user/update',
      method: 'PUT',
      data: {
        id: userId,
        nickname: nickname,
        avatar: avatar
      },
      header: { 'content-type': 'application/json' },
      success: (res) => {
        console.log('用户信息更新成功', res);
      }
    });
  },

  // 显示编辑弹窗
  showEdit(e: any) {
    const type = e.currentTarget.dataset.type;
    if (!this.data.userInfo.isLogin) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    
    this.setData({
      showEditModal: true,
      editType: type,
      editValue: type === 'nickname' ? this.data.userInfo.nickname : ''
    });
  },

  // 关闭编辑弹窗
  closeEditModal() {
    this.setData({
      showEditModal: false,
      editType: '',
      editValue: ''
    });
  },

  // 监听编辑输入
  onEditInput(e: any) {
    this.setData({ editValue: e.detail.value });
  },

  // 保存编辑
  saveEdit() {
    const { editType, editValue, userInfo } = this.data;
    
    if (!editValue.trim()) {
      wx.showToast({ title: '内容不能为空', icon: 'none' });
      return;
    }

    if (editType === 'nickname') {
      // 更新昵称
      wx.request({
        url: app.globalData.mybaseurl + '/api/user/update',
        method: 'PUT',
        data: {
          id: userInfo.id,
          nickname: editValue.trim()
        },
        header: { 'content-type': 'application/json' },
        success: (res) => {
          if (res.statusCode === 200) {
            const newUserInfo = { ...userInfo, nickname: editValue.trim() };
            this.setData({ userInfo: newUserInfo });
            wx.setStorageSync('userInfo', JSON.stringify(newUserInfo));
            wx.showToast({ title: '修改成功', icon: 'success' });
            this.closeEditModal();
          }
        }
      });
    }
  },

  // 修改头像
  changeAvatar() {
    if (!this.data.userInfo.isLogin) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.uploadAvatar(tempFilePath);
      }
    });
  },

  // 上传头像
  uploadAvatar(filePath: string) {
    wx.showLoading({ title: '上传中...' });

    wx.uploadFile({
      url: `${app.globalData.mybaseurl}/upload/image`,
      filePath: filePath,
      name: 'file',
      success: (res) => {
        const data = JSON.parse(res.data);
        if (data.code === 200) {
          const avatarUrl = data.data;
          
          // 更新到服务器
          wx.request({
            url: app.globalData.mybaseurl + '/api/user/update',
            method: 'PUT',
            data: {
              id: this.data.userInfo.id,
              avatar: avatarUrl
            },
            header: { 'content-type': 'application/json' },
            success: (updateRes) => {
              if (updateRes.statusCode === 200) {
                const newUserInfo = { ...this.data.userInfo, avatar: avatarUrl };
                this.setData({ userInfo: newUserInfo });
                wx.setStorageSync('userInfo', JSON.stringify(newUserInfo));
                wx.showToast({ title: '头像更新成功', icon: 'success' });
              }
            }
          });
        } else {
          wx.showToast({ title: data.msg || '上传失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '上传失败', icon: 'none' });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  // 查看我的帖子
  goToMyPosts() {
    if (!this.data.userInfo.isLogin) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/my-posts/index' });
  },

  // 查看我的评论
  goToMyComments() {
    if (!this.data.userInfo.isLogin) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/my-comments/index' });
  },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          this.resetUserInfo();
          wx.showToast({ title: '已退出登录' });
        }
      }
    });
  },

  // 重置用户信息
  resetUserInfo() {
    this.setData({
      userInfo: {
        id: 0,
        openid: '',
        nickname: '',
        avatar: '',
        phone: '',
        isLogin: false
      },
      postCount: 0,
      commentCount: 0
    });
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('userId');
  },

  // 关于我们
  onAbout() {
    this.setData({ showAboutModal: true });
  },

  // 关闭关于我们弹窗
  closeAboutModal() {
    this.setData({ showAboutModal: false });
  },

  // 复制关于我们信息
  copyAboutInfo() {
    wx.setClipboardData({
      data: '智能校园生活 v1.0\n商务合作+v:wuhupopopo',
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });
  },

  goHome() {
    wx.navigateBack();
  },

  goToHome() {
    wx.navigateBack({ delta: 10 });
  },

  goToAiChat() {
    wx.navigateTo({ url: '/pages/ai/ai' });
  },

  goToProfile() {
    // 已经在当前页面
  }
});