import { B24AddyClientsModel } from '../../../models/addy/clients/model';
import { IB24AddyClientEntity } from '../../../../../application/interfaces/addy/integration/clients/entities/entity';
import { plainToInstance } from 'class-transformer';
import { B24AddyClientEntityDTO } from '../../../../../presetation/dtos/addy/integration/clients/payments/entities/dto';

export class B24AddyClientsMapper {
  public static toDomain(model: B24AddyClientsModel): IB24AddyClientEntity {
    return plainToInstance(B24AddyClientEntityDTO, model, {
      excludeExtraneousValues: true,
    });
  }
}
