import { TEntity } from "../core";

export type TBattleEvent =
    | "ROUND_START"
    | "ROUND_END"
    | "TURN_START"
    | "ACTION_EXECUTE"
    | "DAMAGE_DEALT"
    | "HEAL_APPLIED"
    | "EFFECT_APPLIED"
    | "EFFECT_TICK"
    | "EFFECT_EXPIRED"
    | "HERO_DIED"
    | "BATTLE_END";

export type TEffectType = "DOT" | "HOT" | "BUFF" | "DEBUFF" | "SHIELD" | "STUN" | "SILENCE";

export interface IEffectDefinition {
    id: string;
    name: string;
    type: TEffectType;
    duration: number; // rounds remaining
    value: number; // damage/heal per tick, buff percentage, or shield amount
    targetStat?: "attack" | "defense" | "speed";
    procChance?: number;
}

export interface IActiveEffect extends IEffectDefinition {
    sourceEntity: TEntity;
    initialDuration: number;
}

export type TSkillTarget = "ENEMY" | "SELF";

export interface ISkillDefinition {
    id: string;
    name: string;
    description: string;
    energyCost: number;
    cooldown: number; // in rounds
    target: TSkillTarget;
    damageMultiplier: number; // e.g. 1.0 = 100% of attack
    healAmount?: number;
    appliedEffects?: IEffectDefinition[];
}

export interface ICombatLogEntry {
    round: number;
    turn: number;
    actor: string;
    actorId: TEntity;
    action: string;
    target?: string;
    targetId?: TEntity;
    damage?: number;
    heal?: number;
    absorbed?: number;
    remainingHp?: number;
    details: string[];
}
