require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 3006; // Changed default port to 3005

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Mock transcript data
const mockTranscript = {
  symbol: 'MOCK',
  date: new Date().toISOString(),
  content: `
This is a mock earnings call transcript for demonstration purposes.
Our company, MOCK Corp, had a strong quarter with revenue growth of 15% year-over-year.
We're excited about our new product launches and expect continued growth in the coming quarters.
Our CEO, John Doe, commented: "We're pleased with our performance and look forward to executing on our strategic initiatives."
  `.trim()
};

// Transcript route
app.get('/api/transcript', async (req, res) => {
  const { ticker, year, quarter } = req.query;

  if (!ticker) {
    return res.status(400).json({ error: 'Ticker symbol is required' });
  }

  console.log(`Fetching mock transcript for ${ticker}, year: ${year}, quarter: ${quarter}`);
  
  // Return mock transcript data
  res.json([{...mockTranscript, symbol: ticker.toUpperCase()}]);
});

// Summarize route
app.post('/api/summarize', async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required for summarization' });
    }

    console.log('Attempting to summarize content of length:', content.length);

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {"role": "system", "content": "You are a helpful assistant that summarizes earnings call transcripts."},
        {"role": "user", "content": `Please summarize the following earnings call transcript in a concise manner, highlighting key financial results, future outlook, and any significant announcements:\n\n${content}`}
      ],
      max_tokens: 500,
    });

    const summary = completion.choices[0].message.content;
    console.log('Summary generated successfully');

    res.json({ summary });
  } catch (error) {
    console.error('Error in summarize API:', error);
    res.status(500).json({ error: `Failed to summarize transcript: ${error.message}` });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});