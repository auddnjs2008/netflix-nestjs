import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, ClassSerializerInterceptor, ParseIntPipe, BadRequestException, NotFoundException, ParseFloatPipe, ParseBoolPipe, ParseArrayPipe, ParseUUIDPipe, ParseEnumPipe, DefaultValuePipe, Request, UseGuards, UploadedFile, UploadedFiles } from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieTitleValidationPipe } from './pipe/movie-title-validation.pipe';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { Role } from 'src/user/entities/user.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CacheInterceptor } from 'src/common/interceptor/cache.interceptor';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { FileFieldsInterceptor, FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';




@Controller('movie')
@UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  @Public()
  
  getMovies(
    @Query() dto:GetMoviesDto,
  ){
    return this.movieService.findAll(dto);
  }

  @Get(':id')
  @Public()
  getMovie(@Param('id', ParseIntPipe) id: number,
){

    return this.movieService.findOne(id);
  }

  @Post()
  @RBAC(Role.admin)
  @UseInterceptors(TransactionInterceptor)
  @UseInterceptors(FileFieldsInterceptor([
    {name: 'movie',maxCount:1},{name:'poster',maxCount:2}
  ]))
  postMovie(
    @Body() body:CreateMovieDto,
    @Request() req,
    @UploadedFiles() files: {
      movie?: Express.Multer.File[],
      poster?: Express.Multer.File[]
    }
){
  console.log('-------------------');
  console.log(files);
    return this.movieService.create(body,req.queryRunner)
  }

  @Patch(':id')
  @RBAC(Role.admin)
  patchMovie(
    @Param('id',ParseIntPipe) id:number,
    @Body() body:UpdateMovieDto,
){
    return this.movieService.update(id,body);
  }

  @Delete(':id')
  @RBAC(Role.admin)
  deleteMovie(@Param('id',ParseIntPipe) id:number){
      return this.movieService.remove(id);
  }

}
