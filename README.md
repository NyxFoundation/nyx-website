# Nyx Website

The official website for Nyx Foundation.

## Prerequisites

- Node.js 18+
- npm or yarn

## Setup

1.  Clone the repository:
    ```bash
    git clone https://github.com/NyxFoundation/nyx-website.git
    cd nyx-website
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up environment variables:
    -   Copy `.env.example` to `.env` (if available) or create `.env` with necessary keys:
        -   `NOTION_TOKEN`
        -   `NOTION_DONATIONS_DATABASE_ID`
        -   `DISCORD_WEBHOOK_URL`

4.  Run the development server:
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
