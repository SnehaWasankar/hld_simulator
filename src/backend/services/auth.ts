import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt';
import { prisma } from '../utils/db';

const users: any[] = []; // temporary (DB later)

export const authService = {
  async register(data: any) {
    const { email, password } = data;

    if (!email || !password) {
      throw new Error('Email and password required');
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    return {
      message: 'User registered',
      user: { id: newUser.id, email: newUser.email },
    };
  },

  async login(data: any) {
    const { email, password } = data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

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
  }
};