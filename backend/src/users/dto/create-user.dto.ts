import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator'

import {
  user_role,
  user_state,
} from '@prisma/client'

export class CreateUserDto {
  @IsString()
  @Length(2,80)
  name!: string

  @IsString()
  @Length(2,80)
  last_name!: string

  @IsEmail()
  email!: string

  @IsEnum(user_role)
  role!: user_role

  @IsEnum(user_state)
  state!: user_state

  @IsUUID()
  @IsOptional()
  area_id?: string
}