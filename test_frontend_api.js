// Test script para simular las llamadas del frontend
console.log('🚀 Iniciando pruebas de API desde el frontend...');

// Configuración similar al frontend
const API_BASE_URL = 'http://localhost:8000';

// Crear cliente axios similar al frontend
const testClient = {
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

// Función para hacer requests
async function makeRequest(url, method = 'GET', data = null) {
    try {
        const config = {
            method,
            headers: testClient.headers,
        };
        
        if (data) {
            config.body = JSON.stringify(data);
        }
        
        const response = await fetch(`${testClient.baseURL}${url}`, config);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`❌ Error en ${method} ${url}:`, error);
        throw error;
    }
}

// Test de los endpoints principales
async function runTests() {
    const tests = [
        {
            name: 'Health Check',
            url: '/health',
            method: 'GET'
        },
        {
            name: 'Get Data',
            url: '/data/',
            method: 'GET'
        },
        {
            name: 'Get Schedule',
            url: '/schedule/',
            method: 'GET'
        },
        {
            name: 'Get Configurations',
            url: '/config/custom/configurations',
            method: 'GET'
        },
        {
            name: 'Set Parameter',
            url: '/config/parameter',
            method: 'POST',
            data: { parameter: 'bulkVoltage', value: 14.4 }
        }
    ];
    
    for (const test of tests) {
        try {
            console.log(`🧪 Testing ${test.name}...`);
            const result = await makeRequest(test.url, test.method, test.data);
            console.log(`✅ ${test.name} - Success:`, result);
        } catch (error) {
            console.error(`❌ ${test.name} - Failed:`, error.message);
        }
    }
}

// Simular el store de datos
const dataStore = {
    data: null,
    loading: false,
    error: null,
    connected: false,
    
    async fetchData() {
        this.loading = true;
        this.error = null;
        
        try {
            const response = await makeRequest('/data/');
            this.data = response;
            this.connected = response.connected || true;
            console.log('📊 Data Store actualizado:', this.data);
            return response;
        } catch (err) {
            this.error = err.message;
            this.connected = false;
            console.error('❌ Error en dataStore:', err);
            throw err;
        } finally {
            this.loading = false;
        }
    }
};

// Simular el store de configuración
const configStore = {
    configurableParameters: {},
    loading: false,
    error: null,
    
    async loadConfigurableParameters() {
        this.loading = true;
        this.error = null;
        
        try {
            const response = await makeRequest('/data/');
            this.configurableParameters = {
                batteryCapacity: { current_value: response.batteryCapacity },
                isLithium: { current_value: response.isLithium },
                thresholdPercentage: { current_value: response.thresholdPercentage },
                maxAllowedCurrent: { current_value: response.maxAllowedCurrent },
                bulkVoltage: { current_value: response.bulkVoltage },
                absorptionVoltage: { current_value: response.absorptionVoltage },
                floatVoltage: { current_value: response.floatVoltage },
                useFuenteDC: { current_value: response.useFuenteDC },
                fuenteDC_Amps: { current_value: response.fuenteDC_Amps },
                factorDivider: { current_value: response.factorDivider }
            };
            console.log('⚙️ Config Store actualizado:', this.configurableParameters);
        } catch (err) {
            this.error = err.message;
            console.error('❌ Error en configStore:', err);
            throw err;
        } finally {
            this.loading = false;
        }
    },
    
    async updateParameter(parameter, value) {
        try {
            const response = await makeRequest('/config/parameter', 'POST', { parameter, value });
            if (response.success) {
                this.configurableParameters[parameter].current_value = value;
                console.log(`✅ Parámetro ${parameter} actualizado a ${value}`);
            }
            return response;
        } catch (err) {
            console.error(`❌ Error actualizando ${parameter}:`, err);
            throw err;
        }
    }
};

// Ejecutar pruebas
console.log('🏁 Ejecutando todas las pruebas...');
runTests().then(() => {
    console.log('🎯 Pruebas de endpoints completadas');
    return dataStore.fetchData();
}).then(() => {
    console.log('📊 Test de dataStore completado');
    return configStore.loadConfigurableParameters();
}).then(() => {
    console.log('⚙️ Test de configStore completado');
    console.log('🎉 ¡Todas las pruebas completadas!');
}).catch((error) => {
    console.error('💥 Error en las pruebas:', error);
});

// Exportar para uso manual
window.testAPI = {
    makeRequest,
    dataStore,
    configStore,
    runTests
};
