import {
  IsString,
  IsOptional,
  IsInt,
  IsDate,
} from 'class-validator'
import { Transform } from 'class-transformer'

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  title?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value + 'T00:00:00Z') : undefined))
  dueDate?: Date

  @IsInt()
  @IsOptional()
  assignedUserId?: number

  @IsInt()
  @IsOptional()
  statusId?: number

  @IsInt()
  @IsOptional()
  position?: number

  @IsOptional()
  @IsString()
  initiatorSocketId?: string;
}
