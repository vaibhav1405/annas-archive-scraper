const path = require("path");
const os = require("os");
const fs = require("fs");
const { connect } = require("puppeteer-real-browser");

/**
 * Anna's Archive Book Scraper
 * A Node.js tool for searching and finding download links from Anna's Archive
 * 
 * @author Your Name
 * @version 1.0.0
 * @license MIT
 */

class AnnasArchiveScraper {
  constructor(options = {}) {
    this.options = {
      headless: options.headless ?? true,
      timeout: options.timeout ?? 30000,
      retryAttempts: options.retryAttempts ?? 3,
      waitTime: options.waitTime ?? 8000,
      ...options
    };
  }

  /**
   * Ensures a directory exists, creates it if it doesn't
   * @param {string} dirPath - Directory path to check/create
   */
  ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Sleep utility function
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} Promise that resolves after specified time
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Sets up browser instance with optimal configuration
   * @returns {Object} Browser and page instances
   */
  async setupBrowser() {
    const userDataDir = path.join(os.tmpdir(), "chrome-user-data-annas");
    this.ensureDirectoryExists(userDataDir);

    const { browser, page } = await connect({
      args: ["--start-maximized", "--no-sandbox", "--disable-setuid-sandbox"],
      turnstile: true,
      headless: this.options.headless,
      customConfig: {},
      connectOption: {
        defaultViewport: null,
      },
      plugins: [require("puppeteer-extra-plugin-click-and-wait")()],
    });

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    await page.setViewport({ width: 1366, height: 768 });

    return { browser, page };
  }

  /**
   * Handles Cloudflare protection if present
   * @param {Object} page - Puppeteer page instance
   */
  async handleCloudflare(page) {
    await this.sleep(this.options.waitTime);
    
    const cloudflareCheck = await page.$(".cf-browser-verification");
    if (cloudflareCheck) {
      console.log("🛡️  Cloudflare challenge detected, waiting for resolution...");
      await this.sleep(10000);
    }
  }

  /**
   * Search for books on Anna's Archive
   * @param {string} query - Search query (book title, author, ISBN, etc.)
   * @returns {Array} Array of book objects with title and MD5 hash
   */
  async searchBooks(query) {
    if (!query || typeof query !== 'string') {
      throw new Error('Query must be a non-empty string');
    }

    let browser;
    try {
      console.log(`🔍 Searching Anna's Archive for: "${query}"`);

      const { browser: realBrowser, page } = await this.setupBrowser();
      browser = realBrowser;

      const searchUrl = `https://annas-archive.org/search?q=${encodeURIComponent(query)}`;
      await page.goto(searchUrl, { 
        waitUntil: "networkidle2", 
        timeout: this.options.timeout 
      });

      await this.handleCloudflare(page);

      // Wait for search results
      await page.waitForSelector('a[href*="/md5/"]', { 
        timeout: this.options.timeout 
      });

      // Extract book information
      const books = await page.$$eval('a[href*="/md5/"]', (anchors) =>
        anchors
          .filter((link) => !link.closest(".header"))
          .map((link) => ({
            title: link.textContent.trim(),
            md5: link.href.replace("https://annas-archive.org/md5/", ""),
            url: link.href
          }))
      );

      // Remove duplicates based on MD5 hash
      const uniqueBooks = new Map();
      books.forEach((book) => {
        if (!uniqueBooks.has(book.md5) || (!uniqueBooks.get(book.md5).title && book.title)) {
          uniqueBooks.set(book.md5, book);
        }
      });

      const results = Array.from(uniqueBooks.values());
      console.log(`✅ Found ${results.length} books`);
      
      return results;

    } catch (error) {
      console.error("❌ Error searching books:", error.message);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Get download link for a specific book using its MD5 hash
   * @param {string} md5Hash - MD5 hash of the book
   * @returns {string|null} Download URL or null if not found
   */
  async getDownloadLink(md5Hash) {
    if (!md5Hash || typeof md5Hash !== 'string') {
      throw new Error('MD5 hash must be a non-empty string');
    }

    let browser;
    try {
      console.log(`📥 Getting download link for: ${md5Hash}`);

      const { browser: realBrowser, page } = await this.setupBrowser();
      browser = realBrowser;

      const bookUrl = `https://annas-archive.org/md5/${md5Hash}`;
      await page.goto(bookUrl, {
        waitUntil: "networkidle2",
        timeout: this.options.timeout,
      });

      await this.handleCloudflare(page);

      // Handle slow download if present
      await this.handleSlowDownload(page);

      // Find download links
      const downloadLink = await this.findDownloadLink(page);
      
      if (downloadLink) {
        console.log("✅ Download link found");
        return downloadLink;
      } else {
        console.log("❌ No download links found");
        return null;
      }

    } catch (error) {
      console.error("❌ Error getting download link:", error.message);
      return null;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Handle slow download process
   * @param {Object} page - Puppeteer page instance
   */
  async handleSlowDownload(page) {
    try {
      await page.waitForSelector('a[href*="/slow_download"]', { timeout: 5000 });
      
      const slowDownloadLink = await page.$('a[href*="/slow_download"]');
      if (slowDownloadLink) {
        console.log("⏳ Slow download detected, processing...");
        await slowDownloadLink.click();
        await this.sleep(5000);

        // Check for wait time
        const waitTime = await page.$eval("body", (el) => {
          const match = el.innerText.match(/Please wait (\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        }).catch(() => 0);

        if (waitTime > 0) {
          console.log(`⏳ Waiting ${waitTime} seconds as required...`);
          await this.sleep((waitTime + 5) * 1000);
        }
      }
    } catch (error) {
      // Slow download selector not found, continue normally
    }
  }

  /**
   * Find available download links on the page
   * @param {Object} page - Puppeteer page instance
   * @returns {string|null} Download URL or null
   */
  async findDownloadLink(page) {
    // Look for direct file download links first
    let downloadLink = await page.$(
      'a[href*=".pdf"], a[href*=".epub"], a[href*=".djvu"], a[href*=".fb2"], a[href*=".mobi"]'
    );

    // If no direct links, look for general download links
    if (!downloadLink) {
      downloadLink = await page.$('a[href*="download"], a[href*="/get/"]');
    }

    if (downloadLink) {
      return await page.evaluate((el) => el.href, downloadLink);
    }

    return null;
  }

  /**
   * Download a book with retry mechanism
   * @param {string} query - Search query or MD5 hash
   * @param {boolean} isHash - Whether the query is an MD5 hash
   * @returns {string|null} Download URL or null if failed
   */
  async downloadBook(query, isHash = false) {
    for (let attempt = 1; attempt <= this.options.retryAttempts; attempt++) {
      console.log(`🔁 Attempt ${attempt}/${this.options.retryAttempts} for: ${query}`);
      
      try {
        let downloadUrl;
        
        if (isHash) {
          downloadUrl = await this.getDownloadLink(query);
        } else {
          // Search for books and try the first result
          const books = await this.searchBooks(query);
          if (books.length > 0) {
            downloadUrl = await this.getDownloadLink(books[0].md5);
          }
        }

        if (downloadUrl) {
          console.log("✅ Download successful");
          return downloadUrl;
        }
        
      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error.message);
      }

      if (attempt < this.options.retryAttempts) {
        console.log("⏳ Retrying in 3 seconds...");
        await this.sleep(3000);
      }
    }

    console.log("❌ All attempts failed");
    return null;
  }
}

// Export for use as module
module.exports = AnnasArchiveScraper;

// CLI usage example
if (require.main === module) {
  async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      console.log(`
📚 Anna's Archive Scraper

Usage:
  node scraper.js "book title or author"
  node scraper.js --hash MD5_HASH_HERE

Examples:
  node scraper.js "The Great Gatsby"
  node scraper.js "George Orwell 1984"
  node scraper.js --hash a1b2c3d4e5f6...

Options:
  --hash    Use MD5 hash instead of search query
  --help    Show this help message
      `);
      process.exit(0);
    }

    if (args[0] === '--help') {
      console.log('Help message shown above');
      process.exit(0);
    }

    const scraper = new AnnasArchiveScraper({
      headless: true,
      retryAttempts: 3
    });

    try {
      if (args[0] === '--hash' && args[1]) {
        // Direct hash lookup
        const downloadUrl = await scraper.downloadBook(args[1], true);
        if (downloadUrl) {
          console.log(`📥 Download URL: ${downloadUrl}`);
        }
      } else {
        // Search and download first result
        const query = args.join(' ');
        const downloadUrl = await scraper.downloadBook(query, false);
        if (downloadUrl) {
          console.log(`📥 Download URL: ${downloadUrl}`);
        }
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }

  main();
}