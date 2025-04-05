import { WebSocket } from 'ws';

// Subscription Manager Class
export class SubscriptionManager {
    private subscriptions: Map<string, Set<WebSocket>> = new Map(); // countryId -> Set of clients

    // Subscribe a client to a country
    subscribe(countryId: string, client: WebSocket) {
        if (!this.subscriptions.has(countryId)) {
            this.subscriptions.set(countryId, new Set());
        }
        this.subscriptions.get(countryId)?.add(client);
    }

    // Unsubscribe a client from a country
    unsubscribe(countryId: string, client: WebSocket) {
        const subscribers = this.subscriptions.get(countryId);
        if (subscribers) {
            subscribers.delete(client);
            if (subscribers.size === 0) {
                this.subscriptions.delete(countryId); // Clean up empty sets
            }
        }
    }

    // Broadcast update to all subscribers of a country
    broadcastUpdate(countryId: string, message: any) {
        const subscribers = this.subscriptions.get(countryId);
        if (subscribers) {
            subscribers.forEach(client => {
                try {
                    client.send(JSON.stringify(message));
                } catch (error) {
                    console.error(`Failed to send update to client for country ${countryId}:`, error);
                }
            });
        }
    }
    broadcastGlobal(message: any): void {
        this.subscriptions.forEach(subscribers => {
            subscribers.forEach(client => {
                try {
                    client.send(JSON.stringify(message));
                } catch (error) {
                    console.error('Failed to send global message:', error);
                }
            });
        });
    }
    // Cleanup subscriptions when a country is annihilated
    removeCountry(countryId: string) {
        this.subscriptions.delete(countryId);
    }

    // Get all subscribed countries for debugging
    getSubscribedCountries(): string[] {
        return Array.from(this.subscriptions.keys());
    }
}