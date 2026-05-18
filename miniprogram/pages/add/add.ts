const app = getApp() as any;

Page({
  data: {
    type: '0',
    title: '',
    location: '',
    content: '',
    contact: '',
    price: '',
    originalPrice: '',
    category: '书籍',
    condition: '九成新',
    categories: ['书籍', '电子', '生活', '其他'],
    conditions: ['全新', '九成新', '八成新', '七成新及以下'],
    categoryIndex: 0,
    conditionIndex: 1,
    pageType: 'lost',
    // 图片相关
    imageList: [] as string[],
    maxImages: 9,
    baseUrl: app.globalData.mybaseurl
  },

  onLoad(options: { type?: string }) {
    const pageType = options.type || 'lost';
    this.setData({ pageType: pageType });
  },

  onTypeChange(e: any) {
    this.setData({ type: e.detail.value });
  },

  onTitleInput(e: any) {
    this.setData({ title: e.detail.value });
  },

  goHome() {
    wx.navigateBack();
  },

  onLocationInput(e: any) {
    this.setData({ location: e.detail.value });
  },

  onContentInput(e: any) {
    this.setData({ content: e.detail.value });
  },

  onContactInput(e: any) {
    this.setData({ contact: e.detail.value });
  },

  onPriceInput(e: any) {
    this.setData({ price: e.detail.value });
  },

  onOriginalPriceInput(e: any) {
    this.setData({ originalPrice: e.detail.value });
  },

  onCategoryChange(e: any) {
    const index = e.detail.value;
    this.setData({
      categoryIndex: index,
      category: this.data.categories[index]
    });
  },

  onConditionChange(e: any) {
    const index = e.detail.value;
    this.setData({
      conditionIndex: index,
      condition: this.data.conditions[index]
    });
  },

  // 选择图片
  chooseImage() {
    const remaining = this.data.maxImages - this.data.imageList.length;
    if (remaining <= 0) {
      wx.showToast({ title: `最多上传${this.data.maxImages}张`, icon: 'none' });
      return;
    }

    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        const tempFiles = res.tempFiles;
        // 逐个上传
        tempFiles.forEach((file) => {
          this.uploadImage(file.tempFilePath);
        });
      }
    });
  },

  // 上传图片
  uploadImage(filePath: string) {
    wx.showLoading({ title: '上传中...' });

    wx.uploadFile({
      url: `${this.data.baseUrl}/upload/image`,
      filePath: filePath,
      name: 'file',
      success: (res) => {
        const data = JSON.parse(res.data);
        if (data.code === 200) {
          const imageList = [...this.data.imageList, data.data];
          this.setData({ imageList });
          wx.showToast({ title: '上传成功', icon: 'success' });
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

  // 删除图片
  deleteImage(e: any) {
    const index = e.currentTarget.dataset.index;
    const imageList = this.data.imageList;
    imageList.splice(index, 1);
    this.setData({ imageList });
  },

  // 预览图片
  previewImage(e: any) {
    const index = e.currentTarget.dataset.index;
    wx.previewImage({
      current: this.data.imageList[index],
      urls: this.data.imageList
    });
  },

  // 提交表单
  onSubmit() {
    const { pageType, title, content, contact, imageList } = this.data;

    if (!title) {
      wx.showToast({ title: '请输入标题', icon: 'none' });
      return;
    }
    if (!content) {
      wx.showToast({ title: '请输入描述', icon: 'none' });
      return;
    }
    if (!contact) {
      wx.showToast({ title: '请输入联系方式', icon: 'none' });
      return;
    }

    if (pageType === 'lost') {
      const { type, location } = this.data;
      if (!location) {
        wx.showToast({ title: '请输入地点', icon: 'none' });
        return;
      }
      
      const submitData = {
        type: parseInt(type),
        title,
        content,
        location,
        contact,
        image: imageList[0] || ''
      };
      
      console.log('提交失物招领数据:', submitData);
      this.submitToServer('/lost/publish', submitData);
    } else if (pageType === 'market') {
      const { price, originalPrice, category, condition } = this.data;
      if (!price) {
        wx.showToast({ title: '请输入价格', icon: 'none' });
        return;
      }
      
      const submitData = {
        title,
        description: content,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        category,
        condition,
        contact,
        images: imageList.join(',')
      };
      
      console.log('提交二手市场数据:', submitData);
      this.submitToServer('/market/publish', submitData);
    }
  },

  // 提交到服务器
  submitToServer(url: string, data: any) {
    wx.showLoading({ title: '发布中...' });
    
    wx.request({
      url: `${this.data.baseUrl}${url}`,
      method: 'POST',
      data: data,
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        if (res.statusCode === 200) {
          wx.showToast({ title: '发布成功', icon: 'success' });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
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
  }
});