import { Test, TestingModule } from '@nestjs/testing';
import { MovieController } from './movie.controller';
import { MovieService } from './movie.service';
import { TestBed } from '@automock/jest';
import { Movie } from './entity/movie.entity';
import { QueryRunner } from 'typeorm';
import { UpdateMovieDto } from './dto/update-movie.dto';

describe('MovieController', () => {
  let movieController: MovieController;
  let movieService : jest.Mocked<MovieService>;

  beforeEach(async () => {
    const {unit, unitRef} = TestBed.create(MovieController).compile();

    movieController  = unit;
    movieService  = unitRef.get<MovieService>(MovieService);
  });

  it('should be defined', () => {
    expect(movieController).toBeDefined();
  });



  describe('getMovies', () => {
    it('should call movieService.findAll with the correct parameters', async () => {
      const dto = {page:1,limit:10};
      const userId = 1;
      const movies = [{id:1},{id:2}];
      jest.spyOn(movieService,'findAll').mockResolvedValue(movies as any);

      const result = await movieController.getMovies(dto as any,userId);

      expect(movieService.findAll).toHaveBeenCalledWith(dto,userId);
      expect(result).toEqual(movies);

    })
  });

  describe('getMoviesRecent', () => {
    it('should call recent Movie', async () => {
      const movies = [{id:1}];
      jest.spyOn(movieService,'findRecent').mockResolvedValue(movies as any);
      await movieController.getMoviesRecent();
      expect(movieService.findRecent).toHaveBeenCalled();
    })
  });

  describe('getMovie', () => {
    it('should call movieService.findOne with the correct id', async () => {
      const id = 1;
      await movieController.getMovie(id);

      expect(movieService.findOne).toHaveBeenCalledWith(id);
    })
  })

  describe('postMovie', () => {
    it('should create movie ', async () => {
      const movieCreateDto = {
        title:'test',
        detail:'lalal',
        directorId:1,
        genreIds:[1,2],
        movieFileName:'aaa-bbb-ccc-ddd.jpg'
      }
      const queryRunner = {} as QueryRunner;
      const userId=1;
      await movieController.postMovie(movieCreateDto,queryRunner, userId);
      expect(movieService.create).toHaveBeenCalledWith(movieCreateDto,userId,queryRunner);
    })
  });

  describe('patchMovie', () => {
    it('should patch movie', async () => {
      const id = 1;
      const dto = {title:'test2'} as any;

      await movieController.patchMovie(id,dto);

      expect(movieService.update).toHaveBeenCalledWith(id,dto);
    })
  })

  describe('deleteMovie',() => {
    it('should delete movie', async () => {
      const id = 1;

      await movieController.deleteMovie(id);
      expect(movieService.remove).toHaveBeenCalledWith(id);
    })
  });

  describe('createMovieLike', () => {
    it('should create movie like', async () => {
      const movieId = 1;
      const userId = 1;

      await movieController.createMovieLike(movieId,userId);
      expect(movieService.toggleMovieLike).toHaveBeenCalledWith(movieId,userId,true)
    })
  })

  describe('createMovieDisLike', () => {
    it('should create movie dislike', async () => {
      const movieId = 1;
      const userId = 1;
      await movieController.createMovieDisLike(movieId,userId);
      expect(movieService.toggleMovieLike).toHaveBeenCalledWith(movieId,userId,false);

    })

  })

});
