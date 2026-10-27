import { ESkillAction, ESkillTrigger } from "../types";

export class SkillStats<_TId extends pFlex.TKey> {
    id: _TId;
    name: string;
    trigger: ESkillTrigger
    targets: any[]
    actions: SkillAction[]
}

export class SkillAction {
    type: ESkillAction

    multiplier?: number
    flat?: number
    effect?: any
}
