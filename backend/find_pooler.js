const { Client } = require('pg');

const regions = [
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-south-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-west-1',
  'eu-west-2',
  'eu-central-1',
  'ca-central-1',
  'sa-east-1'
];

async function findRegion() {
  for (const reg of regions) {
    const host = `aws-0-${reg}.pooler.supabase.com`;
    console.log("Testing pooler:", host);
    const client = new Client({
      host: host,
      port: 5432,
      user: 'postgres.ixpamdylbkfukofexcgi',
      password: 'wrong_password_on_purpose',
      database: 'postgres',
      connectionTimeoutMillis: 3000
    });
    try {
      await client.connect();
    } catch (e) {
      console.log(" -> Result:", e.message);
      if (e.message.includes("password authentication failed")) {
        console.log("💥 FOUND REGION POOLER:", host);
        return;
      }
    }
  }
}
findRegion();
