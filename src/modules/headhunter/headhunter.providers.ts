import axios from 'axios';

export const headHunterProviders = [
  {
    provide: 'HeadHunterApiService',
    useValue: axios.create({}),
  },
];
