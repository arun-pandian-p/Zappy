async function main() {
  try {
    const res = await fetch('https://copkzrwvpqfjpsyyyqdy.supabase.co/rest/v1/', {
      headers: {
        'apikey': 'sb_secret_sqmPVrqBg0yYlZ55cRG0hA_kks4CmPP',
        'Authorization': 'Bearer sb_secret_sqmPVrqBg0yYlZ55cRG0hA_kks4CmPP'
      }
    });
    const schema = await res.json();
    const paths = Object.keys(schema.paths || {});
    const rpcs = paths.filter(p => p.startsWith('/rpc/'));
    console.log('Available RPCs:', rpcs);
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
