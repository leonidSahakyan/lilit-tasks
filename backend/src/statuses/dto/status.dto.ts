import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateStatusDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  initiatorSocketId?: string;
}

export class UpdateStatusDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  initiatorSocketId?: string;
}

export class SaveColumnOrderDto {
  @IsArray()
  order!: number[];

  @IsOptional()
  @IsString()
  initiatorSocketId?: string;
}