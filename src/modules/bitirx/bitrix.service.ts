import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { REDIS_CLIENT, REDIS_KEYS } from '../redis/redis.constants';
import {
  BitrixOauthResponse,
  BitrixTokens,
} from './interfaces/bitrix-auth.interface';
import {
  BitrixConfig,
  BitrixConstants,
} from '@/common/interfaces/bitrix-config.interface';
import {
  B24BatchResponseMap,
  B24SuccessResponse,
} from './interfaces/bitrix-api.interface';
import {
  B24AvailableMethods,
  B24BatchCommands,
} from './interfaces/bitrix.interface';
import qs from 'qs';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

@Injectable()
export class BitrixService {
  private tokens: BitrixTokens;
  private readonly bitrixOauthUrl: string =
    'https://oauth.bitrix24.tech/oauth/token/';
  private readonly bitrixDomain: string;
  private readonly bitrixClientId: string;
  private readonly bitrixClientSecret: string;
  private readonly bitrixConstants: BitrixConstants;
  private readonly emojiRegex =
    /©|®|‼|⁉|™|ℹ|[↔-↙]|↩|↪|⌚|⌛|⌨|⏏|[⏩-⏳]|[⏸-⏺]|Ⓜ|▪|▫|▶|◀|[◻-◾]|[☀-☄]|☎|☑|☔|☕|☘|☝|☠|☢|☣|☦|☪|☮|☯|[☸-☺]|♀|♂|[♈-♓]|♟|♠|♣|♥|♦|♨|♻|♾|♿|[⚒-⚔]|⚕|⚖|⚗|⚙|⚛|⚜|⚠|⚡|⚪|⚫|⚰|⚱|⚽|⚾|⛄|⛅|⛈|⛎|⛏|⛑|⛓|⛔|⛩|⛪|[⛰-⛵]|[⛷-⛺]|⛽|✂|✅|[✈-✍]|✏|✒|✔|✖|✝|✡|✨|✳|✴|❄|❇|❌|❎|[❓-❕]|❗|❣|❤|[➕-➗]|➡|➰|➿|⤴|⤵|[⬅-⬇]|⬛|⬜|⭐|⭕|〰|〽|㊗|㊙|\u{1F004}|\u{1F0CF}|\u{1F170}|\u{1F171}|\u{1F17E}|\u{1F17F}|\u{1F18E}|[\u{1F191}-\u{1F19A}]|[\u{1F1E6}-\u{1F1FF}]|\u{1F201}|\u{1F202}|\u{1F21A}|\u{1F22F}|[\u{1F232}-\u{1F23A}]|\u{1F250}|\u{1F251}|[\u{1F300}-\u{1F321}]|[\u{1F324}-\u{1F393}]|\u{1F396}|\u{1F397}|[\u{1F399}-\u{1F39B}]|[\u{1F39E}-\u{1F3F0}]|[\u{1F3F3}-\u{1F3F5}]|[\u{1F3F7}-\u{1F4FD}]|[\u{1F4FF}-\u{1F53D}]|[\u{1F549}-\u{1F54E}]|[\u{1F550}-\u{1F567}]|\u{1F56F}|\u{1F570}|[\u{1F573}-\u{1F579}]|\u{1F57A}|\u{1F587}|[\u{1F58A}-\u{1F58D}]|\u{1F590}|\u{1F595}|\u{1F596}|\u{1F5A4}|\u{1F5A5}|\u{1F5A8}|\u{1F5B1}|\u{1F5B2}|\u{1F5BC}|[\u{1F5C2}-\u{1F5C4}]|[\u{1F5D1}-\u{1F5D3}]|[\u{1F5DC}-\u{1F5DE}]|\u{1F5E1}|\u{1F5E3}|\u{1F5E8}|\u{1F5EF}|\u{1F5F3}|[\u{1F5FA}-\u{1F64F}]|[\u{1F680}-\u{1F6C5}]|[\u{1F6CB}-\u{1F6D0}]|\u{1F6D1}|\u{1F6D2}|\u{1F6D5}|[\u{1F6E0}-\u{1F6E5}]|\u{1F6E9}|\u{1F6EB}|\u{1F6EC}|\u{1F6F0}|\u{1F6F3}|[\u{1F6F4}-\u{1F6F6}]|\u{1F6F7}|\u{1F6F8}|\u{1F6F9}|\u{1F6FA}|[\u{1F7E0}-\u{1F7EB}]|[\u{1F90D}-\u{1F90F}]|[\u{1F910}-\u{1F918}]|[\u{1F919}-\u{1F91E}]|\u{1F91F}|[\u{1F920}-\u{1F927}]|[\u{1F928}-\u{1F92F}]|\u{1F930}|\u{1F931}|\u{1F932}|[\u{1F933}-\u{1F93A}]|[\u{1F93C}-\u{1F93E}]|\u{1F93F}|[\u{1F940}-\u{1F945}]|[\u{1F947}-\u{1F94B}]|\u{1F94C}|[\u{1F94D}-\u{1F94F}]|[\u{1F950}-\u{1F95E}]|[\u{1F95F}-\u{1F96B}]|[\u{1F96C}-\u{1F970}]|\u{1F971}|[\u{1F973}-\u{1F976}]|\u{1F97A}|\u{1F97B}|[\u{1F97C}-\u{1F97F}]|[\u{1F980}-\u{1F984}]|[\u{1F985}-\u{1F991}]|[\u{1F992}-\u{1F997}]|[\u{1F998}-\u{1F9A2}]|[\u{1F9A5}-\u{1F9AA}]|\u{1F9AE}|\u{1F9AF}|[\u{1F9B0}-\u{1F9B9}]|[\u{1F9BA}-\u{1F9BF}]|\u{1F9C0}|\u{1F9C1}|\u{1F9C2}|[\u{1F9C3}-\u{1F9CA}]|[\u{1F9CD}-\u{1F9CF}]|[\u{1F9D0}-\u{1F9E6}]|[\u{1F9E7}-\u{1F9FF}]|[\u{1FA70}-\u{1FA73}]|[\u{1FA78}-\u{1FA7A}]|[\u{1FA80}-\u{1FA82}]|[\u{1FA90}-\u{1FA95}]|⌚|⌛|[⏩-⏬]|⏰|⏳|◽|◾|☔|☕|[♈-♓]|♿|⚓|⚡|⚪|⚫|⚽|⚾|⛄|⛅|⛎|⛔|⛪|⛲|⛳|⛵|⛺|⛽|✅|✊|✋|✨|❌|❎|[❓-❕]|❗|[➕-➗]|➰|➿|⬛|⬜|⭐|⭕|\u{1F004}|\u{1F0CF}|\u{1F18E}|[\u{1F191}-\u{1F19A}]|[\u{1F1E6}-\u{1F1FF}]|\u{1F201}|\u{1F21A}|\u{1F22F}|[\u{1F232}-\u{1F236}]|[\u{1F238}-\u{1F23A}]|\u{1F250}|\u{1F251}|[\u{1F300}-\u{1F320}]|[\u{1F32D}-\u{1F335}]|[\u{1F337}-\u{1F37C}]|[\u{1F37E}-\u{1F393}]|[\u{1F3A0}-\u{1F3CA}]|[\u{1F3CF}-\u{1F3D3}]|[\u{1F3E0}-\u{1F3F0}]|\u{1F3F4}|[\u{1F3F8}-\u{1F43E}]|\u{1F440}|[\u{1F442}-\u{1F4FC}]|[\u{1F4FF}-\u{1F53D}]|[\u{1F54B}-\u{1F54E}]|[\u{1F550}-\u{1F567}]|\u{1F57A}|\u{1F595}|\u{1F596}|\u{1F5A4}|[\u{1F5FB}-\u{1F64F}]|[\u{1F680}-\u{1F6C5}]|\u{1F6CC}|\u{1F6D0}|\u{1F6D1}|\u{1F6D2}|\u{1F6D5}|\u{1F6EB}|\u{1F6EC}|[\u{1F6F4}-\u{1F6F6}]|\u{1F6F7}|\u{1F6F8}|\u{1F6F9}|\u{1F6FA}|[\u{1F7E0}-\u{1F7EB}]|[\u{1F90D}-\u{1F90F}]|[\u{1F910}-\u{1F918}]|[\u{1F919}-\u{1F91E}]|\u{1F91F}|[\u{1F920}-\u{1F927}]|[\u{1F928}-\u{1F92F}]|\u{1F930}|\u{1F931}|\u{1F932}|[\u{1F933}-\u{1F93A}]|[\u{1F93C}-\u{1F93E}]|\u{1F93F}|[\u{1F940}-\u{1F945}]|[\u{1F947}-\u{1F94B}]|\u{1F94C}|[\u{1F94D}-\u{1F94F}]|[\u{1F950}-\u{1F95E}]|[\u{1F95F}-\u{1F96B}]|[\u{1F96C}-\u{1F970}]|\u{1F971}|[\u{1F973}-\u{1F976}]|\u{1F97A}|\u{1F97B}|[\u{1F97C}-\u{1F97F}]|[\u{1F980}-\u{1F984}]|[\u{1F985}-\u{1F991}]|[\u{1F992}-\u{1F997}]|[\u{1F998}-\u{1F9A2}]|[\u{1F9A5}-\u{1F9AA}]|\u{1F9AE}|\u{1F9AF}|[\u{1F9B0}-\u{1F9B9}]|[\u{1F9BA}-\u{1F9BF}]|\u{1F9C0}|\u{1F9C1}|\u{1F9C2}|[\u{1F9C3}-\u{1F9CA}]|[\u{1F9CD}-\u{1F9CF}]|[\u{1F9D0}-\u{1F9E6}]|[\u{1F9E7}-\u{1F9FF}]|[\u{1FA70}-\u{1FA73}]|[\u{1FA78}-\u{1FA7A}]|[\u{1FA80}-\u{1FA82}]|[\u{1FA90}-\u{1FA95}]|[\u{1F3FB}-\u{1F3FF}]|☝|⛹|[✊-✍]|\u{1F385}|[\u{1F3C2}-\u{1F3C4}]|\u{1F3C7}|[\u{1F3CA}-\u{1F3CC}]|\u{1F442}|\u{1F443}|[\u{1F446}-\u{1F450}]|[\u{1F466}-\u{1F478}]|\u{1F47C}|[\u{1F481}-\u{1F483}]|[\u{1F485}-\u{1F487}]|\u{1F48F}|\u{1F491}|\u{1F4AA}|\u{1F574}|\u{1F575}|\u{1F57A}|\u{1F590}|\u{1F595}|\u{1F596}|[\u{1F645}-\u{1F647}]|[\u{1F64B}-\u{1F64F}]|\u{1F6A3}|[\u{1F6B4}-\u{1F6B6}]|\u{1F6C0}|\u{1F6CC}|\u{1F90F}|\u{1F918}|[\u{1F919}-\u{1F91E}]|\u{1F91F}|\u{1F926}|\u{1F930}|\u{1F931}|\u{1F932}|[\u{1F933}-\u{1F939}]|[\u{1F93C}-\u{1F93E}]|\u{1F9B5}|\u{1F9B6}|\u{1F9B8}|\u{1F9B9}|\u{1F9BB}|[\u{1F9CD}-\u{1F9CF}]|[\u{1F9D1}-\u{1F9DD}]|‍|⃣|\uFE0F|[\u{1F1E6}-\u{1F1FF}]|[\u{1F3FB}-\u{1F3FF}]|[\u{1F9B0}-\u{1F9B3}]|[\u{E0020}-\u{E007F}]|©|®|‼|⁉|™|ℹ|[↔-↙]|↩|↪|⌚|⌛|⌨|⎈|⏏|[⏩-⏳]|[⏸-⏺]|Ⓜ|▪|▫|▶|◀|[◻-◾]|[☀-☄]|★|[☇-☍]|☎|☏|☐|☑|☒|☔|☕|☖|☗|☘|[☙-☜]|☝|☞|☟|☠|☡|☢|☣|☤|☥|☦|[☧-☩]|☪|[☫-☭]|☮|☯|[☰-☷]|[☸-☺]|[☻-☿]|♀|♁|♂|[♃-♇]|[♈-♓]|[♔-♞]|♟|♠|♡|♢|♣|♤|♥|♦|♧|♨|[♩-♺]|♻|♼|♽|♾|♿|[⚀-⚅]|⚐|⚑|[⚒-⚔]|⚕|⚖|⚗|⚘|⚙|⚚|⚛|⚜|[⚝-⚟]|⚠|⚡|[⚢-⚩]|⚪|⚫|[⚬-⚯]|⚰|⚱|[⚲-⚼]|⚽|⚾|[⚿-⛃]|⛄|⛅|⛆|⛇|⛈|[⛉-⛍]|⛎|⛏|⛐|⛑|⛒|⛓|⛔|[⛕-⛨]|⛩|⛪|[⛫-⛯]|[⛰-⛵]|⛶|[⛷-⛺]|⛻|⛼|⛽|[⛾-✁]|✂|✃|✄|✅|[✈-✍]|✎|✏|✐|✑|✒|✔|✖|✝|✡|✨|✳|✴|❄|❇|❌|❎|[❓-❕]|❗|❣|❤|[❥-❧]|[➕-➗]|➡|➰|➿|⤴|⤵|[⬅-⬇]|⬛|⬜|⭐|⭕|〰|〽|㊗|㊙|[\u{1F000}-\u{1F003}]|\u{1F004}|[\u{1F005}-\u{1F0CE}]|\u{1F0CF}|[\u{1F0D0}-\u{1F0FF}]|[\u{1F10D}-\u{1F10F}]|\u{1F12F}|[\u{1F16C}-\u{1F16F}]|\u{1F170}|\u{1F171}|\u{1F17E}|\u{1F17F}|\u{1F18E}|[\u{1F191}-\u{1F19A}]|[\u{1F1AD}-\u{1F1E5}]|\u{1F201}|\u{1F202}|[\u{1F203}-\u{1F20F}]|\u{1F21A}|\u{1F22F}|[\u{1F232}-\u{1F23A}]|[\u{1F23C}-\u{1F23F}]|[\u{1F249}-\u{1F24F}]|\u{1F250}|\u{1F251}|[\u{1F252}-\u{1F2FF}]|[\u{1F300}-\u{1F321}]|\u{1F322}|\u{1F323}|[\u{1F324}-\u{1F393}]|\u{1F394}|\u{1F395}|\u{1F396}|\u{1F397}|\u{1F398}|[\u{1F399}-\u{1F39B}]|\u{1F39C}|\u{1F39D}|[\u{1F39E}-\u{1F3F0}]|\u{1F3F1}|\u{1F3F2}|[\u{1F3F3}-\u{1F3F5}]|\u{1F3F6}|[\u{1F3F7}-\u{1F3FA}]|[\u{1F400}-\u{1F4FD}]|\u{1F4FE}|[\u{1F4FF}-\u{1F53D}]|[\u{1F546}-\u{1F548}]|[\u{1F549}-\u{1F54E}]|\u{1F54F}|[\u{1F550}-\u{1F567}]|[\u{1F568}-\u{1F56E}]|\u{1F56F}|\u{1F570}|\u{1F571}|\u{1F572}|[\u{1F573}-\u{1F579}]|\u{1F57A}|[\u{1F57B}-\u{1F586}]|\u{1F587}|\u{1F588}|\u{1F589}|[\u{1F58A}-\u{1F58D}]|\u{1F58E}|\u{1F58F}|\u{1F590}|[\u{1F591}-\u{1F594}]|\u{1F595}|\u{1F596}|[\u{1F597}-\u{1F5A3}]|\u{1F5A4}|\u{1F5A5}|\u{1F5A6}|\u{1F5A7}|\u{1F5A8}|[\u{1F5A9}-\u{1F5B0}]|\u{1F5B1}|\u{1F5B2}|[\u{1F5B3}-\u{1F5BB}]|\u{1F5BC}|[\u{1F5BD}-\u{1F5C1}]|[\u{1F5C2}-\u{1F5C4}]|[\u{1F5C5}-\u{1F5D0}]|[\u{1F5D1}-\u{1F5D3}]|[\u{1F5D4}-\u{1F5DB}]|[\u{1F5DC}-\u{1F5DE}]|\u{1F5DF}|\u{1F5E0}|\u{1F5E1}|\u{1F5E2}|\u{1F5E3}|[\u{1F5E4}-\u{1F5E7}]|\u{1F5E8}|[\u{1F5E9}-\u{1F5EE}]|\u{1F5EF}|[\u{1F5F0}-\u{1F5F2}]|\u{1F5F3}|[\u{1F5F4}-\u{1F5F9}]|[\u{1F5FA}-\u{1F64F}]|[\u{1F680}-\u{1F6C5}]|[\u{1F6C6}-\u{1F6CA}]|[\u{1F6CB}-\u{1F6D0}]|\u{1F6D1}|\u{1F6D2}|\u{1F6D3}|\u{1F6D4}|\u{1F6D5}|[\u{1F6D6}-\u{1F6DF}]|[\u{1F6E0}-\u{1F6E5}]|[\u{1F6E6}-\u{1F6E8}]|\u{1F6E9}|\u{1F6EA}|\u{1F6EB}|\u{1F6EC}|[\u{1F6ED}-\u{1F6EF}]|\u{1F6F0}|\u{1F6F1}|\u{1F6F2}|\u{1F6F3}|[\u{1F6F4}-\u{1F6F6}]|\u{1F6F7}|\u{1F6F8}|\u{1F6F9}|\u{1F6FA}|[\u{1F6FB}-\u{1F6FF}]|[\u{1F774}-\u{1F77F}]|[\u{1F7D5}-\u{1F7DF}]|[\u{1F7E0}-\u{1F7EB}]|[\u{1F7EC}-\u{1F7FF}]|[\u{1F80C}-\u{1F80F}]|[\u{1F848}-\u{1F84F}]|[\u{1F85A}-\u{1F85F}]|[\u{1F888}-\u{1F88F}]|[\u{1F8AE}-\u{1F8FF}]|\u{1F90C}|[\u{1F90D}-\u{1F90F}]|[\u{1F910}-\u{1F918}]|[\u{1F919}-\u{1F91E}]|\u{1F91F}|[\u{1F920}-\u{1F927}]|[\u{1F928}-\u{1F92F}]|\u{1F930}|\u{1F931}|\u{1F932}|[\u{1F933}-\u{1F93A}]|[\u{1F93C}-\u{1F93E}]|\u{1F93F}|[\u{1F940}-\u{1F945}]|[\u{1F947}-\u{1F94B}]|\u{1F94C}|[\u{1F94D}-\u{1F94F}]|[\u{1F950}-\u{1F95E}]|[\u{1F95F}-\u{1F96B}]|[\u{1F96C}-\u{1F970}]|\u{1F971}|\u{1F972}|[\u{1F973}-\u{1F976}]|[\u{1F977}-\u{1F979}]|\u{1F97A}|\u{1F97B}|[\u{1F97C}-\u{1F97F}]|[\u{1F980}-\u{1F984}]|[\u{1F985}-\u{1F991}]|[\u{1F992}-\u{1F997}]|[\u{1F998}-\u{1F9A2}]|\u{1F9A3}|\u{1F9A4}|[\u{1F9A5}-\u{1F9AA}]|[\u{1F9AB}-\u{1F9AD}]|\u{1F9AE}|\u{1F9AF}|[\u{1F9B0}-\u{1F9B9}]|[\u{1F9BA}-\u{1F9BF}]|\u{1F9C0}|\u{1F9C1}|\u{1F9C2}|[\u{1F9C3}-\u{1F9CA}]|\u{1F9CB}|\u{1F9CC}|[\u{1F9CD}-\u{1F9CF}]|[\u{1F9D0}-\u{1F9E6}]|[\u{1F9E7}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FA73}]|[\u{1FA74}-\u{1FA77}]|[\u{1FA78}-\u{1FA7A}]|[\u{1FA7B}-\u{1FA7F}]|[\u{1FA80}-\u{1FA82}]|[\u{1FA83}-\u{1FA8F}]|[\u{1FA90}-\u{1FA95}]|[\u{1FA96}-\u{1FFFD}]/gu;

  constructor(
    private readonly configService: ConfigService,
    @Inject(REDIS_CLIENT)
    private readonly redisService: RedisService,
    @Inject('BitrixApiService')
    private readonly http: AxiosInstance,
  ) {
    const bitrixConfig = configService.get<BitrixConfig>('bitrixConfig');
    const bitrixConstants =
      configService.get<BitrixConstants>('bitrixConstants');

    if (!bitrixConfig) throw new Error('Invalid bitrix config');
    if (!bitrixConstants) throw new Error('Invalid bitrix constants');

    this.bitrixDomain = bitrixConfig.bitrixDomain;
    this.bitrixClientId = bitrixConfig.bitrixClientId;
    this.bitrixClientSecret = bitrixConfig.bitrixClientSecret;

    if (!this.bitrixClientId) throw new Error('Invalid bitrix client id');
    if (!this.bitrixClientSecret)
      throw new Error('Invalid bitrix client secret');

    this.tokens = {
      access_token: '',
      refresh_token: '',
      expires: 0,
    };

    this.http.defaults.baseURL = this.bitrixDomain;
    this.http.defaults.headers['Content-Type'] = 'application/json';
    this.http.defaults.headers.common['Accept'] = 'application/json';

    //   Constants
    this.bitrixConstants = bitrixConstants;
  }

  /**
   * Send request to bitrix
   * See https://apidocs.bitrix24.ru/ for target method
   * @param method - bitrix method
   * @param params - params for method.
   */
  async callMethod<
    T extends Record<string, any> = Record<string, any>,
    U = any,
  >(method: B24AvailableMethods, params: Partial<T> = {}) {
    const { access_token } = await this.getTokens();
    return this.post<Partial<T>, B24SuccessResponse<U>>(`/rest/${method}`, {
      ...params,
      auth: access_token,
    });
  }

  /**
   * Send batch request to bitrix
   * @param commands - object of list commands where key is unique id command and value is command object
   * @param halt
   */
  async callBatch<T>(commands: B24BatchCommands, halt = false) {
    const { access_token } = await this.getTokens();

    const cmd = Object.entries(commands).reduce(
      (acc, [key, { method, params }]) => {
        acc[key] = `${method}?${qs.stringify(params)}`;
        return acc;
      },
      {} as Record<string, string>,
    );

    const response = (await this.post('/rest/batch', {
      cmd: cmd,
      halt: halt,
      auth: access_token,
    })) as B24BatchResponseMap;

    const errors = Object.entries(response.result.result_error).reduce(
      (acc, [command, errorData]) => {
        acc += `${command}: ${errorData.error}\n`;
        return acc;
      },
      '' as string,
    );

    if (errors && halt) throw new Error(errors);

    return response as T;
  }

  /**
   * @deprecated
   * @param {B24BatchCommands} commands - object of list commands where key is unique id command and value is command object
   * @param {boolean} halt
   */
  async callBatchOld<T>(commands: B24BatchCommands, halt = false) {
    const { access_token } = await this.getTokens();

    const commandsEncoded = Object.entries(commands).reduce(
      (acc, [commandName, { method, params }]) => {
        acc[commandName] = `${method}?${this.parseToUrlParams(params)}`;
        return acc;
      },
      {},
    );

    const response = (await this.post('/rest/batch', {
      cmd: commandsEncoded,
      halt: halt,
      auth: access_token,
    })) as B24BatchResponseMap;

    const errors = Object.entries(response.result.result_error).reduce(
      (acc, [command, errorData]) => {
        acc += `${command}: ${errorData.error}\n`;
        return acc;
      },
      '' as string,
    );

    if (errors && halt) throw new Error(errors);

    return response as T;
  }

  private parseToUrlParams(params: object, prefix = '') {
    return Object.entries(params).reduce((acc, [key, value]) => {
      const keyWithPrefix = prefix ? `${prefix}[${key}]` : key;

      if (typeof value === 'object') {
        acc += this.parseToUrlParams(value, keyWithPrefix);
        return acc;
      }

      if (Array.isArray(value)) {
        value.forEach(
          (item, index) => (acc += `${keyWithPrefix}[${index}]=${item}&`),
        );
        return acc;
      }

      acc += `${keyWithPrefix}=${value}&`;

      return acc;
    }, '');
  }

  public isAvailableToDistributeOnManager() {
    const now = new Date();

    return (
      now.getDay() > 0 &&
      now.getDay() < 6 &&
      ((now.getUTCHours() >= 6 && now.getUTCHours() < 14) ||
        (now.getUTCHours() === 14 && now.getUTCMinutes() <= 30))
    );
  }

  /**
   * Get bitrix tokens
   */
  public async getTokens(): Promise<BitrixTokens> {
    if (
      this.tokens &&
      this.tokens?.access_token &&
      Date.now() < this.tokens?.expires * 1000
    )
      return this.tokens;

    const [accessToken, expiresAccessToken, refreshToken] = await Promise.all([
      this.redisService.get<string>(REDIS_KEYS.BITRIX_ACCESS_TOKEN),
      this.redisService.get<number>(REDIS_KEYS.BITRIX_ACCESS_EXPIRES),
      this.redisService.get<string>(REDIS_KEYS.BITRIX_REFRESH_TOKEN),
    ]);

    if (!refreshToken) throw new UnauthorizedException('Invalid refresh token');

    if (!accessToken) return this.updateAccessToken(refreshToken);

    if (expiresAccessToken && Date.now() < expiresAccessToken * 1000) {
      this.tokens = {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires: expiresAccessToken ? +expiresAccessToken : 0,
      };

      return this.tokens;
    }

    return this.updateAccessToken(refreshToken);
  }

  /**
   * Call auth url bitrix to get new access token
   * @param refreshToken string
   * @private
   */
  private async updateAccessToken(refreshToken: string): Promise<BitrixTokens> {
    const { access_token, refresh_token, expires } = await this.post<
      object,
      BitrixOauthResponse
    >(
      '',
      {},
      {
        params: {
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
          client_id: this.bitrixClientId,
          client_secret: this.bitrixClientSecret,
        },
        baseURL: this.bitrixOauthUrl,
      },
    );

    this.tokens = {
      access_token: access_token,
      expires: expires,
      refresh_token: refresh_token,
    };

    try {
      await this.redisService.set<string>(
        REDIS_KEYS.BITRIX_ACCESS_TOKEN,
        access_token,
      );
      await this.redisService.set<number>(
        REDIS_KEYS.BITRIX_ACCESS_EXPIRES,
        expires,
      );
      await this.redisService.set<string>(
        REDIS_KEYS.BITRIX_REFRESH_TOKEN,
        refresh_token,
      );
    } catch (error) {
      console.log(
        `Exception error on update access token and save in redis: `,
        error,
      );

      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return this.tokens;
  }

  /**
   * Return string url lead
   * @param leadId
   * @param label
   * @return string
   */
  public generateLeadUrl(leadId: number | string, label?: string) {
    const url = `${this.bitrixDomain}/crm/lead/details/${leadId}/`;

    if (label) return `[url=${url}]${label}[/url]`;

    return url;
  }

  /**
   * Return string url deal
   * @param dealId
   * @param label
   * @return string
   */
  public generateDealUrl(dealId: number | string, label?: string) {
    const url = `${this.bitrixDomain}/crm/deal/details/${dealId}/`;

    return label ? `[url=${url}]${label}[/url]` : url;
  }

  public generateTaskUrl(userId: string, taskId: string, label?: string) {
    const url = `https://grampus.bitrix24.ru/company/personal/user/${userId}/tasks/task/view/${taskId}/`;

    return label ? `[url=${url}]${label}[/url]` : url;
  }

  /**
   * Update tokens and save in cache
   */
  public async updateTokens() {
    const [accessToken, expiresAccessToken, refreshToken] = await Promise.all([
      this.redisService.get<string>(REDIS_KEYS.BITRIX_ACCESS_TOKEN),
      this.redisService.get<number>(REDIS_KEYS.BITRIX_ACCESS_EXPIRES),
      this.redisService.get<string>(REDIS_KEYS.BITRIX_REFRESH_TOKEN),
    ]);

    if (!accessToken || !expiresAccessToken || !refreshToken)
      throw new UnauthorizedException('Invalid update tokens');

    this.tokens = {
      access_token: accessToken,
      expires: expiresAccessToken,
      refresh_token: refreshToken,
    };

    return this.tokens;
  }

  /**
   * Get application bot id
   * @constructor
   */
  get BOT_ID() {
    return this.bitrixConstants.BOT_ID;
  }

  /**
   * Get bitrix domain
   * @constructor
   */
  get BITRIX_DOMAIN() {
    return this.bitrixDomain;
  }

  /**
   * Get bitrix chat id. Need for testing
   * @constructor
   */
  get TEST_CHAT_ID() {
    return this.bitrixConstants.TEST_CHAT_ID;
  }

  /**
   * Get token for validate incoming webhooks from bitrix
   * @constructor
   */
  get WEBHOOK_INCOMING_TOKEN() {
    return this.bitrixConstants.WEBHOOK_INCOMING_TOKEN;
  }

  /**
   * Get access token
   * @constructor
   */
  get ACCESS_TOKEN() {
    return this.tokens.access_token;
  }

  get ZLATA_ZIMINA_BITRIX_ID() {
    return this.bitrixConstants.ZLATA_ZIMINA_BITRIX_ID;
  }

  get ADDY_CASES_CHAT_ID() {
    return this.bitrixConstants.ADDY.casesChatId;
  }

  get OBSERVE_MANAGER_CALLING_CHAT_ID() {
    return this.bitrixConstants.LEAD.observeManagerCallingChatId;
  }

  public removeEmoji(message: string) {
    return message.replace(this.emojiRegex, '');
  }

  /**
   * Base post request to bitrix
   * @param url
   * @param body
   * @param config
   * @private
   */
  private async post<T, U = any>(
    url: string,
    body: T,
    config?: AxiosRequestConfig<T>,
  ) {
    const response = await this.http.post<T, AxiosResponse<U>>(
      url,
      body,
      config,
    );

    return response.data;
  }

  public getRandomElement<T = any>(items: T[]) {
    return items[Math.floor(Math.random() * items.length)];
  }
}
