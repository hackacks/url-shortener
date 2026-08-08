#HACKACK'S URL Shortener

## Overview

This project is the React frontend for the URL Shortener application.
It provides the user interface for:

- signing in with AWS Cognito
- creating short links from long URLs
- viewing a user’s saved links
- copying generated short URLs
- deleting links that belong to the signed-in user

The frontend communicates with AWS-backed Lambda APIs and displays the data returned by those APIs in a simple dashboard.

## How the application works

The frontend is the browser-facing part of the system. It does not store data by itself.
Instead, it sends requests to backend Lambda endpoints and reads the results from DynamoDB through those APIs.

Typical flow:

1. A user opens the site.
2. The app redirects the user to AWS Cognito for login.
3. After successful login, Cognito returns an ID token to the frontend.
4. The frontend sends that token with API requests.
5. Lambda functions validate the token, read or write data in DynamoDB, and return a response.
6. The UI shows the created short link, the list of URLs, click counts, and delete actions.

## Features

- Authentication with AWS Cognito
- URL shortening from a long web address
- Retrieval of all links owned by the signed-in user
- Click count display for each shortened URL
- Secure delete action for user-owned links only
- Copy-to-clipboard support for short links
- Responsive dashboard-style layout

## Requirements

Before running this project, you should have:

- Node.js installed
- npm installed
- Access to the AWS environment used by the backend
- A Cognito user pool and app client configured for this application
- API Gateway endpoints deployed for create, list, and delete operations
- The redirect/short-link domain configured in DNS and AWS

Recommended versions:

- Node.js 18 or newer
- npm 9 or newer

## Project structure

The most important files in this frontend are:

- `src/App.js` - main application UI and API calls
- `src/index.js` - app bootstrapping and Cognito configuration
- `src/index.css` - global page styling
- `public/index.html` - HTML entry point
- `package.json` - dependencies, scripts, and build configuration

## Environment variables

This project depends on `REACT_APP_*` environment variables.
They are read at build time by Create React App.

### API and auth variables

- `REACT_APP_API_ENDPOINT`
  - POST endpoint for creating short URLs
- `REACT_APP_GET_URLS_ENDPOINT`
  - GET endpoint for listing the current user’s URLs
- `REACT_APP_DELETE_ENDPOINT`
  - DELETE endpoint for removing a short URL
- `REACT_APP_COGNITO_AUTHORITY`
  - Cognito issuer URL or authorization authority
- `REACT_APP_COGNITO_CLIENT_ID`
  - Cognito app client ID
- `REACT_APP_REDIRECT_URI`
  - Redirect URL used after login

### Example development values

```bash
REACT_APP_API_ENDPOINT=http://localhost:xxxx/create
REACT_APP_GET_URLS_ENDPOINT=http://localhost:xxxx/urls
REACT_APP_DELETE_ENDPOINT=http://localhost:xxxx/delete
REACT_APP_COGNITO_AUTHORITY=https://cognito-idp.<region>.amazonaws.com/<user-pool-id>
REACT_APP_COGNITO_CLIENT_ID=<your-client-id>
REACT_APP_REDIRECT_URI=http://localhost:3000
```

### Example production values

```bash
REACT_APP_API_ENDPOINT=https://api.example.com/create
REACT_APP_GET_URLS_ENDPOINT=https://api.example.com/urls
REACT_APP_DELETE_ENDPOINT=https://api.example.com/delete
REACT_APP_COGNITO_AUTHORITY=https://cognito-idp.<region>.amazonaws.com/<user-pool-id>
REACT_APP_COGNITO_CLIENT_ID=<your-client-id>
REACT_APP_REDIRECT_URI=https://shortener.hackack.tech
```

Important:

- The redirect URI must match Cognito callback URLs exactly.
- If you change environment variables, rebuild the frontend before deployment.

## Local development

### 1. Install dependencies

```bash
npm install
```

### 2. Create local environment variables

Create a local `.env` file in the frontend folder and define the required `REACT_APP_*` values.

### 3. Start the development server

```bash
npm start
```

The app usually runs on:

```text
http://localhost:3000
```

## Production build

To create a production build:

```bash
npm run build
```

This generates a static build output that can be deployed to a hosting service such as:

- AWS S3
- AWS CloudFront
- any static web host

## Access URL

[Hackack URL Shortener](https://shortener.hackack.tech)
