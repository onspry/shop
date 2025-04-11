import { PrismaClient, UserStatus, Provider, type User } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import type { UserViewModel, UserDetailViewModel } from '../models/user'; // Corrected import path

// Helper functions to map between Prisma models and view models
function mapToUserViewModel(user: User): UserViewModel {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    image: user.image,
    isAdmin: user.isAdmin,
    emailVerified: user.emailVerified,
    status: user.status
  };
}

function mapToUserDetailViewModel(user: User): UserDetailViewModel {
  return {
    ...mapToUserViewModel(user),
    provider: user.provider,
    providerId: user.providerId,
    stripeCustomerId: user.stripeCustomerId,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

const prisma = new PrismaClient();

// Repository functions
export async function getUserById(id: string): Promise<UserViewModel | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) return null;

    return mapToUserViewModel(user);
  } catch (error) {
    console.error('Failed to get user by ID:', error);
    throw new Error('Failed to retrieve user');
  }
}

export async function getUserByEmail(email: string): Promise<UserViewModel | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) return null;

    return mapToUserViewModel(user);
  } catch (error) {
    console.error('Failed to get user by email:', error);
    throw new Error('Failed to retrieve user');
  }
}

export async function getUserByProviderAndProviderId(
  provider: Provider,
  providerId: string
): Promise<UserDetailViewModel | null> {
  try {
    const user = await prisma.user.findFirst({
      where: {
        provider,
        providerId
      }
    });

    if (!user) return null;

    return mapToUserDetailViewModel(user);
  } catch (error) {
    console.error('Failed to get user by provider and provider ID:', error);
    throw new Error('Failed to retrieve user');
  }
}

export async function createUser(
  provider: Provider,
  providerId: string,
  email: string,
  firstName: string,
  lastName: string,
  image?: string,
  passwordHash?: string
): Promise<UserDetailViewModel> {
  try {
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        provider,
        providerId,
        email,
        firstName,
        lastName,
        image,
        passwordHash,
        lastLoginAt: new Date()
      }
    });

    return mapToUserDetailViewModel(user);
  } catch (error) {
    console.error('Failed to create user:', error);
    throw new Error('Failed to create user');
  }
}

export async function updateUser(
  id: string,
  data: {
    email?: string;
    firstName?: string;
    lastName?: string;
    image?: string;
    status?: UserStatus;  // Use literal union type matching UserStatus enum
    emailVerified?: boolean;
    isAdmin?: boolean;
    stripeCustomerId?: string;
    passwordHash?: string;
  }
): Promise<UserDetailViewModel> {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });

    return mapToUserDetailViewModel(user);
  } catch (error) {
    console.error('Failed to update user:', error);
    throw new Error('Failed to update user');
  }
}

export async function updateLastLogin(id: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to update last login:', error);
    throw new Error('Failed to update last login time');
  }
}


