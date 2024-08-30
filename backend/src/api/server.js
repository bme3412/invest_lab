require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const FMP_API_KEY = process.env.FMP_API_KEY;

// Transcript route
app.get('/api/transcript', async (req, res) => {
  const { ticker, year, quarter } = req.query;

  if (!ticker) {
    return res.status(400).json({ error: 'Ticker symbol is required' });
  }

  try {
    console.log(`Fetching transcript for ${ticker}, year: ${year}, quarter: ${quarter}`);
    
    let url = `https://financialmodelingprep.com/api/v3/earning_call_transcript/${ticker}?apikey=${FMP_API_KEY}`;
    if (year) url += `&year=${year}`;
    if (quarter) url += `&quarter=${quarter}`;

    const response = await axios.get(url);
    
    if (response.data && response.data.length > 0) {
      res.json(response.data);
    } else {
      res.status(404).json({ error: 'No transcript found for the given parameters' });
    }
  } catch (error) {
    console.error('Error fetching transcript from FMP:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to fetch transcript from FMP API' });
  }
});

// Helper function to split text into chunks
function splitTextIntoChunks(text, maxLength = 4000) {
    const chunks = [];
    let currentChunk = '';
  
    text.split('\n').forEach(line => {
      if (currentChunk.length + line.length > maxLength) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
      currentChunk += line + '\n';
    });
  
    if (currentChunk) {
      chunks.push(currentChunk);
    }
  
    return chunks;
  }
  
  // Modified Summarize route
  app.post('/api/summarize', async (req, res) => {
    try {
      const { content } = req.body;
  
      if (!content) {
        return res.status(400).json({ error: 'Content is required for summarization' });
      }
  
      console.log('Attempting to summarize content of length:', content.length);
  
      const chunks = splitTextIntoChunks(content);
      let fullSummary = '';
  
      for (const chunk of chunks) {
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              "role": "system",
              "content": "You are a helpful assistant that summarizes earnings call transcripts. Provide summaries in a clear, structured format focusing on key sections and speakers."
            },
            {
              "role": "user",
              "content": `Please summarize the following part of an earnings call transcript in a structured format. Identify the speakers and organize the information into the following sections:
  
  1. CEO's Statement
     - Key points from the CEO's speech
     - Strategic initiatives mentioned
     - Overall company performance highlights
  
  2. CFO's Statement
     - Financial highlights
     - Revenue and profit figures
     - Guidance for upcoming quarters/year
  
  3. Q&A Session
     Create an HTML table with the following columns:
     <table>
       <tr>
         <th>Questioner</th>
         <th>Question Summary</th>
         <th>Respondent</th>
         <th>Response Summary</th>
       </tr>
     </table>
  
     Ensure the table is properly formatted in HTML. For example:
  
     <table>
       <tr>
         <th>Questioner</th>
         <th>Question Summary</th>
         <th>Respondent</th>
         <th>Response Summary</th>
       </tr>
       <tr>
         <td>John Doe</td>
         <td>Asked about Q2 outlook</td>
         <td>Jane Smith</td>
         <td>Provided positive outlook, expect 5% growth</td>
       </tr>
     </table>
  
  Ignore any content from the operator as it's typically not relevant to the summary.
  
  For the CEO and CFO sections:
  - Use <h2> tags for headers (e.g., <h2>CEO's Statement</h2>)
  - Use <ul> and <li> tags for bullet points
  - Use nested <ul> and <li> tags for sub-bullets
  - Ensure each section is separated by a <br> tag
  
  For the Q&A table, summarize each question and response briefly, ensuring the table is properly formatted in HTML.
  
  Here's the transcript chunk to summarize:
  
  ${chunk}`
            }
          ],
          max_tokens: 1500,
        });
  
        fullSummary += completion.choices[0].message.content + '\n\n';
      }
  
      console.log('Summary generated successfully');
  
      res.json({ summary: fullSummary });
    } catch (error) {
      console.error('Error in summarize API:', error);
      res.status(500).json({ error: `Failed to summarize transcript: ${error.message}` });
    }
  });
  
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });