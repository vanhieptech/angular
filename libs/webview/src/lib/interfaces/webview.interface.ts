export interface WebViewMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp?: number;
}

export interface WebViewBridge {
  sendMessage<T>(message: WebViewMessage<T>): Promise<void>;
  addMessageListener<T>(callback: (message: WebViewMessage<T>) => void): void;
  removeMessageListener<T>(
    callback: (message: WebViewMessage<T>) => void
  ): void;
}

export interface PlatformService {
  isIOS(): boolean;
  isAndroid(): boolean;
  isWebView(): boolean;
}
