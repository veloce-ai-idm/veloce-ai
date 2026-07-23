
    var phase = 'info';
    var TUNNEL_BLOCKS = 20;
    var tunnelCount = 0;
    var tunnelDashInit = false;

    document.getElementById('btn-close').onclick = function() {
      if (phase === 'progress') window.dlDialog.stopDownload();
      window.dlDialog.cancelDownload();
    };

    document.getElementById('btn-start').onclick = function() {
      phase = 'progress';
      document.getElementById('buttons').style.display = 'none';
      document.getElementById('safety-section').style.display = 'none';
      document.getElementById('progress-section').style.display = 'block';
      document.getElementById('progress-table').style.display = '';
      document.getElementById('stop-wrap').style.display = 'block';
      document.getElementById('d-status').textContent = 'Receiving data...';
      document.getElementById('d-status').className = 'status-downloading';
      tunnelDashInit = false;
      window.dlDialog.startDownload();
    };

    document.getElementById('btn-later').onclick = function() {
      window.dlDialog.cancelDownload();
    };

    document.getElementById('btn-stop').onclick = function() {
      window.dlDialog.stopDownload();
      document.getElementById('d-status').textContent = 'Cancelled';
      document.getElementById('d-status').className = 'status-cancelled';
      document.getElementById('stop-wrap').style.display = 'none';
    };

    // Receive updates
    window.dlDialog.onUpdate(function(data) {
      if (data.filename) document.getElementById('d-filename').textContent = data.filename;
      if (data.url) {
        var u = data.url.length > 60 ? data.url.slice(0, 60) + '...' : data.url;
        document.getElementById('d-url').textContent = u;
        document.getElementById('d-url').title = data.url;
      }
      if (data.size) document.getElementById('d-size').textContent = data.size;
      if (data.resumable !== undefined) {
        var el = document.getElementById('d-resume');
        el.textContent = data.resumable ? 'Yes' : 'No';
        el.className = data.resumable ? 'val-resume-yes' : 'val-resume-no';
      }
      if (data.status) {
        var st = document.getElementById('d-status');
        st.textContent = data.status;
        if (data.status === 'Cancelled') st.className = 'status-cancelled';
        else if (data.status === 'Complete') st.className = 'status-complete';
        else st.className = 'status-downloading';
      }
      if (data.received) document.getElementById('d-received').textContent = data.received;
      if (data.speed) document.getElementById('d-speed').textContent = data.speed;
      if (data.eta) document.getElementById('d-eta').textContent = data.eta;
      if (data.percent !== undefined) {
        document.getElementById('progress-bar').style.width = data.percent + '%';
        document.getElementById('percent').textContent = data.percent + '%';
      }
      if (data.tunnelSpeeds && data.tunnelSpeeds.length > 0) {
        renderTunnelDashboard(data.tunnelSpeeds);
      }
    });

    window.dlDialog.onSafety(function(data) {
      document.getElementById('safety-spinner').textContent = data.done ? '' : 'scanning...';
      if (data.checks) {
        var html = '';
        data.checks.forEach(function(c) {
          var color = c.pass ? '#22c55e' : '#ef4444';
          var icon = c.pass ? '✓' : '✗';
          html += '<div style="display:flex;gap:6px;align-items:center;padding:1px 0;"><span style="color:'+color+';font-size:10px;">'+icon+'</span><span style="color:#94a3b8;font-size:10px;">'+c.label+'</span></div>';
        });
        document.getElementById('safety-checks').innerHTML = html;
      }
      if (data.overall) {
        var ov = document.getElementById('safety-overall');
        ov.style.display = 'block';
        ov.style.color = data.overall.safe ? '#22c55e' : '#ef4444';
        ov.style.fontSize = '11px';
        ov.style.fontWeight = '700';
        ov.style.marginTop = '4px';
        ov.textContent = data.overall.text;
      }
    });

    function renderTunnelDashboard(speeds) {
      var dash = document.getElementById('tunnel-dashboard');
      var count = speeds.length;

      if (!tunnelDashInit || tunnelCount !== count) {
        tunnelDashInit = true;
        tunnelCount = count;
        dash.style.display = 'block';
        var html = '<div class="td-title">VELOCE BOOSTER ENGINE</div>';
        for (var i = 0; i < count; i++) {
          html += '<div class="td-row" id="td-row-'+i+'">';
          html += '<span class="td-label">B'+(i+1)+'</span>';
          html += '<div class="td-bar">';
          for (var b = 0; b < TUNNEL_BLOCKS; b++) {
            html += '<div class="td-block idle" id="td-'+i+'-'+b+'"></div>';
          }
          html += '</div>';
          html += '<span class="td-speed" id="td-spd-'+i+'">—</span>';
          html += '</div>';
        }
        html += '<div class="td-summary"><span class="online" id="td-online">Online: 0</span><span class="total-speed" id="td-total-speed">0 KB/s</span></div>';
        dash.innerHTML = html;
      }

      var totalSpeed = 0, online = 0;
      for (var i = 0; i < count; i++) {
      var entry = speeds[i] || {};
        var spd = (typeof entry === 'number') ? entry : (entry.speed || 0);
        totalSpeed += spd;
        if (spd > 0) online++;

        // Speed label
        var kbs = (spd / 1024).toFixed(0);
        var spdEl = document.getElementById('td-spd-'+i);
        if (spdEl) {
          spdEl.textContent = kbs + ' KB/s';
          spdEl.className = 'td-speed ' + (spd > 500000 ? 'fast' : spd > 100000 ? 'medium' : spd > 0 ? 'slow' : '');
        }

        // Light up blocks — scale: each block = ~50KB/s, so 1MB/s fills all 20
        var level = spd <= 0 ? 0 : Math.min(Math.ceil(spd / 50000), TUNNEL_BLOCKS);
        for (var b = 0; b < TUNNEL_BLOCKS; b++) {
          var bl = document.getElementById('td-'+i+'-'+b);
          if (!bl) continue;
          if (b < level) {
            // Color gradient: blue -> cyan -> green -> yellow -> orange -> red
            var pct = (b + 1) / TUNNEL_BLOCKS;
            var lit = Math.min(Math.ceil(pct * 8), 8);
            bl.className = 'td-block lit-' + lit;
          } else {
            bl.className = 'td-block idle';
          }
        }
      }

      var onEl = document.getElementById('td-online');
      if (onEl) onEl.textContent = 'Online: ' + online;
      var tsEl = document.getElementById('td-total-speed');
      if (tsEl) {
        if (totalSpeed > 1048576) {
          tsEl.textContent = (totalSpeed / 1048576).toFixed(1) + ' MB/s';
        } else {
          tsEl.textContent = (totalSpeed / 1024).toFixed(0) + ' KB/s';
        }
      }
    }
  