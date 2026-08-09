import { IsString, IsUUID, IsOptional, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkflowRequestDto {
  @ApiProperty({ description: 'ワークフロー定義 UUID' })
  @IsUUID()
  workflowId!: string;

  @ApiProperty({ description: '対象エンティティ種別 (例: document, quality-plan)' })
  @IsString()
  @MaxLength(100)
  targetType!: string;

  @ApiProperty({ description: '対象エンティティ UUID' })
  @IsUUID()
  targetId!: string;

  @ApiPropertyOptional({ description: '関連文書 UUID' })
  @IsOptional()
  @IsUUID()
  documentId?: string;

  @ApiPropertyOptional({ description: 'コメント' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;

  @ApiPropertyOptional({ description: '期限日時 (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
