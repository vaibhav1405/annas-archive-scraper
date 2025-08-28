# 📚 Anna's Archive Scraper

A powerful Node.js tool for searching and downloading books from Anna's Archive with built-in Cloudflare bypass capabilities.

[![npm version](https://badge.fury.io/js/anna-archieve.svg)](https://badge.fury.io/js/anna-archieve)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org/)

## ✨ Features

- 🔍 **Smart Search**: Search by book title, author, ISBN, or any keyword
- 📥 **Direct Downloads**: Get direct download links for books in various formats (PDF, EPUB, DJVU, FB2, MOBI)
- 🛡️ **Cloudflare Bypass**: Automatically handles Cloudflare protection
- 🔄 **Retry Mechanism**: Built-in retry logic for reliable downloads
- 🎯 **MD5 Hash Support**: Direct access using MD5 hashes
- 📱 **CLI Interface**: Easy-to-use command line interface
- 🔧 **Programmatic API**: Use as a module in your own projects
- ⚡ **Optimized Performance**: Efficient scraping with minimal resource usage

## 🚀 Quick Start

### Installation

```bash
# Install globally for CLI usage
npm install -g anna-archieve

# Or install locally for your project
npm install anna-archieve
```

### Basic Usage

```bash
# Search and download the first result
anna-archieve "The Great Gatsby"

# Search by author and title
anna-archieve "George Orwell 1984"

# Direct download using MD5 hash
anna-archieve --hash a1b2c3d4e5f6789...

# Get help
anna-archieve --help
```

## 📖 Detailed Usage

### Command Line Interface

```bash
# Basic search
node scraper.js "book title or author name"

# Examples
node scraper.js "The Catcher in the Rye"
node scraper.js "Stephen King"
node scraper.js "978-0134685991"  # ISBN search

# Direct hash lookup
node scraper.js --hash MD5_HASH_HERE

# Display help
node scraper.js --help
```

### Programmatic Usage

```javascript
const AnnasArchiveScraper = require('anna-archieve');

// Initialize scraper
const scraper = new AnnasArchiveScraper({
  headless: true,        // Run in headless mode
  timeout: 30000,        // Request timeout in ms
  retryAttempts: 3,      // Number of retry attempts
  waitTime: 8000         // Wait time for Cloudflare
});

// Search for books
async function searchBooks() {
  try {
    const books = await scraper.searchBooks('The Great Gatsby');
    console.log('Found books:', books);
    
    // books array contains:
    // [
    //   {
    //     title: "The Great Gatsby",
    //     md5: "a1b2c3d4e5f6...",
    //     url: "https://annas-archive.org/md5/a1b2c3d4e5f6..."
    //   }
    // ]
  } catch (error) {
    console.error('Search failed:', error);
  }
}

// Get download link
async function getDownloadLink() {
  try {
    const downloadUrl = await scraper.getDownloadLink('MD5_HASH_HERE');
    if (downloadUrl) {
      console.log('Download URL:', downloadUrl);
    }
  } catch (error) {
    console.error('Download failed:', error);
  }
}

// Search and download in one step
async function downloadBook() {
  try {
    const downloadUrl = await scraper.downloadBook('The Great Gatsby');
    if (downloadUrl) {
      console.log('Ready to download:', downloadUrl);
    }
  } catch (error) {
    console.error('Download failed:', error);
  }
}
```

## 🔧 Configuration Options

When initializing the scraper, you can pass various options:

```javascript
const scraper = new AnnasArchiveScraper({
  headless: true,          // Run browser in headless mode (default: true)
  timeout: 30000,          // Page load timeout in milliseconds (default: 30000)
  retryAttempts: 3,        // Number of retry attempts (default: 3)
  waitTime: 8000,          // Wait time for Cloudflare bypass (default: 8000)
});
```

## 📚 API Reference

### Class: AnnasArchiveScraper

#### Constructor

```javascript
new AnnasArchiveScraper(options)
```

**Parameters:**
- `options` (Object, optional): Configuration options

#### Methods

##### searchBooks(query)

Search for books on Anna's Archive.

**Parameters:**
- `query` (string): Search query (title, author, ISBN, etc.)

**Returns:** Promise<Array> - Array of book objects

**Example:**
```javascript
const books = await scraper.searchBooks('Machine Learning');
```

##### getDownloadLink(md5Hash)

Get download link for a specific book using its MD5 hash.

**Parameters:**
- `md5Hash` (string): MD5 hash of the book

**Returns:** Promise<string|null> - Download URL or null if not found

**Example:**
```javascript
const url = await scraper.getDownloadLink('a1b2c3d4e5f6...');
```

##### downloadBook(query, isHash)

Download a book with built-in retry mechanism.

**Parameters:**
- `query` (string): Search query or MD5 hash
- `isHash` (boolean, optional): Whether query is an MD5 hash (default: false)

**Returns:** Promise<string|null> - Download URL or null if failed

**Example:**
```javascript
// Search and download
const url = await scraper.downloadBook('The Art of War');

// Direct hash download
const url = await scraper.downloadBook('a1b2c3d4e5f6...', true);
```

## 🛠️ Development

### Prerequisites

- Node.js >= 14.0.0
- npm >= 6.0.0

### Setup

```bash
# Clone the repository
git clone https://github.com/vaibhav1405/anna-archieve.git
cd anna-archieve

# Install dependencies
npm install

# Run the scraper
npm start "your search query"
```

### Available Scripts

```bash
npm run start          # Run the scraper
npm run dev           # Run with nodemon for development
npm run lint          # Fix linting issues
npm run lint:check    # Check for linting issues
npm run example       # Run example search
npm run help          # Show help message
npm run clean         # Clean and reinstall dependencies
```

### Project Structure

```
anna-archieve/
├── scraper.js          # Main scraper class and CLI
├── package.json        # Package configuration
├── README.md          # This file
├── LICENSE            # License file
└── node_modules/      # Dependencies
```

## 🚨 Important Notes

### Legal Disclaimer

This tool is for educational purposes only. Users are responsible for:
- Complying with their local laws and regulations
- Respecting copyright and intellectual property rights
- Using the tool ethically and responsibly

### Rate Limiting

- The scraper includes built-in delays to avoid overwhelming servers
- Cloudflare protection may cause additional delays
- Be respectful of the service and avoid excessive requests

### Troubleshooting

#### Common Issues

1. **Cloudflare blocks requests**
   - The scraper handles this automatically
   - If issues persist, try increasing `waitTime` option

2. **Timeout errors**
   - Increase the `timeout` option
   - Check your internet connection

3. **No download links found**
   - Try different search terms
   - Some books may not have available downloads
   - Verify the book exists on Anna's Archive

4. **Installation issues**
   - Ensure Node.js >= 14.0.0 is installed
   - Try clearing npm cache: `npm cache clean --force`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Ensure linting passes: `npm run lint:check`
6. Submit a pull request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Puppeteer](https://pptr.dev/) for web automation
- [puppeteer-real-browser](https://github.com/zfcsoftware/puppeteer-real-browser) for Cloudflare bypass
- Anna's Archive for providing free access to books

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/vaibhav1405/anna-archieve/issues) page
2. Create a new issue if your problem isn't already reported
3. Provide detailed information about the error and your environment

## 🔗 Links

- [GitHub Repository](https://github.com/vaibhav1405/anna-archieve)
- [npm Package](https://www.npmjs.com/package/anna-archieve)
- [Issues & Bug Reports](https://github.com/vaibhav1405/anna-archieve/issues)

---

⭐ If you find this tool useful, please consider giving it a star on GitHub!