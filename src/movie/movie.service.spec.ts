import { Test, TestingModule } from '@nestjs/testing';
import { MovieService } from './movie.service';
import {TestBed} from '@automock/jest';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';
import { Movie } from './entity/movie.entity';
import { MovieDetail } from './entity/movieDetail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entities/genre.entity';
import { User } from 'src/user/entities/user.entity';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { CommonService } from 'src/common/common.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER,Cache } from '@nestjs/cache-manager';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CreateMovieDto } from './dto/create-movie.dto';
import { NotFoundException } from '@nestjs/common';
import { identity } from 'rxjs';

describe('MovieService', () => {
  let movieService: MovieService;
  let movieRepository:jest.Mocked<Repository<Movie>>;
  let movieDetailRepository:jest.Mocked<Repository<MovieDetail>>;
  let directorRepository:jest.Mocked<Repository<Director>>;
  let genreRepository:jest.Mocked<Repository<Genre>>;
  let userRepository:jest.Mocked<Repository<User>>;
  let movieUserLikeRepository:jest.Mocked<Repository<MovieUserLike>>;
  let dataSource:jest.Mocked<DataSource>;
  let commonService:jest.Mocked<CommonService>;
  let cacheManager:Cache;



  beforeEach(async () => {
    const {unit,unitRef} = TestBed.create(MovieService).compile();
    movieService = unit;
    movieRepository = unitRef.get(getRepositoryToken(Movie) as string);
    movieDetailRepository = unitRef.get(getRepositoryToken(MovieDetail) as string);
    directorRepository = unitRef.get(getRepositoryToken(Director) as string);
    genreRepository = unitRef.get(getRepositoryToken(Genre) as string);
    userRepository = unitRef.get(getRepositoryToken(User) as string);
    movieUserLikeRepository = unitRef.get(getRepositoryToken(MovieUserLike) as string);
    dataSource = unitRef.get(DataSource);
    commonService = unitRef.get(CommonService);
    cacheManager = unitRef.get(CACHE_MANAGER);

  });

  it('should be defined', () => {
    expect(movieService).toBeDefined();
  });


  afterAll(()=>{
    jest.clearAllMocks();
  })

 

  describe('findRecent', () => {
    it('find Recent not cached Movie', async () => {
      const movies = [{id:1,title:'Ring1'}] as Movie[];
      jest.spyOn(cacheManager,'get').mockResolvedValue(null);
      jest.spyOn(movieRepository,'find').mockResolvedValue(movies);

      const result = await movieService.findRecent();
      expect(cacheManager.get).toHaveBeenCalledWith('MOVIE_RECENT');
      expect(cacheManager.set).toHaveBeenCalledWith('MOVIE_RECENT',movies);
      expect(movieRepository.find).toHaveBeenCalledWith({
        order:{
          createdAt:'DESC'
        },
        take:10
      });
      expect(result).toEqual(movies);
    })

    it('find cache Mocked Movie Data' ,async () => {
      const movies = [{id:1,title:'Ring1'}] as Movie[];
      jest.spyOn(cacheManager,'get').mockResolvedValue(movies);
      const result = await movieService.findRecent();
      expect(cacheManager.get).toHaveBeenCalledWith('MOVIE_RECENT');
      expect(result).toEqual(movies);
    })
  });

  describe('findAll', ()=>{
    let getMoviesMock : jest.SpyInstance;
    let getLikedMoviesMock:jest.SpyInstance;

    beforeEach(()=>{
      getMoviesMock =jest.spyOn(movieService,'getMovies');
      getLikedMoviesMock = jest.spyOn(movieService,'getLikedMovies');
    })

    it('should return  a list of movies without user like', async () =>{
       const movies = [{id:1,title:'movie1'}] as Movie[];
       const dto = {title:'Movie'};

       const qb: any = {
        where:jest.fn().mockReturnThis(),
        getManyAndCount:jest.fn().mockResolvedValue([movies,1])
       };

       getMoviesMock.mockResolvedValue(qb);
       jest.spyOn(commonService,'applyCursorPaginationParamsToQb').mockResolvedValue({nextCursor:null } as any);

       const result = await movieService.findAll(dto as GetMoviesDto);
       expect(getMoviesMock).toHaveBeenCalled();
       expect(qb.where).toHaveBeenCalledWith('movie.title LIKE :title',{
        title: `%Movie%`
       });
       expect(commonService.applyCursorPaginationParamsToQb).toHaveBeenCalledWith(qb,dto);
       expect(qb.getManyAndCount).toHaveBeenCalled();
       expect(result).toEqual({
        data:movies,
        nextCursor:null,
        count:1
       })
    })

    it('should return a list of movies with user likes', async () => {
      const movies = [
        {
          id:1,
          title:'Movie 1'
        },
        {
          id:3,
          title: 'Movie 3'
        }
      ];

      const likedMovies = [
        {
          movie:{id:1},
          isLike:true
        },
        {
          movie:{id:2},
          isLike:false
        }
      ];

      const dto = {title:'Movie'} as GetMoviesDto;
      const qb: any = {
        where:jest.fn().mockReturnThis(),
        getManyAndCount:jest.fn().mockResolvedValue([movies,1])
       };

      getMoviesMock.mockResolvedValue(qb);
      jest.spyOn(commonService,'applyCursorPaginationParamsToQb').mockReturnValue({nextCursor:null} as any);
      getLikedMoviesMock.mockResolvedValue(likedMovies); 

      const userId = 1;
      const result = await movieService.findAll(dto,userId);
      expect(getMoviesMock).toHaveBeenCalled();
      expect(qb.where).toHaveBeenCalledWith('movie.title LIKE :title',{
        title: `%Movie%`
      });
      expect(commonService.applyCursorPaginationParamsToQb).toHaveBeenCalledWith(qb,dto);
      expect(qb.getManyAndCount).toHaveBeenCalled();
      expect(getLikedMoviesMock).toHaveBeenCalledWith(
        movies.map(movie => movie.id),
        userId
      );
      expect(result).toEqual({
        data:[
          {
            id:1,
            title: 'Movie 1',
            likeStatus: true
          },{
            id:3,
            title:'Movie 3',
            likeStatus:null
          }
        ],
        nextCursor:null,
        count: 1
      })

   })

    it('should return movies without title filter', async () => {
      const movies = [{id:1, title:'Movie 1'}] as Movie[];
      const dto = {} as GetMoviesDto;
      const qb:any = {
       getManyAndCount:jest.fn().mockResolvedValue([movies,1])
      }

      getMoviesMock.mockResolvedValue(qb);
      jest.spyOn(commonService,'applyCursorPaginationParamsToQb').mockResolvedValue({nextCursor:null } as any);
      const result = await movieService.findAll(dto as GetMoviesDto);
      expect(getMoviesMock).toHaveBeenCalled();
      expect(commonService.applyCursorPaginationParamsToQb).toHaveBeenCalledWith(qb,dto);
      expect(qb.getManyAndCount).toHaveBeenCalled();
      expect(result).toEqual({
        data:movies,
        nextCursor:null,
        count:1
       })
    })
  })

  describe('findOne', () => {
    it('should return a movie', async () => {
      const movie = {id:1,title:'Movie 1'} as Movie;
      jest.spyOn(movieService,'findMovieDetail').mockResolvedValue(movie);
      
      const result = await movieService.findOne(1);
      expect(movieService.findMovieDetail).toHaveBeenCalledWith(1);
      expect(result).toEqual(movie);
    })
  })

  describe('create',()=>{
    let qr:jest.Mocked<QueryRunner>;
    let createMovieDetailMock:jest.SpyInstance;
    let createMovieMock:jest.SpyInstance;
    let createMovieGenreRelationMock:jest.SpyInstance;
    let renameMovieFileMock:jest.SpyInstance;

    beforeEach(()=>{
      qr = {
        manager:{
          findOne:jest.fn(),
          find:jest.fn()
        }
      } as any as jest.Mocked<QueryRunner>;

      createMovieDetailMock = jest.spyOn(movieService,'createMovieDetail');
      createMovieMock = jest.spyOn(movieService,'createMovie');
      createMovieGenreRelationMock = jest.spyOn(movieService,'createMovieGenreRelation');
      renameMovieFileMock =jest.spyOn(movieService,'renameMovieFile');
    });

    it('should create movie successfully', async () => {
      const createMovieDto:CreateMovieDto = {
        title:'New Movie',
        directorId:1,
        genreIds:[1,2],
        detail:'Something',
        movieFileName:'movie.mp4',
      };

      const userId = 1;
      const director = {id:1, name:'Director'};
      const genres = [{id:1,name:'genre1'}, {id:2,name:'genre2'}];
      const movieDetailInsertResult = {
        identifiers:[{id:1}]
      };

      const movieInsertResult = {identifiers:[{id:1}]};
      (qr.manager.findOne as any).mockResolvedValueOnce(director);
      (qr.manager.findOne as any).mockResolvedValueOnce({...createMovieDto, id:1});
      (qr.manager.find as any).mockResolvedValueOnce(genres);
    
      createMovieDetailMock.mockResolvedValue(movieDetailInsertResult);
      createMovieMock.mockResolvedValue(movieInsertResult);
      createMovieGenreRelationMock.mockResolvedValue(undefined);
      renameMovieFileMock.mockResolvedValue(undefined);

      const result = await movieService.create(createMovieDto,userId,qr);

      expect(qr.manager.findOne).toHaveBeenCalledWith(Director,{where:{
        id:createMovieDto.directorId
      }});

      expect(qr.manager.find).toHaveBeenCalledWith(Genre,{where:{
        id: In(createMovieDto.genreIds)
      }});

      expect(createMovieDetailMock).toHaveBeenCalledWith(qr,createMovieDto);

      expect(createMovieMock).toHaveBeenCalledWith(qr,createMovieDto,director,movieDetailInsertResult.identifiers[0].id,userId,expect.any(String));

      expect(createMovieGenreRelationMock).toHaveBeenCalledWith(qr,movieInsertResult.identifiers[0].id,genres);

      expect(renameMovieFileMock).toHaveBeenCalledWith(expect.any(String),expect.any(String),createMovieDto);

      expect(result).toEqual({...createMovieDto, id:1});


    })

    it('should throw NotFoundException if director does not exist', async () =>{
      const createMovieDto:CreateMovieDto = {
        title:'New Movie',
        directorId:1,
        genreIds:[1,2],
        detail:'Something',
        movieFileName:'movie.mp4',
      };

      const userId = 1;

      (qr.manager.findOne as any).mockResolvedValueOnce(null);
       expect(movieService.create(createMovieDto,userId,qr)).rejects.toThrow(NotFoundException);
    })

    it('should throw NotFoundException if genres is not found', async () => {
      const createMovieDto:CreateMovieDto = {
        title:'New Movie',
        directorId:1,
        genreIds:[1,2],
        detail:'Something',
        movieFileName:'movie.mp4',
      };
      const genres = [{id:1}] as Genre[]

      const userId = 1;
      (qr.manager.findOne as any).mockResolvedValueOnce({id:1,name:'test'});
      (qr.manager.find as any).mockResolvedValue(genres);  
      
      expect(movieService.create(createMovieDto,userId,qr)).rejects.toThrow(NotFoundException);
    })

  })


});
