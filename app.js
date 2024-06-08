const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 3000;
const WINDOW_SIZE = 10;
const TEST_SERVER_URL = "http://testserver.com/numbers";
const QUALIFIED_IDS = new Set(['p', 'f', 'e', 'r']);
let numbersWindow = [];
let lock = false;
async function fetchNumber(idType) {
    try {
        const response = await axios.get(`${TEST_SERVER_URL}/${idType}`, { timeout: 500 });
        return response.data.number;
    } catch (error) {
        return null;
    }
}

app.get('/numbers/:idType', async (req, res) => {
    const idType = req.params.idType;

    if (!QUALIFIED_IDS.has(idType)) {
        return res.status(400).json({ error: "Invalid ID type" });
    }

    if (lock) {
        return res.status(429).json({ error: "Too Many Requests" });
    }

    lock = true;

    const newNumber = await fetchNumber(idType);

    let previousWindow;
    let currentWindow;

    if (newNumber !== null && !numbersWindow.includes(newNumber)) {
        previousWindow = [...numbersWindow];
        if (numbersWindow.length >= WINDOW_SIZE) {
            numbersWindow.shift();
        }
        numbersWindow.push(newNumber);
        currentWindow = [...numbersWindow];
    } else {
        previousWindow = [...numbersWindow];
        currentWindow = [...numbersWindow];
    }

    const average = currentWindow.length > 0 ? currentWindow.reduce((a, b) => a + b, 0) / currentWindow.length : 0;

    lock = false;

    res.json({
        new_number: newNumber,
        previous_window: previousWindow,
        current_window: currentWindow,
        average: average
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
