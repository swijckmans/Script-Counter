# Script Counter

A lightweight web crawler that counts first-party and third-party scripts on websites.

## Features

- Counts first-party and third-party scripts on any website
- Handles redirects automatically
- Detects and accepts common cookie consent banners
- Waits for dynamically loaded scripts
- Simple REST API interface
- SQLite database for result caching and historical data
- Anti-bot detection measures
- Full page screenshots

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

#### Optional Parameters

- `details=true`: Include full lists of script URLs
- `force=true`: Bypass cache and perform a fresh scan
- `screenshot=true`: Take a full page screenshot

```bash
# Get detailed results with screenshot
curl "http://localhost:3000/count-scripts?url=https://gap.com&details=true&screenshot=true"
```

#### Example Response (with details and screenshot)

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
  "requestedUrl": "https://gap.com",
  "cached": false,
  "screenshot": {
    "filename": "gap.com-2024-03-20T15-30-00-000Z.png",
    "url": "/screenshots/gap.com-2024-03-20T15-30-00-000Z.png"
  }
}
```

#### Example Response (without details)

```json
{
  "firstPartyScriptCount": 5,
  "thirdPartyScriptCount": 12,
  "inlineScriptCount": 3,
  "pageUrl": "https://www.gap.com/",
  "requestedUrl": "https://gap.com",
  "cached": true
}
```

- `firstPartyScriptCount`: Number of scripts from the same domain as the website
- `thirdPartyScriptCount`: Number of scripts from different domains
- `inlineScriptCount`: Number of inline scripts
- `firstPartyScripts`: Array of URLs for first-party scripts (only if `details=true`)
- `thirdPartyScripts`: Array of URLs for third-party scripts (only if `details=true`)
- `pageUrl`: The final URL that was analyzed (after redirects)
- `requestedUrl`: The original URL you requested
- `cached`: Boolean indicating if the result was served from cache
- `screenshot`: Object containing screenshot information (only if `screenshot=true`)
  - `filename`: Name of the screenshot file
  - `url`: URL to access the screenshot

### View Historical Data

Get a list of previous script counts with pagination:

```bash
curl "http://localhost:3000/history?limit=10&offset=0"
```

Parameters:

- `limit`: Number of results to return (default: 100)
- `offset`: Number of results to skip (default: 0)

### Get Statistics

View aggregate statistics about all scans:

```bash
curl "http://localhost:3000/stats"
```

Response:

```json
{
  "total_scans": 150,
  "avg_first_party": 8.5,
  "avg_third_party": 15.2,
  "avg_inline": 3.1,
  "last_scan": "2024-03-20T15:30:00Z"
}
```

### Health Check

You can check if the server is running with:

```bash
curl http://localhost:3000/health
```

## Database

The application uses SQLite for data persistence. The database file (`script_counts.db`) is automatically created in the project root directory when the server starts.

### Database Schema

```sql
CREATE TABLE script_counts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  final_url TEXT,
  first_party_count INTEGER NOT NULL,
  third_party_count INTEGER NOT NULL,
  inline_count INTEGER NOT NULL,
  first_party_scripts TEXT,
  third_party_scripts TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Indexes:

- `idx_url`: For fast URL lookups
- `idx_created_at`: For efficient historical queries

## Screenshots

When the `screenshot=true` parameter is used, the application will:

1. Create a `screenshots` directory in the project root if it doesn't exist
2. Take a full-page screenshot of the website
3. Save it with a filename based on the domain and timestamp
4. Make it available via the `/screenshots` endpoint

Screenshots are stored in PNG format and can be accessed directly via their URL in the response.

## Error Handling

The API will return appropriate error messages for:

- Missing URL parameter
- Invalid URLs
- Failed script analysis
- Timeout errors
- Database errors
- Screenshot errors

## Technical Details

- Built with Node.js and Puppeteer
- Uses DOM and network response tracking to find all scripts
- Implements common cookie consent banner detection
- Waits for dynamically loaded scripts
- Includes reasonable timeouts for script loading
- Uses better-sqlite3 for efficient database operations
- Implements anti-bot detection measures
- Includes result caching for improved performance
- Takes full-page screenshots with proper timing
