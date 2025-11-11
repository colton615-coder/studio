import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Explicitly configure Google AI with API key from environment
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    })
  ],
  model: 'googleai/gemini-2.5-flash',
});
