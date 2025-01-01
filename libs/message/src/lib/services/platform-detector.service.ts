import { Injectable } from '@angular/core';

interface MessageBridge {
  postMessage: (message: unknown) => void;
}

interface WebKitMessageHandlers {
  postMessageHandler: MessageBridge;
}

interface WebKitBridge {
  messageHandlers: WebKitMessageHandlers;
}

declare global {
  interface Window {
    webkit?: WebKitBridge;
    Android?: MessageBridge;
  }
}

interface BridgeHandler {
  HANDLER_NAME: string;
  METHOD_NAME: string;
}

interface PlatformConfig {
  name: string;
  bridge: BridgeHandler;
  getHandler: () => MessageBridge | undefined;
}

const BRIDGE_HANDLERS = {
  IOS: {
    HANDLER_NAME: 'postMessageHandler',
    METHOD_NAME: 'postMessage',
  },
  ANDROID: {
    HANDLER_NAME: 'Android',
    METHOD_NAME: 'postMessage',
  },
} as const;

const PLATFORM_CONFIGS: PlatformConfig[] = [
  {
    name: 'iOS',
    bridge: BRIDGE_HANDLERS.IOS,
    getHandler: () => window.webkit?.messageHandlers?.[BRIDGE_HANDLERS.IOS.HANDLER_NAME],
  },
  {
    name: 'Android',
    bridge: BRIDGE_HANDLERS.ANDROID,
    getHandler: () => window[BRIDGE_HANDLERS.ANDROID.HANDLER_NAME],
  },
];

@Injectable({
  providedIn: 'root',
})
export class PlatformDetectorService {
  private isWebViewCached: boolean | null = null;

  private isValidHandler(
    handler: MessageBridge | undefined,
    methodName: string
  ): boolean {
    return !!(handler?.[methodName as keyof MessageBridge] &&
      typeof handler[methodName as keyof MessageBridge] === 'function');
  }

  private checkPlatform(config: PlatformConfig): boolean {
    try {
      const handler = config.getHandler();
      return this.isValidHandler(handler, config.bridge.METHOD_NAME);
    } catch {
      return false;
    }
  }

  isEmbeddedWebView(): boolean {
    if (this.isWebViewCached !== null) {
      return this.isWebViewCached;
    }

    try {
      this.isWebViewCached = PLATFORM_CONFIGS.some(config => this.checkPlatform(config));
      return this.isWebViewCached;
    } catch {
      this.isWebViewCached = false;
      return false;
    }
  }

  getPlatformInfo(): { isWebView: boolean; platform?: string } {
    if (!this.isEmbeddedWebView()) {
      return { isWebView: false };
    }

    const platform = PLATFORM_CONFIGS.find(config => this.checkPlatform(config));
    return {
      isWebView: true,
      platform: platform?.name,
    };
  }

  resetCache(): void {
    this.isWebViewCached = null;
  }
}
