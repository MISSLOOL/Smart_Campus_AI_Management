const app = getApp() as any;

Page({
  data: {
    commentList: [] as any[],
    loading: false,
    baseUrl: app.globalData.mybaseurl,
    userId: 0
  },

  onLoad() {
    const userId = wx.getStorageSync('userId');
    if (userId) {
      this.setData({ userId });
      this.fetchMyComments();
    }
  },

  goBack() {
    wx.navigateBack();
  },

  goToPost(e: any) {
    const postId = e.currentTarget.dataset.postid;
    wx.navigateTo({
      url: `/pages/post-detail/index?id=${postId}`
    });
  },

  fetchMyComments() {
    this.setData({ loading: true });

    wx.request({
      url: `${this.data.baseUrl}/api/user/comments/${this.data.userId}`,
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
  }
});