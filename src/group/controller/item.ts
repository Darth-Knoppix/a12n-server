import Controller from '@curveball/controller';
import { Context } from '@curveball/core';
import * as privilegeService from '../../privilege/service';
import * as hal from '../formats/hal';
import * as principalService from '../../principal/service';
import * as groupService from '../../group/service';
import { Forbidden } from '@curveball/http-errors';

type EditPrincipalBody = {
  nickname: string;
  active: boolean;
  type: 'user' | 'app' | 'group';

  /**
   * We don't care about the below types yet.
   *
   * In the future we will auto-generate _good_ types from the schemas
   * and then all of this will be cleaned up
   */
  createdAt?: unknown;
  modifiedAt?: unknown;
  privileges?: unknown;
}

class GroupController extends Controller {

  async get(ctx: Context) {

    const user = await principalService.findById(+ctx.params.id, 'group');
    const isAdmin = await privilegeService.hasPrivilege(ctx, 'admin');

    ctx.response.body = hal.item(
      user,
      await privilegeService.getPrivilegesForPrincipal(user),
      isAdmin,
      await groupService.findGroupsForPrincipal(user),
    );

  }

  async put(ctx: Context) {

    if (!await privilegeService.hasPrivilege(ctx, 'admin')) {
      throw new Forbidden('Only users with the "admin" privilege may edit users');
    }
    ctx.request.validate<EditPrincipalBody>(
      'https://curveballjs.org/schemas/a12nserver/principal-edit.json'
    );

    const user = await principalService.findById(+ctx.params.id, 'group');
    user.active = !!ctx.request.body.active;
    user.nickname = ctx.request.body.nickname;

    await principalService.save(user);
    ctx.status = 204;

  }


}

export default new GroupController();
