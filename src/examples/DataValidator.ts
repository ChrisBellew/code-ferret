/**
 * Data Validation Utility
 * 
 * Provides validation for various data types and formats.
 */

export type ValidationResult = {
  valid: boolean;
  errors: ValidationError[];
};

export type ValidationError = {
  path: string;
  message: string;
  value?: any;
};

export type ValidationRule<T = any> = {
  validate: (value: T, path: string) => ValidationError[];
  message?: string;
};

export class StringValidator implements ValidationRule<string> {
  private minLength?: number;
  private maxLength?: number;
  private pattern?: RegExp;
  private required: boolean;
  private trim: boolean;
  private customMessage?: string;
  
  constructor(options: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    required?: boolean;
    trim?: boolean;
    message?: string;
  } = {}) {
    this.minLength = options.minLength;
    this.maxLength = options.maxLength;
    this.pattern = options.pattern;
    this.required = options.required ?? true;
    this.trim = options.trim ?? true;
    this.customMessage = options.message;
  }
  
  validate(value: string, path: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Handle null/undefined
    if (value === null || value === undefined) {
      if (this.required) {
        errors.push({
          path,
          message: this.customMessage || 'Value is required',
          value
        });
      }
      return errors;
    }
    
    // Ensure it's a string
    if (typeof value !== 'string') {
      errors.push({
        path,
        message: this.customMessage || 'Value must be a string',
        value
      });
      return errors;
    }
    
    // Apply trimming if needed
    const processedValue = this.trim ? value.trim() : value;
    
    // Check if empty
    if (this.required && processedValue === '') {
      errors.push({
        path,
        message: this.customMessage || 'Value cannot be empty',
        value
      });
      return errors;
    }
    
    // Skip further validation if empty and not required
    if (!this.required && processedValue === '') {
      return errors;
    }
    
    // Check min length
    if (this.minLength !== undefined && processedValue.length < this.minLength) {
      errors.push({
        path,
        message: this.customMessage || `Value must be at least ${this.minLength} characters`,
        value
      });
    }
    
    // Check max length
    if (this.maxLength !== undefined && processedValue.length > this.maxLength) {
      errors.push({
        path,
        message: this.customMessage || `Value must be at most ${this.maxLength} characters`,
        value
      });
    }
    
    // Check pattern
    if (this.pattern && !this.pattern.test(processedValue)) {
      errors.push({
        path,
        message: this.customMessage || 'Value does not match the required pattern',
        value
      });
    }
    
    return errors;
  }
}

export class NumberValidator implements ValidationRule<number> {
  private min?: number;
  private max?: number;
  private integer: boolean;
  private required: boolean;
  private customMessage?: string;
  
  constructor(options: {
    min?: number;
    max?: number;
    integer?: boolean;
    required?: boolean;
    message?: string;
  } = {}) {
    this.min = options.min;
    this.max = options.max;
    this.integer = options.integer ?? false;
    this.required = options.required ?? true;
    this.customMessage = options.message;
  }
  
  validate(value: number, path: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Handle null/undefined
    if (value === null || value === undefined) {
      if (this.required) {
        errors.push({
          path,
          message: this.customMessage || 'Value is required',
          value
        });
      }
      return errors;
    }
    
    // Ensure it's a number
    if (typeof value !== 'number' || isNaN(value)) {
      errors.push({
        path,
        message: this.customMessage || 'Value must be a number',
        value
      });
      return errors;
    }
    
    // Check if integer
    if (this.integer && !Number.isInteger(value)) {
      errors.push({
        path,
        message: this.customMessage || 'Value must be an integer',
        value
      });
    }
    
    // Check min
    if (this.min !== undefined && value < this.min) {
      errors.push({
        path,
        message: this.customMessage || `Value must be at least ${this.min}`,
        value
      });
    }
    
    // Check max
    if (this.max !== undefined && value > this.max) {
      errors.push({
        path,
        message: this.customMessage || `Value must be at most ${this.max}`,
        value
      });
    }
    
    return errors;
  }
}

export class BooleanValidator implements ValidationRule<boolean> {
  private required: boolean;
  private customMessage?: string;
  
  constructor(options: {
    required?: boolean;
    message?: string;
  } = {}) {
    this.required = options.required ?? true;
    this.customMessage = options.message;
  }
  
  validate(value: boolean, path: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Handle null/undefined
    if (value === null || value === undefined) {
      if (this.required) {
        errors.push({
          path,
          message: this.customMessage || 'Value is required',
          value
        });
      }
      return errors;
    }
    
    // Ensure it's a boolean
    if (typeof value !== 'boolean') {
      errors.push({
        path,
        message: this.customMessage || 'Value must be a boolean',
        value
      });
    }
    
    return errors;
  }
}

export class ArrayValidator<T> implements ValidationRule<T[]> {
  private itemValidator?: ValidationRule<T>;
  private minLength?: number;
  private maxLength?: number;
  private required: boolean;
  private customMessage?: string;
  
  constructor(options: {
    itemValidator?: ValidationRule<T>;
    minLength?: number;
    maxLength?: number;
    required?: boolean;
    message?: string;
  } = {}) {
    this.itemValidator = options.itemValidator;
    this.minLength = options.minLength;
    this.maxLength = options.maxLength;
    this.required = options.required ?? true;
    this.customMessage = options.message;
  }
  
  validate(value: T[], path: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Handle null/undefined
    if (value === null || value === undefined) {
      if (this.required) {
        errors.push({
          path,
          message: this.customMessage || 'Value is required',
          value
        });
      }
      return errors;
    }
    
    // Ensure it's an array
    if (!Array.isArray(value)) {
      errors.push({
        path,
        message: this.customMessage || 'Value must be an array',
        value
      });
      return errors;
    }
    
    // Check min length
    if (this.minLength !== undefined && value.length < this.minLength) {
      errors.push({
        path,
        message: this.customMessage || `Array must contain at least ${this.minLength} items`,
        value
      });
    }
    
    // Check max length
    if (this.maxLength !== undefined && value.length > this.maxLength) {
      errors.push({
        path,
        message: this.customMessage || `Array must contain at most ${this.maxLength} items`,
        value
      });
    }
    
    // Validate each item
    if (this.itemValidator) {
      for (let i = 0; i < value.length; i++) {
        const itemErrors = this.itemValidator.validate(value[i], `${path}[${i}]`);
        errors.push(...itemErrors);
      }
    }
    
    return errors;
  }
}

export class ObjectValidator<T extends Record<string, any>> implements ValidationRule<T> {
  private schema: Record<string, ValidationRule>;
  private required: boolean;
  private allowUnknown: boolean;
  private customMessage?: string;
  
  constructor(options: {
    schema: Record<string, ValidationRule>;
    required?: boolean;
    allowUnknown?: boolean;
    message?: string;
  }) {
    this.schema = options.schema;
    this.required = options.required ?? true;
    this.allowUnknown = options.allowUnknown ?? false;
    this.customMessage = options.message;
  }
  
  validate(value: T, path: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Handle null/undefined
    if (value === null || value === undefined) {
      if (this.required) {
        errors.push({
          path,
          message: this.customMessage || 'Value is required',
          value
        });
      }
      return errors;
    }
    
    // Ensure it's an object
    if (typeof value !== 'object' || Array.isArray(value)) {
      errors.push({
        path,
        message: this.customMessage || 'Value must be an object',
        value
      });
      return errors;
    }
    
    // Check for unknown properties
    if (!this.allowUnknown) {
      for (const key of Object.keys(value)) {
        if (!(key in this.schema)) {
          errors.push({
            path: `${path}.${key}`,
            message: `Unknown property: ${key}`,
            value: value[key]
          });
        }
      }
    }
    
    // Validate each property
    for (const [key, validator] of Object.entries(this.schema)) {
      const propertyErrors = validator.validate(value[key], `${path}.${key}`);
      errors.push(...propertyErrors);
    }
    
    return errors;
  }
}

export class EmailValidator extends StringValidator {
  constructor(options: {
    required?: boolean;
    message?: string;
  } = {}) {
    super({
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      required: options.required ?? true,
      message: options.message || 'Invalid email address'
    });
  }
}

export class UrlValidator extends StringValidator {
  constructor(options: {
    required?: boolean;
    message?: string;
  } = {}) {
    super({
      pattern: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
      required: options.required ?? true,
      message: options.message || 'Invalid URL'
    });
  }
}

export class DateValidator implements ValidationRule<Date> {
  private min?: Date;
  private max?: Date;
  private required: boolean;
  private customMessage?: string;
  
  constructor(options: {
    min?: Date;
    max?: Date;
    required?: boolean;
    message?: string;
  } = {}) {
    this.min = options.min;
    this.max = options.max;
    this.required = options.required ?? true;
    this.customMessage = options.message;
  }
  
  validate(value: Date, path: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Handle null/undefined
    if (value === null || value === undefined) {
      if (this.required) {
        errors.push({
          path,
          message: this.customMessage || 'Value is required',
          value
        });
      }
      return errors;
    }
    
    // Ensure it's a date
    if (!(value instanceof Date) || isNaN(value.getTime())) {
      errors.push({
        path,
        message: this.customMessage || 'Value must be a valid date',
        value
      });
      return errors;
    }
    
    // Check min date
    if (this.min && value < this.min) {
      errors.push({
        path,
        message: this.customMessage || `Date must be on or after ${this.min.toISOString()}`,
        value
      });
    }
    
    // Check max date
    if (this.max && value > this.max) {
      errors.push({
        path,
        message: this.customMessage || `Date must be on or before ${this.max.toISOString()}`,
        value
      });
    }
    
    return errors;
  }
}

export class Validator {
  static validate<T>(value: T, rule: ValidationRule<T>): ValidationResult {
    const errors = rule.validate(value, '');
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  static string(options?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    required?: boolean;
    trim?: boolean;
    message?: string;
  }): StringValidator {
    return new StringValidator(options);
  }
  
  static number(options?: {
    min?: number;
    max?: number;
    integer?: boolean;
    required?: boolean;
    message?: string;
  }): NumberValidator {
    return new NumberValidator(options);
  }
  
  static boolean(options?: {
    required?: boolean;
    message?: string;
  }): BooleanValidator {
    return new BooleanValidator(options);
  }
  
  static array<T>(options?: {
    itemValidator?: ValidationRule<T>;
    minLength?: number;
    maxLength?: number;
    required?: boolean;
    message?: string;
  }): ArrayValidator<T> {
    return new ArrayValidator<T>(options);
  }
  
  static object<T extends Record<string, any>>(options: {
    schema: Record<string, ValidationRule>;
    required?: boolean;
    allowUnknown?: boolean;
    message?: string;
  }): ObjectValidator<T> {
    return new ObjectValidator<T>(options);
  }
  
  static email(options?: {
    required?: boolean;
    message?: string;
  }): EmailValidator {
    return new EmailValidator(options);
  }
  
  static url(options?: {
    required?: boolean;
    message?: string;
  }): UrlValidator {
    return new UrlValidator(options);
  }
  
  static date(options?: {
    min?: Date;
    max?: Date;
    required?: boolean;
    message?: string;
  }): DateValidator {
    return new DateValidator(options);
  }
}
