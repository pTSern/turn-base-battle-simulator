import { IActiveEffect } from "../types";

export class EffectComponent {
    effects: IActiveEffect[] = [];
    shield: number = 0;

    addEffect(effect: IActiveEffect): void {
        this.effects.push(effect);
    }

    removeEffect(index: number): void {
        this.effects.splice(index, 1);
    }

    hasType(type: IActiveEffect["type"]): boolean {
        return this.effects.some(e => e.type === type);
    }
}
