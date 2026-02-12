/**
 * Error message mapping for Lovable AI Gateway errors
 * Maps HTTP status codes and error types to user-friendly messages with recovery suggestions
 */

export interface ErrorResponse {
  title: string;
  message: string;
  suggestions: string[];
  recoveryAction?: 'retry' | 'settings' | 'auth' | 'contact-support' | 'none';
  isDeveloperError?: boolean;
  code?: string;
}

/**
 * Map HTTP status codes and error messages to user-friendly responses
 */
export function mapAIError(
  status: number | undefined,
  error: string | Error,
  context?: string
): ErrorResponse {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  // Log full error for debugging
  console.error('AI Error:', {
    status,
    message: errorMessage,
    context,
    timestamp: new Date().toISOString(),
  });

  // Rate limiting (429)
  if (status === 429) {
    return {
      title: '⏱️ Request Rate Limited',
      message:
        "You're sending requests too quickly. Please wait a moment before trying again.",
      suggestions: [
        'Wait a few seconds and try your request again',
        'Consider spacing out multiple operations',
        'Check your internet connection',
      ],
      recoveryAction: 'retry',
      code: 'RATE_LIMIT',
    };
  }

  // Insufficient credits (402)
  if (status === 402) {
    return {
      title: '💳 Insufficient Credits',
      message:
        'You have run out of AI credits. Please top up your account to continue using AI features.',
      suggestions: [
        'Go to Settings and add more credits',
        'Upgrade to a paid plan for better rates',
        'Contact support for credit assistance',
      ],
      recoveryAction: 'settings',
      code: 'INSUFFICIENT_CREDITS',
    };
  }

  // Authentication error (401/403)
  if (status === 401 || status === 403) {
    return {
      title: '🔐 Authentication Error',
      message:
        'Your session has expired or authentication failed. Please log in again.',
      suggestions: [
        'Refresh the page',
        'Log out and log back in',
        'Clear your browser cache and cookies',
      ],
      recoveryAction: 'auth',
      code: 'AUTH_FAILED',
    };
  }

  // Server error (500-599)
  if (status && status >= 500) {
    return {
      title: '🔧 Service Temporary Issue',
      message:
        'The AI service is temporarily unavailable. Our team is working to fix it.',
      suggestions: [
        'Try again in a few moments',
        'Check our status page for updates',
        'Contact support if the issue persists',
      ],
      recoveryAction: 'retry',
      code: 'SERVER_ERROR',
    };
  }

  // Network error
  if (
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('network')
  ) {
    return {
      title: '🌐 Network Connection Error',
      message:
        'Unable to connect to the AI service. Check your internet connection.',
      suggestions: [
        'Check your internet connection',
        'Disable VPN or proxy if you are using one',
        'Try from a different network',
        'Clear your browser cache',
      ],
      recoveryAction: 'retry',
      code: 'NETWORK_ERROR',
      isDeveloperError: true,
    };
  }

  // Missing API key
  if (
    errorMessage.includes('API key') ||
    errorMessage.includes('LOVABLE_API_KEY')
  ) {
    return {
      title: '🔑 Configuration Error',
      message:
        'The AI service is not properly configured. This is a technical issue.',
      suggestions: [
        'Contact support to report this issue',
        'Check that LOVABLE_API_KEY is configured',
        'Try refreshing the page',
      ],
      recoveryAction: 'contact-support',
      code: 'MISSING_API_KEY',
      isDeveloperError: true,
    };
  }

  // JSON parsing error
  if (
    errorMessage.includes('JSON') ||
    errorMessage.includes('parse') ||
    errorMessage.includes('unexpected token')
  ) {
    return {
      title: '📝 Response Format Error',
      message:
        'The AI response was in an unexpected format. Try your request again.',
      suggestions: [
        'Try your request again',
        'Simplify your request',
        'Contact support if this keeps happening',
      ],
      recoveryAction: 'retry',
      code: 'JSON_PARSE_ERROR',
      isDeveloperError: true,
    };
  }

  // File processing errors
  if (
    errorMessage.includes('file') ||
    errorMessage.includes('upload') ||
    errorMessage.includes('processing')
  ) {
    return {
      title: '📁 File Processing Error',
      message:
        'There was an error processing your file. It may be corrupted or in an unsupported format.',
      suggestions: [
        'Try uploading a different file',
        'Check that the file is not corrupted',
        'Ensure the file is in a supported format (PDF, Excel, DOCX)',
        'Try a smaller file first',
      ],
      recoveryAction: 'none',
      code: 'FILE_PROCESSING_ERROR',
    };
  }

  // Default error
  return {
    title: '⚠️ Something Went Wrong',
    message:
      'An unexpected error occurred. Please try again or contact support if the problem persists.',
    suggestions: [
      'Refresh the page and try again',
      'Check your internet connection',
      'Clear your browser cache',
      'Contact support for help',
    ],
    recoveryAction: 'retry',
    code: 'UNKNOWN_ERROR',
    isDeveloperError: false,
  };
}

/**
 * Format error response for toast notifications
 */
export function formatErrorForToast(errorResponse: ErrorResponse) {
  return {
    title: errorResponse.title,
    description: errorResponse.message,
    variant: 'destructive' as const,
  };
}

/**
 * Get recovery action label
 */
export function getRecoveryActionLabel(
  action: ErrorResponse['recoveryAction']
): string {
  switch (action) {
    case 'retry':
      return 'Retry';
    case 'settings':
      return 'Go to Settings';
    case 'auth':
      return 'Log In';
    case 'contact-support':
      return 'Contact Support';
    default:
      return 'Dismiss';
  }
}

/**
 * Handle AI error with logging and recovery suggestions
 */
export function handleAIError(
  status: number | undefined,
  error: string | Error,
  context?: string,
  onError?: (response: ErrorResponse) => void
): ErrorResponse {
  const errorResponse = mapAIError(status, error, context);
  
  // Log to console for debugging
  if (errorResponse.isDeveloperError) {
    console.warn('Developer Error:', {
      ...errorResponse,
      originalError: error,
    });
  }

  // Call error handler if provided
  if (onError) {
    onError(errorResponse);
  }

  return errorResponse;
}

/**
 * Validate error object structure
 */
export function isValidAIError(error: unknown): boolean {
  if (typeof error === 'string') return true;
  if (error instanceof Error) return true;
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error
  ) {
    return true;
  }
  return false;
}
