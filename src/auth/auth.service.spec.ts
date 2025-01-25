import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { Repository } from 'typeorm';
import { Role, User } from 'src/user/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import {Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from "bcrypt";


const mockUserRepository = {
  findOne:jest.fn(),
  save:jest.fn(),
  find:jest.fn(),
  update:jest.fn(),
  delete:jest.fn()
}

const mockConfigService = {
  get:jest.fn()
}

const mockJwtService ={
  signAsync:jest.fn(),
  verifyAsync:jest.fn(),
  decode:jest.fn()
}

const mockCacheManger = {
  set:jest.fn()
};

const mockUserService = {
  create:jest.fn()
}




describe('AuthService', () => {
  let authService: AuthService;
  let userRepository:Repository<User>;
  let configService:ConfigService;
  let jwtService: JwtService;
  let cacheManager : Cache;
  let userService:UserService;


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide:getRepositoryToken(User),
          useValue:mockUserRepository
        },
        {
          provide:ConfigService,
          useValue:mockConfigService
        },
        {
          provide:JwtService,
          useValue:mockJwtService
        },
        {
          provide:CACHE_MANAGER,
          useValue:mockCacheManger
        },
        {
          provide:UserService,
          useValue:mockUserService
        }
      
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    configService = module.get<ConfigService>(ConfigService);
    jwtService = module.get<JwtService>(JwtService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
    userService = module.get<UserService>(UserService);
  });

  afterEach(()=>{
    jest.clearAllMocks();
  })

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('tokenBlock' , () => {
     
     it('should block a token' , async () => {
        const token = 'token';
        const payload = {
          exp: Math.floor(Date.now() / 1000) + 60,
        }

        jest.spyOn(jwtService,'decode').mockReturnValue(payload);

        await authService.tokenBlock(token);
        expect(jwtService.decode).toHaveBeenCalledWith(token);
        expect(cacheManager.set).toHaveBeenCalledWith(`BLOCK_TOKEN_${token}`,payload,expect.any(Number));
     })
  });

  describe('parseBasicToken',() => {

     it('should parse a basic toekn', async () => {
        const rawToken ='Basic dGVzdEBleGFtcGxlLmNvbToxMjM0NTY=';
        const result = authService.parseBasicToken(rawToken);

        const decode = {email:'test@example.com',password: '123456'}

        expect(result).toEqual(decode);
     });

     it('should throw an error invalid token format', async () => {
        const rawToken = 'InvalidTokenFormat';
        //그냥 던지는 거면  밑에 처럼 함수로 감싸서 해줘야 한다. 
        // 만약 프로미스를 던지는 거면 
        // expect(authService.parseBasicToken(rawToken)).rejests.toThrow() 이런식으로
        expect(()=>authService.parseBasicToken(rawToken)).toThrow(BadRequestException)

     })

     it('should throw an error invalid Basic token format', async () => {
      const rawToken = 'Bearer InvalidTokenFormat';
      //그냥 던지는 거면  밑에 처럼 함수로 감싸서 해줘야 한다. 
      // 만약 프로미스를 던지는 거면 
      // expect(authService.parseBasicToken(rawToken)).rejests.toThrow() 이런식으로
      expect(()=>authService.parseBasicToken(rawToken)).toThrow(BadRequestException)

    });

    it('should throw an error invalid token format', async () => {
      const rawToken = 'basic a';
      //그냥 던지는 거면  밑에 처럼 함수로 감싸서 해줘야 한다. 
      // 만약 프로미스를 던지는 거면 
      // expect(authService.parseBasicToken(rawToken)).rejests.toThrow() 이런식으로
      expect(()=>authService.parseBasicToken(rawToken)).toThrow(BadRequestException)
    })




  })

  describe('parseBearerToken', ()=> {
    it('should parse a valid bearer token', async () => {
        const rawToken ='Bearer token';
        const payload = {type : 'access'};
        jest.spyOn(jwtService,'verifyAsync').mockResolvedValue(payload);
        jest.spyOn(mockConfigService,'get').mockReturnValue('secret');

        const result = await authService.parseBearerToken(rawToken,false);

        expect(jwtService.verifyAsync).toHaveBeenCalledWith('token',{
          secret:'secret'
        });

       expect(result).toEqual(payload)  
    });

    it('should throw a BadRequestException for invalid Bearer token format', async ()=> {
       const rawToken = 'a';
       expect(authService.parseBearerToken(rawToken,false)).rejects.toThrow(BadRequestException); 
    });
    
    it('should throw a BadRequestException for token not starting bearer ', async () => {
      const rawToken = 'basic a';
      expect(authService.parseBearerToken(rawToken,false)).rejects.toThrow(BadRequestException); 
    })

    it('should throw a BadRequestException for if payload.type is not refresh but isRefreshToken param is true', async () => {
      const rawToken = 'bearer a';

      jest.spyOn(jwtService,'verifyAsync').mockResolvedValue({type:'refresh'});
      expect(authService.parseBearerToken(rawToken,false)).rejects.toThrow(UnauthorizedException); 
    })

    it('should throw a BadRequestException for if payload.type is not refresh but isRefreshToken param is true', async () => {
      const rawToken = 'bearer a';

      jest.spyOn(jwtService,'verifyAsync').mockResolvedValue({type:'access'});
      expect(authService.parseBearerToken(rawToken,true)).rejects.toThrow(UnauthorizedException); 
    })
  })

  describe('register', () => {
    const rawToken = 'basic abc';
    const user = {
      email:'test@test.com',
      password:'123123'
     }

    it('should register a user', async () => {
       
       jest.spyOn(authService,'parseBasicToken').mockReturnValue(user);
       jest.spyOn(mockUserService,'create').mockResolvedValue(user);

       const result = await authService.register(rawToken);
       expect(authService.parseBasicToken).toHaveBeenCalledWith(rawToken);
       expect(userService.create).toHaveBeenCalledWith(user);
       expect(result).toEqual(user);
    })
  })

  describe('authenticate', () => {
    it('should authenticate user with correct credentials', async () =>{
      const email = "auddnjs2008@naver.com";
      const password = "123123";
      const user = {email, password:'asdfasdfasdf'};

      jest.spyOn(mockUserRepository,"findOne").mockResolvedValue(user);
      jest.spyOn(bcrypt,'compare').mockImplementation((a,b)=>true)

      const result = await authService.authenticate(email,password);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where:{email}
      });

      expect(bcrypt.compare).toHaveBeenCalledWith(password,user.password);
      expect(result).toEqual(user);
    })  

    it('should throw an error for not existing user',async () => {
      jest.spyOn(mockUserRepository,'findOne').mockResolvedValue(null);
      expect(authService.authenticate('test@example.com','asdf')).rejects.toThrow(BadRequestException);
    })

    it('should throw an error for incorrect password', async () => {
      const user = {
        email:'test@test.com',
        password:'asdfasdf'
      }
      jest.spyOn(mockUserRepository,'findOne').mockResolvedValue(user);
      jest.spyOn(bcrypt,'compare').mockImplementation((a,b) => false);

      expect(authService.authenticate(user.email,user.password)).rejects.toThrow(BadRequestException);
    })

  })

  describe('issueToken', () => {
    const user = {
      id:1,
      role:Role.user
    }
    const token = 'token';


    beforeEach(()=>{
      jest.spyOn(mockConfigService,'get').mockReturnValue('secret');
      jest.spyOn(jwtService,'signAsync').mockResolvedValue(token);
    })



    it('should issue an accessToekn', async () => {
      const result = await authService.issueToken(user as User,false);

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub:user.id,
        role:user.role,
        type:'access'
      },{secret:'secret',expiresIn: 300});

      expect(result).toBe(token);

    });


    it('should issue an refreshToken ', async () => {
      const result = await authService.issueToken(user as User,true);

      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub:user.id,
        role:user.role,
        type:'refresh'
      },{secret:'secret',expiresIn: '24h'});

      expect(result).toBe(token);
    })
  })

  describe('login', () => {

    it('should login a user and return token', async () =>{
       const rawToken = 'Basic asdf';
       const email = 'test@test.com';
       const password ='123123';
       const user = {id:1,role:Role.user};

       jest.spyOn(authService,'parseBasicToken').mockReturnValue({email,password});
       jest.spyOn(authService,'authenticate').mockResolvedValue(user as User);
       jest.spyOn(authService,'issueToken').mockResolvedValue('mocked.token');

       const result = await authService.login(rawToken);
       expect(authService.parseBasicToken).toHaveBeenCalledWith(rawToken);
       expect(authService.authenticate).toHaveBeenCalledWith(email,password);
       expect(authService.issueToken).toHaveBeenCalledTimes(2);
       expect(result).toEqual({refreshToken:'mocked.token',accessToken:'mocked.token'})

    })

  })




});
