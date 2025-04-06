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
export class Country {
    id: string;
    name: string;
    ideology: string; // e.g., 'Authoritarian', 'Neutral', 'Democratic'
    ideologyScore: number; // -1 for Authoritarian, 0 for Neutral, +1 for Democratic
    leader: string;
    economy: number;
    resources: Resources;
    militaryEquipment: MilitaryEquipment;
    wars: Record<string, War>;
    relations: Record<string, DiplomaticRelation>;
    isAnnihilated: boolean;

    constructor(id: string, name: string, ideology: string, leader: string) {
        this.id = id;
        this.name = name;
        this.ideology = ideology;
        this.leader = leader;
        this.economy = 100000; // Example starting economy
        this.resources = {
            Oil: 500,
            Iron: 500,
            Coal: 500,
            Uranium: 100,
            Gold: 100,
            Aluminum: 500,
            RareEarthMetals: 100,
            Rubber: 500,
            Copper: 500,
            Lithium: 100
        };
        this.militaryEquipment = {
            groundForces: {
                assaultRifles: 0,
                machineGuns: 0,
                antiTankMissiles: 0,
                mainBattleTanks: 0,
                infantryFightingVehicles: 0,
                artillery: 0,
                selfPropelledArtillery: 0,
                manpads: 0
            },
            airForces: {
                fighterJets: 0,
                multiroleAircraft: 0,
                strategicBombers: 0,
                attackHelicopters: 0,
                transportAircraft: 0
            },
            navalForces: {
                destroyers: 0,
                submarines: 0,
                aircraftCarriers: 0,
                cruiseMissiles: 0
            },
            defenseSystems: {
                surfaceToAirMissiles: 0,
                antiAircraftGuns: 0,
                ballisticMissileDefense: 0
            }
        };
        this.wars = {};
        this.relations = {};
        this.isAnnihilated = false;

        // Assign ideology score based on ideology
        this.ideologyScore = this.getIdeologyScore(ideology);
    }

    private getIdeologyScore(ideology: string): number {
        switch (ideology.toLowerCase()) {
            case 'authoritarian':
                return -1;
            case 'neutral':
                return 0;
            case 'democratic':
                return 1;
            default:
                return 0; // Default to neutral if ideology is unrecognized
        }
    }
}

export class CountryManager {
    private countries: Map<string, Country> = new Map();

    constructor() {
        this.countries = new Map();
    }

    /**
     * Generate a specified number of countries and store them in the manager.
     * @param numCountries - The number of countries to generate.
     */
    public generateCountries(numCountries: number): void {
        if (numCountries <= 0) {
            throw new Error('Number of countries must be greater than 0.');
        }

        const generatedCountries = this.generateRandomCountries(numCountries);

        // Add generated countries to the map
        generatedCountries.forEach(country => {
            this.countries.set(country.id, country);
        });

        console.log(`Generated ${numCountries} countries.`);
    }

    /**
     * Get a country by its ID.
     * @param id - The ID of the country to retrieve.
     * @returns The country object, or undefined if not found.
     */
    public getCountry(id: string): Country | undefined {
        return this.countries.get(id);
    }

    /**
     * Get all countries managed by this CountryManager.
     * @returns An array of all countries.
     */
    public getAllCountries(): Country[] {
        return Array.from(this.countries.values());
    }

    /**
     * Remove a country from the manager (e.g., when annihilated).
     * @param id - The ID of the country to remove.
     */
    public removeCountry(id: string): void {
        if (this.countries.has(id)) {
            this.countries.delete(id);
            console.log(`Country with ID ${id} removed.`);
        } else {
            console.warn(`Attempted to remove non-existent country with ID ${id}.`);
        }
    }

    /**
     * Generate a random list of countries.
     * @param numCountries - The number of countries to generate.
     * @returns An array of randomly generated countries.
     */
    private generateRandomCountries(numCountries: number): Country[] {
        const countries: Country[] = [];
        const ideologies = ['Authoritarian', 'Neutral', 'Democratic'];
        const leaders = ['Elsa', 'T\'Challa', 'Poseidon', 'Aeloria', 'Nexus'];

        // Generate unique country names
        const baseNames = ['Arendelle', 'Wakanda', 'Atlantis', 'Elarion', 'Nexora', 'Valoria', 'Solara', 'Terranova', 'Oceana', 'Celestia'];
        const usedNames: string[] = [];

        for (let i = 0; i < numCountries; i++) {
            // Select a random name and ensure it's unique
            let name: string;
            do {
                name = baseNames[Math.floor(Math.random() * baseNames.length)];
            } while (usedNames.includes(name));
            usedNames.push(name);

            const ideology = ideologies[Math.floor(Math.random() * ideologies.length)];
            const leader = leaders[Math.floor(Math.random() * leaders.length)];

            // Use the Country constructor to create the country
            const country = new Country(
                this.generateCountryCode(name),
                name,
                ideology,
                leader
            );

            // Initialize additional properties if needed
            country.economy = Math.random() * 1000;
            country.resources = this.generateResources();
            country.militaryEquipment = this.generateMilitaryEquipment();
            country.relations = {};
            country.wars = {};
            country.isAnnihilated = false;

            countries.push(country);
        }

        return countries;
    }

    /**
     * Generate a unique country code based on the country's name.
     * @param name - The name of the country.
     * @returns A unique country code.
     */
    private generateCountryCode(name: string): string {
        return name.toLowerCase().replace(/\s+/g, '-');
    }

    /**
     * Generate random resources for a country.
     * @returns A Resources object with random values.
     */
    private generateResources(): Resources {
        return {
            Oil: Math.floor(Math.random() * 1000),
            Iron: Math.floor(Math.random() * 1000),
            Coal: Math.floor(Math.random() * 1000),
            Uranium: Math.floor(Math.random() * 100),
            Gold: Math.floor(Math.random() * 100),
            Aluminum: Math.floor(Math.random() * 1000),
            RareEarthMetals: Math.floor(Math.random() * 100),
            Rubber: Math.floor(Math.random() * 1000),
            Copper: Math.floor(Math.random() * 1000),
            Lithium: Math.floor(Math.random() * 100)
        };
    }

    /**
     * Generate default military equipment for a country.
     * @returns A MilitaryEquipment object with default values.
     */
    private generateMilitaryEquipment(): MilitaryEquipment {
        return {
            groundForces: {
                assaultRifles: 0,
                machineGuns: 0,
                antiTankMissiles: 0,
                mainBattleTanks: 0,
                infantryFightingVehicles: 0,
                artillery: 0,
                selfPropelledArtillery: 0,
                manpads: 0
            },
            airForces: {
                fighterJets: 0,
                multiroleAircraft: 0,
                strategicBombers: 0,
                attackHelicopters: 0,
                transportAircraft: 0
            },
            navalForces: {
                destroyers: 0,
                submarines: 0,
                aircraftCarriers: 0,
                cruiseMissiles: 0
            },
            defenseSystems: {
                surfaceToAirMissiles: 0,
                antiAircraftGuns: 0,
                ballisticMissileDefense: 0
            }
        };
    }
}

export interface AdminAction {
    countryId: string;
    action: string;
    targetId?: string;
    amount?: number;
}