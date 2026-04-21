const { query } = require('./db');
async function check() {
  const res = await query("SELECT value FROM platform_settings WHERE key = 'global:settings'");
  console.log(JSON.stringify(res.rows[0].value, null, 2));
  process.exit(0);
}
check();
