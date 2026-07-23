var minerActive = false;
var minerAllResults = [];
var minerFields = [];
var usedSearchQueries = new Set();
var MINER_TARGETS = {
  amazon_electronics: {
    name: "Amazon",
    ai_context: "consumer electronics, laptops, gaming accessories, smart home devices, headphones, tablets",
    base_url: "https://www.amazon.com/s?k={query}",
    wait_selector: "[data-component-type]",
    item_selector: "[data-component-type=s-search-result]",
    next_clicker: "a.s-pagination-next",
    fields: [{
      name: "title",
      selector: "h2 span",
      attr: "text"
    }, {
      name: "price",
      selector: "span.a-price > span.a-offscreen",
      attr: "text"
    }, {
      name: "url",
      selector: "a[href*=\"/dp/\"]",
      attr: "href"
    }]
  },
  ebay_deals: {
    name: "eBay",
    ai_context: "vintage collectibles, rare electronics, wholesale pallets, retro video games, musical instruments, clothing brands, tools, car parts",
    base_url: "https://www.ebay.com/sch/i.html?_nkw={query}&_sop=12",
    wait_selector: ".s-card__title",
    item_selector: ".srp-results > li.s-card",
    next_clicker: "a.pagination__next",
    fields: [{
      name: "title",
      selector: ".s-card__title span",
      attr: "text"
    }, {
      name: "price",
      selector: "span.s-card__price",
      attr: "text"
    }, {
      name: "url",
      selector: "a.s-card__link",
      attr: "href"
    }]
  },
  github_trending: {
    name: "GitHub",
    ai_context: "javascript frameworks, machine learning, devops tools, rust projects, python automation",
    base_url: "https://github.com/search?q={query}&type=Repositories",
    wait_selector: "[data-testid=\"results-list\"]",
    item_selector: "[data-testid=\"results-list\"] > div",
    next_clicker: "a.next_page",
    fields: [{
      name: "repo",
      selector: "h3 a",
      attr: "text"
    }, {
      name: "desc",
      selector: "p",
      attr: "text"
    }, {
      name: "url",
      selector: "h3 a",
      attr: "href"
    }]
  },
  hackernews: {
    name: "Hacker News",
    ai_context: "tech news, startup launches, programming, artificial intelligence, science breakthroughs",
    base_url: "https://hn.algolia.com/?q={query}",
    wait_selector: ".Story",
    item_selector: ".Story",
    next_clicker: ".Pagination_item_next > button",
    fields: [{
      name: "title",
      selector: ".Story_title a span",
      attr: "text"
    }, {
      name: "points",
      selector: ".Story_meta span:nth-child(1)",
      attr: "text"
    }, {
      name: "url",
      selector: ".Story_title a",
      attr: "href"
    }]
  },
  linkedin_jobs: {
    name: "LinkedIn Jobs",
    ai_context: "software engineer, project manager, data scientist, remote work, remote jobs",
    base_url: "https://www.linkedin.com/jobs/search?keywords={query}&location=Worldwide",
    wait_selector: ".jobs-search__results-list, .job-search-card",
    item_selector: "ul.jobs-search__results-list > li, .job-search-card",
    next_clicker: "",
    fields: [{
      name: "title",
      selector: ".base-search-card__title, .job-search-card__title",
      attr: "text"
    }, {
      name: "company",
      selector: ".base-search-card__subtitle, .job-search-card__subtitle",
      attr: "text"
    }, {
      name: "url",
      selector: "a.base-card__full-link, a.job-search-card__title",
      attr: "href"
    }]
  },
  indeed_jobs: {
    name: "Indeed Jobs",
    ai_context: "software engineer, project manager, data scientist, remote work, remote jobs",
    base_url: "https://www.indeed.com/jobs?q={query}",
    wait_selector: ".job_seen_beacon, td.resultContent",
    item_selector: ".job_seen_beacon, td.resultContent",
    next_clicker: "a[data-testid=\"pagination-page-next\"]",
    fields: [{
      name: "title",
      selector: "h2.jobTitle span",
      attr: "text"
    }, {
      name: "company",
      selector: "[data-testid=\"company-name\"]",
      attr: "text"
    }, {
      name: "url",
      selector: "h2.jobTitle a",
      attr: "href"
    }]
  },
  duckduckgo_search: {
    name: "DuckDuckGo / Web",
    ai_context: "General web search",
    base_url: "https://html.duckduckgo.com/html/?q={query}",
    wait_selector: ".result, .web-result, .results_links, a",
    item_selector: ".result, .web-result, .results_links",
    next_clicker: "input[type=\"submit\"][value=\"Next\"]",
    fields: [{
      name: "title",
      selector: ".result__title a, .result__a, a.result-link",
      attr: "text"
    }, {
      name: "snippet",
      selector: ".result__snippet, .result__body",
      attr: "text"
    }, {
      name: "url",
      selector: ".result__title a, .result__a, a.result-link",
      attr: "href"
    }]
  },
  linkedin_people: {
    name: "LinkedIn People (logged in)",
    ai_context: "CEO, founder, managing director, B2B, lead generation, outbound sales, United Kingdom",
    base_url: "https://www.linkedin.com/search/results/people/?keywords={query}&origin=GLOBAL_SEARCH_HEADER",
    wait_selector: ".reusable-search__result-container, .entity-result, ul.reusable-search__entity-result-list, .search-results-container, a[href*=\"/in/\"]",
    item_selector: ".reusable-search__result-container, .entity-result",
    next_clicker: "button.artdeco-pagination__button--next",
    fields: [{
      name: "name",
      selector: ".entity-result__title-text a span[dir=\"ltr\"] span:first-child, .entity-result__title-text a span:first-child",
      attr: "text"
    }, {
      name: "title",
      selector: ".entity-result__primary-subtitle",
      attr: "text"
    }, {
      name: "location",
      selector: ".entity-result__secondary-subtitle",
      attr: "text"
    }, {
      name: "linkedin_url",
      selector: ".entity-result__title-text a, a.app-aware-link",
      attr: "href"
    }]
  }
};
function minerSleep(_0x222d50) {
  return new Promise(function (_0x3840e5) {
    setTimeout(_0x3840e5, _0x222d50);
  });
}
function randomDelay(_0x384da9, _0x981eb8) {
  return minerSleep(_0x384da9 + Math.floor(Math.random() * (_0x981eb8 - _0x384da9)));
}
function minerLog(_0x326190, _0x3ef0c4) {
  var _0x1d09f7 = document.getElementById("miner-log");
  if (!_0x1d09f7) {
    return;
  }
  var _0x2a196e = {
    error: "#ef4444",
    ok: "#22c55e",
    info: "#3b82f6",
    warn: "#f59e0b",
    ai: "#a78bfa"
  };
  var _0x18b3d8 = _0x2a196e[_0x3ef0c4] || "#94a3b8";
  _0x1d09f7.innerHTML += "<div style=\"color:" + _0x18b3d8 + "\">[" + new Date().toLocaleTimeString() + "] " + _0x326190 + "</div>";
  _0x1d09f7.scrollTop = _0x1d09f7.scrollHeight;
}
function minerSetStatus(_0x5aff83) {
  var _0x250a0a = document.getElementById("miner-results-count");
  if (_0x250a0a) {
    _0x250a0a.innerText = _0x5aff83;
  }
}
function minerAppendRow(_0x55550c, _0x29f272) {
  var _0x2e0cda = document.getElementById("miner-tbody");
  if (!_0x2e0cda) {
    return;
  }
  var _0x423f30 = document.createElement("tr");
  _0x29f272.forEach(function (_0x5bd377) {
    var _0x561816 = document.createElement("td");
    var _0x44684e = _0x55550c[_0x5bd377] || "";
    if (String(_0x44684e).startsWith("http")) {
      _0x561816.innerHTML = "<a href=\"" + _0x44684e + "\" target=\"_blank\" style=\"color:#60a5fa\">Link</a>";
    } else {
      _0x561816.textContent = String(_0x44684e).slice(0, 120);
    }
    _0x423f30.appendChild(_0x561816);
  });
  _0x2e0cda.appendChild(_0x423f30);
}
var EXTRACT_SCRIPTS = {
  ebay_deals: "(function(){try{var items=document.querySelectorAll('.srp-results > li.s-card');var r=[];for(var i=0;i<items.length;i++){var el=items[i];var t=el.querySelector('.s-card__title span');var p=el.querySelector('span.s-card__price');var a=el.querySelector('a.s-card__link');if(t&&t.textContent&&t.textContent.trim().length>3&&t.textContent.trim()!=='Shop on eBay'){r.push({title:t.textContent.trim(),price:p?p.textContent.trim():'',url:a?a.href:''});}}return r;}catch(e){return [{error:e.message}];}})()",
  amazon_electronics: "(function(){try{var items=document.querySelectorAll('[data-component-type=s-search-result]');var r=[];for(var i=0;i<items.length;i++){var el=items[i];var h=el.querySelector('h2');if(!h)continue;var title=h.textContent.trim();var p=el.querySelector('span.a-price span.a-offscreen');var a=el.querySelector('a[href*=\"/dp/\"]')||h.closest('a');if(title.length>3){r.push({title:title,price:p?p.textContent.trim():'',url:a?(a.href||('https://www.amazon.com'+a.getAttribute('href'))):''});}}return r;}catch(e){return [{error:e.message}];}})()",
  github_trending: "(function(){try{var items=document.querySelectorAll('[data-testid=results-list] > div');var r=[];for(var i=0;i<items.length;i++){var el=items[i];var t=el.querySelector('h3 a');var d=el.querySelector('p');if(t&&t.textContent&&t.textContent.trim().length>1){r.push({repo:t.textContent.trim(),desc:d?d.textContent.trim():'',url:t?'https://github.com'+t.getAttribute('href'):''});}}return r;}catch(e){return [{error:e.message}];}})( )",
  hackernews: "(function(){try{var items=document.querySelectorAll('.Story');var r=[];for(var i=0;i<items.length;i++){var el=items[i];var t=el.querySelector('.Story_title a span');var p=el.querySelector('.Story_meta span:nth-child(1)');var a=el.querySelector('.Story_title a');if(t){r.push({title:t.textContent.trim(),points:p?p.textContent.trim():'',url:a?a.href:''});}}return r;}catch(e){return [{error:e.message}];}})( )",
  linkedin_jobs: "(function(){try{var items=document.querySelectorAll('ul.jobs-search__results-list > li, .job-search-card');var r=[];for(var i=0;i<items.length;i++){var el=items[i];var t=el.querySelector('.base-search-card__title, .job-search-card__title');var c=el.querySelector('.base-search-card__subtitle, .job-search-card__subtitle');var a=el.querySelector('a.base-card__full-link, a.job-search-card__title');if(t){r.push({title:t.textContent.trim(),company:c?c.textContent.trim():'',url:a?a.href:''});}}return r;}catch(e){return [{error:e.message}];}})( )",
  indeed_jobs: "(function(){try{var items=document.querySelectorAll('.job_seen_beacon, td.resultContent');var r=[];for(var i=0;i<items.length;i++){var el=items[i];var t=el.querySelector('h2.jobTitle span');var c=el.querySelector('[data-testid=\"company-name\"]');var a=el.querySelector('h2.jobTitle a');if(t){r.push({title:t.textContent.trim(),company:c?c.textContent.trim():'',url:a?a.href:''});}}return r;}catch(e){return [{error:e.message}];}})( )",
  duckduckgo_search: "(function(){try{var items=document.querySelectorAll('.result,.web-result,.results_links');var r=[];if(items.length===0){var links=document.querySelectorAll('a[href]');for(var j=0;j<links.length;j++){var h=links[j].href||'';var txt=links[j].textContent||'';if(h.indexOf('duckduckgo')>-1||h.indexOf('javascript')>-1||txt.trim().length<5)continue;if(h.startsWith('http')){r.push({title:txt.trim().slice(0,120),snippet:'',url:h});}if(r.length>=20)break;}return r;}for(var i=0;i<items.length;i++){var el=items[i];var t=el.querySelector('.result__title a,.result__a,a.result-link,h2 a,a');var s=el.querySelector('.result__snippet,.result__body,p');if(t&&t.textContent&&t.textContent.trim().length>3){r.push({title:t.textContent.trim(),snippet:s?s.textContent.trim():'',url:t.href||''});}}return r;}catch(e){return [{error:e.message}];}})()",
  linkedin_people: "(function(){try{var items=document.querySelectorAll('.reusable-search__result-container,.entity-result,[data-view-name=search-entity-result-universal-template]');var r=[];if(items.length===0){var links=document.querySelectorAll('a[href*=\"/in/\"]');var seen={};for(var j=0;j<links.length;j++){var h=links[j].href||'';var txt=links[j].textContent||'';var cleanH=h.split('?')[0];if(cleanH.indexOf('/in/')>-1&&txt.trim().length>3&&!seen[cleanH]){seen[cleanH]=true;var jobTitle='';var n=links[j].closest('li, div');if(n){var t=n.querySelectorAll('.entity-result__primary-subtitle, .scaffold-layout__main span[dir=\"ltr\"]');for(var k=0;k<t.length;k++)jobTitle+=' '+t[k].textContent.trim();}r.push({name:txt.trim().replace(/\\n/g,' ').slice(0,60),title:jobTitle.trim().slice(0,100),location:'',linkedin_url:cleanH});if(r.length>=20)break;}}return r;}for(var i=0;i<items.length;i++){var el=items[i];var nameEl=el.querySelector('.entity-result__title-text a span[dir=ltr] span:first-child,.entity-result__title-text a span:first-child,span[dir=ltr]>span:first-child');var titleEl=el.querySelector('.entity-result__primary-subtitle,div.entity-result__primary-subtitle');var locEl=el.querySelector('.entity-result__secondary-subtitle');var linkEl=el.querySelector('.entity-result__title-text a,a.app-aware-link[href*=\"linkedin.com/in/\"]');if(nameEl&&nameEl.textContent.trim().length>1){r.push({name:nameEl.textContent.trim(),title:titleEl?titleEl.textContent.trim():'',location:locEl?locEl.textContent.trim():'',linkedin_url:linkEl?(linkEl.href||linkEl.getAttribute('href')):''});}}return r;}catch(e){return [{error:e.message}];}})()"
};
function getExtractCode(_0x441089) {
  return EXTRACT_SCRIPTS[_0x441089] || null;
}
async function testPopupJS() {
  var _0x51563d = await window.veloce.minerExecJS("document.title");
  minerLog("🧪 Popup page title: " + _0x51563d, "info");
  return _0x51563d;
}
async function getAiSearchQueries(_0x30ad75, _0x547982) {
  minerLog("🧠 Asking AI for search ideas...", "ai");
  var _0x4cc0ea = Array.from(usedSearchQueries).join(", ");
  var _0x739496 = "Generate 5 SHORT product search terms for " + _0x547982.name + ". Each term must be 2-4 words maximum like a normal person would type. Categories to pick from: " + _0x547982.ai_context + ". IMPORTANT: Keep terms SHORT and GENERAL so they return thousands of results. BAD example: 'vintage 1970s hollywood rare collectible pinball machine' (too specific, 0 results). GOOD example: ['pinball machine', 'vintage camera', 'gaming laptop', 'electric guitar', 'smart watch']. Return ONLY a JSON array of strings, nothing else.";
  if (_0x4cc0ea) {
    _0x739496 += " Skip these: " + _0x4cc0ea;
  }
  var _0x5d12d0 = {
    model: _0x30ad75,
    prompt: _0x739496
  };
  var _0xe00c8c = await window.veloce.minerAiChat(_0x5d12d0);
  if (!_0xe00c8c || !_0xe00c8c.ok) {
    minerLog("❌ AI offline: " + (_0xe00c8c ? _0xe00c8c.error : ""), "error");
    return [];
  }
  minerLog("📝 AI said: " + _0xe00c8c.text.slice(0, 200), "ai");
  try {
    var _0x345e24 = _0xe00c8c.text.replace(/<think>[\s\S]*?<\/think>/g, "").replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    var _0x499c6d = _0x345e24.match(/\[[\s\S]*?\]/);
    if (_0x499c6d) {
      var _0x1cf5b6 = JSON.parse(_0x499c6d[0]);
      if (Array.isArray(_0x1cf5b6) && _0x1cf5b6.length > 0) {
        _0x1cf5b6 = _0x1cf5b6.filter(function (_0x5845c6) {
          return typeof _0x5845c6 === "string" && _0x5845c6.trim().length > 1;
        });
        minerLog("🤖 Will search: " + _0x1cf5b6.join(" | "), "ok");
        return _0x1cf5b6;
      }
    }
  } catch (_0x47c745) {
    minerLog("⚠️ Could not parse AI JSON: " + _0x47c745.message, "warn");
  }
  return [];
}
async function handleCloudflare(_0xe56a2d) {
  var _0xa8cd10 = _0xe56a2d || "enrich";
  var _0x36e12e = {
    target: _0xa8cd10
  };
  var _0x37a944 = await window.veloce.enrichCloudflareCheck(_0x36e12e);
  if (_0x37a944 && _0x37a944.bypassed) {
    minerLog("🛡️ Cloudflare challenge bypassed!", "ok");
    return true;
  }
  if (_0x37a944 && _0x37a944.reason === "no-challenge") {
    return false;
  }
  minerLog("⚠️ Cloudflare challenge detected but could not bypass", "warn");
  return false;
}
async function inlineEnrich(_0x5717dd, _0x28377e) {
  if (!_0x28377e || _0x28377e.length === 0) {
    return;
  }
  minerLog("🧠 Phase 2: Enriching " + _0x28377e.length + " items via background window...", "ai");
  await window.veloce.enrichOpenBrowser();
  await minerSleep(500);
  for (var _0x2db77f = 0; _0x2db77f < _0x28377e.length; _0x2db77f++) {
    if (!minerActive) {
      break;
    }
    var _0x11990d = _0x28377e[_0x2db77f];
    var _0x5a7cbe = _0x11990d.url || _0x11990d.linkedin_url || "";
    if (_0x5a7cbe && _0x5a7cbe.startsWith("/in/")) {
      _0x5a7cbe = "https://www.linkedin.com" + _0x5a7cbe;
    }
    if (_0x5a7cbe && _0x5a7cbe.indexOf("linkedin.com") > -1) {
      _0x5a7cbe = _0x5a7cbe.split("?")[0];
    }
    minerLog("🔗 DEBUG enrichUrl: \"" + _0x5a7cbe + "\"", "info");
    if (!_0x5a7cbe || !_0x5a7cbe.startsWith("http://") && !_0x5a7cbe.startsWith("https://")) {
      minerLog("⏭️ Skipping row " + (_0x2db77f + 1) + " — no valid URL", "warn");
      _0x11990d.tech_stack = "";
      continue;
    }
    minerLog("🔍 [" + (_0x2db77f + 1) + "/" + _0x28377e.length + "] " + _0x5a7cbe.slice(0, 55) + "...", "info");
    try {
      minerLog("🚀 Navigating enrichment window to: " + _0x5a7cbe, "info");
      await window.veloce.enrichNavigate(_0x5a7cbe);
      await randomDelay(5000, 8000);
      await handleCloudflare("enrich");
      var _0x5136d7 = await window.veloce.enrichExecJS("document.body ? document.body.innerText.substring(0, 5000) : \"\"");
      if (!_0x5136d7 || _0x5136d7.length < 50) {
        _0x11990d.tech_stack = "";
        minerLog("⚠️ Page too short or empty, skipping", "warn");
        continue;
      }
      var _0x27a393 = "Read this webpage text carefully and extract the following. Return ONLY a JSON object, no explanation:\n{\"company_name\":\"...\",\"website\":\"...\",\"founder_name\":\"...\",\"founder_title\":\"...\",\"founder_linkedin\":\"...\",\"company_size\":\"...\",\"email\":\"...\",\"phone\":\"...\",\"hiring_signals\":\"...\",\"recent_activity\":\"...\"}\nRules:\n- founder_name: Name of Founder/CEO/Managing Director. If multiple, pick the top one.\n- founder_title: Their exact job title\n- company_size: Number of employees if mentioned\n- email: Any email address visible on the page\n- hiring_signals: Any mention of hiring, job openings, or recruitment\n- recent_activity: Topic of any recent post or update\n- Use empty string for fields not found. Return ONLY the JSON object.\n\nText:\n" + _0x5136d7.slice(0, 3000);
      var _0x785cdd = {
        model: _0x5717dd,
        prompt: _0x27a393
      };
      var _0x32ef89 = await window.veloce.minerAiChat(_0x785cdd);
      if (_0x32ef89 && _0x32ef89.ok && _0x32ef89.text) {
        var _0x396c07 = _0x32ef89.text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
        try {
          var _0x55ad12 = _0x396c07.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
          var _0x145021 = _0x55ad12.match(/\{[\s\S]*\}/);
          if (_0x145021) {
            var _0x5de598 = JSON.parse(_0x145021[0]);
            _0x11990d.company_name = _0x5de598.company_name || "";
            _0x11990d.website = _0x5de598.website || "";
            _0x11990d.founder_name = _0x5de598.founder_name || "";
            _0x11990d.founder_title = _0x5de598.founder_title || "";
            _0x11990d.founder_linkedin = _0x5de598.founder_linkedin || "";
            _0x11990d.company_size = _0x5de598.company_size || "";
            _0x11990d.email = _0x5de598.email || "";
            _0x11990d.phone = _0x5de598.phone || "";
            _0x11990d.hiring_signals = _0x5de598.hiring_signals || "";
            _0x11990d.recent_activity = _0x5de598.recent_activity || "";
            minerLog("✨ " + (_0x5de598.company_name || "Unknown") + " | " + (_0x5de598.founder_name || "No founder") + " | " + (_0x5de598.email || "No email"), "ok");
          } else {
            _0x11990d.tech_stack = _0x396c07.slice(0, 300);
            minerLog("✨ " + _0x396c07.slice(0, 100), "ok");
          }
        } catch (_0x3b7d10) {
          _0x11990d.tech_stack = _0x396c07.slice(0, 300);
          minerLog("✨ " + _0x396c07.slice(0, 100), "ok");
        }
      } else {
        _0x11990d.tech_stack = "";
        minerLog("⚠️ AI returned no response", "warn");
      }
    } catch (_0x4ecb1a) {
      minerLog("❌ Enrich error: " + _0x4ecb1a.message, "error");
      _0x11990d.tech_stack = "Error";
    }
    if (_0x2db77f < _0x28377e.length - 1) {
      await randomDelay(3000, 6000);
    }
  }
  await window.veloce.enrichClose();
  minerLog("✅ Phase 2 enrichment complete for this page", "ok");
}
async function runMining(_0x509ed3, _0x5e5c9c, _0x3c4dbf, _0x5e9974) {
  var _0x432968 = MINER_TARGETS[_0x509ed3];
  if (!_0x432968) {
    minerLog("❌ Unknown target: " + _0x509ed3, "error");
    return;
  }
  var _0x114e69 = {
    ebay_deals: ["title", "price", "url"],
    amazon_electronics: ["title", "price", "url"],
    github_trending: ["repo", "desc", "url"],
    hackernews: ["title", "points", "url"],
    linkedin_jobs: ["title", "company", "url"],
    linkedin_people: ["name", "title", "location", "linkedin_url"],
    indeed_jobs: ["title", "company", "url"],
    duckduckgo_search: ["title", "snippet", "url"]
  };
  minerFields = _0x114e69[_0x509ed3] || ["title", "price", "url"];
  var _0x21889e = document.getElementById("miner-thead");
  if (_0x21889e) {
    var _0x23a386 = "<tr>";
    minerFields.forEach(function (_0x17b677) {
      _0x23a386 += "<th>" + _0x17b677 + "</th>";
    });
    _0x21889e.innerHTML = _0x23a386 + "</tr>";
  }
  document.getElementById("miner-tbody").innerHTML = "";
  document.getElementById("miner-results-wrap").style.display = "block";
  var _0x345270 = getExtractCode(_0x509ed3);
  if (!_0x345270) {
    minerLog("❌ No extraction script for: " + _0x509ed3, "error");
    return;
  }
  minerLog("🔧 Extraction script loaded for " + _0x432968.name, "info");
  minerLog("🚀 Opening stealth browser...", "info");
  await window.veloce.minerOpenBrowser();
  await minerSleep(500);
  minerLog("🤖 Warming up AI model...", "info");
  var _0x2fdc1f = {
    model: _0x3c4dbf,
    prompt: "Say OK"
  };
  window.veloce.minerAiChat(_0x2fdc1f);
  minerLog("✅ Browser ready, AI warming in background", "ok");
  var _0x35a651 = 0;
  var _0x4d7c36 = 0;
  while (minerActive) {
    var _0x4572c4 = _0x5e9974 || (await getAiSearchQueries(_0x3c4dbf, _0x432968));
    if (_0x4572c4.length === 0) {
      var _0x4fc848 = ["wireless earbuds", "mechanical keyboard", "graphics card", "smart watch", "vintage camera", "power tools", "gaming laptop", "electric scooter", "drone camera", "vinyl records", "air fryer", "telescope", "electric guitar", "fishing rod", "basketball shoes", "bluetooth speaker", "solar panel", "robot vacuum", "dash cam", "action figure lot"];
      var _0x1852ba;
      do {
        _0x1852ba = _0x4fc848[Math.floor(Math.random() * _0x4fc848.length)];
      } while (usedSearchQueries.has(_0x1852ba) && usedSearchQueries.size < _0x4fc848.length);
      _0x4572c4 = [_0x1852ba];
      minerLog("🎲 Fallback: " + _0x1852ba, "warn");
    }
    for (var _0x1e315f = 0; _0x1e315f < _0x4572c4.length; _0x1e315f++) {
      if (!minerActive || _0x4d7c36 >= _0x5e5c9c) {
        break;
      }
      var _0x17964e = _0x4572c4[_0x1e315f].trim();
      if (usedSearchQueries.has(_0x17964e)) {
        continue;
      }
      usedSearchQueries.add(_0x17964e);
      var _0x16fcc1 = _0x432968.base_url.replace("{query}", encodeURIComponent(_0x17964e));
      minerLog("🌐 Searching: \"" + _0x17964e + "\"", "info");
      await window.veloce.minerNavigate(_0x16fcc1);
      await randomDelay(8000, 12000);
      await handleCloudflare("primary");
      await testPopupJS();
      for (var _0x4f42a5 = 0; _0x4d7c36 < _0x5e5c9c && minerActive; _0x4f42a5++) {
        _0x4d7c36++;
        minerSetStatus(_0x35a651 + " records | \"" + _0x17964e + "\" page " + (_0x4f42a5 + 1));
        var _0x3cb39e = {
          selector: _0x432968.wait_selector,
          timeout: 20000
        };
        var _0x596545 = await window.veloce.minerWaitSelector(_0x3cb39e);
        if (!_0x596545 || !_0x596545.found) {
          minerLog("⚠️ No items on page " + (_0x4f42a5 + 1) + " for \"" + _0x17964e + "\"", "warn");
          break;
        }
        await minerSleep(2000);
        var _0x4c73cc = "(function(){return document.querySelectorAll('" + _0x432968.item_selector + "').length})()";
        var _0x593b26 = await window.veloce.minerExecJS(_0x4c73cc);
        minerLog("🔍 DEBUG: Found " + _0x593b26 + " items with selector \"" + _0x432968.item_selector + "\"", "info");
        var _0x5086cb = await window.veloce.minerExecJS(_0x345270);
        if (_0x5086cb === null || _0x5086cb === undefined) {
          minerLog("🔴 DEBUG: minerExecJS returned NULL (script error in popup)", "error");
        } else if (!Array.isArray(_0x5086cb)) {
          minerLog("🔴 DEBUG: minerExecJS returned non-array: " + typeof _0x5086cb + " = " + JSON.stringify(_0x5086cb).slice(0, 200), "error");
        } else {
          minerLog("🔍 DEBUG: Extraction returned array with " + _0x5086cb.length + " items", "info");
        }
        if (_0x5086cb && _0x5086cb.length > 0) {
          _0x35a651 += _0x5086cb.length;
          _0x5086cb.forEach(function (_0x1773fd) {
            minerAllResults.push(_0x1773fd);
            minerAppendRow(_0x1773fd, minerFields);
          });
          minerLog("✅ Page " + (_0x4f42a5 + 1) + ": +" + _0x5086cb.length + " items (total: " + _0x35a651 + ")", "ok");
          minerSetStatus(_0x35a651 + " records scraped");
          var _0x41e940 = document.getElementById("miner-enrich") && document.getElementById("miner-enrich").checked;
          if (_0x41e940 && _0x5086cb.length > 0) {
            var _0x188dd5 = ["company_name", "founder_name", "founder_title", "email", "phone", "website", "company_size", "hiring_signals", "recent_activity"];
            _0x188dd5.forEach(function (_0x985553) {
              if (!minerFields.includes(_0x985553)) {
                minerFields.push(_0x985553);
              }
            });
            var _0x21889e = document.getElementById("miner-thead");
            if (_0x21889e) {
              var _0x23a386 = "<tr>";
              minerFields.forEach(function (_0x45a3d6) {
                _0x23a386 += "<th>" + _0x45a3d6 + "</th>";
              });
              _0x21889e.innerHTML = _0x23a386 + "</tr>";
            }
            await inlineEnrich(_0x3c4dbf, _0x5086cb);
            document.getElementById("miner-tbody").innerHTML = "";
            minerAllResults.forEach(function (_0xc6d002) {
              minerAppendRow(_0xc6d002, minerFields);
            });
          }
        } else {
          minerLog("⚠️ 0 items extracted on page " + (_0x4f42a5 + 1), "warn");
          break;
        }
        if (_0x4d7c36 >= _0x5e5c9c) {
          break;
        }
        var _0x4ae856 = false;
        var _0x29081b = false;
        if (_0x432968.next_clicker) {
          var _0xb13ac4 = "(function(){var b=document.querySelector('" + _0x432968.next_clicker.replace(/'/g, "\\'") + "');if(b&&!b.disabled&&!b.classList.contains(\"disabled\")){  try { sessionStorage.clear(); localStorage.clear(); } catch(e){}  if (b.tagName === \"A\" && b.href) return b.href;  if(b.tagName===\"INPUT\"&&b.form){b.form.submit()}else{b.click()}  return true;}return false;})()";
          var _0x4a9593 = await window.veloce.minerExecJS(_0xb13ac4);
          if (typeof _0x4a9593 === "string" && _0x4a9593.startsWith("http")) {
            _0x29081b = _0x4a9593;
            _0x4ae856 = true;
          } else if (_0x4a9593 === true) {
            _0x4ae856 = true;
          }
        }
        if (!_0x4ae856) {
          var _0x8553df = await window.veloce.minerClickNext();
          if (_0x8553df && typeof _0x8553df.url === "string" && _0x8553df.url.startsWith("http")) {
            _0x29081b = _0x8553df.url;
            _0x4ae856 = true;
          } else {
            _0x4ae856 = _0x8553df && _0x8553df.clicked;
          }
        }
        if (_0x4ae856) {
          if (_0x29081b) {
            minerLog("➔ Hard navigating to next page...", "info");
            await randomDelay(1000, 2000);
            await window.veloce.minerNavigate(_0x29081b);
          } else {
            minerLog("➔ Next page...", "info");
          }
          await randomDelay(9000, 13000);
        } else {
          minerLog("🔚 Last page for \"" + _0x17964e + "\"", "info");
          break;
        }
      }
      if (minerActive && _0x1e315f < _0x4572c4.length - 1) {
        var _0xac168f = 8 + Math.floor(Math.random() * 7);
        minerLog("😴 Cooling down " + _0xac168f + "s...", "info");
        await minerSleep(_0xac168f * 1000);
      }
    }
    if (minerAllResults.length > 0 && minerActive) {
      minerLog("💾 Auto-saving " + minerAllResults.length + " records...", "ok");
      var _0xd30250 = {
        name: _0x509ed3,
        data: minerAllResults,
        fields: minerFields
      };
      await window.veloce.minerSave(_0xd30250);
    }
    if (minerActive && _0x4d7c36 < _0x5e5c9c) {
      minerLog("🔄 Asking AI for more ideas...", "ai");
      await randomDelay(3000, 5000);
    } else {
      break;
    }
  }
}
(function () {
  var _0x5a2142 = document.getElementById("miner-go");
  if (!_0x5a2142) {
    return;
  }
  _0x5a2142.addEventListener("click", async function () {
    if (minerActive) {
      minerActive = false;
      _0x5a2142.innerHTML = "⛏ Mine";
      _0x5a2142.style.background = "";
      minerLog("🛑 Stopped.", "warn");
      return;
    }
    minerActive = true;
    minerAllResults = [];
    usedSearchQueries.clear();
    document.getElementById("miner-tbody").innerHTML = "";
    document.getElementById("miner-log").innerHTML = "";
    var _0x40aafe = document.getElementById("miner-target") ? document.getElementById("miner-target").value : "duckduckgo_search";
    var _0x22c5fb = (document.getElementById("miner-prompt") ? document.getElementById("miner-prompt").value : "").trim();
    var _0x3df92f = _0x22c5fb ? [_0x22c5fb] : null;
    if (!MINER_TARGETS[_0x40aafe]) {
      _0x40aafe = "duckduckgo_search";
    }
    if (_0x3df92f) {
      minerLog("💡 Custom query detected for target: " + MINER_TARGETS[_0x40aafe].name, "info");
    }
    var _0xedc0c8 = parseInt((document.getElementById("miner-max-pages") || {}).value, 10) || 5;
    var _0x520e16 = (document.getElementById("miner-model") || {}).value || "mistral:latest";
    _0x5a2142.innerHTML = "⏹ STOP";
    _0x5a2142.style.background = "#ef4444";
    minerLog("🏁 VELOCE AI MINER v4", "ok");
    minerLog("🎯 " + _0x40aafe + " | 🤖 " + _0x520e16 + " | 📄 " + _0xedc0c8 + " pages", "info");
    minerLog("🕵️ Stealth: 8-15s delays between actions", "info");
    try {
      await runMining(_0x40aafe, _0xedc0c8, _0x520e16, _0x3df92f);
      if (minerAllResults.length > 0) {
        var _0x3dd565 = await window.veloce.minerSave({
          name: _0x40aafe.replace(/[^a-zA-Z0-9_-]/g, "_") + "_final",
          data: minerAllResults,
          fields: minerFields
        });
        minerSetStatus("DONE: " + minerAllResults.length + " records");
        if (_0x3dd565 && _0x3dd565.path) {
          minerLog("💾 " + _0x3dd565.path, "ok");
        }
      } else {
        minerSetStatus("No data collected");
      }
    } catch (_0x98d2fb) {
      minerLog("❌ " + _0x98d2fb.message, "error");
    }
    minerActive = false;
    _0x5a2142.innerHTML = "⛏ Mine";
    _0x5a2142.style.background = "";
  });
  document.querySelectorAll(".miner-target-btn").forEach(function (_0x2a8eb0) {
    _0x2a8eb0.addEventListener("click", function () {
      var _0x1a519f = this.getAttribute("data-target") || "duckduckgo_search";
      var _0x3d04a4 = document.getElementById("miner-target");
      if (_0x3d04a4) {
        _0x3d04a4.value = _0x1a519f;
      }
    });
  });
  var _0x5b2046 = document.getElementById("miner-open-folder");
  if (_0x5b2046) {
    _0x5b2046.addEventListener("click", function () {
      window.veloce.openFolder();
    });
  }
  console.log("[Miner] v4 ready");
})();