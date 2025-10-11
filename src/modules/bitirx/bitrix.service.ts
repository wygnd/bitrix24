import {Inject, Injectable} from "@nestjs/common";
import type {B24Hook, Result} from "@bitrix24/b24jssdk";

@Injectable()
export class BitrixService {
	constructor(
		@Inject("BITRIX24")
		private readonly bx24: B24Hook,
	) {
	}

	async getUserById(userId: number, full = false) {
		const result: Result = await this.bx24.callMethod('user.ger', {
			filter: {
				'ID': userId,
			}
		});

		return result.getData();
	}
}