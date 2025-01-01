import { PartialType } from '@nestjs/mapped-types';
import { CreateGenreDto } from './create-genre.dto';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateGenreDto{
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    name?:string;


}
