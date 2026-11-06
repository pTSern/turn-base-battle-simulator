import { BattleEngine } from "./systems/battle.engine";
import * as fs from 'fs'

export * from "./types";
export * from "./components";
export * from "./systems";

export function runTestBattle(): void {
    const engine = new BattleEngine();
    engine.spawnHeroes();
    const result = engine.runSimulation();

    fs.writeFileSync("battle_log.json", JSON.stringify(result.log, null, 4), "utf8");

    // Output structured round logs to console
    for (const [round, logs] of Object.entries(result.log)) {
        if (round !== "0") {
            console.log("");
        }
        for (const line of logs) {
            console.log(line);
        }
    }
}

// Auto-run if executed directly via tsx/node
runTestBattle();
