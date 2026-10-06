import { IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @Length(1, 20000)
  body!: string;

  @IsOptional()
  @IsIn(['comment', 'question', 'answer', 'report'])
  kind?: string;

  @IsOptional()
  @IsIn(['board', 'agent', 'telegram', 'chat'])
  source?: string;
}

export class AddCommitDto {
  // "Lilit", "lilit-tasks", or "owner/repo".
  @IsString()
  @Matches(/^[\w.-]+(\/[\w.-]+)?$/)
  repo!: string;

  @IsString()
  @Matches(/^[0-9a-f]{7,40}$/i)
  sha!: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  message?: string;
}

export class ReopenDto {
  @IsOptional()
  @IsString()
  @Length(0, 20000)
  comment?: string;
}
