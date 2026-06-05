"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var EvolutionApiClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvolutionApiClient = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
let EvolutionApiClient = EvolutionApiClient_1 = class EvolutionApiClient {
    config;
    logger = new common_1.Logger(EvolutionApiClient_1.name);
    http;
    constructor(config) {
        this.config = config;
        this.http = axios_1.default.create({
            baseURL: this.config.get('EVOLUTION_API_URL'),
            headers: {
                apikey: this.config.get('EVOLUTION_API_KEY'),
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        });
    }
    async createInstance(instanceName) {
        const { data } = await this.http.post('/instance/create', {
            instanceName,
            qrcode: true,
            integration: 'WHATSAPP-BAILEYS',
        });
        this.logger.log(`Instance created: ${instanceName}`);
        return data;
    }
    async connectInstance(instanceName) {
        const { data } = await this.http.get(`/instance/connect/${instanceName}`);
        return data;
    }
    async getConnectionState(instanceName) {
        const { data } = await this.http.get(`/instance/connectionState/${instanceName}`);
        return data;
    }
    async sendText(instanceName, phone, text) {
        try {
            const { data } = await this.http.post(`/message/sendText/${instanceName}`, {
                number: phone,
                text,
            });
            this.logger.debug(`Message sent to ${phone} via ${instanceName}`);
            return { success: true, data };
        }
        catch (error) {
            this.logger.error(`Failed to send to ${phone}: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    async logoutInstance(instanceName) {
        const { data } = await this.http.delete(`/instance/logout/${instanceName}`);
        return data;
    }
    async deleteInstance(instanceName) {
        const { data } = await this.http.delete(`/instance/delete/${instanceName}`);
        return data;
    }
    async fetchInstances() {
        const { data } = await this.http.get('/instance/fetchInstances');
        return Array.isArray(data) ? data : [];
    }
    async setWebhook(instanceName, webhookUrl) {
        const { data } = await this.http.post(`/webhook/set/${instanceName}`, {
            enabled: true,
            url: webhookUrl,
            webhookByEvents: true,
            events: ['QRCODE_UPDATED', 'CONNECTION_UPDATE', 'MESSAGES_UPSERT'],
        });
        return data;
    }
};
exports.EvolutionApiClient = EvolutionApiClient;
exports.EvolutionApiClient = EvolutionApiClient = EvolutionApiClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EvolutionApiClient);
//# sourceMappingURL=evolution-api.client.js.map