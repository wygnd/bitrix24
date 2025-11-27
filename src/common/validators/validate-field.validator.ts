import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BadRequestException } from '@nestjs/common';

export const validateField = async <T extends object>(
  DTO: ClassConstructor<T>,
  variable: any,
) => {
  const variableDto = plainToInstance(DTO, variable);
  const errors = await validate(variableDto);

  if (errors.length !== 0)
    throw new BadRequestException(
      errors.reduce<string[]>((acc, err) => {
        err?.constraints && acc.push(...Object.values(err.constraints));
        return acc;
      }, []),
    );


  return variableDto;
};
