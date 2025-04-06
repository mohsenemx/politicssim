import { CountryManager, Country, Resource, Resources, DiplomaticRelation, WarOutcome, MilitaryEquipment, GroundForces, AirForces, NavalForces, DefenseSystems } from './country';
import { SubscriptionManager } from './subscriptions';
export const EQUIPMENT_COSTS = {
    // Ground Forces
    assaultRifles: { cost: 300, materials: { Iron: 5, Aluminum: 2 } },
    machineGuns: { cost: 200, materials: { Iron: 3, Aluminum: 1 } },
    antiTankMissiles: { cost: 1000, materials: { RareEarthMetals: 2, Oil: 5 } },
    mainBattleTanks: { cost: 5000, materials: { Iron: 20, Aluminum: 10, Oil: 50 } },
    infantryFightingVehicles: { cost: 3000, materials: { Iron: 15, Aluminum: 8, Oil: 40 } },
    artillery: { cost: 2000, materials: { Iron: 10, Copper: 5, Oil: 30 } },
    selfPropelledArtillery: { cost: 4000, materials: { Iron: 15, Copper: 8, Oil: 40 } },
    manpads: { cost: 1500, materials: { RareEarthMetals: 3, Aluminum: 2 } },

    // Air Forces
    fighterJets: { cost: 10000, materials: { Aluminum: 50, RareEarthMetals: 10, Oil: 100 } },
    multiroleAircraft: { cost: 12000, materials: { Aluminum: 60, RareEarthMetals: 15, Oil: 120 } },
    strategicBombers: { cost: 25000, materials: { Aluminum: 100, RareEarthMetals: 25, Oil: 200 } },
    attackHelicopters: { cost: 8000, materials: { Aluminum: 40, RareEarthMetals: 8, Oil: 80 } },
    transportAircraft: { cost: 15000, materials: { Aluminum: 70, RareEarthMetals: 12, Oil: 150 } },

    // Naval Forces
    destroyers: { cost: 50000, materials: { Iron: 200, Aluminum: 100, Oil: 500 } },
    submarines: { cost: 75000, materials: { Iron: 250, Aluminum: 120, RareEarthMetals: 50, Oil: 600 } },
    aircraftCarriers: { cost: 200000, materials: { Iron: 500, Aluminum: 300, RareEarthMetals: 100, Oil: 1000 } },
    cruiseMissiles: { cost: 5000, materials: { RareEarthMetals: 5, Aluminum: 3, Oil: 20 } },

    // Defense Systems
    surfaceToAirMissiles: { cost: 3000, materials: { RareEarthMetals: 4, Aluminum: 2, Oil: 10 } },
    antiAircraftGuns: { cost: 2000, materials: { Iron: 8, Copper: 4, Oil: 20 } },
    ballisticMissileDefense: { cost: 100000, materials: { RareEarthMetals: 100, Aluminum: 50, Oil: 500 } }
};
export class Simulation {
    private interval: NodeJS.Timeout | null = null;
    public isRunning = false;
    private tickCount = 0;
    constructor(
        private countryManager: CountryManager,
        private subscriptionManager: SubscriptionManager
    ) {}

    start(): void {
        if (this.isRunning) return;

        this.isRunning = true;
        this.interval = setInterval(() => this.simulationTick(), 200);
        console.log('Simulation started');
    }

    stop(): void {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.isRunning = false;
        this.tickCount = 0;
        console.log('Simulation stopped');
    }

    private simulationTick(): void {
        this.tickCount++;
        console.log(`--- Simulation Tick ${this.tickCount} ---`);
    
        this.countryManager.getAllCountries().forEach((country, id) => {
            if (country.isAnnihilated) return;
    
            // Economic update
            country.economy += Math.random() * 10000 - 2500;
    
            // Resource updates
            this.updateResources(country);
    
            // War progression
            this.updateWars(country);
    
            // Diplomatic relations
            this.updateRelations(country);
    
            // Equipment purchase/production
            this.produceEquipment(country);
        });
    
        // Broadcast updates to clients
        this.broadcastUpdates();
    }
    private updateResources(country: Country): void {
        const resourceList: Resource[] = [
            'Oil', 'Iron', 'Coal', 'Uranium', 'Gold',
            'Aluminum', 'RareEarthMetals', 'Rubber', 'Copper', 'Lithium'
        ];
    
        resourceList.forEach(resource => {
            let change = 0;
            switch (resource) {
                case 'Oil':
                    change = Math.random() * 150 - 60; // Higher fluctuation
                    break;
                case 'Iron':
                    change = Math.random() * 90 - 20; // Higher fluctuation
                    break;
                case 'Uranium':
                case 'RareEarthMetals':
                    change = Math.random() * 10 - 5; // Moderate fluctuation
                    break;
                default:
                    change = Math.random() * 40 - 20; // Higher base production
            }
            country.resources[resource] = Math.max(0, Math.floor(country.resources[resource] + change));
        });
    }
    
    private updateWars(country: Country): void {
        Object.entries(country.wars).forEach(([enemyId, war]) => {
            if (war.outcome) return; // Skip resolved wars
    
            war.progress += 0.5 + Math.random() * 1.5;
            war.progress = Math.min(100, war.progress);
    
            // Calculate equipment loss based on war progress
            if (war.progress >= 100) {
                this.resolveWar(country, enemyId);
            } else {
                this.applyWarDamage(country, enemyId, war.progress);
            }
        });
    }
    private applyWarDamage(attacker: Country, defenderId: string, progress: number): void {
        const defender = this.countryManager.getCountry(defenderId);
        if (!defender) return;
    
        const attackerPower = this.calculateMilitaryPower(attacker);
        const defenderPower = this.calculateMilitaryPower(defender);
    
        // Determine damage multiplier based on war progress and relative power
        const damageMultiplier = progress / 100; // Scales from 0 to 1 as war progresses
        const attackerDamageFactor = 1 - (attackerPower / (attackerPower + defenderPower));
        const defenderDamageFactor = 1 - (defenderPower / (attackerPower + defenderPower));
    
        // Apply damage to attacker
        this.damageEquipment(attacker, attackerDamageFactor * damageMultiplier);
    
        // Apply damage to defender
        this.damageEquipment(defender, defenderDamageFactor * damageMultiplier);
    }
    private transferResourcesAndEquipment(winner: Country, loser: Country): void {
        // Transfer resources
        Object.keys(loser.resources).forEach(resource => {
            winner.resources[resource] += loser.resources[resource];
            loser.resources[resource] = 0;
        });
    
        // Transfer military equipment
        Object.assign(winner.militaryEquipment.groundForces, loser.militaryEquipment.groundForces);
        Object.assign(winner.militaryEquipment.airForces, loser.militaryEquipment.airForces);
        Object.assign(winner.militaryEquipment.navalForces, loser.militaryEquipment.navalForces);
        Object.assign(winner.militaryEquipment.defenseSystems, loser.militaryEquipment.defenseSystems);
    
        console.log(`[${winner.name}] has taken all resources and equipment from [${loser.name}].`);
    }
    private damageEquipment(country: Country, damageFactor: number): void {
        const equipmentLoss = (value: number) => Math.max(0, value - Math.floor(value * damageFactor));
    
        // Damage ground forces
        country.militaryEquipment.groundForces.mainBattleTanks = equipmentLoss(country.militaryEquipment.groundForces.mainBattleTanks);
        country.militaryEquipment.groundForces.infantryFightingVehicles = equipmentLoss(country.militaryEquipment.groundForces.infantryFightingVehicles);
        country.militaryEquipment.groundForces.artillery = equipmentLoss(country.militaryEquipment.groundForces.artillery);
    
        // Damage air forces
        country.militaryEquipment.airForces.fighterJets = equipmentLoss(country.militaryEquipment.airForces.fighterJets);
        country.militaryEquipment.airForces.attackHelicopters = equipmentLoss(country.militaryEquipment.airForces.attackHelicopters);
    
        // Damage naval forces
        country.militaryEquipment.navalForces.destroyers = equipmentLoss(country.militaryEquipment.navalForces.destroyers);
        country.militaryEquipment.navalForces.submarines = equipmentLoss(country.militaryEquipment.navalForces.submarines);
    
        // Damage defense systems
        country.militaryEquipment.defenseSystems.surfaceToAirMissiles = equipmentLoss(country.militaryEquipment.defenseSystems.surfaceToAirMissiles);
        country.militaryEquipment.defenseSystems.ballisticMissileDefense = equipmentLoss(country.militaryEquipment.defenseSystems.ballisticMissileDefense);
    
        console.log(`[${country.name}] suffered war damage. Remaining tanks: ${country.militaryEquipment.groundForces.mainBattleTanks}`);
    }
    private updateRelations(country: Country): void {
        Object.entries(country.relations).forEach(([neighborId, relation]) => {
            const neighbor = this.countryManager.getCountry(neighborId);
            if (!neighbor || neighbor.isAnnihilated) return;
    
            // Calculate ideological distance
            const ideologicalDistance = Math.abs(country.ideologyScore - neighbor.ideologyScore);
    
            // Adjust relation strength based on ideological distance
            let relationChange = 0;
            if (ideologicalDistance === 0) {
                relationChange = Math.random() * 2 - 0.5; // Small positive fluctuation for aligned ideologies
            } else if (ideologicalDistance === 1) {
                relationChange = Math.random() * 2 - 1; // Neutral fluctuation for moderately different ideologies
            } else if (ideologicalDistance === 2) {
                relationChange = Math.random() * 2 - 1.5; // Larger negative fluctuation for opposing ideologies
            }
    
            relation.strength += relationChange;
            relation.strength = Math.max(-100, Math.min(100, relation.strength));
            relation.lastUpdated = this.tickCount;
    
            // Random status change (5% chance)
            if (Math.random() < 0.05) {
                this.updateRelationStatus(country, neighbor, relation);
            }
    
            // Chance of declaring war
            if (relation.strength < -70 && Math.random() < 0.1) { // 10% chance when relations are very strained
                this.declareWar(country, neighbor);
            } else if (relation.strength < -30 && Math.random() < 0.05) { // 5% chance when relations are strained
                this.declareWar(country, neighbor);
            } else if (Math.random() < 0.01) { // 1% chance for random wars
                this.declareWar(country, neighbor);
            }
        });
    }
    private declareWar(attacker: Country, defender: Country): void {
        // Avoid duplicate wars
        if (attacker.wars[defender.id] || defender.wars[attacker.id]) return;
    
        // Calculate ideological distance
        const ideologicalDistance = Math.abs(attacker.ideologyScore - defender.ideologyScore);
    
        // Reduce war likelihood for aligned ideologies
        const warLikelihood = ideologicalDistance === 0 ? 0.1 : // 10% chance for aligned ideologies
                              ideologicalDistance === 1 ? 0.3 : // 30% chance for moderately different ideologies
                              ideologicalDistance === 2 ? 0.6 : // 60% chance for opposing ideologies
                              0.5; // Default to 50% if ideological distance is unrecognized
    
        if (Math.random() > warLikelihood) {
            console.log(`[${attacker.name}] chose not to declare war on [${defender.name}] due to ideological alignment.`);
            return;
        }
    
        // Declare war
        attacker.wars[defender.id] = {
            attacker: attacker.id,
            defender: defender.id,
            startDate: Date.now(),
            progress: 0
        };
    
        defender.wars[attacker.id] = {
            attacker: defender.id,
            defender: attacker.id,
            startDate: Date.now(),
            progress: 0
        };
    
        console.log(`[${attacker.name}] declared war on [${defender.name}]`);
    
        // Broadcast war declaration to all clients
        this.subscriptionManager.broadcastGlobal({
            type: 'war_declaration',
            message: `${attacker.name} has declared war on ${defender.name}!`
        });
    }
    
    private broadcastUpdates(): void {
        this.countryManager.getAllCountries().forEach((country, id) => {
            if (!country.isAnnihilated) {
                this.subscriptionManager.broadcastUpdate(country.id, {
                    type: 'country_update',
                    country: {
                        id: country.id,
                        economy: country.economy,
                        resources: country.resources,
                        militaryEquipment: country.militaryEquipment,
                        wars: country.wars,
                        isAnnihilated: country.isAnnihilated
                    }
                });
            }
        });
    }
    private produceEquipment(country: Country): void {
        const { economy, resources, militaryEquipment } = country;
        const priorities = this.getEquipmentPriorities(country);
    
        // Shuffle priorities to introduce randomness
        const shuffledPriorities = Object.entries(priorities)
            .sort(() => Math.random() - 0.5); // Randomize order
    
        let producedSomething = false;
    
        // Iterate through shuffled priorities and attempt to produce equipment
        for (const [equipmentType, priority] of shuffledPriorities) {
            const cost = EQUIPMENT_COSTS[equipmentType as keyof typeof EQUIPMENT_COSTS];
    
            // Determine how many units can be produced
            const maxUnits = Math.min(
                Math.floor(economy / cost.cost), // Based on available funds
                ...Object.entries(cost.materials).map(([resource, amount]) =>
                    Math.floor(resources[resource] / amount) // Based on available materials
                )
            );
    
            if (maxUnits > 0) {
                // Limit production to a reasonable number per tick (e.g., 10 units)
                const unitsToProduce = Math.min(maxUnits, 10);
    
                // Deduct funds and materials
                country.economy -= cost.cost * unitsToProduce;
                country.economy = Math.max(0, country.economy); // Ensure economy doesn't go negative
                Object.entries(cost.materials).forEach(([resource, amount]) => {
                    resources[resource] -= amount * unitsToProduce;
                });
    
                // Add the equipment
                const category = this.getEquipmentCategory(equipmentType);
                const equipmentKey = equipmentType as keyof typeof militaryEquipment[typeof category];
                const categoryEquipment = militaryEquipment[category];
    
                if (category === 'groundForces') {
                    (categoryEquipment as GroundForces)[equipmentKey as keyof GroundForces] += unitsToProduce;
                } else if (category === 'airForces') {
                    (categoryEquipment as AirForces)[equipmentKey as keyof AirForces] += unitsToProduce;
                } else if (category === 'navalForces') {
                    (categoryEquipment as NavalForces)[equipmentKey as keyof NavalForces] += unitsToProduce;
                } else if (category === 'defenseSystems') {
                    (categoryEquipment as DefenseSystems)[equipmentKey as keyof DefenseSystems] += unitsToProduce;
                }
    
                console.log(
                    `[${country.name}] Produced ${unitsToProduce}x ${equipmentType}. Economy: ${country.economy.toFixed(2)}`
                );
    
                producedSomething = true;
            }
        }
    
        if (!producedSomething) {
            console.log(`[${country.name}] Could not afford any equipment production this tick.`);
        }
    }
    
    private getEquipmentPriorities(country: Country): Record<string, number> {
        const priorities: Record<string, number> = {};
    
        // Base priorities for all equipment types
        priorities.assaultRifles = 8; // High priority for basic infantry
        priorities.machineGuns = 6;
        priorities.antiTankMissiles = 5;
        priorities.mainBattleTanks = 4; // Moderate priority for heavy equipment
        priorities.infantryFightingVehicles = 4;
        priorities.artillery = 4;
        priorities.selfPropelledArtillery = 3;
        priorities.manpads = 5; // Defense systems
        priorities.fighterJets = 4; // Air forces
        priorities.multiroleAircraft = 4;
        priorities.strategicBombers = 3;
        priorities.attackHelicopters = 4;
        priorities.transportAircraft = 6;
        priorities.destroyers = 3; // Naval forces
        priorities.submarines = 3;
        priorities.aircraftCarriers = 2;
        priorities.cruiseMissiles = 5;
        priorities.surfaceToAirMissiles = 6; // Defense systems
        priorities.antiAircraftGuns = 5;
        priorities.ballisticMissileDefense = 4;
    
        // Add randomness to priorities
        Object.keys(priorities).forEach(equipmentType => {
            priorities[equipmentType] += Math.random() * 3 - 1.5; // Random fluctuation between -1.5 and +1.5
        });
    
        return priorities;
    }
    private getEquipmentCategory(equipmentType: string): keyof MilitaryEquipment {
        const groundForcesKeys = ['assaultRifles', 'machineGuns', 'antiTankMissiles', 'mainBattleTanks', 'infantryFightingVehicles', 'artillery', 'selfPropelledArtillery', 'manpads'];
        const airForcesKeys = ['fighterJets', 'multiroleAircraft', 'strategicBombers', 'attackHelicopters', 'transportAircraft'];
        const navalForcesKeys = ['destroyers', 'submarines', 'aircraftCarriers', 'cruiseMissiles'];
        const defenseSystemsKeys = ['surfaceToAirMissiles', 'antiAircraftGuns', 'ballisticMissileDefense'];
    
        if (groundForcesKeys.includes(equipmentType)) {
            return 'groundForces';
        } else if (airForcesKeys.includes(equipmentType)) {
            return 'airForces';
        } else if (navalForcesKeys.includes(equipmentType)) {
            return 'navalForces';
        } else if (defenseSystemsKeys.includes(equipmentType)) {
            return 'defenseSystems';
        }
    
        throw new Error(`Unknown equipment type: ${equipmentType}`);
    }
    private resolveWar(country: Country, enemyId: string): void {
        const defender = this.countryManager.getCountry(enemyId);
        if (!defender) {
            console.warn(`Cannot resolve war: Defender ${enemyId} does not exist.`);
            return;
        }
    
        // Check if the war exists
        if (!country.wars[enemyId] || !defender.wars[country.id]) {
            console.warn(`Cannot resolve war: War between ${country.name} and ${defender.name} does not exist.`);
            return;
        }
    
        const attackerPower = this.calculateMilitaryPower(country);
        const defenderPower = this.calculateMilitaryPower(defender);
    
        const outcome: WarOutcome =
            attackerPower > defenderPower * 2 ? 'annihilation' :
            attackerPower > defenderPower ? 'surrender' : 'peace';
    
        // Set the outcome for both sides
        country.wars[enemyId].outcome = outcome;
        defender.wars[country.id].outcome = outcome;
    
        console.log(`War resolved between [${country.name}] and [${defender.name}]: Outcome = ${outcome}`);
    
        switch (outcome) {
            case 'annihilation':
                this.transferResourcesAndEquipment(country, defender);
                this.annihilateCountry(defender.id);
                break;
            case 'surrender':
                this.handleSurrender(country, defender);
                break;
            case 'peace':
                this.handlePeaceTreaty(country, defender);
                break;
        }
    }
    private calculateMilitaryPower(country: Country): number {
        return (
            country.militaryEquipment.groundForces.mainBattleTanks * 10 +
            country.militaryEquipment.airForces.fighterJets * 8 +
            country.militaryEquipment.navalForces.destroyers * 12
        );
    }

    private annihilateCountry(countryId: string): void {
        const country = this.countryManager.getCountry(countryId);
        if (!country) return;
    
        // Mark the country as annihilated
        country.isAnnihilated = true;
        country.economy = 0;
        country.resources = {} as Resources;
        country.militaryEquipment = {
            groundForces: { ...country.militaryEquipment.groundForces, mainBattleTanks: 0 },
            airForces: { ...country.militaryEquipment.airForces, fighterJets: 0 },
            navalForces: { ...country.militaryEquipment.navalForces, destroyers: 0 },
            defenseSystems: { ...country.militaryEquipment.defenseSystems, surfaceToAirMissiles: 0 }
        };
    
        // Broadcast a global notification
        this.subscriptionManager.broadcastGlobal({
            type: 'country_annihilated',
            message: `${country.name} has been annihilated!`,
            countryName: country.name,
            countryId: country.id
        });
    
        // Broadcast a targeted update to remove the country from the frontend
        this.subscriptionManager.broadcastUpdate(countryId, {
            type: 'country_annihilated',
            country: {
                id: country.id,
                name: country.name,
                isAnnihilated: true
            }
        });
    
        console.log(`[${country.name}] has been annihilated.`);
    }

    private handleSurrender(winner: Country, loser: Country): void {
        // Transfer 20% of resources
        Object.keys(loser.resources).forEach(resource => {
            const transferAmount = loser.resources[resource] * 0.2;
            winner.resources[resource] += transferAmount;
            loser.resources[resource] -= transferAmount;
        });

        // Reduce military equipment
        loser.militaryEquipment.groundForces.mainBattleTanks *= 0.5;
    }

    private handlePeaceTreaty(countryA: Country, countryB: Country): void {
        if (!countryA.relations[countryB.id] || !countryB.relations[countryA.id]) {
            console.warn(`Cannot handle peace treaty: Relation between ${countryA.name} and ${countryB.name} does not exist.`);
            return;
        }
    
        countryA.relations[countryB.id].strength = 0;
        countryB.relations[countryA.id].strength = 0;
    
        console.log(`[${countryA.name}] and [${countryB.name}] have signed a peace treaty.`);
    }
    
    private updateRelationStatus(
        country: Country, 
        neighbor: Country, 
        relation: DiplomaticRelation
    ): void {
        const statusRoll = Math.random();
        relation.status = 
            statusRoll < 0.33 ? 'peace' :
            statusRoll < 0.66 ? 'war' : 'allied';
    }
}