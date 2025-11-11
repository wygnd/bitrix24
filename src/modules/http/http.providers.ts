import axios from 'axios';

export const httpProviders = [
  {
    provide: 'AppHttpApiService',
    useValue: axios.create({}),
  },
];
