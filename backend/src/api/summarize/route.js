const express = require('express');
const OpenAI = require('openai');

const router = express.Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post('/summarize', async (req, res) => {
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

module.exports = router;