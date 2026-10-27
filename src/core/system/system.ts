import { TEntity } from "../entity";

export abstract class System {
    abstract init(): void
    abstract update(dt: number): void
    entities: Set<TEntity> = new Set<TEntity>();
}
