import { System, TEntity, World } from "../../core";
import { TBattleEvent, IActiveEffect } from "../types";
import { HeroComponent, EffectComponent, TurnComponent } from "../components";

export class EffectSystem extends System {
    init(): void {
        // Lifecycle hook
    }

    update(dt: number): void {
        // Delta-time tick if used in real-time, can be called in turn-based steps
    }

    /**
     * Recalculates effective stats (attack, defense, speed) based on baseStats and active BUFF/DEBUFF.
     */
    recalculateStats(entity: TEntity, world: World<TBattleEvent>): void {
        const hero = world.get_component(entity, HeroComponent);
        const effectComp = world.get_component(entity, EffectComponent);
        const turnComp = world.get_component(entity, TurnComponent);

        let attackMod = 0;
        let defenseMod = 0;
        let speedMod = 0;
        let totalShield = 0;
        let isStunned = false;
        let isSilenced = false;

        for (const effect of effectComp.effects) {
            if (effect.type === "BUFF" && effect.targetStat) {
                if (effect.targetStat === "attack") attackMod += effect.value;
                if (effect.targetStat === "defense") defenseMod += effect.value;
                if (effect.targetStat === "speed") speedMod += effect.value;
            } else if (effect.type === "DEBUFF" && effect.targetStat) {
                if (effect.targetStat === "attack") attackMod -= effect.value;
                if (effect.targetStat === "defense") defenseMod -= effect.value;
                if (effect.targetStat === "speed") speedMod -= effect.value;
            } else if (effect.type === "SHIELD") {
                totalShield += effect.value;
            } else if (effect.type === "STUN") {
                isStunned = true;
            } else if (effect.type === "SILENCE") {
                isSilenced = true;
            }
        }

        hero.attack = Math.max(1, Math.round(hero.baseAttack * (1 + attackMod)));
        hero.defense = Math.max(0, Math.round(hero.baseDefense * (1 + defenseMod)));
        hero.speed = Math.max(1, Math.round(hero.baseSpeed * (1 + speedMod)));
        effectComp.shield = Math.max(0, totalShield);
        turnComp.isStunned = isStunned;
        turnComp.isSilenced = isSilenced;
    }

    /**
     * Processes round-start effects (DOT damage, HOT heals, duration decrements).
     * Returns a summary list of effect event logs.
     */
    tickRoundEffects(world: World<TBattleEvent>, round: number): string[] {
        const logs: string[] = [];

        for (const entity of this.entities) {
            const hero = world.get_component(entity, HeroComponent);
            if (!hero.alive) continue;

            const effectComp = world.get_component(entity, EffectComponent);
            const expiredIndices: number[] = [];

            // 1. First recalculate stats to ensure proper modifiers
            this.recalculateStats(entity, world);

            // 2. Process active effects
            for (let i = 0; i < effectComp.effects.length; i++) {
                const effect = effectComp.effects[i];

                if (effect.type === "DOT") {
                    hero.hp = Math.max(0, hero.hp - effect.value);
                    logs.push(`[Round ${round}] 🩸 [${hero.name}] suffers ${effect.value} DOT damage from [${effect.name}] (HP: ${hero.hp}/${hero.maxHp})`);
                    world.send_event("EFFECT_TICK");

                    if (hero.hp <= 0) {
                        hero.alive = false;
                        logs.push(`[Round ${round}] 💀 [${hero.name}] succumbed to [${effect.name}]!`);
                        world.send_event("HERO_DIED");
                        break;
                    }
                } else if (effect.type === "HOT") {
                    const heal = Math.min(effect.value, hero.maxHp - hero.hp);
                    hero.hp += heal;
                    logs.push(`[Round ${round}] 💚 [${hero.name}] regenerates ${heal} HP from [${effect.name}] (HP: ${hero.hp}/${hero.maxHp})`);
                    world.send_event("EFFECT_TICK");
                }

                // Decrement duration
                effect.duration -= 1;
                if (effect.duration <= 0) {
                    expiredIndices.push(i);
                }
            }

            // 3. Remove expired effects (in reverse order to preserve indices)
            for (let j = expiredIndices.length - 1; j >= 0; j--) {
                const expiredIndex = expiredIndices[j];
                const expired = effectComp.effects[expiredIndex];
                logs.push(`[Round ${round}] ⏳ Effect [${expired.name}] on [${hero.name}] expired.`);
                effectComp.removeEffect(expiredIndex);
                world.send_event("EFFECT_EXPIRED");
            }

            // 4. Recalculate stats post-expiry
            this.recalculateStats(entity, world);
        }

        return logs;
    }

    /**
     * Applies an effect to a target entity.
     */
    applyEffect(target: TEntity, effect: IActiveEffect, world: World<TBattleEvent>): string {
        const hero = world.get_component(target, HeroComponent);
        const effectComp = world.get_component(target, EffectComponent);

        effectComp.addEffect({ ...effect });
        this.recalculateStats(target, world);
        world.send_event("EFFECT_APPLIED");

        return `Applied [${effect.name}] (${effect.type}, duration: ${effect.duration}r) to [${hero.name}]`;
    }
}
