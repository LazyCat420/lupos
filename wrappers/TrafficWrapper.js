
const WeatherWrapper = {
    async getWeather(lat, lon) {
        const response = await fetch(`https://newsapi.org/v2/everything?q=tesla&from=2024-02-01&sortBy=publishedAt&apiKey=5455f4ce20144616adcae23b474c75d3`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        }).catch(error => console.error('Error:', error));

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    },
    async getForecast(url) {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        }).catch(error => console.error('Error:', error));

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    },
    async getWeatherandForcast (lat, lon) {
        const weatherData = await this.getWeather(lat, lon);
        const forecastData = await this.getForecast(weatherData.properties.forecast);
        return this.formatForecast(forecastData);
    }, 
    
    formatForecast(forecast) {
        let formattedForecast = '';
        for (let i = 0; i < forecast.properties.periods.length; i++) {
            const period = forecast.properties.periods[i];
            formattedForecast += `
                Weather for ${period.name} (${period.startTime} to ${period.endTime}):
                - Detailed Forecast: ${period.detailedForecast}
            `;
        }
        return formattedForecast;
    },
};

module.exports = WeatherWrapper;
