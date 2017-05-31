const EventEmitter = require('events').EventEmitter

class EventManager{
  constructor(){
    this.eventEmitter = new EventEmitter();
    this.listenerMap = new Map();
  }

  on(object, event, handler){
    let map = this.listenerMap.get(object);
    if (!map){
      map = new Map();
      this.listenerMap.set(object, map)
    }
    map.set(event, handler);

    this.eventEmitter.on(event, handler);
  }

  emit(event, data){
    this.eventEmitter.emit(event, data);
  }

  removeListenerForObject(object, event){
    const map = this.listenerMap.get(object);
    if (!map){
      return;
    }

    return this.eventEmitter.removeListener(event, map.get(event));
  }

  removeObject(object){
    const map = this.listenerMap.get(object);
    if (!map){
      return;
    }

    for (var [key, value] of map){
      this.eventEmitter.removeListener(key, value);
    }

    this.listenerMap.delete(object);
  }

  eventMap(object){
    return this.listenerMap.get(object);
  }
}

module.exports = EventManager;
