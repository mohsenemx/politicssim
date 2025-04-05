import { v4 as uuidv4 } from 'uuid';

// Define resource types with index signature
export type Resource = 
  | 'Oil'
  | 'Iron'
  | 'Coal'
  | 'Uranium'
  | 'Gold'
  | 'Aluminum'
  | 'RareEarthMetals'
  | 'Rubber'
  | 'Copper'
  | 'Lithium';

export interface Resources {
    [key: string]: number; // Index signature for dynamic access
    Oil: number;
    Iron: number;
    Coal: number;
    Uranium: number;
    Gold: number;
    Aluminum: number;
    RareEarthMetals: number;
    Rubber: number;
    Copper: number;
    Lithium: number;
}

export type RelationStatus = 'peace' | 'war' | 'allied';
export type WarOutcome = 'peace' | 'surrender' | 'annihilation';

export interface DiplomaticRelation {
    status: RelationStatus;
    strength: number;
    lastUpdated: number;
}

export interface War {
    attacker: string;
    defender: string;
    startDate: number;
    progress: number;
    outcome?: WarOutcome;
}

// Military equipment structure
export interface GroundForces {
    assaultRifles: number;
    machineGuns: number;
    antiTankMissiles: number;
    mainBattleTanks: number;
    infantryFightingVehicles: number;
    artillery: number;
    selfPropelledArtillery: number;
    manpads: number;
}

export interface AirForces {
    fighterJets: number;
    multiroleAircraft: number;
    strategicBombers: number;
    attackHelicopters: number;
    transportAircraft: number;
}

export interface NavalForces {
    destroyers: number;
    submarines: number;
    aircraftCarriers: number;
    cruiseMissiles: number;
}

export interface DefenseSystems {
    surfaceToAirMissiles: number;
    antiAircraftGuns: number;
    ballisticMissileDefense: number;
}

export interface MilitaryEquipment {
    groundForces: GroundForces;
    airForces: AirForces;
    navalForces: NavalForces;
    defenseSystems: DefenseSystems;
}

// Main country interface
export interface Country {
    id: string;
    name: string;
    ideology: string;
    leader: string;
    economy: number;
    relations: Record<string, DiplomaticRelation>;
    resources: Resources;
    militaryEquipment: MilitaryEquipment;
    wars: Record<string, War>;
    isAnnihilated: boolean;
}

export class CountryManager {
    private countries: Map<string, Country> = new Map();

    generateCountries(count: number) {
        this.countries.clear();
        const ideologies = ['Republic', 'Monarchy', 'Technocracy', 'Oligarchy'];
        const names = ['Arendelle', 'Wakanda', 'Atlantis', 'USA', 'Pacificia', 'Nordland', 'Veridia'];
        const leaders = ['Elsa', 'T\'Challa', 'Aquaman', 'President', 'Chancellor', 'Prime Minister'];

        for (let i = 0; i < count; i++) {
            const name = names[i % names.length];
            const country: Country = {
                id: this.generateCountryCode(name),
                name,
                ideology: ideologies[Math.floor(Math.random() * ideologies.length)],
                leader: leaders[Math.floor(Math.random() * leaders.length)],
                economy: Math.random() * 1000,
                relations: {},
                resources: this.generateResources(),
                militaryEquipment: this.generateMilitaryEquipment(),
                wars: {},
                isAnnihilated: false
            };

            // Initialize relations between countries
            this.countries.forEach(existingCountry => {
                country.relations[existingCountry.id] = {
                    status: 'peace',
                    strength: Math.floor(Math.random() * 41) - 20, // -20 to +20
                    lastUpdated: 0
                };
            });

            this.countries.set(country.id, country);
        }
    }

    private generateCountryCode(name: string): string {
        return name.slice(0, 3).toLowerCase();
    }

    private generateResources(): Resources {
        const resources: Partial<Resources> = {};
        const resourceList: Resource[] = [
            'Oil', 'Iron', 'Coal', 'Uranium', 'Gold',
            'Aluminum', 'RareEarthMetals', 'Rubber', 'Copper', 'Lithium'
        ];

        resourceList.forEach(resource => {
            resources[resource] = Math.random() * 1000;
        });

        return resources as Resources;
    }

    private generateMilitaryEquipment(): MilitaryEquipment {
        return {
            groundForces: {
                assaultRifles: this.randomValue(100, 1000),
                machineGuns: this.randomValue(50, 500),
                antiTankMissiles: this.randomValue(20, 200),
                mainBattleTanks: this.randomValue(10, 100),
                infantryFightingVehicles: this.randomValue(15, 150),
                artillery: this.randomValue(5, 50),
                selfPropelledArtillery: this.randomValue(3, 30),
                manpads: this.randomValue(10, 100)
            },
            airForces: {
                fighterJets: this.randomValue(20, 100),
                multiroleAircraft: this.randomValue(15, 80),
                strategicBombers: this.randomValue(5, 30),
                attackHelicopters: this.randomValue(10, 50),
                transportAircraft: this.randomValue(5, 20)
            },
            navalForces: {
                destroyers: this.randomValue(2, 10),
                submarines: this.randomValue(1, 8),
                aircraftCarriers: this.randomValue(0, 3),
                cruiseMissiles: this.randomValue(20, 200)
            },
            defenseSystems: {
                surfaceToAirMissiles: this.randomValue(50, 300),
                antiAircraftGuns: this.randomValue(20, 100),
                ballisticMissileDefense: this.randomValue(2, 10)
            }
        };
    }

    private randomValue(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    getCountry(id: string): Country | undefined {
        return this.countries.get(id);
    }

    getAllCountries(): Map<string, Country> {
        return this.countries;
    }

    updateCountry(id: string, updates: Partial<Country>): void {
        const country = this.countries.get(id);
        if (country) {
            Object.assign(country, updates);
        }
    }

    handleAdminAction(data: AdminAction): void {
        const country = this.countries.get(data.countryId);
        if (!country) return;

        switch (data.action) {
            case 'add_money':
                country.economy += data.amount || 100;
                break;
            case 'declare_war':
                this.declareWar(country, data.targetId ?? '');
                break;
        }
    }

    private declareWar(attacker: Country, targetId: string): void {
        const defender = this.countries.get(targetId);
        if (!defender || attacker.id === targetId) return;

        attacker.wars[targetId] = {
            attacker: attacker.id,
            defender: targetId,
            startDate: Date.now(),
            progress: 0
        };

        defender.wars[attacker.id] = {
            attacker: targetId,
            defender: attacker.id,
            startDate: Date.now(),
            progress: 0
        };
    }
}

export interface AdminAction {
    countryId: string;
    action: string;
    targetId?: string;
    amount?: number;
}