import { MigrationInterface, QueryRunner } from 'typeorm';

export class TaskActivity1759750000000 implements MigrationInterface {
  name = 'TaskActivity1759750000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "CREATE TABLE `task_comment` (`id` int NOT NULL AUTO_INCREMENT, `kind` varchar(16) NOT NULL DEFAULT 'comment', `source` varchar(16) NOT NULL DEFAULT 'board', `body` text NOT NULL, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `taskId` int NULL, `authorId` int NULL, INDEX `IDX_task_comment_task` (`taskId`), PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
    );
    await queryRunner.query(
      'CREATE TABLE `task_event` (`id` int NOT NULL AUTO_INCREMENT, `type` varchar(32) NOT NULL, `data` text NULL, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `taskId` int NULL, `actorId` int NULL, INDEX `IDX_task_event_task` (`taskId`), PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
    );
    await queryRunner.query('ALTER TABLE `task_comment` ADD CONSTRAINT `FK_task_comment_task` FOREIGN KEY (`taskId`) REFERENCES `task`(`id`) ON DELETE CASCADE');
    await queryRunner.query('ALTER TABLE `task_comment` ADD CONSTRAINT `FK_task_comment_author` FOREIGN KEY (`authorId`) REFERENCES `user`(`id`) ON DELETE SET NULL');
    await queryRunner.query('ALTER TABLE `task_event` ADD CONSTRAINT `FK_task_event_task` FOREIGN KEY (`taskId`) REFERENCES `task`(`id`) ON DELETE CASCADE');
    await queryRunner.query('ALTER TABLE `task_event` ADD CONSTRAINT `FK_task_event_actor` FOREIGN KEY (`actorId`) REFERENCES `user`(`id`) ON DELETE SET NULL');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `task_event`');
    await queryRunner.query('DROP TABLE `task_comment`');
  }
}
