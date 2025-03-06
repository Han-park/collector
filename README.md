# Bookmark Collector

A Next.js application that automatically generates bookmarks from URLs. When a user pastes a link (e.g., a blog article URL), the app automatically extracts information and generates a bookmark with a title, summary, URL, and topic.

## Features

- Paste any URL to create a bookmark
- Automatically extracts and generates:
  - Title
  - Summary
  - Topic category
- Clean and responsive UI
- Bookmark management

## Technologies Used

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- OpenAI API (for generating title, summary, and topic)
- Cheerio (for HTML parsing)
- Axios (for HTTP requests)

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- OpenAI API key

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd bookmark-collector
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

## Usage

1. Enter a URL in the input field and click "Create"
2. The app will fetch the content, analyze it, and generate a bookmark
3. The bookmark will appear in the list below with title, summary, URL, and topic

## How It Works

1. When a URL is submitted, the app sends a request to the API endpoint
2. The API fetches the HTML content using Axios
3. Cheerio parses the HTML to extract metadata
4. OpenAI API generates a title, summary, and topic based on the content
5. The bookmark is created and displayed in the UI

## License

This project is licensed under the MIT License - see the LICENSE file for details.
