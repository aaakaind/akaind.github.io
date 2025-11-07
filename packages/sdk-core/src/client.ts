/**
 * AKA Industries Platform SDK - TypeScript Client
 * 
 * Official TypeScript/JavaScript SDK for interacting with the platform API
 */

export interface ClientConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

export interface APIResponse<T> {
  data: T;
  meta?: {
    page?: number;
    totalPages?: number;
    totalCount?: number;
  };
}

export class AKAClient {
  private config: ClientConfig;
  private readonly DEFAULT_BASE_URL = 'https://api.akaind.ca';
  private readonly DEFAULT_TIMEOUT = 30000;

  constructor(config: ClientConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }

    this.config = {
      baseUrl: config.baseUrl || this.DEFAULT_BASE_URL,
      timeout: config.timeout || this.DEFAULT_TIMEOUT,
      retries: config.retries || 3,
      ...config
    };
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<APIResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'AKA-SDK-TS/1.0.0'
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.retries!; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          method,
          headers,
          body: data ? JSON.stringify(data) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.config.retries!) {
          // Exponential backoff
          await this.sleep(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw lastError || new Error('Request failed');
  }

  // User Management
  async getUser(userId: string) {
    return this.request('GET', `/users/${userId}`);
  }

  async listUsers(params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request('GET', `/users?${query}`);
  }

  async createUser(userData: any) {
    return this.request('POST', '/users', userData);
  }

  async updateUser(userId: string, userData: any) {
    return this.request('PUT', `/users/${userId}`, userData);
  }

  async deleteUser(userId: string) {
    return this.request('DELETE', `/users/${userId}`);
  }

  // Tenant Management
  async getTenant(tenantId: string) {
    return this.request('GET', `/tenants/${tenantId}`);
  }

  async listTenants(params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request('GET', `/tenants?${query}`);
  }

  async createTenant(tenantData: any) {
    return this.request('POST', '/tenants', tenantData);
  }

  // API Keys
  async listApiKeys(tenantId: string) {
    return this.request('GET', `/tenants/${tenantId}/api-keys`);
  }

  async createApiKey(tenantId: string, keyData: any) {
    return this.request('POST', `/tenants/${tenantId}/api-keys`, keyData);
  }

  async revokeApiKey(tenantId: string, keyId: string) {
    return this.request('DELETE', `/tenants/${tenantId}/api-keys/${keyId}`);
  }

  // Usage Metrics
  async getUsageMetrics(tenantId: string, params?: {
    startDate?: string;
    endDate?: string;
    granularity?: 'hour' | 'day' | 'month';
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request('GET', `/tenants/${tenantId}/usage?${query}`);
  }

  // Billing
  async listInvoices(tenantId: string) {
    return this.request('GET', `/tenants/${tenantId}/invoices`);
  }

  async getInvoice(tenantId: string, invoiceId: string) {
    return this.request('GET', `/tenants/${tenantId}/invoices/${invoiceId}`);
  }

  // Webhooks
  async listWebhooks(tenantId: string) {
    return this.request('GET', `/tenants/${tenantId}/webhooks`);
  }

  async createWebhook(tenantId: string, webhookData: {
    url: string;
    events: string[];
    secret?: string;
  }) {
    return this.request('POST', `/tenants/${tenantId}/webhooks`, webhookData);
  }

  async deleteWebhook(tenantId: string, webhookId: string) {
    return this.request('DELETE', `/tenants/${tenantId}/webhooks/${webhookId}`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default AKAClient;
