const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const URL = require("url-parse");
const { setTimeout } = require("node:timers/promises");
const fs = require("fs");
const path = require("path");

// Add stealth plugin
puppeteer.use(StealthPlugin());

class ScriptCounter {
  constructor() {
    console.log("Initializing ScriptCounter");
    this.baseDomain = null;
  }

  // Add helper method for random delays
  async randomDelay(min = 1000, max = 3000) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await setTimeout(delay);
  }

  // Add helper method for human-like mouse movement
  async moveMouseLikeHuman(page) {
    const viewport = await page.viewport();
    const x = Math.floor(Math.random() * viewport.width);
    const y = Math.floor(Math.random() * viewport.height);
    await page.mouse.move(x, y, { steps: 25 });
  }

  async retryOperation(operation, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        console.log(`Attempt ${i + 1} failed:`, error.message);
        if (i === maxRetries - 1) throw error;
        await setTimeout(delay * (i + 1));
      }
    }
  }

  async countScripts(url) {
    console.log(`Starting script count for URL: ${url}`);
    let browser;

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
          "--window-size=1920,1080",
          "--start-maximized",
          "--disable-blink-features=AutomationControlled",
          "--disable-features=IsolateOrigins,site-per-process",
          "--disable-site-isolation-trials",
        ],
        ignoreHTTPSErrors: true,
        timeout: 30000,
        defaultViewport: {
          width: 1920,
          height: 1080,
          deviceScaleFactor: 1,
          isMobile: false,
          hasTouch: false,
          isLandscape: true,
        },
      });
      console.log("Browser launched successfully");

      const page = await browser.newPage();
      console.log("New page created");

      // Configure page settings
      await page.setDefaultTimeout(30000);
      await page.setViewport({ width: 1920, height: 1080 });

      // Add additional stealth configurations
      await page.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      );

      // Enhanced anti-detection measures
      await page.evaluateOnNewDocument(() => {
        // Overwrite the 'navigator.webdriver' property to prevent detection
        Object.defineProperty(navigator, "webdriver", {
          get: () => undefined,
        });

        // Add language and platform to make it more realistic
        Object.defineProperty(navigator, "languages", {
          get: () => ["en-US", "en"],
        });

        // Add plugins to make it more realistic
        Object.defineProperty(navigator, "plugins", {
          get: () => [1, 2, 3, 4, 5],
        });

        // Override permissions
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) =>
          parameters.name === "notifications"
            ? Promise.resolve({ state: Notification.permission })
            : originalQuery(parameters);

        // Add fake media devices
        Object.defineProperty(navigator, "mediaDevices", {
          get: () => ({
            enumerateDevices: () =>
              Promise.resolve([
                {
                  kind: "audioinput",
                  deviceId: "default",
                  label: "Default Microphone",
                },
                {
                  kind: "videoinput",
                  deviceId: "default",
                  label: "Default Camera",
                },
              ]),
          }),
        });

        // Override WebGL fingerprinting
        const getParameter = WebGLRenderingContext.prototype.getParameter;
        WebGLRenderingContext.prototype.getParameter = function (parameter) {
          if (parameter === 37445) {
            return "Intel Inc.";
          }
          if (parameter === 37446) {
            return "Intel Iris OpenGL Engine";
          }
          return getParameter.apply(this, arguments);
        };

        // Add fake battery API
        if (!navigator.getBattery) {
          navigator.getBattery = () =>
            Promise.resolve({
              charging: true,
              chargingTime: Infinity,
              dischargingTime: Infinity,
              level: 1,
              addEventListener: () => {},
              removeEventListener: () => {},
            });
        }

        // Override canvas fingerprinting
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, attributes) {
          const context = originalGetContext.call(this, type, attributes);
          if (type === "2d") {
            const originalGetImageData = context.getImageData;
            context.getImageData = function () {
              const imageData = originalGetImageData.apply(this, arguments);
              // Add slight noise to the image data
              for (let i = 0; i < imageData.data.length; i += 4) {
                imageData.data[i] += Math.random() * 2 - 1;
              }
              return imageData;
            };
          }
          return context;
        };
      });

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
            // Add random delay before navigation
            await this.randomDelay(1000, 2000);

            // Simulate human-like behavior before navigation
            await this.moveMouseLikeHuman(page);

            await page.goto(url, {
              waitUntil: "domcontentloaded",
              timeout: 120000,
            });
          },
          3,
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

      // Add random delay after navigation
      await this.randomDelay(2000, 4000);

      const finalUrl = page.url();
      this.baseDomain = new URL(finalUrl).hostname;
      console.log(`Base domain set to: ${this.baseDomain}`);

      // Simulate human-like scrolling
      await page.evaluate(async () => {
        await new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 100;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              resolve();
            }
          }, 100);
        });
      });

      // Wait for any initial scripts to load
      await this.randomDelay(2000, 3000);

      console.log("Handling cookie banners...");
      await this.handleCookieBanners(page);
      console.log("Cookie banner handling completed");

      // Wait for any delayed scripts with random delay
      await this.randomDelay(2000, 4000);

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

      // Categorize all scripts
      const allScripts = [
        ...scriptCounts.firstParty,
        ...scriptCounts.thirdParty,
      ];
      const tags = this.categorizeScripts(allScripts);

      console.log(
        `Script counts - First Party: ${scriptCounts.firstParty.length}, Third Party: ${scriptCounts.thirdParty.length}, Inline: ${scriptCounts.inlineScripts} | pageUrl: ${finalUrl} | requestedUrl: ${url}`
      );

      // Take screenshot
      const screenshotsDir = path.resolve(__dirname, "../screenshots");
      if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir);
      }
      const safeHost = this.baseDomain.replace(/[^a-zA-Z0-9-_]/g, "_");
      const timestamp = Date.now();
      const screenshotFilename = `${safeHost}_${timestamp}.png`;
      const screenshotPath = path.join(screenshotsDir, screenshotFilename);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      return {
        firstPartyScriptCount: scriptCounts.firstParty.length,
        thirdPartyScriptCount: scriptCounts.thirdParty.length,
        inlineScriptCount: scriptCounts.inlineScripts,
        firstPartyScripts: scriptCounts.firstParty,
        thirdPartyScripts: scriptCounts.thirdParty,
        pageUrl: finalUrl,
        requestedUrl: url,
        screenshotPath: `/screenshots/${screenshotFilename}`,
        tags,
      };
    } catch (error) {
      console.error("Error in countScripts:", error);
      throw new Error(`Failed to analyze scripts: ${error.message}`);
    } finally {
      if (browser) {
        console.log("Closing browser");
        await browser.close();
        console.log("Browser closed");
      }
    }
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

  categorizeScripts(scriptUrls) {
    const categories = {
      analytics: {
        patterns: [
          "google-analytics",
          "analytics",
          "gtm",
          "tagmanager",
          "segment",
          "mixpanel",
          "amplitude",
          "hotjar",
          "clarity",
          "plausible",
          "fathom",
          "matomo",
          "piwik",
        ],
        count: 0,
      },
      advertising: {
        patterns: [
          "ads",
          "advertising",
          "doubleclick",
          "adroll",
          "criteo",
          "taboola",
          "outbrain",
          "adform",
          "adtech",
          "advertising",
        ],
        count: 0,
      },
      social: {
        patterns: [
          "facebook",
          "twitter",
          "linkedin",
          "pinterest",
          "instagram",
          "tiktok",
          "social",
          "share",
          "follow",
        ],
        count: 0,
      },
      security: {
        patterns: [
          "security",
          "captcha",
          "recaptcha",
          "hcaptcha",
          "cloudflare",
          "akamai",
          "fastly",
          "sucuri",
          "incapsula",
          "shield",
        ],
        count: 0,
      },
      performance: {
        patterns: [
          "performance",
          "optimize",
          "cdn",
          "cloudfront",
          "fastly",
          "akamai",
          "bunny",
          "stackpath",
          "cloudflare",
        ],
        count: 0,
      },
    };

    const tags = [];

    for (const url of scriptUrls) {
      const urlLower = url.toLowerCase();
      let categorized = false;

      for (const [category, data] of Object.entries(categories)) {
        if (data.patterns.some((pattern) => urlLower.includes(pattern))) {
          data.count++;
          categorized = true;
          break;
        }
      }

      if (!categorized) {
        if (!categories.other) {
          categories.other = { count: 0, patterns: [] };
        }
        categories.other.count++;
      }
    }

    // Convert categories to tags
    for (const [name, data] of Object.entries(categories)) {
      if (data.count > 0) {
        tags.push({ name, count: data.count });
      }
    }

    return tags;
  }
}

module.exports = ScriptCounter;
