import { IMax, IMaxThreshold, TPercent } from "@pTS://utils";
import { EHeroId, ETeam } from "../types";
import { EffectStatus } from "./effect";

export class CharacterStats {
    health: IMax
    engery: IMaxThreshold;

    attack: number;
    defense: number;
    speed: number;

    crit_rate: TPercent;
    crit_damage: TPercent;

    hit_rate: TPercent;
    doge_rate: TPercent;

    damage_reduction: TPercent;
    control_reduction: TPercent;
}

export class CharacterTeam {
    team: ETeam;
    slot: number;
}

export class CharacterBuff {
    list: EffectStatus[]
}

export class CharacterStatus {
    alive: boolean;
}
