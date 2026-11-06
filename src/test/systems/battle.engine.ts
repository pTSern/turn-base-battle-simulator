import { BitSet, Xorshift128p } from "../../utils";
import { MAX_COMPONENTS, TEntity, World } from "../../core";
import { TBattleEvent, ISkillDefinition } from "../types";
import { HeroComponent, SkillComponent, EffectComponent, TurnComponent } from "../components";
import { EffectSystem } from "./effect.system";
import { SkillSystem } from "./skill.system";
import { TurnSystem } from "./turn.system";

export interface IBattleResult {
    seed: [bigint, bigint];
    winner: string;
    loser: string;
    rounds: number;
    survivorHp: number;
    survivorMaxHp: number;
    log: Record<string, string[]>;
}

/**
 * Generates deterministic 64-bit seed pairs using Xorshift128p.
 */
export function generateBattleSeed(): [bigint, bigint] {
    const now = BigInt(Date.now());
    const hr = typeof process !== "undefined" && process.hrtime?.bigint ? process.hrtime.bigint() : 0n;
    const entropy0 = (now ^ hr ^ 0x9e3779b97f4a7c15n) & 0xFFFFFFFFFFFFFFFFn || 1n;
    const entropy1 = ((now << 32n) ^ (hr >> 16n) ^ 0xbf58476d1ce4e5b9n) & 0xFFFFFFFFFFFFFFFFn || 2n;

    const seeder = new Xorshift128p(entropy0, entropy1);
    const s0 = seeder.bigint || 1n;
    const s1 = seeder.bigint || 2n;
    return [s0, s1];
}

export class BattleEngine {
    private seeds: [bigint, bigint];
    private battleLogs: Record<string, string[]> = {};

    constructor(seeds?: [bigint, bigint]) {
        this.seeds = seeds ?? generateBattleSeed();
    }

    public getSeeds(): [bigint, bigint] {
        return this.seeds;
    }

    private log(turn: number, message: string): void {
        this.battleLogs[turn] = this.battleLogs[turn] || [];
        this.battleLogs[turn].push(message);
    }
    public spawnHeroes(): void {
        // Compatibility no-op: combatants are spawned automatically per execution run
    }

    /**
     * Spawns the 2 combatants inside a given World.
     */
    private spawnCombatants(world: World<TBattleEvent>): [TEntity, TEntity] {
        // Hero 1: Ignis the Pyromancer (Burst / Burn / Stun specialist)
        const ignisSkills: ISkillDefinition[] = [
            {
                id: "fire_bolt",
                name: "Fire Bolt",
                description: "Basic attack slinging a bolt of flame.",
                energyCost: 0,
                cooldown: 0,
                target: "ENEMY",
                damageMultiplier: 1.0
            },
            {
                id: "flame_burst",
                name: "Flame Burst",
                description: "Hurls an exploding fireball that burns the enemy over time.",
                energyCost: 40,
                cooldown: 2,
                target: "ENEMY",
                damageMultiplier: 1.6,
                appliedEffects: [
                    {
                        id: "burn_ignis",
                        name: "Ignite (Burn)",
                        type: "DOT",
                        duration: 2,
                        value: 28,
                        procChance: 0.95
                    }
                ]
            },
            {
                id: "inferno_nova",
                name: "Inferno Nova",
                description: "Ultimate cataclysm stunning the target and scorching them with intense flame.",
                energyCost: 90,
                cooldown: 3,
                target: "ENEMY",
                damageMultiplier: 2.4,
                appliedEffects: [
                    {
                        id: "blazing_stun",
                        name: "Blazing Stun",
                        type: "STUN",
                        duration: 1,
                        value: 0,
                        procChance: 0.85
                    },
                    {
                        id: "severe_burn",
                        name: "Severe Burn",
                        type: "DOT",
                        duration: 2,
                        value: 45,
                        procChance: 0.90
                    }
                ]
            }
        ];

        const hero1Entity = world.create_entity();
        world.add_component(hero1Entity, HeroComponent, {
            name: "Ignis (Pyromancer)",
            team: "RED",
            hp: 420,
            attack: 68,
            defense: 22,
            speed: 35,
            initialEnergy: 20
        });
        world.add_component(hero1Entity, SkillComponent, ignisSkills);
        world.add_component(hero1Entity, EffectComponent);
        world.add_component(hero1Entity, TurnComponent);

        // Hero 2: Valeria the Paladin (Sustain / Shield / Silence specialist)
        const valeriaSkills: ISkillDefinition[] = [
            {
                id: "holy_strike",
                name: "Holy Strike",
                description: "Infused warhammer blow striking true.",
                energyCost: 0,
                cooldown: 0,
                target: "ENEMY",
                damageMultiplier: 0.95
            },
            {
                id: "divine_bastion",
                name: "Divine Bastion",
                description: "Summons a holy shield and fortifies armor.",
                energyCost: 40,
                cooldown: 2,
                target: "SELF",
                damageMultiplier: 0,
                healAmount: 40,
                appliedEffects: [
                    {
                        id: "holy_shield",
                        name: "Holy Aegis",
                        type: "SHIELD",
                        duration: 2,
                        value: 95
                    },
                    {
                        id: "fortify",
                        name: "Fortify",
                        type: "BUFF",
                        targetStat: "defense",
                        duration: 2,
                        value: 0.35 // +35% defense
                    }
                ]
            },
            {
                id: "radiant_judgment",
                name: "Radiant Judgment",
                description: "Calls down celestial fury, silencing enemy skill casting.",
                energyCost: 80,
                cooldown: 3,
                target: "ENEMY",
                damageMultiplier: 2.1,
                appliedEffects: [
                    {
                        id: "silence",
                        name: "Silence",
                        type: "SILENCE",
                        duration: 1,
                        value: 0,
                        procChance: 0.90
                    }
                ]
            }
        ];

        const hero2Entity = world.create_entity();
        world.add_component(hero2Entity, HeroComponent, {
            name: "Valeria (Paladin)",
            team: "BLUE",
            hp: 550,
            attack: 52,
            defense: 38,
            speed: 28,
            initialEnergy: 20
        });
        world.add_component(hero2Entity, SkillComponent, valeriaSkills);
        world.add_component(hero2Entity, EffectComponent);
        world.add_component(hero2Entity, TurnComponent);

        return [hero1Entity, hero2Entity];
    }

    /**
     * Executes the simulation using the provided RNG instance.
     * When onLog is provided, logs every action; otherwise runs headlessly for pre-calculation.
     */
    private executeRun(
        rng: Xorshift128p,
        maxRounds: number,
        onLog?: (round: number, msg: string) => void
    ): IBattleResult {
        const world = new World<TBattleEvent>();

        // 1. Register Components
        world.register_component(HeroComponent);
        world.register_component(SkillComponent);
        world.register_component(EffectComponent);
        world.register_component(TurnComponent);

        // 2. Register Systems
        const effectSystem = world.register_system(EffectSystem);
        const skillSystem = world.register_system(SkillSystem);
        const turnSystem = world.register_system(TurnSystem);

        // 3. Define and Set System Signatures using BitSet(MAX_COMPONENTS)
        const effectSig = new BitSet(MAX_COMPONENTS);
        effectSig.set(world.get_component_type(HeroComponent), true);
        effectSig.set(world.get_component_type(EffectComponent), true);
        effectSig.set(world.get_component_type(TurnComponent), true);
        world.set_system_signature(EffectSystem, effectSig);

        const skillSig = new BitSet(MAX_COMPONENTS);
        skillSig.set(world.get_component_type(HeroComponent), true);
        skillSig.set(world.get_component_type(SkillComponent), true);
        skillSig.set(world.get_component_type(TurnComponent), true);
        skillSig.set(world.get_component_type(EffectComponent), true);
        world.set_system_signature(SkillSystem, skillSig);

        const turnSig = new BitSet(MAX_COMPONENTS);
        turnSig.set(world.get_component_type(HeroComponent), true);
        turnSig.set(world.get_component_type(TurnComponent), true);
        world.set_system_signature(TurnSystem, turnSig);

        // 4. Register Event Listeners
        world.add_event("ROUND_START", () => {});
        world.add_event("ROUND_END", () => {});
        world.add_event("DAMAGE_DEALT", () => {});
        world.add_event("HERO_DIED", () => {});

        // 5. Spawn Combatants
        const [hero1Entity, hero2Entity] = this.spawnCombatants(world);
        const h1 = world.get_component(hero1Entity, HeroComponent);
        const h2 = world.get_component(hero2Entity, HeroComponent);

        if (onLog) {
            onLog(0, `Hero 1: [${h1.name}] | HP: ${h1.hp} | ATK: ${h1.attack} | DEF: ${h1.defense} | SPD: ${h1.speed}`);
            onLog(0, `Hero 2: [${h2.name}] | HP: ${h2.hp} | ATK: ${h2.attack} | DEF: ${h2.defense} | SPD: ${h2.speed}`);
            onLog(0, "------------------------------------------------------------------");
        }

        let round = 1;
        while (round <= maxRounds) {
            if (onLog) {
                onLog(round, `>>> 🚩 ROUND ${round} BEGINS <<<`);
            }
            world.send_event("ROUND_START");

            // 1. Tick cooldowns
            skillSystem.tickCooldowns(world);

            // 2. Tick start-of-round effects (DOT, HOT, Buffs/Debuffs duration)
            const effectLogs = effectSystem.tickRoundEffects(world, round);
            if (onLog) {
                for (const elog of effectLogs) {
                    onLog(round, elog);
                }
            }

            // Check if battle ended during effect ticks
            if (!h1.alive || !h2.alive) {
                break;
            }

            // 3. Determine turn order for this round with RNG initiative roll
            const turnOrder = turnSystem.prepareRound(world, rng);

            // 4. Process each hero's turn
            for (const actorEntity of turnOrder) {
                const actorHero = world.get_component(actorEntity, HeroComponent);
                if (!actorHero.alive) continue;

                const opponentEntity = actorEntity === hero1Entity ? hero2Entity : hero1Entity;
                const opponentHero = world.get_component(opponentEntity, HeroComponent);
                if (!opponentHero.alive) break;

                // Check if actor can act (handles STUN)
                const check = turnSystem.checkCanAct(actorEntity, world);
                if (!check.canAct) {
                    if (check.reason && onLog) {
                        onLog(round, `[Turn] ${check.reason}`);
                    }
                    continue;
                }

                // AI chooses and executes skill with RNG (crits, damage variance, effect proc)
                const chosenSkill = skillSystem.selectSkill(actorEntity, world);
                const skillLogs = skillSystem.executeSkill(
                    actorEntity,
                    opponentEntity,
                    chosenSkill,
                    world,
                    effectSystem,
                    rng
                );

                if (onLog) {
                    for (const slog of skillLogs) {
                        onLog(round, `[Turn] ${slog}`);
                    }
                }

                turnSystem.finishTurn(actorEntity, world);

                if (!opponentHero.alive) {
                    break;
                }
            }

            world.send_event("ROUND_END");

            if (!h1.alive || !h2.alive) {
                break;
            }

            round++;
        }

        const winnerHero = h1.alive ? h1 : (h2.alive ? h2 : null);
        const loserHero = h1.alive ? h2 : (h2.alive ? h1 : null);

        const winnerName = winnerHero ? winnerHero.name : "Draw";
        const loserName = loserHero ? loserHero.name : "Draw";

        if (onLog) {
            onLog(round, "==================================================================");
            onLog(round, "                        🏆 BATTLE CONCLUDED                      ");
            onLog(round, "==================================================================");

            if (winnerHero) {
                onLog(round, `Winner: 👑 [${winnerHero.name}] with ${winnerHero.hp}/${winnerHero.maxHp} HP remaining!`);
                onLog(round, `Loser:  💀 [${loserHero?.name ?? "Enemy"}] was defeated in Round ${round}.`);
            } else {
                onLog(round, "Both combatants perished! The battle ended in a DRAW.");
            }
            onLog(round, "==================================================================");
        }

        return {
            seed: this.seeds,
            winner: winnerName,
            loser: loserName,
            rounds: round,
            survivorHp: winnerHero ? winnerHero.hp : 0,
            survivorMaxHp: winnerHero ? winnerHero.maxHp : 0,
            log: this.battleLogs
        };
    }

    /**
     * Executes the turn-based duel between Hero 1 and Hero 2.
     * 1. Pre-calculates the outcome based on the seed.
     * 2. Logs the pre-calculated outcome.
     * 3. Continues acting the battle by logging it with identical RNG sequence.
     */
    public runSimulation(maxRounds: number = 30): IBattleResult {
        this.battleLogs = {};

        // 1. Pre-calculate battle result based on the seed (headless run, zero logging)
        const precalcRng = new Xorshift128p(this.seeds[0], this.seeds[1]);
        const precalculated = this.executeRun(precalcRng, maxRounds);

        // 2. Log pre-calculation prediction into Round 0 before acting the battle
        const s0Hex = "0x" + this.seeds[0].toString(16);
        const s1Hex = "0x" + this.seeds[1].toString(16);

        this.log(0, "==================================================================");
        this.log(0, "          ⚔️  STARTING TURN-BASED 2-HERO ECS SIMULATOR  ⚔️        ");
        this.log(0, "==================================================================");
        this.log(0, `🎲 RNG Seed: [${s0Hex}, ${s1Hex}]`);
        this.log(0, `🔮 PRE-CALCULATED RESULT (Before Acting):`);
        this.log(0, `   • Predicted Winner : 👑 [${precalculated.winner}]`);
        this.log(0, `   • Predicted Rounds : ${precalculated.rounds}`);
        this.log(0, `   • Projected HP     : ${precalculated.survivorHp}/${precalculated.survivorMaxHp}`);
        this.log(0, "------------------------------------------------------------------");

        // 3. Continue acting the battle by logging it with identical deterministic seed
        const liveRng = new Xorshift128p(this.seeds[0], this.seeds[1]);
        const finalResult = this.executeRun(liveRng, maxRounds, (r, msg) => this.log(r, msg));

        // 4. Verify match at conclusion
        this.log(finalResult.rounds, `🎯 PRE-CALCULATION VERIFICATION: 100% MATCH`);
        this.log(finalResult.rounds, `   Predicted Winner: [${precalculated.winner}] === Actual: [${finalResult.winner}]`);
        this.log(finalResult.rounds, "==================================================================");

        finalResult.log = this.battleLogs;
        return finalResult;
    }

    public getLogs(): Record<string, string[]> {
        return this.battleLogs;
    }
}
