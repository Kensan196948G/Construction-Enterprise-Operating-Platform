import { IsString, IsUUID, IsOptional, IsInt, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkflowActionDto {
  @ApiProperty({ description: 'ワークフローリクエスト UUID' })
  @IsUUID()
  requestId!: string;

  @ApiProperty({ description: 'ステップ順序 (1 始まり)', minimum: 1 })
  @IsInt()
  @Min(1)
  stepOrder!: number;

  @ApiProperty({
    description: 'アクション種別 (APPROVE / REJECT / DELEGATE / COMMENT)',
    example: 'APPROVE',
  })
  @IsString()
  @MaxLength(50)
  action!: string;

  @ApiPropertyOptional({ description: 'コメント' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
