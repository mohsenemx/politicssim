import { WebSocket, WebSocketServer } from 'ws';
import { CountryManager } from './country';
import { SubscriptionManager } from './subscriptions';
import { Simulation } from './simulation';

const wss = new WebSocketServer({ port: 8080 });
const countryManager = new CountryManager();
const subscriptionManager = new SubscriptionManager();
let simulation: Simulation | null = null;

wss.on('connection', (ws) => {
    console.log('Client connected');

    // Send initial country list if simulation is running
    if (countryManager.getAllCountries().size > 0) {
        ws.send(JSON.stringify({
            type: 'country_list',
            countries: Array.from(countryManager.getAllCountries().values()).map(c => ({
                id: c.id,
                name: c.name,
                ideology: c.ideology,
                leader: c.leader,
                economy: c.economy,
                resources: c.resources,
                militaryEquipment: c.militaryEquipment,
                wars: c.wars,
                isAnnihilated: c.isAnnihilated
            }))
        }));
    }

    // Handle incoming messages
    ws.on('message', (rawMessage) => {
        try {
            const message = JSON.parse(rawMessage.toString());

            switch (message.type) {
                case 'subscribe_country':
                    subscriptionManager.subscribe(message.countryId, ws);
                    break;

                case 'unsubscribe_country':
                    subscriptionManager.unsubscribe(message.countryId, ws);
                    break;

                case 'start_simulation':
                    startSimulation(ws, message.countryCount || 3);
                    break;

                case 'admin_action':
                    handleAdminAction(ws, message);
                    break;
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    });

    // Handle client disconnection
    ws.on('close', () => {
        console.log('Client disconnected');
        subscriptionManager.getSubscribedCountries().forEach(countryId => {
            subscriptionManager.unsubscribe(countryId, ws);
        });
    });
});

// Start the simulation
function startSimulation(ws: WebSocket, countryCount: number) {
    console.log(`Starting simulation with ${countryCount} countries`);
    
    // Generate countries
    countryManager.generateCountries(countryCount);

    // Broadcast initial country list to all clients
    wss.clients.forEach(client => {
        client.send(JSON.stringify({
            type: 'country_list',
            countries: Array.from(countryManager.getAllCountries().values()).map(c => ({
                id: c.id,
                name: c.name,
                ideology: c.ideology,
                leader: c.leader,
                economy: c.economy,
                resources: c.resources,
                militaryEquipment: c.militaryEquipment,
                wars: c.wars,
                isAnnihilated: c.isAnnihilated
            }))
        }));
    });

    // Initialize simulation if not already running
    if (!simulation) {
        simulation = new Simulation(countryManager, subscriptionManager);
        simulation.start();
        console.log('Simulation started');
    }
}

// Handle admin actions
function handleAdminAction(ws: WebSocket, action: any) {
    // Implementation omitted for brevity
}