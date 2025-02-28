/**
 * User Management System
 * 
 * Handles user registration, profile management, and role-based access control.
 */

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCredentials {
  passwordHash: string;
  passwordSalt: string;
  lastPasswordChange: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  failedLoginAttempts: number;
  lockedUntil?: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  twoFactorEnabled: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface UserRole {
  userId: string;
  roleId: string;
  assignedAt: Date;
  assignedBy: string;
}

export interface CreateUserOptions {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
}

export interface UpdateUserOptions {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
}

export interface UserSearchOptions {
  query?: string;
  role?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'username' | 'email' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface UserSearchResult {
  users: UserProfile[];
  total: number;
  limit: number;
  offset: number;
}

export class UserManagementService {
  private users: Map<string, UserProfile> = new Map();
  private credentials: Map<string, UserCredentials> = new Map();
  private preferences: Map<string, UserPreferences> = new Map();
  private roles: Map<string, Role> = new Map();
  private userRoles: UserRole[] = [];
  
  constructor() {
    // Initialize with default roles
    this.roles.set('admin', {
      id: 'admin',
      name: 'Administrator',
      description: 'Full system access',
      permissions: ['*']
    });
    
    this.roles.set('user', {
      id: 'user',
      name: 'User',
      description: 'Standard user access',
      permissions: ['read:own', 'write:own']
    });
    
    this.roles.set('guest', {
      id: 'guest',
      name: 'Guest',
      description: 'Limited read-only access',
      permissions: ['read:public']
    });
  }
  
  /**
   * Create a new user
   */
  async createUser(options: CreateUserOptions): Promise<UserProfile> {
    // Check if username or email already exists
    if (Array.from(this.users.values()).some(u => u.username === options.username)) {
      throw new Error(`Username ${options.username} is already taken`);
    }
    
    if (Array.from(this.users.values()).some(u => u.email === options.email)) {
      throw new Error(`Email ${options.email} is already registered`);
    }
    
    // Generate user ID
    const userId = Math.random().toString(36).substring(2, 15);
    
    // Create user profile
    const now = new Date();
    const user: UserProfile = {
      id: userId,
      username: options.username,
      email: options.email,
      firstName: options.firstName,
      lastName: options.lastName,
      createdAt: now,
      updatedAt: now
    };
    
    // In a real implementation, we would hash the password
    const passwordSalt = Math.random().toString(36).substring(2, 15);
    const passwordHash = `hash_of_${options.password}_with_salt_${passwordSalt}`;
    
    // Create user credentials
    const credentials: UserCredentials = {
      passwordHash,
      passwordSalt,
      lastPasswordChange: now,
      failedLoginAttempts: 0
    };
    
    // Create user preferences with defaults
    const preferences: UserPreferences = {
      theme: 'system',
      language: 'en',
      timezone: 'UTC',
      emailNotifications: true,
      pushNotifications: false,
      twoFactorEnabled: false
    };
    
    // Save user data
    this.users.set(userId, user);
    this.credentials.set(userId, credentials);
    this.preferences.set(userId, preferences);
    
    // Assign roles
    const rolesToAssign = options.roles?.length ? options.roles : ['user'];
    for (const roleId of rolesToAssign) {
      if (!this.roles.has(roleId)) {
        console.warn(`Role ${roleId} does not exist, skipping`);
        continue;
      }
      
      this.userRoles.push({
        userId,
        roleId,
        assignedAt: now,
        assignedBy: 'system'
      });
    }
    
    return user;
  }
  
  /**
   * Get a user by ID
   */
  async getUserById(userId: string): Promise<UserProfile | null> {
    return this.users.get(userId) || null;
  }
  
  /**
   * Get a user by username
   */
  async getUserByUsername(username: string): Promise<UserProfile | null> {
    return Array.from(this.users.values()).find(u => u.username === username) || null;
  }
  
  /**
   * Get a user by email
   */
  async getUserByEmail(email: string): Promise<UserProfile | null> {
    return Array.from(this.users.values()).find(u => u.email === email) || null;
  }
  
  /**
   * Update a user's profile
   */
  async updateUser(userId: string, options: UpdateUserOptions): Promise<UserProfile | null> {
    const user = this.users.get(userId);
    if (!user) {
      return null;
    }
    
    const updatedUser: UserProfile = {
      ...user,
      ...options,
      updatedAt: new Date()
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  /**
   * Delete a user
   */
  async deleteUser(userId: string): Promise<boolean> {
    if (!this.users.has(userId)) {
      return false;
    }
    
    this.users.delete(userId);
    this.credentials.delete(userId);
    this.preferences.delete(userId);
    this.userRoles = this.userRoles.filter(ur => ur.userId !== userId);
    
    return true;
  }
  
  /**
   * Search for users
   */
  async searchUsers(options: UserSearchOptions): Promise<UserSearchResult> {
    let users = Array.from(this.users.values());
    
    // Filter by query
    if (options.query) {
      const query = options.query.toLowerCase();
      users = users.filter(u => 
        u.username.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.firstName?.toLowerCase().includes(query) ||
        u.lastName?.toLowerCase().includes(query)
      );
    }
    
    // Filter by role
    if (options.role) {
      const userIdsWithRole = this.userRoles
        .filter(ur => ur.roleId === options.role)
        .map(ur => ur.userId);
      
      users = users.filter(u => userIdsWithRole.includes(u.id));
    }
    
    // Sort users
    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder || 'desc';
    
    users.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (aValue < bValue) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    // Pagination
    const limit = options.limit || 10;
    const offset = options.offset || 0;
    const paginatedUsers = users.slice(offset, offset + limit);
    
    return {
      users: paginatedUsers,
      total: users.length,
      limit,
      offset
    };
  }
  
  /**
   * Get user roles
   */
  async getUserRoles(userId: string): Promise<Role[]> {
    const roleIds = this.userRoles
      .filter(ur => ur.userId === userId)
      .map(ur => ur.roleId);
    
    return roleIds
      .map(id => this.roles.get(id))
      .filter((role): role is Role => !!role);
  }
  
  /**
   * Check if a user has a specific permission
   */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const roles = await this.getUserRoles(userId);
    
    for (const role of roles) {
      // Check for wildcard permission
      if (role.permissions.includes('*')) {
        return true;
      }
      
      // Check for exact permission
      if (role.permissions.includes(permission)) {
        return true;
      }
      
      // Check for category permission (e.g. 'read:*')
      const category = permission.split(':')[0];
      if (role.permissions.includes(`${category}:*`)) {
        return true;
      }
    }
    
    return false;
  }
}
