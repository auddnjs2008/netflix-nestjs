import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';


const mockedUserService = {
  create:jest.fn(),
  findAll:jest.fn(),
  findOne:jest.fn(),
  update:jest.fn(),
  remove:jest.fn()
}

describe('UserController', () => {
  let userController: UserController;
  let userService:UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide:UserService,
          useValue:mockedUserService
        }
      ],
    }).compile();

    userController = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(userController).toBeDefined();
  });

  describe('create', () => {
     
    it('should return correct value', async () => {
      const createUserDto:CreateUserDto = {
        email:'test@codefactory.ai',
        password:'123123'
       };
  
       const user = {
         id:1,
         ...createUserDto,
         password:'123123adsfasdfasdf'
       };
  
       jest.spyOn(userService,'create').mockResolvedValue(user as User);
  
       const result = await userController.create(createUserDto)

       expect(userService.create).toHaveBeenCalledWith(createUserDto);
       expect(result).toEqual(user);
    })
  });

  describe('find all', () => {
     
    it('should return list user', async () => {

      const users = [
        {
          id:1,
          email:'test@codefactory.ai'
        },
        {
          id:2,
          email:'test2@codefactory.ai'
        }
      ];

      jest.spyOn(userService,'findAll').mockResolvedValue(users as User[]);
      const result = await userController.findAll();
      expect(userService.findAll).toHaveBeenCalled();
      expect(result).toEqual(users);
    })
  });

  describe('find one', () => {
     
    it('should return single user', async () => {

      const user =  {
        id:1,
        email:'test@codefactory.ai'
      }

      jest.spyOn(userService,'findOne').mockResolvedValue(user as User);
      const result = await userController.findOne(1);
      expect(userService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(user);
    })
  });

  describe('update', () => {
     
    it('should return updated user', async () => {
      const id = 1;
      const updateUserDto:UpdateUserDto = {
        email:'admin@codefactory.ai'
      }
      const user =  {
        id,
        ...updateUserDto
      }

      jest.spyOn(userService,'update').mockResolvedValue(user as User);
      const result = await userController.update(1,updateUserDto);
      expect(userService.update).toHaveBeenCalledWith(1,updateUserDto);
      expect(result).toEqual(user);
    })
  });

  describe('remove', () => {
     
    it('should remove user', async () => {

      const id = 1;

      jest.spyOn(userService,'remove').mockResolvedValue(id);
      const result = await userController.remove(id);
      expect(userService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(id);
    })
  });


});
