import { ChildEntity, Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, TableInheritance, UpdateDateColumn, VersionColumn } from 'typeorm';
import { BaseTable  } from './base-table.entity';
import { MovieDetail } from './movieDetail.entity';

// ManyTo One    Director  =>  감독은 여러개의 영화를 만들 수 있다.

// One to One    MovieDetail => 영화는 하나의 상세내용을 가질 수 있다.
 
// Many to Many  Genre  => 영화는 여러개의 장르를 가질 수있고, 장르는 여러개의 영화에 속할 수 있다.





@Entity()
export class Movie extends BaseTable {
    @PrimaryGeneratedColumn()
    id:number;

    @Column()
    title:string;
    
    @Column()
    genre:string;

    @OneToOne(
        ()=>MovieDetail
    )
    @JoinColumn()
    detail:MovieDetail
}


