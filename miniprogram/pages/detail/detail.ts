interface LostDetailData {
  id: number;
  title: string;
  content: string;
  type: number; // 0: 招领, 1: 寻物
  location: string;
  image: string;
  status: number;
  createTime: string;
  contact: string;
}

interface MarketDetailData {
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

type DetailData = LostDetailData | MarketDetailData;
const app = getApp() as any;
Page({
  data: {
    detail: null as DetailData | null,
    id: 0,
    type: 'lost' as string,
    imageList: [] as string[],
    currentImageIndex: 0
  },
  goHome() {
    wx.navigateBack();
  },
  onLoad(options: { id: string; type?: string }) {
    const id = options.id;
    const type = options.type || 'lost';
    if (id) {
      this.setData({ id: parseInt(id), type: type });
      this.fetchDetail(parseInt(id), type);
    }
  },

  fetchDetail(id: number, type: string) {
    wx.showLoading({ title: '加载中...' });

    const baseUrl = app.globalData.mybaseurl;
    const url = type === 'market' ? `${baseUrl}/market/${id}` : `${baseUrl}/lost/${id}`;

    wx.request({
      url: url,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          const detail = res.data as DetailData;
          let imageList: string[] = [];
          
          if (type === 'market' && (detail as MarketDetailData).images) {
            imageList = (detail as MarketDetailData).images.split(',').filter(Boolean);
          } else if (type === 'lost' && (detail as LostDetailData).image) {
            imageList = [(detail as LostDetailData).image];
          }
          console.log('原始images字符串:', (detail as MarketDetailData).images)
console.log('最终轮播图数组imageList:', imageList)
          if (imageList.length === 0) {
            imageList = ['/images/xxx.jpg'];
          }
          
          this.setData({
            detail: detail,
            imageList: imageList
          });
        } else {
          wx.showToast({ title: '未找到该物品', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络请求失败', icon: 'none' });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  // 图片切换事件
  onSwiperChange(e: any) {
    this.setData({
      currentImageIndex: e.detail.current
    });
  },

  // 预览图片
  previewImage(e: any) {
    const index = e.currentTarget.dataset.index || 0;
    wx.previewImage({
      current: this.data.imageList[index],
      urls: this.data.imageList
    });
  },

  contactUser() {
    const contact = this.data.detail && this.data.detail.contact;
    if (contact) {
      wx.setClipboardData({
        data: contact,
        success: () => {
          wx.showToast({ title: '已复制联系方式', icon: 'success' });
        }
      });
    } else {
      wx.showToast({ title: '暂无联系方式', icon: 'none' });
    }
  }
});