import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { MovieDetail } from './entity/movieDetail.entity';


@Injectable()
export class MovieService {
  private movies: Movie[] = [];
  private idCounter= 3;

  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(MovieDetail)
    private readonly movieDetailRepository:Repository<MovieDetail>
  ){}

  async getManyMovies(title?:string){
     // 나중에 타이틀 필터 기능 추가 
    if(!title){
      return [await this.movieRepository.find({
        relations:['detail']
      }),await this.movieRepository.count()]
    }

    return this.movieRepository.findAndCount({where:{
      title: Like(`%${title}%`),
    },relations:['detail']});  
  }


  async getMovieById(id:number){
    const movie =await this.movieRepository.findOne({
      where:{id:+id},
      relations:['detail']
    });
    if(!movie){
      throw new NotFoundException('존재하지 않는 Id 입니다.');
    } 
  
    return movie
  }

  async createMovie(createMovieDto:CreateMovieDto){
    const movieDetail = await this.movieDetailRepository.save({
      detail:createMovieDto.detail
    })

    const movie = await this.movieRepository.save({
      title:createMovieDto.title,
      genre:createMovieDto.genre,
      detail:movieDetail

    });
    return movie;
  }


  async updateMovie(id:number,updateMovieDto:UpdateMovieDto){
    const movie =await this.movieRepository.findOne({where:{id:+id},relations:['detail']});
        if(!movie){
          throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
        }

        const {detail , ... movieRest} = updateMovieDto;
    
        this.movieRepository.update({id},movieRest);

        if(detail){
          this.movieDetailRepository.update({
            id:movie.detail.id
          },
          {
            detail
          }
        )
        }


        const newMovie =await this.movieRepository.findOne({where:{id:+id},relations:['detail']});
    
        return newMovie;
  }

  async deleteMovie(id:number){
    const movie =await this.movieRepository.findOne({where:{id:+id},relations:['detail']});

      if(!movie){
        throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
      }

      await this.movieRepository.delete(id);
      await this.movieDetailRepository.delete(movie.detail.id);
      return id;
  }
}
