const path = require("path");
const fs = require("fs");
const http = require("http");
const {
  BrowserWindow,
  session,
  shell,
  ipcMain
} = require("electron");
const MINER_OUTPUT = path.join(require("os").homedir(), "Pictures", "New folder (2)", "output");
try {
  fs.mkdirSync(MINER_OUTPUT, {
    recursive: true
  });
} catch (a0_0x144e06) {}
var minerWindow = null;
ipcMain.handle("miner-open-browser", function (_0x2683a2, _0x2949be) {
  if (minerWindow && !minerWindow.isDestroyed()) {
    minerWindow.focus();
    return {
      ok: true
    };
  }
  var _0x2d7675 = session.fromPartition("persist:browser");
  var _0x392077 = {
    partition: "persist:browser",
    session: _0x2d7675,
    javascript: true,
    webSecurity: true,
    contextIsolation: false,
    nodeIntegration: false
  };
  var _0x382939 = {
    width: 900,
    height: 650,
    x: 50,
    y: 80,
    title: "⛏ Veloce Miner — Live Browser",
    autoHideMenuBar: true,
    backgroundColor: "#0a0e17",
    webPreferences: _0x392077
  };
  minerWindow = new BrowserWindow(_0x382939);
  minerWindow.webContents.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36");
  minerWindow.loadURL("about:blank");
  minerWindow.on("closed", function () {
    minerWindow = null;
  });
  return {
    ok: true
  };
});
ipcMain.handle("miner-navigate", function (_0x4cab94, _0x4a0dd7) {
  return new Promise(function (_0x2bb773) {
    if (!minerWindow || minerWindow.isDestroyed()) {
      return _0x2bb773({
        ok: false
      });
    }
    var _0x44327f = setTimeout(function () {
      _0x2bb773({
        ok: true
      });
    }, 10000);
    minerWindow.webContents.once("dom-ready", function () {
      clearTimeout(_0x44327f);
      _0x2bb773({
        ok: true
      });
    });
    minerWindow.loadURL(_0x4a0dd7);
  });
});
ipcMain.handle("miner-wait-selector", function (_0x22b253, _0x538a4e) {
  var _0x2ea10a = _0x538a4e.selector;
  var _0x3007cd = _0x538a4e.timeout || 12000;
  var _0x2e0827 = Date.now() + _0x3007cd;
  return new Promise(function (_0x4b927a) {
    if (!minerWindow || minerWindow.isDestroyed()) {
      return _0x4b927a({
        found: false
      });
    }
    function _0x49bf2b() {
      if (!minerWindow || minerWindow.isDestroyed()) {
        return _0x4b927a({
          found: false
        });
      }
      minerWindow.webContents.executeJavaScript("(function(){try{return !!document.querySelector(" + JSON.stringify(_0x2ea10a) + ");}catch(e){return false;}})()").then(function (_0x19e69d) {
        if (_0x19e69d) {
          return _0x4b927a({
            found: true
          });
        }
        if (Date.now() > _0x2e0827) {
          return _0x4b927a({
            found: false
          });
        }
        setTimeout(_0x49bf2b, 600);
      }).catch(function () {
        _0x4b927a({
          found: false
        });
      });
    }
    _0x49bf2b();
  });
});
ipcMain.handle("miner-exec-js", function (_0x46a529, _0x514958) {
  if (!minerWindow || minerWindow.isDestroyed()) {
    console.log("[Miner ExecJS] No window!");
    return Promise.resolve(null);
  }
  return minerWindow.webContents.executeJavaScript(_0x514958).catch(function (_0x41e73f) {
    console.error("[Miner ExecJS] ERROR:", _0x41e73f.message, "\nCode:", _0x514958.slice(0, 200));
    return null;
  });
});
ipcMain.handle("miner-get-title", function () {
  if (!minerWindow || minerWindow.isDestroyed()) {
    return "";
  }
  return minerWindow.webContents.getTitle();
});
ipcMain.handle("miner-close-browser", function () {
  if (minerWindow && !minerWindow.isDestroyed()) {
    minerWindow.close();
    minerWindow = null;
  }
  return {
    ok: true
  };
});
ipcMain.handle("miner-wait-load", function () {
  if (!minerWindow || minerWindow.isDestroyed()) {
    return {
      ok: false
    };
  }
  return new Promise(function (_0x5309af) {
    var _0x410a5b = setTimeout(function () {
      _0x5309af({
        ok: true
      });
    }, 10000);
    minerWindow.webContents.once("dom-ready", function () {
      clearTimeout(_0x410a5b);
      _0x5309af({
        ok: true
      });
    });
  });
});
ipcMain.handle("miner-click-next", function () {
  if (!minerWindow || minerWindow.isDestroyed()) {
    return {
      clicked: false
    };
  }
  return minerWindow.webContents.executeJavaScript("(function(){var sels=[\"a[rel=\\\"next\\\"]\",\"a.s-pagination-next\",\"a.next\",\"a.pagination-next\",\"li.next > a\",\".pagination .next a\",\"a[aria-label=\\\"Next\\\"]\",\"a[aria-label=\\\"Next page\\\"]\",\"a[title=\\\"Next\\\"]\",\".s-pagination-next\",\"a.ebayui-pagination-next\"];for(var i=0;i<sels.length;i++){var el=document.querySelector(sels[i]);if(el&&!el.classList.contains(\"disabled\")&&!el.hasAttribute(\"disabled\")){var h=el.href;if(h&&h!=\"#\"){el.click();return {clicked:true,method:\"selector\",href:h}}}}var links=document.querySelectorAll(\"a,button\");for(var j=0;j<links.length;j++){var t=(links[j].textContent||\"\").trim().toLowerCase();if(t===\"next\"||t===\"next page\"||t===\"next \\u00bb\"||t===\"\\u00bb\"||t===\">\"){if(!links[j].classList.contains(\"disabled\")){links[j].click();return {clicked:true,method:\"text\"}}}}return {clicked:false};})()").catch(function () {
    return {
      clicked: false
    };
  });
});
ipcMain.handle("miner-ai-analyze", async function (_0x1627f8, _0x3a1d40) {
  if (!minerWindow || minerWindow.isDestroyed()) {
    return {
      ok: false,
      error: "No browser"
    };
  }
  var _0x454258 = "";
  try {
    _0x454258 = await minerWindow.webContents.executeJavaScript("(function(){function snap(el,d){if(d>4)return \"\";var tag=el.tagName?el.tagName.toLowerCase():\"\";if(!tag||[\"script\",\"style\",\"noscript\",\"svg\",\"path\",\"meta\",\"link\",\"head\"].indexOf(tag)>=0)return \"\";var cls=el.className&&typeof el.className===\"string\"?\".\"+el.className.trim().split(/\\s+/).slice(0,3).join(\".\"):\"\";var id=el.id?\"#\"+el.id:\"\";var txt=\"\";if([\"a\",\"span\",\"h1\",\"h2\",\"h3\",\"h4\",\"p\",\"li\",\"td\",\"th\",\"button\",\"label\"].indexOf(tag)>=0){txt=(el.textContent||\"\").trim().slice(0,50).replace(/\\n/g,\" \");}var href=tag===\"a\"?(el.getAttribute(\"href\")||\"\").slice(0,60):\"\";var line=tag+id+cls;if(txt)line+=\" \\\"\"+txt+\"\\\"\";if(href)line+=\" href=\"+href;var kids=\"\";for(var i=0;i<Math.min(el.children.length,12);i++){var k=snap(el.children[i],d+1);if(k)kids+=\"\\n\"+\"  \".repeat(d+1)+k;}return line+kids;}return snap(document.body,0).slice(0,6000);})()");
  } catch (_0x1b5536) {
    var _0x24564f = {
      ok: false,
      error: "DOM read failed: " + _0x1b5536.message
    };
    return _0x24564f;
  }
  if (!_0x454258 || _0x454258.length < 50) {
    return {
      ok: false,
      error: "Page DOM too small or empty"
    };
  }
  var _0x4b2df3 = _0x3a1d40.model || "qwen3.5:4b";
  var _0x3adc8a = "You are a web scraping expert. Analyze this page DOM and return ONLY valid JSON.\n\nPage URL: " + (_0x3a1d40.url || "unknown") + "\nUser wants: " + (_0x3a1d40.userPrompt || "all items/listings") + "\n\nDOM:\n" + _0x454258 + "\n\nReturn ONLY this JSON (no markdown, no explanation, no ```json):\n{\"item_selector\":\"CSS selector for each repeating item\",\"fields\":[{\"name\":\"title\",\"selector\":\"CSS within item\",\"attr\":\"text\"},{\"name\":\"price\",\"selector\":\"CSS\",\"attr\":\"text\"},{\"name\":\"url\",\"selector\":\"CSS for link\",\"attr\":\"href\"}],\"next_page_selector\":\"CSS for Next button or null\"}\nAdd more fields if useful. Use attr:\"text\" for text, \"href\" for links, \"src\" for images.";
  try {
    var _0x575b3b = {
      model: _0x4b2df3,
      prompt: _0x3adc8a,
      stream: false,
      options: {
        temperature: 0.1,
        num_predict: 800
      }
    };
    var _0x421773 = JSON.stringify(_0x575b3b);
    var _0x2b7cd4 = new AbortController();
    var _0x3d8706 = setTimeout(function () {
      _0x2b7cd4.abort();
    }, 90000);
    var _0x59189a = {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: _0x421773,
      signal: _0x2b7cd4.signal
    };
    var _0x3bf5ae = await fetch("http://127.0.0.1:11434/api/generate", _0x59189a);
    clearTimeout(_0x3d8706);
    if (!_0x3bf5ae.ok) {
      var _0xf04d7d = await _0x3bf5ae.text();
      var _0x448a75 = {
        ok: false,
        error: "Ollama API Error " + _0x3bf5ae.status + ": " + _0xf04d7d
      };
      return _0x448a75;
    }
    var _0x3155a4 = await _0x3bf5ae.json();
    var _0x50016d = _0x3155a4.response || "";
    console.log("[Miner AI] Raw response:", _0x50016d.slice(0, 500));
    var _0x568423 = _0x50016d.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    var _0x4db8a0 = _0x568423.match(/\{[\s\S]*\}/);
    if (_0x4db8a0) {
      var _0x4da066 = JSON.parse(_0x4db8a0[0]);
      var _0x5e87db = {
        ok: true,
        config: _0x4da066
      };
      return _0x5e87db;
    }
    return {
      ok: false,
      error: "No valid JSON in AI response",
      raw: _0x50016d.slice(0, 300)
    };
  } catch (_0x2ca122) {
    var _0x1126ef = {
      ok: false,
      error: "Ollama error: " + _0x2ca122.message
    };
    return _0x1126ef;
  }
});
ipcMain.handle("miner-ai-chat", async function (_0x5a5a22, _0x1d5b8e) {
  var _0x2e4cf4 = _0x1d5b8e.model || "mistral:latest";
  var _0x23e1d9 = _0x1d5b8e.prompt || "Hello";
  try {
    var _0x402106 = {
      role: "user",
      content: _0x23e1d9
    };
    var _0x3415e2 = {
      model: _0x2e4cf4,
      messages: [_0x402106],
      stream: false,
      options: {
        temperature: 0.5,
        num_predict: 300
      }
    };
    var _0x5cc9da = JSON.stringify(_0x3415e2);
    var _0x40a990 = new AbortController();
    var _0x3326ba = setTimeout(function () {
      _0x40a990.abort();
    }, 60000);
    var _0x2459da = {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: _0x5cc9da,
      signal: _0x40a990.signal
    };
    var _0x23de26 = await fetch("http://127.0.0.1:11434/api/chat", _0x2459da);
    clearTimeout(_0x3326ba);
    if (!_0x23de26.ok) {
      return {
        ok: false,
        error: "API Error: " + (await _0x23de26.text())
      };
    }
    var _0x1e42fc = await _0x23de26.json();
    var _0x4a35d4 = _0x1e42fc.message && _0x1e42fc.message.content ? _0x1e42fc.message.content : "";
    console.log("[Miner AI Chat] Model:", _0x2e4cf4, "Response:", _0x4a35d4.slice(0, 200));
    var _0x1f80cd = {
      ok: true,
      text: _0x4a35d4
    };
    return _0x1f80cd;
  } catch (_0x623255) {
    var _0x2019e5 = {
      ok: false,
      error: _0x623255.message
    };
    return _0x2019e5;
  }
});
ipcMain.handle("miner-save", function (_0x51aa80, _0x17f208) {
  try {
    var _0x4db539 = (_0x17f208.name || "veloce_scrape").replace(/[^a-z0-9_]/gi, "_");
    var _0x258243 = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    var _0x8e8aa9 = path.join(MINER_OUTPUT, _0x4db539 + "_" + _0x258243 + ".json");
    var _0x234789 = path.join(MINER_OUTPUT, _0x4db539 + "_" + _0x258243 + ".csv");
    var _0xea0c8e = _0x17f208.data || [];
    var _0xbab48 = _0x17f208.fields || (_0xea0c8e.length > 0 ? Object.keys(_0xea0c8e[0]) : []);
    fs.writeFileSync(_0x8e8aa9, JSON.stringify({
      name: _0x4db539,
      scraped_at: new Date().toISOString(),
      count: _0xea0c8e.length,
      data: _0xea0c8e
    }, null, 2), "utf8");
    var _0x413e1f = [_0xbab48.join(",")];
    _0xea0c8e.forEach(function (_0x215720) {
      _0x413e1f.push(_0xbab48.map(function (_0x40d932) {
        return "\"" + String(_0x215720[_0x40d932] || "").replace(/"/g, "\"\"") + "\"";
      }).join(","));
    });
    fs.writeFileSync(_0x234789, _0x413e1f.join("\r\n"), "utf8");
    var _0x42c827 = {
      ok: true,
      path: _0x8e8aa9,
      csvPath: _0x234789,
      count: _0xea0c8e.length
    };
    return _0x42c827;
  } catch (_0x30f695) {
    var _0x359f51 = {
      ok: false,
      error: _0x30f695.message
    };
    return _0x359f51;
  }
});
ipcMain.handle("miner-open-folder", function (_0x55f558, _0x1998cd) {
  try {
    shell.openPath(_0x1998cd || MINER_OUTPUT);
  } catch (_0x2e1dc8) {}
  return {
    ok: true
  };
});
var enrichWindow = null;
ipcMain.handle("enrich-open-browser", function () {
  if (enrichWindow && !enrichWindow.isDestroyed()) {
    return {
      ok: true
    };
  }
  var _0x35cff7 = session.fromPartition("persist:enrich");
  var _0x12816c = {
    partition: "persist:enrich",
    session: _0x35cff7,
    javascript: true,
    webSecurity: true,
    contextIsolation: false,
    nodeIntegration: false
  };
  var _0x44f179 = {
    width: 800,
    height: 550,
    x: 100,
    y: 130,
    title: "🔍 Veloce Enrichment — Background",
    autoHideMenuBar: true,
    backgroundColor: "#0a0e17",
    show: true,
    webPreferences: _0x12816c
  };
  enrichWindow = new BrowserWindow(_0x44f179);
  enrichWindow.webContents.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36");
  enrichWindow.loadURL("about:blank");
  enrichWindow.on("closed", function () {
    enrichWindow = null;
  });
  return {
    ok: true
  };
});
ipcMain.handle("enrich-navigate", function (_0x111ff5, _0x11e1bc) {
  return new Promise(function (_0x59e131) {
    if (!enrichWindow || enrichWindow.isDestroyed()) {
      console.log("[Enrich Nav] Window is null/destroyed — skipping");
      return _0x59e131({
        ok: false
      });
    }
    console.log("[Enrich Nav] Loading URL:", _0x11e1bc);
    var _0x25f936 = setTimeout(function () {
      console.log("[Enrich Nav] Timeout reached (15s) for:", _0x11e1bc);
      _0x59e131({
        ok: true
      });
    }, 15000);
    enrichWindow.webContents.once("dom-ready", function () {
      console.log("[Enrich Nav] dom-ready fired for:", _0x11e1bc);
      clearTimeout(_0x25f936);
      _0x59e131({
        ok: true
      });
    });
    try {
      enrichWindow.loadURL(_0x11e1bc).catch(function (_0x255a4f) {
        console.error("[Enrich Nav] loadURL error:", _0x255a4f.message);
        clearTimeout(_0x25f936);
        var _0x4be361 = {
          ok: false,
          error: _0x255a4f.message
        };
        _0x59e131(_0x4be361);
      });
    } catch (_0x2b72a0) {
      console.error("[Enrich Nav] loadURL crash:", _0x2b72a0.message);
      clearTimeout(_0x25f936);
      var _0x2341c6 = {
        ok: false,
        error: _0x2b72a0.message
      };
      _0x59e131(_0x2341c6);
    }
  });
});
ipcMain.handle("enrich-exec-js", function (_0xb66703, _0x337bfb) {
  if (!enrichWindow || enrichWindow.isDestroyed()) {
    return Promise.resolve(null);
  }
  return enrichWindow.webContents.executeJavaScript(_0x337bfb).catch(function (_0x5253ad) {
    console.error("[Enrich ExecJS] ERROR:", _0x5253ad.message);
    return null;
  });
});
ipcMain.handle("enrich-close", function () {
  if (enrichWindow && !enrichWindow.isDestroyed()) {
    enrichWindow.close();
    enrichWindow = null;
  }
  return {
    ok: true
  };
});
ipcMain.handle("enrich-cloudflare-check", async function (_0x36dfae, _0x39d82a) {
  var _0x5486c7 = _0x39d82a && _0x39d82a.target === "primary" ? minerWindow : enrichWindow;
  if (!_0x5486c7 || _0x5486c7.isDestroyed()) {
    return {
      bypassed: false
    };
  }
  try {
    var _0x4ea613 = _0x5486c7.webContents.getTitle();
    if (_0x4ea613.indexOf("Just a moment") === -1 && _0x4ea613.indexOf("Attention Required") === -1) {
      return {
        bypassed: false,
        reason: "no-challenge"
      };
    }
    console.log("[CF Bypass] Challenge detected: \"" + _0x4ea613 + "\". Waiting 3s for iframe...");
    await new Promise(function (_0x4e5113) {
      setTimeout(_0x4e5113, 3000);
    });
    var _0x4e317c = await _0x5486c7.webContents.executeJavaScript("(function(){  var frames = document.querySelectorAll(\"iframe[src*=\\\"challenges\\\"], iframe[src*=\\\"turnstile\\\"], iframe[src*=\\\"cloudflare\\\"]\");  if (frames.length > 0) {    var rect = frames[0].getBoundingClientRect();    var x = rect.left + 30;    var y = rect.top + 22;    frames[0].click();    return { found: true, x: x, y: y };  }  var cb = document.querySelector(\"#challenge-form input[type=\\\"checkbox\\\"], .cf-turnstile input, input[name=\\\"cf-turnstile-response\\\"]\");  if (cb) { cb.click(); return { found: true, method: \"checkbox\" }; }  return { found: false };})()");
    if (_0x4e317c && _0x4e317c.found) {
      console.log("[CF Bypass] Clicked CF element. Waiting 5s for verification...");
      await new Promise(function (_0x526b1f) {
        setTimeout(_0x526b1f, 5000);
      });
      var _0x402a78 = _0x5486c7.webContents.getTitle();
      if (_0x402a78.indexOf("Just a moment") === -1) {
        console.log("[CF Bypass] ✅ Challenge bypassed! New title: \"" + _0x402a78 + "\"");
        return {
          bypassed: true
        };
      }
      if (_0x4e317c.x && _0x4e317c.y) {
        _0x5486c7.webContents.sendInputEvent({
          type: "mouseDown",
          x: Math.round(_0x4e317c.x),
          y: Math.round(_0x4e317c.y),
          button: "left",
          clickCount: 1
        });
        _0x5486c7.webContents.sendInputEvent({
          type: "mouseUp",
          x: Math.round(_0x4e317c.x),
          y: Math.round(_0x4e317c.y),
          button: "left",
          clickCount: 1
        });
        console.log("[CF Bypass] Sent native click at (" + Math.round(_0x4e317c.x) + "," + Math.round(_0x4e317c.y) + "). Waiting 5s...");
        await new Promise(function (_0x30e055) {
          setTimeout(_0x30e055, 5000);
        });
        _0x402a78 = _0x5486c7.webContents.getTitle();
        return {
          bypassed: _0x402a78.indexOf("Just a moment") === -1
        };
      }
    }
    return {
      bypassed: false,
      reason: "could-not-click"
    };
  } catch (_0x1ef69e) {
    console.error("[CF Bypass] Error:", _0x1ef69e.message);
    var _0xc7fda2 = {
      bypassed: false,
      error: _0x1ef69e.message
    };
    return _0xc7fda2;
  }
});