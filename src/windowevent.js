exports.emit = (eventName, data) => {
  let event = document.createEvent('CustomEvent');
  event.initCustomEvent(eventName, true, true, data);
  window.dispatchEvent(event);
};
