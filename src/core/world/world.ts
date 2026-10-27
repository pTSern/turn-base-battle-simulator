import { ComponentManager, TComponentInstances } from "../component";
import { EntityManager, TEntity, TSignature, MAX_COMPONENTS } from "../entity";
import { System, SystemManager } from "../system";
import { Unique } from "../../utils/unique";
import { EventManager, Event } from "../event";
import { BitSet } from "../../utils";

export interface EntityQueryResult extends Array<TEntity> {
    query(...components: (pFlex.TCtor<any> | pFlex.TCtor<any>[])[]): EntityQueryResult;
}

export class World<_TEvents extends pFlex.TKey> {
    protected _component = new Unique( new ComponentManager() );
    protected _system = new Unique( new SystemManager() );
    protected _entity = new Unique( new EntityManager() );
    protected _event = new Unique( new EventManager<_TEvents>() );
    protected _entities = new Set<TEntity>();

    get component() { return this._component.get(); }
    get system() { return this._system.get(); }
    get entity() { return this._entity.get(); }
    get event() { return this._event.get(); }

    create_entity() {
        const entity = this._entity.get().create();
        this._entities.add(entity);
        return entity;
    }

    destroy_entity(entity: TEntity) {
        this.entity.destroy(entity);
        this.component.destroy(entity);
        this.system.call('entity.destroy', entity);
        this._entities.delete(entity);
    }

    register_component<T>(_class: pFlex.TCtor<any, T>) {
        this.component.register(_class);
    }

    add_component<T>(entity: TEntity, _class: pFlex.TCtor<any, T>, component: T) {
        this.component.add(entity, _class, component);

        let _signature = this.entity.call('signature.get', entity);
        if (!_signature) {
            _signature = new BitSet(MAX_COMPONENTS);
            this.entity["signature.set"](entity, _signature);
        }
        _signature.set(this.component.type(_class), true);
        this.entity["signature.set"](entity, _signature);

        this.system["signature.change"](entity, _signature);
    }

    query_component(...args: (pFlex.TCtor<any> | pFlex.TCtor<any>[])[]): EntityQueryResult {
        const classes = Array.from(new Set(args.flat() as pFlex.TCtor<any>[]));
        const activeEntities = this._getActiveEntities();

        if (classes.length === 0) {
            return this._makeQueryResult(activeEntities);
        }

        const types = classes.map(cls => this.component.type(cls));
        const matched = activeEntities.filter(entity => {
            const sig = this.entity.call('signature.get', entity);
            if (!sig) return false;
            for (let i = 0; i < types.length; i++) {
                if (!sig.test(types[i])) return false;
            }
            return true;
        });

        return this._makeQueryResult(matched);
    }

    protected _getActiveEntities(): TEntity[] {
        if ('entities' in this.entity && Array.isArray((this.entity as any).entities)) {
            return (this.entity as any).entities;
        }
        return Array.from(this._entities);
    }

    protected _makeQueryResult(entities: TEntity[]): EntityQueryResult {
        const result = [...entities] as EntityQueryResult;
        Object.defineProperty(result, 'query', {
            value: (...nextComponents: (pFlex.TCtor<any> | pFlex.TCtor<any>[])[]) => {
                const nextClasses = Array.from(new Set(nextComponents.flat() as pFlex.TCtor<any>[]));
                if (nextClasses.length === 0) {
                    return this._makeQueryResult(result);
                }
                const nextTypes = nextClasses.map(cls => this.component.type(cls));
                const filtered = result.filter(entity => {
                    const sig = this.entity.call('signature.get', entity);
                    if (!sig) return false;
                    for (let i = 0; i < nextTypes.length; i++) {
                        if (!sig.test(nextTypes[i])) return false;
                    }
                    return true;
                });
                return this._makeQueryResult(filtered);
            },
            enumerable: false,
            configurable: true,
            writable: true
        });
        return result;
    }

    remove_component<T>(entity: TEntity, _class: pFlex.TCtor<any, T>) {
        this.component.remove(entity, _class);
        let _signature = this.entity["signature.get"](entity);
        if (!_signature) {
            _signature = new BitSet(MAX_COMPONENTS);
            this.entity['signature.set'](entity, _signature);
        }
        _signature.set(this.component.type(_class), false);
        this.entity['signature.set'](entity, _signature);
        this.system['signature.change'](entity, _signature);
    }

    get_component<T>(entity: TEntity, _class: pFlex.TCtor<any, T>) {
        return this.component.get(entity, _class);
    }

    get_components<_TClasses extends pFlex.TCtor<any, any>[]>(entity: TEntity, ...classes: _TClasses): TComponentInstances<_TClasses>;
    get_components<_TClasses extends pFlex.TCtor<any, any>[]>(entity: TEntity, classes: _TClasses): TComponentInstances<_TClasses>;
    get_components(entity: TEntity, ...args: any[]): any {
        return this.component.gets(entity, ...(args as any));
    }

    get_component_type<T>(_class: pFlex.TCtor<any, T>) {
        return this.component.type(_class);
    }

    register_system<T extends System>(_class: pFlex.TCtor<any, T>) {
        return this.system.register(_class);
    }

    set_system_signature<T extends System>(_class: pFlex.TCtor<any, T>, signature: TSignature) {
        this.system['signature.set'](_class, signature);
    }

    add_event(id: _TEvents, listener: pFlex.TFunc<[Event<_TEvents>, void]>) {
        this.event.add(id, listener);
    }

    send_event(event: Event<_TEvents> | _TEvents) {
        this.event.send(event);
    }
}
