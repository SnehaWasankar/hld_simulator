import { authService } from '../services/auth';
import { loginSchema, registerSchema } from '../validator/auth';

export async function login(data: any) {
  try {
    const parsed = loginSchema.parse(data);

    const result = await authService.login(parsed);
    return Response.json(result);
  } catch (error: any) {
    return Response.json(
      { error: error.message || 'Login failed' },
      { status: 400 }
    );
  }
}

export async function register(data: any) {
  try {
    const parsed = registerSchema.parse(data);

    const result = await authService.register(parsed);
    return Response.json(result);
  } catch (error: any) {
    return Response.json(
      { error: error.message || 'Register failed' },
      { status: 400 }
    );
  }
}