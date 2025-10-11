import {Module} from '@nestjs/common';
import {ConfigAppModule} from "./config/config.module";
import {BitrixModule} from "./modules/bitirx/bitrix.module";

@Module({
	imports: [ConfigAppModule, BitrixModule],
	controllers: [],
	providers: [],
})
export class AppModule {
}
