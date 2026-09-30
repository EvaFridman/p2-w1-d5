---
name: api-endpoint
description: Add a new endpoint to the NestJS api / добавить эндпоинт в api. Use whenever a task asks to add, create or expose a new HTTP endpoint, route or controller method in api/src.
---

# Adding an endpoint to `api`

Follow the steps in order. Reference implementation: `api/src/viewings/`.

1. **Place**: put the route in the module that owns the returned data. Staff routes (agent,
   moderator) go in that module's controller; routes for site clients go in
   `public/public.controller.ts`. Resources of one user or agent are nested as `users/:id/...`
   or `agents/:id/...`.
2. **Request DTO**: `<module>/dto/<action>-<entity>.dto.ts`, a class with `class-validator`
   decorators. Numeric query/params need `@Type(() => Number)`; any limit or page gets
   `@Min`/`@Max`. Example: `viewings/dto/list-viewings.dto.ts`.
3. **Service method**: all logic and Prisma calls live in `<module>.service.ts`. Return raw data;
   paginated lists return `{ items, meta }`. `TransformInterceptor` builds `{ data, error, meta }`,
   so never wrap by hand. A new list of an existing entity returns the same item shape as the
   endpoint that already lists it. Log events through the injected `PinoLogger`.
4. **Errors**: throw classes from `errors/app.exception.ts` (`NotFoundError`, `ForbiddenError`,
   `UnauthorizedError`, `ConflictError`, ...), never Nest built-ins or plain `Error`, including
   when `request.user` is missing. Map Prisma `P2025` to `NotFoundError`.
5. **Access**: `JwtAuthGuard` and `RolesGuard` are global, so routes need a token unless marked
   `@Public()`; restrict roles with `@Roles(...)`. If the route works with someone else's
   resource (`:id` of a listing, user or agent), add a guard in `<module>/guards/` and apply it
   with `@UseGuards`: moderator passes, owner passes, everyone else gets `ForbiddenError`.
   Patterns: `listings/guards/listing-owner.guard.ts`, `users/guards/user-avatar-access.guard.ts`.
   A guard never returns `false` (Nest then answers with its own 403); it throws from the
   hierarchy and leaves id format checks to `ParseIntPipe`, which runs after guards.
6. **Controller**: thin. Parse params (`ParseIntPipe`), read `request.user`, call one service
   method, return its result. No Prisma, no business logic.
7. **Swagger**: reuse an existing `@ApiTags` section of the controller. On the method:
   `@ApiOperation({ summary })`, `@ApiBearerAuth('bearer')` if protected, and `@ApiResponse` for
   every status the route can return. Texts in Russian.
8. **Module**: register any new controller or service in `<module>.module.ts`. Guards applied
   with `@UseGuards` need no registration.
9. **Tests**: `*.spec.ts` next to the code, `jest` from `@jest/globals`. Services are tested
   through `Test.createTestingModule` with mocked `PrismaService` / `PinoLogger`; guards with a
   mocked `ExecutionContext` (see `auth/guards/roles.guard.spec.ts`). At least one success test
   and one refusal test (forbidden / not found / invalid input). A new guard gets its own spec.
10. **Imports**: relative imports end in `.js`, including `../generated/prisma/index.js`.
11. **Verify** from root: `npm run lint:api`, `npm run typecheck`, `npm run test:api`.
