import React from "react";
import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from "./App";

import "./index.css";

const GOOGLE_CLIENT_ID = "1043234855254-ijvfn4du0c4ig46obcqmt7k13r868gfp.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);