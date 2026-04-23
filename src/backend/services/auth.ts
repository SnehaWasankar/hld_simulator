import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt';

const users: any[] = []; // temporary (DB later)

export const authService = {
  async register(data: any) {
    const { email, password } = data;

    if (!email || !password) {
      throw new Error('Email and password required');
    }

    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: Date.now().toString(),
      email,
      password: hashedPassword,
    };

    users.push(newUser);

    return {
      message: 'User registered',
      user: { id: newUser.id, email: newUser.email },
    };
  },

  async login(data: any) {
    const { email, password } = data;

    const user = users.find((u) => u.email === email);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    return {
      message: 'Login successful',
      user: { id: user.id, email: user.email },
      token,
    };
  },
};