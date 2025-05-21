const puppeteer = require("puppeteer");
const URL = require("url-parse");
const { setTimeout } = require("node:timers/promises");

class ScriptCounter {
  constructor() {
    console.log("Initializing ScriptCounter");
    this.baseDomain = null;
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
        ],
        ignoreHTTPSErrors: true,
        timeout: 30000,
      });
      console.log("Browser launched successfully");

      const page = await browser.newPage();
      console.log("New page created");

      // Configure page settings
      await page.setDefaultTimeout(30000);
      await page.setViewport({ width: 1280, height: 800 });

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

      const finalUrl = page.url();
      this.baseDomain = new URL(finalUrl).hostname;
      console.log(`Base domain set to: ${this.baseDomain}`);

      // Wait for any initial scripts to load
      await setTimeout(2000);

      console.log("Handling cookie banners...");
      await this.handleCookieBanners(page);
      console.log("Cookie banner handling completed");

      // Wait for any delayed scripts
      await setTimeout(2000);

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
}

module.exports = ScriptCounter;
