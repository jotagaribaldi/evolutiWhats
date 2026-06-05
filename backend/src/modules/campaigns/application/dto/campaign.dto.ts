import { IsString, IsOptional, IsArray, IsInt, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCampaignDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  messageTemplate: string;

  @ApiPropertyOptional({ type: [String], default: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  groupIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instanceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ default: 3000 })
  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(30000)
  minDelayMs?: number;

  @ApiPropertyOptional({ default: 10000 })
  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(60000)
  maxDelayMs?: number;
}
