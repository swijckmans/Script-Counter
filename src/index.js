const express = require("express");
const ScriptCounter = require("./crawler");
const DatabaseManager = require("./database");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;
const db = new DatabaseManager();

// Increase timeout for long-running requests
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve screenshots directory
app.use(
  "/screenshots",
  express.static(path.join(process.cwd(), "screenshots"))
);

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error("Express error:", err);
  res.status(500).json({
    error: err.message || "Internal server error",
  });
});

// Add request timeout middleware
app.use((req, res, next) => {
  req.setTimeout(180000); // 3 minutes
  res.setTimeout(180000);
  next();
});

app.get("/count-scripts", async (req, res) => {
  const { url, details, force, screenshot } = req.query;

  if (!url) {
    return res.status(400).json({
      error: "URL parameter is required",
    });
  }

  try {
    // Check if we have a recent result in the database
    if (!force) {
      const existingResult = db.getScriptCountByUrl(url);
      if (existingResult) {
        const result = {
          firstPartyScriptCount: existingResult.first_party_count,
          thirdPartyScriptCount: existingResult.third_party_count,
          inlineScriptCount: existingResult.inline_count,
          pageUrl: existingResult.final_url,
          requestedUrl: existingResult.url,
          createdAt: existingResult.created_at,
        };

        if (details === "true") {
          result.firstPartyScripts = JSON.parse(
            existingResult.first_party_scripts
          );
          result.thirdPartyScripts = JSON.parse(
            existingResult.third_party_scripts
          );
        }

        return res.json({
          ...result,
          cached: true,
        });
      }
    }

    console.log(`Starting script count for URL: ${url}`);
    const counter = new ScriptCounter();
    const result = await counter.countScripts(url, screenshot === "true");
    console.log(`Script count completed for URL: ${url}`);

    // Save to database
    db.saveScriptCount(result);

    // Prepare response
    const response = {
      firstPartyScriptCount: result.firstPartyScriptCount,
      thirdPartyScriptCount: result.thirdPartyScriptCount,
      inlineScriptCount: result.inlineScriptCount,
      pageUrl: result.pageUrl,
      requestedUrl: result.requestedUrl,
      cached: false,
    };

    if (details === "true") {
      response.firstPartyScripts = result.firstPartyScripts;
      response.thirdPartyScripts = result.thirdPartyScripts;
    }

    if (result.screenshot) {
      response.screenshot = {
        filename: result.screenshot.filename,
        url: `/screenshots/${result.screenshot.filename}`,
      };
    }

    res.json(response);
  } catch (error) {
    console.error(`Error processing URL ${url}:`, error);
    res.status(500).json({
      error: error.message || "Failed to analyze scripts",
    });
  }
});

// Add endpoints for retrieving historical data
app.get("/history", (req, res) => {
  const { limit = 100, offset = 0 } = req.query;
  try {
    const results = db.getScriptCounts(parseInt(limit), parseInt(offset));
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/stats", (req, res) => {
  try {
    const stats = db.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const server = app.listen(port, () => {
  console.log(`Script counter server running on port ${port}`);
});

// Handle server errors
server.on("error", (error) => {
  console.error("Server error:", error);
});

// Handle server timeouts
server.timeout = 180000; // 3 minutes
server.keepAliveTimeout = 180000;
server.headersTimeout = 180000;

// Handle process errors
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  // Don't exit the process, just log the error
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error);
  // Don't exit the process, just log the error
});

// Handle process signals
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Closing server...");
  db.close();
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Closing server...");
  db.close();
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
