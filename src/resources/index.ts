import { TEntity } from "../core";
import { Xorshift128p } from "../utils";
import { CharacterBuff, CharacterStats, CharacterStatus, CharacterTeam } from "./components/character";
import { ICombatLog } from "./components/combat";
import { SkillAction } from "./components/skill";
import { world } from "./utils";

export class BattleEngine {
    protected _rng: Xorshift128p;
    protected _logs: ICombatLog[] = [];

    constructor(seeds: [bigint, bigint]) {
        this._rng = new Xorshift128p(seeds[0], seeds[1]);
    }

    set_hp(stats: CharacterStats, value: number) {
        stats.health.current = Math.max(0, stats.health.current - value);
    }

    begin(round: number) {
        const _entities = world.query_component(CharacterTeam, CharacterStats, CharacterBuff, CharacterStatus);

        for(const _entity of _entities) {
            const _status = world.get_component(_entity, CharacterStatus);
            if(!_status.alive) continue;

            const [_buffs, _stats] = world.get_components(_entity, CharacterBuff, CharacterStats);

            const _effects = _buffs.list.sort((a, b) => b.level - a.level);

            const _slices: number[] = []
            for(let i = 0; i < _effects.length; i++) {
                const _effect = _effects[i];
                if(_effect.type === 'DOT') {
                    this.set_hp(_stats, _effect.value);

                    this.log({
                        round,
                        actor: _entity,
                        action: "DOT_TICK",
                        skill: _effect.id,
                        targets: [{
                            target: _entity,
                            damage: _effect.value,
                            hitted: true,
                            critical: false,
                            remaining_hp: _stats.health.current,
                            effects: ['DOT']
                        }] 
                    });

                    if(_stats.health.current <= 0) {
                        _status.alive = false;
                        break;
                    }
                }

                _effect.duration -= 1;
                if(_effect.duration <= 0) {
                    _slices.push(i);
                }
            }
            _buffs.list = _effects.filter((_, index) => !_slices.includes(index));
        }
    }

    execute(round: number, actor: TEntity) {
        const _status = world.get_component(actor, CharacterStatus);
        if(!_status.alive) return;

        const [_stats, _buffs] = world.get_components(actor, CharacterStats, CharacterBuff, CharacterTeam, SkillAction);
        if(_buffs.list.some(_b => _b.type === 'STUN')) {
            return
        }

        const _castable = this.is_castable_skill(_stats);

    }

    is_castable_skill(_stats: CharacterStats) {
        return _stats.engery.current >= (_stats.engery.threshold * _stats.engery.max)
    }

    log(battle: ICombatLog) {
        this._logs.push(battle);
    }

}
