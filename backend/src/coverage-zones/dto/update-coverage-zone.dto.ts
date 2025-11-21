import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateCoverageZoneDto } from './create-coverage-zone.dto';

export class UpdateCoverageZoneDto extends PartialType(OmitType(CreateCoverageZoneDto, ['restaurantId'] as const)) {}
