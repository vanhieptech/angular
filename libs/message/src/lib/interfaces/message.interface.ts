export interface Message<T = unknown> {
  type: string;
  timestamp?: number;
  source?: 'webview' | 'browser' | 'native';
  token?: string;
  [key: string]: any;
}

export interface MessageBridge {
  sendMessage(serializedMessage: string): Promise<void>;
  addMessageListener(callback: (message: string | Message) => void): void;
  removeMessageListener(callback: (message: string | Message) => void): void;
}

export interface PlatformDetector {
  isEmbeddedWebView(): boolean;
  isIOSWebView(): boolean;
  isAndroidWebView(): boolean;
}
