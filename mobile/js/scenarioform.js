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
