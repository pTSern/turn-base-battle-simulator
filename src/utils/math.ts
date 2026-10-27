
export class IMax {
    max: number;
    current: number;
}

export interface IMaxThreshold extends IMax {
    threshold: TPercent;
}

export type TPercent = number;

export interface ISize {
    width: number;
    height: number;
}

export interface IVec2 {
    x: number;
    y: number;
}

export interface IVec3 extends IVec2 {
    z: number;
}

export interface IVec4 extends IVec3 {
    w: number;
}

export interface IColor {
    r: number;
    g: number;
    b: number;
    a: number;
}

export class Vec2 implements IVec2 {
    public x: number;
    public y: number;

    constructor()
    constructor(x: number, y: number)
    constructor(data: IVec2)
    constructor(x: number | IVec2 = 0, y: number = 0) {
        if(typeof x === 'object') {
            this.x = x.x;
            this.y = x.y;
        } else if(typeof x === 'number' && typeof y === 'number') {
            this.x = x;
            this.y = y;
        } else {
            this.x = 0;
            this.y = 0;
        }
    }

    "=="(other: IVec2): boolean {
        return this.x === other.x && this.y === other.y;
    }

    "==="(other: IVec2): boolean {
        return other instanceof Vec2 && this.x === other.x && this.y === other.y;
    }

    "="(other: IVec2): Vec2 {
        this.x = other.x;
        this.y = other.y;
        return this;
    }

    '+='(other: IVec2): Vec2 {
        this.x += other.x;
        this.y += other.y;
        return this;
    }

    '-='(other: IVec2): Vec2 {
        this.x -= other.x;
        this.y -= other.y;
        return this;
    }

    '*='(other: IVec2): Vec2 {
        this.x *= other.x;
        this.y *= other.y;
        return this;
    }

    '+'(other: IVec2, out?: Vec2): Vec2 {
        out = out ? out['='](this) : new Vec2(this);
        return out['+='](other);
    }

    '-'(other: IVec2, out?: Vec2): Vec2 {
        out = out ? out['='](this) : new Vec2(this);
        return out['-='](other);
    }

    '*'(other: IVec2, out?: Vec2): Vec2 {
        out = out ? out['='](this) : new Vec2(this);
        return out['*='](other);
    }

    x2f(x: number, y: number, out?: Vec2): Vec2 {
        out = out ? out['='](this) : new Vec2(this);

        out.x = out.x * x;
        out.y = out.y * y;

        return out
    }

    operator<_TKey extends Exclude<pFlex.TKeyOf<Vec2, Function, false>, 'operator'>>(method: _TKey, ...params: Parameters<Vec2[_TKey]>): ReturnType<Vec2[_TKey]> {
        const _fn = this[method];
        return _fn.apply(this, params)
    }
}

export class Vec3 implements IVec3 {
    x: number;
    y: number;
    z: number;

    constructor()
    constructor(x: number, y: number, z?: number)
    constructor(data: IVec3)
    constructor(x: number | IVec3 = 0, y: number = 0, z: number = 0) {
        if(typeof x === 'object') {
            this.x = x.x;
            this.y = x.y;
            this.z = x.z
        } else if(typeof x === 'number' && typeof y === 'number') {
            this.x = x;
            this.y = y;
            this.z = z || 0;
        } else {
            this.x = 0;
            this.y = 0;
            this.z = 0;
        }
    }

    "=="(other: IVec3): boolean {
        return this.x === other.x && this.y === other.y;
    }

    "==="(other: IVec3): boolean {
        return other instanceof Vec3 && this.x === other.x && this.y === other.y;
    }

    "="(other: IVec3): Vec3 {
        this.x = other.x;
        this.y = other.y;
        this.z = other.z;
        return this;
    }

    '+='(other: IVec3): Vec3 {
        this.x += other.x;
        this.y += other.y;
        this.z += other.z;
        return this;
    }

    '-='(other: IVec3): Vec3 {
        this.x -= other.x;
        this.y -= other.y;
        this.z -= other.z;
        return this;
    }

    '*='(other: IVec3): Vec3 {
        this.x *= other.x;
        this.y *= other.y;
        this.z *= other.z;
        return this;
    }

    '+'(other: IVec3, out?: Vec3): Vec3 {
        out = out ? out['='](this) : new Vec3(this);
        return out['+='](other);
    }

    '-'(other: IVec3, out?: Vec3): Vec3 {
        out = out ? out['='](this) : new Vec3(this);
        return out['-='](other);
    }

    '*'(other: IVec3, out?: Vec3): Vec3 {
        out = out ? out['='](this) : new Vec3(this);
        return out['*='](other);
    }

    operator<_TKey extends Exclude<pFlex.TKeyOf<Vec3, Function, false>, 'operator'>>(method: _TKey, ...params: Parameters<Vec3[_TKey]>): ReturnType<Vec3[_TKey]> {
        const _fn = this[method];
        return _fn.apply(this, params)
    }
}


export class Vec4 implements IVec4 {
    x: number;
    y: number;
    z: number;
    w: number;

    constructor()
    constructor(x: number, y: number, z: number, w: number)
    constructor(data: IVec4)
    constructor(x: number | IVec4 = 0, y: number = 0, z: number = 0, w: number = 0) {
        if(typeof x === 'object') {
            this.x = x.x;
            this.y = x.y;
            this.z = x.z
            this.w = x.w;
        } else if(typeof x === 'number' && typeof y === 'number' && typeof z === 'number' && typeof w === 'number') {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
        } else {
            this.x = 0;
            this.y = 0;
            this.z = 0;
            this.w = 0;
        }
    }

    "=="(other: IVec4): boolean {
        return this.x === other.x && this.y === other.y;
    }

    "==="(other: IVec4): boolean {
        return other instanceof Vec4 && this.x === other.x && this.y === other.y;
    }

    "="(other: IVec4): Vec4 {
        this.x = other.x;
        this.y = other.y;
        this.z = other.z;
        this.w = other.w;
        return this;
    }

    '+='(other: IVec4): Vec4 {
        this.x += other.x;
        this.y += other.y;
        this.z += other.z;
        this.w += other.w;
        return this;
    }

    '-='(other: IVec4): Vec4 {
        this.x -= other.x;
        this.y -= other.y;
        this.z -= other.z;
        this.w -= other.w;
        return this;
    }

    '*='(other: IVec4): Vec4 {
        this.x *= other.x;
        this.y *= other.y;
        this.z *= other.z;
        this.w *= other.w;
        return this;
    }

    '+'(other: IVec4, out?: Vec4): Vec4 {
        out = out ? out['='](this) : new Vec4(this);
        return out['+='](other);
    }

    '-'(other: IVec4, out?: Vec4): Vec4 {
        out = out ? out['='](this) : new Vec4(this);
        return out['-='](other);
    }

    '*'(other: IVec4, out?: Vec4): Vec4 {
        out = out ? out['='](this) : new Vec4(this);
        return out['*='](other);
    }

    operator<_TKey extends Exclude<pFlex.TKeyOf<Vec4, Function, false>, 'operator'>>(method: _TKey, ...params: Parameters<Vec4[_TKey]>): ReturnType<Vec4[_TKey]> {
        const _fn = this[method];
        return _fn.apply(this, params)
    }
}

export class Mat44 {
    protected _map: number[][] = [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ];

    constructor(map: number[][] | number[] = undefined, second: number[] = undefined, third: number[] = undefined, fourth: number[] = undefined) {
        if (Array.isArray(map[0])) {
            this._map = map as number[][];
        } else {
            this._map = [
                map as number[],
                second || [0, 0, 0, 0],
                third || [0, 0, 0, 0],
                fourth || [0, 0, 0, 0]
            ]
        }
    }

    multiply(other: Mat44): Mat44
    multiply(other: IVec4): IVec4
    multiply(other: Mat44 | IVec4): Mat44 | IVec4 {
        if(other instanceof Mat44) {
            const result = new Mat44();
            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 4; j++) {
                    result._map[i][j] = 0;
                    for (let k = 0; k < 4; k++) {
                        result._map[i][j] += this._map[i][k] * other._map[k][j];
                    }
                }
            }
            return result;
        } else {
            const result: IVec4 = { x: 0, y: 0, z: 0, w: 0 };
            result.x = this._map[0][0] * other.x + this._map[0][1] * other.y + this._map[0][2] * other.z + this._map[0][3] * other.w;
            result.y = this._map[1][0] * other.x + this._map[1][1] * other.y + this._map[1][2] * other.z + this._map[1][3] * other.w;
            result.z = this._map[2][0] * other.x + this._map[2][1] * other.y + this._map[2][2] * other.z + this._map[2][3] * other.w;
            result.w = this._map[3][0] * other.x + this._map[3][1] * other.y + this._map[3][2] * other.z + this._map[3][3] * other.w;
            return result;
        }
    }

}

const _$mask: bigint = 0xFFFFFFFFFFFFFFFFn;
export class Xorshift128p {
    constructor(protected _s0: bigint, protected _s1: bigint) {
        if(_s0 === 0n && _s1 === 0n) {
            throw new Error("Xorshift128p: Seed values cannot both be zero.");
        }

        this._s0 &= _$mask;
        this._s1 &= _$mask;
    }

    get bigint() {
        let s1 = this._s0;
        const s0 = this._s1;
        const result = (s0 + s1) & _$mask;
        this._s0 = s0;
        s1 ^= (s1 << 23n) & _$mask;

        this._s1 = s1 ^ s0 ^ (s1 >> 17n) ^ (s0 >> 26n);

        return result;
    }

    get float() {
        return Number(this.bigint >> 11n) / 9007199254740991;
    }
}
