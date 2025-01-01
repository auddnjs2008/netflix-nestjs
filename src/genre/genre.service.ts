import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Genre } from './entities/genre.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GenreService {

  constructor(
    @InjectRepository(Genre)
    private readonly genreRepository:Repository<Genre>
  ){}


  create(createGenreDto: CreateGenreDto) {
    return this.genreRepository.save(createGenreDto);
  }

  findAll() {
    return this.genreRepository.find();
  }

  findOne(id: number) {
    const genre = this.genreRepository.findOne({
      where:{
        id
      }
    })

    if(!genre){
      throw new NotFoundException('존재하지 않는 id의 장르입니다.');
    }

    return genre;
  }

  async update(id: number, updateGenreDto: UpdateGenreDto) {
     const genre = this.genreRepository.findOne({
      where:{id}
     });
     if(!genre){
      throw new NotFoundException('존재하지 않는 id의 장르입니다.');
     }

     await this.genreRepository.update({id},updateGenreDto);

     const newGenre = this.genreRepository.findOne({where:{id}});

     return newGenre;
  }

  async remove(id: number) {
    const genre = this.genreRepository.findOne({
      where:{id}
     });
     if(!genre){
      throw new NotFoundException('존재하지 않는 id의 장르입니다.');
     }

     await this.genreRepository.delete(id); 
     return id;
  }
}