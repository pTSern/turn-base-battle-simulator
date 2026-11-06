import { System, TEntity, World } from "../../core";
import { TBattleEvent } from "../types";
import { HeroComponent, TurnComponent } from "../components";
import { Xorshift128p } from "../../utils";

export class TurnSystem extends System {
    init(): void {
        // Lifecycle hook
    }

    update(_dt: number): void {
        // Real-time hook if needed
    }

    /**
     * Resets turn states for a new round and determines turn order based on effective speed.
     */
    prepareRound(world: World<TBattleEvent>, rng?: Xorshift128p): TEntity[] {
        const order: TEntity[] = [];

        for (const entity of this.entities) {
            const hero = world.get_component(entity, HeroComponent);
            const turn = world.get_component(entity, TurnComponent);

            if (!hero.alive) continue;

            turn.isMyTurn = false;
            turn.actedThisRound = false;
            order.push(entity);
        }

        // Sort descending by speed with small initiative roll; tie-break by entity ID
        order.sort((a, b) => {
            const heroA = world.get_component(a, HeroComponent);
            const heroB = world.get_component(b, HeroComponent);
            const initA = heroA.speed + (rng ? Math.floor(rng.float * 3) : 0);
            const initB = heroB.speed + (rng ? Math.floor(rng.float * 3) : 0);
            if (initB !== initA) {
                return initB - initA;
            }
            return a - b;
        });

        return order;
    }

    /**
     * Checks if hero can act. If stunned, marks as acted and logs skip.
     */
    checkCanAct(entity: TEntity, world: World<TBattleEvent>): { canAct: boolean; reason?: string } {
        const hero = world.get_component(entity, HeroComponent);
        const turn = world.get_component(entity, TurnComponent);

        if (!hero.alive) {
            return { canAct: false, reason: "dead" };
        }

        if (turn.actedThisRound) {
            return { canAct: false, reason: "already acted" };
        }

        if (turn.isStunned) {
            turn.actedThisRound = true;
            return { canAct: false, reason: `[${hero.name}] is ⚡ STUNNED and cannot move!` };
        }

        return { canAct: true };
    }

    /**
     * Concludes an actor's turn.
     */
    finishTurn(entity: TEntity, world: World<TBattleEvent>): void {
        const turn = world.get_component(entity, TurnComponent);
        turn.isMyTurn = false;
        turn.actedThisRound = true;
    }
}
