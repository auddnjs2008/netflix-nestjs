import { BadRequestException, Inject, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Like, QueryRunner, Repository } from 'typeorm';
import { MovieDetail } from './entity/movieDetail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entities/genre.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CommonService } from 'src/common/common.service';
import { join } from 'path';
import {rename} from "fs/promises";
import { User } from 'src/user/entities/user.entity';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';


@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(MovieDetail)
    private readonly movieDetailRepository:Repository<MovieDetail>,
    @InjectRepository(Director)
    private readonly directorRepository:Repository<Director>,
    @InjectRepository(Genre)
    private readonly genreRepository:Repository<Genre>,
    private readonly dataSource:DataSource,
    private readonly commonService:CommonService,
    @InjectRepository(User)
    private readonly userRepository:Repository<User>,
    @InjectRepository(MovieUserLike)
    private readonly movieUserLikeRepository:Repository<MovieUserLike>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache
  ){}



  async findRecent(){

    const cacheData = await this.cacheManager.get('MOVIE_RECENT');

    if(cacheData){
      return cacheData;
    }

    const data =  await this.movieRepository.find({
      order:{
        createdAt:'DESC',
      
      },
      take:10
    })

    await this.cacheManager.set('MOVIE_RECENT',data);
    return data;
  }

  /* istanbul ignore next */
  async getMovies(){
    return this.movieRepository.createQueryBuilder('movie')
    .leftJoinAndSelect('movie.director','director')
    .leftJoinAndSelect('movie.genres','genres')
  }

  /* istanbul ignore next */
  async getLikedMovies(movieIds:number[],userId:number){
    return movieIds.length < 1 ? [] : await this.movieUserLikeRepository.createQueryBuilder('mul')
    .leftJoinAndSelect('mul.user','user')
    .leftJoinAndSelect('mul.movie','movie')
    .where('movie.id IN (:...movieIds)', {movieIds})
    .andWhere('user.id = :userId',{userId})
    .getMany();
  }


  async findAll(dto:GetMoviesDto,userId?:number){

    const {title} = dto;


    const qb = await this.getMovies();



    if(title){
      qb.where('movie.title LIKE :title',{title:`%${title}%`});
    }

  
      // this.commonService.applyPagePaginationParamsToQb(qb,dto);
    const {nextCursor} =  await this.commonService.applyCursorPaginationParamsToQb(qb,dto);

    let [data,count] = await qb.getManyAndCount();

    if(userId){
      const movieIds = data.map(movie => movie.id);

      const likedMovies = movieIds.length < 1 ? [] :  await this.getLikedMovies(movieIds,userId);

      /**
       * {
       *  movieId:boolean
       * }
       */

      const likedMovieMap = likedMovies.reduce((acc,next)=> ({
        ...acc,
        [next.movie.id]:next.isLike
      }),{});

      data = data.map((x)=> ({...x, likeStatus: x.id in likedMovieMap ? likedMovieMap[x.id] : null  }));
    };


    return {
      data,
      nextCursor,
      count
    };



     // 나중에 타이틀 필터 기능 추가 
      // if(!title){
      //   return [await this.movieRepository.find({
      //     relations:['director','genres']
      //   }),await this.movieRepository.count()]
      // }

      // return this.movieRepository.findAndCount({where:{
      //   title: Like(`%${title}%`),
      // },relations:['director','genres']});  
  }

  /* istanbul ignore next */
  async findMovieDetail(movieId:number){
    return await this.movieRepository.createQueryBuilder('movie')
    .leftJoinAndSelect('movie.director','director')
    .leftJoinAndSelect('movie.genres','genres')
    .leftJoinAndSelect('movie.detail','detail')
    .leftJoinAndSelect('movie.creator','creator')
    .where('movie.id= :id',{id:movieId})
    .getOne();
  }

  async findOne(id:number){

    const movie = await this.findMovieDetail(id);
    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다!');
    }


    return movie;

    // const movie =await this.movieRepository.findOne({
    //   where:{id:+id},
    //   relations:['detail','director','genres']
    // });
    // if(!movie){
    //   throw new NotFoundException('존재하지 않는 Id 입니다.');
    // } 
  
    // return movie
  }

  /* istanbul ignore next */
  async createMovieDetail(qr:QueryRunner,createMovieDto:CreateMovieDto){
    return qr.manager.createQueryBuilder()
    .insert()
    .into(MovieDetail)
    .values({
      detail:createMovieDto.detail
    })
    .execute();
  }

  /* istanbul ignore next */
  async createMovie(qr:QueryRunner,createMovieDto:CreateMovieDto,director:Director,movieDetailId:number,userId:number,movieFolder:string){
    return await qr.manager.createQueryBuilder()
    .insert()
    .into(Movie)
    .values({
          title:createMovieDto.title,
          detail:{
            id:movieDetailId
          },
          director,
          creator:{
            id:userId
          },
          movieFilePath:join(movieFolder,createMovieDto.movieFileName)
    })
    .execute();
  }

  /* istanbul ignore next */
  async createMovieGenreRelation(qr:QueryRunner,movieId:number,genres:Genre[]){
    return qr.manager.createQueryBuilder()
    .relation(Movie,'genres')
    .of(movieId)
    .add(genres.map(genre => genre.id));
  }

  /* istanbul ignore next */
  async renameMovieFile(tempFolder:string,movieFolder:string,createMovieDto:CreateMovieDto){
    return rename(
      join(process.cwd(),tempFolder,createMovieDto.movieFileName),
      join(process.cwd(),movieFolder,createMovieDto.movieFileName)
    );
  }


  async create(createMovieDto:CreateMovieDto,userId:number, qr :QueryRunner,){
 
      const director = await qr.manager.findOne(Director,{
        where:{
          id:createMovieDto.directorId,
        }
      });
  
      if(!director){
        throw new NotFoundException('존재하지 않는 ID의 감독입니다.')
      }
  
      
      const genres = await qr.manager.find(Genre,{
        where:{
          id: In(createMovieDto.genreIds)
        }
      });
  
      if(genres.length !== createMovieDto.genreIds.length){
        throw new NotFoundException(`존재하지 않는 장르가 있습니다. 존재하는 ids -> ${
          genres.map(genre => genre.id).join(',')
        } `);
      }
  
      const movieDetail = await this.createMovieDetail(qr,createMovieDto);

     
      const movieDetailId = movieDetail.identifiers[0].id;

      const movieFolder = join('public','movie');
      const tempFolder = join('public','temp');

     
      const movie = await this.createMovie(qr,createMovieDto,director,movieDetailId,userId,movieFolder);
  
      const movieId = movie.identifiers[0].id;
  
      await this.createMovieGenreRelation(qr,movieId,genres);

     
      await this.renameMovieFile(tempFolder,movieFolder,createMovieDto);
  
      return await qr.manager.findOne(Movie,{
        where:{
          id:movieId
        },
        relations:['detail','director','genres']
      });
  }

  /* istanbul ignore next */
  async updateMovie(qr:QueryRunner,movieUpdateFields:UpdateMovieDto,id:number){
    return qr.manager.createQueryBuilder()
    .update(Movie)
    .set(movieUpdateFields)
    .where('id = :id',{id})
    .execute();
  }

  /* istanbul ignore next */
  async updateMovieDetail(qr:QueryRunner,detail:string, movie:Movie){
    return await qr.manager.createQueryBuilder()
    .update(MovieDetail)
    .set({detail})
    .where('id = :id',{id:movie.detail.id})
    .execute();
  }

  /* istanbul ignore next */
  async updateMovieGenreRelation(qr:QueryRunner,id:number,newGenres:Genre[],movie:Movie){
    return  await qr.manager.createQueryBuilder()
    .relation(Movie,'genres')
    .of(id)
    .addAndRemove(newGenres.map(genre => genre.id), movie.genres.map(genre => genre.id));
  }


  async update(id:number,updateMovieDto:UpdateMovieDto){

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();


    try{

      const movie =await qr.manager.findOne(Movie,{where:{id:+id},relations:['detail','genres']});
      if(!movie){
        throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
      }

      const {detail,directorId , genreIds, ... movieRest} = updateMovieDto;

      let newDirector;

      if(directorId){
        const director = await qr.manager.findOne(Director,{
          where:{
            id:directorId
          }
        });
        if(!director){
          throw new NotFoundException('존재하지 않는 ID의 감독입니다.');
        }
        newDirector = director;
      }

      let newGenres;

      if(genreIds){
        const genres = await qr.manager.find(Genre,{
          where:{
            id:In(genreIds)
          }
        });

        if(genres.length !== genreIds.length){
          throw new NotFoundException(`존재하지 않는 장르가 있습니다. 존재하는 ids -> ${
            genres.map(genre => genre.id).join(',')
          } `);
        }

        newGenres = genres;
      }
  
      const movieUpdateFields = {
        ...movieRest,
        ...(newDirector && {director:newDirector}),
      }

      await this.updateMovie(qr,movieUpdateFields,id);


      // await this.movieRepository.update({id},movieUpdateFields);

      if(detail){
        await this.updateMovieDetail(qr,detail,movie)



      //   this.movieDetailRepository.update({
      //     id:movie.detail.id
      //   },
      //   {
      //     detail
      //   }
      // )
      }

      if(newGenres){
        await this.updateMovieGenreRelation(qr,id,newGenres,movie);
      }


      // const newMovie =await this.movieRepository.findOne({where:{id:+id},relations:['detail','director']});
  
      // newMovie.genres = newGenres;
      // await this.movieRepository.save(newMovie);

      await qr.commitTransaction();
      return this.movieRepository.findOne({where:{id},relations:['detail','director','genres']});

    }catch(e){
      await qr.rollbackTransaction();
      throw e;
    }finally {
      await qr.release();
    }





  }
  /* istanbul ignore next */
  async deleteMovie(id:number){
    return  await this.movieRepository.createQueryBuilder()
    .delete()
    .where('id = :id',{id})
    .execute();
  }

  async remove(id:number){
    const movie =await this.movieRepository.findOne({where:{id:+id},relations:['detail']});

      if(!movie){
        throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
      }

      await this.deleteMovie(id);

      // await this.movieRepository.delete(id);
      await this.movieDetailRepository.delete(movie.detail.id);
      return id;
  }

  /* istanbul ignore next */
  async getLikedRecord(movieId:number,userId:number){
    return this.movieUserLikeRepository.createQueryBuilder('mul')
    .leftJoinAndSelect('mul.movie','movie')
    .leftJoinAndSelect('mul.user','user')
    .where('movie.id = :movieId', {movieId})
    .andWhere('user.id = :userId',{userId})
    .getOne();
  }

  async toggleMovieLike(movieId:number, userId:number, isLike:boolean){
    const movie = await this.movieRepository.findOne({
      where:{
        id:movieId
      }
    });

    if(!movie){
      throw new BadRequestException('존재하지 않는 영화입니다.');
    }

    const user = await this.userRepository.findOne({
      where:{
        id:userId
      }
    })

    if(!user){
      throw new UnauthorizedException('사용자 정보가 없습니다.');
    }


    const likeRecord = await this.getLikedRecord(movieId,userId);

    if(likeRecord){
      if(isLike === likeRecord.isLike){
        await this.movieUserLikeRepository.delete({
          movie,
          user
        })
      }else{
        await this.movieUserLikeRepository.update({
          movie,
          user,
        },{isLike});
      }

    }else{
      await this.movieUserLikeRepository.save({
        movie,
        user,
        isLike
      })
    }

    const result = await this.getLikedRecord(movieId,userId)

    return {
      isLike: result && result.isLike
    }

  }




}
