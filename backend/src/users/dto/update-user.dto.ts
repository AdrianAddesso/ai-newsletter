import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

import { user_role, user_state } from '@prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(2, 80)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(2, 80)
  last_name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(user_role)
  role?: user_role;

  @IsOptional()
  @IsEnum(user_state)
  state?: user_state;

  @IsOptional()
  @IsUUID()
  area_id?: string;
}
