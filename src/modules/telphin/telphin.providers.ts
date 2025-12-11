import axios from 'axios';

export const telphinProviders = [
  {
    provide: 'TelphinApiProvider',
    useValue: axios.create({}),
  },
];
