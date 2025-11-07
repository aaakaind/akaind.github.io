/**
 * Embeddable Widget Loader
 * 
 * Provides a secure, sandboxed way to embed AKA Industries widgets
 * into third-party websites with minimal footprint.
 * 
 * Usage:
 * ```html
 * <script src="https://cdn.akaind.ca/widget-loader.js"></script>
 * <script>
 *   AKAWidget.load('product-demo', {
 *     container: '#demo-widget',
 *     apiKey: 'your-api-key',
 *     theme: 'light'
 *   });
 * </script>
 * ```
 */

export interface WidgetConfig {
  container: string | HTMLElement;
  apiKey: string;
  theme?: 'light' | 'dark' | 'auto';
  locale?: string;
  customStyles?: Record<string, string>;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  sandbox?: boolean;
}

export interface WidgetMessage {
  type: 'ready' | 'resize' | 'event' | 'error';
  payload?: any;
}

class WidgetLoader {
  private widgets: Map<string, HTMLIFrameElement> = new Map();
  private readonly CDN_BASE = 'https://cdn.akaind.ca/widgets';
  private readonly ALLOWED_ORIGINS = ['https://akaind.ca', 'https://www.akaind.ca'];

  /**
   * Load a widget into the specified container
   */
  async load(widgetType: string, config: WidgetConfig): Promise<void> {
    try {
      // Validate API key
      await this.validateApiKey(config.apiKey);

      // Get or create container
      const container = this.getContainer(config.container);
      if (!container) {
        throw new Error('Container not found');
      }

      // Create iframe with security attributes
      const iframe = this.createSecureIframe(widgetType, config);
      
      // Set up message passing
      this.setupMessageChannel(iframe, config);

      // Insert iframe into container
      container.appendChild(iframe);

      // Store reference
      this.widgets.set(widgetType, iframe);

      // Wait for widget to be ready
      await this.waitForReady(iframe);

      config.onLoad?.();
    } catch (error) {
      config.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Unload a widget
   */
  unload(widgetType: string): void {
    const iframe = this.widgets.get(widgetType);
    if (iframe && iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
      this.widgets.delete(widgetType);
    }
  }

  /**
   * Send message to widget
   */
  postMessage(widgetType: string, message: WidgetMessage): void {
    const iframe = this.widgets.get(widgetType);
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(message, this.ALLOWED_ORIGINS[0]);
    }
  }

  private createSecureIframe(
    widgetType: string, 
    config: WidgetConfig
  ): HTMLIFrameElement {
    const iframe = document.createElement('iframe');
    
    // Build widget URL with parameters
    const url = new URL(`${this.CDN_BASE}/${widgetType}/index.html`);
    url.searchParams.set('theme', config.theme || 'auto');
    url.searchParams.set('locale', config.locale || 'en');
    
    // Security attributes
    iframe.src = url.toString();
    iframe.setAttribute('sandbox', this.getSandboxFlags(config.sandbox));
    iframe.setAttribute('allow', 'encrypted-media');
    iframe.style.border = 'none';
    iframe.style.width = '100%';
    iframe.style.height = '400px';
    
    // Apply custom styles
    if (config.customStyles) {
      Object.assign(iframe.style, config.customStyles);
    }

    return iframe;
  }

  private getSandboxFlags(sandbox?: boolean): string {
    if (sandbox === false) {
      return 'allow-scripts allow-same-origin allow-forms';
    }
    
    // Restrictive by default
    return 'allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox';
  }

  private setupMessageChannel(iframe: HTMLIFrameElement, config: WidgetConfig): void {
    window.addEventListener('message', (event) => {
      // Verify origin
      if (!this.ALLOWED_ORIGINS.includes(event.origin)) {
        return;
      }

      // Verify source
      if (event.source !== iframe.contentWindow) {
        return;
      }

      const message = event.data as WidgetMessage;

      switch (message.type) {
        case 'resize':
          if (message.payload?.height) {
            iframe.style.height = `${message.payload.height}px`;
          }
          break;

        case 'event':
          // Forward custom events
          this.dispatchCustomEvent(message.payload);
          break;

        case 'error':
          config.onError?.(new Error(message.payload?.message || 'Widget error'));
          break;
      }
    });
  }

  private dispatchCustomEvent(payload: any): void {
    const event = new CustomEvent('aka-widget-event', {
      detail: payload,
      bubbles: true
    });
    document.dispatchEvent(event);
  }

  private getContainer(selector: string | HTMLElement): HTMLElement | null {
    if (typeof selector === 'string') {
      return document.querySelector(selector);
    }
    return selector;
  }

  private async validateApiKey(apiKey: string): Promise<void> {
    // In production, this would make an API call to validate the key
    if (!apiKey || apiKey.length < 10) {
      throw new Error('Invalid API key');
    }
  }

  private waitForReady(iframe: HTMLIFrameElement): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Widget load timeout'));
      }, 10000);

      const handler = (event: MessageEvent) => {
        if (event.source === iframe.contentWindow && 
            this.ALLOWED_ORIGINS.includes(event.origin) && 
            event.data.type === 'ready') {
          clearTimeout(timeout);
          window.removeEventListener('message', handler);
          resolve();
        }
      };

      window.addEventListener('message', handler);
    });
  }
}

// Global API
const globalWidget = new WidgetLoader();

// Expose on window for script tag usage
if (typeof window !== 'undefined') {
  (window as any).AKAWidget = {
    load: (type: string, config: WidgetConfig) => globalWidget.load(type, config),
    unload: (type: string) => globalWidget.unload(type),
    postMessage: (type: string, message: WidgetMessage) => 
      globalWidget.postMessage(type, message)
  };
}

export default WidgetLoader;
