import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsString } from 'class-validator';

export interface UserEntity {
  id: string;
  email: string;
  password_hash: string;
  tenant_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  tenant_id: string;
  roles: string[];
  permissions: string[];
}

export interface JwtTokenPayload {
  sub: string;
  email: string;
  tenant_id: string;
  type: 'access' | 'refresh';
}

export class LoginDto {
  @IsEmail({}, { message: 'A valid email address is required' })
  @IsNotEmpty({ message: 'Email cannot be empty' })
  email!: string;

  @IsNotEmpty({ message: 'Password cannot be empty' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password!: string;
}

export class RefreshTokenDto {
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // 900 seconds (15 minutes)
  tokenType: string;
}

export interface AuthResponseDto {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    tenant_id: string;
    roles: string[];
    permissions: string[];
  };
}
