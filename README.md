# HumanizeIt — AI Text Humanizer

HumanizeIt is a premium React-based landing page and single-page application that takes robotic AI-generated text, rewrites it to sound 100% human-written using the Groq & Gemini APIs, and provides a simulated AI detection score report (mimicking tools like GPTZero, Turnitin, etc.).

## Prerequisites

Before you begin, ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- npm (comes with Node.js)

## Step-by-Step Setup Guide

### 1. Clone or Download the Repository

Navigate to your desired project folder and open your terminal.

```bash
cd "your/project/folder"
```

### 2. Install Dependencies

Install all the required packages for the React application to run.

```bash
npm install
```

### 3. Configure API Keys

For security, the API keys are not included in the codebase. You need to create an environment variables file to provide them.

1. Create a new file in the root directory named exactly `.env`.
2. Open the `.env.example` file and copy its contents into your new `.env` file.
3. Replace the placeholder values with your actual API keys:

```env
VITE_GROQ_API_KEY=your_actual_groq_api_key_here
VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here
```

*(Note: The `.env` file is included in `.gitignore` so your keys will never be accidentally pushed to GitHub).*

### 4. Start the Development Server

Run the Vite development server to launch the app locally.

```bash
npm run dev
```

### 5. Open the App in Your Browser

Once the server starts, you will see a local URL in your terminal (usually `http://localhost:5173/`). 
Open that URL in your web browser.

### 6. Humanize Text!

1. Paste any AI-generated text (like a ChatGPT response) into the main "AI Text Input" box.
2. Click the **Humanize Text** button.
3. Wait a few seconds for the AI to rewrite the text.
4. Click the **Check for AI** button to generate a detailed AI Detection Report below the text panels.

## Built With
- **React** (via Vite)
- **Vanilla CSS** (Custom glassmorphism & dark theme styling)
- **Groq API** (Llama-3.3-70b-versatile)
- **Google Gemini API** (Gemini 2.0 Flash)
