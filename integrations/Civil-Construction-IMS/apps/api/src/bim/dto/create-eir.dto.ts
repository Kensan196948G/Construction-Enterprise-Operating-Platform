import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsObject } from 'class-validator';

export class CreateEirDto {
  @ApiPropertyOptional({ description: 'プロジェクト UUID' })
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @ApiProperty({ description: 'EIR タイトル', example: '道路改良工事 EIR v1' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({
    description: '構造化された要件内容 (JSON)',
    example: { lod: '300', formats: ['IFC4'], softwareRequirements: [] },
  })
  @IsObject()
  @IsOptional()
  requirements?: Record<string, unknown>;
}
