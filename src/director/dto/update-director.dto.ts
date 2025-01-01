import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateDirectorDto{

        @IsNotEmpty()
        @IsOptional()
        @IsString()    
        name?:string;
        
        @IsNotEmpty()
        @IsOptional()
        @IsDateString()
        dob?:Date;
        
        @IsNotEmpty()
        @IsString()
        @IsOptional()
        nationality?:string;

}
