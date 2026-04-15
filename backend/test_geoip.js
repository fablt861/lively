const geoip = require('geoip-lite');

const testIps = [
    { ip: '202.54.1.1', country: 'IN', description: 'India' },
    { ip: '1.1.1.1', country: 'AU', description: 'Australia' },
    { ip: '2.56.0.0', country: 'FR', description: 'France' }
];

console.log('--- Testing GeoIP Detection ---');
testIps.forEach(t => {
    const geo = geoip.lookup(t.ip);
    console.log(`${t.description} (${t.ip}): Detected ${geo ? geo.country : 'Unknown'} (Expected ${t.country})`);
});

console.log('\n--- Testing Restriction Logic Logic ---');
const restrictedCountries = ['IN', 'PK'];
testIps.forEach(t => {
    const geo = geoip.lookup(t.ip);
    const country = geo ? geo.country : 'Unknown';
    const isRestricted = restrictedCountries.includes(country);
    console.log(`${t.description}: Restricted? ${isRestricted ? 'YES' : 'NO'}`);
});
