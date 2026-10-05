import { IsArray, ValidateNested, IsInt, IsString, IsOptional } from 'class-validator'
import { Type } from 'class-transformer'

class TaskPositionUpdate {
  @IsInt()
  id!: number

  @IsInt()
  statusId!: number

  @IsInt()
  position!: number
  
}

export class UpdateTasksPositionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskPositionUpdate)
  tasks!: TaskPositionUpdate[]

  @IsOptional()
  @IsString()
  initiatorSocketId?: string
}
