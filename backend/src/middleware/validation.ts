import { body, param, ValidationChain } from 'express-validator';

// Registration validation
export const validateRegistration: ValidationChain[] = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
];

// Login validation
export const validateLogin: ValidationChain[] = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Profile update validation
export const validateProfileUpdate: ValidationChain[] = [
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Bio must not exceed 255 characters')
    .customSanitizer((value: string) => {
      // Basic XSS prevention - strip HTML tags
      return value.replace(/<[^>]*>/g, '');
    }),
  
  body('profile_picture_url')
    .optional()
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Profile picture URL must be a valid HTTP/HTTPS URL')
    .isLength({ max: 500 })
    .withMessage('Profile picture URL must not exceed 500 characters')
];

// Email update validation
export const validateEmailUpdate: ValidationChain[] = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail()
];

// Password change validation
export const validatePasswordChange: ValidationChain[] = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('New password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('New password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('New password must contain at least one number')
];

// User ID parameter validation
export const validateUserId: ValidationChain[] = [
  param('userId')
    .isUUID()
    .withMessage('User ID must be a valid UUID')
];

