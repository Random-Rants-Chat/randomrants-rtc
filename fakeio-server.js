var ws = require("ws");
var LZString = require("./lz.js");

class fakeIOSocket {
  constructor(ws) {
    this.ws = ws;
    this.id = ws.sockID;
    ws.fakeio = this;
    var t = this;
    this.events = {
      emit: function (name, ...values) {
        if (this[name]) {
          this[name].forEach((f) => {
            f.apply(t, values);
          });
        }
      },
      emitAsync: async function (name, ...values) {
        if (this[name]) {
          for (var f of this[name]) {
            await f.apply(t, values);
          }
        }
      },
      disconnect: [],
    };
    ws.on("message", (data) => {
      try {
        var json = JSON.parse(data.toString());
        if (json.event == null) {
          return;
        }
        if (json.event == "disconnect") {
          return; // Event not supposed to be emitted from the message.
        }
        t.events.emit(json.event, ...json.args);
      } catch (e) {
        console.log(
          'Failed to parse or execute message from client ID: "' +
            ws.sockID +
            '".',
          e,
          "Might be a sign of attempting to hack."
        );
        ws.close();
      }
    });
  }

  close() {
    this.ws.close();
  }

  emit(name, ...values) {
    var data = JSON.stringify({
      event: name,
      args: values,
    });
    this.ws.send(data);
  }

  on(eventName, func) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(func);
  }

  removeEvent(eventName, func) {
    if (this.events[eventName]) {
      var newEventArray = [];
      var removed = false;
      for (var event of this.events[eventName]) {
        if (removed) {
          newEventArray.push(event);
        } else {
          if (event !== func) {
            newEventArray.push(event);
            removed = true;
          }
        }
      }
      this.events[eventName] = newEventArray;
    }
  }
}

class fakeIOServer {
  constructor(wss) {
    this.wss = wss;
    this.clients = [];
    var t = this;
    this.events = {
      emit: function (name, ...values) {
        if (this[name]) {
          this[name].forEach((f) => {
            f.apply(t, values);
          });
        }
      },
      emitAsync: async function (name, ...values) {
        if (this[name]) {
          for (var f of this[name]) {
            await f.apply(t, values);
          }
        }
      },
      connect: [],
    };
    this.applyWSListeners();
  }

  close() {
    var t = this;
    t.wss.clients.forEach((ws) => {
      ws.fakeio.close();
    });
  }

  to(id) {
    for (var client of this.clients) {
      if (client.id == id) {
        return client;
      }
    }
    return null;
  }

  createRandomCharsString(length) {
    var keys =
      "ABCDEFGHIJKLKMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
    var key = "";
    var i = 0;
    while (i < length) {
      key += keys[Math.round(Math.random() * (keys.length - 1))];
      i += 1;
    }
    return key;
  }

  applyWSListeners() {
    var wss = this.wss;
    var t = this;
    wss.on("connection", (ws) => {
      t._wssOnConnect(ws);
      ws.on("close", () => {
        t._wsOnClose(ws);
      });
    });
  }

  _wssOnConnect(ws) {
    var id = this.createRandomCharsString(20);
    ws.sockID = id;
    ws.send(
      JSON.stringify({
        event: "auth",
        sockID: id,
      })
    );
    var cli = new fakeIOSocket(ws);
    this.clients.push(cli);
    this.events.emit("connection", cli);
  }

  _wsOnClose(ws) {
    var newClients = [];
    for (var cli of this.clients) {
      if (cli.ws.sockID !== ws.sockID) {
        newClients.push(cli);
      } else {
        cli.events.emit("disconnect", cli);
      }
    }
    this.clients = newClients;
  }

  on(eventName, func) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(func);
  }

  removeEvent(eventName, func) {
    if (this.events[eventName]) {
      var newEventArray = [];
      var removed = false;
      for (var event of this.events[eventName]) {
        if (removed) {
          newEventArray.push(event);
        } else {
          if (event !== func) {
            newEventArray.push(event);
            removed = true;
          }
        }
      }
      this.events[eventName] = newEventArray;
    }
  }
}

function createFakeIOServer(args) {
  var wss = new ws.WebSocketServer({
    ...args,
    maxReceivedFrameSize: Infinity,
    maxReceivedMessageSize: Infinity,
  });
  var server = new fakeIOServer(wss);
  return server;
}

module.exports = createFakeIOServer;
