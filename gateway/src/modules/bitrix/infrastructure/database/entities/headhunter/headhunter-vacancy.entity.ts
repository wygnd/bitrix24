import { Column, DataType, Model, Table } from 'sequelize-typescript';
import {
  HHBitrixVacancyAttributes,
  HHBitrixVacancyCreationalAttributes,
  HHBitrixVacancyItem,
} from '@/modules/bitrix/application/interfaces/headhunter/headhunter-bitrix-vacancy.interface';

@Table({
  tableName: 'headhunter_vacancies',
})
export class BitrixHeadhunterVacancyModel extends Model<
  HHBitrixVacancyAttributes,
  HHBitrixVacancyCreationalAttributes
> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'vacancy_id',
    unique: true,
  })
  declare vacancyId: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare url: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare label: string;

  @Column({
    type: DataType.STRING,
    field: 'bitrix_field',
    get: function () {
      return JSON.parse(this.getDataValue('bitrixField'));
    },
    set: function (value) {
      try {
        this.setDataValue('bitrixField', JSON.stringify(value));
      } catch (e) {}
    },
  })
  declare bitrixField: HHBitrixVacancyItem | null;
}
