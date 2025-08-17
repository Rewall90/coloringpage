/**
 * API Middleware Utilities
 * 
 * Shared utilities for handling common API patterns:
 * - CORS handling
 * - Method validation
 * - Request validation
 * - Error responses
 * - Success responses
 */

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

// Common CORS headers
export function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Handle preflight requests
export function handlePreflight(req, res) {
  if (req.method === 'OPTIONS') {
    setCORSHeaders(res);
    return res.status(HTTP_STATUS.OK).end();
  }
  return false;
}

// Validate HTTP method
export function validateMethod(req, res, allowedMethods = ['POST']) {
  if (!allowedMethods.includes(req.method)) {
    return res.status(HTTP_STATUS.METHOD_NOT_ALLOWED).json({ 
      error: `Method ${req.method} not allowed. Allowed methods: ${allowedMethods.join(', ')}` 
    });
  }
  return null;
}

// Email validation
// NOTE: Keep this email validation regex in sync with assets/js/forms.js:67
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate required fields
export function validateRequiredFields(data, requiredFields) {
  const errors = [];
  
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      errors.push(`${field} is required`);
    }
  }
  
  return errors;
}

// Validate email field specifically
export function validateEmailField(email, fieldName = 'email') {
  const errors = [];
  
  if (!email) {
    errors.push(`${fieldName} is required`);
  } else if (!isValidEmail(email)) {
    errors.push(`Invalid ${fieldName} format`);
  }
  
  return errors;
}

// Standard error response
export function errorResponse(res, statusCode, message, details = null, code = null) {
  const response = { error: message };
  
  // Include error code if provided
  if (code) {
    response.code = code;
  }
  
  // Include details only in development
  if (details && process.env.NODE_ENV === 'development') {
    response.details = details;
  }
  
  return res.status(statusCode).json(response);
}

// Standard success response
export function successResponse(res, data, statusCode = HTTP_STATUS.OK) {
  return res.status(statusCode).json({
    success: true,
    ...data
  });
}

// Environment variable validation
export function validateEnvVar(varName, errorMessage = null) {
  const value = process.env[varName];
  if (!value) {
    const message = errorMessage || `${varName} environment variable is not set`;
    console.error(message);
    return { isValid: false, message };
  }
  return { isValid: true, value };
}

// API handler wrapper with common middleware
export function withApiMiddleware(handler, options = {}) {
  const {
    allowedMethods = ['POST'],
    requireFields = [],
    validateEmail = false,
    requiredEnvVars = []
  } = options;

  return async (req, res) => {
    try {
      // Handle preflight requests
      if (handlePreflight(req, res)) return;
      
      // Set CORS headers
      setCORSHeaders(res);

      // Validate HTTP method
      const methodError = validateMethod(req, res, allowedMethods);
      if (methodError) return;

      // Validate required environment variables
      for (const envVar of requiredEnvVars) {
        const validation = validateEnvVar(envVar);
        if (!validation.isValid) {
          return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 
            'Service is not properly configured');
        }
      }

      // Validate required fields
      if (requireFields.length > 0) {
        const fieldErrors = validateRequiredFields(req.body, requireFields);
        if (fieldErrors.length > 0) {
          return errorResponse(res, HTTP_STATUS.BAD_REQUEST, fieldErrors.join(', '));
        }
      }

      // Validate email if specified
      if (validateEmail && req.body.email) {
        const emailErrors = validateEmailField(req.body.email);
        if (emailErrors.length > 0) {
          return errorResponse(res, HTTP_STATUS.BAD_REQUEST, emailErrors.join(', '));
        }
      }

      // Call the actual handler
      return await handler(req, res);

    } catch (error) {
      console.error('API Error:', error);
      return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 
        'Internal server error', error.message);
    }
  };
}

// Logging utility - Production-safe API logging
export function logApiCall(endpoint, data, result = null, error = null) {
  const isProduction = process.env.NODE_ENV === 'production';
  const sanitizedData = typeof data === 'object' ? { ...data, password: '[REDACTED]', token: '[REDACTED]' } : data;
  
  if (error) {
    // Always log errors, even in production
    console.error(`[API] ${endpoint} failed:`, error.message || error);
    
    // Log full context only in development
    if (!isProduction) {
      console.error('Error context:', {
        endpoint,
        data: sanitizedData,
        timestamp: new Date().toISOString()
      });
    }
  } else if (result) {
    // Log successful calls only in development
    if (!isProduction) {
      console.log(`[API] ${endpoint} success:`, {
        endpoint,
        data: sanitizedData,
        result,
        timestamp: new Date().toISOString()
      });
    }
  }
}