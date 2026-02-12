import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { validateEnvironment, logEnvValidation, displayEnvValidationError } from "./utils/envValidator";

// Validate environment variables before rendering the app
const envValidation = validateEnvironment();
logEnvValidation(envValidation);

if (!envValidation.isValid) {
  // Display user-friendly error message if validation fails
  displayEnvValidationError(envValidation);
} else {
  // Only render the app if environment is valid
  createRoot(document.getElementById("root")!).render(<App />);
}
