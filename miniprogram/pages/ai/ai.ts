import api from '../../utils/api'; 
const app = getApp() as any;

Page({
  data: {
    messages: [] as { role: 'user' | 'assistant', content: string, images?: string[] }[],
    inputText: '',
    loading: false,
    isSidebarOpen: false, 
    scrollToView: '',
    searchValue: '',
    previewImgs: [],
    historyList: [] as any[],
    currentChatId: null as number | null, 
    baseUrl: app.globalData.mybaseurl,
    modelList: [
      { label: 'MiMo-V2.5-Pro（推荐）', value: 'mimo-v2.5-pro', supportImage: false },
      { label: 'MiMo-V2.5（支持图片）', value: 'mimo-v2.5', supportImage: true },
      { label: 'MiMo-V2-Omni（支持图片）', value: 'mimo-v2-omni', supportImage: true },
      { label: 'MiMo-V2-Pro', value: 'mimo-v2-pro', supportImage: false },
      { label: '轻量模型（0.5b）', value: 'qwen:0.5b', supportImage: false },
      { label: '推理模型（1.5b）', value: 'deepseek-r1:1.5b', supportImage: false }
    ],
    modelIndex: 1,
    currentModel: 'mimo-v2.5',
    isSupportImage: true
  },

  onInput(e: any) {
    this.setData({ inputText: e.detail.value });
  },

  async openChatHistory() {
    const userId = wx.getStorageSync('userId');
    if (!userId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
        wx.navigateTo({
          url: '/pages/profile/profile'
        })
      return;
    }

    wx.showLoading({ title: '加载中...' });
    wx.request({
      url: app.globalData.mybaseurl + '/api/chat/list',
      method: 'GET',
      data: { userId },
      success: (res: any) => {
        wx.hideLoading();
        const list = res.data && res.data.data ? res.data.data : [];
        this.setData({ historyList: list });
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    });
  },

  loadChatHistory(e: any) {
    const chatId = e.currentTarget.dataset.id;
    const userId = wx.getStorageSync('userId');

    wx.request({
      url: app.globalData.mybaseurl + '/api/chat/detail/' + chatId,
      method: 'GET',
      data: { userId },
      success: (res: any) => {
        const chat = res.data.data;
        let messages = [];
        try {
          messages = JSON.parse(chat.messages);
        } catch (e) {}

        this.setData({
          messages: messages,
          currentChatId: chat.id,
          isSidebarOpen: false
        });
      }
    });
  },

  clearAllHistory() {
    const userId = wx.getStorageSync('userId');
    if (!userId) return;

    wx.showModal({
      title: '确认清空',
      content: '确定删除所有对话？',
      success: (ok) => {
        if (!ok.confirm) return;

        wx.request({
          url: app.globalData.mybaseurl + '/api/chat/list',
          method: 'GET',
          data: { userId },
          success: (res) => {
            const list = res.data && res.data.data ? res.data.data : [];
            if (list.length === 0) {
              wx.showToast({ title: '无记录' });
              return;
            }

            let successCount = 0;
            list.forEach((item: any) => {
              wx.request({
                url: app.globalData.mybaseurl + '/api/chat/delete/' + item.id,
                method: 'DELETE',
                success: () => {
                  successCount++;
                  if (successCount === list.length) {
                    this.setData({ historyList: [] });
                    wx.showToast({ title: '已清空' });
                  }
                }
              });
            });
          }
        });
      }
    });
  },

  async saveCurrentChat() {
    const { messages, currentChatId } = this.data;
    if (!messages || messages.length < 2) return;

    const userId = wx.getStorageSync('userId');
    if (!userId) return;

    const title = this.getChatTitle(messages);
    const messagesStr = JSON.stringify(messages);

    wx.request({
      url: app.globalData.mybaseurl + '/api/chat/save',
      method: 'POST',
      data: {
        id: currentChatId,
        userId: userId,
        title: title,
        messages: messagesStr
      },
      header: { 'content-type': 'application/json' },
      success: (res: any) => {
        const chatId = res.data.data;
        this.setData({ currentChatId: chatId });
        this.openChatHistory();
      }
    });
  },

  getChatTitle(messages: any[]) {
    const first = messages.find(m => m.role === 'user');
    if (!first) return '新对话';
    const txt = first.content || '[图片]';
    return txt.length > 18 ? txt.substring(0, 18) + '...' : txt;
  },

  createNewChat() {
    this.saveCurrentChat();
    this.setData({
      isSidebarOpen: false
    });

    setTimeout(() => {
      this.setData({
        messages: [],
        inputText: '',
        previewImgs: [],
        currentChatId: null,
        isSidebarOpen: false
      });

      wx.showToast({
        title: '新对话已创建',
        icon: 'none',
        duration: 1500
      });
    }, 300);
  },

  searchTimer: null as any,
  onSearch(e: any) {
    this.setData({ searchValue: e.detail.value });
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.fetchData();
    }, 300);
  },

  fetchData() {
    this.setData({ loading: true });
    const urlPath = '/lost/list';

    wx.request({
      url: `${this.data.baseUrl}${urlPath}`,
      method: 'GET',
      data: {
        pageNum: 1,
        pageSize: 10,
        keyword: this.data.searchValue.trim()
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          const records = res.data.records || [];
          this.setData({ list: records });
        } else {
          if (!this.data.searchValue) {
            wx.showToast({ title: '数据加载失败', icon: 'none' });
          }
        }
      },
      fail: (err) => {
        if (!this.data.searchValue) {
          wx.showToast({ title: '无法连接服务器', icon: 'none' });
        }
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  goHome() {
    wx.navigateBack();
  },

  toggleSidebar() {
    const newIsOpen = !this.data.isSidebarOpen;
    this.setData({ isSidebarOpen: newIsOpen });
    if (newIsOpen) {
      this.openChatHistory();
    }
  },

  closeSidebar() {
    this.setData({ isSidebarOpen: false });
  },

  copyText(e) {
    const content = e.currentTarget.dataset.content;
    if (!content) return;

    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' });
      },
      fail: () => {
        wx.showToast({ title: '复制失败', icon: 'none' });
      }
    });
  },

  showModelPicker() {
    const fullList = this.data.modelList.map(item => item.label);
    const MAX_SHOW = 5;
    
    if (fullList.length <= 6) {
      wx.showActionSheet({ 
        itemList: fullList, 
        success: (res) => { 
          if (!res.cancel) this.onModelChange({ detail: { value: res.tapIndex } }); 
        } 
      });
      return;
    }

    let currentPage = 0;
    const showPage = (page: number) => {
      const start = page * MAX_SHOW;
      const end = Math.min(start + MAX_SHOW, fullList.length);
      const pageList = fullList.slice(start, end);
      if (end < fullList.length) pageList.push('下一页 >');
      
      wx.showActionSheet({ 
        itemList: pageList, 
        success: (res) => {
          if (!res.cancel) {
            if (res.tapIndex === pageList.length - 1 && end < fullList.length) {
              showPage(page + 1);
            } else {
              this.onModelChange({ detail: { value: start + res.tapIndex } });
            }
          }
        }
      });
    };
    showPage(0);
  },

  onModelChange(e: any) {
    const index = e.detail.value;
    const selected = this.data.modelList[index];
    this.setData({ 
      modelIndex: index, 
      currentModel: selected.value,
      isSupportImage: selected.supportImage 
    });
  },

  chooseImage() {
    const currentCount = this.data.previewImgs.length;
    const maxCount = 9;

    if (currentCount >= maxCount) {
      wx.showToast({ title: '最多9张图片', icon: 'none' });
      return;
    }

    wx.chooseMedia({
      count: maxCount - currentCount,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newPaths = res.tempFiles.map((file: any) => file.tempFilePath);
        this.setData({ previewImgs: [...this.data.previewImgs, ...newPaths] });
      }
    });
  },

  deleteImage(e: any) {
    const index = e.currentTarget.dataset.index;
    const newImgs = this.data.previewImgs.filter((_: any, i: number) => i !== index);
    this.setData({ previewImgs: newImgs });
  },

  clearPreview() {
    this.setData({ previewImgs: [] });
  },

  previewImage(e: any) {
    const index = e.currentTarget.dataset.index;
    const message = this.data.messages[index];
    
    if (message.images && message.images.length > 0) {
      wx.previewImage({
        urls: message.images,
        current: message.images[0]
      });
    }
  },

  // ====================== ✅ 上下文对话核心（已改造完成） ======================
  sendMessage() {
    const { inputText, messages, currentModel, previewImgs } = this.data;
    if (!inputText.trim() && previewImgs.length === 0) return;
  
    this.setData({ loading: true });
  
    const userMsg = { 
      role: 'user' as const, 
      content: inputText,      
      images: previewImgs      
    };
    
    // 构建包含当前问题的完整上下文
    const fullHistory = [...messages, userMsg];
    this.setData({
      messages: fullHistory,
      inputText: ''
    });
  
    if (previewImgs.length === 0) {
      wx.request({
        url: app.globalData.mybaseurl + '/ai/chat',
        method: 'POST',
        header: { 'Content-Type': 'application/json' },
        // 把完整历史拼接成提示词传给后端
        data: { 
          prompt: this.buildContextPrompt(fullHistory),
          model: currentModel 
        },
        success: (res) => {
          if (res.statusCode !== 200) { this.showError('请求错误：' + res.statusCode); return; }
          const reply = res.data.content;
          this.setData({ 
            messages: [...fullHistory, { role: 'assistant', content: reply }], 
            loading: false 
          });
          this.saveCurrentChat();
        },
        fail: () => { 
          this.showError('连接服务器失败');
          this.setData({ loading: false });
        }
      });
    } else {
      // 图片对话同理，拼接上下文
      this.convertImagesToBase64(previewImgs).then(base64Images => {
        wx.request({
          url: app.globalData.mybaseurl + '/ai/chat/localImg',
          method: 'POST',
          header: { 'Content-Type': 'application/json' },
          data: {
            prompt: this.buildContextPrompt(fullHistory),
            model: currentModel,
            images: base64Images
          },
          success: (res) => {
            try {
              if (res.statusCode !== 200) { this.showError('请求错误：' + res.statusCode); return; }
              const data = res.data;
              this.setData({
                messages: [...fullHistory, { role: 'assistant', content: data.content }],
                loading: false,
                previewImgs: []
              });
              this.saveCurrentChat();
            } catch (err) { 
              this.showError('返回数据解析失败');
              this.setData({ loading: false });
            }
          },
          fail: (err) => { 
            console.error('请求失败', err);
            this.showError('请求失败: ' + err.errMsg); 
            this.setData({ loading: false });
          }
        });
      }).catch(err => {
        console.error('图片转换失败', err);
        this.showError('图片处理失败');
        this.setData({ loading: false });
      });
    }
  },
  
  // 新增：把messages数组拼接成上下文字符串
  buildContextPrompt(history: any[]) {
    let context = "";
    history.forEach(msg => {
      if (msg.role === 'user') {
        context += `用户：${msg.content}\n`;
      } else if (msg.role === 'assistant') {
        context += `AI：${msg.content}\n`;
      }
    });
    context += "用户："; // 让模型接着回答
    return context;
  },

  convertImagesToBase64(filePaths: string[]): Promise<string[]> {
    const promises = filePaths.map(filePath => {
      return new Promise<string>((resolve, reject) => {
        wx.getImageInfo({
          src: filePath,
          success: (imageInfo) => {
            const fs = wx.getFileSystemManager();
            fs.readFile({
              filePath: filePath,
              success: (res) => {
                let base64 = wx.arrayBufferToBase64(res.data);
                base64 = base64.replace(/\s/g, '');
                
                let mimeType = imageInfo.type;
                if (mimeType === 'jpg') mimeType = 'jpeg';
                const fullMimeType = `image/${mimeType}`;
                const dataUrl = `data:${fullMimeType};base64,${base64}`;
                
                resolve(dataUrl);
              },
              fail: reject
            });
          },
          fail: reject
        });
      });
    });
    return Promise.all(promises);
  },

  showError(msg: string) {
    wx.showToast({ title: msg, icon: 'none' });
    this.setData({ loading: false });
  }
});