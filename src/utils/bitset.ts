import js from "./js";

/**
 * 32-bit SWAR (SIMD Within A Register) population count.
 * Counts set bits in O(1) operations per 32-bit word.
 */
function popcount32(x: number): number {
    x = x - ((x >>> 1) & 0x55555555);
    x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
    return Math.imul((x + (x >>> 4)) & 0x0f0f0f0f, 0x01010101) >>> 24;
}

/**
 * Count trailing zeros in a non-zero 32-bit integer using Math.clz32.
 */
function ctz32(x: number): number {
    return 31 - Math.clz32(x & -x);
}

export class BitSet<N extends number = number> {
    public readonly size: N;
    private readonly words: Uint32Array;
    private readonly lastWordMask: number;

    /**
     * @param size Fixed number of bits (N).
     * @param initial Optional initial value: number, bigint, or binary string (e.g., "101101").
     */
    constructor(size: N, initial?: number | bigint | string) {
        if (!Number.isInteger(size) || size < 0) {
            throw new RangeError(`BitSet size must be a non-negative integer, got ${size}`);
        }

        this.size = size;
        const wordCount = Math.ceil(size / 32);
        this.words = new Uint32Array(wordCount);

        const rem = size & 31;
        this.lastWordMask = size === 0 ? 0 : rem === 0 ? 0xffffffff : (1 << rem) - 1;

        if (initial !== undefined) {
            this._from(initial);
        }
    }

    // =========================================================================
    // 1. C++ Non-Member Static Operators (Takes 2 BitSets -> Returns New)
    // =========================================================================

    /** Equivalent to C++: lhs & rhs */
    public static and<S extends number>(lhs: BitSet<S>, rhs: BitSet<S>): BitSet<S> {
        return lhs.clone()['assign.and'](rhs);
    }

    /** Equivalent to C++: lhs | rhs */
    public static or<S extends number>(lhs: BitSet<S>, rhs: BitSet<S>): BitSet<S> {
        return lhs.clone()['assign.or'](rhs);
    }

    /** Equivalent to C++: lhs ^ rhs */
    public static xor<S extends number>(lhs: BitSet<S>, rhs: BitSet<S>): BitSet<S> {
        return lhs.clone()['assign.xor'](rhs);
    }

    /** Equivalent to C++: ~bs */
    public static not<S extends number>(bs: BitSet<S>): BitSet<S> {
        return bs.clone().flip();
    }

    /** Equivalent to: lhs + rhs (modular N-bit binary addition) */
    public static add<S extends number>(lhs: BitSet<S>, rhs: BitSet<S>): BitSet<S> {
        return lhs.clone()['assign.add'](rhs);
    }

    /** Equivalent to: lhs - rhs (modular N-bit two's-complement subtraction) */
    public static sub<S extends number>(lhs: BitSet<S>, rhs: BitSet<S>): BitSet<S> {
        return lhs.clone()['assign.sub'](rhs);
    }

    /** Equivalent to: lhs * rhs (modular N-bit binary multiplication) */
    public static mul<S extends number>(lhs: BitSet<S>, rhs: BitSet<S>): BitSet<S> {
        return lhs.mul(rhs);
    }

    // =========================================================================
    // 2. Internal Helpers
    // =========================================================================

    /** Clears unused upper bits in the final 32-bit word (mirrors C++ _M_do_sanitize). */
    private sanitize(): void {
        if (this.words.length > 0) {
            this.words[this.words.length - 1] &= this.lastWordMask;
        }
    }

    private _assertBounds(pos: number): void {
        if (!Number.isInteger(pos) || pos < 0 || pos >= this.size) {
            throw new RangeError(`Index ${pos} is out of bounds for BitSet of size ${this.size}`);
        }
    }

    private _assertSameSize(other: BitSet<N>): void {
        if (this.size !== other.size) {
            throw new TypeError(`BitSet size mismatch: ${this.size} vs ${other.size}`);
        }
    }

    private _from(val: number | bigint | string): void {
        if (typeof val === "number") {
            if (!Number.isFinite(val) || val < 0) {
                throw new RangeError("Initial number must be a finite non-negative value");
            }
            this._from(BigInt(Math.floor(val)));
        } else if (typeof val === "bigint") {
            if (val < 0n) {
                throw new RangeError("Initial bigint must be non-negative");
            }
            let temp = val;
            for (let i = 0; i < this.words.length && temp > 0n; i++) {
                this.words[i] = Number(temp & 0xffffffffn);
                temp >>= 32n;
            }
            this.sanitize();
        } else if (typeof val === "string") {
            // C++ std::bitset reads strings from MSB (left) to LSB (right, index 0)
            const clean = val.trim();
            const len = Math.min(clean.length, this.size);
            for (let i = 0; i < len; i++) {
                const char = clean[clean.length - 1 - i];
                if (char === "1") {
                    this.words[i >>> 5] |= 1 << (i & 31);
                } else if (char !== "0") {
                    throw new SyntaxError(`Invalid binary character '${char}' in BitSet string`);
                }
            }
        }
    }

    // =========================================================================
    // 3. Element Access
    // =========================================================================

    /** Bounds-checked bit read (equivalent to std::bitset::test). */
    public test(pos: number): boolean {
        this._assertBounds(pos);
        return (this.words[pos >>> 5] & (1 << (pos & 31))) !== 0;
    }

    /** Unchecked fast bit read returning 0 or 1 (equivalent to operator[]). */
    public get(pos: number): 0 | 1 {
        return ((this.words[pos >>> 5] >>> (pos & 31)) & 1) as 0 | 1;
    }

    // =========================================================================
    // 4. Capacity & State Queries
    // =========================================================================

    /** Returns the number of bits set to true (equivalent to std::bitset::count). */
    public count(): number {
        let total = 0;
        for (let i = 0; i < this.words.length; i++) {
            total += popcount32(this.words[i]);
        }
        return total;
    }

    /** Checks if all bits are set to true. */
    public all(): boolean {
        if (this.size === 0) return true;
        const lastIdx = this.words.length - 1;
        for (let i = 0; i < lastIdx; i++) {
            if (this.words[i] !== 0xffffffff) return false;
        }
        return this.words[lastIdx] === (this.lastWordMask >>> 0);
    }

    /** Checks if any bit is set to true. */
    public any(): boolean {
        for (let i = 0; i < this.words.length; i++) {
            if (this.words[i] !== 0) return true;
        }
        return false;
    }

    /** Checks if none of the bits are set to true. */
    public none(): boolean {
        return !this.any();
    }

    // =========================================================================
    // 5. Modifiers (In-Place, Chainable)
    // =========================================================================

    /** Sets all bits to true, or sets the bit at `pos` to `val` (default true). */
    public set(pos?: number, val: boolean = true): this {
        if (pos === undefined) {
            this.words.fill(0xffffffff);
            this.sanitize();
            return this;
        }
        this._assertBounds(pos);
        if (val) {
            this.words[pos >>> 5] |= 1 << (pos & 31);
        } else {
            this.words[pos >>> 5] &= ~(1 << (pos & 31));
        }
        return this;
    }

    /** Resets all bits to false, or resets the bit at `pos` to false. */
    public reset(pos?: number): this {
        if (pos === undefined) {
            this.words.fill(0);
            return this;
        }
        this._assertBounds(pos);
        this.words[pos >>> 5] &= ~(1 << (pos & 31));
        return this;
    }

    /** Flips all bits, or flips the bit at `pos`. */
    public flip(pos?: number): this {
        if (pos === undefined) {
            for (let i = 0; i < this.words.length; i++) {
                this.words[i] = ~this.words[i];
            }
            this.sanitize();
            return this;
        }
        this._assertBounds(pos);
        this.words[pos >>> 5] ^= 1 << (pos & 31);
        return this;
    }

    public clone(): BitSet<N> {
        const copy = new BitSet(this.size);
        copy.words.set(this.words);
        return copy;
    }

    // =========================================================================
    // 6. Bitwise Operations & Shifts (In-Place & Non-Mutating)
    // =========================================================================

    /** In-place bitwise AND (operator &=). */
    public 'assign.and'(other: BitSet<N>): this {
        this._assertSameSize(other);
        for (let i = 0; i < this.words.length; i++) {
            this.words[i] &= other.words[i];
        }
        return this;
    }

    /** In-place bitwise OR (operator |=). */
    public 'assign.or'(other: BitSet<N>): this {
        this._assertSameSize(other);
        for (let i = 0; i < this.words.length; i++) {
            this.words[i] |= other.words[i];
        }
        return this;
    }

    /** In-place bitwise XOR (operator ^=). */
    public 'assign.xor'(other: BitSet<N>): this {
        this._assertSameSize(other);
        for (let i = 0; i < this.words.length; i++) {
            this.words[i] ^= other.words[i];
        }
        return this;
    }

    /** Non-mutating bitwise AND (operator &). */
    public and(other: BitSet<N>): BitSet<N> {
        return this.clone()['assign.and'](other);
    }

    /** Non-mutating bitwise OR (operator |). */
    public or(other: BitSet<N>): BitSet<N> {
        return this.clone()['assign.or'](other);
    }

    /** Non-mutating bitwise XOR (operator ^). */
    public xor(other: BitSet<N>): BitSet<N> {
        return this.clone()['assign.xor'](other);
    }

    /** Non-mutating bitwise NOT (operator ~). */
    public not(): BitSet<N> {
        return this.clone().flip();
    }

    /** Alias for non-mutating bitwise AND. */
    public 'bitwise.and'(other: BitSet<N>): BitSet<N> {
        return this.and(other);
    }

    /** Alias for non-mutating bitwise OR. */
    public 'bitwise.orb'(other: BitSet<N>): BitSet<N> {
        return this.or(other);
    }

    /** Alias for non-mutating bitwise XOR. */
    public 'bitwise.xor'(other: BitSet<N>): BitSet<N> {
        return this.xor(other);
    }

    /** Alias for non-mutating bitwise NOT. */
    public 'bitwise.not'(): BitSet<N> {
        return this.not();
    }

    /** In-place left shift (operator <<=). */
    public 'shift.left'(shift: number): this {
        if (!Number.isInteger(shift) || shift < 0) {
            throw new RangeError(`Shift count must be a non-negative integer, got ${shift}`);
        }
        if (shift === 0 || this.size === 0) return this;
        if (shift >= this.size) return this.reset();

        const wordShift = shift >>> 5;
        const bitShift = shift & 31;

        for (let i = this.words.length - 1; i >= wordShift; i--) {
            if (bitShift === 0) {
                this.words[i] = this.words[i - wordShift];
            } else {
                const high = this.words[i - wordShift] << bitShift;
                const low =
                    i - wordShift - 1 >= 0
                        ? this.words[i - wordShift - 1] >>> (32 - bitShift)
                        : 0;
                this.words[i] = high | low;
            }
        }
        this.words.fill(0, 0, wordShift);
        this.sanitize();
        return this;
    }

    /** In-place logical right shift (operator >>=). */
    public 'shift.right'(shift: number): this {
        if (!Number.isInteger(shift) || shift < 0) {
            throw new RangeError(`Shift count must be a non-negative integer, got ${shift}`);
        }
        if (shift === 0 || this.size === 0) return this;
        if (shift >= this.size) return this.reset();

        const wordShift = shift >>> 5;
        const bitShift = shift & 31;
        const limit = this.words.length - 1 - wordShift;

        for (let i = 0; i <= limit; i++) {
            if (bitShift === 0) {
                this.words[i] = this.words[i + wordShift];
            } else {
                const low = this.words[i + wordShift] >>> bitShift;
                const high =
                    i + wordShift + 1 < this.words.length
                        ? this.words[i + wordShift + 1] << (32 - bitShift)
                        : 0;
                this.words[i] = low | high;
            }
        }
        this.words.fill(0, limit + 1);
        return this;
    }

    /** Non-mutating left shift (operator <<). */
    public 'left.shift'(shift: number): BitSet<N> {
        return this.clone()['shift.left'](shift);
    }

    /** Non-mutating logical right shift (operator >>). */
    public 'right.shift'(shift: number): BitSet<N> {
        return this.clone()['shift.right'](shift);
    }

    // =========================================================================
    // 7. Binary Mathematical Arithmetic (+, -, *, /, %)
    // =========================================================================

    /**
     * In-place N-bit addition (lhs += rhs) with 32-bit ripple carry.
     * Wraps around modulo 2^N on overflow, matching C++ unsigned arithmetic.
     */
    public 'assign.add'(other: BitSet<N>): this {
        this._assertSameSize(other);
        let carry = 0;
        for (let i = 0; i < this.words.length; i++) {
            const sum = this.words[i] + other.words[i] + carry;
            this.words[i] = sum >>> 0;
            carry = sum > 0xffffffff ? 1 : 0;
        }
        this.sanitize();
        return this;
    }

    /** Non-mutating N-bit addition (lhs + rhs). */
    public add(other: BitSet<N>): BitSet<N> {
        return this.clone()['assign.add'](other);
    }

    /**
     * In-place N-bit subtraction (lhs -= rhs) with 32-bit borrow propagation.
     * Wraps around modulo 2^N using two's complement when rhs exceeds lhs.
     */
    public 'assign.sub'(other: BitSet<N>): this {
        this._assertSameSize(other);
        let borrow = 0;
        for (let i = 0; i < this.words.length; i++) {
            const diff = this.words[i] - other.words[i] - borrow;
            this.words[i] = diff >>> 0;
            borrow = diff < 0 ? 1 : 0;
        }
        this.sanitize();
        return this;
    }

    /** Non-mutating N-bit subtraction (lhs - rhs). */
    public sub(other: BitSet<N>): BitSet<N> {
        return this.clone()['assign.sub'](other);
    }

    /**
     * Word-level N-bit multiplication (lhs * rhs) in O((N/32)^2) time.
     */
    public mul(other: BitSet<N>): BitSet<N> {
        this._assertSameSize(other);
        const result = new BitSet(this.size);
        const n = this.words.length;

        for (let i = 0; i < n; i++) {
            if (this.words[i] === 0) continue;
            let carry = 0n;
            const a = BigInt(this.words[i]);

            for (let j = 0; i + j < n; j++) {
                const prod =
                    a * BigInt(other.words[j]) + BigInt(result.words[i + j]) + carry;
                result.words[i + j] = Number(prod & 0xffffffffn);
                carry = prod >> 32n;
            }
        }
        result.sanitize();
        return result;
    }

    /** In-place N-bit multiplication (lhs *= rhs). */
    public 'assign.mul'(other: BitSet<N>): this {
        const product = this.mul(other);
        this.words.set(product.words);
        return this;
    }

    /**
     * Unsigned binary long division returning both quotient and remainder.
     */
    public 'div.mod'(divisor: BitSet<N>): { quotient: BitSet<N>; remainder: BitSet<N> } {
        this._assertSameSize(divisor);
        if (divisor.none()) {
            throw new RangeError("Division by zero BitSet");
        }

        const quotient = new BitSet(this.size);
        const remainder = new BitSet(this.size);

        const highestBit = this.msb();
        for (let i = highestBit; i >= 0; i--) {
            remainder['shift.left'](1);
            if (this.get(i) === 1) {
                remainder.set(0, true);
            }
            if (remainder['>='](divisor)) {
                remainder['assign.sub'](divisor);
                quotient.set(i, true);
            }
        }

        return { quotient, remainder };
    }

    public div(divisor: BitSet<N>): BitSet<N> {
        return this['div.mod'](divisor).quotient;
    }

    public mod(divisor: BitSet<N>): BitSet<N> {
        return this['div.mod'](divisor).remainder;
    }

    // =========================================================================
    // 8. Relational Comparisons & Bit Scanning (MSB / LSB / _Find_first)
    // =========================================================================

    public equals(other: BitSet<N>): boolean {
        if (this.size !== other.size) return false;
        for (let i = 0; i < this.words.length; i++) {
            if (this.words[i] !== other.words[i]) return false;
        }
        return true;
    }

    /** Returns -1 if this < other, 0 if equal, 1 if this > other. */
    public compare(other: BitSet<N>): -1 | 0 | 1 {
        this._assertSameSize(other);
        for (let i = this.words.length - 1; i >= 0; i--) {
            const a = this.words[i];
            const b = other.words[i];
            if (a !== b) return a < b ? -1 : 1;
        }
        return 0;
    }

    public '<'(other: BitSet<N>): boolean {
        return this.compare(other) === -1;
    }

    public '<='(other: BitSet<N>): boolean {
        return this.compare(other) <= 0;
    }

    public '>'(other: BitSet<N>): boolean {
        return this.compare(other) === 1;
    }

    public '>='(other: BitSet<N>): boolean {
        return this.compare(other) >= 0;
    }

    /**
     * Returns the index of the lowest set bit (LSB), or -1 if no bits are set.
     * Equivalent to GCC's std::bitset::_Find_first().
     */
    public lsb(): number {
        for (let i = 0; i < this.words.length; i++) {
            const w = this.words[i];
            if (w !== 0) {
                return (i << 5) + ctz32(w);
            }
        }
        return -1;
    }

    /**
     * Returns the index of the highest set bit (MSB), or -1 if no bits are set.
     */
    public msb(): number {
        for (let i = this.words.length - 1; i >= 0; i--) {
            const w = this.words[i];
            if (w !== 0) {
                return (i << 5) + (31 - Math.clz32(w));
            }
        }
        return -1;
    }

    /**
     * Finds the next set bit strictly after `prevPos`, or -1 if none exists.
     * Equivalent to GCC's std::bitset::_Find_next(prevPos).
     */
    public findNext(prevPos: number): number {
        const pos = prevPos + 1;
        if (pos >= this.size) return -1;

        let wordIdx = pos >>> 5;
        const bitIdx = pos & 31;

        const firstWord = this.words[wordIdx] & (~0 << bitIdx);
        if (firstWord !== 0) {
            return (wordIdx << 5) + ctz32(firstWord);
        }

        for (wordIdx++; wordIdx < this.words.length; wordIdx++) {
            const w = this.words[wordIdx];
            if (w !== 0) {
                return (wordIdx << 5) + ctz32(w);
            }
        }
        return -1;
    }

    // =========================================================================
    // 9. Conversions & Primitive Coercion
    // =========================================================================

    /** Formats bits from MSB (size - 1) down to LSB (0), matching std::bitset::to_string. */
    public toString(zero: string = "0", one: string = "1"): string {
        const chars = new Array<string>(this.size);
        for (let i = this.size - 1; i >= 0; i--) {
            chars[this.size - 1 - i] = this.get(i) === 1 ? one : zero;
        }
        return chars.join("");
    }

    /** Converts to a JS safe integer (up to 53 bits), throwing RangeError on overflow. */
    public toULong(): number {
        const big = this.toULLong();
        if (big > BigInt(Number.MAX_SAFE_INTEGER)) {
            throw new RangeError("BitSet value overflows Number.MAX_SAFE_INTEGER (53 bits)");
        }
        return Number(big);
    }

    /** Converts the bitset to a BigInt (equivalent to std::bitset::to_ullong). */
    public toULLong(): bigint {
        let result = 0n;
        for (let i = this.words.length - 1; i >= 0; i--) {
            result = (result << 32n) | BigInt(this.words[i]);
        }
        return result;
    }

    public valueOf(): number {
        return this.toULong();
    }

    public [Symbol.toPrimitive](hint: "number" | "string" | "default"): number | string {
        if (hint === "string") return this.toString();
        return this.toULong();
    }
}

export type IndexedBitSet<N extends number> = BitSet<N> & {
    [index: number]: boolean;
};

interface _ICreator {
    /**
     * Wraps a BitSet in a Proxy to support C++ bracket indexing (`bs[i] = true`).
     */
    indexed<N extends number>(size: N,initial?: number | bigint | string): IndexedBitSet<N>
}

export namespace BitSet {
    export const create = js["create.map"]<_ICreator>(true);

    create.indexed = function<N extends number>(size: N, initial?: number | bigint | string): IndexedBitSet<N> {
        const bitset = new BitSet(size, initial);

        return new Proxy(bitset, {
            get(target, prop, receiver) {
                if (typeof prop === "string") {
                    const index = Number(prop);
                    if (Number.isInteger(index)) {
                        return target.test(index);
                    }
                }
                const value = Reflect.get(target, prop, receiver);
                return typeof value === "function" ? value.bind(target) : value;
            },
            set(target, prop, value, receiver) {
                if (typeof prop === "string") {
                    const index = Number(prop);
                    if (Number.isInteger(index)) {
                        target.set(index, Boolean(value));
                        return true;
                    }
                }
                return Reflect.set(target, prop, value, receiver);
            },
        }) as IndexedBitSet<N>;
    }
}
