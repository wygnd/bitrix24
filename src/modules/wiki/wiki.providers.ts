import axios from 'axios';

export const wikiProviders = [
  {
    provide: 'WikiApiService',
    useValue: axios.create({}),
  },
];
