<?php
if (!isConnect()) {
    throw new Exception('{{401 - Accès non autorisé}}');
}
?>
<style>
.sf-mobile { padding: 12px; font-family: Arial, sans-serif; }
.sf-mobile h2 { font-size: 21px; margin: 10px 0 16px; }
.sf-mobile .sf-request { margin: 12px 0; padding: 14px; border-radius: 8px; background: #fff; box-shadow: 0 1px 4px #0002; }
.sf-mobile .sf-request h3 { font-size: 17px; margin: 0 0 8px; }
.sf-mobile .sf-form { display: block; padding: 12px; margin: 8px 0; border-radius: 6px; background: #e9f1f7; color: #16517b; text-decoration: none; }
.sf-mobile .sf-error { color: #9a2525; }
</style>
<section class="sf-mobile">
  <h2>ScenarioForm — Requêtes</h2>
  <div id="sf-mobile-list">Chargement des requêtes…</div>
</section>
<script>
(function () {
  'use strict';
  var target = document.getElementById('sf-mobile-list');
  function textElement(tag, content, className) {
    var el = document.createElement(tag);
    el.textContent = String(content == null ? '' : content);
    if (className) el.className = className;
    return el;
  }
  function desktopUrl(requestId, formId) {
    return 'index.php?v=d&m=scenarioform&p=scenarioform&sf_request=' + encodeURIComponent(requestId) + '&sf_form=' + encodeURIComponent(formId);
  }
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'plugins/scenarioform/core/ajax/scenarioform.ajax.php');
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
  xhr.onload = function () {
    var response;
    try { response = JSON.parse(xhr.responseText); }
    catch (e) { target.textContent = 'Réponse du serveur illisible.'; return; }
    if (xhr.status !== 200 || response.state !== 'ok' || !Array.isArray(response.result)) {
      target.textContent = response.result || 'Impossible de charger les requêtes.';
      target.className = 'sf-error';
      return;
    }
    target.textContent = '';
    if (!response.result.length) { target.textContent = 'Aucune requête disponible.'; return; }
    response.result.forEach(function (request) {
      var section = textElement('div', '', 'sf-request');
      section.appendChild(textElement('h3', request.name || 'Requête'));
      if (request.description) section.appendChild(textElement('p', request.description));
      (request.forms || []).forEach(function (form) {
        var link = textElement('a', form.name || 'Ouvrir le formulaire', 'sf-form');
        link.href = desktopUrl(request.id, form.id);
        section.appendChild(link);
      });
      if (!(request.forms || []).length) section.appendChild(textElement('p', 'Aucun formulaire disponible.'));
      target.appendChild(section);
    });
  };
  xhr.onerror = function () { target.textContent = 'Erreur réseau lors du chargement.'; target.className = 'sf-error'; };
  xhr.send('action=getRequestList');
})();
</script>
