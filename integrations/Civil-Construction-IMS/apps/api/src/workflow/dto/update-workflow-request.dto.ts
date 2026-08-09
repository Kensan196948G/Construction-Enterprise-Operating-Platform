import { IsString, IsOptional, IsDateString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWorkflowRequestDto {
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
