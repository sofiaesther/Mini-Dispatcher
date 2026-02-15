import { IsEmail, IsString, MinLength } from 'class-validator';

export class DriverAuthDto {
  @IsEmail({}, { message: 'email must be valid' })
  email!: string;

  @IsString()
  @MinLength(1, { message: 'password is required' })
  password!: string;
}
