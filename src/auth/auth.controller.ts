import { Body, Controller, Get, Headers, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { LocalAuthGuard } from './strategy/local.strategy';
import { JwtAuthGuard } from './strategy/jwt.strategy';
import { Public } from './decorator/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}


  @Public()
  @Post('register')
  // authorization: Basic $token
  registerUser(@Headers('authorization') token:string){
    return this.authService.register(token);
  }


  @Public('test')
  @Post('login')
  // authorization: Basic $token
  loginUser(@Headers('authorization') token:string){
    return this.authService.login(token);
  }


  @Post('token/block')
  blockToken(
    @Body('token') token:string
  ){
    return this.authService.tokenBlock(token);
  }


  @Post('token/access')
  async rotateAccessToken(@Request() req){

    return{
      accesToken: await this.authService.issueToken(req.user,false)
    }
  }




  @UseGuards(LocalAuthGuard)
  @Post('login/passport')
  async loginUserPassport(@Request() req){
    console.log(req.user);
    return {
      refreshToken:await this.authService.issueToken(req.user,true),
      accessToken:await this.authService.issueToken(req.user,false)
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('private')
  async private(@Request() req){
    return req.user;
  }


}
