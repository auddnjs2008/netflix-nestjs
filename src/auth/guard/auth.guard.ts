import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Public } from "../decorator/public.decorator";

@Injectable()
export class AuthGuard implements CanActivate{

    constructor(
        private readonly reflector:Reflector,
    ){

    }

    canActivate(context:ExecutionContext):boolean{


        //만약에 public decoration 되어있으면
        //모든 로직을 bypass
        const isPublic = this.reflector.get(Public,context.getHandler());
        
        // Public 데코레이터를 안달면 undefined가 뜨고 Public 데코레이터만 붙여주면 {}  데코레이터 안에 test를 쓰면 test 문자열이 호출
        if(isPublic){
            return true;
        }


        //요청에서 user 객체가 존재하는지 확인한다.
        const request = context.switchToHttp().getRequest();

        if(!request.user || request.user.type !== 'access'){
            return false;
        }

        return true;

    }
    
}