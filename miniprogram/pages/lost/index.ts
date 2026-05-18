// pages/index/index.ts
const app = getApp() as any;
interface Item {
  id: number;
  title: string;
  content: string;
  type: number; // 0: 寻物, 1: 招领
  location: string;
  image: string;
  status: number;
  createTime: string;
}

Page({
  data: {
    currentTab: 'lost', // 默认 'lost' (寻物启事)
    searchValue: '',
    list: [] as Item[],
    loading: false,
    baseUrl: app.globalData.mybaseurl // 确保这里是你的电脑IP或localhost
  },

  onLoad() {
    this.fetchData();
  },

  // 返回首页 (如果是TabBar页面，必须用switchTab)
  goHome() {
    wx.navigateBack();
  },
  goToDetail(e: any) {
    // 1. 从 dataset 中获取点击的 item 的 id
    // 注意：data-id 在 e.currentTarget.dataset 中会变成 id (驼峰命名规则)
    const id = e.currentTarget.dataset.id;
    console.log("拿到的 ID 是：", id); 
    console.log("类型是：", typeof id); 
    if (!id) {
      wx.showToast({ title: '数据异常', icon: 'none' });
      return;
    }

    // 2. 执行页面跳转
    // 假设你的详情页路径是 /pages/detail/detail
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`, 
    });
  },
  // 切换标签页
  switchTab(e: any) {
    const type = e.currentTarget.dataset.type; // 'lost' 或 'found'
    
    // 只有当点击的Tab和当前不一样时才刷新，避免重复请求
    if (this.data.currentTab !== type) {
      this.setData({
        currentTab: type,
        list: [] // 切换时先清空，防止旧数据闪烁
      });
      this.fetchData();
    }
  },

  searchTimer: null as any,

  // 输入框实时输入
  onSearch(e: any) {
    this.setData({ 
      searchValue: e.detail.value 
    });

    // 防抖处理：用户停止输入300ms后再请求
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }

    this.searchTimer = setTimeout(() => {
      this.fetchData();
    }, 300);
  },

  // 键盘搜索按钮点击
  handleSearchConfirm() {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.fetchData();
  },

  // 去发布页面
  goToAdd() {
    wx.navigateTo({
      url: '/pages/add/add'
    });
  },
  clearSearch() {
    this.setData({
      searchValue: '' 
    }, () => {
      this.fetchData();
    });
  },
  // --- 核心：请求数据 ---
  fetchData() {
    this.setData({ loading: true });

    // 1. 确定类型：lost -> 0, found -> 1
    const queryType = this.data.currentTab === 'lost' ? 0 : 1;
    
    const urlPath = '/lost/list';

    wx.request({
      url: `${this.data.baseUrl}${urlPath}`,
      method: 'GET',
      data: {
        pageNum: 1,
        pageSize: 10,
        type: queryType, // 传给后端筛选类型
        keyword: this.data.searchValue.trim() // 传给后端搜索关键词
      },
      success: (res) => {
        // 检查状态码
        if (res.statusCode === 200 && res.data) {
          const data = res.data as any;
          const records = data.records || [];

          this.setData({
            list: records
          });
        } else {
          console.error('请求失败', res);
          if (!this.data.searchValue) {
             wx.showToast({ title: '数据加载失败', icon: 'none' });
          }
        }
      },
      fail: (err) => {
        console.error('连接服务器失败', err);
        // 只有在非搜索状态下提示网络错误，避免打字时一直弹窗
        if (!this.data.searchValue) {
           wx.showToast({ title: '无法连接服务器', icon: 'none' });
        }
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  }
});