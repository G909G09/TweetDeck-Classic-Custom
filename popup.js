(function () {
  'use strict';
  var checkbox = document.getElementById('toggle-enabled');

  chrome.storage.sync.get({ enabled: true }, function (items) {
    checkbox.checked = !!items.enabled;
  });

  checkbox.addEventListener('change', function () {
    chrome.storage.sync.set({ enabled: checkbox.checked });
  });
})();
