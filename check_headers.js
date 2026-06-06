async function main() {
  try {
    const res = await fetch('https://copkzrwvpqfjpsyyyqdy.supabase.co/rest/v1/', {
      headers: {
        'apikey': 'sb_secret_sqmPVrqBg0yYlZ55cRG0hA_kks4CmPP',
        'Authorization': 'Bearer sb_secret_sqmPVrqBg0yYlZ55cRG0hA_kks4CmPP'
      }
    });
    console.log('Status:', res.status);
    console.log('Headers:', JSON.stringify(Object.fromEntries(res.headers.entries()), null, 2));
    const text = await res.text();
    console.log('Body:', text);
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
