import type {
  AuthLoginRequestDto,
  AuthLogoutRequestDto,
  AuthLogoutResponseDto,
  AuthRegisterRequestDto,
  AuthRefreshRequestDto,
  AuthSessionDto,
  AuthUserProfileDto,
} from './auth.dto.js';
import type { AuthService } from './auth.service.js';
import type { AuthPrincipal, AuthUserRole } from './auth.types.js';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async register(request: AuthRegisterRequestDto): Promise<AuthSessionDto> {
    return this.authService.register(request);
  }

  async login(request: AuthLoginRequestDto): Promise<AuthSessionDto> {
    return this.authService.login(request);
  }

  async me(userId: string): Promise<AuthUserProfileDto | null> {
    return this.authService.me(userId);
  }

  async refresh(request: AuthRefreshRequestDto): Promise<AuthSessionDto> {
    return this.authService.refresh(request);
  }

  async logout(request: AuthLogoutRequestDto): Promise<AuthLogoutResponseDto> {
    return this.authService.logout(request);
  }

  async assertRole(userId: string, requiredRole: AuthUserRole): Promise<void> {
    return this.authService.assertRole(userId, requiredRole);
  }

  async resolvePrincipalFromToken(token: string): Promise<AuthPrincipal | null> {
    return this.authService.resolvePrincipalFromToken(token);
  }
}
