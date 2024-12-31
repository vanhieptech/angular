export interface BaseMessage {
  type: string;
  timestamp?: number;
  source?: 'webview' | 'browser' | 'native';
  token?: string;
}

export interface Message<T = unknown> extends BaseMessage {
  payload?: T;
}

export interface MessageBridge {
  sendMessage(serializedMessage: string): Promise<void>;
  addMessageListener(callback: (message: string | Message) => void): void;
  removeMessageListener(callback: (message: string | Message) => void): void;
}
