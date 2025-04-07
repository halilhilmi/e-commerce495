import { Router, Response, Request } from 'express';

// utils
import { checkParams } from '../utils/index';
import { MissingParameterError } from '../utils/errors';
import catchFunction from '../utils/catchFunction';
import sendResponse from '../utils/sendResponse';
import UserService from '../services/user.service';
import { IUser, IResUser } from '../interfaces/user.interface';
import isAuthenticated from '../middlewares/is-authenticated';
import pickKeys from '../utils/pickSelectedKeys';
import userController from '../controllers/user.controller';
import authenticate from '../middlewares/authenticate';
import isAdmin from '../middlewares/isAdmin';


interface IAuthenticatedRequest extends Request {
    user?: IUser;
}

const router = Router();

// Admin routes - require admin privileges
router.get('/', authenticate, isAdmin, userController.getAllUsers);
router.post('/', authenticate, isAdmin, userController.createUser);
router.delete('/:id', authenticate, isAdmin, userController.deleteUser);

// Protected routes - require authentication
router.get('/profile', authenticate, userController.getUserProfile);
router.put('/profile', authenticate, userController.updateUserProfile);
router.get('/reviews', authenticate, userController.getUserReviews);

// Public routes
router.get('/:id/reviews', userController.getReviewsByUserId);
router.get('/:id', userController.getUserById);

router.put(
  '/update/:userId',
  catchFunction(async (req: Request, res: Response) => {
    const user = await UserService.updateUserById(req.params.userId, req.body);
    return sendResponse(res, 200, user, "User updated successfully");
  })
);

router.post(
  '/delete',
  isAuthenticated,
  catchFunction(async (req: Request, res: Response) => {
    const token: string = req.body.accessToken ?? req
            .cookies["ads-access-token"]
            ?.replace("Bearer ", "");
    const user = await UserService.deleteUser(token);

    return sendResponse(res, 200, user, "User deleted successfully");
  })
);

router.delete(
  '/delete/:userId',
  catchFunction(async (req: Request, res: Response) => {
    const token: string = req.body.accessToken ?? req
            .cookies["ads-access-token"]
            ?.replace("Bearer ", "");
    const user = await UserService.deleteUserById(req.params.userId);
    return sendResponse(res, 200, user, "User deleted successfully");
  })
);

router.get(
  '/list',
  catchFunction(async (req: Request, res: Response) => {
    const { email, name, nickname, page = 1, limit = 10, isAdmin } = req.query;

    const result = await UserService.listUsers({
      email: email as string | undefined,
      name: name as string | undefined,
      nickname: nickname as string | undefined,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      isAdmin: isAdmin === 'true' ? true : isAdmin === 'false' ? false : undefined,
    });

    sendResponse(res, 200, result, 'Users listed successfully!');
  })
);

router.get(
  '/info',
  isAuthenticated,
  catchFunction(async (req: IAuthenticatedRequest, res: Response) => {
    const user = req.user!;

    const IResUserKeys: (keyof IResUser)[] = [
        "_id",
        "name",
        "surname",
        "email",
        "phone",
        "isAdmin",
    ];
    const resUser: IResUser = pickKeys(user.toObject(), IResUserKeys) as IResUser;

    sendResponse(res, 200, {user: resUser}, 'Kullanıcı bulundu.');
  })
);

export default router;
