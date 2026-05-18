// pages/market/index.ts
const app = getApp() as any;
interface MarketItem {
  id: number;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  category: string;
  condition: string;
  images: string;
  contact: string;
  status: number;
  createTime: string;
}

const HISTORY_KEY = 'market_search_history';
const MAX_HISTORY = 10;

Page({
  data: {
    currentCategory: '',
    searchValue: '',
    list: [] as MarketItem[],
    loading: false,
    baseUrl: app.globalData.mybaseurl,
    categories: ['全部', '书籍', '电子', '生活', '其他'],
    categoryIndex: 0,
    showSearchPanel: false,
    searchHistory: [] as string[],
    hotSearches: ['高数', '耳机', '台灯', '考研', '鼠标', '充电宝'],
    total: 0
  },

  onLoad() {
    this.loadSearchHistory();
    this.fetchData();
  },

  // 加载搜索历史
  loadSearchHistory() {
    const history = wx.getStorageSync(HISTORY_KEY) || [];
    this.setData({ searchHistory: history });
  },

  // 保存搜索历史
  saveSearchHistory(keyword: string) {
    if (!keyword) return;
    let history = wx.getStorageSync(HISTORY_KEY) || [];
    // 去重，把最新的放前面
    history = history.filter((item: string) => item !== keyword);
    history.unshift(keyword);
    // 限制数量
    if (history.length > MAX_HISTORY) {
      history = history.slice(0, MAX_HISTORY);
    }
    wx.setStorageSync(HISTORY_KEY, history);
    this.setData({ searchHistory: history });
  },

  // 清空搜索历史
  clearHistory() {
    wx.showModal({
      title: '提示',
      content: '确定清空搜索历史？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync(HISTORY_KEY);
          this.setData({ searchHistory: [] });
        }
      }
    });
  },

  // 点击搜索历史或热门标签
  onTagTap(e: any) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({ searchValue: keyword });
    this.fetchData();
    this.saveSearchHistory(keyword);
  },

  // 输入框获取焦点 - 显示搜索面板
  onSearchFocus() {
    this.setData({ showSearchPanel: true });
  },

  // 返回首页
  goHome() {
    wx.navigateBack();
  },

  // 跳转到详情页
  goToDetail(e: any) {
    const id = e.currentTarget.dataset.id;
    if (!id) {
      wx.showToast({ title: '数据异常', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}&type=market`,
    });
  },

  // 切换分类
  switchCategory(e: any) {
    const index = e.currentTarget.dataset.index;
    const category = index === 0 ? '' : this.data.categories[index];
    
    if (this.data.currentCategory !== category) {
      this.setData({
        currentCategory: category,
        categoryIndex: index,
        list: []
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
    const keyword = this.data.searchValue.trim();
    if (keyword) {
      this.saveSearchHistory(keyword);
    }
    this.setData({ showSearchPanel: false });
    this.fetchData();
  },

  // 去发布页面
  goToAdd() {
    wx.navigateTo({
      url: '/pages/add/add?type=market'
    });
  },

  // 清除搜索
  clearSearch() {
    this.setData({
      searchValue: '',
      showSearchPanel: false
    }, () => {
      this.fetchData();
    });
  },

  // 取消搜索
  cancelSearch() {
    this.setData({ showSearchPanel: false });
  },

  // 格式化价格
  formatPrice(price: number) {
    return price ? price.toFixed(2) : '0.00';
  },

  // 获取分类图标
  getCategoryIcon(category: string) {
    const icons: { [key: string]: string } = {
      '书籍': '📚',
      '电子': '📱',
      '生活': '🏠',
      '其他': '📦'
    };
    return icons[category] || '📦';
  },

  // 获取成色颜色
  getConditionColor(condition: string) {
    const colors: { [key: string]: string } = {
      '全新': '#52c41a',
      '九成新': '#1890ff',
      '八成新': '#faad14',
      '七成新及以下': '#ff4d4f'
    };
    return colors[condition] || '#666';
  },

  // 请求数据
  fetchData() {
    this.setData({ loading: true });

    const urlPath = '/market/list';

    wx.request({
      url: `${this.data.baseUrl}${urlPath}`,
      method: 'GET',
      data: {
        pageNum: 1,
        pageSize: 20,
        category: this.data.currentCategory,
        keyword: this.data.searchValue.trim()
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          const data = res.data as any;
          const records = data.records || [];
          const total = data.total || 0;
          
          const processedRecords = records.map((item: MarketItem) => ({
            ...item,
            priceFormatted: this.formatPrice(item.price),
            originalPriceFormatted: this.formatPrice(item.originalPrice),
            categoryIcon: this.getCategoryIcon(item.category),
            conditionColor: this.getConditionColor(item.condition),
            imageList: item.images ? item.images.split(',').filter(Boolean) : []
          }));

          this.setData({
            list: processedRecords,
            total: total
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