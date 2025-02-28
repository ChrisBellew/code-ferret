/**
 * Email Notification Service
 * 
 * Handles sending emails using various providers and templates.
 */

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType: string;
}

export interface EmailOptions {
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
  replyTo?: EmailAddress;
  headers?: Record<string, string>;
  templateId?: string;
  templateData?: Record<string, any>;
}

export interface EmailProviderConfig {
  apiKey?: string;
  username?: string;
  password?: string;
  host?: string;
  port?: number;
  secure?: boolean;
  region?: string;
}

export interface EmailResult {
  messageId: string;
  success: boolean;
  timestamp: Date;
  provider: string;
  error?: Error;
}

export interface EmailProvider {
  sendEmail(options: EmailOptions): Promise<EmailResult>;
  getTemplate(templateId: string): Promise<string | null>;
  createTemplate(templateId: string, content: string): Promise<boolean>;
  validateEmail(email: string): boolean;
}

export class SmtpEmailProvider implements EmailProvider {
  private config: EmailProviderConfig;
  private templates: Map<string, string> = new Map();
  
  constructor(config: EmailProviderConfig) {
    this.config = {
      host: config.host || 'smtp.example.com',
      port: config.port || 587,
      secure: config.secure ?? false,
      username: config.username,
      password: config.password
    };
  }
  
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    console.log(`Sending email via SMTP to ${options.to.map(t => t.email).join(', ')}`);
    console.log(`Subject: ${options.subject}`);
    
    // If a template is specified, use it
    if (options.templateId) {
      const template = await this.getTemplate(options.templateId);
      if (template) {
        options.html = this.renderTemplate(template, options.templateData || {});
      }
    }
    
    // In a real implementation, this would use a library like nodemailer
    
    return {
      messageId: `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
      success: true,
      timestamp: new Date(),
      provider: 'smtp'
    };
  }
  
  async getTemplate(templateId: string): Promise<string | null> {
    return this.templates.get(templateId) || null;
  }
  
  async createTemplate(templateId: string, content: string): Promise<boolean> {
    this.templates.set(templateId, content);
    return true;
  }
  
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  private renderTemplate(template: string, data: Record<string, any>): string {
    // Simple template rendering
    let result = template;
    for (const [key, value] of Object.entries(data)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return result;
  }
}

export class SendgridEmailProvider implements EmailProvider {
  private apiKey: string;
  
  constructor(config: EmailProviderConfig) {
    if (!config.apiKey) {
      throw new Error('Sendgrid API key is required');
    }
    this.apiKey = config.apiKey;
  }
  
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    console.log(`Sending email via Sendgrid to ${options.to.map(t => t.email).join(', ')}`);
    console.log(`Subject: ${options.subject}`);
    
    // In a real implementation, this would use the Sendgrid API
    
    return {
      messageId: `sg-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
      success: true,
      timestamp: new Date(),
      provider: 'sendgrid'
    };
  }
  
  async getTemplate(templateId: string): Promise<string | null> {
    console.log(`Getting Sendgrid template ${templateId}`);
    // In a real implementation, this would use the Sendgrid API
    return null;
  }
  
  async createTemplate(templateId: string, content: string): Promise<boolean> {
    console.log(`Creating Sendgrid template ${templateId}`);
    // In a real implementation, this would use the Sendgrid API
    return true;
  }
  
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export class EmailService {
  private provider: EmailProvider;
  private defaultFrom: EmailAddress;
  
  constructor(provider: EmailProvider, defaultFrom: EmailAddress) {
    this.provider = provider;
    this.defaultFrom = defaultFrom;
  }
  
  async sendEmail(options: Omit<EmailOptions, 'from'>): Promise<EmailResult> {
    const emailOptions: EmailOptions = {
      ...options,
      from: this.defaultFrom
    };
    
    // Validate email addresses
    for (const recipient of [...emailOptions.to, ...(emailOptions.cc || []), ...(emailOptions.bcc || [])]) {
      if (!this.provider.validateEmail(recipient.email)) {
        throw new Error(`Invalid email address: ${recipient.email}`);
      }
    }
    
    return this.provider.sendEmail(emailOptions);
  }
  
  async sendWelcomeEmail(to: EmailAddress, data: { name: string }): Promise<EmailResult> {
    return this.sendEmail({
      to: [to],
      subject: `Welcome, ${data.name}!`,
      templateId: 'welcome-email',
      templateData: data
    });
  }
  
  async sendPasswordResetEmail(to: EmailAddress, data: { resetLink: string }): Promise<EmailResult> {
    return this.sendEmail({
      to: [to],
      subject: 'Password Reset Request',
      templateId: 'password-reset',
      templateData: data
    });
  }
  
  async sendVerificationEmail(to: EmailAddress, data: { verificationLink: string }): Promise<EmailResult> {
    return this.sendEmail({
      to: [to],
      subject: 'Verify Your Email Address',
      templateId: 'email-verification',
      templateData: data
    });
  }
}

export function createEmailProvider(type: 'smtp' | 'sendgrid', config: EmailProviderConfig): EmailProvider {
  switch (type) {
    case 'smtp':
      return new SmtpEmailProvider(config);
    case 'sendgrid':
      return new SendgridEmailProvider(config);
    default:
      throw new Error(`Unsupported email provider: ${type}`);
  }
}
