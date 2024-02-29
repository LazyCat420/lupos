
const WeatherWrapper = {
    async getWeather(lat, lon) {
        const response = await fetch(`https://api.weather.gov/points/${lat},${lon}`, {
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
        return `
            Forecast for ${forecast.properties.periods[0].name} (${forecast.properties.periods[0].startTime} to ${forecast.properties.periods[0].endTime}):
            - Forecast: ${forecast.properties.periods[0].shortForecast}
            - Detailed Forecast: ${forecast.properties.periods[0].detailedForecast}
            - Temperature: ${forecast.properties.periods[0].temperature} ${forecast.properties.periods[0].temperatureUnit} (${forecast.properties.periods[0].temperatureTrend})
            - Wind: ${forecast.properties.periods[0].windSpeed} from the ${forecast.properties.periods[0].windDirection}
            - Chance of Precipitation: ${forecast.properties.periods[0].probabilityOfPrecipitation.value} ${forecast.properties.periods[0].probabilityOfPrecipitation.unitCode}
        `;
    },
};

module.exports = WeatherWrapper;
