import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userRepository } from '../user-repository';
import { mockPrismaInstance } from '../../../../test/setupTests';
import type { User } from '@prisma/client';
import { Provider, UserStatus } from '$lib/models/user';
import type { UserViewModel, UserDetailViewModel, UserAuthViewModel } from '$lib/models/user';

// Mock the hashPassword function
vi.mock('$lib/server/auth/password', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed_password_123')
}));

describe('User Repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper function to generate a test user
  function getValidUser(): User {
    return {
      id: '11111111-1111-1111-1111-111111111111',
      provider: Provider.EMAIL,
      providerId: 'local',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      image: 'https://example.com/avatar.jpg',
      passwordHash: 'hashed_password_123',
      status: UserStatus.ACTIVE,
      emailVerified: true,
      isAdmin: false,
      stripeCustomerId: 'cus_123456789',
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Helper function to generate a test UserViewModel
  function getValidUserViewModel(): UserViewModel {
    const user = getValidUser();
    return {
      id: user.id,
      provider: user.provider as Provider,
      providerId: user.providerId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      image: user.image,
      isAdmin: user.isAdmin,
      emailVerified: user.emailVerified,
      status: user.status as UserStatus
    };
  }

  // Helper function to generate a test UserDetailViewModel
  function getValidUserDetailViewModel(): UserDetailViewModel {
    const user = getValidUser();
    return {
      ...getValidUserViewModel(),
      stripeCustomerId: user.stripeCustomerId,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  describe('getUserById', () => {
    it('should return a user when found', async () => {
      // Arrange
      const testUser = getValidUser();
      const expectedViewModel = getValidUserViewModel();
      mockPrismaInstance.user.findUnique.mockResolvedValue(testUser);

      // Act
      const result = await userRepository.getUserById(testUser.id);

      // Assert
      expect(result).toEqual(expectedViewModel);
      expect(mockPrismaInstance.user.findUnique).toHaveBeenCalledWith({
        where: { id: testUser.id }
      });
    });

    it('should return null when user is not found', async () => {
      // Arrange
      mockPrismaInstance.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await userRepository.getUserById('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });

    it('should throw error when database query fails', async () => {
      // Arrange
      mockPrismaInstance.user.findUnique.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(userRepository.getUserById('some-id'))
        .rejects
        .toThrow('Failed to retrieve user');
    });
  });

  describe('getUserByEmail', () => {
    it('should return a detailed user when found', async () => {
      // Arrange
      const testUser = getValidUser();
      const expectedDetailViewModel = getValidUserDetailViewModel();
      mockPrismaInstance.user.findUnique.mockResolvedValue(testUser);

      // Act
      const result = await userRepository.getUserByEmail(testUser.email);

      // Assert
      expect(result).toEqual(expectedDetailViewModel);
      expect(mockPrismaInstance.user.findUnique).toHaveBeenCalledWith({
        where: { email: testUser.email }
      });
    });

    it('should return null when user is not found', async () => {
      // Arrange
      mockPrismaInstance.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await userRepository.getUserByEmail('nonexistent@example.com');

      // Assert
      expect(result).toBeNull();
    });

    it('should throw error when database query fails', async () => {
      // Arrange
      mockPrismaInstance.user.findUnique.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(userRepository.getUserByEmail('test@example.com'))
        .rejects
        .toThrow('Failed to retrieve user');
    });
  });

  describe('isEmailTaken', () => {
    it('should return true when email is taken', async () => {
      // Arrange
      mockPrismaInstance.user.findUnique.mockResolvedValue({ id: '11111111-1111-1111-1111-111111111111' });

      // Act
      const result = await userRepository.isEmailTaken('taken@example.com');

      // Assert
      expect(result).toBe(true);
      expect(mockPrismaInstance.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'taken@example.com' },
        select: { id: true }
      });
    });

    it('should return false when email is not taken', async () => {
      // Arrange
      mockPrismaInstance.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await userRepository.isEmailTaken('available@example.com');

      // Assert
      expect(result).toBe(false);
    });

    it('should throw error when database query fails', async () => {
      // Arrange
      mockPrismaInstance.user.findUnique.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(userRepository.isEmailTaken('test@example.com'))
        .rejects
        .toThrow('Failed to check if email is taken');
    });
  });

  describe('getUserByProviderAndProviderId', () => {
    it('should return a detailed user when found', async () => {
      // Arrange
      const testUser = getValidUser();
      const expectedDetailViewModel = getValidUserDetailViewModel();
      mockPrismaInstance.user.findFirst.mockResolvedValue(testUser);

      // Act
      const result = await userRepository.getUserByProviderAndProviderId(
        Provider.GOOGLE,
        'google-id-123'
      );

      // Assert
      expect(result).toEqual(expectedDetailViewModel);
      expect(mockPrismaInstance.user.findFirst).toHaveBeenCalledWith({
        where: {
          provider: Provider.GOOGLE,
          providerId: 'google-id-123'
        }
      });
    });

    it('should return null when user is not found', async () => {
      // Arrange
      mockPrismaInstance.user.findFirst.mockResolvedValue(null);

      // Act
      const result = await userRepository.getUserByProviderAndProviderId(
        Provider.GITHUB,
        'non-existent-id'
      );

      // Assert
      expect(result).toBeNull();
    });

    it('should throw error when database query fails', async () => {
      // Arrange
      mockPrismaInstance.user.findFirst.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(userRepository.getUserByProviderAndProviderId(Provider.FACEBOOK, 'some-id'))
        .rejects
        .toThrow('Failed to retrieve user');
    });
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      // Arrange
      const newUserData: UserAuthViewModel = {
        id: '22222222-2222-2222-2222-222222222222',
        provider: Provider.EMAIL,
        providerId: 'local',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        image: 'https://example.com/new-avatar.jpg',
        passwordHash: 'hashed_password_456',
        isAdmin: false,
        emailVerified: false,
        status: UserStatus.ACTIVE
      };

      const createdUser = {
        ...newUserData,
        stripeCustomerId: null,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create an expected detail view model based on the created user
      const expectedDetailViewModel: UserDetailViewModel = {
        id: createdUser.id,
        provider: createdUser.provider,
        providerId: createdUser.providerId,
        email: createdUser.email,
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
        image: createdUser.image,
        isAdmin: createdUser.isAdmin,
        emailVerified: createdUser.emailVerified,
        status: createdUser.status,
        stripeCustomerId: createdUser.stripeCustomerId,
        lastLoginAt: createdUser.lastLoginAt,
        createdAt: createdUser.createdAt,
        updatedAt: createdUser.updatedAt
      };

      mockPrismaInstance.user.create.mockResolvedValue(createdUser);

      // Act
      const result = await userRepository.createUser(newUserData);

      // Assert
      expect(result).toEqual(expectedDetailViewModel);
      expect(mockPrismaInstance.user.create).toHaveBeenCalledWith({
        data: {
          id: newUserData.id,
          provider: newUserData.provider,
          providerId: newUserData.providerId,
          email: newUserData.email,
          firstName: newUserData.firstName,
          lastName: newUserData.lastName,
          image: newUserData.image,
          passwordHash: newUserData.passwordHash,
          emailVerified: newUserData.emailVerified,
          isAdmin: false,
          lastLoginAt: expect.any(Date),
          status: 'active'
        }
      });
    });

    it('should throw error when user creation fails', async () => {
      // Arrange
      const newUserData: UserAuthViewModel = {
        id: '22222222-2222-2222-2222-222222222222',
        provider: Provider.EMAIL,
        providerId: 'local',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        image: null,
        passwordHash: 'hashed_password_456',
        isAdmin: false,
        emailVerified: false,
        status: UserStatus.ACTIVE
      };

      mockPrismaInstance.user.create.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(userRepository.createUser(newUserData))
        .rejects
        .toThrow('Failed to create user');
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      // Arrange
      const userId = '11111111-1111-1111-1111-111111111111';
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        image: 'https://example.com/updated-avatar.jpg'
      };

      const updatedUser = {
        ...getValidUser(),
        ...updateData,
        updatedAt: new Date()
      };

      // Create an expected detail view model based on the updated user
      const expectedDetailViewModel: UserDetailViewModel = {
        id: updatedUser.id,
        provider: updatedUser.provider as Provider,
        providerId: updatedUser.providerId,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        image: updatedUser.image,
        isAdmin: updatedUser.isAdmin,
        emailVerified: updatedUser.emailVerified,
        status: updatedUser.status as UserStatus,
        stripeCustomerId: updatedUser.stripeCustomerId,
        lastLoginAt: updatedUser.lastLoginAt,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      };

      mockPrismaInstance.user.update.mockResolvedValue(updatedUser);

      // Act
      const result = await userRepository.updateUser(userId, updateData);

      // Assert
      expect(result).toEqual(expectedDetailViewModel);
      expect(mockPrismaInstance.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          ...updateData,
          updatedAt: expect.any(Date)
        }
      });
    });

    it('should throw error when user update fails', async () => {
      // Arrange
      const userId = '11111111-1111-1111-1111-111111111111';
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      mockPrismaInstance.user.update.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(userRepository.updateUser(userId, updateData))
        .rejects
        .toThrow('Failed to update user');
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp successfully', async () => {
      // Arrange
      const userId = '11111111-1111-1111-1111-111111111111';
      mockPrismaInstance.user.update.mockResolvedValue({});

      // Act
      await userRepository.updateLastLogin(userId);

      // Assert
      expect(mockPrismaInstance.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { lastLoginAt: expect.any(Date) }
      });
    });

    it('should throw error when update fails', async () => {
      // Arrange
      const userId = '11111111-1111-1111-1111-111111111111';
      mockPrismaInstance.user.update.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(userRepository.updateLastLogin(userId))
        .rejects
        .toThrow('Failed to update last login timestamp');
    });
  });

  describe('getPasswordHash', () => {
    it('should return password hash when found', async () => {
      // Arrange
      const userId = '11111111-1111-1111-1111-111111111111';
      const passwordHash = 'hashed_password_123';
      mockPrismaInstance.user.findUnique.mockResolvedValue({ passwordHash });

      // Act
      const result = await userRepository.getPasswordHash(userId);

      // Assert
      expect(result).toBe(passwordHash);
      expect(mockPrismaInstance.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: { passwordHash: true }
      });
    });

    it('should return null when user is not found', async () => {
      // Arrange
      const userId = '11111111-1111-1111-1111-111111111111';
      mockPrismaInstance.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await userRepository.getPasswordHash(userId);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when password hash is null', async () => {
      // Arrange
      const userId = '11111111-1111-1111-1111-111111111111';
      mockPrismaInstance.user.findUnique.mockResolvedValue({ passwordHash: null });

      // Act
      const result = await userRepository.getPasswordHash(userId);

      // Assert
      expect(result).toBeNull();
    });

    it('should throw error when database query fails', async () => {
      // Arrange
      const userId = '11111111-1111-1111-1111-111111111111';
      mockPrismaInstance.user.findUnique.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(userRepository.getPasswordHash(userId))
        .rejects
        .toThrow('Failed to retrieve password hash');
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      // Arrange
      const userId = '11111111-1111-1111-1111-111111111111';
      const newPassword = 'new_password';
      const hashedPassword = 'hashed_password_123';

      // The hashPassword mock is set up at the top of the file
      mockPrismaInstance.user.update.mockResolvedValue({});

      // Act
      await userRepository.updatePassword(userId, newPassword);

      // Assert
      expect(mockPrismaInstance.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          passwordHash: hashedPassword,
          updatedAt: expect.any(Date)
        }
      });
    });

    it('should throw error when update fails', async () => {
      // Arrange
      const userId = '11111111-1111-1111-1111-111111111111';
      const newPassword = 'new_password';
      mockPrismaInstance.user.update.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(userRepository.updatePassword(userId, newPassword))
        .rejects
        .toThrow('Failed to update password');
    });
  });

  describe('updateEmailAndSetVerified', () => {
    it('should update email and set verified successfully', async () => {
      // Arrange
      const userId = '11111111-1111-1111-1111-111111111111';
      const newEmail = 'updated@example.com';
      mockPrismaInstance.user.update.mockResolvedValue({});

      // Act
      await userRepository.updateEmailAndSetVerified(userId, newEmail);

      // Assert
      expect(mockPrismaInstance.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          email: newEmail,
          emailVerified: true,
          updatedAt: expect.any(Date)
        }
      });
    });

    it('should throw error when update fails', async () => {
      // Arrange
      const userId = '11111111-1111-1111-1111-111111111111';
      const newEmail = 'updated@example.com';
      mockPrismaInstance.user.update.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(userRepository.updateEmailAndSetVerified(userId, newEmail))
        .rejects
        .toThrow('Failed to update email');
    });
  });
});
