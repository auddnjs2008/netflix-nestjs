import { ChildEntity, Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, TableInheritance, UpdateDateColumn, VersionColumn } from 'typeorm';
import { BaseTable  } from '../../common/entity/base-table.entity';
import { MovieDetail } from './movieDetail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entities/genre.entity';
import { Transform } from 'class-transformer';
import { User } from 'src/user/entities/user.entity';
import { MovieUserLike } from './movie-user-like.entity';

// ManyTo One    Director  =>  감독은 여러개의 영화를 만들 수 있다.

// One to One    MovieDetail => 영화는 하나의 상세내용을 가질 수 있다.
 
// Many to Many  Genre  => 영화는 여러개의 장르를 가질 수있고, 장르는 여러개의 영화에 속할 수 있다.





@Entity()
export class Movie extends BaseTable {
    @PrimaryGeneratedColumn()
    id:number;

    @ManyToOne(
        ()=>User,
        (user) => user.createdMovies
    )
    creator: User;

    @Column({
        unique:true
    })
    title:string;
    
    @OneToOne(
        ()=>MovieDetail,
        movieDetail => movieDetail.id,
        {
            cascade:true,
            nullable:false,
        }
    )
    @JoinColumn()
    detail:MovieDetail


    @Column()
    @Transform(({value}) => `http://localhost:3000/${value}`)
    movieFilePath:string;




    @ManyToOne(
        ()=>Director,
        director => director.id,
        {cascade:true, nullable:false}
    )
    director:Director

    @Column({
        default:0
    })
    likeCount: number;

    @Column({
        default:0
    })
    dislikeCount:number;


    @ManyToMany(
        () => Genre,
        genre => genre.movies
    )
    @JoinTable()
    genres:Genre[]

    @OneToMany(
        ()=>MovieUserLike,
        (mul) => mul.movie
    )
    likedUsers:MovieUserLike[]
}


