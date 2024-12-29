import { Contains, Equals, IsAlphanumeric, IsArray, IsBoolean, IsCreditCard, IsDate, IsDateString, IsDefined, IsDivisibleBy, IsEmpty, IsEnum, IsHexColor, IsIn, IsInt, IsLatLong, IsNegative, IsNotEmpty, IsNotIn, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Max, MaxLength, Min, MinLength, NotContains, NotEquals, registerDecorator, Validate, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';


enum MovieGenre {
    Fantasy = 'fantasy',
    Action = 'action'
}

@ValidatorConstraint()
class PasswordValidator implements ValidatorConstraintInterface {
    validate(value: any, validationArguments?: ValidationArguments): Promise<boolean> | boolean {
        /// 비밀번호 길이는 4-8
        return value.length > 4 && value.length < 8;
    }
    
    defaultMessage(validationArguments?: ValidationArguments): string {
        return '비밀번호의 길이는 4-8자 여야합니다. 입력된 비밀번호:($value)'
    }

}

function IsPasswordValid(validationOptions?:ValidationOptions){
    return function(object:Object, propertyName:string){
        registerDecorator({
            target:object.constructor,
            propertyName,
            options:validationOptions,
            validator:PasswordValidator
        })
    }
}

export class UpdateMovieDto {
    
    @IsNotEmpty()
    @IsOptional()
    title?:string;
    
    @IsNotEmpty()
    @IsOptional()
    genre?:string;


    /// null || undeinfed 인지 확인 =>  에러 던진다.
    // @IsDefined()

    // ? 타입으로 만들어준다. => 같이 쓴다.
    //@IsOptional()


    // @Equals('code factory')
    // @NotEquals('code factory')



    // null || undeinfed || '' => 이 3가지중 하나여야 한다.
    // @IsEmpty()
    // @IsNotEmpty()


    //Array
    // @IsIn(['action','fantasy'])
    // @IsNotIn

    // @IsBoolean()
    // @IsString()
    // @IsNumber()
    // @IsInt()
    // @IsArray()
    // @IsEnum(MovieGenre)

    // @IsDateString()

    
    // @IsDivisibleBy(5)
    // @IsPositive()
    // @IsNegative()
    // @Min(100)
    // @Max(100)


    // @Contains('code factory')
    // @NotContains('code factory')
    // @IsAlphanumeric() // 알파벳과 숫자
    // @IsCreditCard()
    // @IsHexColor()
    // @MaxLength(16)
    // @MinLength(4)
    // @IsUUID()
    // @IsLatLong() // 위도 경도
    


}