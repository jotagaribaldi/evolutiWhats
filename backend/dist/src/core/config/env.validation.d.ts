declare enum Environment {
    Development = "development",
    Staging = "staging",
    Production = "production"
}
declare class EnvironmentVariables {
    APP_ENV: Environment;
    APP_PORT: number;
    DATABASE_URL: string;
    REDIS_HOST: string;
    REDIS_PORT: number;
    JWT_SECRET: string;
    JWT_ACCESS_EXPIRATION: string;
    JWT_REFRESH_EXPIRATION: string;
    EVOLUTION_API_URL: string;
    EVOLUTION_API_KEY: string;
    CORS_ORIGINS: string;
    THROTTLE_TTL: number;
    THROTTLE_LIMIT: number;
}
export declare function validate(config: Record<string, unknown>): EnvironmentVariables;
export {};
