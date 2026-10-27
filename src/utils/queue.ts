import * as js from './js';

export class Queue<_T> {
    protected _items: Record<number, _T> = js.call('create.map', true) as Record<number, _T>;
    protected _head: number = 0;
    protected _tail: number = 0;

    enqueue(item: _T): void {
        this._items[this._tail] = item;
        this._tail++;
    }

    dequeue(): _T | undefined {
        if (this.empty) {
            return undefined;
        }
        return this._items[this._head];
    }

    get size() {
        return this._tail - this._head; 
    }

    get empty() {
        return this._tail === this._head;
    }

    clear(): void {
        this._items = js.call('create.map', true) as Record<number, _T>;
        this._head = 0;
        this._tail = 0;
    }
}
