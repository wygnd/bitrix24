import axios from 'axios';

export const urlToBase64 = async (url: string) => {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
  });

  return Buffer.from(response.data).toString('base64');
};
