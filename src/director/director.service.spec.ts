import { Test, TestingModule } from '@nestjs/testing';
import { DirectorService } from './director.service';
import { Repository } from 'typeorm';
import { Director } from './entity/director.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateDirectorDto } from './dto/create-director.dto';
import { NotFoundException } from '@nestjs/common';


const mockDirectorRepository = {
  save:jest.fn(),
  find:jest.fn(),
  findOne:jest.fn(),
  update:jest.fn(),
  delete:jest.fn()
}


describe('DirectorService', () => {
  let directorService: DirectorService;
  let directorRepository:Repository<Director>;


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
       DirectorService,  
      {
        provide:getRepositoryToken(Director),
        useValue:mockDirectorRepository
      }],
    }).compile();

    directorService = module.get<DirectorService>(DirectorService);
    directorRepository = module.get<Repository<Director>>(getRepositoryToken(Director));
  });

  it('should be defined', () => {
    expect(directorService).toBeDefined();
  });

  describe('create', () => {

    it('should create a new director', async () => {
      const createDirectorDto = {
         name:'kmw',
         dob:new Date(),
         nationality:'asdf'
      };

      jest.spyOn(mockDirectorRepository,'save').mockResolvedValue(createDirectorDto);
      const result = await directorService.create(createDirectorDto)

      expect(mockDirectorRepository.save).toHaveBeenCalledWith(createDirectorDto);
      expect(result).toBe(createDirectorDto);
    })
  })

  describe('findAll', () => {
    it('should find all director', async () => {
      const directors = [{id:1,name:'test'},{id:2,name:'test2'}];
      jest.spyOn(mockDirectorRepository,'find').mockResolvedValue(directors);

      const result = await directorService.findAll();
      expect(result).toBe(directors);
    })
  })

  describe('findOne', () => {
    it('should find a director by id' ,async () => {
      const director = {id:1,name:'test'};
      jest.spyOn(mockDirectorRepository,'findOne').mockResolvedValue(director);

      const result = await directorService.findOne(1);

      expect(mockDirectorRepository.findOne).toHaveBeenCalledWith(
        {where:{id:1}}
      );
      expect(result).toBe(director);
    })
  });

  describe('update', () => {
    it('should update a director by id', async () => {
      const id = 1;
      const updateDirectorDto = {name:'kmw'};
      const director = {id:1,name:'test'};
      jest.spyOn(mockDirectorRepository,'findOne').mockResolvedValueOnce(director);
      jest.spyOn(mockDirectorRepository,'findOne').mockResolvedValueOnce({...director,...updateDirectorDto});

      const result = await directorService.update(id,updateDirectorDto);
      expect(mockDirectorRepository.findOne).toHaveBeenCalledWith({
        where: {
          id:1
        }
      });
      expect(result).toEqual({...director,...updateDirectorDto});
    })

    it('should thorw a Error for not founding user', async () => {
      const id = 1;
      const updateDirectorDto = {name:'kmw'};
      jest.spyOn(mockDirectorRepository,'findOne').mockResolvedValue(null);
      expect(directorService.update(id,updateDirectorDto)).rejects.toThrow(NotFoundException);
    })
  });


  describe('remove', () => {
    it('should remove a director by id', async () => {
      const id = 1;
      const director = {id:1,name:'kmw'};
      jest.spyOn(mockDirectorRepository,'findOne').mockResolvedValue(director);
      
      const result = await directorService.remove(id);
      expect(mockDirectorRepository.findOne).toHaveBeenCalledWith({
        where:{
          id
        }
      });
      expect(result).toBe(id);
    })

    it('should throw a error for not founding user', async () => {
      const id = 1;
      jest.spyOn(mockDirectorRepository,'findOne').mockResolvedValue(null);
      expect(directorService.remove(id)).rejects.toThrow(NotFoundException);
    })


  })




});
