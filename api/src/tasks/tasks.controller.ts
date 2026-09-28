import { BadRequestException, Controller, Param, Post } from "@nestjs/common";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { TaskName, TaskRunnerService } from "./task-runner.service.js";

@Controller("tasks")
export class TasksController {
    constructor(private readonly taskRunnerService: TaskRunnerService) {}

    @Roles("moderator")
    @Post(":name/run")
    async run(@Param("name") name: string) {
        if (!Object.values(TaskName).includes(name as TaskName)) { throw new BadRequestException(`Unknown task: ${name}`) };
        return this.taskRunnerService.run(name as TaskName);
    }
}