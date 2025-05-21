# Script Counter

A lightweight web crawler that counts first-party and third-party scripts on websites.

## Features

- Counts first-party and third-party scripts on any website
- Handles redirects automatically
- Detects and accepts common cookie consent banners
- Waits for dynamically loaded scripts
- Simple REST API interface

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/Script-Counter.git
   cd Script-Counter
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

## Development

To start the server in development mode (with live reload if you use a tool like nodemon):

```bash
npm run dev
```

Or to start the server normally:

```bash
npm start
```

The server will run on [http://localhost:3000](http://localhost:3000) by default.

## API Usage

### Count Scripts on a Website

Send a GET request to `/count-scripts` with the `url` query parameter:

```bash
curl "http://localhost:3000/count-scripts?url=https://gap.com"
```

#### Optional: Include All Script URLs

By default, the API response only includes the counts and URLs of the page checked. If you want to include the full list of all script URLs (first-party and third-party), add the `details=true` query parameter:

```bash
curl "http://localhost:3000/count-scripts?url=https://gap.com&details=true"
```

#### Example Response (with details=true)

```json
{
  "firstPartyScriptCount": 5,
  "thirdPartyScriptCount": 12,
  "inlineScriptCount": 3,
  "firstPartyScripts": [
    "https://gap.com/script1.js",
    "https://gap.com/script2.js"
  ],
  "thirdPartyScripts": ["https://cdn.example.com/script.js"],
  "pageUrl": "https://www.gap.com/",
  "requestedUrl": "https://gap.com"
}
```

#### Example Response (without details)

```json
{
  "firstPartyScriptCount": 5,
  "thirdPartyScriptCount": 12,
  "inlineScriptCount": 3,
  "pageUrl": "https://www.gap.com/",
  "requestedUrl": "https://gap.com"
}
```

- `firstPartyScriptCount`: Number of scripts from the same domain as the website
- `thirdPartyScriptCount`: Number of scripts from different domains
- `inlineScriptCount`: Number of inline scripts
- `firstPartyScripts`: Array of URLs for first-party scripts (only if `details=true`)
- `thirdPartyScripts`: Array of URLs for third-party scripts (only if `details=true`)
- `pageUrl`: The final URL that was analyzed (after redirects)
- `requestedUrl`: The original URL you requested

### Health Check

You can check if the server is running with:

```bash
curl http://localhost:3000/health
```

## Error Handling

The API will return appropriate error messages for:

- Missing URL parameter
- Invalid URLs
- Failed script analysis
- Timeout errors

## Technical Details

- Built with Node.js and Puppeteer
- Uses DOM and network response tracking to find all scripts
- Implements common cookie consent banner detection
- Waits for dynamically loaded scripts
- Includes reasonable timeouts for script loading
