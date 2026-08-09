import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDate,
  IsNumber,
  IsPositive,
  MaxLength,
  IsDecimal,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RiskLevel, Severity, CorrectiveActionStatus } from '@prisma/client';

// ----------------------------------------------------------------
// Hazard Identification DTOs
// ----------------------------------------------------------------

export class CreateHazardIdentificationDto {
  @ApiPropertyOptional({ description: 'プロジェクト ID (UUID)' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiProperty({ description: '作業活動名' })
  @IsString()
  @MaxLength(255)
  workActivity!: string;

  @ApiProperty({ description: '危険源の種類' })
  @IsString()
  @MaxLength(100)
  hazardType!: string;

  @ApiProperty({ description: '危険源の詳細説明' })
  @IsString()
  @MaxLength(2000)
  hazardDescription!: string;

  @ApiPropertyOptional({
    enum: RiskLevel,
    default: RiskLevel.MEDIUM,
    description: 'リスクレベル',
  })
  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;

  @ApiPropertyOptional({ description: '既存の管理措置' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  existingControls?: string;

  @ApiPropertyOptional({ description: '追加の管理措置' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  additionalControls?: string;

  @ApiPropertyOptional({ enum: RiskLevel, description: '残余リスクレベル' })
  @IsOptional()
  @IsEnum(RiskLevel)
  residualRisk?: RiskLevel;

  @ApiPropertyOptional({ description: '見直し日時' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  reviewedAt?: Date;
}

export class UpdateHazardIdentificationDto extends PartialType(CreateHazardIdentificationDto) {}

export class HazardFilterDto {
  @ApiPropertyOptional({ description: 'プロジェクト ID でフィルタ' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ enum: RiskLevel, description: 'リスクレベルでフィルタ' })
  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;

  @ApiPropertyOptional({ default: 1, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

// ----------------------------------------------------------------
// Near Miss DTOs
// ----------------------------------------------------------------

export class CreateNearMissDto {
  @ApiProperty({ description: 'ヒヤリハット報告番号 (一意)' })
  @IsString()
  @MaxLength(50)
  reportNo!: string;

  @ApiPropertyOptional({ description: 'プロジェクト ID (UUID)' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiProperty({ description: '発生日時' })
  @Type(() => Date)
  @IsDate()
  occurredAt!: Date;

  @ApiPropertyOptional({ description: '発生場所' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiProperty({ description: '状況の説明' })
  @IsString()
  @MaxLength(4000)
  description!: string;

  @ApiPropertyOptional({
    enum: Severity,
    default: Severity.MEDIUM,
    description: '潜在的重篤度',
  })
  @IsOptional()
  @IsEnum(Severity)
  potentialSeverity?: Severity;

  @ApiPropertyOptional({ description: '直ちに取った措置' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  immediateAction?: string;
}

export class UpdateNearMissDto extends PartialType(CreateNearMissDto) {}

export class CloseNearMissDto {
  @ApiPropertyOptional({ description: '根本原因' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  rootCause?: string;

  @ApiPropertyOptional({ description: '予防措置' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  preventiveMeasure?: string;

  @ApiPropertyOptional({ description: 'クローズ理由' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class NearMissFilterDto {
  @ApiPropertyOptional({ description: 'プロジェクト ID でフィルタ' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({
    enum: CorrectiveActionStatus,
    description: 'ステータスでフィルタ',
  })
  @IsOptional()
  @IsEnum(CorrectiveActionStatus)
  status?: CorrectiveActionStatus;

  @ApiPropertyOptional({ default: 1, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

// ----------------------------------------------------------------
// Safety Education DTOs
// ----------------------------------------------------------------

export class CreateSafetyEducationDto {
  @ApiProperty({
    description: '教育種別 (induction / special / periodic / license)',
  })
  @IsString()
  @MaxLength(50)
  educationType!: string;

  @ApiProperty({ description: '教育タイトル' })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ description: 'プロジェクト ID (UUID)' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiProperty({ description: '実施日時' })
  @Type(() => Date)
  @IsDate()
  conductedAt!: Date;

  @ApiPropertyOptional({ description: '講師ユーザー ID (UUID)' })
  @IsOptional()
  @IsUUID()
  instructorId?: string;

  @ApiPropertyOptional({ description: '実施時間（時間単位）' })
  @IsOptional()
  @IsDecimal()
  @IsPositive()
  durationHours?: string;
}

export class UpdateSafetyEducationDto extends PartialType(CreateSafetyEducationDto) {}

export class AddParticipantDto {
  @ApiProperty({ description: '参加者ユーザー ID (UUID)' })
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({ description: '参加日時' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  attendedAt?: Date;

  @ApiPropertyOptional({ description: '受講結果 (合格 / 不合格 など)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  result?: string;
}

export class EducationFilterDto {
  @ApiPropertyOptional({ description: 'プロジェクト ID でフィルタ' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ description: '教育種別でフィルタ' })
  @IsOptional()
  @IsString()
  educationType?: string;

  @ApiPropertyOptional({ default: 1, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

// ISO 45001 Phase 2 DTOs
export { CreateSafetyInspectionDto } from './create-safety-inspection.dto';
export { UpdateSafetyInspectionDto } from './update-safety-inspection.dto';
export { QuerySafetyInspectionDto } from './query-safety-inspection.dto';
export { CreateSafetyIncidentDto } from './create-safety-incident.dto';
export { UpdateSafetyIncidentDto } from './update-safety-incident.dto';
export { QuerySafetyIncidentDto } from './query-safety-incident.dto';
export { CreateToolboxTalkDto } from './create-toolbox-talk.dto';
export { UpdateToolboxTalkDto } from './update-toolbox-talk.dto';
export { QueryToolboxTalkDto } from './query-toolbox-talk.dto';
export { AddToolboxParticipantDto } from './add-toolbox-participant.dto';
