import { BitSet } from "../../utils";
import { TEntity, TSignature } from "./type";
import { MAX_COMPONENTS, MAX_ENTITIES } from "./constant";

export class EntityManager {
    protected _max: number = MAX_ENTITIES;
    protected _entities: TEntity[] = [];

    private _count: number = 0;
    private _signatures: BitSet[];
    private _alive: Set<TEntity> = new Set<TEntity>();

    constructor(max?: number) {
        this._max = max || this._max;
        this._signatures = new Array<BitSet>(this._max);
        for (let entity = 0; entity < this._max; ++entity) {
            this._entities.push(entity);
            this._signatures[entity] = new BitSet(MAX_COMPONENTS);
        }
    }

    call<_TKey extends Exclude<pFlex.TKeyOf<EntityManager, Function, false>, 'call'>>(method: _TKey, ...params: Parameters<EntityManager[_TKey]>): ReturnType<EntityManager[_TKey]> {
        const _fn = this[method];
        return _fn.apply(this, params)
    }

    /**
     * Allocates an unused entity ID from the Manager.
     */
    public create(): TEntity {
        if (this._count >= this._max) {
            throw new Error("Too many entities in existence.");
        }

        // Take an ID from the front of the Manager
        const id = this._entities.shift()!;
        this._count++;
        this._alive.add(id);

        return id;
    }

    /**
     * Resets an entity's signature and recycles its ID.
     */
    public destroy(entity: TEntity): void {
        if (entity < 0 || entity >= this._max) {
            throw new RangeError("Entity out of range.");
        }

        // Invalidate the destroyed entity's signature
        if (this._signatures[entity]) {
            this._signatures[entity].reset();
        }

        // Put the destroyed ID at the back of the Manager
        this._entities.push(entity);
        this._count--;
        this._alive.delete(entity);
    }

    /**
     * Sets the component bitmask signature for an entity.
     */
    public 'signature.set'(entity: TEntity, signature: TSignature): void {
        if (entity < 0 || entity >= this._max) {
            throw new RangeError("Entity out of range.");
        }

        this._signatures[entity] = signature;
    }

    /**
     * Gets the component bitmask signature for an entity.
     */
    public 'signature.get'(entity: TEntity): TSignature {
        if (entity < 0 || entity >= this._max) {
            throw new RangeError("Entity out of range.");
        }

        return this._signatures[entity];
    }

    public get count(): number {
        return this._count;
    }

    public get entities(): TEntity[] {
        return Array.from(this._alive);
    }
}
