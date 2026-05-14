const events = [];
const watchedAddresses = new Set();

function watchAddress(address) {
  watchedAddresses.add(address.toLowerCase());
}

function logEvent(type, data) {
  const entry = { type, data, time: new Date().toISOString() };
  events.push(entry);
  if (events.length > 200) events.shift();
}

function getEvents(limit = 50) { return events.slice(-limit); }
function getWatchedAddresses() { return [...watchedAddresses]; }

module.exports = { watchAddress, getEvents, getWatchedAddresses, logEvent };
