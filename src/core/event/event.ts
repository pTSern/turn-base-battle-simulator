
export class Event<_TId extends pFlex.TKey> {
    protected _data = new Map<_TId, any>()

    constructor(protected _type: _TId) {}

    set<_T>(id: _TId, data: _T) {
        this._data.set(id, data)
    }

    get<_T>(id: _TId): _T | undefined {
        return this._data.get(id)
    }

    type() { return this._type}
}
