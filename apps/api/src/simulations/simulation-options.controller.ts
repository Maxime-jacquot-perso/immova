import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrganizationAccessGuard } from '../common/guards/organization-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { SimulationOptionsService } from './simulation-options.service';
import { CreateOptionGroupDto } from './dto/create-option-group.dto';
import { CreateOptionDto } from './dto/create-option.dto';

@Controller('simulations')
@UseGuards(JwtAuthGuard, OrganizationAccessGuard)
export class SimulationOptionsController {
  constructor(
    private readonly simulationOptionsService: SimulationOptionsService,
  ) {}

  /**
   * Récupérer tous les groupes d'options d'une simulation
   */
  @Get(':simulationId/option-groups')
  async getOptionGroups(
    @CurrentUser() user: AuthenticatedUser,
    @Param('simulationId') simulationId: string,
  ) {
    if (!user.organizationId) {
      throw new Error('Organization ID not found in user context');
    }
    return this.simulationOptionsService.getGroupsForSimulation(
      user.organizationId,
      simulationId,
    );
  }

  /**
   * Créer un nouveau groupe d'options
   */
  @Post(':simulationId/option-groups')
  async createOptionGroup(
    @CurrentUser() user: AuthenticatedUser,
    @Param('simulationId') simulationId: string,
    @Body() dto: CreateOptionGroupDto,
  ) {
    if (!user.organizationId) {
      throw new Error('Organization ID not found in user context');
    }
    return this.simulationOptionsService.createGroup({
      organizationId: user.organizationId,
      simulationId,
      type: dto.type,
      label: dto.label,
    });
  }

  /**
   * Créer une nouvelle option dans un groupe
   */
  @Post(':simulationId/options')
  async createOption(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOptionDto,
  ) {
    if (!user.organizationId) {
      throw new Error('Organization ID not found in user context');
    }
    return this.simulationOptionsService.createOption({
      organizationId: user.organizationId,
      groupId: dto.groupId,
      label: dto.label,
      valueJson: dto.valueJson,
      source: dto.source,
      sourceEventId: dto.sourceEventId,
    });
  }

  /**
   * Activer une option (désactive automatiquement les autres du même groupe)
   */
  @Patch(':simulationId/options/:optionId/activate')
  async activateOption(
    @CurrentUser() user: AuthenticatedUser,
    @Param('optionId') optionId: string,
  ) {
    if (!user.organizationId) {
      throw new Error('Organization ID not found in user context');
    }
    return this.simulationOptionsService.activateOption({
      organizationId: user.organizationId,
      optionId,
      activatedByUserId: user.userId,
    });
  }

  @Get(':simulationId/options/activation-history')
  async getActivationHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('simulationId') simulationId: string,
  ) {
    if (!user.organizationId) {
      throw new Error('Organization ID not found in user context');
    }

    return this.simulationOptionsService.getActivationHistory(
      user.organizationId,
      simulationId,
    );
  }

  @Get(':simulationId/options/groups/:groupId/comparison')
  async getGroupComparison(
    @CurrentUser() user: AuthenticatedUser,
    @Param('simulationId') simulationId: string,
    @Param('groupId') groupId: string,
  ) {
    if (!user.organizationId) {
      throw new Error('Organization ID not found in user context');
    }

    return this.simulationOptionsService.getGroupComparison(
      user.organizationId,
      simulationId,
      groupId,
    );
  }

  /**
   * Simuler l'impact d'une option sans l'activer
   * Retourne les métriques de base, simulées et les deltas
   */
  @Get(':simulationId/options/:optionId/impact')
  async getOptionImpact(
    @CurrentUser() user: AuthenticatedUser,
    @Param('simulationId') simulationId: string,
    @Param('optionId') optionId: string,
  ) {
    if (!user.organizationId) {
      throw new Error('Organization ID not found in user context');
    }
    return this.simulationOptionsService.simulateWithOptionOverride(
      user.organizationId,
      simulationId,
      optionId,
    );
  }

  /**
   * Supprimer une option
   */
  @Delete(':simulationId/options/:optionId')
  async deleteOption(
    @CurrentUser() user: AuthenticatedUser,
    @Param('optionId') optionId: string,
  ) {
    if (!user.organizationId) {
      throw new Error('Organization ID not found in user context');
    }
    return this.simulationOptionsService.deleteOption(
      user.organizationId,
      optionId,
    );
  }
}
