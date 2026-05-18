// 获取全局 app
const app = getApp() as any;

// 基础 URL 从全局变量获取
const BASE_URL = app.globalData.mybaseurl;

/**
 * 通用请求封装（自动携带 userId，支持 TypeScript）
 */
const request = <T = any>(
  url: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  data: any = {}
): Promise<T> => {
  // 自动从本地获取 userId
  const userId = wx.getStorageSync('userId');

  // 合并参数
  const finalData: any = { ...data };

  // 自动注入 userId
  if (userId) {
    finalData.userId = userId;
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + url,
      method: method,
      data: finalData,
      header: {
        'content-type': 'application/json',
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data as T);
        } else {
          wx.showToast({ title: '请求失败', icon: 'none' });
          reject(res);
        }
      },
      fail: (err) => {
        wx.showToast({ title: '网络异常', icon: 'none' });
        reject(err);
      },
    });
  });
};

// 导出 AI 对话相关接口
const api = {
  // 保存/更新对话
  saveChat: (data: { title: string; messages: string }) => 
    request('/api/chat/save', 'POST', data),

  // 获取历史对话列表
  getChatList: () => 
    request('/api/chat/list', 'GET'),

  // 获取对话详情
  getChatDetail: (id: number) => 
    request(`/api/chat/detail/${id}`, 'GET'),

  // 删除对话
  deleteChat: (id: number) => 
    request(`/api/chat/delete/${id}`, 'DELETE'),
};

export default api;