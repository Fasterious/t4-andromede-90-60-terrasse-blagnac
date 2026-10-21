// Petit stockage clé-valeur pour les quotas et les compteurs.
// Utilise Upstash Redis (REST) si configuré via l'intégration Vercel,
// sinon une Map en mémoire (best effort : remise à zéro à chaque démarrage
// de fonction — suffisant en dépannage, pas en production).

const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

export const hasRedis = Boolean(URL_ && TOKEN);

const memory = new Map();

function memExec([cmd, key, ...args]) {
  switch (cmd) {
    case 'INCR':
    case 'INCRBY': {
      const v = Number(memory.get(key) || 0) + Number(cmd === 'INCR' ? 1 : args[0]);
      memory.set(key, v);
      return v;
    }
    case 'HINCRBY': {
      const h = memory.get(key) || {};
      h[args[0]] = Number(h[args[0]] || 0) + Number(args[1]);
      memory.set(key, h);
      return h[args[0]];
    }
    case 'HGETALL': {
      const h = memory.get(key) || {};
      return Object.entries(h).flat().map(String);
    }
    case 'GET':
      return memory.has(key) ? String(memory.get(key)) : null;
    case 'LPUSH': {
      const l = memory.get(key) || [];
      l.unshift(...args.reverse());
      memory.set(key, l);
      return l.length;
    }
    case 'LTRIM': {
      const l = memory.get(key) || [];
      memory.set(key, l.slice(Number(args[0]), Number(args[1]) + 1));
      return 'OK';
    }
    case 'LRANGE': {
      const l = memory.get(key) || [];
      const end = Number(args[1]);
      return l.slice(Number(args[0]), end < 0 ? undefined : end + 1);
    }
    case 'EXPIRE':
      return 1;
    default:
      throw new Error(`Commande non gérée en mémoire : ${cmd}`);
  }
}

// Exécute plusieurs commandes Redis en un aller-retour ; renvoie les résultats.
export async function pipeline(commands) {
  if (!hasRedis) return commands.map(memExec);
  const res = await fetch(`${URL_}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands.map((c) => c.map(String))),
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}`);
  const data = await res.json();
  return data.map((d) => {
    if (d.error) throw new Error(d.error);
    return d.result;
  });
}

// Date du jour à Paris (AAAA-MM-JJ) : les quotas repartent à minuit heure française
export function today(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' });
}

export const month = () => today().slice(0, 7);

export function hgetallToObject(arr) {
  const out = {};
  for (let i = 0; arr && i < arr.length; i += 2) out[arr[i]] = Number(arr[i + 1]);
  return out;
}
