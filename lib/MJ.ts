export type ResponseError = {
  message: string;
};

export const completeCallback = (headers: HeadersInit, data: Record<string, number | string>) => {
  /** 延迟发起回调，尽量避免客户端在完成更新之前触发回调，重复上传图片到oss */
  setTimeout(() => {
    fetch('https://aiworks.club/api/mj/callback', {
      method: 'POST',
      headers: { ...headers },
      body: JSON.stringify(data),
    });
  }, 3000);
};
