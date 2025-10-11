import {ConfigService} from "@nestjs/config";
import {B24Hook, B24HookParams} from "@bitrix24/b24jssdk";


export const bitrixProviders = [{
	provide: "BITRIX24",
	useFactory: (configService: ConfigService) => {
		const bitrixConfig = configService.get<B24HookParams>('bitrixConfig');
		if (!bitrixConfig) throw new Error("Invalid bitrix config");
		return new B24Hook(bitrixConfig);
	},
	inject: [ConfigService],
}]