/**
 * Local HTTP proxy that tunnels through an authenticated SOCKS5 proxy.
 * Requires proxy login (407) so Chrome shows the same "Sign in" dialog as for HTTP.
 * Credentials come from the dialog (or extension onAuthRequired) and are used for SOCKS5.
 */
'use strict';

const net = require('net');
const SocksClient = require('socks').SocksClient;

var activeBridges = new Map();

function bridgeKey(proxy) {
  var n = normalize(proxy);
  return (n.host || '') + ':' + (n.port || '');
}

function normalize(proxy) {
  var host = proxy && proxy.host ? String(proxy.host).trim() : '';
  var port = proxy && proxy.port ? String(proxy.port).trim() : '';
  if (host.indexOf('://') !== -1) {
    try {
      var parsed = new URL(host);
      if (parsed && parsed.hostname) host = parsed.hostname;
      if (!port && parsed && parsed.port) port = parsed.port;
    } catch (e) {}
  }
  if (host.indexOf('@') !== -1) host = host.split('@').pop();
  if (host.indexOf('/') !== -1) host = host.split('/')[0];
  if (port && host.indexOf(':') !== -1) {
    var lastColon = host.lastIndexOf(':');
    var after = host.substring(lastColon + 1);
    if (/^\d+$/.test(after)) host = host.substring(0, lastColon);
  }
  if (!port && host.indexOf(':') !== -1) {
    var parts = host.split(':');
    if (parts.length > 1) {
      port = parts.pop();
      host = parts.join(':');
    }
  }
  return { host: host, port: port };
}

function parseProxyAuth(headerStr) {
  var lines = headerStr.split(/\r?\n/);
  for (var i = 1; i < lines.length; i++) {
    var line = lines[i];
    var colon = line.indexOf(':');
    if (colon === -1) continue;
    var name = line.slice(0, colon).trim().toLowerCase();
    var value = line.slice(colon + 1).trim();
    if (name !== 'proxy-authorization') continue;
    var vLower = value.toLowerCase();
    var basicIdx = vLower.indexOf('basic');
    if (basicIdx !== 0) continue;
    var b64 = value.slice(5).replace(/^\s+/, '');
    if (!b64) return null;
    try {
      var decoded = Buffer.from(b64, 'base64').toString('utf8');
      var sep = decoded.indexOf(':');
      if (sep !== -1) {
        return {
          username: decoded.slice(0, sep),
          password: decoded.slice(sep + 1)
        };
      }
    } catch (e) {}
    return null;
  }
  return null;
}

/**
 * Returns Promise<{ port, close } | null>. Resolves after server is listening.
 * Bridge returns 407 so Chrome shows "Sign in"; credentials from dialog/extension are used for SOCKS5.
 */
function startSocks5Bridge(proxy) {
  if (!proxy || !proxy.host || !proxy.port) return Promise.resolve(null);
  var type = (proxy.type || 'http').toLowerCase();
  if (type !== 'socks5' && type !== 'socks') return Promise.resolve(null);
  var norm = normalize(proxy);
  if (!norm.host || !norm.port) return Promise.resolve(null);

  var profileUser = String(proxy.username || '').trim();
  var profilePass = String(proxy.password || '').trim();

  var key = bridgeKey(proxy);
  if (activeBridges.has(key)) {
    var existing = activeBridges.get(key);
    return Promise.resolve({ port: existing.port, close: existing.close });
  }

  var server = net.createServer(function(clientSocket) {
    var buffer = [];
    var headerDone = false;
    var responded = false;
    var sock = null;

    function safeClose() {
      try {
        if (!clientSocket.destroyed) clientSocket.end();
      } catch (e) {}
    }

    function send407() {
      if (responded) return;
      responded = true;
      if (clientSocket.destroyed) return;
      var msg = 'HTTP/1.1 407 Proxy Authentication Required\r\n' +
        'Proxy-Authenticate: Basic realm="SOCKS5 Proxy"\r\n' +
        'Connection: close\r\n\r\n';
      try {
        clientSocket.write(msg, function() { safeClose(); });
      } catch (e) {
        safeClose();
      }
    }

    function fail() {
      if (responded) return;
      responded = true;
      if (clientSocket.destroyed) return;
      var msg = 'HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\n\r\n';
      try {
        clientSocket.write(msg, function() { safeClose(); });
      } catch (e) {
        safeClose();
      }
    }

    clientSocket.on('error', function() {
      if (!responded) safeClose();
    });

    clientSocket.on('data', function(chunk) {
      try {
        if (sock && !sock.destroyed) {
          sock.write(chunk);
          return;
        }
        if (headerDone) return;
        for (var i = 0; i < chunk.length; i++) buffer.push(chunk[i]);
        var buf = Buffer.from(buffer);
        var idx = buf.indexOf('\r\n\r\n');
        if (idx === -1) return;
        headerDone = true;
        var headerStr = buf.slice(0, idx).toString('utf8');
        var firstLine = headerStr.split(/\r\n/)[0];
        var match = firstLine.match(/^CONNECT\s+([^:\s]+):(\d+)\s+/i);
        if (!match) {
          fail();
          return;
        }
        var targetHost = match[1];
        var targetPort = parseInt(match[2], 10);
        var rest = buf.slice(idx + 4);

        var creds = parseProxyAuth(headerStr);
        if (!creds && profileUser) {
          creds = { username: profileUser, password: profilePass };
        }
        if (!creds) {
          send407();
          return;
        }

        SocksClient.createConnection({
          command: 'connect',
          destination: { host: targetHost, port: targetPort },
          proxy: {
            type: 5,
            host: norm.host,
            port: parseInt(norm.port, 10) || 1080,
            userId: creds.username,
            password: creds.password,
          },
          timeout: 25000,
        }).then(function(info) {
          if (responded) {
            try { info.socket.destroy(); } catch (e) {}
            return;
          }
          sock = info.socket;
          sock.on('error', function() { if (!responded) safeClose(); });
          sock.on('close', function() { if (!responded) safeClose(); });
          try {
            clientSocket.write('HTTP/1.1 200 Connection established\r\nConnection: close\r\n\r\n', function() {
              if (clientSocket.destroyed) return;
              clientSocket.pipe(sock);
              sock.pipe(clientSocket);
              if (rest.length) sock.write(rest);
            });
          } catch (e) {
            fail();
          }
        }).catch(function() {
          fail();
        });
      } catch (e) {
        fail();
      }
    });
  });

  return new Promise(function(resolve) {
    function close() {
      try { server.close(); } catch (e) {}
      activeBridges.delete(key);
    }
    server.listen(0, '127.0.0.1', function() {
      var addr = server.address();
      var port = (addr && addr.port) ? addr.port : 0;
      if (!port) {
        try { server.close(); } catch (e) {}
        resolve(null);
        return;
      }
      activeBridges.set(key, { server: server, port: port, close: close });
      resolve({ port: port, close: close });
    });
  });
}

module.exports = { startSocks5Bridge: startSocks5Bridge };
