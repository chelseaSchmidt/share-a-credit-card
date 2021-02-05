# Cost Sharing for YNAB
Check out the live website and app here! https://costsharingforynab.com. Cost Sharing for YNAB is an open-source React web application built to work with YNAB (You Need a Budget), integrating with the YNAB API. YNAB members can use this add-on app, secured with HTTPS, to split shared expenses 50/50 with another person (significant other, roommate, etc.) while keeping track of the original expense breakdown in their budget. Members authenticate with their existing YNAB credentials via OAuth, allowing the app to connect securely to their account. While building this app I took the opportunity to experiment in a few new technologies, including React Hooks on the front end, and hosting the app on my own Linux-based Raspberry Pi (with Node and systemd) on the back end. I'm excited to contribute this add-on feature to the YNAB community!

## System requirements
  - Node (version 10.20.1 used in development)
  - npm package manager

## Run the application in development
  - npm install
  - npm run build:dev || npm run watch:dev
  - npm run build:site:dev || npm run watch:site:dev
  - npm start
    - Optional environment variable: PORT (defaults to 3000)
  - Navigate to http://localhost:3000

## Other
  - Command to run ESLint
    - npm run linter
  - Command to run HTTP server at port 3000
    - npm run start:HTTP
    - Requires configuring a redirect from port 80
  - Command to run HTTPS server at port 3001
    - KEY=`<key file path>` CERT=`<cert file path>` npm run start:HTTPS
    - Requires configuring redirects from port 80 --> 3000 and 443 --> 3001
    - HTTP server will redirect to HTTPS server