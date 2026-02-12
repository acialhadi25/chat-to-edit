/**
 * Environment variable validation
 * Validates required environment variables on app startup
 */

export interface EnvVariable {
  name: string;
  required: boolean;
  description: string;
}

export interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * List of all environment variables used in the application
 */
const ENV_VARIABLES: EnvVariable[] = [
  {
    name: "VITE_SUPABASE_URL",
    required: true,
    description: "Supabase project URL for authentication and backend services",
  },
  {
    name: "VITE_SUPABASE_PUBLISHABLE_KEY",
    required: true,
    description: "Supabase publishable/anon key for client-side operations",
  },
];

/**
 * Validate all environment variables
 */
export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const envVar of ENV_VARIABLES) {
    const value = import.meta.env[envVar.name as keyof ImportMetaEnv];

    if (envVar.required && !value) {
      errors.push(
        `Missing required environment variable: ${envVar.name}\n  → ${envVar.description}`
      );
    }

    if (value && value.length < 5) {
      warnings.push(
        `Environment variable ${envVar.name} seems unusually short (${value.length} chars)`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Log environment validation results
 */
export function logEnvValidation(result: EnvValidationResult): void {
  if (!result.isValid) {
    console.error(
      "%cEnvironment Validation Failed ❌",
      "color: #ef4444; font-weight: bold; font-size: 14px;"
    );
    result.errors.forEach((error) => {
      console.error("%c✗ " + error, "color: #ef4444;");
    });
  } else if (result.warnings.length > 0) {
    console.warn(
      "%cEnvironment Validation Warnings ⚠️",
      "color: #f97316; font-weight: bold; font-size: 14px;"
    );
    result.warnings.forEach((warning) => {
      console.warn("%c⚠ " + warning, "color: #f97316;");
    });
  } else {
    console.log(
      "%cEnvironment Validation Passed ✓",
      "color: #22c55e; font-weight: bold; font-size: 14px;"
    );
  }
}

/**
 * Display environment validation errors to user
 * This is used when environment validation fails critically
 */
export function displayEnvValidationError(result: EnvValidationResult): void {
  const container = document.getElementById("root");
  if (!container) return;

  const errorMessage = `
    <div style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #fff;
      padding: 20px;
    ">
      <div style="
        max-width: 600px;
        background: #1a1a1a;
        border: 2px solid #ef4444;
        border-radius: 12px;
        padding: 40px;
        box-shadow: 0 20px 25px rgba(0, 0, 0, 0.5);
      ">
        <div style="
          font-size: 48px;
          margin-bottom: 16px;
          text-align: center;
        ">🔴</div>
        
        <h1 style="
          font-size: 28px;
          font-weight: bold;
          margin: 0 0 16px 0;
          text-align: center;
          color: #ef4444;
        ">Configuration Error</h1>
        
        <p style="
          font-size: 16px;
          margin: 0 0 24px 0;
          text-align: center;
          color: #a0a0a0;
        ">The application is not properly configured. Please set the following environment variables:</p>
        
        <div style="
          background: #0a0a0a;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 24px;
          font-size: 14px;
          line-height: 1.6;
        ">
          ${result.errors
            .map(
              (error) => `
            <div style="
              margin-bottom: 12px;
              padding-bottom: 12px;
              border-bottom: 1px solid #333;
              color: #fca5a5;
            ">
              <strong style="color: #ef4444;">✗</strong> ${error.replace(/\n/g, "<br/>&nbsp;&nbsp;&nbsp;&nbsp;")}
            </div>
          `
            )
            .join("")}
        </div>
        
        <p style="
          font-size: 13px;
          color: #666;
          text-align: center;
          margin: 0;
        ">
          Please check your environment configuration and reload the page.<br/>
          For help, see the project documentation.
        </p>
      </div>
    </div>
  `;

  container.innerHTML = errorMessage;
}

/**
 * Check if specific environment variable exists
 */
export function hasEnvVariable(name: string): boolean {
  return !!import.meta.env[name as keyof ImportMetaEnv];
}

/**
 * Get environment variable value
 */
export function getEnvVariable(name: string): string | undefined {
  return import.meta.env[name as keyof ImportMetaEnv];
}
