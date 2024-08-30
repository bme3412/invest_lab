const axios = require('axios');

class FMPApiClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://financialmodelingprep.com/api/v3';
  }

  async getTranscript(symbol, year, quarter) {
    try {
      let url = `${this.baseUrl}/earning_call_transcript/${symbol}?apikey=${this.apiKey}`;
      if (year) url += `&year=${year}`;
      if (quarter) url += `&quarter=${quarter}`;
      
      console.log(`Requesting transcript from: ${url}`);
      const response = await axios.get(url);
      console.log('FMP API Response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error('Error fetching transcript from FMP:', error.response ? error.response.data : error.message);
      throw error;
    }
  }
}

module.exports = FMPApiClient;