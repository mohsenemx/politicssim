const ws = new WebSocket('ws://localhost:8080');
let subscribedCountries = new Set();

// WebSocket handlers
ws.onopen = () => {
    console.log('Connected to server');
    ws.send(JSON.stringify({ type: 'get_countries' }));
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    switch (data.type) {
        case 'country_list':
            handleCountryList(data.countries);
            break;

        case 'country_update':
            updateCountry(data.country);
            break;

        case 'war_declaration':
            showWarNotification(data.message);
            break;

        case 'country_annihilated':
            showAnnihilationNotification(data.message);
            removeCountryCard(data.countryId);
            break;
    }
};

function showAnnihilationNotification(message) {
    const notificationContainer = document.getElementById('notifications');
    if (!notificationContainer) return;

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notificationContainer.appendChild(notification);

    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function removeCountryCard(countryId) {
    const card = document.getElementById(`country-card-${countryId}`);
    if (card) {
        card.remove();
    }
}
function showWarNotification(message) {
    const notificationContainer = document.getElementById('notifications');
    if (!notificationContainer) return;

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notificationContainer.appendChild(notification);

    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}
// Handle initial country list
function handleCountryList(countries) {
    const container = document.getElementById('countryList');
    container.innerHTML = '';

    countries.forEach(country => {
        if (!subscribedCountries.has(country.id)) {
            subscribeToCountry(country.id); // Subscribe to updates
            subscribedCountries.add(country.id);
        }

        const card = createCountryCard(country);
        container.appendChild(card);
    });
}

// Subscribe to a country
function subscribeToCountry(countryId) {
    ws.send(JSON.stringify({ type: 'subscribe_country', countryId }));
}

// Unsubscribe from a country
function unsubscribeFromCountry(countryId) {
    ws.send(JSON.stringify({ type: 'unsubscribe_country', countryId }));
    subscribedCountries.delete(countryId);
}

// Create a country card
function createCountryCard(country) {
    const card = document.createElement('div');
    card.className = 'country-card';
    card.id = `country-${country.id}`;

    card.innerHTML = `
    <div class="country-header">
        <h2>${country.name} (${country.id})</h2>
        <p>${country.ideology} - ${country.leader}</p>
    </div>
    
    <div class="economy">
        <h3>Economy: $${country.economy.toFixed(2)}</h3>
    </div>
    
    <div class="resources">
        <h3>Resources:</h3>
    </div>
    
    <div class="military">
        <h3>Military Equipment:</h3>
        <div class="equipment-section ground"></div>
        <div class="equipment-section air"></div>
        <div class="equipment-section naval"></div>
        <div class="equipment-section defense"></div>
    </div>
    
    <div class="wars">
        <h3>Wars:</h3>
    </div>
`;

    updateResources(card, country.resources);
    updateMilitary(card, country.militaryEquipment);
    updateWars(card, country.wars);

    return card;
}

// Update a country's UI
function updateCountry(countryData) {
    let card = document.getElementById(`country-${countryData.id}`);
    if (!card) {
        card = createCountryCard(countryData);
        document.getElementById('countryList').appendChild(card);
    }

    // Update sections
    card.querySelector('.economy h3').textContent = `Economy: $${countryData.economy.toFixed(2)}`;
    updateResources(card, countryData.resources);
    updateMilitary(card, countryData.militaryEquipment);
    updateWars(card, countryData.wars);

    // Handle annihilation
    if (countryData.isAnnihilated) {
        card.remove();
        unsubscribeFromCountry(countryData.id);
    }
}

// Update resources section
function updateResources(card, resources) {
    const container = card.querySelector('.resources');
    container.innerHTML = '<h3>Resources:</h3>';

    Object.entries(resources).forEach(([resource, amount]) => {
        const div = document.createElement('div');
        div.className = 'resource';
        div.innerHTML = `<span>${resource}:</span><span>${amount.toFixed(2)}</span>`;
        container.appendChild(div);
    });
}

// Update military equipment section
function updateMilitary(card, military) {
    const groundSection = card.querySelector('.equipment-section.ground');
    const airSection = card.querySelector('.equipment-section.air');
    const navalSection = card.querySelector('.equipment-section.naval');
    const defenseSection = card.querySelector('.equipment-section.defense');

    // Clear existing content
    [groundSection, airSection, navalSection, defenseSection].forEach(section => {
        if (section) section.innerHTML = '';
    });

    // Helper function to create equipment rows
    const createEquipmentRows = (category, equipment) => {
        let rows = '';
        Object.entries(equipment).forEach(([key, value]) => {
            rows += `<div>${key}: ${value}</div>`;
        });
        return rows;
    };

    // Populate sections with equipment data
    if (groundSection) {
        groundSection.innerHTML = `
            <h4>Ground Forces</h4>
            ${createEquipmentRows('groundForces', military.groundForces)}
        `;
    }

    if (airSection) {
        airSection.innerHTML = `
            <h4>Air Forces</h4>
            ${createEquipmentRows('airForces', military.airForces)}
        `;
    }

    if (navalSection) {
        navalSection.innerHTML = `
            <h4>Naval Forces</h4>
            ${createEquipmentRows('navalForces', military.navalForces)}
        `;
    }

    if (defenseSection) {
        defenseSection.innerHTML = `
            <h4>Defense Systems</h4>
            ${createEquipmentRows('defenseSystems', military.defenseSystems)}
        `;
    }
}

// Update wars section
function updateWars(card, wars) {
    const container = card.querySelector('.wars');
    container.innerHTML = '<h3>Wars:</h3>';

    Object.entries(wars).forEach(([enemyId, war]) => {
        const warDiv = document.createElement('div');
        warDiv.className = 'war-status';
        warDiv.innerHTML = `
            <div>VS ${enemyId}</div>
            <div>Progress: ${war.progress.toFixed(1)}%</div>
            ${war.outcome ? `<div>Outcome: ${war.outcome}</div>` : ''}
        `;

        if (!war.outcome) {
            const progressBar = document.createElement('div');
            progressBar.className = 'progress-bar';
            const fill = document.createElement('div');
            fill.className = 'progress-fill';
            fill.style.width = `${war.progress}%`;
            progressBar.appendChild(fill);
            warDiv.appendChild(progressBar);
        }

        container.appendChild(warDiv);
    });
}

// Event listeners
document.getElementById('startSim')?.addEventListener('click', () => {
    const count = parseInt(document.getElementById('countryCount')?.value || '3');
    ws.send(JSON.stringify({ type: 'start_simulation', countryCount: count }));
});

document.getElementById('sendAction')?.addEventListener('click', () => {
    const action = {
        type: 'admin_action',
        action: document.getElementById('actionType')?.value || '',
        countryId: document.getElementById('countryId')?.value || '',
        targetId: document.getElementById('targetId')?.value || '',
        amount: parseFloat(document.getElementById('amount')?.value || '0')
    };

    if (action.action) ws.send(JSON.stringify(action));
});