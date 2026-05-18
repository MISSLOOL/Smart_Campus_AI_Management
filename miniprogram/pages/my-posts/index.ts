const app = getApp() as any;

Page({
  data: {
    postList: [] as any[],
    loading: false,
    baseUrl: app.globalData.mybaseurl,
    userId: 0
  },

  onLoad() {
    const userId = wx.getStorageSync('userId');
    if (userId) {
      this.setData({ userId });
      this.fetchMyPosts();
    }
  },

  goBack() {
    wx.navigateBack();
  },

  goToPost(e: any) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/post-detail/index?id=${id}`
    });
  },

  fetchMyPosts() {
    this.setData({ loading: true });

    wx.request({
      url: `${this.data.baseUrl}/api/user/posts/${this.data.userId}`,
      method: 'GET',
      data: {
        pageNum: 1,
        pageSize: 50
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
  }
});