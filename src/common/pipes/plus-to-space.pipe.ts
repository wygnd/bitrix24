import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class PlusToSpacePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): any {
    return typeof value === 'string' ? value.replace(/ /g, '+') : value;
  }
}
