// A single game service owns this snapshot. Version checks prevent a stale
// process from overwriting newer accounts during overlapping deployments.
export async function createPostgresStore(query){
 await query('CREATE TABLE IF NOT EXISTS nova_accounts (id integer PRIMARY KEY CHECK(id=1), version bigint NOT NULL DEFAULT 0, payload jsonb NOT NULL)');
 await query("INSERT INTO nova_accounts(id,payload) VALUES(1,'{}'::jsonb) ON CONFLICT(id) DO NOTHING");
 const initial=(await query('SELECT version,payload FROM nova_accounts WHERE id=1')).rows[0];
 let version=initial.version,pending=null,running=null,failure=null;
 async function drain(){try{while(pending!==null){const value=pending;pending=null;const result=await query('UPDATE nova_accounts SET payload=$1::jsonb,version=version+1 WHERE id=1 AND version=$2 RETURNING version',[value,version]);if(!result.rows.length)throw Error('Account storage changed in another server; restart this instance');version=result.rows[0].version;}}catch(e){failure=e;throw e;}finally{running=null;}}
 return {accounts:initial.payload,save(accounts){if(failure)throw Error('Account storage unavailable; restart the server');pending=JSON.stringify(accounts);if(!running){running=drain();running.catch(()=>console.error('Account database write failed. No account data was printed.'));}},async flush(){if(failure)throw failure;while(running)await running;if(failure)throw failure;}};
}
export async function connectPostgres(connectionString){const {default:pg}=await import('pg');const url=new URL(connectionString);if(!['postgres:','postgresql:'].includes(url.protocol))throw Error('DATABASE_URL must be a PostgreSQL URL');url.searchParams.set('sslmode','verify-full');const pool=new pg.Pool({connectionString:url.toString(),max:1,connectionTimeoutMillis:15000,idleTimeoutMillis:30000});pool.on('error',()=>console.error('Account database connection interrupted'));try{const store=await createPostgresStore((sql,values)=>pool.query(sql,values));return {...store,close:()=>pool.end()};}catch{await pool.end();throw Error('Could not initialize account database. Check DATABASE_URL and database availability.');}}
