import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
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
    private readonly commonService:CommonService
  ){}

  async findAll(dto:GetMoviesDto){

    const {title} = dto;


    const qb = await this.movieRepository.createQueryBuilder('movie')
    .leftJoinAndSelect('movie.director','director')
    .leftJoinAndSelect('movie.genres','genres')



    if(title){
      qb.where('movie.title LIKE :title',{title:`%${title}%`});
    }

  
      // this.commonService.applyPagePaginationParamsToQb(qb,dto);
    const {nextCursor} =  await this.commonService.applyCursorPaginationParamsToQb(qb,dto);

    const [data,count] = await qb.getManyAndCount();

    

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


  async findOne(id:number){

    const movie = await this.movieRepository.createQueryBuilder('movie')
    .leftJoinAndSelect('movie.director','director')
    .leftJoinAndSelect('movie.genres','genres')
    .leftJoinAndSelect('movie.detail','detail')
    .where('movie.id= :id',{id})
    .getOne();

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

  async create(createMovieDto:CreateMovieDto, qr :QueryRunner){
 
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
  
      const movieDetail = await qr.manager.createQueryBuilder()
      .insert()
      .into(MovieDetail)
      .values({
        detail:createMovieDto.detail
      })
      .execute();

     
      const movieDetailId = movieDetail.identifiers[0].id;
  
      const movie = await qr.manager.createQueryBuilder()
      .insert()
      .into(Movie)
      .values({
            title:createMovieDto.title,
            detail:{
              id:movieDetailId
            },
            director,
      })
      .execute();
  
      const movieId = movie.identifiers[0].id;
  
      await qr.manager.createQueryBuilder()
      .relation(Movie,'genres')
      .of(movieId)
      .add(genres.map(genre => genre.id));

     
  
      return await qr.manager.findOne(Movie,{
        where:{
          id:movieId
        },
        relations:['detail','director','genres']
      });
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

      await qr.manager.createQueryBuilder()
      .update(Movie)
      .set(movieUpdateFields)
      .where('id = :id',{id})
      .execute();


      // await this.movieRepository.update({id},movieUpdateFields);

      if(detail){
        await qr.manager.createQueryBuilder()
        .update(MovieDetail)
        .set({detail})
        .where('id = :id',{id:movie.detail.id})
        .execute();



      //   this.movieDetailRepository.update({
      //     id:movie.detail.id
      //   },
      //   {
      //     detail
      //   }
      // )
      }

      if(newGenres){
        await qr.manager.createQueryBuilder()
        .relation(Movie,'genres')
        .of(id)
        .addAndRemove(newGenres.map(genre => genre.id), movie.genres.map(genre => genre.id));
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

  async remove(id:number){
    const movie =await this.movieRepository.findOne({where:{id:+id},relations:['detail']});

      if(!movie){
        throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
      }

      await this.movieRepository.createQueryBuilder()
      .delete()
      .where('id = :id',{id})
      .execute();

      // await this.movieRepository.delete(id);
      await this.movieDetailRepository.delete(movie.detail.id);
      return id;
  }
}
