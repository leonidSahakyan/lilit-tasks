import { IsOptional, IsArray, IsString, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class FindTasksDto {
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value.map(Number);
    return [Number(value)];
  })
  assignedUserIds?: number[];

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === '1' || value === 1 || value === true) return true;
    if (value === '0' || value === 0 || value === false) return false;
    return value;
  })
  completed?: boolean;

  @IsOptional()
  @IsString()
  dueDate?: 'none' | 'overdue' | 'nextDay' | 'nextWeek' | 'nextMonth';

  @IsOptional()
  @IsString()
  activity?: 'lastWeek' | 'lastTwoWeeks' | 'lastFourWeeks' | 'noActivity';

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
