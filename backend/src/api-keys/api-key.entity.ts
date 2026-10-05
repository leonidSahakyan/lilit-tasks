import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

// Long-lived keys for bots and agents. Only the SHA-256 hash of a key is stored.
@Entity('api_key')
export class ApiKey {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  // First characters of the key, so a key can be recognised in lists without revealing it.
  @Column({ length: 16 })
  prefix!: string;

  @Column({ length: 64, unique: true })
  keyHash!: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  user!: User;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @Column({ type: 'datetime', nullable: true, default: null })
  lastUsedAt?: Date | null;

  @Column({ type: 'datetime', nullable: true, default: null })
  revokedAt?: Date | null;
}
