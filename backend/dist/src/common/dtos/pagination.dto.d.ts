export declare class PaginationDto {
    page?: number;
    limit?: number;
    search?: string;
    get skip(): number;
}
export declare class PaginatedResponseDto<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    static create<T>(data: T[], total: number, page: number, limit: number): PaginatedResponseDto<T>;
}
