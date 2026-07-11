// Provider-agnostic SMS sender.
//
// By default (no SMS_PROVIDER set) this simulates sending: it never contacts
// any network, and returns status "simulated". This is the safe default so
// the app never silently pretends to text real parents.
//
// Once you have a real Africa's Talking account, set in .env:
//   SMS_PROVIDER=africastalking
//   AFRICASTALKING_API_KEY=...
//   AFRICASTALKING_USERNAME=...
// and run `npm install africastalking`, then real texts will be sent.

async function sendSms({ to, message }) {
  const provider = process.env.SMS_PROVIDER;

  if (provider === 'africastalking') {
    if (!process.env.AFRICASTALKING_API_KEY || !process.env.AFRICASTALKING_USERNAME) {
      throw new Error('AFRICASTALKING_API_KEY and AFRICASTALKING_USERNAME must be set to use this provider');
    }
    // Lazy-require so the dependency is only needed when actually configured.
    // Run `npm install africastalking` before enabling this provider.
    const AfricasTalking = require('africastalking')({
      apiKey: process.env.AFRICASTALKING_API_KEY,
      username: process.env.AFRICASTALKING_USERNAME
    });
    const result = await AfricasTalking.SMS.send({ to: Array.isArray(to) ? to : [to], message });
    return { status: 'sent', providerResponse: result };
  }

  // Simulated mode — safe default, no real network call.
  return { status: 'simulated', note: 'No SMS_PROVIDER configured — set one in .env to send real texts.' };
}

module.exports = { sendSms };
