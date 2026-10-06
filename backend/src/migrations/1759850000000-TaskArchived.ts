import { MigrationInterface, QueryRunner } from 'typeorm';

export class TaskArchived1759850000000 implements MigrationInterface {
  name = 'TaskArchived1759850000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `task` ADD `archived` tinyint NOT NULL DEFAULT 0');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `task` DROP COLUMN `archived`');
  }
}
