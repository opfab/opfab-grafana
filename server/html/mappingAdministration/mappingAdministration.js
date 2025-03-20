const mappingServiceUrl = 'http://localhost:2002/alerting/mapping';
let config;

async function init() {
    config = await fetchConfig();
    if (config) {
        initTable();
        initForm();
        document.querySelector('#add-button').addEventListener('click', () => {
            document.querySelector('#alertrule-select').setDisabledOptions(Array.from(config.mappings.keys()), true);
            document.querySelector('#form-dialog').showModal();
        });
        document.body.removeAttribute('hidden');
    }
}

async function fetchConfig() {
    try {
        const response = await sendRequest(mappingServiceUrl);
        return {
            alertRules: new Map(response.alertRules),
            entities: new Map(response.entities),
            mappings: new Map(response.mappings)
        };
    } catch (err) {
        console.log('Error fetching config,', err);
    }
}

function initTable() {
    const tbody = document.querySelector('#mappings-tbody');
    config.mappings.forEach((data, uid) => {
        tbody.append(createTableRow(uid, data));
    });
}

function createTableRow (uid, data) {
    const row = createHtmlElement('tr', {id: uid});

    row.insertCell().textContent = config.alertRules.get(uid) ?? uid;
    row.insertCell().textContent = data.recipients.map((entityId) => config.entities.get(entityId) ?? entityId);

    const firingDiv = createHtmlElement('div', {
        text: 'Firing : ' + (data.firingSeverity ?? '/'),
        style: 'margin-top: 10px; margin-bottom: 10px'
    });
    const resolvedDiv = createHtmlElement('div', {
        text: 'Resolved : ' + (data.resolvedSeverity ?? '/'),
        style: 'margin-bottom: 10px'
    });
    row.insertCell().append(firingDiv, resolvedDiv);

    const editButton = config.alertRules.has(uid)
    ? createHtmlElement('button', {
        text: 'EDIT',
        style: 'cursor: pointer',
        class: 'opfab-btn'
    })
    : createHtmlElement('button', {
        text: 'EDIT',
        style: 'cursor: not-allowed',
        disabled: '',
        class: 'opfab-btn'
    });
    editButton.addEventListener('click', tableEditClicked);
    row.insertCell().append(editButton);

    const deleteButton = createHtmlElement('button', {
        text: 'DELETE',
        style: 'cursor: pointer',
        class: 'opfab-btn'
    });
    deleteButton.addEventListener('click', tableDeleteClicked);
    row.insertCell().append(deleteButton);

    return row;
}

function createHtmlElement(tag, {text = '', style = '', ...attrs}) {
    const element = document.createElement(tag);
    if (text) element.textContent = text;
    if (style) element.style.cssText = style;
    Object.entries(attrs).forEach(([attr, value]) => element.setAttribute(attr, value));
    return element;
}

function tableEditClicked(event) {
    const uid = event.target.closest('tr').getAttribute('id');
    const mappingData = config.mappings.get(uid);
    const formDialog = document.querySelector('#form-dialog');

    const alertRuleSelect = formDialog.querySelector('#alertrule-select');
    alertRuleSelect.disable();
    alertRuleSelect.setValue(uid);

    formDialog.querySelector('#entities-select').setValue(mappingData.recipients);
    formDialog.querySelector('#firing-sev-select').setValue(mappingData.firingSeverity);
    formDialog.querySelector('#resolved-sev-select').setValue(mappingData.resolvedSeverity);

    formDialog.showModal();
}

async function tableDeleteClicked(event) {
    const row = event.target.closest('tr');
    const uid = row.getAttribute('id');
    try {
        await sendRequest(mappingServiceUrl + '/' + uid, {method: 'DELETE'});
        config.mappings.delete(uid);
        row.remove();
    } catch (err) {
        console.log('Error deleting mapping,', err);
    }
}

function updateTable(uid, data) {
    const row = document.querySelector(`#${uid}`);

    if (row != null) {
        row.cells[1].textContent = data.recipients.map((entityId) => config.entities.get(entityId) ?? entityId);
        const severityDivs = row.cells[2].querySelectorAll('div');
        severityDivs[0].textContent = 'Firing : ' + (data.firingSeverity ?? '/');
        severityDivs[1].textContent = 'Resolved : ' + (data.resolvedSeverity ?? '/');
    } else {
        document.querySelector('#mappings-tbody').append(createTableRow(uid, data));
    }
}

function initForm() {
    const alertRuleOptions = Array.from(config.alertRules, ([uid, title]) => ({label: title, value: uid}));
    VirtualSelect.init({
        ele: '#alertrule-select',
        options: alertRuleOptions,
        required: true,
        showValueAsTags: true,
        enableSecureText: true
    });

    const entityOptions = Array.from(config.entities, ([id, name]) => ({label: name, value: id}));
    VirtualSelect.init({
        ele: '#entities-select',
        options: entityOptions,
        multiple: true,
        required: true,
        showValueAsTags: true,
        selectAllOnlyVisible: true,
        enableSecureText: true
    });

    const severityOptions = ['ALARM', 'ACTION', 'COMPLIANT', 'INFORMATION'];
    VirtualSelect.init({
        ele: '#firing-sev-select',
        options: severityOptions,
        placeholder: 'Default',
        showValueAsTags: true,
        enableSecureText: true,
        labelRenderer: severityOptionRenderer,
        selectedLabelRenderer: severityOptionRenderer
    });
    VirtualSelect.init({
        ele: '#resolved-sev-select',
        options: severityOptions,
        placeholder: 'Default',
        showValueAsTags: true,
        enableSecureText: true,
        labelRenderer: severityOptionRenderer,
        selectedLabelRenderer: severityOptionRenderer
    });

    document.querySelector('#submit-button').addEventListener('click', formSubmit);
    document.querySelector('#cancel-button').addEventListener('click', (event) => {event.target.closest('dialog').close()});
    document.querySelector('#form-dialog').addEventListener('close', formReset);
}

function severityOptionRenderer(data) {
    const div = `
        <div style="display: flex; align-items: center">
            <div style="min-width: 10px; min-height: 25px; margin-right: 8px; background-color: var(--opfab-color-severity-${data.value.toLowerCase()})"></div>
            ${data.label}
        </div>`;
    return div;
}

async function formSubmit(event) {
    const form = event.target.closest('form');

    if (VirtualSelect.validate(form)) {
        const alertRuleUid = document.querySelector('#alertrule-select').value;
        const formData = new FormData(form);
        const mappingData = {
            recipients: formData.get('entities').split(','),
            ...((sev = formData.get('firing-sev')) && {firingSeverity: sev}),
            ...((sev = formData.get('resolved-sev')) && {resolvedSeverity: sev})
        };

        try {
            await sendRequest(mappingServiceUrl + '/' + alertRuleUid, {
                method: 'POST',
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(mappingData)
            });
            config.mappings.set(alertRuleUid, mappingData);
            updateTable(alertRuleUid, mappingData);
        } catch (err) {
            console.log('Error posting mapping,', err);
        }
        form.closest('dialog').close();
    }
}

function formReset(event) {
    const form = event.target.querySelector('form');
    form.querySelector('#alertrule-select').enable();
    form.querySelector('#alertrule-select').setEnabledOptions(true);
    form.reset();
}

async function sendRequest(url, options) {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`bad response ${response.status}`);
    if (response.status !== 204) return await response.json();
}

window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('opfab_theme') === 'NIGHT') opfabStyle.setOpfabTheme(opfabStyle.NIGHT_THEME);
    else opfabStyle.setOpfabTheme(opfabStyle.DAY_THEME);

    init();
});
