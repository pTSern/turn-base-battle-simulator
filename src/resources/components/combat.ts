interface _ITarget<_TUuid extends pFlex.TKey> {
    target: _TUuid;
    hitted: boolean;
    critical: boolean;

    damage: number;
    effects: any[];
    remaining_hp: number;
}

export interface ICombatLog {
    round: number;
    actor: pFlex.TKey;
    action: string;
    skill: pFlex.TKey;
    targets: _ITarget<pFlex.TKey>[];
}
