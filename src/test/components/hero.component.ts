export class HeroComponent {
    name: string;
    team: "RED" | "BLUE";
    hp: number;
    maxHp: number;
    baseAttack: number;
    baseDefense: number;
    baseSpeed: number;
    attack: number;
    defense: number;
    speed: number;
    energy: number;
    maxEnergy: number;
    alive: boolean = true;

    constructor(init: {
        name: string;
        team: "RED" | "BLUE";
        hp: number;
        attack: number;
        defense: number;
        speed: number;
        maxEnergy?: number;
        initialEnergy?: number;
    }) {
        this.name = init.name;
        this.team = init.team;
        this.hp = init.hp;
        this.maxHp = init.hp;
        this.baseAttack = init.attack;
        this.baseDefense = init.defense;
        this.baseSpeed = init.speed;
        this.attack = init.attack;
        this.defense = init.defense;
        this.speed = init.speed;
        this.maxEnergy = init.maxEnergy ?? 100;
        this.energy = init.initialEnergy ?? 0;
        this.alive = true;
    }
}
