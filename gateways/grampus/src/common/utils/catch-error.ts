import { isAxiosError } from 'axios';
import { HttpException } from '@nestjs/common';

export const maybeCatchError = (error: any) => {
  let errorData: any;

  if (
    typeof error == 'object' &&
    'error' in error &&
    'type' in error.error &&
    error.error.type == 'rpc'
  ) {
    errorData = error.error;
  } else if (error instanceof HttpException) {
    errorData = error.getResponse();
  } else if (isAxiosError(error) && error.response?.data) {
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
