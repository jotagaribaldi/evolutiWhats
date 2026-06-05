import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface EvolutionInstanceResponse {
  instance: {
    instanceName: string;
    status: string;
  };
  hash: string;
  qrcode?: { base64: string };
}

export interface EvolutionConnectionState {
  instance: string;
  state: 'open' | 'close' | 'connecting';
}

export interface EvolutionInstanceFull {
  id: string;
  name: string;
  connectionStatus: 'open' | 'close' | 'connecting';
  ownerJid?: string;
  profileName?: string;
  profilePicUrl?: string;
  token: string;
  integration: string;
  _count?: { Message: number };
}

@Injectable()
export class EvolutionApiClient {
  private readonly logger = new Logger(EvolutionApiClient.name);
  private readonly http: AxiosInstance;

  constructor(private readonly config: ConfigService) {
    this.http = axios.create({
      baseURL: this.config.get('EVOLUTION_API_URL'),
      headers: {
        apikey: this.config.get('EVOLUTION_API_KEY'),
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async createInstance(instanceName: string): Promise<EvolutionInstanceResponse> {
    const { data } = await this.http.post('/instance/create', {
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
    });
    this.logger.log(`Instance created: ${instanceName}`);
    return data;
  }

  async connectInstance(instanceName: string): Promise<{ base64: string }> {
    const { data } = await this.http.get(`/instance/connect/${instanceName}`);
    return data;
  }

  async getConnectionState(instanceName: string): Promise<EvolutionConnectionState> {
    const { data } = await this.http.get(`/instance/connectionState/${instanceName}`);
    return data;
  }

  async sendText(instanceName: string, phone: string, text: string) {
    try {
      const { data } = await this.http.post(`/message/sendText/${instanceName}`, {
        number: phone,
        text,
      });
      this.logger.debug(`Message sent to ${phone} via ${instanceName}`);
      return { success: true, data };
    } catch (error: any) {
      this.logger.error(`Failed to send to ${phone}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async logoutInstance(instanceName: string) {
    const { data } = await this.http.delete(`/instance/logout/${instanceName}`);
    return data;
  }

  async deleteInstance(instanceName: string) {
    const { data } = await this.http.delete(`/instance/delete/${instanceName}`);
    return data;
  }

  async fetchInstances(): Promise<EvolutionInstanceFull[]> {
    const { data } = await this.http.get('/instance/fetchInstances');
    return Array.isArray(data) ? data : [];
  }

  async setWebhook(instanceName: string, webhookUrl: string) {
    const { data } = await this.http.post(`/webhook/set/${instanceName}`, {
      enabled: true,
      url: webhookUrl,
      webhookByEvents: true,
      events: ['QRCODE_UPDATED', 'CONNECTION_UPDATE', 'MESSAGES_UPSERT'],
    });
    return data;
  }
}
