import { TComponent, TEntity } from "../entity";

export class Component<_TComp = TComponent> {
    protected _entities: _TComp[] = []
    protected _E2I: Map<TEntity, number> = new Map<TEntity, number>();
    protected _I2E: Map<number, TEntity> = new Map<number, TEntity>();
    protected _size: number = 0;

    insert(entity: TEntity, data: _TComp): void {
        if(this._E2I.has(entity)) {
            throw new Error(`Entity ${entity} already has a component.`);
        }

        const _index = this._size;
        this._E2I.set(entity, _index);
        this._I2E.set(_index, entity);
        this._entities[_index] = data;
        this._size++;
    }

    remove(entity: TEntity): void {
        if(!this._E2I.has(entity)) {
            throw new Error(`Entity ${entity} does not have a component.`);
        }

        const _index = this._E2I.get(entity)!;
        const _lindex = this._size - 1;
        this._entities[_index] = this._entities[_lindex];

        const _lentity = this._I2E.get(_lindex)!;
        this._E2I.set(_lentity, _index);
        this._I2E.set(_index, _lentity);

        this._E2I.delete(entity);
        this._I2E.delete(_lindex);
        this._size--;
    }

    get(entity: TEntity): _TComp | undefined {
        if(!this._E2I.has(entity)) {
            return undefined;
        }
        return this._entities[this._E2I.get(entity)!];
    }

    destroy(entity: TEntity): void {
        if(this._E2I.has(entity)) {
            this.remove(entity);
        }
    }
}
