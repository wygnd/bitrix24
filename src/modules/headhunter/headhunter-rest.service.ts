import { Injectable, NotFoundException } from '@nestjs/common';
import { HeadHunterService } from '@/modules/headhunter/headhunter.service';
import {
  HHVacanciesResponse,
  HHVacancyInterface,
} from '@/modules/headhunter/interfaces/headhunter-vacancy.interface';
import { plainToInstance } from 'class-transformer';
import { HHVacancyDto } from '@/modules/headhunter/dtos/headhunter-vacancy.dto';
import { RedisService } from '@/modules/redis/redis.service';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';
import { HHResumeInterface } from '@/modules/headhunter/interfaces/headhunter-resume.interface';

@Injectable()
export class HeadhunterRestService {
  constructor(
    private readonly headHunterService: HeadHunterService,
    private readonly redisService: RedisService,
  ) {}

  async getActiveVacancies() {
    const vacanciesFromCache = await this.redisService.get<HHVacancyDto[]>(
      REDIS_KEYS.HEADHUNTER_API_ACTIVE_VACANCIES,
    );

    if (vacanciesFromCache) return vacanciesFromCache;

    const vacanciesFromApi = await this.headHunterService.get<
      object,
      HHVacanciesResponse
    >(
      `/employers/${this.headHunterService.EMPLOYER_ID}/vacancies/active?all_accessible=true`,
    );

    if (vacanciesFromApi.items.length === 0)
      throw new NotFoundException('No active vacancies');

    const vacanciesClear = vacanciesFromApi.items
      .filter(
        ({ archived, has_test, closed_for_applicants }) =>
          !archived && !has_test && !closed_for_applicants,
      )
      .map((vacancy) => this.toDto(vacancy));

    await this.redisService.set<HHVacancyDto[]>(
      REDIS_KEYS.HEADHUNTER_API_ACTIVE_VACANCIES,
      vacanciesClear,
      3600,
    );

    return vacanciesClear;
  }

  async getResumeById(resumeId: string) {
    const resumeFromCache = await this.redisService.get<HHResumeInterface>(
      REDIS_KEYS.HEADHUNTER_DATA_RESUME + resumeId,
    );

    if (resumeFromCache) return resumeFromCache;

    const resume = await this.headHunterService.get<null, HHResumeInterface>(
      `/resumes/${resumeId}`,
    );

    await this.redisService.set<HHResumeInterface>(
      REDIS_KEYS.HEADHUNTER_DATA_RESUME + resumeId,
      resume,
      3600,
    );

    return resume;
  }

  async getVacancyById(vacancyId: string) {
    const vacancyFromCache = await this.redisService.get<HHVacancyInterface>(
      REDIS_KEYS.HEADHUNTER_DATA_VACANCY + vacancyId,
    );

    if (vacancyFromCache) return vacancyFromCache;

    const vacancy = await this.headHunterService.get<null, HHVacancyInterface>(
      `/vacancies/${vacancyId}`,
    );

    await this.redisService.set<HHVacancyInterface>(
      REDIS_KEYS.HEADHUNTER_DATA_VACANCY + vacancyId,
      vacancy,
      3600,
    );

    return vacancy;
  }

  private toDto(vacancy: HHVacancyInterface) {
    return plainToInstance(HHVacancyDto, vacancy, {
      excludeExtraneousValues: true,
    });
  }
}
