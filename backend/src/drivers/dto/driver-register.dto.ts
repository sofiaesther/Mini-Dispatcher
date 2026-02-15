import { IsEmail, IsNumber, IsString, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class DriverCarDto {
  @IsString()
  @MinLength(1, { message: 'car model is required' })
  model!: string;

  @IsString()
  @MinLength(1, { message: 'car plate is required' })
  plate!: string;

  @IsNumber()
  year!: number;

  @IsString()
  @MinLength(1, { message: 'car color is required' })
  color!: string;
}

export class DriverRegisterDto {
  @IsString()
  @MinLength(1, { message: 'name is required' })
  name!: string;

  @IsString()
  @MinLength(1, { message: 'password is required' })
  password!: string;

  @IsString()
  @MinLength(1, { message: 'phone is required' })
  phone!: string;

  @IsEmail({}, { message: 'email must be valid' })
  email!: string;

  @IsString()
  @MinLength(1, { message: 'city is required' })
  city!: string;

  @ValidateNested()
  @Type(() => DriverCarDto)
  car!: DriverCarDto;
}
