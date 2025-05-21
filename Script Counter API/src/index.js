const express = require("express");
const ScriptCounter = require("./crawler");
const path = require("path");
const prisma = require("./db/prisma");

const app = express();
const port = process.env.PORT || 3000;

// Serve screenshots statically
app.use(
  "/screenshots",
  express.static(path.resolve(__dirname, "../screenshots"))
);

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

    // Store the analysis results in the database
    const website = await prisma.website.upsert({
      where: { url: result.pageUrl },
      update: {
        lastAnalyzedAt: new Date(),
        screenshotPath: result.screenshotPath,
      },
      create: {
        url: result.pageUrl,
        lastAnalyzedAt: new Date(),
        screenshotPath: result.screenshotPath,
      },
    });

    // Create or update tags
    if (result.tags && result.tags.length > 0) {
      // Delete existing tags for this website
      await prisma.tag.deleteMany({
        where: { websiteId: website.id },
      });

      // Create new tags
      await Promise.all(
        result.tags.map((tag) =>
          prisma.tag.create({
            data: {
              name: tag.name,
              count: tag.count,
              websiteId: website.id,
            },
          })
        )
      );
    }

    const analysis = await prisma.analysis.create({
      data: {
        websiteId: website.id,
        firstPartyCount: result.firstPartyScriptCount,
        thirdPartyCount: result.thirdPartyScriptCount,
        inlineCount: result.inlineScriptCount,
        rawResults: JSON.stringify({
          firstPartyScripts: result.firstPartyScripts,
          thirdPartyScripts: result.thirdPartyScripts,
        }),
      },
    });

    // Only include script URLs if details=true
    const response = {
      id: analysis.id,
      websiteId: website.id,
      firstPartyScriptCount: result.firstPartyScriptCount,
      thirdPartyScriptCount: result.thirdPartyScriptCount,
      inlineScriptCount: result.inlineScriptCount,
      pageUrl: result.pageUrl,
      requestedUrl: result.requestedUrl,
      screenshotPath: result.screenshotPath,
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
