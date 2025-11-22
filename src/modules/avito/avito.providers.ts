import axios from 'axios';

export const avitoProviders = [
  {
    provide: 'AvitoApiService',
    useValue: axios.create({}),
  },
];
