import {Module} from "@nestjs/common";
import {bitrixProviders} from "./bitrix.providers";

@Module({
	providers: bitrixProviders
})
export class BitrixModule {
}