import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { ListQueryDto } from '../common/dto/list-query.dto';
import { ACCESS_COOKIE } from '../auth/auth.constants';
import type { AuthenticatedUser } from '../auth/auth-user';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PERMISSION_KEYS } from '../rbac/permissions';
import {
  CreateBranchDto,
  CreateDepartmentDto,
  CreateRoleDto,
  UpdateBranchDto,
  UpdateDepartmentDto,
  UpdateRoleDto,
  UpdateUserDto,
} from './dto/administration.dto';
import { OrganizationService } from './organization.service';
import { RolesService } from './roles.service';
import { UsersService } from './users.service';

@ApiTags('Administration')
@ApiCookieAuth(ACCESS_COOKIE)
@Controller('identity')
export class AdministrationController {
  constructor(
    private readonly organization: OrganizationService,
    private readonly roles: RolesService,
    private readonly users: UsersService,
  ) {}

  @RequirePermissions(PERMISSION_KEYS.workspaceAccess)
  @Get('branches')
  listBranches() {
    return this.organization.listBranches();
  }

  @RequirePermissions(PERMISSION_KEYS.branchesManage)
  @Post('branches')
  createBranch(
    @Body() input: CreateBranchDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.organization.createBranch(input, user.id, request.ip);
  }

  @RequirePermissions(PERMISSION_KEYS.branchesManage)
  @Patch('branches/:id')
  updateBranch(
    @Param('id') id: string,
    @Body() input: UpdateBranchDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.organization.updateBranch(id, input, user.id, request.ip);
  }

  @RequirePermissions(PERMISSION_KEYS.workspaceAccess)
  @Get('departments')
  listDepartments() {
    return this.organization.listDepartments();
  }

  @RequirePermissions(PERMISSION_KEYS.departmentsManage)
  @Post('departments')
  createDepartment(
    @Body() input: CreateDepartmentDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.organization.createDepartment(input, user.id, request.ip);
  }

  @RequirePermissions(PERMISSION_KEYS.departmentsManage)
  @Patch('departments/:id')
  updateDepartment(
    @Param('id') id: string,
    @Body() input: UpdateDepartmentDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.organization.updateDepartment(id, input, user.id, request.ip);
  }

  @RequirePermissions(PERMISSION_KEYS.workspaceAccess)
  @Get('roles')
  listRoles() {
    return this.roles.list();
  }

  @RequirePermissions(PERMISSION_KEYS.rolesManage)
  @Get('permissions')
  listPermissions() {
    return this.roles.listPermissions();
  }

  @RequirePermissions(PERMISSION_KEYS.rolesManage)
  @Post('roles')
  createRole(
    @Body() input: CreateRoleDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.roles.create(input, user.id, request.ip);
  }

  @RequirePermissions(PERMISSION_KEYS.rolesManage)
  @Patch('roles/:id')
  updateRole(
    @Param('id') id: string,
    @Body() input: UpdateRoleDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.roles.update(id, input, user.id, request.ip);
  }

  @RequirePermissions(PERMISSION_KEYS.usersManage)
  @Get('users')
  listUsers(@Query() query: ListQueryDto) {
    return this.users.list(query);
  }

  @RequirePermissions(PERMISSION_KEYS.usersManage)
  @Patch('users/:id')
  updateUser(
    @Param('id') id: string,
    @Body() input: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.users.update(id, input, user, request.ip);
  }
}
