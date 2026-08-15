// index.js
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "react-oidc-context";

const cognitoAuthConfig = {
  authority: process.env.REACT_APP_COGNITO_AUTHORITY,
  client_id: process.env.REACT_APP_COGNITO_CLIENT_ID,
  redirect_uri: process.env.REACT_APP_REDIRECT_URI,
  post_logout_redirect_uri: process.env.REACT_APP_REDIRECT_URI,
  response_type: "code",
  scope: "phone openid email",
  // This is the magic part!
  onSigninCallback: () => {
    window.history.replaceState(
        {},
        document.title,
        window.location.pathname
    );
  }
};

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
