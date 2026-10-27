
export class Unique<_T> {
    protected _value: _T | null;
    constructor(value: _T | null = null) {
        this._value = value;
    }

    public get(): _T {
        if(this._value === null) {
            throw new Error("Accessing moved-from Unique");
        }
        return this._value;
    }

    public release(): _T | null {
        const _temp = this._value;
        this._value = null;
        return _temp;
    }

    public reset(value: _T | null = null): void {
        this._value = value;
    }

}
