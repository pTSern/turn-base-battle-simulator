
import { Event } from "./event";

export class EventManager<_TId extends pFlex.TKey> {
    protected _listeners = new Map<_TId, pFlex.TFunc<[Event<_TId>, void]>[]>()

    add(id: _TId, listener: pFlex.TFunc<[Event<_TId>, void]>) {
        const _lis = this._listeners.get(id) || [];
        _lis.push(listener);
        this._listeners.set(id, _lis);
    }

    send(event: Event<_TId> | _TId) {
        if(event instanceof Event) {
            const _type = event.type();

            for(const _func of this._listeners.get(_type) || []) {
                _func(event);
            }
        } else {
            for(const _func of this._listeners.get(event) || []) {
                _func(new Event(event));
            }
        }
    }

}
