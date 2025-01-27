import { Test, TestingModule } from '@nestjs/testing';
import { GenreService } from './genre.service';
import { Repository } from 'typeorm';
import { Genre } from './entities/genre.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

const mockGenreRepository = {
  findOne:jest.fn(),
  save:jest.fn(),
  find:jest.fn(),
  update:jest.fn(),
  delete:jest.fn()
}

describe('GenreService', () => {
  let genreService: GenreService;
  let genreRepository:Repository<Genre>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GenreService,
        {
          provide:getRepositoryToken(Genre),
          useValue:mockGenreRepository
        }
      ],
    }).compile();

    genreService = module.get<GenreService>(GenreService);
    genreRepository = module.get<Repository<Genre>>(getRepositoryToken(Genre));
  });

  afterEach(()=>{
    jest.clearAllMocks();
  })



  it('should be defined', () => {
    expect(genreService).toBeDefined();
  });

  describe('create', ()=>{
    it('should create a genre', async ()=>{
      const createGenreDto = {name:'test'};
      jest.spyOn(genreRepository,'findOne').mockResolvedValue(null);
      jest.spyOn(genreRepository,'save').mockResolvedValue(createGenreDto as Genre);

      const result = await genreService.create(createGenreDto);
      expect(genreRepository.findOne).toHaveBeenCalledWith({
        where:{
          name:createGenreDto.name
        }
      });
      expect(result).toEqual(createGenreDto);

    });

    it('should throw  an error', async () => {
      const createGenreDto = {name:'test'};
      jest.spyOn(genreRepository,'findOne').mockResolvedValue({id:1,name:'test'} as Genre);
      expect(genreService.create(createGenreDto)).rejects.toThrow(NotFoundException);
    })
  })


  describe('findAll', () => {
    it('should findAll genre', async () => {
      const genres = [{id:1,name:'test'}] as Genre[];
      jest.spyOn(genreRepository,'find').mockResolvedValue(genres);
      const result = await genreService.findAll();
      expect(genreRepository.find).toHaveBeenCalled();
      expect(result).toEqual(genres);
    })
  })

  describe('findOne', () => {
    it('should findOne genre', async () => {
      const id = 1;
      const genre = {id:1, name:'test'} as Genre;

      jest.spyOn(genreRepository,'findOne').mockResolvedValue(genre);
      const result = await genreService.findOne(id);
      expect(genreRepository.findOne).toHaveBeenCalledWith({
        where:{id}
      });
      expect(result).toEqual(genre);
    });

    it('should throw a NotFoundException if genre is not found', async () => {
      jest.spyOn(genreRepository, 'findOne').mockResolvedValue(null);
      expect(genreService.findOne(1)).rejects.toThrow(NotFoundException);
    })

  })

  describe('update', () => {
    it('should update a gnere', async () => {
      const genre = {id:1,name:'tet'} as Genre;
      const updatedGenre = {id:1,name:'test-update'} as Genre;

      jest.spyOn(genreRepository,'findOne').mockResolvedValueOnce(genre);
      jest.spyOn(genreRepository,'findOne').mockResolvedValueOnce(updatedGenre);

      const result = await genreService.update(1,{name:'test-update'});

      expect(genreRepository.findOne).toHaveBeenCalledWith({
        where:{id:1}
      });
      expect(result).toEqual(updatedGenre);
    });

    it('should throw an error', async () => {
      jest.spyOn(genreRepository,'findOne').mockResolvedValue(null);
      expect(genreService.update(1,{name:'test2'})).rejects.toThrow(NotFoundException);
    })
  })

  describe('remove',() => {
    it('should remove a genre', async () => {
      const id = 1;
      const genre = {id:1, name:'test'} as Genre;
      jest.spyOn(genreRepository,'findOne').mockResolvedValue(genre);

      const result = await genreService.remove(id);
      expect(genreRepository.findOne).toHaveBeenCalledWith({
        where:{id}
      });
      expect(genreRepository.delete).toHaveBeenCalledWith(id);
      expect(result).toEqual(id);
    })

    it('should throw an error', async () => {
      const id = 1;
      jest.spyOn(genreRepository,'findOne').mockResolvedValue(null);
      expect(genreService.remove(id)).rejects.toThrow(NotFoundException);
    })
  })

});
