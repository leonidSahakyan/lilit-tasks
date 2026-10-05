// update-user.dto.ts
export class UpdateUserDto {
  fullName?: string
  role?: 'admin' | 'user'
  available?: boolean
  password?: string
}
