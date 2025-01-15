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
import { MovieFilePipe } from './pipe/movie-file.pipe';




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
  @UseInterceptors(FileInterceptor(
    'movie', {
    limits:{
      fileSize: 20000000,
    },
    fileFilter(req,file,callback){
      console.log(file);
      if(file.mimetype !== 'video/mp4'){
        return callback(new BadRequestException('MP4 타입만 가능합니다!'),false);
      }

      return callback(null,true);
    }
  }))
  postMovie(
    @Body() body:CreateMovieDto,
    @Request() req,
    @UploadedFile(
      // new MovieFilePipe({
      //   maxSize:20,mimetype:'video/mp4'
      // })
    ) movie:Express.Multer.File
){
    return this.movieService.create(body,movie.filename,req.queryRunner)
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
