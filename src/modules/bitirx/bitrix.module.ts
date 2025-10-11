import {Module} from "@nestjs/common";
import {bitrixProviders} from "./bitrix.providers";
import {BitrixController} from "./bitrix.controller";
import {BitrixService} from "./bitrix.service";

@Module({
	controllers: [BitrixController],
	providers: [...bitrixProviders, BitrixService]
})
export class BitrixModule {
}