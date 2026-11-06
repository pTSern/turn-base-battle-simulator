import { ISkillDefinition } from "../types";

export class SkillComponent {
    skills: ISkillDefinition[] = [];
    cooldowns: Map<string, number> = new Map<string, number>();

    constructor(skills: ISkillDefinition[] = []) {
        this.skills = skills;
    }

    isReady(skillId: string): boolean {
        return (this.cooldowns.get(skillId) ?? 0) <= 0;
    }

    setCooldown(skillId: string, rounds: number): void {
        this.cooldowns.set(skillId, rounds);
    }

    decrementCooldowns(): void {
        for (const [id, cd] of this.cooldowns.entries()) {
            if (cd > 0) {
                this.cooldowns.set(id, cd - 1);
            }
        }
    }
}
