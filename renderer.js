let a0_0x59255a = [];
let a0_0x2dacd0 = null;
let a0_0x17056d = [];
let a0_0x2e0161 = [];
let a0_0x4aadb4 = false;
const a0_0xbca93c = document.getElementById("tabs-container");
const a0_0x26601e = document.getElementById("browser-area");
const a0_0x4f149d = document.getElementById("url-bar");
const a0_0x31e80d = document.getElementById("status-text");
const a0_0x33abd7 = document.getElementById("sniffer-status");
const a0_0x2ce270 = document.getElementById("dl-tbody");
const a0_0x5815c3 = document.getElementById("dl-active");
function a0_0x534986() {
  return "tab-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
}
function a0_0xb19e16(_0x90ac19 = "https://www.google.com", _0x70afdc = true) {
  const _0x1bb0f3 = a0_0x534986();
  let _0x9bf946;
  if (_0x90ac19 === "veloce://settings") {
    _0x9bf946 = document.createElement("div");
    _0x9bf946.setAttribute("data-tab-id", _0x1bb0f3);
    _0x9bf946.className = "webview settings-view";
    _0x9bf946.style.flex = "1";
    _0x9bf946.style.width = "100%";
    _0x9bf946.style.height = "100%";
    _0x9bf946.style.overflow = "hidden";
    fetch("./browser-settings.html").then(_0x35b11f => _0x35b11f.text()).then(_0x43ff6d => {
      _0x9bf946.innerHTML = _0x43ff6d;
      setTimeout(() => {
        const _0xd62ddf = _0x9bf946.querySelector("#btn-clear-cache");
        const _0x13ee1f = _0x9bf946.querySelector("#btn-clear-data");
        const _0x536693 = _0x9bf946.querySelector("#alert-box");
        const _0x5b7013 = _0x9bf946.querySelector("#btn-toggle-theme");
        function _0x5fe73f(_0xfed80b) {
          if (!_0x536693) {
            return;
          }
          _0x536693.textContent = _0xfed80b;
          _0x536693.style.display = "block";
          setTimeout(() => {
            _0x536693.style.display = "none";
          }, 3000);
        }
        if (_0xd62ddf) {
          _0xd62ddf.onclick = () => {
            if (window.veloce && window.veloce.clearCache) {
              window.veloce.clearCache().then(() => _0x5fe73f("Cache cleared successfully!")).catch(_0x11c9df => _0x5fe73f("Error: " + _0x11c9df.message));
            }
          };
        }
        if (_0x13ee1f) {
          _0x13ee1f.onclick = () => {
            if (confirm("Are you sure you want to delete all browsing data?")) {
              if (window.veloce && window.veloce.clearBrowsingData) {
                window.veloce.clearBrowsingData().then(() => _0x5fe73f("Data deleted!")).catch(_0x148d5b => _0x5fe73f("Error: " + _0x148d5b.message));
              }
            }
          };
        }
        if (_0x5b7013) {
          _0x5b7013.onclick = () => {
            const _0x4eed49 = _0x9bf946.querySelector(".dark-mode") || _0x9bf946.querySelector(".light-mode") || _0x9bf946.children[0];
            if (_0x4eed49 && _0x4eed49.classList.contains("dark-mode")) {
              _0x4eed49.classList.remove("dark-mode");
              const _0x34945e = _0x9bf946.querySelector("#theme-sub");
              if (_0x34945e) {
                _0x34945e.textContent = "Light mode active";
              }
            } else if (_0x4eed49) {
              _0x4eed49.classList.add("dark-mode");
              const _0xcc8894 = _0x9bf946.querySelector("#theme-sub");
              if (_0xcc8894) {
                _0xcc8894.textContent = "Dark mode active";
              }
            }
          };
        }
        const _0x29571f = _0x9bf946.querySelectorAll(".nav-item");
        if (_0x29571f.length >= 3) {
          var _0x383e43 = {
            behavior: "smooth"
          };
          _0x29571f[0].onclick = () => _0x9bf946.querySelector("#sec-get-started").scrollIntoView(_0x383e43);
          var _0x17462d = {
            behavior: "smooth"
          };
          _0x29571f[1].onclick = () => _0x9bf946.querySelector("#sec-privacy").scrollIntoView(_0x17462d);
          var _0x5651bf = {
            behavior: "smooth"
          };
          _0x29571f[2].onclick = () => _0x9bf946.querySelector("#sec-appearance").scrollIntoView(_0x5651bf);
        }
      }, 100);
    });
  } else {
    _0x9bf946 = document.createElement("webview");
    _0x9bf946.setAttribute("src", _0x90ac19);
    _0x9bf946.setAttribute("data-tab-id", _0x1bb0f3);
    _0x9bf946.setAttribute("allowpopups", "");
    _0x9bf946.setAttribute("plugins", "");
    _0x9bf946.setAttribute("autosize", "on");
    _0x9bf946.setAttribute("partition", "persist:browser");
    _0x9bf946.setAttribute("preload", "./stealth-preload.js");
    _0x9bf946.setAttribute("useragent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
    _0x9bf946.setAttribute("webpreferences", "javascript=yes");
  }
  const _0x2034d6 = document.createElement("div");
  _0x2034d6.className = "tab";
  _0x2034d6.setAttribute("data-tab-id", _0x1bb0f3);
  const _0x287818 = document.createElement("span");
  _0x287818.className = "tab-title";
  _0x287818.textContent = "New Tab";
  const _0x40ca90 = document.createElement("button");
  _0x40ca90.className = "tab-close";
  _0x40ca90.textContent = "×";
  _0x40ca90.onclick = _0x353adf => {
    _0x353adf.stopPropagation();
    a0_0xd11963(_0x1bb0f3);
  };
  _0x2034d6.appendChild(_0x287818);
  _0x2034d6.appendChild(_0x40ca90);
  _0x2034d6.onclick = () => a0_0x2bf88b(_0x1bb0f3);
  _0x2034d6.oncontextmenu = _0x390a3a => {
    _0x390a3a.preventDefault();
    a0_0x10ae7f(_0x1bb0f3, _0x390a3a.clientX, _0x390a3a.clientY);
  };
  a0_0xbca93c.appendChild(_0x2034d6);
  a0_0x26601e.appendChild(_0x9bf946);
  var _0x444838 = {
    id: _0x1bb0f3,
    webview: _0x9bf946,
    tabEl: _0x2034d6,
    titleSpan: _0x287818,
    title: _0x90ac19 === "veloce://settings" ? "Settings" : "New Tab",
    url: _0x90ac19
  };
  a0_0x59255a.push(_0x444838);
  if (_0x90ac19 !== "veloce://settings") {
    _0x9bf946.addEventListener("did-navigate", _0x2687d5 => {
      a0_0x3c571b(_0x2687d5.url);
      const _0x468b81 = a0_0x59255a.find(_0x3e336c => _0x3e336c.id === _0x1bb0f3);
      if (_0x468b81) {
        _0x468b81.url = _0x2687d5.url;
      }
      if (_0x1bb0f3 === a0_0x2dacd0) {
        a0_0x4f149d.value = _0x2687d5.url;
        a0_0x17056d = [];
        a0_0x4f149d.classList.remove("media-detected");
        // Full page load/refresh — re-arm smart download detection so the
        // popup shows again (dedup URL + any stuck in-flight extraction flag)
        a0_0x320cd6 = "";
        a0_0x3d1685 = false;
        a0_0x7dc2(_0x2687d5.url);
      }
    });
    _0x9bf946.addEventListener("did-navigate-in-page", _0x2a45b0 => {
      a0_0x3c571b(_0x2a45b0.url);
      if (_0x2a45b0.isMainFrame) {
        const _0x28aa4e = a0_0x59255a.find(_0x445d24 => _0x445d24.id === _0x1bb0f3);
        if (_0x28aa4e) {
          _0x28aa4e.url = _0x2a45b0.url;
        }
        if (_0x1bb0f3 === a0_0x2dacd0) {
          a0_0x4f149d.value = _0x2a45b0.url;
          a0_0x17056d = [];
          a0_0x4f149d.classList.remove("media-detected");
          a0_0x7dc2(_0x2a45b0.url);
        }
      }
    });
    _0x9bf946.addEventListener("page-title-updated", _0x3dee9f => {
      const _0x2d45fd = a0_0x59255a.find(_0x111d49 => _0x111d49.id === _0x1bb0f3);
      if (_0x2d45fd) {
        _0x2d45fd.title = _0x3dee9f.title;
        const _0x8003e4 = _0x3dee9f.title.length > 25 ? _0x3dee9f.title.slice(0, 25) + "…" : _0x3dee9f.title;
        _0x2d45fd.titleSpan.textContent = _0x8003e4;
        _0x2d45fd.tabEl.title = _0x3dee9f.title;
      }
    });
    _0x9bf946.addEventListener("new-window", _0x1cbbcc => {
      a0_0xb19e16(_0x1cbbcc.url);
    });
  } else {
    _0x287818.textContent = "Settings";
  }
  if (_0x70afdc) {
    a0_0x2bf88b(_0x1bb0f3);
  }
  return _0x1bb0f3;
}
function a0_0x2bf88b(_0x44eea1) {
  a0_0x2dacd0 = _0x44eea1;
  a0_0x59255a.forEach(_0x5eb094 => {
    if (_0x5eb094.id === _0x44eea1) {
      _0x5eb094.webview.classList.add("active");
      _0x5eb094.tabEl.classList.add("active");
      a0_0x4f149d.value = _0x5eb094.url || "";
    } else {
      _0x5eb094.webview.classList.remove("active");
      _0x5eb094.tabEl.classList.remove("active");
    }
  });
  a0_0x17056d = [];
  a0_0x4f149d.classList.remove("media-detected");
  a0_0x59d2a3();
}
function a0_0xd11963(_0x1ef200) {
  const _0x18900e = a0_0x59255a.findIndex(_0x3e8c19 => _0x3e8c19.id === _0x1ef200);
  if (_0x18900e === -1) {
    return;
  }
  if (a0_0x59255a.length <= 1) {
    a0_0xb19e16("https://www.google.com");
  }
  const _0x298b94 = a0_0x59255a[_0x18900e];
  _0x298b94.tabEl.remove();
  _0x298b94.webview.remove();
  a0_0x59255a.splice(_0x18900e, 1);
  if (_0x1ef200 === a0_0x2dacd0 && a0_0x59255a.length > 0) {
    const _0x23c84d = Math.min(_0x18900e, a0_0x59255a.length - 1);
    a0_0x2bf88b(a0_0x59255a[_0x23c84d].id);
  }
}
function a0_0x446027(_0x108f04) {
  const _0x12b3f7 = a0_0x59255a.find(_0x1585a6 => _0x1585a6.id === _0x108f04);
  if (_0x12b3f7) {
    a0_0xb19e16(_0x12b3f7.url);
  }
}
function a0_0x152c79(_0x234c22) {
  const _0x24a5eb = a0_0x59255a.filter(_0x3d229 => _0x3d229.id !== _0x234c22).map(_0x28d830 => _0x28d830.id);
  _0x24a5eb.forEach(_0x34f765 => a0_0xd11963(_0x34f765));
}
let a0_0xc83794 = null;
function a0_0x10ae7f(_0x3cc65a, _0x426244, _0x1ca017) {
  if (a0_0xc83794) {
    a0_0xc83794.remove();
  }
  a0_0xc83794 = document.createElement("div");
  a0_0xc83794.style.cssText = "\n    position: fixed; top: " + _0x1ca017 + "px; left: " + _0x426244 + "px; z-index: 9999;\n    background: #1e293b; border: 1px solid #334155; border-radius: 8px;\n    padding: 4px 0; min-width: 160px; box-shadow: 0 8px 24px rgba(0,0,0,.5);\n  ";
  const _0x2b52d2 = [{
    label: "Duplicate Tab",
    action: () => a0_0x446027(_0x3cc65a)
  }, {
    label: "New Tab",
    action: () => a0_0xb19e16()
  }, {
    label: "—",
    action: null
  }, {
    label: "Close Tab",
    action: () => a0_0xd11963(_0x3cc65a)
  }, {
    label: "Close Other Tabs",
    action: () => a0_0x152c79(_0x3cc65a)
  }];
  _0x2b52d2.forEach(_0x202d08 => {
    if (_0x202d08.label === "—") {
      const _0xd8cb27 = document.createElement("div");
      _0xd8cb27.style.cssText = "height: 1px; background: #334155; margin: 4px 0;";
      a0_0xc83794.appendChild(_0xd8cb27);
      return;
    }
    const _0x33c80d = document.createElement("div");
    _0x33c80d.textContent = _0x202d08.label;
    _0x33c80d.style.cssText = "\n      padding: 6px 16px; cursor: pointer; color: #e0e0e0; font-size: 13px;\n    ";
    _0x33c80d.onmouseenter = () => _0x33c80d.style.background = "#2563eb";
    _0x33c80d.onmouseleave = () => _0x33c80d.style.background = "transparent";
    _0x33c80d.onclick = () => {
      _0x202d08.action();
      a0_0xc83794.remove();
      a0_0xc83794 = null;
    };
    a0_0xc83794.appendChild(_0x33c80d);
  });
  document.body.appendChild(a0_0xc83794);
  const _0x51d58a = _0x321aff => {
    if (a0_0xc83794 && !a0_0xc83794.contains(_0x321aff.target)) {
      a0_0xc83794.remove();
      a0_0xc83794 = null;
      document.removeEventListener("click", _0x51d58a);
    }
  };
  setTimeout(() => document.addEventListener("click", _0x51d58a), 10);
}
function a0_0x3e547c(_0x4072b5) {
  const _0xd9de89 = a0_0x59255a.find(_0xe63266 => _0xe63266.id === a0_0x2dacd0);
  if (!_0xd9de89) {
    return;
  }
  if (!_0x4072b5.startsWith("http://") && !_0x4072b5.startsWith("https://")) {
    if (_0x4072b5.includes(".") && !_0x4072b5.includes(" ")) {
      _0x4072b5 = "https://" + _0x4072b5;
    } else {
      _0x4072b5 = "https://www.google.com/search?q=" + encodeURIComponent(_0x4072b5);
    }
  }
  if (!_0xd9de89.webview.loadURL) {
    a0_0xb19e16(_0x4072b5);
    return;
  }
  _0xd9de89.webview.loadURL(_0x4072b5);
  _0xd9de89.url = _0x4072b5;
  a0_0x4f149d.value = _0x4072b5;
}
document.getElementById("btn-back").onclick = () => {
  const _0x20743f = a0_0x59255a.find(_0x8111eb => _0x8111eb.id === a0_0x2dacd0);
  if (_0x20743f && _0x20743f.webview.canGoBack()) {
    _0x20743f.webview.goBack();
  }
};
document.getElementById("btn-forward").onclick = () => {
  const _0x2ec09c = a0_0x59255a.find(_0xd5d9bc => _0xd5d9bc.id === a0_0x2dacd0);
  if (_0x2ec09c && _0x2ec09c.webview.canGoForward()) {
    _0x2ec09c.webview.goForward();
  }
};
document.getElementById("btn-reload").onclick = () => {
  const _0x19457a = a0_0x59255a.find(_0x25ea71 => _0x25ea71.id === a0_0x2dacd0);
  if (_0x19457a) {
    _0x19457a.webview.reload();
  }
};
a0_0x4f149d.addEventListener("keydown", _0x56ac29 => {
  if (_0x56ac29.key === "Enter") {
    a0_0x3e547c(a0_0x4f149d.value.trim());
  }
});
document.getElementById("btn-new-tab").onclick = () => a0_0xb19e16();
document.getElementById("btn-open-browser").onclick = () => {
  const _0x24bebc = a0_0x59255a.find(_0x25aa50 => _0x25aa50.id === a0_0x2dacd0);
  if (_0x24bebc && _0x24bebc.url && window.veloce) {
    window.veloce.openInBrowser(_0x24bebc.url);
    a0_0x31e80d.textContent = "Opened in system browser";
  }
};
const a0_0x194d6a = document.createElement("div");
a0_0x194d6a.id = "floating-dl-popup";
a0_0x194d6a.style.cssText = "\n  display: none;\n  position: absolute;\n  top: 8px;\n  right: 12px;\n  z-index: 99999;\n  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);\n  border: 2px solid #2563eb;\n  border-radius: 12px;\n  padding: 0;\n  min-width: 380px;\n  max-width: 500px;\n  box-shadow: 0 8px 32px rgba(37,99,235,.4), 0 0 0 1px rgba(37,99,235,.2);\n  font-family: 'Segoe UI', Arial, sans-serif;\n  overflow: hidden;\n";
a0_0x194d6a.innerHTML = "\n  <div id=\"popup-header\" style=\"\n    display: flex; justify-content: space-between; align-items: center;\n    padding: 10px 14px;\n    background: linear-gradient(135deg, #2563eb, #7c3aed);\n    cursor: default;\n  \">\n    <span style=\"color: #fff; font-weight: bold; font-size: 13px;\">\n      ▶ Download this video\n    </span>\n    <div style=\"display: flex; gap: 6px;\">\n      <button id=\"popup-dl-all\" style=\"\n        background: #22c55e; color: #fff; border: none; border-radius: 6px;\n        padding: 4px 12px; font-size: 12px; font-weight: bold; cursor: pointer;\n      \">Download all</button>\n      <button id=\"popup-close\" style=\"\n        background: rgba(255,255,255,.2); color: #fff; border: none;\n        border-radius: 50%; width: 22px; height: 22px; font-size: 14px;\n        cursor: pointer; line-height: 1;\n      \">×</button>\n    </div>\n  </div>\n  <div id=\"popup-list\" style=\"\n    max-height: 200px; overflow-y: auto; padding: 6px 0;\n  \"></div>\n";
a0_0x26601e.appendChild(a0_0x194d6a);
function a0_0x2700db(_0x1d0a06) {
  const _0x156c36 = _0x1d0a06.toLowerCase();
  const _0x19fbf1 = _0x1d0a06.split("/").pop().split("?")[0] || "stream";
  const _0x27adf5 = _0x19fbf1.length > 50 ? _0x19fbf1.slice(0, 50) + "…" : _0x19fbf1;
  let _0x2b0a17 = "File";
  if (_0x156c36.includes(".m3u8")) {
    _0x2b0a17 = "HLS stream";
  } else if (_0x156c36.includes(".mpd")) {
    _0x2b0a17 = "DASH stream";
  } else if (_0x156c36.includes(".mp4")) {
    _0x2b0a17 = "MP4";
  } else if (_0x156c36.includes(".ts")) {
    _0x2b0a17 = "TS segment";
  } else if (_0x156c36.includes(".webm")) {
    _0x2b0a17 = "WebM";
  } else if (_0x156c36.includes("videoplayback")) {
    _0x2b0a17 = "Video";
  } else if (_0x156c36.includes("/hls/")) {
    _0x2b0a17 = "HLS";
  } else if (_0x156c36.includes("/dash/")) {
    _0x2b0a17 = "DASH";
  } else if (_0x156c36.includes("/stream/")) {
    _0x2b0a17 = "Stream";
  } else if (_0x156c36.includes("/chunk-") || _0x156c36.includes("/segment")) {
    _0x2b0a17 = "Segment";
  }
  var _0x29ca0a = {
    shortName: _0x27adf5,
    type: _0x2b0a17
  };
  return _0x29ca0a;
}
function a0_0xdd2ac5() {
  if (a0_0x17056d.length === 0) {
    return null;
  }
  let _0x4c454a = a0_0x17056d[a0_0x17056d.length - 1];
  for (const _0x3da306 of a0_0x17056d) {
    const _0x3620ed = _0x3da306.toLowerCase();
    if (_0x3620ed.includes(".m3u8") || _0x3620ed.includes(".mpd")) {
      _0x4c454a = _0x3da306;
      break;
    }
  }
  return _0x4c454a;
}
function a0_0x19141e() {
  const _0x32e220 = document.getElementById("popup-list");
  _0x32e220.innerHTML = "";
  const _0x5eaee2 = a0_0xdd2ac5();
  if (!_0x5eaee2) {
    return;
  }
  const {
    shortName: _0xe47aad,
    type: _0x4fa468
  } = a0_0x2700db(_0x5eaee2);
  const _0x5129ed = document.createElement("div");
  _0x5129ed.style.cssText = "\n    display: flex; justify-content: space-between; align-items: center;\n    padding: 6px 14px; cursor: default; transition: background .1s;\n  ";
  _0x5129ed.onmouseenter = () => _0x5129ed.style.background = "rgba(37,99,235,.15)";
  _0x5129ed.onmouseleave = () => _0x5129ed.style.background = "transparent";
  const _0x4deacd = document.createElement("div");
  _0x4deacd.style.cssText = "flex: 1; min-width: 0; margin-right: 8px;";
  _0x4deacd.innerHTML = "\n    <div style=\"color: #e0e0e0; font-size: 12px; white-space: nowrap;\n      overflow: hidden; text-overflow: ellipsis;\" title=\"" + _0x5eaee2 + "\">\n      1. " + _0xe47aad + "\n    </div>\n    <div style=\"color: #64748b; font-size: 11px;\">" + _0x4fa468 + "</div>\n  ";
  const _0x1ad831 = document.createElement("button");
  _0x1ad831.textContent = "⬇";
  _0x1ad831.title = "Download this file";
  _0x1ad831.style.cssText = "\n    background: #2563eb; color: #fff; border: none; border-radius: 6px;\n    padding: 4px 10px; font-size: 13px; cursor: pointer; flex-shrink: 0;\n  ";
  _0x1ad831.onmouseenter = () => _0x1ad831.style.background = "#1d4ed8";
  _0x1ad831.onmouseleave = () => _0x1ad831.style.background = "#2563eb";
  _0x1ad831.onclick = () => {
    const _0x9eb28a = _0x5eaee2.split("/").pop().split("?")[0] || "download";
    const _0x49c6d7 = a0_0x59255a.find(_0x214302 => _0x214302.id === a0_0x2dacd0);
    a0_0x171e60(_0x5eaee2, _0x9eb28a.length > 60 ? _0x9eb28a.slice(0, 60) : _0x9eb28a, _0x49c6d7 ? _0x49c6d7.url : "");
  };
  _0x5129ed.appendChild(_0x4deacd);
  _0x5129ed.appendChild(_0x1ad831);
  _0x32e220.appendChild(_0x5129ed);
}
function a0_0x36835e() {
  a0_0x19141e();
  a0_0x194d6a.style.display = "block";
}
function a0_0x59d2a3() {
  a0_0x194d6a.style.display = "none";
}
document.getElementById("popup-close").onclick = a0_0x59d2a3;
document.getElementById("popup-dl-all").onclick = () => {
  if (a0_0x17056d.length === 0) {
    return;
  }
  let _0x10c225 = a0_0x17056d[a0_0x17056d.length - 1];
  for (const _0x5b2b6d of a0_0x17056d) {
    const _0x33fb39 = _0x5b2b6d.toLowerCase();
    if (_0x33fb39.includes(".m3u8") || _0x33fb39.includes(".mpd")) {
      _0x10c225 = _0x5b2b6d;
      break;
    }
  }
  const _0x4a14b8 = _0x10c225.split("/").pop().split("?")[0] || "download";
  const _0x44ceae = a0_0x59255a.find(_0x311723 => _0x311723.id === a0_0x2dacd0);
  a0_0x171e60(_0x10c225, _0x4a14b8.length > 60 ? _0x4a14b8.slice(0, 60) : _0x4a14b8, _0x44ceae ? _0x44ceae.url : "");
  const _0x26b212 = document.getElementById("popup-dl-all");
  _0x26b212.textContent = "Downloading...";
  _0x26b212.style.background = "#666";
  setTimeout(() => {
    _0x26b212.textContent = "Download all";
    _0x26b212.style.background = "#22c55e";
  }, 3000);
};
if (window.veloce && window.veloce.onOpenUrlInTab) {
  window.veloce.onOpenUrlInTab(function (_0x5c7ae2) {
    a0_0xb19e16(_0x5c7ae2);
  });
}
if (window.veloce && window.veloce.onCefLaunchError) {
  window.veloce.onCefLaunchError(function (_0x22fab2) {
    if (_0x22fab2) {
      alert(_0x22fab2);
    }
  });
}
if (window.veloce) {
  window.veloce.onMediaDetected(_0x50e648 => {
    if (!a0_0x4aadb4) {
      return;
    }
    if (document.getElementById("smart-dl-popup") && document.getElementById("smart-dl-popup").style.display !== "none") {
      return;
    }
    const _0x591235 = a0_0x59255a.find(_0x20871d => _0x20871d.id === a0_0x2dacd0);
    const _0x37449e = _0x591235 ? (_0x591235.url || "").toLowerCase() : "";
    const _0x38cd5e = ["youtube.com/watch", "youtu.be/", "tiktok.com/@", "instagram.com/reel", "instagram.com/p/", "twitter.com/", "x.com/", "vimeo.com/", "twitch.tv/", "dailymotion.com/video", "reddit.com/r/"];
    for (const _0xa5483c of _0x38cd5e) {
      if (_0x37449e.indexOf(_0xa5483c) !== -1) {
        return;
      }
    }
    const _0x51c18a = _0x50e648.url;
    if (!a0_0x17056d.includes(_0x51c18a)) {
      a0_0x17056d.push(_0x51c18a);
      a0_0x31e80d.textContent = "Media detected: " + _0x50e648.pattern + " — " + _0x51c18a.slice(0, 80);
      a0_0x4f149d.classList.add("media-detected");
      a0_0x36835e();
    }
  });
}
const a0_0x228887 = [{
  site: "YouTube",
  test: _0x1b1f84 => /youtube\.com\/watch\?/.test(_0x1b1f84) || /youtu\.be\/[a-zA-Z0-9_-]+/.test(_0x1b1f84)
}, {
  site: "TikTok",
  test: _0x206508 => /tiktok\.com\/@[^/]+\/video\//.test(_0x206508)
}, {
  site: "Instagram",
  test: _0x4daf08 => /instagram\.com\/(reel|p)\//.test(_0x4daf08)
}, {
  site: "Twitter",
  test: _0x49b452 => /(twitter\.com|x\.com)\/[^/]+\/status\//.test(_0x49b452)
}, {
  site: "Reddit",
  test: _0x2c0b64 => /reddit\.com\/r\/[^/]+\/comments\//.test(_0x2c0b64)
}, {
  site: "Facebook",
  test: _0x13cbcd => /facebook\.com\/.*(\/videos\/|\/watch\/)/.test(_0x13cbcd)
}, {
  site: "Vimeo",
  test: _0x47564a => /vimeo\.com\/\d+/.test(_0x47564a)
}, {
  site: "Twitch",
  test: _0x5e3a3a => /twitch\.tv\/videos\/\d+/.test(_0x5e3a3a) || /clips\.twitch\.tv\//.test(_0x5e3a3a)
}, {
  site: "Dailymotion",
  test: _0x40ac5d => /dailymotion\.com\/video\//.test(_0x40ac5d)
}, {
  site: "SoundCloud",
  test: _0x5c506d => /soundcloud\.com\/[^/]+\/[^/]+/.test(_0x5c506d) && !/soundcloud\.com\/(you|discover|stream|search)/.test(_0x5c506d)
}];
let a0_0x320cd6 = "";
let a0_0x3d1685 = false;
let a0_0x2ac91c = null;
function a0_0x3f05b9(_0xd15306) {
  const _0x4822fc = _0xd15306.toLowerCase();
  for (const _0xd55324 of a0_0x228887) {
    if (_0xd55324.test(_0x4822fc)) {
      return _0xd55324.site;
    }
  }
  return null;
}
function a0_0x7dc2(_0x8afd96) {
  if (!_0x8afd96 || !window.veloce || !window.veloce.extractVideoInfo) {
    return;
  }
  if (!a0_0x4aadb4) {
    return;
  }
  const _0xdc29e8 = a0_0x3f05b9(_0x8afd96);
  if (!_0xdc29e8) {
    a0_0x4736a4();
    return;
  }
  const _0x1f5282 = _0x8afd96.split("&list=")[0].split("&index=")[0];
  if (_0x1f5282 === a0_0x320cd6) {
    return;
  }
  a0_0x320cd6 = _0x1f5282;
  if (a0_0x3d1685) {
    return;
  }
  a0_0x3d1685 = true;
  a0_0x31e80d.textContent = "🔍 Detecting video on " + _0xdc29e8 + "...";
  a0_0x4f149d.classList.add("media-detected");
  window.veloce.extractVideoInfo(_0x1f5282).then(function (_0x11c049) {
    a0_0x3d1685 = false;
    if (!_0x11c049 || !_0x11c049.ok) {
      a0_0x31e80d.textContent = "Detection failed: " + (_0x11c049 ? _0x11c049.error : "unknown").slice(0, 60);
      return;
    }
    a0_0x2ac91c = _0x11c049;
    a0_0x31e80d.textContent = "✓ Video found: " + _0x11c049.title.slice(0, 60);
    a0_0x55f4fe(_0x11c049);
  }).catch(function (_0x5b9b92) {
    a0_0x3d1685 = false;
    a0_0x31e80d.textContent = "Detection error: " + _0x5b9b92.message;
  });
}
const a0_0x30dc81 = document.createElement("div");
a0_0x30dc81.id = "smart-dl-popup";
a0_0x30dc81.style.cssText = "\n  display: none;\n  position: absolute;\n  top: 8px;\n  right: 12px;\n  z-index: 99999;\n  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);\n  border: 2px solid #7c3aed;\n  border-radius: 14px;\n  padding: 0;\n  width: 420px;\n  box-shadow: 0 12px 40px rgba(124,58,237,.4), 0 0 0 1px rgba(124,58,237,.2);\n  font-family: 'Segoe UI', Arial, sans-serif;\n  overflow: hidden;\n";
a0_0x26601e.appendChild(a0_0x30dc81);
function a0_0x55f4fe(_0x253251) {
  a0_0x59d2a3();
  const _0x1df69d = _0x253251.durationStr ? " • " + _0x253251.durationStr : "";
  const _0x21e7c9 = _0x253251.uploader ? " • " + _0x253251.uploader : "";
  let _0x4772e8 = "";
  if (_0x253251.formats && _0x253251.formats.length > 0) {
    for (let _0x3de90d = 0; _0x3de90d < _0x253251.formats.length; _0x3de90d++) {
      const _0xa03d23 = _0x253251.formats[_0x3de90d];
      const _0x2aa3d5 = _0x3de90d === 0;
      const _0x387d03 = _0xa03d23.filesizeStr ? " (" + _0xa03d23.filesizeStr + ")" : "";
      _0x4772e8 += "\n        <div class=\"smart-fmt-row\" data-format-id=\"" + _0xa03d23.label + "\" data-audio=\"false\"\n             style=\"display: flex; align-items: center; gap: 8px; padding: 5px 14px;\n                    cursor: pointer; transition: background .15s;\n                    " + (_0x2aa3d5 ? "background: rgba(124,58,237,.15);" : "") + "\"\n             onmouseenter=\"this.style.background='rgba(124,58,237,.2)'\"\n             onmouseleave=\"this.style.background='" + (_0x2aa3d5 ? "rgba(124,58,237,.15)" : "transparent") + "'\">\n          <span style=\"color: #a78bfa; font-size: 13px; font-weight: bold; min-width: 65px;\">🎬 " + _0xa03d23.label + "</span>\n          <span style=\"color: #64748b; font-size: 11px; flex: 1;\">" + _0xa03d23.ext.toUpperCase() + _0x387d03 + "</span>\n          <button class=\"smart-dl-btn\" style=\"\n            background: #7c3aed; color: #fff; border: none; border-radius: 6px;\n            padding: 3px 10px; font-size: 11px; cursor: pointer; font-weight: bold;\n          \">⬇ MP4</button>\n        </div>";
    }
  }
  _0x4772e8 += "\n    <div style=\"height: 1px; background: #334155; margin: 2px 14px;\"></div>\n    <div class=\"smart-fmt-row\" data-format-id=\"audio\" data-audio=\"true\"\n         style=\"display: flex; align-items: center; gap: 8px; padding: 5px 14px;\n                cursor: pointer; transition: background .15s;\"\n         onmouseenter=\"this.style.background='rgba(34,197,94,.15)'\"\n         onmouseleave=\"this.style.background='transparent'\">\n      <span style=\"color: #22c55e; font-size: 13px; font-weight: bold; min-width: 65px;\">🎵 Audio</span>\n      <span style=\"color: #64748b; font-size: 11px; flex: 1;\">MP3 (Best quality)</span>\n      <button class=\"smart-dl-btn\" data-audio=\"true\" style=\"\n        background: #22c55e; color: #fff; border: none; border-radius: 6px;\n        padding: 3px 10px; font-size: 11px; cursor: pointer; font-weight: bold;\n      \">⬇ MP3</button>\n    </div>";
  a0_0x30dc81.innerHTML = "\n    <div style=\"\n      display: flex; justify-content: space-between; align-items: center;\n      padding: 10px 14px;\n      background: linear-gradient(135deg, #7c3aed, #6d28d9);\n    \">\n      <span style=\"color: #fff; font-weight: bold; font-size: 13px;\">\n        ⚡ VELOCE Smart Download\n      </span>\n      <button id=\"smart-popup-close\" style=\"\n        background: rgba(255,255,255,.2); color: #fff; border: none;\n        border-radius: 50%; width: 22px; height: 22px; font-size: 14px;\n        cursor: pointer; line-height: 1;\n      \">×</button>\n    </div>\n    <div style=\"padding: 10px 14px; display: flex; gap: 10px; align-items: flex-start;\n                border-bottom: 1px solid #334155;\">\n      " + (_0x253251.thumbnail ? "<img src=\"" + _0x253251.thumbnail + "\" style=\"width: 120px; height: 68px; object-fit: cover; border-radius: 6px; flex-shrink: 0;\">" : "") + "\n      <div style=\"flex: 1; min-width: 0;\">\n        <div style=\"color: #f1f5f9; font-size: 12px; font-weight: bold;\n                    overflow: hidden; text-overflow: ellipsis; display: -webkit-box;\n                    -webkit-line-clamp: 2; -webkit-box-orient: vertical;\">\n          " + _0x253251.title + "\n        </div>\n        <div style=\"color: #64748b; font-size: 10px; margin-top: 3px;\">\n          " + (_0x253251.extractor || "") + _0x21e7c9 + _0x1df69d + "\n        </div>\n      </div>\n    </div>\n    <div id=\"smart-format-list\" style=\"max-height: 180px; overflow-y: auto; padding: 4px 0;\">\n      " + _0x4772e8 + "\n    </div>\n  ";
  a0_0x30dc81.style.display = "block";
  document.getElementById("smart-popup-close").onclick = a0_0x4736a4;
  a0_0x30dc81.querySelectorAll(".smart-dl-btn").forEach(function (_0x5cc3ab) {
    _0x5cc3ab.onclick = function (_0x2cfdf2) {
      _0x2cfdf2.stopPropagation();
      const _0x25c985 = _0x5cc3ab.closest(".smart-fmt-row");
      const _0x51151f = _0x25c985 ? _0x25c985.getAttribute("data-format-id") : "best";
      const _0x438266 = _0x25c985 ? _0x25c985.getAttribute("data-audio") === "true" : false;
      a0_0x30dc81.querySelectorAll(".smart-dl-btn").forEach(function (_0x382b05) {
        _0x382b05.disabled = true;
        _0x382b05.style.opacity = "0.5";
      });
      _0x5cc3ab.textContent = "⏳...";
      const _0x34e6f0 = a0_0x59255a.find(_0x353075 => _0x353075.id === a0_0x2dacd0);
      const _0xcad0f1 = _0x34e6f0 ? _0x34e6f0.url : _0x253251.pageUrl;
      const _0x130f02 = a0_0x2e0161.length;
      const _0x4d9563 = _0x253251.title.replace(/[<>:"/\\|?*]/g, "").slice(0, 60);
      var _0x35c403 = {
        filename: _0x4d9563,
        url: _0xcad0f1,
        status: "Downloading",
        progress: "0%",
        speed: "—",
        eta: "—",
        boosters: _0x438266 ? "1" : "1",
        size: "—",
        _internalName: ""
      };
      a0_0x2e0161.push(_0x35c403);
      a0_0x2e56ab();
      a0_0x31e80d.textContent = "Downloading: " + _0x4d9563;
      var _0x35e963 = "ytdlp_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
      a0_0x2e0161[_0x130f02]._ytDlpId = _0x35e963;
      var _0xcc9de7 = document.createElement("div");
      _0xcc9de7.id = "smart-progress-" + _0x35e963;
      _0xcc9de7.style.cssText = "padding: 8px 14px; border-top: 1px solid #334155; background: rgba(0,0,0,.2)";
      _0xcc9de7.innerHTML = "<div style=\"display:flex;justify-content:space-between;align-items:center;gap:8px;\"><span id=\"sp-status-" + _0x35e963 + "\" style=\"color:#94a3b8;font-size:11px;\">Starting...</span><button id=\"sp-cancel-" + _0x35e963 + "\" style=\"background:#ef4444;color:#fff;border:none;border-radius:4px;padding:3px 10px;font-size:11px;cursor:pointer;font-weight:bold;\">✕ Cancel</button></div><div style=\"margin-top:4px;height:3px;background:#334155;border-radius:2px;overflow:hidden;\"><div id=\"sp-bar-" + _0x35e963 + "\" style=\"height:100%;width:0%;background:linear-gradient(90deg,#22c55e,#7c3aed);border-radius:2px;transition:width .3s;\"></div></div>";
      var _0x44d708 = a0_0x30dc81.querySelector("#smart-format-list");
      if (_0x44d708 && _0x44d708.parentNode) {
        _0x44d708.parentNode.insertBefore(_0xcc9de7, _0x44d708.nextSibling);
      } else {
        a0_0x30dc81.appendChild(_0xcc9de7);
      }
      document.getElementById("sp-cancel-" + _0x35e963).onclick = function () {
        window.veloce.cancelFormat(_0x35e963).catch(function () {});
        document.getElementById("sp-status-" + _0x35e963).textContent = "Cancelled";
        document.getElementById("sp-cancel-" + _0x35e963).disabled = true;
        document.getElementById("sp-cancel-" + _0x35e963).style.opacity = "0.5";
        a0_0x31e80d.textContent = "Cancelled: " + _0x4d9563;
        a0_0x2e0161[_0x130f02].status = "Cancelled";
        a0_0x2e56ab();
        setTimeout(a0_0x4736a4, 2000);
      };
      window.veloce.downloadFormat(_0xcad0f1, _0x51151f, _0x438266, _0x253251.title, _0x35e963).then(function (_0x180252) {
        a0_0x2e0161[_0x130f02].status = "Complete";
        a0_0x2e0161[_0x130f02].progress = "100%";
        if (_0x180252 && _0x180252.size) {
          a0_0x2e0161[_0x130f02].size = _0x180252.size;
        }
        if (_0x180252 && _0x180252.path) {
          a0_0x2e0161[_0x130f02].path = _0x180252.path;
        }
        if (_0x180252 && _0x180252.filename) {
          a0_0x2e0161[_0x130f02]._internalName = _0x180252.filename;
        }
        a0_0x31e80d.textContent = "✓ Complete: " + _0x4d9563;
        var _0x227bfe = document.getElementById("sp-bar-" + _0x35e963);
        if (_0x227bfe) {
          _0x227bfe.style.width = "100%";
        }
        var _0x11edcf = document.getElementById("sp-status-" + _0x35e963);
        if (_0x11edcf) {
          _0x11edcf.textContent = "Complete ✓";
        }
        var _0x347bd0 = document.getElementById("sp-cancel-" + _0x35e963);
        if (_0x347bd0) {
          _0x347bd0.disabled = true;
          _0x347bd0.style.opacity = "0.3";
        }
        a0_0x2e56ab();
        setTimeout(a0_0x4736a4, 2000);
      }).catch(function (_0x24d0be) {
        if (a0_0x2e0161[_0x130f02].status !== "Cancelled") {
          a0_0x2e0161[_0x130f02].status = "Error";
          a0_0x31e80d.textContent = "✗ Failed: " + _0x24d0be.message;
          var _0x2545d4 = document.getElementById("sp-status-" + _0x35e963);
          if (_0x2545d4) {
            _0x2545d4.textContent = "Error: " + _0x24d0be.message.slice(0, 40);
          }
        }
        a0_0x2e56ab();
        a0_0x30dc81.querySelectorAll(".smart-dl-btn").forEach(function (_0x466240) {
          _0x466240.disabled = false;
          _0x466240.style.opacity = "1";
          _0x466240.textContent = _0x466240.getAttribute("data-audio") === "true" ? "⬇ MP3" : "⬇ MP4";
        });
      });
    };
  });
}
function a0_0x4736a4() {
  a0_0x30dc81.style.display = "none";
  a0_0x2ac91c = null;
}
function a0_0x4de2d2() {
  const _0x5f27f1 = a0_0x59255a.find(_0x4a1fc7 => _0x4a1fc7.id === a0_0x2dacd0);
  if (!_0x5f27f1) {
    return;
  }
  const _0x1715c4 = _0x5f27f1.url;
  const _0x272ad9 = ["youtube.com", "youtu.be", "vimeo.com", "dailymotion.com", "twitch.tv", "twitter.com", "x.com", "tiktok.com", "instagram.com", "facebook.com", "reddit.com"];
  const _0x3b8a61 = _0x272ad9.some(_0x257379 => _0x1715c4.toLowerCase().includes(_0x257379));
  let _0x3539c4;
  let _0x350421;
  if (_0x3b8a61) {
    _0x3539c4 = _0x1715c4;
    _0x350421 = "video";
  } else if (a0_0x17056d.length > 0) {
    let _0x49d63e = a0_0x17056d[a0_0x17056d.length - 1];
    for (const _0x156d73 of a0_0x17056d) {
      if (_0x156d73.toLowerCase().includes(".m3u8") || _0x156d73.toLowerCase().includes(".mpd")) {
        _0x49d63e = _0x156d73;
        break;
      }
    }
    _0x3539c4 = _0x49d63e;
    _0x350421 = _0x3539c4.split("/").pop().split("?")[0] || "download";
  } else {
    _0x3539c4 = _0x1715c4;
    _0x350421 = _0x3539c4.split("/").pop().split("?")[0] || "download";
  }
  if (_0x350421.length > 60) {
    _0x350421 = _0x350421.slice(0, 60);
  }
  a0_0x171e60(_0x3539c4, _0x350421, _0x1715c4);
}
let a0_0x1b6244 = new Set();
function a0_0x171e60(_0x4aa4d1, _0x29d8c4, _0x29cedb) {
  const _0x1dc561 = _0x4aa4d1.split("?")[0];
  if (a0_0x1b6244.has(_0x1dc561)) {
    a0_0x31e80d.textContent = "Already downloading this file";
    return;
  }
  const _0x261483 = a0_0x59255a.find(_0x4b2724 => _0x4b2724.id === a0_0x2dacd0);
  const _0x359bc9 = _0x261483 ? _0x261483.title || "" : "";
  const _0x45d43d = _0x359bc9 && _0x359bc9.length > 3 && (_0x29d8c4 === "download" || _0x29d8c4.includes("master") || _0x29d8c4.includes("index")) ? _0x359bc9.replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, "_").slice(0, 60) : _0x29d8c4;
  var _0x41d7ee = {
    filename: _0x45d43d,
    url: _0x4aa4d1,
    totalBytes: 0
  };
  a0_0x3138d1(_0x41d7ee, function () {
    a0_0x1b6244.add(_0x1dc561);
    const _0x37172d = a0_0x2e0161.length;
    var _0x9314e9 = {
      filename: _0x45d43d,
      url: _0x4aa4d1,
      status: "Downloading",
      progress: "0%",
      speed: "—",
      eta: "—",
      boosters: "—",
      size: "—"
    };
    a0_0x2e0161.push(_0x9314e9);
    a0_0x2e56ab();
    a0_0x31e80d.textContent = "Downloading: " + _0x45d43d;
    a0_0xdd0b39 = _0x45d43d;
    window.veloce.startDownload(_0x4aa4d1, _0x29d8c4, _0x29cedb, _0x359bc9).then(function (_0x222410) {
      if (_0x222410 && _0x222410.duplicate) {
        a0_0x2e0161.splice(_0x37172d, 1);
        a0_0x31e80d.textContent = "Already downloading this file";
        const _0x4d45d1 = document.getElementById("veloce-dl-dialog");
        if (_0x4d45d1) {
          _0x4d45d1.remove();
        }
        a0_0xdd0b39 = null;
      } else if (_0x222410 && _0x222410.cancelled) {
        a0_0x2e0161[_0x37172d].status = "Cancelled";
        a0_0x2e0161[_0x37172d].speed = "—";
      } else {
        a0_0x2e0161[_0x37172d].status = "Complete";
        a0_0x2e0161[_0x37172d].progress = "100%";
        if (_0x222410 && _0x222410.size) {
          a0_0x2e0161[_0x37172d].size = _0x222410.size;
        }
        if (_0x222410 && _0x222410.path) {
          a0_0x2e0161[_0x37172d].path = _0x222410.path;
        }
        a0_0x31e80d.textContent = "Complete: " + _0x45d43d + (_0x222410 && _0x222410.size ? " (" + _0x222410.size + ")" : "");
      }
      a0_0x1b6244.delete(_0x1dc561);
      a0_0x2e56ab();
    }).catch(function (_0x13bec9) {
      a0_0x2e0161[_0x37172d].status = "Error";
      a0_0x31e80d.textContent = "Failed: " + _0x45d43d + " — " + _0x13bec9.message;
      const _0x42ea0e = document.getElementById("veloce-dl-dialog");
      if (_0x42ea0e) {
        _0x42ea0e.remove();
      }
      a0_0xdd0b39 = null;
      a0_0x1b6244.delete(_0x1dc561);
      a0_0x2e56ab();
    });
  }, function () {
    a0_0x31e80d.textContent = "Download cancelled";
  });
}
if (window.veloce && window.veloce.onDownloadProgress) {
  window.veloce.onDownloadProgress(_0x3056f2 => {
    function _0x11a9ec(_0x138d93) {
      return _0x3056f2.id && _0x138d93.id === _0x3056f2.id || _0x138d93._internalName && _0x138d93._internalName === _0x3056f2.filename || _0x138d93.filename === _0x3056f2.filename || _0x3056f2.filename && _0x3056f2.filename.indexOf(_0x138d93.filename) !== -1 || _0x138d93.filename && _0x3056f2.filename && _0x138d93.filename.indexOf(_0x3056f2.filename.slice(0, 20)) !== -1;
    }
    let _0x1ce5f4 = a0_0x2e0161.find(_0xf90c8a => _0xf90c8a.status !== "Cancelled" && _0xf90c8a.status !== "Paused" && _0x11a9ec(_0xf90c8a));
    if (!_0x1ce5f4 && _0x3056f2.filename) {
      _0x1ce5f4 = a0_0x2e0161.find(_0x333964 => _0x333964._internalName && _0x333964._internalName === _0x3056f2.filename);
    }
    if (!_0x1ce5f4 && _0x3056f2.filename) {
      _0x1ce5f4 = a0_0x2e0161.find(_0x425683 => _0x425683._intercepted || _0x425683.status === "Downloading" && !_0x425683._internalName);
    }
    if (_0x1ce5f4) {
      if (_0x3056f2.filename && !_0x1ce5f4._internalName) {
        _0x1ce5f4._internalName = _0x3056f2.filename;
      }
      if (_0x3056f2.percent !== undefined) {
        _0x1ce5f4.progress = _0x3056f2.percent + "%";
      }
      if (_0x3056f2.speed) {
        _0x1ce5f4.speed = _0x3056f2.speed;
      }
      if (_0x3056f2.eta) {
        _0x1ce5f4.eta = _0x3056f2.eta;
      }
      if (_0x3056f2.tunnels) {
        _0x1ce5f4.boosters = _0x3056f2.tunnels;
      }
      if (_0x3056f2.size) {
        _0x1ce5f4.size = _0x3056f2.size;
      }
      if (_0x3056f2.status && _0x1ce5f4.status !== "Paused" && _0x1ce5f4.status !== "Cancelled") {
        _0x1ce5f4.status = _0x3056f2.status;
      }
      if (_0x1ce5f4.status === "Paused" || _0x1ce5f4.status === "Cancelled") {
        return;
      }
      if (_0x3056f2.received) {
        _0x1ce5f4.received = _0x3056f2.received;
      }
      if (_0x3056f2.tunnelSpeeds) {
        _0x1ce5f4.tunnelSpeeds = _0x3056f2.tunnelSpeeds;
      }
      if (_0x3056f2.filename) {
        _0x1ce5f4._internalName = _0x3056f2.filename;
      }
      if (_0x3056f2.output) {
        a0_0x31e80d.textContent = _0x3056f2.output.trim();
      }
      a0_0x2e56ab();
      if (_0x1ce5f4._ytDlpId) {
        var _0x49b37c = document.getElementById("sp-bar-" + _0x1ce5f4._ytDlpId);
        var _0x4a1921 = document.getElementById("sp-status-" + _0x1ce5f4._ytDlpId);
        if (_0x49b37c && _0x3056f2.percent !== undefined) {
          _0x49b37c.style.width = _0x3056f2.percent + "%";
        }
        if (_0x4a1921) {
          var _0x1b44bc = _0x3056f2.percent !== undefined ? Math.round(_0x3056f2.percent) + "%" : "";
          if (_0x3056f2.speed) {
            _0x1b44bc += " · " + _0x3056f2.speed;
          }
          if (_0x3056f2.eta) {
            _0x1b44bc += " · " + _0x3056f2.eta + " left";
          }
          _0x4a1921.textContent = _0x1b44bc || _0x4a1921.textContent;
        }
      }
      a0_0x3fd0d6(_0x1ce5f4);
    }
  });
}
let a0_0xdd0b39 = null;
let a0_0x530d1b = "info";
let a0_0x4b3135 = false;
function a0_0xfb0148(_0x180dcd) {
  if (!_0x180dcd || _0x180dcd <= 0) {
    return "Unknown";
  }
  if (_0x180dcd > 1073741824) {
    return (_0x180dcd / 1073741824).toFixed(2) + " GB";
  }
  if (_0x180dcd > 1048576) {
    return (_0x180dcd / 1048576).toFixed(1) + " MB";
  }
  if (_0x180dcd > 1024) {
    return (_0x180dcd / 1024).toFixed(0) + " KB";
  }
  return _0x180dcd + " B";
}
function a0_0x3138d1(_0x9f9155, _0x163dce, _0x389958) {
  a0_0xdd0b39 = _0x9f9155.id || _0x9f9155.filename;
  a0_0x530d1b = "info";
  window._dlDialogOnStart = _0x163dce;
  window._dlDialogOnCancel = _0x389958;
  window._dlDialogData = _0x9f9155;
  if (window.veloce && window.veloce.openDlDialog) {
    window.veloce.openDlDialog({
      filename: _0x9f9155.filename || "—",
      url: _0x9f9155.url || "",
      size: _0x9f9155.totalBytes > 0 ? a0_0xfb0148(_0x9f9155.totalBytes) : "Checking...",
      resumable: _0x9f9155.resumable !== false
    });
  }
  if (_0x9f9155.url && window.veloce && window.veloce.checkSafety) {
    window.veloce.checkSafety(_0x9f9155.url, _0x9f9155.filename || "", _0x9f9155.totalBytes || 0).then(function (_0x4780d4) {
      if (window.veloce.updateDlDialogSafety) {
        var _0x474b3f = (_0x4780d4.checks || []).map(function (_0x36c120) {
          var _0x5a9e71 = {
            pass: _0x36c120.status !== "warning",
            label: _0x36c120.label + ": " + _0x36c120.detail
          };
          return _0x5a9e71;
        });
        var _0x5720c2 = {
          done: true,
          checks: _0x474b3f,
          overall: _0x4780d4.overallLabel ? {
            safe: _0x4780d4.overall !== "warning",
            text: _0x4780d4.overallLabel
          } : null
        };
        window.veloce.updateDlDialogSafety(_0x5720c2);
      }
    }).catch(function () {});
  }
  if ((!_0x9f9155.totalBytes || _0x9f9155.totalBytes <= 0) && _0x9f9155.url && window.veloce) {
    var _0x2ed038 = _0x9f9155.url.toLowerCase();
    var _0x2d2981 = _0x2ed038.indexOf(".m3u8") !== -1 || _0x2ed038.indexOf("/hls/") !== -1;
    if (_0x2d2981 && window.veloce.checkHlsSize) {
      window.veloce.checkHlsSize(_0x9f9155.url).then(function (_0x272fb0) {
        setTimeout(function () {
          if (_0x272fb0 && _0x272fb0.size > 0) {
            window.veloce.updateDlDialog({
              size: "~" + a0_0xfb0148(_0x272fb0.size) + " (" + _0x272fb0.segments + " segments)"
            });
          } else if (_0x272fb0 && _0x272fb0.segments > 0) {
            var _0x514ec3 = {
              size: _0x272fb0.segments + " segments"
            };
            window.veloce.updateDlDialog(_0x514ec3);
          } else {
            window.veloce.updateDlDialog({
              size: "Unknown (Stream protected)"
            });
          }
        }, 1500);
      }).catch(function () {
        setTimeout(function () {
          window.veloce.updateDlDialog({
            size: "Unknown"
          });
        }, 1500);
      });
    } else if (window.veloce.checkSize) {
      window.veloce.checkSize(_0x9f9155.url).then(function (_0x31f49b) {
        setTimeout(function () {
          if (_0x31f49b && _0x31f49b.size > 0) {
            window.veloce.updateDlDialog({
              size: a0_0xfb0148(_0x31f49b.size),
              resumable: _0x31f49b.resumable
            });
          } else {
            window.veloce.updateDlDialog({
              size: "Unknown"
            });
          }
        }, 1500);
      }).catch(function () {
        setTimeout(function () {
          window.veloce.updateDlDialog({
            size: "Unknown"
          });
        }, 1500);
      });
    }
  }
}
if (window.veloce && window.veloce.onDlDialogAction) {
  window.veloce.onDlDialogAction(function (_0x88c059) {
    if (_0x88c059 === "start") {
      a0_0x530d1b = "progress";
      a0_0x4b3135 = false;
      if (window._dlDialogOnStart) {
        window._dlDialogOnStart();
      }
    } else if (_0x88c059 === "cancel") {
      if (a0_0x530d1b === "progress") {
        var _0x3d2931 = a0_0xdd0b39;
        if (_0x3d2931 && window.veloce) {
          window.veloce.pauseDownload(_0x3d2931 + ":cancel");
          var _0x4bd147 = a0_0x2e0161.find(function (_0x14d544) {
            return _0x14d544.status !== "Cancelled" && (_0x14d544.id === _0x3d2931 || _0x14d544.filename === _0x3d2931);
          });
          if (!_0x4bd147) {
            _0x4bd147 = a0_0x2e0161.find(function (_0x3c129f) {
              return _0x3c129f.id === _0x3d2931 || _0x3c129f.filename === _0x3d2931;
            });
          }
          if (_0x4bd147 && _0x4bd147._internalName) {
            window.veloce.pauseDownload(_0x4bd147._internalName + ":cancel");
          }
          if (_0x4bd147) {
            _0x4bd147.status = "Cancelled";
            _0x4bd147.speed = "—";
            a0_0x2e56ab();
          }
        }
        a0_0x31e80d.textContent = "Download stopped";
      }
      a0_0xdd0b39 = null;
      if (window._dlDialogOnCancel) {
        window._dlDialogOnCancel();
      }
      if (window.veloce.closeDlDialog) {
        window.veloce.closeDlDialog();
      }
    } else if (_0x88c059 === "stop") {
      var _0x3d2931 = a0_0xdd0b39;
      if (_0x3d2931 && window.veloce) {
        window.veloce.pauseDownload(_0x3d2931 + ":cancel");
        if (typeof _0x3d2931 === "string") {
          var _0x12695f = _0x3d2931.replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, "_").slice(0, 60);
          if (_0x12695f !== _0x3d2931) {
            window.veloce.pauseDownload(_0x12695f + ":cancel");
          }
        }
        var _0x4bd147 = a0_0x2e0161.find(function (_0x504691) {
          return _0x504691.status !== "Cancelled" && (_0x504691.id === _0x3d2931 || _0x504691.filename === _0x3d2931);
        });
        if (!_0x4bd147) {
          _0x4bd147 = a0_0x2e0161.find(function (_0x24a94f) {
            return _0x24a94f.id === _0x3d2931 || _0x24a94f.filename === _0x3d2931;
          });
        }
        if (_0x4bd147 && _0x4bd147._internalName) {
          window.veloce.pauseDownload(_0x4bd147._internalName + ":cancel");
        }
        if (_0x4bd147) {
          _0x4bd147.status = "Cancelled";
          _0x4bd147.speed = "—";
          a0_0x2e56ab();
        }
      }
      a0_0x530d1b = "done";
      a0_0x31e80d.textContent = "Download stopped: " + (window._dlDialogData ? window._dlDialogData.filename : "");
    }
  });
}
function a0_0x3fd0d6(_0x3abd2a) {
  if (!a0_0xdd0b39 || a0_0x530d1b !== "progress") {
    return;
  }
  const _0x49105b = _0x3abd2a.id === a0_0xdd0b39 || _0x3abd2a.filename === a0_0xdd0b39 || _0x3abd2a.filename && typeof a0_0xdd0b39 === "string" && _0x3abd2a.filename.indexOf(a0_0xdd0b39.slice(0, 15)) !== -1 || typeof a0_0xdd0b39 === "string" && _0x3abd2a.filename && a0_0xdd0b39.indexOf(_0x3abd2a.filename.slice(0, 15)) !== -1 || _0x3abd2a.status === "Downloading";
  if (!_0x49105b) {
    return;
  }
  if (window.veloce && window.veloce.updateDlDialog) {
    window.veloce.updateDlDialog({
      status: _0x3abd2a.status === "Downloading" ? "Receiving data..." : _0x3abd2a.status,
      received: _0x3abd2a.received ? _0x3abd2a.received + (_0x3abd2a.progress ? " (" + _0x3abd2a.progress + ")" : "") : undefined,
      speed: _0x3abd2a.speed,
      eta: _0x3abd2a.eta,
      percent: _0x3abd2a.progress ? parseInt(_0x3abd2a.progress) || 0 : 0,
      tunnelSpeeds: _0x3abd2a.tunnelSpeeds || null,
      size: _0x3abd2a.size
    });
  }
}
var a0_0x125e44 = 20;
var a0_0x529de3 = 0;
function a0_0x18acca(_0x555713) {
  var _0x133e9a = document.getElementById("tunnel-dashboard");
  if (!_0x133e9a) {
    return;
  }
  _0x555713 = _0x555713 || 16;
  if (a0_0x4b3135 && a0_0x529de3 === _0x555713) {
    return;
  }
  a0_0x529de3 = _0x555713;
  var _0x343a0a = "<div class=\"td-title\">VELOCE BOOSTER ENGINE</div>";
  for (var _0x2ed1a0 = 0; _0x2ed1a0 < _0x555713; _0x2ed1a0++) {
    _0x343a0a += "<div class=\"td-row\" id=\"td-row-" + _0x2ed1a0 + "\">";
    _0x343a0a += "<span class=\"td-label\">B" + (_0x2ed1a0 + 1) + "</span>";
    _0x343a0a += "<div class=\"td-bar\">";
    for (var _0x567b13 = 0; _0x567b13 < a0_0x125e44; _0x567b13++) {
      _0x343a0a += "<div class=\"td-block idle\" id=\"td-" + _0x2ed1a0 + "-" + _0x567b13 + "\"></div>";
    }
    _0x343a0a += "</div>";
    _0x343a0a += "<span class=\"td-speed\" id=\"td-spd-" + _0x2ed1a0 + "\">—</span>";
    _0x343a0a += "</div>";
  }
  _0x343a0a += "<div class=\"td-summary\">";
  _0x343a0a += "<span>Active: <span class=\"td-summary-val\" id=\"td-active\">0</span></span>";
  _0x343a0a += "<span>Online: <span class=\"td-summary-val\" id=\"td-healthy\">0</span>/<span id=\"td-total\">" + _0x555713 + "</span></span>";
  _0x343a0a += "<span>Peak: <span class=\"td-summary-val\" id=\"td-max-speed\">—</span></span>";
  _0x343a0a += "</div>";
  _0x133e9a.innerHTML = _0x343a0a;
  _0x133e9a.className = "active";
  _0x133e9a.style.display = "block";
  a0_0x4b3135 = true;
}
function a0_0xbb9ed5(_0x502279) {
  if (!_0x502279 || _0x502279.length === 0) {
    return;
  }
  var _0x298343 = document.getElementById("tunnel-dashboard");
  if (!_0x298343) {
    return;
  }
  if (!a0_0x4b3135) {
    a0_0x18acca(_0x502279.length);
  }
  var _0xfc5848 = 0;
  var _0xb2da8b = 0;
  var _0x5acb8b = 0;
  for (var _0x5f18a1 = 0; _0x5f18a1 < _0x502279.length; _0x5f18a1++) {
    if (_0x502279[_0x5f18a1].speed > _0xfc5848) {
      _0xfc5848 = _0x502279[_0x5f18a1].speed;
    }
    if (_0x502279[_0x5f18a1].active) {
      _0xb2da8b++;
    }
    if (_0x502279[_0x5f18a1].healthy) {
      _0x5acb8b++;
    }
  }
  if (_0xfc5848 < 102400) {
    _0xfc5848 = 102400;
  }
  for (var _0x36b6e2 = 0; _0x36b6e2 < _0x502279.length && _0x36b6e2 < a0_0x529de3; _0x36b6e2++) {
    var _0x306ce7 = _0x502279[_0x36b6e2];
    var _0x1c5504 = _0x306ce7.speed / 1024;
    var _0x5c3fe7 = _0x306ce7.speed / _0xfc5848;
    var _0x146630 = Math.round(_0x5c3fe7 * a0_0x125e44);
    var _0x31a3af = !_0x306ce7.healthy && _0x306ce7.fail > _0x306ce7.ok && _0x306ce7.fail >= 2;
    for (var _0x585a03 = 0; _0x585a03 < a0_0x125e44; _0x585a03++) {
      var _0x104db0 = document.getElementById("td-" + _0x36b6e2 + "-" + _0x585a03);
      if (!_0x104db0) {
        continue;
      }
      _0x104db0.className = "td-block";
      if (_0x31a3af) {
        _0x104db0.classList.add("dead");
      } else if (_0x585a03 < _0x146630) {
        var _0xcf69df = _0x585a03 / a0_0x125e44;
        if (_0xcf69df < 0.2) {
          _0x104db0.classList.add("lit-1");
        } else if (_0xcf69df < 0.3) {
          _0x104db0.classList.add("lit-2");
        } else if (_0xcf69df < 0.4) {
          _0x104db0.classList.add("lit-3");
        } else if (_0xcf69df < 0.55) {
          _0x104db0.classList.add("lit-4");
        } else if (_0xcf69df < 0.65) {
          _0x104db0.classList.add("lit-5");
        } else if (_0xcf69df < 0.75) {
          _0x104db0.classList.add("lit-6");
        } else if (_0xcf69df < 0.85) {
          _0x104db0.classList.add("lit-7");
        } else {
          _0x104db0.classList.add("lit-8");
        }
      } else {
        _0x104db0.classList.add("idle");
      }
    }
    var _0x5763e8 = document.getElementById("td-spd-" + _0x36b6e2);
    if (_0x5763e8) {
      if (_0x31a3af) {
        _0x5763e8.textContent = "DEAD";
        _0x5763e8.className = "td-speed dead";
      } else if (_0x1c5504 <= 0 && !_0x306ce7.active) {
        _0x5763e8.textContent = "—";
        _0x5763e8.className = "td-speed";
      } else if (_0x1c5504 > 1024) {
        _0x5763e8.textContent = (_0x1c5504 / 1024).toFixed(1) + " MB";
        _0x5763e8.className = "td-speed fast";
      } else if (_0x1c5504 > 100) {
        _0x5763e8.textContent = Math.round(_0x1c5504) + " KB";
        _0x5763e8.className = "td-speed fast";
      } else if (_0x1c5504 > 30) {
        _0x5763e8.textContent = Math.round(_0x1c5504) + " KB";
        _0x5763e8.className = "td-speed medium";
      } else if (_0x1c5504 > 0) {
        _0x5763e8.textContent = Math.round(_0x1c5504) + " KB";
        _0x5763e8.className = "td-speed slow";
      } else {
        _0x5763e8.textContent = "—";
        _0x5763e8.className = "td-speed";
      }
    }
  }
  var _0x2fe981 = document.getElementById("td-active");
  var _0xb3ac2a = document.getElementById("td-healthy");
  var _0x545c63 = document.getElementById("td-max-speed");
  if (_0x2fe981) {
    _0x2fe981.textContent = _0xb2da8b;
  }
  if (_0xb3ac2a) {
    _0xb3ac2a.textContent = _0x5acb8b;
  }
  if (_0x545c63) {
    var _0x1103c5 = _0xfc5848 / 1024;
    _0x545c63.textContent = _0x1103c5 > 1024 ? (_0x1103c5 / 1024).toFixed(1) + " MB/s" : Math.round(_0x1103c5) + " KB/s";
  }
}
function a0_0x56add2(_0x25828e) {
  const _0x3d3e7c = document.getElementById("veloce-dl-dialog");
  if (_0x3d3e7c) {
    _0x3d3e7c.remove();
  }
  a0_0xdd0b39 = null;
  const _0x51e609 = document.getElementById("veloce-complete-dialog");
  if (_0x51e609) {
    _0x51e609.remove();
  }
  const _0x1d348f = document.createElement("div");
  _0x1d348f.id = "veloce-complete-dialog";
  _0x1d348f.style.cssText = "\n    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);\n    z-index: 100001;\n    background: linear-gradient(180deg, #1a2332 0%, #0f172a 100%);\n    border: 2px solid #22c55e;\n    border-radius: 12px;\n    width: 420px;\n    box-shadow: 0 20px 60px rgba(0,0,0,.7), 0 0 0 1px rgba(34,197,94,.3);\n    font-family: 'Segoe UI', Arial, sans-serif;\n    color: #e0e0e0;\n    overflow: hidden;\n  ";
  _0x1d348f.innerHTML = "\n    <div style=\"\n      display: flex; justify-content: space-between; align-items: center;\n      padding: 10px 16px;\n      background: linear-gradient(135deg, #22c55e, #16a34a);\n    \">\n      <span style=\"color: #fff; font-weight: bold; font-size: 13px;\">Download Complete</span>\n    </div>\n    <div style=\"padding: 20px;\">\n      <div style=\"text-align: center; font-size: 36px; margin-bottom: 8px;\">✓</div>\n      <div style=\"text-align: center; font-size: 14px; font-weight: bold; margin-bottom: 4px; word-break: break-all;\">\n        " + (_0x25828e.filename || "File") + "\n      </div>\n      <div style=\"text-align: center; font-size: 12px; color: #94a3b8; margin-bottom: 12px;\">\n        " + (_0x25828e.size || "") + " — Downloaded successfully\n      </div>\n\n      <!-- Post-download security scan -->\n      <div id=\"dl-complete-scan\" style=\"\n        margin: 0 0 14px 0; padding: 8px 10px;\n        background: rgba(30,41,59,.7); border: 1px solid #334155;\n        border-radius: 6px; font-size: 11px;\n      \">\n        <div style=\"display: flex; align-items: center; gap: 6px;\">\n          <span style=\"font-size: 12px;\">&#128737;</span>\n          <span style=\"color: #94a3b8; font-weight: bold; text-transform: uppercase; font-size: 9px; letter-spacing: 1px;\">FILE SCAN</span>\n          <span id=\"dl-complete-scan-status\" style=\"color: #64748b; font-size: 10px;\">hashing file...</span>\n        </div>\n        <div id=\"dl-complete-scan-result\" style=\"margin-top: 4px; display: none;\"></div>\n      </div>\n\n      <div style=\"display: flex; gap: 10px; justify-content: center;\">\n        <button id=\"dl-complete-open\" style=\"\n          background: #2563eb; color: #fff; border: none; border-radius: 8px;\n          padding: 10px 20px; font-size: 13px; font-weight: bold; cursor: pointer;\n        \">Open File</button>\n        <button id=\"dl-complete-folder\" style=\"\n          background: #1e293b; color: #e0e0e0; border: 1px solid #334155; border-radius: 8px;\n          padding: 10px 20px; font-size: 13px; font-weight: bold; cursor: pointer;\n        \">Open Folder</button>\n        <button id=\"dl-complete-close\" style=\"\n          background: #1e293b; color: #94a3b8; border: 1px solid #334155; border-radius: 8px;\n          padding: 10px 20px; font-size: 13px; cursor: pointer;\n        \">Close</button>\n      </div>\n    </div>\n  ";
  document.body.appendChild(_0x1d348f);
  document.getElementById("dl-complete-open").onclick = () => {
    if (window.veloce && _0x25828e.path) {
      window.veloce.openFile(_0x25828e.path);
    }
    _0x1d348f.remove();
  };
  document.getElementById("dl-complete-folder").onclick = () => {
    if (window.veloce && _0x25828e.path) {
      window.veloce.openFolder(_0x25828e.path);
    }
    _0x1d348f.remove();
  };
  document.getElementById("dl-complete-close").onclick = () => {
    _0x1d348f.remove();
  };
  if (_0x25828e.path && window.veloce && window.veloce.scanFileHash) {
    window.veloce.scanFileHash(_0x25828e.path).then(function (_0x384ccd) {
      var _0x15c9a3 = document.getElementById("dl-complete-scan-status");
      var _0x4052d2 = document.getElementById("dl-complete-scan-result");
      if (!_0x15c9a3 || !_0x4052d2) {
        return;
      }
      if (_0x384ccd && _0x384ccd.scanned) {
        _0x15c9a3.textContent = "complete";
        _0x15c9a3.style.color = "#22c55e";
        _0x4052d2.style.display = "block";
        var _0x3504db = _0x384ccd.hash ? _0x384ccd.hash.slice(0, 16) + "..." : "—";
        var _0x24c054 = _0x384ccd.vt ? _0x384ccd.vt.link : "";
        _0x4052d2.innerHTML = "<div style=\"display: flex; align-items: center; gap: 6px; padding: 2px 0;\"><span style=\"font-size: 10px;\">&#128994;</span><span style=\"color: #94a3b8;\">SHA-256:</span><span style=\"color: #64748b; font-family: monospace; font-size: 10px;\" title=\"" + (_0x384ccd.hash || "") + "\">" + _0x3504db + "</span></div>" + (_0x24c054 ? "<div style=\"padding: 2px 0;\"><a href=\"#\" id=\"dl-vt-link\" style=\"color: #3b82f6; text-decoration: none; font-size: 10px;\" title=\"Check on VirusTotal\">&#128270; Check on VirusTotal</a></div>" : "");
        var _0x2db76e = document.getElementById("dl-vt-link");
        if (_0x2db76e && _0x24c054) {
          _0x2db76e.onclick = function (_0x2a0f65) {
            _0x2a0f65.preventDefault();
            if (window.veloce) {
              window.veloce.openInBrowser(_0x24c054);
            }
          };
        }
      } else {
        _0x15c9a3.textContent = "scan unavailable";
        _0x15c9a3.style.color = "#64748b";
      }
    }).catch(function () {
      var _0x39d3c4 = document.getElementById("dl-complete-scan-status");
      if (_0x39d3c4) {
        _0x39d3c4.textContent = "scan failed";
        _0x39d3c4.style.color = "#64748b";
      }
    });
  } else {
    var _0xff31a3 = document.getElementById("dl-complete-scan");
    if (_0xff31a3) {
      _0xff31a3.style.display = "none";
    }
  }
}
if (window.veloce) {
  if (window.veloce.onDownloadStarted) {
    window.veloce.onDownloadStarted(_0x18e055 => {
      var _0x5be092 = {
        id: _0x18e055.id,
        filename: _0x18e055.filename,
        url: _0x18e055.url,
        totalBytes: _0x18e055.totalBytes || 0,
        resumable: _0x18e055.resumable !== false
      };
      a0_0x3138d1(_0x5be092, function () {
        if (window.veloce && window.veloce.cancelInterceptedDownload) {
          window.veloce.cancelInterceptedDownload(_0x18e055.id);
        }
        const _0x190524 = a0_0x59255a.find(_0x554dcc => _0x554dcc.id === a0_0x2dacd0);
        const _0x553b40 = _0x190524 ? _0x190524.url : "";
        const _0x1bbd90 = _0x190524 ? _0x190524.title || "" : "";
        const _0x59810d = _0x18e055.filename;
        const _0x477037 = _0x18e055.url.split("?")[0];
        a0_0x1b6244.add(_0x477037);
        const _0x96232c = a0_0x2e0161.length;
        a0_0x2e0161.push({
          id: _0x18e055.id,
          filename: _0x59810d,
          url: _0x18e055.url,
          status: "Downloading",
          progress: "0%",
          speed: "—",
          eta: "—",
          boosters: "—",
          size: _0x18e055.totalBytes > 0 ? a0_0xfb0148(_0x18e055.totalBytes) : "—",
          _intercepted: true
        });
        a0_0x2e56ab();
        a0_0x31e80d.textContent = "Downloading: " + _0x59810d;
        a0_0xdd0b39 = _0x18e055.id || _0x59810d;
        window.veloce.startDownload(_0x18e055.url, _0x18e055.filename, _0x553b40, _0x1bbd90).then(function (_0x15b91f) {
          if (_0x15b91f && _0x15b91f.duplicate) {
            a0_0x2e0161.splice(_0x96232c, 1);
            a0_0x31e80d.textContent = "Already downloading this file";
          } else if (_0x15b91f && _0x15b91f.cancelled) {
            a0_0x2e0161[_0x96232c].status = "Cancelled";
            a0_0x2e0161[_0x96232c].speed = "—";
          } else {
            a0_0x2e0161[_0x96232c].status = "Complete";
            a0_0x2e0161[_0x96232c].progress = "100%";
            if (_0x15b91f && _0x15b91f.size) {
              a0_0x2e0161[_0x96232c].size = _0x15b91f.size;
            }
            if (_0x15b91f && _0x15b91f.path) {
              a0_0x2e0161[_0x96232c].path = _0x15b91f.path;
            }
            a0_0x31e80d.textContent = "Complete: " + _0x59810d + (_0x15b91f && _0x15b91f.size ? " (" + _0x15b91f.size + ")" : "");
          }
          a0_0x1b6244.delete(_0x477037);
          a0_0x2e56ab();
        }).catch(function (_0x4484ed) {
          a0_0x2e0161[_0x96232c].status = "Error";
          a0_0x31e80d.textContent = "Failed: " + _0x59810d + " — " + _0x4484ed.message;
          a0_0x1b6244.delete(_0x477037);
          a0_0x2e56ab();
        });
      }, function () {
        if (window.veloce) {
          window.veloce.pauseDownload(_0x18e055.id + ":cancel");
        }
        a0_0x31e80d.textContent = "Download cancelled";
      });
    });
  }
  if (window.veloce.onDownloadComplete) {
    window.veloce.onDownloadComplete(_0x3bd28b => {
      const _0x220b82 = a0_0x2e0161.find(_0x3b6c60 => _0x3bd28b.id && _0x3b6c60.id === _0x3bd28b.id || _0x3b6c60.filename === _0x3bd28b.filename || _0x3bd28b.filename && _0x3bd28b.filename.indexOf(_0x3b6c60.filename) !== -1 || _0x3b6c60.filename && _0x3bd28b.filename && _0x3b6c60.filename.indexOf(_0x3b6c60.filename.slice(0, 15)) !== -1 || _0x3b6c60.status === "Downloading");
      if (_0x220b82) {
        _0x220b82.status = "Complete";
        _0x220b82.progress = "100%";
        if (_0x3bd28b.size) {
          _0x220b82.size = _0x3bd28b.size;
        }
        _0x220b82.path = _0x3bd28b.path;
        _0x220b82.folder = _0x3bd28b.folder;
      }
      a0_0x2e56ab();
      a0_0x31e80d.textContent = "Complete: " + (_0x3bd28b.filename || "Download");
      a0_0x56add2(_0x3bd28b);
    });
  }
}
function a0_0x2e56ab() {
  a0_0x2ce270.innerHTML = "";
  let _0x45a993 = 0;
  a0_0x2e0161.forEach((_0x5b1735, _0x2e18d5) => {
    if (_0x5b1735.status === "Downloading") {
      _0x45a993++;
    }
    const _0x3e3b79 = document.createElement("tr");
    const _0x35ea78 = "status-" + _0x5b1735.status.toLowerCase();
    _0x3e3b79.innerHTML = "\n      <td>" + _0x5b1735.filename + "</td>\n      <td>" + (_0x5b1735.size || "—") + "</td>\n      <td class=\"" + _0x35ea78 + "\">" + _0x5b1735.status + "</td>\n      <td>" + (_0x5b1735.progress || "—") + "</td>\n      <td>" + (_0x5b1735.speed || "—") + "</td>\n      <td>" + (_0x5b1735.eta || "—") + "</td>\n      <td>" + (_0x5b1735.boosters || "—") + "</td>\n    ";
    _0x3e3b79.onclick = () => {
      document.querySelectorAll("#dl-tbody tr").forEach(_0x9f2510 => _0x9f2510.classList.remove("selected"));
      _0x3e3b79.classList.add("selected");
    };
    a0_0x2ce270.appendChild(_0x3e3b79);
  });
  a0_0x5815c3.textContent = "Active: " + _0x45a993;
}
(function () {
  var _0x83537b = document.getElementById("panel-resize-handle");
  var _0x5d27ad = document.getElementById("download-panel");
  if (!_0x83537b || !_0x5d27ad) {
    return;
  }
  var _0x22df8b = false;
  var _0x4e1c15 = 0;
  var _0x120a04 = 0;
  var _0x3c0fa7 = 42;
  var _0x1b977f = 190;
  function _0xd87534() {
    return parseInt(_0x5d27ad.style.height) || _0x5d27ad.offsetHeight || _0x1b977f;
  }
  _0x83537b.addEventListener("mousedown", function (_0xe165be) {
    _0x22df8b = true;
    _0x4e1c15 = _0xe165be.clientY;
    _0x120a04 = _0xd87534();
    _0x83537b.classList.add("dragging");
    document.body.classList.add("no-select");
    _0xe165be.preventDefault();
  });
  document.addEventListener("mousemove", function (_0x30e819) {
    if (!_0x22df8b) {
      return;
    }
    var _0x21953f = _0x30e819.clientY - _0x4e1c15;
    var _0x44a7c2 = _0x120a04 - _0x21953f;
    if (_0x44a7c2 < _0x3c0fa7) {
      _0x44a7c2 = _0x3c0fa7;
    }
    if (_0x44a7c2 > _0x1b977f) {
      _0x44a7c2 = _0x1b977f;
    }
    _0x5d27ad.style.height = _0x44a7c2 + "px";
  });
  document.addEventListener("mouseup", function () {
    if (!_0x22df8b) {
      return;
    }
    _0x22df8b = false;
    _0x83537b.classList.remove("dragging");
    document.body.classList.remove("no-select");
  });
  _0x83537b.addEventListener("dblclick", function () {
    var _0x2eb0cc = _0xd87534();
    _0x5d27ad.style.height = _0x2eb0cc <= _0x3c0fa7 + 10 ? _0x1b977f + "px" : _0x3c0fa7 + "px";
  });
})();
document.getElementById("btn-sniffer").onclick = () => {
  a0_0x59068a();
  a0_0x4aadb4 = !a0_0x4aadb4;
  const _0x53b9e0 = document.getElementById("btn-sniffer");
  if (a0_0x4aadb4) {
    _0x53b9e0.classList.add("active");
    a0_0x33abd7.textContent = "Media Detect: ON";
    a0_0x33abd7.className = "sniffer-on";
  } else {
    _0x53b9e0.classList.remove("active");
    a0_0x33abd7.textContent = "Media Detect: OFF";
    a0_0x33abd7.className = "sniffer-off";
  }
};
document.getElementById("btn-delete").onclick = () => {
  const _0x4a943e = document.querySelector("#dl-tbody tr.selected");
  if (_0x4a943e) {
    const _0x4218f7 = Array.from(a0_0x2ce270.children).indexOf(_0x4a943e);
    const _0x25b3a6 = a0_0x2e0161[_0x4218f7];
    if (_0x25b3a6 && (_0x25b3a6.status === "Downloading" || _0x25b3a6.status === "Paused")) {
      if (window.veloce) {
        window.veloce.pauseDownload((_0x25b3a6.id || _0x25b3a6.filename) + ":cancel");
        if (_0x25b3a6._internalName && _0x25b3a6._internalName !== _0x25b3a6.filename) {
          window.veloce.pauseDownload(_0x25b3a6._internalName + ":cancel");
        }
      }
      a0_0x1b6244.delete((_0x25b3a6.url || "").split("?")[0]);
    }
    a0_0x2e0161.splice(_0x4218f7, 1);
    a0_0x2e56ab();
    a0_0x31e80d.textContent = "Download removed";
  }
};
document.getElementById("btn-pause").onclick = () => {
  const _0x44e9c9 = document.querySelector("#dl-tbody tr.selected");
  if (!_0x44e9c9) {
    a0_0x31e80d.textContent = "Select a download first";
    return;
  }
  const _0x573cd2 = Array.from(a0_0x2ce270.children).indexOf(_0x44e9c9);
  const _0x5f5547 = a0_0x2e0161[_0x573cd2];
  if (_0x5f5547 && _0x5f5547.status === "Downloading") {
    _0x5f5547.status = "Paused";
    _0x5f5547.speed = "—";
    a0_0x2e56ab();
    a0_0x31e80d.textContent = "Paused: " + _0x5f5547.filename;
    if (window.veloce) {
      window.veloce.pauseDownload(_0x5f5547.id || _0x5f5547.filename);
    }
  }
};
document.getElementById("btn-resume").onclick = () => {
  const _0x463232 = document.querySelector("#dl-tbody tr.selected");
  if (!_0x463232) {
    a0_0x31e80d.textContent = "Select a download first";
    return;
  }
  const _0x2e83ed = Array.from(a0_0x2ce270.children).indexOf(_0x463232);
  const _0x47cf67 = a0_0x2e0161[_0x2e83ed];
  if (_0x47cf67 && (_0x47cf67.status === "Paused" || _0x47cf67.status === "Interrupted")) {
    _0x47cf67.status = "Downloading";
    a0_0x2e56ab();
    a0_0x31e80d.textContent = "Resumed: " + _0x47cf67.filename;
    if (window.veloce) {
      window.veloce.resumeDownload(_0x47cf67.id || _0x47cf67.filename);
    }
  }
};
document.getElementById("btn-resume-all").onclick = () => {
  let _0x33b112 = 0;
  a0_0x2e0161.forEach(_0x42e9e2 => {
    if (_0x42e9e2.status === "Paused" || _0x42e9e2.status === "Interrupted") {
      _0x42e9e2.status = "Downloading";
      if (window.veloce) {
        window.veloce.resumeDownload(_0x42e9e2.id || _0x42e9e2.filename);
      }
      _0x33b112++;
    }
  });
  a0_0x2e56ab();
  a0_0x31e80d.textContent = _0x33b112 > 0 ? "Resumed " + _0x33b112 + " download(s)" : "No paused downloads";
};
var a0_0x3bb91b = document.getElementById("settings-panel");
var a0_0x183714 = false;
function a0_0xc1cbfd(_0x178d75) {
  var _0x4e600b = document.getElementById("settings-engine-stats");
  if (_0x4e600b) {
    _0x4e600b.textContent = "HLS Tunnels: " + _0x178d75.hlsTunnels + " | Direct Workers: " + _0x178d75.directWorkers + " | Chunk: " + _0x178d75.chunkSizeMB + " MB | Retries: " + _0x178d75.maxRetries;
  }
}
function a0_0x4851c8(_0x17477e, _0x2e3fee, _0x475da3) {
  var _0x43aaae = document.getElementById(_0x17477e);
  if (!_0x43aaae) {
    return;
  }
  var _0x2d6112 = _0x43aaae.querySelectorAll(".tunnel-opt");
  _0x2d6112.forEach(function (_0x4c8b57) {
    _0x4c8b57.classList.toggle("active", _0x4c8b57.getAttribute("data-val") === String(_0x2e3fee));
    _0x4c8b57.onclick = function () {
      _0x2d6112.forEach(function (_0x109f97) {
        _0x109f97.classList.remove("active");
      });
      _0x4c8b57.classList.add("active");
      _0x475da3(Number(_0x4c8b57.getAttribute("data-val")));
    };
  });
}
var a0_0x9ace64 = {
  downloads: "Downloads",
  detection: "Detection",
  privacy: "Privacy & Security",
  system: "System",
  engine: "Veloce Engine",
  about: "About Veloce"
};
function a0_0x406bb7(_0x213f52) {
  document.querySelectorAll(".settings-nav-item").forEach(function (_0x8b7020) {
    _0x8b7020.classList.toggle("active", _0x8b7020.getAttribute("data-page") === _0x213f52);
  });
  document.querySelectorAll(".settings-page").forEach(function (_0x5c5e68) {
    _0x5c5e68.classList.toggle("active", _0x5c5e68.id === "page-" + _0x213f52);
  });
  var _0x298196 = document.getElementById("settings-page-title");
  if (_0x298196) {
    _0x298196.textContent = a0_0x9ace64[_0x213f52] || _0x213f52;
  }
}
async function a0_0x4dd839() {
  a0_0x183714 = true;
  a0_0x3bb91b.style.display = "flex";
  document.getElementById("btn-settings").classList.add("active");
  var _0x49d72c = await window.veloce.getSettings();
  a0_0x4851c8("tunnel-selector", _0x49d72c.hlsTunnels, function (_0x3f1b28) {
    var _0x1b6c3b = {
      hlsTunnels: _0x3f1b28
    };
    window.veloce.updateSettings(_0x1b6c3b);
    _0x49d72c.hlsTunnels = _0x3f1b28;
    a0_0xc1cbfd(_0x49d72c);
  });
  a0_0x4851c8("direct-worker-selector", _0x49d72c.directWorkers, function (_0x431db5) {
    var _0x4f8432 = {
      directWorkers: _0x431db5
    };
    window.veloce.updateSettings(_0x4f8432);
    _0x49d72c.directWorkers = _0x431db5;
    a0_0xc1cbfd(_0x49d72c);
  });
  a0_0x4851c8("chunk-size-selector", _0x49d72c.chunkSizeMB, function (_0x4770e6) {
    var _0x1ff1d0 = {
      chunkSizeMB: _0x4770e6
    };
    window.veloce.updateSettings(_0x1ff1d0);
    _0x49d72c.chunkSizeMB = _0x4770e6;
    a0_0xc1cbfd(_0x49d72c);
  });
  a0_0x4851c8("retry-selector", _0x49d72c.maxRetries, function (_0x313883) {
    var _0x58c950 = {
      maxRetries: _0x313883
    };
    window.veloce.updateSettings(_0x58c950);
    _0x49d72c.maxRetries = _0x313883;
    a0_0xc1cbfd(_0x49d72c);
  });
  var _0xa598b6 = document.getElementById("settings-dl-path");
  if (_0xa598b6) {
    _0xa598b6.textContent = _0x49d72c.downloadPath;
  }
  var _0x5b8300 = document.getElementById("settings-remux");
  var _0x109c7b = document.getElementById("settings-sniffer");
  var _0x1aa47a = document.getElementById("settings-sound");
  if (_0x5b8300) {
    _0x5b8300.checked = _0x49d72c.remuxEnabled;
  }
  if (_0x109c7b) {
    _0x109c7b.checked = _0x49d72c.snifferEnabled;
  }
  if (_0x1aa47a) {
    _0x1aa47a.checked = _0x49d72c.soundEnabled;
  }
  a0_0xc1cbfd(_0x49d72c);
  a0_0x406bb7("downloads");
}
function a0_0x3a4d94() {
  a0_0x183714 = false;
  a0_0x3bb91b.style.display = "none";
  document.getElementById("btn-settings").classList.remove("active");
  a0_0x31e80d.textContent = "Settings saved";
}
document.getElementById("settings-nav").addEventListener("click", function (_0x50adf9) {
  var _0x402180 = _0x50adf9.target.closest(".settings-nav-item");
  if (!_0x402180) {
    return;
  }
  var _0x490b55 = _0x402180.getAttribute("data-page");
  if (_0x490b55) {
    a0_0x406bb7(_0x490b55);
  }
});
document.getElementById("btn-settings").onclick = function () {
  if (a0_0x183714) {
    a0_0x3a4d94();
  } else {
    a0_0x4dd839();
  }
};
document.getElementById("settings-close").onclick = function () {
  a0_0x3a4d94();
};
document.getElementById("settings-remux").onchange = function () {
  var _0x85f83b = {
    remuxEnabled: this.checked
  };
  window.veloce.updateSettings(_0x85f83b);
};
document.getElementById("settings-sniffer").onchange = function () {
  var _0x3f4f5d = {
    snifferEnabled: this.checked
  };
  window.veloce.updateSettings(_0x3f4f5d);
};
document.getElementById("settings-sound").onchange = function () {
  var _0xe37076 = {
    soundEnabled: this.checked
  };
  window.veloce.updateSettings(_0xe37076);
};
document.getElementById("settings-browse-folder").onclick = function () {
  window.veloce.selectDownloadPath().then(function (_0x46cb6b) {
    var _0x5766b4 = document.getElementById("settings-dl-path");
    if (_0x46cb6b && _0x5766b4) {
      _0x5766b4.textContent = _0x46cb6b;
      var _0x1ad48a = {
        downloadPath: _0x46cb6b
      };
      window.veloce.updateSettings(_0x1ad48a);
    }
  });
};
var a0_0x146e57 = document.getElementById("settings-clear-data");
if (a0_0x146e57) {
  a0_0x146e57.onclick = function () {
    var _0x20a32c = document.getElementById("clear-data-modal");
    if (_0x20a32c) {
      _0x20a32c.style.display = "flex";
    }
  };
}
(function () {
  var _0x3fa49b = document.getElementById("clear-data-modal");
  if (!_0x3fa49b) {
    return;
  }
  var _0x596384 = document.getElementById("clear-data-modal-close");
  var _0x2695f8 = document.getElementById("clear-data-modal-cancel");
  var _0x4c4bc8 = document.getElementById("clear-data-modal-confirm");
  function _0x4f793b() {
    _0x3fa49b.style.display = "none";
  }
  if (_0x596384) {
    _0x596384.onclick = _0x4f793b;
  }
  if (_0x2695f8) {
    _0x2695f8.onclick = _0x4f793b;
  }
  _0x3fa49b.addEventListener("click", function (_0x15c1a9) {
    if (_0x15c1a9.target === _0x3fa49b) {
      _0x4f793b();
    }
  });
  if (_0x4c4bc8) {
    _0x4c4bc8.onclick = function () {
      var _0x4c6ed6 = document.getElementById("clear-data-time-range");
      var _0x4459b4 = _0x4c6ed6 ? parseInt(_0x4c6ed6.value) : 0;
      var _0x58811a = {
        history: document.getElementById("clear-opt-history")?.checked || false,
        cookies: document.getElementById("clear-opt-cookies")?.checked || false,
        cache: document.getElementById("clear-opt-cache")?.checked || false,
        storage: document.getElementById("clear-opt-storage")?.checked || false
      };
      if (!_0x58811a.history && !_0x58811a.cookies && !_0x58811a.cache && !_0x58811a.storage) {
        alert("Select at least one item to clear.");
        return;
      }
      _0x4c4bc8.textContent = "Clearing...";
      _0x4c4bc8.disabled = true;
      if (window.veloce && window.veloce.clearBrowsingData) {
        var _0x3ff018 = {
          timeRange: _0x4459b4,
          dataTypes: _0x58811a
        };
        window.veloce.clearBrowsingData(_0x3ff018).then(function (_0x296dae) {
          _0x4c4bc8.textContent = "Clear Data";
          _0x4c4bc8.disabled = false;
          _0x4f793b();
          var _0x110c2f = document.getElementById("status-text");
          if (_0x296dae && _0x296dae.success) {
            if (_0x110c2f) {
              _0x110c2f.textContent = "Browsing data cleared";
            }
            alert("Browsing data cleared successfully.");
          } else {
            if (_0x110c2f) {
              _0x110c2f.textContent = "Failed to clear data";
            }
            alert("Error: " + (_0x296dae?.error || "unknown"));
          }
        }).catch(function (_0x2ce324) {
          _0x4c4bc8.textContent = "Clear Data";
          _0x4c4bc8.disabled = false;
          var _0x3ec34c = document.getElementById("status-text");
          if (_0x3ec34c) {
            _0x3ec34c.textContent = "Error clearing data";
          }
          alert("Error: " + (_0x2ce324?.message || _0x2ce324));
        });
      } else {
        _0x4c4bc8.textContent = "Clear Data";
        _0x4c4bc8.disabled = false;
        _0x4f793b();
        alert("Clear browsing data is not available.");
      }
    };
  }
})();
var a0_0x41599c = document.getElementById("settings-autostart");
if (a0_0x41599c) {
  a0_0x41599c.onchange = function () {
    var _0x454227 = {
      autoStart: this.checked
    };
    window.veloce.updateSettings(_0x454227);
  };
}
function a0_0x59068a() {
  var _0x466ac6 = document.getElementById("crawler-panel");
  if (_0x466ac6) {
    _0x466ac6.style.display = "none";
    a0_0x2cde84 = false;
  }
  var _0x27bde8 = document.getElementById("btn-crawler");
  if (_0x27bde8) {
    _0x27bde8.classList.remove("active");
  }
  var _0x119541 = document.getElementById("ai-search-panel");
  if (_0x119541) {
    _0x119541.style.display = "none";
    a0_0x44b829 = false;
  }
  var _0x43c397 = document.getElementById("btn-ai-search");
  if (_0x43c397) {
    _0x43c397.classList.remove("active");
  }
}
let a0_0x44b829 = false;
let a0_0x49e033 = [];
function a0_0x473ee9() {
  const _0x59b1b5 = document.getElementById("ai-search-panel");
  if (!_0x59b1b5) {
    return;
  }
  a0_0x44b829 = !a0_0x44b829;
  if (a0_0x44b829) {
    _0x59b1b5.style.display = "flex";
    const _0x509f71 = a0_0x26601e.getBoundingClientRect();
    _0x59b1b5.style.position = "absolute";
    _0x59b1b5.style.top = "0";
    _0x59b1b5.style.left = "0";
    _0x59b1b5.style.right = "0";
    _0x59b1b5.style.bottom = "0";
    if (a0_0x49e033.length === 0) {
      a0_0x47fd4b();
    }
    setTimeout(function () {
      var _0x588783 = document.getElementById("search-input");
      if (_0x588783) {
        _0x588783.focus();
      }
    }, 100);
    var _0x1cca9f = document.getElementById("btn-ai-search");
    if (_0x1cca9f) {
      _0x1cca9f.classList.add("active");
    }
  } else {
    _0x59b1b5.style.display = "none";
    var _0x1cca9f = document.getElementById("btn-ai-search");
    if (_0x1cca9f) {
      _0x1cca9f.classList.remove("active");
    }
  }
}
function a0_0x47fd4b() {
  var _0x519992 = document.getElementById("search-results");
  _0x519992.innerHTML = "\n    <div class=\"search-empty\">\n      <div class=\"search-empty-icon\">🧠</div>\n      <div class=\"search-empty-text\">Veloce AI Deep Search</div>\n      <div class=\"search-empty-hint\">\n        Search for old firmware, rare software, hidden downloads, archived files...<br>\n        AI searches Internet Archive, Wayback Machine, GitHub Releases & Open Directories simultaneously\n      </div>\n    </div>\n  ";
}
function a0_0x1ca226(_0x523a79) {
  var _0xaffd46 = document.getElementById("search-results");
  _0xaffd46.innerHTML = "\n    <div class=\"search-loading\">\n      <div class=\"search-loading-spinner\"></div>\n      <div>Searching across all sources for \"" + _0x523a79 + "\"...</div>\n      <div style=\"font-size: 11px; color: #64748b; margin-top: 6px;\">\n        Internet Archive • Wayback Machine • GitHub • Open Directories\n      </div>\n    </div>\n  ";
  var _0x25a67f = document.getElementById("search-status");
  _0x25a67f.style.display = "block";
  _0x25a67f.textContent = "Searching...";
  _0x25a67f.style.color = "#3b82f6";
}
function a0_0x57a9cb(_0x4ecfc4) {
  if (!_0x4ecfc4 || _0x4ecfc4 <= 0) {
    return "";
  }
  if (_0x4ecfc4 > 1073741824) {
    return (_0x4ecfc4 / 1073741824).toFixed(1) + " GB";
  }
  if (_0x4ecfc4 > 1048576) {
    return (_0x4ecfc4 / 1048576).toFixed(1) + " MB";
  }
  if (_0x4ecfc4 > 1024) {
    return (_0x4ecfc4 / 1024).toFixed(0) + " KB";
  }
  return _0x4ecfc4 + " B";
}
function a0_0xf74639(_0x2552b6) {
  if (_0x2552b6 === "Internet Archive") {
    return "sr-source-ia";
  }
  if (_0x2552b6 === "Wayback Machine") {
    return "sr-source-wb";
  }
  if (_0x2552b6 === "GitHub") {
    return "sr-source-gh";
  }
  if (_0x2552b6 === "Open Directories") {
    return "sr-source-od";
  }
  if (_0x2552b6 === "Archive Software") {
    return "sr-source-as";
  }
  return "sr-source-ia";
}
function a0_0xf23212(_0x3ddc82) {
  var _0x5dee8a = document.getElementById("search-results");
  var _0x16af6a = document.getElementById("search-status");
  a0_0x49e033 = _0x3ddc82.results || [];
  if (a0_0x49e033.length === 0) {
    _0x5dee8a.innerHTML = "\n      <div class=\"search-empty\">\n        <div class=\"search-empty-icon\">🔍</div>\n        <div class=\"search-empty-text\">No results found for \"" + _0x3ddc82.query + "\"</div>\n        <div class=\"search-empty-hint\">\n          Try different keywords, remove version numbers, or use broader terms.<br>\n          " + (_0x3ddc82.expandedQueries && _0x3ddc82.expandedQueries.length > 1 ? "Also searched: " + _0x3ddc82.expandedQueries.slice(1).map(function (_0x269b64) {
      return "\"" + _0x269b64 + "\"";
    }).join(", ") : "") + "\n        </div>\n      </div>\n    ";
    _0x16af6a.textContent = "No results found — " + _0x3ddc82.searchTime + "s";
    _0x16af6a.style.color = "#ef4444";
    return;
  }
  _0x16af6a.textContent = _0x3ddc82.totalResults + " results found in " + _0x3ddc82.searchTime + "s" + (_0x3ddc82.expandedQueries && _0x3ddc82.expandedQueries.length > 1 ? " — also searched: " + _0x3ddc82.expandedQueries.slice(1).map(function (_0x3add7a) {
    return "\"" + _0x3add7a + "\"";
  }).join(", ") : "");
  _0x16af6a.style.color = "#22c55e";
  _0x5dee8a.innerHTML = "";
  a0_0x49e033.forEach(function (_0x1b6f7f, _0x32bb5d) {
    var _0x377161 = document.createElement("div");
    _0x377161.className = "search-result-card";
    var _0x1b6543 = a0_0x57a9cb(_0x1b6f7f.size);
    var _0x4940ca = a0_0xf74639(_0x1b6f7f.source);
    var _0x54f90d = "<span class=\"sr-badge " + _0x4940ca + "\">" + _0x1b6f7f.source + "</span>";
    if (_0x1b6f7f.relevance !== undefined) {
      var _0x104423 = _0x1b6f7f.relevance >= 60 ? "#22c55e" : _0x1b6f7f.relevance >= 30 ? "#eab308" : "#ef4444";
      _0x54f90d += "<span class=\"sr-type\" style=\"color:" + _0x104423 + ";font-weight:bold;\">" + _0x1b6f7f.relevance + "% match</span>";
    }
    if (_0x1b6543) {
      _0x54f90d += "<span class=\"sr-size\">" + _0x1b6543 + "</span>";
    }
    if (_0x1b6f7f.date) {
      _0x54f90d += "<span class=\"sr-date\">" + _0x1b6f7f.date + "</span>";
    }
    if (_0x1b6f7f.version) {
      _0x54f90d += "<span class=\"sr-type\">v" + _0x1b6f7f.version + "</span>";
    }
    if (_0x1b6f7f.stars) {
      _0x54f90d += "<span class=\"sr-type\">⭐ " + _0x1b6f7f.stars + "</span>";
    }
    if (_0x1b6f7f.formats) {
      _0x54f90d += "<span class=\"sr-type\">" + _0x1b6f7f.formats.slice(0, 60) + "</span>";
    }
    var _0x476d45 = _0x1b6f7f.description ? "<div class=\"sr-desc\">" + _0x1b6f7f.description.replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</div>" : "";
    _0x377161.innerHTML = "\n      <div class=\"sr-top-row\">\n        <div class=\"sr-info\">\n          <div class=\"sr-title\">" + _0x1b6f7f.title.replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</div>\n          <div class=\"sr-meta\">" + _0x54f90d + "</div>\n          " + _0x476d45 + "\n        </div>\n        <div class=\"sr-actions\">\n          <button class=\"sr-dl-btn\" data-idx=\"" + _0x32bb5d + "\" title=\"Download with Veloce\">⬇ Download</button>\n          <button class=\"sr-open-btn\" data-idx=\"" + _0x32bb5d + "\" title=\"Open in browser tab\">Open</button>\n          <button class=\"sr-check-btn\" data-idx=\"" + _0x32bb5d + "\" title=\"Check if link is alive\">Check</button>\n        </div>\n      </div>\n    ";
    _0x377161.querySelector(".sr-dl-btn").onclick = function () {
      var _0x2c2290 = a0_0x49e033[_0x32bb5d];
      if (!_0x2c2290) {
        return;
      }
      var _0x4f8e76 = _0x2c2290.title.replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, "_").slice(0, 60) || "download";
      a0_0x473ee9();
      a0_0x171e60(_0x2c2290.url, _0x4f8e76, _0x2c2290.pageUrl || _0x2c2290.url);
    };
    _0x377161.querySelector(".sr-open-btn").onclick = function () {
      var _0x1d2383 = a0_0x49e033[_0x32bb5d];
      if (!_0x1d2383) {
        return;
      }
      var _0x37e0ba = _0x1d2383.pageUrl || _0x1d2383.url;
      a0_0x473ee9();
      a0_0xb19e16(_0x37e0ba);
    };
    _0x377161.querySelector(".sr-check-btn").onclick = function () {
      var _0x5ce4a1 = this;
      var _0x493ccd = a0_0x49e033[_0x32bb5d];
      if (!_0x493ccd || !window.veloce) {
        return;
      }
      _0x5ce4a1.textContent = "...";
      _0x5ce4a1.disabled = true;
      window.veloce.checkUrlAlive(_0x493ccd.url).then(function (_0x294aa7) {
        if (_0x294aa7.alive) {
          _0x5ce4a1.textContent = "✓ Alive";
          _0x5ce4a1.className = "sr-check-btn alive";
          if (_0x294aa7.size > 0) {
            _0x493ccd.size = _0x294aa7.size;
            var _0x89a1fa = _0x377161.querySelector(".sr-size");
            if (_0x89a1fa) {
              _0x89a1fa.textContent = a0_0x57a9cb(_0x294aa7.size);
            } else {
              var _0x156789 = _0x377161.querySelector(".sr-meta");
              if (_0x156789) {
                var _0x10f86d = document.createElement("span");
                _0x10f86d.className = "sr-size";
                _0x10f86d.textContent = a0_0x57a9cb(_0x294aa7.size);
                _0x156789.appendChild(_0x10f86d);
              }
            }
          }
        } else {
          _0x5ce4a1.textContent = "✗ Dead";
          _0x5ce4a1.className = "sr-check-btn dead";
          window.veloce.resurrectLink(_0x493ccd.originalUrl || _0x493ccd.url).then(function (_0x6e26c8) {
            if (_0x6e26c8.found) {
              _0x5ce4a1.textContent = "↻ Resurrected";
              _0x5ce4a1.className = "sr-check-btn resurrected";
              _0x5ce4a1.title = "Found on Wayback Machine — click Download to get archived version";
              _0x493ccd.url = _0x6e26c8.waybackUrl;
              _0x493ccd.source = "Wayback (Rescued)";
              var _0x28ac93 = _0x377161.querySelector(".sr-badge");
              if (_0x28ac93) {
                _0x28ac93.textContent = "Wayback (Rescued)";
                _0x28ac93.className = "sr-badge sr-source-wb";
              }
            }
          }).catch(function () {});
        }
        _0x5ce4a1.disabled = false;
      }).catch(function () {
        _0x5ce4a1.textContent = "? Error";
        _0x5ce4a1.disabled = false;
      });
    };
    _0x5dee8a.appendChild(_0x377161);
  });
}
async function a0_0x59514a() {
  var _0x297d84 = document.getElementById("search-input");
  var _0x2606ea = document.getElementById("search-go");
  if (!_0x297d84 || !window.veloce || !window.veloce.search) {
    return;
  }
  var _0x384281 = _0x297d84.value.trim();
  if (!_0x384281) {
    _0x297d84.focus();
    return;
  }
  _0x2606ea.disabled = true;
  _0x2606ea.textContent = "Searching...";
  a0_0x1ca226(_0x384281);
  try {
    var _0x59f638 = await window.veloce.search(_0x384281);
    a0_0xf23212(_0x59f638);
  } catch (_0x5e2b18) {
    var _0x33f550 = document.getElementById("search-results");
    _0x33f550.innerHTML = "\n      <div class=\"search-empty\">\n        <div class=\"search-empty-icon\">⚠</div>\n        <div class=\"search-empty-text\">Search failed</div>\n        <div class=\"search-empty-hint\">" + (_0x5e2b18.message || "Unknown error") + "</div>\n      </div>\n    ";
  }
  _0x2606ea.disabled = false;
  _0x2606ea.textContent = "Search";
}
document.getElementById("btn-ai-search").onclick = a0_0x473ee9;
document.getElementById("search-close").onclick = a0_0x473ee9;
document.getElementById("search-go").onclick = a0_0x59514a;
document.getElementById("search-input").addEventListener("keydown", function (_0x110ebf) {
  if (_0x110ebf.key === "Enter") {
    a0_0x59514a();
  }
  if (_0x110ebf.key === "Escape") {
    a0_0x473ee9();
  }
});
document.addEventListener("keydown", function (_0x24e895) {
  if (_0x24e895.key === "F12" || _0x24e895.ctrlKey && _0x24e895.shiftKey && _0x24e895.key === "I") {
    _0x24e895.preventDefault();
    var _0x34019a = a0_0x59255a.find(function (_0x4db15d) {
      return _0x4db15d.id === a0_0x2dacd0;
    });
    if (_0x34019a && _0x34019a.webview) {
      if (_0x34019a.webview.isDevToolsOpened()) {
        _0x34019a.webview.closeDevTools();
      } else {
        _0x34019a.webview.openDevTools();
      }
    }
  }
  if (_0x24e895.ctrlKey && _0x24e895.shiftKey && _0x24e895.key === "J") {
    _0x24e895.preventDefault();
    if (window.veloce && window.veloce.toggleDevTools) {
      window.veloce.toggleDevTools();
    }
  }
});
var a0_0x2cde84 = false;
function a0_0x5d169b() {
  var _0x20b99a = document.getElementById("crawler-panel");
  if (!_0x20b99a) {
    a0_0x41ccda();
    _0x20b99a = document.getElementById("crawler-panel");
  }
  var _0x5d65c4 = document.getElementById("ai-search-panel");
  if (_0x5d65c4) {
    _0x5d65c4.style.display = "none";
    a0_0x44b829 = false;
  }
  a0_0x2cde84 = !a0_0x2cde84;
  _0x20b99a.style.display = a0_0x2cde84 ? "flex" : "none";
  if (a0_0x2cde84) {
    if (window.veloce && window.veloce.crawlerStats) {
      window.veloce.crawlerStats().then(a0_0x59de26);
    }
  }
}
function a0_0x41ccda() {
  var _0x3bff3b = document.getElementById("crawler-panel");
  if (_0x3bff3b) {
    return;
  }
  var _0x55b108 = document.createElement("div");
  _0x55b108.id = "crawler-panel";
  _0x55b108.style.cssText = "\n    display: none; position: absolute; top: 0; left: 0; right: 0; bottom: 0;\n    z-index: 9999; background: #060a12;\n    flex-direction: column; font-family: 'Rajdhani', 'Consolas', monospace;\n    color: #e0e0e0;\n  ";
  _0x55b108.innerHTML = "\n    <div style=\"\n      display: flex; justify-content: space-between; align-items: center;\n      padding: 8px 16px; background: linear-gradient(135deg, #0f172a, #1e293b);\n      border-bottom: 2px solid #0ea5e9;\n    \">\n      <div style=\"display: flex; align-items: center; gap: 10px;\">\n        <span style=\"font-family: 'Orbitron', sans-serif; font-size: 14px; color: #0ea5e9; letter-spacing: 2px;\">VELOCE CRAWLER</span>\n        <span id=\"cw-status-badge\" style=\"\n          padding: 2px 8px; border-radius: 3px; font-size: 10px; font-weight: bold;\n          text-transform: uppercase; letter-spacing: 1px;\n          background: #1e293b; color: #64748b; border: 1px solid #334155;\n        \">IDLE</span>\n      </div>\n      <div style=\"display: flex; gap: 6px;\">\n        <button id=\"cw-btn-start\" class=\"cw-btn cw-btn-green\">▶ Start</button>\n        <button id=\"cw-btn-pause\" class=\"cw-btn cw-btn-yellow\" disabled>⏸ Pause</button>\n        <button id=\"cw-btn-stop\" class=\"cw-btn cw-btn-red\" disabled>⏹ Stop</button>\n        <button id=\"cw-btn-skip\" class=\"cw-btn\" disabled>⏭ Skip</button>\n        <div style=\"width: 1px; background: #334155; margin: 0 4px;\"></div>\n        <button id=\"cw-btn-close\" class=\"cw-btn\">✕ Close</button>\n      </div>\n    </div>\n\n    <div style=\"display: flex; flex: 1; overflow: hidden;\">\n      <!-- Left: Stats panel -->\n      <div style=\"width: 280px; padding: 12px; border-right: 1px solid #1e293b; overflow-y: auto;\">\n        <div class=\"cw-stat-group\">\n          <div class=\"cw-stat-title\">PROGRESS</div>\n          <div class=\"cw-stat-row\"><span>Status</span><span id=\"cw-stat-status\" style=\"color: #64748b;\">Idle</span></div>\n          <div class=\"cw-stat-row\"><span>Current term</span><span id=\"cw-stat-term\" style=\"color: #0ea5e9; font-size: 11px;\">—</span></div>\n          <div class=\"cw-stat-row\"><span>Category</span><span id=\"cw-stat-category\">—</span></div>\n          <div class=\"cw-stat-row\"><span>Term #</span><span id=\"cw-stat-term-num\">0 / 0</span></div>\n          <div class=\"cw-stat-row\"><span>Uptime</span><span id=\"cw-stat-uptime\">—</span></div>\n        </div>\n        <div class=\"cw-stat-group\">\n          <div class=\"cw-stat-title\">DISCOVERIES</div>\n          <div class=\"cw-stat-row\"><span>Patterns found</span><span id=\"cw-stat-patterns\" style=\"color: #22c55e; font-weight: bold;\">0</span></div>\n          <div class=\"cw-stat-row\"><span>Files found</span><span id=\"cw-stat-files\" style=\"color: #22c55e;\">0</span></div>\n          <div class=\"cw-stat-row\"><span>Domains learned</span><span id=\"cw-stat-domains\">0</span></div>\n        </div>\n        <div class=\"cw-stat-group\">\n          <div class=\"cw-stat-title\">ACTIVITY</div>\n          <div class=\"cw-stat-row\"><span>Sites visited</span><span id=\"cw-stat-sites\">0</span></div>\n          <div class=\"cw-stat-row\"><span>Pages visited</span><span id=\"cw-stat-pages\">0</span></div>\n          <div class=\"cw-stat-row\"><span>Errors</span><span id=\"cw-stat-errors\" style=\"color: #ef4444;\">0</span></div>\n        </div>\n        <div class=\"cw-stat-group\">\n          <div class=\"cw-stat-title\">ADD SEARCH TERM</div>\n          <input id=\"cw-add-term\" type=\"text\" placeholder=\"e.g. Winamp 5.8\" style=\"\n            width: 100%; padding: 6px 8px; background: #0f172a; border: 1px solid #334155;\n            border-radius: 4px; color: #e0e0e0; font-size: 12px; margin-bottom: 6px; box-sizing: border-box;\n          \">\n          <button id=\"cw-btn-add\" class=\"cw-btn\" style=\"width: 100%; font-size: 11px;\">+ Add Term</button>\n        </div>\n      </div>\n\n      <!-- Right: tabbed view — LIVE LOG stays, TERMS tab added -->\n      <div style=\"flex: 1; display: flex; flex-direction: column; overflow: hidden;\">\n\n        <!-- Tab bar -->\n        <div style=\"display: flex; align-items: center; background: #0a0e17; border-bottom: 1px solid #1e293b; padding: 0 8px;\">\n          <button id=\"cw-tab-log\" style=\"\n            padding: 6px 14px; background: none; border: none; border-bottom: 2px solid #0ea5e9;\n            color: #0ea5e9; font-family: 'Orbitron', sans-serif; font-size: 10px; letter-spacing: 2px;\n            cursor: pointer; text-transform: uppercase;\n          \">LIVE LOG</button>\n          <button id=\"cw-tab-terms\" style=\"\n            padding: 6px 14px; background: none; border: none; border-bottom: 2px solid transparent;\n            color: #475569; font-family: 'Orbitron', sans-serif; font-size: 10px; letter-spacing: 2px;\n            cursor: pointer; text-transform: uppercase;\n          \">TERMS</button>\n          <span id=\"cw-current-url\" style=\"margin-left: 10px; font-size: 10px; color: #475569; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;\"></span>\n        </div>\n\n        <!-- LIVE LOG view (stays exactly as before) -->\n        <div id=\"cw-log-view\" style=\"flex: 1; display: flex; flex-direction: column; overflow: hidden;\">\n          <div id=\"cw-log\" style=\"\n            flex: 1; overflow-y: auto; padding: 8px 12px;\n            font-family: 'Consolas', 'Courier New', monospace;\n            font-size: 11px; line-height: 1.6;\n            background: #060a12;\n          \"></div>\n        </div>\n\n        <!-- TERMS view (hidden by default) -->\n        <div id=\"cw-terms-view\" style=\"flex: 1; display: none; flex-direction: column; overflow: hidden; background: #060a12;\">\n          <!-- Terms toolbar -->\n          <div style=\"display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid #1e293b; background: #0a0e17;\">\n            <select id=\"cw-term-filter\" style=\"\n              background: #0f172a; border: 1px solid #334155; color: #e0e0e0;\n              padding: 4px 8px; border-radius: 4px; font-size: 11px; flex: 1;\n            \"><option value=\"__all__\">All Categories</option></select>\n            <span id=\"cw-term-count\" style=\"color: #475569; font-size: 11px; white-space: nowrap;\"></span>\n            <button id=\"cw-btn-remove-selected\" style=\"\n              padding: 4px 10px; background: #7f1d1d; border: 1px solid #ef4444;\n              color: #fca5a5; border-radius: 4px; font-size: 11px; cursor: pointer;\n            \">Remove Selected</button>\n          </div>\n          <!-- Terms list -->\n          <div id=\"cw-term-list\" style=\"flex: 1; overflow-y: auto; padding: 4px 12px;\"></div>\n        </div>\n\n      </div>\n    </div>\n  ";
  var _0x29e7d6 = document.getElementById("browser-area");
  if (_0x29e7d6) {
    _0x29e7d6.appendChild(_0x55b108);
  } else {
    document.body.appendChild(_0x55b108);
  }
  document.getElementById("cw-btn-start").onclick = function () {
    var _0x17f11b = document.getElementById("cw-term-filter");
    var _0x39fe1a = _0x17f11b ? _0x17f11b.value : "__all__";
    var _0x310a6c = _0x39fe1a !== "__all__" ? {
      category: _0x39fe1a
    } : undefined;
    if (window.veloce) {
      window.veloce.crawlerStart(_0x310a6c);
    }
    a0_0xadb0fd("running");
  };
  document.getElementById("cw-btn-pause").onclick = function () {
    if (window.veloce) {
      window.veloce.crawlerPause();
    }
    a0_0xadb0fd("paused");
  };
  document.getElementById("cw-btn-stop").onclick = function () {
    if (window.veloce) {
      window.veloce.crawlerStop();
    }
    a0_0xadb0fd("stopped");
  };
  document.getElementById("cw-btn-skip").onclick = function () {
    if (window.veloce) {
      window.veloce.crawlerSkip();
    }
  };
  document.getElementById("cw-btn-close").onclick = function () {
    a0_0x5d169b();
  };
  document.getElementById("cw-btn-add").onclick = function () {
    var _0x4d5edc = document.getElementById("cw-add-term");
    var _0x55889d = _0x4d5edc.value.trim();
    if (_0x55889d && window.veloce) {
      window.veloce.crawlerAddTerm(_0x55889d, "custom");
      _0x4d5edc.value = "";
    }
  };
  document.getElementById("cw-add-term").addEventListener("keydown", function (_0x352fdb) {
    if (_0x352fdb.key === "Enter") {
      document.getElementById("cw-btn-add").click();
    }
  });
  document.getElementById("cw-tab-log").onclick = function () {
    document.getElementById("cw-log-view").style.display = "flex";
    document.getElementById("cw-terms-view").style.display = "none";
    this.style.color = "#0ea5e9";
    this.style.borderBottomColor = "#0ea5e9";
    document.getElementById("cw-tab-terms").style.color = "#475569";
    document.getElementById("cw-tab-terms").style.borderBottomColor = "transparent";
  };
  document.getElementById("cw-tab-terms").onclick = function () {
    document.getElementById("cw-log-view").style.display = "none";
    document.getElementById("cw-terms-view").style.display = "flex";
    this.style.color = "#0ea5e9";
    this.style.borderBottomColor = "#0ea5e9";
    document.getElementById("cw-tab-log").style.color = "#475569";
    document.getElementById("cw-tab-log").style.borderBottomColor = "transparent";
    a0_0x45c53f();
  };
  document.getElementById("cw-term-filter").onchange = function () {
    a0_0x206db3(this.value);
  };
  document.getElementById("cw-btn-remove-selected").onclick = function () {
    var _0x248a6e = document.querySelectorAll(".cw-term-check:checked");
    if (_0x248a6e.length === 0) {
      return;
    }
    var _0x6fc6d2 = [];
    _0x248a6e.forEach(function (_0xcfb015) {
      var _0xc67eb0 = _0xcfb015.closest("[data-term]");
      if (_0xc67eb0) {
        _0x6fc6d2.push({
          term: _0xc67eb0.getAttribute("data-term"),
          category: _0xc67eb0.getAttribute("data-cat")
        });
      }
    });
    if (window.veloce && window.veloce.crawlerRemoveBulk) {
      window.veloce.crawlerRemoveBulk(_0x6fc6d2).then(function (_0x3081ac) {
        if (_0x3081ac.ok) {
          a0_0x45c53f();
        }
      });
    }
  };
}
var a0_0x582917 = null;
function a0_0x45c53f() {
  if (!window.veloce || !window.veloce.crawlerGetTerms) {
    return;
  }
  window.veloce.crawlerGetTerms().then(function (_0x45eec5) {
    a0_0x582917 = _0x45eec5;
    var _0x2ea715 = document.getElementById("cw-term-filter");
    var _0x8f6b87 = Object.keys(_0x45eec5.categories || {}).sort();
    _0x2ea715.innerHTML = "<option value=\"__all__\">All Categories</option>";
    for (var _0xcaab52 = 0; _0xcaab52 < _0x8f6b87.length; _0xcaab52++) {
      var _0xa9f044 = _0x45eec5.categories[_0x8f6b87[_0xcaab52]].length;
      _0x2ea715.innerHTML += "<option value=\"" + _0x8f6b87[_0xcaab52] + "\">" + _0x8f6b87[_0xcaab52].replace(/_/g, " ") + " (" + _0xa9f044 + ")</option>";
    }
    a0_0x206db3("__all__");
  });
}
function a0_0x206db3(_0x461948) {
  if (!a0_0x582917) {
    return;
  }
  var _0x5675cb = document.getElementById("cw-term-list");
  var _0x1bc5df = a0_0x582917.categories || {};
  var _0x304f29 = "";
  var _0x42c414 = 0;
  var _0x2c6b84 = Object.keys(_0x1bc5df).sort();
  for (var _0x420944 = 0; _0x420944 < _0x2c6b84.length; _0x420944++) {
    var _0x242348 = _0x2c6b84[_0x420944];
    if (_0x461948 !== "__all__" && _0x242348 !== _0x461948) {
      continue;
    }
    var _0x5713e6 = _0x1bc5df[_0x242348];
    _0x304f29 += "<div style=\"color:#0ea5e9;font-size:10px;font-weight:bold;padding:6px 0 3px;letter-spacing:1px;text-transform:uppercase;border-bottom:1px solid #1e293b;margin-top:6px;\">" + _0x242348.replace(/_/g, " ") + " (" + _0x5713e6.length + ")</div>";
    for (var _0x286a3e = 0; _0x286a3e < _0x5713e6.length; _0x286a3e++) {
      _0x42c414++;
      var _0x24f963 = _0x5713e6[_0x286a3e].replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      _0x304f29 += "<div style=\"display:flex;align-items:center;padding:3px 0;border-bottom:1px solid #0f172a;\" data-term=\"" + _0x24f963 + "\" data-cat=\"" + _0x242348 + "\">";
      _0x304f29 += "<input type=\"checkbox\" class=\"cw-term-check\" style=\"margin-right:8px;accent-color:#0ea5e9;cursor:pointer;\">";
      _0x304f29 += "<span style=\"flex:1;color:#cbd5e1;font-size:12px;\">" + _0x24f963 + "</span>";
      _0x304f29 += "<span style=\"color:#334155;font-size:10px;margin-right:8px;\">" + _0x242348.replace(/_/g, " ") + "</span>";
      _0x304f29 += "<button class=\"cw-term-remove\" style=\"background:none;border:none;color:#ef4444;cursor:pointer;font-size:14px;padding:0 4px;\" title=\"Remove\">✕</button>";
      _0x304f29 += "</div>";
    }
  }
  if (!_0x304f29) {
    _0x304f29 = "<div style=\"color:#475569;padding:20px;text-align:center;\">No terms found</div>";
  }
  _0x5675cb.innerHTML = _0x304f29;
  var _0x297d0 = document.getElementById("cw-term-count");
  if (_0x297d0) {
    _0x297d0.textContent = _0x42c414 + " terms";
  }
  _0x5675cb.querySelectorAll(".cw-term-remove").forEach(function (_0x2124d4) {
    _0x2124d4.onclick = function () {
      var _0x380789 = this.closest("[data-term]");
      var _0x1edae4 = _0x380789.getAttribute("data-term");
      var _0x3e6174 = _0x380789.getAttribute("data-cat");
      if (window.veloce && window.veloce.crawlerRemoveTerm) {
        window.veloce.crawlerRemoveTerm(_0x1edae4, _0x3e6174).then(function (_0x4272ea) {
          if (_0x4272ea.ok) {
            a0_0x45c53f();
          }
        });
      }
    };
  });
}
function a0_0xadb0fd(_0x31433d) {
  var _0x1cb802 = document.getElementById("cw-btn-start");
  var _0x2f04a6 = document.getElementById("cw-btn-pause");
  var _0x842cb = document.getElementById("cw-btn-stop");
  var _0x520371 = document.getElementById("cw-btn-skip");
  var _0x24c54c = document.getElementById("cw-status-badge");
  if (_0x31433d === "running") {
    _0x1cb802.disabled = true;
    _0x2f04a6.disabled = false;
    _0x2f04a6.textContent = "⏸ Pause";
    _0x842cb.disabled = false;
    _0x520371.disabled = false;
    _0x24c54c.textContent = "RUNNING";
    _0x24c54c.style.background = "rgba(34, 197, 94, 0.2)";
    _0x24c54c.style.color = "#22c55e";
    _0x24c54c.style.borderColor = "#22c55e";
  } else if (_0x31433d === "paused") {
    _0x1cb802.disabled = true;
    _0x2f04a6.disabled = false;
    _0x2f04a6.textContent = "▶ Resume";
    _0x2f04a6.onclick = function () {
      if (window.veloce) {
        window.veloce.crawlerResume();
      }
      a0_0xadb0fd("running");
    };
    _0x842cb.disabled = false;
    _0x520371.disabled = true;
    _0x24c54c.textContent = "PAUSED";
    _0x24c54c.style.background = "rgba(234, 179, 8, 0.2)";
    _0x24c54c.style.color = "#eab308";
    _0x24c54c.style.borderColor = "#eab308";
  } else {
    _0x1cb802.disabled = false;
    _0x2f04a6.disabled = true;
    _0x2f04a6.textContent = "⏸ Pause";
    _0x2f04a6.onclick = function () {
      if (window.veloce) {
        window.veloce.crawlerPause();
      }
      a0_0xadb0fd("paused");
    };
    _0x842cb.disabled = true;
    _0x520371.disabled = true;
    _0x24c54c.textContent = _0x31433d === "stopped" ? "STOPPED" : "IDLE";
    _0x24c54c.style.background = "#1e293b";
    _0x24c54c.style.color = "#64748b";
    _0x24c54c.style.borderColor = "#334155";
  }
}
function a0_0x59de26(_0x455a50) {
  if (!_0x455a50 || !_0x455a50.stats) {
    return;
  }
  var _0x4d098a = _0x455a50.stats;
  function _0x2bfb31(_0x12541e) {
    return document.getElementById(_0x12541e);
  }
  if (_0x2bfb31("cw-stat-status")) {
    _0x2bfb31("cw-stat-status").textContent = _0x4d098a.status || "idle";
    _0x2bfb31("cw-stat-status").style.color = _0x4d098a.status === "running" ? "#22c55e" : _0x4d098a.status === "paused" ? "#eab308" : "#64748b";
  }
  if (_0x2bfb31("cw-stat-term")) {
    _0x2bfb31("cw-stat-term").textContent = _0x4d098a.currentTerm || "—";
  }
  if (_0x2bfb31("cw-stat-category")) {
    _0x2bfb31("cw-stat-category").textContent = _0x4d098a.currentCategory ? _0x4d098a.currentCategory.replace(/_/g, " ") : "—";
  }
  if (_0x2bfb31("cw-stat-term-num")) {
    _0x2bfb31("cw-stat-term-num").textContent = (_0x4d098a.termIndex || 0) + " / " + (_0x4d098a.totalTerms || 0);
  }
  if (_0x2bfb31("cw-stat-patterns")) {
    _0x2bfb31("cw-stat-patterns").textContent = _0x4d098a.patternsFound || 0;
  }
  if (_0x2bfb31("cw-stat-files")) {
    _0x2bfb31("cw-stat-files").textContent = _0x4d098a.filesFound || 0;
  }
  if (_0x2bfb31("cw-stat-domains")) {
    _0x2bfb31("cw-stat-domains").textContent = _0x455a50.patternsCount || 0;
  }
  if (_0x2bfb31("cw-stat-sites")) {
    _0x2bfb31("cw-stat-sites").textContent = _0x4d098a.sitesVisited || 0;
  }
  if (_0x2bfb31("cw-stat-pages")) {
    _0x2bfb31("cw-stat-pages").textContent = _0x4d098a.pagesVisited || 0;
  }
  if (_0x2bfb31("cw-stat-errors")) {
    _0x2bfb31("cw-stat-errors").textContent = _0x4d098a.errors || 0;
  }
  if (_0x2bfb31("cw-current-url")) {
    _0x2bfb31("cw-current-url").textContent = _0x4d098a.currentUrl ? _0x4d098a.currentUrl.slice(0, 100) : "";
  }
  if (_0x2bfb31("cw-stat-uptime") && _0x455a50.uptime > 0) {
    var _0x2fc73e = Math.floor(_0x455a50.uptime / 3600);
    var _0x44f8dc = Math.floor(_0x455a50.uptime % 3600 / 60);
    var _0x3a8633 = _0x455a50.uptime % 60;
    _0x2bfb31("cw-stat-uptime").textContent = (_0x2fc73e > 0 ? _0x2fc73e + "h " : "") + _0x44f8dc + "m " + _0x3a8633 + "s";
  }
  a0_0xadb0fd(_0x4d098a.status || "idle");
  var _0x232c53 = document.getElementById("cw-log");
  if (_0x232c53 && _0x455a50.log) {
    var _0x161314 = "";
    for (var _0x55bbf4 = _0x455a50.log.length - 1; _0x55bbf4 >= 0; _0x55bbf4--) {
      var _0x19c024 = _0x455a50.log[_0x55bbf4];
      var _0x4f8d9d = "#64748b";
      var _0x25920b = "·";
      if (_0x19c024.type === "success") {
        _0x4f8d9d = "#22c55e";
        _0x25920b = "✓";
      } else if (_0x19c024.type === "error") {
        _0x4f8d9d = "#ef4444";
        _0x25920b = "✗";
      } else if (_0x19c024.type === "found") {
        _0x4f8d9d = "#f59e0b";
        _0x25920b = "★";
      } else if (_0x19c024.type === "warning") {
        _0x4f8d9d = "#eab308";
        _0x25920b = "⚠";
      } else if (_0x19c024.type === "info") {
        _0x4f8d9d = "#94a3b8";
        _0x25920b = "·";
      }
      var _0x111686 = _0x19c024.time ? _0x19c024.time.split("T")[1].split(".")[0] : "";
      var _0x456d18 = _0x19c024.message || "";
      if (_0x19c024.type === "found") {
        _0x161314 += "<div style=\"color: " + _0x4f8d9d + "; padding: 1px 0; font-weight: bold;\"><span style=\"color: #475569; font-size: 10px;\">" + _0x111686 + "</span> " + _0x25920b + " " + a0_0x31ad57(_0x456d18) + "</div>";
      } else {
        _0x161314 += "<div style=\"color: " + _0x4f8d9d + "; padding: 1px 0;\"><span style=\"color: #334155; font-size: 10px;\">" + _0x111686 + "</span> " + _0x25920b + " " + a0_0x31ad57(_0x456d18) + "</div>";
      }
    }
    _0x232c53.innerHTML = _0x161314;
    _0x232c53.scrollTop = _0x232c53.scrollHeight;
  }
}
function a0_0x31ad57(_0x5ea9c7) {
  return _0x5ea9c7.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
document.getElementById("btn-crawler").onclick = function () {
  a0_0x5d169b();
};
if (window.veloce && window.veloce.onCrawlerUpdate) {
  window.veloce.onCrawlerUpdate(function (_0x36208e) {
    if (a0_0x2cde84) {
      a0_0x59de26(_0x36208e);
    }
  });
}
let a0_0x4b8212 = false;
let a0_0x46c0d7 = null;
const a0_0x8a47a6 = document.getElementById("profile-mode-panel");
const a0_0x3c9af7 = document.getElementById("tab-bar");
const a0_0x43f93d = document.getElementById("nav-bar");
function a0_0x3579bb() {
  a0_0x4b8212 = !a0_0x4b8212;
  const _0x2cb49e = document.getElementById("btn-profiles");
  if (a0_0x4b8212) {
    _0x2cb49e.classList.add("active");
    a0_0x8a47a6.style.display = "flex";
    a0_0x3c9af7.style.display = "none";
    a0_0x43f93d.style.display = "none";
    a0_0x26601e.style.display = "none";
    a0_0x14ea81();
  } else {
    _0x2cb49e.classList.remove("active");
    a0_0x8a47a6.style.display = "none";
    a0_0x3c9af7.style.display = "flex";
    a0_0x43f93d.style.display = "flex";
    a0_0x26601e.style.display = "block";
  }
}
function a0_0x14ea81() {
  if (!window.veloce || !window.veloce.profiles) {
    return;
  }
  window.veloce.profiles.list().then(function (_0x29be17) {
    const _0x2e7ad9 = document.getElementById("profile-tbody");
    const _0x1a6ea6 = (document.getElementById("profile-filter") || {}).value || "";
    const _0x123cb5 = _0x1a6ea6.toLowerCase().trim();
    const _0x20228b = _0x123cb5 ? _0x29be17.filter(function (_0x241d68) {
      return (_0x241d68.name || "").toLowerCase().indexOf(_0x123cb5) !== -1;
    }) : _0x29be17;
    _0x2e7ad9.innerHTML = "";
    _0x20228b.forEach(function (_0x7d67d, _0x5ee8a1) {
      const _0xeedb15 = document.createElement("tr");
      const _0x3a036e = _0x7d67d.proxy && _0x7d67d.proxy.host && _0x7d67d.proxy.port ? _0x7d67d.proxy.host + ":" + _0x7d67d.proxy.port : "—";
      const _0x39f7e3 = _0x7d67d.lastOpenedAt && new Date(_0x7d67d.lastOpenedAt).toLocaleString ? new Date(_0x7d67d.lastOpenedAt).toLocaleString() : "—";
      _0xeedb15.innerHTML = "<td>" + (_0x5ee8a1 + 1) + "</td><td>" + a0_0x31ad57(_0x7d67d.group || "") + "</td><td>" + a0_0x31ad57(_0x7d67d.name || "") + "</td><td>" + a0_0x31ad57(_0x3a036e) + "</td><td>" + a0_0x31ad57(_0x39f7e3) + "</td><td class=\"profile-actions\"><button class=\"open-profile\" data-id=\"" + a0_0x31ad57(_0x7d67d.id) + "\">Open</button><button class=\"edit-profile\" data-id=\"" + a0_0x31ad57(_0x7d67d.id) + "\">Config</button><button class=\"delete-profile delete-btn\" data-id=\"" + a0_0x31ad57(_0x7d67d.id) + "\">Delete</button></td>";
      _0x2e7ad9.appendChild(_0xeedb15);
    });
  }).catch(function (_0x3a6290) {
    console.error("Profile list failed:", _0x3a6290);
  });
}
function a0_0x39cfb6(_0x47fe08) {
  a0_0x46c0d7 = _0x47fe08 ? _0x47fe08.id : null;
  document.getElementById("profile-modal-title").textContent = _0x47fe08 ? "Edit profile" : "Add profile";
  document.getElementById("profile-form-name").value = _0x47fe08 ? _0x47fe08.name || "" : "";
  document.getElementById("profile-form-group").value = _0x47fe08 ? _0x47fe08.group || "" : "";
  const _0xd8e849 = _0x47fe08 && _0x47fe08.proxy ? _0x47fe08.proxy : {};
  document.getElementById("profile-form-proxy-type").value = _0xd8e849.type || "http";
  document.getElementById("profile-form-proxy-host").value = _0xd8e849.host || "";
  document.getElementById("profile-form-proxy-port").value = _0xd8e849.port || "";
  document.getElementById("profile-form-proxy-user").value = _0xd8e849.username || "";
  document.getElementById("profile-form-proxy-pass").value = _0xd8e849.password || "";
  const _0xf12fa = _0x47fe08 && _0x47fe08.fingerprint ? _0x47fe08.fingerprint : {};
  document.getElementById("profile-form-ua").value = _0xf12fa.userAgent || "";
  document.getElementById("profile-form-timezone").value = _0xf12fa.timezone || "";
  document.getElementById("profile-form-language").value = _0xf12fa.language || "";
  document.getElementById("profile-form-pc-type").value = _0xf12fa.pcType || "i7-32";
  document.getElementById("profile-form-gpu-type").value = _0xf12fa.gpuType || "rtx4060";
  document.getElementById("profile-form-ignore-https").checked = _0xf12fa.ignoreHttpsErrors === true;
  document.getElementById("profile-form-proxy-result").textContent = "";
  document.getElementById("profile-form-proxy-result").className = "";
  document.getElementById("profile-modal").style.display = "flex";
}
function a0_0x2e1f30() {
  document.getElementById("profile-modal").style.display = "none";
  a0_0x46c0d7 = null;
}
function a0_0x2933a6() {
  return {
    name: document.getElementById("profile-form-name").value.trim() || "Unnamed",
    group: document.getElementById("profile-form-group").value.trim(),
    proxy: {
      type: document.getElementById("profile-form-proxy-type").value || "http",
      host: document.getElementById("profile-form-proxy-host").value.trim(),
      port: document.getElementById("profile-form-proxy-port").value.trim(),
      username: document.getElementById("profile-form-proxy-user").value.trim(),
      password: document.getElementById("profile-form-proxy-pass").value
    },
    fingerprint: {
      userAgent: document.getElementById("profile-form-ua").value.trim() || undefined,
      timezone: document.getElementById("profile-form-timezone").value.trim() || undefined,
      language: document.getElementById("profile-form-language").value.trim() || undefined,
      pcType: document.getElementById("profile-form-pc-type").value || "i7-32",
      gpuType: document.getElementById("profile-form-gpu-type").value || "rtx4060",
      ignoreHttpsErrors: document.getElementById("profile-form-ignore-https").checked
    }
  };
}
function a0_0x5a6083() {
  const _0xe3ecba = a0_0x2933a6();
  if (!window.veloce || !window.veloce.profiles) {
    return;
  }
  if (a0_0x46c0d7) {
    window.veloce.profiles.update(a0_0x46c0d7, _0xe3ecba).then(function () {
      a0_0x2e1f30();
      a0_0x14ea81();
    }).catch(function (_0xcbfeeb) {
      alert("Update failed: " + (_0xcbfeeb && _0xcbfeeb.message ? _0xcbfeeb.message : _0xcbfeeb));
    });
  } else {
    window.veloce.profiles.add(_0xe3ecba).then(function () {
      a0_0x2e1f30();
      a0_0x14ea81();
    }).catch(function (_0x518d2b) {
      alert("Add failed: " + (_0x518d2b && _0x518d2b.message ? _0x518d2b.message : _0x518d2b));
    });
  }
}
document.getElementById("btn-profiles").onclick = a0_0x3579bb;
document.getElementById("profile-add-btn").onclick = function () {
  a0_0x39cfb6(null);
};
document.getElementById("profile-modal-close").onclick = a0_0x2e1f30;
document.getElementById("profile-modal-cancel").onclick = a0_0x2e1f30;
document.getElementById("profile-modal-save").onclick = a0_0x5a6083;
document.getElementById("profile-form-check-proxy").onclick = function () {
  var _0x515bec = a0_0x2933a6().proxy;
  var _0x23f74c = document.getElementById("profile-form-proxy-result");
  _0x23f74c.textContent = "Checking…";
  _0x23f74c.className = "";
  if (!window.veloce || !window.veloce.proxyCheck) {
    _0x23f74c.textContent = "N/A";
    return;
  }
  window.veloce.proxyCheck(_0x515bec).then(function (_0x419023) {
    _0x23f74c.textContent = _0x419023.ok ? "Working " + (_0x419023.host && _0x419023.port ? _0x419023.host + ":" + _0x419023.port : "") : _0x419023.message || "Failed";
    _0x23f74c.className = _0x419023.ok ? "ok" : "fail";
  }).catch(function (_0x631187) {
    _0x23f74c.textContent = _0x631187 && _0x631187.message ? _0x631187.message : "Check failed";
    _0x23f74c.className = "fail";
  });
};
document.getElementById("profile-filter").addEventListener("input", function () {
  a0_0x14ea81();
});
document.getElementById("profile-tbody").addEventListener("click", function (_0x4f2922) {
  const _0x2403e5 = _0x4f2922.target;
  if (!_0x2403e5.classList) {
    return;
  }
  const _0x1c504f = _0x2403e5.getAttribute && _0x2403e5.getAttribute("data-id");
  if (!_0x1c504f) {
    return;
  }
  if (_0x2403e5.classList.contains("open-profile")) {
    if (window.veloce && window.veloce.browserLaunch) {
      window.veloce.browserLaunch(_0x1c504f).then(function (_0x175cb6) {
        if (_0x175cb6 && _0x175cb6.ok === false && _0x175cb6.error) {
          alert(_0x175cb6.error);
        }
      }).catch(function (_0x5e4a79) {
        alert("Launch failed: " + (_0x5e4a79 && _0x5e4a79.message ? _0x5e4a79.message : _0x5e4a79));
      });
    }
  } else if (_0x2403e5.classList.contains("edit-profile")) {
    if (window.veloce && window.veloce.profiles) {
      window.veloce.profiles.get(_0x1c504f).then(function (_0x3ffa26) {
        if (_0x3ffa26) {
          a0_0x39cfb6(_0x3ffa26);
        }
      });
    }
  } else if (_0x2403e5.classList.contains("delete-profile")) {
    if (!confirm("Delete this profile?")) {
      return;
    }
    if (window.veloce && window.veloce.profiles) {
      window.veloce.profiles.remove(_0x1c504f).then(function () {
        a0_0x14ea81();
      });
    }
  }
});
const a0_0x45ae04 = document.getElementById("btn-hamburger");
const a0_0xf87277 = document.getElementById("hamburger-menu");
if (a0_0x45ae04 && a0_0xf87277) {
  a0_0x45ae04.onclick = _0x2c2d39 => {
    _0x2c2d39.stopPropagation();
    a0_0xf87277.style.display = a0_0xf87277.style.display === "block" ? "none" : "block";
    const _0x1cd0cc = a0_0x45ae04.getBoundingClientRect();
    a0_0xf87277.style.top = _0x1cd0cc.bottom + 5 + "px";
    a0_0xf87277.style.left = _0x1cd0cc.right - 220 + "px";
  };
  document.addEventListener("click", _0x19b412 => {
    if (!a0_0xf87277.contains(_0x19b412.target) && _0x19b412.target !== a0_0x45ae04) {
      a0_0xf87277.style.display = "none";
    }
  });
  document.getElementById("hmenu-history").onclick = () => {
    a0_0xf87277.style.display = "none";
    alert("History feature coming soon!");
  };
  document.getElementById("hmenu-bookmarks").onclick = () => {
    a0_0xf87277.style.display = "none";
    alert("Bookmarks feature coming soon!");
  };
  document.getElementById("hmenu-zoom-in").onclick = () => {
    a0_0xf87277.style.display = "none";
    const _0x51a3a5 = a0_0x59255a.find(_0x53ab88 => _0x53ab88.id === a0_0x2dacd0);
    if (_0x51a3a5 && _0x51a3a5.webview.setZoomLevel) {
      _0x51a3a5.webview.getZoomLevel().then(_0x5d444f => _0x51a3a5.webview.setZoomLevel(_0x5d444f + 0.5));
    }
  };
  document.getElementById("hmenu-zoom-out").onclick = () => {
    a0_0xf87277.style.display = "none";
    const _0x4b31ff = a0_0x59255a.find(_0x41de44 => _0x41de44.id === a0_0x2dacd0);
    if (_0x4b31ff && _0x4b31ff.webview.setZoomLevel) {
      _0x4b31ff.webview.getZoomLevel().then(_0x269bdb => _0x4b31ff.webview.setZoomLevel(_0x269bdb - 0.5));
    }
  };
  document.getElementById("hmenu-zoom-reset").onclick = () => {
    a0_0xf87277.style.display = "none";
    const _0x491c4f = a0_0x59255a.find(_0x2b8a0a => _0x2b8a0a.id === a0_0x2dacd0);
    if (_0x491c4f && _0x491c4f.webview.setZoomLevel) {
      _0x491c4f.webview.setZoomLevel(0);
    }
  };
  function a0_0x5bc88e(_0xff82a6) {
    var _0x4bf9e8 = document.getElementById("clear-data-modal");
    if (!_0x4bf9e8) {
      return;
    }
    var _0x3989af = document.getElementById("clear-opt-history");
    var _0x231c42 = document.getElementById("clear-opt-cookies");
    var _0x3c0bc0 = document.getElementById("clear-opt-cache");
    var _0x477404 = document.getElementById("clear-opt-storage");
    if (_0xff82a6) {
      if (_0x3989af) {
        _0x3989af.checked = !!_0xff82a6.history;
      }
      if (_0x231c42) {
        _0x231c42.checked = !!_0xff82a6.cookies;
      }
      if (_0x3c0bc0) {
        _0x3c0bc0.checked = !!_0xff82a6.cache;
      }
      if (_0x477404) {
        _0x477404.checked = !!_0xff82a6.storage;
      }
    } else {
      if (_0x3989af) {
        _0x3989af.checked = true;
      }
      if (_0x231c42) {
        _0x231c42.checked = true;
      }
      if (_0x3c0bc0) {
        _0x3c0bc0.checked = true;
      }
      if (_0x477404) {
        _0x477404.checked = false;
      }
    }
    var _0x598d7c = document.getElementById("clear-data-time-range");
    if (_0x598d7c) {
      _0x598d7c.value = "0";
    }
    _0x4bf9e8.style.display = "flex";
  }
  document.getElementById("hmenu-clear-cache").onclick = function () {
    a0_0xf87277.style.display = "none";
    a0_0x5bc88e({
      history: false,
      cookies: false,
      cache: true,
      storage: false
    });
  };
  document.getElementById("hmenu-clear-data").onclick = function () {
    a0_0xf87277.style.display = "none";
    a0_0x5bc88e({
      history: true,
      cookies: true,
      cache: true,
      storage: true
    });
  };
  document.getElementById("hmenu-settings").onclick = () => {
    a0_0xf87277.style.display = "none";
    a0_0xb19e16("veloce://settings");
  };
  document.getElementById("hmenu-devtools").onclick = () => {
    a0_0xf87277.style.display = "none";
    const _0x4447dc = a0_0x59255a.find(_0x3826df => _0x3826df.id === a0_0x2dacd0);
    if (_0x4447dc && _0x4447dc.webview.openDevTools) {
      _0x4447dc.webview.openDevTools();
    }
  };
}
function a0_0x3c571b(_0x222bdc) {
  var _0x2bac56 = document.getElementById("native-ad-bar");
  var _0x17652c = document.getElementById("browser-area");
  if (!_0x2bac56) {
    return;
  }
  var _0x5acf63 = /google\.(com|co\.[a-z]+)\/search/.test(_0x222bdc || "");
  if (_0x5acf63) {
    _0x2bac56.style.display = "flex";
    if (_0x17652c) {
      _0x17652c.classList.add("native-ad-active");
    }
    a0_0x3b06f6();
  } else {
    _0x2bac56.style.display = "none";
    if (_0x17652c) {
      _0x17652c.classList.remove("native-ad-active");
    }
  }
}
var a0_0x14d647 = false;
function a0_0x3b06f6() {
  if (a0_0x14d647) {
    return;
  }
  a0_0x14d647 = true;
  var _0x4f4fae = document.getElementById("native-ad-bar");
  if (_0x4f4fae) {
    _0x4f4fae.style.maxHeight = "0px";
    _0x4f4fae.style.opacity = "0";
    _0x4f4fae.style.overflow = "hidden";
    _0x4f4fae.style.transition = "max-height 0.4s ease, opacity 0.3s ease";
  }
  function _0xda1382() {
    var _0x3c42c0 = a0_0x59255a.find(function (_0x3e964c) {
      return _0x3e964c.id === a0_0x2dacd0;
    });
    if (!_0x3c42c0 || !_0x3c42c0.webview) {
      a0_0x14d647 = false;
      return;
    }
    if (!/google\.(com|co\.[a-z]+)\/search/.test(_0x3c42c0.url || "")) {
      a0_0x14d647 = false;
      return;
    }
    _0x3c42c0.webview.executeJavaScript("(function(){ var d=document,s=d.documentElement,b=d.body; var sh=Math.max(s.scrollHeight,b.scrollHeight); var st=s.scrollTop||b.scrollTop; var vh=window.innerHeight; var dist=sh-st-vh; return dist<0?0:dist; })()").then(function (_0x3cfe52) {
      var _0x3d7df6 = document.getElementById("native-ad-bar");
      if (!_0x3d7df6) {
        a0_0x14d647 = false;
        return;
      }
      var _0x24ded3 = 300;
      if (_0x3cfe52 <= 0) {
        _0x3d7df6.style.maxHeight = "70px";
        _0x3d7df6.style.opacity = "1";
      } else if (_0x3cfe52 < _0x24ded3) {
        var _0x261da8 = 1 - _0x3cfe52 / _0x24ded3;
        _0x3d7df6.style.maxHeight = _0x261da8 * 70 + "px";
        _0x3d7df6.style.opacity = _0x261da8;
      } else {
        _0x3d7df6.style.maxHeight = "0px";
        _0x3d7df6.style.opacity = "0";
      }
      setTimeout(_0xda1382, 200);
    }).catch(function () {
      a0_0x14d647 = false;
    });
  }
  _0xda1382();
}
a0_0xb19e16("veloce://newtab");