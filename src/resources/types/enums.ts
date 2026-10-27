

export enum EHeroId {


}

export enum ETeam {
    A = 0,
    B = 1
}

export enum ESkillTrigger {
    ON_ACTIVE = 0,
    ON_ROUND,
    ON_HIT,
    ON_ATTACK,
    ON_DEATH,
}

export enum ESkillAction {
    DAMAGE = 'damage',
    HEAL = 'heal',
    APPLY_BUFF = 'apply_buff',
    ENERGY = 'energy',
}
