import express from 'express';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import cors from 'cors';
import axios from 'axios';
import { dates } from './utils/dates.js'

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:8080', // Allow frontend running on port 8080
}));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


app.get('/fetch-stock-data', async (req, res) => {
    const { ticker } = req.query;
  
    const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${dates.startDate}/${dates.endDate}?apiKey=${process.env.POLYGON_API_KEY}`;
  
    console.log('Fetching data from URL:', url);    

    try {
        const response = await axios.get(url);
        console.log('Response data:', response);    



        // Check if the response is successful
        if (response.status === 200) {
            const stockPerformance = response.data.results.map((day) => ({
                date: new Date(day.t).toISOString().split("T")[0], // Assuming 't' holds a timestamp
                open: day.o,    // Opening price
                close: day.c,   // Closing price
                high: day.h,    // Highest price
                low: day.l,     // Lowest price
                volume: day.v   // Volume traded (if available)
            }));
            res.json(stockPerformance); // Send data to the frontend
            // res.json(response.data); // Send data to the frontend

        } else {
            res.status(500).send('Error fetching stock data');
        }
    } catch (err) {
        console.error('Error fetching stock data:', err);
        res.status(500).send('Error fetching stock data');
    }
});


app.post('/generate-report', async (req, res) => {
    const data = req.body.data;

    // Format data into readable text for OpenAI
    const formattedData = data.map((stock) => {
        if (stock.error) {
            return `Ticker ${stock.ticker}: Error fetching data.`;
        }
        const stockEntries = stock.data.map((entry) => {
            return `Date: ${entry.date}, Open: ${entry.open}, Close: ${entry.close}, High: ${entry.high}, Low: ${entry.low}, Volume: ${entry.volume}`;
        });
        return `Ticker ${stock.ticker}:\n${stockEntries.join('\n')}`;
    }).join('\n\n');

    console.log('Formatted data for OpenAI:', formattedData);

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content:
                        'You are a trading guru. Given data on share prices over the past 3 days, write a report of no more than 150 words describing the stock’s performance and recommending whether to buy, hold, or sell. Write the name of the given stock(s) in the response.',
                },
                {
                    role: 'user',
                    content: formattedData,
                },
            ],
        });

        res.json({ report: response.choices[0].message.content });
    } catch (err) {
        console.error('Error generating report:', err);
        res.status(500).json({ error: 'Error generating report' });
    }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
