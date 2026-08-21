let tabs = [];
let activeTabId = null;
let sniffedUrls = [];
let downloads = [];
let snifferEnabled = false;
const tabsContainer = document.getElementById("tabs-container");
const browserArea = document.getElementById("browser-area");
const urlBar = document.getElementById("url-bar");
const statusText = document.getElementById("status-text");
const snifferStatus = document.getElementById("sniffer-status");
const dlTbody = document.getElementById("dl-tbody");
const dlActive = document.getElementById("dl-active");
function generateId() {
  return "tab-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
}
function createTab(_0x2ccda = "https://www.google.com", _0x4fbb21 = true) {
  const _0x41f209 = generateId();
  let _0x323b56;
  if (_0x2ccda === "veloce://settings") {
    _0x323b56 = document.createElement("div");
    _0x323b56.setAttribute("data-tab-id", _0x41f209);
    _0x323b56.className = "webview settings-view";
    _0x323b56.style.flex = "1";
    _0x323b56.style.width = "100%";
    _0x323b56.style.height = "100%";
    _0x323b56.style.overflow = "hidden";
    fetch("./browser-settings.html").then(_0x459269 => _0x459269.text()).then(_0x1604ed => {
      _0x323b56.innerHTML = _0x1604ed;
      setTimeout(() => {
        const _0x43eb35 = _0x323b56.querySelector("#btn-clear-cache");
        const _0x2cb8e1 = _0x323b56.querySelector("#btn-clear-data");
        const _0x2086fa = _0x323b56.querySelector("#alert-box");
        const _0x428739 = _0x323b56.querySelector("#btn-toggle-theme");
        function _0xaf5288(_0x21babb) {
          if (!_0x2086fa) {
            return;
          }
          _0x2086fa.textContent = _0x21babb;
          _0x2086fa.style.display = "block";
          setTimeout(() => {
            _0x2086fa.style.display = "none";
          }, 3000);
        }
        if (_0x43eb35) {
          _0x43eb35.onclick = () => {
            if (window.veloce && window.veloce.clearCache) {
              window.veloce.clearCache().then(() => _0xaf5288("Cache cleared successfully!")).catch(_0x2dce32 => _0xaf5288("Error: " + _0x2dce32.message));
            }
          };
        }
        if (_0x2cb8e1) {
          _0x2cb8e1.onclick = () => {
            if (confirm("Are you sure you want to delete all browsing data?")) {
              if (window.veloce && window.veloce.clearBrowsingData) {
                window.veloce.clearBrowsingData().then(() => _0xaf5288("Data deleted!")).catch(_0x3d4367 => _0xaf5288("Error: " + _0x3d4367.message));
              }
            }
          };
        }
        if (_0x428739) {
          _0x428739.onclick = () => {
            const _0xf5c936 = _0x323b56.querySelector(".dark-mode") || _0x323b56.querySelector(".light-mode") || _0x323b56.children[0];
            if (_0xf5c936 && _0xf5c936.classList.contains("dark-mode")) {
              _0xf5c936.classList.remove("dark-mode");
              const _0x13444d = _0x323b56.querySelector("#theme-sub");
              if (_0x13444d) {
                _0x13444d.textContent = "Light mode active";
              }
            } else if (_0xf5c936) {
              _0xf5c936.classList.add("dark-mode");
              const _0x33c3a5 = _0x323b56.querySelector("#theme-sub");
              if (_0x33c3a5) {
                _0x33c3a5.textContent = "Dark mode active";
              }
            }
          };
        }
        const _0x460b0b = _0x323b56.querySelectorAll(".nav-item");
        if (_0x460b0b.length >= 3) {
          var _0x4d0343 = {
            behavior: "smooth"
          };
          _0x460b0b[0].onclick = () => _0x323b56.querySelector("#sec-get-started").scrollIntoView(_0x4d0343);
          var _0x5b2434 = {
            behavior: "smooth"
          };
          _0x460b0b[1].onclick = () => _0x323b56.querySelector("#sec-privacy").scrollIntoView(_0x5b2434);
          var _0x313f4e = {
            behavior: "smooth"
          };
          _0x460b0b[2].onclick = () => _0x323b56.querySelector("#sec-appearance").scrollIntoView(_0x313f4e);
        }
      }, 100);
    });
  } else {
    _0x323b56 = document.createElement("webview");
    _0x323b56.setAttribute("src", _0x2ccda);
    _0x323b56.setAttribute("data-tab-id", _0x41f209);
    _0x323b56.setAttribute("allowpopups", "");
    _0x323b56.setAttribute("plugins", "");
    _0x323b56.setAttribute("autosize", "on");
    _0x323b56.setAttribute("partition", "persist:browser");
    _0x323b56.setAttribute("preload", "./stealth-preload.js");
    _0x323b56.setAttribute("useragent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");
    _0x323b56.setAttribute("webpreferences", "javascript=yes");
  }
  const _0x1ba927 = document.createElement("div");
  _0x1ba927.className = "tab";
  _0x1ba927.setAttribute("data-tab-id", _0x41f209);
  const _0x14ab19 = document.createElement("span");
  _0x14ab19.className = "tab-title";
  _0x14ab19.textContent = "New Tab";
  const _0x226e48 = document.createElement("button");
  _0x226e48.className = "tab-close";
  _0x226e48.textContent = "×";
  _0x226e48.onclick = _0x1195a1 => {
    _0x1195a1.stopPropagation();
    closeTab(_0x41f209);
  };
  _0x1ba927.appendChild(_0x14ab19);
  _0x1ba927.appendChild(_0x226e48);
  _0x1ba927.onclick = () => switchToTab(_0x41f209);
  _0x1ba927.oncontextmenu = _0x366227 => {
    _0x366227.preventDefault();
    showTabContextMenu(_0x41f209, _0x366227.clientX, _0x366227.clientY);
  };
  tabsContainer.appendChild(_0x1ba927);
  browserArea.appendChild(_0x323b56);
  var _0xa7e48d = {
    id: _0x41f209,
    webview: _0x323b56,
    tabEl: _0x1ba927,
    titleSpan: _0x14ab19,
    title: _0x2ccda === "veloce://settings" ? "Settings" : "New Tab",
    url: _0x2ccda
  };
  tabs.push(_0xa7e48d);
  if (_0x2ccda !== "veloce://settings") {
    _0x323b56.addEventListener("did-navigate", _0x5a7288 => {
      toggleNativeAd(_0x5a7288.url);
      const _0x2c0b95 = tabs.find(_0x4516d1 => _0x4516d1.id === _0x41f209);
      if (_0x2c0b95) {
        _0x2c0b95.url = _0x5a7288.url;
      }
      if (_0x41f209 === activeTabId) {
        urlBar.value = _0x5a7288.url;
        sniffedUrls = [];
        urlBar.classList.remove("media-detected");
        checkSmartVideoDetection(_0x5a7288.url);
      }
    });
    _0x323b56.addEventListener("did-navigate-in-page", _0x2062a3 => {
      toggleNativeAd(_0x2062a3.url);
      if (_0x2062a3.isMainFrame) {
        const _0x4dbbd8 = tabs.find(_0x4350fc => _0x4350fc.id === _0x41f209);
        if (_0x4dbbd8) {
          _0x4dbbd8.url = _0x2062a3.url;
        }
        if (_0x41f209 === activeTabId) {
          urlBar.value = _0x2062a3.url;
          sniffedUrls = [];
          urlBar.classList.remove("media-detected");
          checkSmartVideoDetection(_0x2062a3.url);
        }
      }
    });
    _0x323b56.addEventListener("page-title-updated", _0x19b514 => {
      const _0x5d7fbb = tabs.find(_0x473be6 => _0x473be6.id === _0x41f209);
      if (_0x5d7fbb) {
        _0x5d7fbb.title = _0x19b514.title;
        const _0xb8908c = _0x19b514.title.length > 25 ? _0x19b514.title.slice(0, 25) + "…" : _0x19b514.title;
        _0x5d7fbb.titleSpan.textContent = _0xb8908c;
        _0x5d7fbb.tabEl.title = _0x19b514.title;
      }
    });
    _0x323b56.addEventListener("new-window", _0x5937d6 => {
      createTab(_0x5937d6.url);
    });
  } else {
    _0x14ab19.textContent = "Settings";
  }
  if (_0x4fbb21) {
    switchToTab(_0x41f209);
  }
  return _0x41f209;
}
function switchToTab(_0x5039d8) {
  activeTabId = _0x5039d8;
  tabs.forEach(_0x191608 => {
    if (_0x191608.id === _0x5039d8) {
      _0x191608.webview.classList.add("active");
      _0x191608.tabEl.classList.add("active");
      urlBar.value = _0x191608.url || "";
    } else {
      _0x191608.webview.classList.remove("active");
      _0x191608.tabEl.classList.remove("active");
    }
  });
  sniffedUrls = [];
  urlBar.classList.remove("media-detected");
  hidePopup();
}
function closeTab(_0x56dc6b) {
  const _0x111b36 = tabs.findIndex(_0x3f2f43 => _0x3f2f43.id === _0x56dc6b);
  if (_0x111b36 === -1) {
    return;
  }
  if (tabs.length <= 1) {
    createTab("https://www.google.com");
  }
  const _0x2f7a65 = tabs[_0x111b36];
  _0x2f7a65.tabEl.remove();
  _0x2f7a65.webview.remove();
  tabs.splice(_0x111b36, 1);
  if (_0x56dc6b === activeTabId && tabs.length > 0) {
    const _0x4e7351 = Math.min(_0x111b36, tabs.length - 1);
    switchToTab(tabs[_0x4e7351].id);
  }
}
function duplicateTab(_0x2a19bf) {
  const _0x3ee9fd = tabs.find(_0x43943d => _0x43943d.id === _0x2a19bf);
  if (_0x3ee9fd) {
    createTab(_0x3ee9fd.url);
  }
}
function closeOtherTabs(_0xea587d) {
  const _0x1e727b = tabs.filter(_0x24c465 => _0x24c465.id !== _0xea587d).map(_0xbfa6cf => _0xbfa6cf.id);
  _0x1e727b.forEach(_0x214ff0 => closeTab(_0x214ff0));
}
let contextMenu = null;
function showTabContextMenu(_0x488182, _0x158884, _0x151e3d) {
  if (contextMenu) {
    contextMenu.remove();
  }
  contextMenu = document.createElement("div");
  contextMenu.style.cssText = "\n    position: fixed; top: " + _0x151e3d + "px; left: " + _0x158884 + "px; z-index: 9999;\n    background: #1e293b; border: 1px solid #334155; border-radius: 8px;\n    padding: 4px 0; min-width: 160px; box-shadow: 0 8px 24px rgba(0,0,0,.5);\n  ";
  const _0x32daf7 = [{
    label: "Duplicate Tab",
    action: () => duplicateTab(_0x488182)
  }, {
    label: "New Tab",
    action: () => createTab()
  }, {
    label: "—",
    action: null
  }, {
    label: "Close Tab",
    action: () => closeTab(_0x488182)
  }, {
    label: "Close Other Tabs",
    action: () => closeOtherTabs(_0x488182)
  }];
  _0x32daf7.forEach(_0x4b8722 => {
    if (_0x4b8722.label === "—") {
      const _0x3d0dff = document.createElement("div");
      _0x3d0dff.style.cssText = "height: 1px; background: #334155; margin: 4px 0;";
      contextMenu.appendChild(_0x3d0dff);
      return;
    }
    const _0x2f023a = document.createElement("div");
    _0x2f023a.textContent = _0x4b8722.label;
    _0x2f023a.style.cssText = "\n      padding: 6px 16px; cursor: pointer; color: #e0e0e0; font-size: 13px;\n    ";
    _0x2f023a.onmouseenter = () => _0x2f023a.style.background = "#2563eb";
    _0x2f023a.onmouseleave = () => _0x2f023a.style.background = "transparent";
    _0x2f023a.onclick = () => {
      _0x4b8722.action();
      contextMenu.remove();
      contextMenu = null;
    };
    contextMenu.appendChild(_0x2f023a);
  });
  document.body.appendChild(contextMenu);
  const _0x212ce5 = _0x238226 => {
    if (contextMenu && !contextMenu.contains(_0x238226.target)) {
      contextMenu.remove();
      contextMenu = null;
      document.removeEventListener("click", _0x212ce5);
    }
  };
  setTimeout(() => document.addEventListener("click", _0x212ce5), 10);
}
function navigate(_0x365c26) {
  const _0x4a5cca = tabs.find(_0x1b7364 => _0x1b7364.id === activeTabId);
  if (!_0x4a5cca) {
    return;
  }
  if (!_0x365c26.startsWith("http://") && !_0x365c26.startsWith("https://")) {
    if (_0x365c26.includes(".") && !_0x365c26.includes(" ")) {
      _0x365c26 = "https://" + _0x365c26;
    } else {
      _0x365c26 = "https://www.google.com/search?q=" + encodeURIComponent(_0x365c26);
    }
  }
  if (!_0x4a5cca.webview.loadURL) {
    createTab(_0x365c26);
    return;
  }
  _0x4a5cca.webview.loadURL(_0x365c26);
  _0x4a5cca.url = _0x365c26;
  urlBar.value = _0x365c26;
}
document.getElementById("btn-back").onclick = () => {
  const _0x581dcb = tabs.find(_0x2d49d3 => _0x2d49d3.id === activeTabId);
  if (_0x581dcb && _0x581dcb.webview.canGoBack()) {
    _0x581dcb.webview.goBack();
  }
};
document.getElementById("btn-forward").onclick = () => {
  const _0x559ee8 = tabs.find(_0x49bdf6 => _0x49bdf6.id === activeTabId);
  if (_0x559ee8 && _0x559ee8.webview.canGoForward()) {
    _0x559ee8.webview.goForward();
  }
};
document.getElementById("btn-reload").onclick = () => {
  const _0x46b059 = tabs.find(_0x3e5b37 => _0x3e5b37.id === activeTabId);
  if (_0x46b059) {
    _0x46b059.webview.reload();
  }
};
urlBar.addEventListener("keydown", _0x36f900 => {
  if (_0x36f900.key === "Enter") {
    navigate(urlBar.value.trim());
  }
});
document.getElementById("btn-new-tab").onclick = () => createTab();
document.getElementById("btn-open-browser").onclick = () => {
  const _0x25ad61 = tabs.find(_0x1e9765 => _0x1e9765.id === activeTabId);
  if (_0x25ad61 && _0x25ad61.url && window.veloce) {
    window.veloce.openInBrowser(_0x25ad61.url);
    statusText.textContent = "Opened in system browser";
  }
};
const floatingPopup = document.createElement("div");
floatingPopup.id = "floating-dl-popup";
floatingPopup.style.cssText = "\n  display: none;\n  position: absolute;\n  top: 8px;\n  right: 12px;\n  z-index: 99999;\n  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);\n  border: 2px solid #2563eb;\n  border-radius: 12px;\n  padding: 0;\n  min-width: 380px;\n  max-width: 500px;\n  box-shadow: 0 8px 32px rgba(37,99,235,.4), 0 0 0 1px rgba(37,99,235,.2);\n  font-family: 'Segoe UI', Arial, sans-serif;\n  overflow: hidden;\n";
floatingPopup.innerHTML = "\n  <div id=\"popup-header\" style=\"\n    display: flex; justify-content: space-between; align-items: center;\n    padding: 10px 14px;\n    background: linear-gradient(135deg, #2563eb, #7c3aed);\n    cursor: default;\n  \">\n    <span style=\"color: #fff; font-weight: bold; font-size: 13px;\">\n      ▶ Download this video\n    </span>\n    <div style=\"display: flex; gap: 6px;\">\n      <button id=\"popup-dl-all\" style=\"\n        background: #22c55e; color: #fff; border: none; border-radius: 6px;\n        padding: 4px 12px; font-size: 12px; font-weight: bold; cursor: pointer;\n      \">Download all</button>\n      <button id=\"popup-close\" style=\"\n        background: rgba(255,255,255,.2); color: #fff; border: none;\n        border-radius: 50%; width: 22px; height: 22px; font-size: 14px;\n        cursor: pointer; line-height: 1;\n      \">×</button>\n    </div>\n  </div>\n  <div id=\"popup-list\" style=\"\n    max-height: 200px; overflow-y: auto; padding: 6px 0;\n  \"></div>\n";
browserArea.appendChild(floatingPopup);
function getUrlLabel(_0x20da8d) {
  const _0x4e5f8b = _0x20da8d.toLowerCase();
  const _0x53ee27 = _0x20da8d.split("/").pop().split("?")[0] || "stream";
  const _0x2ae508 = _0x53ee27.length > 50 ? _0x53ee27.slice(0, 50) + "…" : _0x53ee27;
  let _0x23893c = "File";
  if (_0x4e5f8b.includes(".m3u8")) {
    _0x23893c = "HLS stream";
  } else if (_0x4e5f8b.includes(".mpd")) {
    _0x23893c = "DASH stream";
  } else if (_0x4e5f8b.includes(".mp4")) {
    _0x23893c = "MP4";
  } else if (_0x4e5f8b.includes(".ts")) {
    _0x23893c = "TS segment";
  } else if (_0x4e5f8b.includes(".webm")) {
    _0x23893c = "WebM";
  } else if (_0x4e5f8b.includes("videoplayback")) {
    _0x23893c = "Video";
  } else if (_0x4e5f8b.includes("/hls/")) {
    _0x23893c = "HLS";
  } else if (_0x4e5f8b.includes("/dash/")) {
    _0x23893c = "DASH";
  } else if (_0x4e5f8b.includes("/stream/")) {
    _0x23893c = "Stream";
  } else if (_0x4e5f8b.includes("/chunk-") || _0x4e5f8b.includes("/segment")) {
    _0x23893c = "Segment";
  }
  var _0x3f0c3 = {
    shortName: _0x2ae508,
    type: _0x23893c
  };
  return _0x3f0c3;
}
function getBestSniffedUrl() {
  if (sniffedUrls.length === 0) {
    return null;
  }
  let _0x15bdac = sniffedUrls[sniffedUrls.length - 1];
  for (const _0x4f655d of sniffedUrls) {
    const _0x250fba = _0x4f655d.toLowerCase();
    if (_0x250fba.includes(".m3u8") || _0x250fba.includes(".mpd")) {
      _0x15bdac = _0x4f655d;
      break;
    }
  }
  return _0x15bdac;
}
function updatePopupList() {
  const _0x5f301d = document.getElementById("popup-list");
  _0x5f301d.innerHTML = "";
  const _0x99aea1 = getBestSniffedUrl();
  if (!_0x99aea1) {
    return;
  }
  const {
    shortName: _0x516237,
    type: _0x38b369
  } = getUrlLabel(_0x99aea1);
  const _0x47d6a1 = document.createElement("div");
  _0x47d6a1.style.cssText = "\n    display: flex; justify-content: space-between; align-items: center;\n    padding: 6px 14px; cursor: default; transition: background .1s;\n  ";
  _0x47d6a1.onmouseenter = () => _0x47d6a1.style.background = "rgba(37,99,235,.15)";
  _0x47d6a1.onmouseleave = () => _0x47d6a1.style.background = "transparent";
  const _0x5d45d7 = document.createElement("div");
  _0x5d45d7.style.cssText = "flex: 1; min-width: 0; margin-right: 8px;";
  _0x5d45d7.innerHTML = "\n    <div style=\"color: #e0e0e0; font-size: 12px; white-space: nowrap;\n      overflow: hidden; text-overflow: ellipsis;\" title=\"" + _0x99aea1 + "\">\n      1. " + _0x516237 + "\n    </div>\n    <div style=\"color: #64748b; font-size: 11px;\">" + _0x38b369 + "</div>\n  ";
  const _0x4455f7 = document.createElement("button");
  _0x4455f7.textContent = "⬇";
  _0x4455f7.title = "Download this file";
  _0x4455f7.style.cssText = "\n    background: #2563eb; color: #fff; border: none; border-radius: 6px;\n    padding: 4px 10px; font-size: 13px; cursor: pointer; flex-shrink: 0;\n  ";
  _0x4455f7.onmouseenter = () => _0x4455f7.style.background = "#1d4ed8";
  _0x4455f7.onmouseleave = () => _0x4455f7.style.background = "#2563eb";
  _0x4455f7.onclick = () => {
    const _0x424460 = _0x99aea1.split("/").pop().split("?")[0] || "download";
    const _0x488aad = tabs.find(_0x178338 => _0x178338.id === activeTabId);
    startDownload(_0x99aea1, _0x424460.length > 60 ? _0x424460.slice(0, 60) : _0x424460, _0x488aad ? _0x488aad.url : "");
  };
  _0x47d6a1.appendChild(_0x5d45d7);
  _0x47d6a1.appendChild(_0x4455f7);
  _0x5f301d.appendChild(_0x47d6a1);
}
function showPopup() {
  updatePopupList();
  floatingPopup.style.display = "block";
}
function hidePopup() {
  floatingPopup.style.display = "none";
}
document.getElementById("popup-close").onclick = hidePopup;
document.getElementById("popup-dl-all").onclick = () => {
  if (sniffedUrls.length === 0) {
    return;
  }
  let _0x3ec544 = sniffedUrls[sniffedUrls.length - 1];
  for (const _0x21a508 of sniffedUrls) {
    const _0x1e9e8b = _0x21a508.toLowerCase();
    if (_0x1e9e8b.includes(".m3u8") || _0x1e9e8b.includes(".mpd")) {
      _0x3ec544 = _0x21a508;
      break;
    }
  }
  const _0x49648c = _0x3ec544.split("/").pop().split("?")[0] || "download";
  const _0x42b9a3 = tabs.find(_0xf2ab85 => _0xf2ab85.id === activeTabId);
  startDownload(_0x3ec544, _0x49648c.length > 60 ? _0x49648c.slice(0, 60) : _0x49648c, _0x42b9a3 ? _0x42b9a3.url : "");
  const _0x1a9e62 = document.getElementById("popup-dl-all");
  _0x1a9e62.textContent = "Downloading...";
  _0x1a9e62.style.background = "#666";
  setTimeout(() => {
    _0x1a9e62.textContent = "Download all";
    _0x1a9e62.style.background = "#22c55e";
  }, 3000);
};
if (window.veloce && window.veloce.onOpenUrlInTab) {
  window.veloce.onOpenUrlInTab(function (_0x1789cb) {
    createTab(_0x1789cb);
  });
}
if (window.veloce && window.veloce.onCefLaunchError) {
  window.veloce.onCefLaunchError(function (_0x30b888) {
    if (_0x30b888) {
      alert(_0x30b888);
    }
  });
}
if (window.veloce) {
  window.veloce.onMediaDetected(_0x52fe77 => {
    if (!snifferEnabled) {
      return;
    }
    if (document.getElementById("smart-dl-popup") && document.getElementById("smart-dl-popup").style.display !== "none") {
      return;
    }
    const _0x4525c0 = tabs.find(_0x4cec3a => _0x4cec3a.id === activeTabId);
    const _0x243995 = _0x4525c0 ? (_0x4525c0.url || "").toLowerCase() : "";
    const _0x27daf5 = ["youtube.com/watch", "youtu.be/", "tiktok.com/@", "instagram.com/reel", "instagram.com/p/", "twitter.com/", "x.com/", "vimeo.com/", "twitch.tv/", "dailymotion.com/video", "reddit.com/r/"];
    for (const _0x1a8ac9 of _0x27daf5) {
      if (_0x243995.indexOf(_0x1a8ac9) !== -1) {
        return;
      }
    }
    const _0x18707a = _0x52fe77.url;
    if (!sniffedUrls.includes(_0x18707a)) {
      sniffedUrls.push(_0x18707a);
      statusText.textContent = "Media detected: " + _0x52fe77.pattern + " — " + _0x18707a.slice(0, 80);
      urlBar.classList.add("media-detected");
      showPopup();
    }
  });
}
const WATCH_PATTERNS = [{
  site: "YouTube",
  test: _0x37fbf2 => /youtube\.com\/watch\?/.test(_0x37fbf2) || /youtu\.be\/[a-zA-Z0-9_-]+/.test(_0x37fbf2)
}, {
  site: "TikTok",
  test: _0x6acaae => /tiktok\.com\/@[^/]+\/video\//.test(_0x6acaae)
}, {
  site: "Instagram",
  test: _0x4540b9 => /instagram\.com\/(reel|p)\//.test(_0x4540b9)
}, {
  site: "Twitter",
  test: _0x155fdd => /(twitter\.com|x\.com)\/[^/]+\/status\//.test(_0x155fdd)
}, {
  site: "Reddit",
  test: _0x4b669b => /reddit\.com\/r\/[^/]+\/comments\//.test(_0x4b669b)
}, {
  site: "Facebook",
  test: _0xd005a4 => /facebook\.com\/.*(\/videos\/|\/watch\/)/.test(_0xd005a4)
}, {
  site: "Vimeo",
  test: _0x2fc98a => /vimeo\.com\/\d+/.test(_0x2fc98a)
}, {
  site: "Twitch",
  test: _0x28148a => /twitch\.tv\/videos\/\d+/.test(_0x28148a) || /clips\.twitch\.tv\//.test(_0x28148a)
}, {
  site: "Dailymotion",
  test: _0x35e65c => /dailymotion\.com\/video\//.test(_0x35e65c)
}, {
  site: "SoundCloud",
  test: _0x45e733 => /soundcloud\.com\/[^/]+\/[^/]+/.test(_0x45e733) && !/soundcloud\.com\/(you|discover|stream|search)/.test(_0x45e733)
}];
let lastExtractedUrl = "";
let smartDetectionActive = false;
let currentVideoInfo = null;
function isWatchPage(_0x497a3b) {
  const _0x4f0f65 = _0x497a3b.toLowerCase();
  for (const _0x4255f6 of WATCH_PATTERNS) {
    if (_0x4255f6.test(_0x4f0f65)) {
      return _0x4255f6.site;
    }
  }
  return null;
}
function checkSmartVideoDetection(_0x5327ab) {
  if (!_0x5327ab || !window.veloce || !window.veloce.extractVideoInfo) {
    return;
  }

  // ── YouTube: extract formats directly from the page DOM (no yt-dlp, no sniffer needed) ──
  var isYouTube = _0x5327ab.indexOf('youtube.com') !== -1 || _0x5327ab.indexOf('youtu.be') !== -1;
  if (isYouTube) {
    const _0x5e461c = isWatchPage(_0x5327ab);
    if (!_0x5e461c) { hideSmartPopup(); return; }
    const _0x3eb267 = _0x5327ab.split("&list=")[0].split("&index=")[0];
    if (smartDetectionActive) return;
    smartDetectionActive = true;
    lastExtractedUrl = _0x3eb267;
    urlBar.classList.add("media-detected");
    statusText.textContent = "🔍 Detecting video on YouTube...";
    detectYouTubeFormats(_0x3eb267);
    return;
  }

  // ── Non-YouTube: requires sniffer to be enabled ──
  if (!snifferEnabled) {
    return;
  }
  const _0x5e461c = isWatchPage(_0x5327ab);
  if (!_0x5e461c) {
    hideSmartPopup();
    return;
  }
  const _0x3eb267 = _0x5327ab.split("&list=")[0].split("&index=")[0];
  if (_0x3eb267 === lastExtractedUrl) {
    return;
  }
  lastExtractedUrl = _0x3eb267;
  if (smartDetectionActive) {
    return;
  }
  smartDetectionActive = true;
  statusText.textContent = "🔍 Detecting video on " + _0x5e461c + "...";
  urlBar.classList.add("media-detected");

  window.veloce.extractVideoInfo(_0x3eb267).then(function (_0x2f3b1c) {
    smartDetectionActive = false;
    if (!_0x2f3b1c || !_0x2f3b1c.ok) {
      statusText.textContent = "Detection failed: " + (_0x2f3b1c ? _0x2f3b1c.error : "unknown").slice(0, 60);
      return;
    }
    currentVideoInfo = _0x2f3b1c;
    statusText.textContent = "✓ Video found: " + _0x2f3b1c.title.slice(0, 60);
    showSmartPopup(_0x2f3b1c);
  }).catch(function (_0x39c134) {
    smartDetectionActive = false;
    statusText.textContent = "Detection error: " + _0x39c134.message;
  });
}

// ── YouTube native format extraction — reads ytInitialPlayerResponse from page DOM ──
// No yt-dlp, no external requests, no bot detection. Works like IDM: reads what the browser already has.
// Track auto-refresh so we only do it once per detection
var _ytAutoRefreshed = {};
function detectYouTubeFormats(url) {
  var activeTab = tabs.find(function(t) { return t.id === activeTabId; });
  if (!activeTab || !activeTab.webview) {
    smartDetectionActive = false;
    statusText.textContent = "No active browser tab";
    return;
  }

  // YouTube itag → resolution map
  var itagMap = {
    '18':  { label: '360p',  ext: 'mp4', hasVideo: true,  hasAudio: true  },
    '22':  { label: '720p',  ext: 'mp4', hasVideo: true,  hasAudio: true  },
    '37':  { label: '1080p', ext: 'mp4', hasVideo: true,  hasAudio: true  },
    '133': { label: '240p',  ext: 'mp4', hasVideo: true,  hasAudio: false },
    '134': { label: '360p',  ext: 'mp4', hasVideo: true,  hasAudio: false },
    '135': { label: '480p',  ext: 'mp4', hasVideo: true,  hasAudio: false },
    '136': { label: '720p',  ext: 'mp4', hasVideo: true,  hasAudio: false },
    '137': { label: '1080p', ext: 'mp4', hasVideo: true,  hasAudio: false },
    '394': { label: '144p',  ext: 'mp4', hasVideo: true,  hasAudio: false },
    '395': { label: '240p',  ext: 'mp4', hasVideo: true,  hasAudio: false },
    '396': { label: '360p',  ext: 'mp4', hasVideo: true,  hasAudio: false },
    '397': { label: '480p',  ext: 'mp4', hasVideo: true,  hasAudio: false },
    '398': { label: '720p',  ext: 'mp4', hasVideo: true,  hasAudio: false },
    '399': { label: '1080p', ext: 'mp4', hasVideo: true,  hasAudio: false },
    '242': { label: '240p',  ext: 'webm', hasVideo: true,  hasAudio: false },
    '243': { label: '360p',  ext: 'webm', hasVideo: true,  hasAudio: false },
    '244': { label: '480p',  ext: 'webm', hasVideo: true,  hasAudio: false },
    '247': { label: '720p',  ext: 'webm', hasVideo: true,  hasAudio: false },
    '248': { label: '1080p', ext: 'webm', hasVideo: true,  hasAudio: false },
    '298': { label: '720p60', ext: 'mp4', hasVideo: true,  hasAudio: false },
    '299': { label: '1080p60', ext: 'mp4', hasVideo: true,  hasAudio: false },
    '139': { label: '48k',   ext: 'm4a', hasVideo: false, hasAudio: true  },
    '140': { label: '128k',  ext: 'm4a', hasVideo: false, hasAudio: true  },
    '160': { label: '144k',  ext: 'm4a', hasVideo: false, hasAudio: true  },
    '249': { label: '50k',   ext: 'webm', hasVideo: false, hasAudio: true  },
    '250': { label: '70k',   ext: 'webm', hasVideo: false, hasAudio: true  },
    '251': { label: '160k',  ext: 'webm', hasVideo: false, hasAudio: true  },
    '278': { label: '360p',  ext: 'webm', hasVideo: true,  hasAudio: false },
  };

  try {
    activeTab.webview.executeJavaScript(
      '(function(){ try { var scripts = document.querySelectorAll("script"); var p = null; ' +
      'for (var i=0;i<scripts.length;i++) ' +
      '{ if (scripts[i].textContent.indexOf("ytInitialPlayerResponse") !== -1) { p = scripts[i]; break; } } ' +
      'if (!p) return JSON.stringify({error:"no player response"}); ' +
      'var t = p.textContent; var start = t.indexOf(\"ytInitialPlayerResponse\"); ' +
      'start = t.indexOf(\"{\", start); if (start === -1) return JSON.stringify({error:\"no json\"}); ' +
      'var depth = 0, inStr = false, esc = false, end = start; ' +
      'for (var j = start; j < t.length; j++) { var ch = t[j]; ' +
      'if (esc) { esc = false; continue; } ' +
      'if (ch === \"\\\\\") { esc = true; continue; } ' +
      'if (ch === \"\\\"\") { inStr = !inStr; continue; } ' +
      'if (inStr) continue; ' +
      'if (ch === \"{\") depth++; else if (ch === \"}\") { depth--; if (depth === 0) { end = j; break; } } } ' +
      'var json = t.substring(start, end + 1); ' +
      'return json; } catch(e) { return JSON.stringify({error:e.message}); } })()'
    ).then(function(result) {
      smartDetectionActive = false;
      if (!result) {
        var _cleanUrl2 = url.split("?")[0];
        if (!_ytAutoRefreshed[_cleanUrl2]) {
          _ytAutoRefreshed[_cleanUrl2] = true;
          smartDetectionActive = false;
          statusText.textContent = "Loading YouTube player data...";
          setTimeout(function() { activeTab.webview.reload(); }, 300);
          return;
        }
        statusText.textContent = "No YouTube player data found — try refreshing the page";
        return;
      }

      var playerData;
      try { playerData = JSON.parse(result); } catch(e) {
        statusText.textContent = "Failed to parse YouTube data";
        return;
      }

      if (playerData.error) {
        // First load often doesn't have the player response in DOM yet.
        // Auto-refresh once — after reload the data is always available.
        var _cleanUrl = url.split("?")[0];
        if (!_ytAutoRefreshed[_cleanUrl]) {
          _ytAutoRefreshed[_cleanUrl] = true;
          smartDetectionActive = false;
          statusText.textContent = "Loading YouTube player data...";
          setTimeout(function() { activeTab.webview.reload(); }, 300);
          return;
        }
        statusText.textContent = "YouTube detection error: " + playerData.error;
        return;
      }

      var videoDetails = playerData.videoDetails || {};
      var streamingData = playerData.streamingData || {};
      var allFormats = (streamingData.formats || []).concat(streamingData.adaptiveFormats || []);
      var thumbnails = (videoDetails.thumbnail && videoDetails.thumbnail.thumbnails) || [];

      if (allFormats.length === 0) {
        statusText.textContent = "No formats found — video may be age-restricted or private";
        return;
      }

      // Build clean format list (same structure as buildCleanFormatResult)
      var seen = {};
      var cleanFormats = [];
      for (var i = 0; i < allFormats.length; i++) {
        var f = allFormats[i];
        var itag = String(f.itag);
        var mapped = itagMap[itag];
        if (!mapped) continue;
        if (seen[mapped.label]) continue;
        seen[mapped.label] = true;

        var cl = parseInt(f.contentLength) || 0;
        var hasUrl = !!f.url;
        var hasCipher = !!f.signatureCipher;
        cleanFormats.push({
          id: itag,
          label: mapped.label,
          _hasUrl: hasUrl, _hasCipher: hasCipher,
          ext: mapped.ext,
          height: mapped.hasVideo ? parseInt(mapped.label) || 0 : 0,
          fps: mapped.label.indexOf('60') !== -1 ? 60 : 0,
          filesize: cl,
          filesizeStr: cl > 0 ? (cl > 1073741824 ? (cl / 1073741824).toFixed(1) + ' GB' : (cl / 1048576).toFixed(0) + ' MB') : '',
          hasVideo: mapped.hasVideo,
          hasAudio: mapped.hasAudio,
          directUrl: f.url || f.signatureCipher || '',
        });
      }

      // Sort by quality highest first
      cleanFormats.sort(function(a, b) { return b.height - a.height; });

      var videoFormats = cleanFormats.filter(function(f) { return f.hasVideo; }).slice(0, 5);
      var audioFormats = cleanFormats.filter(function(f) { return !f.hasVideo && f.hasAudio; }).slice(0, 2);

      var duration = parseInt(videoDetails.lengthSeconds) || 0;
      var durationStr = '';
      if (duration > 0) {
        if (duration > 3600) {
          durationStr = Math.floor(duration / 3600) + ':' + ('0' + Math.floor((duration % 3600) / 60)).slice(-2) + ':' + ('0' + (duration % 60)).slice(-2);
        } else {
          durationStr = Math.floor(duration / 60) + ':' + ('0' + (duration % 60)).slice(-2);
        }
      }

      var info = {
        ok: true,
        title: videoDetails.title || 'YouTube Video',
        thumbnail: thumbnails.length > 0 ? thumbnails[thumbnails.length - 1].url : '',
        duration: duration,
        durationStr: durationStr,
        uploader: videoDetails.author || '',
        extractor: 'youtube (native)',
        formats: videoFormats,
        audioFormats: audioFormats,
        pageUrl: url,
      };

      // Store direct URLs globally so click handlers can access them
      window._youtubeDirectUrls = {};
      for (var yi = 0; yi < videoFormats.length; yi++) {
        if (videoFormats[yi].directUrl) window._youtubeDirectUrls[videoFormats[yi].label] = { url: videoFormats[yi].directUrl, ext: videoFormats[yi].ext };
      }
      for (var yj = 0; yj < audioFormats.length; yj++) {
        if (audioFormats[yj].directUrl) window._youtubeDirectUrls[audioFormats[yj].label] = { url: audioFormats[yj].directUrl, ext: audioFormats[yj].ext };
      }
      currentVideoInfo = info;
      statusText.textContent = '✓ Video found: ' + info.title.slice(0, 60);
      showSmartPopup(info);

      // Store direct URLs globally — the popup's existing click handler
      // checks window._youtubeDirectUrls before calling yt-dlp.
      if (window.veloce && window.veloce.ytDebug) {
        window.veloce.ytDebug(JSON.stringify({ stored: Object.keys(window._youtubeDirectUrls), formats: cleanFormats.slice(0,8).map(function(f){ return {id:f.id,label:f.label,u:!!f._hasUrl,c:!!f._hasCipher,du:!!f.directUrl}; }) }));
      }
    }).catch(function(err) {
      smartDetectionActive = false;
      statusText.textContent = "YouTube extraction error: " + err.message;
    });
  } catch(e) {
    smartDetectionActive = false;
    statusText.textContent = "YouTube detection failed: " + e.message;
  }
}

const smartPopup = document.createElement("div");
smartPopup.id = "smart-dl-popup";
smartPopup.style.cssText = "\n  display: none;\n  position: absolute;\n  top: 8px;\n  right: 12px;\n  z-index: 99999;\n  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);\n  border: 2px solid #7c3aed;\n  border-radius: 14px;\n  padding: 0;\n  width: 420px;\n  box-shadow: 0 12px 40px rgba(124,58,237,.4), 0 0 0 1px rgba(124,58,237,.2);\n  font-family: 'Segoe UI', Arial, sans-serif;\n  overflow: hidden;\n";
browserArea.appendChild(smartPopup);
function showSmartPopup(_0x235124) {
  hidePopup();
  const _0x836f9f = _0x235124.durationStr ? " • " + _0x235124.durationStr : "";
  const _0x1ac471 = _0x235124.uploader ? " • " + _0x235124.uploader : "";
  let _0x2b0e1b = "";
  if (_0x235124.formats && _0x235124.formats.length > 0) {
    for (let _0x15fb6f = 0; _0x15fb6f < _0x235124.formats.length; _0x15fb6f++) {
      const _0x177983 = _0x235124.formats[_0x15fb6f];
      const _0x4595a7 = _0x15fb6f === 0;
      const _0x13f0bd = _0x177983.filesizeStr ? " (" + _0x177983.filesizeStr + ")" : "";
      _0x2b0e1b += "\n        <div class=\"smart-fmt-row\" data-format-id=\"" + _0x177983.label + "\" data-audio=\"false\"\n             style=\"display: flex; align-items: center; gap: 8px; padding: 5px 14px;\n                    cursor: pointer; transition: background .15s;\n                    " + (_0x4595a7 ? "background: rgba(124,58,237,.15);" : "") + "\"\n             onmouseenter=\"this.style.background='rgba(124,58,237,.2)'\"\n             onmouseleave=\"this.style.background='" + (_0x4595a7 ? "rgba(124,58,237,.15)" : "transparent") + "'\">\n          <span style=\"color: #a78bfa; font-size: 13px; font-weight: bold; min-width: 65px;\">🎬 " + _0x177983.label + "</span>\n          <span style=\"color: #64748b; font-size: 11px; flex: 1;\">" + _0x177983.ext.toUpperCase() + _0x13f0bd + "</span>\n          <button class=\"smart-dl-btn\" style=\"\n            background: #7c3aed; color: #fff; border: none; border-radius: 6px;\n            padding: 3px 10px; font-size: 11px; cursor: pointer; font-weight: bold;\n          \">⬇ MP4</button>\n        </div>";
    }
  }
  _0x2b0e1b += "\n    <div style=\"height: 1px; background: #334155; margin: 2px 14px;\"></div>\n    <div class=\"smart-fmt-row\" data-format-id=\"audio\" data-audio=\"true\"\n         style=\"display: flex; align-items: center; gap: 8px; padding: 5px 14px;\n                cursor: pointer; transition: background .15s;\"\n         onmouseenter=\"this.style.background='rgba(34,197,94,.15)'\"\n         onmouseleave=\"this.style.background='transparent'\">\n      <span style=\"color: #22c55e; font-size: 13px; font-weight: bold; min-width: 65px;\">🎵 Audio</span>\n      <span style=\"color: #64748b; font-size: 11px; flex: 1;\">MP3 (Best quality)</span>\n      <button class=\"smart-dl-btn\" data-audio=\"true\" style=\"\n        background: #22c55e; color: #fff; border: none; border-radius: 6px;\n        padding: 3px 10px; font-size: 11px; cursor: pointer; font-weight: bold;\n      \">⬇ MP3</button>\n    </div>";
  smartPopup.innerHTML = "\n    <div style=\"\n      display: flex; justify-content: space-between; align-items: center;\n      padding: 10px 14px;\n      background: linear-gradient(135deg, #7c3aed, #6d28d9);\n    \">\n      <span style=\"color: #fff; font-weight: bold; font-size: 13px;\">\n        ⚡ VELOCE Smart Download\n      </span>\n      <button id=\"smart-popup-close\" style=\"\n        background: rgba(255,255,255,.2); color: #fff; border: none;\n        border-radius: 50%; width: 22px; height: 22px; font-size: 14px;\n        cursor: pointer; line-height: 1;\n      \">×</button>\n    </div>\n    <div style=\"padding: 10px 14px; display: flex; gap: 10px; align-items: flex-start;\n                border-bottom: 1px solid #334155;\">\n      " + (_0x235124.thumbnail ? "<img src=\"" + _0x235124.thumbnail + "\" style=\"width: 120px; height: 68px; object-fit: cover; border-radius: 6px; flex-shrink: 0;\">" : "") + "\n      <div style=\"flex: 1; min-width: 0;\">\n        <div style=\"color: #f1f5f9; font-size: 12px; font-weight: bold;\n                    overflow: hidden; text-overflow: ellipsis; display: -webkit-box;\n                    -webkit-line-clamp: 2; -webkit-box-orient: vertical;\">\n          " + _0x235124.title + "\n        </div>\n        <div style=\"color: #64748b; font-size: 10px; margin-top: 3px;\">\n          " + (_0x235124.extractor || "") + _0x1ac471 + _0x836f9f + "\n        </div>\n      </div>\n    </div>\n    <div id=\"smart-format-list\" style=\"max-height: 180px; overflow-y: auto; padding: 4px 0;\">\n      " + _0x2b0e1b + "\n    </div>\n  ";
  smartPopup.style.display = "block";
  document.getElementById("smart-popup-close").onclick = hideSmartPopup;
  smartPopup.querySelectorAll(".smart-dl-btn").forEach(function (_0x1ee2d7) {
    _0x1ee2d7.onclick = function (_0x3e554c) {
      _0x3e554c.stopPropagation();
      const _0x590f18 = _0x1ee2d7.closest(".smart-fmt-row");
      const _0x2fef37 = _0x590f18 ? _0x590f18.getAttribute("data-format-id") : "best";
      const _0x1942a0 = _0x590f18 ? _0x590f18.getAttribute("data-audio") === "true" : false;
      smartPopup.querySelectorAll(".smart-dl-btn").forEach(function (_0x431a74) {
        _0x431a74.disabled = true;
        _0x431a74.style.opacity = "0.5";
      });
      _0x1ee2d7.textContent = "⏳...";
      const _0x36d121 = tabs.find(_0x5c084b => _0x5c084b.id === activeTabId);
      const _0x23d685 = _0x36d121 ? _0x36d121.url : _0x235124.pageUrl;
      const _0x214e3a = downloads.length;
      const _0x1bc5fa = _0x235124.title.replace(/[<>:"/\\|?*]/g, "").slice(0, 60);
      var _0x156081 = {
        filename: _0x1bc5fa,
        url: _0x23d685,
        status: "Downloading",
        progress: "0%",
        speed: "—",
        eta: "—",
        boosters: _0x1942a0 ? "1" : "1",
        size: "—",
        _internalName: ""
      };
      downloads.push(_0x156081);
      renderDownloads();
      statusText.textContent = "Downloading: " + _0x1bc5fa;
      var _0x55f414 = "ytdlp_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
      downloads[_0x214e3a]._ytDlpId = _0x55f414;
      var _0x3a14c9 = document.createElement("div");
      _0x3a14c9.id = "smart-progress-" + _0x55f414;
      _0x3a14c9.style.cssText = "padding: 8px 14px; border-top: 1px solid #334155; background: rgba(0,0,0,.2)";
      _0x3a14c9.innerHTML = "<div style=\"display:flex;justify-content:space-between;align-items:center;gap:8px;\"><span id=\"sp-status-" + _0x55f414 + "\" style=\"color:#94a3b8;font-size:11px;\">Starting...</span><button id=\"sp-cancel-" + _0x55f414 + "\" style=\"background:#ef4444;color:#fff;border:none;border-radius:4px;padding:3px 10px;font-size:11px;cursor:pointer;font-weight:bold;\">✕ Cancel</button></div><div style=\"margin-top:4px;height:3px;background:#334155;border-radius:2px;overflow:hidden;\"><div id=\"sp-bar-" + _0x55f414 + "\" style=\"height:100%;width:0%;background:linear-gradient(90deg,#22c55e,#7c3aed);border-radius:2px;transition:width .3s;\"></div></div>";
      var _0xd22818 = smartPopup.querySelector("#smart-format-list");
      if (_0xd22818 && _0xd22818.parentNode) {
        _0xd22818.parentNode.insertBefore(_0x3a14c9, _0xd22818.nextSibling);
      } else {
        smartPopup.appendChild(_0x3a14c9);
      }
      document.getElementById("sp-cancel-" + _0x55f414).onclick = function () {
        window.veloce.cancelFormat(_0x55f414).catch(function () {});
        document.getElementById("sp-status-" + _0x55f414).textContent = "Cancelled";
        document.getElementById("sp-cancel-" + _0x55f414).disabled = true;
        document.getElementById("sp-cancel-" + _0x55f414).style.opacity = "0.5";
        statusText.textContent = "Cancelled: " + _0x1bc5fa;
        downloads[_0x214e3a].status = "Cancelled";
        renderDownloads();
        setTimeout(hideSmartPopup, 2000);
      };
      // YouTube native: use direct pre-signed URL instead of yt-dlp (no bot detection)
      if (window.veloce && window.veloce.ytDebug) window.veloce.ytDebug(JSON.stringify({ fid: _0x2fef37, isAudio: _0x1942a0, keys: window._youtubeDirectUrls ? Object.keys(window._youtubeDirectUrls) : null }));
      if (window._youtubeDirectUrls && window._youtubeDirectUrls[_0x2fef37] && !_0x1942a0) {
        var _ytDirect = window._youtubeDirectUrls[_0x2fef37];
        var _ytFilename = _0x1bc5fa + '.' + _ytDirect.ext;
        window.veloce.startDownload(_ytDirect.url, _ytFilename, 'https://www.youtube.com/', _0x235124.title).then(function(_ytR) {
          if (_ytR && _ytR.ok) {
            downloads[_0x214e3a].status = 'Complete';
            downloads[_0x214e3a].progress = '100%';
            statusText.textContent = '✓ Complete: ' + _0x1bc5fa;
            document.getElementById('sp-bar-' + _0x55f414).style.width = '100%';
            document.getElementById('sp-status-' + _0x55f414).textContent = 'Complete ✓';
          } else {
            // Fall back to yt-dlp if direct download fails
            window.veloce.downloadFormat(_0x23d685, _0x2fef37, _0x1942a0, _0x235124.title, _0x55f414);
          }
        }).catch(function() {
          window.veloce.downloadFormat(_0x23d685, _0x2fef37, _0x1942a0, _0x235124.title, _0x55f414);
        });
      } else {
      window.veloce.downloadFormat(_0x23d685, _0x2fef37, _0x1942a0, _0x235124.title, _0x55f414).then(function (_0x23bfd0) {
        downloads[_0x214e3a].status = "Complete";
        downloads[_0x214e3a].progress = "100%";
        if (_0x23bfd0 && _0x23bfd0.size) {
          downloads[_0x214e3a].size = _0x23bfd0.size;
        }
        if (_0x23bfd0 && _0x23bfd0.path) {
          downloads[_0x214e3a].path = _0x23bfd0.path;
        }
        if (_0x23bfd0 && _0x23bfd0.filename) {
          downloads[_0x214e3a]._internalName = _0x23bfd0.filename;
        }
        statusText.textContent = "✓ Complete: " + _0x1bc5fa;
        var _0x330cd9 = document.getElementById("sp-bar-" + _0x55f414);
        if (_0x330cd9) {
          _0x330cd9.style.width = "100%";
        }
        var _0x19b97d = document.getElementById("sp-status-" + _0x55f414);
        if (_0x19b97d) {
          _0x19b97d.textContent = "Complete ✓";
        }
        var _0x4988ba = document.getElementById("sp-cancel-" + _0x55f414);
        if (_0x4988ba) {
          _0x4988ba.disabled = true;
          _0x4988ba.style.opacity = "0.3";
        }
        renderDownloads();
        setTimeout(hideSmartPopup, 2000);
      }).catch(function (_0xcad9dd) {
        if (downloads[_0x214e3a].status !== "Cancelled") {
          downloads[_0x214e3a].status = "Error";
          statusText.textContent = "✗ Failed: " + _0xcad9dd.message;
          var _0x4d729e = document.getElementById("sp-status-" + _0x55f414);
          if (_0x4d729e) {
            _0x4d729e.textContent = "Error: " + _0xcad9dd.message.slice(0, 40);
          }
        }
        renderDownloads();
        smartPopup.querySelectorAll(".smart-dl-btn").forEach(function (_0x1f16f8) {
          _0x1f16f8.disabled = false;
          _0x1f16f8.style.opacity = "1";
          _0x1f16f8.textContent = _0x1f16f8.getAttribute("data-audio") === "true" ? "⬇ MP3" : "⬇ MP4";
        });
      });
      } // close else: non-YouTube uses yt-dlp, YouTube uses direct URL above
    };
  });
}
function hideSmartPopup() {
  smartPopup.style.display = "none";
  currentVideoInfo = null;
}
function smartDownload() {
  const _0x522af5 = tabs.find(_0x3c65eb => _0x3c65eb.id === activeTabId);
  if (!_0x522af5) {
    return;
  }
  const _0x2e6fbe = _0x522af5.url;
  const _0x380f0e = ["youtube.com", "youtu.be", "vimeo.com", "dailymotion.com", "twitch.tv", "twitter.com", "x.com", "tiktok.com", "instagram.com", "facebook.com", "reddit.com"];
  const _0xe8cd2f = _0x380f0e.some(_0x44814e => _0x2e6fbe.toLowerCase().includes(_0x44814e));
  let _0x32203a;
  let _0x34eaa0;
  if (_0xe8cd2f) {
    _0x32203a = _0x2e6fbe;
    _0x34eaa0 = "video";
  } else if (sniffedUrls.length > 0) {
    let _0x279d34 = sniffedUrls[sniffedUrls.length - 1];
    for (const _0x344ae1 of sniffedUrls) {
      if (_0x344ae1.toLowerCase().includes(".m3u8") || _0x344ae1.toLowerCase().includes(".mpd")) {
        _0x279d34 = _0x344ae1;
        break;
      }
    }
    _0x32203a = _0x279d34;
    _0x34eaa0 = _0x32203a.split("/").pop().split("?")[0] || "download";
  } else {
    _0x32203a = _0x2e6fbe;
    _0x34eaa0 = _0x32203a.split("/").pop().split("?")[0] || "download";
  }
  if (_0x34eaa0.length > 60) {
    _0x34eaa0 = _0x34eaa0.slice(0, 60);
  }
  startDownload(_0x32203a, _0x34eaa0, _0x2e6fbe);
}
let downloadingUrls = new Set();
function startDownload(_0x3dc605, _0x226921, _0x181c04) {
  const _0x27849f = _0x3dc605.split("?")[0];
  if (downloadingUrls.has(_0x27849f)) {
    statusText.textContent = "Already downloading this file";
    return;
  }
  const _0x52679b = tabs.find(_0x3c6761 => _0x3c6761.id === activeTabId);
  const _0xb7a9be = _0x52679b ? _0x52679b.title || "" : "";
  const _0x59c17b = _0xb7a9be && _0xb7a9be.length > 3 && (_0x226921 === "download" || _0x226921.includes("master") || _0x226921.includes("index")) ? _0xb7a9be.replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, "_").slice(0, 60) : _0x226921;
  var _0xd1e63d = {
    filename: _0x59c17b,
    url: _0x3dc605,
    totalBytes: 0
  };
  showDownloadDialog(_0xd1e63d, function () {
    downloadingUrls.add(_0x27849f);
    const _0x280894 = downloads.length;
    var _0x1a666b = {
      filename: _0x59c17b,
      url: _0x3dc605,
      status: "Downloading",
      progress: "0%",
      speed: "—",
      eta: "—",
      boosters: "—",
      size: "—"
    };
    downloads.push(_0x1a666b);
    renderDownloads();
    statusText.textContent = "Downloading: " + _0x59c17b;
    activeDownloadDialog = _0x59c17b;
    window.veloce.startDownload(_0x3dc605, _0x226921, _0x181c04, _0xb7a9be).then(function (_0x2d8bbd) {
      if (_0x2d8bbd && _0x2d8bbd.duplicate) {
        downloads.splice(_0x280894, 1);
        statusText.textContent = "Already downloading this file";
        const _0x2b317a = document.getElementById("veloce-dl-dialog");
        if (_0x2b317a) {
          _0x2b317a.remove();
        }
        activeDownloadDialog = null;
      } else if (_0x2d8bbd && _0x2d8bbd.cancelled) {
        downloads[_0x280894].status = "Cancelled";
        downloads[_0x280894].speed = "—";
      } else {
        downloads[_0x280894].status = "Complete";
        downloads[_0x280894].progress = "100%";
        if (_0x2d8bbd && _0x2d8bbd.size) {
          downloads[_0x280894].size = _0x2d8bbd.size;
        }
        if (_0x2d8bbd && _0x2d8bbd.path) {
          downloads[_0x280894].path = _0x2d8bbd.path;
        }
        statusText.textContent = "Complete: " + _0x59c17b + (_0x2d8bbd && _0x2d8bbd.size ? " (" + _0x2d8bbd.size + ")" : "");
      }
      downloadingUrls.delete(_0x27849f);
      renderDownloads();
    }).catch(function (_0x349d77) {
      downloads[_0x280894].status = "Error";
      statusText.textContent = "Failed: " + _0x59c17b + " — " + _0x349d77.message;
      const _0x776721 = document.getElementById("veloce-dl-dialog");
      if (_0x776721) {
        _0x776721.remove();
      }
      activeDownloadDialog = null;
      downloadingUrls.delete(_0x27849f);
      renderDownloads();
    });
  }, function () {
    statusText.textContent = "Download cancelled";
  });
}
if (window.veloce && window.veloce.onDownloadProgress) {
  window.veloce.onDownloadProgress(_0x12c8d6 => {
    function _0x4d2bf2(_0x51f057) {
      return _0x12c8d6.id && _0x51f057.id === _0x12c8d6.id || _0x51f057._internalName && _0x51f057._internalName === _0x12c8d6.filename || _0x51f057.filename === _0x12c8d6.filename || _0x12c8d6.filename && _0x12c8d6.filename.indexOf(_0x51f057.filename) !== -1 || _0x51f057.filename && _0x12c8d6.filename && _0x51f057.filename.indexOf(_0x12c8d6.filename.slice(0, 20)) !== -1;
    }
    let _0x5b3bdf = downloads.find(_0x1ede29 => _0x1ede29.status !== "Cancelled" && _0x1ede29.status !== "Paused" && _0x4d2bf2(_0x1ede29));
    if (!_0x5b3bdf && _0x12c8d6.filename) {
      _0x5b3bdf = downloads.find(_0x185440 => _0x185440._internalName && _0x185440._internalName === _0x12c8d6.filename);
    }
    if (!_0x5b3bdf && _0x12c8d6.filename) {
      _0x5b3bdf = downloads.find(_0x97bbd1 => _0x97bbd1.status === "Downloading" && !_0x97bbd1._internalName && !_0x97bbd1._intercepted);
    }
    if (_0x5b3bdf) {
      if (_0x12c8d6.filename && !_0x5b3bdf._internalName) {
        _0x5b3bdf._internalName = _0x12c8d6.filename;
      }
      if (_0x12c8d6.percent !== undefined) {
        _0x5b3bdf.progress = _0x12c8d6.percent + "%";
      }
      if (_0x12c8d6.speed) {
        _0x5b3bdf.speed = _0x12c8d6.speed;
      }
      if (_0x12c8d6.eta) {
        _0x5b3bdf.eta = _0x12c8d6.eta;
      }
      if (_0x12c8d6.tunnels) {
        _0x5b3bdf.boosters = _0x12c8d6.tunnels;
      }
      if (_0x12c8d6.size) {
        _0x5b3bdf.size = _0x12c8d6.size;
      }
      if (_0x12c8d6.status && _0x5b3bdf.status !== "Paused" && _0x5b3bdf.status !== "Cancelled") {
        _0x5b3bdf.status = _0x12c8d6.status;
      }
      if (_0x5b3bdf.status === "Paused" || _0x5b3bdf.status === "Cancelled") {
        return;
      }
      if (_0x12c8d6.received) {
        _0x5b3bdf.received = _0x12c8d6.received;
      }
      if (_0x12c8d6.tunnelSpeeds) {
        _0x5b3bdf.tunnelSpeeds = _0x12c8d6.tunnelSpeeds;
      }
      if (_0x12c8d6.filename) {
        _0x5b3bdf._internalName = _0x12c8d6.filename;
      }
      if (_0x12c8d6.output) {
        statusText.textContent = _0x12c8d6.output.trim();
      }
      renderDownloads();
      if (_0x5b3bdf._ytDlpId) {
        var _0x4f6b65 = document.getElementById("sp-bar-" + _0x5b3bdf._ytDlpId);
        var _0x29c7d1 = document.getElementById("sp-status-" + _0x5b3bdf._ytDlpId);
        if (_0x4f6b65 && _0x12c8d6.percent !== undefined) {
          _0x4f6b65.style.width = _0x12c8d6.percent + "%";
        }
        if (_0x29c7d1) {
          var _0x28f6c8 = _0x12c8d6.percent !== undefined ? Math.round(_0x12c8d6.percent) + "%" : "";
          if (_0x12c8d6.speed) {
            _0x28f6c8 += " · " + _0x12c8d6.speed;
          }
          if (_0x12c8d6.eta) {
            _0x28f6c8 += " · " + _0x12c8d6.eta + " left";
          }
          _0x29c7d1.textContent = _0x28f6c8 || _0x29c7d1.textContent;
        }
      }
      updateDownloadDialog(_0x5b3bdf);
    }
  });
}
let activeDownloadDialog = null;
let activeDownloadPhase = "info";
let tunnelDashboardInitialized = false;
function formatFileSize(_0x1d3151) {
  if (!_0x1d3151 || _0x1d3151 <= 0) {
    return "Unknown";
  }
  if (_0x1d3151 > 1073741824) {
    return (_0x1d3151 / 1073741824).toFixed(2) + " GB";
  }
  if (_0x1d3151 > 1048576) {
    return (_0x1d3151 / 1048576).toFixed(1) + " MB";
  }
  if (_0x1d3151 > 1024) {
    return (_0x1d3151 / 1024).toFixed(0) + " KB";
  }
  return _0x1d3151 + " B";
}
function showDownloadDialog(_0x27252a, _0x48aac6, _0x269e4a) {
  activeDownloadDialog = _0x27252a.id || _0x27252a.filename;
  activeDownloadPhase = "info";
  window._dlDialogOnStart = _0x48aac6;
  window._dlDialogOnCancel = _0x269e4a;
  window._dlDialogData = _0x27252a;
  if (window.veloce && window.veloce.openDlDialog) {
    window.veloce.openDlDialog({
      filename: _0x27252a.filename || "—",
      url: _0x27252a.url || "",
      size: _0x27252a.totalBytes > 0 ? formatFileSize(_0x27252a.totalBytes) : "Checking...",
      resumable: _0x27252a.resumable !== false
    });
  }
  if (_0x27252a.url && window.veloce && window.veloce.checkSafety) {
    window.veloce.checkSafety(_0x27252a.url, _0x27252a.filename || "", _0x27252a.totalBytes || 0).then(function (_0x3f1686) {
      if (window.veloce.updateDlDialogSafety) {
        var _0x3f3ee9 = (_0x3f1686.checks || []).map(function (_0x3a77ae) {
          var _0x526b32 = {
            pass: _0x3a77ae.status !== "warning",
            label: _0x3a77ae.label + ": " + _0x3a77ae.detail
          };
          return _0x526b32;
        });
        var _0xb1be62 = {
          done: true,
          checks: _0x3f3ee9,
          overall: _0x3f1686.overallLabel ? {
            safe: _0x3f1686.overall !== "warning",
            text: _0x3f1686.overallLabel
          } : null
        };
        window.veloce.updateDlDialogSafety(_0xb1be62);
      }
    }).catch(function () {});
  }
  if ((!_0x27252a.totalBytes || _0x27252a.totalBytes <= 0) && _0x27252a.url && window.veloce) {
    var _0x4168c4 = _0x27252a.url.toLowerCase();
    var _0x4e39d0 = _0x4168c4.indexOf(".m3u8") !== -1 || _0x4168c4.indexOf("/hls/") !== -1;
    if (_0x4e39d0 && window.veloce.checkHlsSize) {
      window.veloce.checkHlsSize(_0x27252a.url).then(function (_0xceaf3f) {
        setTimeout(function () {
          if (_0xceaf3f && _0xceaf3f.size > 0) {
            window.veloce.updateDlDialog({
              size: "~" + formatFileSize(_0xceaf3f.size) + " (" + _0xceaf3f.segments + " segments)"
            });
          } else if (_0xceaf3f && _0xceaf3f.segments > 0) {
            var _0x5c9e4e = {
              size: _0xceaf3f.segments + " segments"
            };
            window.veloce.updateDlDialog(_0x5c9e4e);
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
      window.veloce.checkSize(_0x27252a.url).then(function (_0x3e99c6) {
        setTimeout(function () {
          if (_0x3e99c6 && _0x3e99c6.size > 0) {
            window.veloce.updateDlDialog({
              size: formatFileSize(_0x3e99c6.size),
              resumable: _0x3e99c6.resumable
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
  window.veloce.onDlDialogAction(function (_0xd5b842) {
    if (_0xd5b842 === "start") {
      activeDownloadPhase = "progress";
      tunnelDashboardInitialized = false;
      if (window._dlDialogOnStart) {
        window._dlDialogOnStart();
      }
    } else if (_0xd5b842 === "cancel") {
      if (activeDownloadPhase === "progress") {
        var _0x3c58cd = activeDownloadDialog;
        if (_0x3c58cd && window.veloce) {
          window.veloce.pauseDownload(_0x3c58cd + ":cancel");
          var _0x38833e = downloads.find(function (_0x1db4af) {
            return _0x1db4af.status !== "Cancelled" && (_0x1db4af.id === _0x3c58cd || _0x1db4af.filename === _0x3c58cd);
          });
          if (!_0x38833e) {
            _0x38833e = downloads.find(function (_0x489664) {
              return _0x489664.id === _0x3c58cd || _0x489664.filename === _0x3c58cd;
            });
          }
          if (_0x38833e && _0x38833e._internalName) {
            window.veloce.pauseDownload(_0x38833e._internalName + ":cancel");
          }
          if (_0x38833e) {
            _0x38833e.status = "Cancelled";
            _0x38833e.speed = "—";
            renderDownloads();
          }
        }
        statusText.textContent = "Download stopped";
      }
      activeDownloadDialog = null;
      if (window._dlDialogOnCancel) {
        window._dlDialogOnCancel();
      }
      if (window.veloce.closeDlDialog) {
        window.veloce.closeDlDialog();
      }
    } else if (_0xd5b842 === "stop") {
      var _0x3c58cd = activeDownloadDialog;
      if (_0x3c58cd && window.veloce) {
        window.veloce.pauseDownload(_0x3c58cd + ":cancel");
        if (typeof _0x3c58cd === "string") {
          var _0x41d719 = _0x3c58cd.replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, "_").slice(0, 60);
          if (_0x41d719 !== _0x3c58cd) {
            window.veloce.pauseDownload(_0x41d719 + ":cancel");
          }
        }
        var _0x38833e = downloads.find(function (_0x3e79cb) {
          return _0x3e79cb.status !== "Cancelled" && (_0x3e79cb.id === _0x3c58cd || _0x3e79cb.filename === _0x3c58cd);
        });
        if (!_0x38833e) {
          _0x38833e = downloads.find(function (_0x1a9dff) {
            return _0x1a9dff.id === _0x3c58cd || _0x1a9dff.filename === _0x3c58cd;
          });
        }
        if (_0x38833e && _0x38833e._internalName) {
          window.veloce.pauseDownload(_0x38833e._internalName + ":cancel");
        }
        if (_0x38833e) {
          _0x38833e.status = "Cancelled";
          _0x38833e.speed = "—";
          renderDownloads();
        }
      }
      activeDownloadPhase = "done";
      statusText.textContent = "Download stopped: " + (window._dlDialogData ? window._dlDialogData.filename : "");
    }
  });
}
function updateDownloadDialog(_0x4f15e2) {
  if (!activeDownloadDialog || activeDownloadPhase !== "progress") {
    return;
  }
  const _0x29e19c = _0x4f15e2.id === activeDownloadDialog || _0x4f15e2.filename === activeDownloadDialog || _0x4f15e2.filename && typeof activeDownloadDialog === "string" && _0x4f15e2.filename.indexOf(activeDownloadDialog.slice(0, 15)) !== -1 || typeof activeDownloadDialog === "string" && _0x4f15e2.filename && activeDownloadDialog.indexOf(_0x4f15e2.filename.slice(0, 15)) !== -1 || _0x4f15e2.status === "Downloading";
  if (!_0x29e19c) {
    return;
  }
  if (window.veloce && window.veloce.updateDlDialog) {
    window.veloce.updateDlDialog({
      status: _0x4f15e2.status === "Downloading" ? "Receiving data..." : _0x4f15e2.status,
      received: _0x4f15e2.received ? _0x4f15e2.received + (_0x4f15e2.progress ? " (" + _0x4f15e2.progress + ")" : "") : undefined,
      speed: _0x4f15e2.speed,
      eta: _0x4f15e2.eta,
      percent: _0x4f15e2.progress ? parseInt(_0x4f15e2.progress) || 0 : 0,
      tunnelSpeeds: _0x4f15e2.tunnelSpeeds || null,
      size: _0x4f15e2.size
    });
  }
}
var TUNNEL_BLOCKS = 20;
var dashboardTunnelCount = 0;
function initTunnelDashboard(_0x186cd1) {
  var _0x3ead82 = document.getElementById("tunnel-dashboard");
  if (!_0x3ead82) {
    return;
  }
  _0x186cd1 = _0x186cd1 || 16;
  if (tunnelDashboardInitialized && dashboardTunnelCount === _0x186cd1) {
    return;
  }
  dashboardTunnelCount = _0x186cd1;
  var _0x5a2ccc = "<div class=\"td-title\">VELOCE BOOSTER ENGINE</div>";
  for (var _0x57d809 = 0; _0x57d809 < _0x186cd1; _0x57d809++) {
    _0x5a2ccc += "<div class=\"td-row\" id=\"td-row-" + _0x57d809 + "\">";
    _0x5a2ccc += "<span class=\"td-label\">B" + (_0x57d809 + 1) + "</span>";
    _0x5a2ccc += "<div class=\"td-bar\">";
    for (var _0x393ddb = 0; _0x393ddb < TUNNEL_BLOCKS; _0x393ddb++) {
      _0x5a2ccc += "<div class=\"td-block idle\" id=\"td-" + _0x57d809 + "-" + _0x393ddb + "\"></div>";
    }
    _0x5a2ccc += "</div>";
    _0x5a2ccc += "<span class=\"td-speed\" id=\"td-spd-" + _0x57d809 + "\">—</span>";
    _0x5a2ccc += "</div>";
  }
  _0x5a2ccc += "<div class=\"td-summary\">";
  _0x5a2ccc += "<span>Active: <span class=\"td-summary-val\" id=\"td-active\">0</span></span>";
  _0x5a2ccc += "<span>Online: <span class=\"td-summary-val\" id=\"td-healthy\">0</span>/<span id=\"td-total\">" + _0x186cd1 + "</span></span>";
  _0x5a2ccc += "<span>Peak: <span class=\"td-summary-val\" id=\"td-max-speed\">—</span></span>";
  _0x5a2ccc += "</div>";
  _0x3ead82.innerHTML = _0x5a2ccc;
  _0x3ead82.className = "active";
  _0x3ead82.style.display = "block";
  tunnelDashboardInitialized = true;
}
function updateTunnelDashboard(_0x13964b) {
  if (!_0x13964b || _0x13964b.length === 0) {
    return;
  }
  var _0x4d5235 = document.getElementById("tunnel-dashboard");
  if (!_0x4d5235) {
    return;
  }
  if (!tunnelDashboardInitialized) {
    initTunnelDashboard(_0x13964b.length);
  }
  var _0x3f5595 = 0;
  var _0x33281f = 0;
  var _0x1edc2b = 0;
  for (var _0x2ed4e4 = 0; _0x2ed4e4 < _0x13964b.length; _0x2ed4e4++) {
    if (_0x13964b[_0x2ed4e4].speed > _0x3f5595) {
      _0x3f5595 = _0x13964b[_0x2ed4e4].speed;
    }
    if (_0x13964b[_0x2ed4e4].active) {
      _0x33281f++;
    }
    if (_0x13964b[_0x2ed4e4].healthy) {
      _0x1edc2b++;
    }
  }
  if (_0x3f5595 < 102400) {
    _0x3f5595 = 102400;
  }
  for (var _0xfb69b = 0; _0xfb69b < _0x13964b.length && _0xfb69b < dashboardTunnelCount; _0xfb69b++) {
    var _0x24154a = _0x13964b[_0xfb69b];
    var _0x5f4e3c = _0x24154a.speed / 1024;
    var _0x4e8a48 = _0x24154a.speed / _0x3f5595;
    var _0x1669f0 = Math.round(_0x4e8a48 * TUNNEL_BLOCKS);
    var _0x2f2bf5 = !_0x24154a.healthy && _0x24154a.fail > _0x24154a.ok && _0x24154a.fail >= 2;
    for (var _0x44fe08 = 0; _0x44fe08 < TUNNEL_BLOCKS; _0x44fe08++) {
      var _0x30c793 = document.getElementById("td-" + _0xfb69b + "-" + _0x44fe08);
      if (!_0x30c793) {
        continue;
      }
      _0x30c793.className = "td-block";
      if (_0x2f2bf5) {
        _0x30c793.classList.add("dead");
      } else if (_0x44fe08 < _0x1669f0) {
        var _0x4dc666 = _0x44fe08 / TUNNEL_BLOCKS;
        if (_0x4dc666 < 0.2) {
          _0x30c793.classList.add("lit-1");
        } else if (_0x4dc666 < 0.3) {
          _0x30c793.classList.add("lit-2");
        } else if (_0x4dc666 < 0.4) {
          _0x30c793.classList.add("lit-3");
        } else if (_0x4dc666 < 0.55) {
          _0x30c793.classList.add("lit-4");
        } else if (_0x4dc666 < 0.65) {
          _0x30c793.classList.add("lit-5");
        } else if (_0x4dc666 < 0.75) {
          _0x30c793.classList.add("lit-6");
        } else if (_0x4dc666 < 0.85) {
          _0x30c793.classList.add("lit-7");
        } else {
          _0x30c793.classList.add("lit-8");
        }
      } else {
        _0x30c793.classList.add("idle");
      }
    }
    var _0x30ac7f = document.getElementById("td-spd-" + _0xfb69b);
    if (_0x30ac7f) {
      if (_0x2f2bf5) {
        _0x30ac7f.textContent = "DEAD";
        _0x30ac7f.className = "td-speed dead";
      } else if (_0x5f4e3c <= 0 && !_0x24154a.active) {
        _0x30ac7f.textContent = "—";
        _0x30ac7f.className = "td-speed";
      } else if (_0x5f4e3c > 1024) {
        _0x30ac7f.textContent = (_0x5f4e3c / 1024).toFixed(1) + " MB";
        _0x30ac7f.className = "td-speed fast";
      } else if (_0x5f4e3c > 100) {
        _0x30ac7f.textContent = Math.round(_0x5f4e3c) + " KB";
        _0x30ac7f.className = "td-speed fast";
      } else if (_0x5f4e3c > 30) {
        _0x30ac7f.textContent = Math.round(_0x5f4e3c) + " KB";
        _0x30ac7f.className = "td-speed medium";
      } else if (_0x5f4e3c > 0) {
        _0x30ac7f.textContent = Math.round(_0x5f4e3c) + " KB";
        _0x30ac7f.className = "td-speed slow";
      } else {
        _0x30ac7f.textContent = "—";
        _0x30ac7f.className = "td-speed";
      }
    }
  }
  var _0x8bdb22 = document.getElementById("td-active");
  var _0x533596 = document.getElementById("td-healthy");
  var _0x4d4888 = document.getElementById("td-max-speed");
  if (_0x8bdb22) {
    _0x8bdb22.textContent = _0x33281f;
  }
  if (_0x533596) {
    _0x533596.textContent = _0x1edc2b;
  }
  if (_0x4d4888) {
    var _0xe320f = _0x3f5595 / 1024;
    _0x4d4888.textContent = _0xe320f > 1024 ? (_0xe320f / 1024).toFixed(1) + " MB/s" : Math.round(_0xe320f) + " KB/s";
  }
}
function showCompletionDialog(_0x2b9d03) {
  const _0x2488e1 = document.getElementById("veloce-dl-dialog");
  if (_0x2488e1) {
    _0x2488e1.remove();
  }
  activeDownloadDialog = null;
  const _0x2140e8 = document.getElementById("veloce-complete-dialog");
  if (_0x2140e8) {
    _0x2140e8.remove();
  }
  const _0x5bfc91 = document.createElement("div");
  _0x5bfc91.id = "veloce-complete-dialog";
  _0x5bfc91.style.cssText = "\n    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);\n    z-index: 100001;\n    background: linear-gradient(180deg, #1a2332 0%, #0f172a 100%);\n    border: 2px solid #22c55e;\n    border-radius: 12px;\n    width: 420px;\n    box-shadow: 0 20px 60px rgba(0,0,0,.7), 0 0 0 1px rgba(34,197,94,.3);\n    font-family: 'Segoe UI', Arial, sans-serif;\n    color: #e0e0e0;\n    overflow: hidden;\n  ";
  _0x5bfc91.innerHTML = "\n    <div style=\"\n      display: flex; justify-content: space-between; align-items: center;\n      padding: 10px 16px;\n      background: linear-gradient(135deg, #22c55e, #16a34a);\n    \">\n      <span style=\"color: #fff; font-weight: bold; font-size: 13px;\">Download Complete</span>\n    </div>\n    <div style=\"padding: 20px;\">\n      <div style=\"text-align: center; font-size: 36px; margin-bottom: 8px;\">✓</div>\n      <div style=\"text-align: center; font-size: 14px; font-weight: bold; margin-bottom: 4px; word-break: break-all;\">\n        " + (_0x2b9d03.filename || "File") + "\n      </div>\n      <div style=\"text-align: center; font-size: 12px; color: #94a3b8; margin-bottom: 12px;\">\n        " + (_0x2b9d03.size || "") + " — Downloaded successfully\n      </div>\n\n      <!-- Post-download security scan -->\n      <div id=\"dl-complete-scan\" style=\"\n        margin: 0 0 14px 0; padding: 8px 10px;\n        background: rgba(30,41,59,.7); border: 1px solid #334155;\n        border-radius: 6px; font-size: 11px;\n      \">\n        <div style=\"display: flex; align-items: center; gap: 6px;\">\n          <span style=\"font-size: 12px;\">&#128737;</span>\n          <span style=\"color: #94a3b8; font-weight: bold; text-transform: uppercase; font-size: 9px; letter-spacing: 1px;\">FILE SCAN</span>\n          <span id=\"dl-complete-scan-status\" style=\"color: #64748b; font-size: 10px;\">hashing file...</span>\n        </div>\n        <div id=\"dl-complete-scan-result\" style=\"margin-top: 4px; display: none;\"></div>\n      </div>\n\n      <div style=\"display: flex; gap: 10px; justify-content: center;\">\n        <button id=\"dl-complete-open\" style=\"\n          background: #2563eb; color: #fff; border: none; border-radius: 8px;\n          padding: 10px 20px; font-size: 13px; font-weight: bold; cursor: pointer;\n        \">Open File</button>\n        <button id=\"dl-complete-folder\" style=\"\n          background: #1e293b; color: #e0e0e0; border: 1px solid #334155; border-radius: 8px;\n          padding: 10px 20px; font-size: 13px; font-weight: bold; cursor: pointer;\n        \">Open Folder</button>\n        <button id=\"dl-complete-close\" style=\"\n          background: #1e293b; color: #94a3b8; border: 1px solid #334155; border-radius: 8px;\n          padding: 10px 20px; font-size: 13px; cursor: pointer;\n        \">Close</button>\n      </div>\n    </div>\n  ";
  document.body.appendChild(_0x5bfc91);
  document.getElementById("dl-complete-open").onclick = () => {
    if (window.veloce && _0x2b9d03.path) {
      window.veloce.openFile(_0x2b9d03.path);
    }
    _0x5bfc91.remove();
  };
  document.getElementById("dl-complete-folder").onclick = () => {
    if (window.veloce && _0x2b9d03.path) {
      window.veloce.openFolder(_0x2b9d03.path);
    }
    _0x5bfc91.remove();
  };
  document.getElementById("dl-complete-close").onclick = () => {
    _0x5bfc91.remove();
  };
  if (_0x2b9d03.path && window.veloce && window.veloce.scanFileHash) {
    window.veloce.scanFileHash(_0x2b9d03.path).then(function (_0x18d6aa) {
      var _0x5e497e = document.getElementById("dl-complete-scan-status");
      var _0x2db70d = document.getElementById("dl-complete-scan-result");
      if (!_0x5e497e || !_0x2db70d) {
        return;
      }
      if (_0x18d6aa && _0x18d6aa.scanned) {
        _0x5e497e.textContent = "complete";
        _0x5e497e.style.color = "#22c55e";
        _0x2db70d.style.display = "block";
        var _0x4652c8 = _0x18d6aa.hash ? _0x18d6aa.hash.slice(0, 16) + "..." : "—";
        var _0x4b1fe4 = _0x18d6aa.vt ? _0x18d6aa.vt.link : "";
        _0x2db70d.innerHTML = "<div style=\"display: flex; align-items: center; gap: 6px; padding: 2px 0;\"><span style=\"font-size: 10px;\">&#128994;</span><span style=\"color: #94a3b8;\">SHA-256:</span><span style=\"color: #64748b; font-family: monospace; font-size: 10px;\" title=\"" + (_0x18d6aa.hash || "") + "\">" + _0x4652c8 + "</span></div>" + (_0x4b1fe4 ? "<div style=\"padding: 2px 0;\"><a href=\"#\" id=\"dl-vt-link\" style=\"color: #3b82f6; text-decoration: none; font-size: 10px;\" title=\"Check on VirusTotal\">&#128270; Check on VirusTotal</a></div>" : "");
        var _0x376db5 = document.getElementById("dl-vt-link");
        if (_0x376db5 && _0x4b1fe4) {
          _0x376db5.onclick = function (_0x1d0d83) {
            _0x1d0d83.preventDefault();
            if (window.veloce) {
              window.veloce.openInBrowser(_0x4b1fe4);
            }
          };
        }
      } else {
        _0x5e497e.textContent = "scan unavailable";
        _0x5e497e.style.color = "#64748b";
      }
    }).catch(function () {
      var _0x32df28 = document.getElementById("dl-complete-scan-status");
      if (_0x32df28) {
        _0x32df28.textContent = "scan failed";
        _0x32df28.style.color = "#64748b";
      }
    });
  } else {
    var _0x5d4ddd = document.getElementById("dl-complete-scan");
    if (_0x5d4ddd) {
      _0x5d4ddd.style.display = "none";
    }
  }
}
if (window.veloce) {
  if (window.veloce.onDownloadStarted) {
    window.veloce.onDownloadStarted(_0x159d87 => {
      var _0xd6926b = {
        id: _0x159d87.id,
        filename: _0x159d87.filename,
        url: _0x159d87.url,
        totalBytes: _0x159d87.totalBytes || 0,
        resumable: _0x159d87.resumable !== false
      };
      showDownloadDialog(_0xd6926b, function () {
        if (window.veloce && window.veloce.cancelInterceptedDownload) {
          window.veloce.cancelInterceptedDownload(_0x159d87.id);
        }
        const _0x51871b = tabs.find(_0x43faf0 => _0x43faf0.id === activeTabId);
        const _0x3e7090 = _0x51871b ? _0x51871b.url : "";
        const _0x3d7fe0 = _0x51871b ? _0x51871b.title || "" : "";
        const _0x1095d2 = _0x159d87.filename;
        const _0x400841 = _0x159d87.url.split("?")[0];
        downloadingUrls.add(_0x400841);
        const _0x257cbd = downloads.length;
        downloads.push({
          id: _0x159d87.id,
          filename: _0x1095d2,
          url: _0x159d87.url,
          status: "Downloading",
          progress: "0%",
          speed: "—",
          eta: "—",
          boosters: "—",
          size: _0x159d87.totalBytes > 0 ? formatFileSize(_0x159d87.totalBytes) : "—",
          _intercepted: true
        });
        renderDownloads();
        statusText.textContent = "Downloading: " + _0x1095d2;
        activeDownloadDialog = _0x159d87.id || _0x1095d2;
        window.veloce.startDownload(_0x159d87.url, _0x159d87.filename, _0x3e7090, _0x3d7fe0).then(function (_0x136e30) {
          if (_0x136e30 && _0x136e30.duplicate) {
            downloads.splice(_0x257cbd, 1);
            statusText.textContent = "Already downloading this file";
          } else if (_0x136e30 && _0x136e30.cancelled) {
            downloads[_0x257cbd].status = "Cancelled";
            downloads[_0x257cbd].speed = "—";
          } else {
            downloads[_0x257cbd].status = "Complete";
            downloads[_0x257cbd].progress = "100%";
            if (_0x136e30 && _0x136e30.size) {
              downloads[_0x257cbd].size = _0x136e30.size;
            }
            if (_0x136e30 && _0x136e30.path) {
              downloads[_0x257cbd].path = _0x136e30.path;
            }
            statusText.textContent = "Complete: " + _0x1095d2 + (_0x136e30 && _0x136e30.size ? " (" + _0x136e30.size + ")" : "");
          }
          downloadingUrls.delete(_0x400841);
          renderDownloads();
        }).catch(function (_0x399d65) {
          downloads[_0x257cbd].status = "Error";
          statusText.textContent = "Failed: " + _0x1095d2 + " — " + _0x399d65.message;
          downloadingUrls.delete(_0x400841);
          renderDownloads();
        });
      }, function () {
        if (window.veloce) {
          window.veloce.pauseDownload(_0x159d87.id + ":cancel");
        }
        statusText.textContent = "Download cancelled";
      });
    });
  }
  if (window.veloce.onDownloadComplete) {
    window.veloce.onDownloadComplete(_0x5178b7 => {
      const _0x1f0faa = downloads.find(_0x486b4f => _0x5178b7.id && _0x486b4f.id === _0x5178b7.id || _0x486b4f.filename === _0x5178b7.filename || _0x5178b7.filename && _0x5178b7.filename.indexOf(_0x486b4f.filename) !== -1 || _0x486b4f.filename && _0x5178b7.filename && _0x486b4f.filename.indexOf(_0x486b4f.filename.slice(0, 15)) !== -1 || _0x486b4f.status === "Downloading");
      if (_0x1f0faa) {
        _0x1f0faa.status = "Complete";
        _0x1f0faa.progress = "100%";
        if (_0x5178b7.size) {
          _0x1f0faa.size = _0x5178b7.size;
        }
        _0x1f0faa.path = _0x5178b7.path;
        _0x1f0faa.folder = _0x5178b7.folder;
      }
      renderDownloads();
      // Only show completion dialog for actual completed downloads, not canceled partials
      if (_0x5178b7.complete && !_0x5178b7.cancelled) {
        statusText.textContent = "Complete: " + (_0x5178b7.filename || "Download");
        showCompletionDialog(_0x5178b7);
      }
    });
  }
}
function renderDownloads() {
  dlTbody.innerHTML = "";
  let _0x57eb22 = 0;
  downloads.forEach((_0x14c613, _0x4b7698) => {
    if (_0x14c613.status === "Downloading") {
      _0x57eb22++;
    }
    const _0x445ee5 = document.createElement("tr");
    const _0x207705 = "status-" + _0x14c613.status.toLowerCase();
    _0x445ee5.innerHTML = "\n      <td>" + _0x14c613.filename + "</td>\n      <td>" + (_0x14c613.size || "—") + "</td>\n      <td class=\"" + _0x207705 + "\">" + _0x14c613.status + "</td>\n      <td>" + (_0x14c613.progress || "—") + "</td>\n      <td>" + (_0x14c613.speed || "—") + "</td>\n      <td>" + (_0x14c613.eta || "—") + "</td>\n      <td>" + (_0x14c613.boosters || "—") + "</td>\n    ";
    _0x445ee5.onclick = () => {
      document.querySelectorAll("#dl-tbody tr").forEach(_0x6aa716 => _0x6aa716.classList.remove("selected"));
      _0x445ee5.classList.add("selected");
    };
    dlTbody.appendChild(_0x445ee5);
  });
  dlActive.textContent = "Active: " + _0x57eb22;
}
(function () {
  var _0x4d149d = document.getElementById("panel-resize-handle");
  var _0x221401 = document.getElementById("download-panel");
  if (!_0x4d149d || !_0x221401) {
    return;
  }
  var _0x1f7db2 = false;
  var _0x2ab225 = 0;
  var _0x5aa221 = 0;
  var _0x467fa7 = 42;
  var _0x1ea9fc = 190;
  function _0x452175() {
    return parseInt(_0x221401.style.height) || _0x221401.offsetHeight || _0x1ea9fc;
  }
  _0x4d149d.addEventListener("mousedown", function (_0x37a6d0) {
    _0x1f7db2 = true;
    _0x2ab225 = _0x37a6d0.clientY;
    _0x5aa221 = _0x452175();
    _0x4d149d.classList.add("dragging");
    document.body.classList.add("no-select");
    _0x37a6d0.preventDefault();
  });
  document.addEventListener("mousemove", function (_0xf555f0) {
    if (!_0x1f7db2) {
      return;
    }
    var _0x3c8375 = _0xf555f0.clientY - _0x2ab225;
    var _0x605f80 = _0x5aa221 - _0x3c8375;
    if (_0x605f80 < _0x467fa7) {
      _0x605f80 = _0x467fa7;
    }
    if (_0x605f80 > _0x1ea9fc) {
      _0x605f80 = _0x1ea9fc;
    }
    _0x221401.style.height = _0x605f80 + "px";
  });
  document.addEventListener("mouseup", function () {
    if (!_0x1f7db2) {
      return;
    }
    _0x1f7db2 = false;
    _0x4d149d.classList.remove("dragging");
    document.body.classList.remove("no-select");
  });
  _0x4d149d.addEventListener("dblclick", function () {
    var _0x75fb38 = _0x452175();
    _0x221401.style.height = _0x75fb38 <= _0x467fa7 + 10 ? _0x1ea9fc + "px" : _0x467fa7 + "px";
  });
})();
document.getElementById("btn-sniffer").onclick = () => {
  closeAllOverlays();
  snifferEnabled = !snifferEnabled;
  const _0x3f4d92 = document.getElementById("btn-sniffer");
  if (snifferEnabled) {
    _0x3f4d92.classList.add("active");
    snifferStatus.textContent = "Media Detect: ON";
    snifferStatus.className = "sniffer-on";
  } else {
    _0x3f4d92.classList.remove("active");
    snifferStatus.textContent = "Media Detect: OFF";
    snifferStatus.className = "sniffer-off";
  }
};
document.getElementById("btn-delete").onclick = () => {
  const _0x252440 = document.querySelector("#dl-tbody tr.selected");
  if (_0x252440) {
    const _0x105aab = Array.from(dlTbody.children).indexOf(_0x252440);
    const _0x5ac830 = downloads[_0x105aab];
    if (_0x5ac830 && (_0x5ac830.status === "Downloading" || _0x5ac830.status === "Paused")) {
      if (window.veloce) {
        window.veloce.pauseDownload((_0x5ac830.id || _0x5ac830.filename) + ":cancel");
        if (_0x5ac830._internalName && _0x5ac830._internalName !== _0x5ac830.filename) {
          window.veloce.pauseDownload(_0x5ac830._internalName + ":cancel");
        }
      }
      downloadingUrls.delete((_0x5ac830.url || "").split("?")[0]);
    }
    downloads.splice(_0x105aab, 1);
    renderDownloads();
    statusText.textContent = "Download removed";
  }
};
document.getElementById("btn-pause").onclick = () => {
  const _0x4901ba = document.querySelector("#dl-tbody tr.selected");
  if (!_0x4901ba) {
    statusText.textContent = "Select a download first";
    return;
  }
  const _0x54cf58 = Array.from(dlTbody.children).indexOf(_0x4901ba);
  const _0x580b5c = downloads[_0x54cf58];
  if (_0x580b5c && _0x580b5c.status === "Downloading") {
    _0x580b5c.status = "Paused";
    _0x580b5c.speed = "—";
    renderDownloads();
    statusText.textContent = "Paused: " + _0x580b5c.filename;
    if (window.veloce) {
      window.veloce.pauseDownload(_0x580b5c.id || _0x580b5c.filename);
    }
  }
};
document.getElementById("btn-resume").onclick = () => {
  const _0x34343b = document.querySelector("#dl-tbody tr.selected");
  if (!_0x34343b) {
    statusText.textContent = "Select a download first";
    return;
  }
  const _0x2be426 = Array.from(dlTbody.children).indexOf(_0x34343b);
  const _0x2ef247 = downloads[_0x2be426];
  if (_0x2ef247 && (_0x2ef247.status === "Paused" || _0x2ef247.status === "Interrupted")) {
    _0x2ef247.status = "Downloading";
    renderDownloads();
    statusText.textContent = "Resumed: " + _0x2ef247.filename;
    if (window.veloce) {
      window.veloce.resumeDownload(_0x2ef247.id || _0x2ef247.filename);
    }
  }
};
document.getElementById("btn-resume-all").onclick = () => {
  let _0x477f5a = 0;
  downloads.forEach(_0x3408d6 => {
    if (_0x3408d6.status === "Paused" || _0x3408d6.status === "Interrupted") {
      _0x3408d6.status = "Downloading";
      if (window.veloce) {
        window.veloce.resumeDownload(_0x3408d6.id || _0x3408d6.filename);
      }
      _0x477f5a++;
    }
  });
  renderDownloads();
  statusText.textContent = _0x477f5a > 0 ? "Resumed " + _0x477f5a + " download(s)" : "No paused downloads";
};
var settingsPanel = document.getElementById("settings-panel");
var settingsOpen = false;
function updateEngineStats(_0x44b9f8) {
  var _0x258b84 = document.getElementById("settings-engine-stats");
  if (_0x258b84) {
    _0x258b84.textContent = "HLS Tunnels: " + _0x44b9f8.hlsTunnels + " | Direct Workers: " + _0x44b9f8.directWorkers + " | Chunk: " + _0x44b9f8.chunkSizeMB + " MB | Retries: " + _0x44b9f8.maxRetries;
  }
}
function initSelector(_0x5aba41, _0x1b35fe, _0x5ad5d8) {
  var _0xf5c957 = document.getElementById(_0x5aba41);
  if (!_0xf5c957) {
    return;
  }
  var _0x3472fd = _0xf5c957.querySelectorAll(".tunnel-opt");
  _0x3472fd.forEach(function (_0x47f2a5) {
    _0x47f2a5.classList.toggle("active", _0x47f2a5.getAttribute("data-val") === String(_0x1b35fe));
    _0x47f2a5.onclick = function () {
      _0x3472fd.forEach(function (_0x335b8d) {
        _0x335b8d.classList.remove("active");
      });
      _0x47f2a5.classList.add("active");
      _0x5ad5d8(Number(_0x47f2a5.getAttribute("data-val")));
    };
  });
}
var PAGE_TITLES = {
  downloads: "Downloads",
  detection: "Detection",
  privacy: "Privacy & Security",
  system: "System",
  engine: "Veloce Engine",
  about: "About Veloce"
};
function switchSettingsPage(_0x3026fb) {
  document.querySelectorAll(".settings-nav-item").forEach(function (_0x1ff1b9) {
    _0x1ff1b9.classList.toggle("active", _0x1ff1b9.getAttribute("data-page") === _0x3026fb);
  });
  document.querySelectorAll(".settings-page").forEach(function (_0x25a856) {
    _0x25a856.classList.toggle("active", _0x25a856.id === "page-" + _0x3026fb);
  });
  var _0x3a2a99 = document.getElementById("settings-page-title");
  if (_0x3a2a99) {
    _0x3a2a99.textContent = PAGE_TITLES[_0x3026fb] || _0x3026fb;
  }
}
async function openSettings() {
  settingsOpen = true;
  settingsPanel.style.display = "flex";
  document.getElementById("btn-settings").classList.add("active");
  var _0x453b76 = await window.veloce.getSettings();
  initSelector("tunnel-selector", _0x453b76.hlsTunnels, function (_0x239be2) {
    var _0x382118 = {
      hlsTunnels: _0x239be2
    };
    window.veloce.updateSettings(_0x382118);
    _0x453b76.hlsTunnels = _0x239be2;
    updateEngineStats(_0x453b76);
  });
  initSelector("direct-worker-selector", _0x453b76.directWorkers, function (_0x303ff6) {
    var _0x5edb4d = {
      directWorkers: _0x303ff6
    };
    window.veloce.updateSettings(_0x5edb4d);
    _0x453b76.directWorkers = _0x303ff6;
    updateEngineStats(_0x453b76);
  });
  initSelector("chunk-size-selector", _0x453b76.chunkSizeMB, function (_0x14b3a3) {
    var _0xda2ba0 = {
      chunkSizeMB: _0x14b3a3
    };
    window.veloce.updateSettings(_0xda2ba0);
    _0x453b76.chunkSizeMB = _0x14b3a3;
    updateEngineStats(_0x453b76);
  });
  initSelector("retry-selector", _0x453b76.maxRetries, function (_0x41dfa7) {
    var _0x3d5da5 = {
      maxRetries: _0x41dfa7
    };
    window.veloce.updateSettings(_0x3d5da5);
    _0x453b76.maxRetries = _0x41dfa7;
    updateEngineStats(_0x453b76);
  });
  var _0x4acaae = document.getElementById("settings-dl-path");
  if (_0x4acaae) {
    _0x4acaae.textContent = _0x453b76.downloadPath;
  }
  var _0x2b7082 = document.getElementById("settings-remux");
  var _0x5da27e = document.getElementById("settings-sniffer");
  var _0xb0780d = document.getElementById("settings-sound");
  if (_0x2b7082) {
    _0x2b7082.checked = _0x453b76.remuxEnabled;
  }
  if (_0x5da27e) {
    _0x5da27e.checked = _0x453b76.snifferEnabled;
  }
  if (_0xb0780d) {
    _0xb0780d.checked = _0x453b76.soundEnabled;
  }
  updateEngineStats(_0x453b76);
  switchSettingsPage("downloads");
}
function closeSettings() {
  settingsOpen = false;
  settingsPanel.style.display = "none";
  document.getElementById("btn-settings").classList.remove("active");
  statusText.textContent = "Settings saved";
}
document.getElementById("settings-nav").addEventListener("click", function (_0x3f0721) {
  var _0x2c21b0 = _0x3f0721.target.closest(".settings-nav-item");
  if (!_0x2c21b0) {
    return;
  }
  var _0x588214 = _0x2c21b0.getAttribute("data-page");
  if (_0x588214) {
    switchSettingsPage(_0x588214);
  }
});
document.getElementById("btn-settings").onclick = function () {
  if (settingsOpen) {
    closeSettings();
  } else {
    openSettings();
  }
};
document.getElementById("settings-close").onclick = function () {
  closeSettings();
};
document.getElementById("settings-remux").onchange = function () {
  var _0x219ff0 = {
    remuxEnabled: this.checked
  };
  window.veloce.updateSettings(_0x219ff0);
};
document.getElementById("settings-sniffer").onchange = function () {
  var _0x2782ae = {
    snifferEnabled: this.checked
  };
  window.veloce.updateSettings(_0x2782ae);
};
document.getElementById("settings-sound").onchange = function () {
  var _0x44ec4d = {
    soundEnabled: this.checked
  };
  window.veloce.updateSettings(_0x44ec4d);
};
document.getElementById("settings-browse-folder").onclick = function () {
  window.veloce.selectDownloadPath().then(function (_0xbff7b0) {
    var _0x1cb647 = document.getElementById("settings-dl-path");
    if (_0xbff7b0 && _0x1cb647) {
      _0x1cb647.textContent = _0xbff7b0;
      var _0x126158 = {
        downloadPath: _0xbff7b0
      };
      window.veloce.updateSettings(_0x126158);
    }
  });
};
var clearDataBtn = document.getElementById("settings-clear-data");
if (clearDataBtn) {
  clearDataBtn.onclick = function () {
    var _0x2e639a = document.getElementById("clear-data-modal");
    if (_0x2e639a) {
      _0x2e639a.style.display = "flex";
    }
  };
}
(function () {
  var _0x2f9c9a = document.getElementById("clear-data-modal");
  if (!_0x2f9c9a) {
    return;
  }
  var _0x32cce7 = document.getElementById("clear-data-modal-close");
  var _0x3d4b2b = document.getElementById("clear-data-modal-cancel");
  var _0x22af1f = document.getElementById("clear-data-modal-confirm");
  function _0x8c8fc2() {
    _0x2f9c9a.style.display = "none";
  }
  if (_0x32cce7) {
    _0x32cce7.onclick = _0x8c8fc2;
  }
  if (_0x3d4b2b) {
    _0x3d4b2b.onclick = _0x8c8fc2;
  }
  _0x2f9c9a.addEventListener("click", function (_0x5d5f36) {
    if (_0x5d5f36.target === _0x2f9c9a) {
      _0x8c8fc2();
    }
  });
  if (_0x22af1f) {
    _0x22af1f.onclick = function () {
      var _0x1149a5 = document.getElementById("clear-data-time-range");
      var _0x2e4486 = _0x1149a5 ? parseInt(_0x1149a5.value) : 0;
      var _0x413514 = {
        history: document.getElementById("clear-opt-history")?.checked || false,
        cookies: document.getElementById("clear-opt-cookies")?.checked || false,
        cache: document.getElementById("clear-opt-cache")?.checked || false,
        storage: document.getElementById("clear-opt-storage")?.checked || false
      };
      if (!_0x413514.history && !_0x413514.cookies && !_0x413514.cache && !_0x413514.storage) {
        alert("Select at least one item to clear.");
        return;
      }
      _0x22af1f.textContent = "Clearing...";
      _0x22af1f.disabled = true;
      if (window.veloce && window.veloce.clearBrowsingData) {
        var _0x4f85b5 = {
          timeRange: _0x2e4486,
          dataTypes: _0x413514
        };
        window.veloce.clearBrowsingData(_0x4f85b5).then(function (_0x3a5e96) {
          _0x22af1f.textContent = "Clear Data";
          _0x22af1f.disabled = false;
          _0x8c8fc2();
          var _0x234cbe = document.getElementById("status-text");
          if (_0x3a5e96 && _0x3a5e96.success) {
            if (_0x234cbe) {
              _0x234cbe.textContent = "Browsing data cleared";
            }
            alert("Browsing data cleared successfully.");
          } else {
            if (_0x234cbe) {
              _0x234cbe.textContent = "Failed to clear data";
            }
            alert("Error: " + (_0x3a5e96?.error || "unknown"));
          }
        }).catch(function (_0x110c59) {
          _0x22af1f.textContent = "Clear Data";
          _0x22af1f.disabled = false;
          var _0x2949bf = document.getElementById("status-text");
          if (_0x2949bf) {
            _0x2949bf.textContent = "Error clearing data";
          }
          alert("Error: " + (_0x110c59?.message || _0x110c59));
        });
      } else {
        _0x22af1f.textContent = "Clear Data";
        _0x22af1f.disabled = false;
        _0x8c8fc2();
        alert("Clear browsing data is not available.");
      }
    };
  }
})();
var autostartEl = document.getElementById("settings-autostart");
if (autostartEl) {
  autostartEl.onchange = function () {
    var _0x4e4260 = {
      autoStart: this.checked
    };
    window.veloce.updateSettings(_0x4e4260);
  };
}
function closeAllOverlays() {
  var _0x6d044e = document.getElementById("crawler-panel");
  if (_0x6d044e) {
    _0x6d044e.style.display = "none";
    crawlerPanelOpen = false;
  }
  var _0xcdf5ea = document.getElementById("btn-crawler");
  if (_0xcdf5ea) {
    _0xcdf5ea.classList.remove("active");
  }
  var _0x300cd7 = document.getElementById("ai-search-panel");
  if (_0x300cd7) {
    _0x300cd7.style.display = "none";
    searchPanelOpen = false;
  }
  var _0x300152 = document.getElementById("btn-ai-search");
  if (_0x300152) {
    _0x300152.classList.remove("active");
  }
}
let searchPanelOpen = false;
let lastSearchResults = [];
function toggleSearchPanel() {
  const _0x44d5d6 = document.getElementById("ai-search-panel");
  if (!_0x44d5d6) {
    return;
  }
  searchPanelOpen = !searchPanelOpen;
  if (searchPanelOpen) {
    _0x44d5d6.style.display = "flex";
    const _0xc91630 = browserArea.getBoundingClientRect();
    _0x44d5d6.style.position = "absolute";
    _0x44d5d6.style.top = "0";
    _0x44d5d6.style.left = "0";
    _0x44d5d6.style.right = "0";
    _0x44d5d6.style.bottom = "0";
    if (lastSearchResults.length === 0) {
      showSearchEmptyState();
    }
    setTimeout(function () {
      var _0x231cde = document.getElementById("search-input");
      if (_0x231cde) {
        _0x231cde.focus();
      }
    }, 100);
    var _0x21194a = document.getElementById("btn-ai-search");
    if (_0x21194a) {
      _0x21194a.classList.add("active");
    }
  } else {
    _0x44d5d6.style.display = "none";
    var _0x21194a = document.getElementById("btn-ai-search");
    if (_0x21194a) {
      _0x21194a.classList.remove("active");
    }
  }
}
function showSearchEmptyState() {
  var _0x4cb9d6 = document.getElementById("search-results");
  _0x4cb9d6.innerHTML = "\n    <div class=\"search-empty\">\n      <div class=\"search-empty-icon\">🧠</div>\n      <div class=\"search-empty-text\">Veloce AI Deep Search</div>\n      <div class=\"search-empty-hint\">\n        Search for old firmware, rare software, hidden downloads, archived files...<br>\n        AI searches Internet Archive, Wayback Machine, GitHub Releases & Open Directories simultaneously\n      </div>\n    </div>\n  ";
}
function showSearchLoading(_0x51aaf6) {
  var _0x1547c1 = document.getElementById("search-results");
  _0x1547c1.innerHTML = "\n    <div class=\"search-loading\">\n      <div class=\"search-loading-spinner\"></div>\n      <div>Searching across all sources for \"" + _0x51aaf6 + "\"...</div>\n      <div style=\"font-size: 11px; color: #64748b; margin-top: 6px;\">\n        Internet Archive • Wayback Machine • GitHub • Open Directories\n      </div>\n    </div>\n  ";
  var _0x358c86 = document.getElementById("search-status");
  _0x358c86.style.display = "block";
  _0x358c86.textContent = "Searching...";
  _0x358c86.style.color = "#3b82f6";
}
function formatSearchSize(_0x432e2e) {
  if (!_0x432e2e || _0x432e2e <= 0) {
    return "";
  }
  if (_0x432e2e > 1073741824) {
    return (_0x432e2e / 1073741824).toFixed(1) + " GB";
  }
  if (_0x432e2e > 1048576) {
    return (_0x432e2e / 1048576).toFixed(1) + " MB";
  }
  if (_0x432e2e > 1024) {
    return (_0x432e2e / 1024).toFixed(0) + " KB";
  }
  return _0x432e2e + " B";
}
function getSourceBadgeClass(_0x37e053) {
  if (_0x37e053 === "Internet Archive") {
    return "sr-source-ia";
  }
  if (_0x37e053 === "Wayback Machine") {
    return "sr-source-wb";
  }
  if (_0x37e053 === "GitHub") {
    return "sr-source-gh";
  }
  if (_0x37e053 === "Open Directories") {
    return "sr-source-od";
  }
  if (_0x37e053 === "Archive Software") {
    return "sr-source-as";
  }
  return "sr-source-ia";
}
function renderSearchResults(_0x20bc38) {
  var _0x6bc852 = document.getElementById("search-results");
  var _0x31b6a9 = document.getElementById("search-status");
  lastSearchResults = _0x20bc38.results || [];
  if (lastSearchResults.length === 0) {
    _0x6bc852.innerHTML = "\n      <div class=\"search-empty\">\n        <div class=\"search-empty-icon\">🔍</div>\n        <div class=\"search-empty-text\">No results found for \"" + _0x20bc38.query + "\"</div>\n        <div class=\"search-empty-hint\">\n          Try different keywords, remove version numbers, or use broader terms.<br>\n          " + (_0x20bc38.expandedQueries && _0x20bc38.expandedQueries.length > 1 ? "Also searched: " + _0x20bc38.expandedQueries.slice(1).map(function (_0x4429f9) {
      return "\"" + _0x4429f9 + "\"";
    }).join(", ") : "") + "\n        </div>\n      </div>\n    ";
    _0x31b6a9.textContent = "No results found — " + _0x20bc38.searchTime + "s";
    _0x31b6a9.style.color = "#ef4444";
    return;
  }
  _0x31b6a9.textContent = _0x20bc38.totalResults + " results found in " + _0x20bc38.searchTime + "s" + (_0x20bc38.expandedQueries && _0x20bc38.expandedQueries.length > 1 ? " — also searched: " + _0x20bc38.expandedQueries.slice(1).map(function (_0x235d56) {
    return "\"" + _0x235d56 + "\"";
  }).join(", ") : "");
  _0x31b6a9.style.color = "#22c55e";
  _0x6bc852.innerHTML = "";
  lastSearchResults.forEach(function (_0x5e0d41, _0x1556af) {
    var _0x5b62d5 = document.createElement("div");
    _0x5b62d5.className = "search-result-card";
    var _0x669470 = formatSearchSize(_0x5e0d41.size);
    var _0x44aa1a = getSourceBadgeClass(_0x5e0d41.source);
    var _0x12fc41 = "<span class=\"sr-badge " + _0x44aa1a + "\">" + _0x5e0d41.source + "</span>";
    if (_0x5e0d41.relevance !== undefined) {
      var _0x48ed64 = _0x5e0d41.relevance >= 60 ? "#22c55e" : _0x5e0d41.relevance >= 30 ? "#eab308" : "#ef4444";
      _0x12fc41 += "<span class=\"sr-type\" style=\"color:" + _0x48ed64 + ";font-weight:bold;\">" + _0x5e0d41.relevance + "% match</span>";
    }
    if (_0x669470) {
      _0x12fc41 += "<span class=\"sr-size\">" + _0x669470 + "</span>";
    }
    if (_0x5e0d41.date) {
      _0x12fc41 += "<span class=\"sr-date\">" + _0x5e0d41.date + "</span>";
    }
    if (_0x5e0d41.version) {
      _0x12fc41 += "<span class=\"sr-type\">v" + _0x5e0d41.version + "</span>";
    }
    if (_0x5e0d41.stars) {
      _0x12fc41 += "<span class=\"sr-type\">⭐ " + _0x5e0d41.stars + "</span>";
    }
    if (_0x5e0d41.formats) {
      _0x12fc41 += "<span class=\"sr-type\">" + _0x5e0d41.formats.slice(0, 60) + "</span>";
    }
    var _0x36f06a = _0x5e0d41.description ? "<div class=\"sr-desc\">" + _0x5e0d41.description.replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</div>" : "";
    _0x5b62d5.innerHTML = "\n      <div class=\"sr-top-row\">\n        <div class=\"sr-info\">\n          <div class=\"sr-title\">" + _0x5e0d41.title.replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</div>\n          <div class=\"sr-meta\">" + _0x12fc41 + "</div>\n          " + _0x36f06a + "\n        </div>\n        <div class=\"sr-actions\">\n          <button class=\"sr-dl-btn\" data-idx=\"" + _0x1556af + "\" title=\"Download with Veloce\">⬇ Download</button>\n          <button class=\"sr-open-btn\" data-idx=\"" + _0x1556af + "\" title=\"Open in browser tab\">Open</button>\n          <button class=\"sr-check-btn\" data-idx=\"" + _0x1556af + "\" title=\"Check if link is alive\">Check</button>\n        </div>\n      </div>\n    ";
    _0x5b62d5.querySelector(".sr-dl-btn").onclick = function () {
      var _0x18a885 = lastSearchResults[_0x1556af];
      if (!_0x18a885) {
        return;
      }
      var _0x5e3137 = _0x18a885.title.replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, "_").slice(0, 60) || "download";
      toggleSearchPanel();
      startDownload(_0x18a885.url, _0x5e3137, _0x18a885.pageUrl || _0x18a885.url);
    };
    _0x5b62d5.querySelector(".sr-open-btn").onclick = function () {
      var _0x58121f = lastSearchResults[_0x1556af];
      if (!_0x58121f) {
        return;
      }
      var _0x1c0154 = _0x58121f.pageUrl || _0x58121f.url;
      toggleSearchPanel();
      createTab(_0x1c0154);
    };
    _0x5b62d5.querySelector(".sr-check-btn").onclick = function () {
      var _0x1e9f10 = this;
      var _0x5a98ef = lastSearchResults[_0x1556af];
      if (!_0x5a98ef || !window.veloce) {
        return;
      }
      _0x1e9f10.textContent = "...";
      _0x1e9f10.disabled = true;
      window.veloce.checkUrlAlive(_0x5a98ef.url).then(function (_0x5b4698) {
        if (_0x5b4698.alive) {
          _0x1e9f10.textContent = "✓ Alive";
          _0x1e9f10.className = "sr-check-btn alive";
          if (_0x5b4698.size > 0) {
            _0x5a98ef.size = _0x5b4698.size;
            var _0x5bbb56 = _0x5b62d5.querySelector(".sr-size");
            if (_0x5bbb56) {
              _0x5bbb56.textContent = formatSearchSize(_0x5b4698.size);
            } else {
              var _0x53bfd5 = _0x5b62d5.querySelector(".sr-meta");
              if (_0x53bfd5) {
                var _0x10b933 = document.createElement("span");
                _0x10b933.className = "sr-size";
                _0x10b933.textContent = formatSearchSize(_0x5b4698.size);
                _0x53bfd5.appendChild(_0x10b933);
              }
            }
          }
        } else {
          _0x1e9f10.textContent = "✗ Dead";
          _0x1e9f10.className = "sr-check-btn dead";
          window.veloce.resurrectLink(_0x5a98ef.originalUrl || _0x5a98ef.url).then(function (_0x4815b2) {
            if (_0x4815b2.found) {
              _0x1e9f10.textContent = "↻ Resurrected";
              _0x1e9f10.className = "sr-check-btn resurrected";
              _0x1e9f10.title = "Found on Wayback Machine — click Download to get archived version";
              _0x5a98ef.url = _0x4815b2.waybackUrl;
              _0x5a98ef.source = "Wayback (Rescued)";
              var _0x4442de = _0x5b62d5.querySelector(".sr-badge");
              if (_0x4442de) {
                _0x4442de.textContent = "Wayback (Rescued)";
                _0x4442de.className = "sr-badge sr-source-wb";
              }
            }
          }).catch(function () {});
        }
        _0x1e9f10.disabled = false;
      }).catch(function () {
        _0x1e9f10.textContent = "? Error";
        _0x1e9f10.disabled = false;
      });
    };
    _0x6bc852.appendChild(_0x5b62d5);
  });
}
async function performSearch() {
  var _0x309d65 = document.getElementById("search-input");
  var _0x1b0d4c = document.getElementById("search-go");
  if (!_0x309d65 || !window.veloce || !window.veloce.search) {
    return;
  }
  var _0x29d980 = _0x309d65.value.trim();
  if (!_0x29d980) {
    _0x309d65.focus();
    return;
  }
  _0x1b0d4c.disabled = true;
  _0x1b0d4c.textContent = "Searching...";
  showSearchLoading(_0x29d980);
  try {
    var _0x7cc795 = await window.veloce.search(_0x29d980);
    renderSearchResults(_0x7cc795);
  } catch (_0x5a1e33) {
    var _0xdd81c2 = document.getElementById("search-results");
    _0xdd81c2.innerHTML = "\n      <div class=\"search-empty\">\n        <div class=\"search-empty-icon\">⚠</div>\n        <div class=\"search-empty-text\">Search failed</div>\n        <div class=\"search-empty-hint\">" + (_0x5a1e33.message || "Unknown error") + "</div>\n      </div>\n    ";
  }
  _0x1b0d4c.disabled = false;
  _0x1b0d4c.textContent = "Search";
}
document.getElementById("btn-ai-search").onclick = toggleSearchPanel;
document.getElementById("search-close").onclick = toggleSearchPanel;
document.getElementById("search-go").onclick = performSearch;
document.getElementById("search-input").addEventListener("keydown", function (_0xb5b68c) {
  if (_0xb5b68c.key === "Enter") {
    performSearch();
  }
  if (_0xb5b68c.key === "Escape") {
    toggleSearchPanel();
  }
});
document.addEventListener("keydown", function (_0x4f9621) {
  if (_0x4f9621.key === "F12" || _0x4f9621.ctrlKey && _0x4f9621.shiftKey && _0x4f9621.key === "I") {
    _0x4f9621.preventDefault();
    var _0x24c854 = tabs.find(function (_0x254ec4) {
      return _0x254ec4.id === activeTabId;
    });
    if (_0x24c854 && _0x24c854.webview) {
      if (_0x24c854.webview.isDevToolsOpened()) {
        _0x24c854.webview.closeDevTools();
      } else {
        _0x24c854.webview.openDevTools();
      }
    }
  }
  if (_0x4f9621.ctrlKey && _0x4f9621.shiftKey && _0x4f9621.key === "J") {
    _0x4f9621.preventDefault();
    if (window.veloce && window.veloce.toggleDevTools) {
      window.veloce.toggleDevTools();
    }
  }
});
var crawlerPanelOpen = false;
function toggleCrawlerPanel() {
  var _0x377539 = document.getElementById("crawler-panel");
  if (!_0x377539) {
    createCrawlerPanel();
    _0x377539 = document.getElementById("crawler-panel");
  }
  var _0x1c8456 = document.getElementById("ai-search-panel");
  if (_0x1c8456) {
    _0x1c8456.style.display = "none";
    searchPanelOpen = false;
  }
  crawlerPanelOpen = !crawlerPanelOpen;
  _0x377539.style.display = crawlerPanelOpen ? "flex" : "none";
  if (crawlerPanelOpen) {
    if (window.veloce && window.veloce.crawlerStats) {
      window.veloce.crawlerStats().then(updateCrawlerDashboard);
    }
  }
}
function createCrawlerPanel() {
  var _0x3adab1 = document.getElementById("crawler-panel");
  if (_0x3adab1) {
    return;
  }
  var _0x1a5b92 = document.createElement("div");
  _0x1a5b92.id = "crawler-panel";
  _0x1a5b92.style.cssText = "\n    display: none; position: absolute; top: 0; left: 0; right: 0; bottom: 0;\n    z-index: 9999; background: #060a12;\n    flex-direction: column; font-family: 'Rajdhani', 'Consolas', monospace;\n    color: #e0e0e0;\n  ";
  _0x1a5b92.innerHTML = "\n    <div style=\"\n      display: flex; justify-content: space-between; align-items: center;\n      padding: 8px 16px; background: linear-gradient(135deg, #0f172a, #1e293b);\n      border-bottom: 2px solid #0ea5e9;\n    \">\n      <div style=\"display: flex; align-items: center; gap: 10px;\">\n        <span style=\"font-family: 'Orbitron', sans-serif; font-size: 14px; color: #0ea5e9; letter-spacing: 2px;\">VELOCE CRAWLER</span>\n        <span id=\"cw-status-badge\" style=\"\n          padding: 2px 8px; border-radius: 3px; font-size: 10px; font-weight: bold;\n          text-transform: uppercase; letter-spacing: 1px;\n          background: #1e293b; color: #64748b; border: 1px solid #334155;\n        \">IDLE</span>\n      </div>\n      <div style=\"display: flex; gap: 6px;\">\n        <button id=\"cw-btn-start\" class=\"cw-btn cw-btn-green\">▶ Start</button>\n        <button id=\"cw-btn-pause\" class=\"cw-btn cw-btn-yellow\" disabled>⏸ Pause</button>\n        <button id=\"cw-btn-stop\" class=\"cw-btn cw-btn-red\" disabled>⏹ Stop</button>\n        <button id=\"cw-btn-skip\" class=\"cw-btn\" disabled>⏭ Skip</button>\n        <div style=\"width: 1px; background: #334155; margin: 0 4px;\"></div>\n        <button id=\"cw-btn-clear\" class=\"cw-btn\" style=\"color:#ef4444;border-color:#7f1d1d;background:rgba(127,29,29,0.2);\">🗑 Clear DB</button>\n        <button id=\"cw-btn-close\" class=\"cw-btn\">✕ Close</button>\n      </div>\n    </div>\n\n    <div style=\"display: flex; flex: 1; overflow: hidden;\">\n      <!-- Left: Stats panel -->\n      <div style=\"width: 280px; padding: 12px; border-right: 1px solid #1e293b; overflow-y: auto;\">\n        <div class=\"cw-stat-group\">\n          <div class=\"cw-stat-title\">PROGRESS</div>\n          <div class=\"cw-stat-row\"><span>Status</span><span id=\"cw-stat-status\" style=\"color: #64748b;\">Idle</span></div>\n          <div class=\"cw-stat-row\"><span>Current term</span><span id=\"cw-stat-term\" style=\"color: #0ea5e9; font-size: 11px;\">—</span></div>\n          <div class=\"cw-stat-row\"><span>Category</span><span id=\"cw-stat-category\">—</span></div>\n          <div class=\"cw-stat-row\"><span>Term #</span><span id=\"cw-stat-term-num\">0 / 0</span></div>\n          <div class=\"cw-stat-row\"><span>Uptime</span><span id=\"cw-stat-uptime\">—</span></div>\n        </div>\n        <div class=\"cw-stat-group\">\n          <div class=\"cw-stat-title\">DISCOVERIES</div>\n          <div class=\"cw-stat-row\"><span>Patterns found</span><span id=\"cw-stat-patterns\" style=\"color: #22c55e; font-weight: bold;\">0</span></div>\n          <div class=\"cw-stat-row\"><span>Files found</span><span id=\"cw-stat-files\" style=\"color: #22c55e;\">0</span></div>\n          <div class=\"cw-stat-row\"><span>Domains learned</span><span id=\"cw-stat-domains\">0</span></div>\n        </div>\n        <div class=\"cw-stat-group\">\n          <div class=\"cw-stat-title\">ACTIVITY</div>\n          <div class=\"cw-stat-row\"><span>Sites visited</span><span id=\"cw-stat-sites\">0</span></div>\n          <div class=\"cw-stat-row\"><span>Pages visited</span><span id=\"cw-stat-pages\">0</span></div>\n          <div class=\"cw-stat-row\"><span>Errors</span><span id=\"cw-stat-errors\" style=\"color: #ef4444;\">0</span></div>\n        </div>\n        <div class=\"cw-stat-group\">\n          <div class=\"cw-stat-title\">ADD SEARCH TERM</div>\n          <input id=\"cw-add-term\" type=\"text\" placeholder=\"e.g. Winamp 5.8\" style=\"\n            width: 100%; padding: 6px 8px; background: #0f172a; border: 1px solid #334155;\n            border-radius: 4px; color: #e0e0e0; font-size: 12px; margin-bottom: 6px; box-sizing: border-box;\n          \">\n          <button id=\"cw-btn-add\" class=\"cw-btn\" style=\"width: 100%; font-size: 11px;\">+ Add Term</button>\n        </div>\n      </div>\n\n      <!-- Right: tabbed view — LIVE LOG stays, TERMS tab added -->\n      <div style=\"flex: 1; display: flex; flex-direction: column; overflow: hidden;\">\n\n        <!-- Tab bar -->\n        <div style=\"display: flex; align-items: center; background: #0a0e17; border-bottom: 1px solid #1e293b; padding: 0 8px;\">\n          <button id=\"cw-tab-log\" style=\"\n            padding: 6px 14px; background: none; border: none; border-bottom: 2px solid #0ea5e9;\n            color: #0ea5e9; font-family: 'Orbitron', sans-serif; font-size: 10px; letter-spacing: 2px;\n            cursor: pointer; text-transform: uppercase;\n          \">LIVE LOG</button>\n          <button id=\"cw-tab-terms\" style=\"\n            padding: 6px 14px; background: none; border: none; border-bottom: 2px solid transparent;\n            color: #475569; font-family: 'Orbitron', sans-serif; font-size: 10px; letter-spacing: 2px;\n            cursor: pointer; text-transform: uppercase;\n          \">TERMS</button>\n          <span id=\"cw-current-url\" style=\"margin-left: 10px; font-size: 10px; color: #475569; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;\"></span>\n        </div>\n\n        <!-- LIVE LOG view (stays exactly as before) -->\n        <div id=\"cw-log-view\" style=\"flex: 1; display: flex; flex-direction: column; overflow: hidden;\">\n          <div id=\"cw-log\" style=\"\n            flex: 1; overflow-y: auto; padding: 8px 12px;\n            font-family: 'Consolas', 'Courier New', monospace;\n            font-size: 11px; line-height: 1.6;\n            background: #060a12;\n          \"></div>\n        </div>\n\n        <!-- TERMS view (hidden by default) -->\n        <div id=\"cw-terms-view\" style=\"flex: 1; display: none; flex-direction: column; overflow: hidden; background: #060a12;\">\n          <!-- Terms toolbar -->\n          <div style=\"display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid #1e293b; background: #0a0e17;\">\n            <select id=\"cw-term-filter\" style=\"\n              background: #0f172a; border: 1px solid #334155; color: #e0e0e0;\n              padding: 4px 8px; border-radius: 4px; font-size: 11px; flex: 1;\n            \"><option value=\"__all__\">All Categories</option></select>\n            <span id=\"cw-term-count\" style=\"color: #475569; font-size: 11px; white-space: nowrap;\"></span>\n            <button id=\"cw-btn-remove-selected\" style=\"\n              padding: 4px 10px; background: #7f1d1d; border: 1px solid #ef4444;\n              color: #fca5a5; border-radius: 4px; font-size: 11px; cursor: pointer;\n            \">Remove Selected</button>\n          </div>\n          <!-- Terms list -->\n          <div id=\"cw-term-list\" style=\"flex: 1; overflow-y: auto; padding: 4px 12px;\"></div>\n        </div>\n\n      </div>\n    </div>\n  ";
  var _0x451939 = document.getElementById("browser-area");
  if (_0x451939) {
    _0x451939.appendChild(_0x1a5b92);
  } else {
    document.body.appendChild(_0x1a5b92);
  }
  document.getElementById("cw-btn-start").onclick = function () {
    // Collect ticked terms first
    var checkedBoxes = document.querySelectorAll(".cw-term-check:checked");
    var selectedTerms = [];
    checkedBoxes.forEach(function(cb) {
      var row = cb.closest("[data-term]");
      if (row) {
        selectedTerms.push({
          term: row.getAttribute("data-term"),
          category: row.getAttribute("data-cat")
        });
      }
    });

    var opts;
    if (selectedTerms.length > 0) {
      opts = { selectedTerms: selectedTerms };
    } else {
      // No terms ticked — fall back to category filter
      var filterEl = document.getElementById("cw-term-filter");
      var cat = filterEl ? filterEl.value : "__all__";
      opts = cat !== "__all__" ? { category: cat } : undefined;
    }

    if (window.veloce) {
      window.veloce.crawlerStart(opts);
    }
    setCrawlerButtons("running");
  };
  document.getElementById("cw-btn-pause").onclick = function () {
    if (window.veloce) {
      window.veloce.crawlerPause();
    }
    setCrawlerButtons("paused");
  };
  document.getElementById("cw-btn-stop").onclick = function () {
    if (window.veloce) {
      window.veloce.crawlerStop();
    }
    setCrawlerButtons("stopped");
  };
  document.getElementById("cw-btn-skip").onclick = function () {
    if (window.veloce) {
      window.veloce.crawlerSkip();
    }
  };
  document.getElementById("cw-btn-close").onclick = function () {
    toggleCrawlerPanel();
  };
  document.getElementById("cw-btn-clear").onclick = function () {
    if (!window.veloce || !window.veloce.crawlerClearPatterns) return;
    if (!confirm('Clear ALL discovered patterns and links?\nThis cannot be undone.')) return;
    var btn = this;
    btn.disabled = true;
    btn.textContent = '🗑 Clearing...';
    window.veloce.crawlerClearPatterns().then(function(res) {
      btn.disabled = false;
      btn.textContent = '🗑 Clear DB';
      if (res.ok) {
        // Reset stats display
        ['cw-stat-patterns','cw-stat-files','cw-stat-domains'].forEach(function(id) {
          var el = document.getElementById(id); if (el) el.textContent = '0';
        });
        var logEl = document.getElementById('cw-log');
        if (logEl) logEl.innerHTML = '<div style="color:#22c55e;padding:4px 0;">🗑 Cleared ' + (res.cleared || 0) + ' patterns. DB is fresh.</div>';
      } else {
        alert('Failed to clear: ' + (res.error || 'unknown error'));
      }
    }).catch(function(e) {
      btn.disabled = false;
      btn.textContent = '🗑 Clear DB';
      alert('Error: ' + e.message);
    });
  };
  document.getElementById("cw-btn-add").onclick = function () {
    var _0x24d8f9 = document.getElementById("cw-add-term");
    var _0x5a033d = _0x24d8f9.value.trim();
    if (_0x5a033d && window.veloce) {
      window.veloce.crawlerAddTerm(_0x5a033d, "custom");
      _0x24d8f9.value = "";
    }
  };
  document.getElementById("cw-add-term").addEventListener("keydown", function (_0x16c268) {
    if (_0x16c268.key === "Enter") {
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
    loadTermManager();
  };
  document.getElementById("cw-term-filter").onchange = function () {
    renderTermList(this.value);
  };
  document.getElementById("cw-btn-remove-selected").onclick = function () {
    var _0x3c5fe3 = document.querySelectorAll(".cw-term-check:checked");
    if (_0x3c5fe3.length === 0) {
      return;
    }
    var _0x1aeec4 = [];
    _0x3c5fe3.forEach(function (_0x50169a) {
      var _0x3821b9 = _0x50169a.closest("[data-term]");
      if (_0x3821b9) {
        _0x1aeec4.push({
          term: _0x3821b9.getAttribute("data-term"),
          category: _0x3821b9.getAttribute("data-cat")
        });
      }
    });
    if (window.veloce && window.veloce.crawlerRemoveBulk) {
      window.veloce.crawlerRemoveBulk(_0x1aeec4).then(function (_0x30e9b9) {
        if (_0x30e9b9.ok) {
          loadTermManager();
        }
      });
    }
  };
}
var _termData = null;
function loadTermManager() {
  if (!window.veloce || !window.veloce.crawlerGetTerms) {
    return;
  }
  window.veloce.crawlerGetTerms().then(function (_0x44d34b) {
    _termData = _0x44d34b;
    var _0x2703a3 = document.getElementById("cw-term-filter");
    var _0x4906cf = Object.keys(_0x44d34b.categories || {}).sort();
    _0x2703a3.innerHTML = "<option value=\"__all__\">All Categories</option>";
    for (var _0x1f0e36 = 0; _0x1f0e36 < _0x4906cf.length; _0x1f0e36++) {
      var _0x25a601 = _0x44d34b.categories[_0x4906cf[_0x1f0e36]].length;
      _0x2703a3.innerHTML += "<option value=\"" + _0x4906cf[_0x1f0e36] + "\">" + _0x4906cf[_0x1f0e36].replace(/_/g, " ") + " (" + _0x25a601 + ")</option>";
    }
    renderTermList("__all__");
  });
}
function renderTermList(_0x537b96) {
  if (!_termData) {
    return;
  }
  var _0x42cf4a = document.getElementById("cw-term-list");
  var _0x37db84 = _termData.categories || {};
  var _0x118b16 = "";
  var _0x59eb05 = 0;
  var _0x103003 = Object.keys(_0x37db84).sort();
  for (var _0x40513f = 0; _0x40513f < _0x103003.length; _0x40513f++) {
    var _0x20a204 = _0x103003[_0x40513f];
    if (_0x537b96 !== "__all__" && _0x20a204 !== _0x537b96) {
      continue;
    }
    var _0x39b854 = _0x37db84[_0x20a204];
    _0x118b16 += "<div style=\"color:#0ea5e9;font-size:10px;font-weight:bold;padding:6px 0 3px;letter-spacing:1px;text-transform:uppercase;border-bottom:1px solid #1e293b;margin-top:6px;\">" + _0x20a204.replace(/_/g, " ") + " (" + _0x39b854.length + ")</div>";
    for (var _0x337c92 = 0; _0x337c92 < _0x39b854.length; _0x337c92++) {
      _0x59eb05++;
      var _0x1ff916 = _0x39b854[_0x337c92].replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      _0x118b16 += "<div style=\"display:flex;align-items:center;padding:3px 0;border-bottom:1px solid #0f172a;\" data-term=\"" + _0x1ff916 + "\" data-cat=\"" + _0x20a204 + "\">";
      _0x118b16 += "<input type=\"checkbox\" class=\"cw-term-check\" style=\"margin-right:8px;accent-color:#0ea5e9;cursor:pointer;\">";
      _0x118b16 += "<span style=\"flex:1;color:#cbd5e1;font-size:12px;\">" + _0x1ff916 + "</span>";
      _0x118b16 += "<span style=\"color:#334155;font-size:10px;margin-right:8px;\">" + _0x20a204.replace(/_/g, " ") + "</span>";
      _0x118b16 += "<button class=\"cw-term-remove\" style=\"background:none;border:none;color:#ef4444;cursor:pointer;font-size:14px;padding:0 4px;\" title=\"Remove\">✕</button>";
      _0x118b16 += "</div>";
    }
  }
  if (!_0x118b16) {
    _0x118b16 = "<div style=\"color:#475569;padding:20px;text-align:center;\">No terms found</div>";
  }
  _0x42cf4a.innerHTML = _0x118b16;
  var _0xbe3142 = document.getElementById("cw-term-count");
  if (_0xbe3142) {
    _0xbe3142.textContent = _0x59eb05 + " terms";
  }
  _0x42cf4a.querySelectorAll(".cw-term-remove").forEach(function (_0x1e4f7a) {
    _0x1e4f7a.onclick = function () {
      var _0x58586f = this.closest("[data-term]");
      var _0x128286 = _0x58586f.getAttribute("data-term");
      var _0x505591 = _0x58586f.getAttribute("data-cat");
      if (window.veloce && window.veloce.crawlerRemoveTerm) {
        window.veloce.crawlerRemoveTerm(_0x128286, _0x505591).then(function (_0x423e89) {
          if (_0x423e89.ok) {
            loadTermManager();
          }
        });
      }
    };
  });
}
function setCrawlerButtons(_0xb913fd) {
  var _0x4375f9 = document.getElementById("cw-btn-start");
  var _0x3d29ec = document.getElementById("cw-btn-pause");
  var _0x1bb045 = document.getElementById("cw-btn-stop");
  var _0x56be4f = document.getElementById("cw-btn-skip");
  var _0x26b1be = document.getElementById("cw-status-badge");
  if (_0xb913fd === "running") {
    _0x4375f9.disabled = true;
    _0x3d29ec.disabled = false;
    _0x3d29ec.textContent = "⏸ Pause";
    _0x1bb045.disabled = false;
    _0x56be4f.disabled = false;
    _0x26b1be.textContent = "RUNNING";
    _0x26b1be.style.background = "rgba(34, 197, 94, 0.2)";
    _0x26b1be.style.color = "#22c55e";
    _0x26b1be.style.borderColor = "#22c55e";
  } else if (_0xb913fd === "paused") {
    _0x4375f9.disabled = true;
    _0x3d29ec.disabled = false;
    _0x3d29ec.textContent = "▶ Resume";
    _0x3d29ec.onclick = function () {
      if (window.veloce) {
        window.veloce.crawlerResume();
      }
      setCrawlerButtons("running");
    };
    _0x1bb045.disabled = false;
    _0x56be4f.disabled = true;
    _0x26b1be.textContent = "PAUSED";
    _0x26b1be.style.background = "rgba(234, 179, 8, 0.2)";
    _0x26b1be.style.color = "#eab308";
    _0x26b1be.style.borderColor = "#eab308";
  } else {
    _0x4375f9.disabled = false;
    _0x3d29ec.disabled = true;
    _0x3d29ec.textContent = "⏸ Pause";
    _0x3d29ec.onclick = function () {
      if (window.veloce) {
        window.veloce.crawlerPause();
      }
      setCrawlerButtons("paused");
    };
    _0x1bb045.disabled = true;
    _0x56be4f.disabled = true;
    _0x26b1be.textContent = _0xb913fd === "stopped" ? "STOPPED" : "IDLE";
    _0x26b1be.style.background = "#1e293b";
    _0x26b1be.style.color = "#64748b";
    _0x26b1be.style.borderColor = "#334155";
  }
}
function updateCrawlerDashboard(_0x10180e) {
  if (!_0x10180e || !_0x10180e.stats) {
    return;
  }
  var _0x308c16 = _0x10180e.stats;
  function _0x23ba36(_0x218f33) {
    return document.getElementById(_0x218f33);
  }
  if (_0x23ba36("cw-stat-status")) {
    _0x23ba36("cw-stat-status").textContent = _0x308c16.status || "idle";
    _0x23ba36("cw-stat-status").style.color = _0x308c16.status === "running" ? "#22c55e" : _0x308c16.status === "paused" ? "#eab308" : "#64748b";
  }
  if (_0x23ba36("cw-stat-term")) {
    _0x23ba36("cw-stat-term").textContent = _0x308c16.currentTerm || "—";
  }
  if (_0x23ba36("cw-stat-category")) {
    _0x23ba36("cw-stat-category").textContent = _0x308c16.currentCategory ? _0x308c16.currentCategory.replace(/_/g, " ") : "—";
  }
  if (_0x23ba36("cw-stat-term-num")) {
    _0x23ba36("cw-stat-term-num").textContent = (_0x308c16.termIndex || 0) + " / " + (_0x308c16.totalTerms || 0);
  }
  if (_0x23ba36("cw-stat-patterns")) {
    _0x23ba36("cw-stat-patterns").textContent = _0x308c16.patternsFound || 0;
  }
  if (_0x23ba36("cw-stat-files")) {
    _0x23ba36("cw-stat-files").textContent = _0x308c16.filesFound || 0;
  }
  if (_0x23ba36("cw-stat-domains")) {
    _0x23ba36("cw-stat-domains").textContent = _0x10180e.patternsCount || 0;
  }
  if (_0x23ba36("cw-stat-sites")) {
    _0x23ba36("cw-stat-sites").textContent = _0x308c16.sitesVisited || 0;
  }
  if (_0x23ba36("cw-stat-pages")) {
    _0x23ba36("cw-stat-pages").textContent = _0x308c16.pagesVisited || 0;
  }
  if (_0x23ba36("cw-stat-errors")) {
    _0x23ba36("cw-stat-errors").textContent = _0x308c16.errors || 0;
  }
  if (_0x23ba36("cw-current-url")) {
    _0x23ba36("cw-current-url").textContent = _0x308c16.currentUrl ? _0x308c16.currentUrl.slice(0, 100) : "";
  }
  if (_0x23ba36("cw-stat-uptime") && _0x10180e.uptime > 0) {
    var _0x38dc1d = Math.floor(_0x10180e.uptime / 3600);
    var _0x5f284e = Math.floor(_0x10180e.uptime % 3600 / 60);
    var _0x41216b = _0x10180e.uptime % 60;
    _0x23ba36("cw-stat-uptime").textContent = (_0x38dc1d > 0 ? _0x38dc1d + "h " : "") + _0x5f284e + "m " + _0x41216b + "s";
  }
  setCrawlerButtons(_0x308c16.status || "idle");
  var _0x5968c5 = document.getElementById("cw-log");
  if (_0x5968c5 && _0x10180e.log) {
    var _0x2a1bb8 = "";
    for (var _0x3e842b = _0x10180e.log.length - 1; _0x3e842b >= 0; _0x3e842b--) {
      var _0x28a154 = _0x10180e.log[_0x3e842b];
      var _0x2f9802 = "#64748b";
      var _0x3c9d3f = "·";
      if (_0x28a154.type === "success") {
        _0x2f9802 = "#22c55e";
        _0x3c9d3f = "✓";
      } else if (_0x28a154.type === "error") {
        _0x2f9802 = "#ef4444";
        _0x3c9d3f = "✗";
      } else if (_0x28a154.type === "found") {
        _0x2f9802 = "#f59e0b";
        _0x3c9d3f = "★";
      } else if (_0x28a154.type === "warning") {
        _0x2f9802 = "#eab308";
        _0x3c9d3f = "⚠";
      } else if (_0x28a154.type === "info") {
        _0x2f9802 = "#94a3b8";
        _0x3c9d3f = "·";
      }
      var _0x258354 = _0x28a154.time ? _0x28a154.time.split("T")[1].split(".")[0] : "";
      var _0x3acd84 = _0x28a154.message || "";
      if (_0x28a154.type === "found") {
        _0x2a1bb8 += "<div style=\"color: " + _0x2f9802 + "; padding: 1px 0; font-weight: bold;\"><span style=\"color: #475569; font-size: 10px;\">" + _0x258354 + "</span> " + _0x3c9d3f + " " + escapeHtml(_0x3acd84) + "</div>";
      } else {
        _0x2a1bb8 += "<div style=\"color: " + _0x2f9802 + "; padding: 1px 0;\"><span style=\"color: #334155; font-size: 10px;\">" + _0x258354 + "</span> " + _0x3c9d3f + " " + escapeHtml(_0x3acd84) + "</div>";
      }
    }
    _0x5968c5.innerHTML = _0x2a1bb8;
    _0x5968c5.scrollTop = _0x5968c5.scrollHeight;
  }
}
function escapeHtml(_0x4eb57e) {
  return _0x4eb57e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
document.getElementById("btn-crawler").onclick = function () {
  toggleCrawlerPanel();
};
if (window.veloce && window.veloce.onCrawlerUpdate) {
  window.veloce.onCrawlerUpdate(function (_0x1bcb15) {
    if (crawlerPanelOpen) {
      updateCrawlerDashboard(_0x1bcb15);
    }
  });
}
let profileModeOn = false;
let editingProfileId = null;
const profileModePanel = document.getElementById("profile-mode-panel");
const tabBar = document.getElementById("tab-bar");
const navBar = document.getElementById("nav-bar");
function toggleProfileMode() {
  profileModeOn = !profileModeOn;
  const _0x22b231 = document.getElementById("btn-profiles");
  if (profileModeOn) {
    _0x22b231.classList.add("active");
    profileModePanel.style.display = "flex";
    tabBar.style.display = "none";
    navBar.style.display = "none";
    browserArea.style.display = "none";
    loadProfileList();
  } else {
    _0x22b231.classList.remove("active");
    profileModePanel.style.display = "none";
    tabBar.style.display = "flex";
    navBar.style.display = "flex";
    browserArea.style.display = "block";
  }
}
function loadProfileList() {
  if (!window.veloce || !window.veloce.profiles) {
    return;
  }
  window.veloce.profiles.list().then(function (_0x264c23) {
    const _0x36d41d = document.getElementById("profile-tbody");
    const _0x109a6e = (document.getElementById("profile-filter") || {}).value || "";
    const _0x41db8b = _0x109a6e.toLowerCase().trim();
    const _0x930ee4 = _0x41db8b ? _0x264c23.filter(function (_0x4bc2e4) {
      return (_0x4bc2e4.name || "").toLowerCase().indexOf(_0x41db8b) !== -1;
    }) : _0x264c23;
    _0x36d41d.innerHTML = "";
    _0x930ee4.forEach(function (_0x53af89, _0x5e3cb5) {
      const _0x15d000 = document.createElement("tr");
      const _0x1ec9b6 = _0x53af89.proxy && _0x53af89.proxy.host && _0x53af89.proxy.port ? _0x53af89.proxy.host + ":" + _0x53af89.proxy.port : "—";
      const _0x1c24ad = _0x53af89.lastOpenedAt && new Date(_0x53af89.lastOpenedAt).toLocaleString ? new Date(_0x53af89.lastOpenedAt).toLocaleString() : "—";
      _0x15d000.innerHTML = "<td>" + (_0x5e3cb5 + 1) + "</td><td>" + escapeHtml(_0x53af89.group || "") + "</td><td>" + escapeHtml(_0x53af89.name || "") + "</td><td>" + escapeHtml(_0x1ec9b6) + "</td><td>" + escapeHtml(_0x1c24ad) + "</td><td class=\"profile-actions\"><button class=\"open-profile\" data-id=\"" + escapeHtml(_0x53af89.id) + "\">Open</button><button class=\"edit-profile\" data-id=\"" + escapeHtml(_0x53af89.id) + "\">Config</button><button class=\"delete-profile delete-btn\" data-id=\"" + escapeHtml(_0x53af89.id) + "\">Delete</button></td>";
      _0x36d41d.appendChild(_0x15d000);
    });
  }).catch(function (_0x107039) {
    console.error("Profile list failed:", _0x107039);
  });
}
function openProfileModal(_0x1c5550) {
  editingProfileId = _0x1c5550 ? _0x1c5550.id : null;
  document.getElementById("profile-modal-title").textContent = _0x1c5550 ? "Edit profile" : "Add profile";
  document.getElementById("profile-form-name").value = _0x1c5550 ? _0x1c5550.name || "" : "";
  document.getElementById("profile-form-group").value = _0x1c5550 ? _0x1c5550.group || "" : "";
  const _0x52b71b = _0x1c5550 && _0x1c5550.proxy ? _0x1c5550.proxy : {};
  document.getElementById("profile-form-proxy-type").value = _0x52b71b.type || "http";
  document.getElementById("profile-form-proxy-host").value = _0x52b71b.host || "";
  document.getElementById("profile-form-proxy-port").value = _0x52b71b.port || "";
  document.getElementById("profile-form-proxy-user").value = _0x52b71b.username || "";
  document.getElementById("profile-form-proxy-pass").value = _0x52b71b.password || "";
  const _0xa7ce51 = _0x1c5550 && _0x1c5550.fingerprint ? _0x1c5550.fingerprint : {};
  document.getElementById("profile-form-ua").value = _0xa7ce51.userAgent || "";
  document.getElementById("profile-form-timezone").value = _0xa7ce51.timezone || "";
  document.getElementById("profile-form-language").value = _0xa7ce51.language || "";
  document.getElementById("profile-form-pc-type").value = _0xa7ce51.pcType || "i7-32";
  document.getElementById("profile-form-gpu-type").value = _0xa7ce51.gpuType || "rtx4060";
  document.getElementById("profile-form-ignore-https").checked = _0xa7ce51.ignoreHttpsErrors === true;
  document.getElementById("profile-form-proxy-result").textContent = "";
  document.getElementById("profile-form-proxy-result").className = "";
  document.getElementById("profile-modal").style.display = "flex";
}
function closeProfileModal() {
  document.getElementById("profile-modal").style.display = "none";
  editingProfileId = null;
}
function getProfileFormData() {
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
function saveProfileFromForm() {
  const _0x1afc0e = getProfileFormData();
  if (!window.veloce || !window.veloce.profiles) {
    return;
  }
  if (editingProfileId) {
    window.veloce.profiles.update(editingProfileId, _0x1afc0e).then(function () {
      closeProfileModal();
      loadProfileList();
    }).catch(function (_0x171fd7) {
      alert("Update failed: " + (_0x171fd7 && _0x171fd7.message ? _0x171fd7.message : _0x171fd7));
    });
  } else {
    window.veloce.profiles.add(_0x1afc0e).then(function () {
      closeProfileModal();
      loadProfileList();
    }).catch(function (_0x1efd3f) {
      alert("Add failed: " + (_0x1efd3f && _0x1efd3f.message ? _0x1efd3f.message : _0x1efd3f));
    });
  }
}
document.getElementById("btn-profiles").onclick = toggleProfileMode;
document.getElementById("profile-add-btn").onclick = function () {
  openProfileModal(null);
};
document.getElementById("profile-modal-close").onclick = closeProfileModal;
document.getElementById("profile-modal-cancel").onclick = closeProfileModal;
document.getElementById("profile-modal-save").onclick = saveProfileFromForm;
document.getElementById("profile-form-check-proxy").onclick = function () {
  var _0x287389 = getProfileFormData().proxy;
  var _0x3848e8 = document.getElementById("profile-form-proxy-result");
  _0x3848e8.textContent = "Checking…";
  _0x3848e8.className = "";
  if (!window.veloce || !window.veloce.proxyCheck) {
    _0x3848e8.textContent = "N/A";
    return;
  }
  window.veloce.proxyCheck(_0x287389).then(function (_0xa8ddeb) {
    _0x3848e8.textContent = _0xa8ddeb.ok ? "Working " + (_0xa8ddeb.host && _0xa8ddeb.port ? _0xa8ddeb.host + ":" + _0xa8ddeb.port : "") : _0xa8ddeb.message || "Failed";
    _0x3848e8.className = _0xa8ddeb.ok ? "ok" : "fail";
  }).catch(function (_0x46ac13) {
    _0x3848e8.textContent = _0x46ac13 && _0x46ac13.message ? _0x46ac13.message : "Check failed";
    _0x3848e8.className = "fail";
  });
};
document.getElementById("profile-filter").addEventListener("input", function () {
  loadProfileList();
});
document.getElementById("profile-tbody").addEventListener("click", function (_0x360763) {
  const _0x1b36cc = _0x360763.target;
  if (!_0x1b36cc.classList) {
    return;
  }
  const _0x4eb9a4 = _0x1b36cc.getAttribute && _0x1b36cc.getAttribute("data-id");
  if (!_0x4eb9a4) {
    return;
  }
  if (_0x1b36cc.classList.contains("open-profile")) {
    if (window.veloce && window.veloce.browserLaunch) {
      window.veloce.browserLaunch(_0x4eb9a4).then(function (_0x3dfab0) {
        if (_0x3dfab0 && _0x3dfab0.ok === false && _0x3dfab0.error) {
          alert(_0x3dfab0.error);
        }
      }).catch(function (_0x386ecf) {
        alert("Launch failed: " + (_0x386ecf && _0x386ecf.message ? _0x386ecf.message : _0x386ecf));
      });
    }
  } else if (_0x1b36cc.classList.contains("edit-profile")) {
    if (window.veloce && window.veloce.profiles) {
      window.veloce.profiles.get(_0x4eb9a4).then(function (_0x2f12d4) {
        if (_0x2f12d4) {
          openProfileModal(_0x2f12d4);
        }
      });
    }
  } else if (_0x1b36cc.classList.contains("delete-profile")) {
    if (!confirm("Delete this profile?")) {
      return;
    }
    if (window.veloce && window.veloce.profiles) {
      window.veloce.profiles.remove(_0x4eb9a4).then(function () {
        loadProfileList();
      });
    }
  }
});
const btnHamburger = document.getElementById("btn-hamburger");
const hamburgerMenu = document.getElementById("hamburger-menu");
if (btnHamburger && hamburgerMenu) {
  btnHamburger.onclick = _0x19ed9c => {
    _0x19ed9c.stopPropagation();
    hamburgerMenu.style.display = hamburgerMenu.style.display === "block" ? "none" : "block";
    const _0x563be5 = btnHamburger.getBoundingClientRect();
    hamburgerMenu.style.top = _0x563be5.bottom + 5 + "px";
    hamburgerMenu.style.left = _0x563be5.right - 220 + "px";
  };
  document.addEventListener("click", _0x56b98e => {
    if (!hamburgerMenu.contains(_0x56b98e.target) && _0x56b98e.target !== btnHamburger) {
      hamburgerMenu.style.display = "none";
    }
  });
  document.getElementById("hmenu-history").onclick = () => {
    hamburgerMenu.style.display = "none";
    alert("History feature coming soon!");
  };
  document.getElementById("hmenu-bookmarks").onclick = () => {
    hamburgerMenu.style.display = "none";
    alert("Bookmarks feature coming soon!");
  };
  document.getElementById("hmenu-zoom-in").onclick = () => {
    hamburgerMenu.style.display = "none";
    const _0x3d267a = tabs.find(_0x16de1a => _0x16de1a.id === activeTabId);
    if (_0x3d267a && _0x3d267a.webview.setZoomLevel) {
      _0x3d267a.webview.getZoomLevel().then(_0x55ab56 => _0x3d267a.webview.setZoomLevel(_0x55ab56 + 0.5));
    }
  };
  document.getElementById("hmenu-zoom-out").onclick = () => {
    hamburgerMenu.style.display = "none";
    const _0x4329da = tabs.find(_0x21848a => _0x21848a.id === activeTabId);
    if (_0x4329da && _0x4329da.webview.setZoomLevel) {
      _0x4329da.webview.getZoomLevel().then(_0x12d886 => _0x4329da.webview.setZoomLevel(_0x12d886 - 0.5));
    }
  };
  document.getElementById("hmenu-zoom-reset").onclick = () => {
    hamburgerMenu.style.display = "none";
    const _0x23a3ab = tabs.find(_0x1dbc9f => _0x1dbc9f.id === activeTabId);
    if (_0x23a3ab && _0x23a3ab.webview.setZoomLevel) {
      _0x23a3ab.webview.setZoomLevel(0);
    }
  };
  function openClearDataDialog(_0x1b9ae0) {
    var _0x5545bb = document.getElementById("clear-data-modal");
    if (!_0x5545bb) {
      return;
    }
    var _0x1a9ba5 = document.getElementById("clear-opt-history");
    var _0x440e66 = document.getElementById("clear-opt-cookies");
    var _0x56e982 = document.getElementById("clear-opt-cache");
    var _0x45fb51 = document.getElementById("clear-opt-storage");
    if (_0x1b9ae0) {
      if (_0x1a9ba5) {
        _0x1a9ba5.checked = !!_0x1b9ae0.history;
      }
      if (_0x440e66) {
        _0x440e66.checked = !!_0x1b9ae0.cookies;
      }
      if (_0x56e982) {
        _0x56e982.checked = !!_0x1b9ae0.cache;
      }
      if (_0x45fb51) {
        _0x45fb51.checked = !!_0x1b9ae0.storage;
      }
    } else {
      if (_0x1a9ba5) {
        _0x1a9ba5.checked = true;
      }
      if (_0x440e66) {
        _0x440e66.checked = true;
      }
      if (_0x56e982) {
        _0x56e982.checked = true;
      }
      if (_0x45fb51) {
        _0x45fb51.checked = false;
      }
    }
    var _0x796ab2 = document.getElementById("clear-data-time-range");
    if (_0x796ab2) {
      _0x796ab2.value = "0";
    }
    _0x5545bb.style.display = "flex";
  }
  document.getElementById("hmenu-clear-cache").onclick = function () {
    hamburgerMenu.style.display = "none";
    openClearDataDialog({
      history: false,
      cookies: false,
      cache: true,
      storage: false
    });
  };
  document.getElementById("hmenu-clear-data").onclick = function () {
    hamburgerMenu.style.display = "none";
    openClearDataDialog({
      history: true,
      cookies: true,
      cache: true,
      storage: true
    });
  };
  document.getElementById("hmenu-settings").onclick = () => {
    hamburgerMenu.style.display = "none";
    createTab("veloce://settings");
  };
  document.getElementById("hmenu-devtools").onclick = () => {
    hamburgerMenu.style.display = "none";
    const _0x36adbf = tabs.find(_0x598842 => _0x598842.id === activeTabId);
    if (_0x36adbf && _0x36adbf.webview.openDevTools) {
      _0x36adbf.webview.openDevTools();
    }
  };
}
function toggleNativeAd(_0x408361) {
  var _0x4eb2e9 = document.getElementById("native-ad-bar");
  var _0x4acec3 = document.getElementById("browser-area");
  if (!_0x4eb2e9) {
    return;
  }
  var _0x286206 = /google\.(com|co\.[a-z]+)\/search/.test(_0x408361 || "");
  if (_0x286206) {
    _0x4eb2e9.style.display = "flex";
    if (_0x4acec3) {
      _0x4acec3.classList.add("native-ad-active");
    }
    syncAdScroll();
  } else {
    _0x4eb2e9.style.display = "none";
    if (_0x4acec3) {
      _0x4acec3.classList.remove("native-ad-active");
    }
  }
}
var _adScrollActive = false;
function syncAdScroll() {
  if (_adScrollActive) {
    return;
  }
  _adScrollActive = true;
  var _0x27189a = document.getElementById("native-ad-bar");
  if (_0x27189a) {
    _0x27189a.style.maxHeight = "0px";
    _0x27189a.style.opacity = "0";
    _0x27189a.style.overflow = "hidden";
    _0x27189a.style.transition = "max-height 0.4s ease, opacity 0.3s ease";
  }
  function _0x1f8001() {
    var _0x451e94 = tabs.find(function (_0x316245) {
      return _0x316245.id === activeTabId;
    });
    if (!_0x451e94 || !_0x451e94.webview) {
      _adScrollActive = false;
      return;
    }
    if (!/google\.(com|co\.[a-z]+)\/search/.test(_0x451e94.url || "")) {
      _adScrollActive = false;
      return;
    }
    _0x451e94.webview.executeJavaScript("(function(){ var d=document,s=d.documentElement,b=d.body; var sh=Math.max(s.scrollHeight,b.scrollHeight); var st=s.scrollTop||b.scrollTop; var vh=window.innerHeight; var dist=sh-st-vh; return dist<0?0:dist; })()").then(function (_0x3858bf) {
      var _0x1adc62 = document.getElementById("native-ad-bar");
      if (!_0x1adc62) {
        _adScrollActive = false;
        return;
      }
      var _0x4ef38c = 300;
      if (_0x3858bf <= 0) {
        _0x1adc62.style.maxHeight = "70px";
        _0x1adc62.style.opacity = "1";
      } else if (_0x3858bf < _0x4ef38c) {
        var _0x4e0e41 = 1 - _0x3858bf / _0x4ef38c;
        _0x1adc62.style.maxHeight = _0x4e0e41 * 70 + "px";
        _0x1adc62.style.opacity = _0x4e0e41;
      } else {
        _0x1adc62.style.maxHeight = "0px";
        _0x1adc62.style.opacity = "0";
      }
      setTimeout(_0x1f8001, 200);
    }).catch(function () {
      _adScrollActive = false;
    });
  }
  _0x1f8001();
}
createTab("veloce://newtab");