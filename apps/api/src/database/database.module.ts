import { Module, Global } from '@nestjs/common';
import { db } from '@lensrecall/db';

export const DB_TOKEN = 'DRIZZLE_DB';

@Global()
@Module({
  providers: [
    {
      provide: DB_TOKEN,
      useValue: db,
    },
  ],
  exports: [DB_TOKEN],
})
export class DatabaseModule {}
