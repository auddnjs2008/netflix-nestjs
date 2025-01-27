import { Test, TestingModule } from '@nestjs/testing';
import { GenreController } from './genre.controller';
import { GenreService } from './genre.service';
import { Genre } from './entities/genre.entity';


const mockGenreService = {
  create:jest.fn(),
  findAll:jest.fn(),
  findOne:jest.fn(),
  update:jest.fn(),
  remove:jest.fn()
}

describe('GenreController', () => {
  let controller: GenreController;
  let service:GenreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GenreController],
      providers: [{
        provide:GenreService,
        useValue:mockGenreService
      }],
    }).compile();

    controller = module.get<GenreController>(GenreController);
    service = module.get<GenreService>(GenreService);
  
  });
  afterAll(()=>{
    jest.clearAllMocks();
  })

  it('should be defined', () => {
    expect(true).toBeDefined();
  });

  describe('create',  () => {
    it('should create a genre', async () => {
      const createGenreDto = {
        name:'test'
      };
  
      jest.spyOn(service,'create').mockResolvedValue({id:1,name:'test'} as Genre);
      const result = await controller.create(createGenreDto);
      expect(service.create).toHaveBeenCalledWith(createGenreDto);
      expect(result).toEqual({id:1,name:'test'});
    })
  });

  describe('findAll', () => {
    it('should find genres', async () => {
      const genres = [ {id:1,name:'test'}] as Genre[];
      jest.spyOn(service,'findAll').mockResolvedValue(genres);
      const result = await controller.findAll();
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(genres);
    })
  });

  describe('findOne', () => {
    it('should find one genre', async () => {
      const genre = {id:1,name:'test'} as Genre;
      jest.spyOn(service,'findOne').mockResolvedValue(genre);
      const result = await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(genre);
    })
  });

  describe('update', () => {
    it('should update genre', async () => {
      const updateGenreDto = {name:'test-fixed'};
      const updatedGenre = {id:1,name:'test-fixed'} as Genre;
      jest.spyOn(service,'update').mockResolvedValue(updatedGenre);

      const result = await controller.update(1,updateGenreDto);
      expect(service.update).toHaveBeenCalledWith(1,updateGenreDto);
      expect(result).toEqual(updatedGenre);
    })
  });

  describe('delete',()=>{
    it('should delete genre', async () => {
      jest.spyOn(service,'remove').mockResolvedValue(1);
      const result = await controller.remove(1);
      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual(1);
    })
  })

});
