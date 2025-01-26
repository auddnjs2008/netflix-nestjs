import { Test, TestingModule } from '@nestjs/testing';
import { DirectorController } from './director.controller';
import { DirectorService } from './director.service';
import { Director } from './entity/director.entity';


const mockDirectorService = {
  create:jest.fn(),
  findAll:jest.fn(),
  findOne:jest.fn(),
  update:jest.fn(),
  remove:jest.fn()
}


describe('DirectorController', () => {
  let directorController: DirectorController;
  let directorService:DirectorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DirectorController],
      providers: [
        {
          provide:DirectorService,
          useValue:mockDirectorService
        }
      ],
    }).compile();

    directorController = module.get<DirectorController>(DirectorController);
    directorService = module.get<DirectorService>(DirectorService);
  });

  it('should be defined', () => {
    expect(directorController).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all director', async () => {
        const directors = [
          {
            id:1,
            name:'kmw'
          },{
            id:2,
            name:'kmw2'
          }
        ];
      
      jest.spyOn(directorService,'findAll').mockResolvedValue(directors as Director[]);
      const result = await directorController.findAll();
      expect(directorService.findAll).toHaveBeenCalled();
      expect(result).toEqual(directors);
    })
  })

  describe('findOne', () => {
    it('should return a director', async () => {
      const director = {id:1, name:"kmw"}
      jest.spyOn(directorService,'findOne').mockResolvedValue(director as Director);
      const result = await directorController.findOne(1);
      expect(directorService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(director);
    })
  })

  describe('create', () => {
    it('should create a director', async () => {
      const director = {id:1, name:"kmw"}
      const createDirectorDto = {
        name:'kmw',
        dob:new Date(),
        nationality:'asdf'
      };

      jest.spyOn(directorService,'create').mockResolvedValue(director as Director);
      const result = await directorController.create(createDirectorDto);
      expect(directorService.create).toHaveBeenCalledWith(createDirectorDto);
      expect(result).toEqual(director);
    });
  });

  describe('update', () => {
    it('should update a director', async () => {
      const updateDirectorDto = {name:'kmw-fix'};
      const id = 1;
      const updatedDirector = {id:1,name:'kmw-fix'};

      jest.spyOn(directorService,'update').mockResolvedValue(updatedDirector as Director);
      const result = await directorController.update(1,updateDirectorDto);
      expect(directorService.update).toHaveBeenCalledWith(id,updateDirectorDto);
      expect(result).toEqual(updatedDirector);
    })
  })

  describe('remove', () => {
    it('should delete a director', async () => {
      const id = 1;
      jest.spyOn(directorService,'remove').mockResolvedValue(id);
      const result = await directorController.remove(id);
      expect(directorService.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual(id)
    })
  })


});
