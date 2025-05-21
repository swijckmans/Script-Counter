const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const URL = require("url-parse");
const { setTimeout } = require("node:timers/promises");

// Add stealth plugin
puppeteer.use(StealthPlugin());

class ScriptCounter {
  constructor() {
    console.log("Initializing ScriptCounter");
    this.baseDomain = null;
  }

  async retryOperation(operation, maxRetries = 3, delay = 1000) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.log(`Attempt ${i + 1} failed:`, error.message);

        // Check if it's a connection error
        if (
          error.message.includes("socket hang up") ||
          error.message.includes("ECONNRESET") ||
          error.message.includes("net::ERR_CONNECTION_RESET") ||
          error.message.includes("net::ERR_CONNECTION_CLOSED")
        ) {
          console.log("Connection error detected, increasing delay...");
          await setTimeout(delay * Math.pow(2, i)); // Exponential backoff
          continue;
        }

        if (i === maxRetries - 1) throw error;
        await setTimeout(delay * (i + 1));
      }
    }
    throw lastError;
  }

  async countScripts(url) {
    console.log(`Starting script count for URL: ${url}`);
    let browser;
    let page;

    try {
      browser = await puppeteer.launch({
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-extensions",
          "--disable-component-extensions-with-background-pages",
          "--disable-default-apps",
          "--mute-audio",
          "--no-first-run",
          "--disable-background-networking",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-breakpad",
          "--disable-client-side-phishing-detection",
          "--disable-hang-monitor",
          "--disable-ipc-flooding-protection",
          "--disable-popup-blocking",
          "--disable-prompt-on-repost",
          "--disable-renderer-backgrounding",
          "--disable-sync",
          "--force-color-profile=srgb",
          "--metrics-recording-only",
          "--no-default-browser-check",
          "--password-store=basic",
          "--use-mock-keychain",
          // Additional stealth arguments
          "--disable-blink-features=AutomationControlled",
          "--disable-features=IsolateOrigins,site-per-process",
          "--disable-site-isolation-trials",
          // Connection resilience arguments
          "--disable-web-security",
          "--disable-features=IsolateOrigins",
          "--disable-site-isolation-trials",
          "--disable-features=BlockInsecurePrivateNetworkRequests",
          "--disable-web-security",
          "--disable-features=IsolateOrigins",
          "--disable-site-isolation-trials",
          "--disable-features=BlockInsecurePrivateNetworkRequests",
          "--disable-web-security",
          "--disable-features=IsolateOrigins",
          "--disable-site-isolation-trials",
          "--disable-features=BlockInsecurePrivateNetworkRequests",
        ],
        ignoreHTTPSErrors: true,
        timeout: 60000, // Increased timeout
      });
      console.log("Browser launched successfully");

      page = await browser.newPage();
      console.log("New page created");

      // Configure page settings
      await page.setDefaultTimeout(60000); // Increased timeout
      await page.setViewport({ width: 1280, height: 800 });

      // Set up request interception for better error handling
      await page.setRequestInterception(true);
      page.on("request", (request) => {
        // Add headers to make requests look more legitimate
        const headers = {
          ...request.headers(),
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Cache-Control": "max-age=0",
        };
        request.continue({ headers });
      });

      // Handle request failures
      page.on("requestfailed", (request) => {
        console.log(
          `Request failed: ${request.url()} - ${request.failure().errorText}`
        );
      });

      // Additional anti-detection measures
      await page.evaluateOnNewDocument(() => {
        // Overwrite the 'navigator.webdriver' property
        Object.defineProperty(navigator, "webdriver", {
          get: () => undefined,
        });

        // Overwrite the 'navigator.languages' property
        Object.defineProperty(navigator, "languages", {
          get: () => ["en-US", "en"],
        });

        // Overwrite the 'navigator.plugins' property
        Object.defineProperty(navigator, "plugins", {
          get: () => [1, 2, 3, 4, 5],
        });

        // Add a fake Chrome runtime
        window.chrome = {
          runtime: {},
          loadTimes: function () {},
          csi: function () {},
          app: {},
        };

        // Overwrite permissions
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) =>
          parameters.name === "notifications"
            ? Promise.resolve({ state: Notification.permission })
            : originalQuery(parameters);

        // Add additional browser properties
        Object.defineProperty(navigator, "hardwareConcurrency", {
          get: () => 8,
        });
        Object.defineProperty(navigator, "deviceMemory", {
          get: () => 8,
        });
        Object.defineProperty(navigator, "platform", {
          get: () => "MacIntel",
        });
      });

      // Set a realistic user agent
      await page.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      );

      // Set up request tracking
      const scriptUrls = new Set();
      page.on("response", async (response) => {
        const request = response.request();
        if (request.resourceType() === "script") {
          scriptUrls.add(request.url());
        }
      });

      try {
        console.log("Attempting to navigate to URL...");
        await this.retryOperation(
          async () => {
            await page.goto(url, {
              waitUntil: ["domcontentloaded", "networkidle0"],
              timeout: 120000,
            });
          },
          5, // Increased retries
          2000
        );
        console.log("Navigation completed successfully");
      } catch (error) {
        console.log("Navigation failed, checking current URL");
        const currentUrl = page.url();
        if (!currentUrl) {
          console.error("Failed to get current URL");
          throw new Error("Failed to navigate to URL");
        }
        console.log(`Using current URL instead: ${currentUrl}`);
      }

      // Add random mouse movements to appear more human-like
      await this.simulateHumanBehavior(page);

      const finalUrl = page.url();
      this.baseDomain = new URL(finalUrl).hostname;
      console.log(`Base domain set to: ${this.baseDomain}`);

      // Wait for any initial scripts to load
      await setTimeout(3000); // Increased wait time

      console.log("Handling cookie banners...");
      await this.handleCookieBanners(page);
      console.log("Cookie banner handling completed");

      // Wait for any delayed scripts
      await setTimeout(3000); // Increased wait time

      // Count scripts
      console.log("Counting scripts...");
      const scriptCounts = await page.evaluate((baseDomain) => {
        const scripts = document.getElementsByTagName("script");
        let firstParty = [];
        let thirdParty = [];
        let inlineScripts = 0;

        for (const script of scripts) {
          if (script.src) {
            try {
              const scriptUrl = new URL(script.src);
              if (scriptUrl.hostname === baseDomain) {
                firstParty.push(script.src);
              } else {
                thirdParty.push(script.src);
              }
            } catch (error) {
              // Skip invalid URLs
            }
          } else if (script.textContent.trim()) {
            inlineScripts++;
          }
        }

        return { firstParty, thirdParty, inlineScripts };
      }, this.baseDomain);

      // Add any additional scripts found through response tracking
      for (const scriptUrl of scriptUrls) {
        try {
          const scriptDomain = new URL(scriptUrl).hostname;
          if (scriptDomain === this.baseDomain) {
            if (!scriptCounts.firstParty.includes(scriptUrl)) {
              scriptCounts.firstParty.push(scriptUrl);
            }
          } else {
            if (!scriptCounts.thirdParty.includes(scriptUrl)) {
              scriptCounts.thirdParty.push(scriptUrl);
            }
          }
        } catch (error) {
          // Skip invalid URLs
        }
      }

      console.log(
        `Script counts - First Party: ${scriptCounts.firstParty.length}, Third Party: ${scriptCounts.thirdParty.length}, Inline: ${scriptCounts.inlineScripts} | pageUrl: ${finalUrl} | requestedUrl: ${url}`
      );

      return {
        firstPartyScriptCount: scriptCounts.firstParty.length,
        thirdPartyScriptCount: scriptCounts.thirdParty.length,
        inlineScriptCount: scriptCounts.inlineScripts,
        firstPartyScripts: scriptCounts.firstParty,
        thirdPartyScripts: scriptCounts.thirdParty,
        pageUrl: finalUrl,
        requestedUrl: url,
      };
    } catch (error) {
      console.error("Error in countScripts:", error);
      throw new Error(`Failed to analyze scripts: ${error.message}`);
    } finally {
      if (page) {
        try {
          await page.close();
        } catch (error) {
          console.error("Error closing page:", error);
        }
      }
      if (browser) {
        try {
          console.log("Closing browser");
          await browser.close();
          console.log("Browser closed");
        } catch (error) {
          console.error("Error closing browser:", error);
        }
      }
    }
  }

  async simulateHumanBehavior(page) {
    // Random mouse movements
    const viewport = await page.viewport();
    const maxX = viewport.width;
    const maxY = viewport.height;

    for (let i = 0; i < 3; i++) {
      const x = Math.floor(Math.random() * maxX);
      const y = Math.floor(Math.random() * maxY);
      await page.mouse.move(x, y, { steps: 25 });
      await setTimeout(Math.random() * 1000 + 500);
    }

    // Random scroll
    await page.evaluate(() => {
      window.scrollTo({
        top: Math.random() * document.body.scrollHeight,
        behavior: "smooth",
      });
    });
    await setTimeout(Math.random() * 1000 + 500);
  }

  async handleCookieBanners(page) {
    console.log("Starting cookie banner handling");
    const cookieSelectors = [
      'button[aria-label*="cookie"]',
      'button[aria-label*="Cookie"]',
      'button:has-text("Accept All")',
      'button:has-text("Accept all")',
      'button:has-text("Accept cookies")',
      'button:has-text("I accept")',
      'button:has-text("I agree")',
      "#cookie-consent-accept",
      ".cookie-consent-accept",
      '[data-testid="cookie-banner-accept"]',
    ];

    for (const selector of cookieSelectors) {
      try {
        console.log(`Trying cookie selector: ${selector}`);
        const button = await page.$(selector);
        if (button) {
          console.log(`Found cookie button with selector: ${selector}`);
          await this.retryOperation(
            async () => {
              await button.click();
            },
            2,
            500
          );
          console.log("Clicked cookie button");
          await setTimeout(1000);
          break;
        }
      } catch (error) {
        console.log(
          `Failed to handle cookie button with selector ${selector}:`,
          error.message
        );
        continue;
      }
    }
  }
}

module.exports = ScriptCounter;
