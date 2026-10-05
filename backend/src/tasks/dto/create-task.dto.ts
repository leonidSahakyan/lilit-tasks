import { IsString, IsOptional, IsInt, IsDate } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateTaskDto {
  @IsString()
  title!: string

  @IsInt()
  statusId!: number

  @IsInt()
  @IsOptional()
  assignedUserId?: number

  @IsString()
  @IsOptional()
  description?: string

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  dueDate?: Date | null

  @IsOptional()
  @IsString()
  initiatorSocketId?: string;
}
