import { TComponent, TEntity } from "../entity";
import { Component } from "./component";

export type TComponentInstance<T> = T extends pFlex.TCtor<any, infer TInstance>
    ? TInstance
    : (T extends abstract new (...args: any[]) => infer TInstance ? TInstance : never);

export type TComponentInstances<T extends readonly any[]> = {
    [K in keyof T]: TComponentInstance<T[K]>;
};

export class ComponentManager {
    private _types: Map<pFlex.TCtor<any>, TComponent> = new Map();
    private _components: Map<pFlex.TCtor<any>, Component<any>> = new Map();
    private _TNext: TComponent = 0;

    /**
     * Registers a component class with the manager before it is used.
     */
    public register<T>(_class: pFlex.TCtor<any, T>): void {
        if (this._types.has(_class)) {
            throw new Error(`Registering component type '${_class.name}' more than once.`);
        }

        this._types.set(_class, this._TNext);
        this._components.set(_class, new Component<T>());
        this._TNext++;
    }

    /**
     * Retrieves the numeric type ID assigned to a component class.
     */
    public type<T>(_class: pFlex.TCtor<any, T>): TComponent {
        const type = this._types.get(_class);
        if (type === undefined) {
            throw new Error(`Component '${_class.name}' not registered before use.`);
        }
        return type;
    }

    /**
     * Adds a component instance to an entity.
     */
    public add<T>(entity: TEntity, _class: pFlex.TCtor<any, T>, component: T): void {
        this.array(_class).insert(entity, component);
    }

    /**
     * Removes a component from an entity.
     */
    public remove<T>(entity: TEntity, _class: pFlex.TCtor<any, T>): void {
        this.array(_class).remove(entity);
    }

    /**
     * Retrieves an entity's component instance.
     */
    public get<T>(entity: TEntity, _class: pFlex.TCtor<any, T>): T {
        const component = this.array(_class).get(entity);
        if (component === undefined) {
            throw new Error(`Entity ${entity} does not have component '${_class.name}'.`);
        }
        return component;
    }

    /**
     * Retrieves instances of multiple components for an entity in the order specified.
     */
    public gets<_TClasses extends pFlex.TCtor<any, any>[]>(entity: TEntity, ...classes: _TClasses): TComponentInstances<_TClasses>;
    public gets<_TClasses extends pFlex.TCtor<any, any>[]>(entity: TEntity, classes: _TClasses): TComponentInstances<_TClasses>;
    public gets(entity: TEntity, ...args: any[]): any {
        const classes = (args.length === 1 && Array.isArray(args[0])) ? args[0] : args;
        const _list = []
        for(const _class of classes) {
            const _array = this._components.get(_class);
            if(!_array) continue;

            const _component = _array.get(entity);
            if(!_component) continue;

            _list.push(_component);
        }
        return _list;
    }

    /**
     * Cleans up all component records across all stores when an entity is destroyed.
     */
    public destroy(entity: TEntity): void {
        for (const componentArray of this._components.values()) {
            componentArray.destroy(entity);
        }
    }

    /**
     * Helper method to retrieve and cast the component storage array.
     */
    private array<T>(_class: pFlex.TCtor<any, T>): Component<T> {
        const array = this._components.get(_class);
        if (!array) {
            throw new Error(`Component '${_class.name}' not registered before use.`);
        }
        return array as Component<T>;
    }
}
