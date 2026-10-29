/* ============================================================
   license.js — vérification de licence anti-partage (autonome)
   À charger AVANT app.js. Ne touche à aucune donnée client.

   Laisser ACTIVATE_URL vide ('') = vérification désactivée :
   l'app fonctionne exactement comme avant, sans appel réseau.
   ============================================================ */
const LICENSE_ID = '';
const ACTIVATE_URL = '';

(function () {
  'use strict';
  if (!LICENSE_ID || !ACTIVATE_URL) return;

  var KEY_DEVICE = 'salle_device_id';
  var KEY_OK = 'salle_license_ok';
  var overlay = null;

  function getDeviceId() {
    try {
      var d = localStorage.getItem(KEY_DEVICE);
      if (!d) {
        d = (window.crypto && crypto.randomUUID)
          ? crypto.randomUUID()
          : 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
        localStorage.setItem(KEY_DEVICE, d);
      }
      return d;
    } catch (e) { return null; }
  }

  function wasVerified(deviceId) {
    try { return localStorage.getItem(KEY_OK) === LICENSE_ID + '|' + deviceId; }
    catch (e) { return false; }
  }
  function markVerified(deviceId) {
    try { localStorage.setItem(KEY_OK, LICENSE_ID + '|' + deviceId); } catch (e) {}
  }
  function clearVerified() {
    try { localStorage.removeItem(KEY_OK); } catch (e) {}
  }

  function showOverlay(title, message, retry) {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.setAttribute('id', 'license-overlay');
      overlay.style.cssText =
        'position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;' +
        'align-items:center;justify-content:center;padding:24px;text-align:center;' +
        'background:#0f1115;color:#fff;font-family:system-ui,-apple-system,sans-serif;';
      document.documentElement.appendChild(overlay);
    }
    overlay.innerHTML = '';
    var h = document.createElement('h2');
    h.textContent = title;
    h.style.cssText = 'margin:0 0 12px;font-size:22px;';
    var p = document.createElement('p');
    p.textContent = message;
    p.style.cssText = 'margin:0;max-width:320px;line-height:1.5;opacity:.8;';
    overlay.appendChild(h);
    overlay.appendChild(p);
    if (retry) {
      var b = document.createElement('button');
      b.textContent = 'Réessayer';
      b.style.cssText =
        'margin-top:20px;padding:12px 24px;border:0;border-radius:10px;' +
        'background:#fff;color:#0f1115;font-size:16px;font-weight:600;';
      b.addEventListener('click', check);
      overlay.appendChild(b);
    }
  }

  function hideOverlay() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
  }

  function check() {
    var deviceId = getDeviceId();
    showOverlay('Vérification…', 'Un instant.');

    if (!deviceId) {
      showOverlay('Stockage indisponible',
        "Le navigateur bloque le stockage local. Désactivez la navigation privée et réessayez.", true);
      return;
    }

    fetch(ACTIVATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ license_id: LICENSE_ID, device_id: deviceId })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var status = data && data.status;
        if (status === 'activated' || status === 'ok') {
          markVerified(deviceId);
          hideOverlay();
        } else if (status === 'denied') {
          clearVerified();
          showOverlay('Application non autorisée',
            "Cette licence est déjà utilisée sur un autre appareil.");
        } else if (status === 'revoked') {
          clearVerified();
          showOverlay('Licence désactivée', "Contactez votre fournisseur.");
        } else if (status === 'invalid') {
          clearVerified();
          showOverlay('Licence invalide', "Cette copie de l'application n'est pas reconnue.");
        } else {
          throw new Error('unexpected response');
        }
      })
      .catch(function () {
        // Réseau coupé ou réponse illisible : on laisse passer un appareil
        // déjà validé auparavant, on bloque seulement une 1re activation.
        if (wasVerified(deviceId)) hideOverlay();
        else showOverlay('Connexion requise',
          "Une connexion internet est nécessaire pour activer l'application la première fois.", true);
      });
  }

  check();
})();
