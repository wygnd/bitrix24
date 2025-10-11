import {ConfigService} from "@nestjs/config";
import type {B24HookParams} from "@bitrix24/b24jssdk";

export const bitrixProviders = [{
	provide: "BITRIX24",
	useFactory: async (configService: ConfigService) => {
		const {B24Hook} = await import('@bitrix24/b24jssdk');

		const bitrixConfig = configService.get<B24HookParams>('bitrixConfig');
		if (!bitrixConfig) throw new Error("Invalid bitrix config");
		return new B24Hook(bitrixConfig);
	},
	inject: [ConfigService],
}]