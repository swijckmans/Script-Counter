const express = require("express");
const ScriptCounter = require("./crawler");

const app = express();
const port = process.env.PORT || 3000;

// Increase timeout for long-running requests
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

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
  const { url, details } = req.query;

  if (!url) {
    return res.status(400).json({
      error: "URL parameter is required",
    });
  }

  try {
    console.log(`Starting script count for URL: ${url}`);
    const counter = new ScriptCounter();
    const result = await counter.countScripts(url);
    console.log(`Script count completed for URL: ${url}`);

    // Only include script URLs if details=true
    const response = {
      firstPartyScriptCount: result.firstPartyScriptCount,
      thirdPartyScriptCount: result.thirdPartyScriptCount,
      inlineScriptCount: result.inlineScriptCount,
      pageUrl: result.pageUrl,
      requestedUrl: result.requestedUrl,
    };
    if (details === "true") {
      response.firstPartyScripts = result.firstPartyScripts;
      response.thirdPartyScripts = result.thirdPartyScripts;
    }
    res.json(response);
  } catch (error) {
    console.error(`Error processing URL ${url}:`, error);
    res.status(500).json({
      error: error.message || "Failed to analyze scripts",
    });
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
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Closing server...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
