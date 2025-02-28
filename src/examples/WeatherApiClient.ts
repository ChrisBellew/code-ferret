/**
 * Weather API Client
 * 
 * Fetches weather data from various weather service providers.
 */

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface WeatherCondition {
  code: number;
  main: string;
  description: string;
  icon: string;
}

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  cloudiness: number;
  visibility: number;
  conditions: WeatherCondition[];
  timestamp: Date;
}

export interface DailyForecast {
  date: Date;
  sunrise: Date;
  sunset: Date;
  temperatureMin: number;
  temperatureMax: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  cloudiness: number;
  precipitation: number;
  precipitationProbability: number;
  conditions: WeatherCondition[];
}

export interface HourlyForecast {
  time: Date;
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  cloudiness: number;
  visibility: number;
  precipitation: number;
  precipitationProbability: number;
  conditions: WeatherCondition[];
}

export interface WeatherAlert {
  senderName: string;
  event: string;
  start: Date;
  end: Date;
  description: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
}

export interface WeatherForecast {
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  alerts?: WeatherAlert[];
}

export interface WeatherApiConfig {
  apiKey: string;
  units?: 'metric' | 'imperial';
  language?: string;
}

export interface WeatherApiClient {
  getCurrentWeather(location: string | GeoCoordinates): Promise<CurrentWeather>;
  getForecast(location: string | GeoCoordinates, days?: number): Promise<WeatherForecast>;
  getHistoricalWeather(location: string | GeoCoordinates, date: Date): Promise<CurrentWeather>;
  getWeatherAlerts(location: string | GeoCoordinates): Promise<WeatherAlert[]>;
}

export class OpenWeatherMapClient implements WeatherApiClient {
  private apiKey: string;
  private units: 'metric' | 'imperial';
  private language: string;
  private baseUrl = 'https://api.openweathermap.org/data/2.5';
  
  constructor(config: WeatherApiConfig) {
    this.apiKey = config.apiKey;
    this.units = config.units || 'metric';
    this.language = config.language || 'en';
  }
  
  async getCurrentWeather(location: string | GeoCoordinates): Promise<CurrentWeather> {
    console.log(`Fetching current weather for ${this.formatLocation(location)}`);
    
    // In a real implementation, this would make an API request
    // to OpenWeatherMap's current weather endpoint
    
    return {
      temperature: 22.5,
      feelsLike: 23.2,
      humidity: 65,
      pressure: 1012,
      windSpeed: 5.2,
      windDirection: 180,
      cloudiness: 40,
      visibility: 10000,
      conditions: [
        {
          code: 801,
          main: 'Clouds',
          description: 'few clouds',
          icon: '02d'
        }
      ],
      timestamp: new Date()
    };
  }
  
  async getForecast(location: string | GeoCoordinates, days: number = 7): Promise<WeatherForecast> {
    console.log(`Fetching ${days}-day forecast for ${this.formatLocation(location)}`);
    
    // In a real implementation, this would make an API request
    // to OpenWeatherMap's one-call API endpoint
    
    const current = await this.getCurrentWeather(location);
    
    const hourly: HourlyForecast[] = Array.from({ length: 48 }, (_, i) => {
      const time = new Date();
      time.setHours(time.getHours() + i);
      
      return {
        time,
        temperature: 20 + Math.sin(i / 8) * 5, // Simulate temperature variation
        feelsLike: 21 + Math.sin(i / 8) * 5,
        humidity: 60 + Math.sin(i / 12) * 10,
        pressure: 1010 + Math.sin(i / 24) * 5,
        windSpeed: 5 + Math.sin(i / 6) * 2,
        windDirection: (180 + i * 10) % 360,
        cloudiness: 30 + Math.sin(i / 12) * 20,
        visibility: 10000,
        precipitation: Math.max(0, Math.sin(i / 8) * 2),
        precipitationProbability: Math.max(0, Math.sin(i / 8) * 0.5),
        conditions: [
          {
            code: 801,
            main: 'Clouds',
            description: 'few clouds',
            icon: '02d'
          }
        ]
      };
    });
    
    const daily: DailyForecast[] = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      const sunrise = new Date(date);
      sunrise.setHours(6, 30, 0, 0);
      
      const sunset = new Date(date);
      sunset.setHours(19, 30, 0, 0);
      
      return {
        date,
        sunrise,
        sunset,
        temperatureMin: 18 + Math.sin(i / 3) * 3,
        temperatureMax: 25 + Math.sin(i / 3) * 3,
        humidity: 65 + Math.sin(i / 4) * 10,
        pressure: 1012 + Math.sin(i / 5) * 5,
        windSpeed: 5 + Math.sin(i / 2) * 2,
        windDirection: (180 + i * 20) % 360,
        cloudiness: 40 + Math.sin(i / 3) * 20,
        precipitation: Math.max(0, Math.sin(i / 2) * 5),
        precipitationProbability: Math.max(0, Math.sin(i / 2) * 0.4),
        conditions: [
          {
            code: 801,
            main: 'Clouds',
            description: 'few clouds',
            icon: '02d'
          }
        ]
      };
    });
    
    return {
      current,
      hourly,
      daily
    };
  }
  
  async getHistoricalWeather(location: string | GeoCoordinates, date: Date): Promise<CurrentWeather> {
    console.log(`Fetching historical weather for ${this.formatLocation(location)} on ${date.toISOString().split('T')[0]}`);
    
    // In a real implementation, this would make an API request
    // to OpenWeatherMap's historical weather endpoint
    
    return {
      temperature: 21.5,
      feelsLike: 22.2,
      humidity: 68,
      pressure: 1010,
      windSpeed: 4.8,
      windDirection: 200,
      cloudiness: 35,
      visibility: 9000,
      conditions: [
        {
          code: 801,
          main: 'Clouds',
          description: 'few clouds',
          icon: '02d'
        }
      ],
      timestamp: date
    };
  }
  
  async getWeatherAlerts(location: string | GeoCoordinates): Promise<WeatherAlert[]> {
    console.log(`Fetching weather alerts for ${this.formatLocation(location)}`);
    
    // In a real implementation, this would make an API request
    // to OpenWeatherMap's one-call API endpoint and extract alerts
    
    return [];
  }
  
  private formatLocation(location: string | GeoCoordinates): string {
    if (typeof location === 'string') {
      return location;
    }
    return `${location.latitude},${location.longitude}`;
  }
}

export class WeatherApiService implements WeatherApiClient {
  private apiKey: string;
  private units: 'metric' | 'imperial';
  private language: string;
  private baseUrl = 'https://api.weatherapi.com/v1';
  
  constructor(config: WeatherApiConfig) {
    this.apiKey = config.apiKey;
    this.units = config.units || 'metric';
    this.language = config.language || 'en';
  }
  
  async getCurrentWeather(location: string | GeoCoordinates): Promise<CurrentWeather> {
    console.log(`Fetching current weather for ${this.formatLocation(location)}`);
    
    // In a real implementation, this would make an API request
    // to WeatherAPI's current weather endpoint
    
    return {
      temperature: 22.0,
      feelsLike: 22.8,
      humidity: 62,
      pressure: 1015,
      windSpeed: 4.8,
      windDirection: 170,
      cloudiness: 35,
      visibility: 10000,
      conditions: [
        {
          code: 1003,
          main: 'Partly cloudy',
          description: 'partly cloudy',
          icon: 'partly-cloudy'
        }
      ],
      timestamp: new Date()
    };
  }
  
  async getForecast(location: string | GeoCoordinates, days: number = 7): Promise<WeatherForecast> {
    console.log(`Fetching ${days}-day forecast for ${this.formatLocation(location)}`);
    
    // In a real implementation, this would make an API request
    // to WeatherAPI's forecast endpoint
    
    const current = await this.getCurrentWeather(location);
    
    const hourly: HourlyForecast[] = Array.from({ length: 48 }, (_, i) => {
      const time = new Date();
      time.setHours(time.getHours() + i);
      
      return {
        time,
        temperature: 20 + Math.sin(i / 8) * 5, // Simulate temperature variation
        feelsLike: 21 + Math.sin(i / 8) * 5,
        humidity: 60 + Math.sin(i / 12) * 10,
        pressure: 1010 + Math.sin(i / 24) * 5,
        windSpeed: 5 + Math.sin(i / 6) * 2,
        windDirection: (180 + i * 10) % 360,
        cloudiness: 30 + Math.sin(i / 12) * 20,
        visibility: 10000,
        precipitation: Math.max(0, Math.sin(i / 8) * 2),
        precipitationProbability: Math.max(0, Math.sin(i / 8) * 0.5),
        conditions: [
          {
            code: 1003,
            main: 'Partly cloudy',
            description: 'partly cloudy',
            icon: 'partly-cloudy'
          }
        ]
      };
    });
    
    const daily: DailyForecast[] = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      const sunrise = new Date(date);
      sunrise.setHours(6, 30, 0, 0);
      
      const sunset = new Date(date);
      sunset.setHours(19, 30, 0, 0);
      
      return {
        date,
        sunrise,
        sunset,
        temperatureMin: 18 + Math.sin(i / 3) * 3,
        temperatureMax: 25 + Math.sin(i / 3) * 3,
        humidity: 65 + Math.sin(i / 4) * 10,
        pressure: 1012 + Math.sin(i / 5) * 5,
        windSpeed: 5 + Math.sin(i / 2) * 2,
        windDirection: (180 + i * 20) % 360,
        cloudiness: 40 + Math.sin(i / 3) * 20,
        precipitation: Math.max(0, Math.sin(i / 2) * 5),
        precipitationProbability: Math.max(0, Math.sin(i / 2) * 0.4),
        conditions: [
          {
            code: 1003,
            main: 'Partly cloudy',
            description: 'partly cloudy',
            icon: 'partly-cloudy'
          }
        ]
      };
    });
    
    return {
      current,
      hourly,
      daily
    };
  }
  
  async getHistoricalWeather(location: string | GeoCoordinates, date: Date): Promise<CurrentWeather> {
    console.log(`Fetching historical weather for ${this.formatLocation(location)} on ${date.toISOString().split('T')[0]}`);
    
    // In a real implementation, this would make an API request
    // to WeatherAPI's history endpoint
    
    return {
      temperature: 21.0,
      feelsLike: 21.5,
      humidity: 70,
      pressure: 1012,
      windSpeed: 4.5,
      windDirection: 190,
      cloudiness: 40,
      visibility: 9500,
      conditions: [
        {
          code: 1003,
          main: 'Partly cloudy',
          description: 'partly cloudy',
          icon: 'partly-cloudy'
        }
      ],
      timestamp: date
    };
  }
  
  async getWeatherAlerts(location: string | GeoCoordinates): Promise<WeatherAlert[]> {
    console.log(`Fetching weather alerts for ${this.formatLocation(location)}`);
    
    // In a real implementation, this would make an API request
    // to WeatherAPI's forecast endpoint and extract alerts
    
    return [];
  }
  
  private formatLocation(location: string | GeoCoordinates): string {
    if (typeof location === 'string') {
      return location;
    }
    return `${location.latitude},${location.longitude}`;
  }
}

export function createWeatherClient(provider: 'openweathermap' | 'weatherapi', config: WeatherApiConfig): WeatherApiClient {
  switch (provider) {
    case 'openweathermap':
      return new OpenWeatherMapClient(config);
    case 'weatherapi':
      return new WeatherApiService(config);
    default:
      throw new Error(`Unsupported weather provider: ${provider}`);
  }
}
