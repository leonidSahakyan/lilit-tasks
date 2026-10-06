import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { ActivityService } from './activity.service';
import { AddCommitDto, CreateCommentDto, ReopenDto } from './activity.dto';
import { TasksService } from '../tasks/tasks.service';

const GITHUB_OWNER = process.env.GITHUB_OWNER || 'leonidSahakyan';

@Controller()
export class ActivityController {
  constructor(
    private readonly activity: ActivityService,
    private readonly tasks: TasksService,
  ) {}

  @Get('activity/comment-counts')
  commentCounts() {
    return this.activity.commentCounts();
  }

  @Get('tasks/:id/activity')
  timeline(@Param('id', ParseIntPipe) id: number) {
    return this.activity.timeline(id);
  }

  @Post('tasks/:id/comments')
  comment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: { userId: number },
  ) {
    return this.activity.addComment(id, user?.userId ?? null, dto.body, dto.kind, dto.source);
  }

  @Post('tasks/:id/commits')
  async commit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddCommitDto,
    @CurrentUser() user: { userId: number },
  ) {
    await this.tasks.findOne(id);
    const repo = dto.repo.includes('/') ? dto.repo : `${GITHUB_OWNER}/${dto.repo}`;
    const url = `https://github.com/${repo}/commit/${dto.sha}`;
    await this.activity.log(id, user?.userId, 'commit', { repo, sha: dto.sha.slice(0, 7), message: dto.message ?? null, url });
    return { url };
  }

  @Post('tasks/:id/reopen')
  reopen(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReopenDto,
    @CurrentUser() user: { userId: number },
  ) {
    return this.tasks.reopen(id, user?.userId, dto.comment);
  }
}
