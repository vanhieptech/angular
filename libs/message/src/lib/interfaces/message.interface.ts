export interface Message<T = unknown> {
  type: string;
  payload?: T;
  timestamp?: number;
  source?: 'webview' | 'ios' | 'android';
}

export interface LogMessage {
  level: 'info' | 'warning' | 'error';
  icon: string;
  message: string;
  timestamp: string;
}
