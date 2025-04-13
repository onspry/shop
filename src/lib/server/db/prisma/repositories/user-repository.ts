import { PrismaClient, UserStatus, Provider, type User } from '@prisma/client';
import type { UserViewModel, UserDetailViewModel, UserAuthViewModel } from '../models/user';
import { hashPassword } from '$lib/server/auth/password';

// Helper functions to map between Prisma models and view models
function mapToUserViewModel(user: User): UserViewModel {
  return {
    id: user.id,
    provider: user.provider.toString(), // Convert enum to string for the view model
    providerId: user.providerId,
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
    stripeCustomerId: user.stripeCustomerId,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

const prisma = new PrismaClient();

export const userRepository = {
  async getUserById(id: string): Promise<UserViewModel | null> {
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
  },

  async getUserByEmail(email: string): Promise<UserDetailViewModel | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) return null;

      return mapToUserDetailViewModel(user);
    } catch (error) {
      console.error('Failed to get user by email:', error);
      throw new Error('Failed to retrieve user');
    }
  },

  /**
   * Checks if an email is already taken
   * @param email - The email to check
   * @returns True if the email is taken, false otherwise
   */
  async isEmailTaken(email: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true }
      });
      return !!user;
    } catch (error) {
      console.error('Failed to check if email is taken:', error);
      throw new Error('Failed to check if email is taken');
    }
  },

  /**
   * Gets a user by provider and provider ID
   * @param provider - The authentication provider
   * @param providerId - The provider-specific ID
   * @returns The user or null if not found
   */
  async getUserByProviderAndProviderId(
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
  },

  async createUser(newUser: UserAuthViewModel): Promise<UserDetailViewModel> {
    try {
      const user = await prisma.user.create({
        data: {
          id: newUser.id,
          provider: newUser.provider as Provider,
          providerId: newUser.providerId,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          image: newUser.image,
          passwordHash: newUser.passwordHash,
          emailVerified: newUser.emailVerified,
          isAdmin: false,
          lastLoginAt: new Date(),
          status: 'active' as UserStatus // Set initial status to active
        }
      });

      return mapToUserDetailViewModel(user);
    } catch (error) {
      console.error('Failed to create user:', error);
      throw new Error('Failed to create user');
    }
  },

  async updateUser(
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
  },

  async updateLastLogin(userId: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { lastLoginAt: new Date() }
      });
    } catch (error) {
      console.error('Failed to update last login:', error);
      throw new Error('Failed to update last login timestamp');
    }
  },

  /**
   * Gets the password hash for a user
   * @param id - The user ID
   * @returns The password hash or null if not found
   */
  async getPasswordHash(id: string): Promise<string | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: { passwordHash: true }
      });
      return user?.passwordHash || null;
    } catch (error) {
      console.error('Failed to get password hash:', error);
      throw new Error('Failed to retrieve password hash');
    }
  },

  /**
   * Updates a user's password
   * @param id - The user ID
   * @param newPassword - The new password (plain text, will be hashed)
   */
  async updatePassword(id: string, newPassword: string): Promise<void> {
    try {
      const passwordHash = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id },
        data: {
          passwordHash,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to update password:', error);
      throw new Error('Failed to update password');
    }
  },

  /**
   * Updates a user's email and sets it as verified
   * @param id - The user ID
   * @param email - The new email address
   */
  async updateEmailAndSetVerified(id: string, email: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id },
        data: {
          email,
          emailVerified: true,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to update email:', error);
      throw new Error('Failed to update email');
    }
  }
}
