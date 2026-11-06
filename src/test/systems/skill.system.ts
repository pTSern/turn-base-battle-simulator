import { System, TEntity, World } from "../../core";
import { TBattleEvent, ISkillDefinition, IActiveEffect } from "../types";
import { HeroComponent, SkillComponent, TurnComponent, EffectComponent } from "../components";
import { EffectSystem } from "./effect.system";
import { Xorshift128p } from "../../utils";
export class SkillSystem extends System {
    init(): void {
        // Lifecycle hook
    }

    update(_dt: number): void {
        // Real-time hook if needed
    }

    /**
     * Decrements cooldowns for all registered entities at round start.
     */
    tickCooldowns(world: World<TBattleEvent>): void {
        for (const entity of this.entities) {
            const skillComp = world.get_component(entity, SkillComponent);
            skillComp.decrementCooldowns();
        }
    }

    /**
     * AI/Decision rule: Selects the most powerful affordable ready skill, or basic attack.
     */
    selectSkill(actor: TEntity, world: World<TBattleEvent>): ISkillDefinition {
        const hero = world.get_component(actor, HeroComponent);
        const skillComp = world.get_component(actor, SkillComponent);
        const turn = world.get_component(actor, TurnComponent);

        // If silenced, cannot use skills with energy cost
        if (turn.isSilenced) {
            const basic = skillComp.skills.find(s => s.energyCost === 0);
            if (basic) return basic;
        }

        // Sort skills by energyCost descending (prioritize Ultimate / Special)
        const candidates = [...skillComp.skills].sort((a, b) => b.energyCost - a.energyCost);
        for (const skill of candidates) {
            if (skill.energyCost > 0 && hero.energy >= skill.energyCost && skillComp.isReady(skill.id)) {
                return skill;
            }
        }

        // Fall back to basic attack
        return candidates.find(s => s.energyCost === 0) ?? candidates[0];
    }

    /**
     * Executes the chosen skill from actor against target.
     */
    executeSkill(
        actor: TEntity,
        target: TEntity,
        skill: ISkillDefinition,
        world: World<TBattleEvent>,
        effectSystem: EffectSystem,
        rng?: Xorshift128p
    ): string[] {
        const actorHero = world.get_component(actor, HeroComponent);
        const actorSkill = world.get_component(actor, SkillComponent);
        const logs: string[] = [];

        // 1. Spend energy and set cooldown
        if (skill.energyCost > 0) {
            actorHero.energy -= skill.energyCost;
        }
        if (skill.cooldown > 0) {
            actorSkill.setCooldown(skill.id, skill.cooldown);
        }

        // Energy gain: basic attack grants 25 energy, specials grant 10
        const gainedEnergy = skill.energyCost === 0 ? 25 : 10;
        actorHero.energy = Math.min(actorHero.maxEnergy, actorHero.energy + gainedEnergy);

        const targetEntity = skill.target === "SELF" ? actor : target;
        const targetHero = world.get_component(targetEntity, HeroComponent);
        const targetEffect = world.get_component(targetEntity, EffectComponent);

        logs.push(`⚔️  [${actorHero.name}] casts [${skill.name}] on [${targetHero.name}] (Energy: ${actorHero.energy}/${actorHero.maxEnergy})`);
        world.send_event("ACTION_EXECUTE");

        // 2. Damage calculation (if offensive skill)
        if (skill.target === "ENEMY" && skill.damageMultiplier > 0) {
            const isCrit = rng ? rng.float < 0.20 : false;
            const critMult = isCrit ? 1.5 : 1.0;
            const variance = rng ? 0.95 + rng.float * 0.10 : 1.0;
            const rawDamage = actorHero.attack * skill.damageMultiplier * critMult * variance;
            // Standard mitigation: damage * (100 / (100 + defense))
            const mitigated = Math.max(1, Math.round(rawDamage * (100 / (100 + targetHero.defense))));

            let damageDealt = mitigated;
            let absorbed = 0;

            if (targetEffect.shield > 0) {
                if (targetEffect.shield >= damageDealt) {
                    absorbed = damageDealt;
                    targetEffect.shield -= damageDealt;
                    damageDealt = 0;
                } else {
                    absorbed = targetEffect.shield;
                    damageDealt -= targetEffect.shield;
                    targetEffect.shield = 0;
                }
            }

            targetHero.hp = Math.max(0, targetHero.hp - damageDealt);

            // Defensive energy gain: taking damage builds energy (+15)
            targetHero.energy = Math.min(targetHero.maxEnergy, targetHero.energy + 15);

            let hitMsg = isCrit ? `🔥 CRITICAL HIT! Deals ${damageDealt} damage to [${targetHero.name}]` : `💥 Deals ${damageDealt} damage to [${targetHero.name}]`;
            if (absorbed > 0) {
                hitMsg += ` (${absorbed} absorbed by Shield, Shield left: ${targetEffect.shield})`;
            }
            hitMsg += ` | HP: ${targetHero.hp}/${targetHero.maxHp}`;
            logs.push(hitMsg);
            world.send_event("DAMAGE_DEALT");

            if (targetHero.hp <= 0) {
                targetHero.alive = false;
                logs.push(`💀 [${targetHero.name}] has fallen in combat!`);
                world.send_event("HERO_DIED");
                return logs;
            }
        }

        // 3. Self-heal (if any)
        if (skill.healAmount && skill.healAmount > 0) {
            const actualHeal = Math.min(skill.healAmount, actorHero.maxHp - actorHero.hp);
            actorHero.hp += actualHeal;
            logs.push(`💚 [${actorHero.name}] heals for ${actualHeal} HP (HP: ${actorHero.hp}/${actorHero.maxHp})`);
            world.send_event("HEAL_APPLIED");
        }

        // 4. Apply status effects (if any)
        if (skill.appliedEffects && skill.appliedEffects.length > 0) {
            for (const effectDef of skill.appliedEffects) {
                if (effectDef.procChance !== undefined && rng && rng.float >= effectDef.procChance) {
                    logs.push(`🛡️  [${targetHero.name}] resisted effect [${effectDef.name}]!`);
                    continue;
                }
                const activeEffect: IActiveEffect = {
                    ...effectDef,
                    sourceEntity: actor,
                    initialDuration: effectDef.duration
                };
                const applyMsg = effectSystem.applyEffect(targetEntity, activeEffect, world);
                logs.push(`✨ ${applyMsg}`);
            }
        }

        return logs;
    }
}
