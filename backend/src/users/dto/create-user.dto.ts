import { IsString, IsNotEmpty, IsIn } from 'class-validator'

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username!: string

  @IsString()
  @IsNotEmpty()
  fullName!: string

  @IsString()
  @IsIn(['admin', 'user'])
  role!: 'admin' | 'user'

  @IsString()
  @IsNotEmpty()
  password!: string
}
