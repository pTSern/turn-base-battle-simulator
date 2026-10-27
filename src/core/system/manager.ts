import { TEntity, TSignature } from "../entity";
import { System } from "./system";
import { TSystemCtor } from "./type";

export class SystemManager {
    private _signatures: Map<TSystemCtor<any>, TSignature> = new Map();
    private _systems: Map<TSystemCtor<any>, System> = new Map();

    /**
     * Registers a system type, creates an instance of it, and returns the instance.
     */
    public register<T extends System>(systemClass: TSystemCtor<T>): T {
          if (this._systems.has(systemClass)) {
              throw new Error(`Registering system '${systemClass.name}' more than once.`);
          }

          const system = new systemClass();
          this._systems.set(systemClass, system);
          return system;
    }

    /**
     * Defines the component signature required for an entity to belong to this system.
     */
    public 'signature.destroy'<T extends System>(systemClass: TSystemCtor<T>, signature: TSignature): void {
        if (!this._systems.has(systemClass)) {
            throw new Error(`System '${systemClass.name}' used before registered.`);
        }

        this._signatures.set(systemClass, signature);
    }

    /**
     * Alias for signature.destroy to set required signature for a system.
     */
    public 'signature.set'<T extends System>(systemClass: TSystemCtor<T>, signature: TSignature): void {
        this['signature.destroy'](systemClass, signature);
    }

    /**
     * Removes a destroyed entity from every registered system's tracking set.
     */
    public 'entity.destroy'(entity: TEntity): void {
        for (const system of this._systems.values()) {
            system.entities.delete(entity);
        }
    }

    /**
     * Updates system membership whenever an entity's component signature changes.
     */
    public 'signature.change'(entity: TEntity, signature: TSignature): void {
        for (const [systemClass, system] of this._systems.entries()) {
            const _signature = this._signatures.get(systemClass);
            if (!_signature) {
                continue;
            }

            // Entity has all required component bits if (entitySignature & systemSignature) === systemSignature
            if ((signature.and(_signature)).equals(_signature)) {
                system.entities.add(entity);
            } else {
                system.entities.delete(entity);
            }
        }
    }

    /**
     * Retrieves an already registered system instance.
     */
    public get<T extends System>(systemClass: TSystemCtor<T>): T {
        const system = this._systems.get(systemClass);
        if (!system) {
            throw new Error(`System '${systemClass.name}' not registered.`);
        }
        return system as T;
    }

    call<_TKey extends Exclude<pFlex.TKeyOf<SystemManager, Function, false>, 'call'>>(method: _TKey, ...params: Parameters<SystemManager[_TKey]>): ReturnType<SystemManager[_TKey]> {
        const _fn = this[method];
        return _fn.apply(this, params)
    }
}
