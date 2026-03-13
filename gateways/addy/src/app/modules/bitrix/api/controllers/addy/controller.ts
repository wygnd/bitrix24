import { Controller } from '@nestjs/common';

@Controller({
  version: '1',
  path: 'integration/addy',
})
export class B24IntegrationAddyController {
  constructor() {}
}
