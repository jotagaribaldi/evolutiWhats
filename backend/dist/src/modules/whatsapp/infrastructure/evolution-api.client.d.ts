import { ConfigService } from '@nestjs/config';
export interface EvolutionInstanceResponse {
    instance: {
        instanceName: string;
        status: string;
    };
    hash: string;
    qrcode?: {
        base64: string;
    };
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
    _count?: {
        Message: number;
    };
}
export declare class EvolutionApiClient {
    private readonly config;
    private readonly logger;
    private readonly http;
    constructor(config: ConfigService);
    createInstance(instanceName: string): Promise<EvolutionInstanceResponse>;
    connectInstance(instanceName: string): Promise<{
        base64: string;
    }>;
    getConnectionState(instanceName: string): Promise<EvolutionConnectionState>;
    sendText(instanceName: string, phone: string, text: string): Promise<{
        success: boolean;
        data: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data?: undefined;
    }>;
    logoutInstance(instanceName: string): Promise<any>;
    deleteInstance(instanceName: string): Promise<any>;
    fetchInstances(): Promise<EvolutionInstanceFull[]>;
    setWebhook(instanceName: string, webhookUrl: string): Promise<any>;
}
