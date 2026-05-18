const app = getApp() as any;

Page({
  data: {
    messages: [] as any[],
    inputText: '',
    socketConnected: false,
    onlineCount: 0,
    userInfo: null as any,
    scrollToView: '',
    inputFocus: false
  },

  socketTask: null as any,
  userId: '',
  nickname: '',
  avatar: '',
  lastMessageTime: 0,

  onLoad() {
    this.initUserInfo();
  },

  onUnload() {
    this.closeWebSocket();
  },

  initUserInfo() {
    const userId = wx.getStorageSync('userId');
    const nickname = wx.getStorageSync('nickname') || '用户' + Math.floor(Math.random() * 10000);
    const avatar = wx.getStorageSync('avatar') || '';

    this.userId = userId || String(Date.now());
    this.nickname = nickname;
    this.avatar = avatar;

    this.setData({
      userInfo: { id: this.userId, nickname: this.nickname, avatar: this.avatar }
    });

    if (!userId) {
      wx.setStorageSync('userId', this.userId);
    }
    if (!wx.getStorageSync('nickname')) {
      wx.setStorageSync('nickname', this.nickname);
    }

    this.loadHistory();
  },

  formatTimeDivider(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

    if (messageDate.getTime() === today.getTime()) {
      return `今天 ${timeStr}`;
    } else if (messageDate.getTime() === yesterday.getTime()) {
      return `昨天 ${timeStr}`;
    } else {
      return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${timeStr}`;
    }
  },

  shouldShowTimeDivider(timestamp: number): boolean {
    if (this.lastMessageTime === 0) return true;
    return timestamp - this.lastMessageTime > 300000; // 5分钟
  },

  loadHistory() {
    wx.request({
      url: `${app.globalData.mybaseurl}/api/chatroom/history?limit=50`,
      method: 'GET',
      success: (res: any) => {
        if (res.statusCode === 200 && Array.isArray(res.data)) {
          const history = res.data;
          this.lastMessageTime = 0;
          const messages = history.map((msg: any) => {
            const time = new Date(msg.createTime);
            const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
            const showTime = this.shouldShowTimeDivider(msg.createTime);
            this.lastMessageTime = msg.createTime;
            return {
              type: 'message',
              content: msg.content,
              sender: msg.nickname,
              avatar: msg.avatar,
              userId: String(msg.userId),
              isSelf: String(msg.userId) === this.userId,
              timeStr: timeStr,
              timestamp: msg.createTime,
              showTime: showTime,
              timeDivider: this.formatTimeDivider(msg.createTime)
            };
          });
          this.setData({ messages });
        }
        this.connectWebSocket();
      },
      fail: () => {
        this.connectWebSocket();
      }
    });
  },

  connectWebSocket() {
    wx.showLoading({ title: '连接中...' });

    const wsUrl = app.globalData.mybaseurl.replace('https://', 'wss://').replace('http://', 'ws://') + '/ws/chat';
    
    this.socketTask = wx.connectSocket({
      url: wsUrl,
      success: () => {
        console.log('WebSocket连接中...');
      }
    });

    this.socketTask.onOpen(() => {
      console.log('WebSocket连接成功');
      wx.hideLoading();
      this.setData({ socketConnected: true });
      this.sendJoinMessage();
    });

    this.socketTask.onMessage((res: any) => {
      try {
        const data = JSON.parse(res.data);
        this.handleMessage(data);
      } catch (e) {
        console.error('消息解析失败', e);
      }
    });

    this.socketTask.onClose(() => {
      console.log('WebSocket连接关闭');
      this.setData({ socketConnected: false });
    });

    this.socketTask.onError((err: any) => {
      console.error('WebSocket错误', err);
      wx.hideLoading();
      wx.showToast({ title: '连接失败', icon: 'none' });
    });
  },

  closeWebSocket() {
    if (this.socketTask) {
      this.socketTask.close();
      this.socketTask = null;
    }
  },

  sendJoinMessage() {
    const joinMsg = {
      type: 'join',
      sender: this.nickname,
      userId: this.userId,
      timestamp: Date.now()
    };
    this.socketTask.send({ data: JSON.stringify(joinMsg) });
  },

  handleMessage(data: any) {
    const { messages } = this.data;

    if (data.type === 'online_count') {
      this.setData({ onlineCount: data.count });
      return;
    }

    if (data.type === 'system') {
      messages.push({
        type: 'system',
        content: data.content,
        timestamp: data.timestamp
      });
    } else if (data.type === 'message') {
      const time = new Date(data.timestamp);
      const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
      const showTime = this.shouldShowTimeDivider(data.timestamp);
      this.lastMessageTime = data.timestamp;

      messages.push({
        type: 'message',
        content: data.content,
        sender: data.sender,
        avatar: data.avatar,
        userId: data.userId,
        isSelf: data.userId === this.userId,
        timeStr: timeStr,
        timestamp: data.timestamp,
        showTime: showTime,
        timeDivider: this.formatTimeDivider(data.timestamp)
      });
    }

    this.setData({
      messages,
      scrollToView: 'msg-bottom'
    });
  },

  onInput(e: any) {
    this.setData({ inputText: e.detail.value });
  },

  onInputFocus() {
    this.setData({ inputFocus: true });
  },

  onInputBlur() {
    this.setData({ inputFocus: false });
  },

  sendMessage() {
    const { inputText, socketConnected } = this.data;
    if (!inputText.trim()) {
      wx.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }
    if (!socketConnected) {
      wx.showToast({ title: '未连接服务器', icon: 'none' });
      return;
    }

    const message = {
      type: 'message',
      content: inputText,
      sender: this.nickname,
      avatar: this.avatar,
      userId: this.userId,
      timestamp: Date.now()
    };

    this.socketTask.send({ data: JSON.stringify(message) });
    this.setData({ inputText: '' });
  },

  goBack() {
    wx.navigateBack();
  }
});
