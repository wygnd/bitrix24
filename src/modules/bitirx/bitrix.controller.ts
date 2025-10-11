import {Controller, Get, HttpException, HttpStatus, Param, ParseIntPipe} from "@nestjs/common";
import {BitrixService} from "./bitrix.service";

@Controller("/users")
export class BitrixController {
	constructor(
		private readonly bitrixService: BitrixService,
	) {
	}

	@Get("/:userId")
	async getUserById(@Param("userId", ParseIntPipe) userId: number) {
		try {
			return await this.bitrixService.getUserById(userId);
		} catch (e) {
			throw new HttpException(e, HttpStatus.BAD_REQUEST);
		}
	}
}