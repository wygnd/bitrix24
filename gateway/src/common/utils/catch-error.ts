import { isAxiosError } from 'axios';

export const maybeCatchError = (error: any) => {
  let errorData: any;

  if (isAxiosError(error) && error.response?.data) {
    errorData = error.response.data;
  } else if (isAxiosError(error)) {
    errorData = error.response;
  } else if (error instanceof Error) {
    errorData = error.message;
  } else {
    errorData = 'Непредвиденная ошибка';
  }

  return errorData;
};
