const tickersArr = []

const generateReportBtn = document.querySelector('.generate-report-btn')

generateReportBtn.addEventListener('click', fetchStockData)

document.getElementById('ticker-input-form').addEventListener('submit', (e) => {
    e.preventDefault()
    const tickerInput = document.getElementById('ticker-input')
    if (tickerInput.value.length > 2) {
        generateReportBtn.disabled = false
        const newTickerStr = tickerInput.value
        tickersArr.push(newTickerStr.toUpperCase())
        tickerInput.value = ''
        renderTickers()
    } else {
        const label = document.getElementsByTagName('label')[0]
        label.style.color = 'red'
        label.textContent = 'You must add at least one ticker. A ticker is a 3 letter or more code for a stock. E.g TSLA for Tesla.'
    }
})

function renderTickers() {
    const tickersDiv = document.querySelector('.ticker-choice-display')
    tickersDiv.innerHTML = ''
    tickersArr.forEach((ticker) => {
        const newTickerSpan = document.createElement('span')
        newTickerSpan.textContent = ticker
        newTickerSpan.classList.add('ticker')
        tickersDiv.appendChild(newTickerSpan)
    })
}

const loadingArea = document.querySelector('.loading-panel')
const apiMessage = document.getElementById('api-message')

async function fetchStockData() {
    document.querySelector('.action-panel').style.display = 'none';
    loadingArea.style.display = 'flex';
    try {
        const stockData = await Promise.all(
            tickersArr.map(async (ticker) => {
            const url = `http://localhost:5000/fetch-stock-data?ticker=${ticker}`;
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                apiMessage.innerHTML = 'Creating report...'
                return {ticker, data};
            } else {
                console.error(`Error fetching data for ${ticker}`);
                loadingArea.innerText = 'There was an error fetching stock data.'
                return {ticker, error: 'Error fetching data;' };
            }
            })
        );
        fetchReport(stockData);
    } catch (err) {
        loadingArea.innerText = 'There was an error fetching stock data.';
        console.error('error: ', err);
    }
  }

async function fetchReport(stockData) {
    console.log('Stock data to send:', stockData);
    try {
        const response = await fetch('http://localhost:5000/generate-report', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: stockData }),
        });
    
        const result = await response.json();
        if (response.ok) {
            renderReport(result.report);
        } else {
            console.error(result.error);
            loadingArea.innerText = 'Unable to access AI. Please refresh and try again.';
        }
        } catch (err) {
        console.error('Error:', err);
        loadingArea.innerText = 'Unable to access AI. Please refresh and try again.';
        }
  }

function renderReport(output) {
    loadingArea.style.display = 'none'
    const outputArea = document.querySelector('.output-panel')
    const report = document.createElement('p')
    outputArea.appendChild(report)
    report.textContent = output
    outputArea.style.display = 'flex'
}