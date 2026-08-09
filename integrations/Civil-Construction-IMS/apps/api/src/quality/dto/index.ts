import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsISO8601,
  MaxLength,
  MinLength,
} from 'class-validator';

// ----------------------------------------------------------------
// Shared enums (mirrored from Prisma schema for class-validator)
// ----------------------------------------------------------------

export enum InspectionResultEnum {
  PASS = 'PASS',
  FAIL = 'FAIL',
  CONDITIONAL_PASS = 'CONDITIONAL_PASS',
  PENDING = 'PENDING',
}

export enum SeverityEnum {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum CorrectiveActionStatusEnum {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

// ----------------------------------------------------------------
// Quality Plan DTOs
// ----------------------------------------------------------------

export class CreateQualityPlanDto {
  @ApiProperty({ description: 'Project UUID to associate this plan with' })
  @IsUUID()
  projectId!: string;

  @ApiProperty({ description: 'Plan title', example: 'Concrete Works Quality Plan' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ description: 'Reason for creating this plan (audit trail)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class UpdateQualityPlanDto {
  @ApiPropertyOptional({ description: 'Updated plan title' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: 'Reason for the update (audit trail)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

// ----------------------------------------------------------------
// Quality Inspection DTOs
// ----------------------------------------------------------------

export class CreateQualityInspectionDto {
  @ApiProperty({ description: 'Parent quality plan UUID' })
  @IsUUID()
  qualityPlanId!: string;

  @ApiProperty({ description: 'Inspection type', example: 'material_receiving' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  inspectionType!: string;

  @ApiPropertyOptional({ description: 'Inspection location / point' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({
    description: 'ISO 8601 scheduled date-time',
    example: '2026-06-01T09:00:00Z',
  })
  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;

  @ApiPropertyOptional({ description: 'Inspector user UUID' })
  @IsOptional()
  @IsUUID()
  inspectorId?: string;

  @ApiPropertyOptional({ description: 'Remarks / notes' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remarks?: string;

  @ApiPropertyOptional({ description: 'Reason for creation (audit trail)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class UpdateQualityInspectionDto {
  @ApiPropertyOptional({ description: 'Inspection type' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  inspectionType?: string;

  @ApiPropertyOptional({ description: 'Inspection location' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({ description: 'ISO 8601 scheduled date-time' })
  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;

  @ApiPropertyOptional({ description: 'Inspector user UUID' })
  @IsOptional()
  @IsUUID()
  inspectorId?: string;

  @ApiPropertyOptional({ description: 'Remarks / notes' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remarks?: string;

  @ApiPropertyOptional({ description: 'Reason for the update (audit trail)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class RecordInspectionResultDto {
  @ApiProperty({ enum: InspectionResultEnum, description: 'Inspection result' })
  @IsEnum(InspectionResultEnum)
  result!: InspectionResultEnum;

  @ApiPropertyOptional({ description: 'Inspector user UUID (override)' })
  @IsOptional()
  @IsUUID()
  inspectorId?: string;

  @ApiPropertyOptional({ description: 'Remarks / findings' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remarks?: string;

  @ApiPropertyOptional({ description: 'Object storage path to inspection report file' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  filePath?: string;

  @ApiPropertyOptional({ description: 'Reason (audit trail)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

// ----------------------------------------------------------------
// Nonconformity DTOs
// ----------------------------------------------------------------

export class CreateNonconformityDto {
  @ApiPropertyOptional({ description: 'Related quality plan UUID' })
  @IsOptional()
  @IsUUID()
  qualityPlanId?: string;

  @ApiPropertyOptional({ description: 'Related project UUID' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiProperty({ description: 'Nonconformity title', example: 'Steel rebar diameter out of spec' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @ApiProperty({ description: 'Detailed description of the nonconformity' })
  @IsString()
  @MinLength(1)
  description!: string;

  @ApiPropertyOptional({ enum: SeverityEnum, description: 'Severity level', default: 'MEDIUM' })
  @IsOptional()
  @IsEnum(SeverityEnum)
  severity?: SeverityEnum;

  @ApiPropertyOptional({ description: 'Reason for creation (audit trail)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class UpdateNonconformityDto {
  @ApiPropertyOptional({ description: 'Updated title' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: 'Updated description' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string;

  @ApiPropertyOptional({ enum: SeverityEnum, description: 'Updated severity' })
  @IsOptional()
  @IsEnum(SeverityEnum)
  severity?: SeverityEnum;

  @ApiPropertyOptional({ enum: CorrectiveActionStatusEnum, description: 'Updated status' })
  @IsOptional()
  @IsEnum(CorrectiveActionStatusEnum)
  status?: CorrectiveActionStatusEnum;

  @ApiPropertyOptional({ description: 'Linked corrective action ID' })
  @IsOptional()
  @IsString()
  caId?: string;

  @ApiPropertyOptional({ description: 'Reason for the update (audit trail)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
