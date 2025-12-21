const https = require('https');

const APP_ID = '0e37a910';
const APP_KEY = '10bbef625e69a25d01c36140abcd545f';
const url = `https://api.edamam.com/api/recipes/v2?type=public&q=chicken&app_id=${APP_ID}&app_key=${APP_KEY}`;

console.log('Fetching:', url);

https.get(url, (res) => {
    let data = '';
    console.log('Status Code:', res.statusCode);

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('Count:', json.count);
            if (json.hits && json.hits.length > 0) {
                console.log('First Hit Label:', json.hits[0].recipe.label);
            } else {
                console.log('No hits found. Full response:', data.substring(0, 200));
            }
        } catch (e) {
            console.error('Error parsing JSON:', e.message);
            console.log('Raw Data:', data.substring(0, 500));
        }
    });

}).on('error', (err) => {
    console.error('Error:', err.message);
});
