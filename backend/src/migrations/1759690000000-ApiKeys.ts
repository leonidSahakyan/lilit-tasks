import { MigrationInterface, QueryRunner } from 'typeorm';

export class ApiKeys1759690000000 implements MigrationInterface {
  name = 'ApiKeys1759690000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE `api_key` (`id` int NOT NULL AUTO_INCREMENT, `name` varchar(255) NOT NULL, `prefix` varchar(16) NOT NULL, `keyHash` varchar(64) NOT NULL, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `lastUsedAt` datetime NULL DEFAULT NULL, `revokedAt` datetime NULL DEFAULT NULL, `userId` int NULL, UNIQUE INDEX `IDX_api_key_keyHash` (`keyHash`), PRIMARY KEY (`id`)) ENGINE=InnoDB',
    );
    await queryRunner.query(
      'ALTER TABLE `api_key` ADD CONSTRAINT `FK_api_key_user` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `api_key` DROP FOREIGN KEY `FK_api_key_user`');
    await queryRunner.query('DROP TABLE `api_key`');
  }
}
