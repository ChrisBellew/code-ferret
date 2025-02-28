/**
 * Authentication Service
 * 
 * Handles user authentication, token generation, and verification.
 */
export interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
}

export interface AuthToken {
  token: string;
  expiresAt: Date;
}

export class AuthService {
  private users: Map<string, User> = new Map();
  private tokens: Map<string, { userId: string; expiresAt: Date }> = new Map();
  
  /**
   * Authenticate a user with username and password
   */
  async login(username: string, password: string): Promise<AuthToken | null> {
    // In a real implementation, this would check against a database
    // and use proper password hashing
    const user = Array.from(this.users.values()).find(u => u.username === username);
    
    if (!user) {
      console.log(`Login failed: User ${username} not found`);
      return null;
    }
    
    // Generate a token (in a real app, use JWT or similar)
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    this.tokens.set(token, { userId: user.id, expiresAt });
    
    return {
      token,
      expiresAt
    };
  }
  
  /**
   * Register a new user
   */
  async register(username: string, email: string, password: string): Promise<User> {
    // Check if user already exists
    if (Array.from(this.users.values()).some(u => u.username === username || u.email === email)) {
      throw new Error('User already exists');
    }
    
    // Create new user
    const userId = Math.random().toString(36).substring(2, 15);
    const user: User = {
      id: userId,
      username,
      email,
      roles: ['user']
    };
    
    this.users.set(userId, user);
    return user;
  }
  
  /**
   * Verify a token and get the associated user
   */
  async verifyToken(token: string): Promise<User | null> {
    const tokenData = this.tokens.get(token);
    
    if (!tokenData) {
      return null;
    }
    
    // Check if token is expired
    if (tokenData.expiresAt < new Date()) {
      this.tokens.delete(token);
      return null;
    }
    
    return this.users.get(tokenData.userId) || null;
  }
  
  /**
   * Logout a user by invalidating their token
   */
  async logout(token: string): Promise<boolean> {
    return this.tokens.delete(token);
  }
  
  /**
   * Generate a random token
   */
  private generateToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}
