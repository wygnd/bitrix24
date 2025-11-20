import { WikiConfig } from '@/common/interfaces/wiki-config.interface';

export default (): { wikiConfig: WikiConfig } => ({
  wikiConfig: {
    baseApiUrl: process.env.WIKI_BASE_API_URL ?? '',
    baseApiUrlOld: process.env.WIKI_BASE_API_OLD ?? '',
  },
});
