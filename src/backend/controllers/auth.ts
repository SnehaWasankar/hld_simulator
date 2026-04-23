import { authService } from '../services/auth';

export async function login(data: any) {
    try {
        const result = await authService.login(data);
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
        const result = await authService.register(data);
        return Response.json(result);
    } catch (error: any) {
        return Response.json(
            { error: error.message || 'Register failed' },
            { status: 400 }
        );
    }
}