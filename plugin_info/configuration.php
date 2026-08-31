<?php

if (!isConnect('admin')) {
    throw new Exception('{{401 - Accès non autorisé}}');
}
?>

<form class="form-horizontal">
    <fieldset>
        <legend>
            <i class="fas fa-cogs"></i>
            {{Configuration}}
        </legend>

        <div class="form-group">
            <label class="col-sm-4 control-label">
                {{Délai maximal du retour métier}}
            </label>
            <div class="col-sm-3">
                <div class="input-group">
                    <input
                        type="number"
                        min="30"
                        max="86400"
                        step="1"
                        class="configKey form-control"
                        data-l1key="scenario_result_timeout"
                        placeholder="120"
                    >
                    <span class="input-group-addon">{{secondes}}</span>
                </div>
                <span class="help-block">
                    {{Après ce délai, un scénario sans confirmation est affiché comme « Aucun retour reçu ». Valeur par défaut : 120 secondes.}}
                </span>
            </div>
        </div>
    </fieldset>
</form>
