
export type TEffect = "DOT" | "STUN" | "BUFF"

export class EffectStatus {
    id: string;
    type: TEffect
    level: number;
    duration: number;
    value: number;
}
